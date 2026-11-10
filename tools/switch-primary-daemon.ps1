# Controlled handover of Primary Daemon to Installed location
$ErrorActionPreference = 'Stop'

Write-Host "Checking for existing Primary Daemon on port 7897..."
$conn = Get-NetTCPConnection -LocalPort 7897 -ErrorAction SilentlyContinue
if ($conn) {
    $pidToKill = $conn.OwningProcess
    Write-Host "Found active process $pidToKill on port 7897. Terminating cleanly..."
    Stop-Process -Id $pidToKill -Force -ErrorAction SilentlyContinue
    Start-Sleep -Seconds 2
} else {
    Write-Host "No process currently on port 7897."
}

# Double check port 7897 is free
$connAfter = Get-NetTCPConnection -LocalPort 7897 -ErrorAction SilentlyContinue
if ($connAfter) {
    Write-Error "Port 7897 is still in use by PID $($connAfter.OwningProcess)"
    exit 1
} else {
    Write-Host "[OK] Port 7897 is clean and ready for new Primary Daemon from Installed path."
}
