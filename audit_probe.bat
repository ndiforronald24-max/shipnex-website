@echo off
cd /d "C:\Users\Falone Mo\Desktop\shipnex-website"
del audit_routes.txt audit_api.txt audit_probe.status 2>nul
echo === FRONTEND ROUTES (vite dev :5173) === > audit_routes.txt
for %%R in ( / /about /services /services/air-freight /services/sea-freight /services/road-freight /services/express-shipping /services/vehicle-shipping /services/pet-live-animal /track /track/pet /offices /faqs /contact /privacy /terms /login /register /admin /admin/shipments /admin/customers /admin/pet-shipments /admin/documents /admin/notifications /admin/offices /admin/audit-logs /admin/settings /no-such-page ) do (
  curl -s -o nul -w "%%R -> %%{http_code}\n" http://localhost:5173%%R >> audit_routes.txt
)
echo === STATIC ASSETS === >> audit_routes.txt
curl -s -o nul -w "favicon.svg -> %%{http_code}\n" http://localhost:5173/favicon.svg >> audit_routes.txt
curl -s -o nul -w "icons.svg -> %%{http_code}\n" http://localhost:5173/icons.svg >> audit_routes.txt
curl -s -o nul -w "branding/site.webmanifest -> %%{http_code}\n" http://localhost:5173/branding/site.webmanifest >> audit_routes.txt
curl -s -o nul -w "branding/shipnex-icon.png -> %%{http_code}\n" http://localhost:5173/branding/shipnex-icon.png >> audit_routes.txt

set ASPNETCORE_ENVIRONMENT=Development
start "shipnex-api" /b cmd /c "dotnet backend\src\ShipNex.Api\bin\Release\net8.0\ShipNex.Api.dll --urls http://localhost:5000 --contentroot C:\Users\Falone Mo\Desktop\shipnex-website\backend\src\ShipNex.Api > api_run.log 2>&1"
timeout /t 35 /nobreak > nul

echo === BACKEND API (dev :5000) === > audit_api.txt
curl -s -o nul -w "health -> %%{http_code}\n" http://localhost:5000/health >> audit_api.txt
echo --- CORS preflight from localhost:5173 (OPTIONS /api/auth/login) --- >> audit_api.txt
curl -s -D - -o nul -X OPTIONS http://localhost:5000/api/auth/login -H "Origin: http://localhost:5173" -H "Access-Control-Request-Method: POST" -H "Access-Control-Request-Headers: content-type" >> audit_api.txt 2>&1
echo --- CORS preflight from https://shipnex.com (control) --- >> audit_api.txt
curl -s -D - -o nul -X OPTIONS http://localhost:5000/api/auth/login -H "Origin: https://shipnex.com" -H "Access-Control-Request-Method: POST" -H "Access-Control-Request-Headers: content-type" >> audit_api.txt 2>&1
echo PROBE_DONE > audit_probe.status
