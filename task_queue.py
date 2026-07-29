#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
TeamChat 异步任务队列 v5.3.0
支持文件上传、下载、AI处理等异步任务
"""

import asyncio
import threading
import queue
import time
import uuid
import logging
from enum import Enum
from dataclasses import dataclass, field
from typing import Callable, Any, Optional, Dict, List
from concurrent.futures import ThreadPoolExecutor

logger = logging.getLogger("teamchat.task_queue")


class TaskStatus(Enum):
    """任务状态"""
    PENDING = "pending"
    RUNNING = "running"
    COMPLETED = "completed"
    FAILED = "failed"
    CANCELLED = "cancelled"


class TaskPriority(Enum):
    """任务优先级"""
    LOW = 1
    NORMAL = 2
    HIGH = 3
    CRITICAL = 4


@dataclass
class Task:
    """任务对象"""
    id: str
    name: str
    func: Callable
    args: tuple = ()
    kwargs: dict = field(default_factory=dict)
    priority: TaskPriority = TaskPriority.NORMAL
    status: TaskStatus = TaskStatus.PENDING
    created_at: float = field(default_factory=time.time)
    started_at: Optional[float] = None
    completed_at: Optional[float] = None
    result: Any = None
    error: Optional[str] = None
    callback: Optional[Callable] = None
    progress: float = 0.0
    
    def __post_init__(self):
        if not self.id:
            self.id = str(uuid.uuid4())
    
    def to_dict(self) -> dict:
        """转换为字典"""
        return {
            'id': self.id,
            'name': self.name,
            'priority': self.priority.name,
            'status': self.status.value,
            'created_at': self.created_at,
            'started_at': self.started_at,
            'completed_at': self.completed_at,
            'progress': self.progress,
            'error': self.error
        }


class AsyncTaskQueue:
    """异步任务队列"""
    
    def __init__(self, max_workers: int = 4, queue_size: int = 100):
        self.max_workers = max_workers
        self.queue_size = queue_size
        
        # 任务队列（优先级队列）
        self._task_queue = queue.PriorityQueue(maxsize=queue_size)
        
        # 任务存储
        self._tasks: Dict[str, Task] = {}
        self._task_lock = threading.Lock()
        
        # 线程池
        self._executor = ThreadPoolExecutor(max_workers=max_workers, thread_name_prefix="teamchat-task")
        
        # 运行状态
        self._running = False
        self._worker_thread: Optional[threading.Thread] = None
        
        # 统计
        self._stats = {
            'submitted': 0,
            'completed': 0,
            'failed': 0,
            'cancelled': 0
        }
        
        logger.info(f"[TaskQueue] 任务队列已创建: 工作者={max_workers}, 队列大小={queue_size}")
    
    def start(self):
        """启动任务队列"""
        if self._running:
            return
        
        self._running = True
        self._worker_thread = threading.Thread(target=self._process_loop, daemon=True)
        self._worker_thread.start()
        logger.info("[TaskQueue] 任务队列已启动")
    
    def stop(self):
        """停止任务队列"""
        self._running = False
        
        if self._worker_thread:
            self._worker_thread.join(timeout=5)
        
        self._executor.shutdown(wait=True)
        logger.info("[TaskQueue] 任务队列已停止")
    
    def submit(self, name: str, func: Callable, *args, 
               priority: TaskPriority = TaskPriority.NORMAL,
               callback: Callable = None, **kwargs) -> str:
        """
        提交任务
        
        Args:
            name: 任务名称
            func: 执行函数
            args: 位置参数
            priority: 优先级
            callback: 完成回调
            kwargs: 关键字参数
        
        Returns:
            任务ID
        """
        task = Task(
            id=str(uuid.uuid4()),
            name=name,
            func=func,
            args=args,
            kwargs=kwargs,
            priority=priority,
            callback=callback
        )
        
        # 添加到队列（优先级高的在前）
        try:
            # 优先级队列使用负值（值越小优先级越高）
            self._task_queue.put((-priority.value, task), block=False)
            
            with self._task_lock:
                self._tasks[task.id] = task
                self._stats['submitted'] += 1
            
            logger.debug(f"[TaskQueue] 任务已提交: {name} (ID: {task.id})")
            return task.id
            
        except queue.Full:
            logger.error(f"[TaskQueue] 队列已满，无法提交任务: {name}")
            raise Exception("任务队列已满")
    
    def _process_loop(self):
        """任务处理循环"""
        while self._running:
            try:
                # 获取任务（带超时）
                _, task = self._task_queue.get(timeout=1)
                
                # 更新状态
                task.status = TaskStatus.RUNNING
                task.started_at = time.time()
                
                # 提交到线程池执行
                future = self._executor.submit(self._execute_task, task)
                
            except queue.Empty:
                continue
            except Exception as e:
                logger.error(f"[TaskQueue] 处理任务出错: {e}")
    
    def _execute_task(self, task: Task):
        """执行任务"""
        try:
            logger.debug(f"[TaskQueue] 开始执行任务: {task.name}")
            
            # 执行函数
            result = task.func(*task.args, **task.kwargs)
            
            # 更新状态
            task.result = result
            task.status = TaskStatus.COMPLETED
            task.completed_at = time.time()
            
            with self._task_lock:
                self._stats['completed'] += 1
            
            logger.debug(f"[TaskQueue] 任务完成: {task.name}")
            
        except Exception as e:
            task.error = str(e)
            task.status = TaskStatus.FAILED
            task.completed_at = time.time()
            
            with self._task_lock:
                self._stats['failed'] += 1
            
            logger.error(f"[TaskQueue] 任务失败: {task.name}, 错误: {e}")
        
        finally:
            # 执行回调
            if task.callback:
                try:
                    task.callback(task)
                except Exception as e:
                    logger.error(f"[TaskQueue] 回调执行失败: {e}")
    
    def get_task(self, task_id: str) -> Optional[Task]:
        """获取任务信息"""
        with self._task_lock:
            return self._tasks.get(task_id)
    
    def cancel_task(self, task_id: str) -> bool:
        """取消任务"""
        with self._task_lock:
            task = self._tasks.get(task_id)
            if task and task.status == TaskStatus.PENDING:
                task.status = TaskStatus.CANCELLED
                self._stats['cancelled'] += 1
                return True
        return False
    
    def get_stats(self) -> dict:
        """获取统计信息"""
        with self._task_lock:
            running = sum(1 for t in self._tasks.values() if t.status == TaskStatus.RUNNING)
            pending = sum(1 for t in self._tasks.values() if t.status == TaskStatus.PENDING)
            
            return {
                **self._stats,
                'running': running,
                'pending': pending,
                'total': len(self._tasks),
                'queue_size': self._task_queue.qsize()
            }
    
    def get_all_tasks(self, status: TaskStatus = None) -> List[dict]:
        """获取所有任务"""
        with self._task_lock:
            tasks = self._tasks.values()
            if status:
                tasks = [t for t in tasks if t.status == status]
            return [t.to_dict() for t in tasks]
    
    def clear_completed(self):
        """清理已完成的任务"""
        with self._task_lock:
            to_remove = [
                tid for tid, task in self._tasks.items()
                if task.status in (TaskStatus.COMPLETED, TaskStatus.FAILED, TaskStatus.CANCELLED)
            ]
            for tid in to_remove:
                del self._tasks[tid]
            
            logger.info(f"[TaskQueue] 清理了 {len(to_remove)} 个已完成任务")


# 全局任务队列
task_queue = AsyncTaskQueue(max_workers=4)


# 便捷函数
def submit_task(name: str, func: Callable, *args, priority: str = "NORMAL", **kwargs) -> str:
    """提交任务"""
    priority_enum = TaskPriority[priority.upper()]
    return task_queue.submit(name, func, *args, priority=priority_enum, **kwargs)


def get_task_status(task_id: str) -> Optional[dict]:
    """获取任务状态"""
    task = task_queue.get_task(task_id)
    return task.to_dict() if task else None


def init_task_queue():
    """初始化任务队列"""
    task_queue.start()


def shutdown_task_queue():
    """关闭任务队列"""
    task_queue.stop()


# 常用任务包装器
def async_file_upload(file_path: str, callback: Callable = None) -> str:
    """异步文件上传"""
    def upload_task(path):
        # 模拟上传
        time.sleep(2)
        return {"path": path, "status": "uploaded"}
    
    return task_queue.submit(
        "file_upload",
        upload_task,
        file_path,
        priority=TaskPriority.NORMAL,
        callback=callback
    )


def async_ai_process(prompt: str, callback: Callable = None) -> str:
    """异步AI处理"""
    def ai_task(text):
        # 模拟AI处理
        time.sleep(5)
        return {"prompt": text, "result": "AI处理结果"}
    
    return task_queue.submit(
        "ai_process",
        ai_task,
        prompt,
        priority=TaskPriority.HIGH,
        callback=callback
    )


if __name__ == "__main__":
    # 测试
    init_task_queue()
    
    # 提交任务
    def my_task(n):
        time.sleep(1)
        return n * n
    
    task_id = task_queue.submit("test", my_task, 10, priority=TaskPriority.HIGH)
    print(f"任务已提交: {task_id}")
    
    # 等待完成
    time.sleep(2)
    
    task = task_queue.get_task(task_id)
    print(f"任务结果: {task.result}")
    print(f"统计: {task_queue.get_stats()}")
    
    shutdown_task_queue()
