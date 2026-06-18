import sys, io
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')
path = r"C:\Users\Administrator\.qwenpaw\plugins\team_chat\frontend\dist\index.js"
with open(path, 'r', encoding='utf-8') as f:
    lines = f.readlines()

# Print lines 1410-1430 (sidebar end + PPT start area)
for j in range(1408, 1435):
    s = lines[j].rstrip() if j < len(lines) else ""
    print(f"{j+1:4d}: {s[:200]}")
print("---")
# Print last 10 lines
for j in range(len(lines)-10, len(lines)):
    s = lines[j].rstrip()
    print(f"{j+1:4d}: {s[:200]}")