// 重置AI分身位置 - 在浏览器控制台执行
localStorage.removeItem('aiCopilotPos');
localStorage.removeItem('aiFenshenPos');
localStorage.removeItem('aiFenshenPanelState');
localStorage.removeItem('aiFenshenSize');
console.log('[AI分身] 位置缓存已清除，请刷新页面');

// 强制重新初始化AI分身
var existingBtn = document.querySelector('.ai-copilot-btn');
if (existingBtn) {
    existingBtn.remove();
    console.log('[AI分身] 旧按钮已移除');
}

// 重新加载页面以重新初始化
location.reload();
