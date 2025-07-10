@echo off
echo 🚀 Starting ToolLink System...
echo ===============================

echo.
echo 📍 Current Directory: %CD%
echo.

echo 🔄 Starting Backend Server...
cd ToolinkBackend
echo 📂 Changed to: %CD%

echo.
echo 🎯 Starting Node.js Backend Server...
echo 📡 Server will run on: http://localhost:5000
echo 🔍 Health Check: http://localhost:5000/api/health
echo.
echo ⏳ Starting server (this may take a few seconds)...
echo.

node src/app.js

pause
