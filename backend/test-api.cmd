@echo off
echo Starting ShipNex API...
cd /d "C:\\Users\\Falone Mo\\Desktop\\shipnex-website\\backend\\src\\ShipNex.Api"
start /B dotnet bin\Release\net8.0\ShipNex.Api.dll --environment Development --urls http://localhost:5000 > api_test.log 2>&1

echo Waiting for server to start...
timeout /t 15 /nobreak >nul

echo Testing health endpoint...
curl -s http://localhost:5000/health
echo.

echo Testing login endpoint...
curl -s -X POST http://localhost:5000/api/auth/login -H "Content-Type: application/json" -d "{\"email\":\"admin@shipnex.com\",\"password\":\"admin123\"}"
echo.

echo Testing offices endpoint...
curl -s http://localhost:5000/api/offices
echo.

echo Stopping server...
taskkill /F /IM dotnet.exe /T >nul 2>&1

echo === TEST COMPLETE ===
