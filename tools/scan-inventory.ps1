# Targeted MCP Inventory Script for MADEL Studio Bridge
$ErrorActionPreference = 'SilentlyContinue'

Write-Host "=== 1. SCANNING D:\MCP ==="
Get-ChildItem 'D:\MCP' -Directory | ForEach-Object {
    $measure = Get-ChildItem $_.FullName -Recurse -File -ErrorAction SilentlyContinue | Measure-Object -Property Length -Sum
    $mb = if ($measure.Sum) { [math]::Round($measure.Sum / 1MB, 2) } else { 0 }
    [PSCustomObject]@{
        Location = "D:\MCP"
        Folder = $_.Name
        Path = $_.FullName
        SizeMB = $mb
    }
} | Format-Table -AutoSize

Write-Host "`n=== 2. SCANNING D:\GoogleAntigravity ==="
if (Test-Path 'D:\GoogleAntigravity') {
    Get-ChildItem 'D:\GoogleAntigravity' -Directory | ForEach-Object {
        $measure = Get-ChildItem $_.FullName -Recurse -File -ErrorAction SilentlyContinue | Measure-Object -Property Length -Sum
        $mb = if ($measure.Sum) { [math]::Round($measure.Sum / 1MB, 2) } else { 0 }
        [PSCustomObject]@{
            Location = "D:\GoogleAntigravity"
            Folder = $_.Name
            SizeMB = $mb
        }
    } | Format-Table -AutoSize
} else {
    Write-Host "D:\GoogleAntigravity not found."
}

Write-Host "`n=== 3. SCANNING C: USER ROOT MCP DIRECTORIES ==="
$cUserTargets = @(
    'C:\Users\asus\.claude',
    'C:\Users\asus\.agents',
    'C:\Users\asus\.codex',
    'C:\Users\asus\.gemini',
    'C:\Users\asus\.brainferno-mcp-bridge'
)

foreach ($target in $cUserTargets) {
    if (Test-Path $target) {
        $measure = Get-ChildItem $target -Recurse -File -ErrorAction SilentlyContinue | Measure-Object -Property Length -Sum
        $mb = if ($measure.Sum) { [math]::Round($measure.Sum / 1MB, 2) } else { 0 }
        Write-Host "Found: $target | Size: $mb MB"
        
        # Sub-directories summary for heavy spots
        Get-ChildItem $target -Directory -ErrorAction SilentlyContinue | ForEach-Object {
            $subMeasure = Get-ChildItem $_.FullName -Recurse -File -ErrorAction SilentlyContinue | Measure-Object -Property Length -Sum
            $subMb = if ($subMeasure.Sum) { [math]::Round($subMeasure.Sum / 1MB, 2) } else { 0 }
            if ($subMb -gt 5) {
                Write-Host "   --> $($_.Name): $subMb MB"
            }
        }
    } else {
        Write-Host "Not present: $target"
    }
}

Write-Host "`n=== 4. SCANNING TARGETED APPDATA MCP/TOOL DIRECTORIES ==="
$appDataTargets = @(
    'C:\Users\asus\AppData\Roaming\Claude',
    'C:\Users\asus\AppData\Roaming\Code\User',
    'C:\Users\asus\AppData\Roaming\Cursor\User',
    'C:\Users\asus\AppData\Roaming\Adobe\UXP\Plugins\External',
    'C:\Users\asus\AppData\Roaming\npm',
    'C:\Users\asus\AppData\Local\Temp\brainferno-mcp-bridge',
    'C:\Users\asus\AppData\Local\uv\cache',
    'C:\Users\asus\AppData\Local\Programs\Antigravity'
)

foreach ($target in $appDataTargets) {
    if (Test-Path $target) {
        $measure = Get-ChildItem $target -Recurse -File -ErrorAction SilentlyContinue | Measure-Object -Property Length -Sum
        $mb = if ($measure.Sum) { [math]::Round($measure.Sum / 1MB, 2) } else { 0 }
        Write-Host "Target: $target | Size: $mb MB"
    } else {
        Write-Host "Not present: $target"
    }
}
