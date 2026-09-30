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
echo === Restore ===
REM Explicit restore step: the local NuGet cache was emptied, so packages must
REM be fetched before building. Keeping it separate means a network failure is
REM reported here instead of surfacing as MSB3106/CS0006 "metadata file could
REM not be found" during compilation.
REM NuGet's HTTP/2 stack stalls on this network ("no data received for 60000ms"
REM while curl fetches the same v3-flatcontainer URL fine), so force HTTP/1.1
REM and serialise requests. --disable-parallel avoids one stalled stream
REM blocking the whole restore.
set DOTNET_SYSTEM_NET_HTTP_SOCKETSHTTPHANDLER_HTTP2SUPPORT=0
set DOTNET_SYSTEM_NET_HTTP_SOCKETSHTTPHANDLER_HTTP2FLOWCONTROL_DISABLED=1
dotnet restore ShipNex.sln --disable-parallel || exit /b 1
echo === Build ===
REM Build never re-restores, so a slow/unreachable feed cannot stall compilation.
dotnet build ShipNex.sln -c Release --no-restore || exit /b 1
echo === Application tests ===
dotnet test tests\ShipNex.Application.Tests\ShipNex.Application.Tests.csproj -c Release --no-build || exit /b 1
echo === API tests ===
dotnet test tests\ShipNex.Api.Tests\ShipNex.Api.Tests.csproj -c Release --no-build || exit /b 1
echo ALL_TESTS_DONE
exit /b 0
