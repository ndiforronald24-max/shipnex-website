@echo off
REM Runs the full ShipNex backend test suite in Release and writes _testrun.log
REM next to this script.
REM Launch it fully detached, e.g. from PowerShell:
REM   Start-Process cmd -ArgumentList '/c','run_tests.cmd' -WindowStyle Hidden
REM A plain 'start /b' shares this console and the run is killed as soon as the
REM invoking terminal closes.
REM NOTE: the two test projects must run SERIALLY - concurrent dotnet test
REM runs in this workspace overwrite each other's build/log output.
setlocal
cd /d "%~dp0"
call :main > _testrun.log 2>&1
echo EXIT=%ERRORLEVEL%>> _testrun.log
exit /b %ERRORLEVEL%

:main
cd /d "%~dp0backend"
echo === Build ===
dotnet build ShipNex.sln -c Release || exit /b 1
echo === Application tests ===
dotnet test tests\ShipNex.Application.Tests\ShipNex.Application.Tests.csproj -c Release --no-build || exit /b 1
echo === API tests ===
dotnet test tests\ShipNex.Api.Tests\ShipNex.Api.Tests.csproj -c Release --no-build || exit /b 1
echo ALL_TESTS_DONE
exit /b 0
