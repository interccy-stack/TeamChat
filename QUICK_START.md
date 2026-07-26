# TeamChat v5.2.1 快速开始

## 🎯 自动热更新 - 3秒上手

### 启动热更新

```bash
cd ~/.qwenpaw/plugins/team_chat
./start-hot-reload.sh
```

### 修改代码

```bash
# 编辑任意文件
vim team_chat_main.py
# 或
vim frontend/src/index.js
```

### 自动生效

✅ **保存文件后立即生效，无需重启！**

---

## 📋 常用命令

| 命令 | 说明 |
|------|------|
| `./auto_update.sh start` | 启动热更新 |
| `./auto_update.sh stop` | 停止热更新 |
| `./auto_update.sh status` | 查看状态 |
| `./auto_update.sh restart` | 重启热更新 |
| `./auto_update.sh backup` | 创建备份 |

---

## 🔧 配置文件

编辑 `hot_reload.json`:

```json
{
  "enabled": true,      // 启用热重载
  "check_interval": 1,  // 检查间隔(秒)
  "auto_reload": true    // 自动重载
}
```

---

## 📁 文件说明

```
team_chat/
├── auto_update.sh          # 热更新脚本 ⭐
├── start-hot-reload.sh     # 快速启动 ⭐
├── hot_reload.json         # 配置文件
├── hot_reload.py           # Python模块
├── HOT_RELOAD_GUIDE.md     # 详细文档
├── frontend/
│   └── hot-reload.js       # 前端支持
└── ...
```

---

## 💡 提示

- ✅ 修改 `.py` 文件 → 后端自动重载
- ✅ 修改 `.js` 文件 → 前端自动刷新
- ✅ 修改 `.json` 文件 → 配置自动更新
- ✅ 自动创建备份 → 安全有保障

---

**版本**: v5.2.1 | **状态**: ✅ 热更新已就绪
