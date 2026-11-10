# Final Comprehensive QA Verification Script for D:\MCP Reorganization
$ErrorActionPreference = 'SilentlyContinue'

Write-Host "=================================================="
Write-Host "MADEL Studio Bridge - Final Workspace QA Audit"
Write-Host "=================================================="

# Check 1: Mandatory top-level directories
Write-Host "`n[1. Mandatory Top-Level Directories]"
$topDirs = @(
    "01-Projects", "02-Blender", "03-CapCut", "04-Photoshop",
    "05-Premiere", "06-Illustrator", "07-AfterEffects", "08-Office",
    "09-VideoScribe", "10-Aspire", "11-Other-Apps"
)
$allDirsOk = $true
foreach ($d in $topDirs) {
    $exists = Test-Path "D:\MCP\$d"
    Write-Host "  Directory D:\MCP\$d : $(if ($exists) { '[OK]' } else { '[MISSING]' })"
    if (-not $exists) { $allDirsOk = $false }
}
Write-Host "Top-level directories check: $(if ($allDirsOk) { 'PASS' } else { 'FAIL' })"

# Check 2: Mandatory AI instruction files
Write-Host "`n[2. AI Instruction & Configuration Files]"
$aiFiles = @(
    "AGENTS.md", "CLAUDE.md", "CODEX.md", "GEMINI.md",
    ".cursorrules", ".cursor\rules\workspace.mdc",
    ".windsurfrules", ".clinerules", ".roomodes",
    ".roo\rules.md", ".vscode\settings.json"
)
$allAiOk = $true
foreach ($f in $aiFiles) {
    $exists = Test-Path "D:\MCP\$f"
    Write-Host "  File D:\MCP\$f : $(if ($exists) { '[OK]' } else { '[MISSING]' })"
    if (-not $exists) { $allAiOk = $false }
}
Write-Host "AI configuration files check: $(if ($allAiOk) { 'PASS' } else { 'FAIL' })"

# Check 3: Software projects organization
Write-Host "`n[3. Software Projects Structure (01-Projects)]"
$instMadel   = Test-Path "D:\MCP\01-Projects\Installed\MADEL-Studio-Bridge"
$instAdobe   = Test-Path "D:\MCP\01-Projects\Installed\Adobe-Bridge"
$instBlender = Test-Path "D:\MCP\01-Projects\Installed\Blender-MCP"
$instCapcut  = Test-Path "D:\MCP\01-Projects\Installed\CapCut-CLI"
$instOther   = Test-Path "D:\MCP\01-Projects\Installed\Other-MCP-Tools"
$srcMadel    = Test-Path "D:\MCP\01-Projects\Source\MADEL-Studio-Bridge"
$srcTest     = Test-Path "D:\MCP\01-Projects\Source\Test-MCP-Tool"

Write-Host "  Installed MADEL-Studio-Bridge: $(if ($instMadel) { '[OK]' } else { '[MISSING]' })"
Write-Host "  Installed Adobe-Bridge:        $(if ($instAdobe) { '[OK]' } else { '[MISSING]' })"
Write-Host "  Installed Blender-MCP:         $(if ($instBlender) { '[OK]' } else { '[MISSING]' })"
Write-Host "  Installed CapCut-CLI:          $(if ($instCapcut) { '[OK]' } else { '[MISSING]' })"
Write-Host "  Installed Other-MCP-Tools:     $(if ($instOther) { '[OK]' } else { '[MISSING]' })"
Write-Host "  Source MADEL-Studio-Bridge:    $(if ($srcMadel) { '[OK]' } else { '[MISSING]' })"
Write-Host "  Source Test-MCP-Tool:          $(if ($srcTest) { '[OK]' } else { '[MISSING]' })"
$softwareOk = ($instMadel -and $instAdobe -and $instBlender -and $instCapcut -and $instOther -and $srcMadel -and $srcTest)
Write-Host "Software projects check: $(if ($softwareOk) { 'PASS' } else { 'FAIL' })"

# Check 4: Creative projects & 8-folder standard
Write-Host "`n[4. Creative Projects & 8-Folder Standard]"
function Check-CreativeProject($rootPath) {
    if (-not (Test-Path $rootPath)) { return $false }
    $sub = @("01-Source", "02-Assets", "03-Project", "04-Previews", "05-Exports", "06-Reports", "07-Errors", "08-Backups")
    $allSub = $true
    foreach ($s in $sub) {
        if (-not (Test-Path "$rootPath\$s")) { $allSub = $false }
    }
    $infoOk = Test-Path "$rootPath\PROJECT_INFO.md"
    return ($allSub -and $infoOk)
}

$blenderProjOk  = Check-CreativeProject "D:\MCP\02-Blender\AlMawada-CNC\CNC-Product-Ad"
$capcutProjOk   = Check-CreativeProject "D:\MCP\03-CapCut\AlMawada-CNC\Raw-Edit-Commercial"
$psMadelOk      = Check-CreativeProject "D:\MCP\04-Photoshop\MADEL\Multi-Client-Acceptance"
$psLorisOk      = Check-CreativeProject "D:\MCP\04-Photoshop\Loris\Social-Design-01"

Write-Host "  02-Blender CNC-Product-Ad:         $(if ($blenderProjOk) { '[PASS (8/8 + INFO)]' } else { '[FAIL]' })"
Write-Host "  03-CapCut Raw-Edit-Commercial:     $(if ($capcutProjOk) { '[PASS (8/8 + INFO)]' } else { '[FAIL]' })"
Write-Host "  04-Photoshop Multi-Client-Accept:  $(if ($psMadelOk) { '[PASS (8/8 + INFO)]' } else { '[FAIL]' })"
Write-Host "  04-Photoshop Loris Social-Design:  $(if ($psLorisOk) { '[PASS (8/8 + INFO)]' } else { '[FAIL]' })"

$creativeOk = ($blenderProjOk -and $capcutProjOk -and $psMadelOk -and $psLorisOk)
Write-Host "Creative projects check: $(if ($creativeOk) { 'PASS' } else { 'FAIL' })"

# Check 5: Documentation Suite (10 Workspace Docs)
Write-Host "`n[5. Workspace Documentation Suite (10 Docs)]"
$docDir = "D:\MCP\01-Projects\Source\MADEL-Studio-Bridge\docs\workspace"
$docs = @(
    "WORKSPACE_STRUCTURE.md", "MIGRATION_PLAN.md", "MIGRATION_MANIFEST.md",
    "PROJECT_INDEX.md", "NAMING_CONVENTIONS.md", "AI_WORKSPACE_RULES.md",
    "PROJECT_TEMPLATES.md", "PROJECT_PROGRESS.md", "QA_REPORT.md", "ERROR_LOG.md"
)
$allDocsOk = $true
foreach ($d in $docs) {
    $exists = Test-Path "$docDir\$d"
    Write-Host "  Doc $d : $(if ($exists) { '[OK]' } else { '[MISSING]' })"
    if (-not $exists) { $allDocsOk = $false }
}
Write-Host "Documentation suite check: $(if ($allDocsOk) { 'PASS' } else { 'FAIL' })"

# Check 6: Project Generator Verification
Write-Host "`n[6. Project Generator System]"
$genJs = Test-Path "D:\MCP\01-Projects\Source\MADEL-Studio-Bridge\tools\project-generator\generator.js"
$genPs = Test-Path "D:\MCP\01-Projects\Source\MADEL-Studio-Bridge\tools\project-generator\project-generator.ps1"
Write-Host "  generator.js: $(if ($genJs) { '[OK]' } else { '[MISSING]' })"
Write-Host "  project-generator.ps1: $(if ($genPs) { '[OK]' } else { '[MISSING]' })"
$genOk = ($genJs -and $genPs)
Write-Host "Project generator check: $(if ($genOk) { 'PASS' } else { 'FAIL' })"

# Check 7: Primary Daemon & Named Pipe Health
Write-Host "`n[7. MCP Runtime & Daemon Status]"
$pipes = [System.IO.Directory]::GetFiles('\\.\pipe\', 'brainferno*')
$daemon = Get-Process -Id 33328 -ErrorAction SilentlyContinue
Write-Host "  Primary Daemon (PID 33328): $(if ($daemon) { '[RUNNING]' } else { '[STOPPED]' })"
Write-Host "  Active Pipes: $($pipes -join ', ')"
$pipeOk = ($pipes -contains '\\.\pipe\brainferno-mcp-bridge' -and $daemon)
Write-Host "MCP Daemon & Pipe check: $(if ($pipeOk) { 'PASS' } else { 'FAIL' })"

Write-Host "`n=================================================="
Write-Host "FINAL REORGANIZATION VERIFICATION SUMMARY"
Write-Host "1. Top-Level Dirs:     $(if ($allDirsOk) { 'PASS' } else { 'FAIL' })"
Write-Host "2. AI Rule Files:      $(if ($allAiOk) { 'PASS' } else { 'FAIL' })"
Write-Host "3. Software Projects:  $(if ($softwareOk) { 'PASS' } else { 'FAIL' })"
Write-Host "4. Creative Projects:  $(if ($creativeOk) { 'PASS' } else { 'FAIL' })"
Write-Host "5. Workspace Docs:     $(if ($allDocsOk) { 'PASS' } else { 'FAIL' })"
Write-Host "6. Project Generator:  $(if ($genOk) { 'PASS' } else { 'FAIL' })"
Write-Host "7. Daemon & Pipes:     $(if ($pipeOk) { 'PASS' } else { 'FAIL' })"
Write-Host "=================================================="

$masterPass = ($allDirsOk -and $allAiOk -and $softwareOk -and $creativeOk -and $allDocsOk -and $genOk -and $pipeOk)
Write-Host "FINAL OUTCOME: $(if ($masterPass) { '100% PASS — REORGANIZATION COMPLETE' } else { 'FAIL' })"
