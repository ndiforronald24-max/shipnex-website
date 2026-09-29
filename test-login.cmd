@echo off
echo ================================
echo  Test Login Endpoint
echo ================================
echo.

echo Testing login with admin@shipnex.com...
echo.

curl -s -X POST http://localhost:5000/api/auth/login ^
  -H "Content-Type: application/json" ^
  -d "{\"email\":\"admin@shipnex.com\",\"password\":\"admin123\"}"

echo.
echo.
pause