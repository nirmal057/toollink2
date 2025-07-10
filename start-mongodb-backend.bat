@echo off
echo 🚀 Starting ToolLink MongoDB Backend...
echo =====================================

cd /d "e:\Project 2\ToolLink-MySQL-Backend"
echo Current directory: %CD%

echo.
echo 🔍 Checking MongoDB backend file...
if exist "mongodb-backend.js" (
    echo ✅ Found mongodb-backend.js
) else (
    echo ❌ mongodb-backend.js not found
    pause
    exit /b 1
)

echo.
echo 🔄 Starting MongoDB backend server...
echo Server will run on: http://localhost:5001
echo.

node mongodb-backend.js

pause
