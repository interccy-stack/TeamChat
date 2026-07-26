# -*- coding: utf-8 -*-
"""V5.2.0 功能检查脚本"""
import sys
sys.path.insert(0, '.')
import ai_group_chat

print('=== V5.2.0 功能检查 ===')
print()

# 1. 文件管理
print('[1] AI群聊文件管理:')
print('  - FileStore类:', 'OK' if hasattr(ai_group_chat, 'FileStore') else 'FAIL')
print('  - save_file方法:', 'OK' if hasattr(ai_group_chat.FileStore, 'save_file') else 'FAIL')
print('  - get_file方法:', 'OK' if hasattr(ai_group_chat.FileStore, 'get_file') else 'FAIL')
print('  - list_files方法:', 'OK' if hasattr(ai_group_chat.FileStore, 'list_files') else 'FAIL')
print('  - delete_file方法:', 'OK' if hasattr(ai_group_chat.FileStore, 'delete_file') else 'FAIL')

# 2. 预览功能
print()
print('[2] 在线预览:')
print('  - can_preview方法:', 'OK' if hasattr(ai_group_chat.FileStore, 'can_preview') else 'FAIL')
print('  - get_preview_content方法:', 'OK' if hasattr(ai_group_chat.FileStore, 'get_preview_content') else 'FAIL')

# 3. 上下文感知
print()
print('[3] AI群聊上下文感知:')
engine = ai_group_chat.AIGroupChatEngine('.')
print('  - _get_chat_context方法:', 'OK' if hasattr(engine, '_get_chat_context') else 'FAIL')
print('  - _format_context_for_agent方法:', 'OK' if hasattr(engine, '_format_context_for_agent') else 'FAIL')
print('  - _call_agent_api_with_context方法:', 'OK' if hasattr(engine, '_call_agent_api_with_context') else 'FAIL')

# 4. 路由
print()
print('[4] API路由:')
router = ai_group_chat.ai_chat_router
routes = [str(r.path) for r in router.routes]
print('  - /files/upload:', 'OK' if any('upload' in r for r in routes) else 'FAIL')
print('  - /files (list):', 'OK' if any('files' in r and '{' not in r for r in routes) else 'FAIL')
print('  - /files/{id}/download:', 'OK' if any('download' in r for r in routes) else 'FAIL')
print('  - /files/{id}/preview:', 'OK' if any('preview' in r for r in routes) else 'FAIL')
print('  - /files/{id} (delete):', 'OK' if any('delete' in str(r) for r in router.routes) else 'FAIL')

print()
print('=== 检查完成 ===')
