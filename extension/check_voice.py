with open(r'C:\Users\Administrator\Desktop\711\content.js', 'r', encoding='utf-8') as f:
    content = f.read()

# Check presence of new functions
checks = [
    'FEMALE_NAMES',
    'MALE_NAMES',
    'getZhVoices',
    'guessVoiceGender',
    'getVoicesByGender',
    'getCurrentVoice',
    'cycleVoice',
    'getVoiceLabel',
    '_voiceToggleTimer',
]
for c in checks:
    if c in content:
        print(f'[OK] {c}')
    else:
        print(f'[MISSING] {c}')

# Check old functions removed
if 'getVoiceByGender' in content:
    print('[WARN] getVoiceByGender still present')
else:
    print('[OK] getVoiceByGender removed')