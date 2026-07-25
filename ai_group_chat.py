# -*- coding: utf-8 -*-
"""
TeamChat AI Group Chat Module
AI 群聊模块 - 支持 @提及 指定智能体回复

功能：
- 官方聊天室（OFFICIAL_ROOM）
- 5个常驻智能体（阿里、Executor、QA、Master、Verifier）
- @提及 功能
- 线程安全
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
from pathlib import Path
from datetime import datetime, timedelta
from typing import Dict, List, Optional, Any
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


class AIGroupChatEngine:
    """AI 群聊引擎"""
    
    ROOM_TTL = timedelta(days=7)
    MSG_MAX = 500
    MAX_MEMBERS = 50
    
    # 智能体配置
    AGENTS_CONFIG = [
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
        self._rooms = {}
        self._room_lock = threading.Lock()
        self._load_rooms()
        self._ensure_official_room()
    
    def _load_rooms(self):
        """加载活跃房间"""
        rooms = self.store.list("rooms")
        now = datetime.now()
        loaded = 0
        for room in rooms:
            try:
                expires = datetime.fromisoformat(room.get("expires_at", ""))
                if expires > now:
                    self._rooms[room["room_id"]] = room
                    loaded += 1
                else:
                    self.store.delete("rooms", room["room_id"])
            except Exception as e:
                logger.warning(f"AIChat: 加载房间失败: {e}")
        logger.info(f"AIChat: 加载了 {loaded} 个活跃房间")
    
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
        welcome_msg = {
            "type": "system",
            "text": "欢迎来到官方 AI 聊天室！\n\n💡 使用 @智能体名 指定特定智能体回复\n例如：@阿里 你好\n\n不@时所有5个智能体都会回复你~",
            "content": "欢迎来到官方 AI 聊天室！\n\n💡 使用 @智能体名 指定特定智能体回复\n例如：@阿里 你好\n\n不@时所有5个智能体都会回复你~",
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
    
    def create_room(self, room_id: str, room_name: str) -> Dict:
        """创建房间"""
        room_id = room_id.upper().strip()
        now = datetime.now()
        
        room = {
            "room_id": room_id,
            "room_name": room_name,
            "created_at": now.isoformat(),
            "expires_at": (now + self.ROOM_TTL).isoformat(),
            "status": "active",
            "members": [],
            "messages": [],
            "version": 1
        }
        
        self._rooms[room_id] = room
        self.store.save("rooms", room_id, room)
        logger.info(f"AIChat: 房间 {room_id} 已创建")
        return room
    
    def join_room(self, room_id: str, user_id: str, nickname: str = "") -> Dict:
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
                return {"success": True, "message": "已在房间中"}
            
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
            
            return {"success": True, "message": "加入成功"}
    
    def send_message(self, room_id: str, user_id: str, message: str, 
                     msg_type: str = "text", nickname: str = "") -> Dict:
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
            sender_nick = member["nickname"] if member else (nickname or user_id)
            
            msg = {
                "type": msg_type,
                "text": message,
                "content": message,
                "from": user_id,
                "sender_nick": sender_nick,
                "time": now.isoformat(),
                "timestamp": now.isoformat(),
                "msg_id": f"{room_id}:{len(room.get('messages', []))}",
            }
            
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
        
        # 触发智能体回复（官方聊天室且用户消息）
        should_trigger = (room_id == "OFFICIAL_ROOM" and 
                         msg_type == "text" and 
                         not user_id.startswith("agent:"))
        
        if should_trigger:
            self._trigger_agent_reply(room_id, message)
        
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
    
    def _trigger_agent_reply(self, room_id: str, user_message: str):
        """触发智能体回复"""
        import threading
        import time as time_module
        
        # 解析 @提及
        mentioned_agents = self._parse_mentions(user_message)
        
        if mentioned_agents:
            agents_to_reply = mentioned_agents
            logger.info(f"AIChat: 用户@了 {len(agents_to_reply)} 个智能体")
        else:
            agents_to_reply = list(self.AGENTS_CONFIG)
            logger.info(f"AIChat: 未@智能体，所有 {len(agents_to_reply)} 个智能体将回复")
        
        def send_reply(agent: dict, delay: float):
            """发送单个智能体回复"""
            time_module.sleep(delay)
            
            try:
                # 调用智能体 API 获取回复
                reply_content = self._call_agent_api(agent["agent_api_id"], user_message)
                
                # 发送智能体消息
                self.send_message(
                    room_id=room_id,
                    user_id=agent["id"],
                    message=reply_content,
                    msg_type="agent",
                    nickname=agent["full_name"]
                )
                logger.info(f"AIChat: {agent['name']} 已回复")
            except Exception as e:
                logger.error(f"AIChat: {agent['name']} 回复失败: {e}")
        
        # 启动线程发送回复
        for i, agent in enumerate(agents_to_reply):
            delay = i * random.uniform(1, 2)  # 错开 1-2 秒
            threading.Thread(
                target=send_reply,
                args=(agent, delay),
                daemon=True
            ).start()
    
    def _parse_mentions(self, message: str) -> List[dict]:
        """解析 @提及"""
        mentioned = []
        all_ats = re.findall(r'@(\S+)', message)
        
        for at_text in all_ats:
            at_clean = at_text.rstrip('?:!。，.!?；、,;')
            for agent in self.AGENTS_CONFIG:
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
    
    def _call_agent_api(self, agent_id: str, prompt: str) -> str:
        """调用智能体 API"""
        try:
            # 获取 API 地址
            api_base = self._get_api_base()
            url = f"{api_base}/api/console/chat"
            
            payload = {
                "session_id": f"team_chat:{uuid.uuid4().hex}",
                "input": [{"role": "user", "content": [{"type": "text", "text": prompt}]}],
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
        return f"[{agent_id}] 收到您的消息！"
    
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


# 导出
__all__ = ['AIGroupChatEngine', 'ai_chat_router']


# FastAPI 路由
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field

ai_chat_router = APIRouter()


class AIChatJoinRequest(BaseModel):
    room_id: str = Field(..., max_length=50)
    user_id: str = Field(..., max_length=100)
    nickname: str = Field(default="访客", max_length=50)


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


@ai_chat_router.post("/join")
async def ai_chat_join(req: AIChatJoinRequest):
    """加入聊天室"""
    engine = get_ai_chat_engine()
    result = engine.join_room(
        room_id=req.room_id,
        user_id=req.user_id,
        nickname=req.nickname
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
        result["agents"] = engine.AGENTS_CONFIG
    return result
