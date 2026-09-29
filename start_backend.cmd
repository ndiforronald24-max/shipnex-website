@echo off
cd /d "C:\Users\Falone Mo\Desktop\shipnex-website\backend"
dotnet run --project src\ShipNex.Api\ShipNex.Api.csproj --urls http://localhost:5000
