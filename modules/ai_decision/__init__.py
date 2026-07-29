#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
AI决策系统 v5.3.0
独立插件 - 纯智能体投票决策系统
内置多AI并发查询引擎（全提问/AIChatProxy）
"""

from .ai_decision_core import AIVotingSystem, VoteConfig, VoteStatus, VoteOption, AgentConfig, AIVote
from .negotiation_engine import NegotiationEngine
try:
    from .report_generator import ReportGenerator
except ImportError:
    ReportGenerator = None
try:
    from .llm_engine import LLMVotingEngine, LLMConfig, LLMProvider
except ImportError:
    LLMVotingEngine = None
    LLMConfig = None
    LLMProvider = None

__version__ = "5.3.0"
__all__ = [
    'AIVotingSystem', 'VoteConfig', 'VoteStatus', 'VoteOption', 
    'AgentConfig', 'AIVote', 'NegotiationEngine', 'ReportGenerator',
    'LLMVotingEngine', 'LLMConfig', 'LLMProvider'
]