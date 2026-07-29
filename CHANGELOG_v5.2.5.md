# TeamChat v5.2.5 更新日志

## AI群聊投票集成

### 发布日期
2026-07-27

### 新增功能

#### 🗳️ AI群聊投票集成
**核心特性：**
- ✅ **群聊中自动检测投票意图** - 智能体说"发起投票"自动触发
- ✅ **圆桌会议投票** - 为议题创建投票
- ✅ **实时投票卡片** - 嵌入群聊消息流
- ✅ **投票结果展示** - 自动显示在群聊中

**集成方式：**
```
AI群聊/圆桌会议
    ↓
智能体说"发起投票"
    ↓
自动解析投票内容
    ↓
创建AI投票
    ↓
智能体协商投票
    ↓
结果显示在群聊
```

**触发关键词：**
- "发起投票"
- "我们投票"
- "大家投票"
- "投票决定"
- "投票选择"
- "来投票"
- "投个票"

**投票内容解析：**
```
智能体消息：
"发起投票：选择最佳方案，选项A微服务、选项B单体、选项C混合"

自动解析：
- 主题：选择最佳方案
- 选项：微服务、单体、混合
- 参与者：当前群聊所有智能体
- 权重：平均分配
```

**新增文件：**
```
modules/ai_voting/
├── group_chat_integration.py    # 群聊集成 (10KB)

frontend/src/modules/
└── AIVotingChat.js              # 群聊组件 (8KB)
```

**API接口：**
- `POST /ai-voting/group-chat/create` - 群聊创建投票
- `GET /ai-voting/group-chat/status/{session_id}` - 群聊投票状态
- `POST /ai-voting/roundtable/create` - 圆桌创建投票
- `GET /ai-voting/roundtable/summary/{topic}` - 圆桌投票总结

**使用场景：**

**场景1：群聊中自动投票**
```
智能体A："大家来投票决定吧，方案一用React、方案二用Vue"
系统：自动创建投票，所有智能体参与
智能体B/C/D：分析 → 协商 → 投票
系统：显示投票结果在群聊
```

**场景2：圆桌会议投票**
```
主持人：为"技术选型"议题创建投票
系统：创建圆桌投票
各专家智能体：独立分析 → 讨论 → 投票
系统：生成决策报告
```

**场景3：手动触发投票**
```
用户点击"发起投票"按钮
填写主题和选项
选择参与智能体
配置权重
系统：创建并执行投票
```

### 技术实现

**后端集成：**
```python
# 群聊消息处理
async def handle_chat_message(session_id, agent_id, message, participants):
    if detect_voting_intent(message):
        vote_config = parse_vote_content(message)
        vote = await create_vote(vote_config)
        return vote_card
```

**前端集成：**
```javascript
// 检测投票意图
if (detectVotingIntent(message)) {
    const voteData = await createVote(sessionId, config);
    renderVoteCard(voteData);
}
```

### 文件变更

| 文件 | 类型 | 说明 |
|------|------|------|
| `modules/ai_voting/group_chat_integration.py` | 新增 | 群聊集成模块 |
| `frontend/src/modules/AIVotingChat.js` | 新增 | 群聊前端组件 |
| `team_chat_main.py` | 修改 | 添加群聊API路由 |
| `plugin.json` | 修改 | 版本更新 |

### 后续优化

1. 支持更多投票触发方式（@提及、快捷命令）
2. 投票模板库（常用决策场景）
3. 投票历史在群聊中可追溯
4. 支持图片/文件作为投票选项
5. 投票结果自动转化为任务

---

**版本**: v5.2.5  
**代号**: AI Group Chat Voting  
**维护者**: CloudPaw-Master  
**日期**: 2026-07-27
