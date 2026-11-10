# Compatibility Guide — MADEL Studio Bridge

## Creative Applications

| Software | Supported Versions | Integration Mode |
| :--- | :---: | :--- |
| **Adobe Photoshop** | 2024, 2025, 2026 (v27.8.0+) | Native UXP Extension (`ws://localhost:7897`) |
| **Blender** | 4.0, 4.1, 4.2, 5.0 (Beta) | Python uvx Daemon (Socket 9876) |
| **CapCut Desktop** | 3.x, 4.x, 5.x | Project JSON CLI + Agent Skill |
| **Adobe Premiere Pro** | 2025 (v25.6+), 2026 | Native UXP Panel (In Development) |
| **Adobe Illustrator** | 2024, 2025, 2026 | COM Scripting / Native MCP |
| **Adobe After Effects** | 2024, 2025, 2026 | CEP Extension / aerender |
| **Adobe Media Encoder** | 2024, 2025, 2026 | Headless Web Service (:8080) |

## AI Clients & Agents

| Client | Protocol | Configuration File |
| :--- | :---: | :--- |
| **Google Antigravity** | stdio | `~/.gemini/config/mcp_config.json` |
| **Claude Code** | stdio | `~/.claude.json` |
| **OpenAI Codex** | stdio | `~/.codex/config.toml` |
| **Cursor IDE** | stdio | Cursor Settings |
| **VS Code** | stdio | VS Code Settings |
| **Gemini CLI** | stdio | `~/.gemini/settings.json` |
