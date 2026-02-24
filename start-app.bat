@echo off
setlocal
title SmartPost AI Startup
cls

echo ========================================
echo       SmartPost AI - Quick Start
echo ========================================
echo.

:: Check for Node.js
where node >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERROR] Node.js is not installed! 
    echo Please install it from: https://nodejs.org/
    pause
    exit /b
)

echo [1/3] Checking dependencies...
if not exist node_modules (
    echo      node_modules not found. Installing now...
    call npm install
) else (
    echo      Dependencies look good.
)

echo.
echo [2/3] Starting servers...
echo      (This window MUST stay open while you use the app)
echo.

:: Auto-open browser after 8 seconds
start /b cmd /c "timeout /t 8 >nul && start http://localhost:5173"

:: Start the app
call npm start

echo.
echo [3/3] Application stopped.
pause
