@echo off
cd /d "C:\Users\Falone Mo\Desktop\shipnex-website\backend"
echo === BACKEND STARTED %date% %time% === > backend_run.log
dotnet run --project src\ShipNex.Api\ShipNex.Api.csproj --urls http://localhost:5000 >> backend_run.log 2>&1
echo === BACKEND EXITED %errorlevel% %date% %time% === >> backend_run.log
