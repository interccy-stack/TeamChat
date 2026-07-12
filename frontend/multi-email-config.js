// 多邮箱管理功能
(function() {
    'use strict';

    const API_BASE = 'http://127.0.0.1:18888/api/v1/email';
    let currentConfigId = null;
    let emailConfigs = [];

    // 加载邮箱配置列表
    window.loadEmailConfigs = async function() {
        try {
            const response = await fetch(`${API_BASE}/configs`);
            const data = await response.json();

            if (data.success) {
                emailConfigs = data.configs || [];

                // 如果只有一个配置，自动设置为当前配置
                if (emailConfigs.length === 1) {
                    currentConfigId = emailConfigs[0].id;
                } else if (!currentConfigId && emailConfigs.length > 0) {
                    currentConfigId = emailConfigs[0].id;
                }

                updateConfigUI();
                return emailConfigs;
            }
        } catch (error) {
            console.error('加载邮箱配置失败:', error);
            return [];
        }
    };

    // 更新邮箱配置UI
    window.updateConfigUI = function() {
        const configSelector = document.getElementById('config-selector');
        const configInfo = document.getElementById('config-info');

        if (!configSelector && !configInfo) {
            return;
        }

        // 创建或更新配置选择器
        if (configSelector) {
            configSelector.innerHTML = '';

            emailConfigs.forEach(config => {
                const option = document.createElement('option');
                option.value = config.id;
                option.textContent = `${config.display_name || config.email} (${config.email})`;
                if (config.id === currentConfigId) {
                    option.selected = true;
                }
                configSelector.appendChild(option);
            });

            // 绑定配置切换事件
            configSelector.onchange = function() {
                currentConfigId = parseInt(this.value);
                switchEmailConfig(currentConfigId);
            };
        }

        // 显示当前配置信息
        if (configInfo) {
            const currentConfig = emailConfigs.find(c => c.id === currentConfigId);
            if (currentConfig) {
                configInfo.innerHTML = `
                    <div class="config-info">
                        <strong>当前邮箱:</strong> ${currentConfig.display_name || currentConfig.email}
                        <br>
                        <strong>地址:</strong> ${currentConfig.email}
                    </div>
                `;
            }
        }
    };

    // 切换邮箱配置
    window.switchEmailConfig = async function(configId) {
        try {
            currentConfigId = configId;

            // 更新UI
            updateConfigUI();

            // 刷新当前文件夹的邮件列表
            if (currentFolder === 'inbox') {
                loadInboxEmails();
            } else if (currentFolder === 'sent') {
                loadSentEmails();
            } else if (currentFolder === 'drafts') {
                loadDrafts();
            } else if (currentFolder === 'trash') {
                loadTrashEmails();
            }

            // 更新统计信息
            updateStats();

            showMessage('success', '已切换到邮箱配置');
        } catch (error) {
            console.error('切换邮箱配置失败:', error);
            showMessage('error', error.message || '切换邮箱配置失败');
        }
    };

    // 显示添加邮箱配置模态框
    window.showAddEmailConfigModal = function() {
        const modalHtml = `
            <div id="email-config-modal" class="modal-overlay" style="display: flex;">
                <div class="modal-content" style="max-width: 500px;">
                    <div class="modal-header">
                        <h3>添加邮箱配置</h3>
                        <button class="close-btn" onclick="closeEmailConfigModal()">×</button>
                    </div>
                    <div class="modal-body">
                        <div class="form-group">
                            <label>邮箱服务商</label>
                            <select id="email-provider" onchange="fillEmailProviderSettings()">
                                <option value="">请选择邮箱服务商</option>
                                <option value="qq">QQ邮箱</option>
                                <option value="163">网易163邮箱</option>
                                <option value="gmail">Gmail</option>
                                <option value="outlook">Outlook</option>
                                <option value="custom">自定义</option>
                            </select>
                        </div>
                        <div class="form-group">
                            <label>邮箱地址 <span class="required">*</span></label>
                            <input type="email" id="email-address" placeholder="your.email@example.com" required>
                        </div>
                        <div class="form-group">
                            <label>显示名称</label>
                            <input type="text" id="display-name" placeholder="我的邮箱">
                        </div>
                        <div class="form-group">
                            <label>SMTP服务器 <span class="required">*</span></label>
                            <input type="text" id="smtp-host" placeholder="smtp.example.com" required>
                        </div>
                        <div class="form-group">
                            <label>SMTP端口 <span class="required">*</span></label>
                            <input type="number" id="smtp-port" placeholder="465" required>
                        </div>
                        <div class="form-group">
                            <label>SMTP用户名 <span class="required">*</span></label>
                            <input type="text" id="smtp-username" placeholder="your.email@example.com" required>
                        </div>
                        <div class="form-group">
                            <label>SMTP密码/授权码 <span class="required">*</span></label>
                            <input type="password" id="smtp-password" placeholder="请输入密码或授权码" required>
                        </div>
                        <div class="form-group">
                            <label>IMAP服务器 <span class="required">*</span></label>
                            <input type="text" id="imap-host" placeholder="imap.example.com" required>
                        </div>
                        <div class="form-group">
                            <label>IMAP端口 <span class="required">*</span></label>
                            <input type="number" id="imap-port" placeholder="993" required>
                        </div>
                        <div class="form-group">
                            <label>IMAP用户名 <span class="required">*</span></label>
                            <input type="text" id="imap-username" placeholder="your.email@example.com" required>
                        </div>
                        <div class="form-group">
                            <label>IMAP密码/授权码 <span class="required">*</span></label>
                            <input type="password" id="imap-password" placeholder="请输入密码或授权码" required>
                        </div>
                        <div class="form-group">
                            <label>
                                <input type="checkbox" id="use-ssl" checked> 使用SSL加密
                            </label>
                        </div>
                    </div>
                    <div class="modal-footer">
                        <button class="btn-secondary" onclick="testEmailConnection()">测试连接</button>
                        <button class="btn-secondary" onclick="closeEmailConfigModal()">取消</button>
                        <button class="btn-primary" onclick="saveEmailConfig()">保存配置</button>
                    </div>
                </div>
            </div>
        `;

        // 移除现有模态框
        const existingModal = document.getElementById('email-config-modal');
        if (existingModal) {
            existingModal.remove();
        }

        // 添加新模态框
        document.body.insertAdjacentHTML('beforeend', modalHtml);
    };

    // 填充邮箱服务商设置
    window.fillEmailProviderSettings = function() {
        const provider = document.getElementById('email-provider').value;
        const emailAddress = document.getElementById('email-address').value;
        const useSsl = document.getElementById('use-ssl').checked;

        const providers = {
            qq: {
                smtpHost: 'smtp.qq.com',
                smtpPort: 465,
                imapHost: 'imap.qq.com',
                imapPort: 993
            },
            '163': {
                smtpHost: 'smtp.163.com',
                smtpPort: 465,
                imapHost: 'imap.163.com',
                imapPort: 993
            },
            gmail: {
                smtpHost: 'smtp.gmail.com',
                smtpPort: 587,
                imapHost: 'imap.gmail.com',
                imapPort: 993
            },
            outlook: {
                smtpHost: 'smtp-mail.outlook.com',
                smtpPort: 587,
                imapHost: 'outlook.office365.com',
                imapPort: 993
            }
        };

        if (providers[provider]) {
            const settings = providers[provider];
            document.getElementById('smtp-host').value = settings.smtpHost;
            document.getElementById('smtp-port').value = settings.smtpPort;
            document.getElementById('imap-host').value = settings.imapHost;
            document.getElementById('imap-port').value = settings.imapPort;

            // 自动填写用户名
            if (emailAddress) {
                document.getElementById('smtp-username').value = emailAddress;
                document.getElementById('imap-username').value = emailAddress;
            }
        }
    };

    // 测试邮箱连接
    window.testEmailConnection = async function() {
        const config = {
            email: document.getElementById('email-address').value,
            smtp_host: document.getElementById('smtp-host').value,
            smtp_port: parseInt(document.getElementById('smtp-port').value),
            smtp_ssl: document.getElementById('use-ssl').checked,
            smtp_username: document.getElementById('smtp-username').value,
            smtp_password: document.getElementById('smtp-password').value,
            imap_host: document.getElementById('imap-host').value,
            imap_port: parseInt(document.getElementById('imap-port').value),
            imap_ssl: document.getElementById('use-ssl').checked,
            imap_username: document.getElementById('imap-username').value,
            imap_password: document.getElementById('imap-password').value
        };

        // 验证必填字段
        if (!config.email || !config.smtp_host || !config.smtp_port || !config.imap_host || !config.imap_port) {
            showMessage('error', '请填写完整的邮箱配置信息');
            return;
        }

        try {
            showMessage('info', '正在测试连接...');

            const response = await fetch(`${API_BASE}/test-connection`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(config)
            });

            const data = await response.json();

            if (data.success) {
                const results = data.results || {};
                if (results.smtp && results.imap) {
                    showMessage('success', '连接测试成功！SMTP和IMAP都可以正常连接');
                } else if (results.smtp) {
                    showMessage('warning', 'SMTP连接成功，但IMAP连接失败');
                } else if (results.imap) {
                    showMessage('warning', 'IMAP连接成功，但SMTP连接失败');
                } else {
                    showMessage('error', '连接测试失败，请检查配置信息');
                }
            } else {
                throw new Error(data.message || '连接测试失败');
            }
        } catch (error) {
            console.error('测试连接失败:', error);
            showMessage('error', error.message || '连接测试失败');
        }
    };

    // 保存邮箱配置
    window.saveEmailConfig = async function() {
        const config = {
            email: document.getElementById('email-address').value,
            display_name: document.getElementById('display-name').value || document.getElementById('email-address').value,
            provider: document.getElementById('email-provider').value || 'custom',
            smtp_host: document.getElementById('smtp-host').value,
            smtp_port: parseInt(document.getElementById('smtp-port').value),
            smtp_ssl: document.getElementById('use-ssl').checked,
            smtp_username: document.getElementById('smtp-username').value,
            smtp_password: document.getElementById('smtp-password').value,
            imap_host: document.getElementById('imap-host').value,
            imap_port: parseInt(document.getElementById('imap-port').value),
            imap_ssl: document.getElementById('use-ssl').checked,
            imap_username: document.getElementById('imap-username').value,
            imap_password: document.getElementById('imap-password').value
        };

        // 验证必填字段
        if (!config.email || !config.smtp_host || !config.smtp_port || !config.imap_host || !config.imap_port) {
            showMessage('error', '请填写完整的邮箱配置信息');
            return;
        }

        try {
            const response = await fetch(`${API_BASE}/config`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(config)
            });

            const data = await response.json();

            if (data.success) {
                showMessage('success', '邮箱配置保存成功');
                closeEmailConfigModal();
                loadEmailConfigs(); // 重新加载配置列表
            } else {
                throw new Error(data.message || '保存配置失败');
            }
        } catch (error) {
            console.error('保存邮箱配置失败:', error);
            showMessage('error', error.message || '保存配置失败');
        }
    };

    // 关闭邮箱配置模态框
    window.closeEmailConfigModal = function() {
        const modal = document.getElementById('email-config-modal');
        if (modal) {
            modal.remove();
        }
    };

    // 删除邮箱配置
    window.deleteEmailConfig = async function(configId) {
        if (emailConfigs.length <= 1) {
            showMessage('error', '至少需要保留一个邮箱配置');
            return;
        }

        if (!confirm('确定要删除这个邮箱配置吗？')) {
            return;
        }

        try {
            const response = await fetch(`${API_BASE}/config/${configId}`, {
                method: 'DELETE'
            });

            const data = await response.json();

            if (data.success) {
                showMessage('success', '邮箱配置删除成功');

                // 如果删除的是当前配置，切换到其他配置
                if (currentConfigId === configId) {
                    currentConfigId = emailConfigs.find(c => c.id !== configId)?.id;
                }

                loadEmailConfigs(); // 重新加载配置列表
            } else {
                throw new Error(data.message || '删除配置失败');
            }
        } catch (error) {
            console.error('删除邮箱配置失败:', error);
            showMessage('error', error.message || '删除配置失败');
        }
    };

    console.log('[TeamChat Email] 多邮箱管理功能已加载');

})();