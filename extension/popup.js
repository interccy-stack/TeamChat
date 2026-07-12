// popup.js - AI PRO Token Onboarding
// Supports: QwenPaw ai-pro-token plugin + team-chat plugin

// ==================== DOM Refs ====================
var statusDot = document.getElementById('statusDot');
var statusLabel = document.getElementById('statusLabel');
var activatedCard = document.getElementById('activatedCard');
var onboardCard = document.getElementById('onboardCard');
var tokenInput = document.getElementById('tokenInput');
var activateBtn = document.getElementById('activateBtn');
var retryBtn = document.getElementById('retryBtn');
var retryArea = document.getElementById('retryArea');
var resetTokenBtn = document.getElementById('resetTokenBtn');
var autoFetchStatus = document.getElementById('autoFetchStatus');
var activatedTitle = document.getElementById('activatedTitle');
var activatedDesc = document.getElementById('activatedDesc');

// ==================== Token Endpoints ====================
var TOKEN_ENDPOINTS = [
    'http://localhost:8088/api/ai-pro-token/token',           // QwenPaw 2.0 plugin (new)
    'http://localhost:8088/api/plugins/team_chat/bookmarklet/token', // Legacy team-chat
];

// ==================== State ====================
var hasToken = false;

// ==================== Show Activated ====================
function showActivated(token) {
    hasToken = true;
    statusDot.className = 'dot online';
    statusLabel.textContent = '已激活';
    onboardCard.style.display = 'none';
    activatedCard.style.display = 'block';
    activatedTitle.textContent = 'AI PRO 已就绪';
    activatedDesc.textContent = '在任何网页点击浮动按钮即可唤起 AI 助手';
}

// ==================== Show Onboarding ====================
function showOnboarding() {
    hasToken = false;
    statusDot.className = 'dot offline';
    statusLabel.textContent = '未激活';
    onboardCard.style.display = 'block';
    activatedCard.style.display = 'none';
    // 显示"尝试自动获取"按钮
    retryArea.style.display = 'block';
    autoFetchStatus.style.display = 'block';
    autoFetchStatus.className = 'auto-fetch-status';
    autoFetchStatus.textContent = '点击下方按钮尝试自动获取 Token，或手动粘贴';
}

// ==================== Try One Endpoint ====================
function tryFetchEndpoint(url, callback) {
    fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: 'extension_user' })
    })
    .then(function(r) {
        if (!r.ok) throw new Error('HTTP ' + r.status);
        return r.json();
    })
    .then(function(data) {
        var t = data.token || data.data || data.access_token || '';
        if (t) {
            callback(null, t, url);
        } else {
            callback(new Error('Empty token from ' + url));
        }
    })
    .catch(function(err) {
        callback(err);
    });
}

// ==================== Auto-fetch Token ====================
function autoFetchToken() {
    autoFetchStatus.style.display = 'block';
    autoFetchStatus.className = 'auto-fetch-status';
    autoFetchStatus.textContent = '正在自动获取 Token...';

    var idx = 0;

    function tryNext() {
        if (idx >= TOKEN_ENDPOINTS.length) {
            // All endpoints failed
            autoFetchStatus.textContent = '⚠️ 自动获取失败，请手动粘贴 Token';
            autoFetchStatus.className = 'auto-fetch-status fail';
            if (!hasToken) {
                retryArea.style.display = 'block';
                statusDot.className = 'dot offline';
                statusLabel.textContent = '未连接';
            }
            return;
        }

        var url = TOKEN_ENDPOINTS[idx];
        autoFetchStatus.textContent = '正在连接 QwenPaw 获取 Token... (' + (idx + 1) + '/' + TOKEN_ENDPOINTS.length + ')';

        tryFetchEndpoint(url, function(err, token, sourceUrl) {
            if (err) {
                idx++;
                tryNext();
                return;
            }

            // Success!
            autoFetchStatus.textContent = '✅ 已自动获取 Token (via ' + sourceUrl.split('/').slice(-2).join('/') + ')';
            autoFetchStatus.className = 'auto-fetch-status success';

            chrome.storage.sync.set({ teamchat_token: token }, function() {
                showActivated(token);
                tokenInput.value = token;
                // 不再自动关闭，让用户确认
            });
        });
    }

    tryNext();
}

// ==================== Save Token Manually ====================
function saveAndActivate(token) {
    if (!token || token.trim().length === 0) return;

    token = token.trim();
    chrome.storage.sync.set({ teamchat_token: token }, function() {
        showActivated(token);
        // 不再自动关闭，弹窗停留供确认
    });
}

// ==================== Reset Token ====================
function resetToken() {
    chrome.storage.sync.remove('teamchat_token', function() {
        // 清除后刷新页面，确保状态更新
        window.location.reload();
    });
}

// ==================== Init ====================
function init() {
    chrome.storage.sync.get(['teamchat_token'], function(result) {
        if (result.teamchat_token) {
            showActivated(result.teamchat_token);
            tokenInput.value = result.teamchat_token;
            autoFetchStatus.style.display = 'none';
            retryArea.style.display = 'none';
        } else {
            showOnboarding();
        }
    });
}

// ==================== Event Listeners ====================
document.addEventListener('DOMContentLoaded', function() {
    activateBtn.addEventListener('click', function() {
        var token = tokenInput.value.trim();
        if (!token) {
            tokenInput.focus();
            tokenInput.style.borderColor = '#ff4d4f';
            setTimeout(function() { tokenInput.style.borderColor = ''; }, 1500);
            return;
        }
        saveAndActivate(token);
    });

    tokenInput.addEventListener('keydown', function(e) {
        if (e.key === 'Enter') {
            activateBtn.click();
        }
    });

    tokenInput.addEventListener('paste', function() {
        setTimeout(function() {
            tokenInput.value = tokenInput.value.trim();
        }, 50);
    });

    retryBtn.addEventListener('click', function() {
        autoFetchStatus.style.display = 'block';
        autoFetchStatus.className = 'auto-fetch-status';
        autoFetchStatus.textContent = '正在获取 Token...';
        statusDot.className = 'dot loading';
        statusLabel.textContent = '连接中...';
        autoFetchToken();
    });

    if (resetTokenBtn) {
        resetTokenBtn.addEventListener('click', resetToken);
    }

    init();
});