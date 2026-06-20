#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""TeamChat Plugin Backend v4.1.0 — 重大更新：新增微信频道管理、轻音乐音量控制、config 路径修复

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
import concurrent.futures
import json
import logging
import os
import threading
import time
import uuid
from io import BytesIO
from typing import Any, Dict, List, Optional

import httpx
import base64
from fastapi import APIRouter, HTTPException, UploadFile, File, Form
from fastapi.responses import JSONResponse, PlainTextResponse, FileResponse
from pydantic import BaseModel, Field

# ── 线程池：Playwright sync 操作在此执行 ──
_EXECUTOR = concurrent.futures.ThreadPoolExecutor(max_workers=4, thread_name_prefix="teamchat-browser")


async def _run_in_thread(func, *args, **kwargs):
    """在线程池中执行同步函数。"""
    future = _EXECUTOR.submit(func, *args, **kwargs)
    return await asyncio.wrap_future(future)

logger = logging.getLogger("qwenpaw.team_chat")

# ============================================================
# 配置常量
# ============================================================

CURRENT_VERSION = "4.1.0"
DEFAULT_HOST_ID = "cloud-orchestrator"
MAX_HISTORY = 200
SESSION_KEEPALIVE_DAYS = 7
SESSION_MAX = 1000

# 插件目录
CURRENT_DIR = os.path.dirname(os.path.abspath(__file__))

# LLM 配置文件路径
LLM_CONFIG_PATH = os.path.join(CURRENT_DIR, "llm_config.json")

# 默认 LLM 配置
DEFAULT_LLM_CONFIG = {
    "api_key": "",
    "base_url": "https://dashscope.aliyuncs.com/compatible-mode/v1",
    "model": "qwen-plus",
}


def load_llm_config() -> dict:
    """加载 LLM 配置，优先从文件读取，没有则用默认值"""
    try:
        if os.path.isfile(LLM_CONFIG_PATH):
            with open(LLM_CONFIG_PATH, "r", encoding="utf-8") as f:
                config = json.load(f)
            # 合并默认值（防止缺少字段）
            for k, v in DEFAULT_LLM_CONFIG.items():
                if k not in config:
                    config[k] = v
            return config
    except Exception as e:
        logger.warning(f"加载 LLM 配置失败: {e}")
    return dict(DEFAULT_LLM_CONFIG)


def save_llm_config(config: dict) -> bool:
    """保存 LLM 配置到文件"""
    try:
        with open(LLM_CONFIG_PATH, "w", encoding="utf-8") as f:
            json.dump(config, f, ensure_ascii=False, indent=2)
        return True
    except Exception as e:
        logger.error(f"保存 LLM 配置失败: {e}")
        return False


def get_llm_credentials() -> tuple:
    """获取 LLM 凭证：优先用配置文件，回退到环境变量"""
    config = load_llm_config()
    api_key = config.get("api_key") or os.environ.get("OPENAI_API_KEY", "")
    base_url = config.get("base_url") or os.environ.get("OPENAI_BASE_URL", DEFAULT_LLM_CONFIG["base_url"])
    model = config.get("model") or "qwen-plus"
    return api_key, base_url, model

# 支持的文件扩展名
ALLOWED_EXTENSIONS = {
    ".txt", ".md", ".json", ".py", ".js", ".jsx", ".ts", ".tsx",
    ".html", ".css", ".scss", ".xml", ".csv", ".log", ".yaml", ".yml",
    ".toml", ".ini", ".cfg", ".conf", ".sh", ".bat", ".ps1",
    ".c", ".cpp", ".h", ".hpp", ".java", ".kt", ".rs", ".go",
    ".rb", ".php", ".swift", ".r", ".sql", ".graphql",
    ".env", ".gitignore", ".dockerignore",
}

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
                base = None
                try:
                    from qwenpaw.config.utils import read_last_api
                    last = read_last_api()
                    if last:
                        host, port = last
                        base = f"http://{host}:{port}"
                        logger.debug(f"AgentCache: Using QwenPaw API at {base}")
                    else:
                        logger.warning("AgentCache: read_last_api() returned None")
                except ImportError as e:
                    logger.warning(f"AgentCache: Failed to import read_last_api: {e}")
                except Exception as e:
                    logger.warning(f"AgentCache: Error calling read_last_api: {e}")
                
                # ── 第二兜底：直接从 config.json 读取（与 mentx-doctor 对齐） ──
                if not base:
                    try:
                        config_path = os.path.join(os.path.expanduser("~"), ".qwenpaw", "config.json")
                        if os.path.exists(config_path):
                            with open(config_path, "r") as f:
                                cfg = json.load(f)
                            last_api = cfg.get("last_api", {})
                            host = last_api.get("host", "")
                            port = last_api.get("port", 0)
                            if host and port:
                                base = f"http://{host}:{port}"
                                logger.info(f"AgentCache: 从 config.json 读取地址: {base}")
                    except Exception as cfg_err:
                        logger.warning(f"AgentCache: 读取 config.json 失败: {cfg_err}")
                
                if not base:
                    base = os.environ.get("QWENPAW_BASE_URL", "http://127.0.0.1:56411")
                    logger.info(f"AgentCache: Using fallback base URL: {base}")
                
                headers = {"Content-Type": "application/json"}
                if api_key := os.environ.get("QWENPAW_API_KEY"):
                    headers["Authorization"] = f"Bearer {api_key}"
                
                url = f"{base}/api/agents"
                logger.debug(f"AgentCache: Fetching agents from {url}")
                
                async with httpx.AsyncClient(timeout=httpx.Timeout(10.0), trust_env=False) as client:
                    resp = await client.get(url, headers=headers)
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
                        logger.info(f"AgentCache: Successfully loaded {len(result)} agents")
                    else:
                        logger.warning(f"AgentCache: HTTP {resp.status_code} from {url}")
            except httpx.ConnectError as e:
                logger.warning(f"AgentCache: Connection failed to {base if 'base' in dir() else 'unknown'}: {e}")
            except httpx.TimeoutException as e:
                logger.warning(f"AgentCache: Timeout connecting to {base if 'base' in dir() else 'unknown'}: {e}")
            except Exception as e:
                logger.warning(f"AgentCache refresh failed: {type(e).__name__}: {e}")


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
# 浏览器管理（学习自串串插件）
# ============================================================

def _find_chromium_exe() -> Optional[str]:
    """在 ms-playwright 目录中查找已安装的 Chromium 可执行文件。"""
    base = os.path.join(os.path.expanduser("~"), "AppData", "Local", "ms-playwright")
    if not os.path.isdir(base):
        return None
    candidates: list[tuple[int, str]] = []
    for entry in os.listdir(base):
        if not entry.startswith("chromium-"):
            continue
        try:
            ver = int(entry.split("-")[1])
        except ValueError:
            ver = 0
        chrome_exe = os.path.join(base, entry, "chrome-win64", "chrome.exe")
        if os.path.isfile(chrome_exe):
            candidates.append((ver, chrome_exe))
            continue
        headless_exe = os.path.join(base, entry, "chrome-headless-shell-win64", "chrome-headless-shell.exe")
        if os.path.isfile(headless_exe):
            candidates.append((ver, headless_exe))
    if candidates:
        candidates.sort(key=lambda x: x[0], reverse=True)
        return candidates[0][1]
    return None


class BrowserManager:
    """管理 Playwright Chromium 浏览器单例。"""

    _instance: Optional["BrowserManager"] = None
    _lock = threading.Lock()

    def __init__(self) -> None:
        self.playwright: Any = None
        self.browser: Any = None
        self.page: Any = None
        self.is_running: bool = False
        self.current_url: str = ""
        self.launch_time: float = 0.0

    @classmethod
    def get_instance(cls) -> "BrowserManager":
        if cls._instance is None:
            with cls._lock:
                if cls._instance is None:
                    cls._instance = cls()
        return cls._instance

    def launch(self, url: str) -> Dict[str, Any]:
        """启动浏览器并导航到 URL。"""
        if self.is_running:
            self.close()
        try:
            from playwright.sync_api import sync_playwright
            self.playwright = sync_playwright().start()
            chromium_exe = _find_chromium_exe()
            self.browser = self.playwright.chromium.launch(
                headless=False,
                executable_path=chromium_exe,
                args=["--no-sandbox", "--disable-blink-features=AutomationControlled", "--start-maximized"],
            )
            context = self.browser.new_context(
                no_viewport=True,
                user_agent="Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120.0.0.0 Safari/537.36",
            )
            self.page = context.new_page()
            self.page.goto(url, wait_until="domcontentloaded", timeout=30000)
            self.current_url = url
            self.is_running = True
            self.launch_time = time.time()
            logger.info(f"TeamChat 浏览器已启动 -> {url}")
            return {"success": True, "url": url}
        except ImportError:
            self.is_running = False
            raise HTTPException(500, "playwright 未安装。请在终端执行: playwright install chromium")
        except Exception as e:
            logger.error(f"浏览器启动失败: {e}")
            self.is_running = False
            raise HTTPException(500, f"浏览器启动失败: {str(e)}")

    def close(self) -> Dict[str, Any]:
        """关闭浏览器。"""
        try:
            if self.page:
                self.page.close()
            if self.browser:
                self.browser.close()
            if self.playwright:
                self.playwright.stop()
        except Exception as e:
            logger.warning(f"关闭浏览器出错: {e}")
        finally:
            self.page = None
            self.browser = None
            self.playwright = None
            self.is_running = False
            self.current_url = ""
        logger.info("TeamChat 浏览器已关闭")
        return {"success": True}

    def get_status(self) -> Dict[str, Any]:
        """获取浏览器状态。"""
        return {
            "running": self.is_running,
            "url": self.current_url,
            "uptime": int(time.time() - self.launch_time) if self.is_running else 0,
        }


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

    # ---- 远程直聊（原创作者AI → 云服务器 CloudPaw-Master） ----

    class RemoteChatRequest(BaseModel):
        message: str = ""
        session_id: str = ""
        history: List[Dict[str, str]] = []  # [{role: "user"/"assistant", content: "..."}]

    # 内存中保存对话历史（按session_id）
    _remote_chat_history: Dict[str, List[Dict[str, str]]] = {}

    # 原创作者AI背景信息（仅供参考，不限制回答范围）
    AUTHOR_SYSTEM_PROMPT = """你是"串串频道·原创作者AI"。以下是作者的真实背景信息，当被问及相关问题时可以参考：

## 作者背景（仅供参考）
- 身份：一位从财务行业转型的 AI 探索者
- 主业：温州华容信息技术有限公司（企业AI智能化应用及财税咨询）
- 副业：温州市鹿城区意乡贸易商行（个人爱好研究AI）
- 邮箱：115886@qq.com

## 回答格式建议
1. 分段落回答，段落之间用空行隔开
2. 不同主题用标题或编号分开
3. 简洁明了，避免大段文字堆砌
"""

    @router.post("/remote-chat")
    async def remote_chat(req: RemoteChatRequest):
        """代理转发消息到 agent.bh-jk.com 上的 CloudPaw-Master，支持多轮对话"""
        import httpx

        # 生成或获取session_id
        sid = req.session_id or str(uuid.uuid4())

        # 保存当前消息到历史
        if sid not in _remote_chat_history:
            _remote_chat_history[sid] = []
        _remote_chat_history[sid].append({"role": "user", "content": req.message})

        # 构建上下文（最近10轮对话）
        history_context = _remote_chat_history[sid][-20:]  # 最多20条消息

        # 构建带上下文的prompt（附带系统提示词）
        if len(history_context) > 1:
            context_parts = []
            for h in history_context[:-1]:  # 排除最后一条（当前消息）
                role = "用户" if h["role"] == "user" else "AI"
                context_parts.append(f"{role}: {h['content']}")
            context = "\n".join(context_parts)
            full_message = f"{AUTHOR_SYSTEM_PROMPT}\n以下是之前的对话记录：\n{context}\n\n用户最新问题：{req.message}"
        else:
            full_message = f"{AUTHOR_SYSTEM_PROMPT}\n用户问题：{req.message}"

        try:
            async with httpx.AsyncClient(timeout=120.0) as client:
                resp = await client.post(
                    "https://agent.bh-jk.com/api/agent-share/message",
                    json={"token": "450729a6-f5a4-42a7-8433-984a93368cfc", "text": full_message},
                    headers={"Content-Type": "application/json"},
                )
                if resp.status_code == 200:
                    data = resp.json()
                    reply = data.get("reply") or data.get("response") or data.get("message") or str(data)
                    # 保存AI回复到历史
                    _remote_chat_history[sid].append({"role": "assistant", "content": reply})
                else:
                    reply = f"[远程错误 HTTP {resp.status_code}] {resp.text[:200]}"
        except httpx.ConnectError:
            reply = "[无法连接] 远程服务器 agent.bh-jk.com 不可达"
        except httpx.TimeoutException:
            reply = "[超时] 远程服务器响应超时"
        except Exception as e:
            reply = f"[代理错误] {str(e)[:100]}"

        return JSONResponse(content={"reply": reply, "session_id": sid})

    # ---- 串串周报（本地LLM自动生成） ----

    class ReportRequest(BaseModel):
        history: List[Dict[str, str]] = []  # 用户对话历史
        days: int = 7  # 统计天数
        agent_id: str = "cloud-orchestrator"  # 用于生成报告的智能体 ID

    @router.post("/generate-report")
    async def generate_report(req: ReportRequest):
        """基于用户与所有智能体的对话历史，使用指定智能体生成周报"""
        import httpx
        import os
        
        # 获取要使用的智能体 ID
        agent_id = req.agent_id or "cloud-orchestrator"
        logger.info(f"[Report] 使用智能体 {agent_id} 生成周报")

        # 构建对话摘要
        if req.history:
            # 按智能体分组统计
            agent_stats = {}
            topic_list = []
            
            for h in req.history[-50:]:  # 最近50条
                agent = h.get("agent", "未知")
                role = h.get("role", "unknown")
                content = h.get("content", "")[:100]
                
                if agent not in agent_stats:
                    agent_stats[agent] = {"user": 0, "ai": 0}
                if role == "user":
                    agent_stats[agent]["user"] += 1
                else:
                    agent_stats[agent]["ai"] += 1
                
                if content:
                    topic_list.append(f"[{agent}] {role}: {content}")
            
            # 构建统计信息
            stats_text = "智能体互动统计：\n"
            for agent, counts in agent_stats.items():
                stats_text += f"- {agent}: 用户{counts['user']}次, AI回复{counts['ai']}次\n"
            
            history_text = "\n".join(topic_list)
        else:
            return JSONResponse(content={"report": None, "success": False, "reason": "暂无对话历史"})

        # 构建prompt
        prompt = f"""你是串串，一个温暖、真诚的理念伙伴。

根据以下用户与所有智能体的对话历史，生成一份周报总结。

要求：
1. 必须基于用户真实聊过的内容，不要编造
2. 统计与多少个智能体互动，总对话次数
3. 提炼主要话题和关键洞察
4. 给出AI的观察和建议
5. 语气温暖，像朋友写的总结
6. 400字以内
7. 结尾署名"—— 串串"

格式参考：
📊 你的本周总结 (日期范围)

 互动统计
· 与 X 个智能体对话
· 总对话 Y 次
· 主要智能体：...

 关键话题
· 话题1：...
· 话题2：...

 AI的观察
· 你最近在关注...
· 建议：...

🌟 本周金句
"..."

—— 串串

{stats_text}

对话记录摘要：
{history_text}

请生成周报："""

        # 调用 CloudPaw-Master 智能体生成报告
        try:
            # 使用 QwenPaw 系统内置的 CloudPaw-Master 智能体
            # 通过 QwenPaw API 调用智能体
            import subprocess
            import sys
            
            # 构建智能体调用命令
            agent_prompt = f"""你是串串，一个温暖、真诚的理念伙伴。

请根据以下用户与所有智能体的对话历史，生成一份周报总结。

{stats_text}

对话记录摘要：
{history_text}

要求：
1. 必须基于用户真实聊过的内容，不要编造
2. 统计与多少个智能体互动，总对话次数
3. 提炼主要话题和关键洞察
4. 给出AI的观察和建议
5. 语气温暖，像朋友写的总结
6. 400字以内
7. 结尾署名"—— 串串"

格式参考：
📊 你的本周总结 (日期范围)

 互动统计
· 与 X 个智能体对话
· 总对话 Y 次
· 主要智能体：...

 关键话题
· 话题1：...
· 话题2：...

 AI的观察
· 你最近在关注...
· 建议：...

🌟 本周金句
"..."

—— 串串"""

            # 尝试通过 QwenPaw API 调用指定智能体
            try:
                # 获取 QwenPaw API 地址
                try:
                    from qwenpaw.config.utils import read_last_api
                    last = read_last_api()
                    if last:
                        host, port = last
                        qp_api_base = f"http://{host}:{port}"
                    else:
                        qp_api_base = os.environ.get("QWENPAW_API_URL", "http://127.0.0.1:56411")
                except ImportError:
                    qp_api_base = os.environ.get("QWENPAW_API_URL", "http://127.0.0.1:56411")
                
                logger.info(f"[Report] 调用 QwenPaw API: {qp_api_base}/api/agents/{agent_id}/chat")
                
                async with httpx.AsyncClient(timeout=90.0) as client:
                    # 调用 QwenPaw 的智能体聊天 API（使用用户选择的智能体）
                    resp = await client.post(
                        f"{qp_api_base}/api/agents/{agent_id}/chat",
                        json={
                            "message": agent_prompt,
                            "stream": False
                        },
                        headers={"Content-Type": "application/json"}
                    )
                    
                    if resp.status_code == 200:
                        data = resp.json()
                        report = data.get("response", "") or data.get("message", "") or data.get("content", "")
                        if report:
                            return JSONResponse(content={"report": report, "success": True})
                    
                    # 如果 QwenPaw API 不可用，回退到直接 LLM 调用
                    logger.warning(f"QwenPaw API 调用失败 (HTTP {resp.status_code})，回退到 LLM 直接调用")
                    
            except Exception as e:
                logger.warning(f"QwenPaw API 调用异常: {e}，回退到 LLM 直接调用")
            
            # 回退：使用系统内置的 LLM 配置
            api_key, base_url, model = get_llm_credentials()
            
            if not api_key:
                # 尝试从 QwenPaw 系统获取默认配置
                try:
                    async with httpx.AsyncClient(timeout=10.0) as client:
                        config_resp = await client.get(f"{qp_api_base}/api/models")
                        if config_resp.status_code == 200:
                            models_data = config_resp.json()
                            # 使用第一个可用的模型
                            if models_data and len(models_data) > 0:
                                model_info = models_data[0]
                                api_key = model_info.get("api_key", "")
                                base_url = model_info.get("base_url", "https://dashscope.aliyuncs.com/compatible-mode/v1")
                                model = model_info.get("model", "qwen3.7-plus")
                except Exception as e:
                    logger.warning(f"获取 QwenPaw 模型配置失败: {e}")
            
            if not api_key:
                return JSONResponse(content={"report": "[提示] 正在使用系统默认配置生成报告，请稍候...", "success": True})
            
            async with httpx.AsyncClient(timeout=60.0) as client:
                resp = await client.post(
                    f"{base_url}/chat/completions",
                    json={
                        "model": model,
                        "messages": [{"role": "user", "content": agent_prompt}]
                    },
                    headers={
                        "Content-Type": "application/json",
                        "Authorization": f"Bearer {api_key}"
                    },
                )
                if resp.status_code == 200:
                    data = resp.json()
                    report = data.get("choices", [{}])[0].get("message", {}).get("content", "")
                    if report:
                        return JSONResponse(content={"report": report, "success": True})
                    else:
                        return JSONResponse(content={"report": "[生成失败] 空响应", "success": False})
                else:
                    return JSONResponse(content={"report": f"[生成失败 HTTP {resp.status_code}]", "success": False})
        except Exception as e:
            return JSONResponse(content={"report": f"[错误] {str(e)[:100]}", "success": False})

    # ---- 实时报告（12小时内对话汇总） ----

    class RealtimeReportRequest(BaseModel):
        history: List[Dict[str, str]] = []  # 12小时内的对话历史
        hours: int = 12  # 统计小时数
        agent_id: str = "cloud-orchestrator"  # 用于生成报告的智能体 ID

    @router.post("/generate-realtime-report")
    async def generate_realtime_report(req: RealtimeReportRequest):
        """基于用户最近12小时与所有智能体的对话历史，使用指定智能体生成实时报告"""
        import httpx
        
        # 获取要使用的智能体 ID
        agent_id = req.agent_id or "cloud-orchestrator"
        logger.info(f"[RealtimeReport] 使用智能体 {agent_id} 生成实时报告")
        import os

        # 构建对话摘要
        if req.history:
            # 按智能体分组统计
            agent_stats = {}
            topic_list = []
            
            for h in req.history[-30:]:  # 最近30条
                agent = h.get("agent", "未知")
                role = h.get("role", "unknown")
                content = h.get("content", "")[:100]
                
                if agent not in agent_stats:
                    agent_stats[agent] = {"user": 0, "ai": 0}
                if role == "user":
                    agent_stats[agent]["user"] += 1
                else:
                    agent_stats[agent]["ai"] += 1
                
                if content:
                    topic_list.append(f"[{agent}] {role}: {content}")
            
            # 构建统计信息
            stats_text = "智能体互动统计：\n"
            for agent, counts in agent_stats.items():
                stats_text += f"- {agent}: 用户{counts['user']}次, AI回复{counts['ai']}次\n"
            
            history_text = "\n".join(topic_list)
        else:
            return JSONResponse(content={"report": None, "success": False, "reason": "暂无对话历史"})

        # 构建prompt
        prompt = f"""你是串串，一个温暖、真诚的理念伙伴。

根据以下用户最近{req.hours}小时内与所有智能体的对话历史，生成一份实时报告。

要求：
1. 必须基于用户真实聊过的内容，不要编造
2. 统计与多少个智能体互动，总对话次数
3. 提炼最近的主要话题和进展
4. 给出AI的即时观察和建议
5. 语气温暖，像朋友写的总结
6. 300字以内
7. 结尾署名"—— 串串"

格式参考：
⚡ 实时报告 (时间)

📝 最近互动
· 过去{req.hours}小时与 X 个智能体对话
· 总对话 Y 次
· 主要智能体：...

💡 最新话题
· 话题1：...
· 话题2：...

🎯 AI的即时观察
· 你正在关注...
· 建议：...

—— 串串

{stats_text}

对话记录摘要：
{history_text}

请生成实时报告："""

        # 调用 CloudPaw-Master 智能体生成报告
        try:
            # 使用 QwenPaw 系统内置的 CloudPaw-Master 智能体
            # 通过 QwenPaw API 调用智能体
            import subprocess
            import sys
            
            # 构建智能体调用命令
            agent_prompt = f"""你是串串，一个温暖、真诚的理念伙伴。

请根据以下用户与所有智能体的对话历史，生成一份周报总结。

{stats_text}

对话记录摘要：
{history_text}

要求：
1. 必须基于用户真实聊过的内容，不要编造
2. 统计与多少个智能体互动，总对话次数
3. 提炼主要话题和关键洞察
4. 给出AI的观察和建议
5. 语气温暖，像朋友写的总结
6. 400字以内
7. 结尾署名"—— 串串"

格式参考：
📊 你的本周总结 (日期范围)

 互动统计
· 与 X 个智能体对话
· 总对话 Y 次
· 主要智能体：...

 关键话题
· 话题1：...
· 话题2：...

 AI的观察
· 你最近在关注...
· 建议：...

🌟 本周金句
"..."

—— 串串"""

            # 尝试通过 QwenPaw API 调用指定智能体
            try:
                # 获取 QwenPaw API 地址
                try:
                    from qwenpaw.config.utils import read_last_api
                    last = read_last_api()
                    if last:
                        host, port = last
                        qp_api_base = f"http://{host}:{port}"
                    else:
                        qp_api_base = os.environ.get("QWENPAW_API_URL", "http://127.0.0.1:56411")
                except ImportError:
                    qp_api_base = os.environ.get("QWENPAW_API_URL", "http://127.0.0.1:56411")
                
                logger.info(f"[Report] 调用 QwenPaw API: {qp_api_base}/api/agents/{agent_id}/chat")
                
                async with httpx.AsyncClient(timeout=90.0) as client:
                    # 调用 QwenPaw 的智能体聊天 API（使用用户选择的智能体）
                    resp = await client.post(
                        f"{qp_api_base}/api/agents/{agent_id}/chat",
                        json={
                            "message": agent_prompt,
                            "stream": False
                        },
                        headers={"Content-Type": "application/json"}
                    )
                    
                    if resp.status_code == 200:
                        data = resp.json()
                        report = data.get("response", "") or data.get("message", "") or data.get("content", "")
                        if report:
                            return JSONResponse(content={"report": report, "success": True})
                    
                    # 如果 QwenPaw API 不可用，回退到直接 LLM 调用
                    logger.warning(f"QwenPaw API 调用失败 (HTTP {resp.status_code})，回退到 LLM 直接调用")
                    
            except Exception as e:
                logger.warning(f"QwenPaw API 调用异常: {e}，回退到 LLM 直接调用")
            
            # 回退：使用系统内置的 LLM 配置
            api_key, base_url, model = get_llm_credentials()
            
            if not api_key:
                # 尝试从 QwenPaw 系统获取默认配置
                try:
                    async with httpx.AsyncClient(timeout=10.0) as client:
                        config_resp = await client.get(f"{qp_api_base}/api/models")
                        if config_resp.status_code == 200:
                            models_data = config_resp.json()
                            # 使用第一个可用的模型
                            if models_data and len(models_data) > 0:
                                model_info = models_data[0]
                                api_key = model_info.get("api_key", "")
                                base_url = model_info.get("base_url", "https://dashscope.aliyuncs.com/compatible-mode/v1")
                                model = model_info.get("model", "qwen3.7-plus")
                except Exception as e:
                    logger.warning(f"获取 QwenPaw 模型配置失败: {e}")
            
            if not api_key:
                return JSONResponse(content={"report": "[提示] 正在使用系统默认配置生成报告，请稍候...", "success": True})
            
            async with httpx.AsyncClient(timeout=60.0) as client:
                resp = await client.post(
                    f"{base_url}/chat/completions",
                    json={
                        "model": model,
                        "messages": [{"role": "user", "content": agent_prompt}]
                    },
                    headers={
                        "Content-Type": "application/json",
                        "Authorization": f"Bearer {api_key}"
                    },
                )
                if resp.status_code == 200:
                    data = resp.json()
                    report = data.get("choices", [{}])[0].get("message", {}).get("content", "")
                    if report:
                        return JSONResponse(content={"report": report, "success": True})
                    else:
                        return JSONResponse(content={"report": "[生成失败] 空响应", "success": False})
                else:
                    return JSONResponse(content={"report": f"[生成失败 HTTP {resp.status_code}]", "success": False})
        except Exception as e:
            return JSONResponse(content={"report": f"[错误] {str(e)[:100]}", "success": False})

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

    # ---- 数据看板 ----

    @router.get("/dashboard-stats")
    async def dashboard_stats():
        """聚合会话数据，返回看板所需的各项指标"""
        import time as _time
        all_sessions = store.list_all()
        now = _time.time()
        h12 = now - 12 * 3600
        d7 = now - 7 * 24 * 3600

        # 按智能体统计
        agent_stats = {}  # {host_id: {name, count_12h, count_7d, msg_count, brainstorm_count}}
        total_msgs = 0
        brainstorm_total = 0
        brainstorm_12h = 0
        brainstorm_7d = 0
        active_sessions_12h = 0
        active_sessions_7d = 0

        for s in all_sessions:
            host_id = s.get("host_id", "unknown")
            host_name = s.get("host_name", host_id)
            updated = s.get("updated_at", 0)
            created = s.get("created_at", 0)
            is_brainstorm = s.get("brainstorm", False)
            h = s.get("history", [])
            msg_count = len(h)
            total_msgs += msg_count

            if host_id not in agent_stats:
                agent_stats[host_id] = {
                    "host_id": host_id,
                    "host_name": host_name,
                    "count_12h": 0,
                    "count_7d": 0,
                    "msg_count": 0,
                    "brainstorm_count": 0,
                    "session_count": 0,
                }
            agent = agent_stats[host_id]
            agent["session_count"] += 1
            agent["msg_count"] += msg_count

            if updated >= h12:
                agent["count_12h"] += 1
                active_sessions_12h += 1
            if updated >= d7:
                agent["count_7d"] += 1
                active_sessions_7d += 1

            if is_brainstorm:
                brainstorm_total += 1
                agent["brainstorm_count"] += 1
                if updated >= h12:
                    brainstorm_12h += 1
                if updated >= d7:
                    brainstorm_7d += 1

        # 技能统计（从主智能体工作区读取）
        skills_dir = os.path.join(os.path.expanduser("~"), ".qwenpaw", "workspaces", "cloud-orchestrator", "skills")
        skill_count = 0
        skill_names = []
        if os.path.isdir(skills_dir):
            for d in os.listdir(skills_dir):
                if os.path.isdir(os.path.join(skills_dir, d)):
                    skill_count += 1
                    skill_names.append(d)

        # 频道绑定情况（从配置文件读取）
        channels_bound = []
        config_path = os.path.join(os.path.expanduser("~"), ".qwenpaw", "config.json")
        try:
            if os.path.isfile(config_path):
                with open(config_path, "r", encoding="utf-8") as f:
                    cfg = json.load(f)
                ch = cfg.get("channels", {})
                for ch_name, ch_cfg in ch.items():
                    if ch_cfg.get("enabled"):
                        channels_bound.append(ch_name)
        except Exception:
            pass

        # 最近活跃会话（最近5个）
        recent = sorted(all_sessions, key=lambda s: s.get("updated_at", 0), reverse=True)[:5]
        recent_list = []
        for s in recent:
            h = s.get("history", [])
            recent_list.append({
                "session_id": s.get("session_id", ""),
                "host_name": s.get("host_name", ""),
                "updated_at": s.get("updated_at", 0),
                "msg_count": len(h),
                "brainstorm": s.get("brainstorm", False),
                "tag": s.get("tag", ""),
            })

        return JSONResponse(content={
            "summary": {
                "total_sessions": len(all_sessions),
                "total_messages": total_msgs,
                "active_12h": active_sessions_12h,
                "active_7d": active_sessions_7d,
                "brainstorm_total": brainstorm_total,
                "brainstorm_12h": brainstorm_12h,
                "brainstorm_7d": brainstorm_7d,
                "agent_count": len(agent_stats),
                "skill_count": skill_count,
                "channels_bound": channels_bound,
            },
            "agents": list(agent_stats.values()),
            "recent_sessions": recent_list,
            "skills": skill_names[:20],
            "generated_at": now,
        })

    @router.get("/agent-detail")
    async def agent_detail(agent_id: str = ""):
        """返回指定智能体的详细数据：统计 + 会话列表"""
        import time as _time
        if not agent_id:
            raise HTTPException(status_code=400, detail="缺少 agent_id")

        all_sessions = store.list_all()
        now = _time.time()
        h12 = now - 12 * 3600
        d7 = now - 7 * 24 * 3600

        # 筛选该智能体的会话
        agent_sessions = [s for s in all_sessions if s.get("host_id") == agent_id]
        
        # 获取智能体名称（优先从配置中获取）
        host_name = agent_id
        config_path = os.path.join(os.path.expanduser("~"), ".qwenpaw", "config.json")
        try:
            if os.path.isfile(config_path):
                with open(config_path, "r", encoding="utf-8") as f:
                    cfg = json.load(f)
                agents_cfg = cfg.get("agents", [])
                for a in agents_cfg:
                    if a.get("id") == agent_id:
                        host_name = a.get("name", agent_id)
                        break
        except Exception:
            pass
        
        # 如果配置中没有，从session中获取
        if host_name == agent_id and agent_sessions:
            host_name = agent_sessions[0].get("host_name", agent_id)

        # 统计
        stats = {
            "host_id": agent_id,
            "host_name": host_name,
            "count_12h": 0,
            "count_7d": 0,
            "msg_count": 0,
            "brainstorm_count": 0,
            "session_count": len(agent_sessions),
        }

        sessions_list = []
        for s in agent_sessions:
            updated = s.get("updated_at", 0)
            h = s.get("history", [])
            msg_count = len(h)
            stats["msg_count"] += msg_count

            if updated >= h12:
                stats["count_12h"] += 1
            if updated >= d7:
                stats["count_7d"] += 1
            if s.get("brainstorm"):
                stats["brainstorm_count"] += 1

            # 会话摘要
            last_msg = ""
            if h:
                # 取最后一条用户消息作为摘要
                for m in reversed(h):
                    if m.get("role") == "user":
                        last_msg = m.get("content", "")[:100]
                        break
                if not last_msg and h:
                    last_msg = h[-1].get("content", "")[:100]

            sessions_list.append({
                "session_id": s.get("session_id", ""),
                "updated_at": updated,
                "created_at": s.get("created_at", 0),
                "msg_count": msg_count,
                "brainstorm": s.get("brainstorm", False),
                "tag": s.get("tag", ""),
                "last_message": last_msg,
            })

        # 按更新时间排序
        sessions_list.sort(key=lambda x: x["updated_at"], reverse=True)

        return JSONResponse(content={
            "host_id": agent_id,
            "host_name": host_name,
            "stats": stats,
            "sessions": sessions_list[:20],  # 最多返回20个会话
        })

    @router.get("/all-agents")
    async def get_all_agents():
        """通过QwenPaw API获取真实智能体列表"""
        agents = []
        
        # 尝试从QwenPaw API获取真实智能体列表
        try:
            base = None
            try:
                from qwenpaw.config.utils import read_last_api
                last = read_last_api()
                if last:
                    host, port = last
                    base = f"http://{host}:{port}"
            except ImportError:
                pass
            except Exception:
                pass
            
            if not base:
                base = os.environ.get("QWENPAW_BASE_URL", "http://127.0.0.1:56411")
            
            headers = {"Content-Type": "application/json"}
            if api_key := os.environ.get("QWENPAW_API_KEY"):
                headers["Authorization"] = f"Bearer {api_key}"
            
            async with httpx.AsyncClient(timeout=httpx.Timeout(10.0), trust_env=False) as client:
                resp = await client.get(f"{base}/api/agents", headers=headers)
                if resp.status_code == 200:
                    data = resp.json()
                    raw_agents = data.get("agents", [])
                    for a in raw_agents:
                        agents.append({
                            "id": a.get("id", ""),
                            "name": a.get("name", a.get("id", "")),
                            "description": a.get("description", ""),
                        })
                    if agents:
                        logger.info(f"获取到 {len(agents)} 个智能体")
        except Exception as e:
            logger.warning(f"通过QwenPaw API获取智能体列表失败: {e}")
        
        # 如果API获取失败，返回默认列表
        if not agents:
            agents = [
                {"id": "cloud-orchestrator", "name": "CloudPaw-Master", "description": "主控智能体"},
                {"id": "cloud-executor", "name": "执行者", "description": "代码、部署、操作"},
                {"id": "cloud-verifier", "name": "校验者", "description": "风险审查、合规验证"},
            ]
        
        return JSONResponse(content={"agents": agents})

    # ---- 原创作者AI聊天记录持久化 ----
    
    AUTHOR_CHAT_FILE = os.path.join(CURRENT_DIR, "author_chat_history.json")
    
    @router.get("/author-chat-history")
    async def get_author_chat_history():
        """获取原创作者AI的聊天记录"""
        try:
            if os.path.isfile(AUTHOR_CHAT_FILE):
                with open(AUTHOR_CHAT_FILE, "r", encoding="utf-8") as f:
                    data = json.load(f)
                return JSONResponse(content=data)
        except Exception as e:
            logger.warning(f"读取原创作者AI聊天记录失败: {e}")
        return JSONResponse(content={"messages": [], "sessions": []})
    
    @router.post("/author-chat-history")
    async def save_author_chat_history(req: dict):
        """保存原创作者AI的聊天记录"""
        try:
            messages = req.get("messages", [])
            sessions = req.get("sessions", [])
            data = {
                "messages": messages,
                "sessions": sessions,
                "updated_at": time.time()
            }
            with open(AUTHOR_CHAT_FILE, "w", encoding="utf-8") as f:
                json.dump(data, f, ensure_ascii=False, indent=2)
            return JSONResponse(content={"success": True})
        except Exception as e:
            logger.warning(f"保存原创作者AI聊天记录失败: {e}")
            return JSONResponse(content={"success": False, "error": str(e)})

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

    # ---- 会话导出（后端生成文件，前端直接下载） ----
    from fastapi.responses import Response as FastResponse

    class ExportRequest(BaseModel):
        session_id: str
        format: str = "md"

    @router.post("/export-session")
    async def export_session(req: ExportRequest):
        """生成会话导出文件并返回下载响应。"""
        data = store.get(req.session_id)
        if not data:
            raise HTTPException(status_code=404, detail="会话不存在")

        messages = data.get("messages", data.get("history", []))
        title = data.get("title", req.session_id)
        safe_title = "".join(c if c.isalnum() or c in " \u4e00-\u9fa5" else "_" for c in title)

        if req.format == "md":
            content = f"# {title}\n\n"
            content += f"> 导出时间: {__import__('datetime').datetime.now().strftime('%Y-%m-%d %H:%M:%S')}\n"
            content += f"> 共 {len(messages)} 条消息\n\n---\n\n"
            for m in messages:
                role = "👤 用户" if m.get("role") == "user" else "🤖 AI" if m.get("role") == "assistant" else "⚙️ 系统"
                content += f"### {role}\n\n{m.get('content', '')}\n\n---\n\n"
            filename = f"{safe_title}.md"
            mime = "text/markdown; charset=utf-8"
        elif req.format == "html":
            content = f'''<!DOCTYPE html><html><head><meta charset="utf-8"><title>{title}</title>
<style>body{{font-family:"Microsoft YaHei",sans-serif;padding:40px;line-height:1.8;}}
.msg{{margin:20px 0;padding:16px;border-radius:12px;}}
.user{{background:#FFF8E1;border-left:4px solid #FFD700;}}
.assistant{{background:#F5F5F5;border-left:4px solid #8D6E63;}}
.role{{font-weight:bold;margin-bottom:8px;}}</style></head><body>
<h1>📡 {title}</h1>
<p>导出时间: {__import__('datetime').datetime.now().strftime('%Y-%m-%d %H:%M:%S')}</p>'''
            for m in messages:
                role = "👤 用户" if m.get("role") == "user" else " AI" if m.get("role") == "assistant" else "⚙️ 系统"
                cls = m.get("role", "system")
                content += f'<div class="msg {cls}"><div class="role">{role}</div><div>{m.get("content", "")}</div></div>'
            content += '</body></html>'
            filename = f"{safe_title}.html"
            mime = "text/html; charset=utf-8"
        elif req.format == "txt":
            content = f"{title}\n"
            content += f"导出时间: {__import__('datetime').datetime.now().strftime('%Y-%m-%d %H:%M:%S')}\n"
            content += f"共 {len(messages)} 条消息\n"
            content += "=" * 50 + "\n\n"
            for m in messages:
                role = "用户" if m.get("role") == "user" else "AI" if m.get("role") == "assistant" else "系统"
                content += f"[{role}]\n{m.get('content', '')}\n\n"
            filename = f"{safe_title}.txt"
            mime = "text/plain; charset=utf-8"
        elif req.format == "json":
            content = json.dumps(messages, ensure_ascii=False, indent=2)
            filename = f"{safe_title}.json"
            mime = "application/json; charset=utf-8"
        else:
            raise HTTPException(status_code=400, detail=f"不支持的格式: {req.format}")

        return FastResponse(
            content=content.encode("utf-8"),
            media_type=mime,
            headers={
                "Content-Disposition": f'attachment; filename*=UTF-8\'\'{__import__("urllib.parse").quote(filename)}',
                "Content-Length": str(len(content.encode("utf-8"))),
            },
        )

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
            config_path = os.path.join(os.path.dirname(os.path.dirname(CURRENT_DIR)), "config.json")
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

    # ============================================================
    # 微信频道管理 (v4.1.0)
    # ============================================================
    @router.get("/wechat/status")
    async def wechat_status():
        """获取微信频道状态"""
        wechat_enabled = False
        agent_id = ""
        agent_name = ""
        desc = ""
        try:
            # 使用正确的配置路径
            config_path = os.path.join(os.path.expanduser("~"), ".qwenpaw", "config.json")
            if os.path.isfile(config_path):
                with open(config_path, "r", encoding="utf-8") as f:
                    cfg = json.load(f)
                channels = cfg.get("channels", {})
                if channels.get("wechat", {}).get("enabled"):
                    wechat_enabled = True
                    agent_id = channels["wechat"].get("agent_id") or "cloud-orchestrator"
                    agent_name = channels["wechat"].get("agent_name") or "CloudPaw-Master"
                    desc = channels["wechat"].get("desc") or "微信频道已启用"
        except Exception as e:
            logger.warning(f"微信配置读取失败: {e}")
        return JSONResponse(content={
            "wechat": {
                "enabled": wechat_enabled,
                "agent_id": agent_id,
                "agent_name": agent_name,
                "desc": desc
            }
        })

    @router.post("/wechat/test")
    async def wechat_test(req: dict):
        """测试微信频道消息发送"""
        message = req.get("message", "")
        if not message:
            raise HTTPException(400, "消息不能为空")
        try:
            api_base = _agent_api._api_base or "http://127.0.0.1:8088"
            async with httpx.AsyncClient(trust_env=False, timeout=30) as client:
                resp = await client.post(
                    f"{api_base}/api/channels/wechat/send",
                    json={"message": message}
                )
                if resp.status_code == 200:
                    return JSONResponse(content={"ok": True, "message": "测试消息已发送"})
                else:
                    return JSONResponse(content={"ok": False, "error": f"HTTP {resp.status_code}"})
        except Exception as e:
            logger.error(f"微信测试失败: {e}")
            return JSONResponse(content={"ok": False, "error": str(e)})

    # ---- LLM 配置管理 ----

    class LLMConfigReq(BaseModel):
        api_key: str = ""
        base_url: str = "https://dashscope.aliyuncs.com/compatible-mode/v1"
        model: str = "qwen-plus"

    @router.get("/llm-config")
    async def get_llm_config():
        """获取当前 LLM 配置"""
        config = load_llm_config()
        # 隐藏 API Key 的中间部分（安全考虑）
        masked_key = ""
        if config.get("api_key"):
            key = config["api_key"]
            if len(key) > 8:
                masked_key = key[:4] + "****" + key[-4:]
            else:
                masked_key = "****"
        return JSONResponse(content={
            "api_key": masked_key,
            "base_url": config.get("base_url", ""),
            "model": config.get("model", ""),
            "has_key": bool(config.get("api_key")),
        })

    @router.post("/llm-config")
    async def save_llm_config_endpoint(req: LLMConfigReq):
        """保存 LLM 配置"""
        config = {
            "api_key": req.api_key.strip(),
            "base_url": req.base_url.strip(),
            "model": req.model.strip(),
        }
        if save_llm_config(config):
            return JSONResponse(content={"ok": True, "message": "配置已保存"})
        else:
            raise HTTPException(status_code=500, detail="保存配置失败")

    @router.post("/llm-config/test")
    async def test_llm_config(req: LLMConfigReq):
        """测试 LLM 配置是否可用"""
        api_key = req.api_key.strip()
        base_url = req.base_url.strip()
        model = req.model.strip()

        if not api_key:
            return JSONResponse(content={"ok": False, "error": "API Key 不能为空"})

        try:
            async with httpx.AsyncClient(timeout=30.0) as client:
                resp = await client.post(
                    f"{base_url}/chat/completions",
                    json={
                        "model": model,
                        "messages": [{"role": "user", "content": "你好，请回复'连接成功'四个字"}],
                        "max_tokens": 20,
                    },
                    headers={
                        "Content-Type": "application/json",
                        "Authorization": f"Bearer {api_key}",
                    },
                )
                if resp.status_code == 200:
                    data = resp.json()
                    reply = data.get("choices", [{}])[0].get("message", {}).get("content", "")
                    return JSONResponse(content={
                        "ok": True,
                        "message": f"连接成功！模型回复: {reply[:50]}",
                        "model": model,
                    })
                else:
                    error_msg = ""
                    try:
                        error_data = resp.json()
                        error_msg = error_data.get("error", {}).get("message", str(resp.text[:200]))
                    except:
                        error_msg = resp.text[:200]
                    return JSONResponse(content={
                        "ok": False,
                        "error": f"HTTP {resp.status_code}: {error_msg}",
                    })
        except Exception as e:
            return JSONResponse(content={"ok": False, "error": f"请求失败: {str(e)[:200]}"})

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

    # ---- 内置浏览器（学习自串串插件） ----

    class LaunchReq(BaseModel):
        url: str

    @router.get("/browser/status")
    async def browser_status():
        bm = BrowserManager.get_instance()
        return await _run_in_thread(bm.get_status)

    @router.post("/browser/launch")
    async def browser_launch(req: LaunchReq):
        bm = BrowserManager.get_instance()
        return await _run_in_thread(bm.launch, req.url)

    @router.post("/browser/close")
    async def browser_close():
        bm = BrowserManager.get_instance()
        return await _run_in_thread(bm.close)

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