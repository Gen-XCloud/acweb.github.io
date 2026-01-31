#!/bin/bash
# Docker 构建和运行辅助脚本

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && cd .. && pwd)"
cd "$SCRIPT_DIR"

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

print_info() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

print_warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

print_header() {
    echo -e "${BLUE}===================================================${NC}"
    echo -e "${BLUE}$1${NC}"
    echo -e "${BLUE}===================================================${NC}"
}

# 检查必需文件
check_prerequisites() {
    print_header "检查构建前置条件"

    if [ ! -d "bin/linux" ]; then
        print_error "bin/linux 目录不存在！"
        print_info "请先运行 'make install-deps' 构建工具"
        exit 1
    fi

    if [ ! -f "hugo" ]; then
        print_error "hugo 可执行文件不存在！"
        exit 1
    fi

    print_info "✅ 所有前置条件满足"
}

# 构建 Docker 镜像
build_image() {
    local dockerfile=${1:-docker/Dockerfile}
    local tag=${2:-hugo-teeker-theme:latest}

    print_header "构建 Docker 镜像"
    print_info "使用 Dockerfile: $dockerfile"
    print_info "镜像标签: $tag"

    docker build -t "$tag" -f "$dockerfile" .

    if [ $? -eq 0 ]; then
        print_info "✅ 镜像构建成功: $tag"
        docker images | grep hugo-teeker-theme
    else
        print_error "❌ 镜像构建失败"
        exit 1
    fi
}

# 运行容器（开发模式）
run_dev() {
    local tag=${1:-hugo-teeker-theme:latest}
    local port=${2:-8080}

    print_header "启动开发容器"

    # 停止已存在的容器
    docker stop hugo-teeker-dev 2>/dev/null || true
    docker rm hugo-teeker-dev 2>/dev/null || true

    print_info "启动容器（端口: $port）..."
    docker run -d \
        --name hugo-teeker-dev \
        -p "$port:8080" \
        -p "3001:3001" \
        -v "$SCRIPT_DIR/hugo-teek-site/content:/workspace/hugo-teek-site/content" \
        -v "$SCRIPT_DIR/hugo-teek-site/static:/workspace/hugo-teek-site/static" \
        -v "$SCRIPT_DIR/hugo-teek-site/data:/workspace/hugo-teek-site/data" \
        -e HUGO_ENABLEGITINFO=false \
        "$tag" \
        bash -c "make dev"

    if [ $? -eq 0 ]; then
        print_info "✅ 容器启动成功"
        print_info "访问地址: http://localhost:$port"
        print_info "配置中心: http://localhost:3001"
        print_info ""
        print_info "查看日志: docker logs -f hugo-teeker-dev"
        print_info "进入容器: docker exec -it hugo-teeker-dev sh"
    else
        print_error "❌ 容器启动失败"
        exit 1
    fi
}

# 构建生产版本
build_production() {
    local tag=${1:-hugo-teeker-theme:latest}

    print_header "构建生产版本"

    docker run --rm \
        -v "$SCRIPT_DIR/hugo-teek-site/public:/workspace/hugo-teek-site/public" \
        "$tag"

    if [ $? -eq 0 ]; then
        print_info "✅ 生产构建完成"
        print_info "输出目录: $SCRIPT_DIR/hugo-teek-site/public"
    else
        print_error "❌ 生产构建失败"
        exit 1
    fi
}

# 测试工具是否在镜像中
test_tools() {
    local tag=${1:-hugo-teeker-theme:latest}

    print_header "测试镜像中的工具"

    print_info "测试 Hugo..."
    docker run --rm "$tag" bash -c "hugo version"

    print_info "测试 Go 工具..."
    for tool in config-server content-watcher doc-analysis frontmatter-fixer index-generator permalink-gen remove-coverimg sidebar-order vp-syntax-converter; do
        echo -n "  - $tool: "
        if docker run --rm "$tag" bash -c "which $tool" >/dev/null 2>&1; then
            echo "✅"
        else
            echo "❌"
        fi
    done

    print_info "工具列表："
    docker run --rm "$tag" bash -c "ls -lh /usr/bin/ | grep -E '(config-server|content-watcher|doc-analysis|frontmatter-fixer|index-generator|permalink-gen|remove-coverimg|sidebar-order|vp-syntax-converter)'"
}

# 停止并删除容器
stop_container() {
    local name=${1:-hugo-teeker-dev}

    print_info "停止容器: $name"
    docker stop "$name" 2>/dev/null || true
    docker rm "$name" 2>/dev/null || true
    print_info "容器已停止并删除"
}

# 清理镜像
clean_images() {
    print_header "清理镜像"
    print_warn "这将删除所有 hugo-teeker-theme 镜像"
    read -p "确认删除？(y/N) " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        docker images | grep hugo-teeker-theme | awk '{print $3}' | xargs -r docker rmi -f
        print_info "镜像已清理"
    else
        print_info "取消操作"
    fi
}

# 显示帮助信息
show_help() {
    cat <<EOF
Hugo Teeker Theme Docker 构建脚本

用法: $0 <command> [options]

命令:
  check               - 检查构建前置条件
  build [tag]         - 构建 Docker 镜像（默认：hugo-teeker-theme:latest）
  build-simple [tag]  - 使用简化 Dockerfile 构建
  dev [tag] [port]    - 运行开发容器（默认端口：8080）
  prod [tag]          - 构建生产版本
  test [tag]          - 测试镜像中的工具
  stop [name]         - 停止容器（默认：hugo-teeker-dev）
  logs [name]         - 查看容器日志
  shell [name]        - 进入容器 shell
  clean               - 清理所有镜像
  help                - 显示此帮助信息

示例:
  $0 check                                # 检查前置条件
  $0 build                                # 构建镜像
  $0 build-simple hugo-teeker:simple      # 使用简化版构建
  $0 dev                                  # 启动开发服务器
  $0 dev hugo-teeker:simple 8080          # 指定镜像和端口
  $0 test                                 # 测试工具
  $0 prod                                 # 构建生产版本
  $0 logs                                 # 查看日志
  $0 shell                                # 进入容器

EOF
}

# 主逻辑
case "${1:-help}" in
    check)
        check_prerequisites
        ;;
    build)
        check_prerequisites
        build_image "docker/Dockerfile" "${2:-hugo-teeker-theme:latest}"
        ;;
    build-simple)
        check_prerequisites
        build_image "docker/Dockerfile.simple" "${2:-hugo-teeker-theme:simple}"
        ;;
    dev)
        run_dev "${2:-hugo-teeker-theme:latest}" "${3:-8080}"
        ;;
    prod)
        build_production "${2:-hugo-teeker-theme:latest}"
        ;;
    test)
        test_tools "${2:-hugo-teeker-theme:latest}"
        ;;
    stop)
        stop_container "${2:-hugo-teeker-dev}"
        ;;
    logs)
        docker logs -f "${2:-hugo-teeker-dev}"
        ;;
    shell)
        docker exec -it "${2:-hugo-teeker-dev}" sh
        ;;
    clean)
        clean_images
        ;;
    help|*)
        show_help
        ;;
esac
