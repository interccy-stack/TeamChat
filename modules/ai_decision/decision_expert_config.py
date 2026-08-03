#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
AI决策分析专家配置模块 v5.3.5
支持自定义决策分析专家角色、权重和专业领域
"""

from typing import Dict, List, Optional, Any
from dataclasses import dataclass, field, asdict
from enum import Enum
import json
import time


class ExpertType(Enum):
    """专家类型"""
    STRATEGIC = "strategic"      # 战略专家
    TECHNICAL = "technical"        # 技术专家
    FINANCIAL = "financial"      # 财务专家
    MARKETING = "marketing"      # 市场专家
    LEGAL = "legal"              # 法务专家
    OPERATIONS = "operations"    # 运营专家
    HR = "hr"                    # 人力专家
    CUSTOM = "custom"            # 自定义


class ExpertLevel(Enum):
    """专家等级"""
    JUNIOR = "junior"        # 初级
    INTERMEDIATE = "intermediate"  # 中级
    SENIOR = "senior"        # 高级
    EXPERT = "expert"        # 专家
    MASTER = "master"        # 大师


@dataclass
class DecisionExpert:
    """决策分析专家配置"""
    expert_id: str
    name: str
    type: ExpertType
    level: ExpertLevel
    description: str
    expertise: List[str] = field(default_factory=list)
    weight: float = 1.0
    personality: str = ""
    prompt_template: str = ""
    avatar: str = ""
    is_active: bool = True
    created_at: float = field(default_factory=time.time)
    updated_at: float = field(default_factory=time.time)
    
    def to_dict(self) -> Dict[str, Any]:
        """转换为字典"""
        return {
            "expert_id": self.expert_id,
            "name": self.name,
            "type": self.type.value,
            "level": self.level.value,
            "description": self.description,
            "expertise": self.expertise,
            "weight": self.weight,
            "personality": self.personality,
            "prompt_template": self.prompt_template,
            "avatar": self.avatar,
            "is_active": self.is_active,
            "created_at": self.created_at,
            "updated_at": self.updated_at
        }
    
    @classmethod
    def from_dict(cls, data: Dict) -> 'DecisionExpert':
        """从字典创建"""
        return cls(
            expert_id=data.get("expert_id", ""),
            name=data.get("name", ""),
            type=ExpertType(data.get("type", "custom")),
            level=ExpertLevel(data.get("level", "intermediate")),
            description=data.get("description", ""),
            expertise=data.get("expertise", []),
            weight=data.get("weight", 1.0),
            personality=data.get("personality", ""),
            prompt_template=data.get("prompt_template", ""),
            avatar=data.get("avatar", ""),
            is_active=data.get("is_active", True),
            created_at=data.get("created_at", time.time()),
            updated_at=data.get("updated_at", time.time())
        )


class DecisionExpertConfig:
    """决策专家配置管理器"""
    
    # 预设专家模板
    PRESET_EXPERTS = {
        "strategic_analyst": DecisionExpert(
            expert_id="strategic_analyst",
            name="战略分析师",
            type=ExpertType.STRATEGIC,
            level=ExpertLevel.SENIOR,
            description="擅长从宏观角度分析决策的长期影响和战略价值",
            expertise=["战略规划", "市场趋势", "竞争分析", "风险评估"],
            weight=1.2,
            personality="严谨、前瞻、全局思维",
            prompt_template="""你是一位资深的战略分析师。请从以下角度分析决策：
1. 长期战略价值与愿景契合度
2. 市场竞争优势和差异化
3. 风险与机遇的平衡
4. 资源配置的效率

请给出专业的分析和建议，使用数据支撑你的观点。"""
        ),
        "technical_lead": DecisionExpert(
            expert_id="technical_lead",
            name="技术负责人",
            type=ExpertType.TECHNICAL,
            level=ExpertLevel.EXPERT,
            description="专注于技术可行性、架构设计和实现复杂度评估",
            expertise=["技术架构", "系统 design", "性能优化", "技术选型", "代码质量"],
            weight=1.1,
            personality="理性、精确、追求极致",
            prompt_template="""你是一位经验丰富的技术负责人。请从技术角度分析：
1. 技术可行性和实现难度
2. 架构设计的合理性
3. 性能、安全、可维护性评估
4. 技术债务和风险

请提供具体的技术建议和最佳实践。"""
        ),
        "financial_advisor": DecisionExpert(
            expert_id="financial_advisor",
            name="财务顾问",
            type=ExpertType.FINANCIAL,
            level=ExpertLevel.SENIOR,
            description="精通财务分析、成本控制和投资回报评估",
            expertise=["财务分析", "成本控制", "ROI计算", "预算管理", "现金流"],
            weight=1.15,
            personality="审慎、精确、数据驱动",
            prompt_template="""你是一位专业的财务顾问。请从财务角度分析：
1. 投资回报率和成本效益
2. 现金流影响和财务风险
3. 预算可行性和成本控制
4. 财务合规性

请提供详细的财务分析和量化指标。"""
        ),
        "marketing_specialist": DecisionExpert(
            expert_id="marketing_specialist",
            name="市场专家",
            type=ExpertType.MARKETING,
            level=ExpertLevel.SENIOR,
            description="深入了解市场需求、用户行为和品牌推广策略",
            expertise=["市场分析", "用户研究", "品牌策略", "渠道管理", "增长黑客"],
            weight=1.0,
            personality="敏锐、创新、用户导向",
            prompt_template="""你是一位资深的市场营销专家。请从市场角度分析：
1. 市场需求和用户痛点
2. 竞争优势和差异化定位
3. 品牌影响力和传播策略
4. 渠道可行性和获客成本

请提供市场洞察和营销建议。"""
        ),
        "legal_consultant": DecisionExpert(
            expert_id="legal_consultant",
            name="法务顾问",
            type=ExpertType.LEGAL,
            level=ExpertLevel.EXPERT,
            description="精通法规合规、合同审查和风险控制",
            expertise=["合规审查", "合同法律", "知识产权", "数据隐私", "风险管理"],
            weight=1.1,
            personality="严谨、保守、风险意识强",
            prompt_template="""你是一位专业的法务顾问。请从法律合规角度分析：
1. 法规合规性和法律风险
2. 合同条款和权益保护
3. 知识产权和数据隐私
4. 争议解决机制

请指出潜在的法律风险和合规建议。"""
        ),
        "operations_manager": DecisionExpert(
            expert_id="operations_manager",
            name="运营经理",
            type=ExpertType.OPERATIONS,
            level=ExpertLevel.SENIOR,
            description="擅长流程优化、项目管理和执行落地",
            expertise=["流程优化", "项目管理", "团队协作", "质量控制", "效率提升"],
            weight=1.0,
            personality="务实、高效、执行力强",
            prompt_template="""你是一位经验丰富的运营经理。请从运营执行角度分析：
1. 执行可行性和落地难度
2. 流程设计和优化空间
3. 资源配置和团队协作
4. 质量控制和效率提升

请提供可执行的运营建议和实施方案。"""
        ),
        "hr_director": DecisionExpert(
            expert_id="hr_director",
            name="人力总监",
            type=ExpertType.HR,
            level=ExpertLevel.SENIOR,
            description="专注于团队建设、人才发展和组织效能",
            expertise=["人才管理", "组织架构", "文化建设", "激励机制", "培训发展"],
            weight=0.9,
            personality="人文关怀、善于沟通、团队导向",
            prompt_template="""你是一位资深的人力资源总监。请从人力角度分析：
1. 团队能力和人才需求
2. 组织变革和文化影响
3. 激励机制和员工满意度
4. 培训发展和职业规划

请提供人力资源方面的专业建议。"""
        ),
        "innovation_champion": DecisionExpert(
            expert_id="innovation_champion",
            name="创新推动者",
            type=ExpertType.STRATEGIC,
            level=ExpertLevel.MASTER,
            description="富有创新思维，善于发现新机会和突破性解决方案",
            expertise=["创新思维", "机会识别", "颠覆性技术", "蓝海战略", "设计思维"],
            weight=1.25,
            personality="开放、好奇、勇于尝试",
            prompt_template="""你是一位创新领域的思想领袖。请从创新角度分析：
1. 创新机会和突破性潜力
2. 颠覆性技术和趋势
3. 蓝海市场和差异化创新
4. 设计思维和用户体验

请提供创新视角的洞察和建议。"""
        )
    }
    
    def __init__(self, data_dir: Optional[str] = None):
        self.data_dir = data_dir or "."
        self.experts: Dict[str, DecisionExpert] = {}
        self._load_presets()
        self._load_custom_experts()
    
    def _load_presets(self):
        """加载预设专家"""
        for expert in self.PRESET_EXPERTS.values():
            self.experts[expert.expert_id] = expert
    
    def _load_custom_experts(self):
        """从文件加载自定义专家"""
        import os
        filepath = os.path.join(self.data_dir, "decision_experts.json")
        if os.path.exists(filepath):
            try:
                with open(filepath, 'r', encoding='utf-8') as f:
                    data = json.load(f)
                    for expert_data in data.get("experts", []):
                        expert = DecisionExpert.from_dict(expert_data)
                        self.experts[expert.expert_id] = expert
            except Exception as e:
                print(f"[DecisionExpert] 加载自定义专家失败: {e}")
    
    def save_custom_experts(self):
        """保存自定义专家到文件"""
        import os
        filepath = os.path.join(self.data_dir, "decision_experts.json")
        try:
            custom_experts = {
                "experts": [
                    e.to_dict() for e in self.experts.values()
                    if e.expert_id not in self.PRESET_EXPERTS
                ]
            }
            with open(filepath, 'w', encoding='utf-8') as f:
                json.dump(custom_experts, f, ensure_ascii=False, indent=2)
            return True
        except Exception as e:
            print(f"[DecisionExpert] 保存自定义专家失败: {e}")
            return False
    
    def get_expert(self, expert_id: str) -> Optional[DecisionExpert]:
        """获取专家配置"""
        return self.experts.get(expert_id)
    
    def get_all_experts(self, active_only: bool = True) -> List[DecisionExpert]:
        """获取所有专家"""
        experts = list(self.experts.values())
        if active_only:
            experts = [e for e in experts if e.is_active]
        return sorted(experts, key=lambda x: (x.type.value, x.level.value))
    
    def get_experts_by_type(self, expert_type: ExpertType) -> List[DecisionExpert]:
        """按类型获取专家"""
        return [e for e in self.experts.values() if e.type == expert_type and e.is_active]
    
    def create_expert(self, name: str, expert_type: str, level: str = "intermediate",
                     description: str = "", expertise: List[str] = None,
                     weight: float = 1.0, personality: str = "",
                     prompt_template: str = "") -> DecisionExpert:
        """创建新专家"""
        expert_id = f"custom_{int(time.time())}_{name[:10]}"
        expert = DecisionExpert(
            expert_id=expert_id,
            name=name,
            type=ExpertType(expert_type),
            level=ExpertLevel(level),
            description=description,
            expertise=expertise or [],
            weight=weight,
            personality=personality,
            prompt_template=prompt_template
        )
        self.experts[expert_id] = expert
        self.save_custom_experts()
        return expert
    
    def update_expert(self, expert_id: str, **kwargs) -> Optional[DecisionExpert]:
        """更新专家配置"""
        expert = self.experts.get(expert_id)
        if not expert:
            return None
        
        for key, value in kwargs.items():
            if hasattr(expert, key):
                if key == "type":
                    value = ExpertType(value)
                elif key == "level":
                    value = ExpertLevel(value)
                setattr(expert, key, value)
        
        expert.updated_at = time.time()
        self.save_custom_experts()
        return expert
    
    def delete_expert(self, expert_id: str) -> bool:
        """删除专家（仅自定义专家）"""
        if expert_id in self.PRESET_EXPERTS:
            return False  # 不能删除预设专家
        
        if expert_id in self.experts:
            del self.experts[expert_id]
            self.save_custom_experts()
            return True
        return False
    
    def get_expert_types(self) -> List[Dict]:
        """获取专家类型列表"""
        return [
            {"value": t.value, "label": self._get_type_label(t), "icon": self._get_type_icon(t)}
            for t in ExpertType
        ]
    
    def get_expert_levels(self) -> List[Dict]:
        """获取专家等级列表"""
        return [
            {"value": l.value, "label": self._get_level_label(l), "weight": self._get_level_weight(l)}
            for l in ExpertLevel
        ]
    
    def _get_type_label(self, expert_type: ExpertType) -> str:
        """获取类型标签"""
        labels = {
            ExpertType.STRATEGIC: "战略",
            ExpertType.TECHNICAL: "技术",
            ExpertType.FINANCIAL: "财务",
            ExpertType.MARKETING: "市场",
            ExpertType.LEGAL: "法务",
            ExpertType.OPERATIONS: "运营",
            ExpertType.HR: "人力",
            ExpertType.CUSTOM: "自定义"
        }
        return labels.get(expert_type, "其他")
    
    def _get_type_icon(self, expert_type: ExpertType) -> str:
        """获取类型图标"""
        icons = {
            ExpertType.STRATEGIC: "🎯",
            ExpertType.TECHNICAL: "⚙️",
            ExpertType.FINANCIAL: "💰",
            ExpertType.MARKETING: "📢",
            ExpertType.LEGAL: "⚖️",
            ExpertType.OPERATIONS: "⚡",
            ExpertType.HR: "👥",
            ExpertType.CUSTOM: "🔧"
        }
        return icons.get(expert_type, "🤖")
    
    def _get_level_label(self, level: ExpertLevel) -> str:
        """获取等级标签"""
        labels = {
            ExpertLevel.JUNIOR: "初级",
            ExpertLevel.INTERMEDIATE: "中级",
            ExpertLevel.SENIOR: "高级",
            ExpertLevel.EXPERT: "专家",
            ExpertLevel.MASTER: "大师"
        }
        return labels.get(level, "中级")
    
    def _get_level_weight(self, level: ExpertLevel) -> float:
        """获取等级权重"""
        weights = {
            ExpertLevel.JUNIOR: 0.8,
            ExpertLevel.INTERMEDIATE: 1.0,
            ExpertLevel.SENIOR: 1.2,
            ExpertLevel.EXPERT: 1.4,
            ExpertLevel.MASTER: 1.6
        }
        return weights.get(level, 1.0)
    
    def get_recommended_experts(self, decision_topic: str, 
                                 decision_type: str = "general") -> List[DecisionExpert]:
        """根据决策主题推荐专家"""
        # 简单的关键词匹配
        keywords = {
            "strategic": ["战略", "规划", "长期", "愿景", "方向"],
            "technical": ["技术", "架构", "代码", "系统", "开发", "实现"],
            "financial": ["财务", "成本", "预算", "投资", "收益", "ROI"],
            "marketing": ["市场", "用户", "品牌", "推广", "营销"],
            "legal": ["法律", "合规", "合同", "风险", "法规"],
            "operations": ["运营", "流程", "执行", "落地", "实施"],
            "hr": ["团队", "人员", "招聘", "培训", "组织"]
        }
        
        topic_lower = decision_topic.lower()
        matched_types = []
        
        for dtype, words in keywords.items():
            if any(w in topic_lower for w in words):
                matched_types.append(dtype)
        
        if not matched_types:
            matched_types = ["strategic", "technical", "operations"]
        
        recommended = []
        for dtype in matched_types:
            experts = self.get_experts_by_type(ExpertType(dtype))
            recommended.extend(experts)
        
        # 去重并排序
        seen = set()
        unique = []
        for e in recommended:
            if e.expert_id not in seen:
                seen.add(e.expert_id)
                unique.append(e)
        
        return sorted(unique, key=lambda x: x.weight, reverse=True)[:5]
    
    def to_agents_config(self, expert_ids: List[str]) -> List[Dict]:
        """转换为Agent配置"""
        agents = []
        for expert_id in expert_ids:
            expert = self.get_expert(expert_id)
            if expert and expert.is_active:
                agents.append({
                    "agent_id": expert.expert_id,
                    "name": expert.name,
                    "role": expert.description[:50],
                    "weight": expert.weight,
                    "expertise": expert.expertise,
                    "use_external_llm": True,
                    "llm_provider": "openai",
                    "llm_model": "gpt-4",
                    "personality": expert.personality,
                    "prompt_template": expert.prompt_template
                })
        return agents


# 全局配置实例
expert_config = DecisionExpertConfig()
