@echo off
REM ====================================================
REM Hugo Teek - Admin Server (Development Mode)
REM ====================================================
REM Starts both backend and frontend development servers
REM ====================================================

setlocal

REM Navigate to project root
set SCRIPT_DIR=%~dp0
cd /d "%SCRIPT_DIR%..\..\"
if errorlevel 1 (
    echo [ERROR] Cannot change to project root directory
    pause
    exit /b 1
)
set ROOT_DIR=%CD%

echo ====================================================
echo Hugo Teek - Admin Server
echo ====================================================
echo Project directory: %ROOT_DIR%
echo.

REM Initialize environment variables
echo Initializing environment...
call "%SCRIPT_DIR%init-env.bat"
if errorlevel 1 (
    echo [ERROR] Environment initialization failed
    pause
    exit /b 1
)

echo.
echo ====================================================
echo Check Dependencies
echo ====================================================
echo.

REM Check if hugo-teek-tools.exe exists
if not exist "%SCRIPT_DIR%hugo-teek-tools.exe" (
    echo [WARNING] hugo-teek-tools.exe not found
    echo [INFO] Auto-downloading required tools...
    echo.
    call "%SCRIPT_DIR%check-and-install.bat"
    if errorlevel 1 (
        echo [ERROR] Failed to download hugo-teek-tools.exe
        echo.
        echo Please manually download from:
        echo https://download.xxdevops.cn/dist/hugo-teek-tools/win/
        pause
        exit /b 1
    )
    echo.
)

echo [OK] hugo-teek-tools.exe found
echo.

REM Check if Node.js is installed
where node >nul 2>nul
if errorlevel 1 (
    echo [ERROR] Node.js is not installed or not in PATH
    echo Please install Node.js from https://nodejs.org/
    pause
    exit /b 1
)

echo [OK] Node.js found:
node --version

REM Check if npm is installed
where npm >nul 2>nul
if errorlevel 1 (
    echo [ERROR] npm is not installed or not in PATH
    pause
    exit /b 1
)

echo [OK] npm found:
npm --version

echo.
echo ====================================================
echo Install Frontend Dependencies
echo ====================================================
echo.

if not exist "admin-frontend\node_modules" (
    echo Installing frontend dependencies...
    cd admin-frontend
    call npm install
    if errorlevel 1 (
        echo [ERROR] Failed to install frontend dependencies
        cd ..
        pause
        exit /b 1
    )
    cd ..
    echo [OK] Frontend dependencies installed
) else (
    echo [OK] Frontend dependencies already installed
)

echo.
echo ====================================================
echo Starting Backend Server
echo ====================================================
echo.

REM Start backend in a new window (non-blocking)
echo Starting backend on port %HUGO_TEEK_PORT%...
start "Hugo Teek Backend" /min cmd /c "cd /d "%ROOT_DIR%" && "%SCRIPT_DIR%hugo-teek-tools.exe" server --port %HUGO_TEEK_PORT% --mode %HUGO_TEEK_MODE%"

REM Wait for backend to start
echo Waiting for backend to start...
timeout /t 3 /nobreak >nul

echo [OK] Backend started: http://localhost:%HUGO_TEEK_PORT%
echo.

echo ====================================================
echo Starting Frontend Development Server
echo ====================================================
echo.
echo Frontend URL: http://localhost:5173/admin
echo Backend API: http://localhost:%HUGO_TEEK_PORT%
echo.
echo Press Ctrl+C to stop both servers
echo.

REM Start frontend (blocking)
cd admin-frontend
call npm run dev

REM Cleanup on exit
echo.
echo Stopping servers...

REM Kill backend server
for /f "tokens=5" %%a in ('netstat -aon ^| findstr :%HUGO_TEEK_PORT% ^| findstr LISTENING') do (
    echo Killing backend process %%a...
    taskkill /F /PID %%a >nul 2>nul
)

echo [OK] Servers stopped
pause
endlocal
