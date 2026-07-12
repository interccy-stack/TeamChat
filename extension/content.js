// AI PRO - Chrome扩展
(function() {
    'use strict';
    
    // 防止重复加载
    if (window.teamChatAIExtension) return;
    window.teamChatAIExtension = true;
    
    // 检测是否在受限页面（只检查特殊协议）
    function isRestrictedPage() {
        var url = window.location.href;
        // chrome://, edge://, about:, data:, javascript:, blob: 等受限协议
        // 注意：file:// 和 http/https 都是允许的
        if (/^(chrome|edge|brave|about|javascript|blob):/i.test(url)) {
            console.log('[AI PRO] 受限页面:', url);
            return true;
        }
        return false;
    }
    
    // 如果是受限页面，只记录日志，不阻止加载（让扩展尝试运行）
    if (isRestrictedPage()) {
        console.log('[AI PRO] 当前页面可能受限，尝试加载...');
        // 不 return，让扩展尝试运行
    }
    
    const CONFIG = {
        API_BASE: 'http://localhost:8088',
        WS_URL: 'ws://localhost:8088'
    };
    
    let panel = null;
    let floatBtn = null;
    let token = null;
    let selectedAgent = 'default';
    let agentList = [];
    let panelMode = 'float'; // 'float' 或 'sidebar'
    let savedFloatPosition = { right: 20, top: 80 }; // 浮动模式位置记忆
    
    // ==================== 多语言系统 ====================
    var i18n = {
        'zh-CN': {
            title: 'AI PRO',
            subtitle: '智能网页助手',
            activated: '已激活',
            common: '常用',
            allAgents: '全部',
            defaultAgent: '默认智能体',
            screenshot: '截图',
            exportChat: '导出',
            summary: '总结',
            scrape: '抓取',
            copy: '复制',
            fillForm: '填表',
            darkMode: '暗黑模式',
            floatMode: '浮动模式',
            sidebarMode: '侧边栏模式',
            send: '发送',
            inputPlaceholder: '输入 / 查看快捷指令...',
            voiceInput: '语音输入',
            switchFloat: '切换为浮动',
            switchSidebar: '切换为侧边栏',
            minimized: '缩小',
            close: '关闭',
            switchAgent: '切换Agent',
            resize: '拖动缩放',
            tabMode: '打开标签页',
            welcome: '🤖 欢迎使用 AI PRO',
            welcomeDesc: '双击图标随时召唤我',
            start: '🚀 开始体验',
            skip: '⏭️ 跳过引导',
            ready: '✅ AI PRO 已就绪',
            switchTo: '已切换到: ',
            darkOn: '🌙 已开启暗黑模式',
            darkOff: '☀️ 已关闭暗黑模式',
            screenshotting: '📸 正在截图...',
            screenshotFail: '❌ 截图失败：',
            noExport: '💾 暂无聊天记录可导出',
            exported: '💾 已导出 ',
            scraping: '📊 正在分析页面数据...',
            noSelection: '📋 未选中文字，已抓取页面正文（前2000字）',
            copied: '📋 已复制选中内容（',
            copyFail: '❌ 复制失败，请手动复制',
            noForm: '📝 当前页面未检测到表单',
            sendFail: '发送失败，请检查服务是否运行',
            attach: '上传附件',
            fileAttached: '已上传文件: ',
            fileTooLarge: '文件过大（超过10MB）',
            fileTypeNotSupported: '不支持的文件类型',
            voiceMale: '男声',
            voiceFemale: '女声',
            voiceSwitch: '切换语音',
            videoSummary: '🎬 视频总结',
            videoAnalyzing: '🎬 正在分析视频…',
            videoSummary: '🎬 视频总结',
            videoAnalyzing: '🎬 正在分析视频…',
            greeting: '你好',
            morning: '早上好',
            afternoon: '下午好',
            evening: '晚上好',
            sessions: '会话列表',
            newSession: '新会话',
            rename: '重命名',
            renamePrompt: '请输入新标题：',
            delete: '删除',
            confirmDelete: '确定要删除这个会话吗？',
            yesterday: '昨天',
            toggleSessionList: '展开/收起会话列表',
            pageType: {
                article: '📄 文章',
                search: '🔍 搜索',
                social: '👥 社交',
                shopping: '🛒 购物',
                video: '🎬 视频',
                documentation: '📚 文档',
                code: '💻 代码',
                form: '📝 表单',
                general: '🌐 网页'
            }
        },
        'zh-TW': {
            title: 'AI PRO',
            subtitle: '智能網頁助手',
            activated: '已啟用',
            common: '常用',
            allAgents: '全部',
            defaultAgent: '默認智能體',
            screenshot: '截圖',
            exportChat: '導出',
            summary: '總結',
            scrape: '抓取',
            copy: '複製',
            fillForm: '填表',
            darkMode: '暗黑模式',
            floatMode: '浮動模式',
            sidebarMode: '側邊欄模式',
            send: '發送',
            inputPlaceholder: '輸入 / 查看快捷指令...',
            voiceInput: '語音輸入',
            switchFloat: '切換為浮動',
            switchSidebar: '切換為側邊欄',
            minimized: '縮小',
            close: '關閉',
            switchAgent: '切換Agent',
            resize: '拖動縮放',
            tabMode: '打開標籤頁',
            welcome: '🤖 歡迎使用 AI PRO',
            welcomeDesc: '雙擊圖標隨時呼喚我',
            start: '🚀 開始體驗',
            skip: '⏭️ 跳過引導',
            ready: '✅ AI PRO 已就緒',
            switchTo: '已切換到: ',
            darkOn: '🌙 已開啟暗黑模式',
            darkOff: '☀️ 已關閉暗黑模式',
            screenshotting: '📸 正在截圖...',
            screenshotFail: '❌ 截圖失敗：',
            noExport: '💾 暫無聊天記錄可導出',
            exported: '💾 已導出 ',
            scraping: '📊 正在分析頁面數據...',
            noSelection: '📋 未選中文字，已抓取頁面正文（前2000字）',
            copied: '📋 已複製選中內容（',
            copyFail: '❌ 複製失敗，請手動複製',
            noForm: '📝 當前頁面未檢測到表單',
            sendFail: '發送失敗，請確認服務是否運行',
            attach: '上傳附件',
            fileAttached: '已上傳檔案: ',
            fileTooLarge: '檔案過大（超過10MB）',
            fileTypeNotSupported: '不支援的檔案類型',
            voiceMale: '男聲',
            voiceFemale: '女聲',
            voiceSwitch: '切換語音',
            videoSummary: '🎬 視頻總結',
            videoAnalyzing: '🎬 正在分析視頻…',
            videoSummary: '🎬 視頻總結',
            videoAnalyzing: '🎬 正在分析視頻…',
            greeting: '你好',
            morning: '早上好',
            afternoon: '下午好',
            evening: '晚上好',
            pageType: {
                article: '📄 文章',
                search: '🔍 搜尋',
                social: '👥 社交',
                shopping: '🛒 購物',
                video: '🎬 影片',
                documentation: '📚 文檔',
                code: '💻 程式碼',
                form: '📝 表單',
                general: '🌐 網頁'
            }
        },
        'en-US': {
            title: 'AI PRO',
            subtitle: 'Smart Web Assistant',
            activated: 'Activated',
            common: 'Common',
            allAgents: 'All',
            defaultAgent: 'Default Agent',
            screenshot: 'Screenshot',
            exportChat: 'Export',
            summary: 'Summary',
            scrape: 'Scrape',
            copy: 'Copy',
            fillForm: 'Fill Form',
            darkMode: 'Dark Mode',
            floatMode: 'Float Mode',
            sidebarMode: 'Sidebar Mode',
            send: 'Send',
            inputPlaceholder: 'Type / for commands...',
            voiceInput: 'Voice Input',
            switchFloat: 'Switch to Float',
            switchSidebar: 'Switch to Sidebar',
            minimized: 'Minimize',
            close: 'Close',
            switchAgent: 'Switch Agent',
            resize: 'Drag to Resize',
            tabMode: 'Open in Tab',
            welcome: '🤖 Welcome to AI PRO',
            welcomeDesc: 'Double-click to summon me anytime',
            start: '🚀 Get Started',
            skip: '⏭️ Skip Tour',
            ready: '✅ AI PRO is Ready',
            switchTo: 'Switched to: ',
            darkOn: '🌙 Dark Mode On',
            darkOff: '☀️ Dark Mode Off',
            screenshotting: '📸 Taking screenshot...',
            screenshotFail: '❌ Screenshot failed: ',
            noExport: '💾 No chat history to export',
            exported: '💾 Exported ',
            scraping: '📊 Analyzing page data...',
            noSelection: '📋 No selection, captured page content (first 2000 chars)',
            copied: '📋 Copied selected content (',
            copyFail: '❌ Copy failed, please copy manually',
            noForm: '📝 No form detected on this page',
            sendFail: 'Send failed, please check if service is running',
            attach: 'Attach File',
            fileAttached: 'Attached file: ',
            fileTooLarge: 'File too large (over 10MB)',
            fileTypeNotSupported: 'File type not supported',
            voiceMale: 'Male Voice',
            voiceFemale: 'Female Voice',
            voiceSwitch: 'Switch Voice',
            videoSummary: '🎬 Video Summary',
            videoAnalyzing: '🎬 Analyzing video...',
            videoSummary: '🎬 Video Summary',
            videoAnalyzing: '🎬 Analyzing video...',
            greeting: 'Hello',
            morning: 'Good Morning',
            afternoon: 'Good Afternoon',
            evening: 'Good Evening',
            sessions: 'Sessions',
            newSession: 'New Session',
            rename: 'Rename',
            renamePrompt: 'Enter new title:',
            delete: 'Delete',
            confirmDelete: 'Are you sure to delete this session?',
            yesterday: 'Yesterday',
            toggleSessionList: 'Toggle Session List',
            pageType: {
                article: '📄 Article',
                search: '🔍 Search',
                social: '👥 Social',
                shopping: '🛒 Shopping',
                video: '🎬 Video',
                documentation: '📚 Docs',
                code: '💻 Code',
                form: '📝 Form',
                general: '🌐 Web'
            }
        },
        'ja-JP': {
            title: 'AI PRO',
            subtitle: 'スマートWebアシスタント',
            activated: '有効化',
            common: 'よく使う',
            allAgents: 'すべて',
            defaultAgent: 'デフォルトエージェント',
            screenshot: 'スクリーンショット',
            exportChat: 'エクスポート',
            summary: '要約',
            scrape: '抽出',
            copy: 'コピー',
            fillForm: 'フォーム入力',
            darkMode: 'ダークモード',
            floatMode: 'フロートモード',
            sidebarMode: 'サイドバーモード',
            send: '送信',
            inputPlaceholder: 'メッセージを入力...',
            voiceInput: '音声入力',
            switchFloat: 'フロートに切替',
            switchSidebar: 'サイドバーに切替',
            minimized: '最小化',
            close: '閉じる',
            switchAgent: 'Agent切替',
            resize: 'ドラッグで拡大縮小',
            tabMode: 'タブで開く',
            welcome: '🤖 AI PRO へようこそ',
            welcomeDesc: 'ダブルクリックでいつでも呼び出せます',
            start: '🚀 始める',
            skip: '⏭️ スキップ',
            ready: '✅ AI PRO 準備完了',
            switchTo: '切り替え先: ',
            darkOn: '🌙 ダークモードON',
            darkOff: '☀️ ダークモードOFF',
            screenshotting: '📸 スクリーンショット撮影中...',
            screenshotFail: '❌ スクリーンショット失敗: ',
            noExport: '💾 エクスポートするチャット履歴がありません',
            exported: '💾 エクスポート完了 ',
            scraping: '📊 ページデータ分析中...',
            noSelection: '📋 選択テキストなし、本文を取得しました（先頭2000字）',
            copied: '📋 選択内容をコピーしました（',
            copyFail: '❌ コピー失敗、手動でコピーしてください',
            noForm: '📝 ページにフォームがありません',
            sendFail: '送信失敗、サービスが起動しているか確認してください',
            attach: 'ファイル添付',
            fileAttached: '添付ファイル: ',
            fileTooLarge: 'ファイルが大きすぎます（10MB以上）',
            fileTypeNotSupported: 'サポートされていないファイル形式',
            voiceMale: '男性ボイス',
            voiceFemale: '女性ボイス',
            voiceSwitch: 'ボイス切替',
            videoSummary: '🎬 動画要約',
            videoAnalyzing: '🎬 動画を分析中…',
            videoSummary: '🎬 動画要約',
            videoAnalyzing: '🎬 動画を分析中…',
            greeting: 'こんにちは',
            morning: 'おはようございます',
            afternoon: 'こんにちは',
            evening: 'こんばんは',
            pageType: {
                article: '📄 記事',
                search: '🔍 検索',
                social: '👥 ソーシャル',
                shopping: '🛒 ショッピング',
                video: '🎬 動画',
                documentation: '📚 ドキュメント',
                code: '💻 コード',
                form: '📝 フォーム',
                general: '🌐 ウェブ'
            }
        }
    };
    
    // 检测系统语言
    function detectLanguage() {
        var lang = navigator.language || navigator.userLanguage || 'zh-CN';
        if (lang.startsWith('zh-CN') || lang === 'zh' || lang.startsWith('zh-Hans')) return 'zh-CN';
        if (lang.startsWith('zh-TW') || lang.startsWith('zh-HK') || lang.startsWith('zh-Hant')) return 'zh-TW';
        if (lang.startsWith('en')) return 'en-US';
        if (lang.startsWith('ja')) return 'ja-JP';
        return 'zh-CN';
    }
    
    var currentLang = localStorage.getItem('tc_lang') || detectLanguage();
    
    function t(key) {
        var keys = key.split('.');
        var val = i18n[currentLang];
        if (!val) val = i18n['zh-CN'];
        for (var i = 0; i < keys.length; i++) {
            if (val && val[keys[i]] !== undefined) {
                val = val[keys[i]];
            } else {
                // 回退到中文
                val = i18n['zh-CN'];
                for (var j = 0; j < keys.length; j++) {
                    val = val[keys[j]];
                }
                break;
            }
        }
        return val || key;
    }
    // ==================== 多语言系统结束 ====================
    
    // 页面上下文信息（智能感知）
    let pageContext = {
        url: window.location.href,
        title: document.title,
        domain: window.location.hostname,
        content: '',
        type: 'unknown',
        summary: ''
    };
    
    // 用户记忆
    let userMemory = {
        preferences: {},
        history: [],
        shortcuts: [],
        lastTopics: []
    };
    
    // 从扩展存储获取token和用户记忆
    chrome.storage.sync.get(['teamchat_token', 'userMemory'], function(result) {
        if (result.teamchat_token) {
            token = result.teamchat_token;
            if (result.userMemory) userMemory = result.userMemory;
            analyzePage();
            init();
        } else {
            // storage没Token → 先fetch再初始化
            if (result.userMemory) userMemory = result.userMemory;
            fetch('http://localhost:8088/api/plugins/team_chat/bookmarklet/token', {
                method: 'POST',
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify({user_id: 'extension_user'})
            })
            .then(function(r) { return r.json(); })
            .then(function(data) {
                var t = data.token || data.data || data.access_token || '';
                if (t) {
                    token = t;
                    chrome.storage.sync.set({teamchat_token: t});
                }
                analyzePage();
                init();
            })
            .catch(function() {
                // 后端不在线, 用空token初始化（显示引导页）
                token = '';
                analyzePage();
                init();
            });
        }
    });
    
    // 监听存储变化（Token在 popup 中保存后自动生效，无需刷新页面）
    chrome.storage.onChanged.addListener(function(changes, areaName) {
        if (areaName === 'sync' && changes.teamchat_token) {
            token = changes.teamchat_token.newValue;
            console.log('[AI PRO] Token已更新:', token ? '已激活' : '已清除');
            
            // 如果面板开着且显示的是引导页，自动切换到聊天
            if (panel && panel.style.display !== 'none' && token) {
                var chatArea = panel.querySelector('#tc-ai-chat');
                if (chatArea) {
                    var loginBox = chatArea.querySelector('#tc-login-box');
                    if (loginBox) {
                        chatArea.innerHTML = '';
                        // 恢复输入栏
                        var inputArea = panel.querySelector('#tc-ai-input-area');
                        if (inputArea) inputArea.style.display = '';
                        addMessage('system', '✅ AI PRO 已就绪');
                        showWelcomeWithMemory();
                    }
                }
            }
        }
    });
    
    function init() {
        try {
            // 读取保存的模式设置
            var savedMode = localStorage.getItem('tc_panel_mode');
            if (savedMode === 'sidebar' || savedMode === 'float') {
                panelMode = savedMode;
            }
            var savedDark = localStorage.getItem('tc_dark_mode');
            if (savedDark === 'true') isDarkMode = true;
            
            createFloatButton();
            createPanel();
            
            // 确保 panel 是有效 DOM 元素
            if (!panel || typeof panel.querySelector !== 'function') {
                console.error('[AI PRO] Panel creation failed, panel is invalid');
                return;
            }
            
            bindSmartFeatures();
        } catch(e) {
            console.error('[AI PRO] Init failed:', e.message);
        }
    }
    
    // 智能功能绑定（createPanel 内已绑定主流程，此处做补绑和校验）
    function bindSmartFeatures() {
        // 工具栏按钮已在 createPanel 中绑定，此处做二次确认
        if (typeof bindToolbarButtons === 'function') {
            try { bindToolbarButtons(); } catch(e) {}
        }
        // 确保 Agent 选择器监听（二次绑定防止 DOM 异步丢失）
        var agentSelect = document.getElementById('tc-agent-select');
        if (agentSelect && !agentSelect._smartBound) {
            agentSelect._smartBound = true;
            agentSelect.addEventListener('change', function() {
                selectedAgent = this.value;
                localStorage.setItem('tc_selected_agent', selectedAgent);
                var label = document.getElementById('tc-agent-label');
                if (label) label.textContent = this.options[this.selectedIndex].text;
            });
        }
        console.log('[AI PRO] Smart features bound');
    }
    
    // ==================== 智能感知 v2 ====================
    // 获取meta标签内容
    function getMeta(name) {
        var el = document.querySelector('meta[name="' + name + '"], meta[property="og:' + name + '"], meta[name="twitter:' + name + '"]');
        return el ? el.getAttribute('content') || '' : '';
    }
    
    // 获取页面主要内容（通用提取）
    function extractMainContent() {
        // 按优先级尝试多种选择器
        var selectors = [
            'article', '[role="main"]', 'main', '.post-content', '.article-content',
            '.RichContent', '#article_content', '.content', '#content', '.markdown-body',
            '.entry-content', '.post-body', '.article-body', '.page-content',
            '#read-content', '.main-content', '.document-content'
        ];
        for (var i = 0; i < selectors.length; i++) {
            var el = document.querySelector(selectors[i]);
            if (el && el.innerText.trim().length > 200) {
                return el.innerText.substring(0, 2000);
            }
        }
        return document.body.innerText.substring(0, 1200);
    }
    
    function analyzePage() {
        pageContext.url = window.location.href;
        pageContext.title = document.title;
        pageContext.domain = window.location.hostname;
        
        // 使用meta标签辅助判断
        var ogType = getMeta('type') || '';
        var ogTitle = getMeta('title') || '';
        var ogDesc = getMeta('description') || '';
        var ogSite = getMeta('site_name') || '';
        var keywords = getMeta('keywords') || '';
        
        var url = pageContext.url;
        var domain = pageContext.domain;
        var bodyText = document.body.innerText.substring(0, 500).toLowerCase();
        
        // 智能判断页面类型（从精确到通用）
        if (domain.includes('github.com') || domain.includes('gitlab.com') || domain.includes('gitee.com')) {
            pageContext.type = 'code';
            pageContext.content = extractCodeContent();
            pageContext.summary = ogDesc || '代码仓库 - ' + (ogTitle || pageContext.title);
        } else if (domain.includes('baidu.com') || domain.includes('google.com') || domain.includes('bing.com') || domain.includes('sogou.com')) {
            pageContext.type = 'search';
            pageContext.content = extractSearchContent();
            pageContext.summary = ogDesc || '搜索结果页面';
        } else if (domain.includes('youtube.com') || domain.includes('bilibili.com') || domain.includes('douyin.com') || domain.includes('ixigua.com') || domain.includes('tudou.com') || domain.includes('youku.com')) {
            pageContext.type = 'video';
            pageContext.content = extractVideoContent();
            pageContext.summary = ogDesc || '视频 - ' + (ogTitle || pageContext.title);
        } else if (domain.includes('taobao.com') || domain.includes('jd.com') || domain.includes('amazon.com') || domain.includes('pinduoduo.com') || domain.includes('tmall.com') || domain.includes('1688.com') || domain.includes('dianping.com') || domain.includes('meituan.com')) {
            pageContext.type = 'shopping';
            pageContext.content = extractShoppingContent();
            pageContext.summary = ogDesc || '购物 - ' + (ogTitle || pageContext.title);
        } else if (domain.includes('mail') || domain.includes('email') || domain.includes('163.com') || domain.includes('qq.com') || domain.includes('outlook') || domain.includes('gmail') || domain.includes('mail.google')) {
            // 只在确实有邮件UI特征时才判断为邮件页面
            if (bodyText.includes('收件箱') || bodyText.includes('inbox') || bodyText.includes('发件') || bodyText.includes('compose') || bodyText.includes('subject')) {
                pageContext.type = 'email';
                pageContext.content = extractEmailContent();
                pageContext.summary = '邮件页面 - ' + (ogTitle || pageContext.title);
            } else {
                pageContext.type = 'general';
                pageContext.content = extractGeneralContent();
                pageContext.summary = ogDesc || pageContext.title;
            }
        } else if (domain.includes('zhihu.com') || domain.includes('csdn.net') || domain.includes('juejin.cn') || domain.includes('medium.com') || domain.includes('segmentfault.com') || domain.includes('v2ex.com') || domain.includes('oschina.net') || domain.includes('infoq.cn') || domain.includes('51cto.com')) {
            pageContext.type = 'article';
            pageContext.content = extractArticleContent();
            pageContext.summary = ogDesc || '技术文章 - ' + (ogTitle || pageContext.title);
        } else if (domain.includes('weixin') || domain.includes('mp.weixin') || domain.includes('sohu.com') || domain.includes('163.com') || domain.includes('sina.com') || domain.includes('thepaper.cn') || domain.includes('huxiu.com') || domain.includes('36kr.com') || domain.includes('geekpark.net') || domain.includes('ifanr.com') || domain.includes('sspai.com')) {
            pageContext.type = 'article';
            pageContext.content = extractArticleContent();
            pageContext.summary = ogDesc || '资讯文章 - ' + (ogTitle || pageContext.title);
        } else if (domain.includes('weibo.com') || domain.includes('tieba.baidu.com') || domain.includes('xiaohongshu.com') || domain.includes('douban.com') || domain.includes('zhihu.com')) {
            pageContext.type = 'social';
            pageContext.content = extractGeneralContent();
            pageContext.summary = ogDesc || '社交 - ' + (ogTitle || pageContext.title);
        } else if (domain.includes('readthedocs') || domain.includes('docs.') || domain.includes('documentation') || url.includes('/docs/') || url.includes('/wiki/') || url.includes('/manual/') || url.includes('/guide/') || url.includes('/tutorial/')) {
            pageContext.type = 'documentation';
            pageContext.content = extractDocumentationContent();
            pageContext.summary = ogDesc || '文档 - ' + (ogTitle || pageContext.title);
        } else if (ogType === 'article' || ogType === 'news' || ogType === 'blog' || keywords.includes('article') || keywords.includes('news') || keywords.includes('blog')) {
            pageContext.type = 'article';
            pageContext.content = extractArticleContent();
            pageContext.summary = ogDesc || (ogTitle || pageContext.title);
        } else if (ogType === 'product' || ogType === 'website.product') {
            pageContext.type = 'shopping';
            pageContext.content = extractShoppingContent();
            pageContext.summary = ogDesc || (ogTitle || pageContext.title);
        } else if (ogType === 'video' || ogType === 'video.movie' || ogType === 'video.episode') {
            pageContext.type = 'video';
            pageContext.content = extractVideoContent();
            pageContext.summary = ogDesc || (ogTitle || pageContext.title);
        } else {
            pageContext.type = 'general';
            pageContext.content = extractGeneralContent();
            pageContext.summary = ogDesc || pageContext.title;
        }
        
        // 补充原始meta信息
        pageContext.meta = { title: ogTitle, desc: ogDesc, site: ogSite };
        
        console.log('[AI PRO] 智能感知:', pageContext.type, '|', pageContext.title.substring(0, 40));
    }
    
    // 页面类型对应的图标
    function getPageTypeIcon(type) {
        var icons = {
            'code': '💻',
            'search': '🔍',
            'article': '📄',
            'email': '✉️',
            'video': '🎬',
            'shopping': '🛒',
            'social': '💬',
            'documentation': '📖',
            'general': '🌐'
        };
        return icons[type] || '🌐';
    }
    
    // 更新页面类型标签
    function updatePageTypeBadge() {
        var badge = document.getElementById('tc-page-type-badge');
        if (badge) {
            badge.innerHTML = getPageTypeIcon(pageContext.type) + ' ' + pageContext.type;
        }
    }
    
    // 监听URL变化（SPA单页应用场景）
    var lastUrl = location.href;
    setInterval(function() {
        if (location.href !== lastUrl) {
            lastUrl = location.href;
            console.log('[AI PRO] 页面URL变化，重新感知');
            analyzePage();
            updatePageTypeBadge();
        }
    }, 2000);
    
    function extractCodeContent() {
        var codeBlocks = document.querySelectorAll('pre, code, .blob-code, .highlight, .file-content');
        var content = '';
        codeBlocks.forEach(function(block, i) {
            if (i < 3) content += block.textContent.substring(0, 500) + '\n---\n';
        });
        if (content.length < 100) {
            content = extractMainContent();
        }
        return content;
    }
    
    function extractSearchContent() {
        var searchInput = document.querySelector('input[name="q"], input[name="wd"], #kw, .search-input, input[type="search"]');
        var query = searchInput ? searchInput.value : '';
        var results = document.querySelectorAll('.result, .c-container, .g, .search-result, .item-root');
        var content = '搜索关键词: ' + query + '\n\n';
        results.forEach(function(r, i) {
            if (i < 5) content += (i+1) + '. ' + r.innerText.substring(0, 200) + '\n';
        });
        if (content.length < 50) content = extractMainContent();
        return content;
    }
    
    function extractArticleContent() {
        var content = extractMainContent();
        // 尝试获取文章作者和发布时间
        var author = document.querySelector('[rel="author"], .author, .writer, .byline, meta[name="author"]');
        var date = document.querySelector('time, .date, .publish-date, .post-date, meta[property="article:published_time"]');
        var meta = '';
        if (author) meta += '作者: ' + (author.textContent || author.getAttribute('content') || '') + '\n';
        if (date) meta += '时间: ' + (date.textContent || date.getAttribute('datetime') || date.getAttribute('content') || '') + '\n';
        return meta + '\n' + content;
    }
    
    function extractEmailContent() {
        var subject = document.querySelector('[data-test-id="subject"], .subject, .mail_subject, h2, .msg-subject');
        var body = document.querySelector('[data-test-id="message-body"], .email-body, .mail_content, .message-content, .msg-body, .mail-message');
        var from = document.querySelector('.from, .sender, .mail_from, [data-test-id="from"]');
        var content = '';
        if (from) content += '发件人: ' + from.textContent.substring(0, 100) + '\n';
        content += '主题: ' + (subject ? subject.textContent.substring(0, 200) : '') + '\n';
        content += '\n内容:\n' + (body ? body.textContent.substring(0, 1000) : extractMainContent().substring(0, 800));
        return content;
    }
    
    function extractVideoContent() {
        var title = document.querySelector('h1, .video-title, #viewbox_report, .video-info-title');
        var desc = document.querySelector('.video-desc, #desc_textarea, .desc-info-text, .video-description, .intro');
        var stats = document.querySelector('.video-stats, .video-count, .play-count, .stat');
        var content = '视频标题: ' + (title ? title.textContent.substring(0, 200) : '') + '\n';
        if (stats) content += '播放数据: ' + stats.textContent.substring(0, 100) + '\n';
        content += '\n描述:\n' + (desc ? desc.textContent.substring(0, 500) : extractMainContent().substring(0, 400));
        return content;
    }
    
    function extractShoppingContent() {
        var title = document.querySelector('h1, .sku-name, .product-title, .item-name, .goods-title');
        var price = document.querySelector('.price, .p-price, .notrans_price, .sale-price, .current-price, [class*="price"]');
        var desc = document.querySelector('.description, .detail, .product-detail, .item-desc, .goods-desc, [class*="intro"]');
        var content = '商品: ' + (title ? title.textContent.substring(0, 200) : '') + '\n';
        if (price) content += '价格: ' + price.textContent.trim().substring(0, 50) + '\n';
        content += '\n描述:\n' + (desc ? desc.textContent.substring(0, 500) : extractMainContent().substring(0, 400));
        return content;
    }
    
    function extractDocumentationContent() {
        var mainEl = document.querySelector('article, .document, .doc-content, .content, .markdown-body, .prose, [role="main"]');
        var toc = document.querySelector('.toc, .sidebar, .nav, .menu, [class*="sidebar"]');
        var content = '';
        if (toc) content += '文档目录结构:\n' + toc.innerText.substring(0, 300) + '\n\n';
        content += '正文:\n' + (mainEl ? mainEl.innerText.substring(0, 2000) : extractMainContent());
        return content;
    }
    
// ==================== 视频页检测 ====================
    function isVideoPage() {
        var url = window.location.href;
        return url.indexOf('youtube.com/watch') !== -1 || url.indexOf('bilibili.com/video') !== -1;
    }
    
    function extractVideoInfo() {
        var url = window.location.href;
        if (url.indexOf('youtube.com') !== -1) {
            return {
                platform: 'YouTube',
                title: (document.querySelector('h1.ytd-video-primary-info-renderer') || 
                        document.querySelector('h1 yt-formatted-string.ytd-watch-metadata') ||
                        document.querySelector('h1.style-scope.ytd-watch-metadata'))?.textContent?.trim() || '',
                channel: (document.querySelector('#owner yt-formatted-string a') ||
                          document.querySelector('ytd-channel-name a') ||
                          document.querySelector('#channel-name a'))?.textContent?.trim() || '',
                description: (document.querySelector('#description-inline-expander yt-attributed-string') ||
                              document.querySelector('ytd-text-inline-expander yt-attributed-string span') ||
                              document.querySelector('#description'))?.textContent?.trim()?.substring(0, 2000) || ''
            };
        }
        if (url.indexOf('bilibili.com') !== -1) {
            var tags = [];
            document.querySelectorAll('.tag-link,.video-tag').forEach(function(el) { tags.push(el.textContent.trim()); });
            return {
                platform: 'Bilibili',
                title: (document.querySelector('h1.video-title') || 
                        document.querySelector('.video-info-title'))?.textContent?.trim() || '',
                channel: (document.querySelector('.up-name') || 
                          document.querySelector('.up-info .name'))?.textContent?.trim() || '',
                description: (document.querySelector('.video-desc .desc-info-text') ||
                              document.querySelector('.desc-info-text') ||
                              document.querySelector('#v_desc'))?.textContent?.trim()?.substring(0, 2000) || '',
                tags: tags.join(', ')
            };
        }
        return null;
    }
    
    function summarizeVideo() {
        var info = extractVideoInfo();
        if (!info) {
            addMessage('system', '⚠ 未识别到视频页面（支持 YouTube / Bilibili）');
            return;
        }
        addMessage('system', t('videoAnalyzing') + ' [' + info.platform + '] ' + info.title);
                var prompt = '请总结以下' + info.platform + '视频的核心要点（分点列出）：\n\n' +
            '【标题】' + info.title + '\n' +
            '【频道】' + info.channel + '\n' +
            '【简介】' + (info.description || '(无)') + '\n' +
            (info.tags ? '【标签】' + info.tags + '\n' : '') + '\n请用以下格式回复:\n' +
            '## 视频要点\n' +
            '1. ...\n2. ...\n\n## 一句话总结\n...';

        sendMessageToAI(prompt);
    }
    
    function extractGeneralContent() {
        return extractMainContent();
    }
    
    // ==================== 视频页检测 ====================
    function isVideoPage() {
        var url = window.location.href;
        return url.indexOf('youtube.com/watch') !== -1 || url.indexOf('bilibili.com/video') !== -1;
    }
    
    function extractVideoInfo() {
        var url = window.location.href;
        if (url.indexOf('youtube.com') !== -1) {
            return {
                platform: 'YouTube',
                title: (document.querySelector('h1.ytd-video-primary-info-renderer') || 
                        document.querySelector('h1 yt-formatted-string.ytd-watch-metadata') ||
                        document.querySelector('h1.style-scope.ytd-watch-metadata'))?.textContent?.trim() || '',
                channel: (document.querySelector('#owner yt-formatted-string a') ||
                          document.querySelector('ytd-channel-name a') ||
                          document.querySelector('#channel-name a'))?.textContent?.trim() || '',
                description: (document.querySelector('#description-inline-expander yt-attributed-string') ||
                              document.querySelector('ytd-text-inline-expander yt-attributed-string span') ||
                              document.querySelector('#description'))?.textContent?.trim()?.substring(0, 2000) || ''
            };
        }
        if (url.indexOf('bilibili.com') !== -1) {
            var tags = [];
            document.querySelectorAll('.tag-link,.video-tag').forEach(function(el) { tags.push(el.textContent.trim()); });
            return {
                platform: 'Bilibili',
                title: (document.querySelector('h1.video-title') || 
                        document.querySelector('.video-info-title'))?.textContent?.trim() || '',
                channel: (document.querySelector('.up-name') || 
                          document.querySelector('.up-info .name'))?.textContent?.trim() || '',
                description: (document.querySelector('.video-desc .desc-info-text') ||
                              document.querySelector('.desc-info-text') ||
                              document.querySelector('#v_desc'))?.textContent?.trim()?.substring(0, 2000) || '',
                tags: tags.join(', ')
            };
        }
        return null;
    }
    
    function summarizeVideo() {
        var info = extractVideoInfo();
        if (!info) {
            addMessage('system', '⚠ 未识别到视频页面（支持 YouTube / Bilibili）');
            return;
        }
        addMessage('system', t('videoAnalyzing') + ' [' + info.platform + '] ' + info.title);
        var prompt = '请总结以下' + info.platform + '视频的核心要点（分点列出）：\n\n' +
            '【标题】' + info.title + '\n' +
            '【频道】' + info.channel + '\n' +
            '【描述】' + (info.description || '(无)') + '\n' +
            (info.tags ? '【标签】' + info.tags + '\n' : '');
        sendMessage(prompt);
    }
    
    // 创建浮动按钮
    function createFloatButton() {
        console.log('[AI PRO] Creating float button...');
        floatBtn = document.createElement('div');
        floatBtn.id = 'tc-ai-float-btn';
        var iconUrl = chrome.runtime.getURL('icon128_v2.png') + '?t=' + Date.now();
        floatBtn.style.backgroundImage = 'url(' + iconUrl + ')';
        floatBtn.title = 'AI PRO - 双击打开';
        
        // 从存储读取位置
        chrome.storage.sync.get(['btnPosition'], function(result) {
            const pos = result.btnPosition || { right: 20, top: 20 };
            floatBtn.style.right = pos.right + 'px';
            floatBtn.style.top = pos.top + 'px';
        });
        
        // 双击打开/关闭面板
        floatBtn.addEventListener('dblclick', function(e) {
            console.log('[AI PRO] Float button double-clicked');
            togglePanel();
        });
        
        // 单击显示快捷菜单
        floatBtn.addEventListener('click', function(e) {
            e.stopPropagation();
            showQuickMenu();
        });
        
        if (document.body) {
            document.body.appendChild(floatBtn);
            console.log('[AI PRO] Float button added to body');
        } else {
            console.error('[AI PRO] document.body not ready!');
        }
        
        // 拖拽功能
        makeDraggable(floatBtn);
    }
    
    // ==================== 会话历史管理 ====================
    var sessions = []; // 会话列表
    var currentSessionId = null; // 当前会话ID
    var isSessionListCollapsed = false; // 会话列表是否折叠
    
    // 生成唯一ID
    function generateId() {
        return Date.now().toString(36) + Math.random().toString(36).substr(2);
    }
    
    // 生成会话标题（基于第一条消息）
    function generateSessionTitle(messages) {
        if (!messages || messages.length === 0) return t('newSession');
        var firstUserMsg = null;
        for (var i = 0; i < messages.length; i++) {
            if (messages[i].role === 'user') {
                firstUserMsg = messages[i].content;
                break;
            }
        }
        if (!firstUserMsg) return t('newSession');
        // 截取前20字
        return firstUserMsg.substring(0, 20) + (firstUserMsg.length > 20 ? '...' : '');
    }
    
    // 保存会话到存储
    function saveSession(session) {
        chrome.storage.local.get(['aiProSessions'], function(result) {
            var sessions = result.aiProSessions || [];
            // 查找并更新
            var found = false;
            for (var i = 0; i < sessions.length; i++) {
                if (sessions[i].id === session.id) {
                    sessions[i] = session;
                    found = true;
                    break;
                }
            }
            if (!found) {
                sessions.unshift(session); // 新会话放前面
            }
            // 最多保存50个会话
            if (sessions.length > 50) {
                sessions = sessions.slice(0, 50);
            }
            chrome.storage.local.set({ aiProSessions: sessions });
        });
    }
    
    // 加载会话列表
    function loadSessions(callback) {
        chrome.storage.local.get(['aiProSessions'], function(result) {
            var sessions = result.aiProSessions || [];
            if (callback) callback(sessions);
        });
    }
    
    // 删除会话
    function deleteSession(sessionId) {
        chrome.storage.local.get(['aiProSessions'], function(result) {
            var sessions = result.aiProSessions || [];
            var newSessions = sessions.filter(function(s) { return s.id !== sessionId; });
            
            // 如果删除的是当前会话，清除当前会话ID
            if (sessionId === currentSessionId) {
                currentSessionId = null;
                chrome.storage.local.remove(['aiProCurrentSession']);
            }
            
            chrome.storage.local.set({ aiProSessions: newSessions }, function() {
                renderSessionList();
            });
        });
    }
    
    // 重命名会话
    function renameSession(sessionId, newTitle) {
        chrome.storage.local.get(['aiProSessions'], function(result) {
            var sessions = result.aiProSessions || [];
            for (var i = 0; i < sessions.length; i++) {
                if (sessions[i].id === sessionId) {
                    sessions[i].title = newTitle;
                    break;
                }
            }
            chrome.storage.local.set({ aiProSessions: sessions }, function() {
                renderSessionList();
            });
        });
    }
    
    // 创建新会话
    function createNewSession() {
        // 限制最多10条会话，超过时删除最旧的
        chrome.storage.local.get(['aiProSessions'], function(result) {
            var sessions = result.aiProSessions || [];
            if (sessions.length >= 10) {
                // 按更新时间排序，删除最旧的（第一个）
                sessions.sort(function(a, b) { return a.updateTime - b.updateTime; });
                sessions = sessions.slice(1); // 保留第2个及以后
            }
            chrome.storage.local.set({ aiProSessions: sessions }, function() {
                // 创建新会话
                var session = {
                    id: generateId(),
                    agentId: selectedAgent,
                    agentName: getAgentNameById(selectedAgent),
                    title: t('newSession'),
                    messages: [],
                    createTime: Date.now(),
                    updateTime: Date.now(),
                    pageContext: {
                        url: pageContext.url,
                        title: pageContext.title,
                        type: pageContext.type
                    }
                };
                currentSessionId = session.id;
                saveSession(session);
                renderSessionList();
            });
        });
        return;
        // 清空聊天区
        var chatArea = panel.querySelector('#tc-ai-chat');
        if (chatArea) chatArea.innerHTML = '';
        // 显示欢迎语
        showWelcomeWithMemory();
        return session;
    }
    
    // 切换到指定会话
    function switchSession(sessionId) {
        currentSessionId = sessionId;
        // 从存储加载
        chrome.storage.local.get(['aiProSessions'], function(result) {
            var sessions = result.aiProSessions || [];
            var session = null;
            for (var i = 0; i < sessions.length; i++) {
                if (sessions[i].id === sessionId) {
                    session = sessions[i];
                    break;
                }
            }
            if (session) {
                // 恢复Agent
                selectedAgent = session.agentId || 'default';
                updateAgentSelect();
                // 恢复消息
                var chatArea = panel.querySelector('#tc-ai-chat');
                if (chatArea) {
                    chatArea.innerHTML = '';
                    if (session.messages && session.messages.length > 0) {
                        for (var i = 0; i < session.messages.length; i++) {
                            var msg = session.messages[i];
                            renderMessage(msg.role, msg.content, msg.isStream);
                        }
                    }
                }
                // 更新标题
                updateSessionTitle(session.title);
            }
            renderSessionList();
        });
    }
    
    // 获取Agent名称
    function getAgentNameById(agentId) {
        for (var i = 0; i < agentList.length; i++) {
            if (agentList[i].id === agentId) return agentList[i].name;
        }
        return t('defaultAgent');
    }
    
    // 更新Agent选择器显示
    function updateAgentSelect() {
        var sel = panel ? panel.querySelector('#tc-agent-select') : document.getElementById('tc-agent-select');
        if (!sel) return;
        sel.value = selectedAgent;
        var label = document.getElementById('tc-agent-label');
        if (label) {
            var idx = sel.selectedIndex;
            label.textContent = idx >= 0 ? sel.options[idx].text : selectedAgent;
        }
    }
    
    // 渲染会话列表（简化版 - 彩色圆点表示时间）
    function renderSessionList() {
        var listEl = panel.querySelector('#tc-session-list');
        if (!listEl) return;
        
        // 清空现有内容（防止重复）
        listEl.innerHTML = '';
        
        loadSessions(function(sessions) {
            var html = '';
            for (var i = 0; i < sessions.length; i++) {
                var s = sessions[i];
                var isActive = s.id === currentSessionId;
                var dotColor = getTimeDotColor(s.updateTime);
                var title = escapeHtml(s.title || t('newSession'));
                // 60px宽度只显示圆点，标题放在tooltip中
                html += '<div class="tc-session-item ' + (isActive ? 'tc-session-active' : '') + '" data-id="' + s.id + '" title="' + title + '">' +
                    '<span class="tc-session-dot" style="background:' + dotColor + '"></span>' +
                    '</div>';
            }
            listEl.innerHTML = html;
            
            // 绑定点击事件（点击切换会话）
            var items = listEl.querySelectorAll('.tc-session-item');
            for (var i = 0; i < items.length; i++) {
                (function(item) {
                    var id = item.getAttribute('data-id');
                    item.addEventListener('click', function() {
                        switchSession(id);
                    });
                })(items[i]);
            }
        });
    }
    
    // 格式化时间
    function formatTime(timestamp) {
        if (!timestamp) return '';
        var d = new Date(timestamp);
        var now = new Date();
        var diff = now - d;
        // 今天
        if (diff < 86400000 && d.getDate() === now.getDate()) {
            return d.getHours().toString().padStart(2, '0') + ':' + d.getMinutes().toString().padStart(2, '0');
        }
        // 昨天
        if (diff < 172800000 && d.getDate() === now.getDate() - 1) {
            return t('yesterday') + ' ' + d.getHours().toString().padStart(2, '0') + ':' + d.getMinutes().toString().padStart(2, '0');
        }
        // 更早
        return (d.getMonth() + 1) + '/' + d.getDate();
    }
    
    // 获取时间圆点颜色（今天=绿色，昨天=黄色，更早=灰色）
    function getTimeDotColor(timestamp) {
        if (!timestamp) return '#999';
        var d = new Date(timestamp);
        var now = new Date();
        var diff = now - d;
        // 今天 - 绿色
        if (diff < 86400000 && d.getDate() === now.getDate()) {
            return '#4caf50';
        }
        // 昨天 - 黄色
        if (diff < 172800000 && d.getDate() === now.getDate() - 1) {
            return '#ff9800';
        }
        // 更早 - 灰色
        return '#9e9e9e';
    }
    
    // 更新会话标题显示
    function updateSessionTitle(title) {
        var titleEl = panel.querySelector('#tc-session-title-display');
        if (titleEl) titleEl.textContent = title || t('newSession');
    }
    
    // 渲染消息（用于恢复历史）
    function renderMessage(role, content, isStream) {
        // 复用 addMessage 逻辑，但不保存到存储
        var chatArea = panel.querySelector('#tc-ai-chat');
        if (!chatArea) return;
        
        var msgDiv = document.createElement('div');
        msgDiv.className = 'tc-msg tc-msg-' + role;
        
        var bubble = document.createElement('div');
        bubble.className = 'tc-bubble';
        
        if (role === 'assistant') {
            // AI消息处理（简化版）
            bubble.innerHTML = '<div class="tc-ai-message">' + escapeHtml(content) + '</div>';
        } else {
            bubble.innerHTML = '<div class="tc-user-message">' + escapeHtml(content) + '</div>';
        }
        
        msgDiv.appendChild(bubble);
        chatArea.appendChild(msgDiv);
        chatArea.scrollTop = chatArea.scrollHeight;
    }
    
    // 保存当前消息到会话
    function saveCurrentMessage(role, content) {
        if (!currentSessionId) {
            createNewSession();
        }
        chrome.storage.local.get(['aiProSessions'], function(result) {
            var sessions = result.aiProSessions || [];
            var session = null;
            var idx = -1;
            for (var i = 0; i < sessions.length; i++) {
                if (sessions[i].id === currentSessionId) {
                    session = sessions[i];
                    idx = i;
                    break;
                }
            }
            if (session) {
                if (!session.messages) session.messages = [];
                session.messages.push({
                    role: role,
                    content: content,
                    time: Date.now()
                });
                session.updateTime = Date.now();
                // 更新标题（如果是第一条用户消息）
                if (role === 'user' && session.messages.length <= 2) {
                    session.title = generateSessionTitle(session.messages);
                }
                sessions[idx] = session;
                chrome.storage.local.set({ aiProSessions: sessions });
                renderSessionList();
                updateSessionTitle(session.title);
            }
        });
    }
    
    // 创建面板（增强版 - 带会话列表）
    function createPanel() {
        console.log('[AI PRO] Creating panel...');
        panel = document.createElement('div');
        panel.id = 'tc-ai-panel';
        panel.style.display = 'none';
        panel.style.width = '380px';
        panel.style.height = '500px';
        
        var iconUrl = chrome.runtime.getURL('icon128_v2.png');
        
        // 面板HTML结构（带左侧会话列表）
        panel.innerHTML = `
            <div id="tc-session-sidebar">
                <div id="tc-session-header">
                    <button id="tc-btn-new-session" title="${t('newSession')}">+</button>
                </div>
                <div id="tc-session-list"></div>
            </div>
            <div id="tc-session-toggle" title="${t('toggleSessionList')}">📑</div>
            <div id="tc-main-area">
                <div id="tc-ai-header">
                    <div style="display:flex;align-items:center;gap:8px;flex:1;">
                        <img src="${iconUrl}" style="width:20px;height:20px;border-radius:50%;object-fit:cover;">
                        <span style="font-weight:bold;font-size:14px;">AI PRO</span>
                        <div id="tc-agent-selector" title="${t('switchAgent')}">
                            <select id="tc-agent-select"></select>
                        </div>
                    </div>
                    <div style="display:flex;align-items:center;gap:4px;">
                        <button id="tc-btn-mode" title="${t('switchSidebar')}">📌</button>
                        <button id="tc-ai-minimize" title="${t('minimized')}" style="background:rgba(255,255,255,0.3);border:2px solid rgba(255,255,255,0.5);color:white;font-size:16px;cursor:pointer;padding:4px 8px;border-radius:6px;line-height:1;min-width:32px;min-height:32px;display:inline-flex;align-items:center;justify-content:center;">─</button>
                        <button id="tc-ai-close" title="${t('close')}">✕</button>
                    </div>
                </div>
                <div id="tc-quick-toolbar">
                <button class="tc-tool-btn" id="tc-btn-dark" title="${t('darkMode')}">🌙</button>
                <button class="tc-tool-btn" id="tc-btn-screenshot" title="${t('screenshot')}">📸</button>
                <button class="tc-tool-btn" id="tc-btn-export" title="${t('exportChat')}">💾</button>
                <button class="tc-tool-btn" id="tc-btn-summary" title="${t('summary')}">📋</button>
                <button class="tc-tool-btn" id="tc-btn-scrape" title="${t('scrape')}">📊</button>
                <button class="tc-tool-btn" id="tc-btn-video" title="${t('videoSummary')}">🎬</button>
                <button class="tc-tool-btn" id="tc-btn-copy" title="${t('copy')}">📋</button>
                <button class="tc-tool-btn" id="tc-btn-fill" title="${t('fillForm')}">📝</button>
                </div>
            <div id="tc-ai-chat"></div>
            <div id="tc-command-hints" style="display:none;"></div>
            <div id="tc-ai-input-area">
                <input type="text" id="tc-ai-input" placeholder="${t('inputPlaceholder')}">
                <button id="tc-ai-attach-btn" title="${t('attach')}">📎</button>
                <button id="tc-ai-voice-btn" title="${t('voiceInput')}">🎤</button>
                <button id="tc-ai-voice-gender" title="${t('voiceSwitch')}">👩</button>
                <button id="tc-ai-send">${t('send')}</button>
            </div>
            <div id="tc-resize-handle" title="${t('resize')}"></div>
        `;
        
        if (document.body) {
            document.body.appendChild(panel);
            console.log('[AI PRO] Panel added to body, z-index:', panel.style.zIndex);
        } else {
            console.error('[AI PRO] document.body not ready when creating panel!');
            // 延迟添加
            setTimeout(function() {
                if (document.body) {
                    document.body.appendChild(panel);
                    console.log('[AI PRO] Panel added to body (delayed)');
                }
            }, 1000);
        }
        
        // ESC关闭面板（侧边栏模式恢复页面）
        document.addEventListener('keydown', function(e) {
            if (e.key === 'Escape' && panel && panel.style.display !== 'none') {
                panel.style.display = 'none';
                if (panelMode === 'sidebar') {
                    document.body.style.marginRight = '';
                }
            }
        });
        
        // 面板头部拖动（仅浮动模式有效）
        (function makePanelDraggable() {
            var header = panel.querySelector('#tc-ai-header');
            if (!header) return;
            var isDrag = false, sx, sy, sRight, sTop;
            header.style.cursor = 'move';
            header.addEventListener('mousedown', function(e) {
                // 侧边栏模式禁止拖动
                if (panelMode === 'sidebar') return;
                if (e.target.id === 'tc-ai-close' || e.target.closest('#tc-ai-close')) return;
                if (e.target.id === 'tc-ai-minimize' || e.target.closest('#tc-ai-minimize')) return;
                isDrag = true;
                sx = e.clientX; sy = e.clientY;
                sRight = parseInt(panel.style.right) || 20;
                sTop = parseInt(panel.style.top) || 80;
                panel.style.transition = 'none';
                e.preventDefault();
            });
            document.addEventListener('mousemove', function(e) {
                if (!isDrag) return;
                panel.style.right = (sRight - (e.clientX - sx)) + 'px';
                panel.style.top = (sTop + (e.clientY - sy)) + 'px';
            });
            document.addEventListener('mouseup', function() {
                if (isDrag) {
                    isDrag = false;
                    panel.style.transition = '';
                    var pos = {
                        right: parseInt(panel.style.right) || 20,
                        top: parseInt(panel.style.top) || 80
                    };
                    savedFloatPosition = pos;
                    chrome.storage.sync.set({panelPosition: pos});
                }
            });
        })();
        
        // 从存储恢复面板位置、尺寸和模式
        chrome.storage.sync.get(['panelPosition', 'panelSize', 'panelMode'], function(result) {
            // 恢复模式（优先）
            if (result.panelMode) {
                panelMode = result.panelMode;
            }
            
            // 恢复浮动位置到变量（供模式切换时使用）
            if (result.panelPosition) {
                savedFloatPosition = {
                    right: result.panelPosition.right,
                    top: result.panelPosition.top
                };
            }
            
            // 侧边栏模式：不设内联位置，由CSS class控制
            if (panelMode === 'sidebar') {
                panel.style.right = '';
                panel.style.top = '';
                panel.classList.add('tc-sidebar');
                panel.classList.remove('tc-float');
                // 立即推挤页面
                document.body.style.marginRight = '380px';
                document.body.style.transition = 'margin-right 0.3s ease';
                if (floatBtn) floatBtn.style.display = 'none';
            } else {
                // 浮动模式：恢复拖拽位置
                panel.classList.add('tc-float');
                panel.classList.remove('tc-sidebar');
                panel.style.right = savedFloatPosition.right + 'px';
                panel.style.top = savedFloatPosition.top + 'px';
                if (floatBtn) floatBtn.style.display = 'flex';
            }
            
            // 恢复尺寸（通用）
            if (result.panelSize) {
                panel.style.width = result.panelSize.width + 'px';
                panel.style.height = result.panelSize.height + 'px';
            }
        });
        
        // 面板缩放（右下角拖柄）
        (function makePanelResizable() {
            var handle = panel.querySelector('#tc-resize-handle');
            if (!handle) return;
            var isResize = false, sx, sy, sw, sh;
            handle.addEventListener('mousedown', function(e) {
                isResize = true;
                sx = e.clientX; sy = e.clientY;
                sw = panel.offsetWidth;
                sh = panel.offsetHeight;
                panel.style.transition = 'none';
                panel.style.maxWidth = 'none';
                panel.style.maxHeight = 'none';
                e.preventDefault();
                e.stopPropagation();
            });
            document.addEventListener('mousemove', function(e) {
                if (!isResize) return;
                var w = Math.max(280, sw + (e.clientX - sx));
                var h = Math.max(200, sh + (e.clientY - sy));
                panel.style.width = w + 'px';
                panel.style.height = h + 'px';
            });
            document.addEventListener('mouseup', function() {
                if (isResize) {
                    isResize = false;
                    panel.style.transition = '';
                    chrome.storage.sync.set({
                        panelSize: {
                            width: panel.offsetWidth,
                            height: panel.offsetHeight
                        }
                    });
                }
            });
        })();
        
        // X按钮直接绑定（避免CSP拦截）
        var closeBtn = panel.querySelector('#tc-ai-close');
        if (closeBtn) {
            closeBtn.addEventListener('click', function(e) {
                // 加 CSS 类强制隐藏（比 style.display 更可靠，不会被其他 CSS 覆盖）
                panel.classList.add('tc-force-hide');
                // 恢复页面
                if (panelMode === 'sidebar') {
                    document.body.style.marginRight = '';
                }
                // 显示浮动图标
                if (floatBtn && floatBtn.style) {
                    floatBtn.style.display = 'flex';
                }
                e.preventDefault();
                e.stopPropagation();
            });
        }
        
        // -按钮直接绑定
        var minBtn = panel.querySelector('#tc-ai-minimize');
        if (minBtn) {
            minBtn.addEventListener('click', function(e) {
                if (panelMode === 'sidebar') {
                    panel.classList.add('tc-force-hide');
                    document.body.style.marginRight = '';
                    if (floatBtn) floatBtn.style.display = 'flex';
                } else {
                    panel.classList.toggle('tc-collapsed');
                }
                e.preventDefault();
                e.stopPropagation();
            });
        }
        
        // 事件委托（仅发送按钮，其他按钮用直接绑定）
        panel.addEventListener('click', function(e) {
            if (e.target.id === 'tc-ai-send' || e.target.closest('#tc-ai-send')) {
                sendMessage();
            }
        });
        
        // 模式切换按钮
        var modeBtn = panel.querySelector('#tc-btn-mode');
        if (modeBtn) {
            modeBtn.addEventListener('click', togglePanelMode);
        }
        
        // 加载Agent列表 + 绑定选择器
        loadAgents();
        
        // 初始化会话列表
        initSessionList();
        
        // 工具栏按钮绑定
        try { bindToolbarButtons(); } catch(e) { console.error('[AI PRO] bindToolbarButtons error:', e.message); }
        
        // 输入框增强功能
        const input = panel.querySelector('#tc-ai-input');
        if (input) {
            // 快捷指令提示
            input.addEventListener('input', function(e) {
                showCommandHints(this.value);
            });
            
            // 回车发送，Shift+Enter换行
            input.addEventListener('keydown', function(e) {
                if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    sendMessage();
                }
                
                // Tab键自动补全快捷指令
                if (e.key === 'Tab') {
                    e.preventDefault();
                    autoCompleteCommand(this);
                }
            });
            
            // 语音输入按钮
            const voiceBtn = panel.querySelector('#tc-ai-voice-btn');
            if (voiceBtn) {
                voiceBtn.addEventListener('click', startVoiceInput);
            }
            
            // 附件上传按钮
            var attachBtn = panel.querySelector('#tc-ai-attach-btn');
            if (attachBtn) {
                attachBtn.addEventListener('click', function() {
                    var fileInput = document.getElementById('tc-file-input');
                    if (!fileInput) {
                        fileInput = document.createElement('input');
                        fileInput.id = 'tc-file-input';
                        fileInput.type = 'file';
                        fileInput.style.display = 'none';
                        fileInput.accept = '.txt,.md,.csv,.json,.py,.js,.ts,.html,.css,.xml,.yaml,.yml,.log,.ini,.cfg,.toml,.sh,.bat,.ps1,.sql,.env,.jpg,.jpeg,.png,.gif,.bmp,.webp,.svg,.pdf,.doc,.docx,.xls,.xlsx';
                        document.body.appendChild(fileInput);
                        
                        fileInput.addEventListener('change', function(e) {
                            var file = e.target.files[0];
                            if (!file) return;
                            handleAttachFile(file);
                            fileInput.value = '';
                        });
                    }
                    fileInput.click();
                });
            }
        }
        
        // 添加快捷工具栏
        addQuickToolbar();
        
        // 点击面板外部关闭（延迟绑定避免立即触发）
        setTimeout(function() {
            document.addEventListener('click', function closePanelOnClickOutside(e) {
                if (panel.style.display === 'block') {
                    // 检查点击是否在面板外部且不是浮动按钮
                    const isOutside = !panel.contains(e.target);
                    const isNotFloatBtn = e.target.id !== 'tc-ai-float-btn' && !e.target.closest('#tc-ai-float-btn');
                    
                    if (isOutside && isNotFloatBtn) {
                        panel.style.display = 'none';
                        // 侧边栏模式关闭时恢复页面
                        if (panelMode === 'sidebar') {
                            document.body.style.marginRight = '';
                        }
                    }
                }
            });
        }, 500);
        
        // 显示登录或欢迎（带记忆）
        if (!token) {
            showLogin();
        } else {
            showWelcomeWithMemory();
        }
    }
    
    // 显示无Token引导页（纯介绍，无输入框/激活按钮）
    function showLogin() {
        var chatArea = panel.querySelector('#tc-ai-chat');
        chatArea.innerHTML = `
            <div id="tc-login-box">
                <div id="tc-login-icon-wrap">
                    <img src="" id="tc-login-icon" style="width:64px;height:64px;border-radius:50%;object-fit:cover;">
                </div>
                <div id="tc-login-title">AI PRO</div>
                <div id="tc-login-subtitle">在任何网页随时唤起的智能助手</div>
                
                <div id="tc-login-features">
                    <div class="tc-feature-item"><span>🌐</span> 智能感知页面类型</div>
                    <div class="tc-feature-item"><span>⚡</span> 10个快捷指令一键执行</div>
                    <div class="tc-feature-item"><span>🎤</span> 语音输入免打字</div>
                    <div class="tc-feature-item"><span>🧠</span> 跨会话记忆</div>
                </div>
                
                <div class="tc-login-divider"></div>

                <div id="tc-login-setup-hint">
                    <div style="font-size:13px;color:#666;margin-bottom:6px;">🔑 首次使用请先配置Token：</div>
                    <div class="tc-setup-step">1. 点击浏览器工具栏的 <strong>🤖 扩展图标</strong></div>
                    <div class="tc-setup-step">2. 在弹窗中粘贴 <strong>访问Token</strong></div>
                    <div class="tc-setup-step">3. 点击 <strong>激活</strong> 即可使用</div>
                    <div style="margin-top:10px;font-size:12px;color:#999;">配置后自动生效，无需刷新页面</div>
                </div>

                <button id="tc-login-gotit" class="tc-gotit-btn">知道了</button>
            </div>
        `;
        
        // 隐藏输入栏
        var inputArea = panel.querySelector('#tc-ai-input-area');
        if (inputArea) inputArea.style.display = 'none';
        
        // "知道了"按钮关闭面板
        var loginIcon = panel.querySelector('#tc-login-icon');
        if (loginIcon) {
            loginIcon.src = chrome.runtime.getURL('icon128.png');
        }
        
        var gotIt = panel.querySelector('#tc-login-gotit');
        if (gotIt) {
            gotIt.addEventListener('click', function() {
                panel.style.display = 'none';
            });
        }
    }
    
    // 显示快捷菜单（单击悬浮球）
    function showQuickMenu() {
        // 检测是否新用户
        var isNewUser = !localStorage.getItem('tc_visited');
        
        // 移除旧菜单
        var oldMenu = document.getElementById('tc-quick-menu');
        if (oldMenu) oldMenu.remove();
        
        // 创建菜单
        var menu = document.createElement('div');
        menu.id = 'tc-quick-menu';
        
        if (isNewUser) {
            // 新用户：欢迎引导
            menu.innerHTML = `
                <div style="padding:12px 16px;background:linear-gradient(135deg,#667eea,#764ba2);color:white;border-radius:12px;margin-bottom:8px;">
                    <div style="font-weight:bold;margin-bottom:4px;">🤖 欢迎使用 AI PRO</div>
                    <div style="font-size:12px;opacity:0.9;">双击图标随时召唤我</div>
                </div>
                <div style="background:white;border-radius:8px;box-shadow:0 4px 12px rgba(0,0,0,0.15);">
                    <div class="tc-menu-item" id="tc-menu-start">🚀 开始体验</div>
                    <div class="tc-menu-item" id="tc-menu-skip">⏭️ 跳过引导</div>
                </div>
            `;
        } else {
            // 老用户：快捷操作
            menu.innerHTML = `
                <div style="background:white;border-radius:8px;box-shadow:0 4px 12px rgba(0,0,0,0.15);min-width:140px;">
                    <div style="padding:8px 12px;background:#f5f5f5;font-size:11px;color:#666;border-radius:8px 8px 0 0;">常用智能体</div>
                    <div class="tc-menu-item" data-agent="default">🤖 默认智能体</div>
                    <div class="tc-menu-item" data-agent="doctor-zhang">👨‍⚕️ 张医生助手</div>
                    <div class="tc-menu-item" data-agent="QwenPaw_QA_Agent_0.2">❓ QA Agent</div>
                    <div style="border-top:1px solid #eee;margin:4px 0;"></div>
                    <div class="tc-menu-item" id="tc-menu-screenshot">📸 截图</div>
                    <div class="tc-menu-item" id="tc-menu-summary">📋 总结</div>
                    <div style="border-top:1px solid #eee;margin:4px 0;"></div>
                    <div class="tc-menu-item" id="tc-menu-open">📱 打开面板</div>
                </div>
            `;
        }
        
        // 定位菜单
        var rect = floatBtn.getBoundingClientRect();
        menu.style.cssText = 'position:fixed;z-index:9999999;right:' + (window.innerWidth - rect.left + 8) + 'px;top:' + rect.top + 'px;';
        document.body.appendChild(menu);
        
        // 绑定事件
        if (isNewUser) {
            menu.querySelector('#tc-menu-start').addEventListener('click', function() {
                localStorage.setItem('tc_visited', 'true');
                menu.remove();
                togglePanel();
            });
            menu.querySelector('#tc-menu-skip').addEventListener('click', function() {
                localStorage.setItem('tc_visited', 'true');
                menu.remove();
            });
        } else {
            // 智能体切换
            menu.querySelectorAll('[data-agent]').forEach(function(item) {
                item.addEventListener('click', function() {
                    selectedAgent = this.dataset.agent;
                    localStorage.setItem('tc_selected_agent', selectedAgent);
                    menu.remove();
                    togglePanel();
                    addMessage('system', '🔄 ' + t('switchTo') + this.textContent);
                });
            });
            // 功能按钮
            menu.querySelector('#tc-menu-screenshot').addEventListener('click', function() {
                menu.remove();
                captureScreenshot();
            });
            menu.querySelector('#tc-menu-summary').addEventListener('click', function() {
                menu.remove();
                var input = panel.querySelector('#tc-ai-input');
                if (input) {
                    input.value = '/总结';
                    togglePanel();
                    sendMessage();
                }
            });
            menu.querySelector('#tc-menu-open').addEventListener('click', function() {
                menu.remove();
                togglePanel();
            });
        }
        
        // 点击外部关闭
        setTimeout(function() {
            document.addEventListener('click', function closeMenu(e) {
                if (!menu.contains(e.target)) {
                    menu.remove();
                    document.removeEventListener('click', closeMenu);
                }
            });
        }, 100);
    }
    
    // 切换面板
    function togglePanel() {
        console.log('[AI PRO] togglePanel called, panel exists:', !!panel);
        if (!panel) {
            console.error('[AI PRO] Panel not created!');
            return;
        }
        
        var wasClosed = panel.classList.contains('tc-force-hide');
        console.log('[AI PRO] Panel was closed:', wasClosed, 'display:', panel.style.display);
        
        if (wasClosed) {
            // === 打开面板 ===
            panel.classList.remove('tc-force-hide');
            panel.style.display = 'block';
            
            // 侧边栏模式：推挤页面
            if (panelMode === 'sidebar') {
                document.body.style.marginRight = '380px';
                if (floatBtn) floatBtn.style.display = 'none';
                document.body.style.transition = 'margin-right 0.3s ease';
            }
            
            // 打开后检查状态
            var chatArea = panel.querySelector('#tc-ai-chat');
            var loginBox = chatArea ? chatArea.querySelector('#tc-login-box') : null;
            applyPanelMode();
            
            if (token && loginBox) {
                chatArea.innerHTML = '';
                var inputArea = panel.querySelector('#tc-ai-input-area');
                if (inputArea) inputArea.style.display = '';
                addMessage('system', t('ready'));
                showWelcomeWithMemory();
                return;
            }
            if (token) {
                var inputArea = panel.querySelector('#tc-ai-input-area');
                if (inputArea && inputArea.style.display === 'none') {
                    inputArea.style.display = '';
                }
            }
            if (!token && !loginBox) {
                showLogin();
            }
        } else {
            // === 关闭面板 ===
            panel.classList.add('tc-force-hide');
            if (panelMode === 'sidebar') {
                document.body.style.marginRight = '';
                if (floatBtn) floatBtn.style.display = 'flex';
                document.body.style.transition = 'margin-right 0.3s ease';
            }
        }
    }
    
    // 添加消息（支持流式显示）
    function addMessage(role, content, isStream) {
        const chatArea = panel.querySelector('#tc-ai-chat');
        if (!chatArea) return;
        
        const msgDiv = document.createElement('div');
        msgDiv.className = 'tc-msg tc-msg-' + role;
        
        const bubble = document.createElement('div');
        bubble.className = 'tc-bubble';
        
        // 用户消息直接显示，AI消息支持流式
        if (role === 'user' || !isStream) {
            bubble.textContent = content;
        } else {
            // 流式显示：逐字追加
            bubble.innerHTML = '<span class="tc-typing"></span>';
            msgDiv.dataset.fullContent = content;
            streamText(bubble.querySelector('.tc-typing'), content, 30);
        }
        
        msgDiv.appendChild(bubble);
        
        // AI消息加语音按钮
        if (role === 'assistant') {
            var voiceBtn = document.createElement('button');
            voiceBtn.className = 'tc-voice-btn';
            voiceBtn.innerHTML = '🔊';
            voiceBtn.title = '朗读';
            voiceBtn.addEventListener('click', function() {
                speakText(content);
            });
            msgDiv.appendChild(voiceBtn);
            
            // 自动朗读（首次）
            if (isStream) {
                setTimeout(function() {
                    speakText(content);
                }, 1000);
            }
        }
        
        chatArea.appendChild(msgDiv);
        chatArea.scrollTop = chatArea.scrollHeight;
        
        return msgDiv;
    }
    
    // ==================== 语音朗读（男声/女声，中英文） ====================
    var currentVoiceGender = localStorage.getItem('tc_voice_gender') || 'female';
    var availableVoices = [];

    // 预加载语音列表
    if (window.speechSynthesis) {
        window.speechSynthesis.getVoices();
        window.speechSynthesis.onvoiceschanged = function() {
            availableVoices = window.speechSynthesis.getVoices();
            console.log('[AI PRO] Voices loaded:', availableVoices.length);
        };
    }

    function loadVoices() {
        if (!window.speechSynthesis) return [];
        availableVoices = window.speechSynthesis.getVoices();
        return availableVoices;
    }

    // 中英文语音
    function getZhEnVoices() {
        var voices = availableVoices.length > 0 ? availableVoices : loadVoices();
        return voices.filter(function(v) {
            return v.lang && (v.lang.startsWith('zh') || v.lang.startsWith('en'));
        });
    }

    // 判断女声（中文系统常见女声名）
    function isFemaleVoice(voice) {
        var name = voice.name.toLowerCase();
        if (name.indexOf('female') !== -1 || name.indexOf('女') !== -1) return true;
        var femaleKeys = ['xiaoxiao','xiaoyi','yating','hanhan','zhiwei','hsiaochen','hsioayu',
                          'xia','mei','hui','ling','tong','ying','shasha','ya'];
        for (var i = 0; i < femaleKeys.length; i++) {
            if (name.indexOf(femaleKeys[i]) !== -1) return true;
        }
        return false;
    }

    // 获取最佳语音
    function getBestVoice(gender) {
        var voices = getZhEnVoices();
        if (voices.length === 0) voices = availableVoices.length > 0 ? availableVoices : loadVoices();
        if (voices.length === 0) return null;

        // 优先中文
        var zh = voices.filter(function(v) { return v.lang && v.lang.startsWith('zh'); });
        var pool = zh.length > 0 ? zh : voices;

        for (var i = 0; i < pool.length; i++) {
            var isF = isFemaleVoice(pool[i]);
            if (gender === 'female' && isF) return pool[i];
            if (gender === 'male' && !isF) return pool[i];
        }
        return pool[0];
    }

    // 切换男/女声
    function toggleVoiceGender() {
        currentVoiceGender = currentVoiceGender === 'female' ? 'male' : 'female';
        localStorage.setItem('tc_voice_gender', currentVoiceGender);

        var voice = getBestVoice(currentVoiceGender);
        var label = currentVoiceGender === 'female' ? t('voiceFemale') : t('voiceMale');
        addMessage('system', '🔊 ' + t('voiceSwitch') + ': ' + label + (voice ? ' (' + voice.name + ')' : ''));

        var testText = currentVoiceGender === 'female'
            ? '你好，我是女声。Hello, female voice.'
            : '你好，我是男声。Hello, male voice.';
        speakText(testText);
    }

    // 语音朗读
    function speakText(text) {
        if (!window.speechSynthesis) return;

        window.speechSynthesis.cancel();

        var cleanText = text
            .replace(/```[\s\S]*?```/g, '代码块')
            .replace(/`([^`]+)`/g, '$1')
            .replace(/#+\s*/g, '')
            .replace(/\*\*([^*]+)\*\*/g, '$1')
            .replace(/\*([^*]+)\*/g, '$1')
            .replace(/~~([^~]+)~~/g, '$1')
            .replace(/\[([^\]]+)\]\([^\)]+\)/g, '$1')
            .replace(/!\[([^\]]*)\]\([^\)]+\)/g, '图片')
            .replace(/-{3,}/g, '分隔线')
            .replace(/&[a-z]+;/g, ' ')
            .replace(/\n{3,}/g, '\n\n')
            .replace(/\n/g, '，')
            .replace(/\s{2,}/g, ' ')
            .trim();

        if (!cleanText) return;

        var utterance = new SpeechSynthesisUtterance(cleanText);
        utterance.rate = 1.05;
        utterance.pitch = 1.0;
        utterance.volume = 1.0;

        var voice = getBestVoice(currentVoiceGender);
        if (voice) {
            utterance.voice = voice;
            utterance.lang = voice.lang;
        } else {
            utterance.lang = currentVoiceGender === 'female' ? 'zh-CN' : 'zh-CN';
        }

        utterance.onerror = function(e) {
            console.log('[AI PRO] 语音错误:', e.error);
            // 失败用默认重试一次
            if (e.error === 'synthesis-failed' || e.error === 'synthesis-unavailable') {
                var retry = new SpeechSynthesisUtterance(cleanText);
                retry.lang = 'zh-CN';
                retry.rate = 1.05;
                window.speechSynthesis.speak(retry);
            }
        };

        window.speechSynthesis.speak(utterance);
    }

    // 语音加载事件
    if (window.speechSynthesis) {
        window.speechSynthesis.onvoiceschanged = loadVoices;
        loadVoices();
    }
    
    // 流式显示文字（支持代码块整段显示）
    function streamText(element, text, speed) {
        if (!element) return;
        
        // 检测代码块 ```...```
        var codeBlockRegex = /```[\s\S]*?```/g;
        var parts = [];
        var lastIndex = 0;
        var match;
        
        while ((match = codeBlockRegex.exec(text)) !== null) {
            // 代码块前的文字
            if (match.index > lastIndex) {
                parts.push({type: 'text', content: text.substring(lastIndex, match.index)});
            }
            // 代码块整段
            parts.push({type: 'code', content: match[0]});
            lastIndex = match.index + match[0].length;
        }
        
        // 剩余文字
        if (lastIndex < text.length) {
            parts.push({type: 'text', content: text.substring(lastIndex)});
        }
        
        // 如果没有代码块，直接逐字显示
        if (parts.length === 0) {
            parts.push({type: 'text', content: text});
        }
        
        var partIndex = 0;
        var charIndex = 0;
        
        function displayNext() {
            if (partIndex >= parts.length) {
                element.classList.remove('tc-typing');
                return;
            }
            
            var part = parts[partIndex];
            
            if (part.type === 'code') {
                // 代码块整段显示
                var codeEl = document.createElement('pre');
                codeEl.style.cssText = 'background:#f5f5f5;padding:8px;border-radius:4px;overflow-x:auto;margin:8px 0;font-family:monospace;font-size:12px;';
                codeEl.textContent = part.content;
                element.appendChild(codeEl);
                partIndex++;
                charIndex = 0;
                setTimeout(displayNext, 100);
            } else {
                // 普通文字逐字显示
                var timer = setInterval(function() {
                    if (charIndex >= part.content.length) {
                        clearInterval(timer);
                        partIndex++;
                        charIndex = 0;
                        displayNext();
                        return;
                    }
                    element.textContent += part.content[charIndex];
                    charIndex++;
                    // 滚动到底部
                    var chatArea = panel.querySelector('#tc-ai-chat');
                    if (chatArea) chatArea.scrollTop = chatArea.scrollHeight;
                }, speed || 30);
                element.dataset.streamTimer = timer;
            }
        }
        
        displayNext();
    }
    
    // ==================== 快捷操作功能 ====================
    
    // 快捷指令列表
    const shortcuts = {
        '/总结': '请总结当前页面的主要内容',
        '/翻译': '请将当前页面内容翻译成中文',
        '/解释': '请解释当前页面的核心概念',
        '/代码': '请分析当前页面的代码逻辑',
        '/优化': '请优化当前页面的内容',
        '/提问': '请根据当前页面内容提出3个问题',
        '/邮件': '请帮我起草一封邮件',
        '/搜索': '请帮我搜索相关信息',
        '/记忆': '请记住我的偏好',
        '/帮助': '请列出所有可用的快捷指令'
    };
    
    // 快捷回复模板
    const templates = [
        { name: '感谢', text: '谢谢你的帮助！' },
        { name: '确认', text: '明白了，我这就去处理。' },
        { name: '询问', text: '能详细说明一下吗？' },
        { name: '稍后', text: '我现在有点忙，稍后回复你。' },
        { name: '同意', text: '好的，我同意这个方案。' },
        { name: '拒绝', text: '抱歉，这个我暂时做不到。' }
    ];
    
    // 添加快捷工具栏
    function addQuickToolbar() {
        var chatArea = panel.querySelector('#tc-ai-chat');
        if (!chatArea) return;
        var toolbar = document.createElement('div');
        toolbar.id = 'tc-quick-toolbar';
        toolbar.style.cssText = 'padding:8px 12px;border-bottom:1px solid #eee;display:flex;gap:6px;flex-wrap:wrap;';
        templates.forEach(function(t) {
            var btn = document.createElement('button');
            btn.textContent = t.name;
            btn.style.cssText = 'padding:4px 10px;font-size:12px;border:1px solid #ddd;border-radius:12px;background:#f5f5f5;cursor:pointer;white-space:nowrap;';
            btn.addEventListener('click', function() {
                var input = panel.querySelector('#tc-ai-input');
                if (input) {
                    input.value = t.text;
                    input.focus();
                }
            });
            toolbar.appendChild(btn);
        });
        chatArea.parentNode.insertBefore(toolbar, chatArea.nextSibling);
    }
    
    // 显示快捷指令提示
    function showCommandHints(text) {
        const hints = panel.querySelector('#tc-command-hints');
        if (!hints) return;
        
        if (text.startsWith('/')) {
            const matches = Object.keys(shortcuts).filter(cmd => cmd.startsWith(text));
            if (matches.length > 0) {
                hints.innerHTML = matches.map(cmd => `<div class="tc-command-hint" data-cmd="${cmd}"><strong>${cmd}</strong> - ${shortcuts[cmd]}</div>`).join('');
                hints.style.display = 'block';
                
                // 绑定点击事件
                hints.querySelectorAll('.tc-command-hint').forEach(hint => {
                    hint.addEventListener('click', function() {
                        const input = panel.querySelector('#tc-ai-input');
                        input.value = this.dataset.cmd + ' ';
                        hints.style.display = 'none';
                        input.focus();
                    });
                });
            } else {
                hints.style.display = 'none';
            }
        } else {
            hints.style.display = 'none';
        }
    }
    
    // 自动补全快捷指令
    function autoCompleteCommand(input) {
        const text = input.value;
        if (text.startsWith('/')) {
            const matches = Object.keys(shortcuts).filter(cmd => cmd.startsWith(text));
            if (matches.length === 1) {
                input.value = matches[0] + ' ';
            }
        }
    }
    
    // 处理快捷指令
    function processShortcuts(content) {
        // 检查是否是快捷指令
        for (const [cmd, prompt] of Object.entries(shortcuts)) {
            if (content.startsWith(cmd)) {
                const extra = content.substring(cmd.length).trim();
                return `${prompt}${extra ? '：' + extra : ''}\n\n页面信息：\n标题：${pageContext.title}\n类型：${pageContext.type}\n内容摘要：${pageContext.content.substring(0, 500)}`;
            }
        }
        
        // 普通消息，添加上下文
        if (pageContext.type !== 'unknown') {
            return `用户问题：${content}\n\n当前页面：${pageContext.title} (${pageContext.type})`;
        }
        
        return content;
    }
    
    // ==================== 附件上传（保存到工作区） ====================
    var TEXT_EXTS = ['txt','md','csv','json','py','js','ts','html','css','xml','yaml','yml','log','ini','cfg','toml','sh','bat','ps1','sql','env','conf','config','gradle','kt','swift','go','rs','rb','php','pl','pm','lua','r','m','mm','h','c','cpp','hpp','java','scala','clj','coffee','tex','rst','asciidoc','adoc','markdown','mkd'];
    var IMAGE_EXTS = ['jpg','jpeg','png','gif','bmp','webp','svg','ico'];
    
    function handleAttachFile(file) {
        var ext = file.name.split('.').pop().toLowerCase();
        var maxSize = 10 * 1024 * 1024; // 10MB
        
        if (file.size > maxSize) {
            addMessage('system', t('fileTooLarge'));
            return;
        }
        
        // 显示上传中
        addMessage('system', '📤 正在上传: ' + file.name + '...');
        
        // 上传到后端工作区
        uploadFileToWorkspace(file, function(result) {
            if (!result.success) {
                // 图片上传失败时显示友好提示
                if (IMAGE_EXTS.indexOf(ext) !== -1) {
                    addMessage('system', '💡 图片上传功能开发中，请使用文本文件');
                } else {
                    addMessage('system', '❌ 上传失败: ' + result.error);
                }
                return;
            }
            
            // 上传成功，显示文件
            if (result.is_image) {
                // 图片文件 - 暂不支持，显示提示
                addMessage('system', '💡 图片上传功能开发中，请使用文本文件');
                return;
            } else {
                // 文本文件
                addMessage('user', '📄 [' + file.name + ']');
                var chatArea = panel.querySelector('#tc-ai-chat');
                if (chatArea && result.text) {
                    var content = result.text;
                    var fileDiv = document.createElement('div');
                    fileDiv.className = 'tc-msg tc-msg-user';
                    fileDiv.innerHTML = '<div class="tc-bubble"><div style="font-size:11px;color:#888;margin-bottom:4px;">📎 ' + file.name + ' (' + formatFileSize(file.size) + ')</div><pre style="white-space:pre-wrap;font-size:12px;max-height:150px;overflow:auto;background:#f5f5f5;padding:8px;border-radius:4px;margin:0;">' + escapeHtml(content.substring(0, 1000)) + (content.length > 1000 ? '\n\n...(已截断)' : '') + '</pre></div>';
                    chatArea.appendChild(fileDiv);
                    chatArea.scrollTop = chatArea.scrollHeight;
                }
                // 通知AI文件已保存
                var msg = '用户上传了文件：' + file.name + '\n'
                    + '文件路径：' + result.path + '\n'
                    + '文件内容：\n' + (result.text || '(二进制文件)');
                sendMessageToAI(msg);
            }
        });
    }
    
    // 上传文件到工作区
    function uploadFileToWorkspace(file, callback) {
        var formData = new FormData();
        formData.append('file', file);
        
        fetch(CONFIG.API_BASE + '/api/plugins/team_chat/upload', {
            method: 'POST',
            body: formData
        })
        .then(function(r) { return r.json(); })
        .then(function(data) {
            if (data.filename) {
                callback({
                    success: true,
                    filename: data.filename,
                    path: data.path,
                    url: data.url,
                    is_image: data.is_image,
                    data_url: data.data_url,
                    text: data.text,
                    size: data.size
                });
            } else {
                callback({ success: false, error: data.detail || '上传失败' });
            }
        })
        .catch(function(err) {
            callback({ success: false, error: err.message || '网络错误' });
        });
    }
    
    function formatFileSize(bytes) {
        if (bytes < 1024) return bytes + 'B';
        if (bytes < 1024*1024) return (bytes/1024).toFixed(1) + 'KB';
        return (bytes/(1024*1024)).toFixed(1) + 'MB';
    }
    
    function escapeHtml(str) {
        return str.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/\"/g,'&quot;');
    }
    
    function sendMessageToAI(text) {
        var loadingId = 'msg-' + Date.now();
        var loadingDiv = document.createElement('div');
        loadingDiv.className = 'tc-msg tc-msg-assistant';
        loadingDiv.id = loadingId;
        loadingDiv.innerHTML = '<div class="tc-bubble tc-loading"><span class="tc-dot">.</span><span class="tc-dot">.</span><span class="tc-dot">.</span></div>';
        var chatArea = panel.querySelector('#tc-ai-chat');
        if (chatArea) chatArea.appendChild(loadingDiv);
        
        chrome.runtime.sendMessage({
            action: 'chat',
            token: token,
            message: text,
            agent_id: selectedAgent,
            session_id: 'extension_' + selectedAgent + '_' + (token ? token.substring(0, 8) : 'guest')
        }, function(resp) {
            var loadingEl = document.getElementById(loadingId);
            if (loadingEl) loadingEl.remove();
            if (resp && resp.success && resp.data && resp.data.reply) {
                addMessage('assistant', resp.data.reply, true);
            } else {
                addMessage('assistant', '⚠️ AI回复失败：' + (resp ? resp.error : '无响应'));
            }
        });
    }
    
    // 语音输入
    function startVoiceInput() {
        if (!('webkitSpeechRecognition' in window)) {
            alert('您的浏览器不支持语音输入');
            return;
        }
        
        const recognition = new webkitSpeechRecognition();
        recognition.lang = 'zh-CN';
        recognition.continuous = false;
        recognition.interimResults = false;
        
        const btn = panel.querySelector('#tc-ai-voice-btn');
        if (btn) {
            btn.style.color = '#ff4d4f';
            btn.innerHTML = '🔴';
        }
        
        recognition.onresult = function(event) {
            const transcript = event.results[0][0].transcript;
            const input = panel.querySelector('#tc-ai-input');
            if (input) input.value += transcript;
            if (btn) {
                btn.style.color = '';
                btn.innerHTML = '🎤';
            }
        };
        
        recognition.onerror = function() {
            if (btn) {
                btn.style.color = '';
                btn.innerHTML = '🎤';
            }
            alert('语音识别失败，请重试');
        };
        
        recognition.onend = function() {
            if (btn) {
                btn.style.color = '';
                btn.innerHTML = '🎤';
            }
        };
        
        recognition.start();
    }
    
    // ==================== Agent管理 ====================
    function loadAgents() {
        var sel = panel.querySelector('#tc-agent-select');
        if (!sel) return;
        
        // 硬编码常用智能体
        var commonAgents = [
            {id: 'default', name: '默认智能体', icon: '🤖'},
            {id: 'QwenPaw_QA_Agent_0.2', name: 'QA Agent', icon: '❓'}
        ];
        
        // 先显示常用
        var html = '<optgroup label="⭐ 常用">';
        commonAgents.forEach(function(a) {
            html += '<option value="' + a.id + '">' + a.icon + ' ' + a.name + '</option>';
        });
        html += '</optgroup>';
        
        sel.innerHTML = html;
        agentList = commonAgents;
        
        // 然后从 API 加载全部（带重试）
        function tryLoadAgents(retryCount) {
            chrome.runtime.sendMessage({action: 'get_agents'}, function(response) {
                if (!response && retryCount > 0) {
                    console.log('[TeamChat] Agent API 无响应，重试... (' + retryCount + ')');
                    setTimeout(function() { tryLoadAgents(retryCount - 1); }, 500);
                    return;
                }
                if (!response) {
                    console.log('[TeamChat] Agent API 无响应，使用常用列表');
                    return;
                }
                if (!response.success) {
                    console.log('[TeamChat] Agent API 获取失败:', response.error || '未知错误');
                    return;
                }
                
                var apiAgents = response.agents || [];
                if (!apiAgents.length) return;
                
                // 合并去重
            var allAgents = commonAgents.slice();
            var seen = {};
            commonAgents.forEach(function(a) { seen[a.id] = true; });
            
            apiAgents.forEach(function(a) {
                var id = a.id || a;
                if (seen[id]) return;
                seen[id] = true;
                var name = a.name || id;
                var icon = '🤖';
                if (id.includes('doctor')) icon = '👨‍⚕️';
                else if (id.includes('QA')) icon = '❓';
                else if (id.includes('cloud') && !id.includes('executor') && !id.includes('verifier')) icon = '☁️';
                else if (id.includes('executor')) icon = '⚡';
                else if (id.includes('verifier')) icon = '✅';
                allAgents.push({id: id, name: name, icon: icon});
            });
            
            // 重新渲染下拉框
            var html = '<optgroup label="⭐ 常用">';
            commonAgents.forEach(function(a) {
                html += '<option value="' + a.id + '">' + a.icon + ' ' + a.name + '</option>';
            });
            html += '</optgroup><optgroup label="📋 全部">';
            allAgents.forEach(function(a) {
                var isCommon = false;
                for (var i = 0; i < commonAgents.length; i++) {
                    if (commonAgents[i].id === a.id) {
                        isCommon = true;
                        break;
                    }
                }
                if (!isCommon) {
                    html += '<option value="' + a.id + '">' + a.icon + ' ' + a.name + '</option>';
                }
            });
            html += '</optgroup>';
            
            sel.innerHTML = html;
            agentList = allAgents;
            
            // 恢复之前选中的
            var saved = localStorage.getItem('tc_selected_agent');
            if (saved) {
                var opt = sel.querySelector('option[value="' + saved + '"]');
                if (opt) sel.value = saved;
                selectedAgent = saved;
            }
        });
        }
        
        // 切换agent
        sel.addEventListener('change', function() {
            selectedAgent = this.value;
            localStorage.setItem('tc_selected_agent', selectedAgent);
            addMessage('system', '🔄 ' + t('switchTo') + this.options[this.selectedIndex].text);
        });
        
        // 启动重试机制
        tryLoadAgents(3);
    }
    
    // ==================== 工具栏按钮绑定 ====================
    // 初始化会话列表
    function initSessionList() {
        // 绑定新建会话按钮
        var newSessionBtn = panel.querySelector('#tc-btn-new-session');
        if (newSessionBtn && !newSessionBtn.dataset.bound) {
            newSessionBtn.dataset.bound = 'true';
            newSessionBtn.addEventListener('click', function() {
                createNewSession();
            });
        }
        
        // 绑定会话列表展开/收起
        var toggleBtn = panel.querySelector('#tc-session-toggle');
        if (toggleBtn) {
            toggleBtn.addEventListener('click', function() {
                isSessionListCollapsed = !isSessionListCollapsed;
                var sidebar = panel.querySelector('#tc-session-sidebar');
                var mainArea = panel.querySelector('#tc-main-area');
                if (sidebar) {
                    if (isSessionListCollapsed) {
                        sidebar.classList.add('tc-session-collapsed');
                    } else {
                        sidebar.classList.remove('tc-session-collapsed');
                    }
                }
                // 保存状态
                chrome.storage.local.set({ sessionListCollapsed: isSessionListCollapsed });
            });
        }
        
        // 恢复展开/收起状态
        chrome.storage.local.get(['sessionListCollapsed'], function(result) {
            isSessionListCollapsed = result.sessionListCollapsed || false;
            var sidebar = panel.querySelector('#tc-session-sidebar');
            if (sidebar && isSessionListCollapsed) {
                sidebar.classList.add('tc-session-collapsed');
            }
        });
        
        // 加载并渲染会话列表
        renderSessionList();
        
        // 如果没有当前会话，创建新会话
        if (!currentSessionId) {
            // 检查是否有历史会话
            loadSessions(function(sessions) {
                if (sessions.length > 0) {
                    // 恢复最近会话
                    switchSession(sessions[0].id);
                } else {
                    // 创建新会话
                    createNewSession();
                }
            });
        }
    }
    
    function bindToolbarButtons() {
        if (!panel || typeof panel.querySelector !== 'function') { console.error('[AI PRO] bindToolbarButtons: panel invalid'); return; }
        // 暗黑模式
        var btnDark = panel.querySelector('#tc-btn-dark');
        if (btnDark) {
            btnDark.addEventListener('click', toggleDarkMode);
        }
        
        // 截图
        var btnScreenshot = panel.querySelector('#tc-btn-screenshot');
        if (btnScreenshot) {
            btnScreenshot.addEventListener('click', captureScreenshot);
        }
        
        // 导出
        var btnExport = panel.querySelector('#tc-btn-export');
        if (btnExport) {
            btnExport.addEventListener('click', exportChatHistory);
        }
        
        // 总结
        var btnSummary = panel.querySelector('#tc-btn-summary');
        if (btnSummary) {
            btnSummary.addEventListener('click', function() {
                var input = panel.querySelector('#tc-ai-input');
                if (input) {
                    input.value = '/总结';
                    sendMessage();
                }
            });
        }
        
        // 数据抓取
        var btnScrape = panel.querySelector('#tc-btn-scrape');
        if (btnScrape) {
            btnScrape.addEventListener('click', scrapePageData);
        }
        
        // 复制选中内容
        var btnCopy = panel.querySelector('#tc-btn-copy');
        if (btnCopy) {
            btnCopy.addEventListener('click', copySelectedContent);
        }
        
        // 自动填表
        var btnFill = panel.querySelector('#tc-btn-fill');
        if (btnFill) {
            btnFill.addEventListener('click', showFormFiller);
        }
        
        // 视频总结按钮
        var btnVideo = panel.querySelector('#tc-btn-video');
        if (btnVideo) {
            btnVideo.addEventListener('click', function() {
                summarizeVideo();
            });
            // 只在视频页显示
            if (!isVideoPage()) btnVideo.style.display = 'none';
        }
        
        // 语音性别切换按钮（输入栏旁）
        var btnVoiceGender = panel.querySelector('#tc-ai-voice-gender');
        if (btnVoiceGender) {
            btnVoiceGender.addEventListener('click', function() {
                toggleVoiceGender();
                btnVoiceGender.innerHTML = currentVoiceGender === 'female' ? '👩' : '👨';
                btnVoiceGender.title = t('voiceSwitch') + ': ' + (currentVoiceGender === 'female' ? t('voiceFemale') : t('voiceMale'));
            });
            btnVoiceGender.innerHTML = currentVoiceGender === 'female' ? '👩' : '👨';
            btnVoiceGender.title = t('voiceSwitch') + ': ' + (currentVoiceGender === 'female' ? t('voiceFemale') : t('voiceMale'));
        }
        
        }
    
    // ==================== 模式切换（浮动/侧边栏） ====================
    function togglePanelMode() {
        var newMode = panelMode === 'float' ? 'sidebar' : 'float';
        
        // 从浮动切换到侧边栏前，保存当前位置到变量
        if (panelMode === 'float' && newMode === 'sidebar') {
            savedFloatPosition = {
                right: parseInt(panel.style.right) || 20,
                top: parseInt(panel.style.top) || 80
            };
        }
        
        panelMode = newMode;
        localStorage.setItem('tc_panel_mode', panelMode);
        applyPanelMode();  // 内部已处理位置恢复
        
        var modeBtn = panel.querySelector('#tc-btn-mode');
        if (modeBtn) {
            modeBtn.title = panelMode === 'float' ? t('switchSidebar') : t('switchFloat');
            modeBtn.textContent = panelMode === 'float' ? '📌' : '📍'; /* 图标无需翻译 */
        }
        
        addMessage('system', panelMode === 'sidebar' ? '📍 ' + t('sidebarMode') : '📌 ' + t('floatMode'));
    }
    
    function applyPanelMode() {
        if (!panel) return;
        
        // 清除内联样式中的尺寸/圆角/阴影（位置单独处理）
        panel.style.width = '';
        panel.style.height = '';
        panel.style.borderRadius = '';
        panel.style.maxHeight = '';
        panel.style.boxShadow = '';
        
        if (panelMode === 'sidebar') {
            // 侧边栏模式：位置也由CSS class控制，清除内联位置
            panel.style.right = '';
            panel.style.top = '';
            panel.classList.remove('tc-float');
            panel.classList.add('tc-sidebar');
            
            // 推挤网页内容左移
            if (panel.style.display !== 'none') {
                document.body.style.marginRight = '380px';
                document.body.style.transition = 'margin-right 0.3s ease';
            }
            
            // 隐藏浮动按钮
            if (floatBtn) floatBtn.style.display = 'none';
        } else {
            // 浮动模式：right/top用内联样式（保留拖拽位置）
            panel.style.right = savedFloatPosition.right + 'px';
            panel.style.top = savedFloatPosition.top + 'px';
            panel.classList.remove('tc-sidebar');
            panel.classList.add('tc-float');
            
            // 恢复网页内容
            document.body.style.marginRight = '';
            document.body.style.transition = 'margin-right 0.3s ease';
            
            // 显示浮动按钮
            if (floatBtn) floatBtn.style.display = 'flex';
        }
    }
    
    // ==================== 暗黑模式 ====================
    var isDarkMode = false;
    function toggleDarkMode() {
        isDarkMode = !isDarkMode;
        panel.classList.toggle('tc-dark', isDarkMode);
        localStorage.setItem('tc_dark_mode', isDarkMode);
        addMessage('system', isDarkMode ? t('darkOn') : t('darkOff'));
    }
    
    // ==================== 截图分析（提取页面内容给AI） ====================
    function captureScreenshot() {
        addMessage('system', t('screenshotting'));
        
        // 先取截图（仅作为视觉确认）
        chrome.runtime.sendMessage({action: 'capture_screenshot'}, function(response) {
            if (!response || !response.success) {
                // 截图失败：直接用页面文本内容分析
                analyzePageText();
                return;
            }
            addMessage('user', '[📸 当前页面]');
            analyzePageText();
        });
    }
    
    function analyzePageText() {
        // 提取页面内容
        var pageContent = extractMainContent();
        var pageType = pageContext.type || 'unknown';
        var pageTitle = document.title || '';
        var pageUrl = window.location.href || '';
        
        var analysisPrompt = '请分析当前页面，告诉我：\n'
            + '1. 页面类型：' + pageType + '\n'
            + '2. 页面标题：' + pageTitle + '\n'
            + '3. 主要内容：' + (pageContent ? pageContent.substring(0, 2000) : '（无法提取）') + '\n'
            + '4. 核心要点总结\n'
            + '5. 如果有数据或列表，请整理出来';
        
        // 通过 sendMessage 走后台聊天流程
        // 模拟消息发送
        var loadingId = 'msg-' + Date.now();
        var loadingDiv = document.createElement('div');
        loadingDiv.className = 'tc-msg tc-msg-assistant';
        loadingDiv.id = loadingId;
        loadingDiv.innerHTML = '<div class="tc-bubble tc-loading"><span class="tc-dot">.</span><span class="tc-dot">.</span><span class="tc-dot">.</span></div>';
        var chatArea = panel.querySelector('#tc-ai-chat');
        if (chatArea) chatArea.appendChild(loadingDiv);
        
        chrome.runtime.sendMessage({
            action: 'chat',
            token: token,
            message: analysisPrompt,
            agent_id: selectedAgent,
            session_id: 'extension_' + selectedAgent + '_' + (token ? token.substring(0, 8) : 'guest')
        }, function(resp) {
            var loadingEl = document.getElementById(loadingId);
            if (loadingEl) loadingEl.remove();
            
            if (resp && resp.success && resp.data && resp.data.reply) {
                addMessage('assistant', resp.data.reply, true);
            } else {
                addMessage('assistant', '⚠️ 分析失败：' + (resp ? resp.error : '无响应'));
            }
        });
    }
    
    // ==================== 导出聊天记录 ====================
    function exportChatHistory() {
        var chatDiv = panel.querySelector('#tc-ai-chat');
        if (!chatDiv) return;
        
        var messages = [];
        var items = chatDiv.querySelectorAll('.tc-ai-message');
        items.forEach(function(item) {
            var role = item.classList.contains('tc-ai-user') ? '用户' : 
                       item.classList.contains('tc-ai-assistant') ? 'AI' : '系统';
            var text = item.textContent.trim();
            if (text) messages.push('**' + role + '**：' + text);
        });
        
        if (!messages.length) {
            addMessage('system', t('noExport'));
            return;
        }
        
        var md = '# AI PRO 对话记录\n\n';
        md += '**时间**：' + new Date().toLocaleString() + '\n\n';
        md += '**页面**：' + document.title + '\n';
        md += '**URL**：' + location.href + '\n\n';
        md += '---\n\n';
        md += messages.join('\n\n');
        
        var blob = new Blob([md], {type: 'text/markdown'});
        var url = URL.createObjectURL(blob);
        var a = document.createElement('a');
        a.href = url;
        a.download = 'teamchat_export_' + new Date().getTime() + '.md';
        a.click();
        URL.revokeObjectURL(url);
        
        addMessage('system', t('exported') + messages.length + ' messages');
    }
    
    // ==================== 数据抓取 ====================
    function scrapePageData() {
        addMessage('system', t('scraping'));
        
        var data = {
            tables: [],
            lists: [],
            prices: [],
            titles: []
        };
        
        // 抓取表格
        document.querySelectorAll('table').forEach(function(table, i) {
            var rows = [];
            table.querySelectorAll('tr').forEach(function(tr) {
                var row = [];
                tr.querySelectorAll('td, th').forEach(function(cell) {
                    row.push(cell.textContent.trim());
                });
                if (row.length) rows.push(row);
            });
            if (rows.length) data.tables.push({index: i + 1, rows: rows});
        });
        
        // 抓取列表项
        document.querySelectorAll('.item, .product, .list-item, [data-item], .goods-item').forEach(function(item, i) {
            var title = item.querySelector('.title, h3, h4, .name') || item;
            var price = item.querySelector('.price, .amount, [class*="price"]');
            data.lists.push({
                index: i + 1,
                title: title.textContent.trim().substring(0, 100),
                price: price ? price.textContent.trim() : '-'
            });
        });
        
        // 抓取价格
        document.querySelectorAll('.price, .amount, [class*="price"], [class*="money"]').forEach(function(el) {
            var text = el.textContent.trim();
            if (/[¥￥$€£\d]/.test(text)) data.prices.push(text);
        });
        
        // 抓取标题
        document.querySelectorAll('h1, h2, .title, [class*="title"]').forEach(function(el) {
            var text = el.textContent.trim();
            if (text && text.length < 200) data.titles.push(text);
        });
        
        // 显示结果
        var summary = '📊 **数据抓取结果**\n\n';
        summary += '- 表格：' + data.tables.length + ' 个\n';
        summary += '- 列表项：' + data.lists.length + ' 个\n';
        summary += '- 价格：' + data.prices.length + ' 个\n';
        summary += '- 标题：' + data.titles.length + ' 个\n\n';
        
        if (data.tables.length) {
            summary += '**表格示例**（第1个）：\n';
            data.tables[0].rows.slice(0, 3).forEach(function(row) {
                summary += '- ' + row.join(' | ') + '\n';
            });
            summary += '\n';
        }
        
        if (data.lists.length) {
            summary += '**列表项示例**（前3个）：\n';
            data.lists.slice(0, 3).forEach(function(item) {
                summary += '- ' + item.title;
                if (item.price !== '-') summary += ' (' + item.price + ')';
                summary += '\n';
            });
        }
        
        addMessage('assistant', summary);
        
        // 保存到全局供导出使用
        window.tcScrapedData = data;
    }
    
    // ==================== 复制选中内容 ====================
    function copySelectedContent() {
        var selected = window.getSelection().toString().trim();
        if (!selected) {
            // 没选中则抓取正文
            selected = extractMainContent().substring(0, 2000);
            addMessage('system', t('noSelection'));
        } else {
            addMessage('system', t('copied') + selected.length + ' chars）');
        }
        
        // 复制到剪贴板
        navigator.clipboard.writeText(selected).then(function() {
            addMessage('assistant', '📋 **已复制内容**：\n\n```\n' + selected.substring(0, 500) + (selected.length > 500 ? '...' : '') + '\n```');
        }).catch(function() {
            addMessage('system', t('copyFail'));
        });
    }
    
    // ==================== 自动填表 ====================
    function showFormFiller() {
        var forms = [];
        document.querySelectorAll('input, textarea, select').forEach(function(el, i) {
            var label = '';
            var id = el.id || '';
            var name = el.name || '';
            var placeholder = el.placeholder || '';
            var type = el.type || el.tagName.toLowerCase();
            
            // 找label
            if (id) {
                var labelEl = document.querySelector('label[for="' + id + '"]');
                if (labelEl) label = labelEl.textContent.trim();
            }
            if (!label) {
                var prev = el.previousElementSibling;
                if (prev && prev.tagName === 'LABEL') label = prev.textContent.trim();
            }
            
            forms.push({
                index: i + 1,
                type: type,
                label: label || placeholder || name || id || '字段' + (i + 1),
                element: el
            });
        });
        
        if (!forms.length) {
            addMessage('system', t('noForm'));
            return;
        }
        
        // 显示表单列表
        var html = '📝 **检测到 ' + forms.length + ' 个表单字段**\n\n';
        html += '请回复要填入的值，格式：**序号=值**\n\n';
        html += '例如：`1=张三 2=13800138000`\n\n';
        html += '---\n\n';
        
        forms.slice(0, 10).forEach(function(f) {
            html += f.index + '. **' + f.label + '** (' + f.type + ')\n';
        });
        
        if (forms.length > 10) html += '\n...还有 ' + (forms.length - 10) + ' 个字段';
        
        addMessage('assistant', html);
        
        // 保存到全局
        window.tcFormFields = forms;
        
        // 监听下一条消息作为填表指令
        var originalSend = sendMessage;
        window.tcFormMode = true;
    }
    
    // ==================== 发送消息（增强版） ====================
    function sendMessage() {
        var input = panel.querySelector('#tc-ai-input');
        if (!input) return;
        
        var content = input.value.trim();
        if (!content) return;
        
        if (!token) {
            showLogin();
            return;
        }
        
        // 如果没有当前会话，创建新会话
        if (!currentSessionId) {
            createNewSession();
        }
        
        addMessage('user', content);
        
        // 保存用户消息到会话
        saveCurrentMessage('user', content);
        
        input.value = '';
        
        // 处理快捷指令
        var processedContent = processShortcuts(content);
        
        // 保存到历史
        userMemory.history.push({
            type: 'user',
            content: content,
            timestamp: Date.now(),
            pageContext: pageContext
        });
        
        // 添加"正在输入..."占位
        var loadingId = 'msg-' + Date.now();
        var loadingDiv = document.createElement('div');
        loadingDiv.className = 'tc-msg tc-msg-assistant';
        loadingDiv.id = loadingId;
        loadingDiv.innerHTML = '<div class="tc-bubble tc-loading"><span class="tc-dot">.</span><span class="tc-dot">.</span><span class="tc-dot">.</span></div>';
        var chatArea = panel.querySelector('#tc-ai-chat');
        if (chatArea) chatArea.appendChild(loadingDiv);
        
        // 走 background.js 发请求（绕过 content script CORS 限制）
        chrome.runtime.sendMessage({
            action: 'chat',
            token: token,
            message: processedContent,
            agent_id: selectedAgent,
            session_id: 'extension_' + selectedAgent + '_' + (token ? token.substring(0, 8) : 'guest')
        }, function(response) {
            // 移除加载占位
            var loadingEl = document.getElementById(loadingId);
            if (loadingEl) loadingEl.remove();
            
            if (response && response.success && response.data && response.data.reply) {
                // 流式显示AI回复
                addMessage('assistant', response.data.reply, true);
                
                // 保存AI回复到会话
                saveCurrentMessage('assistant', response.data.reply);
                
                userMemory.history.push({
                    type: 'assistant',
                    content: response.data.reply,
                    timestamp: Date.now()
                });
                
                chrome.storage.sync.set({ userMemory: userMemory });
            } else {
                addMessage('system', t('sendFail'));
            }
        });
    }
    
    // ==================== 记忆增强功能 ====================
    
    // 保存用户偏好
    function savePreference(key, value) {
        userMemory.preferences[key] = value;
        chrome.storage.sync.set({ userMemory: userMemory });
    }
    
    // 获取用户偏好
    function getPreference(key, defaultValue) {
        return userMemory.preferences[key] || defaultValue;
    }
    
    // 添加话题到记忆
    function rememberTopic(topic) {
        userMemory.lastTopics.unshift(topic);
        if (userMemory.lastTopics.length > 10) {
            userMemory.lastTopics = userMemory.lastTopics.slice(0, 10);
        }
        chrome.storage.sync.set({ userMemory: userMemory });
    }
    
    // 获取相关话题
    function getRelatedTopics(currentTopic) {
        return userMemory.lastTopics.filter(t => t !== currentTopic).slice(0, 3);
    }
    
    // 显示欢迎消息（带记忆）
    function showWelcomeWithMemory() {
        var hour = new Date().getHours();
        var greeting = t('greeting');
        if (hour < 12) greeting = t('morning');
        else if (hour < 18) greeting = t('afternoon');
        else greeting = t('evening');
        
        var pageName = pageContext.title || pageContext.summary || '';
        var welcomeMsg = greeting + '！' + t('ready');
        
        // 根据记忆添加个性化内容
        if (userMemory.lastTopics && userMemory.lastTopics.length > 0) {
            welcomeMsg += '\n\n📝 上次我们聊到：' + userMemory.lastTopics[0];
        }
        
        if (pageName) {
            welcomeMsg += '\n\n🌐 正在浏览：' + pageName;
        }
        
        // 添加场景快捷建议
        var suggestions = [];
        if (pageContext.type === 'article') {
            suggestions = ['📄 总结文章要点', '💡 提炼核心观点', '📋 生成摘要'];
        } else if (pageContext.type === 'search') {
            suggestions = ['🔍 优化搜索结果', '📊 分析搜索意图'];
        } else if (pageContext.type === 'video') {
            suggestions = ['🎬 提取视频文字', '📝 记录要点'];
        } else if (pageContext.type === 'social') {
            suggestions = ['💬 回复建议', '📊 内容分析'];
        } else if (pageContext.type === 'code') {
            suggestions = ['💻 代码解释', '🐛 检查错误', '📖 生成文档'];
        } else {
            suggestions = ['📸 截图分析', '📋 页面总结', '📝 帮助写作'];
        }
        
        welcomeMsg += '\n\n💡 快捷操作：' + suggestions.join(' · ');
        
        addMessage('system', welcomeMsg);
        
        // 保存话题记忆
        if (!userMemory.lastTopics) userMemory.lastTopics = [];
    }
    
    // ==================== 拖拽功能 ====================
    function makeDraggable(element) {
        let isDragging = false;
        let startX, startY, startRight, startTop;
        
        element.addEventListener('mousedown', function(e) {
            isDragging = true;
            startX = e.clientX;
            startY = e.clientY;
            startRight = parseInt(element.style.right) || 20;
            startTop = parseInt(element.style.top) || 20;
            element.style.cursor = 'grabbing';
        });
        
        document.addEventListener('mousemove', function(e) {
            if (!isDragging) return;
            
            const dx = startX - e.clientX;
            const dy = e.clientY - startY;
            
            element.style.right = (startRight + dx) + 'px';
            element.style.top = (startTop + dy) + 'px';
        });
        
        document.addEventListener('mouseup', function() {
            if (isDragging) {
                isDragging = false;
                element.style.cursor = 'pointer';
                
                // 保存位置
                chrome.storage.sync.set({
                    btnPosition: {
                        right: parseInt(element.style.right),
                        top: parseInt(element.style.top)
                    }
                });
            }
        });
    }
})();
