# TeamChat v5.2.4 更新日志

## AI投票系统

### 发布日期
2026-07-27

### 新增功能

#### 🗳️ AI投票系统
**核心特性：**
- ✅ **纯智能体投票** - 只有智能体参与，人类仅发起和观察
- ✅ **AI协商模式** - 智能体间讨论后投票
- ✅ **动态权重配置** - 每次投票可配置权重
- ✅ **AI决策报告** - 自动生成分析总结

**系统架构：**
```
modules/ai_voting/
├── __init__.py           # 模块入口
├── ai_voting_core.py     # 核心逻辑
├── negotiation_engine.py # 协商引擎
└── report_generator.py   # 报告生成器

frontend/src/modules/
└── AIVoting.js           # 前端组件
```

**API接口：**
- `POST /api/plugins/team_chat/ai-voting/create` - 创建投票
- `GET /api/plugins/team_chat/ai-voting/vote/{id}` - 获取状态
- `GET /api/plugins/team_chat/ai-voting/list` - 投票列表
- `GET /api/plugins/team_chat/ai-voting/agents` - 可用智能体
- `GET /api/plugins/team_chat/ai-voting/report/{id}` - 决策报告

**投票流程：**
1. 人类创建投票（配置主题、选项、智能体、权重）
2. 智能体独立分析各选项
3. 智能体间协商讨论
4. 智能体投票（必须选择，不能弃权）
5. 生成AI决策报告

**智能体角色：**
- 架构专家 - 系统架构设计
- 性能专家 - 性能优化
- 安全专家 - 安全审计
- 成本专家 - 成本分析
- 运维专家 - 运维管理
- 产品专家 - 产品设计

**决策报告内容：**
- 投票结果统计
- 共识度分析
- 关键分歧点
- AI建议
- 风险评估
- 后续步骤

#### 📊 权重配置
- 每次投票可配置权重
- 可视化滑块调整
- 自动归一化
- 支持0-100%任意权重

#### 💬 协商引擎
- 多轮协商讨论
- 实时共识度计算
- 分歧点识别
- 可配置协商时长

#### 📄 报告生成
- 自动生成Markdown报告
- 投票详情统计
- 共识度可视化
- AI建议生成

### 技术实现

**后端：**
- Python + FastAPI
- 异步处理
- 模块化设计

**前端：**
- React + Ant Design
- 实时状态更新
- 可视化图表

### 使用说明

**创建投票：**
1. 进入 TeamChat → AI投票
2. 点击"创建投票"
3. 输入投票主题
4. 添加选项（2-5个）
5. 选择参与智能体
6. 配置权重
7. 设置协商时长和共识阈值
8. 发起投票

**查看结果：**
- 实时查看投票进度
- 查看智能体协商对话
- 查看投票结果
- 下载决策报告

### 文件变更

| 文件 | 类型 | 说明 |
|------|------|------|
| `modules/ai_voting/` | 新增 | AI投票模块 |
| `frontend/src/modules/AIVoting.js` | 新增 | 前端组件 |
| `team_chat_main.py` | 修改 | 添加API路由 |
| `plugin.json` | 修改 | 版本更新 |

### 后续优化

1. 接入真实智能体API
2. 支持更多智能体角色
3. 协商过程可视化
4. 历史投票对比
5. 投票模板库

---

**版本**: v5.2.4  
**代号**: AI Voting  
**维护者**: CloudPaw-Master  
**日期**: 2026-07-27
