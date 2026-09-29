@echo off
title Pahadnama Trails - GitHub Setup
echo ======================================================
echo    Pahadnama Trails - Push Website to GitHub
echo ======================================================
echo.

git --version >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERROR] Git is not detected in your command path.
    echo Please install Git or restart your terminal if newly installed.
    echo Download Git: https://git-scm.com/download/win
    echo.
    pause
    exit /b 1
)

echo [1/4] Initializing Git repository...
if not exist ".git" (
    git init
    git branch -M main
)

echo.
echo [2/4] Adding files and creating initial commit...
git add .
git commit -m "Initial commit - Pahadnama Trails Full Stack Website"

echo.
echo ======================================================
echo [3/4] Enter your GitHub Repository URL
echo (Example: https://github.com/your-username/pahadnama-trails.git)
echo ======================================================
set /p REPO_URL="Repository URL: "

if "%REPO_URL%"=="" (
    echo.
    echo [INFO] No URL entered. Files are committed locally to Git!
    echo You can push later using:
    echo   git remote add origin YOUR_REPO_URL
    echo   git push -u origin main
    echo.
    pause
    exit /b 0
)

echo.
echo [4/4] Setting remote and pushing to GitHub...
git remote remove origin >nul 2>&1
git remote add origin %REPO_URL%
git push -u origin main

echo.
echo ======================================================
echo    SUCCESS! Your website code is now on GitHub!
echo ======================================================
echo.
pause
