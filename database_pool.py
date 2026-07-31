#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
TeamChat 数据库连接池 v5.2.3
优化 SQLite 数据库访问性能
"""

import sqlite3
import threading
import queue
import time
import logging
from contextlib import contextmanager
from pathlib import Path

logger = logging.getLogger("teamchat.database_pool")


class ConnectionPool:
    """SQLite 连接池"""
    
    def __init__(self, db_path: str, pool_size: int = 5, timeout: int = 30):
        self.db_path = db_path
        self.pool_size = pool_size
        self.timeout = timeout
        
        # 连接池队列
        self._pool = queue.Queue(maxsize=pool_size)
        self._lock = threading.Lock()
        self._active_connections = 0
        self._max_connections = pool_size
        
        # 初始化连接池
        self._init_pool()
        
        logger.info(f"[DB Pool] 连接池已创建: {db_path}, 大小: {pool_size}")
    
    def _init_pool(self):
        """初始化连接池"""
        # 确保数据库目录存在
        Path(self.db_path).parent.mkdir(parents=True, exist_ok=True)
        
        # 预创建连接
        for _ in range(self.pool_size):
            conn = self._create_connection()
            if conn:
                self._pool.put(conn)
    
    def _create_connection(self) -> sqlite3.Connection:
        """创建新连接"""
        try:
            conn = sqlite3.connect(
                self.db_path,
                timeout=self.timeout,
                check_same_thread=False
            )
            # 优化设置
            conn.execute("PRAGMA journal_mode=WAL")
            conn.execute("PRAGMA synchronous=NORMAL")
            conn.execute("PRAGMA cache_size=10000")
            conn.execute("PRAGMA temp_store=MEMORY")
            conn.row_factory = sqlite3.Row
            return conn
        except Exception as e:
            logger.error(f"[DB Pool] 创建连接失败: {e}")
            return None
    
    @contextmanager
    def get_connection(self):
        """获取连接（上下文管理器）"""
        conn = None
        try:
            # 从池中获取连接（带超时）
            conn = self._pool.get(timeout=self.timeout)
            
            with self._lock:
                self._active_connections += 1
            
            yield conn
            
        except queue.Empty:
            logger.warning("[DB Pool] 连接池耗尽，创建临时连接")
            conn = self._create_connection()
            yield conn
            
        finally:
            if conn:
                # 归还连接
                try:
                    self._pool.put(conn, block=False)
                    with self._lock:
                        self._active_connections -= 1
                except queue.Full:
                    # 池已满，关闭连接
                    conn.close()
    
    def execute(self, sql: str, parameters: tuple = None, fetch: bool = False):
        """执行SQL（简化接口）"""
        with self.get_connection() as conn:
            cursor = conn.cursor()
            if parameters:
                cursor.execute(sql, parameters)
            else:
                cursor.execute(sql)
            
            if fetch:
                result = cursor.fetchall()
            else:
                result = cursor.rowcount
                conn.commit()
            
            return result
    
    def executemany(self, sql: str, parameters_list: list):
        """批量执行"""
        with self.get_connection() as conn:
            cursor = conn.cursor()
            cursor.executemany(sql, parameters_list)
            conn.commit()
            return cursor.rowcount
    
    def close_all(self):
        """关闭所有连接"""
        while not self._pool.empty():
            try:
                conn = self._pool.get(block=False)
                conn.close()
            except:
                pass
        logger.info("[DB Pool] 所有连接已关闭")


class DatabaseManager:
    """数据库管理器 - 管理多个连接池"""
    
    _instance = None
    _lock = threading.Lock()
    
    def __new__(cls):
        if cls._instance is None:
            with cls._lock:
                if cls._instance is None:
                    cls._instance = super().__new__(cls)
                    cls._instance._pools = {}
        return cls._instance
    
    def get_pool(self, db_name: str, db_path: str = None) -> ConnectionPool:
        """获取或创建连接池"""
        if db_name not in self._pools:
            if db_path is None:
                db_path = str(Path.home() / '.qwenpaw' / 'team_chat' / f'{db_name}.db')
            
            self._pools[db_name] = ConnectionPool(db_path)
        
        return self._pools[db_name]
    
    def close_all(self):
        """关闭所有连接池"""
        for name, pool in self._pools.items():
            logger.info(f"[DB Manager] 关闭连接池: {name}")
            pool.close_all()
        self._pools.clear()


# 全局数据库管理器
db_manager = DatabaseManager()


# 便捷函数
def get_db_pool(db_name: str = "teamchat") -> ConnectionPool:
    """获取默认数据库连接池"""
    return db_manager.get_pool(db_name)


@contextmanager
def get_db_connection(db_name: str = "teamchat"):
    """获取数据库连接（上下文管理器）"""
    pool = get_db_pool(db_name)
    with pool.get_connection() as conn:
        yield conn


# 初始化表结构
def init_database():
    """初始化数据库表"""
    with get_db_connection() as conn:
        cursor = conn.cursor()
        
        # 会话表
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS sessions (
                id TEXT PRIMARY KEY,
                title TEXT,
                created_at REAL,
                updated_at REAL,
                status TEXT DEFAULT 'active',
                metadata TEXT
            )
        """)
        
        # 消息表
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS messages (
                id TEXT PRIMARY KEY,
                session_id TEXT,
                role TEXT,
                content TEXT,
                created_at REAL,
                metadata TEXT,
                FOREIGN KEY (session_id) REFERENCES sessions(id)
            )
        """)
        
        # 文件表
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS files (
                id TEXT PRIMARY KEY,
                session_id TEXT,
                filename TEXT,
                file_path TEXT,
                file_size INTEGER,
                mime_type TEXT,
                created_at REAL,
                metadata TEXT,
                FOREIGN KEY (session_id) REFERENCES sessions(id)
            )
        """)
        
        # 缓存表
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS api_cache (
                key TEXT PRIMARY KEY,
                value TEXT,
                expires_at REAL,
                created_at REAL DEFAULT (strftime('%s', 'now'))
            )
        """)
        
        # 创建索引
        cursor.execute("CREATE INDEX IF NOT EXISTS idx_messages_session ON messages(session_id)")
        cursor.execute("CREATE INDEX IF NOT EXISTS idx_files_session ON files(session_id)")
        cursor.execute("CREATE INDEX IF NOT EXISTS idx_cache_expires ON api_cache(expires_at)")
        
        conn.commit()
        logger.info("[DB] 数据库表初始化完成")


if __name__ == "__main__":
    # 测试
    init_database()
    
    # 测试连接池
    pool = get_db_pool()
    
    # 插入测试
    pool.execute(
        "INSERT INTO sessions (id, title, created_at) VALUES (?, ?, ?)",
        ("test-1", "测试会话", time.time())
    )
    
    # 查询测试
    result = pool.execute("SELECT * FROM sessions WHERE id = ?", ("test-1",), fetch=True)
    print("查询结果:", result)
    
    # 关闭
    db_manager.close_all()
