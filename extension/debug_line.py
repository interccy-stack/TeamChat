with open(r'C:\Users\Administrator\Desktop\711\content.js', 'rb') as f:
    lines = f.readlines()
# Lines 748-760 (0-indexed: 747-759)
for i in range(747, min(760, len(lines))):
    line = lines[i]
    # Check for raw newlines inside quotes
    has_raw_nl = b'\n' in line.strip(b'\r\n') or b'\r' in line.strip(b'\r\n')
    print(f"Line {i+1}: {repr(line[:120])} {'<-- RAW NEWLINE!' if has_raw_nl else ''}")