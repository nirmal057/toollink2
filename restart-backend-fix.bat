@echo off
echo ============================================
echo    ToolLink Backend - Clean Restart
echo ============================================
echo.

echo 🛑 Stopping any running backend processes...
taskkill /F /IM node.exe 2>nul
timeout /t 2 /nobreak >nul

echo.
echo 🔧 Fixing database schema...
cd /d "c:\Users\Laptop Island\Desktop\Chivantha\project 2"
node fix-backend-database.js

echo.
echo 🚀 Starting backend server...
cd /d "c:\Users\Laptop Island\Desktop\Chivantha\project 2\ToolinkBackend"

if not exist "node_modules" (
    echo 📦 Installing dependencies...
    npm install
)

echo.
echo ✅ Backend starting on http://localhost:5000
echo 📊 Health check: http://localhost:5000/api/health
echo 📋 API docs: http://localhost:5000/api
echo.
echo Press Ctrl+C to stop the server
echo.

node src\app.js
