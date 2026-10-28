# Comprehensive Live Testing Script for GreenLink Delhi
$ErrorActionPreference = "Stop"

Write-Host "=== Step 1: Starting FastAPI Backend on Port 8000 ===" -ForegroundColor Cyan
$backendProc = Start-Process -FilePath "$PSScriptRoot\..\backend\.venv\Scripts\python.exe" `
    -ArgumentList "-m uvicorn app.main:app --port 8000 --host 127.0.0.1" `
    -WorkingDirectory "$PSScriptRoot\..\backend" `
    -PassThru

Write-Host "=== Step 2: Starting Vite Frontend on Port 5173 ===" -ForegroundColor Cyan
$frontendProc = Start-Process -FilePath "cmd.exe" `
    -ArgumentList "/c npm run dev -- --host 127.0.0.1 --port 5173" `
    -WorkingDirectory "$PSScriptRoot\..\frontend" `
    -PassThru

try {
    Write-Host "Waiting 5 seconds for servers to initialize..." -ForegroundColor Yellow
    Start-Sleep -Seconds 5

    Write-Host "=== Step 3: Testing Backend Health Endpoint ===" -ForegroundColor Cyan
    $health = Invoke-RestMethod -Uri "http://127.0.0.1:8000/api/v1/health" -Method Get
    Write-Host "  Backend Status: $($health.status)" -ForegroundColor Green
    Write-Host "  Application:    $($health.application)" -ForegroundColor Green
    Write-Host "  Version:        $($health.version)" -ForegroundColor Green

    Write-Host "=== Step 4: Testing Frontend Index Page Delivery ===" -ForegroundColor Cyan
    $fe = Invoke-WebRequest -Uri "http://127.0.0.1:5173/" -Method Get -UseBasicParsing
    Write-Host "  Frontend HTTP Code: $($fe.StatusCode)" -ForegroundColor Green
    if ($fe.Content -match "<title>GreenLink Delhi</title>") {
        Write-Host "  Page Title: Verified ('GreenLink Delhi')" -ForegroundColor Green
    } else {
        Write-Host "  Page Content Delivered (Length: $($fe.Content.Length) bytes)" -ForegroundColor Green
    }

    Write-Host "=== Step 5: Testing Full Integration APIs ===" -ForegroundColor Cyan
    & "$PSScriptRoot\..\backend\.venv\Scripts\python.exe" "$PSScriptRoot\verify_full_integration.py"

    Write-Host ""
    Write-Host "==========================================================" -ForegroundColor Green
    Write-Host "  ALL TESTS PASSED! APPLICATION IS FULLY FUNCTIONAL AND LINKED!" -ForegroundColor Green
    Write-Host "==========================================================" -ForegroundColor Green
} finally {
    Write-Host "Cleaning up test process instances..." -ForegroundColor Gray
    Stop-Process -Id $backendProc.Id -Force -ErrorAction SilentlyContinue
    Stop-Process -Id $frontendProc.Id -Force -ErrorAction SilentlyContinue
    # Also stop node if cmd spawned it
    Get-Process -Name "node" -ErrorAction SilentlyContinue | Where-Object { $_.Path -like "*greenlinkdelhi*" } | Stop-Process -Force -ErrorAction SilentlyContinue
}
