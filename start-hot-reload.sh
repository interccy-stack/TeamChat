#!/bin/bash
# TeamChat 热重载快速启动脚本

echo "🚀 TeamChat v5.2.1 自动热更新"
echo "================================"

# 获取插件目录
PLUGIN_DIR="$(cd "$(dirname "$0")" && pwd)"
cd "$PLUGIN_DIR"

# 检查文件
if [ ! -f "auto_update.sh" ]; then
    echo "❌ 错误: auto_update.sh 不存在"
    exit 1
fi

# 添加执行权限
chmod +x auto_update.sh

# 启动热重载
echo ""
echo "📡 启动热重载监视..."
echo "   监视目录: $PLUGIN_DIR"
echo "   检查间隔: 1秒"
echo "   防抖延迟: 0.5秒"
echo ""

./auto_update.sh start

# 显示状态
echo ""
echo "📊 当前状态:"
./auto_update.sh status

echo ""
echo "✅ 热重载已启动！"
echo ""
echo "💡 常用命令:"
echo "   ./auto_update.sh status    # 查看状态"
echo "   ./auto_update.sh stop      # 停止监视"
echo "   ./auto_update.sh restart   # 重启监视"
echo "   ./auto_update.sh backup    # 创建备份"
echo ""
echo "📝 提示: 修改文件后自动生效，无需重启 QwenPaw"
echo ""
