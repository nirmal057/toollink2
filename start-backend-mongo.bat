@echo off
echo 🚀 Starting ToolLink Backend Server (MongoDB)...
echo ================================================

cd /d "e:\Project 2\ToolLink-MySQL-Backend"
echo Current directory: %CD%

echo.
echo 🔍 Checking files...
if exist "src\app-mongo.js" (
    echo ✅ Found src\app-mongo.js
) else (
    echo ❌ src\app-mongo.js not found
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
echo 🔄 Starting backend server with MongoDB...
echo Server will run on: http://localhost:5001
echo Health check: http://localhost:5001/api/health
echo.

node src\app-mongo.js

pause
