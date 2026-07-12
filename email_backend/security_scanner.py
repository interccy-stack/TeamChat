#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
AI防卫 - 邮件安全扫描模块
功能：附件病毒扫描、恶意链接检测、敏感内容识别
"""

import hashlib
import re
import logging
from typing import Dict, List, Any, Optional
from pathlib import Path

logger = logging.getLogger(__name__)

class SecurityScanner:
    """安全扫描器"""
    
    # 恶意文件签名（MD5哈希）
    MALWARE_SIGNATURES = {
        # 常见恶意文件哈希示例
        'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855': 'EmptyFile',
    }
    
    # 危险文件扩展名
    DANGEROUS_EXTENSIONS = {
        '.exe', '.dll', '.bat', '.cmd', '.sh', '.php', '.jsp', '.asp',
        '.jar', '.war', '.ear', '.ps1', '.vbs', '.js', '.wsf',
        '.hta', '.msi', '.com', '.scr', '.pif', '.gadget'
    }
    
    # 可疑文件扩展名
    SUSPICIOUS_EXTENSIONS = {
        '.zip', '.rar', '.7z', '.tar', '.gz', '.bz2',
        '.doc', '.docx', '.xls', '.xlsx', '.ppt', '.pptx',
        '.pdf', '.rtf'
    }
    
    # 恶意URL模式
    MALICIOUS_URL_PATTERNS = [
        r'https?://[^\s]+\.exe',
        r'https?://[^\s]+\.dll',
        r'https?://[^\s]+\.bat',
        r'https?://\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}',  # IP地址链接
        r'https?://[^\s]{100,}',  # 超长URL
        r'https?://[^\s]*[<>\'"\\]',  # 包含特殊字符的URL
    ]
    
    # 钓鱼关键词
    PHISHING_KEYWORDS = [
        'urgent', 'immediate action', 'account suspended', 'verify your account',
        'click here', 'login now', 'update payment', 'confirm identity',
        'password expired', 'unusual activity', 'suspicious login'
    ]
    
    # 敏感信息模式
    SENSITIVE_PATTERNS = {
        'credit_card': r'\b(?:4[0-9]{12}(?:[0-9]{3})?|5[1-5][0-9]{14}|3[47][0-9]{13}|3(?:0[0-5]|[68][0-9])[0-9]{11}|6(?:011|5[0-9]{2})[0-9]{12}|(?:2131|1800|35\d{3})\d{11})\b',
        'ssn': r'\b\d{3}-\d{2}-\d{4}\b',
        'phone': r'\b1[3-9]\d{9}\b',
        'email': r'\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b',
        'password': r'(?i)(password|passwd|pwd)\s*[:=]\s*\S+',
        'api_key': r'(?i)(api[_-]?key|token|secret)\s*[:=]\s*[\w-]{16,}',
    }
    
    def __init__(self):
        self.scan_stats = {
            'total_scanned': 0,
            'threats_found': 0,
            'clean_files': 0
        }
    
    def scan_file(self, file_path: str, filename: str = None) -> Dict[str, Any]:
        """扫描单个文件"""
        result = {
            'file': filename or file_path,
            'status': 'clean',
            'threats': [],
            'risk_level': 'low',
            'details': {}
        }
        
        try:
            path = Path(file_path)
            if not path.exists():
                result['status'] = 'error'
                result['threats'].append('文件不存在')
                return result
            
            # 检查文件扩展名
            ext = path.suffix.lower()
            if ext in self.DANGEROUS_EXTENSIONS:
                result['status'] = 'threat'
                result['threats'].append(f'危险文件类型: {ext}')
                result['risk_level'] = 'high'
            elif ext in self.SUSPICIOUS_EXTENSIONS:
                result['risk_level'] = 'medium'
                result['details']['suspicious_extension'] = ext
            
            # 计算文件哈希
            file_hash = self._calculate_hash(file_path)
            result['details']['hash'] = file_hash
            
            # 检查已知恶意哈希
            if file_hash in self.MALWARE_SIGNATURES:
                result['status'] = 'threat'
                result['threats'].append(f'已知恶意文件: {self.MALWARE_SIGNATURES[file_hash]}')
                result['risk_level'] = 'critical'
            
            # 扫描文件内容（如果是文本文件）
            if ext in ['.txt', '.html', '.htm', '.js', '.vbs', '.bat']:
                content_threats = self._scan_content(path.read_text(encoding='utf-8', errors='ignore'))
                if content_threats:
                    result['threats'].extend(content_threats)
                    if result['risk_level'] != 'critical':
                        result['risk_level'] = 'high'
            
            # 更新统计
            self.scan_stats['total_scanned'] += 1
            if result['threats']:
                self.scan_stats['threats_found'] += 1
                result['status'] = 'threat'
            else:
                self.scan_stats['clean_files'] += 1
                
        except Exception as e:
            logger.error(f"扫描文件失败: {e}")
            result['status'] = 'error'
            result['threats'].append(f'扫描错误: {str(e)}')
        
        return result
    
    def scan_email_content(self, subject: str, body: str, from_addr: str) -> Dict[str, Any]:
        """扫描邮件内容"""
        result = {
            'status': 'clean',
            'threats': [],
            'risk_level': 'low',
            'details': {}
        }
        
        content = f"{subject} {body}"
        
        # 检查恶意链接
        malicious_urls = self._find_malicious_urls(content)
        if malicious_urls:
            result['threats'].extend([f'恶意链接: {url}' for url in malicious_urls[:3]])
            result['risk_level'] = 'high'
        
        # 检查钓鱼关键词
        phishing_score = self._check_phishing(content)
        if phishing_score > 0.5:
            result['threats'].append(f'疑似钓鱼邮件 (可信度: {phishing_score:.0%})')
            result['risk_level'] = 'high'
            result['details']['phishing_score'] = phishing_score
        
        # 检查敏感信息泄露
        sensitive_data = self._find_sensitive_data(content)
        if sensitive_data:
            result['threats'].append(f'包含敏感信息: {", ".join(sensitive_data.keys())}')
            result['details']['sensitive_data'] = sensitive_data
            if result['risk_level'] != 'high':
                result['risk_level'] = 'medium'
        
        # 检查发件人可信度
        sender_trust = self._check_sender_trust(from_addr)
        result['details']['sender_trust'] = sender_trust
        if sender_trust < 0.3:
            result['threats'].append('发件人可信度低')
            if result['risk_level'] == 'low':
                result['risk_level'] = 'medium'
        
        if result['threats']:
            result['status'] = 'suspicious'
        
        return result
    
    def _calculate_hash(self, file_path: str) -> str:
        """计算文件MD5哈希"""
        hash_md5 = hashlib.md5()
        with open(file_path, "rb") as f:
            for chunk in iter(lambda: f.read(4096), b""):
                hash_md5.update(chunk)
        return hash_md5.hexdigest()
    
    def _find_malicious_urls(self, content: str) -> List[str]:
        """查找恶意URL"""
        malicious = []
        for pattern in self.MALICIOUS_URL_PATTERNS:
            matches = re.findall(pattern, content, re.IGNORECASE)
            malicious.extend(matches)
        return list(set(malicious))[:10]
    
    def _check_phishing(self, content: str) -> float:
        """检查钓鱼邮件分数 (0-1)"""
        content_lower = content.lower()
        score = 0.0
        
        for keyword in self.PHISHING_KEYWORDS:
            if keyword in content_lower:
                score += 0.2
        
        # 检查紧急程度词汇
        urgency_words = ['urgent', 'immediate', 'now', 'today', 'expire', 'deadline']
        for word in urgency_words:
            if word in content_lower:
                score += 0.1
        
        return min(score, 1.0)
    
    def _find_sensitive_data(self, content: str) -> Dict[str, List[str]]:
        """查找敏感数据"""
        found = {}
        for data_type, pattern in self.SENSITIVE_PATTERNS.items():
            matches = re.findall(pattern, content)
            if matches:
                found[data_type] = matches[:5]  # 最多保存5个
        return found
    
    def _check_sender_trust(self, from_addr: str) -> float:
        """检查发件人可信度 (0-1)"""
        # 简单规则：知名邮箱服务可信度较高
        trusted_domains = ['qq.com', '163.com', 'gmail.com', 'outlook.com', 'qq.com']
        suspicious_domains = ['tempmail.com', '10minutemail.com', 'guerrillamail.com']
        
        domain = from_addr.split('@')[-1].lower() if '@' in from_addr else ''
        
        if domain in trusted_domains:
            return 0.8
        elif domain in suspicious_domains:
            return 0.1
        elif 'qq.com' in domain or '163.com' in domain:
            return 0.7
        else:
            return 0.5
    
    def _scan_content(self, content: str) -> List[str]:
        """扫描文件内容中的威胁"""
        threats = []
        
        # 检查恶意脚本模式
        script_patterns = [
            (r'eval\s*\(', '可疑eval调用'),
            (r'exec\s*\(', '可疑exec调用'),
            (r'document\.write\s*\(', '可疑document.write'),
            (r'window\.location\s*=', '可疑跳转'),
            (r'<script[^>]*>.*?<\/script>', '内嵌脚本'),
            (r'CreateObject\s*\(', 'COM对象创建'),
            (r'Shell\s*\(', 'Shell命令'),
        ]
        
        for pattern, desc in script_patterns:
            if re.search(pattern, content, re.IGNORECASE | re.DOTALL):
                threats.append(desc)
        
        return threats
    
    def get_stats(self) -> Dict[str, int]:
        """获取扫描统计"""
        return self.scan_stats.copy()


# 全局扫描器实例
scanner = SecurityScanner()

def scan_attachment(file_path: str, filename: str = None) -> Dict[str, Any]:
    """扫描附件（便捷函数）"""
    return scanner.scan_file(file_path, filename)

def scan_email(subject: str, body: str, from_addr: str) -> Dict[str, Any]:
    """扫描邮件（便捷函数）"""
    return scanner.scan_email_content(subject, body, from_addr)
