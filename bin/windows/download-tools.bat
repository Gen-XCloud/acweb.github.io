@echo off
REM ====================================================
REM Hugo Teek Tools - 自动下载必需工具 (Windows)
REM ====================================================
REM 下载 Hugo Extended 和 hugo-teek-tools 到 bin\windows\
REM ====================================================

REM 设置控制台编码为 UTF-8，解决中文乱码问题
chcp 65001 >nul 2>&1

setlocal enabledelayedexpansion

REM ====================================================
REM 配置区域 - 根据需要修改以下配置
REM ====================================================

REM API 地址 - 获取最新下载链接
if not defined API_URL set API_URL=https://download.xxdevops.cn/list

REM ====================================================
REM 以下为脚本内部逻辑，一般无需修改
REM ====================================================

REM 获取脚本所在目录（bin\windows）
set "BIN_DIR=%~dp0"
set "BIN_DIR=%BIN_DIR:~0,-1%"

REM 创建目录（如果不存在）
if not exist "%BIN_DIR%" mkdir "%BIN_DIR%"

echo =====================================================
echo Hugo Teek Tools - 下载必需工具 (Windows)
echo =====================================================
echo.

REM ====================================================
REM 从 API 获取下载链接
REM ====================================================

echo [34m从 API 获取最新下载链接...[0m
echo    API: %API_URL%
echo.

REM 使用 PowerShell 获取 JSON 数据并解析
for /f "delims=" %%i in ('curl -s "%API_URL%"') do set "JSON_DATA=%%i"

if "%JSON_DATA%"=="" (
    echo [31m✗ API 请求失败[0m
    exit /b 1
)

REM 使用 PowerShell 解析 JSON
for /f "delims=" %%i in ('powershell -NoProfile -Command "$json = '%JSON_DATA%' ^| ConvertFrom-Json; $json.'hugo-teek-tools'.win.'hugo.exe'"') do set "HUGO_URL=%%i"
for /f "delims=" %%i in ('powershell -NoProfile -Command "$json = '%JSON_DATA%' ^| ConvertFrom-Json; $json.'hugo-teek-tools'.win.'hugo-teek-tools.exe'"') do set "TOOLS_URL=%%i"
for /f "delims=" %%i in ('powershell -NoProfile -Command "$json = '%JSON_DATA%' ^| ConvertFrom-Json; $json.'hugo-teek-tools'.version"') do set "VERSION_INFO=%%i"

if "%HUGO_URL%"=="" (
    echo [31m✗ 无法从 API 获取 Hugo 下载链接[0m
    exit /b 1
)

if "%TOOLS_URL%"=="" (
    echo [31m✗ 无法从 API 获取 hugo-teek-tools 下载链接[0m
    exit /b 1
)

echo [32m✓ 获取成功[0m
echo    版本: %VERSION_INFO%
echo.

REM ====================================================
REM 下载 Hugo Extended
REM ====================================================

set "HUGO_BIN=%BIN_DIR%\hugo.exe"

if exist "%HUGO_BIN%" (
    echo [32m✓ Hugo 已存在[0m
    for /f "tokens=*" %%i in ('"%HUGO_BIN%" version 2^>nul') do set EXISTING_VERSION=%%i
    echo    当前版本: !EXISTING_VERSION!
    echo.
) else (
    echo [34m下载 Hugo Extended...[0m
    echo    URL: %HUGO_URL%
    echo.
    echo    开始下载 Hugo...
    echo    ┌────────────────────────────────────────────────────────┐
    echo    │ URL: %HUGO_URL%
    echo    └────────────────────────────────────────────────────────┘
    echo.
    curl -L --progress-bar -o "%HUGO_BIN%" "%HUGO_URL%" || (
        echo [31m✗ 下载失败[0m
        exit /b 1
    )

    echo.
    echo [32m✓ Hugo Extended 下载完成[0m

    REM 显示版本和文件大小
    for /f "tokens=*" %%i in ('"%HUGO_BIN%" version 2^>nul') do set INSTALLED_VERSION=%%i
    echo    版本: !INSTALLED_VERSION!

    for %%A in ("%HUGO_BIN%") do (
        set /a "SIZE_MB=%%~zA / 1048576"
        echo    大小: !SIZE_MB! MB
    )
    echo    位置: %HUGO_BIN%
    echo.
)

REM ====================================================
REM 下载 hugo-teek-tools
REM ====================================================

set "TOOLS_BIN=%BIN_DIR%\hugo-teek-tools.exe"

if exist "%TOOLS_BIN%" (
    echo [32m✓ hugo-teek-tools 已存在[0m
    echo    位置: %TOOLS_BIN%
    echo.
) else (
    echo [34m下载 hugo-teek-tools...[0m
    echo.
    echo    开始下载 hugo-teek-tools...
    echo    ┌────────────────────────────────────────────────────────┐
    echo    │ URL: %TOOLS_URL%
    echo    └────────────────────────────────────────────────────────┘
    echo.
    curl -L --progress-bar -o "%TOOLS_BIN%" "%TOOLS_URL%" || (
        echo [31m✗ 下载失败[0m
        exit /b 1
    )
    echo.
    echo [32m✓ hugo-teek-tools 下载完成[0m

    REM 显示文件大小
    for %%A in ("%TOOLS_BIN%") do (
        set /a "SIZE_MB=%%~zA / 1048576"
        echo    大小: !SIZE_MB! MB
    )
    echo    位置: %TOOLS_BIN%
    echo.
)

REM ====================================================
REM 总结
REM ====================================================

echo =====================================================
echo [32m✓ 工具准备完成！[0m
echo =====================================================
echo.
echo API 地址: %API_URL%
echo 版本信息: %VERSION_INFO%
echo.
echo 已安装工具:
if exist "%HUGO_BIN%" (
    for /f "tokens=*" %%i in ('"%HUGO_BIN%" version 2^>nul') do echo   • Hugo: %%i
)
if exist "%TOOLS_BIN%" (
    echo   • hugo-teek-tools: 已安装
)
echo.
echo 工具位置:
if exist "%HUGO_BIN%" echo   • %HUGO_BIN%
if exist "%TOOLS_BIN%" echo   • %TOOLS_BIN%
echo.

endlocal
