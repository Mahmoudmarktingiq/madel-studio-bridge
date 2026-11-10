# Phase 2: Safe UV Cache Migration to D:\MCP\runtime\uv-cache
$ErrorActionPreference = 'Stop'

$sourceDir = "C:\Users\asus\AppData\Local\uv\cache"
$targetDir = "D:\MCP\runtime\uv-cache"

Write-Host "=================================================="
Write-Host "MADEL Studio Bridge - UV Cache Safe Migration"
Write-Host "Source: $sourceDir"
Write-Host "Target: $targetDir"
Write-Host "=================================================="

# Ensure target directory exists
if (-not (Test-Path $targetDir)) {
    New-Item -ItemType Directory -Path $targetDir -Force | Out-Null
    Write-Host "[OK] Target directory created: $targetDir"
} else {
    Write-Host "[OK] Target directory already exists: $targetDir"
}

# Measure source before copying
$srcMeasure = Get-ChildItem -Path $sourceDir -Recurse -File -ErrorAction SilentlyContinue | Measure-Object -Property Length -Sum
Write-Host "Source files: $($srcMeasure.Count), size: $([math]::Round($srcMeasure.Sum / 1MB, 2)) MB"

# Run Robocopy
Write-Host "`n[STARTING ROBOCOPY] Copying cache safely..."
$sw = [System.Diagnostics.Stopwatch]::StartNew()
$roboArgs = @(
    $sourceDir,
    $targetDir,
    "/E",
    "/R:2",
    "/W:2",
    "/NP",
    "/MT:8",
    "/XJ"
)
$process = Start-Process -FilePath "robocopy.exe" -ArgumentList $roboArgs -Wait -Passthru -NoNewWindow
$exitCode = $process.ExitCode
$sw.Stop()
Write-Host "[ROBOCOPY COMPLETED] Duration: $($sw.Elapsed.ToString()) - ExitCode: $exitCode"

if ($exitCode -ge 8) {
    Write-Error "Robocopy failed with error code $exitCode"
    exit $exitCode
} else {
    Write-Host "[SUCCESS] Robocopy completed successfully (ExitCode $exitCode < 8)."
}

# Measure target after copying
$dstMeasure = Get-ChildItem -Path $targetDir -Recurse -File -ErrorAction SilentlyContinue | Measure-Object -Property Length -Sum
Write-Host "Target files: $($dstMeasure.Count), size: $([math]::Round($dstMeasure.Sum / 1MB, 2)) MB"

# Set User-level environment variable UV_CACHE_DIR
Write-Host "`n[ENVIRONMENT CONFIGURATION]"
[Environment]::SetEnvironmentVariable('UV_CACHE_DIR', $targetDir, 'User')
$userVal = [Environment]::GetEnvironmentVariable('UV_CACHE_DIR', 'User')
Write-Host "User-level UV_CACHE_DIR successfully set to: $userVal"

# Set Process-level environment variable for current session
$env:UV_CACHE_DIR = $targetDir
Write-Host "Process-level UV_CACHE_DIR set to: $env:UV_CACHE_DIR"

# Verify UV detects the new cache dir
$detectedDir = (& uv cache dir)
Write-Host "uv cache dir output: $detectedDir"

if ($detectedDir.Trim() -eq $targetDir) {
    Write-Host "`n>>> MIGRATION & CONFIGURATION VERIFIED: PASS <<<"
} else {
    Write-Host "`n>>> WARNING: uv cache dir returned '$detectedDir' instead of '$targetDir' <<<"
}
