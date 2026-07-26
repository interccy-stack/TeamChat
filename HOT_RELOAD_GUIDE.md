# TeamChat 自动热更新指南 v5.2.1

## 🚀 快速开始

TeamChat v5.2.1 支持**自动热更新**，修改代码后无需重启 QwenPaw 即可生效！

## 📋 热更新方式

### 方式一：内置热重载（推荐）

插件已内置热重载功能，修改文件后自动生效。

**支持的文件类型**:
- ✅ Python 文件 (`.py`) - 后端代码
- ✅ JavaScript 文件 (`.js`) - 前端代码
- ✅ JSON 文件 (`.json`) - 配置文件
- ✅ CSS 文件 (`.css`) - 样式文件

**自动检测的文件**:
- `team_chat_main.py` - 主后端文件
- `ai_group_chat.py` - AI群聊引擎
- `plugin.json` / `manifest.json` - 配置文件
- `frontend/src/index.js` - 前端主文件
- `email_backend/*.py` - 邮箱后端

### 方式二：命令行脚本

使用提供的 `auto_update.sh` 脚本：

```bash
# 进入插件目录
cd ~/.qwenpaw/plugins/team_chat

# 启动热更新监视
./auto_update.sh start

# 查看状态
./auto_update.sh status

# 停止热更新
./auto_update.sh stop

# 重启热更新
./auto_update.sh restart

# 手动检查一次
./auto_update.sh once

# 创建备份
./auto_update.sh backup
```

### 方式三：配置文件控制

编辑 `hot_reload.json` 配置文件：

```json
{
  "enabled": true,           // 启用热重载
  "mode": "auto",          // 自动模式
  "check_interval": 1.0,   // 检查间隔（秒）
  "debounce_delay": 0.5,    // 防抖延迟（秒）
  "auto_reload": true,      // 自动重载
  "notify_frontend": true,  // 通知前端刷新
  "create_backup": true,    // 变更前创建备份
  "backup_count": 5         // 保留备份数量
}
```

## 🔧 工作原理

### 后端热重载

1. **文件监视**: 使用 `FileWatcher` 类监视文件变更
2. **哈希检测**: 计算文件 MD5 哈希，检测内容变化
3. **防抖处理**: 500ms 防抖，避免频繁触发
4. **通知机制**: 
   - 创建通知文件 `.hot_reload_trigger`
   - 可选：发送信号给进程
   - 可选：调用 QwenPaw API

### 前端热重载

1. **轮询检测**: 每 2 秒检查一次版本
2. **版本对比**: 对比本地存储的版本哈希
3. **自动刷新**: 检测到变更后自动刷新页面
4. **用户通知**: 显示更新提示通知

## 📊 热重载状态

### 查看状态

访问 API 查看热重载状态：

```bash
curl http://localhost:8088/api/plugins/team_chat/hot-reload-status
```

返回示例：

```json
{
  "enabled": true,
  "plugin_dir": "/home/user/.qwenpaw/plugins/team_chat",
  "watching": true
}
```

### 日志查看

```bash
# 查看热重载日志
tail -f ~/.qwenpaw/logs/team_chat_hot_reload.log

# 查看 QwenPaw 日志
qwenpaw logs
```

## 🎯 使用示例

### 示例 1: 修改后端代码

```bash
# 1. 编辑后端文件
vim ~/.qwenpaw/plugins/team_chat/team_chat_main.py

# 2. 保存文件（自动触发重载）
# 无需重启，修改立即生效

# 3. 查看日志确认
# [HotReload] [14:30:25] modified: team_chat_main.py
# [HotReload] 触发插件重载...
```

### 示例 2: 修改前端代码

```bash
# 1. 编辑前端文件
vim ~/.qwenpaw/plugins/team_chat/frontend/src/index.js

# 2. 保存文件

# 3. 前端自动检测并刷新
# 浏览器显示: "TeamChat 已更新到 v5.2.1，正在刷新..."
```

### 示例 3: 修改配置文件

```bash
# 1. 编辑配置
vim ~/.qwenpaw/plugins/team_chat/plugin.json

# 2. 保存文件

# 3. 配置自动重载
# 注意: 某些配置变更可能需要重启才能完全生效
```

## ⚙️ 高级配置

### 自定义监视路径

编辑 `hot_reload.json`:

```json
{
  "watch_paths": [
    "team_chat_main.py",
    "custom_module.py",
    "config.json"
  ],
  "exclude_patterns": [
    "__pycache__",
    "*.pyc",
    "*.log",
    "data/*"
  ]
}
```

### 禁用热重载

**临时禁用**:

```bash
./auto_update.sh stop
```

**永久禁用**:

编辑 `hot_reload.json`:

```json
{
  "enabled": false
}
```

**环境变量禁用**:

```bash
export TEAMCHAT_HOT_RELOAD=0
qwenpaw start
```

## 🐛 故障排除

### 问题 1: 热重载不生效

**检查步骤**:

1. 确认热重载已启用
   ```bash
   ./auto_update.sh status
   ```

2. 检查文件权限
   ```bash
   ls -la ~/.qwenpaw/plugins/team_chat/
   ```

3. 查看日志
   ```bash
   tail ~/.qwenpaw/logs/team_chat_hot_reload.log
   ```

### 问题 2: 频繁触发重载

**解决方案**:

1. 增加防抖延迟
   ```json
   {
     "debounce_delay": 2.0
   }
   ```

2. 增加检查间隔
   ```json
   {
     "check_interval": 3.0
   }
   ```

### 问题 3: 前端不自动刷新

**检查步骤**:

1. 确认浏览器支持 LocalStorage
2. 检查网络连接
3. 清除浏览器缓存
4. 手动刷新页面

### 问题 4: 修改后报错

**解决方案**:

1. 查看错误日志
2. 从备份恢复
   ```bash
   ./auto_update.sh restore
   ```

3. 重启 QwenPaw
   ```bash
   qwenpaw restart
   ```

## 📁 文件说明

| 文件 | 说明 |
|------|------|
| `hot_reload.py` | Python 热重载模块 |
| `hot_reload.json` | 热重载配置文件 |
| `auto_update.sh` | 命令行热更新脚本 |
| `frontend/hot-reload.js` | 前端热重载脚本 |
| `data/.hot_reload_trigger` | 触发文件（自动生成） |

## 🔒 安全注意事项

1. **生产环境**: 建议禁用热重载
   ```json
   { "enabled": false }
   ```

2. **备份**: 重要修改前创建备份
   ```bash
   ./auto_update.sh backup
   ```

3. **权限**: 确保文件权限正确
   ```bash
   chmod 644 *.py *.json
   chmod 755 auto_update.sh
   ```

## 📚 相关文档

- [CHANGELOG_v5.2.1.md](CHANGELOG_v5.2.1.md) - 更新日志
- [UPGRADE_OPTIMIZATION_PLAN.md](UPGRADE_OPTIMIZATION_PLAN.md) - 升级优化方案
- [README.md](README.md) - 主文档

## 💡 最佳实践

1. **开发时**: 启用热重载，快速迭代
2. **测试时**: 创建备份，方便回滚
3. **生产时**: 禁用热重载，确保稳定
4. **协作时**: 使用版本控制，避免冲突

## 🎉 总结

TeamChat v5.2.1 的自动热更新功能让开发更加高效：

- ✅ 修改代码后自动生效
- ✅ 无需手动重启服务
- ✅ 前端自动刷新
- ✅ 支持备份和恢复
- ✅ 可配置和可禁用

享受无缝的开发体验吧！

---

**文档版本**: v1.0
**更新时间**: 2026-07-26
**维护者**: CloudPaw-Master
