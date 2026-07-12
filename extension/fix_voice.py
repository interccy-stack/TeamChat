# Read content.js lines
with open(r'C:\Users\Administrator\Desktop\711\content.js', 'r', encoding='utf-8') as f:
    lines = f.readlines()

# Print lines 1634-1720
for i in range(1633, 1720):
    print(f'{i+1}: {lines[i].rstrip()}')