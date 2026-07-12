#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
TeamChat 多邮箱数据库升级脚本
添加 account_email 字段到各邮件表
"""

import sqlite3
import os
from pathlib import Path

DB_PATH = Path(__file__).parent / "data" / "teamchat_email.db"

def migrate_add_account_email():
    """添加 account_email 字段到各邮件表"""
    conn = sqlite3.connect(str(DB_PATH))
    cursor = conn.cursor()
    
    # 检查并添加 account_email 字段到各表
    tables = ['inbox', 'sent', 'drafts', 'trash']
    
    for table in tables:
        try:
            # 检查字段是否存在
            cursor.execute(f"PRAGMA table_info({table})")
            columns = [col[1] for col in cursor.fetchall()]
            
            if 'account_email' not in columns:
                cursor.execute(f"ALTER TABLE {table} ADD COLUMN account_email TEXT DEFAULT 'default'")
                print(f"[OK] {table} 表添加 account_email 字段成功")
            else:
                print(f"[INFO] {table} 表已存在 account_email 字段")
        except Exception as e:
            print(f"[ERR] {table} 表添加字段失败: {e}")
    
    conn.commit()
    conn.close()
    print("\n数据库升级完成！")

if __name__ == "__main__":
    migrate_add_account_email()
