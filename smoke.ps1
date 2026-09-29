$ErrorActionPreference = 'Stop'
$out = @()
try {
  $b = Get-Content 'test_login.json' -Raw
  $l = Invoke-RestMethod -Uri 'http://localhost:5000/api/auth/login' -Method POST -ContentType 'application/json' -Body $b -TimeoutSec 10
  $out += "LOGIN OK role=$($l.role)"
  $h = @{ Authorization = "Bearer $($l.token)" }
  $types = (Invoke-WebRequest -Uri 'http://localhost:5000/api/documents/types' -Headers $h -UseBasicParsing -TimeoutSec 10).Content
  $out += "TYPES: $types"
  $shipsRaw = (Invoke-WebRequest -Uri 'http://localhost:5000/api/shipments' -Headers $h -UseBasicParsing -TimeoutSec 10).Content
  $out += "SHIPMENTS_OK"
  $tmp = Join-Path $env:TEMP 'shipnex_upload_test.txt'
  Set-Content -Path $tmp -Value 'ShipNex secure document upload smoke test'
  $s = ($shipsRaw | ConvertFrom-Json)[0]
  Add-Type -AssemblyName System.Net.Http
  $hc = New-Object System.Net.Http.HttpClient
  $hc.DefaultRequestHeaders.Authorization = New-Object System.Net.Http.Headers.AuthenticationHeaderValue('Bearer', $l.token)
  $mp = New-Object System.Net.Http.MultipartFormDataContent
  $fs = [IO.File]::OpenRead($tmp)
  $fileContent = New-Object System.Net.Http.StreamContent($fs)
  $fileContent.Headers.ContentType = New-Object System.Net.Http.Headers.MediaTypeHeaderValue('text/plain')
  $mp.Add($fileContent, 'file', 'upload-test.txt')
  $mp.Add((New-Object System.Net.Http.StringContent($s.id)), 'shipmentId')
  $mp.Add((New-Object System.Net.Http.StringContent('Invoice')), 'documentType')
  $mp.Add((New-Object System.Net.Http.StringContent('smoke test upload')), 'description')
  $mp.Add((New-Object System.Net.Http.StringContent('false')), 'customerVisible')
  $resp = $hc.PostAsync('http://localhost:5000/api/documents/upload', $mp).Result
  $upBody = $resp.Content.ReadAsStringAsync().Result
  if ($resp.IsSuccessStatusCode) {
    $up = $upBody | ConvertFrom-Json
    $out += "UPLOAD_OK id=$($up.id) number=$($up.documentNumber) url=$($up.fileUrl)"
    $url = (Invoke-WebRequest -Uri "http://localhost:5000/api/documents/$($up.id)/access-url?expiresInSeconds=300" -Headers $h -UseBasicParsing -TimeoutSec 10).Content
    $out += "ACCESS_URL_OK $url"
    $pub = (Invoke-WebRequest -Uri "http://localhost:5000/api/documents/public/$($s.trackingNumber)" -UseBasicParsing -TimeoutSec 10).Content
    $out += "PUBLIC_LIST private-doc-must-be-absent $pub"
    Invoke-RestMethod -Uri "http://localhost:5000/api/documents/$($up.id)" -Method DELETE -Headers $h -TimeoutSec 10 | Out-Null
    $out += 'DELETE_OK test-document-removed'
  } else {
    $out += "UPLOAD_FAIL $([int]$resp.StatusCode) $upBody"
  }
} catch {
  $out += "SMOKE_FAIL $($_.Exception.Message)"
}
$out | Out-File 'smoke_docs.txt' -Encoding utf8

$ErrorActionPreference = 'Continue'
$out = 'C:\Users\Falone Mo\Desktop\shipnex-website\live2.txt'
'SMOKE ' + (Get-Date) | Out-File $out

try {
  # Health
  $h = Invoke-RestMethod -Uri 'http://localhost:5000/health' -TimeoutSec 5
  "HEALTH: $h" | Out-File $out -Append

  # Login
  $login = Invoke-RestMethod -Uri 'http://localhost:5000/api/auth/login' -Method POST -ContentType 'application/json' -Body '{"email":"admin@shipnex.com","password":"admin123"}' -TimeoutSec 10
  $tok = $login.token
  "LOGIN OK: role=$($login.role) email=$($login.email) tokenLen=$($tok.Length)" | Out-File $out -Append
  $hdr = @{ Authorization = "Bearer $tok" }

  # Lists
  $customers = Invoke-RestMethod -Uri 'http://localhost:5000/api/customers' -Headers $hdr -TimeoutSec 10
  "CUSTOMERS: count=$($customers.Count) first=$($customers[0].firstName) $($customers[0].lastName) <$($customers[0].email)> id=$($customers[0].id)" | Out-File $out -Append

  $pets = Invoke-RestMethod -Uri 'http://localhost:5000/api/pets' -Headers $hdr -TimeoutSec 10
  "PETS: count=$($pets.Count) first=$($pets[0].petName) ($($pets[0].petType)) status=$($pets[0].status) id=$($pets[0].id)" | Out-File $out -Append

  $shipments = Invoke-RestMethod -Uri 'http://localhost:5000/api/shipments' -TimeoutSec 10
  "SHIPMENTS: count=$($shipments.Count) first=$($shipments[0].trackingNumber) status=$($shipments[0].status)" | Out-File $out -Append

  # PUT shipment status
  $sid = $shipments[0].id
  $body = @{ status = 'InTransit'; location = 'Live Smoke Hub'; description = 'live verify' } | ConvertTo-Json
  $put = Invoke-RestMethod -Uri "http://localhost:5000/api/shipments/$sid/status" -Method PUT -Headers $hdr -ContentType 'application/json' -Body $body -TimeoutSec 15
  "PUT STATUS OK: currentLocation=$($put.currentLocation) events=$($put.events.Count)" | Out-File $out -Append

  # Customer full flow on a NEW customer
  $cb = @{ firstName = 'Smoke'; lastName = 'Tester'; email = 'smoke@test.local'; phone = '+1-555-SMOKE'; address = '1 Smoke Way' } | ConvertTo-Json
  $new = Invoke-RestMethod -Uri 'http://localhost:5000/api/customers' -Method POST -Headers $hdr -ContentType 'application/json' -Body $cb -TimeoutSec 10
  $got = Invoke-RestMethod -Uri "http://localhost:5000/api/customers/$($new.id)" -Headers $hdr -TimeoutSec 10
  "CUSTOMER FLOW: created id=$($new.id) getById=$($got.firstName) $($got.lastName)" | Out-File $out -Append
  Invoke-RestMethod -Uri "http://localhost:5000/api/customers/$($new.id)" -Method DELETE -Headers $hdr -TimeoutSec 10 | Out-Null
  "CUSTOMER DELETE: OK" | Out-File $out -Append

  'SMOKE_ALL_OK' | Out-File $out -Append
}
catch {
  "SMOKE_FAILED: $($_.Exception.Message)" | Out-File $out -Append
  if ($_.Exception.Response) {
    $sr = New-Object IO.StreamReader($_.Exception.Response.GetResponseStream())
    "BODY: $($sr.ReadToEnd())" | Out-File $out -Append
  }
}
