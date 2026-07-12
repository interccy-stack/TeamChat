#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
TeamChat 邮件技能模块 - 供AI分身调用
模拟 himalaya CLI 接口，底层使用 email_backend
"""
import sys, json, urllib.request, urllib.parse
sys.stdout.reconfigure(encoding='utf-8')

import os as _os
_API_PORT = _os.environ.get("QWENPAW_API_PORT", "18888")
_API_HOST = _os.environ.get("QWENPAW_API_HOST", "127.0.0.1")
API_BASE = f'http://{_API_HOST}:{_API_PORT}/api/v1/email'

def list_emails(folder='INBOX', limit=10, offset=0):
    """列出邮件 (himalaya envelope list)"""
    endpoints = {'INBOX':'/inbox', 'Sent':'/sent', 'Drafts':'/drafts', 'Trash':'/trash'}
    ep = endpoints.get(folder, '/inbox')
    url = f'{API_BASE}{ep}?limit={limit}&offset={offset}'
    try:
        resp = urllib.request.urlopen(url, timeout=10)
        raw = resp.read()
        try:
            data = json.loads(raw)
        except json.JSONDecodeError:
            return {'success': False, 'error': f'非JSON响应: {raw[:200]}'}
        return data
    except Exception as e:
        return {'success': False, 'error': str(e)}

def read_email(folder, id):
    """阅读邮件 (himalaya message read)"""
    endpoints = {'INBOX':'/inbox', 'Sent':'/sent', 'Drafts':'/drafts', 'Trash':'/trash'}
    ep = endpoints.get(folder, '/inbox')
    url = f'{API_BASE}{ep}/{id}'
    try:
        resp = urllib.request.urlopen(url, timeout=10)
        raw = resp.read()
        try:
            data = json.loads(raw)
        except json.JSONDecodeError:
            return {'success': False, 'error': f'非JSON响应: {raw[:200]}'}
        return data
    except Exception as e:
        return {'success': False, 'error': str(e)}

def send_email(to_addr, subject, body):
    """发送邮件 (himalaya message write + send)"""
    data = json.dumps({'to_addr': to_addr, 'subject': subject, 'body': body}).encode('utf-8')
    req = urllib.request.Request(f'{API_BASE}/send', data=data, headers={'Content-Type': 'application/json'})
    try:
        resp = urllib.request.urlopen(req, timeout=30)
        raw = resp.read()
        try:
            return json.loads(raw)
        except json.JSONDecodeError:
            return {'success': False, 'error': f'非JSON响应: {raw[:200]}'}
    except Exception as e:
        return {'success': False, 'error': str(e)}

def get_stats():
    """获取邮箱统计"""
    try:
        resp = urllib.request.urlopen(f'{API_BASE}/stats', timeout=5)
        raw = resp.read()
        try:
            return json.loads(raw)
        except json.JSONDecodeError:
            return {'success': False, 'error': f'非JSON响应: {raw[:200]}'}
    except Exception as e:
        return {'success': False, 'error': str(e)}

def get_config():
    """获取邮箱配置"""
    try:
        resp = urllib.request.urlopen(f'{API_BASE}/config', timeout=5)
        raw = resp.read()
        try:
            return json.loads(raw)
        except json.JSONDecodeError:
            return {'success': False, 'error': f'非JSON响应: {raw[:200]}'}
    except Exception as e:
        return {'success': False, 'error': str(e)}

if __name__ == '__main__':
    cmd = sys.argv[1] if len(sys.argv) > 1 else 'help'
    
    if cmd == 'list':
        folder = sys.argv[2] if len(sys.argv) > 2 else 'INBOX'
        result = list_emails(folder)
        if result.get('success'):
            emails = result.get('emails', [])
            print(f'📧 {folder} ({len(emails)}封)')
            for m in emails:
                subj = (m.get('subject') or '(无主题)')[:60]
                addr = m.get('from_addr') or m.get('to_addr') or ''
                print(f'  [{m["id"]}] {subj} - {addr}')
        else:
            print(f'❌ {result.get("error", "获取失败")}')
    
    elif cmd == 'read':
        folder = sys.argv[2] if len(sys.argv) > 2 else 'INBOX'
        id = int(sys.argv[3]) if len(sys.argv) > 3 else 0
        result = read_email(folder, id)
        if result.get('success') and result.get('email'):
            m = result['email']
            print(f'📄 {m.get("subject","(无主题)")}')
            print(f'  发件人: {m.get("from_name","") or m.get("from_addr","未知")}')
            print(f'  时间: {m.get("received_date","") or m.get("sent_date","")}')
            print(f'  {"─"*40}')
            print(m.get('body','(无内容)')[:500])
        else:
            print(f'❌ {result.get("error", "未找到")}')
    
    elif cmd == 'send':
        to = sys.argv[2] if len(sys.argv) > 2 else ''
        subject = sys.argv[3] if len(sys.argv) > 3 else ''
        body = sys.argv[4] if len(sys.argv) > 4 else ''
        result = send_email(to, subject, body)
        if result.get('success'):
            print(f'✅ 发送成功 -> {to}')
        else:
            print(f'❌ 发送失败: {result.get("message","未知错误")}')
    
    elif cmd == 'stats':
        result = get_stats()
        if result.get('success'):
            s = result.get('stats', {})
            print(f'📊 邮箱统计: 收件 {s.get("inbox_total",0)} | 发件 {s.get("sent_total",0)} | 草稿 {s.get("drafts_total",0)} | 回收站 {s.get("trash_total",0)}')
        else:
            print(f'❌ {result.get("error", "获取失败")}')
    
    elif cmd == 'config':
        result = get_config()
        if result.get('success') and result.get('config'):
            c = result['config']
            print(f'⚙️ 邮箱配置: {c.get("email","未设置")}')
            print(f'   SMTP: {c.get("smtp_host","")}:{c.get("smtp_port","")}')
            print(f'   IMAP: {c.get("imap_host","")}:{c.get("imap_port","")}')
        else:
            print('⚙️ 未配置邮箱')
    
    else:
        print('📧 TeamChat 邮件技能')
        print('用法:')
        print('  python email_skill.py list [INBOX|Sent|Drafts|Trash]')
        print('  python email_skill.py read [INBOX|Sent|Drafts|Trash] <id>')
        print('  python email_skill.py send <to> <subject> <body>')
        print('  python email_skill.py stats')
        print('  python email_skill.py config')
