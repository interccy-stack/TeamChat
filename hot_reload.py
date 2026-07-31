#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""TeamChat 热重载模块 - v5.2.1

支持文件变更自动检测和插件热更新
无需重启 QwenPaw 即可应用代码变更
"""

import os
import sys
import time
import json
import hashlib
import threading
from pathlib import Path
from typing import Dict, Set, Callable, Optional
from datetime import datetime

# 文件监视器
class FileWatcher:
    """文件变更监视器"""
    
    def __init__(self, watch_paths: list, interval: float = 1.0):
        self.watch_paths = [Path(p) for p in watch_paths]
        self.interval = interval
        self.file_hashes: Dict[str, str] = {}
        self.callbacks: list = []
        self._running = False
        self._thread: Optional[threading.Thread] = None
        self._exclude = {'__pycache__', '.git', 'node_modules', '.DS_Store', '*.pyc'}
        
    def _get_file_hash(self, filepath: Path) -> str:
        """计算文件哈希"""
        try:
            content = filepath.read_bytes()
            return hashlib.md5(content).hexdigest()
        except Exception:
            return ""
    
    def _scan_files(self) -> Dict[str, str]:
        """扫描所有监视路径的文件"""
        files = {}
        for watch_path in self.watch_paths:
            if not watch_path.exists():
                continue
            for filepath in watch_path.rglob('*'):
                if not filepath.is_file():
                    continue
                # 排除不需要监视的文件
                if any(ex in str(filepath) for ex in self._exclude):
                    continue
                if filepath.suffix == '.pyc':
                    continue
                files[str(filepath)] = self._get_file_hash(filepath)
        return files
    
    def on_change(self, callback: Callable[[str], None]):
        """注册变更回调"""
        self.callbacks.append(callback)
        return self
    
    def _check_changes(self):
        """检查文件变更"""
        current_files = self._scan_files()
        
        # 检查新增或修改的文件
        for filepath, filehash in current_files.items():
            if filepath not in self.file_hashes:
                # 新增文件
                self._notify_change(filepath, "added")
            elif self.file_hashes[filepath] != filehash:
                # 修改的文件
                self._notify_change(filepath, "modified")
        
        # 检查删除的文件
        for filepath in self.file_hashes:
            if filepath not in current_files:
                self._notify_change(filepath, "deleted")
        
        self.file_hashes = current_files
    
    def _notify_change(self, filepath: str, change_type: str):
        """通知变更"""
        timestamp = datetime.now().strftime("%H:%M:%S")
        print(f"[HotReload] [{timestamp}] {change_type}: {filepath}")
        for callback in self.callbacks:
            try:
                callback(filepath)
            except Exception as e:
                print(f"[HotReload] Callback error: {e}")
    
    def _watch_loop(self):
        """监视循环"""
        # 初始扫描
        self.file_hashes = self._scan_files()
        print(f"[HotReload] 开始监视 {len(self.file_hashes)} 个文件...")
        
        while self._running:
            time.sleep(self.interval)
            self._check_changes()
    
    def start(self):
        """启动监视"""
        if self._running:
            return
        self._running = True
        self._thread = threading.Thread(target=self._watch_loop, daemon=True)
        self._thread.start()
        print("[HotReload] 热重载监视器已启动")
    
    def stop(self):
        """停止监视"""
        self._running = False
        if self._thread:
            self._thread.join(timeout=2)
        print("[HotReload] 热重载监视器已停止")


class PluginHotReloader:
    """插件热重载器"""
    
    def __init__(self, plugin_dir: Path):
        self.plugin_dir = plugin_dir
        self.watcher: Optional[FileWatcher] = None
        self.reload_callbacks: list = []
        self._debounce_timer: Optional[threading.Timer] = None
        self._debounce_delay = 0.5  # 防抖延迟（秒）
        
    def on_reload(self, callback: Callable[[], None]):
        """注册重载回调"""
        self.reload_callbacks.append(callback)
        return self
    
    def _trigger_reload(self):
        """触发重载"""
        print("[HotReload] 触发插件重载...")
        for callback in self.reload_callbacks:
            try:
                callback()
            except Exception as e:
                print(f"[HotReload] Reload error: {e}")
    
    def _on_file_change(self, filepath: str):
        """文件变更处理（带防抖）"""
        # 只关注特定文件类型
        if not any(filepath.endswith(ext) for ext in ['.py', '.json', '.js', '.css', '.html']):
            return
        
        # 取消之前的定时器
        if self._debounce_timer:
            self._debounce_timer.cancel()
        
        # 创建新的定时器
        self._debounce_timer = threading.Timer(self._debounce_delay, self._trigger_reload)
        self._debounce_timer.start()
    
    def start(self):
        """启动热重载"""
        watch_paths = [
            self.plugin_dir / "team_chat_main.py",
            self.plugin_dir / "ai_group_chat.py",
            self.plugin_dir / "plugin.json",
            self.plugin_dir / "manifest.json",
            self.plugin_dir / "frontend" / "src",
            self.plugin_dir / "email_backend",
        ]
        
        self.watcher = FileWatcher(watch_paths, interval=1.0)
        self.watcher.on_change(self._on_file_change)
        self.watcher.start()
        
        print(f"[HotReload] TeamChat 热重载已启用")
        print(f"[HotReload] 监视目录: {self.plugin_dir}")
    
    def stop(self):
        """停止热重载"""
        if self.watcher:
            self.watcher.stop()
            self.watcher = None


# 全局热重载实例
_hot_reloader: Optional[PluginHotReloader] = None

def enable_hot_reload(plugin_dir: Path) -> PluginHotReloader:
    """启用热重载"""
    global _hot_reloader
    if _hot_reloader is None:
        _hot_reloader = PluginHotReloader(plugin_dir)
        _hot_reloader.start()
    return _hot_reloader

def disable_hot_reload():
    """禁用热重载"""
    global _hot_reloader
    if _hot_reloader:
        _hot_reloader.stop()
        _hot_reloader = None


def get_hot_reload_status() -> dict:
    """获取热重载状态"""
    if _hot_reloader is None:
        return {"enabled": False}
    
    return {
        "enabled": True,
        "plugin_dir": str(_hot_reloader.plugin_dir),
        "watching": _hot_reloader.watcher is not None and _hot_reloader.watcher._running
    }


# 前端热重载支持（通过 WebSocket 或轮询）
FRONTEND_HOT_RELOAD_JS = """
// TeamChat 前端热重载支持
(function() {
    'use strict';
    
    const CHECK_INTERVAL = 2000; // 2秒检查一次
    let lastHash = localStorage.getItem('teamchat_last_hash') || '';
    
    async function checkUpdate() {
        try {
            const response = await fetch('/api/team-chat/version');
            if (!response.ok) return;
            
            const data = await response.json();
            const currentHash = data.hash || data.version;
            
            if (lastHash && lastHash !== currentHash) {
                console.log('[TeamChat HotReload] 检测到新版本，正在刷新...');
                localStorage.setItem('teamchat_last_hash', currentHash);
                window.location.reload();
            } else if (!lastHash) {
                localStorage.setItem('teamchat_last_hash', currentHash);
            }
        } catch (e) {
            // 忽略错误
        }
    }
    
    // 启动轮询
    setInterval(checkUpdate, CHECK_INTERVAL);
    console.log('[TeamChat HotReload] 前端热重载已启用');
})();
"""


if __name__ == "__main__":
    # 测试热重载
    import tempfile
    import shutil
    
    # 创建测试目录
    test_dir = Path(tempfile.mkdtemp())
    print(f"测试目录: {test_dir}")
    
    # 创建测试文件
    (test_dir / "test.py").write_text("print('hello')")
    
    # 启动热重载
    reloader = PluginHotReloader(test_dir)
    reloader.on_reload(lambda: print("重载回调触发！"))
    reloader.start()
    
    print("修改 test.py 文件查看热重载效果...")
    print("按 Ctrl+C 停止")
    
    try:
        while True:
            time.sleep(1)
    except KeyboardInterrupt:
        reloader.stop()
        shutil.rmtree(test_dir)
        print("已清理测试目录")
