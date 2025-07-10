@echo off
echo =================================================
echo ToolLink Backend - MongoDB Atlas Setup
echo =================================================

echo.
echo 1. Installing dependencies...
call npm install

echo.
echo 2. Testing MongoDB Atlas connection...
call npm run test-atlas

echo.
echo 3. Starting the backend server...
call npm run dev

pause
