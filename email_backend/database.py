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

# 附件存储目录
_ATTACHMENT_DIR = _PLUGIN_DATA_DIR / "attachments"
_ATTACHMENT_DIR.mkdir(exist_ok=True)

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

        # 附件表
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

        # AI记事本
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS notepads (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                title TEXT NOT NULL,
                content TEXT DEFAULT '',
                tags TEXT DEFAULT '[]',
                color TEXT DEFAULT '#ffd700',
                pinned INTEGER DEFAULT 0,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """)

        # 创建索引
        cursor.execute("CREATE INDEX IF NOT EXISTS idx_inbox_uid ON inbox(uid)")
        cursor.execute("CREATE INDEX IF NOT EXISTS idx_inbox_date ON inbox(sent_date DESC)")
        cursor.execute("CREATE INDEX IF NOT EXISTS idx_sent_date ON sent(sent_date DESC)")
        cursor.execute("CREATE INDEX IF NOT EXISTS idx_contacts_email ON contacts(email)")
        cursor.execute("CREATE INDEX IF NOT EXISTS idx_notepads_pinned ON notepads(pinned DESC, updated_at DESC)")

        # 为 inbox 表添加 starred 字段（老表兼容）
        try:
            cursor.execute("ALTER TABLE inbox ADD COLUMN starred INTEGER DEFAULT 0")
        except:
            pass  # 字段已存在

        # 为 inbox 表添加 account_email 字段（老表兼容）
        try:
            cursor.execute("ALTER TABLE inbox ADD COLUMN account_email TEXT DEFAULT ''")
        except:
            pass

        # 为 sent 表添加 account_email 字段（老表兼容）
        try:
            cursor.execute("ALTER TABLE sent ADD COLUMN account_email TEXT DEFAULT ''")
        except:
            pass

        # 为 drafts 表添加 account_email 字段（老表兼容）
        try:
            cursor.execute("ALTER TABLE drafts ADD COLUMN account_email TEXT DEFAULT ''")
        except:
            pass

        # 为 trash 表添加 account_email 字段（老表兼容）
        try:
            cursor.execute("ALTER TABLE trash ADD COLUMN account_email TEXT DEFAULT ''")
        except:
            pass

        # FTS5 全文搜索虚表（inbox + sent）
        cursor.execute("""
            CREATE VIRTUAL TABLE IF NOT EXISTS email_fts USING fts5(
                subject, from_addr, body,
                content='inbox', content_rowid='rowid',
                tokenize='unicode61 remove_diacritics 2'
            )
        """)
        cursor.execute("""
            CREATE VIRTUAL TABLE IF NOT EXISTS email_fts_sent USING fts5(
                subject, to_addr, body,
                content='sent', content_rowid='rowid',
                tokenize='unicode61 remove_diacritics 2'
            )
        """)
        # 触发器：inbox 插入/更新/删除时同步 FTS
        cursor.execute("""
            CREATE TRIGGER IF NOT EXISTS inbox_fts_insert AFTER INSERT ON inbox BEGIN
                INSERT INTO email_fts(rowid, subject, from_addr, body)
                VALUES (new.rowid, new.subject, new.from_addr, new.body);
            END
        """)
        cursor.execute("""
            CREATE TRIGGER IF NOT EXISTS inbox_fts_delete AFTER DELETE ON inbox BEGIN
                INSERT INTO email_fts(email_fts, rowid, subject, from_addr, body)
                VALUES ('delete', old.rowid, old.subject, old.from_addr, old.body);
            END
        """)
        cursor.execute("""
            CREATE TRIGGER IF NOT EXISTS inbox_fts_update AFTER UPDATE ON inbox BEGIN
                INSERT INTO email_fts(email_fts, rowid, subject, from_addr, body)
                VALUES ('delete', old.rowid, old.subject, old.from_addr, old.body);
                INSERT INTO email_fts(rowid, subject, from_addr, body)
                VALUES (new.rowid, new.subject, new.from_addr, new.body);
            END
        """)
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

                email = config.get('email')
                config_id = config.get('id')
                
                # 如果没有ID但提供了email，检查是否已存在（避免UNIQUE约束冲突）
                if not config_id and email:
                    cursor.execute("SELECT id FROM email_configs WHERE email = ?", (email,))
                    existing = cursor.fetchone()
                    if existing:
                        config_id = existing[0]
                
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
    def get_inbox_with_count(limit: int = 50, offset: int = 0, folder: str = 'INBOX', account_email: str = '') -> Dict[str, Any]:
        """获取收件箱邮件（带总数），按日期降序排列"""
        with get_db() as conn:
            cursor = conn.cursor()
            if account_email:
                cursor.execute("SELECT COUNT(*) FROM inbox WHERE folder = ? AND (account_email = ? OR account_email IS NULL OR account_email = '')", (folder, account_email))
                total = cursor.fetchone()[0]
                cursor.execute("""
                    SELECT * FROM inbox
                    WHERE folder = ? AND (account_email = ? OR account_email IS NULL OR account_email = '')
                    ORDER BY sent_date DESC
                    LIMIT ? OFFSET ?
                """, (folder, account_email, limit, offset))
            else:
                cursor.execute("SELECT COUNT(*) FROM inbox WHERE folder = ?", (folder,))
                total = cursor.fetchone()[0]
                cursor.execute("""
                    SELECT * FROM inbox
                    WHERE folder = ?
                    ORDER BY sent_date DESC
                    LIMIT ? OFFSET ?
                """, (folder, limit, offset))
            rows = cursor.fetchall()
            logger.info(f"[EmailDB] get_inbox_with_count: folder={folder}, account={account_email}, total={total}, returned={len(rows)}")
            return {"emails": [dict(row) for row in rows], "total": total}

    @staticmethod
    def add_inbox_email(email: Dict[str, Any]) -> bool:
        """添加收件箱邮件"""
        try:
            uid = email.get('uid') or email.get('id')
            subject = email.get('subject', '(无主题)')
            from_addr = email.get('from_addr', '')
            account = email.get('account_email', '')
            logger.info(f"[EmailDB] Adding inbox email: uid={uid}, subject={subject[:30]}, from={from_addr}, account={account}")
            
            with get_db() as conn:
                cursor = conn.cursor()
                cursor.execute("""
                    INSERT OR REPLACE INTO inbox (
                        uid, from_addr, from_name, subject, body, html_body,
                        sent_date, received_date, attachments, folder, size, flags, account_email
                    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                """, (
                    uid,
                    from_addr,
                    email.get('from_name'),
                    subject,
                    email.get('body'),
                    email.get('html_body'),
                    email.get('sent_date'),
                    email.get('received_date') or datetime.now(),
                    json.dumps(email.get('attachments', [])),
                    email.get('folder', 'INBOX'),
                    email.get('size', 0),
                    json.dumps(email.get('flags', [])),
                    account
                ))
                logger.info(f"[EmailDB] Successfully added email: uid={uid}")
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
                        from_addr, to_addr, subject, body, sent_date
                    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
                """, (
                    'inbox',
                    email_id,
                    'inbox',
                    email_dict.get('from_addr'),
                    email_dict.get('to_addr'),
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
    def batch_delete_inbox(ids: List[int]) -> Dict[str, Any]:
        """批量删除收件箱邮件（移入回收站）"""
        try:
            with get_db() as conn:
                cursor = conn.cursor()
                deleted = 0
                for email_id in ids:
                    cursor.execute("SELECT * FROM inbox WHERE id = ?", (email_id,))
                    email = cursor.fetchone()
                    if not email:
                        continue
                    email_dict = dict(email)
                    cursor.execute("""
                        INSERT INTO trash (
                            original_folder, original_id, folder_type,
                            from_addr, to_addr, subject, body, sent_date
                        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
                    """, (
                        'inbox', email_id, 'inbox',
                        email_dict.get('from_addr'), email_dict.get('to_addr'),
                        email_dict.get('subject'), email_dict.get('body'),
                        email_dict.get('sent_date')
                    ))
                    cursor.execute("DELETE FROM inbox WHERE id = ?", (email_id,))
                    deleted += 1
                conn.commit()
                return {"success": True, "deleted": deleted}
        except Exception as e:
            logger.error(f"[EmailDB] Failed to batch delete inbox: {e}")
            return {"success": False, "deleted": 0, "error": str(e)}

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
                        from_addr, to_addr, subject, body, sent_date
                    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
                """, (
                    'sent',
                    email_id,
                    'sent',
                    email_dict.get('from_addr'),
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

    @staticmethod
    def get_trash_with_count(limit: int = 50, offset: int = 0, account_email: str = '') -> tuple:
        """获取回收站邮件（含总数）"""
        with get_db() as conn:
            cursor = conn.cursor()
            if account_email:
                cursor.execute("SELECT COUNT(*) FROM trash WHERE account_email = ? OR account_email IS NULL OR account_email = ''", (account_email,))
                total = cursor.fetchone()[0]
                cursor.execute("""
                    SELECT * FROM trash
                    WHERE account_email = ? OR account_email IS NULL OR account_email = ''
                    ORDER BY id DESC
                    LIMIT ? OFFSET ?
                """, (account_email, limit, offset))
            else:
                cursor.execute("SELECT COUNT(*) FROM trash")
                total = cursor.fetchone()[0]
                cursor.execute("""
                    SELECT * FROM trash
                    ORDER BY id DESC
                    LIMIT ? OFFSET ?
                """, (limit, offset))
            rows = cursor.fetchall()
            return [dict(row) for row in rows], total
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

    # ========== 未读邮件 / 已读 ==========

    @staticmethod
    def mark_as_read(email_id: int) -> bool:
        """标记邮件为已读"""
        with get_db() as conn:
            cursor = conn.cursor()
            cursor.execute("UPDATE inbox SET read_status = 1 WHERE id = ?", (email_id,))
            conn.commit()
            return cursor.rowcount > 0

    @staticmethod
    def mark_as_unread(email_id: int) -> bool:
        """标记邮件为未读"""
        with get_db() as conn:
            cursor = conn.cursor()
            cursor.execute("UPDATE inbox SET read_status = 0 WHERE id = ?", (email_id,))
            conn.commit()
            return cursor.rowcount > 0

    @staticmethod
    def batch_mark_as_read(email_ids: List[int]) -> int:
        """批量标记为已读"""
        if not email_ids:
            return 0
        with get_db() as conn:
            cursor = conn.cursor()
            placeholders = ','.join(['?' for _ in email_ids])
            cursor.execute(
                f"UPDATE inbox SET read_status = 1 WHERE id IN ({placeholders}) AND read_status = 0",
                email_ids
            )  # safe: placeholders built from count, not user input
            conn.commit()
            return cursor.rowcount

    @staticmethod
    def get_unread_count(account_email: str = '') -> int:
        """获取未读邮件数量"""
        with get_db() as conn:
            cursor = conn.cursor()
            if account_email:
                cursor.execute(
                    "SELECT COUNT(*) FROM inbox WHERE read_status = 0 AND (account_email = ? OR account_email IS NULL OR account_email = '')",
                    (account_email,)
                )
            else:
                cursor.execute("SELECT COUNT(*) FROM inbox WHERE read_status = 0")
            row = cursor.fetchone()
            return row[0] if row else 0

    @staticmethod
    def get_stats(account_email: str = '') -> Dict[str, Any]:
        """获取邮箱统计数据"""
        with get_db() as conn:
            cursor = conn.cursor()
            stats = {}
            # inbox
            if account_email:
                cursor.execute(
                    "SELECT COUNT(*) FROM inbox WHERE (account_email = ? OR account_email IS NULL OR account_email = '')",
                    (account_email,)
                )
                cursor.execute(
                    "SELECT COUNT(*) FROM inbox WHERE read_status = 0 AND (account_email = ? OR account_email IS NULL OR account_email = '')",
                    (account_email,)
                )
            else:
                cursor.execute("SELECT COUNT(*) FROM inbox")
                cursor.execute("SELECT COUNT(*) FROM inbox WHERE read_status = 0")
            row = cursor.fetchone()
            stats['inbox_total'] = row[0] if row else 0
            row = cursor.fetchone()
            stats['inbox_unread'] = row[0] if row else 0

            # sent
            cursor.execute("SELECT COUNT(*) FROM sent")
            stats['sent_total'] = (cursor.fetchone() or [0])[0]

            # drafts
            cursor.execute("SELECT COUNT(*) FROM drafts")
            stats['drafts_total'] = (cursor.fetchone() or [0])[0]

            # trash
            cursor.execute("SELECT COUNT(*) FROM trash")
            stats['trash_total'] = (cursor.fetchone() or [0])[0]

            # contacts
            cursor.execute("SELECT COUNT(*) FROM contacts")
            stats['contacts_total'] = (cursor.fetchone() or [0])[0]

            return stats

    # ========== 星标邮件 ==========

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
                SELECT * FROM inbox 
                WHERE starred = 1
                ORDER BY received_date DESC LIMIT ?
            """, (limit,))
            return [dict(row) for row in cursor.fetchall()]

    # ========== 搜索 ==========

    @staticmethod
    def search_emails(keyword: str, limit: int = 50) -> List[Dict[str, Any]]:
        """搜索邮件内容（FTS5 全文索引）"""
        with get_db() as conn:
            cursor = conn.cursor()
            # FTS5 查询，同时对 inbox 和 sent 两张虚表搜
            fts_query = keyword.replace('"', '""')
            cursor.execute("""
                SELECT inbox.rowid as id, inbox.subject, inbox.from_addr,
                       inbox.sent_date as received_date, inbox.body, 'inbox' as folder,
                       rank
                FROM email_fts
                JOIN inbox ON inbox.rowid = email_fts.rowid
                WHERE email_fts MATCH ?
                ORDER BY rank
                LIMIT ?
            """, (fts_query, limit))
            results = []
            for row in cursor.fetchall():
                row_dict = dict(row)
                row_dict['preview'] = (row_dict.get('body') or '')[:200]
                results.append(row_dict)
            # 如果 inbox FTS 结果不足，补 sent
            if len(results) < limit:
                remaining = limit - len(results)
                cursor.execute("""
                    SELECT sent.rowid as id, sent.subject, sent.to_addr as from_addr,
                           sent.sent_date as received_date, sent.body, 'sent' as folder,
                           rank
                    FROM email_fts_sent
                    JOIN sent ON sent.rowid = email_fts_sent.rowid
                    WHERE email_fts_sent MATCH ?
                    ORDER BY rank
                    LIMIT ?
                """, (fts_query, remaining))
                for row in cursor.fetchall():
                    row_dict = dict(row)
                    row_dict['preview'] = (row_dict.get('body') or '')[:200]
                    results.append(row_dict)
            return results

    @staticmethod
    def get_emails_by_sender(sender_email: str, limit: int = 50) -> List[Dict[str, Any]]:
        """按发件人精确查询收件箱邮件（支持模糊匹配）"""
        with get_db() as conn:
            cursor = conn.cursor()
            pattern = f"%{sender_email}%"
            cursor.execute("""
                SELECT id, subject, from_addr, from_name,
                       sent_date, received_date, body, html_body,
                       read_status, starred
                FROM inbox
                WHERE from_addr LIKE ?
                ORDER BY sent_date DESC LIMIT ?
            """, (pattern, limit))
            results = []
            for row in cursor.fetchall():
                row_dict = dict(row)
                row_dict['preview'] = (row_dict.get('body') or '')[:200]
                results.append(row_dict)
            return results

    # ========== 附件管理 ==========

    @staticmethod
    def get_attachments(limit: int = 100) -> List[Dict[str, Any]]:
        """获取附件列表"""
        with get_db() as conn:
            cursor = conn.cursor()
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

    # ========== AI记事本 ==========

    @staticmethod
    def get_notepads(limit: int = 50) -> List[Dict[str, Any]]:
        """获取所有笔记（置顶优先，最近更新在前）"""
        with get_db() as conn:
            cursor = conn.cursor()
            cursor.execute("""
                SELECT * FROM notepads
                ORDER BY pinned DESC, updated_at DESC
                LIMIT ?
            """, (limit,))
            return [dict(row) for row in cursor.fetchall()]

    @staticmethod
    def get_notepad(note_id: int) -> Optional[Dict[str, Any]]:
        """获取单个笔记"""
        with get_db() as conn:
            cursor = conn.cursor()
            cursor.execute("SELECT * FROM notepads WHERE id = ?", (note_id,))
            row = cursor.fetchone()
            return dict(row) if row else None

    @staticmethod
    def create_notepad(title: str, content: str = '', tags: str = '[]', color: str = '#ffd700') -> Optional[int]:
        """创建笔记"""
        try:
            with get_db() as conn:
                cursor = conn.cursor()
                cursor.execute("""
                    INSERT INTO notepads (title, content, tags, color)
                    VALUES (?, ?, ?, ?)
                """, (title, content, tags, color))
                return cursor.lastrowid
        except Exception as e:
            logger.error(f"[EmailDB] Failed to create notepad: {e}")
            return None

    @staticmethod
    def update_notepad(note_id: int, data: Dict[str, Any]) -> bool:
        """更新笔记"""
        try:
            with get_db() as conn:
                cursor = conn.cursor()
                cursor.execute("""
                    UPDATE notepads SET
                        title = ?, content = ?, tags = ?, color = ?, updated_at = CURRENT_TIMESTAMP
                    WHERE id = ?
                """, (
                    data.get('title'),
                    data.get('content'),
                    data.get('tags', '[]'),
                    data.get('color', '#ffd700'),
                    note_id
                ))
                return cursor.rowcount > 0
        except Exception as e:
            logger.error(f"[EmailDB] Failed to update notepad: {e}")
            return False

    @staticmethod
    def delete_notepad(note_id: int) -> bool:
        """删除笔记"""
        try:
            with get_db() as conn:
                cursor = conn.cursor()
                cursor.execute("DELETE FROM notepads WHERE id = ?", (note_id,))
                return cursor.rowcount > 0
        except Exception as e:
            logger.error(f"[EmailDB] Failed to delete notepad: {e}")
            return False

    @staticmethod
    def toggle_pin(note_id: int, pinned: int) -> bool:
        """切换笔记置顶状态"""
        with get_db() as conn:
            cursor = conn.cursor()
            cursor.execute("UPDATE notepads SET pinned = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?",
                           (pinned, note_id))
            conn.commit()
            return cursor.rowcount > 0

    @staticmethod
    def search_notepads(keyword: str, limit: int = 50) -> List[Dict[str, Any]]:
        """搜索笔记"""
        with get_db() as conn:
            cursor = conn.cursor()
            pattern = f"%{keyword}%"
            cursor.execute("""
                SELECT * FROM notepads
                WHERE title LIKE ? OR content LIKE ? OR tags LIKE ?
                ORDER BY pinned DESC, updated_at DESC
                LIMIT ?
            """, (pattern, pattern, pattern, limit))
            return [dict(row) for row in cursor.fetchall()]

    @staticmethod
    def restore_trash_email(email_id: int) -> bool:
        """从回收站恢复邮件到原表"""
        try:
            with get_db() as conn:
                cursor = conn.cursor()
                cursor.execute("SELECT * FROM trash WHERE id = ?", (email_id,))
                row = cursor.fetchone()
                if not row:
                    return False
                data = dict(row)
                original_folder = data.get('original_folder', 'inbox')
                if original_folder == 'sent':
                    cursor.execute("""
                        INSERT INTO sent (to_addr, to_name, subject, body, html_body,
                                          sent_date, attachments, size)
                        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
                    """, (
                        data.get('to_addr', ''),
                        data.get('from_name', ''),
                        data.get('subject', ''),
                        data.get('body', ''),
                        data.get('html_body', ''),
                        data.get('sent_date', ''),
                        data.get('attachments', ''),
                        data.get('size', 0)
                    ))
                else:
                    # Determine original folder (INBOX or sent)
                    original = data.get('original_folder', 'inbox').upper()
                    table = 'inbox' if original != 'SENT' else 'sent'
                    cursor.execute(f"""
                        INSERT INTO {table} (uid, from_addr, from_name, subject, body,
                                           html_body, sent_date, folder, size)
                        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
                    """, (
                        'restored_' + str(email_id),
                        data.get('from_addr', ''),
                        data.get('from_name', ''),
                        data.get('subject', ''),
                        data.get('body', ''),
                        data.get('html_body', ''),
                        data.get('sent_date', ''),
                        'INBOX',
                        data.get('size', 0)
                    ))
                cursor.execute("DELETE FROM trash WHERE id = ?", (email_id,))
                return True
        except Exception as e:
            logger.error(f"[EmailDB] Failed to restore trash email: {e}")
            import traceback
            logger.error(traceback.format_exc())
            return False

# 初始化数据库
init_db()