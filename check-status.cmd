@echo off
echo ========================================
echo  ShipNex - Status Check
echo ========================================
echo.

echo Backend: http://localhost:5000/health
curl -s -m 5 http://localhost:5000/health > NUL 2>&1
if %errorlevel% equ 0 (
    echo   [OK] Backend is RUNNING
) else (
    echo   [X]  Backend is DOWN
)

echo Frontend: http://localhost:5173
curl -s -m 5 http://localhost:5173 > NUL 2>&1
if %errorlevel% equ 0 (
    echo   [OK] Frontend is RUNNING
) else (
    echo   [X]  Frontend is DOWN
)

echo.
echo Testing login API...
echo {"email":"admin@shipnex.com","password":"admin123"} > %TEMP%\login_test.json
curl -s -m 5 -X POST http://localhost:5000/api/auth/login -H "Content-Type: application/json" -d @%TEMP%\login_test.json
echo.
echo.
pause