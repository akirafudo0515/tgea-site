@echo off
cd /d "%~dp0"
where node >nul 2>nul
if errorlevel 1 (
  echo 請先安裝 Node.js：https://nodejs.org
  pause
  exit /b 1
)
if not exist node_modules\express call npm install
start "" cmd /c "timeout /t 2 /nobreak >nul & start http://127.0.0.1:3780/admin/"
node server.js
pause
