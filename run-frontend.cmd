@echo off
echo ================================
echo  ShipNex Frontend Launcher
echo ================================
echo.

cd /d "%~dp0"

REM Fix PATH for Node.js if not already available
where node >nul 2>nul
if %errorlevel% neq 0 (
    echo Adding Node.js to PATH...
    set "PATH=%PATH%;C:\Program Files\nodejs"
)

echo Starting ShipNex Frontend on http://localhost:5173 ...
echo.
echo Press Ctrl+C to stop the server.
echo.

npm run dev

pause