@echo off
echo 🎨 Starting ToolLink Frontend...
echo ===============================

echo.
echo 📍 Current Directory: %CD%
echo.

echo 🔄 Starting Frontend Development Server...
cd ToolLink
echo 📂 Changed to: %CD%

echo.
echo 🎯 Starting Vite Development Server...
echo 🌐 Frontend will run on: http://localhost:5173
echo 🔧 Using Vite for hot reload and development
echo.
echo ⏳ Starting development server (this may take a few seconds)...
echo.

npm run dev

pause
