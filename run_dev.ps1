# GreenLink Delhi - Windows Local Development Launch Script
# Launches FastAPI backend on port 8000 and Vite frontend on port 5173 in separate PowerShell windows.

Write-Host "=================================================================" -ForegroundColor Green
Write-Host "  GreenLink Delhi - Starting Local Development Environment" -ForegroundColor Green
Write-Host "=================================================================" -ForegroundColor Green

$rootDir = Split-Path -Parent $MyInvocation.MyCommand.Path

# 1. Check Backend Prerequisites
$backendVenv = Join-Path $rootDir "backend\.venv\Scripts\python.exe"
if (-not (Test-Path $backendVenv)) {
    Write-Host "[WARNING] Backend virtualenv not found at backend\.venv" -ForegroundColor Yellow
    Write-Host "  Please set up backend virtual environment first:" -ForegroundColor Yellow
    Write-Host "    cd backend" -ForegroundColor Yellow
    Write-Host "    python -m venv .venv" -ForegroundColor Yellow
    Write-Host "    .venv\Scripts\pip install -r requirements.txt" -ForegroundColor Yellow
    exit 1
}

# 2. Check Frontend Prerequisites
$frontendNodeModules = Join-Path $rootDir "frontend\node_modules"
if (-not (Test-Path $frontendNodeModules)) {
    Write-Host "[WARNING] Frontend node_modules not found at frontend\node_modules" -ForegroundColor Yellow
    Write-Host "  Please install frontend dependencies first:" -ForegroundColor Yellow
    Write-Host "    cd frontend" -ForegroundColor Yellow
    Write-Host "    npm install" -ForegroundColor Yellow
    exit 1
}

# 3. Launch Backend in Separate Window
Write-Host "[1/3] Starting FastAPI backend on http://127.0.0.1:8000..." -ForegroundColor Cyan
Start-Process powershell -ArgumentList "-NoExit", "-Command", "Write-Host 'Starting GreenLink Delhi FastAPI Backend...' -ForegroundColor Green; cd '$rootDir\backend'; .venv\Scripts\uvicorn.exe app.main:app --port 8000 --host 127.0.0.1 --reload"

# 4. Launch Frontend in Separate Window
Write-Host "[2/3] Starting Vite frontend on http://127.0.0.1:5173..." -ForegroundColor Cyan
Start-Process powershell -ArgumentList "-NoExit", "-Command", "Write-Host 'Starting GreenLink Delhi Vite Frontend...' -ForegroundColor Green; cd '$rootDir\frontend'; npm run dev -- --host 127.0.0.1 --port 5173"

# 5. Open Browser after brief initialization
Start-Sleep -Seconds 3
Write-Host "[3/3] Launching application in browser: http://127.0.0.1:5173/" -ForegroundColor Green
Start-Process "http://127.0.0.1:5173/"

Write-Host ""
Write-Host "GreenLink Delhi is now running!" -ForegroundColor Green
Write-Host "  Frontend: http://127.0.0.1:5173/" -ForegroundColor White
Write-Host "  Backend:  http://127.0.0.1:8000/api/v1/health" -ForegroundColor White
Write-Host "  API Docs: http://127.0.0.1:8000/docs" -ForegroundColor White
Write-Host "To stop the servers, close the respective PowerShell windows." -ForegroundColor Gray
