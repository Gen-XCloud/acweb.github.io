#!/bin/bash
# ====================================================
# Hugo Teek Tools - 自动下载必需工具
# ====================================================
# 下载 Hugo Extended 和 hugo-teek-tools 到 bin/linux/
# ====================================================

set -e

# ====================================================
# 配置区域 - 根据需要修改以下配置
# ====================================================

# API 地址 - 获取最新下载链接
API_URL=${API_URL:-"https://download.xxdevops.cn/list"}

# ====================================================
# 以下为脚本内部逻辑，一般无需修改
# ====================================================

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 目标目录
BIN_DIR="bin/linux"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"

# 切换到项目根目录
cd "$PROJECT_ROOT"

# 创建目录
mkdir -p "$BIN_DIR"

echo -e "${BLUE}=====================================================${NC}"
echo -e "${BLUE}Hugo Teek Tools - 下载必需工具 (Linux)${NC}"
echo -e "${BLUE}=====================================================${NC}"
echo ""

# ====================================================
# 从 API 获取下载链接
# ====================================================

echo -e "${BLUE}📡 从 API 获取最新下载链接...${NC}"
echo -e "   API: ${YELLOW}$API_URL${NC}"

# 获取 JSON 数据
if command -v curl &> /dev/null; then
    JSON_DATA=$(curl -s "$API_URL") || {
        echo -e "${RED}❌ API 请求失败${NC}"
        exit 1
    }
elif command -v wget &> /dev/null; then
    JSON_DATA=$(wget -q -O - "$API_URL") || {
        echo -e "${RED}❌ API 请求失败${NC}"
        exit 1
    }
else
    echo -e "${RED}❌ 未找到 wget 或 curl${NC}"
    exit 1
fi

# 解析 JSON 获取下载链接和版本信息
if command -v jq &> /dev/null; then
    # 使用 jq 解析（推荐）
    HUGO_URL=$(echo "$JSON_DATA" | jq -r '.["hugo-teek-tools"].linux.hugo')
    TOOLS_URL=$(echo "$JSON_DATA" | jq -r '.["hugo-teek-tools"].linux["hugo-teek-tools"]')
    VERSION_INFO=$(echo "$JSON_DATA" | jq -r '.["hugo-teek-tools"].version')
else
    # 使用 grep/sed 解析（备用）
    HUGO_URL=$(echo "$JSON_DATA" | grep -o '"linux":[^}]*"hugo":"[^"]*"' | sed 's/.*"hugo":"\([^"]*\)".*/\1/')
    TOOLS_URL=$(echo "$JSON_DATA" | grep -o '"hugo-teek-tools":"[^"]*"' | grep -v '\.gitattributes' | sed 's/.*"hugo-teek-tools":"\([^"]*\)".*/\1/')
    VERSION_INFO=$(echo "$JSON_DATA" | grep -o '"version":"[^"]*"' | sed 's/.*"version":"\([^"]*\)".*/\1/')
fi

if [ -z "$HUGO_URL" ] || [ -z "$TOOLS_URL" ]; then
    echo -e "${RED}❌ 无法从 API 获取下载链接${NC}"
    exit 1
fi

echo -e "${GREEN}✅ 获取成功${NC}"
echo -e "   版本: ${YELLOW}$VERSION_INFO${NC}"
echo ""

# ====================================================
# 下载 Hugo Extended
# ====================================================

HUGO_BIN="$BIN_DIR/hugo"

if [ -f "$HUGO_BIN" ]; then
    echo -e "${GREEN}✅ Hugo 已存在${NC}"
    EXISTING_VERSION=$("$HUGO_BIN" version 2>/dev/null | head -1 || echo "unknown")
    echo -e "   当前版本: ${YELLOW}$EXISTING_VERSION${NC}"
    echo ""
fi

if [ ! -f "$HUGO_BIN" ]; then
    echo -e "${BLUE}📥 下载 Hugo Extended...${NC}"
    echo -e "   URL: ${YELLOW}$HUGO_URL${NC}"

    # 下载二进制文件
    if command -v curl &> /dev/null; then
        curl -L --progress-bar -o "$HUGO_BIN" "$HUGO_URL" || {
            echo -e "${RED}❌ 下载失败${NC}"
            exit 1
        }
    elif command -v wget &> /dev/null; then
        wget -q --show-progress -O "$HUGO_BIN" "$HUGO_URL" || {
            echo -e "${RED}❌ 下载失败${NC}"
            exit 1
        }
    else
        echo -e "${RED}❌ 未找到 wget 或 curl${NC}"
        exit 1
    fi

    chmod +x "$HUGO_BIN"

    # 验证
    INSTALLED_VERSION=$("$HUGO_BIN" version 2>/dev/null | head -1 || echo "unknown")
    echo -e "${GREEN}✅ Hugo Extended 下载完成${NC}"
    echo -e "   版本: ${YELLOW}$INSTALLED_VERSION${NC}"
    echo -e "   位置: ${YELLOW}$HUGO_BIN${NC}"
    echo ""
fi

# ====================================================
# 下载 hugo-teek-tools
# ====================================================

TOOLS_BIN="$BIN_DIR/hugo-teek-tools"

if [ -f "$TOOLS_BIN" ]; then
    echo -e "${GREEN}✅ hugo-teek-tools 已存在${NC}"
    EXISTING_TOOLS_VERSION=$("$TOOLS_BIN" --version 2>/dev/null || echo "unknown")
    echo -e "   当前版本: ${YELLOW}$EXISTING_TOOLS_VERSION${NC}"
    echo ""
fi

if [ ! -f "$TOOLS_BIN" ]; then
    echo -e "${BLUE}📥 下载 hugo-teek-tools...${NC}"
    echo -e "   URL: ${YELLOW}$TOOLS_URL${NC}"

    # 下载
    if command -v curl &> /dev/null; then
        curl -L --progress-bar -o "$TOOLS_BIN" "$TOOLS_URL" || {
            echo -e "${RED}❌ 下载失败${NC}"
            exit 1
        }
    elif command -v wget &> /dev/null; then
        wget -q --show-progress -O "$TOOLS_BIN" "$TOOLS_URL" || {
            echo -e "${RED}❌ 下载失败${NC}"
            exit 1
        }
    else
        echo -e "${RED}❌ 未找到 wget 或 curl${NC}"
        exit 1
    fi

    chmod +x "$TOOLS_BIN"

    echo -e "${GREEN}✅ hugo-teek-tools 下载完成${NC}"
    echo -e "   位置: ${YELLOW}$TOOLS_BIN${NC}"
    echo ""
fi

# ====================================================
# 总结
# ====================================================

echo -e "${BLUE}=====================================================${NC}"
echo -e "${GREEN}✅ 工具准备完成！${NC}"
echo -e "${BLUE}=====================================================${NC}"
echo ""
echo -e "API 地址: ${YELLOW}$API_URL${NC}"
echo -e "版本信息: ${YELLOW}$VERSION_INFO${NC}"
echo ""
echo -e "已安装工具:"
if [ -f "$HUGO_BIN" ]; then
    echo -e "  • Hugo:     ${YELLOW}$("$HUGO_BIN" version | head -1)${NC}"
fi
if [ -f "$TOOLS_BIN" ]; then
    TOOLS_VERSION=$("$TOOLS_BIN" --version 2>/dev/null || echo "已安装")
    echo -e "  • hugo-teek-tools: ${YELLOW}$TOOLS_VERSION${NC}"
fi
echo ""
echo -e "工具位置:"
if [ -f "$HUGO_BIN" ]; then
    echo -e "  • ${YELLOW}$HUGO_BIN${NC}"
fi
if [ -f "$TOOLS_BIN" ]; then
    echo -e "  • ${YELLOW}$TOOLS_BIN${NC}"
fi
echo ""
