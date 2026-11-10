# Inspect all top-level directories in D:\MCP
$ErrorActionPreference = 'SilentlyContinue'

$dirs = Get-ChildItem -Path 'D:\MCP' -Directory
foreach ($d in $dirs) {
    Write-Host "================ $($d.Name) ================"
    $items = Get-ChildItem -Path $d.FullName
    $fileCount = (Get-ChildItem -Path $d.FullName -Recurse -File -ErrorAction SilentlyContinue | Measure-Object).Count
    $dirSize = (Get-ChildItem -Path $d.FullName -Recurse -File -ErrorAction SilentlyContinue | Measure-Object -Property Length -Sum).Sum
    $mb = [math]::Round($dirSize / 1MB, 2)
    Write-Host "Total Files: $fileCount | Total Size: $mb MB"
    Write-Host "Top-level Items:"
    $items | ForEach-Object {
        $type = if ($_.PSIsContainer) { "<DIR>" } else { "<FILE>" }
        Write-Host "  $type $($_.Name)"
    }
    
    # Check for design/creative file types (.blend, .psd, .prproj, .aep, .ai, draft_content.json)
    $creativeFiles = Get-ChildItem -Path $d.FullName -Recurse -File -Include *.blend, *.psd, *.prproj, *.aep, *.ai, draft_content.json, draft_info.json -ErrorAction SilentlyContinue
    if ($creativeFiles) {
        Write-Host "  [!] Found Creative Files in $($d.Name):"
        $creativeFiles | Select-Object -First 10 | ForEach-Object { Write-Host "     -> $($_.FullName)" }
    }
}
