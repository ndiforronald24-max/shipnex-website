@echo off
title ShipNex Dev Server
color 0B
echo ============================================
echo    SHIPNEX DEV SERVER
echo ============================================
echo.
echo   Starting Vite development server...
echo   Open browser to: http://localhost:5173
echo.
echo   Press Ctrl+C to stop the server
echo ============================================
echo.
cd /d "%~dp0"
npx vite --host 0.0.0.0 --port 5173
