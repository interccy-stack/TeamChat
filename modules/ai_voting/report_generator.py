#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
AI决策报告生成器
自动生成投票分析和决策建议
"""

import json
import time
from datetime import datetime
from typing import Dict, List
import logging

logger = logging.getLogger("teamchat.ai_voting.report")


class ReportGenerator:
    """决策报告生成器"""
    
    def __init__(self):
        self.confidence_thresholds = {
            "high": 0.8,
            "medium": 0.6,
            "low": 0.4
        }
    
    async def generate(self, vote) -> Dict:
        """
        生成完整决策报告
        
        Args:
            vote: 投票实例
        
        Returns:
            Dict: 报告数据
        """
        logger.info(f"[报告生成] 开始生成报告: {vote.id}")
        
        report = {
            "meta": self._generate_meta(vote),
            "summary": self._generate_summary(vote),
            "vote_details": self._generate_vote_details(vote),
            "consensus_analysis": self._generate_consensus_analysis(vote),
            "disagreements": self._generate_disagreements(vote),
            "recommendations": self._generate_recommendations(vote),
            "risk_assessment": self._generate_risk_assessment(vote),
            "next_steps": self._generate_next_steps(vote)
        }
        
        logger.info(f"[报告生成] 完成")
        return report
    
    def _generate_meta(self, vote) -> Dict:
        """生成元信息"""
        return {
            "vote_id": vote.id,
            "title": vote.config.title,
            "generated_at": datetime.now().isoformat(),
            "duration": self._format_duration(vote.completed_at - vote.started_at) if vote.completed_at else "N/A",
            "total_agents": len(vote.config.agents),
            "status": vote.status.value
        }
    
    def _generate_summary(self, vote) -> Dict:
        """生成决策摘要"""
        winner = vote.winner
        total_weighted_votes = sum(o.weighted_votes for o in vote.config.options)
        
        if not winner:
            return {
                "conclusion": "投票未完成",
                "winner": None,
                "confidence": "N/A",
                "risk_level": "N/A"
            }
        
        # 计算获胜比例
        winner_ratio = winner.weighted_votes / total_weighted_votes if total_weighted_votes > 0 else 0
        
        # 确定置信度
        if winner_ratio >= 0.6 and vote.consensus_level >= 0.7:
            confidence = "high"
        elif winner_ratio >= 0.5 and vote.consensus_level >= 0.5:
            confidence = "medium"
        else:
            confidence = "low"
        
        # 风险等级
        if vote.consensus_level >= 0.8:
            risk = "low"
        elif vote.consensus_level >= 0.5:
            risk = "medium"
        else:
            risk = "high"
        
        return {
            "conclusion": f"推荐方案：{winner.text}",
            "winner": {
                "id": winner.id,
                "text": winner.text,
                "votes": winner.votes,
                "weighted_votes": round(winner.weighted_votes, 2),
                "ratio": f"{winner_ratio:.1%}"
            },
            "confidence": confidence,
            "risk_level": risk,
            "consensus_level": f"{vote.consensus_level:.1%}"
        }
    
    def _generate_vote_details(self, vote) -> Dict:
        """生成投票详情"""
        options = []
        for i, option in enumerate(vote.config.options):
            # 找出支持该选项的智能体
            supporters = [
                {
                    "agent_id": v.agent_id,
                    "agent_name": v.agent_name,
                    "weight": v.weight,
                    "confidence": v.confidence
                }
                for v in vote.votes
                if v.option_id == option.id
            ]
            
            total_weight = sum(s["weight"] for s in supporters)
            avg_confidence = sum(s["confidence"] for s in supporters) / len(supporters) if supporters else 0
            
            rank = i + 1
            medal = "🥇" if rank == 1 else "🥈" if rank == 2 else "🥉" if rank == 3 else ""
            
            options.append({
                "rank": rank,
                "medal": medal,
                "id": option.id,
                "text": option.text,
                "votes": option.votes,
                "weighted_votes": round(option.weighted_votes, 2),
                "supporters": supporters,
                "total_support_weight": round(total_weight, 2),
                "avg_confidence": round(avg_confidence, 2)
            })
        
        # 按加权票数排序
        options.sort(key=lambda x: x["weighted_votes"], reverse=True)
        
        return {
            "total_options": len(vote.config.options),
            "total_votes": len(vote.votes),
            "total_weight": round(sum(o.weighted_votes for o in vote.config.options), 2),
            "options": options
        }
    
    def _generate_consensus_analysis(self, vote) -> Dict:
        """生成共识度分析"""
        level = vote.consensus_level
        
        if level >= 0.8:
            description = "高度共识，决策风险低"
            factors = [
                "多数智能体支持同一方案",
                "协商过程中分歧得到有效解决",
                "各角色专业判断趋于一致"
            ]
        elif level >= 0.6:
            description = "基本共识，存在轻微分歧"
            factors = [
                "主要智能体达成一致",
                "少数智能体持保留意见",
                "建议关注潜在风险点"
            ]
        elif level >= 0.4:
            description = "共识度较低，决策存在风险"
            factors = [
                "智能体间分歧较大",
                "可能需要进一步讨论",
                "建议重新评估方案"
            ]
        else:
            description = "共识度很低，不建议执行"
            factors = [
                "智能体间存在严重分歧",
                "方案可能不满足多方需求",
                "强烈建议重新设计投票"
            ]
        
        return {
            "level": round(level, 2),
            "percentage": f"{level:.1%}",
            "description": description,
            "factors": factors
        }
    
    def _generate_disagreements(self, vote) -> List[Dict]:
        """生成分歧点分析"""
        from .negotiation_engine import NegotiationEngine
        
        engine = NegotiationEngine()
        disagreements = engine._identify_disagreements(vote, vote.negotiation_history)
        
        detailed_disagreements = []
        for d in disagreements:
            # 找出支持和反对的理由
            support_reasons = []
            oppose_reasons = []
            
            for v in vote.votes:
                if v.option_id == d["option_id"]:
                    support_reasons.append({
                        "agent": v.agent_name,
                        "reason": v.reasoning
                    })
                else:
                    # 找到该智能体的实际投票
                    actual_vote = next((vv for vv in vote.votes if vv.agent_id == v.agent_id), None)
                    if actual_vote:
                        oppose_reasons.append({
                            "agent": v.agent_name,
                            "reason": f"选择了其他方案：{actual_vote.option_id}"
                        })
            
            detailed_disagreements.append({
                "option_id": d["option_id"],
                "option_text": d["option_text"],
                "severity": d["severity"],
                "support_count": d["support_count"],
                "oppose_count": d["oppose_count"],
                "support_reasons": support_reasons[:3],  # 最多3个
                "oppose_reasons": oppose_reasons[:3],
                "recommendation": self._resolve_disagreement(d)
            })
        
        return detailed_disagreements
    
    def _resolve_disagreement(self, disagreement: Dict) -> str:
        """生成分歧解决建议"""
        severity = disagreement["severity"]
        
        if severity == "high":
            return "建议组织专项讨论，深入分析分歧原因，必要时调整方案设计"
        elif severity == "medium":
            return "建议在执行过程中关注相关风险，准备应急预案"
        else:
            return "分歧较小，可按当前方案执行"
    
    def _generate_recommendations(self, vote) -> List[Dict]:
        """生成AI建议"""
        recommendations = []
        
        # 基于获胜方案的建议
        winner = vote.winner
        if winner:
            recommendations.append({
                "category": "执行建议",
                "priority": "high",
                "content": f"采用「{winner.text}」作为实施方案",
                "rationale": f"该方案获得{winner.votes}票支持，加权得票{winner.weighted_votes:.2f}，是多数智能体的共识选择"
            })
        
        # 基于共识度的建议
        if vote.consensus_level < 0.6:
            recommendations.append({
                "category": "风险提示",
                "priority": "high",
                "content": "共识度较低，建议进行补充说明或调整方案",
                "rationale": f"当前共识度仅{vote.consensus_level:.1%}，可能存在执行阻力"
            })
        
        # 基于智能体权重的建议
        high_weight_dissenters = [
            v for v in vote.votes
            if v.option_id != winner.id and v.weight > 0.2
        ] if winner else []
        
        if high_weight_dissenters:
            agent_names = ", ".join([v.agent_name for v in high_weight_dissenters[:2]])
            recommendations.append({
                "category": "协调建议",
                "priority": "medium",
                "content": f"关注{agent_names}等权重较高的反对意见",
                "rationale": "高权重智能体的反对可能反映关键风险点"
            })
        
        # 基于协商历史的建议
        if len(vote.negotiation_history) >= vote.config.max_negotiation_rounds:
            recommendations.append({
                "category": "流程建议",
                "priority": "low",
                "content": "协商轮次达到上限，建议下次预留更长时间",
                "rationale": "充分的协商时间有助于达成更高共识"
            })
        
        return recommendations
    
    def _generate_risk_assessment(self, vote) -> Dict:
        """生成风险评估"""
        risks = []
        
        # 共识度风险
        if vote.consensus_level < 0.6:
            risks.append({
                "type": "共识风险",
                "level": "high",
                "description": "智能体间分歧较大，执行可能受阻",
                "mitigation": "组织补充讨论，明确执行细节和责任分工"
            })
        elif vote.consensus_level < 0.8:
            risks.append({
                "type": "共识风险",
                "level": "medium",
                "description": "存在部分智能体持保留意见",
                "mitigation": "执行中持续沟通，及时调整"
            })
        
        # 低置信度风险
        low_confidence_votes = [v for v in vote.votes if v.confidence < 0.6]
        if len(low_confidence_votes) > len(vote.votes) / 3:
            risks.append({
                "type": "决策质量风险",
                "level": "medium",
                "description": f"{len(low_confidence_votes)}个智能体置信度较低",
                "mitigation": "收集更多信息后再做最终决策"
            })
        
        # 权重集中风险
        winner = vote.winner
        if winner:
            total_weight = sum(o.weighted_votes for o in vote.config.options)
            winner_ratio = winner.weighted_votes / total_weight if total_weight > 0 else 0
            
            if winner_ratio < 0.4:
                risks.append({
                    "type": "决策稳定性风险",
                    "level": "medium",
                    "description": "获胜方案优势不明显，可能被挑战",
                    "mitigation": "准备备选方案，建立决策复核机制"
                })
        
        overall_risk = "low"
        if any(r["level"] == "high" for r in risks):
            overall_risk = "high"
        elif any(r["level"] == "medium" for r in risks):
            overall_risk = "medium"
        
        return {
            "overall_risk": overall_risk,
            "risk_count": len(risks),
            "risks": risks
        }
    
    def _generate_next_steps(self, vote) -> List[Dict]:
        """生成后续步骤"""
        steps = []
        
        # 立即执行
        steps.append({
            "phase": "immediate",
            "timeframe": "24小时内",
            "actions": [
                f"确认采用「{vote.winner.text if vote.winner else '待定'}」方案",
                "通知所有参与智能体投票结果",
                "准备执行计划"
            ]
        })
        
        # 短期执行
        steps.append({
            "phase": "short_term",
            "timeframe": "1周内",
            "actions": [
                "制定详细实施方案",
                "分配任务和责任",
                "建立进度跟踪机制"
            ]
        })
        
        # 中期监控
        steps.append({
            "phase": "medium_term",
            "timeframe": "1个月内",
            "actions": [
                "定期评估执行效果",
                "收集反馈意见",
                "必要时调整方案"
            ]
        })
        
        # 如果共识度低，增加额外步骤
        if vote.consensus_level < 0.6:
            steps.insert(1, {
                "phase": "immediate",
                "timeframe": "48小时内",
                "actions": [
                    "组织补充讨论会",
                    "听取反对意见",
                    "寻求妥协方案"
                ]
            })
        
        return steps
    
    def _format_duration(self, seconds: float) -> str:
        """格式化时长"""
        if seconds < 60:
            return f"{int(seconds)}秒"
        elif seconds < 3600:
            return f"{int(seconds / 60)}分{int(seconds % 60)}秒"
        else:
            return f"{int(seconds / 3600)}小时{int((seconds % 3600) / 60)}分"
    
    def to_markdown(self, report: Dict) -> str:
        """转换为Markdown格式"""
        md = f"""# AI决策分析报告

## 基本信息

- **投票主题**: {report['meta']['title']}
- **报告生成时间**: {report['meta']['generated_at']}
- **投票耗时**: {report['meta']['duration']}
- **参与智能体**: {report['meta']['total_agents']}个

## 决策结论

**{report['summary']['conclusion']}**

- **置信度**: {report['summary']['confidence']}
- **风险等级**: {report['summary']['risk_level']}
- **共识度**: {report['summary']['consensus_level']}

## 投票详情

| 排名 | 方案 | 票数 | 加权票数 | 占比 |
|------|------|------|----------|------|
"""
        
        for opt in report['vote_details']['options']:
            md += f"| {opt['rank']} | {opt['text']} | {opt['votes']} | {opt['weighted_votes']} | {opt.get('ratio', 'N/A')} |\n"
        
        md += f"""

## 共识度分析

**共识度: {report['consensus_analysis']['percentage']}**

{report['consensus_analysis']['description']}

影响因素:
"""
        
        for factor in report['consensus_analysis']['factors']:
            md += f"- {factor}\n"
        
        md += """

## AI建议

"""
        
        for rec in report['recommendations']:
            md += f"""### [{rec['priority']}] {rec['category']}

{rec['content']}

**理由**: {rec['rationale']}

"""
        
        md += """## 后续步骤

"""
        
        for step in report['next_steps']:
            md += f"""### {step['timeframe']} ({step['phase']})

"""
            for action in step['actions']:
                md += f"- [ ] {action}\n"
            md += "\n"
        
        return md
