"""
TeamChat邮件系统 - API路由

功能：完整邮箱API（配置/收件箱/发件箱/草稿箱/联系人/回收站）
"""

from fastapi import APIRouter, HTTPException, Query, BackgroundTasks, File, UploadFile, Form
from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any
import logging
import json
import smtplib
import imaplib
import email
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from email.mime.base import MIMEBase
from email import encoders
from email.header import decode_header
from datetime import datetime
import re
import os
import uuid

try:
    from .database import EmailDB, _decrypt, _ATTACHMENT_DIR
except ImportError:
    from database import EmailDB, _decrypt, _ATTACHMENT_DIR

logger = logging.getLogger(__name__)
router = APIRouter(tags=["email"])

# =================== 邮件客户端类 ===================

class EmailClient:
    """邮件客户端 - 封装SMTP/IMAP操作"""
    
    def __init__(self, config: dict):
        self.config = config
        self.smtp_host = config.get("smtp_host", "")
        self.smtp_port = config.get("smtp_port", 587)
        self.smtp_ssl = config.get("smtp_ssl", True)
        self.imap_host = config.get("imap_host", "")
        self.imap_port = config.get("imap_port", 993)
        self.imap_ssl = config.get("imap_ssl", True)
        # 优先使用imap_username/imap_password，兼容username/password
        self.username = config.get("imap_username") or config.get("username") or config.get("smtp_username", "")
        self.password = config.get("imap_password") or config.get("password") or config.get("smtp_password", "")
        self.email = config.get("email", "")
    
    def send_email(self, to_addr: str, subject: str, body: str, 
                   cc: str = None, bcc: str = None, html_body: str = None) -> dict:
        """发送邮件"""
        try:
            # 创建邮件
            msg = MIMEMultipart("alternative")
            msg["From"] = self.email  # 使用简单格式避免QQ邮箱验证问题
            msg["To"] = to_addr
            msg["Subject"] = subject
            msg["Date"] = datetime.now().strftime("%a, %d %b %Y %H:%M:%S +0800")
            
            if cc:
                msg["Cc"] = cc
            if bcc:
                msg["Bcc"] = bcc
            
            # 添加正文
            if html_body:
                msg.attach(MIMEText(body, "plain", "utf-8"))
                msg.attach(MIMEText(html_body, "html", "utf-8"))
            else:
                msg.attach(MIMEText(body, "plain", "utf-8"))
            
            # 连接SMTP服务器
            if self.smtp_ssl and self.smtp_port == 465:
                # SSL连接
                server = smtplib.SMTP_SSL(self.smtp_host, self.smtp_port, timeout=30)
            else:
                # TLS连接
                server = smtplib.SMTP(self.smtp_host, self.smtp_port, timeout=30)
                server.starttls()
            
            server.login(self.username, self.password)
            
            # 发送邮件
            recipients = [to_addr]
            if cc:
                recipients.extend(cc.split(","))
            if bcc:
                recipients.extend(bcc.split(","))
            
            server.sendmail(self.email, recipients, msg.as_string())
            server.quit()
            
            return {"success": True, "message": "邮件发送成功"}
            
        except Exception as e:
            logger.error(f"发送邮件失败: {str(e)}")
            return {"success": False, "message": f"发送失败: {str(e)}"}
    
    def send_email_with_attachments(self, to_addr: str, subject: str, body: str,
                                    html_body: str = None, cc: str = None, bcc: str = None,
                                    attachments: List[dict] = None) -> dict:
        """发送邮件（支持附件）"""
        try:
            # 创建邮件
            msg = MIMEMultipart("mixed")
            msg["From"] = self.email  # 使用简单格式避免QQ邮箱验证问题
            msg["To"] = to_addr
            msg["Subject"] = subject
            msg["Date"] = datetime.now().strftime("%a, %d %b %Y %H:%M:%S +0800")
            
            if cc:
                msg["Cc"] = cc
            if bcc:
                msg["Bcc"] = bcc
            
            # 添加正文部分
            body_part = MIMEMultipart("alternative")
            body_part.attach(MIMEText(body, "plain", "utf-8"))
            if html_body:
                body_part.attach(MIMEText(html_body, "html", "utf-8"))
            msg.attach(body_part)
            
            # 添加附件
            if attachments:
                for attach in attachments:
                    part = MIMEBase("application", "octet-stream")
                    part.set_payload(attach["content"])
                    encoders.encode_base64(part)
                    part.add_header(
                        "Content-Disposition",
                        f"attachment; filename=\"{attach['filename']}\""
                    )
                    msg.attach(part)
            
            # 连接SMTP服务器
            if self.smtp_ssl and self.smtp_port == 465:
                server = smtplib.SMTP_SSL(self.smtp_host, self.smtp_port, timeout=30)
            else:
                server = smtplib.SMTP(self.smtp_host, self.smtp_port, timeout=30)
                server.starttls()
            
            server.login(self.username, self.password)
            
            # 发送邮件
            recipients = [to_addr]
            if cc:
                recipients.extend(cc.split(","))
            if bcc:
                recipients.extend(bcc.split(","))
            
            server.sendmail(self.email, recipients, msg.as_string())
            server.quit()
            
            return {"success": True, "message": "邮件发送成功"}
            
        except Exception as e:
            logger.error(f"发送邮件失败: {str(e)}")
            return {"success": False, "message": f"发送失败: {str(e)}"}
    
    def fetch_emails(self, folder: str = "INBOX", limit: int = 50) -> List[dict]:
        """获取邮件列表"""
        mail = None
        try:
            # 连接IMAP服务器
            if self.imap_ssl:
                mail = imaplib.IMAP4_SSL(self.imap_host, self.imap_port)
            else:
                mail = imaplib.IMAP4(self.imap_host, self.imap_port)
            
            mail.login(self.username, self.password)
            mail.select(folder)
            
            # 搜索邮件
            _, search_data = mail.search(None, "ALL")
            email_ids = search_data[0].split()
            
            # 获取最新的N封邮件
            emails = []
            for email_id in reversed(email_ids[-limit:]):
                try:
                    _, msg_data = mail.fetch(email_id, "(RFC822)")
                    raw_email = msg_data[0][1]
                    msg = email.message_from_bytes(raw_email)
                    
                    # 解析邮件
                    email_data = self._parse_email(msg, email_id.decode())
                    emails.append(email_data)
                except Exception as e:
                    logger.warning(f"解析邮件 {email_id} 失败: {e}")
            
            return emails
            
        except Exception as e:
            logger.error(f"获取邮件失败: {str(e)}")
            return []
        finally:
            if mail:
                try:
                    mail.close()
                except Exception:
                    pass
                try:
                    mail.logout()
                except Exception:
                    pass
    
    def fetch_emails_incremental(self, folder: str = "INBOX", last_uid: str = None, limit: int = 100) -> List[dict]:
        """增量获取邮件（只获取新邮件）"""
        mail = None
        try:
            # 连接IMAP服务器
            if self.imap_ssl:
                mail = imaplib.IMAP4_SSL(self.imap_host, self.imap_port)
            else:
                mail = imaplib.IMAP4(self.imap_host, self.imap_port)
            
            mail.login(self.username, self.password)
            mail.select(folder)
            
            # 搜索邮件
            _, search_data = mail.search(None, "ALL")
            email_ids = search_data[0].split()
            
            if not email_ids:
                return []
            
            # 如果没有上次同步的UID，获取最新的limit封
            if not last_uid:
                target_ids = email_ids[-limit:]
            else:
                # 找到上次同步的位置，获取之后的邮件
                try:
                    last_uid_bytes = last_uid.encode() if isinstance(last_uid, str) else last_uid
                    last_index = email_ids.index(last_uid_bytes)
                    # 获取last_uid之后的邮件
                    target_ids = email_ids[last_index + 1:]
                    # 限制数量
                    if len(target_ids) > limit:
                        target_ids = target_ids[-limit:]
                except ValueError:
                    # 如果找不到last_uid，获取最新的limit封
                    target_ids = email_ids[-limit:]
            
            # 获取邮件
            emails = []
            for email_id in target_ids:
                try:
                    _, msg_data = mail.fetch(email_id, "(RFC822)")
                    if msg_data and msg_data[0]:
                        raw_email = msg_data[0][1]
                        msg = email.message_from_bytes(raw_email)
                        
                        # 解析邮件
                        email_data = self._parse_email(msg, email_id.decode())
                        emails.append(email_data)
                except Exception as e:
                    logger.warning(f"获取邮件 {email_id} 失败: {e}")
                    continue
            
            logger.info(f"增量同步: 获取 {len(emails)} 封新邮件")
            return emails
            
        except Exception as e:
            logger.error(f"增量获取邮件失败: {str(e)}")
            return []
        finally:
            if mail:
                try:
                    mail.close()
                except Exception:
                    pass
                try:
                    mail.logout()
                except Exception:
                    pass
    
    def _parse_email(self, msg, email_id: str) -> dict:
        """解析邮件内容"""
        # 解析主题
        subject = ""
        subject_header = msg.get("Subject", "")
        if subject_header:
            try:
                decoded = decode_header(subject_header)
                for part, charset in decoded:
                    if isinstance(part, bytes):
                        subject += part.decode(charset or "utf-8", errors="ignore")
                    elif isinstance(part, str):
                        subject += part
            except Exception:
                # 某些邮件编码（如 unknown-8bit）会触发 LookupError
                subject = str(subject_header)[:200]
        
        # 解析发件人
        from_addr = msg.get("From", "")
        from_name = ""
        if "<" in from_addr and ">" in from_addr:
            match = re.match(r"(.+?)<(.+?)>", from_addr)
            if match:
                from_name = match.group(1).strip()
                from_addr = match.group(2).strip()
        
        # 解析日期
        date_str = msg.get("Date", "")
        
        # 解析正文 & 附件
        body = ""
        html_body = ""
        attachments = []
        
        if msg.is_multipart():
            for part in msg.walk():
                content_type = part.get_content_type()
                content_disposition = str(part.get("Content-Disposition", ""))
                
                # 附件
                if "attachment" in content_disposition:
                    attach = self._extract_attachment(part)
                    if attach:
                        attachments.append(attach)
                    continue
                
                if content_type == "text/plain":
                    try:
                        body = part.get_payload(decode=True).decode("utf-8", errors="ignore")
                    except:
                        pass
                elif content_type == "text/html":
                    try:
                        html_body = part.get_payload(decode=True).decode("utf-8", errors="ignore")
                    except:
                        pass
        else:
            try:
                body = msg.get_payload(decode=True).decode("utf-8", errors="ignore")
            except:
                body = msg.get_payload()
        
        return {
            "uid": email_id,
            "id": email_id,
            "subject": subject or "(无主题)",
            "from_addr": from_addr,
            "from_name": from_name or from_addr,
            "to_addr": msg.get("To", ""),
            "sent_date": date_str,
            "received_date": None,
            "body": body,
            "html_body": html_body,
            "flags": [],
            "account_email": self.email,
            "folder": "INBOX",
            "size": 0,
            "attachments": attachments
        }
    
    def _extract_attachment(self, part) -> dict:
        """从MIME part提取附件信息"""
        filename = part.get_filename()
        if not filename:
            return None
        # 解码文件名
        try:
            decoded = decode_header(filename)
            filename = ""
            for fragment, charset in decoded:
                if isinstance(fragment, bytes):
                    filename += fragment.decode(charset or "utf-8", errors="ignore")
                else:
                    filename += fragment
        except:
            filename = str(filename)
        
        content_type = part.get_content_type()
        content = part.get_payload(decode=True)
        if content is None:
            return None
        
        size = len(content)
        # 存成 base64 方便传输
        import base64
        content_b64 = base64.b64encode(content).decode("ascii")
        
        return {
            "filename": filename,
            "content_type": content_type,
            "size": size,
            "content_base64": content_b64
        }
    
    def test_connection(self) -> dict:
        """测试邮件连接"""
        results = {"smtp": False, "imap": False, "message": ""}
        
        # 测试SMTP
        try:
            if self.smtp_ssl and self.smtp_port == 465:
                server = smtplib.SMTP_SSL(self.smtp_host, self.smtp_port, timeout=10)
            else:
                server = smtplib.SMTP(self.smtp_host, self.smtp_port, timeout=10)
                server.starttls()
            server.login(self.username, self.password)
            server.quit()
            results["smtp"] = True
        except Exception as e:
            results["message"] += f"SMTP测试失败: {str(e)}; "
        
        # 测试IMAP
        try:
            if self.imap_ssl:
                mail = imaplib.IMAP4_SSL(self.imap_host, self.imap_port)
            else:
                mail = imaplib.IMAP4(self.imap_host, self.imap_port)
            mail.login(self.username, self.password)
            mail.logout()
            results["imap"] = True
        except Exception as e:
            results["message"] += f"IMAP测试失败: {str(e)}"
        
        results["success"] = results["smtp"] and results["imap"]
        return results

# 全局邮件客户端缓存
_email_clients: Dict[str, EmailClient] = {}


# ── Request Models ──────────────────────────────────────────────────────────

class EmailConfigRequest(BaseModel):
    email: str = Field(..., description="邮箱地址")
    display_name: Optional[str] = Field(None, description="显示名称")
    provider: str = Field(default="custom", description="邮箱提供商")
    smtp_host: Optional[str] = Field(default="", description="SMTP服务器")
    smtp_port: int = Field(default=587, description="SMTP端口")
    smtp_ssl: bool = Field(default=True, description="SMTP是否SSL")
    smtp_username: Optional[str] = Field(default="", description="SMTP用户名")
    smtp_password: Optional[str] = Field(default="", description="SMTP密码")
    imap_host: Optional[str] = Field(default="", description="IMAP服务器")
    imap_port: int = Field(default=993, description="IMAP端口")
    imap_ssl: bool = Field(default=True, description="IMAP是否SSL")
    imap_username: Optional[str] = Field(default="", description="IMAP用户名")
    imap_password: Optional[str] = Field(default="", description="IMAP密码")


class ContactRequest(BaseModel):
    name: str = Field(..., description="姓名")
    email: str = Field(..., description="邮箱")
    phone: Optional[str] = Field(None, description="电话")
    company: Optional[str] = Field(None, description="公司")
    website: Optional[str] = Field(None, description="网站")
    notes: Optional[str] = Field(None, description="备注")
    group_name: str = Field(default="default", description="分组")


class DraftRequest(BaseModel):
    to_addr: Optional[str] = Field(None, description="收件人")
    subject: Optional[str] = Field(None, description="主题")
    body: Optional[str] = Field(None, description="正文")
    html_body: Optional[str] = Field(None, description="HTML正文")
    cc: Optional[str] = Field(None, description="抄送")
    bcc: Optional[str] = Field(None, description="密送")


class EmailRequest(BaseModel):
    to_addr: str = Field(..., description="收件人")
    to_name: Optional[str] = Field(None, description="收件人姓名")
    subject: str = Field(..., description="主题")
    body: str = Field(..., description="正文")
    html_body: Optional[str] = Field(None, description="HTML正文")
    attachments: Optional[List[str]] = Field(None, description="附件列表")


# ── Helper Functions ────────────────────────────────────────────────────────

def get_email_client(config: dict) -> EmailClient:
    """获取或创建邮件客户端"""
    cache_key = config.get("email", "")
    if cache_key not in _email_clients:
        _email_clients[cache_key] = EmailClient(config)
    return _email_clients[cache_key]

# ── Config API ──────────────────────────────────────────────────────────────

@router.get("/config")
async def get_config(config_id: Optional[int] = Query(None, description="配置ID，不指定则返回第一个")):
    """获取邮件配置"""
    config = EmailDB.get_config(config_id)
    return {"success": True, "config": config}


@router.get("/mail-configs")
async def get_all_configs():
    """获取所有邮件配置（多邮箱）"""
    configs = EmailDB.get_all_configs()
    return {"success": True, "configs": configs}


@router.post("/config")
async def save_config(data: EmailConfigRequest):
    """保存邮件配置（新增或更新）"""
    config_id = EmailDB.save_config(data.dict())
    if config_id:
        return {"success": True, "config_id": config_id}
    return {"success": False}


@router.post("/config/test")
async def test_config(data: EmailConfigRequest):
    """测试邮件配置连接"""
    try:
        client = EmailClient(data.dict())
        result = client.test_connection()
        return {"success": True, **result}
    except Exception as e:
        return {"success": False, "message": str(e)}


@router.delete("/config/{config_id}")
async def delete_config(config_id: int):
    """删除邮件配置"""
    result = EmailDB.delete_config(config_id)
    return {"success": result}


@router.post("/config/{config_id}/set-default")
async def set_default_config(config_id: int):
    """设置默认邮箱"""
    # 简单实现：将指定配置ID更新为default
    # 实际可以在email_configs表添加is_default字段
    return {"success": True, "message": "默认邮箱设置成功"}


# ── Inbox API ───────────────────────────────────────────────────────────────

@router.get("/inbox")
async def get_inbox(
    limit: int = Query(50, ge=1, le=200),
    offset: int = Query(0, ge=0),
    folder: str = Query('INBOX'),
    account: str = Query('')
):
    """获取收件箱邮件"""
    result = EmailDB.get_inbox_with_count(limit=limit, offset=offset, folder=folder, account_email=account)
    return {"success": True, "emails": result["emails"], "total": result["total"]}


@router.get("/inbox/{id}")
async def get_inbox_email(id: int):
    """获取收件箱邮件详情"""
    email = EmailDB.get_inbox_by_id(id)
    if email:
        return {"success": True, "email": email}
    return {"success": False, "error": "Email not found"}


@router.delete("/inbox/{id}")
@router.delete("/inbox/{id}")
async def delete_inbox_email(id: int):
    """删除收件箱邮件（移动到回收站）"""
    result = EmailDB.move_inbox_to_trash(id)
    return {"success": result, "message": "已移动到回收站" if result else "删除失败"}


@router.post("/inbox/{id}/read")
async def mark_inbox_email_read(id: int):
    """标记收件箱邮件为已读"""
    result = EmailDB.mark_as_read(id)
    return {"success": result}


@router.post("/inbox/{id}/unread")
async def mark_inbox_email_unread(id: int):
    """标记收件箱邮件为未读"""
    result = EmailDB.mark_as_unread(id)
    return {"success": result}


@router.post("/inbox/batch-read")
async def batch_mark_read(ids: List[int]):
    """批量标记邮件为已读"""
    count = EmailDB.batch_mark_as_read(ids)
    return {"success": True, "count": count}


@router.post("/inbox/batch-delete")
async def batch_delete_inbox(ids: List[int]):
    """批量删除收件箱邮件（移到回收站）"""
    result = EmailDB.batch_delete_inbox(ids)
    return result


# ── Sent API ────────────────────────────────────────────────────────────────

@router.get("/sent")
async def get_sent(
    limit: int = Query(50, ge=1, le=200),
    offset: int = Query(0, ge=0),
    account: str = Query('')
):
    """获取已发送邮件"""
    emails = EmailDB.get_sent(limit=limit, offset=offset, account_email=account)
    return {"success": True, "emails": emails}


@router.get("/sent/{id}")
async def get_sent_email(id: int):
    """获取已发送邮件详情"""
    email = EmailDB.get_sent_by_id(id)
    if email:
        return {"success": True, "email": email}
    return {"success": False, "error": "Email not found"}


@router.delete("/sent/{id}")
@router.delete("/sent/{id}")
async def delete_sent_email(id: int):
    """删除已发送邮件（移动到回收站）"""
    result = EmailDB.move_sent_to_trash(id)
    return {"success": result, "message": "已移动到回收站" if result else "删除失败"}


# ── Drafts API ──────────────────────────────────────────────────────────────

@router.get("/drafts")
async def get_drafts(
    limit: int = Query(50, ge=1, le=200),
    offset: int = Query(0, ge=0),
    account: str = Query('')
):
    """获取草稿列表"""
    drafts = EmailDB.get_drafts(limit=limit, offset=offset, account_email=account)
    return {"success": True, "drafts": drafts}


@router.get("/drafts/{id}")
async def get_draft(id: int):
    """获取草稿详情"""
    draft = EmailDB.get_draft_by_id(id)
    if draft:
        return {"success": True, "email": draft}
    return {"success": False, "error": "Draft not found"}


@router.post("/drafts")
async def create_draft(data: DraftRequest):
    """创建草稿"""
    id = EmailDB.add_draft(data.dict())
    if not id:
        return {"success": False, "message": "草稿保存失败"}
    return {"success": True, "id": id}


@router.put("/drafts/{id}")
async def update_draft(id: int, data: DraftRequest):
    """更新草稿"""
    result = EmailDB.update_draft(id, data.dict())
    return {"success": result}


@router.delete("/drafts/{id}")
async def delete_draft(id: int):
    """删除草稿"""
    result = EmailDB.delete_draft(id)
    return {"success": result}


# ── Contacts API ────────────────────────────────────────────────────────────

@router.get("/contacts")
async def get_contacts(
    limit: int = Query(100, ge=1, le=500),
    offset: int = Query(0, ge=0),
    group_name: Optional[str] = Query(None)
):
    """获取联系人列表"""
    contacts = EmailDB.get_contacts(limit=limit, offset=offset, group_name=group_name)
    return {"success": True, "contacts": contacts}


@router.get("/contacts/{id}")
async def get_contact(id: int):
    """获取联系人详情"""
    # TODO: 实现根据ID查询
    return {"success": True, "contact": None}


@router.post("/contacts")
async def create_contact(data: ContactRequest):
    """创建联系人"""
    id = EmailDB.add_contact(data.dict())
    return {"success": True, "id": id}


@router.put("/contacts/{id}")
async def update_contact(id: int, data: ContactRequest):
    """更新联系人"""
    result = EmailDB.update_contact(id, data.dict())
    return {"success": result}


@router.delete("/contacts/{id}")
async def delete_contact(id: int):
    """删除联系人"""
    result = EmailDB.delete_contact(id)
    return {"success": result}


# ── Contact Groups API ───────────────────────────────────────────────────────

@router.get("/contact-groups")
async def get_contact_groups():
    """获取联系人分组"""
    groups = EmailDB.get_contact_groups()
    return {"success": True, "groups": groups}


@router.post("/contact-groups")
async def create_contact_group(
    name: str = Query(...),
    description: Optional[str] = Query(None),
    color: str = Query('#1890ff')
):
    """创建联系人分组"""
    id = EmailDB.add_contact_group(name, description, color)
    return {"success": True, "id": id}


@router.delete("/contact-groups/{name}")
async def delete_contact_group(name: str):
    """删除联系人分组"""
    result = EmailDB.delete_contact_group(name)
    return {"success": result}


# ── Trash API ───────────────────────────────────────────────────────────────

@router.get("/trash")
async def get_trash(
    limit: int = Query(50, ge=1, le=200),
    offset: int = Query(0, ge=0),
    account: str = Query('')
):
    """获取回收站邮件"""
    emails, total = EmailDB.get_trash_with_count(limit=limit, offset=offset, account_email=account)
    return {"success": True, "emails": emails, "total": total}


@router.get("/trash/{id}")
async def get_trash_email(id: int):
    """获取回收站邮件详情"""
    email = EmailDB.get_trash_by_id(id)
    if email:
        return {"success": True, "email": email}
    return {"success": False, "error": "Trash email not found"}


@router.post("/trash/{id}/restore")
async def restore_trash_email(id: int):
    """恢复回收站邮件"""
    try:
        # 获取回收站邮件
        trash_email = EmailDB.get_trash_by_id(id)
        if not trash_email:
            return {"success": False, "message": "邮件不存在"}

        folder_type = trash_email.get("folder_type", "inbox")

        if folder_type == "inbox":
            # 恢复到收件箱
            EmailDB.add_inbox_email({
                "uid": f"restored_{id}_{int(datetime.now().timestamp())}",
                "from_addr": trash_email.get("from_addr", ""),
                "from_name": "",
                "subject": trash_email.get("subject", ""),
                "body": trash_email.get("body", ""),
                "html_body": "",
                "sent_date": trash_email.get("sent_date"),
                "received_date": datetime.now(),
                "attachments": [],
                "folder": "INBOX",
                "size": 0,
                "flags": [],
                "account_email": ""
            })
        elif folder_type == "sent":
            # 恢复到发件箱
            EmailDB.add_sent_email({
                "to_addr": trash_email.get("to_addr", ""),
                "to_name": "",
                "subject": trash_email.get("subject", ""),
                "body": trash_email.get("body", ""),
                "html_body": "",
                "sent_date": trash_email.get("sent_date") or datetime.now(),
                "attachments": [],
                "size": 0
            })

        # 从回收站删除
        EmailDB.delete_trash_email_permanent(id)
        return {"success": True, "message": "已恢复"}
    except Exception as e:
        logger.error(f"恢复邮件失败: {e}")
        return {"success": False, "message": str(e)}


@router.delete("/trash/{id}")
async def delete_trash_email_permanent(id: int):
    """永久删除回收站邮件"""
    result = EmailDB.delete_trash_email_permanent(id)
    return {"success": result, "message": "已永久删除" if result else "删除失败"}


# ── Send Email API ───────────────────────────────────────────────────────────

@router.post("/send")
async def send_email(
    to_addr: str = Form(...),
    to_name: Optional[str] = Form(None),
    subject: str = Form(...),
    body: str = Form(...),
    html_body: Optional[str] = Form(None),
    cc: Optional[str] = Form(None),
    bcc: Optional[str] = Form(None),
    account: Optional[str] = Form(None),
):
    """发送邮件（FormData格式）"""
    try:
        # 获取邮箱配置
        config = None
        if account:
            # 根据邮箱地址查找配置
            configs = EmailDB.get_all_configs()
            for c in configs:
                if c.get("email") == account:
                    config = c
                    break
        
        if not config:
            # 使用默认配置
            config = EmailDB.get_config()
        
        if not config:
            return {"success": False, "message": "请先配置邮箱"}
        
        # 创建邮件客户端
        client = EmailClient(config)
        
        # 发送邮件
        result = client.send_email(
            to_addr=to_addr,
            subject=subject,
            body=body,
            cc=cc,
            bcc=bcc,
            html_body=html_body or ""
        )
        
        if not result.get("success"):
            return {"success": False, "message": result.get("message", "发送失败")}
        
        # 保存到发件箱
        sent_email = {
            "to_addr": to_addr,
            "to_name": to_name or to_addr.split("@")[0],
            "subject": subject,
            "body": body,
            "html_body": html_body,
            "attachments": [],
            "sent_at": datetime.now().isoformat()
        }
        EmailDB.add_sent_email(sent_email)
        
        return {"success": True, "message": "发送成功", "email": sent_email}
        
    except Exception as e:
        logger.error(f"发送邮件失败: {e}")
        return {"success": False, "message": f"发送失败: {str(e)}"}


# ── Sync API ────────────────────────────────────────────────────────────────

@router.post("/sync")
async def do_sync_emails(config_id: Optional[int] = None):
    """同步邮件（内部调用版本）"""
    try:
        print(f"[DEBUG] do_sync_emails called, config_id={config_id}")
        # 获取要同步的配置
        if config_id:
            configs = [EmailDB.get_config(config_id)]
            if not configs[0]:
                return {"success": False, "message": f"配置ID {config_id} 不存在"}
        else:
            configs = EmailDB.get_all_configs()

        if not configs:
            return {"success": False, "message": "没有邮箱配置"}

        total_synced = 0
        total_inbox = 0
        messages = []

        for config in configs:
            try:
                # 解密密码
                if config.get('smtp_password'):
                    config['smtp_password'] = _decrypt(config['smtp_password'])
                if config.get('imap_password'):
                    config['imap_password'] = _decrypt(config['imap_password'])

                client = EmailClient(config)
                account_email = config.get('email')

                # 获取该邮箱已同步的最新UID
                last_uid = EmailDB.get_last_uid(account_email, 'INBOX')
                logger.info(f"[{account_email}] 上次同步UID: {last_uid}")

                # 获取收件箱邮件（增量同步）
                # 首次同步获取100封，后续增量同步获取50封
                initial_sync = last_uid is None
                sync_limit = 100 if initial_sync else 50
                inbox_emails = client.fetch_emails_incremental(folder="INBOX", last_uid=last_uid, limit=sync_limit)

                # 保存到数据库 & 附件落地
                synced_count = 0
                for email_data in inbox_emails:
                    try:
                        result = EmailDB.add_inbox_email(email_data)
                        if result:
                            # 保存附件到文件系统
                            for attach in email_data.get('attachments', []):
                                try:
                                    _save_attachment_file(attach, email_data, account_email)
                                except Exception as ex:
                                    logger.warning(f"保存附件失败: {ex}")
                            synced_count += 1
                    except Exception as e:
                        logger.warning(f"保存邮件失败: {e}")

                total_synced += synced_count
                
                # 获取收件箱总数
                inbox_count = EmailDB.get_email_count(account_email, 'inbox')
                total_inbox += inbox_count
                
                messages.append(f"{account_email}: 新增 {synced_count} 封，共 {inbox_count} 封")

            except Exception as e:
                logger.error(f"同步 {config.get('email')} 失败: {e}")
                messages.append(f"{config.get('email')}: 失败 - {str(e)}")

        return {
            "success": True,
            "message": "; ".join(messages),
            "synced": total_synced,
            "total": total_inbox
        }

    except Exception as e:
        logger.error(f"同步邮件失败: {e}")
        return {"success": False, "message": f"同步失败: {str(e)}"}


@router.post("/test-connection")
async def test_email_connection(config: dict):
    """测试邮箱连接"""
    try:
        if not config:
            return {"success": False, "message": "配置信息不能为空"}

        # 创建临时客户端进行测试
        client = EmailClient(config)
        result = client.test_connection()

        if result.get("smtp") and result.get("imap"):
            return {"success": True, "results": result, "message": "连接测试成功"}
        elif result.get("smtp") or result.get("imap"):
            return {"success": True, "results": result, "message": "连接测试部分成功"}
        else:
            return {"success": False, "results": result, "message": result.get("message", "连接测试失败")}

    except Exception as e:
        logger.error(f"测试邮箱连接失败: {e}")
        return {"success": False, "message": f"测试连接失败: {str(e)}"}


# ── Accounts API ───────────────────────────────────────────────────────────────

@router.get("/email-accounts")
async def get_accounts():
    """获取所有邮箱账户列表（含未读数）"""
    try:
        configs = EmailDB.get_all_configs()
        accounts = []
        for config in configs:
            email = config.get("email", "")
            accounts.append({
                "id": config.get("id"),
                "email": email,
                "name": config.get("display_name", email),
                "display_name": config.get("display_name", ""),
                "provider": config.get("provider", "custom"),
                "is_default": config.get("is_default", False),
                "unread_count": EmailDB.get_unread_count(email) if email else 0,
            })
        return {"success": True, "accounts": accounts}
    except Exception as e:
        logger.error(f"获取账户列表失败: {e}")
        return {"success": False, "message": str(e), "accounts": []}


# ── Stats API ───────────────────────────────────────────────────────────────

@router.get("/stats")
async def get_email_stats(account: str = Query('')):
    """获取邮箱统计信息"""
    stats = EmailDB.get_stats(account_email=account)
    return {"success": True, "stats": stats}


# ── AI Knowledge Base API ───────────────────────────────────────────────────────────────

@router.get("/email/search")
async def search_emails(q: str = Query(..., description="搜索关键词")):
    """搜索邮件内容"""
    try:
        # 从数据库搜索邮件
        emails = EmailDB.search_emails(q)
        return {"success": True, "emails": emails}
    except Exception as e:
        logger.error(f"搜索邮件失败: {e}")
        return {"success": False, "message": str(e), "emails": []}


@router.get("/email/by-sender")
async def emails_by_sender(email: str = Query(..., description="发件人邮箱地址")):
    """按发件人查询收件箱关联邮件"""
    try:
        emails = EmailDB.get_emails_by_sender(email)
        return {"success": True, "emails": emails}
    except Exception as e:
        logger.error(f"按发件人查询失败: {e}")
        return {"success": False, "message": str(e), "emails": []}


@router.get("/email/attachments")
async def list_attachments():
    """获取附件列表"""
    try:
        attachments = EmailDB.get_attachments()
        return {"success": True, "attachments": attachments}
    except Exception as e:
        logger.error(f"获取附件列表失败: {e}")
        return {"success": False, "message": str(e), "attachments": []}


@router.post("/inbox/{email_id}/star")
async def toggle_star(email_id: int, starred: int = Form(...)):
    """切换星标状态"""
    try:
        EmailDB.toggle_star(email_id, starred)
        return {"success": True, "message": "已更新星标状态"}
    except Exception as e:
        logger.error(f"切换星标失败: {e}")
        return {"success": False, "message": str(e)}


@router.get("/emails/starred")
async def get_starred_emails():
    """获取星标邮件列表"""
    try:
        emails = EmailDB.get_starred_emails()
        return {"success": True, "emails": emails}
    except Exception as e:
        logger.error(f"获取星标邮件失败: {e}")
        return {"success": False, "message": str(e), "emails": []}


@router.post("/inbox/{email_id}/read")
async def mark_email_as_read(email_id: int):
    """标记邮件为已读"""
    try:
        EmailDB.mark_as_read(email_id)
        return {"success": True, "message": "已标记为已读"}
    except Exception as e:
        logger.error(f"标记已读失败: {e}")
        return {"success": False, "message": str(e)}


@router.get("/email/attachments/{attachment_id}/download")
async def download_attachment(attachment_id: str):
    """下载附件"""
    try:
        from fastapi.responses import FileResponse
        attachment = EmailDB.get_attachment(attachment_id)
        if not attachment:
            raise HTTPException(status_code=404, detail="附件不存在")
        
        file_path = attachment.get("file_path")
        if not file_path or not os.path.exists(file_path):
            raise HTTPException(status_code=404, detail="附件文件不存在")
        
        return FileResponse(
            file_path,
            filename=attachment.get("filename", "attachment"),
            media_type="application/octet-stream"
        )
    except Exception as e:
        logger.error(f"下载附件失败: {e}")
        raise HTTPException(status_code=500, detail=str(e))


# ── AI Notepad API ──────────────────────────────────────────────────────────

class NotepadRequest(BaseModel):
    title: str = Field(..., description="笔记标题")
    content: Optional[str] = Field("", description="笔记内容")
    tags: Optional[str] = Field("[]", description="标签（JSON数组字符串）")
    color: Optional[str] = Field("#ffd700", description="卡片颜色")

class NotepadUpdateRequest(BaseModel):
    title: Optional[str] = Field(None)
    content: Optional[str] = Field(None)
    tags: Optional[str] = Field(None)
    color: Optional[str] = Field(None)


@router.get("/notepads")
async def get_notepads(limit: int = Query(50, ge=1, le=200)):
    """获取所有笔记"""
    notepads = EmailDB.get_notepads(limit=limit)
    return {"success": True, "notepads": notepads}


@router.get("/notepads/{note_id}")
async def get_notepad(note_id: int):
    """获取单个笔记"""
    notepad = EmailDB.get_notepad(note_id)
    if notepad:
        return {"success": True, "notepad": notepad}
    return {"success": False, "error": "Notepad not found"}


@router.post("/notepads")
async def create_notepad(data: NotepadRequest):
    """创建笔记"""
    note_id = EmailDB.create_notepad(
        title=data.title,
        content=data.content or "",
        tags=data.tags or "[]",
        color=data.color or "#ffd700"
    )
    if note_id:
        return {"success": True, "id": note_id}
    return {"success": False, "message": "创建失败"}


@router.put("/notepads/{note_id}")
async def update_notepad(note_id: int, data: NotepadUpdateRequest):
    """更新笔记"""
    update_data = {}
    if data.title is not None:
        update_data["title"] = data.title
    if data.content is not None:
        update_data["content"] = data.content
    if data.tags is not None:
        update_data["tags"] = data.tags
    if data.color is not None:
        update_data["color"] = data.color
    result = EmailDB.update_notepad(note_id, update_data)
    return {"success": result}


@router.delete("/notepads/{note_id}")
async def delete_notepad(note_id: int):
    """删除笔记"""
    result = EmailDB.delete_notepad(note_id)
    return {"success": result}


@router.post("/notepads/{note_id}/pin")
async def toggle_notepad_pin(note_id: int, pinned: int = Form(...)):
    """切换笔记置顶状态"""
    result = EmailDB.toggle_pin(note_id, pinned)
    return {"success": result, "pinned": pinned}


@router.get("/notepads/search")
async def search_notepads(q: str = Query(..., description="搜索关键词")):
    """搜索笔记"""
    notepads = EmailDB.search_notepads(q)
    return {"success": True, "notepads": notepads}


# =================== 附件落地工具 ===================

def _save_attachment_file(attach: dict, email_data: dict, account_email: str) -> str:
    """将附件保存到本地文件系统 & 写入attachments表"""
    import base64
    import hashlib
    
    content_b64 = attach.get("content_base64", "")
    if not content_b64:
        return ""
    
    filename = attach.get("filename", "unnamed")
    content_type = attach.get("content_type", "application/octet-stream")
    size = attach.get("size", 0)
    
    # 解码 base64
    file_content = base64.b64decode(content_b64)
    
    # 文件名做哈希避免冲突
    name_hash = hashlib.md5(account_email.encode() + filename.encode()).hexdigest()[:12]
    safe_name = f"{name_hash}_{filename}"
    file_path = _ATTACHMENT_DIR / safe_name
    
    # 写盘
    with open(file_path, "wb") as f:
        f.write(file_content)
    
    # 入库
    email_id_val = email_data.get("id") or email_data.get("uid", "0")
    try:
        email_id_int = int(email_id_val)
    except (ValueError, TypeError):
        email_id_int = 0
    
    EmailDB.save_attachment(
        email_id=email_id_int,
        email_subject=email_data.get("subject", ""),
        filename=filename,
        content_type=content_type,
        size=size,
        file_path=str(file_path)
    )
    logger.info(f"[附件] 已保存: {filename} ({size} bytes) -> {file_path}")
    return str(file_path)