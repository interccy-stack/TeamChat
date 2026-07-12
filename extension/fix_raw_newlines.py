"""Fix: replace entire prompt block with correct version"""
import re

path = r'C:\Users\Administrator\Desktop\711\content.js'

with open(path, 'r', encoding='utf-8') as f:
    content = f.read()

# The correct block (Python \n = literal backslash-n in file)
new_block = (
    "        var prompt = '请总结以下' + info.platform + '视频的核心要点（分点列出）：\\n\\n' +\n"
    "            '【标题】' + info.title + '\\n' +\n"
    "            '【频道】' + info.channel + '\\n' +\n"
    "            '【简介】' + (info.description || '(无)') + '\\n' +\n"
    "            (info.tags ? '【标签】' + info.tags + '\\n' : '') + '\\n请用以下格式回复:\\n' +\n"
    "            '## 视频要点\\n' +\n"
    "            '1. ...\\n2. ...\\n\\n## 一句话总结\\n...';"
)

# Find the broken block: from "var prompt =" to "...';"
idx = content.find("var prompt = '请总结以下'")
if idx != -1:
    end_idx = content.find("...';", idx)
    if end_idx != -1:
        end_idx += 5  # include "...';"
        old = content[idx:end_idx]
        print(f"Replacing {len(old)} chars")
        content = content[:idx] + new_block + content[end_idx:]
        with open(path, 'w', encoding='utf-8') as f:
            f.write(content)
        print("FIXED!")
        # Verify
        with open(path, 'r', encoding='utf-8') as f:
            verify_lines = f.readlines()
        for i in range(751, min(762, len(verify_lines))):
            print(f"Line {i+1}: {verify_lines[i].rstrip()}")
    else:
        print("End marker '...'; not found!")
else:
    print("Start marker not found!")