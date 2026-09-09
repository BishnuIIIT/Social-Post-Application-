@echo off
title TaskPlanet Social Launcher
echo =======================================================
echo        Starting TaskPlanet Social Application
echo =======================================================
echo.

echo [1/2] Launching Backend API Server (Port 5000)...
start "TaskPlanet Social - Backend" cmd /k "cd /d "%~dp0backend" && node src/server.js"

echo [2/2] Launching Frontend Vite Server (Port 5173)...
start "TaskPlanet Social - Frontend" cmd /k "cd /d "%~dp0frontend" && npm run dev"

echo.
echo Waiting 3 seconds for servers to initialize...
timeout /t 3 >nul

echo Opening application in browser...
start http://localhost:5173

echo.
echo =======================================================
echo Both servers are now running in their own windows!
echo Keep those windows open while using the application.
echo To stop the app, simply close those terminal windows.
echo =======================================================
pause
