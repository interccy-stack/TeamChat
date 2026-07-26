/**
 * TeamChat 前端热重载支持 v5.2.1
 * 自动检测后端变更并刷新页面
 */

(function() {
    'use strict';
    
    const CONFIG = {
        CHECK_INTERVAL: 2000,        // 检查间隔（毫秒）
        API_ENDPOINT: '/api/plugins/team_chat/hot-reload-status',
        VERSION_ENDPOINT: '/api/plugins/team_chat/version',
        RETRY_DELAY: 5000,           // 重试延迟
        MAX_RETRIES: 3               // 最大重试次数
    };
    
    let lastVersion = null;
    let lastHash = localStorage.getItem('teamchat_hot_reload_hash') || '';
    let checkTimer = null;
    let retryCount = 0;
    let isChecking = false;
    
    // 日志函数
    function log(message, type = 'info') {
        const prefix = '[TeamChat HotReload]';
        const timestamp = new Date().toLocaleTimeString();
        const fullMessage = `${prefix} [${timestamp}] ${message}`;
        
        switch(type) {
            case 'success':
                console.log('%c' + fullMessage, 'color: #52c41a');
                break;
            case 'warning':
                console.warn(fullMessage);
                break;
            case 'error':
                console.error(fullMessage);
                break;
            default:
                console.log(fullMessage);
        }
    }
    
    // 显示通知
    function showNotification(message, type = 'info') {
        // 创建通知元素
        const notification = document.createElement('div');
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            padding: 12px 20px;
            border-radius: 8px;
            font-size: 14px;
            font-family: system-ui, sans-serif;
            z-index: 9999;
            transition: all 0.3s ease;
            box-shadow: 0 4px 12px rgba(0,0,0,0.15);
            max-width: 300px;
            word-wrap: break-word;
        `;
        
        // 根据类型设置颜色
        switch(type) {
            case 'success':
                notification.style.background = '#f6ffed';
                notification.style.border = '1px solid #b7eb8f';
                notification.style.color = '#389e0d';
                break;
            case 'warning':
                notification.style.background = '#fffbe6';
                notification.style.border = '1px solid #ffe58f';
                notification.style.color = '#d46b08';
                break;
            case 'error':
                notification.style.background = '#fff2f0';
                notification.style.border = '1px solid #ffccc7';
                notification.style.color = '#cf1322';
                break;
            default:
                notification.style.background = '#e6f7ff';
                notification.style.border = '1px solid #91d5ff';
                notification.style.color = '#096dd9';
        }
        
        notification.textContent = message;
        document.body.appendChild(notification);
        
        // 3秒后自动消失
        setTimeout(() => {
            notification.style.opacity = '0';
            notification.style.transform = 'translateX(100%)';
            setTimeout(() => {
                if (notification.parentNode) {
                    notification.parentNode.removeChild(notification);
                }
            }, 300);
        }, 3000);
    }
    
    // 获取版本信息
    async function fetchVersion() {
        try {
            const response = await fetch(CONFIG.VERSION_ENDPOINT);
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}`);
            }
            return await response.json();
        } catch (error) {
            throw error;
        }
    }
    
    // 检查更新
    async function checkUpdate() {
        if (isChecking) return;
        isChecking = true;
        
        try {
            const data = await fetchVersion();
            const currentVersion = data.version || 'unknown';
            const currentHash = data.hash || currentVersion;
            
            // 首次运行，记录版本
            if (!lastVersion) {
                lastVersion = currentVersion;
                lastHash = currentHash;
                localStorage.setItem('teamchat_hot_reload_hash', lastHash);
                localStorage.setItem('teamchat_hot_reload_version', lastVersion);
                log(`初始化完成，当前版本: ${currentVersion}`);
                return;
            }
            
            // 检查是否有更新
            if (lastHash && lastHash !== currentHash) {
                log(`检测到新版本: ${currentVersion} (原版本: ${lastVersion})`, 'success');
                showNotification(`TeamChat 已更新到 v${currentVersion}，正在刷新...`, 'success');
                
                // 更新存储的版本
                lastVersion = currentVersion;
                lastHash = currentHash;
                localStorage.setItem('teamchat_hot_reload_hash', lastHash);
                localStorage.setItem('teamchat_hot_reload_version', lastVersion);
                
                // 延迟刷新，让用户看到通知
                setTimeout(() => {
                    window.location.reload();
                }, 1500);
                
                return;
            }
            
            // 重置重试计数
            retryCount = 0;
            
        } catch (error) {
            retryCount++;
            if (retryCount >= CONFIG.MAX_RETRIES) {
                log(`检查更新失败 (${retryCount}/${CONFIG.MAX_RETRIES}): ${error.message}`, 'error');
                // 停止检查，避免无限错误
                stopChecking();
                showNotification('热更新检查失败，请手动刷新页面', 'error');
            }
        } finally {
            isChecking = false;
        }
    }
    
    // 启动检查
    function startChecking() {
        if (checkTimer) return;
        
        log('热重载监视已启动');
        showNotification('TeamChat 热重载已启用', 'info');
        
        // 立即检查一次
        checkUpdate();
        
        // 定时检查
        checkTimer = setInterval(checkUpdate, CONFIG.CHECK_INTERVAL);
    }
    
    // 停止检查
    function stopChecking() {
        if (checkTimer) {
            clearInterval(checkTimer);
            checkTimer = null;
            log('热重载监视已停止');
        }
    }
    
    // 手动触发刷新
    function forceReload() {
        log('手动触发页面刷新');
        window.location.reload();
    }
    
    // 暴露全局 API
    window.TeamChatHotReload = {
        start: startChecking,
        stop: stopChecking,
        check: checkUpdate,
        reload: forceReload,
        getStatus: () => ({
            enabled: !!checkTimer,
            lastVersion,
            lastHash,
            retryCount
        })
    };
    
    // 页面加载完成后启动
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', startChecking);
    } else {
        startChecking();
    }
    
    // 监听键盘快捷键
    document.addEventListener('keydown', (e) => {
        // Ctrl+Shift+R 强制刷新
        if (e.ctrlKey && e.shiftKey && e.key === 'R') {
            e.preventDefault();
            forceReload();
        }
    });
    
})();
