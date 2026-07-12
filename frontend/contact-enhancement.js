// 联系人管理增强功能
(function() {
    'use strict';

    const API_BASE = '/api/plugins/team_chat/email';

    // 从localStorage加载联系人
    function loadContactsFromStorage() {
        try {
            const contacts = localStorage.getItem('teamchat_email_contacts');
            return contacts ? JSON.parse(contacts) : [];
        } catch (e) {
            console.error('加载联系人失败:', e);
            return [];
        }
    }

    // 保存联系人到localStorage
    function saveContactsToStorage(contacts) {
        try {
            localStorage.setItem('teamchat_email_contacts', JSON.stringify(contacts));
            return true;
        } catch (e) {
            console.error('保存联系人失败:', e);
            return false;
        }
    }

    // 添加联系人
    window.addContact = async function(contact) {
        try {
            // 验证联系人信息
            if (!contact.email || !contact.name) {
                throw new Error('姓名和邮箱不能为空');
            }

            // 调用后端API
            const response = await fetch(`${API_BASE}/contacts`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(contact)
            });

            const data = await response.json();

            if (data.success) {
                // 同时保存到localStorage
                const contacts = loadContactsFromStorage();
                contact.id = data.contact_id || Date.now();
                contacts.push(contact);
                saveContactsToStorage(contacts);

                showMessage('success', '联系人添加成功');
                loadContacts(); // 刷新联系人列表
                return true;
            } else {
                throw new Error(data.message || '添加联系人失败');
            }
        } catch (error) {
            console.error('添加联系人失败:', error);
            showMessage('error', error.message || '添加联系人失败');
            return false;
        }
    };

    // 编辑联系人
    window.editContact = async function(id, contact) {
        try {
            // 验证联系人信息
            if (!contact.email || !contact.name) {
                throw new Error('姓名和邮箱不能为空');
            }

            // 调用后端API
            const response = await fetch(`${API_BASE}/contacts/${id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(contact)
            });

            const data = await response.json();

            if (data.success) {
                // 同时更新localStorage
                const contacts = loadContactsFromStorage();
                const index = contacts.findIndex(c => c.id === id);
                if (index !== -1) {
                    contact.id = id;
                    contacts[index] = contact;
                    saveContactsToStorage(contacts);
                }

                showMessage('success', '联系人更新成功');
                loadContacts(); // 刷新联系人列表
                return true;
            } else {
                throw new Error(data.message || '更新联系人失败');
            }
        } catch (error) {
            console.error('编辑联系人失败:', error);
            showMessage('error', error.message || '更新联系人失败');
            return false;
        }
    };

    // 删除联系人
    window.deleteContact = async function(id) {
        if (!confirm('确定要删除这个联系人吗？')) {
            return false;
        }

        try {
            // 调用后端API
            const response = await fetch(`${API_BASE}/contacts/${id}`, {
                method: 'DELETE'
            });

            const data = await response.json();

            if (data.success) {
                // 同时从localStorage删除
                const contacts = loadContactsFromStorage();
                const filteredContacts = contacts.filter(c => c.id !== id);
                saveContactsToStorage(filteredContacts);

                showMessage('success', '联系人删除成功');
                loadContacts(); // 刷新联系人列表
                return true;
            } else {
                throw new Error(data.message || '删除联系人失败');
            }
        } catch (error) {
            console.error('删除联系人失败:', error);
            showMessage('error', error.message || '删除联系人失败');
            return false;
        }
    };

    // 显示添加联系人模态框
    window.showAddContactModal = function() {
        const modalHtml = `
            <div id="contact-modal" class="modal-overlay" style="display: flex;">
                <div class="modal-content" style="max-width: 400px;">
                    <div class="modal-header">
                        <h3>添加联系人</h3>
                        <button class="close-btn" onclick="closeContactModal()">×</button>
                    </div>
                    <div class="modal-body">
                        <div class="form-group">
                            <label>姓名 <span class="required">*</span></label>
                            <input type="text" id="contact-name" placeholder="请输入姓名" required>
                        </div>
                        <div class="form-group">
                            <label>邮箱 <span class="required">*</span></label>
                            <input type="email" id="contact-email" placeholder="请输入邮箱地址" required>
                        </div>
                        <div class="form-group">
                            <label>电话</label>
                            <input type="tel" id="contact-phone" placeholder="请输入电话号码">
                        </div>
                        <div class="form-group">
                            <label>公司</label>
                            <input type="text" id="contact-company" placeholder="请输入公司名称">
                        </div>
                        <div class="form-group">
                            <label>备注</label>
                            <textarea id="contact-notes" rows="3" placeholder="请输入备注信息"></textarea>
                        </div>
                    </div>
                    <div class="modal-footer">
                        <button class="btn-secondary" onclick="closeContactModal()">取消</button>
                        <button class="btn-primary" onclick="saveNewContact()">保存</button>
                    </div>
                </div>
            </div>
        `;

        // 移除现有模态框
        const existingModal = document.getElementById('contact-modal');
        if (existingModal) {
            existingModal.remove();
        }

        // 添加新模态框
        document.body.insertAdjacentHTML('beforeend', modalHtml);
    };

    // 保存新联系人
    window.saveNewContact = function() {
        const name = document.getElementById('contact-name').value.trim();
        const email = document.getElementById('contact-email').value.trim();
        const phone = document.getElementById('contact-phone').value.trim();
        const company = document.getElementById('contact-company').value.trim();
        const notes = document.getElementById('contact-notes').value.trim();

        if (!name || !email) {
            showMessage('error', '姓名和邮箱不能为空');
            return;
        }

        // 验证邮箱格式
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            showMessage('error', '请输入有效的邮箱地址');
            return;
        }

        const contact = {
            name: name,
            email: email,
            phone: phone,
            company: company,
            notes: notes,
            group: '默认分组'
        };

        addContact(contact).then(success => {
            if (success) {
                closeContactModal();
            }
        });
    };

    // 关闭联系人模态框
    window.closeContactModal = function() {
        const modal = document.getElementById('contact-modal');
        if (modal) {
            modal.remove();
        }
    };

    console.log('[TeamChat Email] 联系人管理增强功能已加载');

})();