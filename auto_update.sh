#!/bin/bash
# TeamChat 自动热更新脚本 v5.2.1
# 用法: ./auto_update.sh [start|stop|status|restart]

set -e

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 配置
PLUGIN_NAME="team_chat"
# 自动检测插件目录
if [ -d "/run/csi/mount-root/nas/4079184d856ecc166ed19d4887083405/plugins/${PLUGIN_NAME}" ]; then
    PLUGIN_DIR="/run/csi/mount-root/nas/4079184d856ecc166ed19d4887083405/plugins/${PLUGIN_NAME}"
elif [ -d "${HOME}/.qwenpaw/plugins/${PLUGIN_NAME}" ]; then
    PLUGIN_DIR="${HOME}/.qwenpaw/plugins/${PLUGIN_NAME}"
else
    # 使用当前脚本所在目录
    PLUGIN_DIR="$(cd "$(dirname "$0")" && pwd)"
fi
BACKUP_DIR="${HOME}/.qwenpaw/backups"
LOG_FILE="${PLUGIN_DIR}/logs/hot_reload.log"
PID_FILE="${PLUGIN_DIR}/.hot_reload.pid"

# 确保目录存在
mkdir -p "${BACKUP_DIR}"
mkdir -p "${HOME}/.qwenpaw/logs"
mkdir -p "${HOME}/.qwenpaw/run"

# 日志函数
log() {
    echo -e "${BLUE}[$(date '+%Y-%m-%d %H:%M:%S')]${NC} $1" | tee -a "${LOG_FILE}"
}

log_success() {
    echo -e "${GREEN}[$(date '+%Y-%m-%d %H:%M:%S')] ✓${NC} $1" | tee -a "${LOG_FILE}"
}

log_warning() {
    echo -e "${YELLOW}[$(date '+%Y-%m-%d %H:%M:%S')] ⚠${NC} $1" | tee -a "${LOG_FILE}"
}

log_error() {
    echo -e "${RED}[$(date '+%Y-%m-%d %H:%M:%S')] ✗${NC} $1" | tee -a "${LOG_FILE}"
}

# 显示帮助
show_help() {
    cat << EOF
TeamChat 自动热更新脚本 v5.2.1

用法: $0 [命令]

命令:
    start       启动热更新监视
    stop        停止热更新监视
    status      查看热更新状态
    restart     重启热更新监视
    once        执行一次更新检查
    backup      创建备份
    restore     从备份恢复
    help        显示帮助

示例:
    $0 start           # 启动热更新
    $0 status          # 查看状态
    $0 once            # 手动检查更新

EOF
}

# 检查插件目录
check_plugin_dir() {
    if [ ! -d "${PLUGIN_DIR}" ]; then
        log_error "插件目录不存在: ${PLUGIN_DIR}"
        exit 1
    fi
}

# 创建备份
do_backup() {
    local backup_name="team_chat_$(date +%Y%m%d_%H%M%S).tar.gz"
    local backup_path="${BACKUP_DIR}/${backup_name}"
    
    log "创建备份: ${backup_name}"
    
    tar -czf "${backup_path}" \
        --exclude='node_modules' \
        --exclude='__pycache__' \
        --exclude='*.pyc' \
        --exclude='.DS_Store' \
        --exclude='.git' \
        -C "${HOME}/.qwenpaw/plugins" \
        "${PLUGIN_NAME}"
    
    if [ $? -eq 0 ]; then
        log_success "备份创建成功: ${backup_path}"
        log "文件大小: $(du -h "${backup_path}" | cut -f1)"
    else
        log_error "备份创建失败"
        return 1
    fi
}

# 计算文件哈希
calc_hash() {
    find "${PLUGIN_DIR}" -type f \
        ! -path "*/node_modules/*" \
        ! -path "*/__pycache__/*" \
        ! -name "*.pyc" \
        ! -name ".DS_Store" \
        -exec md5sum {} + | sort | md5sum | cut -d' ' -f1
}

# 保存哈希
save_hash() {
    calc_hash > "${HOME}/.qwenpaw/run/team_chat_last_hash"
}

# 读取哈希
read_hash() {
    if [ -f "${HOME}/.qwenpaw/run/team_chat_last_hash" ]; then
        cat "${HOME}/.qwenpaw/run/team_chat_last_hash"
    else
        echo ""
    fi
}

# 检查变更
check_changes() {
    local current_hash=$(calc_hash)
    local last_hash=$(read_hash)
    
    if [ "${current_hash}" != "${last_hash}" ]; then
        return 0  # 有变更
    else
        return 1  # 无变更
    fi
}

# 触发重载
trigger_reload() {
    log "检测到文件变更，触发重载..."
    
    # 方法1: 通过 QwenPaw API 通知
    if command -v qwenpaw &> /dev/null; then
        log "尝试通过 QwenPaw API 重载插件..."
        # 这里可以添加 qwenpaw 命令来重载插件
        # qwenpaw plugin reload team_chat
    fi
    
    # 方法2: 创建通知文件
    local notify_file="${PLUGIN_DIR}/data/.hot_reload_trigger"
    mkdir -p "$(dirname ${notify_file})"
    echo "{\"timestamp\": $(date +%s), \"version\": \"5.2.1\"}" > "${notify_file}"
    
    # 方法3: 发送信号给进程（如果支持）
    if [ -f "${PID_FILE}" ]; then
        local pid=$(cat "${PID_FILE}")
        if kill -0 "${pid}" 2>/dev/null; then
            log "发送重载信号到进程 ${pid}"
            # kill -USR1 "${pid}" 2>/dev/null || true
        fi
    fi
    
    # 更新哈希
    save_hash
    
    log_success "重载触发完成"
}

# 监视循环
watch_loop() {
    log "启动热更新监视..."
    log "监视目录: ${PLUGIN_DIR}"
    log "检查间隔: 2秒"
    
    # 初始化哈希
    save_hash
    
    while true; do
        if check_changes; then
            trigger_reload
        fi
        sleep 2
    done
}

# 启动监视
start_watch() {
    check_plugin_dir
    
    if [ -f "${PID_FILE}" ]; then
        local pid=$(cat "${PID_FILE}")
        if kill -0 "${pid}" 2>/dev/null; then
            log_warning "热更新监视已在运行 (PID: ${pid})"
            return 0
        fi
    fi
    
    log "启动 TeamChat 热更新监视..."
    
    # 后台启动监视
    nohup bash -c "$(declare -f log log_success log_warning log_error check_plugin_dir calc_hash save_hash read_hash check_changes trigger_reload watch_loop); watch_loop" > "${LOG_FILE}" 2>&1 &
    
    local pid=$!
    echo ${pid} > "${PID_FILE}"
    
    sleep 1
    
    if kill -0 "${pid}" 2>/dev/null; then
        log_success "热更新监视已启动 (PID: ${pid})"
        log "日志文件: ${LOG_FILE}"
    else
        log_error "热更新监视启动失败"
        return 1
    fi
}

# 停止监视
stop_watch() {
    if [ -f "${PID_FILE}" ]; then
        local pid=$(cat "${PID_FILE}")
        if kill -0 "${pid}" 2>/dev/null; then
            log "停止热更新监视 (PID: ${pid})..."
            kill "${pid}" 2>/dev/null || true
            rm -f "${PID_FILE}"
            log_success "热更新监视已停止"
        else
            log_warning "进程 ${pid} 已不存在"
            rm -f "${PID_FILE}"
        fi
    else
        log_warning "热更新监视未运行"
    fi
}

# 查看状态
show_status() {
    echo -e "\n${BLUE}=== TeamChat 热更新状态 ===${NC}\n"
    
    if [ -f "${PID_FILE}" ]; then
        local pid=$(cat "${PID_FILE}")
        if kill -0 "${pid}" 2>/dev/null; then
            echo -e "状态: ${GREEN}运行中${NC}"
            echo -e "PID: ${pid}"
            echo -e "日志: ${LOG_FILE}"
        else
            echo -e "状态: ${RED}已停止${NC} (PID 文件存在但进程不存在)"
        fi
    else
        echo -e "状态: ${YELLOW}未运行${NC}"
    fi
    
    echo -e "\n插件目录: ${PLUGIN_DIR}"
    
    if [ -d "${PLUGIN_DIR}" ]; then
        local file_count=$(find "${PLUGIN_DIR}" -type f ! -path "*/node_modules/*" ! -path "*/__pycache__/*" | wc -l)
        echo -e "文件数量: ${file_count}"
    fi
    
    if [ -f "${HOME}/.qwenpaw/run/team_chat_last_hash" ]; then
        echo -e "最后哈希: $(cat ${HOME}/.qwenpaw/run/team_chat_last_hash)"
    fi
    
    echo ""
}

# 执行一次检查
do_once() {
    check_plugin_dir
    
    log "执行一次更新检查..."
    
    if check_changes; then
        trigger_reload
    else
        log "没有检测到变更"
    fi
}

# 主函数
main() {
    case "${1:-help}" in
        start)
            start_watch
            ;;
        stop)
            stop_watch
            ;;
        restart)
            stop_watch
            sleep 1
            start_watch
            ;;
        status)
            show_status
            ;;
        once)
            do_once
            ;;
        backup)
            do_backup
            ;;
        restore)
            log "从备份恢复功能待实现"
            ;;
        help|--help|-h)
            show_help
            ;;
        *)
            log_error "未知命令: $1"
            show_help
            exit 1
            ;;
    esac
}

main "$@"
