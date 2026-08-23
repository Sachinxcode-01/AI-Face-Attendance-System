# ==============================================================================
# Smart Attendance AI - Exam Demo Shutdown Helper
# Gracefully stops Node.js (8000) and Python uvicorn (8001) local demo processes.
# ==============================================================================

Write-Host "Stopping Smart Attendance AI local demonstration services..." -ForegroundColor Yellow

# Terminate Node.js on port 8000
$nodePort = Get-NetTCPConnection -LocalPort 8000 -ErrorAction SilentlyContinue
if ($nodePort) {
    Stop-Process -Id $nodePort.OwningProcess -Force -ErrorAction SilentlyContinue
    Write-Host "[PASS] Node.js API process (Port 8000) stopped." -ForegroundColor Green
}

# Terminate Python uvicorn on port 8001
$pythonPort = Get-NetTCPConnection -LocalPort 8001 -ErrorAction SilentlyContinue
if ($pythonPort) {
    Stop-Process -Id $pythonPort.OwningProcess -Force -ErrorAction SilentlyContinue
    Write-Host "[PASS] Python AI microservice process (Port 8001) stopped." -ForegroundColor Green
}

Write-Host "Local demonstration services stopped successfully." -ForegroundColor Green
