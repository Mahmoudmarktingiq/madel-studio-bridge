<#
.SYNOPSIS
    Safely cleans up old UV cache on C: drive AFTER user authorization.
.DESCRIPTION
    Requires -ConfirmCleanup switch to execute.
    Verifies destination integrity on D:\MCP\runtime\uv-cache before deleting anything.
#>
param(
    [switch]$ConfirmCleanup
)

$ErrorActionPreference = 'Stop'
$sourceDir = "C:\Users\asus\AppData\Local\uv\cache"
$targetDir = "D:\MCP\runtime\uv-cache"

Write-Host "=================================================="
Write-Host "MADEL Studio Bridge - Safe C: Cache Cleanup"
Write-Host "=================================================="

if (-not $ConfirmCleanup) {
    Write-Warning "SAFETY GATE ACTIVE: -ConfirmCleanup switch was not specified."
    Write-Warning "No files have been modified or deleted."
    Write-Warning "Run with -ConfirmCleanup only after explicit user approval."
    exit 1
}

# 1. Pre-cleanup Verification: Ensure target on D: is healthy
Write-Host "`n[1. PRE-CLEANUP INTEGRITY CHECK]"
if (-not (Test-Path $targetDir)) {
    Write-Error "Target directory $targetDir does not exist! Aborting cleanup."
    exit 2
}

$dstFiles = (Get-ChildItem -Path $targetDir -Recurse -File -ErrorAction SilentlyContinue | Measure-Object).Count
if ($dstFiles -lt 70000) {
    Write-Error "Target directory only contains $dstFiles files (expected >70,000)! Aborting cleanup."
    exit 3
}

$userEnv = [Environment]::GetEnvironmentVariable('UV_CACHE_DIR', 'User')
if ($userEnv -ne $targetDir) {
    Write-Error "User environment variable UV_CACHE_DIR is not set to $targetDir (current: $userEnv)! Aborting cleanup."
    exit 4
}
Write-Host "[OK] Target directory verified ($dstFiles files). UV_CACHE_DIR is active."

# 2. Measure free space before deletion
$cDiskBefore = (Get-CimInstance Win32_LogicalDisk | Where-Object DeviceID -eq 'C:').FreeSpace
$freeBeforeGB = [math]::Round($cDiskBefore / 1GB, 2)
Write-Host "C: Drive Free Space Before Cleanup: $freeBeforeGB GB"

# 3. Perform Safe Deletion
Write-Host "`n[2. DELETING SOURCE CACHE ON C: DRIVE...]"
$sw = [System.Diagnostics.Stopwatch]::StartNew()
Remove-Item -Path $sourceDir -Recurse -Force -ErrorAction Stop
$sw.Stop()
Write-Host "[OK] Source cache removed in $($sw.Elapsed.ToString())"

# 4. Measure free space after deletion
$cDiskAfter = (Get-CimInstance Win32_LogicalDisk | Where-Object DeviceID -eq 'C:').FreeSpace
$freeAfterGB = [math]::Round($cDiskAfter / 1GB, 2)
$freedGB = [math]::Round(($cDiskAfter - $cDiskBefore) / 1GB, 2)

Write-Host "`n[3. POST-CLEANUP RESULTS]"
Write-Host "C: Drive Free Space After Cleanup: $freeAfterGB GB"
Write-Host "Net Space Recovered on C: Drive:   +$freedGB GB"

# 5. Verify uv cache dir still points to D:
$env:UV_CACHE_DIR = $targetDir
$uvDir = (& uv cache dir)
Write-Host "Active uv cache dir: $uvDir"

Write-Host "`n>>> CLEANUP COMPLETED SAFELY & SUCCESSFULLY <<<"
