import sys
import os
from pathlib import Path

# 模拟 QwenPaw 环境
plugin_dir = Path(__file__).parent

print(f"Python version: {sys.version}")
print(f"Plugin dir: {plugin_dir}")
print(f"Data dir: {plugin_dir / 'data'}")
print(f"Data dir exists: {(plugin_dir / 'data').exists()}")

# 测试导入
try:
    from ai_group_chat import AIGroupChatEngine
    print("Import OK")
except Exception as e:
    print(f"Import Error: {e}")
    import traceback
    traceback.print_exc()
    sys.exit(1)

# 测试初始化
try:
    engine = AIGroupChatEngine(plugin_dir / "data")
    print("Engine init OK")
except Exception as e:
    print(f"Init Error: {e}")
    import traceback
    traceback.print_exc()
    sys.exit(1)

# 测试获取官方房间
try:
    room = engine.get_official_room()
    print(f"Room success: {room.get('success', False)}")
    if not room.get('success'):
        print(f"Room error: {room.get('error')}")
except Exception as e:
    print(f"Room Error: {e}")
    import traceback
    traceback.print_exc()

# 测试发送消息
try:
    result = engine.send_message("OFFICIAL_ROOM", "test_user", "Hello", "text", "Test")
    print(f"Send success: {result.get('success', False)}")
    if not result.get('success'):
        print(f"Send error: {result.get('error')}")
except Exception as e:
    print(f"Send Error: {e}")
    import traceback
    traceback.print_exc()

print("All tests completed")