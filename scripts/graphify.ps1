# SmartFace Attendance - Developer Graphify Shortcut CLI
param (
    [Parameter(Position=0, ValueFromRemainingArguments=$true)]
    [string[]]$Command
)

$cmdText = $Command -join " "
if (-not $cmdText) {
    Write-Host "Usage: .\scripts\graphify.ps1 <query or command>" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "Examples:" -ForegroundColor Yellow
    Write-Host "  .\scripts\graphify.ps1 'Explain attendance flow'"
    Write-Host "  .\scripts\graphify.ps1 'Find dead code'"
    Write-Host "  .\scripts\graphify.ps1 'Trace attendance API'"
    Write-Host "  .\scripts\graphify.ps1 'Show authentication architecture'"
    Write-Host "  .\scripts\graphify.ps1 'Show face recognition flow'"
    Write-Host "  .\scripts\graphify.ps1 'Show role permission map'"
    Write-Host "  .\scripts\graphify.ps1 'Show queue dependencies'"
    Write-Host "  .\scripts\graphify.ps1 'Show portal to backend dependencies'"
    Write-Host "  .\scripts\graphify.ps1 'Show mobile to backend dependencies'"
    Write-Host "  .\scripts\graphify.ps1 'Show path between Student Dashboard and Attendance Engine'"
    exit 0
}

python scripts/graphify_query.py $cmdText
