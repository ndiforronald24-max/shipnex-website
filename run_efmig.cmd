@echo off
REM Generates the initial EF Core migration for PostgreSQL and writes _efmig.log.
REM Launch detached, e.g. from PowerShell:
REM   Start-Process cmd -ArgumentList '/c','run_efmig.cmd' -WindowStyle Hidden
setlocal
cd /d "%~dp0"
call :main > _efmig.log 2>&1
echo EXIT=%ERRORLEVEL%>> _efmig.log
exit /b %ERRORLEVEL%

:main
cd /d "%~dp0backend"
echo === Build Infrastructure ===
dotnet build src\ShipNex.Infrastructure\ShipNex.Infrastructure.csproj -c Release || exit /b 1
echo === migrations add InitialCreate ===
dotnet ef migrations add InitialCreate --project src\ShipNex.Infrastructure --output-dir Migrations || exit /b 1
echo MIGRATION_DONE
exit /b 0