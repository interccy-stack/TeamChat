#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
智能体协商引擎
协调多个智能体之间的讨论，达成共识
"""

import asyncio
import time
from dataclasses import dataclass, field
from typing import List, Dict
import logging

logger = logging.getLogger("teamchat.ai_voting.negotiation")


@dataclass
class NegotiationRound:
    """协商轮次记录"""
    round_number: int
    agent_id: str
    agent_name: str
    opinion: str
    stance: str  # "support", "oppose", "neutral"
    target_option: str  # 针对哪个选项
    timestamp: float = field(default_factory=time.time)


@dataclass
class DiscussionResult:
    """协商结果"""
    rounds: List[NegotiationRound]
    consensus_level: float  # 共识度 0-1
    key_disagreements: List[Dict]  # 关键分歧点
    duration: float  # 协商耗时


class NegotiationEngine:
    """协商引擎"""
    
    def __init__(self):
        self.min_rounds = 2  # 最少协商轮次
        self.consensus_threshold = 0.7  # 共识度阈值
        
    async def facilitate(
        self,
        vote,
        max_rounds: int = 5,
        duration: int = 180
    ) -> DiscussionResult:
        """
        协调智能体协商
        
        Args:
            vote: 投票实例
            max_rounds: 最大协商轮次
            duration: 最大协商时长（秒）
        
        Returns:
            DiscussionResult: 协商结果
        """
        rounds = []
        start_time = time.time()
        
        logger.info(f"[协商引擎] 启动协商，最多{max_rounds}轮，最长{duration}秒")
        
        for round_num in range(1, max_rounds + 1):
            # 检查是否超时
            if time.time() - start_time > duration:
                logger.info(f"[协商引擎] 协商超时，结束于第{round_num-1}轮")
                break
            
            # 每个智能体发言
            for agent in vote.config.agents:
                # 生成智能体观点
                opinion = await self._generate_opinion(agent, vote, rounds)
                
                round_record = NegotiationRound(
                    round_number=round_num,
                    agent_id=agent.agent_id,
                    agent_name=agent.name,
                    opinion=opinion["text"],
                    stance=opinion["stance"],
                    target_option=opinion["target"]
                )
                
                rounds.append(round_record)
                
                logger.debug(f"[协商引擎] 第{round_num}轮 - {agent.name}: {opinion['text'][:50]}...")
                
                # 短暂延迟，模拟真实对话节奏
                await asyncio.sleep(0.3)
            
            # 计算当前共识度
            consensus = self._calculate_consensus(vote, rounds)
            
            logger.info(f"[协商引擎] 第{round_num}轮完成，共识度: {consensus:.2%}")
            
            # 检查是否达成共识
            if round_num >= self.min_rounds and consensus >= self.consensus_threshold:
                logger.info(f"[协商引擎] 达成共识，结束协商")
                break
        
        # 分析关键分歧点
        disagreements = self._identify_disagreements(vote, rounds)
        
        # 最终共识度
        final_consensus = self._calculate_consensus(vote, rounds)
        
        elapsed = time.time() - start_time
        
        logger.info(f"[协商引擎] 协商结束，共{len(rounds)}条发言，耗时{elapsed:.1f}秒")
        
        return DiscussionResult(
            rounds=rounds,
            consensus_level=final_consensus,
            key_disagreements=disagreements,
            duration=elapsed
        )
    
    async def _generate_opinion(
        self,
        agent,
        vote,
        history: List[NegotiationRound]
    ) -> Dict:
        """
        生成智能体观点
        
        实际实现中应该调用智能体的API
        这里使用模拟逻辑
        """
        # 获取智能体的分析结果
        analysis = vote.agent_analysis.get(agent.agent_id, {})
        preference = analysis.get("preference", vote.config.options[0].id)
        
        # 查找该智能体之前的发言
        previous_opinions = [
            r for r in history
            if r.agent_id == agent.agent_id
        ]
        
        # 基于偏好生成观点
        preferred_option = next(
            (o for o in vote.config.options if o.id == preference),
            vote.config.options[0]
        )
        
        # 检查是否有反对意见
        opposing_views = [
            r for r in history
            if r.target_option == preference and r.stance == "oppose"
        ]
        
        # 生成观点文本
        if opposing_views and len(previous_opinions) > 0:
            # 回应反对意见
            text = f"我理解{opposing_views[-1].agent_name}的顾虑，但从{agent.role}角度，{preferred_option.text}仍然是最优选择，因为{analysis.get('reasoning', '综合评估后风险可控')}"
            stance = "support"
        elif len(previous_opinions) == 0:
            # 首次发言
            text = f"作为{agent.role}，我建议选择{preferred_option.text}。{analysis.get('reasoning', '该方案更符合我们的需求')}"
            stance = "support"
        else:
            # 补充观点
            text = f"补充说明：{preferred_option.text}在{agent.expertise[0] if agent.expertise else '实际应用'}方面表现优异"
            stance = "support"
        
        return {
            "text": text,
            "stance": stance,
            "target": preference
        }
    
    def _calculate_consensus(self, vote, rounds: List[NegotiationRound]) -> float:
        """
        计算共识度
        
        基于智能体对获胜选项的支持程度
        """
        if not rounds:
            return 0.0
        
        # 统计每个选项的支持度
        option_support = {}
        for option in vote.config.options:
            option_support[option.id] = {
                "support": 0,
                "oppose": 0,
                "neutral": 0,
                "total_weight": 0.0
            }
        
        # 分析每轮发言
        for round in rounds:
            if round.stance == "support":
                option_support[round.target_option]["support"] += 1
            elif round.stance == "oppose":
                option_support[round.target_option]["oppose"] += 1
            else:
                option_support[round.target_option]["neutral"] += 1
        
        # 找出最受支持的选项
        best_option = max(option_support.keys(),
                         key=lambda k: option_support[k]["support"])
        
        # 计算共识度
        total_agents = len(vote.config.agents)
        support_count = option_support[best_option]["support"]
        oppose_count = sum(option_support[k]["oppose"] for k in option_support)
        
        # 共识度 = 支持比例 - 反对比例
        consensus = (support_count / total_agents) - (oppose_count / total_agents * 0.5)
        
        return max(0.0, min(1.0, consensus))
    
    def _identify_disagreements(self, vote, rounds: List[NegotiationRound]) -> List[Dict]:
        """识别关键分歧点"""
        disagreements = []
        
        # 统计每个选项的争议程度
        for option in vote.config.options:
            option_rounds = [r for r in rounds if r.target_option == option.id]
            
            support = sum(1 for r in option_rounds if r.stance == "support")
            oppose = sum(1 for r in option_rounds if r.stance == "oppose")
            
            # 有争议（同时有支持和反对）
            if support > 0 and oppose > 0:
                disagreements.append({
                    "option_id": option.id,
                    "option_text": option.text,
                    "support_count": support,
                    "oppose_count": oppose,
                    "severity": "high" if oppose > support else "medium"
                })
        
        return disagreements
