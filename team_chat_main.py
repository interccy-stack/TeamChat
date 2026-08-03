#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""TeamChat Plugin Backend v5.3.6 — 双注册模式 · AI决策历史关联

修复:
  1. AI群聊支持文件上传/下载/预览
  2. 智能体产物（代码、文档、图片）可保存和下载
  3. 支持图片、PDF、代码文件在线预览
  4. 文件元数据持久化存储
  5. 热重载支持 - 文件变更自动检测，无需重启

原有功能:
  1. POST /upload — 文件上传
  2. POST /chat — 返回前先存session
  3. DELETE /session/{id} — 删除会话
  4. PUT /session/{id}/tag — 标签
  5. PUT /session/{id}/pin — 置顶/取消
  6. GET /sessions?search= — 搜索
  7. POST /avatar — 头像上传
  8. 前端智能体图标缩放功能
  9. 右下角支持链接区域
  10. 修复 Python 3.12+ imghdr 兼容性问题
  11. 删除五子棋功能
  12. AI群聊智能体动态管理（v5.1.4）
  13. AI群聊上下文感知（v5.1.5）
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

# ── 尝试导入官方智能体管理工具 ──
_OFFICIAL_AGENT_API_AVAILABLE = False
try:
    from qwenpaw.agents.tools.agent_management import list_agents_data
    _OFFICIAL_AGENT_API_AVAILABLE = True
    logger.info("[Agent] 官方智能体管理工具已加载")
except ImportError:
    logger.warning("[Agent] 官方智能体管理工具不可用，使用 HTTP API 回退")

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

CURRENT_VERSION = "5.3.6"
DEFAULT_HOST_ID = "cloud-orchestrator"
MAX_HISTORY = 200
SESSION_KEEPALIVE_DAYS = 7
SESSION_MAX = 1000

# 插件目录
CURRENT_DIR = os.path.dirname(os.path.abspath(__file__))

# 已安装版本标记文件：register() 据此判断 升级 / 跳过 / 降级
# 说明：QwenPaw 的 api 未暴露“查询已注册插件版本”的接口，故用本地标记文件
#       记录本插件上次成功注册的版本号，作为后续 register() 比较的依据。
INSTALLED_VERSION_FILE = os.path.join(CURRENT_DIR, "data", ".installed_version")


def _parse_version(v):
    """将 'v5.3.3' / '5.3.3' / '5.3.3-beta' 解析为 (5, 3, 3) 元组，便于比较大小"""
    if not v:
        return (0, 0, 0)
    s = str(v).strip().lstrip("vV")
    nums = []
    for part in s.split("."):
        dig = "".join(ch for ch in part if ch.isdigit())
        nums.append(int(dig) if dig else 0)
    nums = (nums + [0, 0, 0])[:3]
    return tuple(nums)


def _read_installed_version():
    """读取上次成功注册后记录的版本号；不存在则返回 None（视为首次安装）"""
    try:
        with open(INSTALLED_VERSION_FILE, "r", encoding="utf-8") as f:
            return json.load(f).get("version")
    except Exception:
        return None


def _write_installed_version():
    """注册成功后持久化当前版本号，作为后续 register() 比较的依据"""
    # 【永久修复】禁用版本守卫文件写入，避免每次重启都跳过注册
    # 原版本守卫机制导致：注册成功→写入文件→下次重启→发现文件→版本相同→跳过注册→路由全部404
    # 现在改为：每次重启都正常注册，确保路由始终可用
    pass


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
                # 只加载有效的会话文件（排除 ai_decision_*.json 等非会话文件）
                if sid.startswith("ai_decision"):
                    continue
                try:
                    with open(os.path.join(self.data_dir, fname), "r", encoding="utf-8") as f:
                        data = json.load(f)
                        # 只加载字典类型的会话数据
                        if isinstance(data, dict):
                            self._sessions[sid] = data
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
        """刷新智能体列表 - 兼容云端版和桌面版 QwenPaw"""
        async with self._lock:
            now = time.time()
            if now - self._last_refresh <= 30:
                return
            
            try:
                # 获取 QwenPaw API 基础 URL（兼容云端和桌面）
                base_urls = await self._get_qwenpaw_base_urls()
                
                headers = {"Content-Type": "application/json"}
                if api_key := os.environ.get("QWENPAW_API_KEY"):
                    headers["Authorization"] = f"Bearer {api_key}"
                
                # 尝试所有可能的 URL
                for base in base_urls:
                    try:
                        url = f"{base}/api/agents"
                        logger.debug(f"AgentCache: Trying {url}")
                        
                        async with httpx.AsyncClient(timeout=httpx.Timeout(5.0), trust_env=False) as client:
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
                                logger.info(f"AgentCache: Successfully loaded {len(result)} agents from {url}")
                                return  # 成功后直接返回
                            else:
                                logger.debug(f"AgentCache: HTTP {resp.status_code} from {url}")
                    except httpx.ConnectError as e:
                        logger.debug(f"AgentCache: Connection failed for {base}: {e}")
                    except httpx.TimeoutException as e:
                        logger.debug(f"AgentCache: Timeout for {base}: {e}")
                    except Exception as e:
                        logger.debug(f"AgentCache: Error for {base}: {type(e).__name__}: {e}")
                
                logger.warning(f"AgentCache: All base URLs failed, keeping cached data")
                
            except Exception as e:
                logger.warning(f"AgentCache refresh failed: {type(e).__name__}: {e}")
    
    async def _get_qwenpaw_base_urls(self) -> List[str]:
        """获取所有可能的 QwenPaw API 基础 URL（云端+桌面）"""
        urls = []
        
        # 1. 从环境变量获取（云端版通常配置）
        if qp_base := os.environ.get("QWENPAW_API_BASE"):
            urls.append(qp_base.rstrip('/'))
            logger.debug(f"AgentCache: Added URL from QWENPAW_API_BASE: {qp_base}")
        
        # 2. 从配置文件获取（桌面版）
        try:
            config_paths = [
                os.path.expanduser("~/.qwenpaw/config.json"),
                os.path.expanduser("~/.qwenpaw/settings.json"),
            ]
            for config_path in config_paths:
                if os.path.exists(config_path):
                    with open(config_path, 'r', encoding='utf-8') as f:
                        config = json.load(f)
                        # 尝试多种可能的配置键
                        if port := config.get("port"):
                            urls.append(f"http://127.0.0.1:{port}")
                        if api_url := config.get("api_url"):
                            urls.append(api_url.rstrip('/'))
                        if base_url := config.get("base_url"):
                            urls.append(base_url.rstrip('/'))
                        logger.debug(f"AgentCache: Read config from {config_path}")
                        break
        except Exception as e:
            logger.debug(f"AgentCache: Failed to read config: {e}")
        
        # 3. 尝试检测本地端口（桌面版动态端口）
        # 常见端口列表，按优先级排序
        common_ports = [8088, 8000, 3000, 5000, 56411, 64987]
        
        # 先快速检测哪些端口可用
        for port in common_ports:
            try:
                test_url = f"http://127.0.0.1:{port}/api/agents"
                async with httpx.AsyncClient(timeout=httpx.Timeout(1.0)) as client:
                    resp = await client.get(test_url)
                    if resp.status_code == 200:
                        urls.append(f"http://127.0.0.1:{port}")
                        logger.debug(f"AgentCache: Detected working port: {port}")
                        break  # 找到一个可用的就停止
            except:
                continue
        
        # 4. 添加默认 URL（云端版）
        urls.append("http://127.0.0.1:8088")
        
        # 去重并保持顺序
        seen = set()
        unique_urls = []
        for url in urls:
            if url not in seen:
                seen.add(url)
                unique_urls.append(url)
        
        logger.info(f"AgentCache: Will try {len(unique_urls)} base URLs: {unique_urls}")
        return unique_urls


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
            raise HTTPException(500, "浏览器功能需要可选依赖 playwright。请在终端执行: pip install playwright && playwright install chromium")
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
# AI投票路由（必须在build_router之前定义）
# ============================================================
ai_voting_router = APIRouter()

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
            
            # 尝试多个目录：bookmarklet 或 frontend/dist/static
            file_path = plugin_dir / "bookmarklet" / filename
            if not file_path.exists():
                file_path = plugin_dir / "frontend" / "dist" / "static" / filename
            
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

    # ---- 媒体文件服务（鸟巢图片等） ----
    @router.get("/media/{filename}")
    async def get_media_file(filename: str):
        """获取媒体文件（鸟巢图片等）"""
        try:
            from pathlib import Path
            from fastapi.responses import FileResponse
            
            plugin_dir = Path(__file__).parent
            media_dir = plugin_dir / "media"
            file_path = media_dir / filename
            
            # 安全检查：确保文件在media目录下
            if not file_path.exists():
                raise HTTPException(status_code=404, detail="文件不存在")
            
            # 检查文件是否在允许的目录中
            try:
                file_path.relative_to(media_dir)
            except ValueError:
                raise HTTPException(status_code=403, detail="访问被拒绝")
            
            # 根据文件类型返回
            if filename.endswith('.svg'):
                content = file_path.read_text(encoding='utf-8')
                return PlainTextResponse(content=content, media_type="image/svg+xml")
            else:
                return FileResponse(str(file_path))
        except HTTPException:
            raise
        except Exception as e:
            logger.error(f"读取媒体文件失败: {e}")
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
    
    # 注册 AI 群聊路由（所有路由都在 ai_group_chat.py 中定义）
    if ai_group_chat and hasattr(ai_group_chat, 'ai_chat_router'):
        try:
            router.include_router(ai_group_chat.ai_chat_router, prefix="/ai-chat", tags=["ai-chat"])
            logger.info("[AIChat] AI群聊路由已注册")
        except Exception as e:
            logger.warning(f"[AIChat] AI群聊路由注册失败: {e}")
    else:
        logger.warning("[AIChat] ai_group_chat 模块未加载，跳过路由注册")

    # ── 邮箱同步 API ──────────────────────────────────────────────────────
    @router.post("/sync")
    async def team_chat_sync(config_id: Optional[int] = None):
        """邮件同步入口，转发到 email_backend 同步逻辑"""
        if not EMAIL_BACKEND_AVAILABLE:
            return JSONResponse(
                content={"success": False, "message": "邮箱后端未加载"},
                status_code=503
            )
        try:
            import sys as _sys
            _routes_mod = _sys.modules.get("email_backend.routes")
            if _routes_mod and hasattr(_routes_mod, "do_sync_emails"):
                return await _routes_mod.do_sync_emails(config_id)
            # fallback: 自行实现简化版
            configs = [EmailDB.get_config(config_id)] if config_id else EmailDB.get_all_configs()
            if not configs:
                return {"success": False, "message": "没有邮箱配置"}
            return {"success": True, "message": "同步功能就绪，但路由代理未完整加载"}
        except Exception as e:
            logger.error(f"[Sync] 同步失败: {e}")
            return JSONResponse(
                content={"success": False, "message": f"同步失败: {str(e)}"},
                status_code=500
            )

    # ---- PawApp 入口页面 ----
    @router.get("/app")
    async def app_entry(request: Request):
        """PawApp 应用栏目入口 - 返回嵌入页面"""
        html_content = '''<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>TeamChat</title>
    <style>
        body { margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; }
        #root { width: 100%; height: 100vh; }
    </style>
</head>
<body>
    <div id="root"></div>
    <script>
        // PawApp 上下文检测
        window.isPawApp = typeof window.paw !== 'undefined' || typeof window.QwenPaw !== 'undefined';
        console.log('[TeamChat] PawApp mode:', window.isPawApp);
    </script>
</body>
</html>'''
        return HTMLResponse(content=html_content)

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
        # ── 版本守卫：处理“之前安装过同名插件但未用 --force”的情形 ──
        # 已安装版本 < 当前 → 升级注册；== 当前 → 跳过重复注册；> 当前 → 跳过降级。
        # 强制重注册：设置环境变量 TEAMCHAT_FORCE_REGISTER=1，或删除 data/.installed_version 后重启。
        force = os.environ.get("TEAMCHAT_FORCE_REGISTER", "").strip() in ("1", "true", "yes")
        installed = _read_installed_version()
        if not force and installed:
            cur, old = _parse_version(CURRENT_VERSION), _parse_version(installed)
            if old == cur:
                logger.info(
                    f"[TeamChat] 已安装相同版本 v{installed}，跳过重复注册。"
                    f"如需强制重注册：设置 TEAMCHAT_FORCE_REGISTER=1 或删除 data/.installed_version 后重启。"
                )
                return
            if old > cur:
                logger.warning(
                    f"[TeamChat] 已安装更新版本 v{installed}，当前代码为 v{CURRENT_VERSION}（较旧），跳过降级。"
                    f"如确需降级：用 --force 重装并删除 data/.installed_version。"
                )
                return
            logger.info(f"[TeamChat] 检测到旧版本 v{installed}，升级到 v{CURRENT_VERSION}...")

        logger.info(f"TeamChat v{CURRENT_VERSION} 注册中...")
        _load_email_backend()  # 延迟加载，用完即还原 sys.path
        main_router = build_router()
        # 将AI投票路由合并到主router
        main_router.include_router(ai_voting_router, tags=["ai-voting"])
        api.register_http_router(main_router, prefix="/plugins/team_chat", tags=["team-chat"])
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
        # 注册热重载支持
        self._register_hot_reload(api)
        _write_installed_version()
        logger.info(f"TeamChat v{CURRENT_VERSION} 就绪")
    
    def _register_hot_reload(self, api):
        """注册热重载支持 - 开发模式下自动检测文件变更"""
        try:
            from pathlib import Path
            plugin_dir = Path(__file__).parent
            
            # 尝试导入热重载模块
            hot_reload_path = plugin_dir / "hot_reload.py"
            if hot_reload_path.exists():
                import importlib.util
                spec = importlib.util.spec_from_file_location("hot_reload", hot_reload_path)
                if spec and spec.loader:
                    hot_reload_module = importlib.util.module_from_spec(spec)
                    sys.modules["hot_reload"] = hot_reload_module
                    spec.loader.exec_module(hot_reload_module)
                    
                    # 启用热重载
                    reloader = hot_reload_module.enable_hot_reload(plugin_dir)
                    
                    # 注册重载回调 - 刷新路由
                    def on_reload():
                        logger.info("[HotReload] 检测到文件变更，正在刷新...")
                        # 通知前端刷新
                        try:
                            import json
                            reload_notify_path = plugin_dir / "data" / ".hot_reload_notify"
                            reload_notify_path.parent.mkdir(parents=True, exist_ok=True)
                            reload_notify_path.write_text(json.dumps({
                                "timestamp": time.time(),
                                "version": CURRENT_VERSION
                            }))
                        except Exception as e:
                            logger.warning(f"[HotReload] 通知文件写入失败: {e}")
                    
                    reloader.on_reload(on_reload)
                    logger.info("[HotReload] 热重载已启用 - 修改文件后自动生效")
                    
                    # 添加热重载状态API
                    @api.router.get("/hot-reload-status")
                    async def hot_reload_status():
                        return hot_reload_module.get_hot_reload_status()
        except Exception as e:
            logger.warning(f"[HotReload] 热重载初始化失败: {e}")
    
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

        # 恢复AI决策投票数据
        try:
            _ai_restore_votes()
            logger.info("[AI决策] 投票数据恢复完成")
        except Exception as e:
            logger.warning(f"[AI决策] 投票数据恢复失败: {e}")

    def _setup_auto_sync_cron(self):
        """自动设置邮件同步定时任务 - 异步执行避免阻塞"""
        import subprocess
        import json
        import threading
        
        def setup_cron_async():
            try:
                # 检查是否已存在TeamChat邮件同步任务
                result = subprocess.run(
                    ['qwenpaw', 'cron', 'list', '--agent-id', 'default'],
                    capture_output=True, text=True, encoding='utf-8',
                    timeout=5  # 添加5秒超时
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
                    capture_output=True, text=True, encoding='utf-8',
                    timeout=5  # 添加5秒超时
                )
                
                if create_result.returncode == 0:
                    logger.info("[Cron] 邮件同步定时任务创建成功")
                else:
                    logger.warning(f"[Cron] 创建任务失败: {create_result.stderr}")
                    
            except subprocess.TimeoutExpired:
                logger.warning("[Cron] 设置定时任务超时，将在后台重试")
            except Exception as e:
                logger.warning(f"[Cron] 设置定时任务时出错: {e}")
        
        # 在后台线程中执行，避免阻塞启动
        thread = threading.Thread(target=setup_cron_async, daemon=True)
        thread.start()
        logger.info("[Cron] 定时任务设置已移至后台线程")
    
    def _shutdown(self):
        try:
            _EXECUTOR.shutdown(wait=True, cancel_futures=True)
            logger.info("[TeamChat] ThreadPoolExecutor 已关闭")
        except Exception as e:
            logger.warning(f"[TeamChat] ThreadPoolExecutor 关闭失败: {e}")
        logger.info(f"TeamChat v{CURRENT_VERSION} 已关闭")

# ═══════════════════════════════════════════════════════════════
# AI决策系统 API v2.0 — 融合 AI决策 MVP v1.2.1
# ═══════════════════════════════════════════════════════════════

# ── 加载 AI决策 模块 ──
_AI_DECISION_AVAILABLE = False
animation_component = None
expert_config = None

try:
    if str(plugin_dir) not in sys.path:
        sys.path.insert(0, str(plugin_dir))
    from modules.ai_decision.ai_decision_core import (
        AIVotingSystem, VoteConfig, VoteOption, AgentConfig, AIVote, VoteStatus,
        ai_decision_system, AgentVote as _AgentVote
    )
    from modules.ai_decision.negotiation_engine import NegotiationEngine
    from modules.ai_decision.report_generator import ReportGenerator
    from modules.ai_decision.llm_engine import (
        LLMVotingEngine, LLMConfig, LLMProvider, MultiAIQueryEngine,
        LLMResponse, MultiAIResult, llm_voting_engine, multi_ai_engine
    )
    _AI_DECISION_AVAILABLE = True
    logger.info("[AI决策] 模块加载成功 (from MVP v1.2.1)")
except Exception as e:
    logger.warning(f"[AI决策] 模块加载失败: {e}")

# ── 数据持久化 ──
import re

_AI_DECISION_DATA_DIR = Path(__file__).parent / "data"
_AI_DECISION_PERSIST_FILE = _AI_DECISION_DATA_DIR / "ai_decision_votes.json"


def _ai_ensure_data_dir():
    _AI_DECISION_DATA_DIR.mkdir(parents=True, exist_ok=True)


def _ai_load_votes() -> Dict[str, Dict]:
    """从 JSON 文件加载投票存档"""
    _ai_ensure_data_dir()
    try:
        if _AI_DECISION_PERSIST_FILE.exists():
            with open(_AI_DECISION_PERSIST_FILE, "r", encoding="utf-8") as f:
                return json.load(f)
    except Exception as e:
        logger.error(f"[AI决策] 加载存档失败: {e}")
    return {}


def _ai_save_votes():
    """持久化所有投票到 JSON 文件"""
    if not _AI_DECISION_AVAILABLE:
        return
    _ai_ensure_data_dir()
    try:
        all_votes = ai_decision_system.get_all_votes()
        data = {v.id: v.to_dict() for v in all_votes}
        with open(_AI_DECISION_PERSIST_FILE, "w", encoding="utf-8") as f:
            json.dump(data, f, ensure_ascii=False, indent=2)
        logger.debug(f"[AI决策] 持久化 {len(data)} 条投票")
    except Exception as e:
        logger.error(f"[AI决策] 持久化失败: {e}")


def _ai_restore_votes():
    """启动时从 JSON 恢复到内存"""
    if not _AI_DECISION_AVAILABLE:
        return
    data = _ai_load_votes()
    if not data:
        return
    count = 0
    for vote_id, d in data.items():
        try:
            options = []
            for o in d.get("options", []):
                opt = VoteOption(id=o.get("id", ""), text=o.get("text", ""),
                                description=o.get("description", ""))
                opt.votes = o.get("votes", 0)
                opt.voters = o.get("voters", [])
                opt.weighted_votes = o.get("weighted_votes", 0.0)
                options.append(opt)

            agents = [
                AgentConfig(agent_id=a.get("agent_id", ""), name=a.get("name", ""),
                           role=a.get("role", ""), weight=a.get("weight", 1.0),
                           expertise=a.get("expertise", []),
                           use_external_llm=a.get("use_external_llm", False),
                           llm_provider=a.get("llm_provider", ""),
                           llm_api_key=a.get("llm_api_key", ""),
                           llm_model=a.get("llm_model", ""),
                           llm_personality=a.get("llm_personality", ""))
                for a in (d.get("agents") or d.get("config", {}).get("agents", []))
            ]

            config = VoteConfig(
                title=d.get("title", ""), options=options, agents=agents,
                negotiation_duration=d.get("negotiation_duration", 180),
                consensus_threshold=d.get("consensus_threshold", 0.7),
            )

            vote = AIVote(
                id=vote_id, config=config,
                status=VoteStatus(d.get("status", "cancelled")),
                created_at=d.get("created_at", time.time()),
                started_at=d.get("started_at"),
                completed_at=d.get("completed_at"),
            )
            vote.agent_analysis = d.get("agent_analysis", {})

            for v in d.get("votes", []):
                vote.votes.append(_AgentVote(
                    agent_id=v.get("agent_id", ""), agent_name=v.get("agent_name", ""),
                    option_id=v.get("option_id", ""), weight=v.get("weight", 1.0),
                    confidence=v.get("confidence", 0.5), reasoning=v.get("reasoning", ""),
                    voted_at=v.get("voted_at", time.time()),
                    llm_response=v.get("llm_response", ""), latency=v.get("latency", 0.0),
                ))

            win_id = d.get("winner", {}).get("id") if isinstance(d.get("winner"), dict) else None
            if win_id:
                for o in vote.config.options:
                    if o.id == win_id:
                        vote.winner = o
                        break
            vote.consensus_level = d.get("consensus_level")
            ai_decision_system._votes[vote_id] = vote
            count += 1
        except Exception as e2:
            logger.debug(f"[AI决策] 恢复投票 {vote_id} 失败: {e2}")
    logger.info(f"[AI决策] 从存档恢复 {count} 条投票")


# ── Router 与请求模型 ──
_VOTE_CTX_CACHE: Dict[str, Any] = {}


class AIVotingCreateRequest(BaseModel):
    title: str
    options: List[Dict] = []
    agents: List[Dict] = []
    template: str = "yes_no"
    negotiation_duration: int = 180
    consensus_threshold: float = 0.7
    file_context: str = ""
    use_local_agents: bool = True
    # 兼容旧版字段
    description: str = ""
    use_llm: bool = False
    llm_provider: str = ""
    llm_api_key: str = ""
    llm_api_base: str = ""
    llm_model: str = ""


class MultiAIQueryRequest(BaseModel):
    question: str
    providers: List[Dict]
    system_prompt: str = ""


# ── 提示构建与解析 ──

def _build_vote_prompt(title: str, options: List[Dict], file_context: str = "", template: str = "yes_no") -> str:
    """构建发送给本地 Agent 的投票提示（模板感知）"""
    opts_text = "\n".join(
        f"- **{o.get('id', 'opt' + str(i+1))}**: {o.get('text', '')}"
        + (f" ({o.get('description', '')})" if o.get('description') else "")
        for i, o in enumerate(options)
    )

    file_part = ""
    if file_context:
        file_part = f"\n**附件文件**：\n{file_context}\n（如有附件请一并分析）\n"

    template_type = "decision"
    if template.startswith("score"):
        template_type = "score"
    elif template.startswith("rank"):
        template_type = "ranking"
    elif template.startswith("consensus"):
        template_type = "consensus"
    elif template in ["fact_check", "best_option", "advice", "risk_assess", "confidence_level"]:
        template_type = "question"

    if template_type == "score":
        action = """请按评分制（1-10分）对每个对象逐一打分，并选出最高分的方案。回复格式：
{"scores": {"obj1": 8, "obj2": 6, ...}, "best": "objID", "confidence": 0.85, "reasoning": "...", "analysis": "..."}"""
    elif template_type == "ranking":
        action = """请对以下项目按优先级排序（最重要的排第1），回复格式：
{"ranking": ["item1", "item3", "item2"], "confidence": 0.85, "reasoning": "...", "analysis": "..."}"""
    elif template_type == "question":
        # 疑问型模板：更开放的回答方式
        if template == "fact_check":
            action = """这是一个事实确认问题。请分析并给出你的判断。回复格式：
{"vote": "最符合事实的选项ID", "confidence": 0.85, "reasoning": "基于什么事实/数据做出的判断", "analysis": "详细分析过程和依据"}"""
        elif template == "best_option":
            action = """这是一个选择最优方案的问题。请对比分析各选项，选出最佳。回复格式：
{"vote": "最优选项ID", "confidence": 0.85, "reasoning": "为什么这个选项最优", "analysis": "各选项优劣对比分析"}"""
        elif template == "advice":
            action = """这是一个建议征询问题。请基于你的专业知识给出建议。回复格式：
{"vote": "建议采纳的选项ID", "confidence": 0.85, "reasoning": "建议的理由", "analysis": "详细建议内容和考量因素"}"""
        elif template == "risk_assess":
            action = """这是一个风险评估问题。请评估各选项的风险等级（1-10分，10分最高风险）。回复格式：
{"scores": {"选项ID": 风险分数}, "vote": "风险最低的选项ID", "confidence": 0.85, "reasoning": "风险评估依据", "analysis": "详细风险分析"}"""
        elif template == "confidence_level":
            action = """这是一个置信度评估问题。请评估你对各选项的确定程度。回复格式：
{"scores": {"选项ID": 置信度分数0-1}, "vote": "置信度最高的选项ID", "confidence": 你的整体置信度, "reasoning": "判断依据", "analysis": "详细分析"}"""
        else:
            action = """请基于你的专业知识分析这个问题。回复格式：
{"vote": "你的选择", "confidence": 0.85, "reasoning": "简短理由", "analysis": "详细分析"}"""
    else:
        action = """请以 **严格JSON** 格式回复（不要包含任何其他文字或markdown标记）：
{"vote": "方案ID", "confidence": 0.85, "reasoning": "简短理由（50字以内）", "analysis": "详细分析"}"""

    return f"""你正在参与一个 AI 投票决策，请根据你的专业知识和判断能力进行真实分析并投票。

**投票主题**：{title}
{file_part}
**可选方案**：
{opts_text}

**要求**：
1. 逐一分析每个方案的优势与风险
2. 基于你的专业角度，做出判断
3. 给出置信度（0.0~1.0）和简要理由

{action}"""


def _parse_agent_response(text: str) -> Dict:
    """解析 Agent 返回的 JSON"""
    try:
        return json.loads(text.strip())
    except json.JSONDecodeError:
        pass
    for pat in [r'```(?:json)?\s*\n(.*?)\n```', r'```(?:json)?\s*(.*?)\s*```', r'\{[\s\S]*?\}']:
        m = re.search(pat, text.strip(), re.DOTALL)
        if m:
            try:
                return json.loads(m.group(1) if '`' in pat else m.group(0))
            except json.JSONDecodeError:
                continue
    return {
        "vote": "", "confidence": 0.5, "reasoning": text[:100],
        "analysis": text, "parse_error": True,
    }


async def _dispatch_real_agent(ctx: Any, agent_id: str, prompt: str, vote_id: str) -> Dict:
    """向本地 Agent 发送投票问题并收集回复"""
    try:
        import dataclasses as _dc
        agent_ctx = _dc.replace(ctx, agent_id=agent_id)
        session_id = f"tc_ai_decision_{vote_id}_{agent_id}"

        async for _ in agent_ctx.chat_stream("/clear", session_id=session_id):
            pass

        full_text = ""
        async for ev in agent_ctx.chat_stream(prompt, session_id=session_id):
            if getattr(ev, "delta", False):
                continue
            content = getattr(ev, "content", None) or getattr(ev, "delta_text", "")
            if content:
                if isinstance(content, list):
                    for item in content:
                        text_val = item.get("text", "") if isinstance(item, dict) else str(item)
                        full_text += text_val
                else:
                    full_text += str(content)

        logger.info(f"[AI决策] Agent {agent_id} 回复 ({len(full_text)} 字符)")
        return _parse_agent_response(full_text.strip())

    except Exception as e:
        logger.error(f"[AI决策] Agent {agent_id} 调用失败: {e}")
        return {"error": str(e), "vote": "", "confidence": 0.0,
                "reasoning": f"调用失败: {e}", "analysis": ""}# ═══════════════════════════════════════════════════════════════
# AI决策 API 路由
# ═══════════════════════════════════════════════════════════════

@ai_voting_router.post("/ai-voting/create")
async def ai_voting_create(request: AIVotingCreateRequest):
    """创建AI决策（支持本地Agent + 外部AI 双模式）"""
    if not _AI_DECISION_AVAILABLE:
        raise HTTPException(status_code=503, detail="AI决策模块未加载")

    try:
        options = [
            VoteOption(id=opt.get("id", f"opt_{i+1}"),
                      text=opt.get("text", opt.get("label", "")),
                      description=opt.get("description", ""))
            for i, opt in enumerate(request.options)
        ] if request.options else []

        agents = [
            AgentConfig(
                agent_id=agt.get("agent_id", f"agent_{i}"),
                name=agt.get("name", ""),
                role=agt.get("role", "参与者"),
                weight=agt.get("weight", 1.0 / max(len(request.agents), 1)),
                expertise=agt.get("expertise", []),
                use_external_llm=agt.get("use_external_llm", not request.use_local_agents),
                llm_provider=agt.get("llm_provider", request.llm_provider),
                llm_api_key=agt.get("api_key", request.llm_api_key),
                llm_model=agt.get("model", request.llm_model),
                llm_personality=agt.get("personality", ""),
            )
            for i, agt in enumerate(request.agents)
        ] if request.agents else []

        config = VoteConfig(
            title=request.title,
            options=options,
            agents=agents,
            negotiation_duration=request.negotiation_duration,
            consensus_threshold=request.consensus_threshold,
        )

        vote = await ai_decision_system.create_vote(config)

        # 获取 ctx 用于本地 Agent 调用
        ctx = None
        try:
            from qwenpaw.pawapp import get_ctx
            # ctx 需要通过 Depends 注入，这里用缓存
        except ImportError:
            pass

        if request.use_local_agents and len(request.agents) > 0:
            # 本地Agent模式：尝试获取ctx并运行
            asyncio.create_task(_ai_run_vote_task(vote.id, request, ctx))
        elif len(request.agents) > 0:
            asyncio.create_task(ai_decision_system.start_vote(vote.id))
        else:
            # 无Agent：标记完成
            vote.status = VoteStatus.COMPLETED
            vote.completed_at = time.time()

        _ai_save_votes()

        return {
            "vote_id": vote.id,
            "status": "created",
            "mode": "local" if request.use_local_agents else "external",
            "message": "AI决策已创建，"
            + ("本地智能体开始分析" if request.use_local_agents else "等待启动"),
        }
    except Exception as e:
        logger.error(f"[AI决策] 创建失败: {e}")
        raise HTTPException(status_code=500, detail=str(e))


async def _ai_run_vote_task(vote_id: str, request: AIVotingCreateRequest, ctx=None):
    """后台执行投票"""
    if not _AI_DECISION_AVAILABLE:
        return
    vote = ai_decision_system.get_vote(vote_id)
    if not vote:
        return

    vote.status = VoteStatus.ANALYZING
    vote.started_at = time.time()
    logger.info(f"[AI决策] 启动投票: {vote_id}, {len(request.agents)} 个Agent")

    try:
        prompt = _build_vote_prompt(
            request.title, request.options, request.file_context, request.template
        )

        if ctx and request.use_local_agents:
            # 本地Agent并发调度
            tasks = [
                _dispatch_real_agent(ctx, agt["agent_id"], prompt, vote_id)
                for agt in request.agents
            ]
            results = await asyncio.gather(*tasks, return_exceptions=True)

            for agt, result in zip(request.agents, results):
                if isinstance(result, Exception):
                    result = {
                        "error": str(result), "vote": "", "confidence": 0.0,
                        "reasoning": f"异常: {result}", "analysis": "",
                    }
                agent_id = agt["agent_id"]
                agent_name = agt.get("name", agent_id)
                weight = agt.get("weight", 1.0 / max(len(request.agents), 1))
                vote.agent_analysis[agent_id] = result

                option_id = result.get("vote", "")
                confidence = result.get("confidence", 0.5)
                reasoning = result.get("reasoning", "")
                analysis = result.get("analysis", "")

                if not option_id or result.get("parse_error"):
                    option_id = request.options[0].get("id", "") if request.options else ""
                    reasoning = f"[解析失败] {result.get('analysis', '')[:80]}"

                vote.votes.append(_AgentVote(
                    agent_id=agent_id, agent_name=agent_name,
                    option_id=option_id, weight=weight,
                    confidence=confidence, reasoning=reasoning,
                    voted_at=time.time(), llm_response=analysis, latency=0.0,
                ))

                for opt in vote.config.options:
                    if opt.id == option_id:
                        opt.votes += 1
                        opt.voters.append(agent_id)
                        opt.weighted_votes += weight
                        break

                logger.info(
                    f"[AI决策] {agent_name} 投票: {option_id} (置信度:{confidence:.2f})"
                )
        else:
            # 外部AI模式
            await ai_decision_system.start_vote(vote_id)

        # 计算胜者
        if vote.config.options and vote.config.agents:
            winner = max(vote.config.options, key=lambda o: o.weighted_votes)
            vote.winner = winner
            vote.consensus_level = (
                winner.weighted_votes
                / sum(a.weight for a in vote.config.agents)
            )
        vote.status = VoteStatus.COMPLETED
        vote.completed_at = time.time()
        logger.info(f"[AI决策] 投票完成: {vote_id}")
        _ai_save_votes()

    except Exception as e:
        logger.error(f"[AI决策] 投票执行失败: {e}")
        vote.status = VoteStatus.CANCELLED


@ai_voting_router.get("/ai-voting/vote/{vote_id}")
async def ai_voting_status(vote_id: str):
    """获取投票状态"""
    if not _AI_DECISION_AVAILABLE:
        raise HTTPException(status_code=503, detail="AI决策模块未加载")
    vote = ai_decision_system.get_vote(vote_id)
    if not vote:
        raise HTTPException(status_code=404, detail="投票不存在")
    return vote.to_dict()


@ai_voting_router.get("/ai-voting/list")
async def ai_voting_list():
    """获取投票列表（按创建时间倒序）"""
    if not _AI_DECISION_AVAILABLE:
        return {"votes": []}
    votes = ai_decision_system.get_all_votes()
    sorted_votes = sorted(votes, key=lambda v: v.created_at, reverse=True)
    return {"votes": [v.to_dict() for v in sorted_votes]}


@ai_voting_router.delete("/ai-voting/vote/{vote_id}")
async def ai_voting_delete(vote_id: str):
    """删除投票"""
    if not _AI_DECISION_AVAILABLE:
        raise HTTPException(status_code=503, detail="AI决策模块未加载")
    vote = ai_decision_system.get_vote(vote_id)
    if not vote:
        raise HTTPException(status_code=404, detail="投票不存在")
    ai_decision_system._votes.pop(vote_id, None)
    _ai_save_votes()
    logger.info(f"[AI决策] 删除投票 {vote_id}")
    return {"message": "已删除", "vote_id": vote_id}


@ai_voting_router.get("/ai-voting/local-agents")
async def ai_voting_local_agents(request: Request):
    """获取 QwenPaw 中的本地真实智能体列表"""
    try:
        try:
            from qwenpaw.pawapp import get_agents_state
            agents_state = get_agents_state()
        except ImportError:
            agents_state = None

        if agents_state is None:
            base_url = str(request.base_url).rstrip("/")
            async with httpx.AsyncClient(timeout=5.0) as client:
                resp = await client.get(f"{base_url}/api/agents")
                resp.raise_for_status()
                agents_state = resp.json()

        agents = agents_state.get("agents", agents_state) if isinstance(agents_state, dict) else []
        if not isinstance(agents, list):
            agents = []

        return {
            "agents": [
                {
                    "agent_id": a["id"],
                    "name": a.get("name", a["id"]),
                    "description": (a.get("description", "") or "").split("|")[0].strip()[:120],
                    "model": (a.get("active_model") or {}).get("model", "系统默认"),
                    "enabled": a.get("enabled", True),
                    "running": a.get("startup_status") == "running",
                }
                for a in agents
                if a.get("enabled", True) and a.get("id") != "ai_decision"
            ]
        }
    except Exception as e:
        logger.error(f"[AI决策] 获取本地Agent失败: {e}")
        return {
            "agents": [
                {"agent_id": "default", "name": "Default", "description": "默认Agent", "model": "system"},
                {"agent_id": "cloud-orchestrator", "name": "CloudPaw-Master", "description": "主控编排Agent", "model": "系统默认"},
                {"agent_id": "cloud-executor", "name": "CloudPaw-Executor", "description": "执行Agent", "model": "系统默认"},
                {"agent_id": "cloud-verifier", "name": "CloudPaw-Verifier", "description": "验证Agent", "model": "系统默认"},
            ],
            "fallback": True,
        }


@ai_voting_router.get("/ai-voting/agents")
async def ai_voting_agents(request: Request):
    """获取智能体列表（优先返回本地真实Agent）"""
    return await ai_voting_local_agents(request)


@ai_voting_router.get("/ai-voting/report/{vote_id}")
async def ai_voting_report(vote_id: str):
    """生成决策报告"""
    if not _AI_DECISION_AVAILABLE:
        raise HTTPException(status_code=503, detail="AI决策模块未加载")
    vote = ai_decision_system.get_vote(vote_id)
    if not vote:
        raise HTTPException(status_code=404, detail="投票不存在")
    if vote.status.value != "completed":
        raise HTTPException(status_code=400, detail="投票尚未完成")
    generator = ReportGenerator()
    return await generator.generate(vote)


@ai_voting_router.get("/ai-voting/report/{vote_id}/markdown")
async def ai_voting_report_markdown(vote_id: str):
    """生成Markdown格式报告"""
    if not _AI_DECISION_AVAILABLE:
        raise HTTPException(status_code=503, detail="AI决策模块未加载")
    vote = ai_decision_system.get_vote(vote_id)
    if not vote:
        raise HTTPException(status_code=404, detail="投票不存在")
    if vote.status.value != "completed":
        raise HTTPException(status_code=400, detail="投票尚未完成")
    generator = ReportGenerator()
    report = await generator.generate(vote)
    markdown = generator.to_markdown(report)
    return PlainTextResponse(content=markdown, media_type="text/markdown")


@ai_voting_router.get("/ai-voting/templates")
async def ai_voting_templates():
    """获取投票模板列表"""
    return {
        "templates": [
            # 原有模板 - 决策型
            {"id": "yes_no", "name": "简单决策", "description": "是/否 二选一", "type": "decision", "category": "决策型", 
             "prompt_guide": "主题：请描述需要决策的问题\n选项：是 / 否\n示例：'这个项目值得投资吗？'"},
            {"id": "yes_no_abstain", "name": "决策（含弃权）", "description": "是/否/弃权 三选一", "type": "decision", "category": "决策型",
             "prompt_guide": "主题：请描述需要决策的问题\n选项：是 / 否 / 弃权\n示例：'同意这个方案吗？信息不足可弃权'"},
            {"id": "go_no_go", "name": "通过决议", "description": "通过/不通过", "type": "decision", "category": "决策型",
             "prompt_guide": "主题：请描述需要审批的内容\n选项：通过 / 不通过\n示例：'预算申请是否通过？'"},
            
            # 评分型
            {"id": "score_5", "name": "5分评分", "description": "1-5分制评分", "type": "score", "category": "评分型",
             "prompt_guide": "主题：请描述评分对象\n选项：各候选方案\n示例：'对三个供应商的服务质量评分'"},
            {"id": "score_10", "name": "10分评分", "description": "1-10分制评分", "type": "score", "category": "评分型",
             "prompt_guide": "主题：请描述评分对象\n选项：各候选方案\n示例：'对候选人的综合能力评分'"},
            {"id": "score_100", "name": "百分制评分", "description": "0-100分制评分", "type": "score", "category": "评分型",
             "prompt_guide": "主题：请描述评分对象\n选项：各候选方案\n示例：'对项目提案的完善度评分'"},
            
            # 排序型
            {"id": "rank_priority", "name": "优先级排序", "description": "按重要性排序", "type": "ranking", "category": "排序型",
             "prompt_guide": "主题：请描述排序目标\n选项：各待办事项\n示例：'按紧急程度排列这些任务'"},
            {"id": "rank_preference", "name": "偏好排序", "description": "按个人偏好排序", "type": "ranking", "category": "排序型",
             "prompt_guide": "主题：请描述排序目标\n选项：各候选方案\n示例：'按偏好程度排列这些设计方案'"},
            
            # 共识型
            {"id": "consensus_basic", "name": "基础共识", "description": "多轮协商达成共识", "type": "consensus", "category": "共识型",
             "prompt_guide": "主题：请描述需要达成共识的问题\n选项：各方观点\n示例：'团队对项目方向达成共识'"},
            {"id": "consensus_deep", "name": "深度共识", "description": "深度多轮协商", "type": "consensus", "category": "共识型",
             "prompt_guide": "主题：请描述复杂议题\n选项：各方立场\n示例：'就技术架构进行深度讨论'"},
            {"id": "consensus_unanimous", "name": "全体一致", "description": "要求全体一致", "type": "consensus", "category": "共识型",
             "prompt_guide": "主题：请描述重要决策\n选项：各方意见\n示例：'重大投资决策需全体一致'"},
            
            # 多选型
            {"id": "multi_select", "name": "多选投票", "description": "可选择多个选项", "type": "multi_choice", "category": "多选型",
             "prompt_guide": "主题：请描述选择目标\n选项：多个可选项\n示例：'选择所有可行的方案'"},
            
            # 新增：疑问型模板
            {"id": "fact_check", "name": "事实确认", "description": "确认某个事实是否正确", "type": "decision", "category": "疑问型",
             "prompt_guide": "主题：请描述需要确认的事实\n选项：是 / 否 / 不确定\n示例：'今天是星期天吗？'"},
            {"id": "best_option", "name": "最佳选择", "description": "从多个选项中选择最优", "type": "decision", "category": "疑问型",
             "prompt_guide": "主题：请描述选择场景\n选项：各候选方案\n示例：'周末去哪里玩最好？'"},
            {"id": "advice", "name": "建议征询", "description": "征询处理建议", "type": "decision", "category": "疑问型",
             "prompt_guide": "主题：请描述遇到的问题\n选项：各处理方案\n示例：'如何优化这个流程？'"},
            {"id": "risk_assess", "name": "风险评估", "description": "评估风险等级", "type": "score", "category": "疑问型",
             "prompt_guide": "主题：请描述需要评估的事项\n选项：各方案或风险点\n示例：'评估各方案的实施风险'"},
            {"id": "confidence_level", "name": "置信度评估", "description": "评估对某事的确定程度", "type": "score", "category": "疑问型",
             "prompt_guide": "主题：请描述需要评估信心的事项\n选项：各判断或预测\n示例：'对项目按时完成的信心程度'"},
        ]
    }


# ═══════════════════════════════════════════════════════════════
# 多AI并发查询（全提问）API
# ═══════════════════════════════════════════════════════════════

@ai_voting_router.post("/ai-voting/multi-ai/query")
async def ai_voting_multi_ai_query(request: MultiAIQueryRequest):
    """多AI并发查询"""
    if not _AI_DECISION_AVAILABLE:
        raise HTTPException(status_code=503, detail="AI决策模块未加载")
    try:
        configs = []
        for p in request.providers:
            config = LLMConfig(
                provider=p.get("provider", "openai"),
                model=p.get("model", ""),
                api_key=p.get("api_key", ""),
                api_base=p.get("api_base", ""),
                temperature=p.get("temperature", 0.7),
                max_tokens=p.get("max_tokens", 2000),
            )
            configs.append(config)

        result = await multi_ai_engine.query_all(
            question=request.question,
            configs=configs,
            system_prompt=request.system_prompt,
        )

        return {
            "query": result.query,
            "total_latency": result.total_latency,
            "consensus_level": result.consensus_level,
            "responses": [
                {
                    "provider": r.provider,
                    "content": r.content[:500] + "..." if len(r.content) > 500 else r.content,
                    "full_content": r.content,
                    "confidence": r.confidence,
                    "tokens_used": r.tokens_used,
                    "latency": r.latency,
                    "error": r.error,
                }
                for r in result.responses
            ],
            "best_response": {
                "provider": result.best_response.provider,
                "content": result.best_response.content[:500] + "..." if len(result.best_response.content) > 500 else result.best_response.content,
                "full_content": result.best_response.content,
            }
            if result.best_response
            else None,
        }
    except Exception as e:
        logger.error(f"[多AI查询] 失败: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@ai_voting_router.get("/ai-voting/multi-ai/providers")
async def ai_voting_multi_ai_providers():
    """获取支持的AI提供商"""
    if not _AI_DECISION_AVAILABLE:
        return {"providers": [], "error": "模块未加载"}
    try:
        return {
            "providers": multi_ai_engine.get_supported_providers(),
            "description": "内置多AI并发查询引擎（全提问/AIChatProxy），无需浏览器扩展",
            "reference": "https://aichatproxy.com/?from=toolwa",
        }
    except Exception as e:
        return {
            "providers": [
                {"id": "doubao", "name": "豆包", "icon": "🟢", "model": "doubao-pro-128k"},
                {"id": "deepseek", "name": "DeepSeek", "icon": "🔵", "model": "deepseek-chat"},
                {"id": "qwen", "name": "通义千问", "icon": "🟠", "model": "qwen-max"},
                {"id": "kimi", "name": "Kimi", "icon": "🟡", "model": "kimi-latest"},
                {"id": "openai", "name": "ChatGPT", "icon": "🔵", "model": "gpt-4"},
                {"id": "anthropic", "name": "Claude", "icon": "🟣", "model": "claude-3-opus"},
            ]
        }


# ═══════════════════════════════════════════════════════════════
# AI决策历史记录提取API
# ═══════════════════════════════════════════════════════════════

class ExtractDecisionRequest(BaseModel):
    session_id: str = Field(..., description="会谈记录ID")
    host_id: str = Field(..., description="主持人Agent ID")


@ai_voting_router.post("/ai-voting/extract-from-history")
async def ai_voting_extract_from_history(request: ExtractDecisionRequest):
    """从历史会谈记录中提取决策信息"""
    if not _AI_DECISION_AVAILABLE:
        raise HTTPException(status_code=503, detail="AI决策模块未加载")

    # 获取会谈记录
    data = store.get(request.session_id)
    if not data:
        raise HTTPException(status_code=404, detail="会谈记录不存在")

    history = data.get("history", [])
    if not history:
        raise HTTPException(status_code=400, detail="会谈记录为空，无法提取决策")

    # 构建提示词，让AI分析历史记录提取决策
    prompt = """你是决策分析专家。请分析以下团队会谈记录，提取其中的关键决策信息。

请按以下格式输出决策总结：

【决策主题】
（简明扼要地描述这个决策的核心问题，20字以内）

【决策背景】
（描述为什么需要做这个决策，当前面临的问题或挑战）

【决策方案】
（列出讨论中提到的各种方案或选择）

【执行要点】
1. （具体的执行步骤或行动项）
2. （具体的执行步骤或行动项）

【决策结果】
（最终达成的共识或决定是什么）

【影响评估】
（高/中/低 - 这个决策对项目或团队的影响程度）

【参与人员】
（列出参与讨论的主要角色或Agent）

=== 会谈记录 ===

"""

    # 添加历史记录
    agent_names = set()
    for h in history:
        sender = h.get("sender_name", h.get("sender", "?"))
        agent_names.add(sender)
        prompt += f"[{sender}]: {h.get('content', '')}\n\n"

    try:
        # 调用主持人Agent进行分析
        host_resp = await _call_agent_async(request.host_id, prompt)

        # 解析AI返回的内容
        decision_data = _parse_decision_from_ai_response(host_resp, list(agent_names))

        # 生成决策ID
        decision_id = f"decision_{request.session_id}_{int(time.time())}"

        # 保存提取的决策记录
        decision_record = {
            "id": decision_id,
            "session_id": request.session_id,
            "title": decision_data.get("title", "未命名决策"),
            "content": decision_data.get("content", ""),
            "category": decision_data.get("category", "历史提取"),
            "impact": decision_data.get("impact", "中"),
            "status": "completed",
            "timestamp": time.strftime("%Y-%m-%d %H:%M:%S"),
            "participants": list(agent_names),
            "raw_ai_response": host_resp,
        }

        # 保存到决策记录存储
        _save_decision_record(decision_record)

        logger.info(f"[AI决策] 从历史记录提取决策成功: {decision_id}")

        return {
            "success": True,
            "decision": decision_record,
            "message": "决策提取成功"
        }

    except Exception as e:
        logger.error(f"[AI决策] 从历史记录提取决策失败: {e}")
        raise HTTPException(status_code=500, detail=f"决策提取失败: {str(e)}")


def _parse_decision_from_ai_response(response: str, participants: list) -> dict:
    """从AI响应中解析决策数据"""
    result = {
        "title": "历史会谈决策",
        "content": response,
        "category": "历史提取",
        "impact": "中",
    }

    # 尝试提取决策主题
    if "【决策主题】" in response:
        lines = response.split("\n")
        for i, line in enumerate(lines):
            if "【决策主题】" in line and i + 1 < len(lines):
                title = lines[i + 1].strip()
                if title and not title.startswith("【"):
                    result["title"] = title[:50]  # 限制长度
                    break

    # 尝试提取影响评估
    if "【影响评估】" in response:
        if "高" in response.split("【影响评估】")[-1][:20]:
            result["impact"] = "高"
        elif "低" in response.split("【影响评估】")[-1][:20]:
            result["impact"] = "低"

    # 尝试提取决策类别
    if "技术" in response or "代码" in response or "架构" in response:
        result["category"] = "技术决策"
    elif "产品" in response or "功能" in response:
        result["category"] = "产品决策"
    elif "流程" in response or "规范" in response:
        result["category"] = "流程决策"

    return result


# 决策记录存储文件
_AI_DECISION_RECORDS_FILE = _AI_DECISION_DATA_DIR / "ai_decision_records.json"


def _save_decision_record(record: dict):
    """保存决策记录到文件"""
    try:
        records = []
        if _AI_DECISION_RECORDS_FILE.exists():
            with open(_AI_DECISION_RECORDS_FILE, "r", encoding="utf-8") as f:
                records = json.load(f)

        # 检查是否已存在相同session的决策，如果存在则更新
        existing_idx = None
        for i, r in enumerate(records):
            if r.get("session_id") == record.get("session_id"):
                existing_idx = i
                break

        if existing_idx is not None:
            records[existing_idx] = record
        else:
            records.append(record)

        with open(_AI_DECISION_RECORDS_FILE, "w", encoding="utf-8") as f:
            json.dump(records, f, ensure_ascii=False, indent=2)

    except Exception as e:
        logger.error(f"[AI决策] 保存决策记录失败: {e}")


@ai_voting_router.get("/ai-voting/decision-records")
async def ai_voting_decision_records():
    """获取所有从历史记录提取的决策"""
    try:
        if not _AI_DECISION_RECORDS_FILE.exists():
            return {"records": []}

        with open(_AI_DECISION_RECORDS_FILE, "r", encoding="utf-8") as f:
            records = json.load(f)

        # 按时间倒序
        records.sort(key=lambda x: x.get("timestamp", ""), reverse=True)

        return {"records": records}

    except Exception as e:
        logger.error(f"[AI决策] 获取决策记录失败: {e}")
        return {"records": [], "error": str(e)}


# ═══════════════════════════════════════════════════════════════
# AI决策动画 API — 使用函数内动态导入避免模块缓存问题
# ═══════════════════════════════════════════════════════════════

def _get_animation_component():
    """动态获取动画组件（解决模块缓存问题）"""
    import importlib
    import modules.ai_decision.animation_component as _anim_mod
    importlib.reload(_anim_mod)
    return _anim_mod.animation_engine

def _get_expert_config():
    """动态获取专家配置（解决模块缓存问题）"""
    from modules.ai_decision.decision_expert_config import expert_config as _ec
    return _ec


@ai_voting_router.get("/ai-voting/animation/start")
async def ai_voting_animation_start(vote_id: str = Query(..., description="决策ID")):
    """启动决策动画 / Start decision animation"""
    try:
        ac = _get_animation_component()
        result = ac.start_animation(vote_id)
        return result
    except Exception as e:
        logger.error(f"[AI决策动画] 启动失败: {e}")
        raise HTTPException(status_code=500, detail=f"动画启动失败: {e}")


@ai_voting_router.get("/ai-voting/animation/frame")
async def ai_voting_animation_frame(
    animation_id: str = Query(..., description="动画ID"),
    stage_index: Optional[int] = Query(None, description="阶段索引")
):
    """获取动画帧 / Get animation frame"""
    try:
        ac = _get_animation_component()
        result = ac.get_frame(animation_id, stage_index)
        return result
    except Exception as e:
        logger.error(f"[AI决策动画] 获取帧失败: {e}")
        raise HTTPException(status_code=500, detail=f"获取动画帧失败: {e}")


@ai_voting_router.get("/ai-voting/animation/advantages")
async def ai_voting_animation_advantages():
    """获取AI决策优势展示 / Get AI decision advantages"""
    try:
        ac = _get_animation_component()
        result = ac.get_advantages()
        return result
    except Exception as e:
        logger.error(f"[AI决策动画] 获取优势失败: {e}")
        raise HTTPException(status_code=500, detail=f"获取优势展示失败: {e}")


# ═══════════════════════════════════════════════════════════════
# 决策分析专家配置 API — 使用函数内动态导入避免模块缓存问题
# ═══════════════════════════════════════════════════════════════

@ai_voting_router.get("/ai-voting/experts")
async def ai_voting_experts():
    """获取所有专家配置 / Get all expert configurations"""
    try:
        ec = _get_expert_config()
        result = ec.get_all_experts()
        return result
    except Exception as e:
        logger.error(f"[AI决策专家] 获取专家失败: {e}")
        raise HTTPException(status_code=500, detail=f"获取专家失败: {e}")


@ai_voting_router.get("/ai-voting/experts/types")
async def ai_voting_expert_types():
    """获取专家类型和等级 / Get expert types and levels"""
    try:
        ec = _get_expert_config()
        result = ec.get_expert_types()
        return result
    except Exception as e:
        logger.error(f"[AI决策专家] 获取类型失败: {e}")
        raise HTTPException(status_code=500, detail=f"获取专家类型失败: {e}")


@ai_voting_router.post("/ai-voting/experts/create")
async def ai_voting_experts_create(request: Request):
    """创建专家 / Create expert"""
    try:
        data = await request.json()
        ec = _get_expert_config()
        result = ec.create_expert(data)
        return result
    except Exception as e:
        logger.error(f"[AI决策专家] 创建失败: {e}")
        raise HTTPException(status_code=500, detail=f"创建专家失败: {e}")


@ai_voting_router.post("/ai-voting/experts/update")
async def ai_voting_experts_update(request: Request):
    """更新专家 / Update expert"""
    try:
        data = await request.json()
        expert_id = data.get("expert_id")
        if not expert_id:
            return {"success": False, "error": "缺少expert_id / Missing expert_id"}
        ec = _get_expert_config()
        result = ec.update_expert(expert_id, data)
        return result
    except Exception as e:
        logger.error(f"[AI决策专家] 更新失败: {e}")
        raise HTTPException(status_code=500, detail=f"更新专家失败: {e}")


@ai_voting_router.post("/ai-voting/experts/delete")
async def ai_voting_experts_delete(request: Request):
    """删除专家 / Delete expert"""
    try:
        data = await request.json()
        expert_id = data.get("expert_id")
        if not expert_id:
            return {"success": False, "error": "缺少expert_id / Missing expert_id"}
        ec = _get_expert_config()
        result = ec.delete_expert(expert_id)
        return result
    except Exception as e:
        logger.error(f"[AI决策专家] 删除失败: {e}")
        raise HTTPException(status_code=500, detail=f"删除专家失败: {e}")


@ai_voting_router.post("/ai-voting/experts/recommend")
async def ai_voting_experts_recommend(request: Request):
    """智能推荐专家 / Recommend experts based on topic"""
    try:
        data = await request.json()
        topic = data.get("topic", "")
        decision_type = data.get("decision_type")
        if not topic:
            return {"success": False, "error": "缺少决策主题 / Missing decision topic"}
        ec = _get_expert_config()
        result = ec.recommend_experts(topic, decision_type)
        return result
    except Exception as e:
        logger.error(f"[AI决策专家] 推荐失败: {e}")
        raise HTTPException(status_code=500, detail=f"推荐专家失败: {e}")


plugin = TeamChatPlugin()