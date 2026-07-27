# ==============================================================================
# Smart Attendance AI — Pre-Exam System Diagnostics & Health Check
# ==============================================================================

Write-Host "========================================================" -ForegroundColor Cyan
Write-Host "  🔍 PRE-EXAM SYSTEM DIAGNOSTIC & VERIFICATION CHECK  " -ForegroundColor Cyan
Write-Host "========================================================" -ForegroundColor Cyan

$ROOT_DIR = "$PSScriptRoot\.."

# 1. Verify Core Hashes
Write-Host "`n[1/5] Verifying Immutable Core Engine Hashes..." -ForegroundColor Yellow
$attHash = (Get-FileHash "$ROOT_DIR\core\attendance_system.py" -Algorithm SHA256).Hash
$trainHash = (Get-FileHash "$ROOT_DIR\core\train_faces.py" -Algorithm SHA256).Hash

if ($attHash -eq "B1C5A52382782AEA937E73FAE9E686FFC95BE00C8165AF15223600F3B576296E") {
    Write-Host "  ✅ core/attendance_system.py SHA-256 MATCHED" -ForegroundColor Green
} else {
    Write-Host "  ❌ core/attendance_system.py HASH MISMATCH!" -ForegroundColor Red
}

if ($trainHash -eq "4BF26AE2A36EFB186FDB606E3FD0263D3878FE990995033219C6C267346AD7ED") {
    Write-Host "  ✅ core/train_faces.py SHA-256 MATCHED" -ForegroundColor Green
} else {
    Write-Host "  ❌ core/train_faces.py HASH MISMATCH!" -ForegroundColor Red
}

# 2. Check Android Release APK
Write-Host "`n[2/5] Checking Release APK Artifact..." -ForegroundColor Yellow
$apkPath = "$ROOT_DIR\smartface_mobile\build\app\outputs\flutter-apk\app-release.apk"
if (Test-Path $apkPath) {
    $apkItem = Get-Item $apkPath
    $apkHash = (Get-FileHash $apkPath -Algorithm SHA256).Hash
    Write-Host "  ✅ Release APK Exists: $($apkItem.Length / 1MB | ForEach-Object { '{0:N2} MB' -f $_ })" -ForegroundColor Green
    Write-Host "  🔹 APK SHA-256: $apkHash" -ForegroundColor White
} else {
    Write-Host "  ⚠️ Release APK not built yet. Run 'flutter build apk --release'." -ForegroundColor Yellow
}

# 3. Check Connected ADB Devices
Write-Host "`n[3/5] Checking Connected Android Devices..." -ForegroundColor Yellow
$ADB_PATH = "C:\Users\kalin\AppData\Local\Android\Sdk\platform-tools\adb.exe"
if (Test-Path $ADB_PATH) {
    $devices = & $ADB_PATH devices
    Write-Host "  $devices" -ForegroundColor White
} else {
    Write-Host "  ⚠️ ADB tool not found." -ForegroundColor Yellow
}

# 4. Check Backend Health
Write-Host "`n[4/5] Checking Local Backend Endpoints..." -ForegroundColor Yellow
try {
    $nodeRes = Invoke-RestMethod -Uri "http://127.0.0.1:8000/health" -TimeoutSec 3 -ErrorAction Stop
    Write-Host "  ✅ Node.js API Gateway (Port 8000): HEALTHY" -ForegroundColor Green
} catch {
    Write-Host "  ⚠️ Node.js API Gateway (Port 8000): OFFLINE (Start via start_exam_demo.ps1)" -ForegroundColor Yellow
}

try {
    $pythonRes = Invoke-RestMethod -Uri "http://127.0.0.1:8001/ready" -TimeoutSec 3 -ErrorAction Stop
    Write-Host "  ✅ Python AI Engine (Port 8001): READY" -ForegroundColor Green
} catch {
    Write-Host "  ⚠️ Python AI Engine (Port 8001): OFFLINE (Start via start_exam_demo.ps1)" -ForegroundColor Yellow
}

Write-Host "`n========================================================" -ForegroundColor Cyan
Write-Host "Diagnostic Preflight Check Complete." -ForegroundColor Cyan
