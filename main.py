#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""TeamChat Plugin Backend v4.0.8

新增:
  1. POST /upload — 文件上传（txt/md/json/py/js/html/css/xml/csv/log/yaml/yml，最大5MB）
  2. POST /chat — 返回前先存session，前端断开不丢
  3. DELETE /session/{id} — 删除会话
  4. PUT /session/{id}/tag — 标签
  5. PUT /session/{id}/pin — 置顶/取消
  6. GET /sessions?search= — 搜索
  7. POST /avatar — 头像上传（20x20 像素，jpg/png，用于圆桌动画）
"""

import asyncio
import imghdr
import json
import logging
import os
import time
import uuid
from io import BytesIO
from typing import Any, Dict, List, Optional

import httpx
from fastapi import APIRouter, HTTPException, UploadFile, File, Form
from fastapi.responses import JSONResponse
from pydantic import BaseModel, Field

logger = logging.getLogger("qwenpaw.team_chat")

# ============================================================
# 路径配置
# ============================================================
WORKSPACE_DIR = os.path.join(
    os.path.expanduser("~"), ".qwenpaw", "plugins",
    "team_chat", "sessions"
)
MEDIA_DIR = os.path.join(
    os.path.expanduser("~"), ".qwenpaw", "plugins",
    "team_chat", "media"
)
AVATAR_DIR = os.path.join(
    os.path.expanduser("~"), ".qwenpaw", "plugins",
    "team_chat", "avatars"
)
for d in [WORKSPACE_DIR, MEDIA_DIR, AVATAR_DIR]:
    os.makedirs(d, exist_ok=True)

# ============================================================
# 常量
# ============================================================
DEFAULT_HOST_ID = "cloud-orchestrator"
DEFAULT_HOST_NAME = "CloudPaw-Master"

TIMEOUT_AGENTS_LIST = 10.0
TIMEOUT_AGENT_CALL = 300.0

HISTORY_WINDOW = 6
CONTENT_PREVIEW_LEN = 120
MAX_HISTORY_SIZE = 500

AGENTS_CACHE_TTL = 60.0
UPLOAD_MAX_SIZE = 5 * 1024 * 1024  # 5MB
ALLOWED_EXTENSIONS = {"txt", "md", "json", "py", "js", "html", "css", "xml", "csv", "log", "yaml", "yml"}

CURRENT_VERSION = "4.0.8"

# 默认智能体（API 不可用时回落）
DEFAULT_AGENTS = [
    {"agent_id": "cloud-orchestrator", "name": "CloudPaw-Master", "role": "云掌管家-主持人", "is_host": True, "model": "qwen-max", "workspace_dir": ""},
    {"agent_id": "code-architect", "name": "CodeArchitect", "role": "代码架构师", "is_host": False, "model": "qwen-coder", "workspace_dir": ""},
    {"agent_id": "data-scientist", "name": "DataScientist", "role": "数据分析师", "is_host": False, "model": "qwen-plus", "workspace_dir": ""},
    {"agent_id": "creative-writer", "name": "CreativeWriter", "role": "创意写作专家", "is_host": False, "model": "qwen-max", "workspace_dir": ""},
    {"agent_id": "tech-advisor", "name": "TechAdvisor", "role": "技术顾问", "is_host": False, "model": "qwen-plus", "workspace_dir": ""},
]


# ============================================================
# 状态管理类
# ============================================================
class AgentCache:
    """智能体列表缓存管理器"""
    
    def __init__(self):
        self._cache: Optional[List[Dict[str, Any]]] = None
        self._cache_time: float = 0.0
        self._lock = asyncio.Lock()
    
    async def get(self) -> List[Dict[str, Any]]:
        """获取缓存的智能体列表，自动刷新过期缓存"""
        async with self._lock:
            now = time.time()
            if self._cache and (now - self._cache_time) < AGENTS_CACHE_TTL:
                logger.info(f"使用缓存的智能体列表: {len(self._cache)} 个")
                return self._cache
        # 缓存过期，需要刷新
        logger.info("缓存过期，重新获取智能体列表")
        result = await self._fetch_and_cache()
        return result
    
    async def invalidate(self) -> None:
        """使缓存失效，下次获取时重新加载"""
        async with self._lock:
            self._cache = None
            self._cache_time = 0.0
    
    async def _fetch_and_cache(self) -> List[Dict[str, Any]]:
        """从 API 获取智能体列表并缓存"""
        try:
            api_base = await _api_config.get_api_base()
            logger.info(f"尝试从 qwenpaw 系统获取智能体列表: {api_base}/api/agents")
            
            async with httpx.AsyncClient(timeout=TIMEOUT_AGENTS_LIST, trust_env=False) as c:
                r = await c.get(_api_url("/agents"))
                r.raise_for_status()
                response_data = r.json()
                logger.info(f"API 响应数据: {response_data}")
                
                raw = response_data.get("agents", [])
                if not raw:
                    logger.warning("API 返回的智能体列表为空")
                    return []
                
                result = []
                for a in raw:
                    if not isinstance(a, dict):
                        continue
                    aid = a.get("id", "")
                    desc = a.get("description", "")
                    role = desc.split("|")[0].split("\n")[0].strip()[:60] if desc else "智能体"
                    result.append({
                        "agent_id": aid,
                        "name": a.get("name", aid),
                        "role": role,
                        "is_host": aid == DEFAULT_HOST_ID,
                        "model": a.get("model", ""),
                        "workspace_dir": a.get("workspace_dir", ""),
                    })
                
                async with self._lock:
                    self._cache = result
                    self._cache_time = time.time()
                logger.info(f"成功从 qwenpaw 系统获取智能体列表: {len(result)} 个（缓存TTL={AGENTS_CACHE_TTL}s）")
                return result
        except (httpx.TimeoutException, httpx.NetworkError, httpx.RemoteProtocolError) as e:
            logger.warning(f"获取智能体列表网络异常: {e}")
        except json.JSONDecodeError as e:
            logger.error(f"解析 API 响应失败: {e}")
        except Exception as e:
            logger.error(f"获取智能体列表失败: {e}", exc_info=True)
        return []


class ApiConfig:
    """API 基础配置管理器"""
    
    def __init__(self):
        self._api_base: Optional[str] = None
        self._lock = asyncio.Lock()
    
    async def get_api_base(self) -> str:
        """获取 API 基础地址，自动从配置文件加载"""
        async with self._lock:
            if self._api_base:
                return self._api_base
        # 尝试从配置文件读取
        config_path = os.path.join(os.path.expanduser("~"), ".qwenpaw", "config.json")
        try:
            if os.path.exists(config_path):
                with open(config_path, "r", encoding="utf-8") as f:
                    config = json.load(f)
                last_api = config.get("last_api", {})
                host = last_api.get("host", "127.0.0.1")
                port = last_api.get("port", 8088)
                api_base = f"http://{host}:{port}"
                async with self._lock:
                    self._api_base = api_base
                return api_base
        except json.JSONDecodeError as e:
            logger.error(f"配置JSON解析失败: {e}")
        except KeyError as e:
            logger.error(f"配置缺少字段: {e}")
        except OSError as e:
            logger.error(f"读取配置文件失败: {e}")
        # 使用默认值
        async with self._lock:
            self._api_base = "http://127.0.0.1:8088"
        return self._api_base


# 全局实例
_agent_cache = AgentCache()
_api_config = ApiConfig()


def _api_url(path: str = "") -> str:
    """构建完整的 API URL，避免重复 /api"""
    base = (_api_config._api_base or "http://127.0.0.1:8088").rstrip("/")
    base = base[:-4] if base.endswith("/api") else base
    return f"{base}/api{path}"


# ============================================================
# 数据模型
# ============================================================
class ChatRequest(BaseModel):
    message: str = Field(..., max_length=16000)
    agent_ids: List[str] = []
    host_id: str = DEFAULT_HOST_ID
    session_id: str = ""


class TagRequest(BaseModel):
    tag: str


class PinRequest(BaseModel):
    pinned: bool = True


class MessageItem(BaseModel):
    sender: str
    sender_name: str
    content: str
    role: str
    robot_prompt: str = ""
    timestamp: float


class HostStep(BaseModel):
    step: int
    action: str
    detail: str
    timestamp: float


class ChatResponse(BaseModel):
    session_id: str
    host_id: str
    host_name: str
    history: List[MessageItem]
    host_steps: List[HostStep]


class AgentListResponse(BaseModel):
    agents: List[Dict[str, Any]]
    host_id: str
    host_name: str
    source: str
    api_base: str


class AgentInfoResponse(BaseModel):
    agent_id: str
    name: str
    description: str
    model: str
    workspace_dir: str
    enabled: bool
    avatar_url: str = ""


class SessionListResponse(BaseModel):
    sessions: List[Dict[str, Any]]


class UploadResponse(BaseModel):
    ok: bool
    filename: str
    path: str
    size: int
    preview: str = ""


class AvatarResponse(BaseModel):
    ok: bool
    agent_id: str
    avatar_url: str
    width: int
    height: int


# ============================================================
# 图像工具（无需 Pillow，手动解析 jpg/png 尺寸）
# ============================================================
def _get_jpeg_size(data: bytes) -> tuple:
    """从 JPEG 字节中解析宽高。"""
    i = 2
    while i < len(data):
        if data[i] != 0xFF:
            return (0, 0)
        marker = data[i + 1]
        if marker in (0xC0, 0xC1, 0xC2):
            return (int.from_bytes(data[i + 7:i + 9], "big"),
                    int.from_bytes(data[i + 5:i + 7], "big"))
        i += 2 + int.from_bytes(data[i + 2:i + 4], "big")
    return (0, 0)


def _get_png_size(data: bytes) -> tuple:
    """从 PNG 字节中解析宽高。"""
    if data[:8] != b"\x89PNG\r\n\x1a\n":
        return (0, 0)
    return (int.from_bytes(data[16:20], "big"),
            int.from_bytes(data[20:24], "big"))


# ============================================================
# 智能体 API 调用
# ============================================================
async def _call_agent_async(agent_id: str, prompt: str, timeout: float = TIMEOUT_AGENT_CALL) -> str:
    payload = {
        "session_id": f"teamchat:{uuid.uuid4().hex}",
        "input": [{"role": "user", "content": [{"type": "text", "text": prompt}]}],
    }
    headers = {"Content-Type": "application/json", "X-Agent-Id": agent_id}
    try:
        async with httpx.AsyncClient(timeout=timeout, trust_env=False) as c:
            async with c.stream("POST", _api_url("/agent/process"), json=payload, headers=headers) as r:
                r.raise_for_status()
                last_data = None
                async for line in r.aiter_lines():
                    line = line.strip()
                    if line.startswith("data: "):
                        try:
                            last_data = json.loads(line[6:])
                        except json.JSONDecodeError:
                            continue
                if last_data is None:
                    return f"[无回复] {agent_id}"
                output = last_data.get("output", [])
                if not output:
                    return f"[空输出] {agent_id}"
                parts = []
                for block in output[-1].get("content", []):
                    if isinstance(block, dict) and block.get("type") == "text":
                        parts.append(block.get("text", ""))
                text = "\n".join(parts).strip()
                return text or f"[空回复] {agent_id}"
    except httpx.TimeoutException:
        return f"[超时] {agent_id}"
    except Exception as e:
        logger.error(f"调用 {agent_id} 失败: {e}")
        return f"[错误] {agent_id}: {str(e)[:100]}"


# ============================================================
# 翻译
# ============================================================
def _translate_for_host(msg: str, host_name: str, agent_names: List[str], history: List[MessageItem]) -> str:
    hist_block = ""
    if history:
        recent = history[-HISTORY_WINDOW:]
        lines = []
        for m in recent:
            if m.role == "human":
                lines.append(f"  用户: {m.content[:CONTENT_PREVIEW_LEN]}")
            elif m.role == "agent":
                lines.append(f"  {m.sender_name}: {m.content[:CONTENT_PREVIEW_LEN]}")
            elif m.role == "host":
                lines.append(f"  你之前: {m.content[:CONTENT_PREVIEW_LEN]}")
        if lines:
            hist_block = "会谈历史:\n" + "\n".join(lines) + "\n\n"
    participants = ", ".join(agent_names) if agent_names else "无其他参与人"
    return (
        f"[团队会谈 - 你是主持人]\n\n"
        f"你是: {host_name}（本次会谈的主持人）\n"
        f"参与会谈的智能体: {participants}\n\n"
        f"{hist_block}"
        f"用户发言:\n「{msg}」\n\n"
        f"作为主持人，请:\n"
        f"1. 先用自己的专业知识回答用户问题\n"
        f"2. 如果需要，可协调其他智能体参与回答\n"
        f"3. 最后给出综合性的回复\n"
        f"使用中文，简洁专业。"
    )


def _translate_for_agent(msg: str, host_name: str, agent_name: str, history: List[MessageItem]) -> str:
    hist_block = ""
    if history:
        recent = history[-HISTORY_WINDOW:]
        lines = []
        for m in recent:
            if m.role == "human":
                lines.append(f"  用户: {m.content[:CONTENT_PREVIEW_LEN]}")
            elif m.role == "agent" and m.sender_name == agent_name:
                lines.append(f"  你之前: {m.content[:CONTENT_PREVIEW_LEN]}")
        if lines:
            hist_block = "会谈历史:\n" + "\n".join(lines) + "\n\n"
    return (
        f"[团队会谈 - {host_name} 主持]\n\n"
        f"你是: {agent_name}\n"
        f"主持人: {host_name}\n\n"
        f"{hist_block}"
        f"用户发言:\n「{msg}」\n\n"
        f"请基于你的专业知识回答。使用中文，简洁专业。"
    )


# ============================================================
# 会话持久化
# ============================================================
def _session_path(sid: str) -> str:
    return os.path.join(WORKSPACE_DIR, f"{sid}.json")


_session_lock = asyncio.Lock()


async def _load_session(sid: str) -> Optional[dict]:
    async with _session_lock:
        p = _session_path(sid)
        if os.path.exists(p):
            try:
                with open(p, "r", encoding="utf-8") as f:
                    return json.load(f)
            except (json.JSONDecodeError, OSError) as e:
                logger.error(f"读取会话 {sid} 失败: {e}")
        return None


async def _save_session(sid: str, data: dict) -> None:
    async with _session_lock:
        if len(data.get("history", [])) > MAX_HISTORY_SIZE:
            data["history"] = data["history"][-MAX_HISTORY_SIZE:]
        with open(_session_path(sid), "w", encoding="utf-8") as f:
            json.dump(data, f, ensure_ascii=False, indent=2)


# ============================================================
# Router
# ============================================================
def build_router() -> APIRouter:
    router = APIRouter()

    @router.get("/agents", response_model=AgentListResponse)
    async def list_agents():
        try:
            agents = await _agent_cache.get()
            logger.info(f"返回智能体列表: {len(agents)} 个")
            return AgentListResponse(
                agents=agents,
                host_id=DEFAULT_HOST_ID,
                host_name=DEFAULT_HOST_NAME,
                source="qwenpaw_api" if agents else "empty",
                api_base=await _api_config.get_api_base(),
            )
        except Exception as e:
            logger.error(f"获取智能体列表异常: {e}", exc_info=True)
            return AgentListResponse(
                agents=[],
                host_id=DEFAULT_HOST_ID,
                host_name=DEFAULT_HOST_NAME,
                source="error",
                api_base=await _api_config.get_api_base(),
            )

    @router.get("/agent-info/{agent_id}", response_model=AgentInfoResponse)
    async def agent_info(agent_id: str):
        agents = await _agent_cache.get()
        for a in agents:
            if a["agent_id"] == agent_id:
                avatar_url = f"/api/team-chat/avatar/{agent_id}"
                avatar_path = os.path.join(AVATAR_DIR, f"{agent_id}.jpg")
                if not os.path.exists(avatar_path):
                    avatar_path = os.path.join(AVATAR_DIR, f"{agent_id}.png")
                    if not os.path.exists(avatar_path):
                        avatar_url = ""
                return AgentInfoResponse(
                    agent_id=agent_id,
                    name=a["name"],
                    description=a.get("role", ""),
                    model=a.get("model", "未知"),
                    workspace_dir=a.get("workspace_dir", "未知"),
                    enabled=True,
                    avatar_url=avatar_url,
                )
        raise HTTPException(status_code=404, detail=f"智能体 {agent_id} 不存在")

    @router.post("/avatar", response_model=AvatarResponse)
    async def upload_avatar(agent_id: str = Form(...), file: UploadFile = File(...)):
        if not file.filename:
            raise HTTPException(status_code=400, detail="未选择文件")
        ext = (file.filename or "").rsplit(".", 1)[-1].lower()
        if ext not in ("jpg", "jpeg", "png"):
            raise HTTPException(status_code=400, detail="仅支持 jpg/png 格式")
        data = await file.read()
        if len(data) > 2 * 1024 * 1024:
            raise HTTPException(status_code=400, detail="文件最大 2MB")
        img_type = imghdr.what(None, h=data)
        if img_type not in ("jpeg", "png"):
            raise HTTPException(status_code=400, detail="无效的图像文件")
        if img_type == "jpeg":
            w, h = _get_jpeg_size(data)
        else:
            w, h = _get_png_size(data)
        if w == 0 or h == 0:
            raise HTTPException(status_code=400, detail="无法解析图像尺寸")
        if w != 20 or h != 20:
            raise HTTPException(
                status_code=400,
                detail=f"头像必须恰好 20x20 像素，当前为 {w}x{h}，请调整为 20x20 后上传"
            )
        save_ext = "jpg" if img_type == "jpeg" else "png"
        save_path = os.path.join(AVATAR_DIR, f"{agent_id}.{save_ext}")
        with open(save_path, "wb") as f:
            f.write(data)
        return AvatarResponse(
            ok=True, agent_id=agent_id,
            avatar_url=f"/api/team-chat/avatar/{agent_id}",
            width=w, height=h,
        )

    @router.get("/avatar/{agent_id}")
    async def get_avatar(agent_id: str):
        for ext in ("jpg", "png", "jpeg"):
            p = os.path.join(AVATAR_DIR, f"{agent_id}.{ext}")
            if os.path.exists(p):
                from fastapi.responses import FileResponse
                return FileResponse(p, media_type=f"image/{'jpeg' if ext=='jpg' else ext}")
        raise HTTPException(status_code=404, detail="头像不存在")

    @router.post("/upload", response_model=UploadResponse)
    async def upload_file(file: UploadFile = File(...)):
        if not file.filename:
            raise HTTPException(status_code=400, detail="未选择文件")
        ext = (file.filename or "").rsplit(".", 1)[-1].lower()
        if ext not in ALLOWED_EXTENSIONS:
            raise HTTPException(
                status_code=400,
                detail=f"不支持 .{ext} 格式。支持: {', '.join(sorted(ALLOWED_EXTENSIONS))}"
            )
        data = await file.read()
        if len(data) > UPLOAD_MAX_SIZE:
            raise HTTPException(status_code=400, detail=f"文件最大 {UPLOAD_MAX_SIZE//1024//1024}MB")
        fid = uuid.uuid4().hex[:12]
        safe_name = f"{fid}_{file.filename}"
        save_path = os.path.join(MEDIA_DIR, safe_name)
        with open(save_path, "wb") as f:
            f.write(data)
        try:
            preview = data.decode("utf-8")[:500]
        except UnicodeDecodeError:
            preview = "[二进制文件]"
        return UploadResponse(
            ok=True, filename=file.filename, path=save_path,
            size=len(data), preview=preview,
        )

    @router.post("/chat", response_model=ChatResponse)
    async def chat(req: ChatRequest):
        host_id = req.host_id or DEFAULT_HOST_ID
        agent_ids = req.agent_ids or []

        agent_list = await _agent_cache.get()
        name_map = {a["agent_id"]: a["name"] for a in agent_list}
        host_name = name_map.get(host_id, host_id)
        agent_names = [name_map.get(aid, aid) for aid in agent_ids]

        sid = req.session_id or uuid.uuid4().hex
        data = await _load_session(sid)
        if data:
            hist_raw = data.get("history", [])
        else:
            hist_raw = []
            data = {
                "session_id": sid, "created_at": time.time(),
                "host_id": host_id, "host_name": host_name,
                "agent_ids": agent_ids, "agent_names": agent_names,
                "history": [], "host_steps": [], "tag": "", "pinned": False,
            }

        history = [MessageItem(**m) for m in hist_raw]
        steps: List[HostStep] = []
        step_num = 0

        t0 = time.time()
        history.append(MessageItem(
            sender="human", sender_name="人类用户", role="human",
            content=req.message, timestamp=t0,
        ))
        data["history"] = [m.dict() for m in history]
        await _save_session(sid, data)

        step_num += 1
        t1 = time.time()
        host_prompt = _translate_for_host(req.message, host_name, agent_names, history)
        steps.append(HostStep(step=step_num, action=f"向主持人 {host_name} 发送提示词",
                               detail=f"{len(host_prompt)} 字符", timestamp=t1))
        host_reply = await _call_agent_async(host_id, host_prompt)

        t2 = time.time()
        history.append(MessageItem(
            sender=host_id, sender_name=host_name, role="host",
            content=host_reply, robot_prompt=host_prompt, timestamp=t2,
        ))
        step_num += 1
        steps.append(HostStep(step=step_num, action=f"主持人 {host_name} 回复",
                               detail=f"{len(host_reply)} 字符", timestamp=t2))
        data["history"] = [m.dict() for m in history]
        data["host_steps"] = [s.dict() for s in steps]
        await _save_session(sid, data)

        targets = [aid for aid in agent_ids if aid != host_id]
        for target_id in targets:
            aname = name_map.get(target_id, target_id)
            step_num += 1
            t3 = time.time()
            agent_prompt = _translate_for_agent(req.message, host_name, aname, history)
            steps.append(HostStep(step=step_num, action=f"向 {aname} 转发",
                                   detail=f"{len(agent_prompt)} 字符", timestamp=t3))

            agent_reply = await _call_agent_async(target_id, agent_prompt)
            t4 = time.time()
            history.append(MessageItem(
                sender=target_id, sender_name=aname, role="agent",
                content=agent_reply, robot_prompt=agent_prompt, timestamp=t4,
            ))
            step_num += 1
            steps.append(HostStep(step=step_num, action=f"{aname} 回复",
                                   detail=f"{len(agent_reply)} 字符", timestamp=t4))
            data["history"] = [m.dict() for m in history]
            data["host_steps"] = [s.dict() for s in steps]
            await _save_session(sid, data)

        data["updated_at"] = time.time()
        data["history"] = [m.dict() for m in history]
        data["host_steps"] = [s.dict() for s in steps]
        await _save_session(sid, data)

        return ChatResponse(session_id=sid, host_id=host_id, host_name=host_name,
                            history=history, host_steps=steps)

    @router.get("/sessions", response_model=SessionListResponse)
    async def list_sessions(search: str = ""):
        sessions = []
        if os.path.exists(WORKSPACE_DIR):
            for fn in sorted(os.listdir(WORKSPACE_DIR), reverse=True):
                if fn.endswith(".json"):
                    sid = fn[:-5]
                    p = os.path.join(WORKSPACE_DIR, fn)
                    try:
                        with open(p, "r", encoding="utf-8") as f:
                            d = json.load(f)
                    except (json.JSONDecodeError, OSError):
                        continue
                    if search:
                        q = search.lower()
                        match = False
                        for h in d.get("history", []):
                            if q in (h.get("content", "") + h.get("sender_name", "")).lower():
                                match = True
                                break
                        if q in (d.get("tag", "") + d.get("host_name", "")).lower():
                            match = True
                        if not match:
                            continue
                    sessions.append({
                        "session_id": sid,
                        "created_at": d.get("created_at", 0),
                        "updated_at": d.get("updated_at", 0),
                        "message_count": len(d.get("history", [])),
                        "host_id": d.get("host_id", ""),
                        "host_name": d.get("host_name", ""),
                        "participants": d.get("agent_ids", []),
                        "tag": d.get("tag", ""),
                        "pinned": d.get("pinned", False),
                    })
        sessions.sort(key=lambda s: (not s.get("pinned", False), -s.get("updated_at", 0)))
        return SessionListResponse(sessions=sessions)

    @router.get("/session/{session_id}", response_model=ChatResponse)
    async def get_session(session_id: str):
        data = await _load_session(session_id)
        if not data:
            raise HTTPException(status_code=404, detail="会话不存在")
        history = [MessageItem(**m) for m in data.get("history", [])]
        steps = [HostStep(**s) for s in data.get("host_steps", [])]
        return ChatResponse(session_id=session_id,
                            host_id=data.get("host_id", ""),
                            host_name=data.get("host_name", ""),
                            history=history, host_steps=steps)

    @router.delete("/session/{session_id}")
    async def delete_session(session_id: str):
        async with _session_lock:
            p = _session_path(session_id)
            if not os.path.exists(p):
                raise HTTPException(status_code=404, detail="会话不存在")
            os.remove(p)
        return JSONResponse(content={"ok": True})

    @router.put("/session/{session_id}/tag")
    async def tag_session(session_id: str, req: TagRequest):
        data = await _load_session(session_id)
        if not data:
            raise HTTPException(status_code=404, detail="会话不存在")
        data["tag"] = req.tag
        await _save_session(session_id, data)
        return JSONResponse(content={"ok": True, "tag": req.tag})

    @router.put("/session/{session_id}/pin")
    async def pin_session(session_id: str, req: PinRequest):
        data = await _load_session(session_id)
        if not data:
            raise HTTPException(status_code=404, detail="会话不存在")
        data["pinned"] = req.pinned
        await _save_session(session_id, data)
        return JSONResponse(content={"ok": True, "pinned": req.pinned})

    @router.get("/cron-summary")
    async def cron_summary():
        """获取 QwenPaw 定时任务摘要"""
        try:
            async with httpx.AsyncClient(timeout=10.0, trust_env=False) as c:
                r = await c.get(_api_url("/cron"))
                r.raise_for_status()
                jobs = r.json().get("jobs", [])
                summary = []
                for j in jobs:
                    summary.append({
                        "id": j.get("id", ""),
                        "name": j.get("name", j.get("id", "")),
                        "agent_id": j.get("agent_id", ""),
                        "schedule": j.get("schedule", ""),
                        "enabled": j.get("enabled", False),
                        "last_run": j.get("last_run"),
                        "next_run": j.get("next_run"),
                    })
                return JSONResponse(content={"ok": True, "jobs": summary})
        except Exception as e:
            return JSONResponse(content={"ok": True, "jobs": [], "error": str(e)})

    # -- 人类头像上传（30x30）--
    @router.post("/avatar/human")
    async def upload_human_avatar(file: UploadFile = File(...)):
        if not file.filename:
            raise HTTPException(status_code=400, detail="未选择文件")
        ext = (file.filename or "").rsplit(".", 1)[-1].lower()
        if ext not in ("jpg", "jpeg", "png"):
            raise HTTPException(status_code=400, detail="仅支持 jpg/png 格式")
        data = await file.read()
        if len(data) > 2 * 1024 * 1024:
            raise HTTPException(status_code=400, detail="文件最大 2MB")
        img_type = imghdr.what(None, h=data)
        if img_type not in ("jpeg", "png"):
            raise HTTPException(status_code=400, detail="无效的图像文件")
        # 前端自动裁剪到 30x30，这里宽松校验
        save_ext = "jpg" if img_type == "jpeg" else "png"
        save_path = os.path.join(AVATAR_DIR, f"human.{save_ext}")
        with open(save_path, "wb") as f:
            f.write(data)
        return JSONResponse(content={"ok": True, "avatar_url": "/api/team-chat/avatar/human"})

    @router.get("/avatar/human")
    async def get_human_avatar():
        for ext in ("jpg", "png", "jpeg"):
            p = os.path.join(AVATAR_DIR, f"human.{ext}")
            if os.path.exists(p):
                from fastapi.responses import FileResponse
                return FileResponse(p, media_type=f"image/{'jpeg' if ext=='jpg' else ext}")
        raise HTTPException(status_code=404, detail="人类头像不存在")

    # ============================================================
    # 系统信息 (真实IP + 时间)
    # ============================================================
    import socket
    import datetime

    @router.get("/system-info")
    async def system_info():
        """返回服务器 LAN IP 和当前时间"""
        ip = "127.0.0.1"
        try:
            s = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
            s.settimeout(0.1)
            s.connect(("10.254.254.254", 1))
            ip = s.getsockname()[0]
            s.close()
        except Exception:
            try:
                ip = socket.gethostbyname(socket.gethostname())
            except Exception:
                pass
        now = datetime.datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        return JSONResponse(content={"ip": ip, "time": now, "timezone": str(datetime.datetime.now().astimezone().tzinfo or "local")})

    # ============================================================
    # 五子棋游戏 (Gomoku)
    # ============================================================
    import asyncio
    import re

    _gomoku = {}  # game_id -> state
    _gomoku_passive = {"enabled": False, "auto_rematch": True}  # 被动观战模式
    _gomoku_players = []  # 待抽签的 agent_id 列表

    def _check_gomoku_win(board, row, col, player):
        """Check 5-in-a-row in any direction"""
        size = len(board)
        directions = [(0, 1), (1, 0), (1, 1), (1, -1)]
        for dr, dc in directions:
            cnt = 1
            for i in range(1, 5):
                r, c = row + dr * i, col + dc * i
                if 0 <= r < size and 0 <= c < size and board[r][c] == player:
                    cnt += 1
                else:
                    break
            for i in range(1, 5):
                r, c = row - dr * i, col - dc * i
                if 0 <= r < size and 0 <= c < size and board[r][c] == player:
                    cnt += 1
                else:
                    break
            if cnt >= 5:
                return True
        return False

    async def _gomoku_agent_move(game_id, agent_id, board, player_str, player_num):
        """Ask an agent for their next move"""
        lines = []
        lines.append("   " + "".join(str(i % 10) for i in range(15)))
        for r in range(15):
            row = [f"{r:2d} "]
            for c in range(15):
                if board[r][c] == 0:
                    row.append("·")
                elif board[r][c] == 1:
                    row.append("●")
                else:
                    row.append("○")
            lines.append("".join(row))
        board_str = "\n".join(lines)

        prompt = (
            f"你正在下一局五子棋，你是{player_str}。\n\n"
            f"当前棋盘 (15x15, ·=空, ●=黑, ○=白):\n{board_str}\n\n"
            f"轮到你了。请回复你的落子位置，只回复 row,col 格式（如 7,7 表示第7行第7列），不要其他内容。"
        )
        try:
            response = await _call_agent_async(agent_id, prompt)
            text = response if isinstance(response, str) else str(response)
            # Parse coordinates
            m = re.search(r'(\d+)\s*[,，\s]\s*(\d+)', text)
            if m:
                row = int(m.group(1))
                col = int(m.group(2))
                if 0 <= row < 15 and 0 <= col < 15 and board[row][col] == 0:
                    return row, col
            logger.warning(f"[Gomoku] Agent {agent_id} returned unparseable: {text[:100]}")
            # Fallback: try to extract single number pair from anywhere
            nums = re.findall(r'\b(\d+)\b', text)
            if len(nums) >= 2:
                row, col = int(nums[0]), int(nums[1])
                if 0 <= row < 15 and 0 <= col < 15 and board[row][col] == 0:
                    return row, col
        except Exception as e:
            logger.error(f"[Gomoku] Agent {agent_id} call failed: {e}")
        return None

    async def _gomoku_game_loop(game_id):
        """Main game loop - runs as a background task"""
        game = _gomoku.get(game_id)
        if not game:
            return
        try:
            while True:
                await asyncio.sleep(1.5)  # Pace between moves
                game = _gomoku.get(game_id)
                if not game or game["status"] != "playing":
                    break

                current = game["current"]
                agent_id = game["black_agent"] if current == 1 else game["white_agent"]
                player_str = "黑方(●)" if current == 1 else "白方(○)"
                player_num = current

                result = await _gomoku_agent_move(
                    game_id, agent_id, game["board"], player_str, player_num
                )

                game = _gomoku.get(game_id)
                if not game or game["status"] != "playing":
                    break

                if result is None:
                    # Agent failed - randomly place on first empty spot
                    for r in range(15):
                        for c in range(15):
                            if game["board"][r][c] == 0:
                                result = (r, c)
                                break
                        if result:
                            break
                if result:
                    row, col = result
                    game["board"][row][col] = player_num
                    game["moves"].append({"row": row, "col": col, "player": player_num, "agent": agent_id})
                    game["last_move"] = {"row": row, "col": col, "player": player_num}

                    if _check_gomoku_win(game["board"], row, col, player_num):
                        game["status"] = "black_wins" if player_num == 1 else "white_wins"
                        game["winner"] = game["black_name"] if player_num == 1 else game["white_name"]
                        # 被动模式：3秒后自动复盘，交换黑白
                        if _gomoku_passive.get("enabled") and _gomoku_passive.get("auto_rematch"):
                            asyncio.create_task(_gomoku_auto_rematch(game_id))
                        break

                    # Check draw (board full)
                    if all(game["board"][r][c] != 0 for r in range(15) for c in range(15)):
                        game["status"] = "draw"
                        break

                    # Switch turns
                    game["current"] = 2 if current == 1 else 1
        except Exception as e:
            logger.error(f"[Gomoku] Game loop error: {e}")
            game = _gomoku.get(game_id)
            if game:
                game["status"] = "stopped"

    async def _gomoku_auto_rematch(old_game_id: str):
        """被动模式：对局结束 4 秒后自动交换黑白重新开始"""
        await asyncio.sleep(4)
        old_game = _gomoku.get(old_game_id)
        if not old_game or not _gomoku_passive.get("enabled"):
            return
        new_id = str(uuid.uuid4())[:8]
        _gomoku[new_id] = {
            "board": [[0] * 15 for _ in range(15)],
            "current": 1,
            "black_agent": old_game["white_agent"],
            "white_agent": old_game["black_agent"],
            "black_name": old_game["white_name"],
            "white_name": old_game["black_name"],
            "status": "playing",
            "moves": [],
            "last_move": None,
            "winner": None,
            "prev_game": old_game_id,
        }
        logger.info(f"[Gomoku] 自动复盘 {new_id}: {_gomoku[new_id]['black_name']}(●) vs {_gomoku[new_id]['white_name']}(○)")
        asyncio.create_task(_gomoku_game_loop(new_id))

    def _detect_gomoku_intent(text: str) -> Optional[str]:
        """检测文本中是否包含五子棋对弈邀请。返回挑战者 agent_id 或 None"""
        triggers = ["下一局", "来下棋", "下一盘", "五子棋", "来一局", "对弈", "下棋吗", "和我下", "谁和我"]
        text_lower = text.lower()
        for t in triggers:
            if t in text_lower:
                return True
        return False

    async def _gomoku_scheduler():
        """定时擂台赛：每15分钟随机两智能体对弈"""
        import random as _random
        while True:
            await asyncio.sleep(15 * 60)
            if not _gomoku_passive.get("enabled"):
                continue
            active = any(g.get("status") == "playing" for g in _gomoku.values())
            if active:
                continue
            try:
                agents = await _agent_cache.get()
            except Exception:
                continue
            non_host = [a for a in agents if not a.get("is_host") and a.get("agent_id") != DEFAULT_HOST_ID]
            if len(non_host) < 2:
                continue
            p1, p2 = _random.sample(non_host, 2)
            new_id = str(uuid.uuid4())[:8]
            _gomoku[new_id] = {
                "board": [[0] * 15 for _ in range(15)],
                "current": 1,
                "black_agent": p1["agent_id"],
                "white_agent": p2["agent_id"],
                "black_name": p1.get("name", p1["agent_id"]),
                "white_name": p2.get("name", p2["agent_id"]),
                "status": "playing",
                "moves": [],
                "last_move": None,
                "winner": None,
            }
            logger.info(f"[Gomoku] 擂台赛 {new_id}: {p1['name']}(●) vs {p2['name']}(○)")
            asyncio.create_task(_gomoku_game_loop(new_id))

    class GomokuStartReq(BaseModel):
        black_agent: str = Field(..., description="黑方智能体 ID")
        white_agent: str = Field(..., description="白方智能体 ID")

    @router.post("/gomoku/start")
    async def gomoku_start(req: GomokuStartReq):
        # Get agent names
        agents = await _agent_cache.get()
        agent_map = {a["agent_id"]: a for a in agents}
        black_name = agent_map.get(req.black_agent, {}).get("name", req.black_agent)
        white_name = agent_map.get(req.white_agent, {}).get("name", req.white_agent)

        game_id = str(uuid.uuid4())[:8]
        _gomoku[game_id] = {
            "board": [[0] * 15 for _ in range(15)],
            "current": 1,
            "black_agent": req.black_agent,
            "white_agent": req.white_agent,
            "black_name": black_name,
            "white_name": white_name,
            "status": "playing",
            "moves": [],
            "last_move": None,
            "winner": None,
        }
        # Start game loop in background
        asyncio.create_task(_gomoku_game_loop(game_id))
        logger.info(f"[Gomoku] Game {game_id} started: {black_name}(●) vs {white_name}(○)")
        return JSONResponse(content={"ok": True, "game_id": game_id})

    @router.get("/gomoku/state")
    async def gomoku_state(game_id: str = ""):
        """Get current game state. If game_id empty, return the latest active game."""
        if not game_id:
            # Return the latest active game
            for gid in sorted(_gomoku.keys(), key=lambda x: len(_gomoku[x]["moves"]), reverse=True):
                g = _gomoku[gid]
                if g["status"] in ("playing", "black_wins", "white_wins", "draw"):
                    game_id = gid
                    break
        game = _gomoku.get(game_id)
        if not game:
            return JSONResponse(content={"exists": False})
        return JSONResponse(content={
            "exists": True,
            "game_id": game_id,
            "board": game["board"],
            "current": game["current"],
            "black_name": game["black_name"],
            "white_name": game["white_name"],
            "status": game["status"],
            "moves": game["moves"],
            "last_move": game["last_move"],
            "winner": game.get("winner"),
        })

    @router.post("/gomoku/stop")
    async def gomoku_stop(game_id: str = ""):
        if not game_id:
            for gid in _gomoku:
                if _gomoku[gid]["status"] == "playing":
                    game_id = gid
                    break
        game = _gomoku.get(game_id)
        if game:
            game["status"] = "stopped"
            return JSONResponse(content={"ok": True})
        return JSONResponse(content={"ok": False, "detail": "No active game"})

    @router.post("/gomoku/passive")
    async def gomoku_passive(enabled: bool = True):
        _gomoku_passive["enabled"] = enabled
        logger.info(f"[Gomoku] 被动观战模式: {'ON' if enabled else 'OFF'}")
        return JSONResponse(content={"ok": True, "enabled": enabled})

    @router.get("/gomoku/passive")
    async def gomoku_passive_get():
        return JSONResponse(content={"enabled": _gomoku_passive.get("enabled", False)})

    # 启动擂台赛后台线程
    import threading
    def _start_scheduler():
        loop = asyncio.new_event_loop()
        asyncio.set_event_loop(loop)
        loop.run_until_complete(_gomoku_scheduler())
    threading.Thread(target=_start_scheduler, daemon=True).start()

    return router


# ============================================================
# 插件入口
# ============================================================
class TeamChatPlugin:
    def register(self, api):
        logger.info(f"TeamChat v{CURRENT_VERSION} 注册中...")
        api.register_http_router(build_router(), prefix="/team-chat", tags=["team-chat"])
        api.register_startup_hook("team_chat_v4_start", self._startup, priority=90)
        api.register_shutdown_hook("team_chat_v4_stop", self._shutdown, priority=110)
        logger.info(f"TeamChat v{CURRENT_VERSION} 就绪")

    def _startup(self):
        logger.info(f"TeamChat v{CURRENT_VERSION} 已启动")

    def _shutdown(self):
        logger.info(f"TeamChat v{CURRENT_VERSION} 已关闭")


plugin = TeamChatPlugin()