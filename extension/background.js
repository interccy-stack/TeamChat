// Background script for TeamChat AI Extension
// Handles API requests to avoid CORS issues

// 安装/启动时预热Token（提前存到storage，让content script更快）
function warmupToken() {
    chrome.storage.sync.get(['teamchat_token'], function(result) {
        if (!result.teamchat_token) {
            fetch('http://localhost:8088/api/plugins/team_chat/bookmarklet/token', {
                method: 'POST',
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify({user_id: 'extension_user'})
            })
            .then(function(r) { return r.json(); })
            .then(function(data) {
                var token = data.token || data.data || data.access_token || '';
                if (token) chrome.storage.sync.set({teamchat_token: token});
            })
            .catch(function() {});
        }
    });
}

chrome.runtime.onInstalled.addListener(warmupToken);
chrome.runtime.onStartup.addListener(warmupToken);

// 消息处理
chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
    if (request.action === 'chat') {
        fetch('http://localhost:8088/api/plugins/team_chat/bookmarklet-chat', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': 'Bearer ' + request.token
            },
            body: JSON.stringify({
                message: request.message,
                agent_id: request.agent_id || 'default',
                session_id: request.session_id || 'extension_default'
            })
        })
        .then(function(r) { return r.json(); })
        .then(function(data) {
            sendResponse({success: true, data: data});
        })
        .catch(function(err) {
            sendResponse({success: false, error: err.message});
        });
        return true;
    }
    if (request.action === 'get_agents') {
        fetch('http://localhost:8088/api/agents')
        .then(function(r) { 
            if (!r.ok) throw new Error('HTTP ' + r.status);
            return r.json(); 
        })
        .then(function(data) {
            var agents = data.agents || data || [];
            console.log('[Background] Agents fetched:', agents.length);
            sendResponse({success: true, agents: agents});
        })
        .catch(function(err) {
            console.log('[Background] Fetch agents failed:', err.message);
            sendResponse({success: false, error: err.message, agents: []});
        });
        return true;
    }
    if (request.action === 'capture_screenshot') {
        chrome.tabs.captureVisibleTab(null, {format: 'png'}, function(dataUrl) {
            if (chrome.runtime.lastError) {
                sendResponse({success: false, error: chrome.runtime.lastError.message});
            } else {
                sendResponse({success: true, dataUrl: dataUrl});
            }
        });
        return true;
    }
});
