@echo off
cd /d %~dp0src\ShipNex.Api
set ASPNETCORE_URLS=http://localhost:5000
set ASPNETCORE_ENVIRONMENT=Development
dotnet run --urls "http://localhost:5000"