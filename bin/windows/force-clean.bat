@echo off
REM ====================================================
REM Hugo Teek - Force Clean (Deep Clean)
REM ====================================================
REM 强制清理所有缓存和构建文件
REM 用于解决 CSS 更新不生效等缓存问题
REM ====================================================

REM 设置控制台编码为 UTF-8，解决中文乱码问题
chcp 65001 >nul 2>&1

setlocal

REM Navigate to project root
set SCRIPT_DIR=%~dp0
cd /d "%SCRIPT_DIR%..\.."
if errorlevel 1 (
    echo [ERROR] Cannot change to project root directory
    pause
    exit /b 1
)
set ROOT_DIR=%CD%

echo ====================================================
echo Hugo Teek - Force Clean (Deep Clean)
echo ====================================================
echo Project directory: %ROOT_DIR%
echo.
echo This will delete:
echo   - hugo-teek-site\public\
echo   - hugo-teek-site\resources\
echo   - hugo-teek-site\.content-vp-converted\
echo   - hugo-teek-site\.hugo_build.lock
echo   - Dynamically generated config files
echo.
pause

echo.
echo ====================================================
echo Cleaning Build Files...
echo ====================================================
echo.

REM Clean using hugo-teek-tools
if exist "bin\windows\hugo-teek-tools.exe" (
    echo Running hugo-teek-tools clean...
    bin\windows\hugo-teek-tools.exe clean
    echo.
) else (
    echo [WARNING] hugo-teek-tools.exe not found, using manual cleanup
    echo.
)

REM Additional manual cleanup
echo Performing deep clean...

REM Remove public directory
if exist "hugo-teek-site\public" (
    echo Removing public\...
    rd /s /q "hugo-teek-site\public" 2>nul
    if exist "hugo-teek-site\public" (
        echo [WARNING] Failed to remove public directory
    ) else (
        echo [OK] public\ removed
    )
)

REM Remove resources directory (Hugo SCSS cache)
if exist "hugo-teek-site\resources" (
    echo Removing resources\...
    rd /s /q "hugo-teek-site\resources" 2>nul
    if exist "hugo-teek-site\resources" (
        echo [WARNING] Failed to remove resources directory
    ) else (
        echo [OK] resources\ removed
    )
)

REM Remove converted content directory
if exist "hugo-teek-site\.content-vp-converted" (
    echo Removing .content-vp-converted\...
    rd /s /q "hugo-teek-site\.content-vp-converted" 2>nul
    if exist "hugo-teek-site\.content-vp-converted" (
        echo [WARNING] Failed to remove .content-vp-converted directory
    ) else (
        echo [OK] .content-vp-converted\ removed
    )
)

REM Remove Hugo build lock
if exist "hugo-teek-site\.hugo_build.lock" (
    echo Removing .hugo_build.lock...
    del /f /q "hugo-teek-site\.hugo_build.lock" 2>nul
    echo [OK] .hugo_build.lock removed
)

REM Remove dynamic config files
echo Removing dynamic config files...
del /f /q "hugo-teek-site\config\_default\params.toml" 2>nul
del /f /q "hugo-teek-site\config\_default\menus.toml" 2>nul
del /f /q "hugo-teek-site\config\_default\module.toml" 2>nul
del /f /q "hugo-teek-site\config\_default\content.toml" 2>nul
del /f /q "hugo-teek-site\config\_default\teektools.toml" 2>nul

echo.
echo ====================================================
echo Clean Complete!
echo ====================================================
echo.
echo All cache and build files have been removed.
echo You can now run start.bat to rebuild from scratch.
echo.
pause
endlocal
