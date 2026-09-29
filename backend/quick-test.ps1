$baseUrl = "http://localhost:5000"

Write-Host "=== ShipNex API Test Results ===" -ForegroundColor Cyan

# Test 1: Health
Write-Host "`n1. Health Check:" -ForegroundColor Yellow
try {
    $r = Invoke-WebRequest -Uri "$baseUrl/health" -TimeoutSec 5 -UseBasicParsing
    Write-Host "   Status: $($r.StatusCode) - SUCCESS" -ForegroundColor Green
} catch {
    Write Host "   FAILED: $($_.Exception.Message)" -ForegroundColor Red
}

# Test 2: Offices
Write-Host "`n2. Offices API:" -ForegroundColor Yellow
try {
    $r = Invoke-WebRequest -Uri "$baseUrl/api/offices" -TimeoutSec 5 -UseBasicParsing
    $data = $r.Content | ConvertFrom-Json
    Write-Host "   Status: $($r.StatusCode) - SUCCESS" -ForegroundColor Green
    Write-Host "   Count: $($data.Count) offices" -ForegroundColor White
} catch {
    Write-Host "   FAILED: $($_.Exception.Message)" -ForegroundColor Red
}

# Test 3: Login
Write-Host "`n3. Login API:" -ForegroundColor Yellow
try {
    $body = '{"email":"admin@shipnex.com","password":"admin123"}'
    $r = Invoke-WebRequest -Uri "$baseUrl/api/auth/login" -Method POST -ContentType "application/json" -Body $body -TimeoutSec 5 -UseBasicParsing
    $data = $r.Content | ConvertFrom-Json
    Write-Host "   Status: $($r.StatusCode) - SUCCESS" -ForegroundColor Green
    Write-Host "   Token: $($data.token.Substring(0, 20))..." -ForegroundColor White
    Write-Host "   Role: $($data.role)" -ForegroundColor White
} catch {
    Write-Host "   FAILED: $($_.Exception.Message)" -ForegroundColor Red
}

# Test 4: Shipments (with auth)
Write-Host "`n4. Shipments API:" -ForegroundColor Yellow
try {
    $body = '{"email":"admin@shipnex.com","password":"admin123"}'
    $login = Invoke-WebRequest -Uri "$baseUrl/api/auth/login" -Method POST -ContentType "application/json" -Body $body -TimeoutSec 5 -UseBasicParsing
    $token = ($login.Content | ConvertFrom-Json).token
    $headers = @{ Authorization = "Bearer $token" }
    $r = Invoke-WebRequest -Uri "$baseUrl/api/shipments" -Headers $headers -TimeoutSec 5 -UseBasicParsing
    $data = $r.Content | ConvertFrom-Json
    Write-Host "   Status: $($r.StatusCode) - SUCCESS" -ForegroundColor Green
    Write-Host "   Count: $($data.Count) shipments" -ForegroundColor White
} catch {
    Write-Host "   FAILED: $($_.Exception.Message)" -ForegroundColor Red
}

# Test 5: Tracking
Write-Host "`n5. Tracking API:" -ForegroundColor Yellow
try {
    $r = Invoke-WebRequest -Uri "$baseUrl/api/tracking/USP-2026-000001" -TimeoutSec 5 -UseBasicParsing
    Write-Host "   Status: $($r.StatusCode) - SUCCESS" -ForegroundColor Green
} catch {
    Write-Host "   Response: $($_.Exception.Message)" -ForegroundColor White
}

Write-Host "`n=== Test Complete ===" -ForegroundColor Cyan
