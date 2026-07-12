#!/usr/bin/env python
# -*- coding: utf-8 -*-
"""
Himalaya 邮件客户端集成模块
提供真实的邮件收发功能
"""
import subprocess
import json
import os
import toml
from pathlib import Path
from typing import List, Dict, Optional

class HimalayaClient:
    """Himalaya 邮件客户端封装"""
    
    def __init__(self, config_dir: Optional[str] = None):
        self.config_dir = config_dir or os.path.expanduser("~/.config/himalaya")
        self.config_file = os.path.join(self.config_dir, "config.toml")
        
    def is_installed(self) -> bool:
        """检查 Himalaya 是否已安装"""
        try:
            result = subprocess.run(
                ["himalaya", "--version"],
                capture_output=True,
                text=True,
                timeout=5
            )
            return result.returncode == 0
        except:
            return False
    
    def generate_config(self, email_config: Dict) -> str:
        """根据前端配置生成 Himalaya 配置文件"""
        config = {
            "accounts": {
                "default": {
                    "email": email_config.get("email", ""),
                    "display-name": email_config.get("display_name", ""),
                    "default": True,
                    "backend": {
                        "type": "imap",
                        "host": email_config.get("imap_host", ""),
                        "port": email_config.get("imap_port", 993),
                        "encryption": {
                            "type": "tls" if email_config.get("imap_ssl") else "none"
                        },
                        "login": email_config.get("username", ""),
                        "auth": {
                            "type": "password",
                            "cmd": f"echo '{email_config.get('password', '')}'"
                        }
                    },
                    "message": {
                        "send": {
                            "backend": {
                                "type": "smtp",
                                "host": email_config.get("smtp_host", ""),
                                "port": email_config.get("smtp_port", 587),
                                "encryption": {
                                    "type": "start-tls" if email_config.get("smtp_ssl") else "none"
                                },
                                "login": email_config.get("username", ""),
                                "auth": {
                                    "type": "password",
                                    "cmd": f"echo '{email_config.get('password', '')}'"
                                }
                            },
                            "save-to-folder": "Sent"
                        }
                    }
                }
            }
        }
        
        # 163 邮箱特殊配置
        if "163.com" in email_config.get("email", ""):
            config["accounts"]["default"]["backend"]["extensions"] = {
                "id": {"send-after-auth": True}
            }
        
        return toml.dumps(config)
    
    def save_config(self, email_config: Dict):
        """保存配置到文件"""
        os.makedirs(self.config_dir, exist_ok=True)
        config_content = self.generate_config(email_config)
        with open(self.config_file, 'w', encoding='utf-8') as f:
            f.write(config_content)
    
    def list_emails(self, folder: str = "INBOX", page: int = 1, page_size: int = 20) -> List[Dict]:
        """获取邮件列表"""
        try:
            result = subprocess.run(
                ["himalaya", "envelope", "list", 
                 "--folder", folder,
                 "--page", str(page),
                 "--page-size", str(page_size),
                 "--output", "json"],
                capture_output=True,
                text=True,
                timeout=30
            )
            
            if result.returncode == 0:
                data = json.loads(result.stdout)
                return self._parse_envelopes(data)
            else:
                print(f"Himalaya error: {result.stderr}")
                return []
        except Exception as e:
            print(f"Error listing emails: {e}")
            return []
    
    def _parse_envelopes(self, data: List[Dict]) -> List[Dict]:
        """解析邮件信封数据"""
        emails = []
        for item in data:
            email = {
                "id": item.get("id", ""),
                "subject": item.get("subject", "(无主题)"),
                "from_addr": item.get("from", {}).get("name", item.get("from", {}).get("addr", "")),
                "to_addr": [a.get("addr", "") for a in item.get("to", [])],
                "date": item.get("date", ""),
                "flags": item.get("flags", []),
                "has_attachments": item.get("attachments", 0) > 0
            }
            emails.append(email)
        return emails
    
    def read_email(self, email_id: str, folder: str = "INBOX") -> Optional[Dict]:
        """读取邮件内容"""
        try:
            result = subprocess.run(
                ["himalaya", "message", "read", email_id,
                 "--folder", folder],
                capture_output=True,
                text=True,
                timeout=30
            )
            
            if result.returncode == 0:
                return {
                    "id": email_id,
                    "content": result.stdout,
                    "raw": result.stdout
                }
            else:
                print(f"Himalaya error: {result.stderr}")
                return None
        except Exception as e:
            print(f"Error reading email: {e}")
            return None
    
    def send_email(self, to: str, subject: str, body: str, 
                   cc: Optional[str] = None, bcc: Optional[str] = None) -> bool:
        """发送邮件"""
        try:
            # 构建邮件头
            headers = [f"To: {to}"]
            if cc:
                headers.append(f"Cc: {cc}")
            if bcc:
                headers.append(f"Bcc: {bcc}")
            headers.append(f"Subject: {subject}")
            
            # 使用 template write | template send 管道
            env = os.environ.copy()
            env["EDITOR"] = "cat"
            
            # 构建命令
            header_args = []
            for h in headers:
                header_args.extend(["-H", h])
            
            # 先写模板
            write_result = subprocess.run(
                ["himalaya", "template", "write"] + header_args + [body],
                capture_output=True,
                text=True,
                timeout=30,
                env=env
            )
            
            if write_result.returncode != 0:
                print(f"Template write error: {write_result.stderr}")
                return False
            
            # 发送邮件
            send_result = subprocess.run(
                ["himalaya", "template", "send"],
                input=write_result.stdout,
                capture_output=True,
                text=True,
                timeout=30
            )
            
            return send_result.returncode == 0
            
        except Exception as e:
            print(f"Error sending email: {e}")
            return False
    
    def delete_email(self, email_id: str, folder: str = "INBOX") -> bool:
        """删除邮件"""
        try:
            result = subprocess.run(
                ["himalaya", "message", "delete", email_id,
                 "--folder", folder],
                capture_output=True,
                text=True,
                timeout=30
            )
            return result.returncode == 0
        except Exception as e:
            print(f"Error deleting email: {e}")
            return False
    
    def add_flag(self, email_id: str, flag: str, folder: str = "INBOX") -> bool:
        """添加标记（如 seen, flagged）"""
        try:
            result = subprocess.run(
                ["himalaya", "flag", "add", email_id,
                 "--flag", flag,
                 "--folder", folder],
                capture_output=True,
                text=True,
                timeout=30
            )
            return result.returncode == 0
        except Exception as e:
            print(f"Error adding flag: {e}")
            return False
    
    def remove_flag(self, email_id: str, flag: str, folder: str = "INBOX") -> bool:
        """移除标记"""
        try:
            result = subprocess.run(
                ["himalaya", "flag", "remove", email_id,
                 "--flag", flag,
                 "--folder", folder],
                capture_output=True,
                text=True,
                timeout=30
            )
            return result.returncode == 0
        except Exception as e:
            print(f"Error removing flag: {e}")
            return False
    
    def search_emails(self, query: str, folder: str = "INBOX") -> List[Dict]:
        """搜索邮件"""
        try:
            result = subprocess.run(
                ["himalaya", "envelope", "list"] + query.split() +
                ["--folder", folder,
                 "--output", "json"],
                capture_output=True,
                text=True,
                timeout=30
            )
            
            if result.returncode == 0:
                data = json.loads(result.stdout)
                return self._parse_envelopes(data)
            else:
                return []
        except Exception as e:
            print(f"Error searching emails: {e}")
            return []


# 全局客户端实例
_himalaya_client = None

def get_himalaya_client() -> HimalayaClient:
    """获取 Himalaya 客户端实例"""
    global _himalaya_client
    if _himalaya_client is None:
        _himalaya_client = HimalayaClient()
    return _himalaya_client


def check_himalaya_available() -> bool:
    """检查 Himalaya 是否可用"""
    return get_himalaya_client().is_installed()
