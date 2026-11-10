$sourceDir = 'D:\MCP\MADEL-Studio-Bridge\panels\panel-uxp-photoshop'
$distDir = 'D:\MCP\MADEL-Studio-Bridge\dist'
$zipPath = Join-Path $distDir 'MADEL-Studio-Bridge-Photoshop.zip'
$ccxPath = Join-Path $distDir 'MADEL-Studio-Bridge-Photoshop.ccx'
$auditWorkspace = 'D:\MCP\Adobe-Bridge-Audit\photoshop-test-workspace'

New-Item -ItemType Directory -Path $distDir -Force | Out-Null

if (Test-Path $zipPath) { Remove-Item $zipPath -Force }
if (Test-Path $ccxPath) { Remove-Item $ccxPath -Force }

$files = (Get-ChildItem $sourceDir).FullName
Compress-Archive -Path $files -DestinationPath $zipPath -Force
Move-Item $zipPath $ccxPath -Force
Copy-Item $ccxPath (Join-Path $auditWorkspace 'MADEL-Studio-Bridge-Photoshop.ccx') -Force

Write-Host "SUCCESS: Built CCX package at $ccxPath"
Get-Item $ccxPath | Select-Object FullName, Length, LastWriteTime
