#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
AI投票系统核心模块 v5.3.0
支持外调智能体（豆包、OpenAI、Claude等）
"""

import asyncio
import json
import time
import uuid
from enum import Enum
from dataclasses import dataclass, field
from typing import List, Dict, Optional, Callable, Any
from datetime import datetime
import logging

logger = logging.getLogger("teamchat.ai_voting")

# 导入LLM引擎
try:
    from .llm_engine import LLMVotingEngine, LLMConfig, LLMProvider
    LLM_ENGINE_AVAILABLE = True
except ImportError as e:
    LLM_ENGINE_AVAILABLE = False
    logger.warning(f"[AI投票] LLM引擎未加载: {e}，将使用模拟模式")


class VoteStatus(Enum):
    """投票状态"""
    CREATED = "created"           # 已创建
    ANALYZING = "analyzing"       # 分析中
    NEGOTIATING = "negotiating"   # 协商中
    VOTING = "voting"             # 投票中
    COMPLETED = "completed"       # 已完成
    CANCELLED = "cancelled"       # 已取消


class VoteOption:
    """投票选项"""
    def __init__(self, id: str, text: str, description: str = ""):
        self.id = id
        self.text = text
        self.description = description
        self.votes = 0
        self.voters = []  # 投票的智能体ID列表
        self.weighted_votes = 0.0


@dataclass
class AgentConfig:
    """智能体配置 - 支持外调LLM"""
    agent_id: str
    name: str
    role: str
    weight: float = 1.0  # 权重（0-1）
    expertise: List[str] = field(default_factory=list)  # 专长领域
    
    # LLM配置（支持外调）
    use_external_llm: bool = False  # 是否使用外部LLM
    llm_provider: str = ""          # LLM提供商: doubao/openai/anthropic/qwen/local
    llm_api_key: str = ""          # API密钥
    llm_api_base: str = ""         # API基础URL（可选）
    llm_model: str = ""            # 模型名称
    llm_temperature: float = 0.7    # 温度参数
    llm_max_tokens: int = 2000      # 最大token数
    llm_personality: str = ""      # 智能体个性设定


@dataclass
class VoteConfig:
    """投票配置"""
    title: str
    options: List[VoteOption]
    agents: List[AgentConfig]
    negotiation_duration: int = 180  # 协商时长（秒），默认3分钟
    consensus_threshold: float = 0.7  # 共识度阈值（0-1）
    max_negotiation_rounds: int = 5  # 最大协商轮次
    allow_abstain: bool = False  # 是否允许弃权（AI投票必须选择）
    use_llm_analysis: bool = True  # 是否使用LLM分析


@dataclass
class AgentVote:
    """智能体投票记录"""
    agent_id: str
    agent_name: str
    option_id: str
    weight: float
    confidence: float  # 置信度
    reasoning: str  # 投票理由
    voted_at: float
    llm_response: str = ""  # LLM原始响应
    latency: float = 0.0  # 响应延迟


@dataclass
class NegotiationRound:
    """协商轮次"""
    round_number: int
    agent_id: str
    agent_name: str
    opinion: str
    timestamp: float
    llm_response: str = ""  # LLM原始响应


class AIVote:
    """AI投票实例"""
    
    def __init__(self, config: VoteConfig):
        self.id = str(uuid.uuid4())
        self.config = config
        self.status = VoteStatus.CREATED
        self.created_at = time.time()
        self.started_at = None
        self.completed_at = None
        
        # 投票结果
        self.votes: List[AgentVote] = []
        self.negotiation_history: List[NegotiationRound] = []
        
        # 分析结果
        self.agent_analysis: Dict[str, Dict] = {}  # agent_id -> analysis
        self.consensus_level: float = 0.0
        self.winner: Optional[VoteOption] = None
        
        # LLM引擎
        self._llm_engine = None
        if LLM_ENGINE_AVAILABLE and config.use_llm_analysis:
            self._llm_engine = LLMVotingEngine()
    
    def to_dict(self) -> Dict:
        """转换为字典"""
        return {
            "id": self.id,
            "title": self.config.title,
            "description": "",
            "status": self.status.value,
            "created_at": datetime.fromtimestamp(self.created_at).isoformat(),
            "started_at": datetime.fromtimestamp(self.started_at).isoformat() if self.started_at else None,
            "completed_at": datetime.fromtimestamp(self.completed_at).isoformat() if self.completed_at else None,
            "options": [
                {
                    "id": opt.id,
                    "text": opt.text,
                    "description": opt.description,
                    "votes": opt.votes,
                    "voters": opt.voters,
                    "weighted_votes": opt.weighted_votes
                }
                for opt in self.config.options
            ],
            "agents": [
                {
                    "agent_id": agt.agent_id,
                    "name": agt.name,
                    "role": agt.role,
                    "weight": agt.weight,
                    "expertise": agt.expertise,
                    "use_external_llm": agt.use_external_llm,
                    "llm_provider": agt.llm_provider
                }
                for agt in self.config.agents
            ],
            "votes": [
                {
                    "agent_id": v.agent_id,
                    "agent_name": v.agent_name,
                    "option_id": v.option_id,
                    "weight": v.weight,
                    "confidence": v.confidence,
                    "reasoning": v.reasoning,
                    "voted_at": datetime.fromtimestamp(v.voted_at).isoformat(),
                    "latency": v.latency
                }
                for v in self.votes
            ],
            "consensus_level": self.consensus_level,
            "winner": {
                "id": self.winner.id,
                "text": self.winner.text
            } if self.winner else None,
            "negotiation_history": [
                {
                    "round_number": r.round_number,
                    "agent_id": r.agent_id,
                    "agent_name": r.agent_name,
                    "opinion": r.opinion,
                    "timestamp": datetime.fromtimestamp(r.timestamp).isoformat()
                }
                for r in self.negotiation_history
            ]
        }


class AIVotingSystem:
    """AI投票系统"""
    
    def __init__(self):
        self._votes: Dict[str, AIVote] = {}
    
    async def create_vote(self, config: VoteConfig) -> AIVote:
        """创建投票"""
        vote = AIVote(config)
        self._votes[vote.id] = vote
        logger.info(f"[AI投票] 创建: {vote.id}")
        return vote
    
    async def start_vote(self, vote_id: str):
        """启动投票流程"""
        """
        投票流程:
        1. 智能体独立分析（调用LLM）
        2. 智能体协商（多轮对话）
        3. 智能体投票
        4. 生成结果
        """
        vote = self._votes.get(vote_id)
        if not vote:
            raise ValueError(f"投票不存在: {vote_id}")
        
        vote.status = VoteStatus.ANALYZING
        vote.started_at = time.time()
        
        logger.info(f"[AI投票] 启动: {vote_id}")
        
        try:
            # 阶段1: 智能体独立分析
            await self._phase_analysis(vote)
            
            # 阶段2: 智能体协商
            await self._phase_negotiation(vote)
            
            # 阶段3: 智能体投票
            await self._phase_voting(vote)
            
            # 阶段4: 计算结果
            await self._phase_calculate(vote)
            
        except Exception as e:
            logger.error(f"[AI投票] 流程失败: {e}")
            vote.status = VoteStatus.CANCELLED
            raise
        
        return vote
    
    async def _phase_analysis(self, vote: AIVote):
        """阶段1: 智能体独立分析"""
        logger.info(f"[AI投票] 阶段1: 智能体分析")
        
        tasks = []
        for agent in vote.config.agents:
            task = self._agent_analyze(agent, vote)
            tasks.append(task)
        
        # 并行执行分析
        results = await asyncio.gather(*tasks, return_exceptions=True)
        
        for agent, result in zip(vote.config.agents, results):
            if isinstance(result, Exception):
                logger.error(f"[AI投票] 智能体 {agent.name} 分析失败: {result}")
                vote.agent_analysis[agent.agent_id] = {
                    "error": str(result),
                    "confidence": 0.0
                }
            else:
                vote.agent_analysis[agent.agent_id] = result
        
        logger.info(f"[AI投票] 分析完成")
    
    async def _agent_analyze(self, agent: AgentConfig, vote: AIVote) -> dict:
        """单个智能体分析 - 支持LLM"""
        
        # 如果使用外部LLM
        if agent.use_external_llm and vote._llm_engine and LLM_ENGINE_AVAILABLE:
            try:
                logger.info(f"[AI投票] {agent.name} 使用 {agent.llm_provider} 进行分析")
                
                # 构建LLM配置
                llm_config = LLMConfig(
                    provider=agent.llm_provider,
                    model=agent.llm_model,
                    api_key=agent.llm_api_key,
                    api_base=agent.llm_api_base,
                    temperature=agent.llm_temperature,
                    max_tokens=agent.llm_max_tokens,
                    role=agent.role,
                    expertise=agent.expertise,
                    personality=agent.llm_personality
                )
                
                # 构建投票信息
                vote_info = {
                    "title": vote.config.title,
                    "description": "",
                    "options": [
                        {"id": opt.id, "text": opt.text, "description": opt.description}
                        for opt in vote.config.options
                    ]
                }
                
                # 调用LLM
                response = await vote._llm_engine.analyze_vote(llm_config, vote_info)
                
                if response.error:
                    logger.warning(f"[AI投票] {agent.name} LLM调用失败: {response.error}，使用模拟模式")
                    return self._mock_analyze(agent, vote)
                
                # 解析结果
                result = json.loads(response.content) if response.content else {}
                
                return {
                    "scores": result.get("scores", {}),
                    "preference": result.get("preference", vote.config.options[0].id),
                    "confidence": result.get("confidence", 0.8),
                    "reasoning": result.get("reasoning", f"基于{agent.role}的专业判断"),
                    "llm_response": response.content,
                    "latency": response.latency,
                    "tokens_used": response.tokens_used
                }
                
            except Exception as e:
                logger.error(f"[AI投票] {agent.name} LLM分析异常: {e}")
                return self._mock_analyze(agent, vote)
        else:
            # 模拟分析
            return self._mock_analyze(agent, vote)
    
    def _mock_analyze(self, agent: AgentConfig, vote: AIVote) -> dict:
        """模拟分析（当LLM不可用时）"""
        import random
        
        # 模拟分析时间
        time.sleep(0.1)
        
        # 基于智能体角色和专长生成分析
        scores = {}
        for option in vote.config.options:
            score = random.uniform(0.5, 0.95)
            scores[option.id] = score
        
        # 选择最倾向的选项
        best_option = max(scores, key=scores.get)
        
        return {
            "scores": scores,
            "preference": best_option,
            "confidence": scores[best_option],
            "reasoning": f"基于{agent.role}的专业判断，{best_option}方案更符合要求",
            "llm_response": "",
            "latency": 0.1,
            "tokens_used": 0
        }
    
    async def _phase_negotiation(self, vote: AIVote):
        """阶段2: 智能体协商"""
        try:
            from .negotiation_engine import NegotiationEngine
            
            logger.info(f"[AI投票] 阶段2: 智能体协商")
            vote.status = VoteStatus.NEGOTIATING
            
            engine = NegotiationEngine()
            result = await engine.facilitate(
                vote=vote,
                max_rounds=vote.config.max_negotiation_rounds,
                duration=vote.config.negotiation_duration
            )
            
            vote.negotiation_history = result.rounds
            vote.consensus_level = result.consensus_level
            
            logger.info(f"[AI投票] 协商完成，共识度: {vote.consensus_level:.2%}")
        except ImportError:
            logger.warning("[AI投票] 协商引擎未加载，跳过协商阶段")
            vote.consensus_level = 0.5
    
    async def _phase_voting(self, vote: AIVote):
        """阶段3: 智能体投票"""
        logger.info(f"[AI投票] 阶段3: 智能体投票")
        vote.status = VoteStatus.VOTING
        
        for agent in vote.config.agents:
            # 获取智能体的分析和协商历史
            analysis = vote.agent_analysis.get(agent.agent_id, {})
            
            # 基于分析结果投票（必须选择）
            if "error" in analysis:
                # 分析失败，基于协商历史投票
                preference = self._get_preference_from_negotiation(vote, agent)
                confidence = 0.5
                reasoning = "基于协商历史"
            else:
                preference = analysis.get("preference")
                confidence = analysis.get("confidence", 0.8)
                reasoning = analysis.get("reasoning", "基于专业判断")
            
            # 创建投票记录
            agent_vote = AgentVote(
                agent_id=agent.agent_id,
                agent_name=agent.name,
                option_id=preference,
                weight=agent.weight,
                confidence=confidence,
                reasoning=reasoning,
                voted_at=time.time(),
                llm_response=analysis.get("llm_response", ""),
                latency=analysis.get("latency", 0.0)
            )
            
            vote.votes.append(agent_vote)
            
            # 更新选项票数
            for option in vote.config.options:
                if option.id == preference:
                    option.votes += 1
                    option.voters.append(agent.agent_id)
                    option.weighted_votes += agent.weight
                    break
            
            logger.info(f"[AI投票] {agent.name} 投票给 {preference} (置信度: {confidence:.2f})")
        
        logger.info(f"[AI投票] 投票完成，共 {len(vote.votes)} 票")
    
    def _get_preference_from_negotiation(self, vote: AIVote, agent: AgentConfig) -> str:
        """从协商历史获取偏好"""
        # 找到该智能体在协商中支持的选项
        for round in reversed(vote.negotiation_history):
            if round.agent_id == agent.agent_id:
                # 简单解析（实际应该更智能）
                for option in vote.config.options:
                    if option.text in round.opinion:
                        return option.id
        
        # 默认返回第一个选项
        return vote.config.options[0].id
    
    async def _phase_calculate(self, vote: AIVote):
        """阶段4: 计算结果"""
        logger.info(f"[AI投票] 阶段4: 计算结果")
        
        # 找出获胜选项（加权票数最多）
        winner = max(vote.config.options, key=lambda o: o.weighted_votes)
        vote.winner = winner
        
        vote.status = VoteStatus.COMPLETED
        vote.completed_at = time.time()
        
        logger.info(f"[AI投票] 结果: {winner.text} 获胜，得票: {winner.weighted_votes:.2f}")
    
    def get_vote(self, vote_id: str) -> Optional[AIVote]:
        """获取投票实例"""
        return self._votes.get(vote_id)
    
    def get_all_votes(self) -> List[AIVote]:
        """获取所有投票"""
        return list(self._votes.values())
    
    async def cancel_vote(self, vote_id: str):
        """取消投票"""
        vote = self._votes.get(vote_id)
        if vote:
            vote.status = VoteStatus.CANCELLED
            logger.info(f"[AI投票] 已取消: {vote_id}")


# 全局实例
ai_voting_system = AIVotingSystem()
