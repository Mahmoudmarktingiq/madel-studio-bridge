# Create Unified MADEL Studio Bridge Architecture on D:\MCP
$base = 'D:\MCP\MADEL-Studio-Bridge'
$mcpRoot = 'D:\MCP'

$dirs = @(
    "$base\apps\photoshop",
    "$base\apps\blender",
    "$base\apps\capcut",
    "$base\apps\premiere",
    "$base\apps\after-effects",
    "$base\apps\illustrator",
    "$base\packages\core",
    "$base\packages\protocol",
    "$base\packages\server",
    "$base\adapters\photoshop-adapter",
    "$base\adapters\blender-adapter",
    "$base\adapters\capcut-adapter",
    "$base\adapters\premiere-adapter",
    "$base\integrations\chrome-devtools",
    "$base\integrations\stitch",
    "$base\clients\antigravity",
    "$base\clients\claude-code",
    "$base\clients\codex",
    "$base\installers\windows",
    "$base\installers\ccx",
    "$base\assets\branding",
    "$base\assets\icons",
    "$base\docs",
    "$base\tests\photoshop",
    "$base\tests\blender",
    "$base\tests\capcut",
    "$base\tests\e2e",
    "$mcpRoot\runtime\uv-cache",
    "$mcpRoot\runtime\ipc",
    "$mcpRoot\backups\configs",
    "$mcpRoot\backups\installed-plugins",
    "$mcpRoot\logs",
    "$mcpRoot\archives",
    "$mcpRoot\legacy\adobe-bridge-original"
)

foreach ($d in $dirs) {
    if (-not (Test-Path $d)) {
        New-Item -ItemType Directory -Path $d -Force | Out-Null
        Write-Host "Created: $d"
    } else {
        Write-Host "Exists:  $d"
    }
}
Write-Host "`nSUCCESS: Unified MADEL Studio Bridge directory tree initialized."
