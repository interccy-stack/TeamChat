import re

path = r'C:\Users\Administrator\Desktop\711\content.js'
with open(path, 'r', encoding='utf-8') as f:
    content = f.read()

# Old voice section start
old_start = '    var currentVoiceGender = localStorage.getItem'
old_end = "        window.speechSynthesis.speak(utterance);\n    }"

# New voice code
new_code = r'''    var currentVoiceGender = localStorage.getItem('tc_voice_gender') || 'female';
    var currentVoiceIdx = parseInt(localStorage.getItem('tc_voice_idx')) || 0;
    var availableVoices = [];

    // 知名中文语音名模式（支持 Edge 微软语音 + Chrome 系统语音）
    var FEMALE_NAMES = ['xiaoxiao','xiaoyi','yating','hanhan','zhiwei','hsiaochen','hsioayu',
                        'xia','xiao','mei','ya','hui','han','ling','tong','ying','shasha'];
    var MALE_NAMES   = ['yunyang','yunxi','yunjian','yunfeng','yunhao','yunye','yunlong',
                        'yun','kai','jian','feng','qiang','yang','wei','liang','hao','hong'];

    function loadVoices() {
        if (!window.speechSynthesis) return [];
        availableVoices = window.speechSynthesis.getVoices();
        return availableVoices;
    }

    function getZhVoices() {
        var voices = availableVoices.length > 0 ? availableVoices : loadVoices();
        var zh = voices.filter(function(v) { return v.lang && v.lang.startsWith('zh'); });
        if (zh.length === 0) {
            zh = voices.filter(function(v) {
                return v.lang && (v.lang.startsWith('zh') || v.lang.startsWith('cmn') || v.lang.startsWith('yue'));
            });
        }
        return zh.length > 0 ? zh : voices;
    }

    function guessVoiceGender(voice) {
        var name = voice.name.toLowerCase();
        if (name.indexOf('female') !== -1 || name.indexOf('女') !== -1) return 'female';
        if (name.indexOf('male')   !== -1 || name.indexOf('男') !== -1) return 'male';
        for (var f = 0; f < FEMALE_NAMES.length; f++) {
            if (name.indexOf(FEMALE_NAMES[f]) !== -1) return 'female';
        }
        for (var m = 0; m < MALE_NAMES.length; m++) {
            if (name.indexOf(MALE_NAMES[m]) !== -1) return 'male';
        }
        return null;
    }

    function getVoicesByGender(gender) {
        var zhVoices = getZhVoices();
        var matched = [], others = [];
        for (var i = 0; i < zhVoices.length; i++) {
            var g = guessVoiceGender(zhVoices[i]);
            if (g === gender) matched.push(zhVoices[i]);
            else others.push(zhVoices[i]);
        }
        if (matched.length > 0) return matched;
        if (others.length > 0) return others;
        return zhVoices.length > 0 ? zhVoices : availableVoices;
    }

    function getCurrentVoice() {
        var voices = getVoicesByGender(currentVoiceGender);
        if (voices.length === 0) return null;
        var idx = currentVoiceIdx % voices.length;
        return voices[idx];
    }

    function cycleVoice() {
        var voices = getVoicesByGender(currentVoiceGender);
        if (voices.length <= 1) return null;
        currentVoiceIdx = (currentVoiceIdx + 1) % voices.length;
        localStorage.setItem('tc_voice_idx', String(currentVoiceIdx));
        return voices[currentVoiceIdx];
    }

    function getVoiceLabel(voice) {
        if (!voice) return currentVoiceGender === 'female' ? '女声' : '男声';
        var g = guessVoiceGender(voice) || currentVoiceGender;
        var icon = g === 'female' ? '(F)' : '(M)';
        return icon + ' ' + voice.name;
    }

    // 切换语音：单击切换性别，双击同性别换声音
    var _voiceToggleTimer = null;
    function toggleVoiceGender() {
        if (_voiceToggleTimer) {
            clearTimeout(_voiceToggleTimer);
            _voiceToggleTimer = null;
            var cycled = cycleVoice();
            if (cycled) {
                addMessage('system', '\ud83d\udd0a ' + getVoiceLabel(cycled));
                speakText('你好，试试这个声音', false);
            } else {
                addMessage('system', '\ud83d\udd0a 只有一种' + (currentVoiceGender === 'female' ? '女声' : '男声'));
            }
            return;
        }
        _voiceToggleTimer = setTimeout(function() {
            _voiceToggleTimer = null;
            currentVoiceGender = currentVoiceGender === 'female' ? 'male' : 'female';
            currentVoiceIdx = 0;
            localStorage.setItem('tc_voice_gender', currentVoiceGender);
            localStorage.setItem('tc_voice_idx', '0');
            var voice = getCurrentVoice();
            addMessage('system', '\ud83d\udd0a ' + t('voiceSwitch') + ': ' + getVoiceLabel(voice));
            var testText = currentVoiceGender === 'female' ? '你好，我是女声' : '你好，我是男声';
            speakText(testText, false);
        }, 300);
    }

    // 语音朗读
    function speakText(text, autoSpeak) {
        if (!window.speechSynthesis) {
            console.log('[AI PRO] 浏览器不支持语音合成');
            return;
        }

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
        utterance.lang = 'zh-CN';
        utterance.rate = 1.05;
        utterance.pitch = 1.0;
        utterance.volume = 1.0;

        var voice = getCurrentVoice();
        if (voice) utterance.voice = voice;

        utterance.onend = function() {
            console.log('[AI PRO] 语音朗读完成');
        };

        window.speechSynthesis.speak(utterance);
    }'''

# Find positions
start_pos = content.index(old_start)
end_pos = content.index(old_end, start_pos) + len(old_end)

new_content = content[:start_pos] + new_code + content[end_pos:]
with open(path, 'w', encoding='utf-8') as f:
    f.write(new_content)
print('DONE - voice code replaced')