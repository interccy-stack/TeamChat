# AI PRO Token 生成器

浏览器扩展 AI PRO 的配套 Token 生成工具。

## 快速使用

### Windows - 双击运行
双击 `generate_token.bat`，Token 自动生成并复制到剪贴板。

### 命令行

```bash
# 自动模式（先尝试后端，失败则本地生成）
python generate_token.py

# 自动生成并复制到剪贴板
python generate_token.py --copy

# 强制从 TeamChat 后端获取
python generate_token.py --fetch

# 强制造本地 Token
python generate_token.py --local

# 启动 Token 服务（端口 8099）
python generate_token.py --serve
```

## 使用 Token

生成 Token 后：

1. 点击浏览器工具栏的 🤖 扩展图标
2. 在弹窗中粘贴 Token
3. 点击 **激活** 按钮
4. 配置后自动生效，无需刷新页面

## 原理

- 优先从 `localhost:8088` 的 TeamChat 后端获取真实 Token
- 后端不可用时，生成本地 UUID 加密 Token
- 支持 HTTP 服务模式，可作为微型 Token API