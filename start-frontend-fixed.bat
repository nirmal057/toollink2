@echo off
echo 🎨 Starting ToolLink Frontend...
echo ================================

cd /d "C:\Users\Laptop Island\Desktop\Chivantha\project 2\ToolLink"
echo Current directory: %CD%

echo.
echo 🔍 Checking files...
if exist "package.json" (
    echo ✅ Found package.json
) else (
    echo ❌ package.json not found
    pause
    exit /b 1
)

if exist "index.html" (
    echo ✅ Found index.html
) else (
    echo ❌ index.html not found
    pause
    exit /b 1
)

echo.
echo 🔄 Starting frontend development server...
echo Frontend will run on: http://localhost:5173
echo.
echo Press Ctrl+C to stop the server
echo.

npm run dev

echo.
echo Frontend server stopped.
pause
