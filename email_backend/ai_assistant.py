"""
邮件AI助手API
集成QwenPaw本地智能体
"""

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field
from typing import Optional
import logging
import httpx

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/ai-assistant", tags=["ai-assistant"])

# QwenPaw API地址
QWENPAW_API = "http://127.0.0.1:8088"


class AIRequest(BaseModel):
    """AI请求模型"""
    type: str = Field(..., description="助手类型: writer|translator")
    subject: Optional[str] = Field(None, description="邮件主题")
    body: Optional[str] = Field(None, description="邮件正文")


@router.post("/write-email")
async def ai_write_email(request: AIRequest):
    """
    AI写作助手 - 使用本地智能体生成邮件正文

    Args:
        request: 包含邮件主题的请求

    Returns:
        AI生成的邮件正文
    """
    try:
        if not request.subject:
            raise HTTPException(status_code=400, detail="请提供邮件主题")

        # 构造提示词
        prompt = f"""请帮我写一封邮件，主题是：{request.subject}

请生成专业、礼貌的邮件正文，包含：
1. 礼貌的开场白
2. 详细的正文内容
3. 礼貌的结束语

请直接输出邮件正文，不要包含主题或其他说明。使用中文。"""

        # 调用QwenPaw API
        async with httpx.AsyncClient(timeout=30.0) as client:
            response = await client.post(
                f"{QWENPAW_API}/api/console/chat",
                json={
                    "session_id": f"email-writer-{request.subject}",
                    "message": prompt,
                    "agent_ids": ["default"]  # 使用默认智能体
                }
            )

            if response.status_code == 200:
                data = response.json()
                result = data.get("response", "")
                return {
                    "success": True,
                    "content": result
                }
            else:
                raise HTTPException(status_code=response.status_code, detail="AI调用失败")

    except Exception as e:
        logger.error(f"AI写作助手失败: {e}")
        raise HTTPException(status_code=500, detail=f"AI写作助手失败: {str(e)}")


@router.post("/translate-email")
async def ai_translate_email(request: AIRequest):
    """
    AI翻译助手 - 使用本地智能体翻译邮件

    Args:
        request: 包含邮件正文的请求

    Returns:
        翻译后的邮件正文
    """
    try:
        if not request.body:
            raise HTTPException(status_code=400, detail="请提供邮件正文")

        # 构造提示词
        prompt = f"""请将以下邮件正文翻译：

如果是中文，翻译成英文
如果是英文，翻译成中文

保持专业和礼貌的语气。

原文：
{request.body}

请直接输出翻译结果，不要包含其他说明。"""

        # 调用QwenPaw API
        async with httpx.AsyncClient(timeout=30.0) as client:
            response = await client.post(
                f"{QWENPAW_API}/api/console/chat",
                json={
                    "session_id": f"email-translator-{len(request.body)}",
                    "message": prompt,
                    "agent_ids": ["default"]  # 使用默认智能体
                }
            )

            if response.status_code == 200:
                data = response.json()
                result = data.get("response", "")
                return {
                    "success": True,
                    "content": result
                }
            else:
                raise HTTPException(status_code=response.status_code, detail="AI调用失败")

    except Exception as e:
        logger.error(f"AI翻译助手失败: {e}")
        raise HTTPException(status_code=500, detail=f"AI翻译助手失败: {str(e)}")


@router.post("/improve-email")
async def ai_improve_email(request: AIRequest):
    """
    AI邮件优化助手 - 优化邮件内容

    Args:
        request: 包含邮件主题和正文的请求

    Returns:
        优化后的邮件正文
    """
    try:
        if not request.body:
            raise HTTPException(status_code=400, detail="请提供邮件正文")

        # 构造提示词
        prompt = f"""请优化以下邮件内容：

主题：{request.subject or '无'}

正文：
{request.body}

优化要求：
1. 改善语言表达，使其更加专业和礼貌
2. 确保逻辑清晰，条理分明
3. 修正语法和标点错误
4. 保持原文的核心意思不变

请直接输出优化后的邮件正文。"""

        # 调用QwenPaw API
        async with httpx.AsyncClient(timeout=30.0) as client:
            response = await client.post(
                f"{QWENPAW_API}/api/console/chat",
                json={
                    "session_id": f"email-improver-{len(request.body)}",
                    "message": prompt,
                    "agent_ids": ["default"]  # 使用默认智能体
                }
            )

            if response.status_code == 200:
                data = response.json()
                result = data.get("response", "")
                return {
                    "success": True,
                    "content": result
                }
            else:
                raise HTTPException(status_code=response.status_code, detail="AI调用失败")

    except Exception as e:
        logger.error(f"AI邮件优化助手失败: {e}")
        raise HTTPException(status_code=500, detail=f"AI邮件优化助手失败: {str(e)}")