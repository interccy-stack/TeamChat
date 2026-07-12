"""
TeamChat邮件系统 - 数据库模块（单一数据库版本）

功能：完整邮箱功能（收件/发件/草稿/联系人/回收站/配置）
"""

import sqlite3
import json
import os
import logging
import base64
import uuid
from pathlib import Path
from datetime import datetime
from typing import Optional, List, Dict, Any
from contextlib import contextmanager

logger = logging.getLogger(__name__)

# 插件数据目录
_PLUGIN_DATA_DIR = Path(os.path.dirname(__file__)) / "data"
_DB_PATH = _PLUGIN_DATA_DIR / "teamchat_email.db"

# 确保数据目录存在
_PLUGIN_DATA_DIR.mkdir(exist_ok=True)

# 密码加密（简化版：base64混淆）
_ENCRYPTION_KEY = "teamchat-email-key-2026".encode()

def _encrypt(value: str) -> str:
    """简单加密"""
    if not value:
        return ""
    encoded = base64.b64encode(value.encode()).decode()
    return encoded

def _decrypt(value: str) -> str:
    """简单解密"""
    if not value:
        return ""
    try:
        decoded = base64.b64decode(value.encode()).decode()
        return decoded
    except:
        return value


@contextmanager
def get_db():
    """获取数据库连接"""
    conn = sqlite3.connect(str(_DB_PATH))
    conn.row_factory = sqlite3.Row
    try:
        yield conn
        conn.commit()
    except Exception as e:
        conn.rollback()
        logger.error(f"[EmailDB] Database error: {e}")
        raise
    finally:
        conn.close()


def init_db():
    """初始化数据库表"""
    with get_db() as conn:
        cursor = conn.cursor()

        # 邮件配置表
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS email_configs (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                email TEXT NOT NULL UNIQUE,
                display_name TEXT,
                provider TEXT DEFAULT 'custom',
                smtp_host TEXT,
                smtp_port INTEGER,
                smtp_ssl INTEGER DEFAULT 1,
                smtp_username TEXT,
                smtp_password TEXT,
                imap_host TEXT,
                imap_port INTEGER,
                imap_ssl INTEGER DEFAULT 1,
                imap_username TEXT,
                imap_password TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """)

        # 收件箱
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS inbox (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                uid TEXT NOT NULL UNIQUE,
                from_addr TEXT NOT NULL,
                from_name TEXT,
                subject TEXT,
                body TEXT,
                html_body TEXT,
                sent_date TIMESTAMP,
                received_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                read_status INTEGER DEFAULT 0,
                attachments TEXT,
                folder TEXT DEFAULT 'INBOX',
                size INTEGER DEFAULT 0,
                flags TEXT DEFAULT '',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """)

        # 发件箱
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS sent (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                to_addr TEXT NOT NULL,
                to_name TEXT,
                subject TEXT,
                body TEXT,
                html_body TEXT,
                sent_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                attachments TEXT,
                size INTEGER DEFAULT 0,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """)

        # 草稿箱
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS drafts (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                to_addr TEXT,
                subject TEXT,
                body TEXT,
                html_body TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """)

        # 回收站
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS trash (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                original_folder TEXT NOT NULL,
                original_id INTEGER NOT NULL,
                folder_type TEXT NOT NULL,
                from_addr TEXT,
                to_addr TEXT,
                subject TEXT,
                body TEXT,
                sent_date TIMESTAMP,
                deleted_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """)

        # 联系人
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS contacts (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT NOT NULL,
                email TEXT NOT NULL,
                phone TEXT,
                company TEXT,
                website TEXT,
                notes TEXT,
                group_name TEXT DEFAULT 'default',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """)

        # 联系人分组
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS contact_groups (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT NOT NULL UNIQUE,
                description TEXT,
                color TEXT DEFAULT '#1890ff',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """)

        # 创建索引
        cursor.execute("CREATE INDEX IF NOT EXISTS idx_inbox_uid ON inbox(uid)")
        cursor.execute("CREATE INDEX IF NOT EXISTS idx_inbox_date ON inbox(sent_date DESC)")
        cursor.execute("CREATE INDEX IF NOT EXISTS idx_sent_date ON sent(sent_date DESC)")
        cursor.execute("CREATE INDEX IF NOT EXISTS idx_contacts_email ON contacts(email)")

        # 初始化默认分组
        cursor.execute("""
            INSERT OR IGNORE INTO contact_groups (name, description, color)
            VALUES ('default', '默认分组', '#1890ff')
        """)

    logger.info("[EmailDB] Database initialized")


class EmailDB:
    """邮箱数据库操作类"""

    @staticmethod
    def get_all_configs() -> List[Dict[str, Any]]:
        """获取所有邮件配置（多邮箱）"""
        with get_db() as conn:
            cursor = conn.cursor()
            cursor.execute("SELECT * FROM email_configs ORDER BY created_at DESC")
            rows = cursor.fetchall()
            configs = []
            for row in rows:
                config = dict(row)
                # 解密密码
                if config.get('smtp_password'):
                    config['smtp_password'] = _decrypt(config['smtp_password'])
                if config.get('imap_password'):
                    config['imap_password'] = _decrypt(config['imap_password'])
                # 移除敏感信息（可选）
                # config.pop('smtp_password', None)
                # config.pop('imap_password', None)
                configs.append(config)
            return configs

    @staticmethod
    def get_config(config_id: int = None) -> Optional[Dict[str, Any]]:
        """获取单个邮件配置（按ID，未指定则返回第一个）"""
        with get_db() as conn:
            cursor = conn.cursor()
            if config_id:
                cursor.execute("SELECT * FROM email_configs WHERE id = ?", (config_id,))
            else:
                cursor.execute("SELECT * FROM email_configs ORDER BY created_at DESC LIMIT 1")
            row = cursor.fetchone()
            if row:
                config = dict(row)
                # 解密密码
                if config.get('smtp_password'):
                    config['smtp_password'] = _decrypt(config['smtp_password'])
                if config.get('imap_password'):
                    config['imap_password'] = _decrypt(config['imap_password'])
                return config
        return None

    @staticmethod
    def save_config(config: Dict[str, Any]) -> Optional[int]:
        """保存邮件配置（新增或更新）"""
        try:
            with get_db() as conn:
                cursor = conn.cursor()

                # 加密密码
                smtp_pwd = _encrypt(config.get('smtp_password', ''))
                imap_pwd = _encrypt(config.get('imap_password', ''))

                # 如果有ID则更新，否则插入
                config_id = config.get('id')
                if config_id:
                    cursor.execute("""
                        UPDATE email_configs SET
                            email = ?, display_name = ?, provider = ?,
                            smtp_host = ?, smtp_port = ?, smtp_ssl = ?,
                            smtp_username = ?, smtp_password = ?,
                            imap_host = ?, imap_port = ?, imap_ssl = ?,
                            imap_username = ?, imap_password = ?,
                            updated_at = CURRENT_TIMESTAMP
                        WHERE id = ?
                    """, (
                        config.get('email'),
                        config.get('display_name'),
                        config.get('provider', 'custom'),
                        config.get('smtp_host'),
                        config.get('smtp_port'),
                        config.get('smtp_ssl', 1),
                        config.get('smtp_username'),
                        smtp_pwd,
                        config.get('imap_host'),
                        config.get('imap_port'),
                        config.get('imap_ssl', 1),
                        config.get('imap_username'),
                        imap_pwd,
                        config_id
                    ))
                    return config_id
                else:
                    cursor.execute("""
                        INSERT INTO email_configs (
                            email, display_name, provider,
                            smtp_host, smtp_port, smtp_ssl, smtp_username, smtp_password,
                            imap_host, imap_port, imap_ssl, imap_username, imap_password
                        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                    """, (
                        config.get('email'),
                        config.get('display_name'),
                        config.get('provider', 'custom'),
                        config.get('smtp_host'),
                        config.get('smtp_port'),
                        config.get('smtp_ssl', 1),
                        config.get('smtp_username'),
                        smtp_pwd,
                        config.get('imap_host'),
                        config.get('imap_port'),
                        config.get('imap_ssl', 1),
                        config.get('imap_username'),
                        imap_pwd
                    ))
                    return cursor.lastrowid
        except Exception as e:
            logger.error(f"[EmailDB] Failed to save config: {e}")
            return None

    @staticmethod
    def delete_config(config_id: int) -> bool:
        """删除邮件配置（按ID）"""
        try:
            with get_db() as conn:
                cursor = conn.cursor()
                cursor.execute("DELETE FROM email_configs WHERE id = ?", (config_id,))
                return cursor.rowcount > 0
        except Exception as e:
            logger.error(f"[EmailDB] Failed to delete config: {e}")
            return False

    @staticmethod
    def get_inbox(limit: int = 50, offset: int = 0, folder: str = 'INBOX', account_email: str = '') -> List[Dict[str, Any]]:
        """获取收件箱邮件（支持多邮箱账户）"""
        with get_db() as conn:
            cursor = conn.cursor()
            if account_email:
                cursor.execute("""
                    SELECT * FROM inbox
                    WHERE folder = ? AND (account_email = ? OR account_email IS NULL OR account_email = '')
                    ORDER BY sent_date DESC
                    LIMIT ? OFFSET ?
                """, (folder, account_email, limit, offset))
            else:
                cursor.execute("""
                    SELECT * FROM inbox
                    WHERE folder = ?
                    ORDER BY sent_date DESC
                    LIMIT ? OFFSET ?
                """, (folder, limit, offset))
            rows = cursor.fetchall()
            return [dict(row) for row in rows]

    @staticmethod
    def add_inbox_email(email: Dict[str, Any]) -> bool:
        """添加收件箱邮件"""
        try:
            with get_db() as conn:
                cursor = conn.cursor()
                cursor.execute("""
                    INSERT OR REPLACE INTO inbox (
                        uid, from_addr, from_name, subject, body, html_body,
                        sent_date, received_date, attachments, folder, size, flags, account_email
                    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                """, (
                    email.get('uid') or email.get('id'),
                    email.get('from_addr'),
                    email.get('from_name'),
                    email.get('subject'),
                    email.get('body'),
                    email.get('html_body'),
                    email.get('sent_date'),
                    email.get('received_date') or datetime.now(),
                    json.dumps(email.get('attachments', [])),
                    email.get('folder', 'INBOX'),
                    email.get('size', 0),
                    json.dumps(email.get('flags', [])),
                    email.get('account_email', '')
                ))
            return True
        except Exception as e:
            logger.error(f"[EmailDB] Failed to add inbox email: {e}")
            return False
    
    @staticmethod
    def get_last_uid(account_email: str, folder: str = 'INBOX') -> Optional[str]:
        """获取指定邮箱已同步的最新UID"""
        try:
            with get_db() as conn:
                cursor = conn.cursor()
                cursor.execute("""
                    SELECT uid FROM inbox 
                    WHERE account_email = ? AND folder = ?
                    ORDER BY CAST(uid AS INTEGER) DESC 
                    LIMIT 1
                """, (account_email, folder))
                row = cursor.fetchone()
                return row[0] if row else None
        except Exception as e:
            logger.error(f"[EmailDB] Failed to get last uid: {e}")
            return None
    
    @staticmethod
    def get_email_count(account_email: str, folder: str = 'inbox') -> int:
        """获取指定邮箱的邮件数量"""
        try:
            with get_db() as conn:
                cursor = conn.cursor()
                table = folder.lower()
                if table not in ['inbox', 'sent', 'drafts', 'trash']:
                    table = 'inbox'
                cursor.execute(f"""
                    SELECT COUNT(*) FROM {table} 
                    WHERE account_email = ?
                """, (account_email,))
                row = cursor.fetchone()
                return row[0] if row else 0
        except Exception as e:
            logger.error(f"[EmailDB] Failed to get email count: {e}")
            return 0

    @staticmethod
    def get_sent(limit: int = 50, offset: int = 0, account_email: str = '') -> List[Dict[str, Any]]:
        """获取已发送邮件（支持多邮箱账户）"""
        with get_db() as conn:
            cursor = conn.cursor()
            if account_email:
                cursor.execute("""
                    SELECT * FROM sent
                    WHERE account_email = ? OR account_email IS NULL OR account_email = ''
                    ORDER BY sent_date DESC
                    LIMIT ? OFFSET ?
                """, (account_email, limit, offset))
            else:
                cursor.execute("""
                    SELECT * FROM sent
                    ORDER BY sent_date DESC
                    LIMIT ? OFFSET ?
                """, (limit, offset))
            rows = cursor.fetchall()
            return [dict(row) for row in rows]

    @staticmethod
    def add_sent_email(email: Dict[str, Any]) -> bool:
        """添加已发送邮件"""
        try:
            with get_db() as conn:
                cursor = conn.cursor()
                cursor.execute("""
                    INSERT INTO sent (
                        to_addr, to_name, subject, body, html_body,
                        sent_date, attachments, size
                    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
                """, (
                    email.get('to_addr'),
                    email.get('to_name'),
                    email.get('subject'),
                    email.get('body'),
                    email.get('html_body'),
                    email.get('sent_date') or datetime.now(),
                    json.dumps(email.get('attachments', [])),
                    email.get('size', 0)
                ))
            return True
        except Exception as e:
            logger.error(f"[EmailDB] Failed to add sent email: {e}")
            return False

    @staticmethod
    def get_drafts(limit: int = 50, offset: int = 0, account_email: str = '') -> List[Dict[str, Any]]:
        """获取草稿列表（支持多邮箱账户）"""
        with get_db() as conn:
            cursor = conn.cursor()
            if account_email:
                cursor.execute("""
                    SELECT * FROM drafts
                    WHERE account_email = ? OR account_email IS NULL OR account_email = ''
                    ORDER BY updated_at DESC
                    LIMIT ? OFFSET ?
                """, (account_email, limit, offset))
            else:
                cursor.execute("""
                    SELECT * FROM drafts
                    ORDER BY updated_at DESC
                    LIMIT ? OFFSET ?
                """, (limit, offset))
            rows = cursor.fetchall()
            return [dict(row) for row in rows]

    @staticmethod
    def add_draft(email: Dict[str, Any]) -> int:
        """添加草稿"""
        try:
            with get_db() as conn:
                cursor = conn.cursor()
                cursor.execute("""
                    INSERT INTO drafts (
                        to_addr, subject, body, html_body, created_at, updated_at
                    ) VALUES (?, ?, ?, ?, ?, ?)
                """, (
                    email.get('to_addr'),
                    email.get('subject'),
                    email.get('body'),
                    email.get('html_body'),
                    email.get('created_at') or datetime.now(),
                    email.get('updated_at') or datetime.now()
                ))
                return cursor.lastrowid
        except Exception as e:
            logger.error(f"[EmailDB] Failed to add draft: {e}")
            return 0

    @staticmethod
    def update_draft(id: int, email: Dict[str, Any]) -> bool:
        """更新草稿"""
        try:
            with get_db() as conn:
                cursor = conn.cursor()
                cursor.execute("""
                    UPDATE drafts SET
                        to_addr = ?, subject = ?, body = ?, html_body = ?, updated_at = ?
                    WHERE id = ?
                """, (
                    email.get('to_addr'),
                    email.get('subject'),
                    email.get('body'),
                    email.get('html_body'),
                    datetime.now(),
                    id
                ))
            return cursor.rowcount > 0
        except Exception as e:
            logger.error(f"[EmailDB] Failed to update draft: {e}")
            return False

    @staticmethod
    def delete_draft(id: int) -> bool:
        """删除草稿"""
        try:
            with get_db() as conn:
                cursor = conn.cursor()
                cursor.execute("DELETE FROM drafts WHERE id = ?", (id,))
            return cursor.rowcount > 0
        except Exception as e:
            logger.error(f"[EmailDB] Failed to delete draft: {e}")
            return False

    @staticmethod
    def get_contacts(limit: int = 100, offset: int = 0, group_name: str = None) -> List[Dict[str, Any]]:
        """获取联系人列表"""
        with get_db() as conn:
            cursor = conn.cursor()
            if group_name:
                cursor.execute("""
                    SELECT * FROM contacts
                    WHERE group_name = ?
                    ORDER BY name ASC
                    LIMIT ? OFFSET ?
                """, (group_name, limit, offset))
            else:
                cursor.execute("""
                    SELECT * FROM contacts
                    ORDER BY name ASC
                    LIMIT ? OFFSET ?
                """, (limit, offset))
            rows = cursor.fetchall()
            return [dict(row) for row in rows]

    @staticmethod
    def add_contact(contact: Dict[str, Any]) -> int:
        """添加联系人"""
        try:
            with get_db() as conn:
                cursor = conn.cursor()
                cursor.execute("""
                    INSERT INTO contacts (
                        name, email, phone, company, website, notes, group_name, created_at, updated_at
                    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
                """, (
                    contact.get('name'),
                    contact.get('email'),
                    contact.get('phone'),
                    contact.get('company'),
                    contact.get('website'),
                    contact.get('notes'),
                    contact.get('group_name', 'default'),
                    datetime.now(),
                    datetime.now()
                ))
                return cursor.lastrowid
        except Exception as e:
            logger.error(f"[EmailDB] Failed to add contact: {e}")
            return 0

    @staticmethod
    def update_contact(id: int, contact: Dict[str, Any]) -> bool:
        """更新联系人"""
        try:
            with get_db() as conn:
                cursor = conn.cursor()
                cursor.execute("""
                    UPDATE contacts SET
                        name = ?, email = ?, phone = ?, company = ?, website = ?, notes = ?, group_name = ?, updated_at = ?
                    WHERE id = ?
                """, (
                    contact.get('name'),
                    contact.get('email'),
                    contact.get('phone'),
                    contact.get('company'),
                    contact.get('website'),
                    contact.get('notes'),
                    contact.get('group_name', 'default'),
                    datetime.now(),
                    id
                ))
            return cursor.rowcount > 0
        except Exception as e:
            logger.error(f"[EmailDB] Failed to update contact: {e}")
            return False

    @staticmethod
    def delete_contact(id: int) -> bool:
        """删除联系人"""
        try:
            with get_db() as conn:
                cursor = conn.cursor()
                cursor.execute("DELETE FROM contacts WHERE id = ?", (id,))
            return cursor.rowcount > 0
        except Exception as e:
            logger.error(f"[EmailDB] Failed to delete contact: {e}")
            return False

    @staticmethod
    def get_contact_groups() -> List[Dict[str, Any]]:
        """获取联系人分组"""
        with get_db() as conn:
            cursor = conn.cursor()
            cursor.execute("SELECT * FROM contact_groups ORDER BY name")
            rows = cursor.fetchall()
            return [dict(row) for row in rows]

    @staticmethod
    def add_contact_group(name: str, description: str = None, color: str = '#1890ff') -> int:
        """添加联系人分组"""
        try:
            with get_db() as conn:
                cursor = conn.cursor()
                cursor.execute("""
                    INSERT INTO contact_groups (name, description, color, created_at)
                    VALUES (?, ?, ?, ?)
                """, (name, description, color, datetime.now()))
                return cursor.lastrowid
        except Exception as e:
            logger.error(f"[EmailDB] Failed to add contact group: {e}")
            return 0

    @staticmethod
    def delete_contact_group(name: str) -> bool:
        """删除联系人分组"""
        try:
            with get_db() as conn:
                cursor = conn.cursor()
                cursor.execute("DELETE FROM contact_groups WHERE name = ?", (name,))
                # 将该分组的联系人移到默认分组
                cursor.execute("""
                    UPDATE contacts SET group_name = 'default', updated_at = ?
                    WHERE group_name = ?
                """, (datetime.now(), name))
            return True
        except Exception as e:
            logger.error(f"[EmailDB] Failed to delete contact group: {e}")
            return False



    @staticmethod
    def move_inbox_to_trash(email_id: int) -> bool:
        """将收件箱邮件移动到回收站"""
        try:
            with get_db() as conn:
                cursor = conn.cursor()

                # 先获取邮件信息
                cursor.execute("SELECT * FROM inbox WHERE id = ?", (email_id,))
                email = cursor.fetchone()

                if not email:
                    return False

                email_dict = dict(email)

                # 添加到回收站 - 匹配实际表结构
                cursor.execute("""
                    INSERT INTO trash (
                        original_folder, original_id, folder_type,
                        from_addr, subject, body, sent_date
                    ) VALUES (?, ?, ?, ?, ?, ?, ?)
                """, (
                    'inbox',
                    email_id,
                    'inbox',
                    email_dict.get('from_addr'),
                    email_dict.get('subject'),
                    email_dict.get('body'),
                    email_dict.get('sent_date')
                ))

                # 从收件箱删除
                cursor.execute("DELETE FROM inbox WHERE id = ?", (email_id,))

                conn.commit()
                return True
        except Exception as e:
            logger.error(f"[EmailDB] Failed to move inbox email to trash: {e}")
            return False

    @staticmethod
    def move_sent_to_trash(email_id: int) -> bool:
        """将已发送邮件移动到回收站"""
        try:
            with get_db() as conn:
                cursor = conn.cursor()

                # 先获取邮件信息
                cursor.execute("SELECT * FROM sent WHERE id = ?", (email_id,))
                email = cursor.fetchone()

                if not email:
                    return False

                email_dict = dict(email)

                # 添加到回收站 - 匹配实际表结构
                cursor.execute("""
                    INSERT INTO trash (
                        original_folder, original_id, folder_type,
                        to_addr, subject, body, sent_date
                    ) VALUES (?, ?, ?, ?, ?, ?, ?)
                """, (
                    'sent',
                    email_id,
                    'sent',
                    email_dict.get('to_addr'),
                    email_dict.get('subject'),
                    email_dict.get('body'),
                    email_dict.get('sent_date')
                ))

                # 从已发送删除
                cursor.execute("DELETE FROM sent WHERE id = ?", (email_id,))

                conn.commit()
                return True
        except Exception as e:
            logger.error(f"[EmailDB] Failed to move sent email to trash: {e}")
            return False

    @staticmethod
    def get_trash(limit: int = 50, offset: int = 0, account_email: str = '') -> List[Dict[str, Any]]:
        """获取回收站邮件（支持多邮箱账户）"""
        with get_db() as conn:
            cursor = conn.cursor()
            if account_email:
                cursor.execute("""
                    SELECT * FROM trash
                    WHERE account_email = ? OR account_email IS NULL OR account_email = ''
                    ORDER BY id DESC
                    LIMIT ? OFFSET ?
                """, (account_email, limit, offset))
            else:
                cursor.execute("""
                    SELECT * FROM trash
                    ORDER BY id DESC
                    LIMIT ? OFFSET ?
                """, (limit, offset))
            rows = cursor.fetchall()
            return [dict(row) for row in rows]

    @staticmethod
    def delete_trash_email_permanent(email_id: int) -> bool:
        """永久删除回收站邮件"""
        try:
            with get_db() as conn:
                cursor = conn.cursor()
                cursor.execute("DELETE FROM trash WHERE id = ?", (email_id,))
                conn.commit()
                return cursor.rowcount > 0
        except Exception as e:
            logger.error(f"[EmailDB] Failed to delete trash email: {e}")
            return False

    @staticmethod
    def get_inbox_by_id(email_id: int) -> Optional[Dict[str, Any]]:
        """根据ID获取收件箱邮件"""
        with get_db() as conn:
            cursor = conn.cursor()
            cursor.execute("SELECT * FROM inbox WHERE id = ?", (email_id,))
            row = cursor.fetchone()
            return dict(row) if row else None

    @staticmethod
    def get_sent_by_id(email_id: int) -> Optional[Dict[str, Any]]:
        """根据ID获取已发送邮件"""
        with get_db() as conn:
            cursor = conn.cursor()
            cursor.execute("SELECT * FROM sent WHERE id = ?", (email_id,))
            row = cursor.fetchone()
            return dict(row) if row else None

    @staticmethod
    def get_draft_by_id(email_id: int) -> Optional[Dict[str, Any]]:
        """根据ID获取草稿"""
        with get_db() as conn:
            cursor = conn.cursor()
            cursor.execute("SELECT * FROM drafts WHERE id = ?", (email_id,))
            row = cursor.fetchone()
            return dict(row) if row else None

    @staticmethod
    def get_trash_by_id(email_id: int) -> Optional[Dict[str, Any]]:
        """根据ID获取回收站邮件"""
        with get_db() as conn:
            cursor = conn.cursor()
            cursor.execute("SELECT * FROM trash WHERE id = ?", (email_id,))
            row = cursor.fetchone()
            return dict(row) if row else None

    # ========== AI知识库：搜索和附件管理 ==========
    
    @staticmethod
    def mark_as_read(email_id: int) -> bool:
        """标记邮件为已读"""
        with get_db() as conn:
            cursor = conn.cursor()
            cursor.execute("UPDATE inbox SET read_status = 1 WHERE id = ?", (email_id,))
            conn.commit()
            return cursor.rowcount > 0

    @staticmethod
    def toggle_star(email_id: int, starred: int) -> bool:
        """切换星标状态"""
        with get_db() as conn:
            cursor = conn.cursor()
            cursor.execute("UPDATE inbox SET starred = ? WHERE id = ?", (starred, email_id))
            conn.commit()
            return cursor.rowcount > 0

    @staticmethod
    def get_starred_emails(limit: int = 100) -> List[Dict[str, Any]]:
        """获取星标邮件"""
        with get_db() as conn:
            cursor = conn.cursor()
            cursor.execute("""
                SELECT id, from_addr, from_name, subject, body, received_date, read_status, starred, size
                FROM inbox 
                WHERE starred = 1
                ORDER BY received_date DESC LIMIT ?
            """, (limit,))
            return [dict(row) for row in cursor.fetchall()]

    @staticmethod
    def search_emails(keyword: str, limit: int = 50) -> List[Dict[str, Any]]:
        """搜索邮件内容"""
        with get_db() as conn:
            cursor = conn.cursor()
            search_pattern = f"%{keyword}%"
            
            # 搜索收件箱
            cursor.execute("""
                SELECT id, subject, sender as from_addr, received_at as date, 
                       body_text as body, 'inbox' as folder
                FROM inbox 
                WHERE subject LIKE ? OR sender LIKE ? OR body_text LIKE ?
                ORDER BY received_at DESC LIMIT ?
            """, (search_pattern, search_pattern, search_pattern, limit))
            
            results = []
            for row in cursor.fetchall():
                row_dict = dict(row)
                row_dict['preview'] = row_dict.get('body', '')[:200] if row_dict.get('body') else ''
                results.append(row_dict)
            
            return results
    
    @staticmethod
    def get_attachments(limit: int = 100) -> List[Dict[str, Any]]:
        """获取附件列表"""
        with get_db() as conn:
            cursor = conn.cursor()
            
            # 检查attachments表是否存在
            cursor.execute("SELECT name FROM sqlite_master WHERE type='table' AND name='attachments'")
            if not cursor.fetchone():
                # 创建attachments表
                cursor.execute("""
                    CREATE TABLE IF NOT EXISTS attachments (
                        id TEXT PRIMARY KEY,
                        email_id INTEGER,
                        email_subject TEXT,
                        filename TEXT,
                        content_type TEXT,
                        size INTEGER,
                        file_path TEXT,
                        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                    )
                """)
                conn.commit()
                return []
            
            cursor.execute("""
                SELECT id, email_id, email_subject, filename, content_type, size, file_path, created_at
                FROM attachments 
                ORDER BY created_at DESC LIMIT ?
            """, (limit,))
            
            return [dict(row) for row in cursor.fetchall()]
    
    @staticmethod
    def get_attachment(attachment_id: str) -> Optional[Dict[str, Any]]:
        """根据ID获取附件信息"""
        with get_db() as conn:
            cursor = conn.cursor()
            cursor.execute("SELECT * FROM attachments WHERE id = ?", (attachment_id,))
            row = cursor.fetchone()
            return dict(row) if row else None
    
    @staticmethod
    def save_attachment(email_id: int, email_subject: str, filename: str, 
                         content_type: str, size: int, file_path: str) -> str:
        """保存附件信息"""
        with get_db() as conn:
            cursor = conn.cursor()
            attachment_id = str(uuid.uuid4())
            
            cursor.execute("""
                INSERT INTO attachments (id, email_id, email_subject, filename, content_type, size, file_path)
                VALUES (?, ?, ?, ?, ?, ?, ?)
            """, (attachment_id, email_id, email_subject, filename, content_type, size, file_path))
            
            conn.commit()
            return attachment_id

# 初始化数据库
init_db()