@echo off
echo 🚀 Starting ToolLink Backend Server...
echo =====================================

cd /d "C:\Users\Laptop Island\Desktop\Chivantha\project 2\ToolinkBackend"
echo Current directory: %CD%

echo.
echo 🔍 Checking files...
if exist "src\app.js" (
    echo ✅ Found src\app.js
) else (
    echo ❌ src\app.js not found
    pause
    exit /b 1
)

if exist "package.json" (
    echo ✅ Found package.json
) else (
    echo ❌ package.json not found
    pause
    exit /b 1
)

echo.
echo 🔄 Starting backend server...
echo Server will run on: http://localhost:5000
echo Health check: http://localhost:5000/api/health
echo.
echo Press Ctrl+C to stop the server
echo.

node src/app.js

echo.
echo Server stopped.
pause
