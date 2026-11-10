# Create Mandatory Workspace Structure in D:\MCP
$ErrorActionPreference = 'Stop'

$dirs = @(
    "D:\MCP\01-Projects\Installed",
    "D:\MCP\01-Projects\Source",
    "D:\MCP\02-Blender",
    "D:\MCP\03-CapCut",
    "D:\MCP\04-Photoshop",
    "D:\MCP\05-Premiere",
    "D:\MCP\06-Illustrator",
    "D:\MCP\07-AfterEffects",
    "D:\MCP\08-Office",
    "D:\MCP\09-VideoScribe",
    "D:\MCP\10-Aspire",
    "D:\MCP\11-Other-Apps",
    "D:\MCP\.cursor\rules",
    "D:\MCP\.vscode",
    "D:\MCP\.roo"
)

foreach ($dir in $dirs) {
    if (-not (Test-Path $dir)) {
        New-Item -ItemType Directory -Path $dir -Force | Out-Null
        Write-Host "[CREATED] $dir"
    } else {
        Write-Host "[EXISTS]  $dir"
    }
}
Write-Host "`nAll base workspace directories created successfully."
