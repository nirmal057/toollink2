@echo off
title ToolLink Backend Server
color 0A

echo.
echo ╔══════════════════════════════════════╗
echo ║        ToolLink Backend Server       ║
echo ╚══════════════════════════════════════╝
echo.

echo 🔍 Stopping any existing backend processes on port 5000...
for /f "tokens=5" %%a in ('netstat -aon ^| findstr :5000 ^| findstr LISTENING') do (
    echo    Killing process %%a
    taskkill /f /pid %%a 2>nul
)

echo ✅ Port 5000 cleared

REM Check if backend directory exists
if not exist "ToolinkBackend" (
    echo ❌ Error: ToolinkBackend directory not found!
    echo    Please make sure you're running this from the project root.
    pause
    exit /b 1
)

echo 📁 Changing to ToolinkBackend directory...
cd /d "ToolinkBackend"

echo 🔍 Checking required files...
if not exist "package.json" (
    echo ❌ package.json not found!
    pause
    exit /b 1
)

if not exist "src\app.js" (
    echo ❌ src\app.js not found!
    pause
    exit /b 1
)

echo ✅ All required files found

echo.
echo 🚀 Starting ToolLink Backend Server...
echo ════════════════════════════════════════
echo 📡 Server URL: http://localhost:5000
echo ❤️  Health Check: http://localhost:5000/api/health
echo 🛑 Press Ctrl+C to stop the server
echo ════════════════════════════════════════
echo.

npm start

echo.
echo 🛑 Server stopped.
pause
