"""
TeamChat邮件系统 - 后端模块初始化
"""

from .database import EmailDB, init_db
from .routes import router

__all__ = ['EmailDB', 'init_db', 'router']