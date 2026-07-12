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

from .database import EmailDB

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
                _, msg_data = mail.fetch(email_id, "(RFC822)")
                raw_email = msg_data[0][1]
                msg = email.message_from_bytes(raw_email)
                
                # 解析邮件
                email_data = self._parse_email(msg, email_id.decode())
                emails.append(email_data)
            
            mail.close()
            mail.logout()
            
            return emails
            
        except Exception as e:
            logger.error(f"获取邮件失败: {str(e)}")
            return []
    
    def fetch_emails_incremental(self, folder: str = "INBOX", last_uid: str = None, limit: int = 100) -> List[dict]:
        """增量获取邮件（只获取新邮件）"""
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
            
            mail.close()
            mail.logout()
            
            logger.info(f"增量同步: 获取 {len(emails)} 封新邮件")
            return emails
            
        except Exception as e:
            logger.error(f"增量获取邮件失败: {str(e)}")
            return []
    
    def _parse_email(self, msg, email_id: str) -> dict:
        """解析邮件内容"""
        # 解析主题
        subject = ""
        subject_header = msg.get("Subject", "")
        if subject_header:
            decoded = decode_header(subject_header)
            for part, charset in decoded:
                if isinstance(part, bytes):
                    subject += part.decode(charset or "utf-8", errors="ignore")
                else:
                    subject += part
        
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
        
        # 解析正文
        body = ""
        html_body = ""
        
        if msg.is_multipart():
            for part in msg.walk():
                content_type = part.get_content_type()
                content_disposition = str(part.get("Content-Disposition", ""))
                
                if content_type == "text/plain" and "attachment" not in content_disposition:
                    try:
                        body = part.get_payload(decode=True).decode("utf-8", errors="ignore")
                    except:
                        pass
                elif content_type == "text/html" and "attachment" not in content_disposition:
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
            "attachments": []
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
    emails = EmailDB.get_inbox(limit=limit, offset=offset, folder=folder, account_email=account)
    return {"success": True, "emails": emails}


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
    # TODO: 实现标记已读逻辑
    return {"success": True}


@router.post("/inbox/{id}/unread")
async def mark_inbox_email_unread(id: int):
    """标记收件箱邮件为未读"""
    # TODO: 实现标记未读逻辑
    return {"success": True}


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
    emails = EmailDB.get_trash(limit=limit, offset=offset, account_email=account)
    return {"success": True, "emails": emails}


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
    # TODO: 实现恢复逻辑
    return {"success": True}


@router.delete("/trash/{id}")
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

# 注意：/sync 路由已移至 main.py 中统一处理
# 此处仅保留内部调用函数

# 内部调用用的同步函数（不依赖Query参数）
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
                    config['smtp_password'] = config.get('smtp_password', '')
                if config.get('imap_password'):
                    config['imap_password'] = config.get('imap_password', '')

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

                # 保存到数据库
                synced_count = 0
                for email_data in inbox_emails:
                    try:
                        result = EmailDB.add_inbox_email(email_data)
                        if result:
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
        else:
            return {"success": True, "results": result, "message": "连接测试部分成功"}

    except Exception as e:
        logger.error(f"测试邮箱连接失败: {e}")
        return {"success": False, "message": f"测试连接失败: {str(e)}"}


# ── Accounts API ───────────────────────────────────────────────────────────────

@router.get("/email-accounts")
async def get_accounts():
    """获取所有邮箱账户列表"""
    try:
        configs = EmailDB.get_all_configs()
        accounts = []
        for config in configs:
            accounts.append({
                "id": config.get("id"),
                "email": config.get("email"),
                "name": config.get("display_name", config.get("email", "")),
                "display_name": config.get("display_name", ""),
                "provider": config.get("provider", "custom"),
                "is_default": config.get("is_default", False),
            })
        return {"success": True, "accounts": accounts}
    except Exception as e:
        logger.error(f"获取账户列表失败: {e}")
        return {"success": False, "message": str(e), "accounts": []}


# ── Stats API ───────────────────────────────────────────────────────────────

@router.get("/stats")
async def get_email_stats():
    """获取邮箱统计信息"""
    # TODO: 实现统计逻辑
    return {
        "success": True,
        "stats": {
            "inbox_total": 0,
            "inbox_unread": 0,
            "sent_total": 0,
            "drafts_total": 0,
            "trash_total": 0,
            "contacts_total": 0
        }
    }


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