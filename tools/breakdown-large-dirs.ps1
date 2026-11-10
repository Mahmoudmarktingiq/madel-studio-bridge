# Breakdown of large directories
$ErrorActionPreference = 'SilentlyContinue'

function Report-Subdirs($parentPath) {
    Write-Host "`n--- Breakdown: $parentPath ---"
    if (-not (Test-Path $parentPath)) {
        Write-Host "Does not exist."
        return
    }
    Get-ChildItem $parentPath -Directory | ForEach-Object {
        $measure = Get-ChildItem $_.FullName -Recurse -File -ErrorAction SilentlyContinue | Measure-Object -Property Length -Sum
        $mb = if ($measure.Sum) { [math]::Round($measure.Sum / 1MB, 2) } else { 0 }
        [PSCustomObject]@{
            Directory = $_.Name
            SizeMB = $mb
        }
    } | Sort-Object -Property SizeMB -Descending | Format-Table -AutoSize
}

Report-Subdirs 'C:\Users\asus\.claude'
Report-Subdirs 'C:\Users\asus\.codex'
Report-Subdirs 'C:\Users\asus\.gemini'
Report-Subdirs 'C:\Users\asus\AppData\Local\uv'
Report-Subdirs 'D:\MCP'
