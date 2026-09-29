@echo off
echo ===================================
echo   ShipNex Dev Server
echo ===================================
echo.
cd /d "c:\Users\Falone Mo\Desktop\shipnex-website"
echo Starting Vite dev server...
echo Open your browser to: http://localhost:5173
echo.
npx vite --host 0.0.0.0 --port 5173
pause
