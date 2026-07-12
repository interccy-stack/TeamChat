// 草稿箱功能增强
(function() {
    'use strict';

    const API_BASE = 'http://127.0.0.1:18888/api/v1/email';

    // 编辑草稿
    window.editDraft = async function(id) {
        try {
            // 获取草稿详情
            const response = await fetch(`${API_BASE}/drafts/${id}`);
            const data = await response.json();

            if (data.success && data.draft) {
                const draft = data.draft;

                // 调用写邮件组件，预填充草稿内容
                if (window.EmailCompose) {
                    window.EmailCompose.showModal({
                        mode: 'edit',
                        draftId: draft.id,
                        to: draft.to_addr || '',
                        toName: draft.to_name || '',
                        subject: draft.subject || '',
                        body: draft.body || '',
                        cc: draft.cc || '',
                        bcc: draft.bcc || ''
                    });
                } else {
                    showMessage('error', '写邮件组件未加载');
                }
            } else {
                throw new Error(data.message || '获取草稿失败');
            }
        } catch (error) {
            console.error('编辑草稿失败:', error);
            showMessage('error', error.message || '编辑草稿失败');
        }
    };

    // 删除草稿
    window.deleteDraft = async function(id) {
        if (!confirm('确定要删除这个草稿吗？')) {
            return false;
        }

        try {
            const response = await fetch(`${API_BASE}/drafts/${id}`, {
                method: 'DELETE'
            });

            const data = await response.json();

            if (data.success) {
                showMessage('success', '草稿删除成功');
                loadDrafts(); // 刷新草稿列表
                updateStats(); // 更新统计信息
                return true;
            } else {
                throw new Error(data.message || '删除草稿失败');
            }
        } catch (error) {
            console.error('删除草稿失败:', error);
            showMessage('error', error.message || '删除草稿失败');
            return false;
        }
    };

    // 保存草稿
    window.saveDraft = async function(draftData) {
        try {
            const response = await fetch(`${API_BASE}/drafts`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(draftData)
            });

            const data = await response.json();

            if (data.success) {
                showMessage('success', '草稿保存成功');
                loadDrafts(); // 刷新草稿列表
                updateStats(); // 更新统计信息
                return data.draft_id;
            } else {
                throw new Error(data.message || '保存草稿失败');
            }
        } catch (error) {
            console.error('保存草稿失败:', error);
            showMessage('error', error.message || '保存草稿失败');
            return null;
        }
    };

    console.log('[TeamChat Email] 草稿箱功能增强已加载');

})();