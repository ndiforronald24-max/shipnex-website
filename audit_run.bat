@echo off
cd /d "C:\Users\Falone Mo\Desktop\shipnex-website"
del audit_e2e_report.txt audit_e2e_data.json audit_run.status audit_all_done.status audit_browser.status audit_dom_home.html audit_dom_track.html 2>nul

echo [1/5] starting vite dev server...
start "vite" /b cmd /c "npm run dev > dev_run.log 2>&1"

echo [2/5] starting backend API (Development, InMemory + seeder)...
set ASPNETCORE_ENVIRONMENT=Development
pushd "C:\Users\Falone Mo\Desktop\shipnex-website\backend\src\ShipNex.Api"
start "shipnex-api" /b cmd /c "dotnet bin\Release\net8.0\ShipNex.Api.dll --urls http://localhost:5000 > C:\Users\Falone Mo\Desktop\shipnex-website\api_run.log 2>&1"
popd

echo [3/5] waiting for both servers...
set /a tries=0
:waitloop
  timeout /t 5 /nobreak > nul
  set /a tries+=1
  curl -s -o nul http://localhost:5000/health
  if not errorlevel 1 goto healthok
  if %tries% lss 10 goto waitloop
  echo API did not become healthy in time
:healthok
  curl -s -o nul http://localhost:5173/
  if errorlevel 1 ( echo VITE not healthy ) else ( echo vite healthy )

echo [3b/5] running E2E HTTP audit...
node audit_e2e.cjs > audit_e2e_console.txt 2>&1
echo E2E_DONE > audit_run.status

echo [4/5] headless browser DOM check...
set WV=
for /d %%D in ("C:\Program Files (x86)\Microsoft\EdgeWebView\Application\*") do set "WV=%%~fD\msedgewebview2.exe"
if not defined WV for /d %%D in ("C:\Program Files\Microsoft\EdgeWebView\Application\*") do set "WV=%%~fD\msedgewebview2.exe"
if exist "%WV%" (
  echo FOUND %WV% > audit_browser.status
  "%WV%" --headless=new --disable-gpu --no-sandbox --virtual-time-budget=9000 --dump-dom http://localhost:5173/ > audit_dom_home.html 2> audit_dom_home.err
  "%WV%" --headless=new --disable-gpu --no-sandbox --virtual-time-budget=9000 --dump-dom http://localhost:5173/track > audit_dom_track.html 2> audit_dom_track.err
  echo BROWSER_ATTEMPTED >> audit_browser.status
) else (
  echo NO_BROWSER_FOUND > audit_browser.status
)

echo [5/5] stopping servers...
taskkill /F /IM dotnet.exe > audit_kill.txt 2>&1
taskkill /F /IM node.exe >> audit_kill.txt 2>&1
echo ALL_DONE > audit_all_done.status
