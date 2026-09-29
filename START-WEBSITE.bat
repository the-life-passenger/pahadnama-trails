@echo off
TITLE Pahadnama Trails - Production Server
color 0A

echo ==========================================================
echo        PAHADNAMA TRAILS - SAHYADRI ADVENTURES
echo ==========================================================
echo.
echo Checking Node.js runtime...
node -v >nul 2>&1
if %errorlevel% neq 0 (
  echo [ERROR] Node.js is not found! Please install Node.js from https://nodejs.org
  pause
  exit /b 1
)

echo Starting Pahadnama Trails Server...
echo Database: SQLite (pahadnama.db)
echo Port: 3000
echo.

if not exist "pahadnama.db" (
  echo Initializing database seed...
  node seed.js
)

start http://localhost:3000
node server.js
pause
