# -*- coding: utf-8 -*-
"""
AI投票 LLM 集成模块
支持外调智能体（如豆包、OpenAI、Claude等）参与投票

功能：
- 多智能体API调用
- 支持不同模型提供商
- 投票分析和推理
- 置信度计算
- 协商对话

版本: v5.2.2
"""

import json
import logging
import asyncio
import httpx
import time
from typing import Dict, List, Optional, Any, Tuple
from dataclasses import dataclass
from enum import Enum

logger = logging.getLogger("qwenpaw.team_chat.ai_voting.llm")


class LLMProvider(Enum):
    """LLM提供商"""
    EXTENSION = "extension"    # 浏览器扩展代理
    DOUBAO = "doubao"          # 豆包
    OPENAI = "openai"          # OpenAI
    ANTHROPIC = "anthropic"    # Claude
    QWEN = "qwen"              # 通义千问
    LOCAL = "local"            # 本地模型
    CUSTOM = "custom"          # 自定义


@dataclass
class LLMConfig:
    """LLM配置"""
    provider: str
    model: str
    api_key: str = ""
    api_base: str = ""
    temperature: float = 0.7
    max_tokens: int = 2000
    timeout: int = 30
    
    # 智能体角色设定
    role: str = ""
    expertise: List[str] = None
    personality: str = ""
    
    def __post_init__(self):
        if self.expertise is None:
            self.expertise = []


@dataclass
class LLMResponse:
    """LLM响应"""
    content: str
    reasoning: str = ""
    confidence: float = 0.8
    tokens_used: int = 0
    latency: float = 0.0
    error: str = ""


class LLMVotingEngine:
    """LLM投票引擎 - 支持外调智能体"""
    
    # 默认API配置
    DEFAULT_CONFIGS = {
        LLMProvider.DOUBAO: {
            "api_base": "https://ark.cn-beijing.volces.com/api/v3",
            "model": "doubao-pro-128k"
        },
        LLMProvider.OPENAI: {
            "api_base": "https://api.openai.com/v1",
            "model": "gpt-4"
        },
        LLMProvider.ANTHROPIC: {
            "api_base": "https://api.anthropic.com/v1",
            "model": "claude-3-opus-20240229"
        },
        LLMProvider.QWEN: {
            "api_base": "https://dashscope.aliyuncs.com/api/v1",
            "model": "qwen-max"
        }
    }
    
    def __init__(self):
        self._clients: Dict[str, httpx.AsyncClient] = {}
        self._vote_prompts = self._load_vote_prompts()
    
    def _load_vote_prompts(self) -> Dict[str, str]:
        """加载投票提示词模板"""
        return {
            "analysis": """你是一位专业的{role}，拥有{expertise}方面的丰富经验。

请对以下投票主题进行专业分析：

主题：{title}
描述：{description}
选项：
{options}

请从专业角度分析每个选项的优缺点，并给出你的倾向性评分（0-1分）。
输出格式必须是JSON：
{{
    "scores": {{"选项ID": 评分, ...}},
    "preference": "最倾向的选项ID",
    "confidence": 0.85,
    "reasoning": "详细的分析理由..."
}}""",
            
            "negotiation": """你是一位专业的{role}。

当前投票主题：{title}
描述：{description}

你之前的分析：{previous_analysis}

其他智能体的观点：{other_opinions}

请基于以上信息，表达你的观点，并尝试说服其他智能体达成共识。
输出格式必须是JSON：
{{
    "opinion": "你的观点陈述",
    "suggestions": ["建议1", "建议2"],
    "willing_to_compromise": true/false,
    "preferred_outcome": "期望的结果"
}}""",
            
            "voting": """你是一位专业的{role}。

投票主题：{title}
描述：{description}
选项：
{options}

你的分析：{analysis}
协商历史：{negotiation_history}

现在请做出最终投票决定。必须选择一个选项。
输出格式必须是JSON：
{{
    "choice": "选项ID",
    "confidence": 0.9,
    "reasoning": "投票理由..."
}}""",
            
            "consensus": """你是一位专业的{role}。

经过多轮协商，当前共识度为{consensus_level}%。

请评估当前方案是否可接受：
{{
    "acceptable": true/false,
    "final_stance": "同意/反对/有条件同意",
    "conditions": ["条件1", "条件2"],
    "confidence": 0.85
}}"""
        }
    
    async def analyze_vote(self, config: LLMConfig, vote_info: Dict) -> LLMResponse:
        """智能体分析投票"""
        start_time = time.time()
        
        try:
            # 构建提示词
            prompt = self._build_prompt("analysis", config, vote_info)
            
            # 调用LLM
            response = await self._call_llm(config, prompt)
            
            # 解析响应
            result = self._parse_json_response(response.content)
            
            latency = time.time() - start_time
            
            return LLMResponse(
                content=json.dumps(result),
                reasoning=result.get("reasoning", ""),
                confidence=result.get("confidence", 0.8),
                tokens_used=response.tokens_used,
                latency=latency
            )
            
        except Exception as e:
            logger.error(f"[LLM投票] 分析失败: {e}")
            return LLMResponse(
                content="",
                error=str(e),
                confidence=0.0,
                latency=time.time() - start_time
            )
    
    async def negotiate(self, config: LLMConfig, vote_info: Dict, 
                       previous_analysis: Dict, other_opinions: List[Dict]) -> LLMResponse:
        """智能体协商"""
        start_time = time.time()
        
        try:
            prompt = self._build_prompt("negotiation", config, vote_info, {
                "previous_analysis": json.dumps(previous_analysis, ensure_ascii=False),
                "other_opinions": json.dumps(other_opinions, ensure_ascii=False)
            })
            
            response = await self._call_llm(config, prompt)
            result = self._parse_json_response(response.content)
            
            latency = time.time() - start_time
            
            return LLMResponse(
                content=json.dumps(result),
                reasoning=result.get("opinion", ""),
                confidence=0.8 if result.get("willing_to_compromise") else 0.6,
                tokens_used=response.tokens_used,
                latency=latency
            )
            
        except Exception as e:
            logger.error(f"[LLM投票] 协商失败: {e}")
            return LLMResponse(
                content="",
                error=str(e),
                confidence=0.5,
                latency=time.time() - start_time
            )
    
    async def cast_vote(self, config: LLMConfig, vote_info: Dict,
                       analysis: Dict, negotiation_history: List[Dict]) -> LLMResponse:
        """智能体投票"""
        start_time = time.time()
        
        try:
            prompt = self._build_prompt("voting", config, vote_info, {
                "analysis": json.dumps(analysis, ensure_ascii=False),
                "negotiation_history": json.dumps(negotiation_history, ensure_ascii=False)
            })
            
            response = await self._call_llm(config, prompt)
            result = self._parse_json_response(response.content)
            
            latency = time.time() - start_time
            
            return LLMResponse(
                content=result.get("choice", ""),
                reasoning=result.get("reasoning", ""),
                confidence=result.get("confidence", 0.8),
                tokens_used=response.tokens_used,
                latency=latency
            )
            
        except Exception as e:
            logger.error(f"[LLM投票] 投票失败: {e}")
            return LLMResponse(
                content=vote_info.get("options", [{}])[0].get("id", ""),
                error=str(e),
                confidence=0.5,
                latency=time.time() - start_time
            )
    
    async def check_consensus(self, config: LLMConfig, vote_info: Dict,
                             consensus_level: float) -> LLMResponse:
        """检查共识"""
        start_time = time.time()
        
        try:
            prompt = self._build_prompt("consensus", config, vote_info, {
                "consensus_level": consensus_level
            })
            
            response = await self._call_llm(config, prompt)
            result = self._parse_json_response(response.content)
            
            latency = time.time() - start_time
            
            return LLMResponse(
                content=json.dumps(result),
                confidence=result.get("confidence", 0.8),
                tokens_used=response.tokens_used,
                latency=latency
            )
            
        except Exception as e:
            logger.error(f"[LLM投票] 共识检查失败: {e}")
            return LLMResponse(
                content='{"acceptable": false}',
                error=str(e),
                confidence=0.5,
                latency=time.time() - start_time
            )
    
    def _build_prompt(self, prompt_type: str, config: LLMConfig, 
                     vote_info: Dict, extra_vars: Dict = None) -> str:
        """构建提示词"""
        template = self._vote_prompts.get(prompt_type, "")
        
        # 格式化选项
        options_str = "\n".join([
            f"  - {opt.get('id')}: {opt.get('text', '')} ({opt.get('description', '')})"
            for opt in vote_info.get("options", [])
        ])
        
        variables = {
            "role": config.role,
            "expertise": ", ".join(config.expertise),
            "personality": config.personality,
            "title": vote_info.get("title", ""),
            "description": vote_info.get("description", ""),
            "options": options_str,
            **(extra_vars or {})
        }
        
        try:
            return template.format(**variables)
        except Exception as e:
            logger.error(f"[LLM投票] 提示词格式化失败: {e}")
            return template
    
    async def _call_llm(self, config: LLMConfig, prompt: str) -> LLMResponse:
        """调用LLM API"""
        provider = LLMProvider(config.provider)
        
        if provider == LLMProvider.EXTENSION:
            return await self._call_extension_proxy(config, prompt)
        elif provider == LLMProvider.DOUBAO:
            return await self._call_doubao(config, prompt)
        elif provider == LLMProvider.OPENAI:
            return await self._call_openai(config, prompt)
        elif provider == LLMProvider.ANTHROPIC:
            return await self._call_anthropic(config, prompt)
        elif provider == LLMProvider.QWEN:
            return await self._call_qwen(config, prompt)
        elif provider == LLMProvider.LOCAL:
            return await self._call_local(config, prompt)
        else:
            return await self._call_custom(config, prompt)
    
    async def _call_extension_proxy(self, config: LLMConfig, prompt: str) -> LLMResponse:
        """调用浏览器扩展代理
        
        浏览器扩展代理模式：
        1. 系统生成投票分析任务
        2. 任务通过WebSocket或API推送到浏览器扩展
        3. 扩展在浏览器端调用AI平台（如豆包、千问等）
        4. 扩展返回AI响应结果
        
        当前实现：返回模拟响应，实际应由扩展接管
        """
        logger.info(f"[LLM投票] 使用浏览器扩展代理模式: {config.role}")
        
        # 模拟扩展代理响应
        # 实际实现中，这里应该：
        # 1. 将任务推送到任务队列
        # 2. 等待浏览器扩展响应
        # 3. 返回扩展返回的AI结果
        
        await asyncio.sleep(1.0)  # 模拟扩展调用延迟
        
        # 生成模拟的专业分析响应
        import random
        options = ["yes", "no"]  # 默认选项
        
        # 基于角色生成不同的倾向
        role_preferences = {
            "架构专家": "yes",
            "性能专家": "yes", 
            "安全专家": "no",
            "成本专家": "no",
            "产品专家": "yes"
        }
        
        preference = role_preferences.get(config.role, random.choice(options))
        confidence = random.uniform(0.75, 0.95)
        
        # 生成专业分析理由
        reasoning_templates = {
            "架构专家": f"从系统架构角度分析，该方案具有良好的扩展性和可维护性。{config.personality[:50]}...",
            "性能专家": f"性能测试表明该方案响应时间满足要求，并发处理能力优秀。",
            "安全专家": f"安全风险评估显示存在潜在风险，建议加强防护措施。",
            "成本专家": f"成本效益分析显示ROI合理，资源利用率较高。",
            "产品专家": f"用户体验调研反馈良好，功能满足核心需求。"
        }
        
        reasoning = reasoning_templates.get(config.role, f"基于{config.role}的专业判断")
        
        result = {
            "scores": {preference: confidence, "other": 1 - confidence},
            "preference": preference,
            "confidence": confidence,
            "reasoning": reasoning
        }
        
        return LLMResponse(
            content=json.dumps(result, ensure_ascii=False),
            reasoning=reasoning,
            confidence=confidence,
            tokens_used=random.randint(500, 1500),
            latency=1.0
        )
    
    async def _call_doubao(self, config: LLMConfig, prompt: str) -> LLMResponse:
        """调用豆包API"""
        api_base = config.api_base or self.DEFAULT_CONFIGS[LLMProvider.DOUBAO]["api_base"]
        model = config.model or self.DEFAULT_CONFIGS[LLMProvider.DOUBAO]["model"]
        
        headers = {
            "Authorization": f"Bearer {config.api_key}",
            "Content-Type": "application/json"
        }
        
        payload = {
            "model": model,
            "messages": [
                {"role": "system", "content": f"你是一位专业的{config.role}。{config.personality}"},
                {"role": "user", "content": prompt}
            ],
            "temperature": config.temperature,
            "max_tokens": config.max_tokens
        }
        
        async with httpx.AsyncClient(timeout=config.timeout) as client:
            response = await client.post(
                f"{api_base}/chat/completions",
                headers=headers,
                json=payload
            )
            response.raise_for_status()
            data = response.json()
            
            return LLMResponse(
                content=data["choices"][0]["message"]["content"],
                tokens_used=data.get("usage", {}).get("total_tokens", 0)
            )
    
    async def _call_openai(self, config: LLMConfig, prompt: str) -> LLMResponse:
        """调用OpenAI API"""
        api_base = config.api_base or self.DEFAULT_CONFIGS[LLMProvider.OPENAI]["api_base"]
        model = config.model or self.DEFAULT_CONFIGS[LLMProvider.OPENAI]["model"]
        
        headers = {
            "Authorization": f"Bearer {config.api_key}",
            "Content-Type": "application/json"
        }
        
        payload = {
            "model": model,
            "messages": [
                {"role": "system", "content": f"You are a professional {config.role}. {config.personality}"},
                {"role": "user", "content": prompt}
            ],
            "temperature": config.temperature,
            "max_tokens": config.max_tokens
        }
        
        async with httpx.AsyncClient(timeout=config.timeout) as client:
            response = await client.post(
                f"{api_base}/chat/completions",
                headers=headers,
                json=payload
            )
            response.raise_for_status()
            data = response.json()
            
            return LLMResponse(
                content=data["choices"][0]["message"]["content"],
                tokens_used=data.get("usage", {}).get("total_tokens", 0)
            )
    
    async def _call_anthropic(self, config: LLMConfig, prompt: str) -> LLMResponse:
        """调用Claude API"""
        api_base = config.api_base or self.DEFAULT_CONFIGS[LLMProvider.ANTHROPIC]["api_base"]
        model = config.model or self.DEFAULT_CONFIGS[LLMProvider.ANTHROPIC]["model"]
        
        headers = {
            "x-api-key": config.api_key,
            "Content-Type": "application/json",
            "anthropic-version": "2023-06-01"
        }
        
        payload = {
            "model": model,
            "messages": [
                {"role": "user", "content": prompt}
            ],
            "max_tokens": config.max_tokens,
            "temperature": config.temperature,
            "system": f"You are a professional {config.role}. {config.personality}"
        }
        
        async with httpx.AsyncClient(timeout=config.timeout) as client:
            response = await client.post(
                f"{api_base}/messages",
                headers=headers,
                json=payload
            )
            response.raise_for_status()
            data = response.json()
            
            return LLMResponse(
                content=data["content"][0]["text"],
                tokens_used=data.get("usage", {}).get("input_tokens", 0) + 
                              data.get("usage", {}).get("output_tokens", 0)
            )
    
    async def _call_qwen(self, config: LLMConfig, prompt: str) -> LLMResponse:
        """调用通义千问API"""
        api_base = config.api_base or self.DEFAULT_CONFIGS[LLMProvider.QWEN]["api_base"]
        model = config.model or self.DEFAULT_CONFIGS[LLMProvider.QWEN]["model"]
        
        headers = {
            "Authorization": f"Bearer {config.api_key}",
            "Content-Type": "application/json"
        }
        
        payload = {
            "model": model,
            "input": {
                "messages": [
                    {"role": "system", "content": f"你是一位专业的{config.role}。{config.personality}"},
                    {"role": "user", "content": prompt}
                ]
            },
            "parameters": {
                "temperature": config.temperature,
                "max_tokens": config.max_tokens
            }
        }
        
        async with httpx.AsyncClient(timeout=config.timeout) as client:
            response = await client.post(
                f"{api_base}/services/aigc/text-generation/generation",
                headers=headers,
                json=payload
            )
            response.raise_for_status()
            data = response.json()
            
            return LLMResponse(
                content=data["output"]["text"],
                tokens_used=data.get("usage", {}).get("total_tokens", 0)
            )
    
    async def _call_local(self, config: LLMConfig, prompt: str) -> LLMResponse:
        """调用本地模型"""
        # 这里可以实现本地模型调用（如Ollama等）
        api_base = config.api_base or "http://localhost:11434"
        model = config.model or "llama2"
        
        payload = {
            "model": model,
            "prompt": prompt,
            "stream": False
        }
        
        async with httpx.AsyncClient(timeout=config.timeout) as client:
            response = await client.post(
                f"{api_base}/api/generate",
                json=payload
            )
            response.raise_for_status()
            data = response.json()
            
            return LLMResponse(
                content=data.get("response", ""),
                tokens_used=0
            )
    
    async def _call_custom(self, config: LLMConfig, prompt: str) -> LLMResponse:
        """调用自定义API"""
        # 通用OpenAI兼容格式
        headers = {
            "Authorization": f"Bearer {config.api_key}",
            "Content-Type": "application/json"
        }
        
        payload = {
            "model": config.model,
            "messages": [
                {"role": "system", "content": f"You are a professional {config.role}. {config.personality}"},
                {"role": "user", "content": prompt}
            ],
            "temperature": config.temperature,
            "max_tokens": config.max_tokens
        }
        
        async with httpx.AsyncClient(timeout=config.timeout) as client:
            response = await client.post(
                f"{config.api_base}/chat/completions",
                headers=headers,
                json=payload
            )
            response.raise_for_status()
            data = response.json()
            
            return LLMResponse(
                content=data["choices"][0]["message"]["content"],
                tokens_used=data.get("usage", {}).get("total_tokens", 0)
            )
    
    def _parse_json_response(self, content: str) -> Dict:
        """解析JSON响应"""
        try:
            # 尝试直接解析
            return json.loads(content)
        except json.JSONDecodeError:
            pass
        
        # 尝试从Markdown代码块中提取
        import re
        patterns = [
            r'```json\s*\n(.*?)\n```',
            r'```\s*\n(.*?)\n```',
            r'\{.*\}'
        ]
        
        for pattern in patterns:
            match = re.search(pattern, content, re.DOTALL)
            if match:
                try:
                    return json.loads(match.group(1) if pattern.startswith('`') else match.group(0))
                except:
                    pass
        
        # 返回默认值
        logger.warning(f"[LLM投票] 无法解析JSON响应: {content[:100]}...")
        return {
            "error": "无法解析响应",
            "raw_content": content[:500]
        }
    
    async def batch_analyze(self, configs: List[LLMConfig], vote_info: Dict) -> List[LLMResponse]:
        """批量分析 - 并行调用多个智能体"""
        tasks = [self.analyze_vote(config, vote_info) for config in configs]
        return await asyncio.gather(*tasks, return_exceptions=True)
    
    async def batch_vote(self, configs: List[LLMConfig], vote_info: Dict,
                        analyses: List[Dict], negotiations: List[List[Dict]]) -> List[LLMResponse]:
        """批量投票 - 并行调用多个智能体"""
        tasks = [
            self.cast_vote(config, vote_info, analysis, negotiation)
            for config, analysis, negotiation in zip(configs, analyses, negotiations)
        ]
        return await asyncio.gather(*tasks, return_exceptions=True)


# 全局实例
llm_voting_engine = LLMVotingEngine()


# 便捷函数
async def analyze_with_llm(provider: str, api_key: str, role: str, 
                          expertise: List[str], vote_info: Dict) -> LLMResponse:
    """使用指定LLM分析投票"""
    config = LLMConfig(
        provider=provider,
        api_key=api_key,
        role=role,
        expertise=expertise
    )
    return await llm_voting_engine.analyze_vote(config, vote_info)


async def vote_with_doubao(api_key: str, role: str, expertise: List[str], 
                          vote_info: Dict) -> LLMResponse:
    """使用豆包投票"""
    return await analyze_with_llm("doubao", api_key, role, expertise, vote_info)


async def vote_with_openai(api_key: str, role: str, expertise: List[str], 
                          vote_info: Dict) -> LLMResponse:
    """使用OpenAI投票"""
    return await analyze_with_llm("openai", api_key, role, expertise, vote_info)
