#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
AI决策协商引擎 v1.0.0
负责智能体间的多轮协商和共识达成
"""

import asyncio
import json
import time
import uuid
from typing import Dict, List, Optional, Tuple
from dataclasses import dataclass
import logging

logger = logging.getLogger("qwenpaw.ai_decision.negotiation")


@dataclass
class NegotiationRound:
    """协商轮次"""
    round_number: int
    agent_id: str
    agent_name: str
    opinion: str
    timestamp: float


@dataclass
class NegotiationResult:
    """协商结果"""
    rounds: List[NegotiationRound]
    consensus_level: float
    final_agreement: str
    duration: float


class NegotiationEngine:
    """协商引擎"""
    
    def __init__(self):
        pass
    
    async def facilitate(self, vote, max_rounds: int = 5, 
                        duration: int = 180) -> NegotiationResult:
        """主持协商流程
        
        Args:
            vote: 投票实例
            max_rounds: 最大协商轮次
            duration: 协商时长限制（秒）
        
        Returns:
            NegotiationResult: 协商结果
        """
        start_time = time.time()
        rounds = []
        all_opinions = []
        
        logger.info(f"[协商] 开始协商，最大{max_rounds}轮，时长{duration}秒")
        
        for round_num in range(1, max_rounds + 1):
            # 检查时间限制
            elapsed = time.time() - start_time
            if elapsed > duration:
                logger.info(f"[协商] 达到时间限制: {duration}秒")
                break
            
            # 每轮每个智能体发言
            for agent in vote.config.agents:
                # 基于智能体分析结果生成发言
                analysis = vote.agent_analysis.get(agent.agent_id, {})
                
                # 如果使用LLM，调用协商
                if agent.use_external_llm and vote._llm_engine:
                    try:
                        opinion = await self._llm_negotiate(
                            vote._llm_engine, agent, vote, analysis, 
                            all_opinions, round_num
                        )
                    except Exception as e:
                        logger.warning(f"[协商] {agent.name} LLM协商失败: {e}")
                        opinion = self._generate_opinion(agent, vote, analysis, 
                                                        all_opinions, round_num)
                else:
                    opinion = self._generate_opinion(agent, vote, analysis, 
                                                    all_opinions, round_num)
                
                round_record = NegotiationRound(
                    round_number=round_num,
                    agent_id=agent.agent_id,
                    agent_name=agent.name,
                    opinion=opinion,
                    timestamp=time.time()
                )
                rounds.append(round_record)
                all_opinions.append(f"[{agent.name}({agent.role})]: {opinion}")
            
            logger.info(f"[协商] 第{round_num}轮完成")
            
            # 检查是否达成共识
            consensus = self._check_consensus(rounds, vote.config.agents)
            if consensus >= 0.8:
                logger.info(f"[协商] 达成共识: {consensus:.2%}")
                break
        
        # 计算最终共识度
        final_consensus = self._calculate_final_consensus(rounds, vote)
        
        result = NegotiationResult(
            rounds=rounds,
            consensus_level=final_consensus,
            final_agreement=self._generate_agreement(vote, rounds),
            duration=time.time() - start_time
        )
        
        logger.info(f"[协商] 协商完成，共识度: {final_consensus:.2%}")
        return result
    
    async def _llm_negotiate(self, engine, agent, vote, analysis, 
                           all_opinions, round_num) -> str:
        """使用LLM进行协商"""
        try:
            from .llm_engine import LLMConfig
            
            config = LLMConfig(
                provider=agent.llm_provider,
                model=agent.llm_model,
                api_key=agent.llm_api_key,
                role=agent.role,
                expertise=agent.expertise,
                personality=agent.llm_personality
            )
            
            vote_info = {
                "title": vote.config.title,
                "description": "",
                "options": [
                    {"id": o.id, "text": o.text, "description": o.description}
                    for o in vote.config.options
                ]
            }
            
            response = await engine.negotiate(
                config, vote_info,
                previous_analysis=analysis,
                other_opinions=[{"agent": "", "opinion": o} for o in all_opinions[-5:]]
            )
            
            if response.content:
                try:
                    result = json.loads(response.content)
                    return result.get("opinion", response.content[:200])
                except:
                    return response.content[:200]
            
            return response.content[:200] if response.content else self._generate_opinion(agent, vote, analysis, all_opinions, round_num)
            
        except Exception as e:
            logger.error(f"[协商] LLM调用失败: {e}")
            return self._generate_opinion(agent, vote, analysis, all_opinions, round_num)
    
    def _generate_opinion(self, agent, vote, analysis, all_opinions, round_num) -> str:
        """生成模拟协商发言"""
        import random
        
        opinion_templates = [
            f"基于{agent.role}的专业判断，我倾向于选择{analysis.get('preference', '选项A')}方案。",
            f"我同意其他智能体的观点，{analysis.get('preference', '选项A')}方案确实有优势。",
            f"经过{round_num}轮讨论，我认为{analysis.get('preference', '选项A')}是最佳选择。",
            f"从{', '.join(agent.expertise[:2])}角度考虑，{analysis.get('preference', '选项A')}方案更合适。",
            f"我理解其他意见，但坚持{analysis.get('preference', '选项A')}方案。",
            f"综合各方意见，{analysis.get('preference', '选项A')}方案在多项指标上表现更优。"
        ]
        
        # 基于轮次选择不同的发言
        if round_num == 1:
            return f"首次发言：作为{agent.role}，我认为需全面评估各方案的优劣。"
        elif round_num == 2:
            return random.choice(opinion_templates[:3])
        elif round_num == 3:
            return random.choice(opinion_templates[3:])
        else:
            return random.choice(opinion_templates)
    
    def _check_consensus(self, rounds: List[NegotiationRound], 
                        agents: List) -> float:
        """检查当前共识度"""
        if not rounds:
            return 0.0
        
        # 统计每个智能体最后发言的倾向
        agent_opinions = {}
        for r in rounds:
            agent_opinions[r.agent_id] = r.opinion
        
        # 简化：只要所有智能体都发言了就认为有一定共识
        if len(agent_opinions) >= len(agents):
            return 0.7
        return len(agent_opinions) / len(agents) * 0.7
    
    def _calculate_final_consensus(self, rounds: List[NegotiationRound], vote) -> float:
        """计算最终共识度"""
        if not rounds:
            return 0.0
        
        # 基于投票结果计算共识度
        if vote.votes:
            winner = vote.winner
            if winner:
                total_weight = sum(o.weighted_votes for o in vote.config.options)
                if total_weight > 0:
                    return winner.weighted_votes / total_weight
        
        return 0.5
    
    def _generate_agreement(self, vote, rounds: List[NegotiationRound]) -> str:
        """生成最终协议"""
        winner = vote.winner
        if winner and vote.votes:
            supporter_names = [v.agent_name for v in vote.votes if v.option_id == winner.id]
            return f"经{len(rounds)}轮协商，{len(supporter_names)}位智能体支持「{winner.text}」方案"
        return "未能达成一致意见"
    
    def _identify_disagreements(self, vote, negotiation_history) -> List[Dict]:
        """识别分歧点"""
        disagreements = []
        
        for option in vote.config.options:
            supporters = [v for v in vote.votes if v.option_id == option.id]
            opposers = [v for v in vote.votes if v.option_id != option.id]
            
            if len(supporters) > 0 and len(opposers) > 0:
                severity = "high" if len(opposers) > len(supporters) else "medium" if len(opposers) >= len(supporters) / 2 else "low"
                
                disagreements.append({
                    "option_id": option.id,
                    "option_text": option.text,
                    "severity": severity,
                    "support_count": len(supporters),
                    "oppose_count": len(opposers)
                })
        
        return disagreements