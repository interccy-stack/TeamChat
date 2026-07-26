#!/usr/bin/env python3
"""测试媒体文件服务"""

import sys
from pathlib import Path

# 添加插件目录到路径
plugin_dir = Path(__file__).parent
sys.path.insert(0, str(plugin_dir))

# 测试文件是否存在
media_file = plugin_dir / "media" / "nest_bird.svg"
print(f"检查文件: {media_file}")
print(f"文件存在: {media_file.exists()}")

if media_file.exists():
    print(f"文件大小: {media_file.stat().st_size} bytes")
    content = media_file.read_text(encoding='utf-8')
    print(f"文件内容前200字符: {content[:200]}")
else:
    print("❌ 文件不存在！")
    print(f"media目录内容:")
    media_dir = plugin_dir / "media"
    if media_dir.exists():
        for f in media_dir.iterdir():
            print(f"  - {f.name}")
    else:
        print("  media目录不存在！")
