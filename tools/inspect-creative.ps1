# Inspect Blender and CapCat projects in detail
$ErrorActionPreference = 'SilentlyContinue'

Write-Host "=== BLENDER ALMAWADA-CNC ==="
Get-ChildItem -Path "D:\MCP\blender\AlMawada-CNC" -Recurse | Select-Object FullName, Length | Format-Table -AutoSize

Write-Host "`n=== CAPCAT ALMAWADA ==="
Get-ChildItem -Path "D:\MCP\Capcat\almawada" -Depth 3 | Select-Object FullName, Length | Format-Table -AutoSize
