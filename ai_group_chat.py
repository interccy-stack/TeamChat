# -*- coding: utf-8 -*-
"""
TeamChat AI Group Chat Module
AI 群聊模块 - 支持 @提及 指定智能体回复，带群聊上下文，文件上传下载

功能：
- 官方聊天室（OFFICIAL_ROOM）
- 支持智能体动态添加/删除
- @提及 功能
- 群聊上下文感知（智能体能看到历史消息）
- 文件上传/下载/预览（智能体产物）
- 线程安全

版本: v5.2.0
"""

import json
import logging
import time
import hashlib
import uuid
import os
import threading
import re
import random
import base64
import mimetypes
import asyncio
from pathlib import Path
from datetime import datetime, timedelta
from typing import Dict, List, Optional, Any, Tuple
from concurrent.futures import ThreadPoolExecutor
import httpx

logger = logging.getLogger("qwenpaw.team_chat.ai_group")


class DataStore:
    """简单文件存储"""
    def __init__(self, base_dir: Path):
        self.base_dir = base_dir
        self.base_dir.mkdir(parents=True, exist_ok=True)
    
    def _get_path(self, collection: str, key: str) -> Path:
        collection_dir = self.base_dir / collection
        collection_dir.mkdir(exist_ok=True)
        return collection_dir / f"{key}.json"
    
    def save(self, collection: str, key: str, data: dict):
        path = self._get_path(collection, key)
        with open(path, 'w', encoding='utf-8') as f:
            json.dump(data, f, ensure_ascii=False, indent=2)
    
    def load(self, collection: str, key: str) -> Optional[dict]:
        path = self._get_path(collection, key)
        if path.exists():
            with open(path, 'r', encoding='utf-8') as f:
                return json.load(f)
        return None
    
    def delete(self, collection: str, key: str):
        path = self._get_path(collection, key)
        if path.exists():
            path.unlink()
    
    def list(self, collection: str) -> List[dict]:
        collection_dir = self.base_dir / collection
        if not collection_dir.exists():
            return []
        items = []
        for f in collection_dir.glob("*.json"):
            try:
                with open(f, 'r', encoding='utf-8') as file:
                    items.append(json.load(file))
            except Exception:
                pass
        return items


class FileStore:
    """文件存储（用于智能体产物和用户上传）"""
    def __init__(self, base_dir: Path):
        self.base_dir = base_dir / "files"
        self.base_dir.mkdir(parents=True, exist_ok=True)
        self.meta_file = self.base_dir / "_metadata.json"
        self._metadata = self._load_metadata()
        self._lock = threading.Lock()  # 线程锁，防止并发写入
    
    def _load_metadata(self) -> Dict:
        """加载文件元数据"""
        if self.meta_file.exists():
            try:
                with open(self.meta_file, 'r', encoding='utf-8') as f:
                    return json.load(f)
            except:
                pass
        return {"files": {}, "next_id": 1}
    
    def _save_metadata(self):
        """保存文件元数据"""
        with open(self.meta_file, 'w', encoding='utf-8') as f:
            json.dump(self._metadata, f, ensure_ascii=False, indent=2)
    
    def save_file(self, content: bytes, filename: str, file_type: str = "auto",
                  uploader: str = "", room_id: str = "", metadata: Dict = None) -> Dict:
        """保存文件（线程安全）
        
        Args:
            content: 文件内容（bytes）
            filename: 原始文件名
            file_type: 文件类型（auto/mime_type）
            uploader: 上传者ID
            room_id: 所属房间ID
            metadata: 额外元数据
        
        Returns:
            文件信息字典
        """
        with self._lock:
            file_id = f"file_{self._metadata['next_id']:06d}"
            self._metadata['next_id'] += 1
            
            # 确定文件扩展名
            if file_type == "auto":
                mime_type, _ = mimetypes.guess_type(filename)
                if not mime_type:
                    mime_type = "application/octet-stream"
            else:
                mime_type = file_type
            
            # 生成存储文件名
            ext = Path(filename).suffix or ".bin"
            storage_name = f"{file_id}{ext}"
            storage_path = self.base_dir / storage_name
            
            # 保存文件内容
            with open(storage_path, 'wb') as f:
                f.write(content)
            
            # 生成文件信息
            file_info = {
                "id": file_id,
                "filename": filename,
                "storage_name": storage_name,
                "mime_type": mime_type,
                "size": len(content),
                "size_human": self._format_size(len(content)),
                "uploader": uploader,
                "room_id": room_id,
                "created_at": datetime.now().isoformat(),
                "download_url": f"/ai-chat/files/{file_id}/download",
                "preview_url": f"/ai-chat/files/{file_id}/preview",
                "metadata": metadata or {}
            }
            
            self._metadata["files"][file_id] = file_info
            self._save_metadata()
        
        logger.info(f"AIChat: 文件已保存 {filename} ({file_info['size_human']})")
        return file_info
    
    def save_base64_file(self, base64_content: str, filename: str, 
                         uploader: str = "", room_id: str = "", metadata: Dict = None) -> Dict:
        """保存 Base64 编码的文件"""
        try:
            # 处理 data URI 格式
            if base64_content.startswith('data:'):
                # data:image/png;base64,xxx
                header, data = base64_content.split(',', 1)
                mime_type = header.split(';')[0].split(':')[1]
            else:
                data = base64_content
                mime_type = "application/octet-stream"
            
            content = base64.b64decode(data)
            return self.save_file(content, filename, mime_type, uploader, room_id, metadata)
        except Exception as e:
            logger.error(f"AIChat: Base64文件保存失败: {e}")
            raise
    
    def get_file(self, file_id: str) -> Optional[Dict]:
        """获取文件信息"""
        return self._metadata["files"].get(file_id)
    
    def get_file_path(self, file_id: str) -> Optional[Path]:
        """获取文件存储路径"""
        info = self.get_file(file_id)
        if info:
            return self.base_dir / info["storage_name"]
        return None
    
    def delete_file(self, file_id: str) -> bool:
        """删除文件"""
        info = self.get_file(file_id)
        if not info:
            return False
        
        # 删除物理文件
        file_path = self.base_dir / info["storage_name"]
        if file_path.exists():
            file_path.unlink()
        
        # 删除元数据
        del self._metadata["files"][file_id]
        self._save_metadata()
        
        logger.info(f"AIChat: 文件已删除 {file_id}")
        return True
    
    def list_files(self, room_id: str = None, uploader: str = None) -> List[Dict]:
        """列出文件"""
        files = list(self._metadata["files"].values())
        
        if room_id:
            files = [f for f in files if f.get("room_id") == room_id]
        if uploader:
            files = [f for f in files if f.get("uploader") == uploader]
        
        # 按时间倒序
        files.sort(key=lambda x: x.get("created_at", ""), reverse=True)
        return files
    
    def can_preview(self, file_id: str) -> Tuple[bool, str]:
        """检查文件是否可以预览，返回 (能否预览, 预览类型)"""
        info = self.get_file(file_id)
        if not info:
            return False, ""
        
        mime_type = info.get("mime_type", "")
        
        # 文本类型
        if mime_type.startswith("text/"):
            return True, "text"
        
        # 图片类型
        if mime_type.startswith("image/"):
            return True, "image"
        
        # PDF
        if mime_type == "application/pdf":
            return True, "pdf"
        
        # JSON
        if mime_type in ["application/json", "application/javascript"]:
            return True, "text"
        
        # Markdown
        if mime_type in ["text/markdown", "text/x-markdown"]:
            return True, "markdown"
        
        # 代码文件
        code_extensions = ['.py', '.js', '.ts', '.html', '.css', '.java', '.cpp', '.c', '.h', 
                          '.go', '.rs', '.rb', '.php', '.swift', '.kt', '.scala', '.r', '.m',
                          '.sh', '.bat', '.ps1', '.sql', '.yaml', '.yml', '.xml', '.json',
                          '.md', '.txt', '.log', '.csv']
        ext = Path(info["filename"]).suffix.lower()
        if ext in code_extensions:
            return True, "code"
        
        return False, ""
    
    def get_preview_content(self, file_id: str) -> Optional[Dict]:
        """获取文件预览内容"""
        info = self.get_file(file_id)
        if not info:
            return None
        
        can_preview, preview_type = self.can_preview(file_id)
        if not can_preview:
            return None
        
        file_path = self.base_dir / info["storage_name"]
        if not file_path.exists():
            return None
        
        try:
            if preview_type == "image":
                # 图片：返回 base64
                with open(file_path, 'rb') as f:
                    content = f.read()
                return {
                    "type": "image",
                    "mime_type": info["mime_type"],
                    "data": base64.b64encode(content).decode('utf-8'),
                    "filename": info["filename"]
                }
            
            elif preview_type in ["text", "code", "markdown"]:
                # 文本：返回内容
                with open(file_path, 'r', encoding='utf-8', errors='replace') as f:
                    content = f.read()
                
                # 限制预览大小
                max_size = 100 * 1024  # 100KB
                if len(content) > max_size:
                    content = content[:max_size] + "\n\n... (内容已截断)"
                
                return {
                    "type": preview_type,
                    "content": content,
                    "filename": info["filename"],
                    "mime_type": info["mime_type"]
                }
            
            elif preview_type == "pdf":
                # PDF：返回 base64
                with open(file_path, 'rb') as f:
                    content = f.read()
                return {
                    "type": "pdf",
                    "mime_type": "application/pdf",
                    "data": base64.b64encode(content).decode('utf-8'),
                    "filename": info["filename"]
                }
        
        except Exception as e:
            logger.error(f"AIChat: 预览文件失败: {e}")
            return None
    
    def _format_size(self, size: int) -> str:
        """格式化文件大小"""
        for unit in ['B', 'KB', 'MB', 'GB']:
            if size < 1024:
                return f"{size:.1f} {unit}"
            size /= 1024
        return f"{size:.1f} TB"


class AIGroupChatEngine:
    """AI 群聊引擎"""
    
    ROOM_TTL = timedelta(days=7)
    MSG_MAX = 500
    MAX_MEMBERS = 50
    
    # 默认智能体配置（初始5个）
    DEFAULT_AGENTS = [
        {"id": "agent:default", "name": "阿里", "full_name": "阿里 - 数字伙伴", "agent_api_id": "default", "icon": "🤖", "color": "#FF6B6B"},
        {"id": "agent:cloud-executor", "name": "Executor", "full_name": "CloudPaw-Executor", "agent_api_id": "cloud-executor", "icon": "⚡", "color": "#4ECDC4"},
        {"id": "agent:QwenPaw_QA_Agent_0.2", "name": "QA", "full_name": "QA Agent", "agent_api_id": "QwenPaw_QA_Agent_0.2", "icon": "❓", "color": "#45B7D1"},
        {"id": "agent:cloud-orchestrator", "name": "Master", "full_name": "CloudPaw-Master", "agent_api_id": "cloud-orchestrator", "icon": "🎯", "color": "#96CEB4"},
        {"id": "agent:cloud-verifier", "name": "Verifier", "full_name": "CloudPaw-Verifier", "agent_api_id": "cloud-verifier", "icon": "✓", "color": "#FFEAA7"},
    ]
    
    def __init__(self, data_dir):
        # 确保 data_dir 是 Path 对象
        if isinstance(data_dir, str):
            data_dir = Path(data_dir)
        self.store = DataStore(data_dir / "ai_chatrooms")
        self.file_store = FileStore(data_dir / "ai_chatrooms")  # 文件存储
        self._rooms = {}
        self._room_lock = threading.Lock()
        self._agents_lock = threading.Lock()
        # 动态智能体配置，从存储加载或初始化
        self._agents_config = self._load_agents_config()
        self._load_rooms()
        self._ensure_official_room()
    
    def _load_agents_config(self) -> List[Dict]:
        """加载智能体配置（支持持久化）"""
        config = self.store.load("config", "agents")
        if config and "agents" in config:
            logger.info(f"AIChat: 从存储加载了 {len(config['agents'])} 个智能体配置")
            return config["agents"]
        # 首次初始化，使用默认配置
        self._save_agents_config(self.DEFAULT_AGENTS)
        return self.DEFAULT_AGENTS.copy()
    
    def _save_agents_config(self, agents: List[Dict]):
        """保存智能体配置到存储"""
        self.store.save("config", "agents", {"agents": agents})
        logger.info(f"AIChat: 已保存 {len(agents)} 个智能体配置")
    
    @property
    def AGENTS_CONFIG(self) -> List[Dict]:
        """获取当前智能体配置（动态）"""
        with self._agents_lock:
            return self._agents_config.copy()
    
    def get_agents(self) -> Dict:
        """获取所有智能体"""
        return {
            "success": True,
            "agents": self.AGENTS_CONFIG,
            "count": len(self.AGENTS_CONFIG)
        }
    
    def add_agent(self, agent_data: Dict) -> Dict:
        """添加智能体"""
        required = ["id", "name", "agent_api_id"]
        for field in required:
            if field not in agent_data:
                return {"success": False, "error": f"缺少必填字段: {field}"}
        
        with self._agents_lock:
            # 检查ID是否已存在
            if any(a["id"] == agent_data["id"] for a in self._agents_config):
                return {"success": False, "error": f"智能体ID已存在: {agent_data['id']}"}
            
            # 设置默认值
            agent = {
                "id": agent_data["id"],
                "name": agent_data["name"],
                "full_name": agent_data.get("full_name", agent_data["name"]),
                "agent_api_id": agent_data["agent_api_id"],
                "icon": agent_data.get("icon", "🤖"),
                "color": agent_data.get("color", "#667eea"),
            }
            
            self._agents_config.append(agent)
            self._save_agents_config(self._agents_config)
            
            # 更新官方聊天室的智能体列表
            self._update_official_room_agents()
            
            logger.info(f"AIChat: 已添加智能体 {agent['name']}")
            return {"success": True, "agent": agent}
    
    def remove_agent(self, agent_id: str) -> Dict:
        """删除智能体"""
        with self._agents_lock:
            # 不能删除最后一个智能体
            if len(self._agents_config) <= 1:
                return {"success": False, "error": "至少需要保留一个智能体"}
            
            # 查找并删除
            agent = next((a for a in self._agents_config if a["id"] == agent_id), None)
            if not agent:
                return {"success": False, "error": f"智能体不存在: {agent_id}"}
            
            self._agents_config = [a for a in self._agents_config if a["id"] != agent_id]
            self._save_agents_config(self._agents_config)
            
            # 更新官方聊天室的智能体列表
            self._update_official_room_agents()
            
            logger.info(f"AIChat: 已删除智能体 {agent['name']}")
            return {"success": True, "agent": agent}
    
    def _update_official_room_agents(self):
        """更新官方聊天室的智能体列表"""
        room = self._rooms.get("OFFICIAL_ROOM")
        if room:
            room["agents"] = self.AGENTS_CONFIG
            # 更新成员列表，移除已删除的智能体，添加新智能体
            current_agent_ids = {a["id"] for a in self._agents_config}
            room["members"] = [m for m in room["members"] if m.get("user_id") not in [a["id"] for a in self.AGENTS_CONFIG] or m.get("user_id") in current_agent_ids]
            # 添加新智能体成员
            existing_ids = {m.get("user_id") for m in room["members"]}
            for agent in self._agents_config:
                if agent["id"] not in existing_ids:
                    room["members"].append({
                        "user_id": agent["id"],
                        "nickname": agent["full_name"],
                        "role": "agent",
                        "joined_at": datetime.now().isoformat(),
                        "last_active": datetime.now().isoformat(),
                        "icon": agent["icon"]
                    })
            room["version"] += 1
            self.store.save("rooms", "OFFICIAL_ROOM", room)
    
    def _load_rooms(self):
        """加载活跃房间"""
        rooms = self.store.list("rooms")
        now = datetime.now()
        loaded = 0
        for room in rooms:
            try:
                expires = datetime.fromisoformat(room.get("expires_at", ""))
                if expires > now:
                    # 确保房间有agents字段（向后兼容）
                    if "agents" not in room:
                        room["agents"] = [dict(a) for a in self.AGENTS_CONFIG]
                    self._rooms[room["room_id"]] = room
                    loaded += 1
                else:
                    self.store.delete("rooms", room["room_id"])
            except Exception as e:
                logger.warning(f"AIChat: 加载房间失败: {e}")
        logger.info(f"AIChat: 加载了 {loaded} 个活跃房间")
    
    def get_room_agents(self, room_id: str) -> List[Dict]:
        """获取房间的智能体列表"""
        room_id = room_id.upper().strip()
        room = self._rooms.get(room_id)
        if not room:
            room = self.store.load("rooms", room_id)
            if room:
                self._rooms[room_id] = room
        
        if room and "agents" in room and room["agents"]:
            logger.info(f"AIChat: 房间 {room_id} 有 {len(room['agents'])} 个智能体")
            return room["agents"]
        
        # 官方聊天室回退到全局配置
        if room_id == "OFFICIAL_ROOM":
            logger.info(f"AIChat: 官方房间 {room_id} 使用全局智能体配置")
            return self.AGENTS_CONFIG
        
        # 其他房间如果没有智能体，返回默认智能体（只有阿里）
        logger.info(f"AIChat: 房间 {room_id} 没有智能体配置，使用默认智能体")
        return [self.AGENTS_CONFIG[0]] if self.AGENTS_CONFIG else []
    
    def add_room_agent(self, room_id: str, agent_data: Dict) -> Dict:
        """为房间添加智能体"""
        room_id = room_id.upper().strip()
        
        with self._room_lock:
            room = self._rooms.get(room_id)
            if not room:
                room = self.store.load("rooms", room_id)
                if room:
                    self._rooms[room_id] = room
            
            if not room:
                return {"success": False, "error": "房间不存在"}
            
            # 确保房间有agents字段
            if "agents" not in room:
                room["agents"] = [dict(a) for a in self.AGENTS_CONFIG]
            
            # 检查ID是否已存在
            if any(a["id"] == agent_data["id"] for a in room["agents"]):
                return {"success": False, "error": f"智能体ID已存在: {agent_data['id']}"}
            
            # 添加智能体
            agent = {
                "id": agent_data["id"],
                "name": agent_data["name"],
                "full_name": agent_data.get("full_name", agent_data["name"]),
                "agent_api_id": agent_data["agent_api_id"],
                "icon": agent_data.get("icon", "🤖"),
                "color": agent_data.get("color", "#667eea"),
            }
            room["agents"].append(agent)
            room["version"] += 1
            
            # 添加为房间成员
            existing_ids = {m.get("user_id") for m in room["members"]}
            if agent["id"] not in existing_ids:
                room["members"].append({
                    "user_id": agent["id"],
                    "nickname": agent["full_name"],
                    "role": "agent",
                    "joined_at": datetime.now().isoformat(),
                    "last_active": datetime.now().isoformat(),
                    "icon": agent["icon"]
                })
            
            self.store.save("rooms", room_id, room)
            
            logger.info(f"AIChat: 房间 {room_id} 添加智能体 {agent['name']}")
            return {"success": True, "agent": agent}
    
    def remove_room_agent(self, room_id: str, agent_id: str) -> Dict:
        """从房间删除智能体"""
        room_id = room_id.upper().strip()
        
        with self._room_lock:
            room = self._rooms.get(room_id)
            if not room:
                room = self.store.load("rooms", room_id)
                if room:
                    self._rooms[room_id] = room
            
            if not room:
                return {"success": False, "error": "房间不存在"}
            
            # 确保房间有agents字段
            if "agents" not in room:
                return {"success": False, "error": "房间没有智能体配置"}
            
            # 不能删除最后一个智能体
            if len(room["agents"]) <= 1:
                return {"success": False, "error": "至少需要保留一个智能体"}
            
            # 查找并删除
            agent = next((a for a in room["agents"] if a["id"] == agent_id), None)
            if not agent:
                return {"success": False, "error": f"智能体不存在: {agent_id}"}
            
            room["agents"] = [a for a in room["agents"] if a["id"] != agent_id]
            room["version"] += 1
            
            # 从成员列表中移除
            room["members"] = [m for m in room["members"] if m.get("user_id") != agent_id]
            
            self.store.save("rooms", room_id, room)
            
            logger.info(f"AIChat: 房间 {room_id} 删除智能体 {agent['name']}")
            return {"success": True, "agent": agent}
    
    def _ensure_official_room(self):
        """确保官方聊天室存在"""
        room_id = "OFFICIAL_ROOM"
        if room_id not in self._rooms:
            room = self.store.load("rooms", room_id)
            if room:
                self._rooms[room_id] = room
            else:
                self._create_official_room()
    
    def _create_official_room(self):
        """创建官方聊天室"""
        room_id = "OFFICIAL_ROOM"
        now = datetime.now()
        
        # 添加智能体作为常驻成员
        agent_members = []
        for agent in self.AGENTS_CONFIG:
            agent_members.append({
                "user_id": agent["id"],
                "nickname": agent["full_name"],
                "role": "agent",
                "icon": agent["icon"],
                "color": agent["color"],
                "joined_at": now.isoformat(),
                "last_active": now.isoformat()
            })
        
        room = {
            "room_id": room_id,
            "room_name": "🏠 官方 AI 聊天室",
            "creator_id": "system",
            "created_at": now.isoformat(),
            "expires_at": (now + self.ROOM_TTL).isoformat(),
            "members": agent_members,
            "messages": [],
            "status": "active",
            "version": 1,
            "is_official": True,
            "description": "AI 智能体群聊室 - 支持 @提及 指定回复",
            "agents": self.AGENTS_CONFIG
        }
        
        # 添加欢迎消息
        agent_count = len(self.AGENTS_CONFIG)
        welcome_text = f"""欢迎来到官方 AI 聊天室！

💡 使用 @智能体名 指定特定智能体回复
例如：@阿里 你好

不@时所有{agent_count}个智能体都会回复你~"""
        
        welcome_msg = {
            "type": "system",
            "text": welcome_text,
            "content": welcome_text,
            "from": "system",
            "sender_nick": "系统",
            "time": now.isoformat(),
            "timestamp": now.isoformat(),
            "msg_id": f"{room_id}:0",
            "icon": "🔔"
        }
        room["messages"].append(welcome_msg)
        
        self._rooms[room_id] = room
        self.store.save("rooms", room_id, room)
        logger.info(f"AIChat: 官方聊天室已创建")
    
    def get_official_room(self) -> Dict:
        """获取官方聊天室"""
        self._ensure_official_room()
        room = self._rooms.get("OFFICIAL_ROOM")
        if not room:
            return {"success": False, "error": "官方聊天室不存在"}
        
        return {
            "success": True,
            "room": {
                "room_id": room["room_id"],
                "room_name": room["room_name"],
                "members_count": len(room["members"]),
                "messages_count": len(room["messages"]),
                "agents": self.AGENTS_CONFIG
            }
        }
    
    def get_room(self, room_id: str) -> Optional[Dict]:
        """获取房间"""
        room_id = room_id.upper().strip()
        room = self._rooms.get(room_id)
        if not room:
            room = self.store.load("rooms", room_id)
            if room:
                self._rooms[room_id] = room
        return room
    
    def create_room(self, room_id: str, room_name: str, password: str = "") -> Dict:
        """创建房间（纯空房间，无默认智能体，可用于人与人交流）"""
        room_id = room_id.upper().strip()
        now = datetime.now()
        
        # 新房间不设置默认智能体，纯空房间
        # 用户可后续自行添加
        room_agents = []
        logger.info(f"AIChat: 创建纯空房间 {room_id}，无默认智能体")
        
        room = {
            "room_id": room_id,
            "room_name": room_name,
            "password": password,  # 房间密码（可选）
            "is_private": bool(password),  # 是否有密码保护
            "created_at": now.isoformat(),
            "expires_at": (now + self.ROOM_TTL).isoformat(),
            "status": "active",
            "members": [],
            "messages": [],
            "agents": room_agents,  # 房间级智能体配置（默认为空）
            "version": 1
        }
        
        self._rooms[room_id] = room
        self.store.save("rooms", room_id, room)
        logger.info(f"AIChat: 房间 {room_id} 已创建，包含 {len(room_agents)} 个智能体，密码保护: {bool(password)}")
        return room
    
    def join_room(self, room_id: str, user_id: str, nickname: str = "", password: str = "") -> Dict:
        """加入房间"""
        room_id = room_id.upper().strip()
        
        with self._room_lock:
            room = self._rooms.get(room_id)
            if not room:
                room = self.store.load("rooms", room_id)
                if room:
                    self._rooms[room_id] = room
            
            if not room:
                return {"success": False, "error": "房间不存在"}
            
            if room.get("status") != "active":
                return {"success": False, "error": "房间已关闭"}
            
            # 检查是否已在房间
            existing = next((m for m in room["members"] if m["user_id"] == user_id), None)
            if existing:
                return {"success": True, "message": "已在房间中", "room_name": room.get("room_name", room_id)}
            
            # 检查密码（私密房间）
            if room.get("is_private") and room.get("password"):
                if password != room["password"]:
                    return {"success": False, "error": "密码错误", "require_password": True}
            
            # 检查人数限制
            if len(room["members"]) >= self.MAX_MEMBERS:
                return {"success": False, "error": "房间已满"}
            
            # 添加成员
            member = {
                "user_id": user_id,
                "nickname": nickname or f"用户{user_id[-4:]}",
                "role": "member",
                "joined_at": datetime.now().isoformat(),
                "last_active": datetime.now().isoformat()
            }
            room["members"].append(member)
            room["version"] += 1
            self.store.save("rooms", room_id, room)
            
            return {"success": True, "message": "加入成功", "room_name": room.get("room_name", room_id)}
    
    def delete_room(self, room_id: str, user_id: str) -> Dict:
        """删除房间（官方聊天室不能删除）"""
        room_id = room_id.upper().strip()
        
        # 官方聊天室不能删除
        if room_id == "OFFICIAL_ROOM":
            return {"success": False, "error": "官方聊天室不能删除"}
        
        with self._room_lock:
            room = self._rooms.get(room_id)
            if not room:
                room = self.store.load("rooms", room_id)
                if room:
                    self._rooms[room_id] = room
            
            if not room:
                return {"success": False, "error": "房间不存在"}
            
            # 检查用户是否是房间成员（只有成员可以删除）
            is_member = any(m["user_id"] == user_id for m in room.get("members", []))
            if not is_member:
                return {"success": False, "error": "你不是该房间的成员，无法删除"}
            
            # 标记房间为已删除
            room["status"] = "deleted"
            room["deleted_at"] = datetime.now().isoformat()
            room["deleted_by"] = user_id
            
            # 从内存中移除
            if room_id in self._rooms:
                del self._rooms[room_id]
            
            # 从存储中删除
            self.store.delete("rooms", room_id)
            
            logger.info(f"AIChat: 房间 {room_id} 已被用户 {user_id} 删除")
            return {"success": True, "message": "房间已删除"}
    
    def send_message(self, room_id: str, user_id: str, message: str, 
                     msg_type: str = "text", nickname: str = "", 
                     extra_data: Dict = None) -> Dict:
        """发送消息"""
        room_id = room_id.upper().strip()
        
        with self._room_lock:
            room = self._rooms.get(room_id)
            if not room:
                return {"success": False, "error": "房间不存在"}
            
            # 自动加入官方聊天室
            if room_id == "OFFICIAL_ROOM":
                member = next((m for m in room["members"] if m["user_id"] == user_id), None)
                if not member and not user_id.startswith("agent:"):
                    join_result = self.join_room(room_id, user_id, nickname)
                    if not join_result.get("success"):
                        return {"success": False, "error": "无法加入房间"}
                    room = self._rooms.get(room_id)
            
            # 创建消息
            now = datetime.now()
            member = next((m for m in room["members"] if m["user_id"] == user_id), None)
            # 优先使用传入的 nickname 参数（用户修改后的昵称）
            sender_nick = nickname or (member["nickname"] if member else user_id)
            # 如果成员存在且昵称有变化，更新成员信息
            if member and nickname and nickname != member["nickname"]:
                member["nickname"] = nickname
            
            msg = {
                "type": msg_type,
                "msg_type": msg_type,
                "text": message,
                "content": message,
                "from": user_id,
                "sender_nick": sender_nick,
                "time": now.isoformat(),
                "timestamp": now.isoformat(),
                "msg_id": f"{room_id}:{len(room.get('messages', []))}",
            }
            
            # 添加额外数据（如文件信息）
            if extra_data:
                msg.update(extra_data)
            
            if "messages" not in room:
                room["messages"] = []
            room["messages"].append(msg)
            
            # 限制消息数
            if len(room["messages"]) > self.MSG_MAX:
                room["messages"] = room["messages"][-self.MSG_MAX:]
            
            # 更新活跃时间
            if member:
                member["last_active"] = now.isoformat()
            room["version"] += 1
            
            self.store.save("rooms", room_id, room)
        
        logger.info(f"AIChat: {user_id} 在 {room_id} 发送消息")
        
        # 触发智能体回复（有智能体的房间且用户消息）
        # 使用 get_room_agents 获取房间智能体（包含默认回退逻辑）
        room_agents = self.get_room_agents(room_id)
        should_trigger = (len(room_agents) > 0 and 
                         msg_type == "text" and 
                         not user_id.startswith("agent:"))
        
        logger.info(f"AIChat: 房间 {room_id} 有 {len(room_agents)} 个智能体，是否触发回复: {should_trigger}")
        
        if should_trigger:
            self._trigger_agent_reply(room_id, message, room_agents)
        
        return {"success": True, "msg_id": msg["msg_id"], "time": msg["time"]}
    
    def get_messages(self, room_id: str, user_id: str, 
                     since: Optional[str] = None, limit: int = 50) -> Dict:
        """获取消息"""
        room_id = room_id.upper().strip()
        room = self._rooms.get(room_id)
        
        if not room:
            room = self.store.load("rooms", room_id)
            if room:
                self._rooms[room_id] = room
        
        if not room:
            return {"success": False, "error": "房间不存在"}
        
        messages = room.get("messages", [])
        
        # 按时间过滤
        if since:
            try:
                since_dt = datetime.fromisoformat(since)
                messages = [m for m in messages if datetime.fromisoformat(m["time"]) > since_dt]
            except:
                pass
        
        # 限制数量
        messages = messages[-limit:]
        
        return {
            "success": True,
            "messages": messages,
            "room_version": room.get("version", 0),
            "agents": self.AGENTS_CONFIG if room_id == "OFFICIAL_ROOM" else []
        }
    
    def get_members(self, room_id: str) -> Dict:
        """获取成员列表"""
        room_id = room_id.upper().strip()
        room = self._rooms.get(room_id)
        
        if not room:
            room = self.store.load("rooms", room_id)
        
        if not room:
            return {"success": False, "error": "房间不存在"}
        
        # 分离智能体和用户
        agents = [m for m in room["members"] if m.get("role") == "agent"]
        users = [m for m in room["members"] if m.get("role") != "agent"]
        
        return {
            "success": True,
            "agents": agents,
            "users": users,
            "total": len(room["members"])
        }
    
    def _trigger_agent_reply(self, room_id: str, user_message: str, room_agents: List[Dict] = None):
        """触发智能体回复 - 带群聊上下文"""
        import threading
        import time as time_module
        
        # 获取房间的智能体配置（如果未提供）
        if room_agents is None:
            room_agents = self.get_room_agents(room_id)
        
        # 解析 @提及（使用房间的智能体列表）
        mentioned_agents = self._parse_mentions(user_message, room_id)
        
        if mentioned_agents:
            agents_to_reply = mentioned_agents
            logger.info(f"AIChat: 用户@了 {len(agents_to_reply)} 个智能体")
        else:
            agents_to_reply = list(room_agents)
            logger.info(f"AIChat: 未@智能体，房间 {len(agents_to_reply)} 个智能体将回复")
        
        # 获取群聊上下文（最近 N 条消息）
        context_messages = self._get_chat_context(room_id, limit=20)
        
        def send_reply(agent: dict, delay: float):
            """发送单个智能体回复"""
            time_module.sleep(delay)
            
            try:
                # 调用智能体 API，传入群聊上下文
                reply_content = self._call_agent_api_with_context(
                    agent["agent_api_id"], 
                    user_message,
                    context_messages,
                    agent["name"],
                    room_id  # 传递 room_id 用于生成固定 session_id
                )
                
                # 解析文件创建指令 [FILE:文件名]...[/FILE]
                files_created = self._parse_and_create_files(
                    reply_content, 
                    agent["id"], 
                    agent["name"], 
                    room_id
                )
                
                # 移除文件指令，保留其他内容
                clean_content = re.sub(
                    r'\[FILE:[^\]]+\][\s\S]*?\[/FILE\]', 
                    '', 
                    reply_content
                ).strip()
                
                # 如果有文件生成，添加提示
                if files_created:
                    file_names = ', '.join([f['filename'] for f in files_created])
                    if clean_content:
                        clean_content += f"\n\n📎 已生成文件: {file_names}"
                    else:
                        clean_content = f"📎 已生成文件: {file_names}"
                
                # 发送智能体消息（如果有内容）
                if clean_content:
                    self.send_message(
                        room_id=room_id,
                        user_id=agent["id"],
                        message=clean_content,
                        msg_type="agent",
                        nickname=agent["full_name"]
                    )
                
                logger.info(f"AIChat: {agent['name']} 已回复")
            except Exception as e:
                logger.error(f"AIChat: {agent['name']} 回复失败: {e}")
        
        def send_reply_async(agent: dict, delay: float):
            """异步发送回复（用于文件创建）"""
            loop = asyncio.new_event_loop()
            asyncio.set_event_loop(loop)
            try:
                send_reply(agent, delay)
            finally:
                loop.close()
        
        # 启动线程发送回复
        for i, agent in enumerate(agents_to_reply):
            delay = i * random.uniform(1, 2)  # 错开 1-2 秒
            threading.Thread(
                target=send_reply_async,
                args=(agent, delay),
                daemon=True
            ).start()
    
    def _parse_mentions(self, message: str, room_id: str = "OFFICIAL_ROOM") -> List[dict]:
        """解析 @提及 - 使用房间的智能体列表"""
        mentioned = []
        all_ats = re.findall(r'@(\S+)', message)
        
        # 获取房间的智能体配置
        room_agents = self.get_room_agents(room_id)
        
        for at_text in all_ats:
            at_clean = at_text.rstrip('?:!。，.!?；、,;')
            for agent in room_agents:
                match_names = [agent['name'], agent['full_name'], agent['agent_api_id']]
                for name in match_names:
                    if name.lower() == at_clean.lower():
                        if agent not in mentioned:
                            mentioned.append(agent)
                        break
                    elif at_clean.lower() in name.lower() and len(at_clean) >= 2:
                        if agent not in mentioned:
                            mentioned.append(agent)
                        break
        
        return mentioned
    
    def _get_chat_context(self, room_id: str, limit: int = 20) -> List[Dict]:
        """获取群聊上下文（最近 N 条消息）"""
        with self._room_lock:
            room = self._rooms.get(room_id)
            if not room:
                return []
            messages = room.get("messages", [])
            # 取最近 limit 条，过滤掉系统消息（支持 type 和 msg_type 两种字段名）
            recent = [m for m in messages[-limit:] if m.get("type") != "system" and m.get("msg_type") != "system"]
            return recent
    
    def _format_context_for_agent(self, messages: List[Dict], current_agent_name: str) -> str:
        """将消息格式化为智能体可理解的上下文"""
        if not messages:
            return ""
        
        lines = ["【群聊历史】"]
        for msg in messages:
            sender = msg.get("sender_nick", msg.get("from", "未知"))
            text = msg.get("text", msg.get("content", ""))
            msg_type = msg.get("type", "text")
            user_id = msg.get("from", "")
            
            # 标记智能体自己的发言
            if msg_type == "agent":
                if sender == current_agent_name:
                    lines.append(f"我: {text}")
                else:
                    lines.append(f"{sender}: {text}")
            else:
                # 用户消息，显示昵称
                lines.append(f"{sender}: {text}")
        
        lines.append("【当前消息】")
        return "\n".join(lines)
    
    def _call_agent_api_with_context(self, agent_id: str, current_message: str, 
                                      context_messages: List[Dict], agent_name: str,
                                      room_id: str = "OFFICIAL_ROOM") -> str:
        """调用智能体 API - 带群聊上下文"""
        try:
            # 格式化上下文
            context_text = self._format_context_for_agent(context_messages, agent_name)
            
            # 构建带上下文的提示
            if context_text:
                prompt = f"""你是一个群聊中的智能体成员，名叫"{agent_name}"。

{context_text}

用户说: {current_message}

请根据群聊上下文，以"{agent_name}"的身份回复。注意：
1. 回复要自然，像群聊中的对话
2. 可以引用或回应之前其他智能体或用户的发言
3. 保持你的个性和角色特点
4. 回复要简洁，适合群聊场景

请直接回复:"""
            else:
                prompt = current_message
            
            # 获取 API 地址
            api_base = self._get_api_base()
            url = f"{api_base}/api/console/chat"
            
            # 构建消息历史（包含上下文）
            input_messages = []
            
            # 添加上下文作为 system prompt
            file_creation_guide = """
【重要：文件生成格式】
当用户要求你创建文件、写代码、保存内容到文件时，你必须使用以下精确格式：

[FILE:文件名.扩展名]
文件内容写在这里...
[/FILE]

示例1 - 写Python脚本：
[FILE:hello.py]
print("Hello World")
[/FILE]

示例2 - 写文本文件：
[FILE:intro.txt]
这是我的自我介绍...
[/FILE]

注意：
1. 必须使用 [FILE:文件名] 开头
2. 必须使用 [/FILE] 结尾
3. 文件名要包含扩展名（如.py, .txt, .md）
4. 文件内容放在中间，不要加代码块标记
"""
            
            # 从上下文中提取用户昵称（最后一条用户消息的昵称）
            user_nickname = "用户"
            for msg in reversed(context_messages):
                if msg.get("type") == "text" and not msg.get("from", "").startswith("agent:"):
                    user_nickname = msg.get("sender_nick", "用户")
                    break
            
            if context_text:
                # 使用格式化后的完整上下文
                system_prompt = f"""你是一个群聊中的智能体成员，名叫"{agent_name}"。

以下是群聊历史记录，请根据这些上下文来回复当前消息：

{context_text}
{file_creation_guide}

【重要】
- 当前用户的昵称是：{user_nickname}
- 回复时可以直接称呼用户为"{user_nickname}"
- 请以"{agent_name}"的身份，根据以上群聊历史，回复当前消息
- 回复要自然、简洁，像群聊对话一样
- 如果需要生成文件，请使用 [FILE:文件名]...[/FILE] 格式"""
                
                input_messages.append({
                    "role": "system",
                    "content": [{"type": "text", "text": system_prompt}]
                })
            else:
                # 没有上下文时的默认提示
                system_prompt = f"""你是一个群聊中的智能体成员，名叫"{agent_name}"。这是群聊的第一条消息，请友好地回复。

【重要】
- 当前用户的昵称是：{user_nickname}
- 回复时可以直接称呼用户为"{user_nickname}"

{file_creation_guide}"""
                input_messages.append({
                    "role": "system",
                    "content": [{"type": "text", "text": system_prompt}]
                })
            
            # 添加当前消息
            input_messages.append({
                "role": "user",
                "content": [{"type": "text", "text": current_message}]
            })
            
            # 使用固定 session_id，让智能体能记住群聊上下文
            # 格式: team_chat:{room_id}:{agent_id}
            payload = {
                "session_id": f"team_chat:{room_id}:{agent_id}",
                "input": input_messages,
            }
            headers = {"Content-Type": "application/json", "X-Agent-Id": agent_id}
            
            with httpx.Client(timeout=60.0, trust_env=False) as client:
                with client.stream("POST", url, json=payload, headers=headers) as response:
                    response.raise_for_status()
                    
                    all_text = []
                    for line in response.iter_lines():
                        line = line.strip()
                        if line.startswith("data: "):
                            try:
                                data = json.loads(line[6:])
                                output = data.get("output", [])
                                if output:
                                    last_msg = output[-1]
                                    if last_msg.get("role") == "assistant":
                                        for block in last_msg.get("content", []):
                                            if block.get("type") == "text":
                                                text = block.get("text", "")
                                                if text:
                                                    all_text.append(text)
                            except:
                                continue
                    
                    if all_text:
                        return "".join(all_text).strip()
                    
        except Exception as e:
            logger.error(f"AIChat: 调用智能体 {agent_id} 失败: {e}")
        
        # 降级回复
        return f"[{agent_name}] 收到！"
    
    def _parse_and_create_files(self, content: str, agent_id: str, agent_name: str, room_id: str) -> List[Dict]:
        """解析智能体回复中的文件创建指令并创建文件
        
        支持格式:
        1. [FILE:文件名.txt]...[/FILE]
        2. ```文件名.txt\n内容\n```
        3. 文件已保存到 `文件名.txt` + 代码块
        """
        files_created = []
        
        # 模式1: [FILE:文件名]...[/FILE]
        pattern1 = r'\[FILE:([^\]]+)\]([\s\S]*?)\[/FILE\]'
        matches = re.findall(pattern1, content)
        
        # 模式2: ```文件名.ext\n内容\n```
        pattern2 = r'```(\S+\.\w+)\n([\s\S]*?)```'
        matches2 = re.findall(pattern2, content)
        matches.extend(matches2)
        
        # 模式3: 文件已保存到 `文件名.ext` + 代码块
        pattern3 = r'文件已保存到[`\s]*([^\n`]+\.(?:txt|py|js|html|css|md|json|java|cpp|c|go|rs|sh|bat))[`\s]*\s*[:\n]\s*(?:```\w*\n)?([\s\S]*?)(?:```)?'
        matches3 = re.findall(pattern3, content, re.IGNORECASE)
        matches.extend(matches3)
        
        for filename, file_content in matches:
            filename = filename.strip()
            file_content = file_content.strip()
            
            if not filename or not file_content:
                continue
            
            # 清理文件名
            filename = re.sub(r'[<>:"/\\|?*]', '_', filename)
            if len(filename) > 100:
                filename = filename[:100]
            
            try:
                # 编码文件内容
                content_bytes = file_content.encode('utf-8')
                
                # 保存文件
                file_info = self.file_store.save_file(
                    content=content_bytes,
                    filename=filename,
                    file_type="auto",
                    uploader=agent_id,
                    room_id=room_id,
                    metadata={"created_by": "agent", "agent_name": agent_name}
                )
                
                # 发送文件消息
                self.send_message(
                    room_id=room_id,
                    user_id=agent_id,
                    message=f"📎 {agent_name} 生成了文件: {filename}",
                    msg_type="file",
                    nickname=agent_name,
                    extra_data={
                        "file_url": file_info.get("download_url", ""),
                        "file_size": file_info.get("size_human", ""),
                        "file_name": filename,
                        "file_id": file_info.get("id", ""),
                        "is_agent_product": True
                    }
                )
                
                files_created.append({
                    "filename": filename,
                    "file_id": file_info.get("id"),
                    "size": file_info.get("size_human")
                })
                
                logger.info(f"AIChat: 智能体 {agent_name} 生成文件 {filename}")
                
            except Exception as e:
                logger.error(f"AIChat: 智能体生成文件失败 {filename}: {e}")
        
        return files_created
    
    def _get_api_base(self) -> str:
        """获取 API 基础地址"""
        try:
            from qwenpaw.config.utils import read_last_api
            last = read_last_api()
            if last:
                host, port = last
                return f"http://{host}:{port}"
        except:
            pass
        return os.environ.get("QWENPAW_BASE_URL", "http://127.0.0.1:8088")


# FastAPI 路由
from fastapi import APIRouter, HTTPException, Form, Query
from pydantic import BaseModel, Field

ai_chat_router = APIRouter()


# 导出
__all__ = ['AIGroupChatEngine', 'ai_chat_router']


class AIChatJoinRequest(BaseModel):
    room_id: str = Field(..., max_length=50)
    user_id: str = Field(..., max_length=100)
    nickname: str = Field(default="访客", max_length=50)
    password: str = Field(default="", max_length=20, description="房间密码")


class AIChatMessageRequest(BaseModel):
    room_id: str = Field(..., max_length=50)
    user_id: str = Field(..., max_length=100)
    message: str = Field(..., max_length=2000)
    msg_type: str = Field(default="text", max_length=20)
    nickname: str = Field(default="访客", max_length=50)


class AIChatMessagesRequest(BaseModel):
    room_id: str = Field(..., max_length=50)
    user_id: str = Field(..., max_length=100)
    limit: int = Field(default=50, ge=1, le=100)


class AIChatAddAgentRequest(BaseModel):
    room_id: str = Field(..., max_length=50)
    id: str = Field(..., max_length=50)
    name: str = Field(..., max_length=50)
    full_name: str = Field(default="", max_length=100)
    agent_api_id: str = Field(..., max_length=100)
    icon: str = Field(default="🤖", max_length=10)
    color: str = Field(default="#667eea", max_length=20)


class AIChatRemoveAgentRequest(BaseModel):
    room_id: str = Field(..., max_length=50)
    agent_id: str = Field(..., max_length=50)


# 全局引擎实例
_ai_chat_engine = None

def get_ai_chat_engine():
    global _ai_chat_engine
    if _ai_chat_engine is None:
        data_dir = Path(__file__).parent / "data" / "ai_chat"
        _ai_chat_engine = AIGroupChatEngine(str(data_dir))
    return _ai_chat_engine


@ai_chat_router.get("/official")
async def ai_chat_official():
    """获取官方聊天室信息"""
    engine = get_ai_chat_engine()
    room = engine.get_room("OFFICIAL_ROOM")
    if not room:
        room = engine.create_room("OFFICIAL_ROOM", "官方 AI 聊天室")
    return {
        "success": True,
        "room_id": room["room_id"],
        "room_name": room["room_name"],
        "agents": engine.AGENTS_CONFIG
    }


class AIChatCreateRoomRequest(BaseModel):
    room_name: str = Field(..., max_length=50, description="房间名称")
    user_id: str = Field(..., max_length=100, description="创建者用户ID")
    nickname: str = Field(default="", max_length=50, description="创建者昵称")
    password: str = Field(default="", max_length=20, description="房间密码（可选）")


@ai_chat_router.post("/rooms/create")
async def ai_chat_create_room(req: AIChatCreateRoomRequest):
    """创建新聊天室"""
    try:
        engine = get_ai_chat_engine()
        
        # 生成房间ID
        import random
        import string
        room_id = ''.join(random.choices(string.ascii_uppercase + string.digits, k=8))
        
        logger.info(f"AIChat: 创建房间 {room_id} - {req.room_name}")
        
        # 创建房间（带密码）
        room = engine.create_room(room_id, req.room_name, req.password)
        if not room:
            return {"success": False, "error": "创建房间失败: create_room 返回空"}
        
        # 创建者加入房间
        join_result = engine.join_room(room_id, req.user_id, req.nickname)
        logger.info(f"AIChat: 创建者加入房间结果: {join_result}")
        
        return {
            "success": True,
            "room_id": room_id,
            "room_name": req.room_name,
            "is_private": bool(req.password),
            "message": "房间创建成功" + ("（已设置密码）" if req.password else "")
        }
    except Exception as e:
        logger.error(f"AIChat: 创建房间失败: {e}")
        return {"success": False, "error": f"创建房间失败: {str(e)}"}


@ai_chat_router.get("/rooms/list")
async def ai_chat_list_rooms(user_id: str = Query(...)):
    """获取用户的聊天室列表"""
    engine = get_ai_chat_engine()
    rooms = []
    
    for room_id, room in engine._rooms.items():
        # 检查用户是否在房间中
        is_member = any(m["user_id"] == user_id for m in room.get("members", []))
        if is_member:
            rooms.append({
                "room_id": room["room_id"],
                "room_name": room["room_name"],
                "members_count": len(room.get("members", [])),
                "messages_count": len(room.get("messages", [])),
                "created_at": room.get("created_at", "")
            })
    
    return {"success": True, "rooms": rooms}


@ai_chat_router.get("/rooms/info/{room_id}")
async def ai_chat_room_info(room_id: str):
    """获取房间信息（用于分享链接预览）"""
    engine = get_ai_chat_engine()
    room = engine._rooms.get(room_id.upper())
    if not room:
        room = engine.store.load("rooms", room_id.upper())
    
    if not room:
        return {"success": False, "error": "房间不存在"}
    
    if room.get("status") != "active":
        return {"success": False, "error": "房间已关闭"}
    
    return {
        "success": True,
        "room_id": room["room_id"],
        "room_name": room["room_name"],
        "is_private": room.get("is_private", False),
        "members_count": len(room.get("members", [])),
        "agents_count": len(room.get("agents", [])),
        "created_at": room.get("created_at", "")
    }


class AIChatDeleteRoomRequest(BaseModel):
    room_id: str = Field(..., max_length=50)
    user_id: str = Field(..., max_length=100)


@ai_chat_router.post("/rooms/delete")
async def ai_chat_delete_room(req: AIChatDeleteRoomRequest):
    """删除聊天室（官方聊天室不能删除）"""
    try:
        logger.info(f"AIChat: 收到删除房间请求 - {req.room_id}, 用户: {req.user_id}")
        engine = get_ai_chat_engine()
        result = engine.delete_room(req.room_id, req.user_id)
        logger.info(f"AIChat: 删除房间结果 - {result}")
        return result
    except Exception as e:
        logger.error(f"AIChat: 删除房间API异常: {e}")
        import traceback
        logger.error(traceback.format_exc())
        return {"success": False, "error": f"服务器错误: {str(e)}"}


@ai_chat_router.post("/join")
async def ai_chat_join(req: AIChatJoinRequest):
    """加入聊天室"""
    engine = get_ai_chat_engine()
    result = engine.join_room(
        room_id=req.room_id,
        user_id=req.user_id,
        nickname=req.nickname,
        password=req.password
    )
    return result


@ai_chat_router.post("/message")
async def ai_chat_message(req: AIChatMessageRequest):
    """发送消息"""
    engine = get_ai_chat_engine()
    
    # 发送消息
    result = engine.send_message(
        room_id=req.room_id,
        user_id=req.user_id,
        message=req.message,
        msg_type=req.msg_type,
        nickname=req.nickname
    )
    
    return result


@ai_chat_router.get("/messages/{room_id}")
async def ai_chat_messages(room_id: str, user_id: str, limit: int = 50):
    """获取消息列表"""
    engine = get_ai_chat_engine()
    result = engine.get_messages(room_id, user_id, limit=limit)
    if isinstance(result, dict) and result.get("success"):
        # 返回房间的智能体，不是全局智能体
        result["agents"] = engine.get_room_agents(room_id)
    return result


# ---- 文件管理 API ----

from fastapi import File as FastAPIFile, UploadFile as FastAPIUploadFile
from fastapi.responses import StreamingResponse

class FileUploadRequest(BaseModel):
    room_id: str = Field(..., max_length=50, description="房间ID")
    user_id: str = Field(..., max_length=100, description="用户ID")
    nickname: str = Field(default="", max_length=50, description="昵称")


# 创建线程池用于文件 I/O
_file_executor = ThreadPoolExecutor(max_workers=2, thread_name_prefix="aichat_file_")


@ai_chat_router.post("/files/upload")
async def ai_chat_upload_file(
    file: FastAPIUploadFile = FastAPIFile(...),
    room_id: str = Form(...),
    user_id: str = Form(...),
    nickname: str = Form(default="")
):
    """上传文件到 AI 群聊（异步处理，不阻塞主线程）"""
    engine = get_ai_chat_engine()
    
    try:
        # 读取文件内容（这是异步操作）
        content = await file.read()
        
        # 限制文件大小（10MB）
        max_size = 10 * 1024 * 1024  # 10MB
        if len(content) > max_size:
            return {"success": False, "error": f"文件过大，最大支持 10MB"}
        
        # 在后台线程执行文件保存（避免阻塞事件循环）
        loop = asyncio.get_event_loop()
        file_info = await loop.run_in_executor(
            _file_executor,
            lambda: engine.file_store.save_file(
                content=content,
                filename=file.filename,
                file_type=file.content_type or "auto",
                uploader=user_id,
                room_id=room_id,
                metadata={"nickname": nickname}
            )
        )
        
        # 发送文件消息到聊天室（不等待智能体回复）
        # 构建文件消息，包含下载链接
        file_msg = f"[文件] {file.filename}"
        asyncio.create_task(asyncio.to_thread(
            engine.send_message,
            room_id=room_id,
            user_id=user_id,
            message=file_msg,
            msg_type="file",
            nickname=nickname,
            extra_data={
                "file_url": file_info.get("download_url", ""),
                "file_size": file_info.get("size_human", ""),
                "file_name": file.filename,
                "file_id": file_info.get("id", "")
            }
        ))
        
        return {
            "success": True,
            "file": file_info,
            "message": f"文件 {file.filename} 上传成功"
        }
    except Exception as e:
        logger.error(f"AIChat: 文件上传失败: {e}")
        return {"success": False, "error": str(e)}


@ai_chat_router.get("/files")
async def ai_chat_list_files(room_id: str = None):
    """列出文件"""
    engine = get_ai_chat_engine()
    files = engine.file_store.list_files(room_id=room_id)
    return {
        "success": True,
        "files": files,
        "count": len(files)
    }


@ai_chat_router.get("/files/{file_id}")
async def ai_chat_get_file(file_id: str):
    """获取文件信息"""
    engine = get_ai_chat_engine()
    file_info = engine.file_store.get_file(file_id)
    
    if not file_info:
        raise HTTPException(status_code=404, detail="文件不存在")
    
    return {
        "success": True,
        "file": file_info
    }


@ai_chat_router.get("/files/{file_id}/download")
async def ai_chat_download_file(file_id: str):
    """下载文件"""
    engine = get_ai_chat_engine()
    file_info = engine.file_store.get_file(file_id)
    
    if not file_info:
        raise HTTPException(status_code=404, detail="文件不存在")
    
    file_path = engine.file_store.get_file_path(file_id)
    if not file_path or not file_path.exists():
        raise HTTPException(status_code=404, detail="文件不存在")
    
    def iterfile():
        with open(file_path, 'rb') as f:
            yield from f
    
    return StreamingResponse(
        iterfile(),
        media_type=file_info.get("mime_type", "application/octet-stream"),
        headers={
            "Content-Disposition": f'attachment; filename="{file_info["filename"]}"'
        }
    )


@ai_chat_router.get("/files/{file_id}/preview")
async def ai_chat_preview_file(file_id: str):
    """预览文件"""
    engine = get_ai_chat_engine()
    file_info = engine.file_store.get_file(file_id)
    
    if not file_info:
        raise HTTPException(status_code=404, detail="文件不存在")
    
    preview = engine.file_store.get_preview_content(file_id)
    
    if not preview:
        raise HTTPException(status_code=400, detail="该文件类型不支持预览")
    
    return {
        "success": True,
        "preview": preview,
        "file": file_info
    }


@ai_chat_router.delete("/files/{file_id}")
async def ai_chat_delete_file(file_id: str, user_id: str = Query(...)):
    """删除文件"""
    engine = get_ai_chat_engine()
    file_info = engine.file_store.get_file(file_id)
    
    if not file_info:
        raise HTTPException(status_code=404, detail="文件不存在")
    
    # 检查权限（只有上传者可以删除）
    if file_info.get("uploader") != user_id:
        raise HTTPException(status_code=403, detail="无权删除此文件")
    
    success = engine.file_store.delete_file(file_id)
    
    return {
        "success": success,
        "message": "文件已删除" if success else "删除失败"
    }


class ClearMessagesRequest(BaseModel):
    room_id: str
    user_id: str


@ai_chat_router.post("/messages/clear")
async def ai_chat_clear_messages(req: ClearMessagesRequest):
    """清空房间消息"""
    engine = get_ai_chat_engine()
    room_id = req.room_id.upper().strip()
    
    with engine._room_lock:
        room = engine._rooms.get(room_id)
        if not room:
            room = engine.store.load("rooms", room_id)
            if room:
                engine._rooms[room_id] = room
        
        if not room:
            raise HTTPException(status_code=404, detail="房间不存在")
        
        # 清空消息
        room["messages"] = []
        room["version"] += 1
        engine.store.save("rooms", room_id, room)
    
    return {
        "success": True,
        "message": "消息已清空"
    }


class AgentCreateFileRequest(BaseModel):
    """智能体创建文件请求"""
    room_id: str = "OFFICIAL_ROOM"
    agent_id: str
    filename: str
    content: str  # Base64 编码的文件内容
    file_type: str = "auto"  # auto 或具体的 mime type


@ai_chat_router.post("/agent/create-file")
async def ai_chat_agent_create_file(req: AgentCreateFileRequest):
    """智能体创建文件并发送到群聊（供智能体调用生成产物）"""
    engine = get_ai_chat_engine()
    room_id = req.room_id.upper().strip()
    
    try:
        # 解码 Base64 内容
        import base64
        file_content = base64.b64decode(req.content)
        
        # 保存文件
        file_info = await asyncio.get_event_loop().run_in_executor(
            _file_executor,
            lambda: engine.file_store.save_file(
                content=file_content,
                filename=req.filename,
                file_type=req.file_type,
                uploader=req.agent_id,
                room_id=room_id,
                metadata={"created_by": "agent", "agent_id": req.agent_id}
            )
        )
        
        # 获取智能体信息
        agent = next((a for a in engine._agents_config if a["id"] == req.agent_id), None)
        agent_name = agent["name"] if agent else req.agent_id
        
        # 发送文件消息到群聊
        file_msg = f"📎 我生成了文件: {req.filename}"
        asyncio.create_task(asyncio.to_thread(
            engine.send_message,
            room_id=room_id,
            user_id=req.agent_id,
            message=file_msg,
            msg_type="file",
            nickname=agent_name,
            extra_data={
                "file_url": file_info.get("download_url", ""),
                "file_size": file_info.get("size_human", ""),
                "file_name": req.filename,
                "file_id": file_info.get("id", ""),
                "is_agent_product": True
            }
        ))
        
        return {
            "success": True,
            "file": file_info,
            "message": f"文件 {req.filename} 已生成并发送到群聊"
        }
    except Exception as e:
        logger.error(f"AIChat: 智能体创建文件失败: {e}")
        return {"success": False, "error": str(e)}


# ========== 房间级智能体管理 API ==========

@ai_chat_router.get("/agents")
async def ai_chat_get_agents(room_id: str = Query(None)):
    """获取智能体列表 - 如果不传room_id则返回系统所有智能体"""
    engine = get_ai_chat_engine()
    if room_id:
        agents = engine.get_room_agents(room_id)
        return {
            "success": True,
            "room_id": room_id,
            "agents": agents
        }
    else:
        # 返回系统所有可用智能体
        return {
            "success": True,
            "agents": engine.AGENTS_CONFIG
        }


@ai_chat_router.post("/agents/add")
async def ai_chat_add_agent(req: AIChatAddAgentRequest):
    """为房间添加智能体"""
    try:
        logger.info(f"AIChat: 收到添加智能体请求 - 房间: {req.room_id}, 智能体: {req.name} ({req.id})")
        engine = get_ai_chat_engine()
        result = engine.add_room_agent(
            room_id=req.room_id,
            agent_data=req.dict()
        )
        logger.info(f"AIChat: 添加智能体结果: {result}")
        return result
    except Exception as e:
        logger.error(f"AIChat: 添加智能体API异常: {e}")
        import traceback
        logger.error(traceback.format_exc())
        return {"success": False, "error": f"服务器错误: {str(e)}"}


@ai_chat_router.post("/agents/remove")
async def ai_chat_remove_agent(req: AIChatRemoveAgentRequest):
    """从房间删除智能体"""
    try:
        logger.info(f"AIChat: 收到删除智能体请求 - 房间: {req.room_id}, 智能体ID: {req.agent_id}")
        engine = get_ai_chat_engine()
        result = engine.remove_room_agent(
            room_id=req.room_id,
            agent_id=req.agent_id
        )
        logger.info(f"AIChat: 删除智能体结果: {result}")
        return result
    except Exception as e:
        logger.error(f"AIChat: 删除智能体API异常: {e}")
        import traceback
        logger.error(traceback.format_exc())
        return {"success": False, "error": f"服务器错误: {str(e)}"}
