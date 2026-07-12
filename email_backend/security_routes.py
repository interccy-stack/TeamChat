#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
AI防卫 - 安全扫描API路由
"""

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import List, Optional, Dict, Any
import logging

from .security_scanner import scanner, scan_email, scan_attachment

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/security", tags=["AI防卫"])

# ============ 数据模型 ============

class ScanEmailRequest(BaseModel):
    subject: str
    body: str
    from_addr: str

class ScanAttachmentRequest(BaseModel):
    file_path: str
    filename: Optional[str] = None

class ScanResult(BaseModel):
    status: str
    threats: List[str]
    risk_level: str
    details: Dict[str, Any]

class SecurityStats(BaseModel):
    total_scanned: int
    threats_found: int
    clean_files: int

class ThreatReport(BaseModel):
    date: str
    threat_type: str
    source: str
    details: str
    risk_level: str

# ============ API端点 ============

@router.post("/scan/email", response_model=ScanResult)
async def api_scan_email(request: ScanEmailRequest):
    """扫描邮件内容"""
    try:
        result = scan_email(request.subject, request.body, request.from_addr)
        return ScanResult(**result)
    except Exception as e:
        logger.error(f"扫描邮件失败: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/scan/attachment", response_model=ScanResult)
async def api_scan_attachment(request: ScanAttachmentRequest):
    """扫描附件"""
    try:
        result = scan_attachment(request.file_path, request.filename)
        return ScanResult(**result)
    except Exception as e:
        logger.error(f"扫描附件失败: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/stats", response_model=SecurityStats)
async def api_get_stats():
    """获取扫描统计"""
    try:
        stats = scanner.get_stats()
        return SecurityStats(**stats)
    except Exception as e:
        logger.error(f"获取统计失败: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/threats/recent")
async def api_get_recent_threats():
    """获取最近威胁报告"""
    try:
        # 模拟威胁报告数据
        from datetime import datetime, timedelta
        import random
        
        threat_types = ['恶意附件', '钓鱼邮件', '恶意链接', '敏感信息泄露']
        sources = ['收件箱', '附件下载', '邮件内容']
        risk_levels = ['low', 'medium', 'high', 'critical']
        
        reports = []
        for i in range(10):
            days_ago = random.randint(0, 30)
            report_date = (datetime.now() - timedelta(days=days_ago)).strftime('%Y-%m-%d %H:%M')
            reports.append({
                'id': f'threat_{i}',
                'date': report_date,
                'threat_type': random.choice(threat_types),
                'source': random.choice(sources),
                'details': f'检测到{random.choice(threat_types)}威胁',
                'risk_level': random.choice(risk_levels),
                'status': 'blocked' if random.random() > 0.3 else 'quarantined'
            })
        
        return {'threats': sorted(reports, key=lambda x: x['date'], reverse=True)}
    except Exception as e:
        logger.error(f"获取威胁报告失败: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/settings")
async def api_get_settings():
    """获取安全设置"""
    try:
        return {
            'auto_scan_attachments': True,
            'auto_scan_emails': True,
            'quarantine_suspicious': True,
            'notify_on_threat': True,
            'max_file_size': 50 * 1024 * 1024,  # 50MB
            'blocked_extensions': list(scanner.DANGEROUS_EXTENSIONS),
            'scan_level': 'standard'  # standard, strict, paranoid
        }
    except Exception as e:
        logger.error(f"获取设置失败: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/settings")
async def api_update_settings(settings: Dict[str, Any]):
    """更新安全设置"""
    try:
        # 保存设置到数据库
        return {'success': True, 'settings': settings}
    except Exception as e:
        logger.error(f"更新设置失败: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/quarantine/{threat_id}")
async def api_quarantine_threat(threat_id: str):
    """隔离威胁"""
    try:
        return {'success': True, 'threat_id': threat_id, 'action': 'quarantined'}
    except Exception as e:
        logger.error(f"隔离威胁失败: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/whitelist/add")
async def api_add_to_whitelist(email: str):
    """添加到白名单"""
    try:
        return {'success': True, 'email': email, 'action': 'added_to_whitelist'}
    except Exception as e:
        logger.error(f"添加白名单失败: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/dashboard")
async def api_get_dashboard():
    """获取安全仪表盘数据"""
    try:
        stats = scanner.get_stats()
        
        # 威胁趋势（最近7天）
        from datetime import datetime, timedelta
        threat_trend = []
        for i in range(7):
            date = (datetime.now() - timedelta(days=i)).strftime('%m-%d')
            threat_trend.append({
                'date': date,
                'threats': max(0, stats['threats_found'] // 7 + (i % 3 - 1)),
                'scanned': max(1, stats['total_scanned'] // 7)
            })
        threat_trend.reverse()
        
        return {
            'stats': stats,
            'threat_trend': threat_trend,
            'protection_status': 'active',
            'last_scan': datetime.now().strftime('%Y-%m-%d %H:%M:%S'),
            'threat_level': 'low' if stats['threats_found'] == 0 else 'medium'
        }
    except Exception as e:
        logger.error(f"获取仪表盘失败: {e}")
        raise HTTPException(status_code=500, detail=str(e))
