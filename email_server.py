"""
TeamChat邮箱 - 独立FastAPI后端服务

端口：18888
路由前缀：/api/v1/email
"""

import logging
import os
import sys
from pathlib import Path

# 添加项目根目录到路径（email_backend是子包）
sys.path.insert(0, str(Path(__file__).parent))

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware

from email_backend.database import EmailDB, init_db
from email_backend.routes import router as email_router
from email_backend.ai_assistant import router as ai_assistant_router

# 配置日志
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# 创建FastAPI应用
app = FastAPI(
    title="TeamChat Email API",
    description="TeamChat邮箱系统独立后端服务",
    version="5.2.0"
)

# 配置CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # 允许所有来源（本地服务）
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 注册路由
app.include_router(email_router, prefix="/api/v1/email")
app.include_router(ai_assistant_router, prefix="/api/v1/email")


@app.on_event("startup")
async def startup_event():
    """应用启动时初始化数据库"""
    logger.info("[TeamChat Email] 初始化数据库...")
    init_db()
    logger.info("[TeamChat Email] 数据库初始化完成")


@app.get("/")
async def root():
    """根路径 - 健康检查"""
    return {
        "service": "TeamChat Email Backend",
        "version": "5.2.0",
        "status": "running"
    }


@app.get("/health")
async def health():
    """健康检查端点"""
    return {"status": "healthy"}


if __name__ == "__main__":
    import uvicorn
    port = int(os.environ.get("TEAMCHAT_EMAIL_PORT", "18888"))
    uvicorn.run(
        app,
        host="127.0.0.1",
        port=port,
        log_level="info"
    )