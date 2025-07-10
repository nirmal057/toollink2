@echo off
echo Starting ToolLink Backend Server...
echo.

cd /d "c:\Users\Laptop Island\Desktop\Chivantha\project 2\ToolinkBackend"

echo Checking if node_modules exists...
if not exist "node_modules" (
    echo Installing dependencies...
    npm install
)

echo.
echo Starting the server...
echo Backend will be available at: http://localhost:5000
echo API Health check: http://localhost:5000/api/health
echo.
echo Press Ctrl+C to stop the server
echo.

node src\app.js
