#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
AI决策核心模块 v1.0.0
支持多AI平台并发查询（全提问内置引擎）
"""

import asyncio
import json
import time
import uuid
from enum import Enum
from dataclasses import dataclass, field
from typing import List, Dict, Optional, Any
from datetime import datetime
import logging

logger = logging.getLogger("qwenpaw.ai_decision.core")


class VoteStatus(Enum):
    CREATED = "created"
    ANALYZING = "analyzing"
    NEGOTIATING = "negotiating"
    VOTING = "voting"
    COMPLETED = "completed"
    CANCELLED = "cancelled"


class VoteOption:
    def __init__(self, id: str, text: str, description: str = ""):
        self.id = id
        self.text = text
        self.description = description
        self.votes = 0
        self.voters = []
        self.weighted_votes = 0.0


@dataclass
class AgentConfig:
    agent_id: str
    name: str
    role: str
    weight: float = 1.0
    expertise: List[str] = field(default_factory=list)
    use_external_llm: bool = False
    llm_provider: str = ""
    llm_api_key: str = ""
    llm_api_base: str = ""
    llm_model: str = ""
    llm_temperature: float = 0.7
    llm_max_tokens: int = 2000
    llm_personality: str = ""


@dataclass
class VoteConfig:
    title: str
    options: List[VoteOption]
    agents: List[AgentConfig]
    negotiation_duration: int = 180
    consensus_threshold: float = 0.7
    max_negotiation_rounds: int = 5
    allow_abstain: bool = False
    use_llm_analysis: bool = True


@dataclass
class AgentVote:
    agent_id: str
    agent_name: str
    option_id: str
    weight: float
    confidence: float
    reasoning: str
    voted_at: float
    llm_response: str = ""
    latency: float = 0.0


class AIVote:
    def __init__(self, config: VoteConfig):
        self.id = str(uuid.uuid4())
        self.config = config
        self.status = VoteStatus.CREATED
        self.created_at = time.time()
        self.started_at = None
        self.completed_at = None
        self.votes: List[AgentVote] = []
        self.negotiation_history: List = []
        self.agent_analysis: Dict[str, Dict] = {}
        self.consensus_level: float = 0.0
        self.winner: Optional[VoteOption] = None
        self._llm_engine = None
        try:
            from .llm_engine import LLMVotingEngine
            if config.use_llm_analysis:
                self._llm_engine = LLMVotingEngine()
        except ImportError:
            pass
    
    def to_dict(self) -> Dict:
        """转换为字典"""
        try:
            # 安全处理 winner
            winner_dict = None
            if self.winner is not None:
                try:
                    winner_id = getattr(self.winner, 'id', None)
                    winner_text = getattr(self.winner, 'text', None)
                    if winner_id is not None and winner_text is not None:
                        winner_dict = {"id": winner_id, "text": winner_text}
                except Exception:
                    pass

            # 安全处理 negotiation_history
            negotiation_list = []
            if self.negotiation_history:
                for r in self.negotiation_history:
                    try:
                        if hasattr(r, '__dict__'):
                            negotiation_list.append({
                                "round_number": getattr(r, 'round_number', 0),
                                "agent_id": getattr(r, 'agent_id', ''),
                                "agent_name": getattr(r, 'agent_name', ''),
                                "opinion": getattr(r, 'opinion', ''),
                                "timestamp": getattr(r, 'timestamp', 0)
                            })
                        elif isinstance(r, dict):
                            negotiation_list.append(r)
                    except Exception:
                        pass

            return {
                "id": self.id,
                "title": self.config.title if self.config else "",
                "status": self.status.value if hasattr(self.status, 'value') else str(self.status),
                "created_at": self.created_at,
                "started_at": self.started_at,
                "completed_at": self.completed_at,
                "options": [
                    {"id": getattr(o, 'id', ''), "text": getattr(o, 'text', ''), "description": getattr(o, 'description', ''),
                     "votes": getattr(o, 'votes', 0), "voters": getattr(o, 'voters', []),
                     "weighted_votes": getattr(o, 'weighted_votes', 0.0)}
                    for o in (self.config.options if self.config else [])
                ],
                "agents": [
                    {"agent_id": a.agent_id, "name": a.name, "role": a.role,
                     "weight": a.weight, "expertise": a.expertise,
                     "use_external_llm": a.use_external_llm, "llm_provider": a.llm_provider}
                    for a in (self.config.agents if self.config else [])
                ],
                "votes": [
                    {"agent_id": v.agent_id, "agent_name": v.agent_name,
                     "option_id": v.option_id, "weight": v.weight,
                     "confidence": v.confidence, "reasoning": v.reasoning,
                     "voted_at": v.voted_at, "latency": v.latency,
                     "llm_response": v.llm_response}
                    for v in self.votes
                ],
                "consensus_level": self.consensus_level,
                "winner": winner_dict,
                "negotiation_history": negotiation_list
            }
        except Exception as e:
            logger.error(f"[AI决策] to_dict 失败: {e}")
            return {
                "id": getattr(self, 'id', 'unknown'),
                "title": "加载失败",
                "status": "error",
                "created_at": getattr(self, 'created_at', 0),
                "error": str(e)
            }


class AIVotingSystem:
    def __init__(self):
        self._votes: Dict[str, AIVote] = {}
    
    async def create_vote(self, config: VoteConfig) -> AIVote:
        vote = AIVote(config)
        self._votes[vote.id] = vote
        logger.info(f"[AI决策] 创建: {vote.id}")
        return vote
    
    async def start_vote(self, vote_id: str):
        vote = self._votes.get(vote_id)
        if not vote:
            raise ValueError(f"投票不存在: {vote_id}")
        
        vote.status = VoteStatus.ANALYZING
        vote.started_at = time.time()
        logger.info(f"[AI决策] 启动: {vote_id}")
        
        try:
            await self._phase_analysis(vote)
            await self._phase_negotiation(vote)
            await self._phase_voting(vote)
            await self._phase_calculate(vote)
        except Exception as e:
            logger.error(f"[AI决策] 流程失败: {e}")
            vote.status = VoteStatus.CANCELLED
            raise
        
        return vote
    
    async def _phase_analysis(self, vote: AIVote):
        logger.info(f"[AI决策] 阶段1: 智能体分析")
        tasks = [self._agent_analyze(agent, vote) for agent in vote.config.agents]
        results = await asyncio.gather(*tasks, return_exceptions=True)
        for agent, result in zip(vote.config.agents, results):
            if isinstance(result, Exception):
                logger.error(f"[AI决策] {agent.name} 分析失败: {result}")
                vote.agent_analysis[agent.agent_id] = {"error": str(result), "confidence": 0.0}
            else:
                vote.agent_analysis[agent.agent_id] = result
        logger.info(f"[AI决策] 分析完成")
    
    async def _agent_analyze(self, agent: AgentConfig, vote: AIVote) -> dict:
        """智能体分析 - 优先使用本地QwenPaw智能体"""
        # 优先尝试 QwenPaw 桥接（调用本地真实Agent，无需 API Key）
        try:
            from .llm_engine import qp_bridge
            logger.info(f"[AI决策] {agent.name} 尝试 QwenPaw 桥接，可用状态: {qp_bridge.available}")
            
            vote_info = {
                "title": vote.config.title, "description": "",
                "options": [{"id": o.id, "text": o.text, "description": o.description}
                          for o in vote.config.options]
            }
            
            response = await qp_bridge.analyze(
                role=agent.role or agent.name,
                expertise=agent.expertise,
                vote_info=vote_info
            )
            
            logger.info(f"[AI决策] {agent.name} 桥接响应: provider={response.provider}, "
                       f"error={response.error}, content长度={len(response.content) if response.content else 0}")
            
            if response.content and not response.error:
                parsed = self._parse_bridge_response(response.content)
                
                # 检查解析结果
                if "error" in parsed:
                    logger.warning(f"[AI决策] {agent.name} JSON解析失败: {parsed.get('error')}")
                else:
                    logger.info(f"[AI决策] {agent.name} 本地智能体分析成功，provider={response.provider}")
                    return {
                        "scores": parsed.get("scores", {}),
                        "preference": parsed.get("preference", vote.config.options[0].id if vote.config.options else ""),
                        "confidence": parsed.get("confidence", 0.8),
                        "reasoning": parsed.get("reasoning", f"基于{agent.role}的专业判断"),
                        "llm_response": response.content,
                        "latency": response.latency,
                        "tokens_used": response.tokens_used,
                        "bridge_provider": response.provider
                    }
            else:
                logger.warning(f"[AI决策] QwenPaw桥接失败 ({agent.name}): {response.error}")
        except Exception as e:
            logger.warning(f"[AI决策] QwenPaw桥接异常 ({agent.name}): {e}", exc_info=True)
        
        # 回退：外部 API 调用（需要 API Key）
        if agent.use_external_llm and vote._llm_engine and agent.llm_api_key:
                try:
                    from .llm_engine import LLMConfig
                    logger.info(f"[AI决策] {agent.name} 使用 {agent.llm_provider} 直接分析")
                    
                    llm_config = LLMConfig(
                        provider=agent.llm_provider, model=agent.llm_model,
                        api_key=agent.llm_api_key, api_base=agent.llm_api_base,
                        temperature=agent.llm_temperature, max_tokens=agent.llm_max_tokens,
                        role=agent.role, expertise=agent.expertise,
                        personality=agent.llm_personality
                    )
                    
                    vote_info = {
                        "title": vote.config.title, "description": "",
                        "options": [{"id": o.id, "text": o.text, "description": o.description}
                                  for o in vote.config.options]
                    }
                    
                    response = await vote._llm_engine.analyze_vote(llm_config, vote_info)
                    
                    if response.content and not response.error:
                        result = json.loads(response.content)
                        return {
                            "scores": result.get("scores", {}),
                            "preference": result.get("preference", vote.config.options[0].id if vote.config.options else ""),
                            "confidence": result.get("confidence", 0.8),
                            "reasoning": result.get("reasoning", f"基于{agent.role}的专业判断"),
                            "llm_response": response.content,
                            "latency": response.latency,
                            "tokens_used": response.tokens_used
                        }
                    else:
                        logger.warning(f"[AI决策] {agent.name} 外部LLM返回错误: {response.error}")
                except Exception as e:
                    logger.error(f"[AI决策] {agent.name} 外部LLM异常: {e}")
        
        # 最终回退：模拟分析
        fallback_reason = "本地智能体和外部LLM均不可用"
        return self._mock_analyze(agent, vote, fallback_reason)
    
    def _parse_bridge_response(self, content: str) -> dict:
        """解析桥接响应JSON"""
        try:
            return json.loads(content)
        except json.JSONDecodeError:
            import re
            patterns = [r'```json\s*\n(.*?)\n```', r'```\s*\n(.*?)\n```', r'\{[\s\S]*\}']
            for pattern in patterns:
                match = re.search(pattern, content, re.DOTALL)
                if match:
                    try:
                        return json.loads(match.group(1) if '`' in pattern else match.group(0))
                    except:
                        pass
        return {"error": "parse_failed"}
    
    def _mock_analyze(self, agent: AgentConfig, vote: AIVote, reason: str = "LLM API不可用") -> dict:
        """模拟分析 - 当真实LLM调用失败时使用"""
        import random
        time.sleep(0.1)
        scores = {}
        for option in vote.config.options:
            scores[option.id] = random.uniform(0.5, 0.95)
        best_option = max(scores, key=scores.get)
        
        # 生成模拟的LLM回复，明确标记为模拟
        mock_response = json.dumps({
            "scores": scores,
            "preference": best_option,
            "confidence": scores[best_option],
            "reasoning": f"基于{agent.role}的专业判断，{best_option}方案更符合要求",
            "analysis": f"【模拟数据】{reason}。Agent {agent.name} 基于角色 '{agent.role}' 生成了模拟分析。"
        }, ensure_ascii=False)
        
        logger.info(f"[AI决策] {agent.name} 使用模拟分析: {reason}")
        
        return {
            "scores": scores,
            "preference": best_option,
            "confidence": scores[best_option],
            "reasoning": f"基于{agent.role}的专业判断，{best_option}方案更符合要求",
            "llm_response": mock_response,
            "latency": 0.1,
            "tokens_used": 0,
            "is_mock": True
        }
    
    async def _phase_negotiation(self, vote: AIVote):
        try:
            from .negotiation_engine import NegotiationEngine
            logger.info(f"[AI决策] 阶段2: 智能体协商")
            vote.status = VoteStatus.NEGOTIATING
            engine = NegotiationEngine()
            result = await engine.facilitate(
                vote=vote, max_rounds=vote.config.max_negotiation_rounds,
                duration=vote.config.negotiation_duration
            )
            vote.negotiation_history = result.rounds
            vote.consensus_level = result.consensus_level
            logger.info(f"[AI决策] 协商完成，共识度: {vote.consensus_level:.2%}")
        except ImportError:
            logger.warning("[AI决策] 协商引擎未加载，跳过")
            vote.consensus_level = 0.5
    
    async def _phase_voting(self, vote: AIVote):
        logger.info(f"[AI决策] 阶段3: 智能体投票")
        vote.status = VoteStatus.VOTING
        for agent in vote.config.agents:
            analysis = vote.agent_analysis.get(agent.agent_id, {})
            if "error" in analysis:
                preference = self._get_preference_from_negotiation(vote, agent)
                confidence = 0.5
                reasoning = "基于协商历史"
            else:
                preference = analysis.get("preference")
                confidence = analysis.get("confidence", 0.8)
                reasoning = analysis.get("reasoning", "基于专业判断")
            
            agent_vote = AgentVote(
                agent_id=agent.agent_id, agent_name=agent.name,
                option_id=preference, weight=agent.weight,
                confidence=confidence, reasoning=reasoning,
                voted_at=time.time(),
                llm_response=analysis.get("llm_response", ""),
                latency=analysis.get("latency", 0.0)
            )
            vote.votes.append(agent_vote)
            for option in vote.config.options:
                if option.id == preference:
                    option.votes += 1
                    option.voters.append(agent.agent_id)
                    option.weighted_votes += agent.weight
                    break
            logger.info(f"[AI决策] {agent.name} 投票: {preference} (置信度:{confidence:.2f})")
        logger.info(f"[AI决策] 投票完成，共 {len(vote.votes)} 票")
    
    def _get_preference_from_negotiation(self, vote: AIVote, agent: AgentConfig) -> str:
        for round_rec in reversed(vote.negotiation_history):
            if round_rec.agent_id == agent.agent_id:
                for option in vote.config.options:
                    if option.text in round_rec.opinion:
                        return option.id
        return vote.config.options[0].id
    
    async def _phase_calculate(self, vote: AIVote):
        logger.info(f"[AI决策] 阶段4: 计算结果")
        winner = max(vote.config.options, key=lambda o: o.weighted_votes)
        vote.winner = winner
        vote.status = VoteStatus.COMPLETED
        vote.completed_at = time.time()
        logger.info(f"[AI决策] 结果: {winner.text} 获胜 ({winner.weighted_votes:.2f}票)")
    
    def get_vote(self, vote_id: str) -> Optional[AIVote]:
        return self._votes.get(vote_id)
    
    def get_all_votes(self) -> List[AIVote]:
        return list(self._votes.values())
    
    async def cancel_vote(self, vote_id: str):
        vote = self._votes.get(vote_id)
        if vote:
            vote.status = VoteStatus.CANCELLED
            logger.info(f"[AI决策] 已取消: {vote_id}")


ai_decision_system = AIVotingSystem()