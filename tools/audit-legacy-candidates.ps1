# Audit legacy folders in D:\MCP and compute sizes and candidates
$ErrorActionPreference = 'SilentlyContinue'

Write-Host "=================================================="
Write-Host "MADEL Studio Bridge - Legacy Folders Deep Audit"
Write-Host "=================================================="

$legacyList = @(
    "Adobe-Bridge",
    "Adobe-Bridge-Audit",
    "MADEL-Studio-Bridge",
    "blender",
    "Capcat",
    "security-reports",
    "legacy",
    "archives",
    "backups",
    "logs",
    "runtime"
)

$results = @()

foreach ($folderName in $legacyList) {
    $folderPath = "D:\MCP\$folderName"
    if (-not (Test-Path $folderPath)) {
        continue
    }

    $files = Get-ChildItem -Path $folderPath -Recurse -File -ErrorAction SilentlyContinue
    $fileCount = if ($files) { ($files | Measure-Object).Count } else { 0 }
    $sumBytes  = if ($files) { ($files | Measure-Object -Property Length -Sum).Sum } else { 0 }
    $mb = [math]::Round($sumBytes / 1MB, 2)
    $gb = [math]::Round($mb / 1024, 2)

    # Assess usage and alternative
    $alt = ""
    $recommendation = ""
    $risk = ""
    $usage = ""

    switch ($folderName) {
        "runtime" {
            $alt = "Active Runtime (uv-cache + ipc)"
            $usage = "IN_USE (UV_CACHE_DIR points here!)"
            $risk = "CRITICAL"
            $recommendation = "KEEP"
        }
        "Adobe-Bridge" {
            $alt = "01-Projects\Installed\Adobe-Bridge"
            $usage = "INACTIVE (Daemon migrated to Installed)"
            $risk = "LOW"
            $recommendation = "ARCHIVE_OR_DELETE"
        }
        "MADEL-Studio-Bridge" {
            $alt = "01-Projects\Source\MADEL-Studio-Bridge"
            $usage = "INACTIVE (Canonical dev is now in Source)"
            $risk = "LOW"
            $recommendation = "ARCHIVE_OR_DELETE"
        }
        "blender" {
            $alt = "02-Blender\AlMawada-CNC\CNC-Product-Ad"
            $usage = "INACTIVE (Migrated to 02-Blender)"
            $risk = "LOW"
            $recommendation = "READY_FOR_DELETE"
        }
        "Capcat" {
            $alt = "03-CapCut\AlMawada-CNC\Raw-Edit-Commercial"
            $usage = "INACTIVE (Migrated to 03-CapCut)"
            $risk = "LOW"
            $recommendation = "READY_FOR_DELETE"
        }
        "Adobe-Bridge-Audit" {
            $alt = "04-Photoshop\MADEL\Multi-Client-Acceptance & docs/"
            $usage = "INACTIVE (Historical audit data)"
            $risk = "LOW"
            $recommendation = "ARCHIVE_OR_DELETE"
        }
        "security-reports" {
            $alt = "01-Projects\Source\MADEL-Studio-Bridge\docs"
            $usage = "INACTIVE (Historical P3 audit reports)"
            $risk = "LOW"
            $recommendation = "ARCHIVE"
        }
        "backups" {
            $alt = "01-Projects\Source\MADEL-Studio-Bridge\backups"
            $usage = "INACTIVE (Early backups)"
            $risk = "LOW"
            $recommendation = "ARCHIVE_OR_DELETE"
        }
        "legacy" {
            $alt = "01-Projects\Installed"
            $usage = "INACTIVE (adobe-bridge-original mirror)"
            $risk = "LOW"
            $recommendation = "ARCHIVE_OR_DELETE"
        }
        "archives" {
            $alt = "Empty directory"
            $usage = "EMPTY (0 files)"
            $risk = "NONE"
            $recommendation = "READY_FOR_DELETE"
        }
        "logs" {
            $alt = "Empty directory"
            $usage = "EMPTY (0 files)"
            $risk = "NONE"
            $recommendation = "READY_FOR_DELETE"
        }
    }

    $results += [PSCustomObject]@{
        Folder         = $folderName
        Files          = $fileCount
        SizeMB         = $mb
        SizeGB         = $gb
        Alternative    = $alt
        Usage          = $usage
        Risk           = $risk
        Recommendation = $recommendation
    }
}

$results | Format-Table -AutoSize
