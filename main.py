#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""TeamChat Plugin Backend v4.0.9

新增:
  1. POST /upload — 文件上传（txt/md/json/py/js/html/css/xml/csv/log/yaml/yml，最大5MB）
  2. POST /chat — 返回前先存session，前端断开不丢
  3. DELETE /session/{id} — 删除会话
  4. PUT /session/{id}/tag — 标签
  5. PUT /session/{id}/pin — 置顶/取消
  6. GET /sessions?search= — 搜索
  7. POST /avatar — 头像上传（20x20 像素，jpg/png，用于圆桌动画）
  8. 前端智能体图标缩放功能（16-40px滑块调节）
  9. 右下角支持链接区域
  10. 修复 Python 3.12+ imghdr 兼容性问题
  11. 删除五子棋功能（精简）
"""

import asyncio

import json
import logging
import os
import time
import uuid
from io import BytesIO
from typing import Any, Dict, List, Optional

import httpx
import base64
from fastapi import APIRouter, HTTPException, UploadFile, File, Form
from fastapi.responses import JSONResponse, PlainTextResponse, FileResponse
from pydantic import BaseModel, Field

logger = logging.getLogger("qwenpaw.team_chat")

# ============================================================
# 配置常量
# ============================================================

CURRENT_VERSION = "4.0.9"
DEFAULT_HOST_ID = "cloud-orchestrator"
MAX_HISTORY = 200
SESSION_KEEPALIVE_DAYS = 7
SESSION_MAX = 1000

# 支持的文件扩展名
ALLOWED_EXTENSIONS = {
    ".txt", ".md", ".json", ".py", ".js", ".jsx", ".ts", ".tsx",
    ".html", ".css", ".scss", ".xml", ".csv", ".log", ".yaml", ".yml",
    ".toml", ".ini", ".cfg", ".conf", ".sh", ".bat", ".ps1",
    ".c", ".cpp", ".h", ".hpp", ".java", ".kt", ".rs", ".go",
    ".rb", ".php", ".swift", ".r", ".sql", ".graphql",
    ".env", ".gitignore", ".dockerignore",
}

# 当前文件所在目录
CURRENT_DIR = os.path.dirname(os.path.abspath(__file__))
MEDIA_DIR = os.path.join(CURRENT_DIR, "frontend", "public")
# 确保目录存在
os.makedirs(MEDIA_DIR, exist_ok=True)

# 头像存储目录（仿 Agent Office，服务端持久化，跨浏览器保留）
AVATAR_DIR = os.path.join(CURRENT_DIR, "avatars")
os.makedirs(AVATAR_DIR, exist_ok=True)
_avatar_path_cache: Dict[str, str] = {}  # agent_id → file path


# ============================================================
# 数据存储（内存 + JSON 文件）
# ============================================================

class SessionStore:
    """会话存储：内存 + JSON 文件持久化"""

    def __init__(self, data_dir: str):
        self.data_dir = data_dir
        self._sessions: Dict[str, dict] = {}
        self._load_all()

    def _file(self, sid: str) -> str:
        return os.path.join(self.data_dir, f"{sid}.json")

    def _load_all(self):
        if not os.path.isdir(self.data_dir):
            os.makedirs(self.data_dir, exist_ok=True)
            return
        for fname in os.listdir(self.data_dir):
            if fname.endswith(".json"):
                sid = fname[:-5]
                try:
                    with open(os.path.join(self.data_dir, fname), "r", encoding="utf-8") as f:
                        self._sessions[sid] = json.load(f)
                except Exception:
                    pass

    def get(self, sid: str) -> Optional[dict]:
        return self._sessions.get(sid)

    def save(self, sid: str, data: dict):
        self._sessions[sid] = data
        with open(self._file(sid), "w", encoding="utf-8") as f:
            json.dump(data, f, ensure_ascii=False, indent=2)

    def delete(self, sid: str):
        self._sessions.pop(sid, None)
        try:
            os.remove(self._file(sid))
        except OSError:
            pass

    def list_all(self) -> List[dict]:
        return list(self._sessions.values())

    def cleanup_old(self, max_age_days: int):
        cutoff = time.time() - max_age_days * 86400
        removed = 0
        for sid, data in list(self._sessions.items()):
            ts = data.get("created_at", 0)
            if ts < cutoff:
                self.delete(sid)
                removed += 1
        return removed


# 初始化存储（数据目录在插件根目录下的 data/）
DATA_DIR = os.path.join(CURRENT_DIR, "data")
store = SessionStore(DATA_DIR)


# ============================================================
# 智能体缓存
# ============================================================

class AgentCache:
    """后台异步刷新智能体列表"""

    def __init__(self):
        self._agents: List[dict] = []
        self._last_refresh = 0
        self._lock = asyncio.Lock()

    async def get(self) -> List[dict]:
        """获取智能体列表（带缓存）"""
        now = time.time()
        if now - self._last_refresh > 30:  # 30s 缓存过期
            await self._refresh()
        return self._agents

    async def _refresh(self):
        async with self._lock:
            now = time.time()
            if now - self._last_refresh <= 30:
                return
            try:
                # Use QwenPaw's official last_api resolver (no hardcoded port)
                try:
                    from qwenpaw.config.utils import read_last_api
                    last = read_last_api()
                    if last:
                        host, port = last
                        base = f"http://{host}:{port}"
                    else:
                        base = os.environ.get("QWENPAW_BASE_URL", "http://127.0.0.1:8088")
                except ImportError:
                    base = os.environ.get("QWENPAW_BASE_URL", "http://127.0.0.1:8088")
                headers = {"Content-Type": "application/json"}
                if api_key := os.environ.get("QWENPAW_API_KEY"):
                    headers["Authorization"] = f"Bearer {api_key}"
                async with httpx.AsyncClient(timeout=httpx.Timeout(10.0), trust_env=False) as client:
                    resp = await client.get(f"{base}/api/agents", headers=headers)
                    if resp.status_code == 200:
                        data = resp.json()
                        raw = data.get("agents", [])
                        result = []
                        for a in raw:
                            if not isinstance(a, dict):
                                continue
                            aid = a.get("id", "")
                            result.append({
                                "agent_id": aid,
                                "name": a.get("name", aid),
                                "description": a.get("description", ""),
                                "model": a.get("model", ""),
                                "workspace_dir": a.get("workspace_dir", ""),
                                "enabled": a.get("enabled", True),
                                "is_host": aid == DEFAULT_HOST_ID,
                                "teamchat_enabled": True,
                            })
                        self._agents = result
                        self._last_refresh = now
            except Exception as e:
                logger.warning(f"AgentCache refresh failed: {e}")


_agent_cache = AgentCache()


# ============================================================
# 调用智能体（异步）
# ============================================================

async def _get_api_base() -> str:
    """Get QwenPaw API base URL."""
    try:
        from qwenpaw.config.utils import read_last_api
        last = read_last_api()
        if last:
            host, port = last
            return f"http://{host}:{port}"
    except ImportError:
        pass
    return os.environ.get("QWENPAW_BASE_URL", "http://127.0.0.1:8088")


async def _call_agent_async(agent_id: str, prompt: str, timeout: float = 120.0) -> str:
    """Call an agent via QwenPaw SSE stream API (v4.0.9 compatible)."""
    payload = {
        "session_id": f"teamchat:{uuid.uuid4().hex}",
        "input": [{"role": "user", "content": [{"type": "text", "text": prompt}]}],
    }
    headers = {"Content-Type": "application/json", "X-Agent-Id": agent_id}
    try:
        base = await _get_api_base()
        async with httpx.AsyncClient(timeout=timeout, trust_env=False) as c:
            async with c.stream("POST", f"{base}/api/agent/process", json=payload, headers=headers) as r:
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


def _build_host_prompt(message: str, history: list) -> str:
    """Build a summary prompt for the host agent"""
    parts = []
    for h in history:
        if h.get("role") == "human":
            parts.append(f"[用户] {h.get('content', '')}")
        elif h.get("role") == "agent":
            parts.append(f"[{h.get('sender_name', h.get('sender', '?'))}] {h.get('content', '')}")
    context = "\n".join(parts)
    return (
        f"你是团队主持人。以下是多智能体讨论的内容：\n\n"
        f"{context}\n\n"
        f"请做一个简洁的总结（200字以内），指出各智能体的观点异同，并给出你的建议。"
    )


# imghdr 替代（Python 3.13+ 已移除 imghdr）
def _guess_image_type(data: bytes) -> Optional[str]:
    """简易 imghdr.what 替代，仅检测 jpeg/png。"""
    if len(data) < 12:
        return None
    # JPEG: 0xff 0xd8
    if data[0:2] == b"\xff\xd8":
        return "jpeg"
    # PNG: 89 50 4e 47 0d 0a 1a 0a
    if data[:8] == b"\x89PNG\r\n\x1a\n":
        return "png"
    return None


# ============================================================
# 头像存储（仿 Agent Office：data URL -> 文件）
# ============================================================

import re as _re

_DATA_URL_RE = _re.compile(r'^data:(?P<mime>[\w/+.-]+);base64,(?P<body>.+)$', _re.S)
_MIME_TO_EXT = {"image/png": "png", "image/jpeg": "jpg", "image/webp": "webp", "image/gif": "gif"}
_EXT_TO_MIME = {v: k for k, v in _MIME_TO_EXT.items()}
_MAX_AVATAR_BYTES = 2 * 1024 * 1024

# Agent ID / Avatar ID 白名单（仿 Agent Office，防路径遍历）
_ID_RE = _re.compile(r'^[A-Za-z0-9._\-]+$')


def _is_valid_avatar_id(agent_id: str) -> bool:
    """Allow safe identifiers only; block path traversal."""
    if not agent_id or len(agent_id) > 128:
        return False
    if ".." in agent_id or "/" in agent_id or "\\" in agent_id:
        return False
    return bool(_ID_RE.match(agent_id))


def _avatar_data_url(avatar_id: str) -> Optional[str]:
    """Read avatar file, return data: URL"""
    if not _is_valid_avatar_id(avatar_id):
        return None
    for ext in _MIME_TO_EXT.values():
        path = os.path.join(AVATAR_DIR, f"{avatar_id}.{ext}")
        if os.path.isfile(path):
            with open(path, "rb") as f:
                raw = f.read()
            b64 = base64.b64encode(raw).decode("ascii")
            mime = _EXT_TO_MIME.get(ext, "image/png")
            return f"data:{mime};base64,{b64}"
    return None


def _save_avatar_from_url(avatar_id: str, data_url: str) -> bool:
    """Decode data: URL and save, delete old avatar"""
    if not _is_valid_avatar_id(avatar_id):
        return False
    match = _DATA_URL_RE.match(data_url.strip())
    if not match:
        return False
    mime = match.group("mime").lower()
    ext = _MIME_TO_EXT.get(mime)
    if not ext:
        return False
    try:
        raw = base64.b64decode(match.group("body"), validate=True)
    except Exception:
        return False
    if len(raw) > _MAX_AVATAR_BYTES:
        return False
    # Delete old avatars for this id
    for old_ext in _MIME_TO_EXT.values():
        old_path = os.path.join(AVATAR_DIR, f"{avatar_id}.{old_ext}")
        if os.path.isfile(old_path):
            os.remove(old_path)
    # Save new
    path = os.path.join(AVATAR_DIR, f"{avatar_id}.{ext}")
    with open(path, "wb") as f:
        f.write(raw)
    _avatar_path_cache[avatar_id] = path  # populate cache
    return True


def _delete_avatar(avatar_id: str) -> bool:
    """Delete all avatar files for this id"""
    if not _is_valid_avatar_id(avatar_id):
        return False
    _avatar_path_cache.pop(avatar_id, None)  # invalidate cache
    deleted = False
    for ext in _MIME_TO_EXT.values():
        path = os.path.join(AVATAR_DIR, f"{avatar_id}.{ext}")
        if os.path.isfile(path):
            os.remove(path)
            deleted = True
    return deleted


def _list_all_avatars() -> Dict[str, str]:
    """Return {avatar_id: data_url} for all stored avatars"""
    result = {}
    if not os.path.isdir(AVATAR_DIR):
        return result
    for fname in os.listdir(AVATAR_DIR):
        name, ext = os.path.splitext(fname)
        ext = ext.lstrip(".")
        if ext not in _MIME_TO_EXT.values():
            continue
        url = _avatar_data_url(name)
        if url:
            result[name] = url
    return result


# ============================================================
# Pydantic 请求模型（模块级别，避免 UnboundLocalError）
# ============================================================

class ChatRequest(BaseModel):
    """Chat request payload (JSON body from frontend)."""
    message: str = ""
    host_id: str = DEFAULT_HOST_ID
    agent_ids: list[str] = Field(default_factory=list)
    session_id: str = ""
    host_name: str = "CloudPaw-Master"
    brainstorm: bool = False


class AvatarUpload(BaseModel):
    """Avatar upload payload (a base64 data: URL)."""
    data_url: str


class CronJobReq(BaseModel):
    job_id: str = Field(..., description="任务ID")
    schedule: str = Field("*/30 * * * *", description="Cron 表达式")
    agent_ids: List[str] = Field(..., description="参与智能体ID列表")
    prompt: str = Field(..., description="提示词")
    host_id: str = Field(DEFAULT_HOST_ID, description="主持人智能体ID")


class SummarizeRequest(BaseModel):
    """Summarize request — host_id for final summary generation."""
    host_id: str = DEFAULT_HOST_ID


class WorkspaceFileRequest(BaseModel):
    """Collect a file from QwenPaw workspace into TeamChat's accessible storage."""
    path: str = Field(..., description="Absolute path to file in QwenPaw workspace")
    label: str = Field("", description="Optional display label")


class CollectContentRequest(BaseModel):
    """Collect file content directly (e.g. from session messages)."""
    filename: str = Field(..., description="Original filename")
    content: str = Field(..., description="File content as UTF-8 text")
    session_id: str = Field("", description="Optional session ID for tracing")


# Shared file collection directory
COLLECT_DIR = os.path.join(CURRENT_DIR, "data", "collected")
os.makedirs(COLLECT_DIR, exist_ok=True)


# ============================================================
# 构建 API 路由
# ============================================================

def build_router():
    router = APIRouter()

    # ---- 智能体列表 ----

    @router.get("/agents")
    async def list_agents():
        """Return cached agent list with metadata"""
        agents = await _agent_cache.get()
        return JSONResponse(content={
            "agents": agents,
            "host_id": DEFAULT_HOST_ID,
            "host_name": "CloudPaw-Master",
            "source": "qwenpaw_api" if agents else "empty",
        })

    # ---- 会话管理 ----

    @router.post("/chat")
    async def chat(req: ChatRequest):
        agent_list = req.agent_ids
        if not agent_list:
            raise HTTPException(status_code=400, detail="至少需要一个参与智能体")

        now = time.time()
        new_sid = req.session_id or str(uuid.uuid4())

        history = []
        host_steps = []
        existing = None
        if req.session_id:
            existing = store.get(req.session_id)
            if existing:
                history = existing.get("history", [])
                host_steps = existing.get("host_steps", [])

        # 用户消息
        if req.message.strip():
            history.append({
                "role": "human",
                "sender": "human",
                "sender_name": "人类用户",
                "content": req.message,
                "timestamp": now,
            })

        # 调用所有参与智能体
        for aid in agent_list:
            try:
                agents = await _agent_cache.get()
                agent_info = next((a for a in agents if a.get("agent_id") == aid), None)
                agent_name = agent_info.get("name", aid) if agent_info else aid

                resp_text = await _call_agent_async(aid, req.message)
                history.append({
                    "role": "agent",
                    "sender": aid,
                    "sender_name": agent_name,
                    "content": resp_text,
                    "timestamp": time.time(),
                })
            except Exception as e:
                history.append({
                    "role": "agent",
                    "sender": aid,
                    "sender_name": aid,
                    "content": f"[调用失败] {e}",
                    "timestamp": time.time(),
                })

        # 主持人总结
        host_prompt = _build_host_prompt(req.message, history)
        try:
            host_resp = await _call_agent_async(req.host_id, host_prompt)
            host_steps.append({
                "id": req.host_id,
                "content": host_prompt,
                "response": host_resp,
                "time": time.time(),
                "action": "主持人 "+req.host_name+" 汇总回复",
                "detail": host_resp[:120] if host_resp else "",
            })
            history.append({
                "role": "host",
                "sender": req.host_id,
                "sender_name": req.host_name,
                "content": host_resp,
                "timestamp": time.time(),
            })
        except Exception as e:
            history.append({
                "role": "host",
                "sender": req.host_id,
                "sender_name": req.host_id,
                "content": f"[主持人调用失败] {e}",
                "timestamp": time.time(),
            })

        # 截断历史
        if len(history) > MAX_HISTORY:
            history = history[-MAX_HISTORY:]

        # 保存
        data = {
            "session_id": new_sid,
            "host_id": req.host_id,
            "host_name": req.host_name,
            "agent_ids": agent_list,
            "history": history,
            "host_steps": host_steps,
            "brainstorm": req.brainstorm,
            "discussion_done": False,
            "created_at": existing.get("created_at", now) if existing else now,
            "updated_at": now,
            "tag": req.session_id and (store.get(req.session_id) or {}).get("tag", ""),
            "pinned": req.session_id and (store.get(req.session_id) or {}).get("pinned", False),
        }
        store.save(new_sid, data)

        return JSONResponse(content={
            "session_id": new_sid,
            "history": history,
            "host_steps": host_steps,
        })

    @router.get("/session/{session_id}")
    async def get_session(session_id: str):
        data = store.get(session_id)
        if not data:
            raise HTTPException(status_code=404, detail="会话不存在")
        return JSONResponse(content=data)

    @router.delete("/session/{session_id}")
    async def delete_session(session_id: str):
        store.delete(session_id)
        return JSONResponse(content={"ok": True})

    class TagUpdate(BaseModel):
        tag: str = ""

    class PinUpdate(BaseModel):
        pinned: bool = True

    @router.put("/session/{session_id}/tag")
    async def tag_session(session_id: str, body: TagUpdate):
        data = store.get(session_id)
        if not data:
            raise HTTPException(status_code=404, detail="会话不存在")
        data["tag"] = body.tag
        data["updated_at"] = time.time()
        store.save(session_id, data)
        return JSONResponse(content={"ok": True, "tag": body.tag})

    @router.put("/session/{session_id}/pin")
    async def pin_session(session_id: str, body: PinUpdate):
        data = store.get(session_id)
        if not data:
            raise HTTPException(status_code=404, detail="会话不存在")
        data["pinned"] = body.pinned
        data["updated_at"] = time.time()
        store.save(session_id, data)
        return JSONResponse(content={"ok": True, "pinned": body.pinned})

    # ---- 刷卡器：拉取最终汇总 ----

    @router.post("/session/{session_id}/summarize")
    async def summarize_session(session_id: str, body: SummarizeRequest):
        data = store.get(session_id)
        if not data:
            raise HTTPException(status_code=404, detail="会话不存在")
        history = data.get("history", [])
        agent_ids_in_session = data.get("agent_ids", [])

        prompt = "你是讨论主持人。请对以下多智能体团队讨论进行最终汇总，包含：\n"
        prompt += "1. 各智能体核心观点摘要（每个智能体一句话）\n"
        prompt += "2. 团队共识（一致认同的观点）\n"
        prompt += "3. 分歧点（不同立场的对比）\n"
        prompt += "4. 下一步建议\n\n=== 讨论记录 ===\n\n"
        for h in history:
            sender = h.get("sender_name", h.get("sender", "?"))
            prompt += f"[{sender}]: {h.get('content', '')}\n\n"

        try:
            host_resp = await _call_agent_async(body.host_id, prompt)
            data["discussion_done"] = True
            data["updated_at"] = time.time()
            store.save(session_id, data)
            return JSONResponse(content={
                "session_id": session_id,
                "summary": host_resp,
            })
        except Exception as e:
            raise HTTPException(status_code=502, detail=f"汇总生成失败: {e}")

    @router.get("/sessions")
    async def list_sessions(search: str = ""):
        all_sessions = store.list_all()
        if search:
            search_lower = search.lower()
            all_sessions = [
                s for s in all_sessions
                if search_lower in json.dumps(s, ensure_ascii=False).lower()
            ]
        # 按置顶 + 更新时间排序（用 bool 强制规范化，防 mixed type TypeError）
        all_sessions.sort(key=lambda s: (bool(s.get("pinned")), s.get("updated_at", 0)), reverse=True)
        # 返回摘要：剥离 history/host_steps，只保留前端列表需要的字段
        summaries = []
        for s in all_sessions[:50]:
            h = s.get("history", [])
            summaries.append({
                "session_id": s.get("session_id", ""),
                "host_id": s.get("host_id", ""),
                "host_name": s.get("host_name", ""),
                "agent_ids": s.get("agent_ids", []),
                "created_at": s.get("created_at", 0),
                "updated_at": s.get("updated_at", 0),
                "tag": s.get("tag", ""),
                "pinned": bool(s.get("pinned")),
                "discussion_done": s.get("discussion_done", False),
                "brainstorm": s.get("brainstorm", False),
                "message_count": len(h),
                "last_message": (h[-1].get("content", "")[:80] if h else ""),
            })
        return JSONResponse(content={
            "sessions": summaries,
            "total": len(all_sessions),
        })

    # ---- 文件上传 ----

    @router.post("/upload")
    async def upload_file(file: UploadFile = File(...)):
        filename = file.filename or "untitled"
        ext = os.path.splitext(filename)[1].lower()
        if ext not in ALLOWED_EXTENSIONS:
            raise HTTPException(status_code=400, detail=f"不支持的文件类型: {ext}")

        content = await file.read()
        if len(content) > 5 * 1024 * 1024:
            raise HTTPException(status_code=400, detail="文件大小超过5MB限制")

        # 尝试 UTF-8 解码
        try:
            text = content.decode("utf-8")
        except UnicodeDecodeError:
            text = content.decode("utf-8", errors="replace")

        return JSONResponse(content={
            "filename": filename,
            "size": len(content),
            "text": text[:10000],  # 前端限制展示
            "truncated": len(text) > 10000,
        })

    # ---- 工作区文件收集 & 下载 ----

    @router.get("/workspace-files")
    async def scan_workspace(path: str = ""):
        """递归扫描 QwenPaw 工作区目录中的智能体产出文件（含子目录，全文件类型）。"""
        workspaces_root = os.path.join(os.path.expanduser("~"), ".qwenpaw", "workspaces")
        if not os.path.isdir(workspaces_root):
            return JSONResponse(content={"files": [], "root": workspaces_root})

        scan_root = os.path.join(workspaces_root, path.strip("/\\")) if path else workspaces_root
        scan_root = os.path.realpath(scan_root)

        # 安全检查：必须在 .qwenpaw/workspaces 下
        if not scan_root.startswith(os.path.realpath(workspaces_root)):
            raise HTTPException(status_code=400, detail="路径必须在工作区目录内")

        try:
            dirs = []
            for entry in os.scandir(scan_root):
                entry_path = os.path.join(scan_root, entry.name)
                if entry.is_file():
                    try:
                        st = entry.stat()
                    except OSError:
                        st = None
                    # 跳过超大文件 (>50MB)
                    if st and st.st_size > 50 * 1024 * 1024:
                        continue
                    dirs.append({
                        "name": entry.name,
                        "filename": entry.name,
                        "path": entry_path,
                        "size": st.st_size if st else 0,
                        "modified": st.st_mtime if st else 0,
                    })
                elif entry.is_dir() and not entry.name.startswith("."):
                    # 递归扫描子目录内文件数量
                    sub_count = 0
                    try:
                        for _root, _dirs, _files in os.walk(entry_path):
                            _dirs[:] = [d for d in _dirs if not d.startswith(".")]
                            sub_count += len(_files)
                    except OSError:
                        pass
                    dirs.append({
                        "name": entry.name + "/",
                        "filename": entry.name,
                        "path": entry_path,
                        "isdir": True,
                        "size": 0,
                        "modified": 0,
                        "sub_count": sub_count,
                    })
            dirs.sort(key=lambda f: (f.get("isdir", False), -(f.get("modified", 0))))
        except OSError:
            dirs = []
        return JSONResponse(content={"files": dirs, "root": workspaces_root})

    @router.post("/collect-file")
    async def collect_file(req: WorkspaceFileRequest):
        """从 QwenPaw 工作区收集文件到 TeamChat 可访问目录。"""
        src = req.path
        if not os.path.isfile(src):
            raise HTTPException(status_code=404, detail=f"文件不存在: {src}")

        # 安全检查：拒绝非安全路径
        real_src = os.path.realpath(src)
        if ".." in src or not os.path.exists(real_src):
            raise HTTPException(status_code=400, detail="无效的文件路径")

        fname = os.path.basename(src)
        # 避免覆盖：加时间戳
        name, ext = os.path.splitext(fname)
        ts = int(time.time())
        safe_name = f"{name}_{ts}{ext}"
        dst = os.path.join(COLLECT_DIR, safe_name)

        try:
            with open(src, "rb") as f_src:
                content = f_src.read()
            if len(content) > 10 * 1024 * 1024:
                raise HTTPException(status_code=400, detail="文件超过10MB限制")
        except OSError as e:
            raise HTTPException(status_code=400, detail=f"读取失败: {e}")

        with open(dst, "wb") as f_dst:
            f_dst.write(content)

        return JSONResponse(content={
            "ok": True,
            "message": f"已收集: {fname}",
            "filename": safe_name,
            "original": fname,
            "size": len(content),
            "download_url": f"/download/{safe_name}",
        })

    @router.post("/collect-content")
    async def collect_content(req: CollectContentRequest):
        """从会话消息中收集文件内容（[file:xxx] 引用）并存入文件架。"""
        if not req.filename or not req.content:
            raise HTTPException(status_code=400, detail="filename 和 content 不能为空")
        fname = req.filename.strip()
        content = req.content.encode("utf-8", errors="replace")
        if len(content) > 10 * 1024 * 1024:
            raise HTTPException(status_code=400, detail="文件超过10MB限制")
        name, ext = os.path.splitext(fname)
        ts = int(time.time())
        safe_name = f"{name}_{ts}{ext}"
        dst = os.path.join(COLLECT_DIR, safe_name)
        with open(dst, "wb") as f:
            f.write(content)
        return JSONResponse(content={
            "ok": True,
            "message": f"已收集: {fname}",
            "filename": safe_name,
            "original": fname,
            "size": len(content),
            "download_url": f"/download/{safe_name}",
        })

    @router.get("/download/{filename}")
    async def download_file(filename: str):
        """下载收集的文件。"""
        # 安全检查
        if ".." in filename or "/" in filename or "\\" in filename:
            raise HTTPException(status_code=400, detail="无效文件名")
        fpath = os.path.join(COLLECT_DIR, filename)
        if not os.path.isfile(fpath):
            raise HTTPException(status_code=404, detail="文件不存在")
        return FileResponse(fpath, filename=filename.split("_", 1)[-1] if "_" in filename else filename)

    @router.get("/collected-files")
    async def list_collected():
        """列出所有已收集的文件。"""
        files = []
        for fname in os.listdir(COLLECT_DIR):
            fpath = os.path.join(COLLECT_DIR, fname)
            if os.path.isfile(fpath):
                original = fname
                if "_" in fname:
                    # 还原原始文件名（去掉时间戳）
                    parts = fname.rsplit("_", 1)
                    name_part = parts[0] + (os.path.splitext(fname)[1] if "." in fname else "")
                    original = name_part
                files.append({
                    "filename": fname,
                    "original": original,
                    "size": os.path.getsize(fpath),
                    "download_url": f"/download/{fname}",
                    "modified": os.path.getmtime(fpath),
                })
        files.sort(key=lambda f: f.get("modified", 0), reverse=True)
        return JSONResponse(content={"files": files})

    # ---- 头像系统（仿 Agent Office：服务端持久化，跨浏览器保留）----

    @router.get("/avatars")
    async def list_avatars():
        """Return all stored avatars {id: data_url}"""
        return JSONResponse(content={"avatars": _list_all_avatars()})

    @router.put("/avatars/{avatar_id}")
    async def save_avatar(avatar_id: str, payload: AvatarUpload):
        """Save avatar from data: URL"""
        if not _is_valid_avatar_id(avatar_id):
            raise HTTPException(status_code=400, detail="invalid agent id")
        if not payload.data_url:
            raise HTTPException(status_code=400, detail="missing data_url")
        if not _save_avatar_from_url(avatar_id, payload.data_url):
            raise HTTPException(status_code=400, detail="invalid data URL or unsupported format")
        logger.info(f"Avatar saved: {avatar_id}")
        return JSONResponse(content={"ok": True, "id": avatar_id, "url": _avatar_data_url(avatar_id)})

    @router.delete("/avatars/{avatar_id}")
    async def delete_avatar(avatar_id: str):
        """Delete avatar, restore default"""
        if not _is_valid_avatar_id(avatar_id):
            raise HTTPException(status_code=400, detail="invalid agent id")
        if _delete_avatar(avatar_id):
            logger.info(f"Avatar deleted: {avatar_id}")
            return JSONResponse(content={"ok": True})
        return JSONResponse(content={"ok": False, "detail": "avatar not found"})

    # Serve individual avatar as image (for agent tags & canvas)
    @router.get("/avatar/{agent_id}")
    async def get_avatar(agent_id: str):
        if not _is_valid_avatar_id(agent_id):
            raise HTTPException(status_code=400, detail="invalid agent id")
        if agent_id in _avatar_path_cache:
            path = _avatar_path_cache[agent_id]
            if os.path.isfile(path):
                return FileResponse(path)
            del _avatar_path_cache[agent_id]
        for ext in _MIME_TO_EXT.values():
            path = os.path.join(AVATAR_DIR, f"{agent_id}.{ext}")
            if os.path.isfile(path):
                _avatar_path_cache[agent_id] = path
                return FileResponse(path)
        raise HTTPException(status_code=404, detail="avatar not found")

    # Compat: old file upload endpoint
    @router.post("/avatar")
    async def upload_avatar(file: UploadFile = File(...), agent_id: str = Form("")):
        content = await file.read()
        if len(content) > _MAX_AVATAR_BYTES:
            raise HTTPException(status_code=400, detail=f"max {_MAX_AVATAR_BYTES//1024}KB")
        img_type = _guess_image_type(content)
        if img_type not in ("jpeg", "png"):
            raise HTTPException(status_code=400, detail="only jpg/png supported")
        ext = "jpg" if img_type == "jpeg" else "png"
        b64 = base64.b64encode(content).decode("ascii")
        mime = f"image/{'jpeg' if img_type == 'jpeg' else 'png'}"
        data_url = f"data:{mime};base64,{b64}"
        aid = agent_id.strip()
        if not aid:
            raise HTTPException(status_code=400, detail="缺少 agent_id，请先点击智能体头像再上传")
        if not _is_valid_avatar_id(aid):
            raise HTTPException(status_code=400, detail="invalid agent id")
        _save_avatar_from_url(aid, data_url)
        return JSONResponse(content={"ok": True, "id": aid, "url": _avatar_data_url(aid)})

    # ---- 定时任务管理 (cron) ----

    @router.get("/cron")
    async def list_cron_jobs():
        try:
            base = await _get_api_base()
            async with httpx.AsyncClient(timeout=httpx.Timeout(10.0), trust_env=False) as client:
                resp = await client.get(f"{base}/api/cron")
                if resp.status_code == 200:
                    data = resp.json()
                    jobs = data.get("jobs", data if isinstance(data, list) else [])
                    tc_jobs = [j for j in jobs if j.get("agent_id") == "cloud-orchestrator" or "teamchat" in str(j.get("description", ""))]
                    return JSONResponse(content={"jobs": tc_jobs})
        except Exception as e:
            logger.warning(f"cron list failed: {e}")
        return JSONResponse(content={"jobs": []})

    @router.post("/cron")
    async def create_cron_job(req: CronJobReq):
        try:
            payload = {
                "id": req.job_id,
                "schedule": req.schedule,
                "agent_id": req.host_id,
                "description": json.dumps({
                    "agent_ids": req.agent_ids,
                    "prompt": req.prompt,
                    "host_id": req.host_id,
                }),
            }
            base = await _get_api_base()
            async with httpx.AsyncClient(timeout=httpx.Timeout(10.0), trust_env=False) as client:
                resp = await client.post(f"{base}/api/cron", json=payload)
                if resp.status_code in (200, 201):
                    return JSONResponse(content={"ok": True, "job_id": req.job_id})
                return JSONResponse(content={"ok": False, "error": resp.text[:200]})
        except Exception as e:
            return JSONResponse(content={"ok": False, "error": str(e)})

    @router.delete("/cron/{job_id}")
    async def delete_cron_job(job_id: str):
        try:
            base = await _get_api_base()
            async with httpx.AsyncClient(timeout=httpx.Timeout(10.0), trust_env=False) as client:
                resp = await client.delete(f"{base}/api/cron/{job_id}")
                if resp.status_code in (200, 204):
                    return JSONResponse(content={"ok": True})
                return JSONResponse(content={"ok": False, "error": resp.text[:200]})
        except Exception as e:
            return JSONResponse(content={"ok": False, "error": str(e)})

    # ---- 系统信息 ----

    @router.get("/system-info")
    async def system_info():
        """获取当前系统 IP 和时间"""
        ip = "127.0.0.1"
        try:
            import socket
            s = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
            s.connect(("8.8.8.8", 80))
            ip = s.getsockname()[0]
            s.close()
        except Exception:
            try:
                ip = socket.gethostbyname(socket.gethostname())
            except Exception:
                pass
        import datetime
        now = datetime.datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        return JSONResponse(content={"ip": ip, "time": now, "timezone": str(datetime.datetime.now().astimezone().tzinfo or "local")})

    # ============================================================
    

    # 频道标签映射
    def _channel_label(name):
        labels = {"dingtalk": "钉钉", "wecom": "企业微信", "feishu": "飞书",
                  "discord": "Discord", "telegram": "Telegram", "qq": "QQ",
                  "whatsapp": "WhatsApp", "wechat": "微信", "slack": "Slack",
                  "imessage": "iMessage"}
        return labels.get(name, name)

    @router.get("/channels")
    async def list_channels():
        """返回全局启用的频道列表"""
        enabled = []
        try:
            config_path = os.path.join(os.path.dirname(CURRENT_DIR), "config.json")
            if os.path.isfile(config_path):
                with open(config_path, "r", encoding="utf-8") as f:
                    cfg = json.load(f)
                channels = cfg.get("channels", {})
                for name, ch in channels.items():
                    if ch.get("enabled"):
                        enabled.append({"name": name, "label": _channel_label(name)})
        except Exception as e:
            logger.warning(f"频道配置读取失败: {e}")
        return JSONResponse(content={"channels": enabled})
# 说明文档
    # ============================================================
    @router.get("/readme")
    async def get_readme():
        readme_path = os.path.join(os.path.dirname(__file__), "README.md")
        try:
            with open(readme_path, "r", encoding="utf-8") as f:
                content = f.read()
            return PlainTextResponse(content=content, media_type="text/plain; charset=utf-8")
        except FileNotFoundError:
            raise HTTPException(status_code=404, detail="README.md not found")

    # 媒体文件服务
    @router.get("/media/{filename}")
    async def get_media(filename: str):
        file_path = os.path.join(MEDIA_DIR, filename)
        if not os.path.isfile(file_path):
            raise HTTPException(status_code=404, detail="File not found")
        return FileResponse(file_path)

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