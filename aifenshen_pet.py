# -*- coding: utf-8 -*-
"""
AI分身桌面宠物 - 独立进程模块
基于PySide6实现无边框透明窗口
"""

import sys
import os
import json
import time
import threading
from pathlib import Path
from typing import Optional, Dict, Any

# PySide6导入
try:
    from PySide6.QtCore import QPoint, QRect, Qt, QTimer, Signal, QObject
    from PySide6.QtGui import QColor, QFont, QFontMetrics, QPainter, QPixmap, QCursor
    from PySide6.QtWidgets import QApplication, QMenu, QWidget, QVBoxLayout, QTextEdit, QLineEdit, QPushButton
except ImportError:
    print("错误: 需要安装PySide6")
    print("pip install pyside6")
    sys.exit(1)

# FastAPI导入
try:
    from fastapi import FastAPI, HTTPException
    from fastapi.responses import JSONResponse
    import uvicorn
except ImportError:
    print("错误: 需要安装fastapi和uvicorn")
    print("pip install fastapi uvicorn")
    sys.exit(1)


class PetConfig:
    """桌面宠物配置"""
    DEFAULT_PORT = 18765  # AI分身桌面宠物端口
    DEFAULT_SCALE = 0.8
    AVATAR_SIZE = 80
    WINDOW_WIDTH = 350
    WINDOW_HEIGHT = 500
    
    def __init__(self):
        self.port = self.DEFAULT_PORT
        self.scale = self.DEFAULT_SCALE
        self.avatar_url = "/api/plugins/team_chat/media/0123.jpg"
        self.position = {"x": 100, "y": 100}
        
    @classmethod
    def from_env(cls):
        """从环境变量加载配置"""
        config = cls()
        if "AIFENSHEN_PET_PORT" in os.environ:
            config.port = int(os.environ["AIFENSHEN_PET_PORT"])
        if "AIFENSHEN_PET_SCALE" in os.environ:
            config.scale = float(os.environ["AIFENSHEN_PET_SCALE"])
        return config


class PetSignals(QObject):
    """宠物信号 - 用于线程间通信"""
    show_chat = Signal()  # 显示聊天面板
    hide_chat = Signal()  # 隐藏聊天面板
    update_avatar = Signal(str)  # 更新头像
    add_message = Signal(str, str)  # 添加消息 (role, content)


class ChatPanel(QWidget):
    """聊天面板 - 点击头像后展开"""
    
    def __init__(self, parent=None):
        super().__init__(parent)
        self.init_ui()
        
    def init_ui(self):
        """初始化UI"""
        self.setWindowFlags(
            Qt.WindowType.FramelessWindowHint |
            Qt.WindowType.WindowStaysOnTopHint |
            Qt.WindowType.Tool
        )
        self.setAttribute(Qt.WidgetAttribute.WA_TranslucentBackground)
        
        # 设置大小
        self.setFixedSize(320, 450)
        
        # 创建主容器
        container = QWidget(self)
        container.setGeometry(10, 10, 300, 430)
        container.setStyleSheet("""
            QWidget {
                background: linear-gradient(135deg, #667eea, #764ba2);
                border-radius: 20px;
                border: 2px solid rgba(255, 255, 255, 0.3);
            }
        """)
        
        # 布局
        layout = QVBoxLayout(container)
        layout.setContentsMargins(16, 16, 16, 16)
        layout.setSpacing(12)
        
        # 标题栏
        title = QPushButton("🤖 AI分身", container)
        title.setStyleSheet("""
            QPushButton {
                background: transparent;
                color: white;
                font-size: 16px;
                font-weight: bold;
                border: none;
                padding: 8px;
            }
        """)
        title.setCursor(QCursor(Qt.CursorShape.PointingHandCursor))
        title.clicked.connect(self.hide)
        layout.addWidget(title)
        
        # 聊天区域
        self.chat_display = QTextEdit(container)
        self.chat_display.setReadOnly(True)
        self.chat_display.setStyleSheet("""
            QTextEdit {
                background: rgba(255, 255, 255, 0.95);
                border-radius: 12px;
                padding: 12px;
                font-size: 13px;
                color: #333;
                border: none;
            }
        """)
        layout.addWidget(self.chat_display)
        
        # 输入区域
        input_container = QWidget(container)
        input_layout = QVBoxLayout(input_container)
        input_layout.setContentsMargins(0, 0, 0, 0)
        input_layout.setSpacing(8)
        
        self.input_field = QLineEdit(input_container)
        self.input_field.setPlaceholderText("输入消息...")
        self.input_field.setStyleSheet("""
            QLineEdit {
                background: rgba(255, 255, 255, 0.95);
                border-radius: 20px;
                padding: 10px 16px;
                font-size: 13px;
                color: #333;
                border: none;
            }
        """)
        self.input_field.returnPressed.connect(self.send_message)
        input_layout.addWidget(self.input_field)
        
        send_btn = QPushButton("发送", input_container)
        send_btn.setStyleSheet("""
            QPushButton {
                background: rgba(255, 255, 255, 0.3);
                color: white;
                border-radius: 16px;
                padding: 8px 16px;
                font-size: 13px;
                border: 1px solid rgba(255, 255, 255, 0.5);
            }
            QPushButton:hover {
                background: rgba(255, 255, 255, 0.4);
            }
        """)
        send_btn.clicked.connect(self.send_message)
        input_layout.addWidget(send_btn)
        
        layout.addWidget(input_container)
        
        # 欢迎消息
        self.add_message("assistant", "你好！我是AI分身 🤖\n\n点击头像可以和我聊天，也可以拖动我改变位置。")
        
    def add_message(self, role: str, content: str):
        """添加消息到聊天区域"""
        prefix = "🤖" if role == "assistant" else "👤"
        self.chat_display.append(f"{prefix} {content}\n")
        
    def send_message(self):
        """发送消息"""
        text = self.input_field.text().strip()
        if text:
            self.add_message("user", text)
            self.input_field.clear()
            # TODO: 发送到智能体并获取回复
            self.add_message("assistant", "收到: " + text)


class PetWindow(QWidget):
    """宠物主窗口 - 圆形头像悬浮窗"""
    
    def __init__(self, config: PetConfig):
        super().__init__()
        self.config = config
        self.signals = PetSignals()
        self.chat_panel: Optional[ChatPanel] = None
        self.is_dragging = False
        self.drag_position = QPoint()
        
        self.init_ui()
        self.init_chat_panel()
        
    def init_ui(self):
        """初始化UI"""
        # 窗口标志 - 无边框、置顶、工具窗口
        self.setWindowFlags(
            Qt.WindowType.FramelessWindowHint |
            Qt.WindowType.WindowStaysOnTopHint |
            Qt.WindowType.Tool
        )
        
        # 透明背景
        self.setAttribute(Qt.WidgetAttribute.WA_TranslucentBackground)
        
        # 设置大小 - 圆形头像大小
        size = int(self.config.AVATAR_SIZE * self.config.scale)
        self.setFixedSize(size, size)
        
        # 设置位置
        self.move(self.config.position["x"], self.config.position["y"])
        
        # 加载头像
        self.avatar_pixmap: Optional[QPixmap] = None
        self.load_avatar()
        
        # 右键菜单
        self.context_menu = QMenu(self)
        self.context_menu.setStyleSheet("""
            QMenu {
                background: white;
                border-radius: 8px;
                padding: 8px;
                border: 1px solid #ddd;
            }
            QMenu::item {
                padding: 8px 16px;
                border-radius: 4px;
            }
            QMenu::item:selected {
                background: #667eea;
                color: white;
            }
        """)
        
        show_chat = self.context_menu.addAction("💬 打开聊天")
        show_chat.triggered.connect(self.show_chat_panel)
        
        self.context_menu.addSeparator()
        
        hide_pet = self.context_menu.addAction("👻 隐藏宠物")
        hide_pet.triggered.connect(self.hide)
        
        quit_pet = self.context_menu.addAction("❌ 退出")
        quit_pet.triggered.connect(self.quit)
        
    def init_chat_panel(self):
        """初始化聊天面板"""
        self.chat_panel = ChatPanel()
        self.chat_panel.hide()
        
    def load_avatar(self):
        """加载头像图片"""
        # 尝试从本地路径加载
        avatar_paths = [
            Path.home() / ".copaw" / "plugins" / "team_chat" / "media" / "0123.jpg",
            Path(__file__).parent / "assets" / "avatar.jpg",
        ]
        
        for path in avatar_paths:
            if path.exists():
                self.avatar_pixmap = QPixmap(str(path))
                break
        
        if self.avatar_pixmap and not self.avatar_pixmap.isNull():
            size = int(self.config.AVATAR_SIZE * self.config.scale)
            self.avatar_pixmap = self.avatar_pixmap.scaled(
                size, size,
                Qt.AspectRatioMode.KeepAspectRatioByExpanding,
                Qt.TransformationMode.SmoothTransformation
            )
    
    def paintEvent(self, event):
        """绘制事件 - 绘制圆形头像"""
        painter = QPainter(self)
        painter.setRenderHint(QPainter.RenderHint.Antialiasing)
        
        size = int(self.config.AVATAR_SIZE * self.config.scale)
        
        # 绘制圆形边框
        painter.setPen(Qt.PenStyle.NoPen)
        painter.setBrush(QColor(102, 126, 234))
        painter.drawEllipse(0, 0, size, size)
        
        # 绘制头像
        if self.avatar_pixmap and not self.avatar_pixmap.isNull():
            # 创建圆形裁剪路径
            path = QPainter()
            painter.setClipPath(self._create_circle_path(size))
            painter.drawPixmap(0, 0, self.avatar_pixmap)
            painter.setClipping(False)
        else:
            # 绘制默认渐变背景
            gradient = QLinearGradient(0, 0, size, size)
            gradient.setColorAt(0, QColor(102, 126, 234))
            gradient.setColorAt(1, QColor(118, 75, 162))
            painter.setBrush(gradient)
            painter.drawEllipse(0, 0, size, size)
            
            # 绘制默认图标
            painter.setPen(QColor(255, 255, 255))
            font = QFont("Segoe UI", int(size * 0.4))
            painter.setFont(font)
            painter.drawText(self.rect(), Qt.AlignmentFlag.AlignCenter, "🤖")
        
        # 绘制边框
        painter.setPen(QColor(255, 255, 255, 200))
        painter.setBrush(Qt.BrushStyle.NoBrush)
        painter.drawEllipse(2, 2, size - 4, size - 4)
        
        painter.end()
    
    def _create_circle_path(self, size: int):
        """创建圆形路径用于裁剪"""
        from PySide6.QtGui import QPainterPath
        path = QPainterPath()
        path.addEllipse(0, 0, size, size)
        return path
    
    def mousePressEvent(self, event):
        """鼠标按下事件"""
        if event.button() == Qt.MouseButton.LeftButton:
            self.is_dragging = True
            self.drag_position = event.globalPosition().toPoint() - self.frameGeometry().topLeft()
            # 点击时显示聊天面板
            self.show_chat_panel()
        elif event.button() == Qt.MouseButton.RightButton:
            self.context_menu.exec(event.globalPosition().toPoint())
    
    def mouseMoveEvent(self, event):
        """鼠标移动事件 - 拖动窗口"""
        if self.is_dragging:
            self.move(event.globalPosition().toPoint() - self.drag_position)
    
    def mouseReleaseEvent(self, event):
        """鼠标释放事件"""
        self.is_dragging = False
    
    def show_chat_panel(self):
        """显示聊天面板"""
        if self.chat_panel:
            # 定位到宠物窗口旁边
            pet_pos = self.pos()
            pet_size = self.size()
            panel_size = self.chat_panel.size()
            
            # 计算位置 - 显示在宠物窗口右侧
            x = pet_pos.x() + pet_size.width() + 10
            y = pet_pos.y()
            
            # 边界检查
            screen = QApplication.primaryScreen().geometry()
            if x + panel_size.width() > screen.width():
                x = pet_pos.x() - panel_size.width() - 10
            if y + panel_size.height() > screen.height():
                y = screen.height() - panel_size.height()
            
            self.chat_panel.move(x, y)
            self.chat_panel.show()
            self.chat_panel.raise_()
    
    def hide_chat_panel(self):
        """隐藏聊天面板"""
        if self.chat_panel:
            self.chat_panel.hide()
    
    def quit(self):
        """退出宠物"""
        if self.chat_panel:
            self.chat_panel.close()
        self.close()
        QApplication.quit()


class PetServer:
    """宠物HTTP服务 - 接收TeamChat的消息"""
    
    def __init__(self, pet_window: PetWindow, config: PetConfig):
        self.pet_window = pet_window
        self.config = config
        self.app = FastAPI(title="AI分身桌面宠物")
        self.setup_routes()
        
    def setup_routes(self):
        """设置路由"""
        
        @self.app.get("/health")
        async def health():
            return {"status": "ok", "pet": "aifenshen"}
        
        @self.app.post("/event")
        async def event(data: Dict[str, Any]):
            """接收事件"""
            event_type = data.get("event")
            text = data.get("text", "")
            
            if event_type == "show":
                self.pet_window.show()
            elif event_type == "hide":
                self.pet_window.hide()
            elif event_type == "chat":
                self.pet_window.show_chat_panel()
                if text:
                    self.pet_window.chat_panel.add_message("assistant", text)
            elif event_type == "message":
                self.pet_window.chat_panel.add_message("assistant", text)
            elif event_type == "quit":
                self.pet_window.quit()
                return {"status": "ok", "message": "宠物即将退出"}
            
            return {"status": "ok"}
        
        @self.app.get("/state")
        async def state():
            return {
                "visible": self.pet_window.isVisible(),
                "chat_visible": self.pet_window.chat_panel.isVisible() if self.pet_window.chat_panel else False,
                "position": {"x": self.pet_window.x(), "y": self.pet_window.y()}
            }
    
    def run(self):
        """运行服务器"""
        uvicorn.run(self.app, host="127.0.0.1", port=self.config.port, log_level="warning")


def main():
    """主函数"""
    # 创建应用
    app = QApplication(sys.argv)
    app.setQuitOnLastWindowClosed(False)  # 关闭窗口不退出
    
    # 加载配置
    config = PetConfig.from_env()
    
    # 创建宠物窗口
    pet_window = PetWindow(config)
    pet_window.show()
    
    # 创建HTTP服务器（在后台线程运行）
    server = PetServer(pet_window, config)
    server_thread = threading.Thread(target=server.run, daemon=True)
    server_thread.start()
    
    print(f"🐱 AI分身桌面宠物已启动!")
    print(f"   HTTP服务: http://127.0.0.1:{config.port}")
    print(f"   头像大小: {int(config.AVATAR_SIZE * config.scale)}px")
    
    # 运行应用
    sys.exit(app.exec())


if __name__ == "__main__":
    main()
