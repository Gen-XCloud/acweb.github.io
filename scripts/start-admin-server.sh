#!/bin/bash

# Hugo Teek Admin Server 启动脚本
# 用途: 加载环境变量并启动 admin-server

set -e

# 获取脚本所在目录的父目录（项目根目录）
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "${SCRIPT_DIR}/.." && pwd)"

cd "${PROJECT_ROOT}"

# 初始化环境变量
bash scripts/init-env.sh

# 加载 .env 文件并导出所有变量
if [ -f .env ]; then
    echo "加载环境变量..."
    set -a  # 自动导出所有变量
    source .env
    set +a

    echo "环境变量已加载:"
    echo "  HUGO_TEEK_BASE_DIR: ${HUGO_TEEK_BASE_DIR}"
    echo "  HUGO_TEEK_DATA_DIR: ${HUGO_TEEK_DATA_DIR}"
    echo "  HUGO_TEEK_PORT: ${HUGO_TEEK_PORT}"
else
    echo "错误: .env 文件不存在"
    exit 1
fi

# 启动 admin-server
cd tools
echo ""
echo "启动 admin-server..."
exec go run ./admin-server/cmd/admin-server --port "${HUGO_TEEK_PORT:-8888}"
