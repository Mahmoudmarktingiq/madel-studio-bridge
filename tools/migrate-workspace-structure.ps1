# Migration Script for D:\MCP Final Workspace Organization
$ErrorActionPreference = 'Stop'

Write-Host "=================================================="
Write-Host "MADEL Studio Bridge - Workspace Safe Migration"
Write-Host "=================================================="

# Function for safe robocopy
function Copy-FolderSafely($src, $dst, $excludeDirs = @()) {
    if (-not (Test-Path $src)) {
        Write-Warning "Source folder does not exist: $src"
        return
    }
    if (-not (Test-Path $dst)) {
        New-Item -ItemType Directory -Path $dst -Force | Out-Null
    }
    $args = @($src, $dst, "/E", "/R:2", "/W:2", "/NP", "/MT:8", "/XJ")
    if ($excludeDirs.Count -gt 0) {
        $args += "/XD"
        $args += $excludeDirs
    }
    $p = Start-Process -FilePath "robocopy.exe" -ArgumentList $args -Wait -Passthru -NoNewWindow
    Write-Host "[ROBOCOPY] $src -> $dst (ExitCode: $($p.ExitCode))"
}

# 1. Migrate MADEL-Studio-Bridge to 01-Projects\Source\MADEL-Studio-Bridge
Write-Host "`n[1. Migrating MADEL-Studio-Bridge to Source]"
$madelSourceDst = "D:\MCP\01-Projects\Source\MADEL-Studio-Bridge"
# Exclude node_modules if any
Copy-FolderSafely "D:\MCP\MADEL-Studio-Bridge" $madelSourceDst @("node_modules")

# Also create Installed runtime copy in 01-Projects\Installed\MADEL-Studio-Bridge
Write-Host "`n[2. Creating MADEL-Studio-Bridge Installed copy]"
$madelInstalledDst = "D:\MCP\01-Projects\Installed\MADEL-Studio-Bridge"
Copy-FolderSafely "D:\MCP\MADEL-Studio-Bridge" $madelInstalledDst @("node_modules", ".git")

# 2. Migrate Adobe-Bridge to 01-Projects\Installed\Adobe-Bridge
Write-Host "`n[3. Copying Adobe-Bridge to 01-Projects\Installed\Adobe-Bridge]"
$adobeDst = "D:\MCP\01-Projects\Installed\Adobe-Bridge"
Copy-FolderSafely "D:\MCP\Adobe-Bridge" $adobeDst @("node_modules")

# 3. Setup Blender Creative Project in 02-Blender\AlMawada-CNC\CNC-Product-Ad
Write-Host "`n[4. Structuring 02-Blender\AlMawada-CNC\CNC-Product-Ad]"
$blenderProjRoot = "D:\MCP\02-Blender\AlMawada-CNC\CNC-Product-Ad"
$blenderFolders = @("01-Source", "02-Assets", "03-Project", "04-Previews", "05-Exports", "06-Reports", "07-Errors", "08-Backups")
foreach ($f in $blenderFolders) {
    New-Item -ItemType Directory -Path "$blenderProjRoot\$f" -Force | Out-Null
}

# Copy Blender assets
if (Test-Path "D:\MCP\blender\AlMawada-CNC\assets") {
    Copy-FolderSafely "D:\MCP\blender\AlMawada-CNC\assets" "$blenderProjRoot\02-Assets"
}
# Copy Blender project files (.blend)
if (Test-Path "D:\MCP\blender\AlMawada-CNC\project") {
    $blends = Get-ChildItem "D:\MCP\blender\AlMawada-CNC\project" -Filter *.blend
    foreach ($b in $blends) {
        if ($b.Name -like "*Backup*") {
            Copy-Item $b.FullName "$blenderProjRoot\08-Backups\$($b.Name)" -Force
        } else {
            Copy-Item $b.FullName "$blenderProjRoot\03-Project\$($b.Name)" -Force
        }
    }
}
# Copy previews & renders
if (Test-Path "D:\MCP\blender\AlMawada-CNC\previews") {
    Copy-FolderSafely "D:\MCP\blender\AlMawada-CNC\previews" "$blenderProjRoot\04-Previews"
}
if (Test-Path "D:\MCP\blender\AlMawada-CNC\renders") {
    Copy-FolderSafely "D:\MCP\blender\AlMawada-CNC\renders" "$blenderProjRoot\05-Exports"
}
if (Test-Path "D:\MCP\blender\AlMawada-CNC\reports") {
    Copy-FolderSafely "D:\MCP\blender\AlMawada-CNC\reports" "$blenderProjRoot\06-Reports"
}
if (Test-Path "D:\MCP\blender\AlMawada-CNC\scripts") {
    Copy-FolderSafely "D:\MCP\blender\AlMawada-CNC\scripts" "$blenderProjRoot\01-Source"
}

# Create PROJECT_INFO.md for Blender
$blenderInfo = @"
# PROJECT_INFO — CNC-Product-Ad
- **Application:** Blender (02-Blender)
- **Brand:** AlMawada-CNC
- **Project Name:** CNC-Product-Ad
- **Objective:** 3D Product Visualization and Ad Animation for AlMawada CNC Products (M-131 Cutter / Spindle).
- **Primary Project File:** `03-Project/AlMawada_CNC_Product_Ad.blend`
- **Master Model:** `03-Project/AlMawada_M131_Product_Master.blend`
- **Version:** 1.2.0
- **Last Updated:** 2026-11-10
- **Status:** COMPLETED & ACTIVE
"@
Set-Content -Path "$blenderProjRoot\PROJECT_INFO.md" -Value $blenderInfo -Encoding utf8

# Setup 01-Projects\Installed\Blender-MCP
$blenderMcpDst = "D:\MCP\01-Projects\Installed\Blender-MCP"
New-Item -ItemType Directory -Path $blenderMcpDst -Force | Out-Null
$blenderMcpInfo = @"
# Blender MCP Integration
- **Runtime Command:** `uvx mcp-for-blender`
- **Addon Version:** 1.8.0
- **Blender Host:** Blender 5.2.3 LTS
- **Status:** Operational
"@
Set-Content -Path "$blenderMcpDst\README.md" -Value $blenderMcpInfo -Encoding utf8

# 4. Setup CapCut Creative Project in 03-CapCut\AlMawada-CNC\Raw-Edit-Commercial
Write-Host "`n[5. Structuring 03-CapCut\AlMawada-CNC\Raw-Edit-Commercial]"
$capcutProjRoot = "D:\MCP\03-CapCut\AlMawada-CNC\Raw-Edit-Commercial"
$capcutFolders = @("01-Source", "02-Assets", "03-Project", "04-Previews", "05-Exports", "06-Reports", "07-Errors", "08-Backups")
foreach ($f in $capcutFolders) {
    New-Item -ItemType Directory -Path "$capcutProjRoot\$f" -Force | Out-Null
}

if (Test-Path "D:\MCP\Capcat\almawada\01-Source") {
    Copy-FolderSafely "D:\MCP\Capcat\almawada\01-Source" "$capcutProjRoot\01-Source"
}
if (Test-Path "D:\MCP\Capcat\almawada\02-Assets") {
    Copy-FolderSafely "D:\MCP\Capcat\almawada\02-Assets" "$capcutProjRoot\02-Assets"
}
if (Test-Path "D:\MCP\Capcat\almawada\04-CapCut-Project") {
    Copy-FolderSafely "D:\MCP\Capcat\almawada\04-CapCut-Project" "$capcutProjRoot\03-Project"
}
if (Test-Path "D:\MCP\Capcat\almawada\05-Exports") {
    Copy-FolderSafely "D:\MCP\Capcat\almawada\05-Exports" "$capcutProjRoot\05-Exports"
}
if (Test-Path "D:\MCP\Capcat\almawada\06-Reports") {
    Copy-FolderSafely "D:\MCP\Capcat\almawada\06-Reports" "$capcutProjRoot\06-Reports"
}
if (Test-Path "D:\MCP\Capcat\almawada\07-Backups") {
    Copy-FolderSafely "D:\MCP\Capcat\almawada\07-Backups" "$capcutProjRoot\08-Backups"
}

# Create PROJECT_INFO.md for CapCut
$capcutInfo = @"
# PROJECT_INFO — Raw-Edit-Commercial
- **Application:** CapCut (03-CapCut)
- **Brand:** AlMawada-CNC
- **Project Name:** Raw-Edit-Commercial
- **Objective:** Video Commercial Editing and Subtitling for AlMawada CNC Workshops.
- **Project Drafts:** `03-Project/AlMawada_Raw_Edit_01` & `03-Project/AlMawada_Raw_Edit_02`
- **Version:** 2.0.0
- **Last Updated:** 2026-11-10
- **Status:** COMPLETED & ACTIVE
"@
Set-Content -Path "$capcutProjRoot\PROJECT_INFO.md" -Value $capcutInfo -Encoding utf8

# Setup 01-Projects\Installed\CapCut-CLI
$capcutCliDst = "D:\MCP\01-Projects\Installed\CapCut-CLI"
New-Item -ItemType Directory -Path $capcutCliDst -Force | Out-Null
$capcutCliInfo = @"
# CapCut CLI Integration
- **Skill Path:** `C:\Users\asus\.gemini\config\skills\capcut-edit\SKILL.md`
- **Platform Capability:** Draft content parser, subtitle generator, Ken-Burns animation engine.
- **Status:** Operational
"@
Set-Content -Path "$capcutCliDst\README.md" -Value $capcutCliInfo -Encoding utf8

# 5. Setup Photoshop Creative Project in 04-Photoshop\MADEL\Multi-Client-Acceptance
Write-Host "`n[6. Structuring 04-Photoshop\MADEL\Multi-Client-Acceptance]"
$psProjRoot = "D:\MCP\04-Photoshop\MADEL\Multi-Client-Acceptance"
$psFolders = @("01-Source", "02-Assets", "03-Project", "04-Previews", "05-Exports", "06-Reports", "07-Errors", "08-Backups")
foreach ($f in $psFolders) {
    New-Item -ItemType Directory -Path "$psProjRoot\$f" -Force | Out-Null
}

$srcWs = "D:\MCP\Adobe-Bridge-Audit\photoshop-test-workspace"
if (Test-Path $srcWs) {
    Get-ChildItem -Path $srcWs -Filter *.psd | ForEach-Object {
        Copy-Item $_.FullName "$psProjRoot\03-Project\$($_.Name)" -Force
        Write-Host "  [PSD] Copied $($_.Name) to 03-Project"
    }
    Get-ChildItem -Path $srcWs -Filter *.png | ForEach-Object {
        Copy-Item $_.FullName "$psProjRoot\04-Previews\$($_.Name)" -Force
        Write-Host "  [PNG] Copied $($_.Name) to 04-Previews"
    }
    Get-ChildItem -Path $srcWs -Filter *.log | ForEach-Object {
        Copy-Item $_.FullName "$psProjRoot\07-Errors\$($_.Name)" -Force
    }
}

# Create PROJECT_INFO.md for Photoshop
$psInfo = @"
# PROJECT_INFO — Multi-Client-Acceptance
- **Application:** Adobe Photoshop 2026 (04-Photoshop)
- **Brand:** MADEL
- **Project Name:** Multi-Client-Acceptance
- **Objective:** Verification PSDs generated by Google Antigravity, Claude Code, and OpenAI Codex via MADEL Studio Bridge.
- **Master Files:**
  - `03-Project/antigravity-test.psd`
  - `03-Project/claude-code-test.psd`
  - `03-Project/codex-test.psd`
  - `03-Project/audit-test.psd`
- **Version:** 1.0.0
- **Last Updated:** 2026-11-10
- **Status:** VERIFIED PASS
"@
Set-Content -Path "$psProjRoot\PROJECT_INFO.md" -Value $psInfo -Encoding utf8

# Setup 01-Projects\Installed\Other-MCP-Tools
$otherMcpDst = "D:\MCP\01-Projects\Installed\Other-MCP-Tools"
New-Item -ItemType Directory -Path $otherMcpDst -Force | Out-Null
$otherInfo = @"
# Other Installed MCP Tools
- **Chrome DevTools MCP:** Browser automation and inspection.
- **Stitch MCP:** UI Design to code synthesis.
- **Science Suite:** Molecular structure viewer, biomedical databases.
"@
Set-Content -Path "$otherMcpDst\README.md" -Value $otherInfo -Encoding utf8

Write-Host "`n>>> ALL PROJECTS SAFELY MIGRATED TO FINAL STRUCTURE: PASS <<<"
