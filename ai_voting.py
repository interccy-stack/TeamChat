# -*- coding: utf-8 -*-
"""
TeamChat AI Voting Module
AI 投票决策系统 - 纯智能体投票决策

功能：
- 多种投票模板（决策型、评分型、排序型、共识型）
- 智能体自主投票
- 投票协商与共识达成
- 投票结果分析
- 投票历史记录

版本: v5.2.2
"""

import json
import logging
import time
import uuid
import os
import threading
from pathlib import Path
from datetime import datetime, timedelta
from typing import Dict, List, Optional, Any, Tuple, Union
from enum import Enum
from dataclasses import dataclass, asdict
import asyncio
import httpx

logger = logging.getLogger("qwenpaw.team_chat.ai_voting")


class VoteType(Enum):
    """投票类型"""
    DECISION = "decision"      # 决策型：是/否/弃权
    SCORE = "score"            # 评分型：1-10分
    RANKING = "ranking"        # 排序型：选项排序
    CONSENSUS = "consensus"    # 共识型：多轮协商达成
    MULTI_CHOICE = "multi"     # 多选型：多选


class VoteStatus(Enum):
    """投票状态"""
    CREATED = "created"           # 已创建
    ANALYZING = "analyzing"       # 分析中
    NEGOTIATING = "negotiating"   # 协商中
    VOTING = "voting"             # 投票中
    COMPLETED = "completed"       # 已完成
    CANCELLED = "cancelled"       # 已取消


class VoteTemplate(Enum):
    """投票模板"""
    # 决策型模板
    YES_NO = "yes_no"                      # 简单是/否
    YES_NO_ABSTAIN = "yes_no_abstain"      # 是/否/弃权
    GO_NO_GO = "go_no_go"                  # 通过/不通过
    
    # 评分型模板
    SCORE_5 = "score_5"                    # 5分制
    SCORE_10 = "score_10"                # 10分制
    SCORE_100 = "score_100"              # 百分制
    
    # 排序型模板
    RANK_PRIORITY = "rank_priority"        # 优先级排序
    RANK_PREFERENCE = "rank_preference"   # 偏好排序
    
    # 共识型模板
    CONSENSUS_BASIC = "consensus_basic"    # 基础共识
    CONSENSUS_DEEP = "consensus_deep"      # 深度共识
    CONSENSUS_UNANIMOUS = "consensus_unanimous"  # 全体一致
    
    # 多选型模板
    MULTI_SELECT = "multi_select"          # 多选
    TOP_N = "top_n"                       # 选Top N


@dataclass
class VoteOption:
    """投票选项"""
    id: str
    label: str
    description: str = ""
    score: Optional[float] = None
    rank: Optional[int] = None
    selected: bool = False


@dataclass
class AgentVote:
    """智能体投票记录"""
    agent_id: str
    agent_name: str
    vote_type: str
    choice: Union[str, int, List[str], Dict[str, Any]]
    reasoning: str = ""
    confidence: float = 1.0
    timestamp: str = ""
    round_num: int = 1
    
    def __post_init__(self):
        if not self.timestamp:
            self.timestamp = datetime.now().isoformat()


@dataclass
class VoteRound:
    """投票轮次"""
    round_num: int
    status: str
    votes: List[AgentVote]
    consensus_level: float = 0.0
    summary: str = ""
    start_time: str = ""
    end_time: Optional[str] = None
    
    def __post_init__(self):
        if not self.start_time:
            self.start_time = datetime.now().isoformat()


@dataclass
class VoteSession:
    """投票会话"""
    id: str
    title: str
    description: str
    vote_type: str
    template: str
    status: str
    creator: str
    agents: List[str]
    options: List[VoteOption]
    rounds: List[VoteRound]
    current_round: int = 0
    max_rounds: int = 3
    consensus_threshold: float = 0.7
    created_at: str = ""
    updated_at: str = ""
    completed_at: Optional[str] = None
    final_result: Optional[Dict] = None
    metadata: Dict = None
    
    def __post_init__(self):
        if not self.id:
            self.id = f"vote_{uuid.uuid4().hex[:12]}"
        if not self.created_at:
            self.created_at = datetime.now().isoformat()
        if not self.updated_at:
            self.updated_at = self.created_at
        if self.metadata is None:
            self.metadata = {}


class VoteTemplateManager:
    """投票模板管理器"""
    
    TEMPLATES = {
        # 决策型
        VoteTemplate.YES_NO: {
            "name": "简单决策",
            "description": "是/否 二选一决策",
            "type": VoteType.DECISION,
            "options": [
                {"id": "yes", "label": "是", "description": "同意/支持"},
                {"id": "no", "label": "否", "description": "不同意/反对"}
            ],
            "rules": {
                "min_agents": 2,
                "max_agents": 10,
                "require_reasoning": True,
                "allow_abstain": False
            }
        },
        VoteTemplate.YES_NO_ABSTAIN: {
            "name": "决策（含弃权）",
            "description": "是/否/弃权 三选一决策",
            "type": VoteType.DECISION,
            "options": [
                {"id": "yes", "label": "是", "description": "同意/支持"},
                {"id": "no", "label": "否", "description": "不同意/反对"},
                {"id": "abstain", "label": "弃权", "description": "保持中立"}
            ],
            "rules": {
                "min_agents": 2,
                "max_agents": 15,
                "require_reasoning": True,
                "allow_abstain": True
            }
        },
        VoteTemplate.GO_NO_GO: {
            "name": "通过决议",
            "description": "通过/不通过 决策",
            "type": VoteType.DECISION,
            "options": [
                {"id": "go", "label": "通过", "description": "批准执行"},
                {"id": "no_go", "label": "不通过", "description": "拒绝执行"}
            ],
            "rules": {
                "min_agents": 3,
                "max_agents": 20,
                "require_reasoning": True,
                "allow_abstain": False,
                "pass_threshold": 0.5
            }
        },
        
        # 评分型
        VoteTemplate.SCORE_5: {
            "name": "5分评分",
            "description": "1-5分评分",
            "type": VoteType.SCORE,
            "score_range": {"min": 1, "max": 5, "step": 1},
            "rules": {
                "min_agents": 2,
                "max_agents": 10,
                "require_reasoning": True,
                "calculate_average": True
            }
        },
        VoteTemplate.SCORE_10: {
            "name": "10分评分",
            "description": "1-10分评分",
            "type": VoteType.SCORE,
            "score_range": {"min": 1, "max": 10, "step": 1},
            "rules": {
                "min_agents": 2,
                "max_agents": 20,
                "require_reasoning": True,
                "calculate_average": True,
                "allow_decimal": False
            }
        },
        VoteTemplate.SCORE_100: {
            "name": "百分制评分",
            "description": "0-100分评分",
            "type": VoteType.SCORE,
            "score_range": {"min": 0, "max": 100, "step": 1},
            "rules": {
                "min_agents": 3,
                "max_agents": 30,
                "require_reasoning": True,
                "calculate_average": True,
                "allow_decimal": True
            }
        },
        
        # 排序型
        VoteTemplate.RANK_PRIORITY: {
            "name": "优先级排序",
            "description": "按优先级排序选项",
            "type": VoteType.RANKING,
            "rules": {
                "min_agents": 2,
                "max_agents": 10,
                "min_options": 3,
                "max_options": 10,
                "require_reasoning": True,
                "allow_ties": False
            }
        },
        VoteTemplate.RANK_PREFERENCE: {
            "name": "偏好排序",
            "description": "按个人偏好排序",
            "type": VoteType.RANKING,
            "rules": {
                "min_agents": 2,
                "max_agents": 15,
                "min_options": 2,
                "max_options": 8,
                "require_reasoning": True,
                "allow_ties": True
            }
        },
        
        # 共识型
        VoteTemplate.CONSENSUS_BASIC: {
            "name": "基础共识",
            "description": "基础多轮协商达成共识",
            "type": VoteType.CONSENSUS,
            "options": [
                {"id": "agree", "label": "同意", "description": "完全同意"},
                {"id": "partial", "label": "部分同意", "description": "有条件同意"},
                {"id": "disagree", "label": "不同意", "description": "不同意"}
            ],
            "rules": {
                "min_agents": 3,
                "max_agents": 10,
                "max_rounds": 3,
                "consensus_threshold": 0.7,
                "require_reasoning": True
            }
        },
        VoteTemplate.CONSENSUS_DEEP: {
            "name": "深度共识",
            "description": "深度多轮协商，追求高质量共识",
            "type": VoteType.CONSENSUS,
            "options": [
                {"id": "strong_agree", "label": "强烈同意", "description": "完全支持"},
                {"id": "agree", "label": "同意", "description": "支持"},
                {"id": "neutral", "label": "中立", "description": "可接受"},
                {"id": "disagree", "label": "不同意", "description": "不支持"},
                {"id": "strong_disagree", "label": "强烈不同意", "description": "强烈反对"}
            ],
            "rules": {
                "min_agents": 3,
                "max_agents": 8,
                "max_rounds": 5,
                "consensus_threshold": 0.8,
                "require_reasoning": True,
                "allow_reconsider": True
            }
        },
        VoteTemplate.CONSENSUS_UNANIMOUS: {
            "name": "全体一致",
            "description": "要求所有智能体达成一致",
            "type": VoteType.CONSENSUS,
            "options": [
                {"id": "unanimous", "label": "一致同意", "description": "全体一致"},
                {"id": "objection", "label": "有异议", "description": "存在异议"}
            ],
            "rules": {
                "min_agents": 2,
                "max_agents": 6,
                "max_rounds": 10,
                "consensus_threshold": 1.0,
                "require_reasoning": True,
                "require_unanimous": True
            }
        },
        
        # 多选型
        VoteTemplate.MULTI_SELECT: {
            "name": "多选投票",
            "description": "可选择多个选项",
            "type": VoteType.MULTI_CHOICE,
            "rules": {
                "min_agents": 2,
                "max_agents": 20,
                "min_options": 2,
                "max_options": 10,
                "min_select": 1,
                "max_select": 5,
                "require_reasoning": True
            }
        },
        VoteTemplate.TOP_N: {
            "name": "Top N 选择",
            "description": "选择最好的N个选项",
            "type": VoteType.MULTI_CHOICE,
            "rules": {
                "min_agents": 2,
                "max_agents": 15,
                "min_options": 3,
                "max_options": 10,
                "top_n": 3,
                "require_reasoning": True
            }
        }
    }
    
    @classmethod
    def get_template(cls, template: VoteTemplate) -> Dict:
        """获取模板配置"""
        return cls.TEMPLATES.get(template, {})
    
    @classmethod
    def list_templates(cls) -> List[Dict]:
        """列出所有模板"""
        return [
            {
                "id": t.value,
                "name": config["name"],
                "description": config["description"],
                "type": config["type"].value,
                "category": cls._get_category(t)
            }
            for t, config in cls.TEMPLATES.items()
        ]
    
    @classmethod
    def _get_category(cls, template: VoteTemplate) -> str:
        """获取模板分类"""
        if template in [VoteTemplate.YES_NO, VoteTemplate.YES_NO_ABSTAIN, VoteTemplate.GO_NO_GO]:
            return "decision"
        elif template in [VoteTemplate.SCORE_5, VoteTemplate.SCORE_10, VoteTemplate.SCORE_100]:
            return "score"
        elif template in [VoteTemplate.RANK_PRIORITY, VoteTemplate.RANK_PREFERENCE]:
            return "ranking"
        elif template in [VoteTemplate.CONSENSUS_BASIC, VoteTemplate.CONSENSUS_DEEP, VoteTemplate.CONSENSUS_UNANIMOUS]:
            return "consensus"
        elif template in [VoteTemplate.MULTI_SELECT, VoteTemplate.TOP_N]:
            return "multi_choice"
        return "other"
    
    @classmethod
    def get_templates_by_type(cls, vote_type: VoteType) -> List[Dict]:
        """按类型获取模板"""
        return [
            {"id": t.value, "name": config["name"], "description": config["description"]}
            for t, config in cls.TEMPLATES.items()
            if config["type"] == vote_type
        ]
    
    @classmethod
    def validate_vote_config(cls, template: VoteTemplate, config: Dict) -> Tuple[bool, str]:
        """验证投票配置"""
        template_config = cls.get_template(template)
        if not template_config:
            return False, "模板不存在"
        
        rules = template_config.get("rules", {})
        
        # 验证智能体数量
        agents = config.get("agents", [])
        min_agents = rules.get("min_agents", 2)
        max_agents = rules.get("max_agents", 10)
        
        if len(agents) < min_agents:
            return False, f"智能体数量不足，至少需要 {min_agents} 个"
        if len(agents) > max_agents:
            return False, f"智能体数量过多，最多 {max_agents} 个"
        
        # 验证选项数量
        if "options" in config:
            options = config["options"]
            min_options = rules.get("min_options", 2)
            max_options = rules.get("max_options", 10)
            
            if len(options) < min_options:
                return False, f"选项数量不足，至少需要 {min_options} 个"
            if len(options) > max_options:
                return False, f"选项数量过多，最多 {max_options} 个"
        
        return True, "验证通过"


class AIVotingEngine:
    """AI投票引擎"""
    
    def __init__(self, base_dir: Path):
        self.base_dir = base_dir
        self.data_dir = base_dir / "data" / "ai_voting"
        self.data_dir.mkdir(parents=True, exist_ok=True)
        self.sessions: Dict[str, VoteSession] = {}
        self._lock = threading.RLock()
        self._load_sessions()
    
    def _load_sessions(self):
        """加载投票会话"""
        sessions_file = self.data_dir / "sessions.json"
        if sessions_file.exists():
            try:
                with open(sessions_file, 'r', encoding='utf-8') as f:
                    data = json.load(f)
                    for session_data in data.get("sessions", []):
                        session = self._dict_to_session(session_data)
                        self.sessions[session.id] = session
                logger.info(f"AI投票: 已加载 {len(self.sessions)} 个投票会话")
            except Exception as e:
                logger.error(f"AI投票: 加载会话失败: {e}")
    
    def _save_sessions(self):
        """保存投票会话"""
        with self._lock:
            sessions_file = self.data_dir / "sessions.json"
            try:
                data = {
                    "sessions": [self._session_to_dict(s) for s in self.sessions.values()],
                    "updated_at": datetime.now().isoformat()
                }
                with open(sessions_file, 'w', encoding='utf-8') as f:
                    json.dump(data, f, ensure_ascii=False, indent=2)
            except Exception as e:
                logger.error(f"AI投票: 保存会话失败: {e}")
    
    def _dict_to_session(self, data: Dict) -> VoteSession:
        """字典转会话对象"""
        # 转换options
        options = [VoteOption(**opt) for opt in data.get("options", [])]
        
        # 转换rounds
        rounds = []
        for r_data in data.get("rounds", []):
            votes = [AgentVote(**v) for v in r_data.get("votes", [])]
            round_obj = VoteRound(
                round_num=r_data["round_num"],
                status=r_data["status"],
                votes=votes,
                consensus_level=r_data.get("consensus_level", 0.0),
                summary=r_data.get("summary", ""),
                start_time=r_data.get("start_time", ""),
                end_time=r_data.get("end_time")
            )
            rounds.append(round_obj)
        
        return VoteSession(
            id=data["id"],
            title=data["title"],
            description=data.get("description", ""),
            vote_type=data["vote_type"],
            template=data["template"],
            status=data["status"],
            creator=data.get("creator", ""),
            agents=data.get("agents", []),
            options=options,
            rounds=rounds,
            current_round=data.get("current_round", 0),
            max_rounds=data.get("max_rounds", 3),
            consensus_threshold=data.get("consensus_threshold", 0.7),
            created_at=data.get("created_at", ""),
            updated_at=data.get("updated_at", ""),
            completed_at=data.get("completed_at"),
            final_result=data.get("final_result"),
            metadata=data.get("metadata", {})
        )
    
    def _session_to_dict(self, session: VoteSession) -> Dict:
        """会话对象转字典"""
        return {
            "id": session.id,
            "title": session.title,
            "description": session.description,
            "vote_type": session.vote_type,
            "template": session.template,
            "status": session.status,
            "creator": session.creator,
            "agents": session.agents,
            "options": [asdict(opt) for opt in session.options],
            "rounds": [
                {
                    "round_num": r.round_num,
                    "status": r.status,
                    "votes": [asdict(v) for v in r.votes],
                    "consensus_level": r.consensus_level,
                    "summary": r.summary,
                    "start_time": r.start_time,
                    "end_time": r.end_time
                }
                for r in session.rounds
            ],
            "current_round": session.current_round,
            "max_rounds": session.max_rounds,
            "consensus_threshold": session.consensus_threshold,
            "created_at": session.created_at,
            "updated_at": session.updated_at,
            "completed_at": session.completed_at,
            "final_result": session.final_result,
            "metadata": session.metadata
        }
    
    def create_vote(self, title: str, description: str, template_id: str,
                   creator: str, agents: List[str], options: List[Dict] = None,
                   config: Dict = None) -> Tuple[VoteSession, str]:
        """创建投票"""
        try:
            template = VoteTemplate(template_id)
        except ValueError:
            return None, f"模板不存在: {template_id}"
        
        template_config = VoteTemplateManager.get_template(template)
        if not template_config:
            return None, "模板配置错误"
        
        # 验证配置
        valid, msg = VoteTemplateManager.validate_vote_config(template, {
            "agents": agents,
            "options": options or []
        })
        if not valid:
            return None, msg
        
        # 创建选项
        vote_options = []
        if "options" in template_config:
            for opt_data in template_config["options"]:
                vote_options.append(VoteOption(
                    id=opt_data["id"],
                    label=opt_data["label"],
                    description=opt_data.get("description", "")
                ))
        elif options:
            for i, opt_data in enumerate(options):
                vote_options.append(VoteOption(
                    id=opt_data.get("id", f"opt_{i}"),
                    label=opt_data["label"],
                    description=opt_data.get("description", "")
                ))
        
        # 创建会话
        rules = template_config.get("rules", {})
        session = VoteSession(
            title=title,
            description=description,
            vote_type=template_config["type"].value,
            template=template_id,
            status=VoteStatus.CREATED.value,
            creator=creator,
            agents=agents,
            options=vote_options,
            rounds=[],
            current_round=0,
            max_rounds=config.get("max_rounds", rules.get("max_rounds", 3)),
            consensus_threshold=config.get("consensus_threshold", rules.get("consensus_threshold", 0.7)),
            metadata=config or {}
        )
        
        with self._lock:
            self.sessions[session.id] = session
            self._save_sessions()
        
        logger.info(f"AI投票: 创建投票 {session.id} - {title}")
        return session, "创建成功"
    
    def get_vote(self, vote_id: str) -> Optional[VoteSession]:
        """获取投票"""
        return self.sessions.get(vote_id)
    
    def list_votes(self, status: str = None, creator: str = None) -> List[VoteSession]:
        """列出投票"""
        votes = list(self.sessions.values())
        
        if status:
            votes = [v for v in votes if v.status == status]
        if creator:
            votes = [v for v in votes if v.creator == creator]
        
        # 按创建时间倒序
        votes.sort(key=lambda x: x.created_at, reverse=True)
        return votes
    
    def start_vote(self, vote_id: str) -> Tuple[bool, str]:
        """开始投票"""
        session = self.get_vote(vote_id)
        if not session:
            return False, "投票不存在"
        
        if session.status != VoteStatus.CREATED.value:
            return False, "投票已开始或已结束"
        
        # 创建第一轮
        session.current_round = 1
        round_obj = VoteRound(
            round_num=1,
            status=VoteStatus.VOTING.value,
            votes=[]
        )
        session.rounds.append(round_obj)
        session.status = VoteStatus.VOTING.value
        session.updated_at = datetime.now().isoformat()
        
        with self._lock:
            self._save_sessions()
        
        logger.info(f"AI投票: 开始投票 {vote_id}")
        return True, "投票已开始"
    
    def submit_vote(self, vote_id: str, agent_id: str, agent_name: str,
                   choice: Any, reasoning: str = "", confidence: float = 1.0) -> Tuple[bool, str]:
        """提交投票"""
        session = self.get_vote(vote_id)
        if not session:
            return False, "投票不存在"
        
        if session.status != VoteStatus.VOTING.value:
            return False, "投票未开始或已结束"
        
        if agent_id not in session.agents:
            return False, "无权参与此投票"
        
        # 获取当前轮次
        current_round = None
        for r in session.rounds:
            if r.round_num == session.current_round:
                current_round = r
                break
        
        if not current_round:
            return False, "当前轮次不存在"
        
        # 检查是否已投票
        for v in current_round.votes:
            if v.agent_id == agent_id:
                return False, "已投过票"
        
        # 创建投票记录
        vote_record = AgentVote(
            agent_id=agent_id,
            agent_name=agent_name,
            vote_type=session.vote_type,
            choice=choice,
            reasoning=reasoning,
            confidence=confidence,
            round_num=session.current_round
        )
        
        current_round.votes.append(vote_record)
        session.updated_at = datetime.now().isoformat()
        
        # 检查是否所有智能体都已投票
        if len(current_round.votes) >= len(session.agents):
            current_round.status = VoteStatus.COMPLETED.value
            current_round.end_time = datetime.now().isoformat()
            
            # 计算共识度
            self._calculate_consensus(session, current_round)
            
            # 检查是否达成共识
            if current_round.consensus_level >= session.consensus_threshold:
                session.status = VoteStatus.COMPLETED.value
                session.completed_at = datetime.now().isoformat()
                self._generate_final_result(session)
            elif session.current_round >= session.max_rounds:
                session.status = VoteStatus.COMPLETED.value
                session.completed_at = datetime.now().isoformat()
                self._generate_final_result(session)
            else:
                # 开始下一轮
                session.current_round += 1
                new_round = VoteRound(
                    round_num=session.current_round,
                    status=VoteStatus.NEGOTIATING.value,
                    votes=[]
                )
                session.rounds.append(new_round)
                session.status = VoteStatus.NEGOTIATING.value
        
        with self._lock:
            self._save_sessions()
        
        logger.info(f"AI投票: {agent_name} 提交投票 {vote_id}")
        return True, "投票成功"
    
    def _calculate_consensus(self, session: VoteSession, round_obj: VoteRound):
        """计算共识度"""
        if not round_obj.votes:
            round_obj.consensus_level = 0.0
            return
        
        vote_type = session.vote_type
        votes = round_obj.votes
        
        if vote_type == VoteType.DECISION.value:
            # 决策型：统计最多选项的比例
            choices = [v.choice for v in votes]
            from collections import Counter
            counter = Counter(choices)
            most_common = counter.most_common(1)[0]
            round_obj.consensus_level = most_common[1] / len(votes)
            
        elif vote_type == VoteType.SCORE.value:
            # 评分型：计算分数集中度
            scores = [float(v.choice) for v in votes if isinstance(v.choice, (int, float))]
            if scores:
                avg = sum(scores) / len(scores)
                variance = sum((s - avg) ** 2 for s in scores) / len(scores)
                # 方差越小，共识度越高
                round_obj.consensus_level = max(0, 1 - variance / 100)
            
        elif vote_type == VoteType.CONSENSUS.value:
            # 共识型：计算同意比例
            agree_votes = [v for v in votes if v.choice in ["agree", "strong_agree", "unanimous"]]
            round_obj.consensus_level = len(agree_votes) / len(votes)
            
        elif vote_type == VoteType.MULTI_CHOICE.value:
            # 多选型：找出最热门的选项组合
            from collections import Counter
            choice_sets = [tuple(sorted(v.choice)) if isinstance(v.choice, list) else (v.choice,) for v in votes]
            counter = Counter(choice_sets)
            most_common = counter.most_common(1)[0]
            round_obj.consensus_level = most_common[1] / len(votes)
        
        else:
            round_obj.consensus_level = len(votes) / len(session.agents)
    
    def _generate_final_result(self, session: VoteSession):
        """生成最终结果"""
        if not session.rounds:
            return
        
        last_round = session.rounds[-1]
        votes = last_round.votes
        
        result = {
            "total_votes": len(votes),
            "total_agents": len(session.agents),
            "consensus_level": last_round.consensus_level,
            "rounds_count": len(session.rounds),
            "winner": None,
            "details": []
        }
        
        vote_type = session.vote_type
        
        if vote_type == VoteType.DECISION.value:
            from collections import Counter
            choices = [v.choice for v in votes]
            counter = Counter(choices)
            winner = counter.most_common(1)[0]
            result["winner"] = {
                "choice": winner[0],
                "count": winner[1],
                "percentage": winner[1] / len(votes) * 100
            }
            
        elif vote_type == VoteType.SCORE.value:
            scores = [float(v.choice) for v in votes if isinstance(v.choice, (int, float))]
            if scores:
                result["winner"] = {
                    "average_score": sum(scores) / len(scores),
                    "max_score": max(scores),
                    "min_score": min(scores)
                }
                
        elif vote_type == VoteType.CONSENSUS.value:
            from collections import Counter
            choices = [v.choice for v in votes]
            counter = Counter(choices)
            result["distribution"] = dict(counter)
            winner = counter.most_common(1)[0]
            result["winner"] = {
                "choice": winner[0],
                "count": winner[1],
                "percentage": winner[1] / len(votes) * 100
            }
        
        # 添加投票详情
        for v in votes:
            result["details"].append({
                "agent": v.agent_name,
                "choice": v.choice,
                "reasoning": v.reasoning,
                "confidence": v.confidence
            })
        
        session.final_result = result
    
    def delete_vote(self, vote_id: str) -> bool:
        """删除投票"""
        with self._lock:
            if vote_id in self.sessions:
                del self.sessions[vote_id]
                self._save_sessions()
                logger.info(f"AI投票: 删除投票 {vote_id}")
                return True
        return False
    
    def get_templates(self) -> List[Dict]:
        """获取所有模板"""
        return VoteTemplateManager.list_templates()
    
    def get_template_detail(self, template_id: str) -> Optional[Dict]:
        """获取模板详情"""
        try:
            template = VoteTemplate(template_id)
            config = VoteTemplateManager.get_template(template)
            if config:
                return {
                    "id": template_id,
                    "name": config["name"],
                    "description": config["description"],
                    "type": config["type"].value,
                    "options": config.get("options", []),
                    "rules": config.get("rules", {}),
                    "score_range": config.get("score_range")
                }
        except ValueError:
            pass
        return None


# 全局引擎实例
_voting_engine: Optional[AIVotingEngine] = None


def get_voting_engine(base_dir: Path = None) -> AIVotingEngine:
    """获取投票引擎实例"""
    global _voting_engine
    if _voting_engine is None:
        if base_dir is None:
            base_dir = Path.home() / ".qwenpaw" / "plugins" / "team_chat"
        _voting_engine = AIVotingEngine(base_dir)
    return _voting_engine
