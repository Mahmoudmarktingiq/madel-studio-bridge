# Safe Consolidation Script with SHA-256 Hash Verification
$ErrorActionPreference = 'Stop'

function Get-FileHashSha256($path) {
    if (Test-Path $path) {
        return (Get-FileHash -Path $path -Algorithm SHA256).Hash
    }
    return $null
}

Write-Host "1. Populating Assets..."
Copy-Item 'D:\MCP\MADEL-Studio-Bridge\panels\panel-uxp-photoshop\icons\*' 'D:\MCP\MADEL-Studio-Bridge\assets\icons' -Recurse -Force
Copy-Item 'D:\MCP\MADEL-Studio-Bridge\panels\panel-uxp-photoshop\icons\logo.svg' 'D:\MCP\MADEL-Studio-Bridge\assets\branding\logo.svg' -Force

Write-Host "2. Populating Photoshop Adapter..."
Copy-Item 'D:\MCP\MADEL-Studio-Bridge\panels\panel-uxp-photoshop\*' 'D:\MCP\MADEL-Studio-Bridge\adapters\photoshop-adapter' -Recurse -Force

Write-Host "3. Populating CCX Installers..."
Copy-Item 'D:\MCP\MADEL-Studio-Bridge\dist\MADEL-Studio-Bridge-Photoshop.ccx' 'D:\MCP\MADEL-Studio-Bridge\installers\ccx\MADEL-Studio-Bridge-Photoshop.ccx' -Force

Write-Host "4. Consolidating Config Backups into D:\MCP\backups\configs..."
Copy-Item 'D:\MCP\MADEL-Studio-Bridge\backups\mcp-configs\*' 'D:\MCP\backups\configs' -Recurse -Force

Write-Host "5. Consolidating Installed Plugin Backups into D:\MCP\backups\installed-plugins..."
Copy-Item 'D:\MCP\MADEL-Studio-Bridge\backups\installed-plugin\*' 'D:\MCP\backups\installed-plugins' -Recurse -Force

Write-Host "6. Mirroring Legacy Adobe-Bridge Original into D:\MCP\legacy..."
Copy-Item 'D:\MCP\Adobe-Bridge\server\*' 'D:\MCP\legacy\adobe-bridge-original' -Recurse -Force

Write-Host "7. Generating Checksums and Manifest..."
$filesToTrack = @(
    'D:\MCP\MADEL-Studio-Bridge\installers\ccx\MADEL-Studio-Bridge-Photoshop.ccx',
    'D:\MCP\MADEL-Studio-Bridge\adapters\photoshop-adapter\manifest.json',
    'D:\MCP\MADEL-Studio-Bridge\adapters\photoshop-adapter\index.html',
    'D:\MCP\MADEL-Studio-Bridge\adapters\photoshop-adapter\main.js',
    'D:\MCP\MADEL-Studio-Bridge\adapters\photoshop-adapter\bridge-client.js',
    'D:\MCP\MADEL-Studio-Bridge\adapters\photoshop-adapter\commands.js',
    'D:\MCP\MADEL-Studio-Bridge\assets\branding\logo.svg',
    'D:\MCP\backups\configs\mcp_config.json.20261110.bak',
    'D:\MCP\backups\configs\claude.json.20261110.bak',
    'D:\MCP\backups\configs\config.toml.20261110.bak'
)

$manifest = foreach ($f in $filesToTrack) {
    if (Test-Path $f) {
        $item = Get-Item $f
        [PSCustomObject]@{
            FileName = $item.Name
            Path = $f
            LengthBytes = $item.Length
            SHA256 = (Get-FileHash -Path $f -Algorithm SHA256).Hash
            LastWriteTime = $item.LastWriteTime.ToString("yyyy-MM-ddTHH:mm:ss")
        }
    }
}

$manifestJsonPath = 'D:\MCP\MADEL-Studio-Bridge\tools\MANIFEST.json'
$manifest | ConvertTo-Json -Depth 4 | Set-Content -Path $manifestJsonPath -Encoding utf8
Write-Host "SUCCESS: Manifest created at $manifestJsonPath"
$manifest | Format-Table -Property FileName, LengthBytes, SHA256 -AutoSize
