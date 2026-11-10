# P12: Safely update client MCP configs to point to Installed path
$ErrorActionPreference = 'Stop'

$backupDir = "D:\MCP\01-Projects\Source\MADEL-Studio-Bridge\backups\mcp-configs"
if (-not (Test-Path $backupDir)) {
    New-Item -ItemType Directory -Path $backupDir -Force | Out-Null
}

# 1. Antigravity mcp_config.json
$antiPath = "C:\Users\asus\.gemini\config\mcp_config.json"
if (Test-Path $antiPath) {
    Copy-Item $antiPath "$backupDir\mcp_config.json.p12.bak" -Force
    $antiJson = Get-Content $antiPath -Raw
    $newAnti = $antiJson.Replace("D:\\MCP\\Adobe-Bridge\\stable-candidate\\dist\\index.js", "D:\\MCP\\01-Projects\\Installed\\Adobe-Bridge\\stable-candidate\\dist\\index.js")
    Set-Content -Path $antiPath -Value $newAnti -Encoding utf8
    Write-Host "[UPDATED] Antigravity: $antiPath"
}

# 2. Claude Code claude.json
$claudePath = "C:\Users\asus\.claude.json"
if (Test-Path $claudePath) {
    Copy-Item $claudePath "$backupDir\claude.json.p12.bak" -Force
    $claudeJson = Get-Content $claudePath -Raw
    $newClaude = $claudeJson.Replace("D:\\MCP\\Adobe-Bridge\\stable-candidate\\dist\\index.js", "D:\\MCP\\01-Projects\\Installed\\Adobe-Bridge\\stable-candidate\\dist\\index.js")
    Set-Content -Path $claudePath -Value $newClaude -Encoding utf8
    Write-Host "[UPDATED] Claude Code: $claudePath"
}

# 3. OpenAI Codex config.toml
$codexPath = "C:\Users\asus\.codex\config.toml"
if (Test-Path $codexPath) {
    Copy-Item $codexPath "$backupDir\config.toml.p12.bak" -Force
    $codexToml = Get-Content $codexPath -Raw
    $newCodex = $codexToml.Replace("D:/MCP/Adobe-Bridge/stable-candidate/dist/index.js", "D:/MCP/01-Projects/Installed/Adobe-Bridge/stable-candidate/dist/index.js")
    Set-Content -Path $codexPath -Value $newCodex -Encoding utf8
    Write-Host "[UPDATED] OpenAI Codex: $codexPath"
}

Write-Host "`nAll 3 client configuration files updated to Installed path with P12 backups."
