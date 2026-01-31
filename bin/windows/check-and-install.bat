@echo off
REM ====================================================
REM Hugo Teek Tools - Auto Download with Version Check
REM ====================================================

REM 设置控制台编码为 UTF-8，解决中文乱码问题
chcp 65001 >nul 2>&1

setlocal enabledelayedexpansion

set "API_URL=https://download.xxdevops.cn/list"
set "BIN_DIR=bin\windows"
set "FORCE_UPDATE="

REM Check for --force flag
if "%~1"=="--force" set "FORCE_UPDATE=1"

REM Navigate to project root
set SCRIPT_DIR=%~dp0
cd /d "%SCRIPT_DIR%..\..\"

REM Create bin directory if not exists
if not exist "%BIN_DIR%" mkdir "%BIN_DIR%"

echo ====================================================
echo Hugo Teek Tools - Checking for Updates
echo ====================================================
echo.

REM ====================================================
REM Fetch download URLs and version from API
REM ====================================================

set "TEMP_JSON=%TEMP%\download-list-%RANDOM%.json"
set "REMOTE_VERSION="
set "HUGO_DOWNLOAD_URL="
set "TOOLS_DOWNLOAD_URL="

echo [*] Fetching latest download URLs from API...
curl -sL -o "%TEMP_JSON%" "%API_URL%" 2>nul
if exist "%TEMP_JSON%" (
    REM Parse JSON using PowerShell
    for /f "delims=" %%i in ('powershell -NoProfile -Command "$json = Get-Content '%TEMP_JSON%' | ConvertFrom-Json; $json.'hugo-teek-tools'.win.'hugo.exe'"') do set "HUGO_DOWNLOAD_URL=%%i"
    for /f "delims=" %%i in ('powershell -NoProfile -Command "$json = Get-Content '%TEMP_JSON%' | ConvertFrom-Json; $json.'hugo-teek-tools'.win.'hugo-teek-tools.exe'"') do set "TOOLS_DOWNLOAD_URL=%%i"
    for /f "delims=" %%i in ('powershell -NoProfile -Command "$json = Get-Content '%TEMP_JSON%' | ConvertFrom-Json; $json.'hugo-teek-tools'.version"') do set "VERSION_STRING=%%i"

    REM Extract version number from "hugo-teek-tools version 1.59 (commit: ...)"
    for /f "tokens=3" %%b in ("!VERSION_STRING!") do (
        set "REMOTE_VERSION=%%b"
    )

    del "%TEMP_JSON%" 2>nul
)

if defined REMOTE_VERSION (
    echo [OK] Remote version: %REMOTE_VERSION%
) else (
    echo [ERROR] Could not fetch download URLs from API
    exit /b 1
)

if not defined HUGO_DOWNLOAD_URL (
    echo [ERROR] Could not get Hugo download URL
    exit /b 1
)

if not defined TOOLS_DOWNLOAD_URL (
    echo [ERROR] Could not get hugo-teek-tools download URL
    exit /b 1
)

echo.

REM ====================================================
REM Check and update hugo-teek-tools.exe
REM ====================================================

set "TOOL_PATH=%BIN_DIR%\hugo-teek-tools.exe"
set "NEED_DOWNLOAD="

if exist "%TOOL_PATH%" (
    if defined FORCE_UPDATE (
        echo [*] Force update enabled, will re-download hugo-teek-tools.exe
        set "NEED_DOWNLOAD=1"
        del "%TOOL_PATH%" 2>nul
    ) else if defined REMOTE_VERSION (
        REM Get local version
        REM Format: hugo-teek-tools version 2.0 (commit: ...)
        set "LOCAL_VERSION="
        for /f "tokens=3" %%v in ('"%TOOL_PATH%" --version 2^>^&1') do (
            if not defined LOCAL_VERSION set "LOCAL_VERSION=%%v"
        )

        if defined LOCAL_VERSION (
            echo [*] Local version: !LOCAL_VERSION!
            echo [*] Remote version: %REMOTE_VERSION%

            REM Compare versions (simple string comparison)
            if "!LOCAL_VERSION!" NEQ "%REMOTE_VERSION%" (
                echo.
                echo ====================================================
                echo 🎉 NEW VERSION AVAILABLE!
                echo ====================================================
                echo Current version: !LOCAL_VERSION!
                echo Latest version:  %REMOTE_VERSION%
                echo.
                echo Auto-updating hugo-teek-tools.exe...
                echo ====================================================
                echo.
                set "NEED_DOWNLOAD=1"
                del "%TOOL_PATH%" 2>nul
            ) else (
                echo [OK] hugo-teek-tools.exe is up to date
            )
        ) else (
            echo [WARN] Could not get local version, keeping existing file
        )
    ) else (
        echo [OK] hugo-teek-tools.exe exists
    )
) else (
    echo [*] hugo-teek-tools.exe not found
    set "NEED_DOWNLOAD=1"
)

if defined NEED_DOWNLOAD (
    echo [*] Downloading hugo-teek-tools.exe...
    echo.
    echo    +----------------------------------------------------------+
    echo    ^| URL: %TOOLS_DOWNLOAD_URL%
    echo    +----------------------------------------------------------+
    echo.
    curl -L --progress-bar -o "%TOOL_PATH%" "%TOOLS_DOWNLOAD_URL%" 2>nul
    if exist "%TOOL_PATH%" (
        for %%A in ("%TOOL_PATH%") do (
            if %%~zA GTR 10240 (
                echo.
                echo ====================================================
                echo ✅ UPDATE SUCCESSFUL
                echo ====================================================
                echo hugo-teek-tools.exe updated to version %REMOTE_VERSION%

                REM 显示文件大小
                set /a "SIZE_MB=%%~zA / 1048576"
                echo File size: !SIZE_MB! MB
                echo ====================================================
                echo.
            ) else (
                echo [ERROR] Download failed or file too small
                del "%TOOL_PATH%" 2>nul
                exit /b 1
            )
        )
    ) else (
        echo [ERROR] Download failed
        exit /b 1
    )
)

echo.

REM ====================================================
REM Check and download hugo.exe
REM ====================================================

set "HUGO_PATH=%BIN_DIR%\hugo.exe"

if not exist "%HUGO_PATH%" (
    echo [*] Downloading hugo.exe...
    echo.
    echo    +----------------------------------------------------------+
    echo    ^| URL: %HUGO_DOWNLOAD_URL%
    echo    +----------------------------------------------------------+
    echo.
    curl -L --progress-bar -o "%HUGO_PATH%" "%HUGO_DOWNLOAD_URL%" 2>nul
    if exist "%HUGO_PATH%" (
        for %%A in ("%HUGO_PATH%") do (
            if %%~zA GTR 1048576 (
                echo.
                echo [OK] hugo.exe downloaded

                REM 显示文件大小
                set /a "SIZE_MB=%%~zA / 1048576"
                echo      File size: !SIZE_MB! MB
            ) else (
                echo [ERROR] Download failed or file too small
                del "%HUGO_PATH%" 2>nul
                exit /b 1
            )
        )
    ) else (
        echo [ERROR] Download failed
        exit /b 1
    )
) else (
    echo [OK] hugo.exe exists
)

echo.

echo.
echo ====================================================
echo [OK] All tools ready
echo ====================================================

REM Display final version
if exist "%TOOL_PATH%" (
    echo.
    echo Installed version:
    "%TOOL_PATH%" --version 2>nul
)

exit /b 0
