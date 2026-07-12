"""Add Video Summary feature to AI PRO content.js"""
import re

path = r'C:\Users\Administrator\Desktop\711\content.js'
with open(path, 'r', encoding='utf-8') as f:
    content = f.read()

# === 1. Add i18n strings (after 'voiceSwitch' in all 4 languages) ===
voice_key = "voiceSwitch: '切换语音',"
video_i18n = "            videoSummary: '🎬 视频总结',\n            videoAnalyzing: '🎬 正在分析视频…',"
content = content.replace(voice_key, voice_key + '\n' + video_i18n)

voice_key2 = "voiceSwitch: '切換語音',"
video_i18n2 = "            videoSummary: '🎬 視頻總結',\n            videoAnalyzing: '🎬 正在分析視頻…',"
content = content.replace(voice_key2, voice_key2 + '\n' + video_i18n2)

voice_key3 = "voiceSwitch: 'Switch Voice',"
video_i18n3 = "            videoSummary: '🎬 Video Summary',\n            videoAnalyzing: '🎬 Analyzing video...',"
content = content.replace(voice_key3, voice_key3 + '\n' + video_i18n3)

voice_key4 = "voiceSwitch: 'ボイス切替',"
video_i18n4 = "            videoSummary: '🎬 動画要約',\n            videoAnalyzing: '🎬 動画を分析中…',"
content = content.replace(voice_key4, voice_key4 + '\n' + video_i18n4)

# === 2. Add toolbar button (after tc-btn-scrape) ===
old_toolbar = """<button class="tc-tool-btn" id="tc-btn-scrape" title="${t('scrape')}">🎬</button>"""
if old_toolbar not in content:
    # Try alternative
    old_toolbar = """<button class="tc-tool-btn" id="tc-btn-scrape" title="${t('scrape')}">📊</button>"""
    
new_toolbar = old_toolbar + '\n                <button class="tc-tool-btn" id="tc-btn-video" title="${t(\'videoSummary\')}">🎬</button>'
content = content.replace(old_toolbar, new_toolbar)

# === 3. Add page detection function (after extractGeneralContent) ===
old_general = """    function extractGeneralContent() {
        return extractMainContent();
    }"""
new_general = """// ==================== 视频页检测 ====================
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
            (info.tags ? '【标签】' + info.tags + '\n' : '') +
            '\n请用以下格式回复:\n' +
            '## 视频要点\n' +
            '1. ...\n2. ...\n\n## 一句话总结\n...';
        sendMessageToAI(prompt);
    }
    
    function extractGeneralContent() {
        return extractMainContent();
    }"""
content = content.replace(old_general, new_general)

# === 4. Add event handler in bindToolbarButtons ===
old_voice_handler = """var btnVoice = panel.querySelector('#tc-btn-voice');
        if (btnVoice) {
            btnVoice.addEventListener('click', function() {"""
new_voice_handler = """var btnVideo = panel.querySelector('#tc-btn-video');
        if (btnVideo) {
            btnVideo.addEventListener('click', function() {
                summarizeVideo();
            });
            // 只在视频页显示
            if (!isVideoPage()) btnVideo.style.display = 'none';
        }
        
        var btnVoice = panel.querySelector('#tc-btn-voice');
        if (btnVoice) {
            btnVoice.addEventListener('click', function() {"""
content = content.replace(old_voice_handler, new_voice_handler)

# === 5. Add /video command in processShortcuts or showCommandHints ===
# Find the /summary command
old_summary_cmd = "'/summary': {"
new_summary_cmd = "'/video': { desc: '🎬 视频总结', action: function() { summarizeVideo(); } },\n        '/summary': {"
content = content.replace(old_summary_cmd, new_summary_cmd, 1)

with open(path, 'w', encoding='utf-8') as f:
    f.write(content)

print('DONE - Video summary feature added')
print('Verify:')
for kw in ['isVideoPage', 'extractVideoInfo', 'summarizeVideo', 'tc-btn-video', 'videoSummary']:
    if kw in content:
        print(f'  [OK] {kw}')
    else:
        print(f'  [MISSING] {kw}')