/**
 * 写邮件弹窗组件
 */

(function() {
    'use strict';

    const API_BASE = '/api/plugins/team_chat/email';

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
                        <label style="display: block; margin-bottom: 5px; color: #666; font-size: 13px; font-weight: 500;">
                            附件 (可选)
                            <span style="color: #999; font-size: 12px; font-weight: normal;"> - 支持任意格式、任意大小，文件夹请打包成 zip</span>
                        </label>
                        <div style="border: 2px dashed #ddd; border-radius: 8px; padding: 20px; text-align: center; cursor: pointer; transition: all 0.3s;" id="attachment-drop-zone" ondragover="EmailCompose.handleDragOver(event)" ondrop="EmailCompose.handleDrop(event)" ondragleave="EmailCompose.handleDragLeave(event)" onclick="document.getElementById('compose-attachments').click()">
                            <div style="font-size: 48px; color: #ccc; margin-bottom: 10px;">📎</div>
                            <div style="color: #666; font-size: 14px; margin-bottom: 5px;">点击选择文件或拖拽文件到此处</div>
                            <div style="color: #999; font-size: 12px;">支持任意格式、任意大小，文件夹请打包成 zip</div>
                            <input type="file" id="compose-attachments" multiple style="display: none;" onchange="EmailCompose.handleFileSelect(event)">
                        </div>
                        <div id="attachment-list" style="margin-top: 10px; display: none;"></div>
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
            // 清空附件
            clearAttachments();
            // 清空文件输入
            const fileInput = document.getElementById('compose-attachments');
            if (fileInput) fileInput.value = '';
        }
    }

    // 发送邮件
    async function sendEmail() {
        const to = document.getElementById('compose-to').value;
        const cc = document.getElementById('compose-cc').value;
        const subject = document.getElementById('compose-subject').value;
        let body = document.getElementById('compose-body').value;

        const messageDiv = document.getElementById('compose-message');

        try {
            // 处理内嵌图片：将 dataUrl 转换为 cid 引用
            const inlineImageData = [];
            inlineImages.forEach(img => {
                // 从正文中提取 base64 数据
                const dataUrl = img.dataUrl;
                const base64Data = dataUrl.split(',')[1];
                const mimeType = dataUrl.match(/data:([^;]+);/)[1];

                inlineImageData.push({
                    cid: img.cid,
                    filename: img.file.name,
                    content: base64Data,
                    content_type: mimeType
                });

                // 替换正文中的 dataUrl 为 cid 引用
                body = body.replace(img.dataUrl, `cid:${img.cid}`);
            });

            // 创建FormData
            const formData = new FormData();
            formData.append('to_addr', to);
            if (cc) formData.append('cc', cc);
            formData.append('subject', subject);
            formData.append('body', body);

            // 添加 HTML 正文（包含内嵌图片）
            const htmlBody = generateHtmlBody(body);
            formData.append('html_body', htmlBody);

            // 添加内嵌图片信息
            if (inlineImageData.length > 0) {
                formData.append('inline_images', JSON.stringify(inlineImageData));
            }

            // 添加普通附件（非图片）
            const nonImageFiles = attachedFiles.filter(f => !isImageFile(f));
            if (nonImageFiles.length > 0) {
                for (let i = 0; i < nonImageFiles.length; i++) {
                    formData.append('attachments', nonImageFiles[i]);
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

    // 生成 HTML 正文
    function generateHtmlBody(textBody) {
        // 转换纯文本为 HTML
        let html = textBody
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/\n/g, '<br>');

        // 恢复 img 标签
        html = html.replace(/&lt;img([^&]*)&gt;/g, '<img$1>');

        return `<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        img { max-width: 100%; height: auto; border-radius: 4px; margin: 10px 0; }
    </style>
</head>
<body>
    ${html}
</body>
</html>`;
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

    // 附件文件列表
    let attachedFiles = [];
    // 内嵌图片列表（会在邮件正文中显示）
    let inlineImages = [];

    // 判断文件是否为图片
    function isImageFile(file) {
        return file.type.startsWith('image/') || /\.(jpg|jpeg|png|gif|bmp|webp|svg)$/i.test(file.name);
    }

    // 获取文件图标
    function getFileIcon(file) {
        if (isImageFile(file)) return '🖼️';
        const ext = file.name.split('.').pop().toLowerCase();
        const iconMap = {
            'pdf': '📕', 'doc': '📘', 'docx': '📘', 'xls': '📗', 'xlsx': '📗',
            'ppt': '📙', 'pptx': '📙', 'zip': '📦', 'rar': '📦', '7z': '📦',
            'txt': '📄', 'md': '📝', 'json': '⚙️', 'js': '💻', 'py': '🐍',
            'mp3': '🎵', 'mp4': '🎬', 'avi': '🎬', 'mov': '🎬'
        };
        return iconMap[ext] || '📄';
    }

    // 处理文件选择
    function handleFileSelect(event) {
        const files = event.target.files;
        if (files.length > 0) {
            addFilesToList(files);
        }
    }

    // 处理拖拽悬停
    function handleDragOver(event) {
        event.preventDefault();
        event.stopPropagation();
        const dropZone = document.getElementById('attachment-drop-zone');
        if (dropZone) {
            dropZone.style.borderColor = '#667eea';
            dropZone.style.background = '#f0f4ff';
        }
    }

    // 处理拖拽离开
    function handleDragLeave(event) {
        event.preventDefault();
        event.stopPropagation();
        const dropZone = document.getElementById('attachment-drop-zone');
        if (dropZone) {
            dropZone.style.borderColor = '#ddd';
            dropZone.style.background = 'transparent';
        }
    }

    // 处理文件拖放
    function handleDrop(event) {
        event.preventDefault();
        event.stopPropagation();
        const dropZone = document.getElementById('attachment-drop-zone');
        if (dropZone) {
            dropZone.style.borderColor = '#ddd';
            dropZone.style.background = 'transparent';
        }

        const items = event.dataTransfer.items;
        const files = [];

        for (let i = 0; i < items.length; i++) {
            const item = items[i];
            if (item.kind === 'file') {
                const entry = item.webkitGetAsEntry();
                if (entry) {
                    if (entry.isFile) {
                        files.push(item.getAsFile());
                    } else if (entry.isDirectory) {
                        alert('文件夹请打包成 zip 格式后上传');
                        return;
                    }
                }
            }
        }

        if (files.length > 0) {
            addFilesToList(files);
        }
    }

    // 添加文件到列表
    function addFilesToList(files) {
        for (let i = 0; i < files.length; i++) {
            const file = files[i];
            attachedFiles.push(file);

            // 如果是图片，自动添加到内嵌图片列表并插入正文预览
            if (isImageFile(file)) {
                addInlineImage(file);
            }
        }
        renderAttachmentList();
    }

    // 添加内嵌图片
    function addInlineImage(file) {
        const reader = new FileReader();
        reader.onload = function(e) {
            const dataUrl = e.target.result;
            const cid = 'inline_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);

            inlineImages.push({
                file: file,
                dataUrl: dataUrl,
                cid: cid
            });

            // 插入图片到正文
            insertImageToBody(dataUrl, file.name, cid);
        };
        reader.readAsDataURL(file);
    }

    // 插入图片到正文
    function insertImageToBody(dataUrl, fileName, cid) {
        const body = document.getElementById('compose-body');
        if (!body) return;

        const imgHtml = `\n<img src="${dataUrl}" alt="${escapeHtml(fileName)}" style="max-width: 100%; height: auto; border-radius: 4px; margin: 10px 0;" data-cid="${cid}" />\n`;

        // 如果正文为空，先添加一些提示文字
        if (!body.value.trim()) {
            body.value = '请在此输入邮件正文...\n\n';
        }

        // 在光标位置或末尾插入图片
        const cursorPos = body.selectionStart || body.value.length;
        const textBefore = body.value.substring(0, cursorPos);
        const textAfter = body.value.substring(cursorPos);
        body.value = textBefore + imgHtml + textAfter;

        // 更新光标位置
        body.selectionStart = body.selectionEnd = cursorPos + imgHtml.length;
        body.focus();
    }

    // 渲染附件列表
    function renderAttachmentList() {
        const listContainer = document.getElementById('attachment-list');
        if (!listContainer) return;

        if (attachedFiles.length === 0) {
            listContainer.style.display = 'none';
            listContainer.innerHTML = '';
            return;
        }

        // 分离图片和非图片附件
        const imageFiles = attachedFiles.filter(f => isImageFile(f));
        const otherFiles = attachedFiles.filter(f => !isImageFile(f));

        let html = '<div style="border: 1px solid #e8e8e8; border-radius: 6px; padding: 10px; background: #fafafa;">';

        // 图片预览区域
        if (imageFiles.length > 0) {
            html += '<div style="font-size: 13px; color: #666; margin-bottom: 8px; font-weight: 500;">🖼️ 内嵌图片 (' + imageFiles.length + ' 个) - 已插入正文预览</div>';
            html += '<div style="display: flex; flex-wrap: wrap; gap: 8px; margin-bottom: 12px;">';

            imageFiles.forEach((file, index) => {
                const originalIndex = attachedFiles.indexOf(file);
                const sizeStr = formatFileSize(file.size);
                html += `
                    <div style="position: relative; width: 100px; height: 100px; border-radius: 4px; overflow: hidden; border: 1px solid #e8e8e8; background: white;">
                        <img src="${getImagePreviewUrl(file)}" style="width: 100%; height: 100%; object-fit: cover;" alt="${escapeHtml(file.name)}">
                        <div style="position: absolute; top: 0; right: 0; background: rgba(0,0,0,0.6); color: white; font-size: 10px; padding: 2px 4px; border-radius: 0 0 0 4px;">${sizeStr}</div>
                        <button type="button" onclick="EmailCompose.removeAttachment(${originalIndex})" style="position: absolute; bottom: 0; right: 0; background: #ff4d4f; color: white; border: none; border-radius: 4px 0 0 0; padding: 2px 6px; font-size: 10px; cursor: pointer;">×</button>
                    </div>
                `;
            });

            html += '</div>';
        }

        // 其他附件列表
        if (otherFiles.length > 0) {
            html += '<div style="font-size: 13px; color: #666; margin-bottom: 8px; font-weight: 500;">📎 附件 (' + otherFiles.length + ' 个)</div>';

            let totalSize = 0;
            otherFiles.forEach((file) => {
                totalSize += file.size;
            });

            otherFiles.forEach((file, idx) => {
                const originalIndex = attachedFiles.indexOf(file);
                const sizeStr = formatFileSize(file.size);
                const icon = getFileIcon(file);
                html += `
                    <div style="display: flex; align-items: center; justify-content: space-between; padding: 6px 8px; margin: 4px 0; background: white; border-radius: 4px; border: 1px solid #e8e8e8;">
                        <div style="display: flex; align-items: center; gap: 8px; flex: 1; overflow: hidden;">
                            <span style="font-size: 16px;">${icon}</span>
                            <span style="font-size: 13px; color: #333; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">${escapeHtml(file.name)}</span>
                            <span style="font-size: 12px; color: #999; flex-shrink: 0;">(${sizeStr})</span>
                        </div>
                        <button type="button" onclick="EmailCompose.removeAttachment(${originalIndex})" style="background: #ff4d4f; color: white; border: none; border-radius: 4px; padding: 4px 10px; font-size: 12px; cursor: pointer; flex-shrink: 0;">删除</button>
                    </div>
                `;
            });

            html += `<div style="margin-top: 8px; padding-top: 8px; border-top: 1px solid #e8e8e8; font-size: 12px; color: #666; text-align: right;">总大小: ${formatFileSize(totalSize)}</div>`;
        }

        html += '</div>';

        listContainer.innerHTML = html;
        listContainer.style.display = 'block';
    }

    // 获取图片预览URL
    function getImagePreviewUrl(file) {
        const inlineImg = inlineImages.find(img => img.file === file);
        if (inlineImg) {
            return inlineImg.dataUrl;
        }
        return '';
    }

    // 格式化文件大小
    function formatFileSize(bytes) {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }

    // HTML转义
    function escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    // 删除附件
    function removeAttachment(index) {
        const file = attachedFiles[index];

        // 如果是图片，同时从inlineImages和正文中移除
        if (isImageFile(file)) {
            const inlineIndex = inlineImages.findIndex(img => img.file === file);
            if (inlineIndex !== -1) {
                const cid = inlineImages[inlineIndex].cid;
                removeImageFromBody(cid);
                inlineImages.splice(inlineIndex, 1);
            }
        }

        attachedFiles.splice(index, 1);
        renderAttachmentList();
    }

    // 从正文移除图片
    function removeImageFromBody(cid) {
        const body = document.getElementById('compose-body');
        if (!body) return;

        // 移除带有对应cid的图片标签
        const imgRegex = new RegExp(`<img[^>]*data-cid="${cid}"[^>]*>\\n?`, 'g');
        body.value = body.value.replace(imgRegex, '');
    }

    // 清空附件
    function clearAttachments() {
        // 从正文中移除所有内嵌图片
        inlineImages.forEach(img => {
            removeImageFromBody(img.cid);
        });

        attachedFiles = [];
        inlineImages = [];
        renderAttachmentList();
    }

    // 导出
    window.EmailCompose = {
        showModal,
        closeModal,
        sendEmail,
        useAIWriter,
        useAITranslator,
        handleFileSelect,
        handleDragOver,
        handleDragLeave,
        handleDrop,
        removeAttachment,
        clearAttachments
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