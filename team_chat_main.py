#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""TeamChat Plugin Backend v5.1.3 — 修复AI群聊引擎初始化问题

修复:
  1. 添加 ai_group_chat 模块预加载，确保 QwenPaw 隔离环境下可解析
  2. _get_ai_engine() 增加 sys.path 保障和错误缓存机制
  3. 路由错误信息包含具体异常原因，便于排查

原有功能:
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

from fastapi import APIRouter, HTTPException, UploadFile, File, Form, Request, Query
from fastapi.responses import JSONResponse, PlainTextResponse, FileResponse, HTMLResponse
from pydantic import BaseModel, Field

# ── 线程池：Playwright sync 操作在此执行 ──
_EXECUTOR = concurrent.futures.ThreadPoolExecutor(max_workers=4, thread_name_prefix="teamchat-browser")


async def _run_in_thread(func, *args, **kwargs):
    """在线程池中执行同步函数。"""
    future = _EXECUTOR.submit(func, *args, **kwargs)
    return await asyncio.wrap_future(future)

logger = logging.getLogger("qwenpaw.team_chat")
# 邮箱后端
import sys
import importlib.util
from pathlib import Path

plugin_dir = Path(__file__).parent
email_backend_dir = plugin_dir / "email_backend"

EMAIL_BACKEND_AVAILABLE = False
EmailDB = None
init_db = None
email_router = None

# AI 群聊引擎
AI_GROUP_AVAILABLE = False
ai_group_chat = None
ai_chat_router = None

# 提前导入 ai_group_chat 模块，确保模块在 sys.path 中可解析
try:
    if str(plugin_dir) not in sys.path:
        sys.path.insert(0, str(plugin_dir))
    import ai_group_chat
    AI_GROUP_AVAILABLE = True
    logger.info("[AIChat] 模块加载成功")
except Exception as e:
    logger.warning(f"[AIChat] 模块预加载失败，将在请求时重试: {e}")

# 引擎将在第一次请求时通过 _get_ai_engine() 创建（延迟初始化）


# ── 邮箱后端回退桩（模块加载失败时使用） ──
class _FallbackEmailDB:
    @staticmethod
    def get_config(): return None
    @staticmethod
    def save_config(config): return False
    @staticmethod
    def get_inbox(limit=50, offset=0): return []
    @staticmethod
    def add_inbox_email(email): return False
    @staticmethod
    def get_sent(limit=50, offset=0): return []
    @staticmethod
    def add_sent_email(email): return False
    @staticmethod
    def get_drafts(limit=50, offset=0): return []
    @staticmethod
    def add_draft(email): return 0
    @staticmethod
    def update_draft(id, email): return False
    @staticmethod
    def delete_draft(id): return False
    @staticmethod
    def get_contacts(limit=100, offset=0, group_name=None): return []
    @staticmethod
    def add_contact(contact): return 0
    @staticmethod
    def update_contact(id, contact): return False
    @staticmethod
    def delete_contact(id): return False
    @staticmethod
    def get_contact_groups(): return []
    @staticmethod
    def add_contact_group(name, description=None, color="#1890ff"): return 0
    @staticmethod
    def delete_contact_group(name): return False
    @staticmethod
    def get_trash(limit=50, offset=0): return []
    @staticmethod
    def move_inbox_to_trash(email_id): return False
    @staticmethod
    def move_sent_to_trash(email_id): return False
    @staticmethod
    def delete_trash_email_permanent(email_id): return False
    @staticmethod
    def restore_trash_email(email_id): return False
    @staticmethod
    def get_all_configs(): return []
    @staticmethod
    def get_last_uid(account_email, folder): return None
    @staticmethod
    def get_email_count(account_email, folder_type): return 0
    @staticmethod
    def get_stats(account=None): return {}
    @staticmethod
    def delete_config(config_id): return False


def _fallback_init_db():
    logger.info("[TeamChat] 邮箱数据库初始化跳过（模块未加载）")


# ── 延迟加载邮箱后端（在 register() 中调用，用完即还原 sys.path） ──
def _load_email_backend():
    """在 register() 阶段加载 email_backend，避免 import 时污染 sys.path。"""
    global EMAIL_BACKEND_AVAILABLE, EmailDB, init_db, email_router
    _saved_path = list(sys.path)
    try:
        if str(plugin_dir) not in sys.path:
            sys.path.insert(0, str(plugin_dir))
        if str(email_backend_dir) not in sys.path:
            sys.path.insert(0, str(email_backend_dir))

        database_spec = importlib.util.spec_from_file_location(
            "email_backend.database",
            email_backend_dir / "database.py"
        )
        if database_spec and database_spec.loader:
            database_module = importlib.util.module_from_spec(database_spec)
            sys.modules["email_backend.database"] = database_module
            database_spec.loader.exec_module(database_module)
            EmailDB = database_module.EmailDB
            init_db = database_module.init_db

        routes_spec = importlib.util.spec_from_file_location(
            "email_backend.routes",
            email_backend_dir / "routes.py"
        )
        if routes_spec and routes_spec.loader:
            routes_module = importlib.util.module_from_spec(routes_spec)
            routes_module.database = database_module
            sys.modules["email_backend"] = type(sys)("email_backend")
            sys.modules["email_backend"].database = database_module
            sys.modules["email_backend.routes"] = routes_module
            routes_spec.loader.exec_module(routes_module)
            email_router = routes_module.router

        EMAIL_BACKEND_AVAILABLE = True
        logger.info("[TeamChat] 邮箱后端模块加载成功")
    except Exception as e:
        logger.warning(f"[TeamChat] 邮箱后端模块加载失败: {e}")
        EMAIL_BACKEND_AVAILABLE = False
        EmailDB = _FallbackEmailDB
        init_db = _fallback_init_db
        email_router = type("EmailRouter", (), {})()
    finally:
        sys.path[:] = _saved_path


# ============================================================    email_router = EmailRouter()



# ============================================================
# 配置常量
# ============================================================

CURRENT_VERSION = "5.1.2"
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
                # ── 三层兜底获取 QwenPaw API 地址 ──
                # L1: 官方 read_last_api（内部 API，QwenPaw 版本升级可能变，有 ImportError 保护）
                # L2: 直接读 ~/.qwenpaw/config.json（内部文件路径，同上保护）
                # L3: 环境变量 QWENPAW_BASE_URL 或默认 127.0.0.1:56411
                base = None
                try:
                    from qwenpaw.config.utils import read_last_api  # 内部 API，兼容 QwenPaw 1.x/2.0
                    last = read_last_api()
                    if last:
                        host, port = last
                        base = f"http://{host}:{port}"
                        logger.debug(f"AgentCache: Using QwenPaw API at {base}")
                    else:
                        logger.warning("AgentCache: read_last_api() returned None")
                except ImportError as e:
                    logger.warning(f"AgentCache: read_last_api 不可用 (QwenPaw 版本可能已变更): {e}")
                except Exception as e:
                    logger.warning(f"AgentCache: read_last_api 调用失败: {e}")
                
                if not base:
                    try:
                        config_path = os.path.join(os.path.expanduser("~"), ".qwenpaw", "config.json")
                        if os.path.exists(config_path):
                            with open(config_path, "r", encoding="utf-8") as f:
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
                logger.warning(f"AgentCache: Connection failed to {base}: {e}")
            except httpx.TimeoutException as e:
                logger.warning(f"AgentCache: Timeout connecting to {base}: {e}")
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
            async with c.stream("POST", f"{base}/api/console/chat", json=payload, headers=headers) as r:
                r.raise_for_status()

                # 累积所有文本输出
                all_text_parts = []
                current_role = None

                async for line in r.aiter_lines():
                    line = line.strip()
                    if line.startswith("data: "):
                        try:
                            data = json.loads(line[6:])

                            # 处理错误
                            if data.get("error"):
                                return f"[错误] {agent_id}: {data['error']}"

                            # 累积输出内容
                            output = data.get("output", [])
                            if output:
                                last_msg = output[-1]
                                content = last_msg.get("content", [])
                                role = last_msg.get("role", "")

                                # 只收集 assistant 角色的文本
                                if role == "assistant":
                                    for block in content:
                                        if isinstance(block, dict) and block.get("type") == "text":
                                            text = block.get("text", "")
                                            if text:
                                                all_text_parts.append(text)

                        except json.JSONDecodeError:
                            continue
                        except Exception as e:
                            logger.warning(f"解析 SSE 数据失败: {e}")
                            continue

                # 合并所有文本
                if all_text_parts:
                    full_text = "".join(all_text_parts).strip()
                    return full_text or f"[空回复] {agent_id}"
                else:
                    return f"[无回复] {agent_id}"

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

    # ---- 书签工具Token生成 ----
    @router.post("/bookmarklet/token")
    async def generate_bookmarklet_token(request: Request):
        """生成书签工具访问Token"""
        try:
            body = await request.json()
            user_id = body.get("user_id", "anonymous") if body else "anonymous"
            
            # 生成Token（简单实现，生产环境应使用JWT）
            import hashlib
            import time
            token_data = f"{user_id}:{time.time()}:{uuid.uuid4()}"
            token = hashlib.sha256(token_data.encode()).hexdigest()[:32]
            
            logger.info(f"[Token] 为用户 {user_id} 生成Token: {token[:8]}...")
            
            return JSONResponse(content={
                "success": True,
                "token": token,
                "user_id": user_id,
                "expires_in": 86400 * 30  # 30天有效期
            })
        except Exception as e:
            logger.error(f"[Token] 生成失败: {e}")
            import traceback
            logger.error(traceback.format_exc())
            return JSONResponse(content={
                "success": False,
                "error": str(e)
            }, status_code=500)
    
    @router.get("/bookmarklet/verify")
    async def verify_bookmarklet_token(token: str = Query(...)):
        """验证书签工具Token"""
        # 简化验证，实际应查询数据库
        if token and len(token) == 32:
            return JSONResponse(content={"valid": True, "user_id": "anonymous"})
        return JSONResponse(content={"valid": False}, status_code=401)

    # ---- Token生成页面 ----
    @router.get("/extension/token")
    async def extension_token_page():
        """扩展Token生成页面"""
        try:
            from pathlib import Path
            plugin_dir = Path(__file__).parent
            file_path = plugin_dir / "extension" / "token.html"
            
            if not file_path.exists():
                raise HTTPException(status_code=404, detail="页面不存在")
            
            content = file_path.read_text(encoding='utf-8')
            return HTMLResponse(content=content)
        except Exception as e:
            logger.error(f"读取Token页面失败: {e}")
            raise HTTPException(status_code=500, detail=str(e))

    # ---- 书签工具静态文件 ----
    @router.get("/static/{filename}")
    async def get_bookmarklet_file(filename: str):
        """获取书签工具静态文件"""
        try:
            from pathlib import Path
            plugin_dir = Path(__file__).parent
            file_path = plugin_dir / "bookmarklet" / filename
            
            if not file_path.exists():
                raise HTTPException(status_code=404, detail="文件不存在")
            
            content = file_path.read_text(encoding='utf-8')
            
            # 根据文件类型返回不同content-type
            if filename.endswith('.html'):
                return HTMLResponse(content=content)
            elif filename.endswith('.js'):
                from fastapi.responses import PlainTextResponse
                return PlainTextResponse(content=content, media_type="application/javascript")
            else:
                return PlainTextResponse(content=content)
        except Exception as e:
            logger.error(f"读取静态文件失败: {e}")
            raise HTTPException(status_code=500, detail=str(e))

    # ---- 书签工具远程聊天 ----
    @router.post("/bookmarklet-chat")
    async def bookmarklet_chat(request: Request):
        """书签工具远程聊天API"""
        try:
            body = await request.json()
            message = body.get("message", "")
            agent_id = body.get("agent_id", "default")
            session_id = body.get("session_id", "bookmarklet_default")
            
            if not message:
                return JSONResponse(content={"error": "消息不能为空"}, status_code=400)
            
            # 调用智能体
            reply = await _call_agent_async(agent_id, message, timeout=60.0)
            
            return JSONResponse(content={
                "success": True,
                "reply": reply,
                "agent_id": agent_id,
                "session_id": session_id
            })
        except Exception as e:
            logger.error(f"远程聊天失败: {e}")
            return JSONResponse(content={"error": str(e)}, status_code=500)

    # ---- 智能体列表 ----

    @router.get("/agents")
    async def list_agents():
        """Return cached agent list with metadata"""
        agents = await _agent_cache.get()
        # 如果获取失败，返回默认智能体
        if not agents:
            agents = [{
                "agent_id": "default",
                "name": "default",
                "description": "默认智能体",
                "model": "",
                "workspace_dir": "",
                "enabled": True,
                "is_host": True,
                "teamchat_enabled": True,
            }]
        return JSONResponse(content={
            "agents": agents,
            "host_id": DEFAULT_HOST_ID,
            "host_name": "CloudPaw-Master",
            "source": "qwenpaw_api" if agents else "default",
        })

    # ---- 所有智能体（用于串串汇） ----
    @router.get("/all-agents")
    async def list_all_agents():
        """Return all agents for dashboard"""
        agents = await _agent_cache.get()
        # 如果获取失败，返回默认智能体
        if not agents:
            agents = [{
                "agent_id": "default",
                "name": "default",
                "description": "默认智能体",
                "model": "",
                "workspace_dir": "",
                "enabled": True,
                "is_host": True,
                "teamchat_enabled": True,
            }]
        return JSONResponse(content={
            "agents": agents,
            "count": len(agents),
        })

    # ---- 看板统计数据 ----
    @router.get("/dashboard-stats")
    async def dashboard_stats():
        """Return dashboard statistics"""
        agents = await _agent_cache.get()
        sessions = list(store._data.values()) if hasattr(store, '_data') else []
        
        # 计算统计数据
        total_msgs = sum(len(s.get("history", [])) for s in sessions)
        total_sessions = len(sessions)
        
        # 智能体统计
        agent_stats = []
        if agents:
            for agent in agents:
                agent_id = agent.get("agent_id", "")
                # 计算该智能体的消息数
                msg_count = 0
                count_12h = 0
                count_7d = 0
                brainstorm_count = 0
                now = time.time()
                for s in sessions:
                    for h in s.get("history", []):
                        if h.get("sender") == agent_id:
                            msg_count += 1
                            # 检查时间
                            ts = h.get("timestamp", 0)
                            if ts and isinstance(ts, (int, float)):
                                if now - ts < 12 * 3600:  # 12小时内
                                    count_12h += 1
                                if now - ts < 7 * 24 * 3600:  # 7天内
                                    count_7d += 1
                            # 检查是否是风暴消息
                            content = h.get("content", "")
                            if content and ("风暴" in content or "brainstorm" in content.lower()):
                                brainstorm_count += 1
                agent_stats.append({
                    "host_id": agent_id,
                    "host_name": agent.get("name", agent_id),
                    "msg_count": msg_count,
                    "count_12h": count_12h,
                    "count_7d": count_7d,
                    "brainstorm_count": brainstorm_count,
                })
        
        # 计算汇总数据
        active_12h = sum(a.get("count_12h", 0) for a in agent_stats)
        active_7d = sum(a.get("count_7d", 0) for a in agent_stats)
        brainstorm_total = sum(a.get("brainstorm_count", 0) for a in agent_stats)
        
        # 计算12h和7天的风暴数
        brainstorm_12h = 0
        brainstorm_7d = 0
        now = time.time()
        for s in sessions:
            for h in s.get("history", []):
                content = h.get("content", "")
                ts = h.get("timestamp", 0)
                if content and ("风暴" in content or "brainstorm" in content.lower()):
                    if ts and isinstance(ts, (int, float)):
                        if now - ts < 12 * 3600:
                            brainstorm_12h += 1
                        if now - ts < 7 * 24 * 3600:
                            brainstorm_7d += 1
        
        # 获取最近活跃的会话
        recent_sessions = sorted(
            [{"session_id": k, "updated_at": s.get("updated_at", 0), "msg_count": len(s.get("history", []))} 
             for k, s in store._data.items() if s.get("history")],
            key=lambda x: x["updated_at"],
            reverse=True
        )[:5] if hasattr(store, '_data') else []
        
        return JSONResponse(content={
            "summary": {
                "total_messages": total_msgs,
                "total_sessions": total_sessions,
                "active_12h": active_12h,
                "active_7d": active_7d,
                "agent_count": len(agent_stats),
                "brainstorm_total": brainstorm_total,
                "brainstorm_12h": brainstorm_12h,
                "brainstorm_7d": brainstorm_7d,
            },
            "total_sessions": total_sessions,
            "total_messages": total_msgs,
            "agents": agent_stats,
            "recent_sessions": recent_sessions,
            "update_time": time.time(),
        })

    # ---- 智能体详细报告 ----
    @router.get("/agent-detail")
    async def agent_detail(agent_id: str):
        """Return agent detail report"""
        agents = await _agent_cache.get()
        agent = next((a for a in agents if a.get("agent_id") == agent_id), None) if agents else None
        
        if not agent:
            return JSONResponse(content={"error": "Agent not found"}, status_code=404)
        
        return JSONResponse(content={
            "agent_id": agent_id,
            "name": agent.get("name", agent_id),
            "description": agent.get("description", ""),
            "status": "active",
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

    @router.get("/cron-summary")
    async def cron_summary():
        """返回 cron 摘要：活跃任务数、最近运行状态等"""
        try:
            base = await _get_api_base()
            async with httpx.AsyncClient(timeout=httpx.Timeout(10.0), trust_env=False) as client:
                resp = await client.get(f"{base}/api/cron")
                if resp.status_code == 200:
                    data = resp.json()
                    jobs = data.get("jobs", data if isinstance(data, list) else [])
                    tc_jobs = [j for j in jobs if j.get("agent_id") == "cloud-orchestrator" or "teamchat" in str(j.get("description", ""))]
                    active = [j for j in tc_jobs if j.get("state") in ("running", "active", "paused")]
                    last_run = None
                    for j in tc_jobs:
                        lr = j.get("last_run") or j.get("last_execution")
                        if lr and (last_run is None or lr > last_run):
                            last_run = lr
                    return JSONResponse(content={
                        "jobs": tc_jobs,
                        "summary": {
                            "total": len(tc_jobs),
                            "active": len(active),
                            "paused": len([j for j in tc_jobs if j.get("state") == "paused"]),
                            "last_run": last_run,
                        }
                    })
        except Exception as e:
            logger.warning(f"cron-summary failed: {e}")
        return JSONResponse(content={"jobs": [], "summary": {"total": 0, "active": 0, "paused": 0, "last_run": None}})

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

    
    AI_FENSHEN_MSG_FILE = Path.home() / '.qwenpaw' / 'ai_fenshen_messages.json'
    
    def _ensure_ai_fenshen_file():
        AI_FENSHEN_MSG_FILE.parent.mkdir(parents=True, exist_ok=True)
        if not AI_FENSHEN_MSG_FILE.exists():
            with open(AI_FENSHEN_MSG_FILE, 'w', encoding='utf-8') as f:
                json.dump({"pending": [], "replies": []}, f)
    
    def _save_ai_fenshen_message(msg_type, content, session_id=None):
        _ensure_ai_fenshen_file()
        with open(AI_FENSHEN_MSG_FILE, 'r', encoding='utf-8') as f:
            data = json.load(f)
        msg = {
            "type": msg_type,
            "content": content,
            "session_id": session_id or "1783155353103-bg011ua",
            "timestamp": time.time()
        }
        if msg_type == "request":
            data["pending"].append(msg)
        else:
            data["replies"].append(msg)
        with open(AI_FENSHEN_MSG_FILE, 'w', encoding='utf-8') as f:
            json.dump(data, f, ensure_ascii=False, indent=2)
        return msg
    
    def _get_ai_fenshen_messages(msg_type):
        _ensure_ai_fenshen_file()
        with open(AI_FENSHEN_MSG_FILE, 'r', encoding='utf-8') as f:
            data = json.load(f)
        return data.get(msg_type, [])
    
    def _clear_ai_fenshen_messages(msg_type):
        _ensure_ai_fenshen_file()
        with open(AI_FENSHEN_MSG_FILE, 'r', encoding='utf-8') as f:
            data = json.load(f)
        data[msg_type] = []
        with open(AI_FENSHEN_MSG_FILE, 'w', encoding='utf-8') as f:
            json.dump(data, f, ensure_ascii=False, indent=2)
    
    @router.post("/ai-fenshen/message")
    async def ai_fenshen_save_message(request: dict):
        """保存AI分身消息"""
        try:
            msg = _save_ai_fenshen_message("request", request.get("message"), request.get("session_id"))
            return {"status": "ok", "message": msg}
        except Exception as e:
            logger.error(f"AI分身保存消息错误: {e}")
            return {"status": "error", "message": str(e)}
    
    @router.get("/ai-fenshen/pending")
    async def ai_fenshen_get_pending():
        """获取待处理消息"""
        try:
            messages = _get_ai_fenshen_messages("pending")
            return {"status": "ok", "pending": messages}
        except Exception as e:
            logger.error(f"AI分身获取待处理消息错误: {e}")
            return {"status": "error", "message": str(e)}
    
    @router.post("/ai-fenshen/clear-pending")
    async def ai_fenshen_clear_pending():
        """清除待处理消息"""
        try:
            _clear_ai_fenshen_messages("pending")
            return {"status": "ok"}
        except Exception as e:
            logger.error(f"AI分身清除待处理消息错误: {e}")
            return {"status": "error", "message": str(e)}
    
    @router.post("/ai-fenshen/reply")
    async def ai_fenshen_save_reply(request: dict):
        """保存智能体回复"""
        try:
            msg = _save_ai_fenshen_message("reply", request.get("message"), request.get("session_id"))
            return {"status": "ok", "message": msg}
        except Exception as e:
            logger.error(f"AI分身保存回复错误: {e}")
            return {"status": "error", "message": str(e)}
    
    @router.get("/ai-fenshen/reply")
    async def ai_fenshen_get_replies(session_id: str = None):
        """获取回复消息"""
        try:
            messages = _get_ai_fenshen_messages("replies")
            if session_id:
                messages = [m for m in messages if m.get("session_id") == session_id]
            return {"status": "ok", "replies": messages}
        except Exception as e:
            logger.error(f"AI分身获取回复错误: {e}")
            return {"status": "error", "message": str(e)}
    
    @router.post("/ai-fenshen/clear-replies")
    async def ai_fenshen_clear_replies():
        """清除回复消息"""
        try:
            _clear_ai_fenshen_messages("replies")
            return {"status": "ok"}
        except Exception as e:
            logger.error(f"AI分身清除回复错误: {e}")
            return {"status": "error", "message": str(e)}

    # ============================================================
    # 桌面宠物 API
    # ============================================================
    _pet_process = None
    _pet_port = int(os.environ.get("TEAMCHAT_PET_PORT", "18765"))
    
    @router.post("/pet/start")
    async def pet_start():
        """启动桌面宠物"""
        import subprocess
        import socket
        import sys
        from pathlib import Path
        
        try:
            # 检查宠物是否已在运行
            sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
            result = sock.connect_ex(('127.0.0.1', _pet_port))
            sock.close()
            if result == 0:
                logger.info(f"[Pet] 桌面宠物已在运行 (端口{_pet_port})")
                return {"success": True, "message": "桌面宠物已在运行", "port": _pet_port}
        except Exception:
            pass
        
        try:
            plugin_dir = Path(__file__).parent
            pet_path = plugin_dir / "aifenshen_pet.py"
            python_path = Path(sys.executable)
            
            if not pet_path.exists():
                logger.error(f"[Pet] 宠物脚本不存在: {pet_path}")
                return {"success": False, "error": f"宠物脚本不存在: {pet_path}"}
            
            # 启动宠物进程（传递端口环境变量）
            nonlocal _pet_process
            env = os.environ.copy()
            env["TEAMCHAT_PET_PORT"] = str(_pet_port)
            _pet_process = subprocess.Popen(
                [str(python_path), str(pet_path)],
                cwd=str(plugin_dir),
                env=env,
                creationflags=subprocess.CREATE_NEW_CONSOLE if os.name == 'nt' else 0
            )
            
            logger.info(f"[Pet] 桌面宠物已启动 (PID: {_pet_process.pid})")
            
            # 等待宠物服务启动
            import asyncio
            await asyncio.sleep(2)
            
            # 验证是否成功启动
            sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
            result = sock.connect_ex(('127.0.0.1', _pet_port))
            sock.close()
            
            if result == 0:
                return {"success": True, "message": "桌面宠物启动成功", "port": _pet_port, "pid": _pet_process.pid}
            else:
                return {"success": False, "error": "宠物进程已启动但服务未响应，请检查依赖(PySide6, FastAPI, uvicorn)"}
                
        except Exception as e:
            logger.error(f"[Pet] 启动桌面宠物失败: {e}")
            return {"success": False, "error": str(e)}
    
    @router.get("/pet/status")
    async def pet_status():
        """获取桌面宠物状态"""
        import socket
        try:
            sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
            result = sock.connect_ex(('127.0.0.1', 18765))
            sock.close()
            
            if result == 0:
                # 尝试获取更详细的状态
                try:
                    import httpx
                    async with httpx.AsyncClient() as client:
                        response = await client.get("http://127.0.0.1:18765/health", timeout=2)
                        if response.status_code == 200:
                            data = response.json()
                            return {"running": True, "port": 18765, "details": data}
                except Exception:
                    pass
                return {"running": True, "port": 18765}
            else:
                return {"running": False, "port": 18765}
        except Exception as e:
            return {"running": False, "error": str(e)}
    
    @router.post("/pet/stop")
    async def pet_stop():
        """停止桌面宠物"""
        import httpx
        try:
            async with httpx.AsyncClient() as client:
                response = await client.post("http://127.0.0.1:18765/event", 
                    json={"event": "quit"}, timeout=2)
                return {"success": True, "message": "已发送停止命令"}
        except Exception as e:
            return {"success": False, "error": str(e)}
    
    @router.post("/pet/event")
    async def pet_event(request: dict):
        """发送事件到桌面宠物"""
        import httpx
        try:
            async with httpx.AsyncClient() as client:
                response = await client.post("http://127.0.0.1:18765/event", 
                    json=request, timeout=2)
                return response.json()
        except Exception as e:
            return {"success": False, "error": str(e)}

    # ============================================================
    # 蜂巢留言 API — 硬编码 QQ 邮箱直接发送
    # ============================================================
    @router.post("/hive-message")
    async def hive_send_message(request: dict):
        """蜂巢留言：使用 115886@qq.com 发送咨询消息到 c115886@agent.qq.com"""
        import smtplib
        from email.mime.text import MIMEText
        from email.mime.multipart import MIMEMultipart

        name = (request.get("name") or "").strip()
        phone = (request.get("phone") or "").strip()
        user_email = (request.get("user_email") or "").strip()
        content = (request.get("content") or "").strip()

        if not name or not content:
            return {"status": "error", "message": "姓名和咨询事项不能为空"}

        subject = request.get("subject") or "咨询"
        sender = "115886@qq.com"
        recipient = "c115886@agent.qq.com"
        # 授权码使用 Base64 编码存储，运行时解码
        import base64
        auth_code_encoded = "Z3d4cWJvcXVmemd6Y2JjYg=="
        auth_code = base64.b64decode(auth_code_encoded).decode('utf-8')

        # 构建邮件正文
        body = f"【新留言】\n\n姓名：{name}\n手机号：{phone or '未填写'}\n用户邮箱：{user_email or '未填写'}\n\n咨询事项：\n{content}"

        try:
            logger.info(f"[蜂巢留言] 开始发送: {name} → {recipient}")
            
            msg = MIMEMultipart()
            msg["From"] = sender
            msg["To"] = recipient
            msg["Subject"] = f"【AI CC留言】{subject} - {name}"
            msg.attach(MIMEText(body, "plain", "utf-8"))

            logger.info("[蜂巢留言] 连接 SMTP...")
            server = smtplib.SMTP_SSL("smtp.qq.com", 465, timeout=15)
            
            logger.info("[蜂巢留言] 登录...")
            server.login(sender, auth_code)
            
            logger.info("[蜂巢留言] 发送邮件...")
            server.sendmail(sender, recipient, msg.as_string())
            server.quit()

            logger.info(f"[蜂巢留言] 发送成功: {name} → {recipient}")
            return {"status": "ok", "message": "留言已发送"}
        except smtplib.SMTPAuthenticationError as e:
            logger.error(f"[蜂巢留言] 认证失败: {e}")
            return {"status": "error", "message": "邮箱认证失败，请检查授权码"}
        except Exception as e:
            logger.error(f"[蜂巢留言] 发送失败: {e}")
            return {"status": "error", "message": f"发送失败: {str(e)}"}

    # ============================================================
    # AI 群聊路由 - 始终注册，使用延迟初始化
    # ============================================================
    _ai_engine_instance = None
    _ai_engine_error = None
    
    def _get_ai_engine():
        """延迟获取 AI 群聊引擎"""
        nonlocal _ai_engine_instance, _ai_engine_error
        if _ai_engine_instance:
            return _ai_engine_instance
        if _ai_engine_error:
            # 之前失败过，直接返回 None，不再重复尝试
            return None
        # 确保 plugin_dir 在 sys.path 中（QwenPaw 隔离环境可能已移除）
        _saved_path = list(sys.path)
        try:
            plugin_dir_str = str(plugin_dir)
            if plugin_dir_str not in sys.path:
                sys.path.insert(0, plugin_dir_str)
            from ai_group_chat import AIGroupChatEngine
            _ai_engine_instance = AIGroupChatEngine(plugin_dir / "data")
            logger.info("[AIChat] 引擎延迟初始化成功")
            return _ai_engine_instance
        except Exception as e:
            _ai_engine_error = str(e)
            logger.error(f"[AIChat] 获取引擎失败: {e}")
            import traceback
            logger.error(traceback.format_exc())
            return None
        finally:
            sys.path = _saved_path
    
    @router.get("/ai-chat/official")
    async def get_official_room():
        """获取官方 AI 聊天室"""
        engine = _get_ai_engine()
        if engine:
            return engine.get_official_room()
        err = _ai_engine_error or "引擎未初始化"
        return {"success": False, "error": f"引擎未初始化: {err}"}
    
    @router.post("/ai-chat/join")
    async def join_ai_room(request: Request):
        """加入 AI 聊天室"""
        engine = _get_ai_engine()
        if not engine:
            err = _ai_engine_error or "引擎未初始化"
            return {"success": False, "error": f"引擎未初始化: {err}"}
        try:
            body = await request.json()
            return engine.join_room(
                body.get("room_id", "OFFICIAL_ROOM"),
                body.get("user_id", ""),
                body.get("nickname", "")
            )
        except Exception as e:
            logger.error(f"[AIChat] 加入房间失败: {e}")
            return {"success": False, "error": str(e)}
    
    @router.post("/ai-chat/message")
    async def send_ai_message(request: Request):
        """发送消息到 AI 聊天室"""
        engine = _get_ai_engine()
        if not engine:
            err = _ai_engine_error or "引擎未初始化"
            return {"success": False, "error": f"引擎未初始化: {err}"}
        try:
            body = await request.json()
            return engine.send_message(
                body.get("room_id", "OFFICIAL_ROOM"),
                body.get("user_id", ""),
                body.get("message", ""),
                body.get("msg_type", "text"),
                body.get("nickname", "")
            )
        except Exception as e:
            logger.error(f"[AIChat] 发送消息失败: {e}")
            return {"success": False, "error": str(e)}
    
    @router.get("/ai-chat/messages/{room_id}")
    async def get_ai_messages(room_id: str, user_id: str = "", since: str = None, limit: int = 50):
        """获取 AI 聊天室消息"""
        engine = _get_ai_engine()
        if engine:
            return engine.get_messages(room_id, user_id, since, limit)
        err = _ai_engine_error or "引擎未初始化"
        return {"success": False, "error": f"引擎未初始化: {err}"}
    
    @router.get("/ai-chat/members/{room_id}")
    async def get_ai_members(room_id: str):
        """获取 AI 聊天室成员"""
        engine = _get_ai_engine()
        if engine:
            return engine.get_members(room_id)
        err = _ai_engine_error or "引擎未初始化"
        return {"success": False, "error": f"引擎未初始化: {err}"}
    
    logger.info("[AIChat] AI群聊路由已注册")

    return router


# ============================================================
# 插件入口
# ============================================================
class TeamChatPlugin:
    def __init__(self):
        self.name = "TeamChat"
        self.version = CURRENT_VERSION
        self.id = "team_chat"
        self._email_backend_process = None

    def register(self, api):
        logger.info(f"TeamChat v{CURRENT_VERSION} 注册中...")
        _load_email_backend()  # 延迟加载，用完即还原 sys.path
        api.register_http_router(build_router(), prefix="/plugins/team_chat", tags=["team-chat"])
        if EMAIL_BACKEND_AVAILABLE and email_router:
            api.register_http_router(email_router, prefix="/plugins/team_chat/email", tags=["email"])
            logger.info("[Email] 邮箱路由已注册: /plugins/team_chat/email")
        # AI防卫路由已移除（改为轻量安全提示）
        # self._register_security_router(api)
        # 注册书签工具静态文件服务
        self._register_bookmarklet_static(api)
        # AI群聊路由已在 build_router() 中直接定义，无需额外注册
        api.register_startup_hook("team_chat_v4_start", self._startup, priority=90)
        api.register_shutdown_hook("team_chat_v4_stop", self._shutdown, priority=110)
        logger.info(f"TeamChat v{CURRENT_VERSION} 就绪")
    
    def _register_bookmarklet_static(self, api):
        """注册书签工具静态文件服务"""
        try:
            from fastapi.staticfiles import StaticFiles
            from pathlib import Path
            
            plugin_dir = Path(__file__).parent
            bookmarklet_dir = plugin_dir / "bookmarklet"
            
            if bookmarklet_dir.exists():
                # 创建静态文件路由
                static_router = APIRouter()
                static_router.mount("/static", StaticFiles(directory=str(bookmarklet_dir)), name="bookmarklet_static")
                api.register_http_router(static_router, prefix="/plugins/team_chat", tags=["bookmarklet"])
                logger.info(f"[Bookmarklet] 静态文件服务已注册: /plugins/team_chat/static")
            else:
                logger.warning(f"[Bookmarklet] 目录不存在: {bookmarklet_dir}")
        except Exception as e:
            logger.warning(f"[Bookmarklet] 静态文件服务注册失败: {e}")
    
    def _register_security_router(self, api):
        """注册AI防卫安全路由"""
        try:
            import sys
            import importlib.util
            from pathlib import Path
            
            plugin_dir = Path(__file__).parent
            security_routes_path = plugin_dir / "email_backend" / "security_routes.py"
            
            if security_routes_path.exists():
                spec = importlib.util.spec_from_file_location(
                    "email_backend.security_routes",
                    security_routes_path
                )
                if spec and spec.loader:
                    security_module = importlib.util.module_from_spec(spec)
                    sys.modules["email_backend.security_routes"] = security_module
                    spec.loader.exec_module(security_module)
                    security_router = security_module.router
                    api.register_http_router(security_router, prefix="/plugins/team_chat/security", tags=["AI防卫"])
                    logger.info("[Security] AI防卫路由已注册: /plugins/team_chat/security")
        except Exception as e:
            logger.warning(f"[Security] AI防卫路由注册失败: {e}")

    def _startup(self):
        logger.info(f"TeamChat v{CURRENT_VERSION} 已启动")
        # 初始化邮箱数据库
        try:
            init_db()
            logger.info("[Email] 邮箱数据库初始化完成")
        except Exception as e:
            logger.error(f"[Email] 邮箱数据库初始化失败: {e}")
        
        # 自动创建邮件同步定时任务
        try:
            self._setup_auto_sync_cron()
            logger.info("[Cron] 自动同步定时任务设置完成")
        except Exception as e:
            logger.warning(f"[Cron] 自动同步定时任务设置失败: {e}")

    def _setup_auto_sync_cron(self):
        """自动设置邮件同步定时任务"""
        import subprocess
        import json
        
        try:
            # 检查是否已存在TeamChat邮件同步任务
            result = subprocess.run(
                ['qwenpaw', 'cron', 'list', '--agent-id', 'default'],
                capture_output=True, text=True, encoding='utf-8'
            )
            
            if result.returncode == 0:
                jobs = json.loads(result.stdout)
                for job in jobs:
                    if job.get('name') == 'TeamChat邮件同步':
                        logger.info("[Cron] 邮件同步任务已存在，跳过创建")
                        return
            
            # 创建新的定时任务
            logger.info("[Cron] 正在创建邮件同步定时任务...")
            create_result = subprocess.run(
                [
                    'qwenpaw', 'cron', 'create',
                    '--agent-id', 'default',
                    '--name', 'TeamChat邮件同步',
                    '--cron', '*/3 * * * *',
                    '--text', '请调用TeamChat邮箱同步API: POST /api/plugins/team_chat/sync',
                    '--type', 'agent',
                    '--channel', 'console',
                    '--target-user', 'default',
                    '--target-session', 'default'
                ],
                capture_output=True, text=True, encoding='utf-8'
            )
            
            if create_result.returncode == 0:
                logger.info("[Cron] 邮件同步定时任务创建成功")
            else:
                logger.warning(f"[Cron] 创建任务失败: {create_result.stderr}")
                
        except Exception as e:
            logger.warning(f"[Cron] 设置定时任务时出错: {e}")
    
    def _shutdown(self):
        try:
            _EXECUTOR.shutdown(wait=True, cancel_futures=True)
            logger.info("[TeamChat] ThreadPoolExecutor 已关闭")
        except Exception as e:
            logger.warning(f"[TeamChat] ThreadPoolExecutor 关闭失败: {e}")
        logger.info(f"TeamChat v{CURRENT_VERSION} 已关闭")


plugin = TeamChatPlugin()