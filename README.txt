================================================================================
  TeamChat v4.0.6  —  QwenPaw 团队会谈插件
  人类自选主持人 · 全异步架构 · 像素动画 · 后台持久化
================================================================================
                         编辑者：华容咨询ai-lowc.site
  一句话：选择智能体当主持人，人类发言后 AI 主持协调多智能体讨论，
           离开页面不丢消息，左上角像素圆桌动画实时展示与会人员。

================================================================================
  一、版本历史
================================================================================

  v4.0.6 (2026-06-10) — 当前版本
    + POST /upload          — 文件上传（11种格式, 最大5MB）
    + POST /chat 即时存盘    — 每步回复立即保存，离开页面不丢
    + DELETE /session/{id}  — 删除会话
    + PUT /session/{id}/tag — 标签
    + PUT /session/{id}/pin — 置顶/取消
    + GET /sessions?search= — 搜索全文
    + GET /agent-info/{id}  — 智能体详情（模型+工作区路径）
    + POST /avatar           — 头像上传（200x200, jpg/png）
    + GET /avatar/{id}       — 头像下载
    + 🏛️ 左上角像素圆桌动画    — Canvas 实时绘制人物绕圆桌跳动
    + 🔥 进度条七彩渐变+火花   — ✨🔥💥 三个阶段特效
    + 📎 文件上传 ref 修复     — 解决 Ant Design Button 不触发
    + 📊 消息条显示模型/工作区 — 每条消息气泡携带智能体详情
    + 💻 系统环境信息面板      — 右上角 Popover，含用户可编辑上下文
    + ⚡ 代码质量提升           — imghdr 验证/AST 解析/细分异常

  v4.0.5 (用户自改版)
    + 会话路径改为 plugins/team_chat/sessions/
    + 异步锁保护缓存和配置读取
    + 细分异常类型（JSONDecodeError/KeyError/Timeout/NetworkError）
    + 历史限制 MAX_HISTORY_SIZE=500
    + 完整 UUID session ID
    + 异步会话 I/O

  v4.0.4 — 评测修复
    + Pydantic Field max_length=16000
    + 超时统一常量
    + onChangeHost 旧主持人自动恢复
    + 允许纯主持人对话

  v4.0.3 — 评测修复
    + 主持人切换状态同步
    + 会话恢复失败日志
    + 清理未使用依赖变量

  v4.0.2
    + 🧠 头脑风暴多轮讨论
    + 🔥 进度条动画
    + 💾 localStorage 会话持久化（离开不丢）

  v4.0.1
    + 🎤 语音转文字 (SpeechRecognition)
    + 📎 文件附件（前端读取文本）
    + UI 文案统一

  v4.0.0
    + 人类自选主持人（替换固定 CloudPaw-Master）
    + 全异步架构（httpx.AsyncClient）
    + 主持人灰显不可自选

  v3.0.0 — 初始（已废弃：同步 HTTP 死锁）

================================================================================
  二、架构
================================================================================

    前端 (React Canvas)                 后端 (FastAPI async)              Agent API
    ══════════════════════             ═════════════════════             ══════════
    registerRoutes()                   build_router()                   GET /api/agents
    ↓                                  prefix="/team-chat"              POST /api/agent/process
    TeamChatPage
    ├─ 🏛️ 像素圆桌动画 (Canvas)        ├─ GET  /agents                  (SSE 流式)
    ├─ 主持人 Select                   ├─ POST /chat       ← 核心
    ├─ 智能体 Tags (灰主持人)          ├─ GET  /sessions
    ├─ 🧠 头脑风暴开关                 ├─ GET  /session/{id}
    ├─ 消息历史 + 气泡                 ├─ DELETE /session/{id}
    ├─ 主持步骤                        ├─ PUT  /session/{id}/tag
    ├─ 输入栏 + 🎤 + 📎               ├─ PUT  /session/{id}/pin
    ├─ 💻 环境面板                     ├─ GET  /agent-info/{id}
    └─ 📂 历史会谈弹窗                 ├─ POST /upload
                                       ├─ POST /avatar
                                       └─ GET  /avatar/{id}

    数据流:
      人类发言 → POST /chat {host_id, agent_ids, message}
        → 翻译: _translate_for_host()
        → async SSE → 主持人回复 → 立即存盘
        → _translate_for_agent() × N
        → async SSE → 每个智能体回复 → 立即存盘
        → ChatResponse {history, host_steps}
        → JSON 持久化

================================================================================
  三、文件清单
================================================================================

  C:\Users\Administrator\.qwenpaw\workspaces\cloud-orchestrator\TeamChat\
  C:\Users\Administrator\.qwenpaw\plugins\team_chat\

  plugin.json            — 插件元数据
  manifest.json          — 发布清单
  main.py                — 后端（11 路由）
  frontend/dist/index.js — 前端（React + Canvas）
  frontend/src/index.js  — 前端源码
  README.txt             — 本文档
  sessions/              — 会谈记录（自动创建）
  media/                 — 上传文件（自动创建）
  avatars/               — 智能体头像（自动创建）

================================================================================
  四、API 接口
================================================================================

  核心接口：
    POST /chat           发起会谈，返回全部历史+步骤
    GET  /agents         获取智能体列表
    GET  /sessions?search= 获取会话列表（支持搜索）
    GET  /session/{id}   获取指定会话

  管理接口（v4.0.6 新增）：
    DELETE /session/{id}   删除会话
    PUT    /session/{id}/tag 设置标签
    PUT    /session/{id}/pin 置顶/取消

  增强接口（v4.0.6 新增）：
    GET  /agent-info/{id}  智能体详情（模型+工作区）
    POST /upload           文件上传（txt/md/json/py/…11种，最大5MB）
    POST /avatar           头像上传（200x200 jpg/png，最大2MB）
    GET  /avatar/{id}      头像下载

================================================================================
  五、关键实现
================================================================================

  翻译引擎：
    _translate_for_host()    — 人类语言 → 主持人协调提示词
    _translate_for_agent()   — 人类语言 → 参与者提示词
    HISTORY_WINDOW=6         — 上下文窗口
    CONTENT_PREVIEW_LEN=120  — 每条历史摘要长度

  异步基础设施：
    _call_agent_async()         — SSE 流式调用智能体
    _fetch_agents_async()       — TTL 60s 缓存智能体列表
    _resolve_agent_api_base_async() — 异步读取配置

  持久化：
    _load_session() / _save_session() — JSON 文件+异步锁
    MAX_HISTORY_SIZE=500              — 历史限制

  视觉：
    像素圆桌动画 — Canvas requestAnimationFrame，人物绕圆桌跳动
    进度条 — Ant Design Progress，七彩渐变 strokeColor，火花 emoji 阶段性显示
    头像 — imghdr 验证 + 手动 JPEG/PNG 尺寸解析（无 Pillow 依赖）

================================================================================
  六、文件格式
================================================================================

  会话 JSON 结构：
    {
      "session_id": "uuid",
      "created_at": timestamp,
      "host_id": "cloud-orchestrator",
      "host_name": "CloudPaw-Master",
      "agent_ids": ["default", "QwenPaw_QA_Agent_0.2"],
      "agent_names": ["Default Agent", "QA Agent"],
      "tag": "",          // v4.0.6 新增
      "pinned": false,     // v4.0.6 新增
      "history": [
        {
          "sender": "human | agent_id",
          "sender_name": "人类用户 | Agent名称",
          "content": "消息正文",
          "role": "human | host | agent",
          "robot_prompt": "使用的提示词",
          "timestamp": 1234567890.0
        }
      ],
      "host_steps": [
        {"step": 1, "action": "向主持人发送提示词", "detail": "...", "timestamp": ...}
      ]
    }

================================================================================
  七、安装与升级
================================================================================

  安装：
    1. 解压到 C:\Users\Administrator\.qwenpaw\plugins\team_chat\
    2. 重启 QwenPaw
    3. 菜单 → 「新会谈」

  升级（从 v4.0.5）：
    1. 覆盖 plugin.json, main.py, frontend/dist/index.js, frontend/src/index.js
    2. 重启 QwenPaw
    3. 旧会话自动兼容（tag/pinned 为空值）

================================================================================
  八、注意事项

    1. getApiUrl 包含插件前缀，前端必须拼接 "/team-chat"
    2. httpx.AsyncClient 是关键，同步会死锁
    3. 会话存于 plugins/team_chat/sessions/，卸载重装不丢
    4. 媒体文件存于 plugins/team_chat/media/ 和 avatars/
    5. 头像仅支持 jpg/png，超过 200x200 拒绝上传
    6. 文件上传仅支持 11 种文本格式，最大 5MB

================================================================================
  TeamChat v4.0.6  —  2026-06-10  —  0+1+2≠3{Q&V 115886}
================================================================================
