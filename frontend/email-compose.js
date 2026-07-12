/**
 * 写邮件弹窗组件
 */

(function() {
    'use strict';

    const API_BASE = 'http://127.0.0.1:18888/api/v1/email';

    // 创建写邮件弹窗
    function createComposeModal() {
        const modal = document.createElement('div');
        modal.id = 'email-compose-modal';
        modal.style.cssText = `
            display: none;
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0,0,0,0.5);
            z-index: 1000;
            align-items: center;
            justify-content: center;
        `;

        modal.innerHTML = `
            <div style="background: white; padding: 30px; border-radius: 12px; max-width: 800px; width: 90%; max-height: 90vh; overflow-y: auto; box-shadow: 0 10px 40px rgba(0,0,0,0.2);">
                <h2 style="margin: 0 0 20px 0; color: #667eea; font-size: 24px;">✍️ 写邮件</h2>
                <form id="email-compose-form">
                    <div style="margin-bottom: 15px;">
                        <label style="display: block; margin-bottom: 5px; color: #666; font-size: 13px; font-weight: 500;">收件人</label>
                        <input type="email" id="compose-to" required style="width: 100%; padding: 10px; border: 1px solid #ddd; border-radius: 6px; font-size: 14px;" placeholder="example@example.com">
                    </div>
                    <div style="margin-bottom: 15px;">
                        <label style="display: block; margin-bottom: 5px; color: #666; font-size: 13px; font-weight: 500;">抄送 (可选)</label>
                        <input type="email" id="compose-cc" style="width: 100%; padding: 10px; border: 1px solid #ddd; border-radius: 6px; font-size: 14px;" placeholder="cc@example.com">
                    </div>
                    <div style="margin-bottom: 15px;">
                        <label style="display: block; margin-bottom: 5px; color: #666; font-size: 13px; font-weight: 500;">主题</label>
                        <input type="text" id="compose-subject" required style="width: 100%; padding: 10px; border: 1px solid #ddd; border-radius: 6px; font-size: 14px;" placeholder="邮件主题">
                    </div>
                    <div style="margin-bottom: 15px;">
                        <label style="display: block; margin-bottom: 5px; color: #666; font-size: 13px; font-weight: 500;">正文</label>
                        <textarea id="compose-body" required rows="10" style="width: 100%; padding: 10px; border: 1px solid #ddd; border-radius: 6px; font-size: 14px; resize: vertical;" placeholder="邮件正文..."></textarea>
                    </div>
                    <div style="margin-bottom: 20px;">
                        <label style="display: block; margin-bottom: 5px; color: #666; font-size: 13px; font-weight: 500;">附件 (可选)</label>
                        <input type="file" id="compose-attachments" multiple style="width: 100%; padding: 5px; border: 1px solid #ddd; border-radius: 6px; font-size: 14px;">
                    </div>
                    <div style="display: flex; gap: 10px; justify-content: flex-end; flex-wrap: wrap;">
                        <button type="button" class="compose-btn" onclick="EmailCompose.closeModal()" style="padding: 10px 20px; border: none; border-radius: 6px; cursor: pointer; font-size: 14px; font-weight: 500; background: #f0f0f0; color: #333;">取消</button>
                        <button type="button" class="compose-btn" onclick="EmailCompose.useAIWriter()" style="padding: 10px 20px; border: none; border-radius: 6px; cursor: pointer; font-size: 14px; font-weight: 500; background: #1890ff; color: white;">🤖 AI写作助手</button>
                        <button type="button" class="compose-btn" onclick="EmailCompose.useAITranslator()" style="padding: 10px 20px; border: none; border-radius: 6px; cursor: pointer; font-size: 14px; font-weight: 500; background: #722ed1; color: white;">🌐 AI翻译助手</button>
                        <button type="submit" class="compose-btn" style="padding: 10px 20px; border: none; border-radius: 6px; cursor: pointer; font-size: 14px; font-weight: 500; background: #52c41a; color: white;">📤 发送</button>
                    </div>
                </form>
                <div id="compose-message" style="margin-top: 15px;"></div>
            </div>
        `;

        document.body.appendChild(modal);

        // 绑定表单提交事件
        const form = modal.querySelector('#email-compose-form');
        form.addEventListener('submit', (e) => {
            e.preventDefault();
            EmailCompose.sendEmail();
        });
    }

    // 显示弹窗
    function showModal() {
        const modal = document.getElementById('email-compose-modal');
        if (!modal) {
            createComposeModal();
        }
        document.getElementById('email-compose-modal').style.display = 'flex';
    }

    // 隐藏弹窗
    function closeModal() {
        const modal = document.getElementById('email-compose-modal');
        if (modal) {
            modal.style.display = 'none';
            // 清空表单
            const form = modal.querySelector('#email-compose-form');
            if (form) form.reset();
        }
    }

    // 发送邮件
    async function sendEmail() {
        const to = document.getElementById('compose-to').value;
        const cc = document.getElementById('compose-cc').value;
        const subject = document.getElementById('compose-subject').value;
        const body = document.getElementById('compose-body').value;
        const attachments = document.getElementById('compose-attachments').files;

        const messageDiv = document.getElementById('compose-message');

        try {
            // 创建FormData
            const formData = new FormData();
            formData.append('to_addr', to);
            if (cc) formData.append('cc', cc);
            formData.append('subject', subject);
            formData.append('body', body);

            // 添加附件
            if (attachments.length > 0) {
                for (let i = 0; i < attachments.length; i++) {
                    formData.append('attachments', attachments[i]);
                }
            }

            // 发送请求
            const response = await fetch(`${API_BASE}/send`, {
                method: 'POST',
                body: formData
            });

            const data = await response.json();

            if (data.success) {
                messageDiv.innerHTML = `<div style="padding: 15px; background: #f6ffed; border-left: 4px solid #52c41a; border-radius: 4px; color: #389e0d;"><strong>✅ 发送成功！</strong></div>`;
                setTimeout(() => {
                    closeModal();
                    if (window.TeamChatEmail && window.TeamChatEmail.loadEmails) {
                        window.TeamChatEmail.loadEmails('sent');
                    }
                }, 1500);
            } else {
                messageDiv.innerHTML = `<div style="padding: 15px; background: #fff2f0; border-left: 4px solid #ff4d4f; border-radius: 4px; color: #cf1322;"><strong>❌ 发送失败:</strong> ${data.message || '未知错误'}</div>`;
            }
        } catch (error) {
            messageDiv.innerHTML = `<div style="padding: 15px; background: #fff2f0; border-left: 4px solid #ff4d4f; border-radius: 4px; color: #cf1322;"><strong>❌ 发送失败:</strong> ${error.message}</div>`;
        }
    }

    // AI写作助手
    async function useAIWriter() {
        const body = document.getElementById('compose-body');
        const subject = document.getElementById('compose-subject');

        if (!subject.value) {
            alert('请先填写邮件主题');
            return;
        }

        const messageDiv = document.getElementById('compose-message');
        messageDiv.innerHTML = `<div style="padding: 15px; background: #e6f7ff; border-left: 4px solid #1890ff; border-radius: 4px; color: #096dd9;"><strong>🤖 AI写作助手正在生成邮件...</strong></div>`;

        try {
            // 调用QwenPaw写作助手
            const response = await fetch('http://127.0.0.1:8088/api/console/chat', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    session_id: 'email-writer-' + Date.now(),
                    message: `请帮我写一封邮件，主题是：${subject.value}\n\n请生成专业、礼貌的邮件正文，包含：\n1. 礼貌的开场白\n2. 详细的正文内容\n3. 礼貌的结束语\n\n请直接输出邮件正文，不要包含主题或其他说明。`,
                    agent_ids: ['default']  // 使用默认智能体
                })
            });

            const data = await response.json();

            if (data.response) {
                body.value = data.response;
                messageDiv.innerHTML = `<div style="padding: 15px; background: #f6ffed; border-left: 4px solid #52c41a; border-radius: 4px; color: #389e0d;"><strong>✅ AI写作助手完成！</strong></div>`;
            } else {
                messageDiv.innerHTML = `<div style="padding: 15px; background: #fff2f0; border-left: 4px solid #ff4d4f; border-radius: 4px; color: #cf1322;"><strong>❌ AI写作失败:</strong> ${data.error || '未知错误'}</div>`;
            }
        } catch (error) {
            messageDiv.innerHTML = `<div style="padding: 15px; background: #fff2f0; border-left: 4px solid #ff4d4f; border-radius: 4px; color: #cf1322;"><strong>❌ AI写作失败:</strong> ${error.message}</div>`;
        }
    }

    // AI翻译助手
    async function useAITranslator() {
        const body = document.getElementById('compose-body');

        if (!body.value) {
            alert('请先填写邮件正文');
            return;
        }

        const messageDiv = document.getElementById('compose-message');
        messageDiv.innerHTML = `<div style="padding: 15px; background: #e6f7ff; border-left: 4px solid #1890ff; border-radius: 4px; color: #096dd9;"><strong>🌐 AI翻译助手正在翻译...</strong></div>`;

        try {
            // 调用QwenPaw翻译助手
            const response = await fetch('http://127.0.0.1:8088/api/console/chat', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    session_id: 'email-translator-' + Date.now(),
                    message: `请将以下邮件正文翻译成英文（如果是中文）或中文（如果是英文），保持专业和礼貌的语气：\n\n${body.value}\n\n请直接输出翻译结果，不要包含其他说明。`,
                    agent_ids: ['default']  // 使用默认智能体
                })
            });

            const data = await response.json();

            if (data.response) {
                body.value = data.response;
                messageDiv.innerHTML = `<div style="padding: 15px; background: #f6ffed; border-left: 4px solid #52c41a; border-radius: 4px; color: #389e0d;"><strong>✅ AI翻译助手完成！</strong></div>`;
            } else {
                messageDiv.innerHTML = `<div style="padding: 15px; background: #fff2f0; border-left: 4px solid #ff4d4f; border-radius: 4px; color: #cf1322;"><strong>❌ AI翻译失败:</strong> ${data.error || '未知错误'}</div>`;
            }
        } catch (error) {
            messageDiv.innerHTML = `<div style="padding: 15px; background: #fff2f0; border-left: 4px solid #ff4d4f; border-radius: 4px; color: #cf1322;"><strong>❌ AI翻译失败:</strong> ${error.message}</div>`;
        }
    }

    // 导出
    window.EmailCompose = {
        showModal,
        closeModal,
        sendEmail,
        useAIWriter,
        useAITranslator
    };

    // 在工具栏添加写邮件按钮
    function addComposeButton() {
        const toolbar = document.querySelector('.email-toolbar');
        if (toolbar && !document.getElementById('compose-btn')) {
            const composeBtn = document.createElement('button');
            composeBtn.id = 'compose-btn';
            composeBtn.className = 'email-btn btn-primary';
            composeBtn.textContent = '✍️ 写邮件';
            composeBtn.onclick = showModal;
            toolbar.insertBefore(composeBtn, toolbar.firstChild);
        }
    }

    // 自动初始化
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
            setTimeout(addComposeButton, 1000);
        });
    } else {
        setTimeout(addComposeButton, 1000);
    }

    console.log('[EmailCompose] 写邮件组件已加载');
})();