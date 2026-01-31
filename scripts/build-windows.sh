#!/bin/bash

# Hugo Teek Tools - Windows Binary Build Script
# 编译所有工具为 Windows 64位二进制文件

set -e

# 配置
OUTPUT_DIR="../hugo-teek-binary/win"
TOOLS_DIR="./tools"
GOOS=windows
GOARCH=amd64

# 排除的工具列表（不需要打包到 Windows 的工具）
#EXCLUDE_TOOLS=("remove-coverimg")
EXCLUDE_TOOLS=()

# 自动识别所有包含 main.go 的工具目录
TOOLS=()
echo "🔍 扫描工具目录: ${TOOLS_DIR}"
for dir in "${TOOLS_DIR}"/*; do
    if [ -d "$dir" ]; then
        tool_name=$(basename "$dir")

        # 检查是否在排除列表中
        skip=false
        for exclude in "${EXCLUDE_TOOLS[@]}"; do
            if [ "$tool_name" = "$exclude" ]; then
                skip=true
                echo "  ⏭️  跳过: ${tool_name} (在排除列表中)"
                break
            fi
        done

        if [ "$skip" = false ] && [ -f "$dir/main.go" ]; then
            TOOLS+=("$tool_name")
            echo "  ✓ 发现: ${tool_name}"
        fi
    fi
done

# 对工具列表排序
IFS=$'\n' TOOLS=($(sort <<<"${TOOLS[*]}"))
unset IFS

echo ""
echo "📦 将编译 ${#TOOLS[@]} 个工具:"
for tool in "${TOOLS[@]}"; do
    echo "  - ${tool}"
done
echo ""

# 颜色输出
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}  Hugo Teek Tools - Windows 打包工具${NC}"
echo -e "${BLUE}========================================${NC}"
echo ""

# 创建输出目录
echo -e "${YELLOW}📁 创建输出目录: ${OUTPUT_DIR}${NC}"
mkdir -p "${OUTPUT_DIR}"

# 清理旧的工具文件（只删除工具列表中的文件，保留 hugo.exe 和 pagefind.exe）
echo -e "${YELLOW}🧹 清理旧的工具文件...${NC}"
for tool in "${TOOLS[@]}"; do
    if [ -f "${OUTPUT_DIR}/${tool}.exe" ]; then
        rm -f "${OUTPUT_DIR}/${tool}.exe"
        echo -e "  删除: ${tool}.exe"
    fi
done
# 清理旧的版本文件
rm -f "${OUTPUT_DIR}/VERSION.txt"
rm -f "${OUTPUT_DIR}/README.md"

# 编译每个工具
echo ""
echo -e "${BLUE}🔨 开始编译工具...${NC}"
echo ""

for tool in "${TOOLS[@]}"; do
    tool_path="${TOOLS_DIR}/${tool}"
    output_file="${OUTPUT_DIR}/${tool}.exe"

    if [ ! -d "${tool_path}" ]; then
        echo -e "${RED}❌ 跳过: ${tool} (目录不存在)${NC}"
        continue
    fi

    if [ ! -f "${tool_path}/main.go" ]; then
        echo -e "${RED}❌ 跳过: ${tool} (main.go 不存在)${NC}"
        continue
    fi

    echo -e "${YELLOW}  ⚙️  编译: ${tool}${NC}"

    # 编译
    cd "${tool_path}"
    GOOS=${GOOS} GOARCH=${GOARCH} go build -o "../../${output_file}" -ldflags="-s -w" main.go
    cd - > /dev/null

    if [ -f "${output_file}" ]; then
        file_size=$(du -h "${output_file}" | cut -f1)
        echo -e "${GREEN}  ✅ 完成: ${tool}.exe (${file_size})${NC}"
    else
        echo -e "${RED}  ❌ 失败: ${tool}${NC}"
    fi
    echo ""
done

# 创建版本信息文件
echo -e "${YELLOW}📝 生成版本信息...${NC}"
cat > "${OUTPUT_DIR}/VERSION.txt" << EOF
Hugo Teek Tools - Windows Binary Package
=========================================

Build Date: $(date '+%Y-%m-%d %H:%M:%S')
Go Version: $(go version)
Target: ${GOOS}/${GOARCH}

Included Tools:
EOF

for tool in "${TOOLS[@]}"; do
    if [ -f "${OUTPUT_DIR}/${tool}.exe" ]; then
        echo "  ✓ ${tool}.exe" >> "${OUTPUT_DIR}/VERSION.txt"
    fi
done

cat >> "${OUTPUT_DIR}/VERSION.txt" << EOF

Usage:
------
1. 将所有 .exe 文件复制到项目根目录
2. 在 Windows 命令行或 Git Bash 中运行

Examples:
  frontmatter-fixer.exe
  permalink-gen.exe
  doc-analysis.exe
  index-generator.exe

Note: 运行前请确保在 hugo-teek-site 的父目录中执行
EOF

# 创建 README
echo -e "${YELLOW}📝 生成 README...${NC}"
cat > "${OUTPUT_DIR}/README.md" << 'EOF'
# Hugo Teek Tools - Windows Binaries

这是 Hugo Teek Theme 的 Windows 平台工具集。

## 工具说明

EOF

# 自动生成工具列表说明
tool_num=1
for tool in "${TOOLS[@]}"; do
    if [ -f "${OUTPUT_DIR}/${tool}.exe" ]; then
        echo "### ${tool_num}. ${tool}.exe" >> "${OUTPUT_DIR}/README.md"

        # 根据工具名称添加简要说明
        case "$tool" in
            "frontmatter-fixer")
                echo "修复和补全文章的 Front Matter 元数据。" >> "${OUTPUT_DIR}/README.md"
                ;;
            "permalink-gen")
                echo "为文章生成 SEO 友好的永久链接。" >> "${OUTPUT_DIR}/README.md"
                ;;
            "sidebar-order")
                echo "生成侧边栏排序数据。" >> "${OUTPUT_DIR}/README.md"
                ;;
            "index-generator")
                echo "自动生成分类、标签和归档索引页面。" >> "${OUTPUT_DIR}/README.md"
                ;;
            "doc-analysis")
                echo "分析文档并生成统计数据（字数、阅读时间等）。" >> "${OUTPUT_DIR}/README.md"
                ;;
            "config-server")
                echo "启动配置管理服务器（默认端口 3001）。" >> "${OUTPUT_DIR}/README.md"
                ;;
            "vp-syntax-converter")
                echo "转换 VitePress 容器语法为 Hugo 短代码。" >> "${OUTPUT_DIR}/README.md"
                ;;
            *)
                echo "${tool} 工具。" >> "${OUTPUT_DIR}/README.md"
                ;;
        esac

        echo "" >> "${OUTPUT_DIR}/README.md"
        echo '```bash' >> "${OUTPUT_DIR}/README.md"
        echo "${tool}.exe" >> "${OUTPUT_DIR}/README.md"
        echo '```' >> "${OUTPUT_DIR}/README.md"
        echo "" >> "${OUTPUT_DIR}/README.md"

        ((tool_num++))
    fi
done

cat >> "${OUTPUT_DIR}/README.md" << 'EOF'
## 使用方法

### 方式一：直接使用（推荐）

1. 将所有 `.exe` 文件复制到项目根目录（与 `hugo-teek-site` 同级）
2. 在 Windows 命令行或 Git Bash 中运行相应工具

```bash
# 在项目根目录运行
cd D:\your-path\hugo-teek-theme
.\frontmatter-fixer.exe
.\permalink-gen.exe
```

### 方式二：添加到 PATH

1. 将工具目录添加到系统 PATH 环境变量
2. 在任何位置都可以直接运行

```bash
frontmatter-fixer
permalink-gen
```

## 完整构建流程

如果你想手动执行完整的构建流程（相当于 `make build`）：

```bash
# 1. 修复 Front Matter
.\frontmatter-fixer.exe

# 2. 生成永久链接
.\permalink-gen.exe

# 3. 生成侧边栏排序
.\sidebar-order.exe

# 4. 生成索引页
.\index-generator.exe

# 5. 转换 VitePress 语法
.\vp-syntax-converter.exe

# 6. 生成文档分析数据
.\doc-analysis.exe

# 7. 构建 Hugo 站点
hugo --source=hugo-teek-site --minify

# 8. 生成搜索索引
pagefind --site hugo-teek-site/public --output-subdir _pagefind
```

## 注意事项

- 所有工具必须在项目根目录（包含 `hugo-teek-site` 目录的位置）运行
- 运行前请确保已安装 Hugo 和 Pagefind
- 某些工具会修改文件，建议先备份或使用 Git 版本控制

## 系统要求

- Windows 7 或更高版本
- 64位操作系统
- Hugo Extended v0.150.0+（用于构建站点）
- Pagefind（用于生成搜索索引）

## 故障排除

### 工具无法运行

如果提示"无法识别的应用"或"已被阻止"：

1. 右键点击 `.exe` 文件
2. 选择"属性"
3. 勾选"解除锁定"
4. 点击"确定"

### 权限问题

如果提示权限错误，请以管理员身份运行命令行。

## 更多信息

访问项目主页：https://github.com/your-repo/hugo-teek-theme
EOF

# 统计信息
echo ""
echo -e "${BLUE}========================================${NC}"
echo -e "${GREEN}✅ 打包完成！${NC}"
echo -e "${BLUE}========================================${NC}"
echo ""
echo -e "${YELLOW}输出目录:${NC} ${OUTPUT_DIR}"
echo ""
echo -e "${YELLOW}已生成的文件:${NC}"
ls -lh "${OUTPUT_DIR}" | tail -n +2 | awk '{printf "  %s  %s\n", $5, $9}'
echo ""

# Git 提交和推送
echo -e "${BLUE}========================================${NC}"
echo -e "${CYAN}📤 提交到 Git 仓库${NC}"
echo -e "${BLUE}========================================${NC}"
echo ""

# 检查是否在 Git 仓库中
if [ ! -d "${OUTPUT_DIR}/../.git" ]; then
    echo -e "${RED}❌ 错误: ${OUTPUT_DIR} 不在 Git 仓库中${NC}"
    echo -e "${YELLOW}跳过 Git 提交${NC}"
    echo ""
    echo -e "${GREEN}🎉 所有工具已成功打包！${NC}"
    echo ""
    exit 0
fi

cd "${OUTPUT_DIR}/.."

# 生成提交信息（使用时间）
COMMIT_TIME=$(date '+%Y-%m-%d %H:%M:%S')
COMMIT_MSG="chore: 更新 Windows 工具 ${COMMIT_TIME}"

echo -e "${YELLOW}提交信息:${NC} ${COMMIT_MSG}"
echo ""

# 添加文件
echo -e "${YELLOW}添加文件到 Git...${NC}"
git add win/*.exe win/*.bat win/*.txt win/*.md 2>/dev/null || git add win/

# 提交
echo -e "${YELLOW}创建提交...${NC}"
if git commit -m "${COMMIT_MSG}"; then
    echo -e "${GREEN}✅ 提交成功${NC}"
    echo ""

    # 推送
    echo -e "${YELLOW}推送到远程仓库...${NC}"
    if git push origin master; then
        echo ""
        echo -e "${GREEN}✅ 推送成功！${NC}"
    else
        echo ""
        echo -e "${RED}❌ 推送失败${NC}"
        echo -e "${YELLOW}请手动执行: git push origin master${NC}"
    fi
else
    echo -e "${YELLOW}⚠️  没有变更需要提交${NC}"
fi

cd - > /dev/null

echo ""
echo -e "${GREEN}🎉 所有工具已成功打包并发布！${NC}"
echo ""
