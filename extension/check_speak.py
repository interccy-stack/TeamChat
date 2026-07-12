with open(r'C:\Users\Administrator\Desktop\711\content.js', 'r', encoding='utf-8') as f:
    content = f.read()

# Find speakText function
idx = content.index('function speakText')
end = content.index('window.speechSynthesis.speak(utterance);', idx)
section = content[idx:end+50]
print(section)
print('---')
# Check for JS syntax issues
import re
# Check regex patterns are valid
lines = section.split('\n')
for i, line in enumerate(lines):
    if '.replace(' in line:
        print(f'Line {i}: {line.strip()}')