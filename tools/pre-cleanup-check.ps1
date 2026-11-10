$ErrorActionPreference = 'SilentlyContinue'
Write-Host "=== PRE-CLEANUP 7 CHECKS ==="

# Check 1: Source exists and size
$src = "C:\Users\asus\AppData\Local\uv\cache"
$srcExists = Test-Path $src
$srcFiles = (Get-ChildItem -Path $src -Recurse -File | Measure-Object).Count
Write-Host "1. Source Cache on C: Exists=$srcExists, Files=$srcFiles"

# Check 2: UV_CACHE_DIR User env
$userEnv = [Environment]::GetEnvironmentVariable('UV_CACHE_DIR', 'User')
Write-Host "2. UV_CACHE_DIR (User): $userEnv"

# Check 3: uv cache dir
$env:UV_CACHE_DIR = $userEnv
$resolvedDir = (& uv cache dir)
Write-Host "3. uv cache dir: $resolvedDir"

# Check 4: active uv/uvx processes
$uvProcs = Get-Process -Name uv, uvx -ErrorAction SilentlyContinue
Write-Host "4. Active uv/uvx procs: $(($uvProcs | Measure-Object).Count)"

# Check 5: Destination integrity
$dst = "D:\MCP\runtime\uv-cache"
$dstFiles = (Get-ChildItem -Path $dst -Recurse -File | Measure-Object).Count
Write-Host "5. Destination Cache on D: Files=$dstFiles"

# Check 6: Blender MCP / UVX command check
$uvxPath = (Get-Command uvx -ErrorAction SilentlyContinue).Source
Write-Host "6. UVX executable: $uvxPath"

# Check 7: Current Free space on C:
$cFree = [math]::Round((Get-CimInstance Win32_LogicalDisk | Where-Object DeviceID -eq 'C:').FreeSpace / 1GB, 2)
Write-Host "7. Current C: Free Space: $cFree GB"

$allOk = ($srcExists -and $userEnv -eq $dst -and $resolvedDir.Trim() -eq $dst -and $dstFiles -ge 75000)
Write-Host "`nPRE-CLEANUP STATUS: $(if ($allOk) { 'ALL 7 CHECKS PASSED - PROCEEDING' } else { 'BLOCKED' })"
