# AI调用失败修复说明

## 问题描述
AI副驾功能调用时出现错误：`Unexpected end of JSON input`

## 根本原因
`/api/console/chat` API在某些情况下可能返回非JSON格式的响应（如空响应、HTML错误页面或纯文本），直接使用 `r.json()` 解析会导致错误。

## 修复方案

### 修改前
```javascript
fetch("/api/console/chat", {...})
  .then(function(r) { return r.json(); })  // 直接解析JSON，可能失败
  .then(function(data) {
    // 处理数据
  })
  .catch(function(err) {
    setAiResult("AI调用失败: " + err.message);
  });
```

### 修改后
```javascript
fetch("/api/console/chat", {...})
  .then(function(r) { 
    if (!r.ok) {
      throw new Error("HTTP " + r.status + ": " + r.statusText);
    }
    return r.text();  // 先获取文本
  })
  .then(function(text) {
    // 尝试解析JSON，如果失败则返回原始文本
    var data;
    try {
      data = JSON.parse(text);
    } catch (e) {
      data = { response: text };  // 非JSON时使用原始文本
    }
    // 处理数据
    if (data && data.response) {
      setAiResult(data.response);
    } else if (data && data.message) {
      setAiResult(data.message);
    } else if (typeof data === "string") {
      setAiResult(data);
    } else {
      setAiResult("AI处理完成，但未返回有效内容");
    }
  })
  .catch(function(err) {
    setAiLoading(false);
    setAiResult("AI调用失败: " + err.message);
  });
```

## 修复内容

1. **HTTP状态检查**：先检查响应状态码，非200时抛出错误
2. **文本优先**：使用 `r.text()` 获取原始响应文本
3. **容错解析**：用 `try-catch` 包裹 `JSON.parse`，失败时使用原始文本
4. **多格式支持**：支持JSON对象、字符串、message字段等多种返回格式

## 验证

```bash
# 语法检查
node --check index.js
# 结果: 无错误
```

## 文件位置

- 修改文件：`C:\Users\lenovo\.copaw\plugins\TeamChat\frontend\dist\index.js`
- 函数位置：第3280行 `callAICopilot`

## 后续建议

1. 检查 `/api/console/chat` API是否正常响应
2. 确认智能体 `default` 是否可用
3. 查看服务器日志确认API返回内容
