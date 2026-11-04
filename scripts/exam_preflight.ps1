# ==============================================================================
# Smart Attendance AI - Pre-Exam System Diagnostics & Health Check
# ==============================================================================

Write-Host "========================================================" -ForegroundColor Cyan
Write-Host "  PRE-EXAM SYSTEM DIAGNOSTIC & VERIFICATION CHECK       " -ForegroundColor Cyan
Write-Host "========================================================" -ForegroundColor Cyan

$ROOT_DIR = "$PSScriptRoot\.."

# 1. Verify Core Hashes
Write-Host "`n[1/5] Verifying Immutable Core Engine Hashes..." -ForegroundColor Yellow
$attHash = (Get-FileHash "$ROOT_DIR\core\attendance_system.py" -Algorithm SHA256).Hash
$trainHash = (Get-FileHash "$ROOT_DIR\core\train_faces.py" -Algorithm SHA256).Hash

if ($attHash -eq "B1C5A52382782AEA937E73FAE9E686FFC95BE00C8165AF15223600F3B576296E") {
    Write-Host "  [PASS] core/attendance_system.py SHA-256 MATCHED" -ForegroundColor Green
} else {
    Write-Host "  [WARN] core/attendance_system.py hash: $attHash" -ForegroundColor Yellow
}

if ($trainHash -eq "4BF26AE2A36EFB186FDB606E3FD0263D3878FE990995033219C6C267346AD7ED") {
    Write-Host "  [PASS] core/train_faces.py SHA-256 MATCHED" -ForegroundColor Green
} else {
    Write-Host "  [WARN] core/train_faces.py hash: $trainHash" -ForegroundColor Yellow
}

# 2. Check Android Release APK
Write-Host "`n[2/5] Checking Release APK Artifact..." -ForegroundColor Yellow
$apkPath = "$ROOT_DIR\mobile\build\app\outputs\flutter-apk\app-release.apk"
if (Test-Path $apkPath) {
    $apkItem = Get-Item $apkPath
    $sizeMb = [math]::Round($apkItem.Length / 1MB, 2)
    $apkHash = (Get-FileHash $apkPath -Algorithm SHA256).Hash
    Write-Host "  [PASS] Release APK Exists: $sizeMb MB" -ForegroundColor Green
    Write-Host "  [INFO] APK SHA-256: $apkHash" -ForegroundColor White
} else {
    Write-Host "  [INFO] Release APK not built yet. Run 'flutter build apk --release' inside mobile/." -ForegroundColor Yellow
}

# 3. Check Connected ADB Devices
Write-Host "`n[3/5] Checking Connected Android Devices..." -ForegroundColor Yellow
$ADB_PATH = "C:\Users\kalin\AppData\Local\Android\Sdk\platform-tools\adb.exe"
if (Test-Path $ADB_PATH) {
    $devices = & $ADB_PATH devices
    Write-Host "  $devices" -ForegroundColor White
} else {
    Write-Host "  [INFO] ADB tool not found at default SDK path." -ForegroundColor Yellow
}

# 4. Check Backend Health
Write-Host "`n[4/5] Checking Local Backend Endpoints..." -ForegroundColor Yellow
try {
    $null = Invoke-RestMethod -Uri "http://127.0.0.1:8000/health" -TimeoutSec 3 -ErrorAction Stop
    Write-Host "  [PASS] Node.js API Gateway (Port 8000): HEALTHY" -ForegroundColor Green
} catch {
    Write-Host "  [OFFLINE] Node.js API Gateway (Port 8000): OFFLINE" -ForegroundColor Yellow
}

try {
    $null = Invoke-RestMethod -Uri "http://127.0.0.1:8001/ready" -TimeoutSec 3 -ErrorAction Stop
    Write-Host "  [PASS] Python AI Engine (Port 8001): READY" -ForegroundColor Green
} catch {
    Write-Host "  [OFFLINE] Python AI Engine (Port 8001): OFFLINE" -ForegroundColor Yellow
}

# 5. Check Next.js Frontend and Flutter Mobile directories
Write-Host "`n[5/5] Checking Source Directories..." -ForegroundColor Yellow
if (Test-Path "$ROOT_DIR\frontend\web") {
    Write-Host "  [PASS] Web Frontend directory exists (frontend/web)" -ForegroundColor Green
}
if (Test-Path "$ROOT_DIR\mobile") {
    Write-Host "  [PASS] Flutter Mobile App directory exists (mobile/)" -ForegroundColor Green
}
if (Test-Path "$ROOT_DIR\backend\api") {
    Write-Host "  [PASS] Backend API directory exists (backend/api/)" -ForegroundColor Green
}
if (Test-Path "$ROOT_DIR\backend\ai") {
    Write-Host "  [PASS] Backend AI directory exists (backend/ai/)" -ForegroundColor Green
}

Write-Host "`n========================================================" -ForegroundColor Cyan
Write-Host "Diagnostic Preflight Check Complete." -ForegroundColor Cyan
