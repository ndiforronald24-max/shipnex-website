@echo off
echo ================================
echo  ShipNex Backend Launcher
echo ================================
echo.

cd /d "%~dp0backend\src\ShipNex.Api"

echo Starting ShipNex API on http://localhost:5000 ...
echo.
echo Press Ctrl+C to stop the server.
echo.

set ASPNETCORE_URLS=http://localhost:5000
set ASPNETCORE_ENVIRONMENT=Development
dotnet run --project ShipNex.Api.csproj --urls "http://localhost:5000"

pause