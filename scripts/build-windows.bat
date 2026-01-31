@echo off
REM Hugo Teek Tools - Windows Binary Build Script
REM 编译所有工具为 Windows 64位二进制文件

setlocal enabledelayedexpansion

REM 配置
set "OUTPUT_DIR=..\hugo-teek-binary\win"
set "TOOLS_DIR=.\tools"
set "GOOS=windows"
set "GOARCH=amd64"

REM 工具列表（用空格分隔）
set "TOOLS=frontmatter-fixer permalink-gen sidebar-order index-generator vp-syntax-converter doc-analysis config-server"

echo ========================================
echo   Hugo Teek Tools - Windows 打包工具
echo ========================================
echo.

REM 创建输出目录
echo 📁 创建输出目录: %OUTPUT_DIR%
if not exist "%OUTPUT_DIR%" mkdir "%OUTPUT_DIR%"

REM 清理旧的工具文件（只删除工具列表中的文件，保留 hugo.exe 和 pagefind.exe）
echo 🧹 清理旧的工具文件...
for %%T in (%TOOLS%) do (
    if exist "%OUTPUT_DIR%\%%T.exe" (
        del /q "%OUTPUT_DIR%\%%T.exe"
        echo   删除: %%T.exe
    )
)

REM 清理旧的版本文件
if exist "%OUTPUT_DIR%\VERSION.txt" del /q "%OUTPUT_DIR%\VERSION.txt"
if exist "%OUTPUT_DIR%\README.md" del /q "%OUTPUT_DIR%\README.md"

REM 编译每个工具
echo.
echo 🔨 开始编译工具...
echo.

for %%T in (%TOOLS%) do (
    set "tool_path=%TOOLS_DIR%\%%T"
    set "output_file=%OUTPUT_DIR%\%%T.exe"

    if not exist "!tool_path!" (
        echo ❌ 跳过: %%T ^(目录不存在^)
        goto :continue
    )

    if not exist "!tool_path!\main.go" (
        echo ❌ 跳过: %%T ^(main.go 不存在^)
        goto :continue
    )

    echo   ⚙️  编译: %%T

    REM 编译
    pushd "!tool_path!"
    set "GOOS=%GOOS%"
    set "GOARCH=%GOARCH%"
    go build -o "..\..\!output_file!" -ldflags="-s -w" main.go
    popd

    if exist "!output_file!" (
        echo   ✅ 完成: %%T.exe
    ) else (
        echo   ❌ 失败: %%T
    )
    echo.

    :continue
)

REM 创建版本信息文件
echo 📝 生成版本信息...

REM 获取当前日期和时间
for /f "tokens=1-4 delims=/ " %%a in ('date /t') do (
    set "BUILD_DATE=%%a-%%b-%%c"
)
for /f "tokens=1-2 delims=: " %%a in ('time /t') do (
    set "BUILD_TIME=%%a:%%b"
)

REM 获取 Go 版本
for /f "tokens=*" %%g in ('go version') do set "GO_VERSION=%%g"

(
echo Hugo Teek Tools - Windows Binary Package
echo =========================================
echo.
echo Build Date: %BUILD_DATE% %BUILD_TIME%
echo Go Version: %GO_VERSION%
echo Target: %GOOS%/%GOARCH%
echo.
echo Included Tools:
) > "%OUTPUT_DIR%\VERSION.txt"

for %%T in (%TOOLS%) do (
    if exist "%OUTPUT_DIR%\%%T.exe" (
        echo   ✓ %%T.exe >> "%OUTPUT_DIR%\VERSION.txt"
    )
)

(
echo.
echo Usage:
echo ------
echo 1. 将所有 .exe 文件复制到项目根目录
echo 2. 在 Windows 命令行或 Git Bash 中运行
echo.
echo Examples:
echo   frontmatter-fixer.exe
echo   permalink-gen.exe
echo   vp-syntax-converter.exe
echo   doc-analysis.exe
echo   index-generator.exe
echo.
echo Note: 运行前请确保在 hugo-teek-site 的父目录中执行
) >> "%OUTPUT_DIR%\VERSION.txt"

REM 创建 README
echo 📝 生成 README...
(
echo # Hugo Teek Tools - Windows Binaries
echo.
echo 这是 Hugo Teek Theme 的 Windows 平台工具集。
echo.
echo ## 工具说明
echo.
echo ### 1. frontmatter-fixer.exe
echo 修复和补全文章的 Front Matter 元数据。
echo.
echo ```bash
echo frontmatter-fixer.exe
echo ```
echo.
echo ### 2. permalink-gen.exe
echo 为文章生成 SEO 友好的永久链接。
echo.
echo ```bash
echo permalink-gen.exe
echo ```
echo.
echo ### 3. sidebar-order.exe
echo 生成侧边栏排序数据。
echo.
echo ```bash
echo sidebar-order.exe
echo ```
echo.
echo ### 4. index-generator.exe
echo 自动生成分类、标签和归档索引页面。
echo.
echo ```bash
echo index-generator.exe
echo ```
echo.
echo ### 5. vp-syntax-converter.exe
echo 转换 VitePress 容器语法为 Hugo 兼容格式。
echo.
echo ```bash
echo vp-syntax-converter.exe -output hugo-teek-site\.content-vp-converted -content hugo-teek-site\content
echo ```
echo.
echo ### 6. doc-analysis.exe
echo 分析文档并生成统计数据（字数、阅读时间等）。
echo.
echo ```bash
echo doc-analysis.exe
echo ```
echo.
echo ### 7. config-server.exe
echo 启动配置管理服务器（默认端口 3001）。
echo.
echo ```bash
echo config-server.exe
echo ```
echo.
echo ## 使用方法
echo.
echo ### 方式一：直接使用（推荐）
echo.
echo 1. 将所有 `.exe` 文件复制到项目根目录（与 `hugo-teek-site` 同级）
echo 2. 在 Windows 命令行或 Git Bash 中运行相应工具
echo.
echo ```bash
echo # 在项目根目录运行
echo cd D:\your-path\hugo-teeker-theme
echo .\frontmatter-fixer.exe
echo .\permalink-gen.exe
echo ```
echo.
echo ### 方式二：添加到 PATH
echo.
echo 1. 将工具目录添加到系统 PATH 环境变量
echo 2. 在任何位置都可以直接运行
echo.
echo ```bash
echo frontmatter-fixer
echo permalink-gen
echo ```
echo.
echo ## 完整构建流程
echo.
echo 如果你想手动执行完整的构建流程（相当于 `make build`）：
echo.
echo ```bash
echo # 1. 修复 Front Matter
echo .\frontmatter-fixer.exe
echo.
echo # 2. 生成永久链接
echo .\permalink-gen.exe
echo.
echo # 3. 生成侧边栏排序
echo .\sidebar-order.exe
echo.
echo # 4. 生成索引页
echo .\index-generator.exe
echo.
echo # 5. 转换 VitePress 语法
echo .\vp-syntax-converter.exe -output hugo-teek-site\.content-vp-converted -content hugo-teek-site\content
echo.
echo # 6. 生成文档分析数据
echo .\doc-analysis.exe
echo.
echo # 7. 构建 Hugo 站点
echo hugo --source=hugo-teek-site --contentDir=.content-vp-converted --minify
echo.
echo # 8. 生成搜索索引
echo pagefind --site hugo-teek-site/public --output-subdir _pagefind
echo ```
echo.
echo ## 注意事项
echo.
echo - 所有工具必须在项目根目录（包含 `hugo-teek-site` 目录的位置）运行
echo - 运行前请确保已安装 Hugo 和 Pagefind
echo - 某些工具会修改文件，建议先备份或使用 Git 版本控制
echo.
echo ## 系统要求
echo.
echo - Windows 7 或更高版本
echo - 64位操作系统
echo - Hugo Extended v0.150.0+（用于构建站点）
echo - Pagefind（用于生成搜索索引）
echo.
echo ## 故障排除
echo.
echo ### 工具无法运行
echo.
echo 如果提示"无法识别的应用"或"已被阻止"：
echo.
echo 1. 右键点击 `.exe` 文件
echo 2. 选择"属性"
echo 3. 勾选"解除锁定"
echo 4. 点击"确定"
echo.
echo ### 权限问题
echo.
echo 如果提示权限错误，请以管理员身份运行命令行。
echo.
echo ## 更多信息
echo.
echo 访问项目主页：https://github.com/your-repo/hugo-teeker-theme
) > "%OUTPUT_DIR%\README.md"

REM 统计信息
echo.
echo ========================================
echo ✅ 打包完成！
echo ========================================
echo.
echo 输出目录: %OUTPUT_DIR%
echo.
echo 已生成的文件:
dir /b "%OUTPUT_DIR%"
echo.

REM Git 提交和推送
echo ========================================
echo 📤 提交到 Git 仓库
echo ========================================
echo.

REM 检查是否在 Git 仓库中
if not exist "%OUTPUT_DIR%\..\..\.git" (
    echo ❌ 错误: 不在 Git 仓库中
    echo 跳过 Git 提交
    echo.
    echo 🎉 所有工具已成功打包！
    echo.
    goto :end
)

pushd "%OUTPUT_DIR%\.."

REM 生成提交信息（使用时间）
set "COMMIT_MSG=chore: 更新 Windows 工具 %BUILD_DATE% %BUILD_TIME%"

echo 提交信息: %COMMIT_MSG%
echo.

REM 添加文件
echo 添加文件到 Git...
git add win/*.exe win/*.bat win/*.txt win/*.md 2>nul
if errorlevel 1 git add win/

REM 提交
echo 创建提交...
git commit -m "%COMMIT_MSG%"
if errorlevel 1 (
    echo ⚠️  没有变更需要提交
    popd
    goto :end
)

echo ✅ 提交成功
echo.

REM 推送
echo 推送到远程仓库...
git push origin master
if errorlevel 1 (
    echo ❌ 推送失败
    echo 请手动执行: git push origin master
    popd
    goto :end
)

echo ✅ 推送成功！

popd

:end
echo.
echo 🎉 所有工具已成功打包并发布！
echo.

endlocal
