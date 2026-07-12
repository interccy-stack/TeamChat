console.log('[TeamChat Patch] v2 loaded');

// 覆盖软件控制函数
window.handleSoftwareControl = function(text) {
    var software = text.replace(/(打开|关闭|启动|退出)/g, '').trim();
    var isOpen = /打开|启动/.test(text);
    
    var map = {
        'word': 'Microsoft Word',
        'excel': 'Microsoft Excel',
        'chrome': 'Chrome浏览器',
        '浏览器': 'Chrome浏览器',
        '微信': '微信',
        '计算器': '计算器'
    };
    
    var name = map[software.toLowerCase()] || software;
    var action = isOpen ? '打开' : '关闭';
    
    window.addAIFenshenMessage('assistant', '💻 <b>软件控制 [PATCHED v2]</b><br><br><div style="background:#f5f5f5;padding:12px;border-radius:8px;"><div style="font-size:14px;color:#333;margin-bottom:8px;">' + action + ' ' + name + '</div><div style="font-size:12px;color:#666;">请自然语言指挥' + action + '该软件。<br><br>支持的软件：<br>• Microsoft Word<br>• Microsoft Excel<br>• Chrome浏览器<br>• 微信<br>• 计算器</div></div>');
};

// 覆盖电脑整理函数
window.handleSystemCleanup = function(text) {
    window.addAIFenshenMessage('assistant', '🧹 <b>电脑整理 [PATCHED v2]</b><br><br><div style="background:#f5f5f5;padding:12px;border-radius:8px;"><div style="font-size:14px;color:#333;margin-bottom:8px;">整理项目：</div><div style="font-size:12px;color:#666;">• 🗑️ 清理临时文件<br>• ♻️ 清空回收站<br>• 💾 释放内存<br><br>请自然语言指挥执行这些操作。</div></div>');
};

console.log('[TeamChat Patch] Functions patched');
