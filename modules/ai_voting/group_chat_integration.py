#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
AI投票与群聊集成模块
让智能体在AI群聊和圆桌会议中发起投票
"""

import asyncio
import json
import re
from typing import List, Dict, Optional
from datetime import datetime
import logging

from .ai_voting_core import AIVotingSystem, VoteConfig, VoteOption, AgentConfig

logger = logging.getLogger("teamchat.ai_voting.integration")


class GroupChatVotingIntegration:
    """群聊投票集成"""
    
    def __init__(self):
        self.voting_system = AIVotingSystem()
        self.active_votes = {}  # session_id -> vote_id
        
    async def handle_message(self, session_id: str, agent_id: str, agent_name: str, message: str, participants: List[Dict]) -> Optional[Dict]:
        """
        处理群聊消息，检测投票意图
        
        Args:
            session_id: 会话ID
            agent_id: 发送消息的智能体ID
            agent_name: 智能体名称
            message: 消息内容
            participants: 参与者列表
        
        Returns:
            如果检测到投票意图，返回投票信息
        """
        # 检测投票意图关键词
        voting_keywords = [
            r"发起投票",
            r"我们投票",
            r"大家投票",
            r"投票决定",
            r"投票选择",
            r"来投票",
            r"投个票"
        ]
        
        has_voting_intent = any(re.search(kw, message) for kw in voting_keywords)
        
        if not has_voting_intent:
            return None
        
        logger.info(f"[群聊投票] 检测到投票意图: {agent_name}")
        
        # 解析投票内容
        vote_config = self._parse_vote_intent(message, participants)
        
        if not vote_config:
            return None
        
        # 创建投票
        try:
            vote = await self.voting_system.create_vote(vote_config)
            self.active_votes[session_id] = vote.id
            
            # 启动投票
            asyncio.create_task(self.voting_system.start_vote(vote.id))
            
            return {
                "type": "vote_created",
                "vote_id": vote.id,
                "title": vote_config.title,
                "options": [opt.text for opt in vote_config.options],
                "participants": [a.name for a in vote_config.agents],
                "message": f"🗳️ {agent_name} 发起了投票：{vote_config.title}"
            }
            
        except Exception as e:
            logger.error(f"[群聊投票] 创建失败: {e}")
            return None
    
    def _parse_vote_intent(self, message: str, participants: List[Dict]) -> Optional[VoteConfig]:
        """
        解析投票意图，提取投票配置
        
        支持格式：
        - "发起投票：选择最佳方案，选项A、选项B、选项C"
        - "我们投票决定吧，方案一、方案二、方案三"
        """
        # 提取主题
        title_match = re.search(r"[:：]\s*(.+?)[，,。.]\s*", message)
        if title_match:
            title = title_match.group(1).strip()
        else:
            # 默认主题
            title = "群聊投票"
        
        # 提取选项
        # 匹配模式：选项A、选项B、选项C 或 方案一、方案二、方案三
        options = []
        
        # 尝试匹配顿号分隔的选项
        option_patterns = [
            r"[，,。]\s*([^，,。]+?)(?:[，,。]|$)",  # 顿号分隔
            r"(\d+[\.\、])\s*([^\d]+?)(?=\d+[\.\、]|$)",  # 数字编号
            r"([ABC][\.\、])\s*([^ABC]+?)(?=[ABC][\.\、]|$)"  # 字母编号
        ]
        
        for pattern in option_patterns:
            matches = re.findall(pattern, message)
            if matches:
                for i, match in enumerate(matches):
                    if isinstance(match, tuple):
                        opt_text = match[-1].strip()
                    else:
                        opt_text = match.strip()
                    
                    if opt_text and len(opt_text) > 2:
                        options.append(VoteOption(
                            id=f"opt{i+1}",
                            text=opt_text[:50]  # 限制长度
                        ))
                
                if len(options) >= 2:
                    break
        
        # 如果没有提取到足够选项，使用默认选项
        if len(options) < 2:
            options = [
                VoteOption(id="opt1", text="赞成"),
                VoteOption(id="opt2", text="反对")
            ]
            title = title or "是否同意"
        
        # 构建智能体配置
        agents = []
        for p in participants:
            if p.get("type") == "agent":
                agents.append(AgentConfig(
                    agent_id=p.get("agent_id", p.get("id", "unknown")),
                    name=p.get("name", "智能体"),
                    role=p.get("role", "参与者"),
                    weight=1.0 / len(participants) if participants else 1.0
                ))
        
        if len(agents) < 2:
            # 至少需要2个智能体
            return None
        
        return VoteConfig(
            title=title,
            options=options,
            agents=agents,
            negotiation_duration=120,  # 群聊中缩短协商时间
            consensus_threshold=0.6
        )
    
    async def get_vote_update(self, session_id: str) -> Optional[Dict]:
        """获取投票状态更新"""
        vote_id = self.active_votes.get(session_id)
        if not vote_id:
            return None
        
        vote = self.voting_system.get_vote(vote_id)
        if not vote:
            return None
        
        # 如果投票完成，生成摘要
        if vote.status.value == "completed":
            return {
                "type": "vote_completed",
                "vote_id": vote_id,
                "title": vote.config.title,
                "winner": vote.winner.text if vote.winner else None,
                "consensus": vote.consensus_level,
                "summary": self._generate_vote_summary(vote)
            }
        
        # 返回进度
        return {
            "type": "vote_progress",
            "vote_id": vote_id,
            "status": vote.status.value,
            "consensus": vote.consensus_level
        }
    
    def _generate_vote_summary(self, vote) -> str:
        """生成投票结果摘要"""
        if not vote.winner:
            return "投票未完成"
        
        lines = [
            f"🗳️ 投票结果：{vote.config.title}",
            f"",
            f"🏆 获胜方案：{vote.winner.text}",
            f"📊 得票：{vote.winner.votes}票（{vote.winner.weighted_votes:.2f}加权票）",
            f"🤝 共识度：{vote.consensus_level:.1%}",
            f"",
            f"📋 详细结果："
        ]
        
        for i, opt in enumerate(sorted(vote.config.options, key=lambda o: o.weighted_votes, reverse=True)):
            lines.append(f"  {i+1}. {opt.text} - {opt.votes}票")
        
        lines.append("")
        lines.append(f"💡 建议：基于{vote.consensus_level:.0%}的共识度，建议")
        
        if vote.consensus_level >= 0.7:
            lines.append("按获胜方案执行，风险较低。")
        elif vote.consensus_level >= 0.5:
            lines.append("执行获胜方案，但需关注分歧点。")
        else:
            lines.append("重新讨论，当前共识度不足。")
        
        return "\n".join(lines)
    
    async def manual_create_vote(self, session_id: str, creator: Dict, config: Dict) -> Optional[Dict]:
        """
        手动创建投票（通过UI或命令）
        
        Args:
            session_id: 会话ID
            creator: 创建者信息
            config: 投票配置
        """
        try:
            # 构建选项
            options = [VoteOption(**opt) for opt in config.get("options", [])]
            
            # 构建智能体
            agents = [AgentConfig(**agt) for agt in config.get("agents", [])]
            
            vote_config = VoteConfig(
                title=config.get("title", "群聊投票"),
                options=options,
                agents=agents,
                negotiation_duration=config.get("negotiation_duration", 180),
                consensus_threshold=config.get("consensus_threshold", 0.7)
            )
            
            vote = await self.voting_system.create_vote(vote_config)
            self.active_votes[session_id] = vote.id
            
            # 启动投票
            asyncio.create_task(self.voting_system.start_vote(vote.id))
            
            return {
                "success": True,
                "vote_id": vote.id,
                "message": f"投票已创建：{vote_config.title}"
            }
            
        except Exception as e:
            logger.error(f"[群聊投票] 手动创建失败: {e}")
            return {
                "success": False,
                "error": str(e)
            }


class RoundTableVoting:
    """圆桌会议投票集成"""
    
    def __init__(self):
        self.integration = GroupChatVotingIntegration()
        self.topic_votes = {}  # topic_id -> vote_id
    
    async def create_topic_vote(self, topic: str, options: List[str], participants: List[Dict]) -> Dict:
        """
        为圆桌会议议题创建投票
        
        Args:
            topic: 议题
            options: 选项列表
            participants: 参与者
        """
        config = {
            "title": f"圆桌议题：{topic}",
            "options": [{"id": f"opt{i+1}", "text": opt} for i, opt in enumerate(options)],
            "agents": [{"agent_id": p.get("id"), "name": p.get("name"), "role": p.get("role", "专家")} for p in participants if p.get("type") == "agent"],
            "negotiation_duration": 300,  # 圆桌会议给更多时间
            "consensus_threshold": 0.7
        }
        
        result = await self.integration.manual_create_vote(
            session_id=f"roundtable-{topic}",
            creator={"name": "主持人"},
            config=config
        )
        
        if result.get("success"):
            self.topic_votes[topic] = result["vote_id"]
        
        return result
    
    async def get_roundtable_summary(self, topic: str) -> str:
        """获取圆桌会议投票总结"""
        vote_id = self.topic_votes.get(topic)
        if not vote_id:
            return "该议题暂无投票"
        
        vote = self.integration.voting_system.get_vote(vote_id)
        if not vote:
            return "投票数据不存在"
        
        return self.integration._generate_vote_summary(vote)


# 全局实例
group_chat_voting = GroupChatVotingIntegration()
roundtable_voting = RoundTableVoting()


# 便捷函数
async def handle_chat_message(session_id: str, agent_id: str, agent_name: str, message: str, participants: List[Dict]) -> Optional[Dict]:
    """处理群聊消息"""
    return await group_chat_voting.handle_message(session_id, agent_id, agent_name, message, participants)


async def create_manual_vote(session_id: str, config: Dict) -> Dict:
    """手动创建投票"""
    return await group_chat_voting.manual_create_vote(session_id, {"name": "用户"}, config)


async def get_vote_status(session_id: str) -> Optional[Dict]:
    """获取投票状态"""
    return await group_chat_voting.get_vote_update(session_id)
