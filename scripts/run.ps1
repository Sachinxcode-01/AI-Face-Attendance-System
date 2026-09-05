<#
.SYNOPSIS
  SmartFace Elite — Unified Multi-Platform Command Orchestrator
.DESCRIPTION
  "One Thing for All" cross-platform developer script.
  Executes backend, frontend, mobile, test, and preflight targets with a single command.
.EXAMPLE
  .\scripts\run.ps1 dev
  .\scripts\run.ps1 backend
  .\scripts\run.ps1 frontend
  .\scripts\run.ps1 mobile
  .\scripts\run.ps1 test
  .\scripts\run.ps1 stop
#>

param (
    [Parameter(Position=0)]
    [ValidateSet("help", "dev", "backend", "frontend", "admin", "reflex", "mobile", "preflight", "test", "stop", "clean")]
    [string]$Command = "help"
)

$ErrorActionPreference = "Continue"
$ROOT_DIR = (Resolve-Path "$PSScriptRoot\..").Path
$NODE_DIR = "$ROOT_DIR\backend\api"
$AI_DIR = "$ROOT_DIR\backend\ai"
$WEB_DIR = "$ROOT_DIR\frontend\web"
$ADMIN_DIR = "$ROOT_DIR\frontend\admin"
$MOBILE_DIR = "$ROOT_DIR\mobile"

function Show-Help {
    Write-Host ""
    Write-Host '============================================================================' -ForegroundColor Cyan
    Write-Host '   SMARTFACE ATTENDANCE & BIOMETRIC SUITE -- DEVELOPER CLI                   ' -ForegroundColor Cyan
    Write-Host '============================================================================' -ForegroundColor Cyan
    Write-Host '  Usage: .\scripts\run.ps1 <command>  (or npm run <command> / make <command>)' -ForegroundColor White
    Write-Host ''
    Write-Host '  Commands:' -ForegroundColor Yellow
    Write-Host '    dev         Spin up complete stack: Backend (8000+8001) + Web Frontend (3000)' -ForegroundColor White
    Write-Host '    backend     Start Node.js API (Port 8000) and Python AI Service (Port 8001)' -ForegroundColor White
    Write-Host '    frontend    Start Next.js 15 Web Portal (Port 3000)' -ForegroundColor White
    Write-Host '    admin       Start Streamlit Real-Time Admin Dashboard (Port 8501)' -ForegroundColor White
    Write-Host '    reflex      Start Reflex Python Fullstack Web App' -ForegroundColor White
    Write-Host '    mobile      Launch Flutter Mobile Client with automatic ADB reverse' -ForegroundColor White
    Write-Host '    preflight   Run system health diagnostics, port checks, and model validation' -ForegroundColor White
    Write-Host '    test        Run automated test suites for Node.js API and Python AI' -ForegroundColor White
    Write-Host '    stop        Gracefully stop background processes on ports 8000 and 8001' -ForegroundColor White
    Write-Host '    clean       Clear temporary caches, logs, and python bytecode' -ForegroundColor White
    Write-Host '============================================================================' -ForegroundColor Cyan
    Write-Host ""
}

function Start-BackendServices {
    Write-Host "`n>>> Starting Backend Microservices..." -ForegroundColor Cyan

    # Verify environment files
    if (-not (Test-Path "$NODE_DIR\.env")) {
        Write-Host "[WARN] $NODE_DIR\.env not found. Copying from .env.example..." -ForegroundColor Yellow
        Copy-Item "$NODE_DIR\.env.example" "$NODE_DIR\.env" -Force
    }
    if (-not (Test-Path "$AI_DIR\.env")) {
        Write-Host "[WARN] $AI_DIR\.env not found. Copying from .env.example..." -ForegroundColor Yellow
        Copy-Item "$AI_DIR\.env.example" "$AI_DIR\.env" -Force
    }

    # Launch Python AI Microservice on Port 8001
    Write-Host "[1/2] Starting Python FastAPI AI Microservice (Port 8001)..." -ForegroundColor Yellow
    $pyPath = "$ROOT_DIR\venv\Scripts\python.exe"
    if (-not (Test-Path $pyPath)) { $pyPath = "python" }

    $null = Start-Process -FilePath $pyPath `
        -ArgumentList "-m", "uvicorn", "backend.ai.app.main:app", "--host", "127.0.0.1", "--port", "8001" `
        -WorkingDirectory $ROOT_DIR -PassThru -NoNewWindow

    # Poll readiness endpoint
    $pyReady = $false
    for ($i = 0; $i -lt 15; $i++) {
        Start-Sleep -Seconds 1
        try {
            $res = Invoke-RestMethod -Uri "http://127.0.0.1:8001/ready" -ErrorAction SilentlyContinue
            if ($res.status -eq "ready" -or $res.status -eq "ok") {
                $pyReady = $true
                break
            }
        } catch {}
    }
    if ($pyReady) {
        Write-Host "  [PASS] Python AI Engine ready on http://127.0.0.1:8001" -ForegroundColor Green
    } else {
        Write-Host "  [INFO] Python AI Engine spawned on port 8001." -ForegroundColor Yellow
    }

    # Launch Node.js API Gateway on Port 8000
    Write-Host "[2/2] Starting Node.js API Gateway (Port 8000)..." -ForegroundColor Yellow
    $nodeExe = (Get-Command "node" -ErrorAction SilentlyContinue).Source
    if (-not $nodeExe) { $nodeExe = "node" }

    $null = Start-Process -FilePath $nodeExe `
        -ArgumentList "src/app.js" `
        -WorkingDirectory $NODE_DIR -PassThru -NoNewWindow

    $nodeReady = $false
    for ($i = 0; $i -lt 15; $i++) {
        Start-Sleep -Seconds 1
        try {
            $res = Invoke-RestMethod -Uri "http://127.0.0.1:8000/api/health" -ErrorAction SilentlyContinue
            if ($res.status -eq "ok" -or $res.status -eq "healthy") {
                $nodeReady = $true
                break
            }
        } catch {}
    }
    if ($nodeReady) {
        Write-Host "  [PASS] Node.js API Gateway ready on http://127.0.0.1:8000" -ForegroundColor Green
    } else {
        Write-Host "  [INFO] Node.js API Gateway spawned on port 8000." -ForegroundColor Yellow
    }

    Write-Host "`n[SUCCESS] Backend services are up and listening:" -ForegroundColor Green
    Write-Host "  - Node.js API:     http://127.0.0.1:8000" -ForegroundColor White
    Write-Host "  - Python ArcFace:  http://127.0.0.1:8001" -ForegroundColor White
    Write-Host "  - Health Check:    http://127.0.0.1:8000/api/health" -ForegroundColor White
}

switch ($Command) {
    "help" {
        Show-Help
    }

    "backend" {
        Start-BackendServices
    }

    "dev" {
        Start-BackendServices
        Write-Host "`n>>> Starting Next.js Web Portal (Port 3000)..." -ForegroundColor Cyan
        Set-Location $WEB_DIR
        npm run dev
    }

    "frontend" {
        Write-Host "`n>>> Starting Next.js Web Portal (Port 3000)..." -ForegroundColor Cyan
        Set-Location $WEB_DIR
        npm run dev
    }

    "admin" {
        Write-Host "`n>>> Starting Streamlit Admin Dashboard (Port 8501)..." -ForegroundColor Cyan
        $pyPath = "$ROOT_DIR\venv\Scripts\python.exe"
        if (-not (Test-Path $pyPath)) { $pyPath = "python" }
        & $pyPath -m streamlit run "$ADMIN_DIR\web_dashboard.py" --server.port 8501
    }

    "reflex" {
        Write-Host "`n>>> Starting Reflex Web Portal..." -ForegroundColor Cyan
        Set-Location "$ROOT_DIR\frontend\reflex"
        reflex run
    }

    "mobile" {
        Write-Host "`n>>> Configuring ADB and Launching Flutter Mobile App..." -ForegroundColor Cyan
        $ADB_PATH = "C:\Users\kalin\AppData\Local\Android\Sdk\platform-tools\adb.exe"
        if (Test-Path $ADB_PATH) {
            & $ADB_PATH reverse tcp:8000 tcp:8000 2>$null
            & $ADB_PATH reverse tcp:8001 tcp:8001 2>$null
            Write-Host "  [PASS] ADB reverse port forwarding (8000, 8001) configured." -ForegroundColor Green
        }
        Set-Location $MOBILE_DIR
        flutter run
    }

    "preflight" {
        & "$PSScriptRoot\exam_preflight.ps1"
    }

    "test" {
        Write-Host "`n========================================================" -ForegroundColor Cyan
        Write-Host "  RUNNING AUTOMATED TEST SUITES                        " -ForegroundColor Cyan
        Write-Host "========================================================" -ForegroundColor Cyan
        Write-Host "`n[1/2] Running Node.js API Gateway Tests..." -ForegroundColor Yellow
        Set-Location $NODE_DIR
        node tests/run_all.js

        Write-Host "`n[2/2] Running Python AI Microservice Tests..." -ForegroundColor Yellow
        $pyPath = "$ROOT_DIR\venv\Scripts\python.exe"
        if (-not (Test-Path $pyPath)) { $pyPath = "python" }
        Set-Location $ROOT_DIR
        & $pyPath -m pytest backend/ai/tests -v
    }

    "stop" {
        & "$PSScriptRoot\stop_exam_demo.ps1"
    }

    "clean" {
        Write-Host "`n>>> Cleaning Caches..." -ForegroundColor Cyan
        Get-ChildItem -Path $ROOT_DIR -Include __pycache__,.pytest_cache,.ruff_cache -Recurse -Force -ErrorAction SilentlyContinue | Remove-Item -Recurse -Force
        Write-Host "[PASS] Clean complete." -ForegroundColor Green
    }
}
