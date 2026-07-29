/**
 * AI分身修复脚本
 * 用于修复AI分身按钮不显示的问题
 */

// 清除可能错误的状态
localStorage.removeItem('aiFenshenGlobalEnabled');

// 重新设置为启用
localStorage.setItem('aiFenshenGlobalEnabled', 'true');

// 清除按钮位置缓存（可能导致按钮显示在屏幕外）
localStorage.removeItem('aiCopilotPos');

console.log('[AI分身修复] 已重置AI分身状态');
console.log('[AI分身修复] 请刷新页面查看效果');

// 立即尝试显示按钮
(function() {
    var btn = document.querySelector('.ai-copilot-btn');
    if (btn) {
        btn.classList.remove('ai-copilot-btn-hidden');
        btn.style.display = 'flex';
        console.log('[AI分身修复] 按钮已显示');
    } else {
        console.log('[AI分身修复] 按钮不存在，将在2秒后自动创建');
    }
})();
