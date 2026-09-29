@echo off
cd /d "C:\Users\Falone Mo\Desktop\shipnex-website\backend"
set LOG="C:\Users\Falone Mo\Desktop\dnx-test.log"
if exist %LOG% del %LOG%
echo === TEST RUN START %date% %time% === >> %LOG%

echo --- Killing leftover build processes --- >> %LOG%
taskkill /F /IM VBCSCompiler.exe >nul 2>&1
taskkill /F /IM MSBuild.exe >nul 2>&1
taskkill /F /IM MSBuildServer.exe >nul 2>&1
taskkill /F /IM testhost.exe >nul 2>&1
taskkill /F /IM dotnet.exe >nul 2>&1
timeout /t 5 /nobreak >nul

set COMPLUS_gcServer=0
set COMPLUS_TieredCompilation=0
set DOTNET_TieredPGO=0
set DOTNET_CLI_TELEMETRY_OPTOUT=1
set DOTNET_NOLOGO=1
set MSBUILDDISABLENODEREUSE=1
set DOTNET_CLI_DO_NOT_USE_MSBUILD_SERVER=1
set DOTNET_EnableWriteXorExecute=0

echo --- Running dotnet test (builds + runs) --- >> %LOG%
dotnet test tests\ShipNex.Api.Tests\ShipNex.Api.Tests.csproj --verbosity minimal -m:1 --disable-build-servers -p:UseSharedCompilation=false >> %LOG% 2>&1
echo TEST_RUN exit=%errorlevel% >> %LOG%
echo === TEST RUN END %date% %time% === >> %LOG%