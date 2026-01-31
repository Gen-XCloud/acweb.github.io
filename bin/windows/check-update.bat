@echo off
REM ====================================================
REM Hugo Teek Tools - Check for Updates Only
REM ====================================================

setlocal enabledelayedexpansion

set "API_URL=https://download.xxdevops.cn/list"
set "BIN_DIR=bin\windows"

REM Navigate to project root
set SCRIPT_DIR=%~dp0
cd /d "%SCRIPT_DIR%..\..\"

echo.
echo ====================================================
echo Hugo Teek Tools - Version Check
echo ====================================================
echo.

REM ====================================================
REM Fetch remote version from API
REM ====================================================

set "TEMP_JSON=%TEMP%\download-list-%RANDOM%.json"
set "REMOTE_VERSION="
set "TOOLS_DOWNLOAD_URL="

echo [*] Checking latest version from API...
curl -sL -o "%TEMP_JSON%" "%API_URL%" 2>nul
if exist "%TEMP_JSON%" (
    REM Parse JSON using PowerShell
    for /f "delims=" %%i in ('powershell -NoProfile -Command "$json = Get-Content '%TEMP_JSON%' | ConvertFrom-Json; $json.'hugo-teek-tools'.win.'hugo-teek-tools.exe'"') do set "TOOLS_DOWNLOAD_URL=%%i"
    for /f "delims=" %%i in ('powershell -NoProfile -Command "$json = Get-Content '%TEMP_JSON%' | ConvertFrom-Json; $json.'hugo-teek-tools'.version"') do set "VERSION_STRING=%%i"

    REM Extract version number from "hugo-teek-tools version 1.59 (commit: ...)"
    for /f "tokens=3" %%b in ("!VERSION_STRING!") do (
        set "REMOTE_VERSION=%%b"
    )

    del "%TEMP_JSON%" 2>nul
)

if not defined REMOTE_VERSION (
    echo [ERROR] Cannot fetch remote version from server
    echo.
    echo Please check your internet connection and try again.
    echo.
    pause
    exit /b 1
)

REM ====================================================
REM Check local version
REM ====================================================

set "TOOL_PATH=%BIN_DIR%\hugo-teek-tools.exe"
set "LOCAL_VERSION="

if not exist "%TOOL_PATH%" (
    echo.
    echo ====================================================
    echo ⚠️  TOOLS NOT INSTALLED
    echo ====================================================
    echo hugo-teek-tools.exe not found in %BIN_DIR%
    echo.
    echo Please run 'start.bat' to install the tools.
    echo ====================================================
    echo.
    pause
    exit /b 1
)

REM Get local version
for /f "tokens=3" %%v in ('"%TOOL_PATH%" --version 2^>^&1') do (
    if not defined LOCAL_VERSION set "LOCAL_VERSION=%%v"
)

if not defined LOCAL_VERSION (
    echo [ERROR] Cannot determine local version
    echo.
    pause
    exit /b 1
)

REM ====================================================
REM Compare versions
REM ====================================================

echo.
echo Current version: %LOCAL_VERSION%
echo Latest version:  %REMOTE_VERSION%
echo.

if "%LOCAL_VERSION%" NEQ "%REMOTE_VERSION%" (
    echo ====================================================
    echo 🎉 NEW VERSION AVAILABLE!
    echo ====================================================
    echo.
    echo A new version of hugo-teek-tools is available.
    echo.
    echo To update, run:
    echo   bin\windows\start.bat --force
    echo.
    echo Or download manually from:
    echo   %TOOLS_DOWNLOAD_URL%
    echo ====================================================
) else (
    echo ====================================================
    echo ✅ YOU ARE UP TO DATE!
    echo ====================================================
    echo.
    echo You are using the latest version of hugo-teek-tools.
    echo ====================================================
)

echo.
pause
exit /b 0
