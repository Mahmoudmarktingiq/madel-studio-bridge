# Targeted MCP Component Size and Details
$ErrorActionPreference = 'SilentlyContinue'

function Get-DirSizeMB($path) {
    if (-not (Test-Path $path)) { return 0 }
    $m = Get-ChildItem $path -Recurse -File -ErrorAction SilentlyContinue | Measure-Object -Property Length -Sum
    if ($m.Sum) { return [math]::Round($m.Sum / 1MB, 2) } else { return 0 }
}

$components = @(
    @{ Name = "Brainferno Source (stable-candidate)"; Path = "D:\MCP\Adobe-Bridge\stable-candidate"; Drive = "D" },
    @{ Name = "Brainferno Original (server)"; Path = "D:\MCP\Adobe-Bridge\server"; Drive = "D" },
    @{ Name = "Adobe-Bridge-Audit Workspace"; Path = "D:\MCP\Adobe-Bridge-Audit"; Drive = "D" },
    @{ Name = "MADEL-Studio-Bridge"; Path = "D:\MCP\MADEL-Studio-Bridge"; Drive = "D" },
    @{ Name = "Blender MCP Workspace"; Path = "D:\MCP\blender"; Drive = "D" },
    @{ Name = "CapCut Video Projects & CLI"; Path = "D:\MCP\Capcat"; Drive = "D" },
    @{ Name = "Blender MCP Test (Antigravity)"; Path = "D:\GoogleAntigravity\Blender-MCP-Test"; Drive = "D" },
    @{ Name = "Brainferno User State & Logs"; Path = "C:\Users\asus\.brainferno-mcp-bridge"; Drive = "C" },
    @{ Name = "Photoshop Installed UXP Plugin"; Path = "C:\Users\asus\AppData\Roaming\Adobe\UXP\Plugins\External\com.brainferno.mcp-bridge.photoshop_0.3.4"; Drive = "C" },
    @{ Name = "Photoshop External UXP Plugins Root"; Path = "C:\Users\asus\AppData\Roaming\Adobe\UXP\Plugins\External"; Drive = "C" },
    @{ Name = "Claude Code Config & Logs"; Path = "C:\Users\asus\.claude"; Drive = "C" },
    @{ Name = "Codex Plugins & Runtime Cache"; Path = "C:\Users\asus\.codex"; Drive = "C" },
    @{ Name = "Codex Bundled Marketplaces"; Path = "C:\Users\asus\.codex\.tmp"; Drive = "C" },
    @{ Name = "Codex Plugins Cache"; Path = "C:\Users\asus\.codex\plugins"; Drive = "C" },
    @{ Name = "Antigravity Config & Plugins"; Path = "C:\Users\asus\.gemini"; Drive = "C" },
    @{ Name = "Antigravity AppData Local"; Path = "C:\Users\asus\AppData\Local\Programs\Antigravity"; Drive = "C" },
    @{ Name = "Antigravity Brain & Conversations"; Path = "C:\Users\asus\.gemini\antigravity\brain"; Drive = "C" },
    @{ Name = "uv Cache (Blender MCP uvx environment)"; Path = "C:\Users\asus\AppData\Local\uv"; Drive = "C" },
    @{ Name = "Temp Previews (Brainferno Bridge)"; Path = "C:\Users\asus\AppData\Local\Temp\brainferno-mcp-bridge"; Drive = "C" }
)

$results = foreach ($c in $components) {
    $exists = Test-Path $c.Path
    $sizeMB = if ($exists) { Get-DirSizeMB $c.Path } else { 0 }
    [PSCustomObject]@{
        Component = $c.Name
        Drive = $c.Drive
        Exists = $exists
        SizeMB = $sizeMB
        Path = $c.Path
    }
}

$results | Format-Table -AutoSize
$results | Export-Clixml 'D:\MCP\MADEL-Studio-Bridge\tools\inventory-results.xml'
