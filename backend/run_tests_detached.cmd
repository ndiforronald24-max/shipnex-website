@echo off
cd /d "C:\Users\Falone Mo\Desktop\shipnex-website\backend"
echo === DETACHED TEST RUN STARTED %date% %time% === > detached_test.log
echo === BUILDING === >> detached_test.log
dotnet build tests\ShipNex.Api.Tests\ShipNex.Api.Tests.csproj >> detached_test.log 2>&1
echo === BUILD EXITCODE=%ERRORLEVEL% === >> detached_test.log
if not "%ERRORLEVEL%"=="0" goto :end
dotnet test tests\ShipNex.Api.Tests\ShipNex.Api.Tests.csproj --no-build --logger "console;verbosity=normal" >> detached_test.log 2>&1
:end
echo === EXITCODE=%ERRORLEVEL% %date% %time% === >> detached_test.log
