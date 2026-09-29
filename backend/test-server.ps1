$output = @()

# Start the server
$serverPath = "C:\Users\Falone Mo\Desktop\shipnex-website\backend\src\ShipNex.Api"
$exePath = "$serverPath\bin\Release\net8.0\ShipNex.Api.dll"

$output += "Starting ShipNex API..."
$process = Start-Process -FilePath "dotnet" -ArgumentList $exePath, "--environment", "Development", "--urls", "http://localhost:5000" -PassThru -WindowStyle Hidden -WorkingDirectory $serverPath

# Wait for server to start
$output += "Waiting for server to start..."
Start-Sleep -Seconds 15

# Test health endpoint
try {
    $response = Invoke-WebRequest -Uri "http://localhost:5000/health" -TimeoutSec 10 -UseBasicParsing
    $output += "Health Check: SUCCESS (Status: $($response.StatusCode))"
    $output += "Response: $($response.Content)"
} catch {
    $output += "Health Check: FAILED - $($_.Exception.Message)"
}

# Test offices endpoint
try {
    $response = Invoke-WebRequest -Uri "http://localhost:5000/api/offices" -TimeoutSec 10 -UseBasicParsing
    $output += "Offices Check: SUCCESS (Status: $($response.StatusCode))"
    $output += "Response: $($response.Content.Substring(0, [Math]::Min(200, $response.Content.Length)))..."
} catch {
    $output += "Offices Check: FAILED - $($_.Exception.Message)"
}

# Test login endpoint
try {
    $body = '{"email":"admin@shipnex.com","password":"admin123"}'
    $response = Invoke-WebRequest -Uri "http://localhost:5000/api/auth/login" -Method POST -ContentType "application/json" -Body $body -TimeoutSec 10 -UseBasicParsing
    $output += "Login Check: SUCCESS (Status: $($response.StatusCode))"
    $output += "Response: $($response.Content.Substring(0, [Math]::Min(200, $response.Content.Length)))..."
} catch {
    $output += "Login Check: FAILED - $($_.Exception.Message)"
}

# Stop the server
$output += "Stopping server..."
Stop-Process -Id $process.Id -Force -ErrorAction SilentlyContinue

$output += "=== TEST COMPLETE ==="

# Write output to file
$output | Out-File -FilePath "C:\Users\Falone Mo\Desktop\shipnex-website\backend\test_results.txt"
$output
