# TeamChat v5.1.3 稳定版本备份

## 版本信息
- **版本**: v5.1.3
- **备份日期**: 2026-07-25
- **状态**: ✅ 稳定运行

## 修复内容

### v5.1.3 修复（当前版本）
1. **修复 AI群聊引擎初始化问题**
   - 添加 `ai_group_chat` 模块预加载，确保 QwenPaw 隔离环境下可解析
   - `_get_ai_engine()` 增加 `sys.path` 保障和错误缓存机制
   - 路由错误信息包含具体异常原因，便于排查

2. **新增外部链接**
   - AI群聊界面顶部增加 "Agent协作网络" 链接
   - 链接地址: https://nightly.paw.msgbyte.com/invite/rj9iBh5Y
   - 样式: 紫色渐变按钮，带悬停放大效果

### v5.1.2 功能（前一版本）
1. AI群聊改为内部子页面
2. 支持5个智能体群聊和@提及
3. 新手引导系统
4. 串串频道 v2.0
5. 轻音乐增强
6. 其他功能优化

## 备份文件清单

| 文件 | 备份路径 | 说明 |
|------|---------|------|
| team_chat_main.py | team_chat_main.py.bak.v5.1.3 | 后端主文件 |
| ai_group_chat.py | ai_group_chat.py.bak.v5.1.3 | AI群聊引擎 |
| ai_chat_module.js | ai_chat_module.js.bak.v5.1.3 | AI群聊前端模块 |

## 当前文件状态

### 修改的文件
- `team_chat_main.py` - 引擎初始化修复
- `ai_chat_module.js` - 错误提示优化
- `plugin.json` - 版本号更新
- `index.js` - 版本注释更新

### 关键修改点

#### 1. 模块预加载 (team_chat_main.py:55-65)
```python
# 提前导入 ai_group_chat 模块，确保模块在 sys.path 中可解析
try:
    if str(plugin_dir) not in sys.path:
        sys.path.insert(0, str(plugin_dir))
    import ai_group_chat
    AI_GROUP_AVAILABLE = True
    logger.info("[AIChat] 模块加载成功")
except Exception as e:
    logger.warning(f"[AIChat] 模块预加载失败，将在请求时重试: {e}")
```

#### 2. 引擎延迟初始化加固 (_get_ai_engine:3000-3028)
```python
def _get_ai_engine():
    # 确保 plugin_dir 在 sys.path 中（QwenPaw 隔离环境可能已移除）
    _saved_path = list(sys.path)
    try:
        plugin_dir_str = str(plugin_dir)
        if plugin_dir_str not in sys.path:
            sys.path.insert(0, plugin_dir_str)
        from ai_group_chat import AIGroupChatEngine
        _ai_engine_instance = AIGroupChatEngine(plugin_dir / "data")
        logger.info("[AIChat] 引擎延迟初始化成功")
        return _ai_engine_instance
    except Exception as e:
        _ai_engine_error = str(e)
        logger.error(f"[AIChat] 获取引擎失败: {e}")
        import traceback
        logger.error(traceback.format_exc())
        return None
    finally:
        sys.path = _saved_path
```

#### 3. 前端错误提示优化 (ai_chat_module.js:85-95)
```javascript
}).then(function(data) {
    if (data.success) {
        loadMessages();
        setTimeout(loadMessages, 2000);
        setTimeout(loadMessages, 5000);
    } else {
        message.error(data.error ? '发送失败: ' + data.error : '发送失败');
    }
    setLoading(false);
});
```

## 回滚说明

如需回滚到 v5.1.2:
```bash
copy team_chat_main.py.bak.v5.1.2 team_chat_main.py
copy ai_group_chat.py.bak.v5.1.2 ai_group_chat.py
# 恢复 plugin.json 和 index.js 中的版本号
```

## 测试验证

- ✅ AI群聊引擎初始化成功
- ✅ 5个智能体常驻显示
- ✅ @提及功能正常工作
- ✅ 消息发送和接收正常
- ✅ 智能体自动回复正常

---
备份创建者: CloudPaw-Master
备份时间: 2026-07-25