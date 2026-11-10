# Comprehensive Creative Projects Audit Script (P12)
$ErrorActionPreference = 'SilentlyContinue'

Write-Host "=================================================="
Write-Host "MADEL Studio Bridge - Creative Projects Integrity Audit"
Write-Host "=================================================="

# 1. Blender Projects Audit
Write-Host "`n[1. AUDITING 02-Blender]"
$blenderRoot = "D:\MCP\02-Blender"
$blenderProjects = Get-ChildItem -Path $blenderRoot -Directory -Recurse | Where-Object { Test-Path "$($_.FullName)\PROJECT_INFO.md" }

foreach ($bp in $blenderProjects) {
    Write-Host "  Found Project: $($bp.FullName.Replace('D:\MCP\02-Blender\', ''))"
    $blends = Get-ChildItem -Path $bp.FullName -Filter *.blend -Recurse
    $assets = Get-ChildItem -Path "$($bp.FullName)\02-Assets" -Recurse -File
    $previews = Get-ChildItem -Path "$($bp.FullName)\04-Previews" -Recurse -File
    $exports = Get-ChildItem -Path "$($bp.FullName)\05-Exports" -Recurse -File
    $reports = Get-ChildItem -Path "$($bp.FullName)\06-Reports" -Recurse -File

    Write-Host "    .blend Files: $($blends.Count)"
    $blends | ForEach-Object { Write-Host "      - $($_.Name) ($([math]::Round($_.Length / 1MB, 2)) MB)" }
    Write-Host "    Assets Count:   $($assets.Count)"
    Write-Host "    Previews Count: $($previews.Count)"
    Write-Host "    Exports Count:  $($exports.Count)"
    Write-Host "    Reports Count:  $($reports.Count)"
}

# 2. CapCut Projects Audit
Write-Host "`n[2. AUDITING 03-CapCut]"
$capcutRoot = "D:\MCP\03-CapCut"
$capcutProjects = Get-ChildItem -Path $capcutRoot -Directory -Recurse | Where-Object { Test-Path "$($_.FullName)\PROJECT_INFO.md" }

foreach ($cp in $capcutProjects) {
    Write-Host "  Found Project: $($cp.FullName.Replace('D:\MCP\03-CapCut\', ''))"
    $draftJsons = Get-ChildItem -Path "$($cp.FullName)\03-Project" -Include draft_content.json, draft_info.json -Recurse -File
    Write-Host "    CapCut Draft Files: $($draftJsons.Count)"

    # Check for legacy paths in JSONs
    $legacyPathMatches = 0
    foreach ($dj in $draftJsons) {
        $content = Get-Content $dj.FullName -Raw -ErrorAction SilentlyContinue
        if ($content -match "D:[/\\]MCP[/\\]Capcat") {
            $legacyPathMatches++
            Write-Host "    [!] Legacy path found in: $($dj.FullName)"
        }
    }
    Write-Host "    Legacy Path Matches: $legacyPathMatches"

    $cpAssets = Get-ChildItem -Path "$($cp.FullName)\02-Assets" -Recurse -File
    $cpPreviews = Get-ChildItem -Path "$($cp.FullName)\04-Previews" -Recurse -File
    $cpExports = Get-ChildItem -Path "$($cp.FullName)\05-Exports" -Recurse -File
    $cpReports = Get-ChildItem -Path "$($cp.FullName)\06-Reports" -Recurse -File

    Write-Host "    Assets Count:   $($cpAssets.Count)"
    Write-Host "    Previews Count: $($cpPreviews.Count)"
    Write-Host "    Exports Count:  $($cpExports.Count)"
    Write-Host "    Reports Count:  $($cpReports.Count)"
}

# 3. Photoshop Projects Audit
Write-Host "`n[3. AUDITING 04-Photoshop]"
$psRoot = "D:\MCP\04-Photoshop"
$psProjects = Get-ChildItem -Path $psRoot -Directory -Recurse | Where-Object { Test-Path "$($_.FullName)\PROJECT_INFO.md" }

foreach ($pp in $psProjects) {
    Write-Host "  Found Project: $($pp.FullName.Replace('D:\MCP\04-Photoshop\', ''))"
    $psds = Get-ChildItem -Path "$($pp.FullName)\03-Project" -Filter *.psd -Recurse
    $pngs = Get-ChildItem -Path "$($pp.FullName)\04-Previews" -Filter *.png -Recurse
    Write-Host "    PSD Files: $($psds.Count)"
    $psds | ForEach-Object { Write-Host "      - $($_.Name) ($([math]::Round($_.Length / 1KB, 2)) KB)" }
    Write-Host "    Previews:  $($pngs.Count)"
}

Write-Host "`nCreative projects audit completed."
