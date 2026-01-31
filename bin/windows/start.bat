@echo off
REM ====================================================
REM Hugo Teek - Development Server
REM ====================================================

REM 设置控制台编码为 UTF-8，解决中文乱码问题
chcp 65001 >nul 2>&1

setlocal

REM Navigate to project root
set SCRIPT_DIR=%~dp0
cd /d "%SCRIPT_DIR%..\..\"
if errorlevel 1 (
    echo [ERROR] Cannot change to project root directory
    echo Script location: %SCRIPT_DIR%
    echo Current directory: %CD%
    pause
    exit /b 1
)
set ROOT_DIR=%CD%

echo ====================================================
echo Hugo Teek - Development Server
echo ====================================================
echo Project directory: %ROOT_DIR%
echo.

REM ====================================================
REM Detect Theme from hugo.toml
REM ====================================================
REM Auto-detect theme (similar to Makefile behavior)
set THEME=
for /f "tokens=2 delims== " %%a in ('findstr /r "^theme *= *" hugo-teek-site\config\_default\hugo.toml 2^>nul') do (
    set THEME=%%a
)
REM Remove quotes from theme name
set THEME=%THEME:"=%
REM Fallback to default if not found
if "%THEME%"=="" set THEME=hugo-teek

echo Detected theme: %THEME%
echo.

REM Check and install tools (pass through any arguments like --force)
call "%SCRIPT_DIR%check-and-install.bat" %*
if errorlevel 1 (
    echo.
    echo [ERROR] Tool check failed
    pause
    exit /b 1
)

REM Initialize environment variables
echo.
echo Initializing environment variables...
call "%SCRIPT_DIR%init-env.bat"
if errorlevel 1 (
    echo [WARNING] Environment initialization failed, continuing anyway...
    echo.
)

REM Verify hugo.toml exists
if not exist "hugo-teek-site\hugo.toml" (
    echo.
    echo [ERROR] Configuration file not found: hugo-teek-site\hugo.toml
    echo This is the main configuration file for Hugo Teek.
    pause
    exit /b 1
)

echo.
echo ====================================================
echo Clean Old Files
echo ====================================================
echo.

bin\windows\hugo-teek-tools.exe clean

REM Clean auto-generated sidebar data
echo Cleaning auto-generated sidebar data...
if exist "hugo-teek-site\data\sidebar" rmdir /s /q "hugo-teek-site\data\sidebar"
if exist "hugo-teek-site\static\data\sidebar" rmdir /s /q "hugo-teek-site\static\data\sidebar"

echo.
echo ====================================================
echo Merge Configurations
echo ====================================================
echo.

REM Merge Configurations
echo [0/6] Merge Configurations...
bin\windows\hugo-teek-tools.exe config merge

echo.
echo ====================================================
echo Generate Data
echo ==================================================== Fix Front Matter
echo [1/6] Fix Front Matter...
bin\windows\hugo-teek-tools.exe frontmatter

REM Generate Permalink
echo [2/6] Generate Permalink...
bin\windows\hugo-teek-tools.exe permalink

REM Generate Index Pages (MUST before sidebar!)
echo [3/6] Generate Index Pages...
bin\windows\hugo-teek-tools.exe index

REM Generate Sidebar Order
echo [4/6] Generate Sidebar Order...
bin\windows\hugo-teek-tools.exe sidebar

REM Copy sidebar data to static directory
echo [4.5/6] Copy sidebar data to static...
if not exist "hugo-teek-site\static\data\sidebar" mkdir "hugo-teek-site\static\data\sidebar"
if exist "hugo-teek-site\data\sidebar" (
    xcopy /E /I /Y /Q "hugo-teek-site\data\sidebar" "hugo-teek-site\static\data\sidebar" >nul 2>&1
    echo Sidebar data copied to static directory
)
echo.

REM VitePress Syntax Conversion
echo [5/6] VitePress Syntax Conversion...
bin\windows\hugo-teek-tools.exe convert

REM Document Analysis
echo [6/6] Document Analysis...
bin\windows\hugo-teek-tools.exe analysis

echo.
echo ====================================================
echo Build Site for Search Index
echo ====================================================
echo.

REM Build site to generate HTML files for Pagefind indexing
echo Building site...
bin\windows\hugo.exe --environment=%THEME% --source=hugo-teek-site --contentDir=.content-vp-converted --minify
if errorlevel 1 (
    echo.
    echo [WARNING] Hugo build failed, search may not work properly
    echo Continuing anyway...
    echo.
)

echo.
echo ====================================================
echo FlexSearch index already generated
echo ====================================================
echo.
echo FlexSearch index was generated during data generation phase
echo No additional indexing step needed
echo.

echo.
echo ====================================================
echo Start Development Server
echo ====================================================
echo.
echo Access URL: http://localhost:8080
echo.
echo 💡 如需管理后台，请运行: bin\windows\start-admin.bat
echo.
echo Press Ctrl+C to stop server
echo.

bin\windows\hugo.exe server --environment=%THEME% --source=hugo-teek-site --contentDir=.content-vp-converted --bind=0.0.0.0 --port=8080 --buildDrafts --logLevel info
if errorlevel 1 (
    echo.
    echo [ERROR] Hugo server failed to start
    pause
    exit /b 1
)

echo.
echo Server stopped
pause
endlocal
