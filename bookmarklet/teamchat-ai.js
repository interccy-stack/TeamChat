// TeamChat AI 书签工具 v5.2.0
// 用法：javascript:(function(){var s=document.createElement('script');s.src='http://localhost:8088/static/teamchat-ai.js';document.head.appendChild(s);})();

(function() {
    'use strict';
    
    // 防止重复加载
    if (window.TeamChatAI) {
        window.TeamChatAI.toggle();
        return;
    }
    
    // 配置
    // 自动检测 QwenPaw 服务地址（优先用当前页面 origin，否则回退到 localStorage 或默认值）
    var BASE_URL = (function() {
        try { return localStorage.getItem('teamchat_server_url'); } catch(e) {}
        return window.location.origin || 'http://127.0.0.1:56411';
    })();
    var CONFIG = {
        API_BASE: BASE_URL,
        WS_URL: BASE_URL.replace('http', 'ws') + '/ws',
        TOKEN: null
    };
    
    // 从URL获取token
    function getTokenFromURL() {
        var script = document.currentScript;
        if (script && script.src) {
            var url = new URL(script.src);
            return url.searchParams.get('token');
        }
        return null;
    }
    
    // 从localStorage获取token
    function getStoredToken() {
        return localStorage.getItem('teamchat_token');
    }
    
    // 保存token
    function saveToken(token) {
        localStorage.setItem('teamchat_token', token);
        CONFIG.TOKEN = token;
    }
    
    // 初始化token
    CONFIG.TOKEN = getTokenFromURL() || getStoredToken();
    
    // ==================== UI组件 ====================
    
    // 创建浮动按钮
    function createFloatButton() {
        var btn = document.createElement('div');
        btn.id = 'tc-ai-float-btn';
        btn.innerHTML = '🤖';
        btn.style.cssText = `
            position: fixed !important;
            right: 20px !important;
            top: 20px !important;
            width: 50px !important;
            height: 50px !important;
            border-radius: 50% !important;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%) !important;
            border: 2px solid rgba(255,255,255,0.8) !important;
            box-shadow: 0 4px 12px rgba(0,0,0,0.3) !important;
            color: white !important;
            font-size: 24px !important;
            display: flex !important;
            align-items: center !important;
            justify-content: center !important;
            cursor: pointer !important;
            z-index: 99999 !important;
            transition: transform 0.2s, box-shadow 0.2s !important;
        `;
        
        btn.addEventListener('click', togglePanel);
        btn.addEventListener('mouseenter', function() {
            btn.style.transform = 'scale(1.1)';
            btn.style.boxShadow = '0 6px 16px rgba(0,0,0,0.4)';
        });
        btn.addEventListener('mouseleave', function() {
            btn.style.transform = 'scale(1)';
            btn.style.boxShadow = '0 4px 12px rgba(0,0,0,0.3)';
        });
        
        return btn;
    }
    
    // 创建面板
    function createPanel() {
        var panel = document.createElement('div');
        panel.id = 'tc-ai-panel';
        panel.style.cssText = `
            position: fixed !important;
            right: 20px !important;
            top: 80px !important;
            width: 350px !important;
            height: 500px !important;
            background: white !important;
            border-radius: 12px !important;
            box-shadow: 0 8px 32px rgba(0,0,0,0.3) !important;
            z-index: 99998 !important;
            display: none !important;
            flex-direction: column !important;
            overflow: hidden !important;
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif !important;
        `;
        
        // 头部
        var header = document.createElement('div');
        header.style.cssText = `
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%) !important;
            color: white !important;
            padding: 12px 16px !important;
            display: flex !important;
            align-items: center !important;
            justify-content: space-between !important;
        `;
        header.innerHTML = `
            <div style="display:flex;align-items:center;gap:8px;">
                <span style="font-size:20px;">🤖</span>
                <span style="font-weight:bold;">AI分身</span>
            </div>
            <button id="tc-ai-close" style="background:none;border:none;color:white;cursor:pointer;font-size:18px;">✕</button>
        `;
        
        // 聊天区域
        var chatArea = document.createElement('div');
        chatArea.id = 'tc-ai-chat';
        chatArea.style.cssText = `
            flex: 1 !important;
            overflow-y: auto !important;
            padding: 16px !important;
            background: #f5f5f5 !important;
        `;
        
        // 输入区域
        var inputArea = document.createElement('div');
        inputArea.style.cssText = `
            padding: 12px !important;
            border-top: 1px solid #e0e0e0 !important;
            background: white !important;
            display: flex !important;
            gap: 8px !important;
        `;
        inputArea.innerHTML = `
            <input type="text" id="tc-ai-input" placeholder="输入消息..." style="flex:1;padding:8px 12px;border:1px solid #ddd;border-radius:20px;outline:none;">
            <button id="tc-ai-send" style="padding:8px 16px;background:#667eea;color:white;border:none;border-radius:20px;cursor:pointer;">发送</button>
        `;
        
        panel.appendChild(header);
        panel.appendChild(chatArea);
        panel.appendChild(inputArea);
        
        // 事件绑定
        header.querySelector('#tc-ai-close').addEventListener('click', togglePanel);
        inputArea.querySelector('#tc-ai-send').addEventListener('click', sendMessage);
        inputArea.querySelector('#tc-ai-input').addEventListener('keypress', function(e) {
            if (e.key === 'Enter') sendMessage();
        });
        
        return panel;
    }
    
    // ==================== 功能函数 ====================
    
    // 切换面板显示
    function togglePanel() {
        var panel = document.getElementById('tc-ai-panel');
        if (panel) {
            panel.style.display = panel.style.display === 'none' ? 'flex' : 'none';
            if (panel.style.display === 'flex' && !CONFIG.TOKEN) {
                showLoginPrompt();
            }
        }
    }
    
    // 显示登录提示
    function showLoginPrompt() {
        var chatArea = document.getElementById('tc-ai-chat');
        if (chatArea) {
            chatArea.innerHTML = `
                <div style="text-align:center;padding:40px;color:#666;">
                    <div style="font-size:48px;margin-bottom:16px;">🔑</div>
                    <div style="margin-bottom:16px;">请先登录</div>
                    <input type="text" id="tc-login-token" placeholder="输入访问Token" style="width:100%;padding:8px;margin-bottom:8px;border:1px solid #ddd;border-radius:4px;">
                    <button onclick="window.TeamChatAI.login()" style="padding:8px 16px;background:#667eea;color:white;border:none;border-radius:4px;cursor:pointer;">登录</button>
                </div>
            `;
        }
    }
    
    // 登录
    function login() {
        var input = document.getElementById('tc-login-token');
        var token = input ? input.value.trim() : '';
        if (!token) {
            alert('请输入Token');
            return;
        }
        
        saveToken(token);
        addMessage('system', '登录成功！');
        
        // 连接WebSocket
        connectWebSocket();
    }
    
    // 添加消息到聊天区
    function addMessage(role, content) {
        var chatArea = document.getElementById('tc-ai-chat');
        if (!chatArea) return;
        
        var msgDiv = document.createElement('div');
        msgDiv.style.cssText = `
            margin-bottom: 12px;
            display: flex;
            ${role === 'user' ? 'justify-content: flex-end;' : 'justify-content: flex-start;'}
        `;
        
        var bubble = document.createElement('div');
        bubble.style.cssText = `
            max-width: 80%;
            padding: 10px 14px;
            border-radius: 16px;
            font-size: 14px;
            line-height: 1.4;
            ${role === 'user' 
                ? 'background: #667eea; color: white; border-bottom-right-radius: 4px;' 
                : role === 'system'
                    ? 'background: #e8e8e8; color: #666; text-align: center;'
                    : 'background: white; color: #333; border-bottom-left-radius: 4px; box-shadow: 0 1px 2px rgba(0,0,0,0.1);'
            }
        `;
        bubble.textContent = content;
        
        msgDiv.appendChild(bubble);
        chatArea.appendChild(msgDiv);
        chatArea.scrollTop = chatArea.scrollHeight;
    }
    
    // 发送消息
    function sendMessage() {
        var input = document.getElementById('tc-ai-input');
        if (!input) return;
        
        var content = input.value.trim();
        if (!content) return;
        
        if (!CONFIG.TOKEN) {
            showLoginPrompt();
            return;
        }
        
        addMessage('user', content);
        input.value = '';
        
        // 发送到后端（使用bookmarklet-chat API）
        fetch(CONFIG.API_BASE + '/api/plugins/team_chat/bookmarklet-chat', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': 'Bearer ' + CONFIG.TOKEN
            },
            body: JSON.stringify({
                message: content,
                agent_id: 'default',
                session_id: 'bookmarklet_' + CONFIG.TOKEN
            })
        })
        .then(function(r) { return r.json(); })
        .then(function(data) {
            if (data.reply) {
                addMessage('assistant', data.reply);
            } else if (data.error) {
                addMessage('system', '错误: ' + data.error);
            } else {
                addMessage('system', 'AI暂时无法回复');
            }
        })
        .catch(function(e) {
            addMessage('system', '发送失败: ' + e.message);
        });
    }
    
    // WebSocket连接（可选，用于实时消息）
    function connectWebSocket() {
        if (!CONFIG.TOKEN) return;
        
        try {
            var ws = new WebSocket(CONFIG.WS_URL + '?token=' + CONFIG.TOKEN);
            
            ws.onopen = function() {
                console.log('WebSocket已连接');
            };
            
            ws.onmessage = function(e) {
                var data = JSON.parse(e.data);
                if (data.message) {
                    addMessage('assistant', data.message);
                }
            };
            
            ws.onerror = function(e) {
                console.error('WebSocket错误:', e);
            };
            
            window.tcAIWebSocket = ws;
        } catch(e) {
            console.error('WebSocket连接失败:', e);
        }
    }
    
    // ==================== 初始化 ====================
    
    function init() {
        // 创建UI
        var floatBtn = createFloatButton();
        var panel = createPanel();
        
        document.body.appendChild(floatBtn);
        document.body.appendChild(panel);
        
        // 添加欢迎消息
        if (CONFIG.TOKEN) {
            addMessage('system', 'AI分身已就绪，输入消息开始对话');
            connectWebSocket();
        } else {
            showLoginPrompt();
        }
        
        console.log('TeamChat AI 书签工具已加载');
    }
    
    // 等待页面加载完成
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
    
    // 暴露全局API
    window.TeamChatAI = {
        toggle: togglePanel,
        login: login,
        send: sendMessage,
        config: CONFIG
    };
    
})();
