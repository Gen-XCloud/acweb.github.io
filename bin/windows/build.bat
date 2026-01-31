@echo off
REM ====================================================
REM Hugo Teek - Production Build
REM ====================================================

setlocal

REM Navigate to project root
set SCRIPT_DIR=%~dp0
cd /d "%SCRIPT_DIR%..\..\"
set ROOT_DIR=%CD%

echo ====================================================
echo Hugo Teek - Production Build
echo ====================================================
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

REM Check and install tools
call "%SCRIPT_DIR%check-and-install.bat"
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

echo ====================================================
echo Execute Build Process
echo ====================================================
echo.

REM Clean old files first
echo [*] Cleaning old files...
bin\windows\hugo-teek-tools.exe clean
if errorlevel 1 (
    echo.
    echo [WARNING] Clean failed, continuing anyway...
    echo.
)

REM Execute full build process
echo [*] Merging configurations...
bin\windows\hugo-teek-tools.exe config merge
if errorlevel 1 (
    echo.
    echo [ERROR] Config merge failed
    pause
    exit /b 1
)

echo [*] Executing build pipeline...
bin\windows\hugo-teek-tools.exe build
if errorlevel 1 (
    echo.
    echo [ERROR] Build process failed
    pause
    exit /b 1
)

echo.
echo [*] Copying sidebar data to static...
if not exist "hugo-teek-site\static\data\sidebar" mkdir "hugo-teek-site\static\data\sidebar"
if exist "hugo-teek-site\data\sidebar" (
    xcopy /E /I /Y /Q "hugo-teek-site\data\sidebar" "hugo-teek-site\static\data\sidebar" >nul 2>&1
    echo Sidebar data copied to static directory
)

echo.
echo ====================================================
echo Build Site
echo ====================================================
echo.

bin\windows\hugo.exe --environment=%THEME% --source=hugo-teek-site --contentDir=.content-vp-converted --minify
if errorlevel 1 (
    echo [ERROR] Site build failed
    pause
    exit /b 1
)

echo.
echo [*] Cleaning legacy data files...
if exist "hugo-teek-site\public\data\sidebarOrder.json" (
    del /Q "hugo-teek-site\public\data\sidebarOrder.json"
    echo Removed legacy sidebarOrder.json ^(863KB^)
)

echo.
echo ====================================================
echo FlexSearch index already generated
echo ====================================================
echo FlexSearch index was generated during data generation phase
echo.

echo.
echo ====================================================
echo Build Complete!
echo ====================================================
echo.
echo Output directory: hugo-teek-site\public
echo.
pause
