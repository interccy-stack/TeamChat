/**
 * 邮箱管理功能增强集成 v0.5.1
 * 集成所有功能增强：联系人、回收站、草稿箱、同步、多邮箱支持
 */

(function() {
    'use strict';

    console.log('[TeamChat Email] 开始加载功能增强模块...');

    // 动态加载增强模块
    const enhancementModules = [
        { name: '联系人管理增强', file: '/plugins/team_chat/files/frontend/contact-enhancement.js' },
        { name: '回收站功能增强', file: '/plugins/team_chat/files/frontend/trash-enhancement.js' },
        { name: '草稿箱功能增强', file: '/plugins/team_chat/files/frontend/drafts-enhancement.js' },
        { name: '同步功能和UI增强', file: '/plugins/team_chat/files/frontend/sync-enhancement.js' },
        { name: '多邮箱管理功能', file: '/plugins/team_chat/files/frontend/multi-email-config.js' }
    ];

    // 加载单个模块
    function loadModule(module) {
        return new Promise((resolve, reject) => {
            const script = document.createElement('script');
            script.src = module.file;
            script.onload = () => {
                console.log(`[TeamChat Email] ${module.name} 加载成功`);
                resolve(module.name);
            };
            script.onerror = () => {
                console.error(`[TeamChat Email] ${module.name} 加载失败`);
                reject(module.name);
            };
            document.head.appendChild(script);
        });
    }

    // 初始化增强功能
    async function initializeEnhancements() {
        console.log('[TeamChat Email] 开始初始化功能增强...');

        try {
            // 并行加载所有模块
            const loadPromises = enhancementModules.map(module => loadModule(module));
            await Promise.all(loadPromises);

            console.log('[TeamChat Email] 所有功能增强模块加载完成');

            // 等待DOM加载完成后初始化UI
            if (document.readyState === 'loading') {
                document.addEventListener('DOMContentLoaded', initEnhancedUI);
            } else {
                initEnhancedUI();
            }

        } catch (error) {
            console.error('[TeamChat Email] 加载功能增强模块失败:', error);
        }
    }

    // 初始化增强UI
    function initEnhancedUI() {
        console.log('[TeamChat Email] 初始化增强UI...');

        // 增强同步UI
        if (window.enhanceSyncUI) {
            enhanceSyncUI();
        }

        // 绑定同步事件
        if (window.bindSyncEvents) {
            bindSyncEvents();
        }

        // 加载邮箱配置
        if (window.loadEmailConfigs) {
            loadEmailConfigs();
        }

        // 添加多邮箱选择器到工具栏
        addEmailConfigSelector();

        console.log('[TeamChat Email] 增强UI初始化完成');
    }

    // 添加邮箱配置选择器到工具栏
    function addEmailConfigSelector() {
        const toolbar = document.querySelector('.email-toolbar');
        if (!toolbar) return;

        // 检查是否已存在
        if (document.getElementById('config-selector-container')) {
            return;
        }

        // 创建配置选择器容器
        const configContainer = document.createElement('div');
        configContainer.id = 'config-selector-container';
        configContainer.className = 'config-selector-container';
        configContainer.innerHTML = `
            <div class="config-info" id="config-info" style="margin-right: 15px; font-size: 14px; color: #333;">
                <strong>当前邮箱:</strong> <span id="current-email">加载中...</span>
            </div>
            <select id="config-selector" class="config-selector" style="padding: 8px; border-radius: 4px; border: 1px solid #ddd; font-size: 14px;">
                <option value="">加载中...</option>
            </select>
            <button id="add-config-btn" class="email-btn" style="margin-left: 10px; padding: 8px 16px; background: #28a745; color: white; border: none; border-radius: 4px; cursor: pointer;">
                ➕ 添加邮箱
            </button>
        `;

        // 将配置选择器插入到工具栏
        toolbar.insertBefore(configContainer, toolbar.firstChild);

        // 绑定添加配置按钮事件
        const addConfigBtn = document.getElementById('add-config-btn');
        if (addConfigBtn && window.showAddEmailConfigModal) {
            addConfigBtn.onclick = function() {
                showAddEmailConfigModal();
            };
        }

        console.log('[TeamChat Email] 邮箱配置选择器已添加');
    }

    // 页面加载时自动初始化
    if (window.TeamChatEmailInitialized) {
        console.log('[TeamChat Email] 功能增强已初始化，跳过重复初始化');
    } else {
        window.TeamChatEmailInitialized = true;
        initializeEnhancements();
    }

    // 导出初始化函数供外部调用
    window.initTeamChatEmailEnhancements = initializeEnhancements;

    console.log('[TeamChat Email] 功能增强集成脚本加载完成');

})();