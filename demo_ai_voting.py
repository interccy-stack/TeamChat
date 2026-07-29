#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
AI投票系统演示脚本
展示如何在AI群聊中使用投票功能
"""

import asyncio
import sys
sys.path.insert(0, '/run/csi/mount-root/nas/4079184d856ecc166ed19d4887083405/plugins/team_chat')

from modules.ai_voting import AIVotingSystem, VoteConfig, VoteOption, AgentConfig
from modules.ai_voting.group_chat_integration import GroupChatVotingIntegration


async def demo_basic_voting():
    """演示基础投票功能"""
    print("=" * 60)
    print("🗳️ AI投票系统演示 - 基础功能")
    print("=" * 60)
    print()
    
    # 创建投票系统
    voting_system = AIVotingSystem()
    
    # 步骤1: 创建投票配置
    print("📋 步骤1: 创建投票配置")
    print("-" * 60)
    
    config = VoteConfig(
        title="选择最佳技术架构",
        options=[
            VoteOption(id="micro", text="微服务架构", description="高扩展性"),
            VoteOption(id="mono", text="单体架构", description="简单快速"),
            VoteOption(id="hybrid", text="混合架构", description="渐进演进")
        ],
        agents=[
            AgentConfig(agent_id="architect", name="架构专家", role="系统架构", weight=0.4),
            AgentConfig(agent_id="performance", name="性能专家", role="性能优化", weight=0.2),
            AgentConfig(agent_id="security", name="安全专家", role="安全审计", weight=0.2),
            AgentConfig(agent_id="cost", name="成本专家", role="成本分析", weight=0.1),
            AgentConfig(agent_id="ops", name="运维专家", role="运维管理", weight=0.1)
        ],
        negotiation_duration=60,  # 60秒协商
        consensus_threshold=0.7
    )
    
    print(f"投票主题: {config.title}")
    print(f"选项数量: {len(config.options)}")
    for opt in config.options:
        print(f"  - {opt.text}: {opt.description}")
    print(f"\n参与智能体: {len(config.agents)}个")
    for agent in config.agents:
        print(f"  - {agent.name} ({agent.role}): 权重{agent.weight:.0%}")
    print()
    
    # 步骤2: 创建投票
    print("🚀 步骤2: 创建投票")
    print("-" * 60)
    
    vote = await voting_system.create_vote(config)
    print(f"投票ID: {vote.id}")
    print(f"状态: {vote.status.value}")
    print()
    
    # 步骤3: 启动投票流程
    print("🤖 步骤3: 启动AI投票流程")
    print("-" * 60)
    print("流程: 分析 → 协商 → 投票 → 计算结果")
    print()
    
    await voting_system.start_vote(vote.id)
    
    # 步骤4: 显示结果
    print("✅ 步骤4: 投票完成")
    print("-" * 60)
    
    vote = voting_system.get_vote(vote.id)
    
    print(f"最终状态: {vote.status.value}")
    print(f"共识度: {vote.consensus_level:.1%}")
    print()
    
    print("📊 投票结果:")
    print("-" * 60)
    
    # 按加权票数排序
    sorted_options = sorted(vote.config.options, key=lambda o: o.weighted_votes, reverse=True)
    
    for i, opt in enumerate(sorted_options):
        medal = "🥇" if i == 0 else "🥈" if i == 1 else "🥉" if i == 2 else "  "
        percentage = (opt.weighted_votes / sum(o.weighted_votes for o in vote.config.options) * 100) if sum(o.weighted_votes for o in vote.config.options) > 0 else 0
        print(f"{medal} {opt.text}")
        print(f"   票数: {opt.votes}票")
        print(f"   加权票数: {opt.weighted_votes:.2f}")
        print(f"   占比: {percentage:.1f}%")
        print(f"   支持者: {', '.join(opt.voters)}")
        print()
    
    if vote.winner:
        print(f"🏆 获胜方案: {vote.winner.text}")
    
    return vote


async def demo_group_chat_voting():
    """演示群聊投票集成"""
    print()
    print("=" * 60)
    print("💬 AI群聊投票演示")
    print("=" * 60)
    print()
    
    integration = GroupChatVotingIntegration()
    
    # 模拟群聊场景
    print("📱 场景: AI群聊中智能体发起投票")
    print("-" * 60)
    
    session_id = "chat_001"
    agent_id = "architect"
    agent_name = "架构专家"
    
    # 智能体消息
    message = "大家来投票决定吧，方案一用微服务、方案二用单体架构、方案三用混合架构"
    
    print(f"智能体 [{agent_name}]: {message}")
    print()
    
    # 参与者列表
    participants = [
        {"id": "architect", "name": "架构专家", "role": "系统架构", "type": "agent"},
        {"id": "performance", "name": "性能专家", "role": "性能优化", "type": "agent"},
        {"id": "security", "name": "安全专家", "role": "安全审计", "type": "agent"},
        {"id": "user1", "name": "用户", "role": "参与者", "type": "human"}
    ]
    
    print("👥 群聊参与者:")
    for p in participants:
        icon = "🤖" if p["type"] == "agent" else "👤"
        print(f"  {icon} {p['name']} ({p['role']})")
    print()
    
    # 处理消息
    print("🔍 系统检测投票意图...")
    result = await integration.handle_message(session_id, agent_id, agent_name, message, participants)
    
    if result:
        print("✅ 检测到投票意图，自动创建投票")
        print()
        print("📋 投票信息:")
        print(f"  主题: {result['title']}")
        print(f"  选项: {', '.join(result['options'])}")
        print(f"  参与智能体: {', '.join(result['participants'])}")
        print(f"  投票ID: {result['vote_id']}")
        print()
        print("💬 系统消息:")
        print(f"  {result['message']}")
        print()
        
        # 等待投票完成
        print("⏳ 等待AI投票完成...")
        await asyncio.sleep(3)
        
        # 获取结果
        status = await integration.get_vote_update(session_id)
        if status:
            print()
            print("✅ 投票完成!")
            print()
            print("📊 结果摘要:")
            print(status['summary'])
    else:
        print("❌ 未检测到投票意图")
    
    return result


async def demo_roundtable_voting():
    """演示圆桌会议投票"""
    print()
    print("=" * 60)
    print("🪑 AI圆桌会议投票演示")
    print("=" * 60)
    print()
    
    from modules.ai_voting.group_chat_integration import roundtable_voting
    
    # 圆桌议题
    topic = "技术选型决策"
    options = ["React", "Vue", "Angular"]
    
    participants = [
        {"id": "frontend", "name": "前端专家", "role": "前端架构", "type": "agent"},
        {"id": "ux", "name": "UX设计师", "role": "用户体验", "type": "agent"},
        {"id": "pm", "name": "产品经理", "role": "产品规划", "type": "agent"}
    ]
    
    print(f"📋 圆桌议题: {topic}")
    print(f"📝 选项: {', '.join(options)}")
    print(f"👥 参与者:")
    for p in participants:
        print(f"  - {p['name']} ({p['role']})")
    print()
    
    # 创建投票
    print("🚀 创建圆桌投票...")
    result = await roundtable_voting.create_topic_vote(topic, options, participants)
    
    if result and result.get('success'):
        print(f"✅ {result['message']}")
        print(f"投票ID: {result['vote_id']}")
        print()
        
        # 等待投票完成
        print("⏳ 等待圆桌投票完成...")
        await asyncio.sleep(3)
        
        # 获取总结
        print("📊 获取决策总结...")
        summary = await roundtable_voting.get_roundtable_summary(topic)
        if summary:
            print()
            print("=" * 60)
            print(summary)
            print("=" * 60)
    else:
        print(f"❌ 创建失败: {result.get('error', '未知错误')}")


async def main():
    """主函数"""
    print()
    print("╔" + "=" * 58 + "╗")
    print("║" + " " * 58 + "║")
    print("║" + "   🗳️ TeamChat AI投票系统演示".center(54) + "║")
    print("║" + " " * 58 + "║")
    print("╚" + "=" * 58 + "╝")
    print()
    
    try:
        # 演示1: 基础投票
        await demo_basic_voting()
        
        # 演示2: 群聊投票
        await demo_group_chat_voting()
        
        # 演示3: 圆桌投票
        await demo_roundtable_voting()
        
        print()
        print("=" * 60)
        print("✅ 演示完成!")
        print("=" * 60)
        print()
        print("💡 提示:")
        print("  - AI投票系统已集成到TeamChat")
        print("  - 在AI群聊中说'发起投票'即可触发")
        print("  - 支持圆桌会议投票")
        print("  - 自动生成决策报告")
        print()
        
    except Exception as e:
        print(f"\n❌ 演示出错: {e}")
        import traceback
        traceback.print_exc()


if __name__ == "__main__":
    asyncio.run(main())
