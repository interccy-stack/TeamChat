#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
AI投票系统 v5.2.2
TeamChat 子模块 - 纯智能体投票决策系统
支持外调智能体（豆包、OpenAI、Claude等）
"""

from .ai_voting_core import AIVotingSystem, VoteConfig, VoteStatus, VoteOption, AgentConfig, AIVote
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

__version__ = "5.2.2"
__all__ = [
    'AIVotingSystem', 'VoteConfig', 'VoteStatus', 'VoteOption', 
    'AgentConfig', 'AIVote', 'NegotiationEngine', 'ReportGenerator',
    'LLMVotingEngine', 'LLMConfig', 'LLMProvider'
]
