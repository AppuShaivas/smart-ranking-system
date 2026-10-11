@echo off
title Smart Achievement Ranking System
rem ---- Double-click this file to start the website ----
cd /d "%~dp0"

rem If this file was saved inside the server or client folder, step up to the main folder
if not exist "server\" if exist "..\server\" cd ..

if not exist "server\.env" (
  echo.
  echo  [X] Could not find server\.env
  echo      This file is running from: %CD%
  echo      Move start-website.bat into the main project folder,
  echo      the one that contains package.json, client and server.
  echo.
  pause
  exit /b
)

if not exist "node_modules" (
  echo  First run on this PC - installing packages, please wait a few minutes...
  call npm run setup
)

echo.
echo  Starting the website from %CD%
echo  Your browser will open in a few seconds.
echo  KEEP THIS WINDOW OPEN while you use the site. Close it or press Ctrl+C to stop.
echo.
start "" /b cmd /c "timeout /t 10 /nobreak >nul & start http://localhost:5173"
call npm run dev
pause