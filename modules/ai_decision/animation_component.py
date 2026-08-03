#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
AI决策动画组件 v5.3.5
提供决策过程可视化动画和AI决策优势展示
"""

from typing import Dict, List, Optional, Any
from dataclasses import dataclass
import time


@dataclass
class AnimationFrame:
    """动画帧数据"""
    stage: str
    title: str
    description: str
    progress: int  # 0-100
    agents: List[Dict[str, Any]]
    highlights: List[str]


class DecisionAnimationEngine:
    """决策动画引擎"""
    
    STAGES = [
        {
            "id": "initialization",
            "title": "🚀 决策初始化",
            "description": "系统正在分析决策主题，准备智能体配置...",
            "duration": 2.0,
            "icon": "🎯"
        },
        {
            "id": "analysis",
            "title": "🔍 多维度分析",
            "description": "各AI专家从不同角度分析选项，评估优劣势...",
            "duration": 4.0,
            "icon": "🧠"
        },
        {
            "id": "negotiation",
            "title": "💬 智能协商",
            "description": "AI智能体之间进行多轮协商，达成共识...",
            "duration": 5.0,
            "icon": "🤝"
        },
        {
            "id": "voting",
            "title": "🗳️ 权重投票",
            "description": "基于专业度和置信度进行加权投票...",
            "duration": 3.0,
            "icon": "⚖️"
        },
        {
            "id": "consensus",
            "title": "✅ 共识达成",
            "description": "计算最终共识度，生成决策报告...",
            "duration": 2.0,
            "icon": "🎉"
        }
    ]
    
    ADVANTAGES = [
        {
            "icon": "🧠",
            "title": "多专家视角",
            "description": "汇聚不同领域AI专家，提供全方位分析"
        },
        {
            "icon": "⚡",
            "title": "高效并行",
            "description": "多智能体并发分析，秒级完成复杂决策"
        },
        {
            "icon": "🎯",
            "title": "客观公正",
            "description": "基于数据和逻辑，消除人为偏见和情绪影响"
        },
        {
            "icon": "📊",
            "title": "量化评估",
            "description": "置信度评分+权重投票，结果可追溯可解释"
        },
        {
            "icon": "🔄",
            "title": "持续学习",
            "description": "从历史决策中学习，不断优化决策质量"
        },
        {
            "icon": "🔒",
            "title": "安全可靠",
            "description": "本地部署，数据不出境，保障信息安全"
        }
    ]
    
    def __init__(self):
        self.current_stage = 0
        self.start_time = None
        self.frames: List[AnimationFrame] = []
    
    def start(self, vote_config: Dict) -> Dict:
        """开始决策动画"""
        self.start_time = time.time()
        self.current_stage = 0
        
        return {
            "status": "started",
            "stages": self.STAGES,
            "advantages": self.ADVANTAGES,
            "current_stage": 0,
            "total_stages": len(self.STAGES),
            "estimated_duration": sum(s["duration"] for s in self.STAGES)
        }
    
    def get_current_frame(self, vote_data: Optional[Dict] = None) -> AnimationFrame:
        """获取当前动画帧"""
        elapsed = time.time() - self.start_time if self.start_time else 0
        
        # 计算当前阶段
        cumulative = 0
        current_idx = 0
        for i, stage in enumerate(self.STAGES):
            if cumulative + stage["duration"] > elapsed:
                current_idx = i
                break
            cumulative += stage["duration"]
            current_idx = i + 1
        
        current_idx = min(current_idx, len(self.STAGES) - 1)
        stage = self.STAGES[current_idx]
        
        # 计算进度
        stage_elapsed = elapsed - cumulative
        stage_progress = min(100, int((stage_elapsed / stage["duration"]) * 100)) if current_idx < len(self.STAGES) else 100
        total_progress = min(100, int((elapsed / sum(s["duration"] for s in self.STAGES)) * 100))
        
        return AnimationFrame(
            stage=stage["id"],
            title=stage["title"],
            description=stage["description"],
            progress=total_progress,
            agents=self._generate_agent_frames(vote_data),
            highlights=self._generate_highlights(vote_data)
        )
    
    def _generate_agent_frames(self, vote_data: Optional[Dict]) -> List[Dict]:
        """生成智能体动画帧"""
        agents = []
        if vote_data and "agents" in vote_data:
            for i, agent in enumerate(vote_data["agents"]):
                agents.append({
                    "id": agent.get("agent_id", f"agent_{i}"),
                    "name": agent.get("name", f"专家{i+1}"),
                    "role": agent.get("role", "分析师"),
                    "status": self._get_agent_status(i),
                    "animation": self._get_agent_animation(i),
                    "position": self._get_agent_position(i, len(vote_data["agents"]))
                })
        return agents
    
    def _get_agent_status(self, index: int) -> str:
        """获取智能体状态"""
        statuses = ["analyzing", "thinking", "discussing", "voting", "completed"]
        return statuses[min(index, len(statuses) - 1)]
    
    def _get_agent_animation(self, index: int) -> str:
        """获取智能体动画类型"""
        animations = ["pulse", "bounce", "slide", "fade", "spin"]
        return animations[index % len(animations)]
    
    def _get_agent_position(self, index: int, total: int) -> Dict:
        """获取智能体位置（圆形布局）"""
        import math
        angle = (2 * math.pi * index) / max(total, 1) - math.pi / 2
        radius = 120
        return {
            "x": 200 + radius * math.cos(angle),
            "y": 200 + radius * math.sin(angle),
            "angle": angle
        }
    
    def _generate_highlights(self, vote_data: Optional[Dict]) -> List[str]:
        """生成高亮信息"""
        highlights = [
            "正在分析选项优劣势...",
            "评估各方案可行性...",
            "计算置信度评分...",
            "生成决策建议..."
        ]
        return highlights[:2]
    
    def get_advantages_html(self) -> str:
        """获取优势展示HTML"""
        cards = []
        for adv in self.ADVANTAGES:
            cards.append(f'''
            <div class="ai-advantage-card">
                <div class="advantage-icon">{adv["icon"]}</div>
                <div class="advantage-title">{adv["title"]}</div>
                <div class="advantage-desc">{adv["description"]}</div>
            </div>
            ''')
        
        return f'''
        <div class="ai-advantages-section">
            <h3 class="advantages-title">🌟 AI决策优势</h3>
            <div class="advantages-grid">
                {''.join(cards)}
            </div>
        </div>
        '''
    
    def get_animation_css(self) -> str:
        """获取动画CSS样式"""
        return '''
        <style>
        .ai-decision-animation {
            --primary-color: #10b981;
            --secondary-color: #3b82f6;
            --bg-dark: #1a1a2e;
            --bg-card: #16213e;
        }
        
        .animation-container {
            background: linear-gradient(135deg, var(--bg-dark) 0%, var(--bg-card) 100%);
            border-radius: 16px;
            padding: 24px;
            color: white;
            position: relative;
            overflow: hidden;
        }
        
        .stage-indicator {
            display: flex;
            justify-content: space-between;
            margin-bottom: 24px;
            position: relative;
        }
        
        .stage-indicator::before {
            content: '';
            position: absolute;
            top: 20px;
            left: 10%;
            right: 10%;
            height: 4px;
            background: rgba(255,255,255,0.1);
            border-radius: 2px;
        }
        
        .stage-indicator::after {
            content: '';
            position: absolute;
            top: 20px;
            left: 10%;
            height: 4px;
            background: linear-gradient(90deg, var(--primary-color), var(--secondary-color));
            border-radius: 2px;
            transition: width 0.5s ease;
        }
        
        .stage-dot {
            width: 44px;
            height: 44px;
            border-radius: 50%;
            background: rgba(255,255,255,0.1);
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 20px;
            position: relative;
            z-index: 1;
            transition: all 0.3s ease;
        }
        
        .stage-dot.active {
            background: var(--primary-color);
            animation: pulse 1.5s infinite;
            box-shadow: 0 0 20px rgba(16, 185, 129, 0.5);
        }
        
        .stage-dot.completed {
            background: var(--secondary-color);
        }
        
        @keyframes pulse {
            0%, 100% { transform: scale(1); }
            50% { transform: scale(1.1); }
        }
        
        .agents-orbit {
            width: 400px;
            height: 400px;
            margin: 0 auto;
            position: relative;
        }
        
        .center-hub {
            position: absolute;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            width: 80px;
            height: 80px;
            background: linear-gradient(135deg, var(--primary-color), var(--secondary-color));
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 32px;
            animation: rotate 10s linear infinite;
        }
        
        @keyframes rotate {
            from { transform: translate(-50%, -50%) rotate(0deg); }
            to { transform: translate(-50%, -50%) rotate(360deg); }
        }
        
        .agent-node {
            position: absolute;
            width: 60px;
            height: 60px;
            background: rgba(255,255,255,0.1);
            border-radius: 50%;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            border: 2px solid rgba(255,255,255,0.2);
            transition: all 0.3s ease;
        }
        
        .agent-node.analyzing {
            border-color: var(--primary-color);
            animation: analyzing-pulse 1s infinite;
        }
        
        @keyframes analyzing-pulse {
            0%, 100% { box-shadow: 0 0 0 0 rgba(16, 185, 129, 0.4); }
            50% { box-shadow: 0 0 0 10px rgba(16, 185, 129, 0); }
        }
        
        .agent-node.thinking {
            animation: thinking-bounce 0.5s infinite alternate;
        }
        
        @keyframes thinking-bounce {
            from { transform: translateY(0); }
            to { transform: translateY(-5px); }
        }
        
        .progress-bar {
            height: 8px;
            background: rgba(255,255,255,0.1);
            border-radius: 4px;
            margin-top: 16px;
            overflow: hidden;
        }
        
        .progress-fill {
            height: 100%;
            background: linear-gradient(90deg, var(--primary-color), var(--secondary-color));
            border-radius: 4px;
            transition: width 0.5s ease;
        }
        
        .highlights-list {
            margin-top: 16px;
            padding: 0;
            list-style: none;
        }
        
        .highlights-list li {
            padding: 8px 0;
            color: rgba(255,255,255,0.8);
            display: flex;
            align-items: center;
            gap: 8px;
        }
        
        .highlights-list li::before {
            content: '✨';
        }
        
        /* AI优势卡片 */
        .ai-advantages-section {
            margin-top: 32px;
        }
        
        .advantages-title {
            text-align: center;
            color: var(--primary-color);
            font-size: 1.5rem;
            margin-bottom: 24px;
        }
        
        .advantages-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
            gap: 16px;
        }
        
        .ai-advantage-card {
            background: rgba(255,255,255,0.05);
            border-radius: 12px;
            padding: 20px;
            text-align: center;
            transition: all 0.3s ease;
            border: 1px solid rgba(255,255,255,0.1);
        }
        
        .ai-advantage-card:hover {
            transform: translateY(-4px);
            background: rgba(255,255,255,0.1);
            border-color: var(--primary-color);
        }
        
        .advantage-icon {
            font-size: 40px;
            margin-bottom: 12px;
        }
        
        .advantage-title {
            font-weight: 600;
            color: white;
            margin-bottom: 8px;
        }
        
        .advantage-desc {
            color: rgba(255,255,255,0.7);
            font-size: 0.9rem;
            line-height: 1.5;
        }
        </style>
        '''
    
    def get_animation_html(self, vote_data: Optional[Dict] = None) -> str:
        """获取完整动画HTML"""
        frame = self.get_current_frame(vote_data)
        
        stage_dots = []
        for i, stage in enumerate(self.STAGES):
            status = "completed" if i < self.current_stage else "active" if i == self.current_stage else "pending"
            stage_dots.append(f'<div class="stage-dot {status}">{stage["icon"]}</div>')
        
        agent_nodes = []
        for agent in frame.agents:
            pos = agent.get("position", {"x": 200, "y": 200})
            agent_nodes.append(f'''
            <div class="agent-node {agent.get('status', '')}" style="left:{pos['x']}px;top:{pos['y']}px">
                <span>{agent.get('name', 'AI')[:2]}</span>
            </div>
            ''')
        
        highlights = ''.join([f'<li>{h}</li>' for h in frame.highlights])
        
        return f'''
        {self.get_animation_css()}
        <div class="ai-decision-animation">
            <div class="animation-container">
                <div class="stage-indicator">
                    {''.join(stage_dots)}
                </div>
                
                <div style="text-align: center; margin-bottom: 16px;">
                    <h3 style="color: var(--primary-color); margin: 0;">{frame.title}</h3>
                    <p style="color: rgba(255,255,255,0.8); margin: 8px 0;">{frame.description}</p>
                </div>
                
                <div class="agents-orbit">
                    <div class="center-hub">🎯</div>
                    {''.join(agent_nodes)}
                </div>
                
                <div class="progress-bar">
                    <div class="progress-fill" style="width: {frame.progress}%"></div>
                </div>
                
                <ul class="highlights-list">
                    {highlights}
                </ul>
            </div>
            
            {self.get_advantages_html()}
        </div>
        '''


# 全局动画引擎实例
animation_engine = DecisionAnimationEngine()

# 兼容别名
animation_component = animation_engine
