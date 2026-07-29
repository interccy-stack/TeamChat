/**
 * TeamChat AI群聊文件上传补丁
 * 动态注入文件上传功能到 AI群聊页面
 * @version 5.3.0
 */

(function() {
    'use strict';
    
    console.log('[FileUploadPatch] 文件上传补丁已加载');
    
    // 等待页面加载完成
    function waitForPage() {
        if (document.getElementById('ai-chat-input')) {
            initFileUpload();
        } else {
            setTimeout(waitForPage, 500);
        }
    }
    
    // 初始化文件上传功能
    function initFileUpload() {
        console.log('[FileUploadPatch] 初始化文件上传...');
        
        var inputArea = document.querySelector('#ai-chat-input');
        if (!inputArea) {
            console.log('[FileUploadPatch] 未找到输入框，稍后重试...');
            setTimeout(initFileUpload, 1000);
            return;
        }
        
        // 找到输入区域的父容器
        var inputContainer = inputArea.closest('div[style*="border-top"]') || 
                             inputArea.parentElement?.parentElement;
        if (!inputContainer) {
            console.log('[FileUploadPatch] 未找到输入容器');
            return;
        }
        
        // 检查是否已注入
        if (document.getElementById('ai-file-upload-btn')) {
            console.log('[FileUploadPatch] 文件上传已存在');
            return;
        }
        
        // 创建文件上传按钮
        var uploadBtn = document.createElement('button');
        uploadBtn.id = 'ai-file-upload-btn';
        uploadBtn.innerHTML = '📎';
        uploadBtn.title = '上传文件';
        uploadBtn.style.cssText = `
            width: 36px;
            height: 36px;
            border: 1px solid #d9d9d9;
            border-radius: 8px;
            background: #fff;
            cursor: pointer;
            font-size: 18px;
            display: flex;
            align-items: center;
            justify-content: center;
            transition: all 0.2s;
            margin-right: 8px;
        ';
        
        // 悬停效果
        uploadBtn.onmouseenter = function() {
            this.style.background = '#f0f0f0';
            this.style.borderColor = '#1890ff';
        };
        uploadBtn.onmouseleave = function() {
            this.style.background = '#fff';
            this.style.borderColor = '#d9d9d9';
        };
        
        // 点击打开文件选择
        uploadBtn.onclick = function() {
            fileInput.click();
        };
        
        // 创建隐藏的文件输入
        var fileInput = document.createElement('input');
        fileInput.type = 'file';
        fileInput.id = 'ai-file-input';
        fileInput.style.display = 'none';
        fileInput.accept = '.txt,.md,.json,.py,.js,.html,.css,.java,.cpp,.c,.go,.rs,.php,.rb,.swift,.kt,.scala,.r,.sql,.yaml,.yml,.xml,.csv,.log,.pdf,.png,.jpg,.jpeg,.gif,.bmp,.webp,.svg';
        
        // 文件选择处理
        fileInput.onchange = function(e) {
            var file = e.target.files[0];
            if (!file) return;
            
            console.log('[FileUploadPatch] 选择文件:', file.name, file.size);
            uploadFile(file);
            
            // 清空选择，允许重复选择同一文件
            fileInput.value = '';
        };
        
        // 插入按钮到输入区域
        var flexContainer = inputArea.parentElement;
        if (flexContainer) {
            flexContainer.insertBefore(uploadBtn, inputArea);
            flexContainer.appendChild(fileInput);
            console.log('[FileUploadPatch] 文件上传按钮已注入');
        }
    }
    
    // 上传文件
    function uploadFile(file) {
        var roomId = 'OFFICIAL_ROOM';
        var userId = window.aiChatUserId || 'user_' + Math.random().toString(36).substr(2, 8);
        var nickname = window.aiChatNickname || '访客' + Math.floor(Math.random() * 1000);
        
        // 显示上传中提示
        showUploadStatus('正在上传: ' + file.name + '...');
        
        // 构建表单数据
        var formData = new FormData();
        formData.append('file', file);
        formData.append('room_id', roomId);
        formData.append('user_id', userId);
        formData.append('nickname', nickname);
        
        // 获取 API 地址
        var apiUrl = getApiUrl('/plugins/team_chat/ai-chat/files/upload');
        
        // 发送上传请求
        fetch(apiUrl, {
            method: 'POST',
            body: formData
        })
        .then(function(response) {
            return response.json();
        })
        .then(function(data) {
            if (data.success) {
                console.log('[FileUploadPatch] 上传成功:', data);
                showUploadStatus('✅ 上传成功: ' + file.name, 3000);
                
                // 触发消息刷新
                setTimeout(function() {
                    if (window.loadAIMessages) {
                        window.loadAIMessages();
                    }
                }, 500);
            } else {
                console.error('[FileUploadPatch] 上传失败:', data.error);
                showUploadStatus('❌ 上传失败: ' + (data.error || '未知错误'), 5000);
            }
        })
        .catch(function(error) {
            console.error('[FileUploadPatch] 上传错误:', error);
            showUploadStatus('❌ 上传错误: ' + error.message, 5000);
        });
    }
    
    // 显示上传状态
    function showUploadStatus(message, duration) {
        // 移除旧的状态提示
        var oldStatus = document.getElementById('ai-upload-status');
        if (oldStatus) {
            oldStatus.remove();
        }
        
        // 创建新的状态提示
        var status = document.createElement('div');
        status.id = 'ai-upload-status';
        status.textContent = message;
        status.style.cssText = `
            position: fixed;
            bottom: 80px;
            left: 50%;
            transform: translateX(-50%);
            background: rgba(0, 0, 0, 0.8);
            color: #fff;
            padding: 10px 20px;
            border-radius: 20px;
            font-size: 14px;
            z-index: 10000;
            white-space: nowrap;
        `;
        
        document.body.appendChild(status);
        
        // 自动消失
        if (duration) {
            setTimeout(function() {
                status.remove();
            }, duration);
        }
    }
    
    // 获取 API URL
    function getApiUrl(path) {
        if (window.QwenPaw && window.QwenPaw.host && window.QwenPaw.host.getApiUrl) {
            return window.QwenPaw.host.getApiUrl(path);
        }
        // 兜底方案
        return '/api' + path;
    }
    
    // 暴露全局方法供调试
    window.AIChatFileUpload = {
        init: initFileUpload,
        upload: uploadFile,
        version: '5.3.0'
    };
    
    // 启动
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', waitForPage);
    } else {
        waitForPage();
    }
    
    // 监听页面变化（处理 React 重新渲染）
    var observer = new MutationObserver(function(mutations) {
        var uploadBtn = document.getElementById('ai-file-upload-btn');
        var inputArea = document.getElementById('ai-chat-input');
        if (inputArea && !uploadBtn) {
            console.log('[FileUploadPatch] 检测到页面变化，重新注入...');
            initFileUpload();
        }
    });
    
    observer.observe(document.body, {
        childList: true,
        subtree: true
    });
    
})();
