# -*- coding: utf-8 -*-
"""
AI决策 LLM 集成模块 v1.0.0
内置多AI并发查询引擎（全提问/AIChatProxy）

支持平台：
- 豆包 (Doubao) - 字节跳动
- DeepSeek - 深度求索
- 通义千问 (Qwen) - 阿里云
- Kimi (月之暗面) - Moonshot
- 元宝 (Yuanbao) - 腾讯
- ChatGPT - OpenAI
- Claude - Anthropic
- Gemini - Google
- 智谱清言 (GLM) - 智谱AI
- 本地模型 (Ollama等)

功能：
- 多智能体并发API调用
- 自动选择最佳响应
- 投票分析和推理
- 置信度计算
- 协商对话
"""

import json
import logging
import asyncio
import httpx
import time
import re
from typing import Dict, List, Optional, Any, Tuple
from dataclasses import dataclass, field
from enum import Enum

logger = logging.getLogger("qwenpaw.ai_decision.llm")


class LLMProvider(Enum):
    """LLM提供商"""
    DOUBAO = "doubao"          # 豆包
    DEEPSEEK = "deepseek"      # DeepSeek
    QWEN = "qwen"              # 通义千问
    KIMI = "kimi"              # Kimi
    YUANBAO = "yuanbao"        # 元宝
    OPENAI = "openai"          # OpenAI
    ANTHROPIC = "anthropic"    # Claude
    GEMINI = "gemini"          # Google Gemini
    GLM = "glm"                # 智谱清言
    LOCAL = "local"            # 本地模型
    CUSTOM = "custom"          # 自定义


@dataclass
class LLMConfig:
    """LLM配置"""
    provider: str
    model: str = ""
    api_key: str = ""
    api_base: str = ""
    temperature: float = 0.7
    max_tokens: int = 2000
    timeout: int = 30
    
    # 智能体角色设定
    role: str = ""
    expertise: List[str] = field(default_factory=list)
    personality: str = ""


@dataclass
class LLMResponse:
    """LLM响应"""
    content: str
    reasoning: str = ""
    confidence: float = 0.8
    tokens_used: int = 0
    latency: float = 0.0
    provider: str = ""
    error: str = ""


@dataclass
class MultiAIResult:
    """多AI并发查询结果"""
    query: str
    responses: List[LLMResponse]
    best_response: Optional[LLMResponse] = None
    total_latency: float = 0.0
    consensus_level: float = 0.0


class MultiAIQueryEngine:
    """多AI并发查询引擎（全提问内置版）
    
    同时向多个AI平台发送相同问题，收集所有响应后综合分析，
    自动识别最佳答案，计算共识度。
    """
    
    # 各平台默认配置
    PROVIDER_CONFIGS = {
        LLMProvider.DOUBAO: {
            "name": "豆包",
            "api_base": "https://ark.cn-beijing.volces.com/api/v3",
            "default_model": "doubao-pro-128k",
            "api_format": "openai_compatible",
            "description": "字节跳动AI助手"
        },
        LLMProvider.DEEPSEEK: {
            "name": "DeepSeek",
            "api_base": "https://api.deepseek.com/v1",
            "default_model": "deepseek-chat",
            "api_format": "openai_compatible",
            "description": "深度求索AI"
        },
        LLMProvider.QWEN: {
            "name": "通义千问",
            "api_base": "https://dashscope.aliyuncs.com/compatible-mode/v1",
            "default_model": "qwen-max",
            "api_format": "openai_compatible",
            "description": "阿里云AI助手"
        },
        LLMProvider.KIMI: {
            "name": "Kimi",
            "api_base": "https://api.moonshot.cn/v1",
            "default_model": "moonshot-v1-8k",
            "api_format": "openai_compatible",
            "description": "月之暗面AI助手"
        },
        LLMProvider.YUANBAO: {
            "name": "元宝",
            "api_base": "https://api.yuanbao.tencent.com/v1",
            "default_model": "yuanbao-pro",
            "api_format": "openai_compatible",
            "description": "腾讯AI助手"
        },
        LLMProvider.OPENAI: {
            "name": "ChatGPT",
            "api_base": "https://api.openai.com/v1",
            "default_model": "gpt-4o",
            "api_format": "openai",
            "description": "OpenAI GPT"
        },
        LLMProvider.ANTHROPIC: {
            "name": "Claude",
            "api_base": "https://api.anthropic.com/v1",
            "default_model": "claude-3-5-sonnet-20241022",
            "api_format": "anthropic",
            "description": "Anthropic Claude"
        },
        LLMProvider.GEMINI: {
            "name": "Gemini",
            "api_base": "https://generativelanguage.googleapis.com/v1beta",
            "default_model": "gemini-pro",
            "api_format": "gemini",
            "description": "Google Gemini"
        },
        LLMProvider.GLM: {
            "name": "智谱清言",
            "api_base": "https://open.bigmodel.cn/api/paas/v4",
            "default_model": "glm-4",
            "api_format": "openai_compatible",
            "description": "智谱AI助手"
        }
    }
    
    def __init__(self):
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
    
    async def query_all(self, question: str, configs: List[LLMConfig], 
                       system_prompt: str = "") -> MultiAIResult:
        """并发查询所有AI平台
        
        Args:
            question: 查询问题
            configs: 各平台配置列表
            system_prompt: 系统提示词
        
        Returns:
            MultiAIResult: 多AI查询结果
        """
        start_time = time.time()
        
        # 并发调用所有平台
        tasks = [self._query_single(config, question, system_prompt) for config in configs]
        responses = await asyncio.gather(*tasks, return_exceptions=True)
        
        # 处理异常
        cleaned_responses = []
        for config, resp in zip(configs, responses):
            if isinstance(resp, Exception):
                logger.error(f"[多AI查询] {config.provider} 失败: {resp}")
                cleaned_responses.append(LLMResponse(
                    content="",
                    error=str(resp),
                    provider=config.provider
                ))
            else:
                resp.provider = config.provider
                cleaned_responses.append(resp)
        
        # 分析最佳响应
        best_response = self._select_best_response(cleaned_responses)
        consensus = self._calculate_consensus(cleaned_responses)
        
        total_latency = time.time() - start_time
        
        return MultiAIResult(
            query=question,
            responses=cleaned_responses,
            best_response=best_response,
            total_latency=total_latency,
            consensus_level=consensus
        )
    
    async def _query_single(self, config: LLMConfig, question: str, 
                           system_prompt: str = "") -> LLMResponse:
        """查询单个AI平台"""
        start_time = time.time()
        provider = LLMProvider(config.provider)
        
        try:
            if provider == LLMProvider.DOUBAO:
                result = await self._call_openai_compatible(config, question, system_prompt)
            elif provider == LLMProvider.DEEPSEEK:
                result = await self._call_openai_compatible(config, question, system_prompt)
            elif provider == LLMProvider.QWEN:
                result = await self._call_openai_compatible(config, question, system_prompt)
            elif provider == LLMProvider.KIMI:
                result = await self._call_openai_compatible(config, question, system_prompt)
            elif provider == LLMProvider.YUANBAO:
                result = await self._call_openai_compatible(config, question, system_prompt)
            elif provider == LLMProvider.OPENAI:
                result = await self._call_openai_compatible(config, question, system_prompt)
            elif provider == LLMProvider.ANTHROPIC:
                result = await self._call_anthropic(config, question, system_prompt)
            elif provider == LLMProvider.GEMINI:
                result = await self._call_gemini(config, question, system_prompt)
            elif provider == LLMProvider.GLM:
                result = await self._call_openai_compatible(config, question, system_prompt)
            elif provider == LLMProvider.LOCAL:
                result = await self._call_local(config, question, system_prompt)
            else:
                result = await self._call_openai_compatible(config, question, system_prompt)
            
            result.latency = time.time() - start_time
            return result
            
        except Exception as e:
            logger.error(f"[多AI查询] {config.provider} 调用失败: {e}")
            return LLMResponse(
                content="",
                error=str(e),
                provider=config.provider,
                latency=time.time() - start_time
            )
    
    async def _call_openai_compatible(self, config: LLMConfig, question: str, 
                                     system_prompt: str = "") -> LLMResponse:
        """调用OpenAI兼容API（豆包/DeepSeek/千问/Kimi/元宝/智谱等）"""
        provider_config = self.PROVIDER_CONFIGS.get(LLMProvider(config.provider), {})
        api_base = config.api_base or provider_config.get("api_base", "")
        model = config.model or provider_config.get("default_model", "")
        
        headers = {
            "Authorization": f"Bearer {config.api_key}",
            "Content-Type": "application/json"
        }
        
        messages = []
        if system_prompt or config.personality:
            messages.append({
                "role": "system",
                "content": system_prompt or f"你是一位专业的{config.role}。{config.personality}"
            })
        messages.append({"role": "user", "content": question})
        
        payload = {
            "model": model,
            "messages": messages,
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
            
            content = data["choices"][0]["message"]["content"]
            tokens = data.get("usage", {}).get("total_tokens", 0)
            
            return LLMResponse(
                content=content,
                tokens_used=tokens
            )
    
    async def _call_anthropic(self, config: LLMConfig, question: str,
                             system_prompt: str = "") -> LLMResponse:
        """调用Claude API"""
        provider_config = self.PROVIDER_CONFIGS.get(LLMProvider.ANTHROPIC, {})
        api_base = config.api_base or provider_config.get("api_base", "")
        model = config.model or provider_config.get("default_model", "")
        
        headers = {
            "x-api-key": config.api_key,
            "Content-Type": "application/json",
            "anthropic-version": "2023-06-01"
        }
        
        payload = {
            "model": model,
            "messages": [{"role": "user", "content": question}],
            "max_tokens": config.max_tokens,
            "temperature": config.temperature,
            "system": system_prompt or f"你是一位专业的{config.role}。{config.personality}"
        }
        
        async with httpx.AsyncClient(timeout=config.timeout) as client:
            response = await client.post(
                f"{api_base}/messages",
                headers=headers,
                json=payload
            )
            response.raise_for_status()
            data = response.json()
            
            content = data["content"][0]["text"]
            tokens = (data.get("usage", {}).get("input_tokens", 0) + 
                     data.get("usage", {}).get("output_tokens", 0))
            
            return LLMResponse(content=content, tokens_used=tokens)
    
    async def _call_gemini(self, config: LLMConfig, question: str,
                          system_prompt: str = "") -> LLMResponse:
        """调用Gemini API"""
        provider_config = self.PROVIDER_CONFIGS.get(LLMProvider.GEMINI, {})
        api_base = config.api_base or provider_config.get("api_base", "")
        model = config.model or provider_config.get("default_model", "")
        
        full_prompt = question
        if system_prompt:
            full_prompt = f"{system_prompt}\n\n{question}"
        
        payload = {
            "contents": [{"parts": [{"text": full_prompt}]}],
            "generationConfig": {
                "temperature": config.temperature,
                "maxOutputTokens": config.max_tokens
            }
        }
        
        url = f"{api_base}/models/{model}:generateContent?key={config.api_key}"
        
        async with httpx.AsyncClient(timeout=config.timeout) as client:
            response = await client.post(url, json=payload)
            response.raise_for_status()
            data = response.json()
            
            content = data["candidates"][0]["content"]["parts"][0]["text"]
            tokens = data.get("usageMetadata", {}).get("totalTokenCount", 0)
            
            return LLMResponse(content=content, tokens_used=tokens)
    
    async def _call_local(self, config: LLMConfig, question: str,
                         system_prompt: str = "") -> LLMResponse:
        """调用本地模型（Ollama等）"""
        api_base = config.api_base or "http://localhost:11434"
        model = config.model or "llama2"
        
        full_prompt = question
        if system_prompt:
            full_prompt = f"{system_prompt}\n\n{question}"
        
        payload = {
            "model": model,
            "prompt": full_prompt,
            "stream": False,
            "options": {
                "temperature": config.temperature,
                "num_predict": config.max_tokens
            }
        }
        
        async with httpx.AsyncClient(timeout=config.timeout) as client:
            response = await client.post(f"{api_base}/api/generate", json=payload)
            response.raise_for_status()
            data = response.json()
            
            return LLMResponse(
                content=data.get("response", ""),
                tokens_used=data.get("eval_count", 0)
            )
    
    def _select_best_response(self, responses: List[LLMResponse]) -> Optional[LLMResponse]:
        """从多个AI响应中选择最佳答案
        
        选择策略：
        1. 优先选择有内容的响应
        2. 选择内容最长的（通常最详细）
        3. 排除明显错误的响应
        """
        valid_responses = [r for r in responses if r.content and not r.error]
        
        if not valid_responses:
            return None
        
        # 按内容长度排序（更长通常更详细）
        valid_responses.sort(key=lambda r: len(r.content), reverse=True)
        
        return valid_responses[0]
    
    def _calculate_consensus(self, responses: List[LLMResponse]) -> float:
        """计算多AI响应之间的共识度
        
        基于：
        1. 有效响应比例
        2. 响应内容相似度（简化版）
        """
        valid_count = len([r for r in responses if r.content and not r.error])
        total_count = len(responses)
        
        if total_count == 0:
            return 0.0
        
        # 有效响应比例
        validity_ratio = valid_count / total_count
        
        # 内容相似度（简化版：比较关键结论）
        if valid_count >= 2:
            valid_responses = [r for r in responses if r.content and not r.error]
            # 简单共识：检查是否有共同的关键词
            all_texts = [r.content for r in valid_responses]
            common_words = self._find_common_keywords(all_texts)
            similarity = len(common_words) / max(10, min(len(t.split()) for t in all_texts)) if all_texts else 0
        else:
            similarity = 0.5  # 仅一个有效响应时默认
        
        return (validity_ratio * 0.6 + similarity * 0.4)
    
    def _find_common_keywords(self, texts: List[str]) -> List[str]:
        """找出多个文本中的共同关键词"""
        if not texts or len(texts) < 2:
            return []
        
        # 简单分词
        word_sets = []
        for text in texts:
            # 提取中文词和英文词
            words = re.findall(r'[\u4e00-\u9fff]{2,}|[a-zA-Z]{3,}', text.lower())
            word_sets.append(set(words))
        
        # 找交集
        common = word_sets[0]
        for ws in word_sets[1:]:
            common = common & ws
        
        return list(common)
    
    def get_supported_providers(self) -> List[Dict]:
        """获取支持的AI平台列表"""
        return [
            {
                "id": p.value,
                "name": cfg["name"],
                "description": cfg["description"],
                "default_model": cfg["default_model"],
                "api_format": cfg["api_format"]
            }
            for p, cfg in self.PROVIDER_CONFIGS.items()
        ]


class LLMVotingEngine:
    """LLM投票引擎 - 支持多AI并发查询"""
    
    def __init__(self):
        self._multi_ai = MultiAIQueryEngine()
    
    def _build_prompt(self, prompt_type: str, config: LLMConfig, 
                     vote_info: Dict, extra_vars: Dict = None) -> str:
        """构建提示词"""
        template = self._multi_ai._vote_prompts.get(prompt_type, "")
        
        options_str = "\n".join([
            f"  - {opt.get('id')}: {opt.get('text', opt.get('label', ''))} ({opt.get('description', '')})"
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
    
    async def analyze_vote(self, config: LLMConfig, vote_info: Dict) -> LLMResponse:
        """智能体分析投票"""
        try:
            prompt = self._build_prompt("analysis", config, vote_info)
            system_prompt = f"你是{config.role}。{config.personality}"
            return await self._multi_ai._query_single(config, prompt, system_prompt)
        except Exception as e:
            logger.error(f"[LLM投票] 分析失败: {e}")
            return LLMResponse(content="", error=str(e), confidence=0.0)
    
    async def multi_analyze(self, configs: List[LLMConfig], vote_info: Dict) -> MultiAIResult:
        """多AI并发分析 - 使用内置全提问引擎"""
        prompt = self._build_prompt("analysis", configs[0] if configs else LLMConfig(provider=""), vote_info)
        return await self._multi_ai.query_all(
            question=prompt,
            configs=configs,
            system_prompt=f"你是一位专业的投票分析专家。请客观分析所有选项。"
        )
    
    async def negotiate(self, config: LLMConfig, vote_info: Dict,
                       previous_analysis: Dict, other_opinions: List[Dict]) -> LLMResponse:
        """智能体协商"""
        try:
            prompt = self._build_prompt("negotiation", config, vote_info, {
                "previous_analysis": json.dumps(previous_analysis, ensure_ascii=False),
                "other_opinions": json.dumps(other_opinions, ensure_ascii=False)
            })
            return await self._multi_ai._query_single(config, prompt)
        except Exception as e:
            logger.error(f"[LLM投票] 协商失败: {e}")
            return LLMResponse(content="", error=str(e), confidence=0.5)
    
    async def cast_vote(self, config: LLMConfig, vote_info: Dict,
                       analysis: Dict, negotiation_history: List[Dict]) -> LLMResponse:
        """智能体投票"""
        try:
            prompt = self._build_prompt("voting", config, vote_info, {
                "analysis": json.dumps(analysis, ensure_ascii=False),
                "negotiation_history": json.dumps(negotiation_history, ensure_ascii=False)
            })
            return await self._multi_ai._query_single(config, prompt)
        except Exception as e:
            logger.error(f"[LLM投票] 投票失败: {e}")
            return LLMResponse(
                content=vote_info.get("options", [{}])[0].get("id", ""),
                error=str(e),
                confidence=0.5
            )
    
    async def check_consensus(self, config: LLMConfig, vote_info: Dict,
                             consensus_level: float) -> LLMResponse:
        """检查共识"""
        try:
            prompt = self._build_prompt("consensus", config, vote_info, {
                "consensus_level": consensus_level
            })
            return await self._multi_ai._query_single(config, prompt)
        except Exception as e:
            logger.error(f"[LLM投票] 共识检查失败: {e}")
            return LLMResponse(content='{"acceptable": false}', error=str(e), confidence=0.5)
    
    def _parse_json_response(self, content: str) -> Dict:
        """解析JSON响应"""
        try:
            return json.loads(content)
        except json.JSONDecodeError:
            pass
        
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
        
        logger.warning(f"[LLM投票] 无法解析JSON响应: {content[:100]}...")
        return {"error": "无法解析响应", "raw_content": content[:500]}
    
    def get_providers(self) -> List[Dict]:
        """获取支持的AI平台列表"""
        return self._multi_ai.get_supported_providers()
    
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
multi_ai_engine = MultiAIQueryEngine()


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


async def query_all_platforms(question: str, configs: List[LLMConfig]) -> MultiAIResult:
    """并发查询所有AI平台"""
    return await multi_ai_engine.query_all(question, configs)


# ============================================================
# QwenPaw 提供商桥接层 v1.1.1
# 利用 QwenPaw 已配置的 API Key（SiliconFlow/DashScope等）
# 无需用户单独配置，直接调用真实 AI
# ============================================================

# 智能体角色 → 模型映射（通过 SiliconFlow 聚合平台路由到不同模型）
QWENPAW_AGENT_MODEL_MAP = {
    "架构专家": {"provider": "siliconflow-cn", "model": "deepseek-ai/DeepSeek-V3"},
    "成本专家": {"provider": "siliconflow-cn", "model": "Qwen/Qwen3.5-122B-A10B"},
    "运维专家": {"provider": "siliconflow-cn", "model": "deepseek-ai/DeepSeek-V3"},
    "安全专家": {"provider": "siliconflow-cn", "model": "deepseek-ai/DeepSeek-R1"},
    "性能专家": {"provider": "siliconflow-cn", "model": "deepseek-ai/DeepSeek-V3"},
    "产品专家": {"provider": "siliconflow-cn", "model": "Qwen/Qwen3.5-122B-A10B"},
    "前端专家": {"provider": "siliconflow-cn", "model": "deepseek-ai/DeepSeek-V3"},
    "后端专家": {"provider": "siliconflow-cn", "model": "deepseek-ai/DeepSeek-V3"},
    
    # 角色关键词映射（模糊匹配）
    "架构": {"provider": "siliconflow-cn", "model": "deepseek-ai/DeepSeek-V3"},
    "成本": {"provider": "siliconflow-cn", "model": "Qwen/Qwen3.5-122B-A10B"},
    "运维": {"provider": "siliconflow-cn", "model": "deepseek-ai/DeepSeek-V3"},
    "安全": {"provider": "siliconflow-cn", "model": "deepseek-ai/DeepSeek-R1"},
    "性能": {"provider": "siliconflow-cn", "model": "deepseek-ai/DeepSeek-V3"},
    "产品": {"provider": "siliconflow-cn", "model": "Qwen/Qwen3.5-122B-A10B"},
    "前端": {"provider": "siliconflow-cn", "model": "deepseek-ai/DeepSeek-V3"},
    "后端": {"provider": "siliconflow-cn", "model": "deepseek-ai/DeepSeek-V3"},
    "默认": {"provider": "siliconflow-cn", "model": "deepseek-ai/DeepSeek-V3"},
}


class QwenPawProviderBridge:
    """QwenPaw 提供商桥接层 - 利用 QwenPaw 已配 API Key 调用真实 AI
    
    无需用户提供 API Key，直接使用 QwenPaw 系统已配置的模型提供商。
    当前支持：SiliconFlow（聚合 DeepSeek/Qwen 等模型）
    """
    
    def __init__(self):
        self._available = False
        self._pm = None
        self._init_provider_manager()
    
    def _init_provider_manager(self):
        """初始化 ProviderManager"""
        try:
            from qwenpaw.providers import ProviderManager
            self._pm = ProviderManager()
            self._available = True
            logger.info("[QwenPaw桥接] ProviderManager 初始化成功")
        except Exception as e:
            logger.warning(f"[QwenPaw桥接] ProviderManager 不可用: {e}")
            self._available = False
    
    @property
    def available(self) -> bool:
        return self._available
    
    def _resolve_model(self, role: str) -> dict:
        """根据智能体角色解析模型配置"""
        # 精确匹配
        if role in QWENPAW_AGENT_MODEL_MAP:
            return QWENPAW_AGENT_MODEL_MAP[role]
        
        # 模糊匹配（关键词）
        for keyword, config in QWENPAW_AGENT_MODEL_MAP.items():
            if keyword in role:
                return config
        
        return QWENPAW_AGENT_MODEL_MAP["默认"]
    
    async def analyze(self, role: str, expertise: List[str], 
                     vote_info: Dict) -> LLMResponse:
        """通过 QwenPaw 本地智能体API进行智能体分析
        
        优先调用本地配置的智能体，而不是外部LLM API
        """
        import httpx
        import os
        
        start_time = time.time()
        
        try:
            # 构建提示词
            prompt = self._build_analysis_prompt(role, expertise, vote_info)
            
            # 获取QwenPaw API地址
            qp_api_base = os.environ.get("QWENPAW_API_URL", "http://127.0.0.1:8088")
            
            # 查找可用的智能体
            agent_id = None
            agent_name = None
            try:
                async with httpx.AsyncClient(timeout=5.0) as client:
                    resp = await client.get(f"{qp_api_base}/api/agents")
                    if resp.status_code == 200:
                        agents = resp.json().get("agents", [])
                        logger.info(f"[QwenPaw桥接] 找到 {len(agents)} 个智能体")
                        
                        # 策略1: 尝试匹配角色名称（如CloudPaw-Master匹配cloud-orchestrator）
                        role_lower = role.lower().replace(" ", "-").replace("_", "-")
                        for agent in agents:
                            agent_id_check = agent.get("id", "").lower()
                            agent_name_check = agent.get("name", "").lower()
                            if role_lower in agent_id_check or role_lower in agent_name_check:
                                agent_id = agent.get("id")
                                agent_name = agent.get("name")
                                logger.info(f"[QwenPaw桥接] 角色匹配成功: {role} -> {agent_name} ({agent_id})")
                                break
                        
                        # 策略2: 如果没找到，使用第一个可用智能体（通常是主控）
                        if not agent_id and agents:
                            agent_id = agents[0].get("id")
                            agent_name = agents[0].get("name")
                            logger.info(f"[QwenPaw桥接] 使用默认智能体: {agent_name} ({agent_id})")
            except Exception as e:
                logger.warning(f"[QwenPaw桥接] 查找智能体失败: {e}")
            
            if not agent_id:
                logger.warning(f"[QwenPaw桥接] 未找到可用智能体，回退到ProviderManager")
                return await self._analyze_via_provider(role, expertise, vote_info, start_time)
            
            # 调用本地智能体API - 使用正确的 QwenPaw 2.0 API
            logger.info(f"[QwenPaw桥接] 调用本地智能体: {agent_name} ({agent_id})")
            
            # 生成唯一session_id
            session_id = f"ai_decision_{agent_id}_{int(time.time() * 1000)}"
            
            async with httpx.AsyncClient(timeout=120.0) as client:
                # QwenPaw 2.0 /api/console/chat 使用 input 格式
                payload = {
                    "input": [{"role": "user", "content": [{"type": "text", "text": prompt}]}],
                    "channel": "console",
                    "session_id": session_id,
                }
                
                resp = await client.post(
                    f"{qp_api_base}/api/console/chat",
                    json=payload,
                    headers={
                        "Content-Type": "application/json",
                        "X-Agent-Id": agent_id,
                    }
                )
                resp.raise_for_status()
                
                # 处理流式响应
                content = ""
                async for line in resp.aiter_lines():
                    if line.startswith("data: "):
                        try:
                            data = json.loads(line[6:])
                            chunk_content = data.get("content", "") or data.get("delta_text", "")
                            if chunk_content:
                                if isinstance(chunk_content, list):
                                    for item in chunk_content:
                                        text_val = item.get("text", "") if isinstance(item, dict) else str(item)
                                        content += text_val
                                else:
                                    content += str(chunk_content)
                        except json.JSONDecodeError:
                            continue
                
                latency = time.time() - start_time
                
                logger.info(f"[QwenPaw桥接] 智能体 {agent_name} 响应成功，长度: {len(content)}")
                
                # 解析 JSON 响应
                parsed = self._parse_json_response(content)
                
                return LLMResponse(
                    content=content,
                    confidence=parsed.get("confidence", 0.8),
                    tokens_used=0,  # QwenPaw不返回token使用量
                    latency=latency,
                    provider=f"local_agent:{agent_id}"
                )
                
        except Exception as e:
            logger.warning(f"[QwenPaw桥接] 本地智能体调用失败，回退到ProviderManager: {e}")
            return await self._analyze_via_provider(role, expertise, vote_info, start_time)
    
    async def _analyze_via_provider(self, role: str, expertise: List[str], 
                                    vote_info: Dict, start_time: float) -> LLMResponse:
        """通过ProviderManager调用外部LLM（回退方案）"""
        if not self._available:
            return LLMResponse(
                content="", 
                error="QwenPaw ProviderManager 不可用",
                provider="qwenpaw_bridge"
            )
        
        model_cfg = self._resolve_model(role)
        
        try:
            prompt = self._build_analysis_prompt(role, expertise, vote_info)
            
            provider = self._pm.get_provider(model_cfg["provider"])
            if not provider:
                return LLMResponse(
                    content="",
                    error=f"提供商不可用: {model_cfg['provider']}",
                    provider="qwenpaw_bridge"
                )
            
            chat_model = provider.get_chat_model_instance(model_cfg["model"])
            
            from agentscope.message import Msg, TextBlock
            msgs = [
                Msg(role="system", content=[TextBlock(
                    text=f"你是{role}。请严格按JSON格式输出分析结果。"
                )], name="system"),
                Msg(role="user", content=[TextBlock(text=prompt)], name="user"),
            ]
            
            result = await chat_model(msgs)
            
            content = ""
            if hasattr(result, '__aiter__'):
                async for chunk in result:
                    if isinstance(chunk, dict) and 'content' in chunk:
                        content += chunk['content']
                    elif hasattr(chunk, 'text'):
                        content += chunk.text
                    elif hasattr(chunk, 'content'):
                        content += str(chunk.content)
                    else:
                        content += str(chunk)
            elif hasattr(result, 'get_text_content'):
                content = result.get_text_content()
            else:
                content = str(result)
            
            latency = time.time() - start_time
            parsed = self._parse_json_response(content)
            
            return LLMResponse(
                content=content,
                confidence=parsed.get("confidence", 0.8),
                tokens_used=0,
                latency=latency,
                provider=f"qwenpaw:{model_cfg['provider']}:{model_cfg['model']}"
            )
            
        except Exception as e:
            logger.error(f"[QwenPaw桥接] ProviderManager分析失败 ({role}): {e}")
            return LLMResponse(
                content="",
                error=str(e),
                provider="qwenpaw_bridge",
                latency=time.time() - start_time
            )
    
    def _build_analysis_prompt(self, role: str, expertise: List[str], 
                               vote_info: Dict) -> str:
        """构建分析提示词 - 优化版，更适合QwenPaw智能体"""
        options_str = "\n".join([
            f"  - {opt.get('id', f'opt{i+1}')}: {opt.get('text', opt.get('label', ''))}"
            for i, opt in enumerate(vote_info.get("options", []))
        ])
        
        # 获取选项ID列表用于示例
        option_ids = [opt.get('id', f'opt{i+1}') for i, opt in enumerate(vote_info.get("options", []))]
        example_scores = ', '.join([f'"{oid}": 0.{80+i*5}' for i, oid in enumerate(option_ids[:2])])
        
        return f"""请以专业{role}的身份，对以下议题进行分析和投票。

【议题】
{vote_info.get('title', '')}

【选项】
{options_str}

【你的任务】
1. 分析每个选项的优缺点
2. 给每个选项打分（0.0-1.0）
3. 选择你最倾向的选项
4. 说明理由

【输出格式】
必须返回严格的JSON，不要包含markdown代码块：
{{
    "scores": {{{example_scores}}},
    "preference": "{option_ids[0] if option_ids else 'yes'}",
    "confidence": 0.85,
    "reasoning": "基于专业分析，给出选择理由"
}}"""
    
    def _parse_json_response(self, content: str) -> Dict:
        """解析 JSON 响应 - 增强容错"""
        content = content.strip()
        
        # 尝试直接解析
        try:
            return json.loads(content)
        except json.JSONDecodeError:
            pass
        
        # 尝试提取JSON代码块
        patterns = [
            r'```json\s*\n(.*?)\n```',
            r'```\s*\n(.*?)\n```',
            r'```(.*?)```',
        ]
        
        for pattern in patterns:
            match = re.search(pattern, content, re.DOTALL)
            if match:
                try:
                    extracted = match.group(1).strip()
                    return json.loads(extracted)
                except:
                    pass
        
        # 尝试查找第一个{和最后一个}之间的内容
        try:
            start = content.find('{')
            end = content.rfind('}')
            if start != -1 and end != -1 and end > start:
                return json.loads(content[start:end+1])
        except:
            pass
        
        # 尝试修复常见的JSON格式问题
        try:
            # 移除可能的BOM标记
            content_clean = content.encode('utf-8').decode('utf-8-sig')
            # 替换单引号为双引号
            content_clean = content_clean.replace("'", '"')
            return json.loads(content_clean)
        except:
            pass
        
        logger.warning(f"[QwenPaw桥接] 无法解析JSON响应，返回原始内容")
        return {
            "error": "无法解析JSON",
            "raw_content": content[:500],
            "scores": {},
            "preference": "",
            "confidence": 0.5,
            "reasoning": content[:200] if content else "解析失败"
        }


# 全局桥接实例
qp_bridge = QwenPawProviderBridge()