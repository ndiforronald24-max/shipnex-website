@echo off
echo Building...
dotnet build ShipNex.sln --verbosity minimal
if %errorlevel% neq 0 (
    echo BUILD FAILED!
    exit /b 1
)
echo BUILD SUCCESS!
echo.
cd src\ShipNex.Api
set ASPNETCORE_URLS=http://localhost:5000
set ASPNETCORE_ENVIRONMENT=Development
echo Starting backend...
dotnet run --urls "http://localhost:5000" --no-build