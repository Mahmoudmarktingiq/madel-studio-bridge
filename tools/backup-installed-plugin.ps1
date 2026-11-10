$installedDir = 'C:\Users\asus\AppData\Roaming\Adobe\UXP\Plugins\External\com.brainferno.mcp-bridge.photoshop_0.3.4'
$backupParent = 'D:\MCP\MADEL-Studio-Bridge\backups\installed-plugin'
$backupDir = Join-Path $backupParent 'com.brainferno.mcp-bridge.photoshop_0.3.4.20261110.bak'

New-Item -ItemType Directory -Path $backupParent -Force | Out-Null

if (Test-Path $installedDir) {
    Copy-Item $installedDir $backupDir -Recurse -Force
    Write-Host "SUCCESS: Backup created at $backupDir"
    Get-Item $backupDir | Select-Object FullName, LastWriteTime
} else {
    Write-Host "ERROR: Installed directory not found at $installedDir"
}
