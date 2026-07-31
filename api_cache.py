#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
TeamChat API 缓存模块 v5.2.3
提供 API 响应缓存，减少重复计算
"""

import json
import hashlib
import time
import logging
import functools
from typing import Any, Optional, Callable
from dataclasses import dataclass
from threading import Lock

from database_pool import get_db_pool

logger = logging.getLogger("teamchat.api_cache")


@dataclass
class CacheConfig:
    """缓存配置"""
    ttl: int = 300  # 默认缓存5分钟
    max_size: int = 1000  # 最大缓存条目数
    enabled: bool = True


class APICache:
    """API 响应缓存"""
    
    def __init__(self, config: CacheConfig = None):
        self.config = config or CacheConfig()
        self._memory_cache = {}
        self._lock = Lock()
        self._hits = 0
        self._misses = 0
    
    def _generate_key(self, func_name: str, args: tuple, kwargs: dict) -> str:
        """生成缓存键"""
        # 序列化参数
        key_data = {
            'func': func_name,
            'args': args,
            'kwargs': kwargs
        }
        key_str = json.dumps(key_data, sort_keys=True, default=str)
        return hashlib.md5(key_str.encode()).hexdigest()
    
    def get(self, key: str) -> Optional[Any]:
        """获取缓存"""
        if not self.config.enabled:
            return None
        
        # 先查内存
        with self._lock:
            if key in self._memory_cache:
                entry = self._memory_cache[key]
                if entry['expires'] > time.time():
                    self._hits += 1
                    return entry['value']
                else:
                    # 过期删除
                    del self._memory_cache[key]
        
        # 再查数据库
        try:
            pool = get_db_pool()
            result = pool.execute(
                "SELECT value, expires_at FROM api_cache WHERE key = ? AND expires_at > ?",
                (key, time.time()),
                fetch=True
            )
            
            if result:
                value = json.loads(result[0]['value'])
                # 回填内存缓存
                self.set(key, value, ttl=int(result[0]['expires_at'] - time.time()))
                self._hits += 1
                return value
            
            self._misses += 1
            return None
            
        except Exception as e:
            logger.warning(f"[Cache] 数据库查询失败: {e}")
            self._misses += 1
            return None
    
    def set(self, key: str, value: Any, ttl: int = None):
        """设置缓存"""
        if not self.config.enabled:
            return
        
        ttl = ttl or self.config.ttl
        expires = time.time() + ttl
        
        # 内存缓存
        with self._lock:
            # 清理过期条目
            self._cleanup_expired()
            
            # 限制大小
            if len(self._memory_cache) >= self.config.max_size:
                # LRU: 删除最旧的
                oldest = min(self._memory_cache.keys(), 
                           key=lambda k: self._memory_cache[k]['created'])
                del self._memory_cache[oldest]
            
            self._memory_cache[key] = {
                'value': value,
                'expires': expires,
                'created': time.time()
            }
        
        # 数据库缓存（异步）
        try:
            pool = get_db_pool()
            pool.execute(
                """
                INSERT OR REPLACE INTO api_cache (key, value, expires_at, created_at)
                VALUES (?, ?, ?, ?)
                """,
                (key, json.dumps(value, default=str), expires, time.time())
            )
        except Exception as e:
            logger.warning(f"[Cache] 数据库写入失败: {e}")
    
    def delete(self, key: str):
        """删除缓存"""
        with self._lock:
            if key in self._memory_cache:
                del self._memory_cache[key]
        
        try:
            pool = get_db_pool()
            pool.execute("DELETE FROM api_cache WHERE key = ?", (key,))
        except Exception as e:
            logger.warning(f"[Cache] 删除失败: {e}")
    
    def clear(self):
        """清空缓存"""
        with self._lock:
            self._memory_cache.clear()
        
        try:
            pool = get_db_pool()
            pool.execute("DELETE FROM api_cache")
            logger.info("[Cache] 缓存已清空")
        except Exception as e:
            logger.warning(f"[Cache] 清空失败: {e}")
    
    def _cleanup_expired(self):
        """清理过期条目"""
        now = time.time()
        expired = [k for k, v in self._memory_cache.items() if v['expires'] <= now]
        for k in expired:
            del self._memory_cache[k]
    
    def get_stats(self) -> dict:
        """获取缓存统计"""
        total = self._hits + self._misses
        hit_rate = self._hits / total if total > 0 else 0
        
        return {
            'hits': self._hits,
            'misses': self._misses,
            'hit_rate': f"{hit_rate:.2%}",
            'memory_size': len(self._memory_cache),
            'enabled': self.config.enabled
        }


# 全局缓存实例
api_cache = APICache()


def cached(ttl: int = 300, key_func: Callable = None):
    """
    缓存装饰器
    
    用法:
        @cached(ttl=60)
        def get_user_info(user_id: str):
            return db.query(...)
    """
    def decorator(func: Callable) -> Callable:
        @functools.wraps(func)
        def wrapper(*args, **kwargs):
            # 生成缓存键
            if key_func:
                cache_key = key_func(*args, **kwargs)
            else:
                cache_key = api_cache._generate_key(func.__name__, args, kwargs)
            
            # 尝试获取缓存
            cached_value = api_cache.get(cache_key)
            if cached_value is not None:
                logger.debug(f"[Cache] 命中: {func.__name__}")
                return cached_value
            
            # 执行函数
            result = func(*args, **kwargs)
            
            # 缓存结果
            api_cache.set(cache_key, result, ttl)
            logger.debug(f"[Cache] 写入: {func.__name__}")
            
            return result
        
        # 添加清除缓存方法
        wrapper.clear_cache = lambda: api_cache.delete(
            api_cache._generate_key(func.__name__, (), {})
        )
        
        return wrapper
    return decorator


def cache_invalidate(pattern: str = None):
    """
    缓存失效装饰器
    
    用法:
        @cache_invalidate("user:*")
        def update_user(user_id: str):
            ...
    """
    def decorator(func: Callable) -> Callable:
        @functools.wraps(func)
        def wrapper(*args, **kwargs):
            result = func(*args, **kwargs)
            
            # 清除匹配的缓存
            if pattern:
                # TODO: 实现模式匹配清除
                pass
            
            return result
        return wrapper
    return decorator


# 便捷函数
def get_cache_stats() -> dict:
    """获取缓存统计"""
    return api_cache.get_stats()


def clear_all_cache():
    """清空所有缓存"""
    api_cache.clear()


if __name__ == "__main__":
    # 测试
    @cached(ttl=5)
    def expensive_computation(n: int):
        time.sleep(1)
        return n * n
    
    # 第一次调用（慢）
    print("第一次调用...")
    print(expensive_computation(10))
    
    # 第二次调用（快，从缓存）
    print("第二次调用（应该很快）...")
    print(expensive_computation(10))
    
    # 查看统计
    print("缓存统计:", get_cache_stats())
