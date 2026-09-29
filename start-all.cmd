@echo off
echo ========================================
echo  ShipNex - Start All Services
echo ========================================
echo.

echo [1/2] Starting Backend on port 5000...
start "ShipNex-Backend" cmd /k "cd /d C:\Users\Falone Mo\Desktop\shipnex-website\backend\src\ShipNex.Api && set ASPNETCORE_URLS=http://localhost:5000 && set ASPNETCORE_ENVIRONMENT=Development && dotnet run --urls http://localhost:5000"

echo [2/2] Starting Frontend on port 5173...
start "ShipNex-Frontend" cmd /k "cd /d C:\Users\Falone Mo\Desktop\shipnex-website && set PATH=%PATH%;C:\Program Files\nodejs && npm run dev"

echo.
echo Both services starting in separate windows...
echo Backend:  http://localhost:5000
echo Frontend: http://localhost:5173
echo.
echo Done!
pause