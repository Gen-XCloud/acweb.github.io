@echo off
REM ====================================================
REM Hugo Teek - Environment Initialization
REM ====================================================
REM Purpose:
REM 1. Create .env from .env.example if not exists
REM 2. Auto-detect project root and replace __PROJECT_ROOT__
REM 3. Set all environment variables for current session
REM ====================================================

REM 设置控制台编码为 UTF-8，解决中文乱码问题
chcp 65001 >nul 2>&1

setlocal enabledelayedexpansion

REM Get script directory and navigate to project root
set SCRIPT_DIR=%~dp0
cd /d "%SCRIPT_DIR%..\..\"
if errorlevel 1 (
    echo [ERROR] Cannot navigate to project root
    exit /b 1
)

set PROJECT_ROOT=%CD%
echo Project Root: %PROJECT_ROOT%
echo.

set ENV_FILE=%PROJECT_ROOT%\.env
set ENV_EXAMPLE=%PROJECT_ROOT%\.env.example

REM Check if .env.example exists
if not exist "%ENV_EXAMPLE%" (
    echo [ERROR] .env.example file not found
    exit /b 1
)

REM Create .env from .env.example if it doesn't exist
if not exist "%ENV_FILE%" (
    echo Creating .env file...

    REM Read .env.example and replace __PROJECT_ROOT__
    (for /f "usebackq delims=" %%a in ("%ENV_EXAMPLE%") do (
        set "line=%%a"
        set "line=!line:__PROJECT_ROOT__=%PROJECT_ROOT%!"
        echo !line!
    )) > "%ENV_FILE%"

    echo [OK] .env file created and configured
    echo.
) else (
    echo [OK] .env file already exists
    echo.
)

REM Load environment variables from .env
echo Loading environment variables...
echo.

REM 第一次遍历：读取所有变量的原始值（不展开）
for /f "usebackq tokens=1,* delims==" %%a in ("%ENV_FILE%") do (
    set "line=%%a"
    REM 跳过注释和空行
    if not "!line:~0,1!"=="#" if not "!line!"=="" (
        set "%%a=%%b"
    )
)

REM 第二次遍历：展开所有变量引用（${VAR} -> %VAR%）
for /f "usebackq tokens=1,* delims==" %%a in ("%ENV_FILE%") do (
    set "line=%%a"
    if not "!line:~0,1!"=="#" if not "!line!"=="" (
        set "var=%%a"
        set "val=%%b"

        REM 替换路径分隔符（/ -> \）
        set "val=!val:/=\!"

        REM 展开 ${HUGO_TEEK_BASE_DIR}
        call set "val=%%val:${HUGO_TEEK_BASE_DIR}=%HUGO_TEEK_BASE_DIR%%%"
        call set "val=%%val:${HUGO_TEEK_SITE_DIR}=%HUGO_TEEK_SITE_DIR%%%"
        call set "val=%%val:${HUGO_TEEK_DATA_DIR}=%HUGO_TEEK_DATA_DIR%%%"
        call set "val=%%val:${HUGO_TEEK_STATIC_DIR}=%HUGO_TEEK_STATIC_DIR%%%"
        call set "val=%%val:${HUGO_TEEK_CONTENT_DIR}=%HUGO_TEEK_CONTENT_DIR%%%"

        REM 更新变量
        set "!var!=!val!"
    )
)

echo Key Configuration:
echo   BASE_DIR: %HUGO_TEEK_BASE_DIR%
echo   DATA_DIR: %HUGO_TEEK_DATA_DIR%
echo   STATIC_DIR: %HUGO_TEEK_STATIC_DIR%
echo   GALLERY_DATA: %GALLERY_DATA_FILE%
echo   ALBUMS_DATA: %ALBUMS_DATA_FILE%
echo   PORT: %HUGO_TEEK_PORT%
echo.

REM Verify key directories exist
echo Verifying directories...

if not exist "%HUGO_TEEK_DATA_DIR%" (
    echo [WARNING] Data directory does not exist, creating: %HUGO_TEEK_DATA_DIR%
    mkdir "%HUGO_TEEK_DATA_DIR%"
)

if not exist "%GALLERY_UPLOAD_DIR%" (
    echo [WARNING] Upload directory does not exist, creating: %GALLERY_UPLOAD_DIR%
    mkdir "%GALLERY_UPLOAD_DIR%"
)

echo [OK] Environment initialization complete
echo.

endlocal & (
    set "HUGO_TEEK_BASE_DIR=%HUGO_TEEK_BASE_DIR%"
    set "HUGO_TEEK_SITE_DIR=%HUGO_TEEK_SITE_DIR%"
    set "HUGO_TEEK_DATA_DIR=%HUGO_TEEK_DATA_DIR%"
    set "HUGO_TEEK_STATIC_DIR=%HUGO_TEEK_STATIC_DIR%"
    set "HUGO_TEEK_CONTENT_DIR=%HUGO_TEEK_CONTENT_DIR%"
    set "HUGO_TEEK_CONFIG=%HUGO_TEEK_CONFIG%"
    set "HUGO_TEEK_PORT=%HUGO_TEEK_PORT%"
    set "HUGO_TEEK_HOST=%HUGO_TEEK_HOST%"
    set "HUGO_TEEK_MODE=%HUGO_TEEK_MODE%"
    set "GALLERY_DATA_FILE=%GALLERY_DATA_FILE%"
    set "ALBUMS_DATA_FILE=%ALBUMS_DATA_FILE%"
    set "GALLERY_UPLOAD_DIR=%GALLERY_UPLOAD_DIR%"
    set "IMAGE_CONVERT_ENABLED=%IMAGE_CONVERT_ENABLED%"
    set "IMAGE_CONVERT_QUALITY=%IMAGE_CONVERT_QUALITY%"
    set "MENU_DATA_FILE=%MENU_DATA_FILE%"
)

exit /b 0
