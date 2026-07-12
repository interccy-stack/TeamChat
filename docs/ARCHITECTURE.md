# TeamChat v5.0.0 架构设计文档

## 1. 系统概述

### 1.1 项目简介
TeamChat是一款集成AI能力的企业通讯插件，基于QwenPaw平台开发，提供传统邮箱、蜂巢P2P通信和AI副驾三大核心功能。

### 1.2 核心功能
- **传统邮箱**: 基于SMTP/IMAP的真实邮件收发
- **蜂巢邮箱**: 基于WebRTC的P2P即时通信
- **AI副驾**: 智能邮件优化和自动配置

### 1.3 技术栈
```
前端: React (ES5) + localStorage
后端: FastAPI + SQLite
通信: SMTP/IMAP + WebRTC DataChannel
AI: QwenPaw内置智能体
```

---

## 2. 系统架构

### 2.1 整体架构图

```
┌─────────────────────────────────────────────────────────────┐
│                        QwenPaw平台                         │
│  ┌─────────────────────────────────────────────────────┐   │
│  │                  TeamChat插件                      │   │
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐ │   │
│  │  │  前端UI层   │  │  后端API层  │  │   数据层    │ │   │
│  │  │  (React)  │  │  (FastAPI)  │  │  (SQLite)   │ │   │
│  │  └─────┬─────┘  └─────┬─────┘  └─────┬─────┘ │   │
│  │        │              │              │       │   │
│  │  ┌─────┴──────────────┴──────────────┴─────┐ │   │
│  │  │              通信层                      │ │   │
│  │  │  ┌────────┐ ┌────────┐ ┌────────┐     │ │   │
│  │  │  │ SMTP   │ │ IMAP   │ │ WebRTC │     │ │   │
│  │  │  └────────┘ └────────┘ └────────┘     │ │   │
│  │  └─────────────────────────────────────────┘ │   │
│  └─────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
```

### 2.2 模块划分

```
TeamChat/
├── plugin.json              # 插件配置
├── main.py                  # 后端入口
├── README.md                # 说明文档
├── email_backend/           # 邮件后端模块
│   ├── __init__.py
│   ├── database.py          # 数据库操作
│   ├── routes.py            # API路由
│   └── email_client.py      # 邮件客户端
├── frontend/                # 前端模块
│   └── dist/
│       └── index.js         # 前端代码
└── tests/                   # 测试模块
    ├── test_email_client.py
    ├── test_routes.py
    └── test_frontend.js
```

---

## 3. 核心模块设计

### 3.1 邮件客户端模块 (EmailClient)

**职责**: 封装SMTP/IMAP操作

**类图**:
```
┌─────────────────────────────────────┐
│           EmailClient               │
├─────────────────────────────────────┤
│ - smtp_host: str                    │
│ - smtp_port: int                    │
│ - imap_host: str                    │
│ - imap_port: int                    │
│ - username: str                     │
│ - password: str                     │
├─────────────────────────────────────┤
│ + send_email() -> dict              │
│ + fetch_emails() -> List[dict]      │
│ + test_connection() -> dict         │
│ - _parse_email() -> dict            │
└─────────────────────────────────────┘
```

**关键方法**:
- `send_email()`: 使用smtplib发送邮件
- `fetch_emails()`: 使用imaplib获取邮件
- `test_connection()`: 测试SMTP/IMAP连接

### 3.2 WebRTC P2P模块

**职责**: 实现浏览器间点对点通信

**状态机**:
```
┌─────────┐    init     ┌──────────┐
│  idle   │ ──────────> │  ready   │
└─────────┘             └────┬─────┘
                             │
        connect              │
                             ▼
┌─────────┐    connected  ┌──────────┐
│ error   │ <────────────── │connecting│
└─────────┘                 └────┬─────┘
                                 │
        disconnect               │
                                 ▼
                            ┌──────────┐
                            │connected │
                            └──────────┘
```

**核心组件**:
- `RTCPeerConnection`: WebRTC连接
- `DataChannel`: 数据传输通道
- `Signaling`: 信令交换（localStorage fallback）

### 3.3 AI副驾模块

**职责**: 提供智能邮件辅助功能

**功能列表**:
| 功能 | 实现方式 | 调用目标 |
|------|----------|----------|
| 智能优化 | Prompt工程 | default智能体 |
| 语法检查 | Prompt工程 | default智能体 |
| 内容建议 | Prompt工程 | default智能体 |
| 技术自配 | 规则引擎 | 本地执行 |

---

## 4. API设计

### 4.1 RESTful API规范

**基础URL**: `/api/plugins/teamchat/email`

| 方法 | 路径 | 描述 |
|------|------|------|
| GET | /config | 获取邮箱配置 |
| POST | /config | 保存邮箱配置 |
| POST | /config/test | 测试邮箱连接 |
| GET | /emails/{folder} | 获取邮件列表 |
| POST | /send | 发送邮件 |
| GET | /contacts | 获取联系人 |
| POST | /contacts | 添加联系人 |

### 4.2 请求/响应格式

**发送邮件请求**:
```json
{
  "to_addr": "recipient@example.com",
  "to_name": "Recipient Name",
  "subject": "Email Subject",
  "body": "Email body content",
  "cc": "cc@example.com",
  "bcc": "bcc@example.com"
}
```

**发送邮件响应**:
```json
{
  "success": true,
  "message": "邮件发送成功"
}
```

---

## 5. 数据模型

### 5.1 邮箱配置 (EmailConfig)

```python
{
  "email": "user@example.com",
  "display_name": "User Name",
  "provider": "qq|163|gmail|outlook|custom",
  "smtp_host": "smtp.example.com",
  "smtp_port": 587,
  "smtp_ssl": true,
  "imap_host": "imap.example.com",
  "imap_port": 993,
  "imap_ssl": true,
  "username": "user@example.com",
  "password": "encrypted_password"
}
```

### 5.2 邮件 (Email)

```python
{
  "id": "12345",
  "subject": "Email Subject",
  "from_addr": "sender@example.com",
  "from_name": "Sender Name",
  "to_addr": "recipient@example.com",
  "date": "2026-07-07 10:00:00",
  "body": "Plain text content",
  "html_body": "<html>...</html>",
  "flags": ["seen", "flagged"]
}
```

### 5.3 联系人 (Contact)

```python
{
  "id": 1,
  "name": "张三",
  "email": "zhangsan@example.com",
  "phone": "13800138000",
  "company": "Example Corp",
  "group": "同事"
}
```

### 5.4 蜂巢消息 (HiveMessage)

```python
{
  "id": 1234567890,
  "from": "User A",
  "to": "User B",
  "content": "Message content",
  "timestamp": "2026-07-07 10:00:00",
  "type": "text|file",
  "face_code": "HIVE-XXXXXXXX"
}
```

---

## 6. 安全设计

### 6.1 数据传输安全
- SMTP/IMAP使用SSL/TLS加密
- WebRTC使用DTLS加密
- 密码建议加密存储（TODO）

### 6.2 访问控制
- 基于QwenPaw的会话认证
- API权限控制（TODO）

### 6.3 数据安全
- 敏感配置本地存储
- 邮件内容不过度缓存

---

## 7. 性能设计

### 7.1 优化策略
- 邮件列表分页加载
- WebRTC连接复用
- localStorage数据压缩

### 7.2 缓存策略
- 邮箱配置缓存
- 联系人列表缓存
- 邮件内容不缓存（实时获取）

---

## 8. 扩展设计

### 8.1 插件扩展点
- 自定义邮箱服务商
- 自定义AI模型
- 自定义主题

### 8.2 未来规划
- 多账户管理
- 邮件模板
- 定时发送
- 邮件分类AI

---

## 9. 部署架构

### 9.1 开发环境
```
本地开发
├── QwenPaw (localhost:8088)
├── TeamChat插件
└── SQLite数据库
```

### 9.2 生产环境
```
服务器部署
├── Nginx (反向代理)
├── QwenPaw (Docker)
├── TeamChat插件
└── SQLite/PostgreSQL
```

---

## 10. 开发规范

### 10.1 代码规范
- Python: PEP8
- JavaScript: ES5兼容
- 注释: 中文注释
- 命名: 驼峰命名

### 10.2 Git规范
- 分支: main/dev/feature
- 提交: 中文描述
- 标签: v5.0.0格式

### 10.3 测试规范
- 单元测试覆盖率 > 80%
- 集成测试覆盖主要流程
- E2E测试覆盖关键路径

---

## 附录

### A. 术语表

| 术语 | 说明 |
|------|------|
| SMTP | 简单邮件传输协议 |
| IMAP | 互联网邮件访问协议 |
| WebRTC | 网页实时通信技术 |
| P2P | 点对点通信 |
| DataChannel | WebRTC数据传输通道 |
| STUN | NAT会话穿越工具 |

### B. 参考文档
- [FastAPI文档](https://fastapi.tiangolo.com/)
- [WebRTC文档](https://webrtc.org/)
- [IMAP协议RFC](https://tools.ietf.org/html/rfc3501)

### C. 更新日志

| 版本 | 日期 | 变更 |
|------|------|------|
| v5.0.0 | 2026-07-07 | 添加架构文档 |
| v5.0.0 | 2026-07-07 | 真实邮件收发 |
| v5.0.0 | 2026-07-07 | WebRTC P2P |

---

**文档版本**: v1.0.0
**最后更新**: 2026-07-07
**作者**: TeamChat开发团队
