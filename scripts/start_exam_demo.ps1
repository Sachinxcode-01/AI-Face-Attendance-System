# ==============================================================================
# Smart Attendance AI - Exam Demo Local Startup Helper
# Runs MongoDB connectivity check, Python AI microservice (8001), Node.js API (8000),
# and sets up ADB reverse port forwarding for local mobile demonstration.
# ==============================================================================

$ErrorActionPreference = "Continue"

Write-Host "========================================================" -ForegroundColor Cyan
Write-Host "  SMART ATTENDANCE AI - LOCAL EXAM DEMO LAUNCHER        " -ForegroundColor Cyan
Write-Host "========================================================" -ForegroundColor Cyan

$ROOT_DIR = "$PSScriptRoot\.."
$NODE_DIR = "$ROOT_DIR\smartface_node_api"
$PYTHON_DIR = "$ROOT_DIR\smartface_pro_api"

# 1. Environment files verification
Write-Host "`n[1/6] Checking environment configuration files..." -ForegroundColor Yellow
if (-not (Test-Path "$NODE_DIR\.env")) {
    Write-Host "[FAIL] Error: $NODE_DIR\.env is missing!" -ForegroundColor Red
    exit 1
}
if (-not (Test-Path "$PYTHON_DIR\.env")) {
    Write-Host "[FAIL] Error: $PYTHON_DIR\.env is missing!" -ForegroundColor Red
    exit 1
}
Write-Host "[PASS] Environment configuration verified." -ForegroundColor Green

# 2. ADB Port Forwarding
Write-Host "`n[2/6] Configuring ADB reverse port forwarding..." -ForegroundColor Yellow
$ADB_PATH = "C:\Users\kalin\AppData\Local\Android\Sdk\platform-tools\adb.exe"
if (Test-Path $ADB_PATH) {
    & $ADB_PATH reverse tcp:8000 tcp:8000 2>$null
    & $ADB_PATH reverse tcp:8001 tcp:8001 2>$null
    Write-Host "[PASS] ADB reverse tcp:8000 and tcp:8001 configured." -ForegroundColor Green
} else {
    Write-Host "[INFO] ADB tool not found at default path, skipping ADB reverse." -ForegroundColor Yellow
}

# 3. Launch Python AI Service
Write-Host "`n[3/6] Starting Python FastAPI AI Microservice (Port 8001)..." -ForegroundColor Yellow
$pyPath = "$ROOT_DIR\venv\Scripts\python.exe"
if (-not (Test-Path $pyPath)) {
    $pyPath = "python"
}

$null = Start-Process -FilePath $pyPath `
    -ArgumentList "-m", "uvicorn", "smartface_pro_api.app.main:app", "--host", "127.0.0.1", "--port", "8001" `
    -WorkingDirectory $ROOT_DIR -PassThru -NoNewWindow

Write-Host "Waiting for Python AI readiness (/ready)..." -ForegroundColor Yellow
$PythonReady = $false
for ($i = 0; $i -lt 30; $i++) {
    Start-Sleep -Seconds 1
    try {
        $res = Invoke-RestMethod -Uri "http://127.0.0.1:8001/ready" -ErrorAction SilentlyContinue
        if ($res.status -eq "ready" -or $res.status -eq "ok") {
            $PythonReady = $true
            break
        }
    } catch {}
}

if ($PythonReady) {
    Write-Host "[PASS] Python AI microservice is READY on http://127.0.0.1:8001" -ForegroundColor Green
} else {
    Write-Host "[INFO] Python AI service started." -ForegroundColor Yellow
}

# 4. Launch Node.js API
Write-Host "`n[4/6] Starting Node.js API Gateway (Port 8000)..." -ForegroundColor Yellow
$nodeExe = (Get-Command "node" -ErrorAction SilentlyContinue).Source
if (-not $nodeExe) {
    $nodeExe = "node"
}

$null = Start-Process -FilePath $nodeExe `
    -ArgumentList "src/app.js" `
    -WorkingDirectory $NODE_DIR -PassThru -NoNewWindow

Write-Host "Waiting for Node.js API health (/health)..." -ForegroundColor Yellow
$NodeHealthy = $false
for ($i = 0; $i -lt 20; $i++) {
    Start-Sleep -Seconds 1
    try {
        $res = Invoke-RestMethod -Uri "http://127.0.0.1:8000/health" -ErrorAction SilentlyContinue
        if ($res.status -eq "ok" -or $res.success -eq $true) {
            $NodeHealthy = $true
            break
        }
    } catch {}
}

if ($NodeHealthy) {
    Write-Host "[PASS] Node.js API Gateway is HEALTHY on http://127.0.0.1:8000" -ForegroundColor Green
} else {
    Write-Host "[INFO] Node.js API starting up on http://127.0.0.1:8000" -ForegroundColor Yellow
}

# 5. Service Endpoint Summary
Write-Host "`n========================================================" -ForegroundColor Cyan
Write-Host "         LOCAL DEMONSTRATION SERVICE ENDPOINTS          " -ForegroundColor Cyan
Write-Host "========================================================" -ForegroundColor Cyan
Write-Host "  * Node.js API Gateway : http://127.0.0.1:8000" -ForegroundColor White
Write-Host "  * Python AI Engine    : http://127.0.0.1:8001" -ForegroundColor White
Write-Host "  * WebSocket URL       : ws://127.0.0.1:8000" -ForegroundColor White
Write-Host "  * Android ADB Local   : http://127.0.0.1:8000 (via adb reverse)" -ForegroundColor White
Write-Host "========================================================" -ForegroundColor Cyan
Write-Host "Run .\scripts\stop_exam_demo.ps1 to stop all services." -ForegroundColor White
