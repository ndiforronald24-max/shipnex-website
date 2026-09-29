@echo off
echo ================================
echo  Restart ShipNex Backend
echo ================================
echo.

echo [1/3] Stopping existing backend...
taskkill /F /IM dotnet.exe /FI "WINDOWTITLE eq*ShipNex*" >nul 2>&1
timeout /t 2 /nobreak >nul

echo [2/3] Building backend...
cd /d "C:\Users\Falone Mo\Desktop\shipnex-website\backend\src\ShipNex.Api"
dotnet build --verbosity quiet
if %errorlevel% neq 0 (
    echo BUILD FAILED!
    pause
    exit /b 1
)
echo Build successful!

echo [3/3] Starting backend...
echo API will be available at http://localhost:5000
echo.
set ASPNETCORE_URLS=http://localhost:5000
set ASPNETCORE_ENVIRONMENT=Development
start "ShipNex API" dotnet run --urls "http://localhost:5000" --no-build

echo.
echo Backend started in a new window.
pause