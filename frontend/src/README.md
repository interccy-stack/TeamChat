# TeamChat前端模块化说明

## 目录结构

```
frontend/
├── src/
│   ├── components/     # React组件
│   │   ├── EmailList.js
│   │   ├── ComposeModal.js
│   │   └── ...
│   ├── hooks/          # 自定义Hooks
│   │   ├── useEmail.js
│   │   ├── useWebRTC.js
│   │   └── ...
│   ├── utils/          # 工具函数
│   │   ├── api.js      # API封装
│   │   ├── email.js    # 邮箱工具
│   │   ├── webrtc.js   # WebRTC工具
│   │   └── storage.js  # 存储工具
│   ├── pages/          # 页面组件
│   │   ├── TraditionalMailbox.js
│   │   ├── HiveMailbox.js
│   │   └── ...
│   └── index.js        # 入口文件
└── dist/
    └── index.js        # 打包输出
```

## 模块说明

### 1. utils/ - 工具函数

#### api.js
封装所有后端API调用：
- `EmailAPI` - 邮箱相关API
- `AIAPI` - AI智能体API
- `SignalingAPI` - WebRTC信令API

#### email.js
邮箱相关工具：
- `EMAIL_PROVIDERS` - 邮箱服务商配置
- `detectEmailProvider()` - 自动检测服务商
- `validateEmail()` - 验证邮箱格式
- `formatEmailDate()` - 格式化日期

#### webrtc.js
WebRTC工具：
- `createPeerConnection()` - 创建连接
- `createDataChannel()` - 创建数据通道
- `isWebRTCSupported()` - 检查支持

#### storage.js
存储封装：
- `getStorageItem()` - 获取存储
- `setStorageItem()` - 设置存储
- `HiveStorage` - 蜂巢邮箱存储
- `EmailStorage` - 邮箱配置存储

### 2. hooks/ - 自定义Hooks

#### useEmail.js
邮箱状态管理：
- `config` - 邮箱配置
- `emails` - 邮件列表
- `saveConfig()` - 保存配置
- `fetchEmails()` - 获取邮件
- `sendEmail()` - 发送邮件

#### useWebRTC.js
WebRTC状态管理：
- `ready` - 是否就绪
- `connectionStatus` - 连接状态
- `connect()` - 建立连接
- `sendMessage()` - 发送消息

### 3. components/ - React组件

#### EmailList.js
邮件列表组件：
- 展示邮件列表
- 支持选择和删除
- 格式化日期和摘要

#### ComposeModal.js
写邮件弹窗：
- 收件人/抄送/主题/正文输入
- 发送状态管理
- 表单验证

## 使用示例

### 使用Hook
```javascript
import { useEmail } from './hooks/useEmail';

function Mailbox() {
  const { emails, loading, fetchEmails, sendEmail } = useEmail();
  
  useEffect(() => {
    fetchEmails('inbox');
  }, []);
  
  return (
    <div>
      {loading ? '加载中...' : <EmailList emails={emails} />}
    </div>
  );
}
```

### 使用工具函数
```javascript
import { detectEmailProvider, validateEmail } from './utils/email';

const provider = detectEmailProvider('user@qq.com');
const isValid = validateEmail('user@example.com');
```

### 使用API
```javascript
import { EmailAPI } from './utils/api';

const result = await EmailAPI.sendEmail({
  to_addr: 'recipient@example.com',
  subject: 'Hello',
  body: 'World'
});
```

## 构建说明

### 开发模式
```bash
cd frontend
npm install
npm run dev
```

### 生产构建
```bash
npm run build
```

输出到 `dist/index.js`

## 迁移计划

### 阶段1: 创建模块（已完成）
- ✅ 创建目录结构
- ✅ 提取工具函数
- ✅ 创建自定义Hooks
- ✅ 创建组件

### 阶段2: 逐步迁移（进行中）
- 将现有代码迁移到新模块
- 保持向后兼容

### 阶段3: 完全模块化（未来）
- 使用Webpack/Vite构建
- 代码分割和懒加载
- Tree Shaking优化

## 优势

1. **代码复用** - 工具函数和Hooks可在多处使用
2. **易于测试** - 每个模块可独立测试
3. **维护简单** - 功能分离，修改不影响其他模块
4. **团队协作** - 不同开发者负责不同模块
5. **性能优化** - 支持懒加载和代码分割
