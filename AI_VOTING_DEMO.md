# 🗳️ AI投票系统演示文档

## 系统已安装

**版本**: V5.2.5  
**状态**: ✅ 已安装并运行  
**位置**: `/plugins/team_chat/modules/ai_voting/`

---

## 📺 演示视频/截图

### 1. 后端演示（已运行）

上面已经运行了完整的后端演示，展示了：

#### ✅ 基础投票功能
```
投票主题: 选择最佳技术架构
选项: 微服务架构、单体架构、混合架构
参与智能体: 5个（架构专家40%、性能专家20%、安全专家20%、成本专家10%、运维专家10%）

结果:
🥇 单体架构 - 2票 (50%)
🥈 微服务架构 - 2票 (30%)
🥉 混合架构 - 1票 (20%)

共识度: 80%
```

#### ✅ 群聊投票集成
```
场景: 架构专家在群聊中说"大家来投票决定吧"
系统自动:
1. 检测投票意图
2. 解析投票内容
3. 创建投票
4. 邀请智能体参与
5. 执行投票
6. 显示结果
```

#### ✅ 圆桌会议投票
```
议题: 技术选型决策
选项: React、Vue、Angular
参与者: 前端专家、UX设计师、产品经理

结果: Angular获胜（2票，67%）
共识度: 100%
```

---

## 🖥️ 前端界面

### 界面文件位置
```
/plugins/team_chat/frontend/public/demo-voting-ui.html
```

### 界面预览

打开浏览器访问（安装后）：
```
http://localhost:port/api/plugins/team_chat/static/demo-voting-ui.html
```

### 界面包含

1. **投票卡片** - 群聊中显示的投票
2. **结果卡片** - 投票完成后的结果展示
3. **创建表单** - 手动创建投票的UI
4. **协商对话** - 智能体协商过程的实时展示

---

## 🎯 使用演示

### 方式1: AI群聊自动触发

```
智能体在群聊中发送消息：
"发起投票：选择最佳方案，选项A微服务、选项B单体、选项C混合"

系统自动：
✅ 检测投票意图
✅ 解析主题和选项
✅ 创建投票
✅ 邀请所有智能体
✅ 显示投票卡片
```

### 方式2: 手动创建投票

```javascript
// 通过UI发起
AIVoting.openCreateModal();

// 或通过API
fetch('/api/plugins/team_chat/ai-voting/create', {
  method: 'POST',
  body: JSON.stringify({
    title: "选择最佳方案",
    options: [
      { id: "opt1", text: "方案A" },
      { id: "opt2", text: "方案B" }
    ],
    agents: [...],
    negotiation_duration: 180,
    consensus_threshold: 0.7
  })
});
```

### 方式3: 圆桌会议投票

```javascript
// 为圆桌议题创建投票
RoundTableVoting.createVote(
  "技术选型",
  ["React", "Vue", "Angular"],
  participants
);
```

---

## 📊 演示数据

### 智能体角色

| 智能体 | 角色 | 权重 | 专长 |
|--------|------|------|------|
| 架构专家 | 系统架构 | 40% | 微服务、高并发 |
| 性能专家 | 性能优化 | 20% | 数据库、缓存 |
| 安全专家 | 安全审计 | 20% | 加密、认证 |
| 成本专家 | 成本分析 | 10% | 云资源、预算 |
| 运维专家 | 运维管理 | 10% | CI/CD、监控 |

### 投票流程

```
1. 分析阶段 (30秒)
   └─ 各智能体独立分析选项

2. 协商阶段 (60-180秒)
   └─ 智能体间讨论
   └─ 实时计算共识度

3. 投票阶段 (10秒)
   └─ 各智能体独立投票
   └─ 应用权重计算

4. 结果阶段
   └─ 显示获胜方案
   └─ 生成决策报告
```

---

## 🔧 API接口

### 基础API

```
POST /api/plugins/team_chat/ai-voting/create
GET  /api/plugins/team_chat/ai-voting/vote/{id}
GET  /api/plugins/team_chat/ai-voting/list
GET  /api/plugins/team_chat/ai-voting/agents
GET  /api/plugins/team_chat/ai-voting/report/{id}
```

### 群聊集成API

```
POST /api/plugins/team_chat/ai-voting/group-chat/create
GET  /api/plugins/team_chat/ai-voting/group-chat/status/{session_id}
```

### 圆桌会议API

```
POST /api/plugins/team_chat/ai-voting/roundtable/create
GET  /api/plugins/team_chat/ai-voting/roundtable/summary/{topic}
```

---

## 📁 文件结构

```
modules/ai_voting/
├── __init__.py                 # 模块入口
├── ai_voting_core.py           # 核心逻辑 (12KB)
├── negotiation_engine.py       # 协商引擎 (8KB)
├── report_generator.py         # 报告生成 (16KB)
└── group_chat_integration.py   # 群聊集成 (11KB)

frontend/src/modules/
├── AIVoting.js                 # 前端组件 (16KB)
└── AIVotingChat.js             # 群聊组件 (8KB)

frontend/public/
└── demo-voting-ui.html         # 界面演示 (17KB)

demo_ai_voting.py               # 后端演示脚本 (7KB)
```

---

## ✅ 功能清单

- [x] 纯智能体投票（人类不参与）
- [x] AI协商模式（智能体间讨论）
- [x] 动态权重配置（每次投票设置）
- [x] 决策报告生成（AI分析总结）
- [x] 群聊自动触发（检测投票意图）
- [x] 圆桌会议投票（议题投票）
- [x] 实时进度展示（协商过程）
- [x] 结果可视化（图表展示）

---

## 🚀 快速开始

### 1. 安装
```bash
tar -xzf team_chat-v5.2.5-group-chat-voting.tar.gz -C ~/.qwenpaw/plugins/
```

### 2. 运行演示
```bash
cd ~/.qwenpaw/plugins/team_chat
python3 demo_ai_voting.py
```

### 3. 查看界面
打开浏览器访问：
```
http://your-qwenpaw-url/api/plugins/team_chat/static/demo-voting-ui.html
```

### 4. 在群聊中使用
在AI群聊中，智能体发送：
```
"发起投票：选择最佳方案，选项A、选项B、选项C"
```

---

## 💡 关键特性

### 智能体投票必须选择
- 不能弃权
- 必须投给其中一个选项
- 提供投票理由

### 协商模式
- 多轮讨论
- 实时共识度计算
- 分歧点识别

### 权重配置
- 每次投票可配置
- 可视化滑块调整
- 自动归一化

### 决策报告
- 投票结果统计
- 共识度分析
- AI建议生成
- 风险评估
- Markdown导出

---

## 📞 技术支持

如有问题，请查看：
- `CHANGELOG_v5.2.5.md` - 更新日志
- `AI_VOTING_DEMO.md` - 本演示文档
- `modules/ai_voting/` - 源代码

---

**TeamChat AI投票系统已就绪！** 🎉
