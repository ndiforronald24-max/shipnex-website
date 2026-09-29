@echo off
cd /d "C:\\Users\\Falone Mo\\Desktop\\shipnex-website\\backend"
echo === Building ShipNex Backend ===
echo Started: %date% %time%
echo.

echo --- Restoring packages...
dotnet restore src\ShipNex.Api\ShipNex.Api.csproj --verbosity minimal
echo Restore exit: %errorlevel%
echo.

echo --- Building...
dotnet build src\ShipNex.Api\ShipNex.Api.csproj -c Release --no-restore --verbosity minimal
echo Build exit: %errorlevel%
echo.

echo --- Running tests...
dotnet test tests\ShipNex.Api.Tests\ShipNex.Api.Tests.csproj --no-build --verbosity minimal -m:1
echo Test exit: %errorlevel%
echo.

echo Finished: %date% %time%
echo === Build Complete ===
pause
