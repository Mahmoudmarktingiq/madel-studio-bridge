# Phase 1: Inspect UV environment, cache, processes, and disk space
$ErrorActionPreference = 'SilentlyContinue'

Write-Host "=== 1. DISK SPACE CHECK ==="
Get-CimInstance Win32_LogicalDisk | Where-Object { $_.DeviceID -in 'C:', 'D:' } | ForEach-Object {
    [PSCustomObject]@{
        Drive = $_.DeviceID
        FreeGB = [math]::Round($_.FreeSpace / 1GB, 2)
        TotalGB = [math]::Round($_.Size / 1GB, 2)
        PercentFree = [math]::Round(($_.FreeSpace / $_.Size) * 100, 2)
    }
} | Format-Table -AutoSize

Write-Host "`n=== 2. UV COMMAND & CACHE DIR ==="
$uvPath = (Get-Command uv -ErrorAction SilentlyContinue).Source
Write-Host "UV Command Path: $uvPath"
if ($uvPath) {
    & uv --version
    $currentCacheDir = (& uv cache dir)
    Write-Host "Current uv cache dir: $currentCacheDir"
} else {
    Write-Host "uv command not found in current PATH."
}

Write-Host "`n=== 3. UV_CACHE_DIR ENVIRONMENT VARIABLE ==="
$envProcess = [Environment]::GetEnvironmentVariable('UV_CACHE_DIR', 'Process')
$envUser    = [Environment]::GetEnvironmentVariable('UV_CACHE_DIR', 'User')
$envMachine = [Environment]::GetEnvironmentVariable('UV_CACHE_DIR', 'Machine')
Write-Host "UV_CACHE_DIR (Process): $envProcess"
Write-Host "UV_CACHE_DIR (User):    $envUser"
Write-Host "UV_CACHE_DIR (Machine): $envMachine"

Write-Host "`n=== 4. CURRENT UV CACHE DIRECTORY METRICS ==="
$cCachePath = "C:\Users\asus\AppData\Local\uv\cache"
if (Test-Path $cCachePath) {
    $measure = Get-ChildItem $cCachePath -Recurse -File -ErrorAction SilentlyContinue | Measure-Object -Property Length -Sum
    $mb = if ($measure.Sum) { [math]::Round($measure.Sum / 1MB, 2) } else { 0 }
    $gb = [math]::Round($mb / 1024, 2)
    Write-Host "Source Path: $cCachePath"
    Write-Host "Total Files: $($measure.Count)"
    Write-Host "Total Size:  $mb MB ($gb GB)"
} else {
    Write-Host "Source path not found: $cCachePath"
}

Write-Host "`n=== 5. ACTIVE PROCESSES AUDIT ==="
$procs = Get-Process -Name uv, uvx, python, python3, blender, node -ErrorAction SilentlyContinue
if ($procs) {
    $procs | Select-Object Id, ProcessName, WorkingSet64 | Format-Table -AutoSize
} else {
    Write-Host "No active uv, uvx, python, blender processes found."
}
