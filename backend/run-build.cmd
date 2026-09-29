@echo off
cd /d "C:\\Users\\Falone Mo\\Desktop\\shipnex-website\\backend"
echo Starting build at %date% %time% > build_output.log
dotnet build src\ShipNex.Api\ShipNex.Api.csproj -c Release --verbosity minimal >> build_output.log 2>&1
echo Build exit: %errorlevel% >> build_output.log
echo Finished at %date% %time% >> build_output.log
