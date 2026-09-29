@echo off
cd /d "C:\Users\Falone Mo\Desktop\shipnex-website\backend"
echo === APPLIB TEST RUN STARTED %date% %time% === > applib_tests_run2.log
dotnet restore tests\ShipNex.Application.Tests\ShipNex.Application.Tests.csproj >> applib_tests_run2.log 2>&1
dotnet test tests\ShipNex.Application.Tests\ShipNex.Application.Tests.csproj --no-restore >> applib_tests_run2.log 2>&1
echo === EXITCODE=%errorlevel% %date% %time% === >> applib_tests_run2.log
