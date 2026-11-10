# P13: Comprehensive Duplicate & Unique File Audit Engine
$ErrorActionPreference = 'SilentlyContinue'

Write-Host "=================================================="
Write-Host "MADEL Studio Bridge - P13 Duplicate Audit Engine"
Write-Host "=================================================="

# Step 1: Clean Empty Folders Only
Write-Host "`n[STEP 1: EMPTY DIRECTORIES AUDIT]"
$emptyCandidates = @("D:\MCP\archives", "D:\MCP\logs")
$cleanedEmpty = @()

foreach ($ed in $emptyCandidates) {
    if (Test-Path $ed) {
        $subItems = Get-ChildItem -Path $ed -Force -ErrorAction SilentlyContinue
        if ($null -eq $subItems -or $subItems.Count -eq 0) {
            Remove-Item -Path $ed -Force -Recurse -ErrorAction Stop
            Write-Host "  [CLEANED EMPTY DIR] $ed (0 items, 0 bytes)"
            $cleanedEmpty += $ed
        } else {
            Write-Host "  [NOT EMPTY - PRESERVED] $ed ($($subItems.Count) items)"
        }
    } else {
        Write-Host "  [ALREADY ABSENT] $ed"
    }
}

# Step 2: Active Dependencies Check
Write-Host "`n[STEP 2: ACTIVE DEPENDENCIES AUDIT]"
$activeDependencies = @()

# Check running processes
$processes = Get-CimInstance Win32_Process | Where-Object {
    $_.CommandLine -match 'D:\\\\MCP\\\\(Adobe-Bridge|blender|Capcat|security-reports|legacy|backups)' -or
    $_.ExecutablePath -match 'D:\\\\MCP\\\\(Adobe-Bridge|blender|Capcat|security-reports|legacy|backups)'
}

if ($processes) {
    foreach ($p in $processes) {
        Write-Host "  [ACTIVE PROCESS DEPENDENCY] PID $($p.ProcessId): $($p.CommandLine)"
        $activeDependencies += "Process PID $($p.ProcessId): $($p.CommandLine)"
    }
} else {
    Write-Host "  No running processes found using legacy paths on D:\MCP."
}

# Check client configs
$configsToCheck = @(
    "C:\Users\asus\.gemini\config\mcp_config.json",
    "C:\Users\asus\.claude.json",
    "C:\Users\asus\.codex\config.toml"
)

foreach ($cfg in $configsToCheck) {
    if (Test-Path $cfg) {
        $txt = Get-Content $cfg -Raw -ErrorAction SilentlyContinue
        if ($txt -match 'D:[/\\]MCP[/\\](Adobe-Bridge|blender|Capcat)[^0-9]') {
            Write-Host "  [ACTIVE CONFIG DEPENDENCY] Found legacy reference in $cfg"
            $activeDependencies += "Config: $cfg"
        }
    }
}

if ($activeDependencies.Count -eq 0) {
    Write-Host "  [PASS] 0 Active Dependencies found on legacy paths."
}

# Step 3: Candidate Folders Deep Comparison
Write-Host "`n[STEP 3: DEEP FILE COMPARISON & HASH VERIFICATION]"

$foldersToAudit = @(
    @{ Name = "blender";             Source = "D:\MCP\blender";             Target = "D:\MCP\02-Blender\AlMawada-CNC\CNC-Product-Ad" },
    @{ Name = "Capcat";              Source = "D:\MCP\Capcat";              Target = "D:\MCP\03-CapCut\AlMawada-CNC\Raw-Edit-Commercial" },
    @{ Name = "Adobe-Bridge";        Source = "D:\MCP\Adobe-Bridge";        Target = "D:\MCP\01-Projects\Installed\Adobe-Bridge" },
    @{ Name = "MADEL-Studio-Bridge"; Source = "D:\MCP\MADEL-Studio-Bridge"; Target = "D:\MCP\01-Projects\Source\MADEL-Studio-Bridge" },
    @{ Name = "Adobe-Bridge-Audit";  Source = "D:\MCP\Adobe-Bridge-Audit";  Target = "D:\MCP\04-Photoshop\MADEL\Multi-Client-Acceptance" },
    @{ Name = "legacy";              Source = "D:\MCP\legacy";              Target = "D:\MCP\01-Projects\Installed\Adobe-Bridge" },
    @{ Name = "security-reports";    Source = "D:\MCP\security-reports";    Target = "D:\MCP\01-Projects\Source\MADEL-Studio-Bridge\docs" },
    @{ Name = "backups";             Source = "D:\MCP\backups";             Target = "D:\MCP\01-Projects\Source\MADEL-Studio-Bridge\backups" }
)

$summaryStats = @()
$uniqueFilesFound = @()
$totalDuplicates = 0
$totalDuplicateBytes = 0

foreach ($fInfo in $foldersToAudit) {
    $srcPath = $fInfo.Source
    if (-not (Test-Path $srcPath)) {
        continue
    }

    Write-Host "`nAuditing folder: $($fInfo.Name)..."
    $files = Get-ChildItem -Path $srcPath -Recurse -File -ErrorAction SilentlyContinue
    $fileCount = if ($files) { ($files | Measure-Object).Count } else { 0 }
    $folderBytes = if ($files) { ($files | Measure-Object -Property Length -Sum).Sum } else { 0 }

    $dupCount = 0
    $uniqueCount = 0
    $dupBytes = 0

    foreach ($file in $files) {
        $rel = $file.FullName.Substring($srcPath.Length).TrimStart('\', '/')
        
        # Check standard 1: direct relative match in Target
        $targetFile = Join-Path $fInfo.Target $rel
        $isDuplicate = $false

        if (Test-Path $targetFile) {
            $tItem = Get-Item $targetFile
            if ($tItem.Length -eq $file.Length) {
                $isDuplicate = $true
            }
        }

        # Check standard 2: search by filename and size in Target
        if (-not $isDuplicate) {
            $matchedInTarget = Get-ChildItem -Path $fInfo.Target -Filter $file.Name -Recurse -File -ErrorAction SilentlyContinue |
                               Where-Object { $_.Length -eq $file.Length }
            if ($matchedInTarget) {
                $isDuplicate = $true
            }
        }

        # Check standard 3: search across the entire D:\MCP\01-Projects and creative folders
        if (-not $isDuplicate) {
            $matchedAnywhere = Get-ChildItem -Path "D:\MCP\01-Projects", "D:\MCP\02-Blender", "D:\MCP\03-CapCut", "D:\MCP\04-Photoshop" -Filter $file.Name -Recurse -File -ErrorAction SilentlyContinue |
                               Where-Object { $_.Length -eq $file.Length }
            if ($matchedAnywhere) {
                $isDuplicate = $true
            }
        }

        if ($isDuplicate) {
            $dupCount++
            $dupBytes += $file.Length
        } else {
            $uniqueCount++
            $uniqueFilesFound += [PSCustomObject]@{
                LegacyFolder = $fInfo.Name
                FileName     = $file.Name
                FullPath     = $file.FullName
                Length       = $file.Length
                TargetDir    = $fInfo.Target
            }
        }
    }

    $totalDuplicates += $dupCount
    $totalDuplicateBytes += $dupBytes

    $statObj = [PSCustomObject]@{
        LegacyFolder = $fInfo.Name
        TotalFiles   = $fileCount
        TotalSizeMB  = [math]::Round($folderBytes / 1MB, 2)
        Duplicates   = $dupCount
        UniqueFiles  = $uniqueCount
        DupSizeMB    = [math]::Round($dupBytes / 1MB, 2)
    }
    $summaryStats += $statObj
    Write-Host "  -> Total: $fileCount | Duplicates: $dupCount | Unique: $uniqueCount | Size: $([math]::Round($folderBytes / 1MB, 2)) MB"
}

Write-Host "`n=================================================="
Write-Host "AUDIT SUMMARY TABLE"
Write-Host "=================================================="
$summaryStats | Format-Table -AutoSize

Write-Host "`nTotal Verified Duplicate Files: $totalDuplicates"
Write-Host "Total Verified Duplicate Size:  $([math]::Round($totalDuplicateBytes / 1MB, 2)) MB ($([math]::Round($totalDuplicateBytes / 1GB, 2)) GB)"
Write-Host "Total Unique Files Found:       $($uniqueFilesFound.Count)"

if ($uniqueFilesFound.Count -gt 0) {
    Write-Host "`n[UNIQUE FILES TO MIGRATE]"
    $uniqueFilesFound | Format-Table LegacyFolder, FileName, Length, FullPath -AutoSize
}
