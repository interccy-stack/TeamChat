# Apply voice fix: preload voices + onerror fallback
import re

path = r'C:\Users\Administrator\Desktop\711\content.js'
with open(path, 'r', encoding='utf-8') as f:
    content = f.read()

# 1. Add voiceschanged preload after currentVoiceIdx
old1 = "    var currentVoiceIdx = parseInt(localStorage.getItem('tc_voice_idx')) || 0;\n    var availableVoices = [];"
new1 = """    var currentVoiceIdx = parseInt(localStorage.getItem('tc_voice_idx')) || 0;
    var availableVoices = [];
    var _voicesReady = false;

    // 预加载语音列表（Chrome 异步）
    if (window.speechSynthesis) {
        window.speechSynthesis.getVoices();
        window.speechSynthesis.onvoiceschanged = function() {
            availableVoices = window.speechSynthesis.getVoices();
            _voicesReady = true;
            console.log('[AI PRO] Voices loaded:', availableVoices.length);
        };
    }"""
content = content.replace(old1, new1, 1)

# 2. Fix speakText end: add onerror fallback
old2 = """        var voice = getCurrentVoice();
        if (voice) utterance.voice = voice;

        utterance.onend = function() {
            console.log('[AI PRO] 语音朗读完成');
        };

        window.speechSynthesis.speak(utterance);"""

new2 = """        var voice = getCurrentVoice();
        if (voice) utterance.voice = voice;

        utterance.onend = function() {
            console.log('[AI PRO] 语音朗读完成');
        };
        utterance.onerror = function(e) {
            console.log('[AI PRO] 语音错误:', e.error, voice ? voice.name : 'default');
            // 选的声音失败 -> 用默认声音重试
            if (voice && (e.error === 'synthesis-failed' || e.error === 'synthesis-unavailable')) {
                var retry = new SpeechSynthesisUtterance(cleanText);
                retry.lang = 'zh-CN';
                retry.rate = 1.05;
                retry.volume = 1.0;
                window.speechSynthesis.speak(retry);
            }
        };

        window.speechSynthesis.speak(utterance);"""

content = content.replace(old2, new2, 1)

with open(path, 'w', encoding='utf-8') as f:
    f.write(content)
print('DONE')