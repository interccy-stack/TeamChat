/**
 * TeamChat 邮箱管理组件 v5.2.0
 * 多邮箱管理 + 传统邮箱
 * 集成到TeamChat插件内部
 */

(function() {
    'use strict';

    const API_BASE = 'http://127.0.0.1:18888/api/v1/email';
    let currentFolder = 'inbox';
    let selectedEmailId = null;

    // 创建邮箱管理界面
    function createEmailManagementUI() {
        const container = document.createElement('div');
        container.id = 'teamchat-email-management';
        container.style.cssText = `
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            padding: 20px;
            background: #f5f5f5;
            min-height: 100vh;
        `;

        container.innerHTML = `
            <div class="email-header">
                <h2 style="margin: 0 0 15px 0; color: #667eea; font-size: 24px;">
                    📧 TeamChat 邮箱系统 v5.2.0
                </h2>
                <p style="margin: 0 0 20px 0; color: #666; font-size: 14px;">
                    多邮箱管理 | 端口: 18888
                </p>
            </div>

            <div class="email-tabs">
                <div class="email-tab active" data-tab="emails">📥 邮件</div>
                <div class="email-tab" data-tab="configs">⚙️ 邮箱设置</div>
                <div class="email-tab" data-tab="contacts">👥 联系人</div>
            </div>

            <div class="email-stats">
                <div class="email-stat-card">
                    <h3>收件箱</h3>
                    <div class="stat-value" id="inboxCount">-</div>
                </div>
                <div class="email-stat-card">
                    <h3>发件箱</h3>
                    <div class="stat-value" id="sentCount">-</div>
                </div>
                <div class="email-stat-card">
                    <h3>草稿箱</h3>
                    <div class="stat-value" id="draftsCount">-</div>
                </div>
                <div class="email-stat-card">
                    <h3>已配置</h3>
                    <div class="stat-value" id="configCount">-</div>
                </div>
            </div>

            <div class="email-toolbar">
                <button class="email-btn btn-primary" onclick="TeamChatEmail.loadEmails('inbox')">📥 收件箱</button>
                <button class="email-btn btn-primary" onclick="TeamChatEmail.loadEmails('sent')">📤 发件箱</button>
                <button class="email-btn btn-primary" onclick="TeamChatEmail.loadEmails('drafts')">📝 草稿箱</button>
                <button class="email-btn btn-primary" onclick="TeamChatEmail.loadEmails('trash')">🗑️ 回收站</button>
                <button class="email-btn btn-success" onclick="TeamChatEmail.syncAllEmails()">🔄 同步所有</button>
                <button class="email-btn btn-warning" onclick="TeamChatEmail.refreshStats()">📊 刷新统计</button>
            </div>

            <div id="emailMessage"></div>
            <div id="emailList"></div>

            <div id="emailConfigs" style="display: none;">
                <div class="email-toolbar">
                    <button class="email-btn btn-success" onclick="TeamChatEmail.showAddConfigModal()">➕ 添加邮箱</button>
                    <button class="email-btn btn-warning" onclick="TeamChatEmail.refreshConfigs()">🔄 刷新</button>
                </div>
                <div id="configMessage"></div>
                <div id="configList"></div>
            </div>

            <div id="emailContacts" style="display: none;">
                <div class="email-toolbar">
                    <button class="email-btn btn-success" onclick="TeamChatEmail.showAddContactModal()">➕ 添加联系人</button>
                    <button class="email-btn btn-warning" onclick="TeamChatEmail.loadContacts()">🔄 刷新</button>
                </div>
                <div id="contactMessage"></div>
                <div id="contactList"></div>
            </div>
        `;

        // 添加样式
        const style = document.createElement('style');
        style.textContent = `
            .email-header { margin-bottom: 20px; }
            .email-tabs { display: flex; gap: 5px; margin-bottom: 20px; border-bottom: 2px solid #e0e0e0; }
            .email-tab {
                padding: 10px 20px;
                cursor: pointer;
                font-size: 14px;
                font-weight: 500;
                color: #666;
                border-bottom: 2px solid transparent;
                margin-bottom: -2px;
                transition: all 0.2s;
            }
            .email-tab:hover { color: #667eea; }
            .email-tab.active { color: #667eea; border-bottom-color: #667eea; }
            .email-stats {
                display: grid;
                grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
                gap: 15px;
                margin-bottom: 20px;
            }
            .email-stat-card {
                background: white;
                padding: 15px;
                border-radius: 8px;
                border-left: 4px solid #667eea;
                box-shadow: 0 2px 8px rgba(0,0,0,0.05);
            }
            .email-stat-card h3 {
                margin: 0 0 5px 0;
                font-size: 12px;
                color: #666;
                text-transform: uppercase;
            }
            .stat-value {
                font-size: 24px;
                font-weight: bold;
                color: #667eea;
            }
            .email-toolbar { display: flex; gap: 10px; margin-bottom: 20px; flex-wrap: wrap; }
            .email-btn {
                padding: 8px 16px;
                border: none;
                border-radius: 6px;
                cursor: pointer;
                font-size: 14px;
                font-weight: 500;
                transition: all 0.2s;
                display: inline-flex;
                align-items: center;
                gap: 5px;
            }
            .btn-primary { background: #667eea; color: white; }
            .btn-primary:hover { background: #5568d3; }
            .btn-success { background: #52c41a; color: white; }
            .btn-success:hover { background: #45ad16; }
            .btn-warning { background: #faad14; color: white; }
            .btn-warning:hover { background: #d48806; }
            .btn-danger { background: #ff4d4f; color: white; }
            .btn-danger:hover { background: #f5222d; }
            .email-item {
                background: white;
                padding: 15px;
                border-radius: 8px;
                margin-bottom: 10px;
                cursor: pointer;
                transition: all 0.2s;
                box-shadow: 0 2px 8px rgba(0,0,0,0.05);
            }
            .email-item:hover {
                transform: translateX(5px);
                box-shadow: 0 4px 12px rgba(0,0,0,0.1);
            }
            .email-item-header {
                display: flex;
                justify-content: space-between;
                margin-bottom: 8px;
            }
            .email-from { font-weight: 600; color: #333; }
            .email-date { font-size: 12px; color: #999; }
            .email-subject { color: #666; font-weight: 500; margin-bottom: 5px; }
            .email-body { color: #999; font-size: 13px; }
            .config-item {
                background: white;
                padding: 15px;
                border-radius: 8px;
                margin-bottom: 10px;
                border-left: 4px solid #667eea;
                box-shadow: 0 2px 8px rgba(0,0,0,0.05);
            }
            .config-item h3 { color: #667eea; margin: 0 0 10px 0; }
            .config-item p { color: #666; font-size: 13px; margin: 0 0 5px 0; }
            .config-actions { margin-top: 15px; display: flex; gap: 8px; flex-wrap: wrap; }
            .email-message { padding: 15px; border-radius: 8px; margin-bottom: 20px; }
            .email-message.success { background: #f6ffed; border-left: 4px solid #52c41a; color: #389e0d; }
            .email-message.error { background: #fff2f0; border-left: 4px solid #ff4d4f; color: #cf1322; }
            .email-message.info { background: #e6f7ff; border-left: 4px solid #1890ff; color: #096dd9; }
            .email-loading { text-align: center; padding: 40px; color: #999; }
            .email-empty { text-align: center; padding: 60px; color: #999; }
            .email-empty-icon { font-size: 48px; margin-bottom: 16px; }
        `;

        container.insertBefore(style, container.firstChild);

        return container;
    }

    // API调用
    async function apiCall(endpoint, options = {}) {
        try {
            const url = `${API_BASE}${endpoint}`;
            const response = await fetch(url, {
                headers: {
                    'Content-Type': 'application/json',
                    ...options.headers
                },
                ...options
            });
            return await response.json();
        } catch (error) {
            console.error('API调用失败:', error);
            return { success: false, message: error.message };
        }
    }

    // 显示消息
    function showMessage(type, message) {
        const messageArea = document.getElementById('emailMessage');
        if (messageArea) {
            messageArea.innerHTML = `<div class="email-message ${type}"><strong>${type === 'success' ? '✅' : type === 'error' ? '❌' : 'ℹ️'}</strong> ${message}</div>`;
            setTimeout(() => {
                if (messageArea) messageArea.innerHTML = '';
            }, 5000);
        }
    }

    // 加载邮件
    async function loadEmails(folder, showMessage = true) {
        currentFolder = folder;
        const emailList = document.getElementById('emailList');
        if (!emailList) return;

        emailList.innerHTML = '<div class="email-loading">加载邮件中...</div>';

        const endpoint = folder === 'inbox' ? '/inbox' :
                         folder === 'sent' ? '/sent' :
                         folder === 'drafts' ? '/drafts' : '/trash';

        const data = await apiCall(`${endpoint}?limit=20`);

        if (data.success && data.emails && data.emails.length > 0) {
            let html = '';
            data.emails.forEach(email => {
                const fromName = email.from_name || email.from_addr || '未知';
                const subject = email.subject || '(无主题)';
                const body = email.body || '';
                const preview = body.substring(0, 100) + (body.length > 100 ? '...' : '');

                html += `
                    <div class="email-item" onclick="TeamChatEmail.viewEmail(${email.id})">
                        <div class="email-item-header">
                            <div class="email-from">${fromName}</div>
                            <div class="email-date">${email.sent_date || email.date || '未知日期'}</div>
                        </div>
                        <div class="email-subject">${subject}</div>
                        <div class="email-body">${preview}</div>
                    </div>
                `;
            });

            emailList.innerHTML = html;

            if (showMessage) {
                showMessage('success', `加载成功！共 ${data.total || data.emails.length} 封邮件`);
            }
        } else {
            emailList.innerHTML = `
                <div class="email-empty">
                    <div class="email-empty-icon">📭</div>
                    <p>暂无邮件</p>
                </div>
            `;
        }
    }

    // 同步所有邮箱
    async function syncAllEmails() {
        const emailList = document.getElementById('emailList');
        if (!emailList) return;

        emailList.innerHTML = '<div class="email-loading">正在同步所有邮箱，请稍候...</div>';

        const data = await apiCall('/sync', { method: 'POST' });

        if (data.success) {
            showMessage('success', `同步成功！${data.message} (共 ${data.synced || 0} 封)`);
            setTimeout(() => {
                loadEmails(currentFolder, false);
                refreshStats();
            }, 2000);
        } else {
            showMessage('error', `同步失败：${data.message || '未知错误'}`);
        }
    }

    // 刷新统计
    async function refreshStats() {
        const data = await apiCall('/stats');

        if (data.success && data.stats) {
            const stats = data.stats;
            const inboxCount = document.getElementById('inboxCount');
            const sentCount = document.getElementById('sentCount');
            const draftsCount = document.getElementById('draftsCount');
            const configCount = document.getElementById('configCount');

            if (inboxCount) inboxCount.textContent = stats.inbox_count || 0;
            if (sentCount) sentCount.textContent = stats.sent_count || 0;
            if (draftsCount) draftsCount.textContent = stats.drafts_count || 0;
            if (configCount) configCount.textContent = stats.configs_count || 0;
        }
    }

    // 刷新配置
    async function refreshConfigs() {
        const configList = document.getElementById('configList');
        if (!configList) return;

        configList.innerHTML = '<div class="email-loading">加载邮箱配置中...</div>';

        const data = await apiCall('/configs');

        if (data.success && data.configs && data.configs.length > 0) {
            let html = '';
            data.configs.forEach(config => {
                html += `
                    <div class="config-item">
                        <h3>${config.display_name || config.email}</h3>
                        <p><strong>邮箱:</strong> ${config.email}</p>
                        <p><strong>SMTP:</strong> ${config.smtp_host}:${config.smtp_port}</p>
                        <p><strong>IMAP:</strong> ${config.imap_host}:${config.imap_port}</p>
                        <div class="config-actions">
                            <button class="email-btn btn-success" onclick="TeamChatEmail.syncEmail(${config.id})">🔄 同步</button>
                            <button class="email-btn btn-primary" onclick="TeamChatEmail.editConfig(${config.id})">✏️ 编辑</button>
                            <button class="email-btn btn-danger" onclick="TeamChatEmail.deleteConfig(${config.id})">🗑️ 删除</button>
                        </div>
                    </div>
                `;
            });

            configList.innerHTML = html;
        } else {
            configList.innerHTML = `
                <div class="email-empty">
                    <div class="email-empty-icon">📧</div>
                    <p>暂无邮箱配置</p>
                    <button class="email-btn btn-success" onclick="TeamChatEmail.showAddConfigModal()">➕ 添加第一个邮箱</button>
                </div>
            `;
        }
    }

    // 加载联系人
    async function loadContacts() {
        const contactList = document.getElementById('contactList');
        if (!contactList) return;

        contactList.innerHTML = '<div class="email-loading">加载联系人中...</div>';

        const data = await apiCall('/contacts');

        if (data.success && data.contacts && data.contacts.length > 0) {
            let html = '';
            data.contacts.forEach(contact => {
                html += `
                    <div class="email-item">
                        <div class="email-item-header">
                            <div class="email-from">${contact.name}</div>
                            <div class="email-date">${contact.email}</div>
                        </div>
                        <div class="email-subject">${contact.phone || '无电话'}</div>
                        <div class="email-body">${contact.company || '无公司'} - ${contact.group_name || '默认'}</div>
                    </div>
                `;
            });

            contactList.innerHTML = html;
        } else {
            contactList.innerHTML = `
                <div class="email-empty">
                    <div class="email-empty-icon">👥</div>
                    <p>暂无联系人</p>
                </div>
            `;
        }
    }

    // 查看邮件详情
    async function viewEmail(emailId) {
        const endpoint = currentFolder === 'inbox' ? '/inbox' :
                         currentFolder === 'sent' ? '/sent' :
                         currentFolder === 'drafts' ? '/drafts' : '/trash';

        const data = await apiCall(`${endpoint}/${emailId}`);

        if (data.success && data.email) {
            const email = data.email;
            showMessage('info', `
                <strong>📧 邮件详情</strong><br>
                <strong>发件人:</strong> ${email.from_name || email.from_addr}<br>
                <strong>主题:</strong> ${email.subject}<br>
                <strong>日期:</strong> ${email.sent_date || email.date}<br>
                <strong>正文:</strong><br>
                <div style="margin-top: 10px; padding: 10px; background: #f8f9fa; border-radius: 4px; max-height: 300px; overflow-y: auto;">
                    ${(email.body || '').replace(/\n/g, '<br>')}
                </div>
            `);
        }
    }

    // 添加邮箱配置弹窗
    function showAddConfigModal() {
        // 简单实现：提示用户使用独立页面
        showMessage('info', '请使用测试页面添加邮箱配置：<br>D:\\qwenpaw\\workspaces\\default\\email_test_v3.html');
    }

    // 编辑邮箱配置
    function editConfig(configId) {
        // 简单实现：提示用户使用独立页面
        showMessage('info', '请使用测试页面编辑邮箱配置');
    }

    // 删除邮箱配置
    async function deleteConfig(configId) {
        if (!confirm('确定要删除这个邮箱配置吗？')) return;

        const data = await apiCall(`/config/${configId}`, { method: 'DELETE' });

        if (data.success) {
            showMessage('success', '删除成功！');
            refreshConfigs();
            refreshStats();
        } else {
            showMessage('error', `删除失败：${data.message || '未知错误'}`);
        }
    }

    // 同步单个邮箱
    async function syncEmail(configId) {
        const data = await apiCall(`/sync?config_id=${configId}`, { method: 'POST' });

        if (data.success) {
            showMessage('success', `同步成功！${data.message}`);
            refreshStats();
        } else {
            showMessage('error', `同步失败：${data.message || '未知错误'}`);
        }
    }

    // 添加联系人弹窗
    function showAddContactModal() {
        showMessage('info', '联系人功能开发中...');
    }

    // 初始化
    function init() {
        const container = document.getElementById('teamchat-email-management');
        if (container) return; // 已经初始化

        const ui = createEmailManagementUI();
        document.body.appendChild(ui);

        // 绑定标签切换事件
        ui.querySelectorAll('.email-tab').forEach(tab => {
            tab.addEventListener('click', (e) => {
                ui.querySelectorAll('.email-tab').forEach(t => t.classList.remove('active'));
                e.target.classList.add('active');

                const tabName = e.target.dataset.tab;

                ui.querySelector('#emailList').style.display = tabName === 'emails' ? 'block' : 'none';
                ui.querySelector('#emailConfigs').style.display = tabName === 'configs' ? 'block' : 'none';
                ui.querySelector('#emailContacts').style.display = tabName === 'contacts' ? 'block' : 'none';

                if (tabName === 'emails') {
                    loadEmails(currentFolder);
                    refreshStats();
                } else if (tabName === 'configs') {
                    refreshConfigs();
                } else if (tabName === 'contacts') {
                    loadContacts();
                }
            });
        });

        // 初始加载
        loadEmails('inbox');
        refreshStats();

        console.log('[TeamChat Email] 邮箱管理组件已初始化');
    }

    // 导出到全局
    window.TeamChatEmail = {
        init,
        loadEmails,
        syncAllEmails,
        refreshStats,
        refreshConfigs,
        loadContacts,
        viewEmail,
        showAddConfigModal,
        editConfig,
        deleteConfig,
        syncEmail,
        showAddContactModal
    };

    // 自动初始化
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

})();