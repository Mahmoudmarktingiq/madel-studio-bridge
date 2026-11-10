# Installation Guide — MADEL Studio Bridge

This guide details how to install and register **MADEL Studio Bridge** with your creative applications and AI clients.

---

## 1. Prerequisites

- **Operating System:** Windows 10 / 11 (64-bit).
- **Runtime:** [Node.js](https://nodejs.org) version 20 or newer.
- **Applications:**
  - Adobe Photoshop 2024+ (2026 recommended) with **Plugins ▸ Enable Developer Mode** activated.
  - Optional: Blender 4.x / 5.x.
  - Optional: CapCut Desktop.
  - Optional: ffmpeg on PATH (for audio features).

---

## 2. Register with AI Clients

### Google Antigravity
Add to `~/.gemini/config/mcp_config.json`:
```json
{
  "mcpServers": {
    "madel-studio-bridge": {
      "command": "node",
      "args": ["<path-to-madel-studio-bridge>/packages/server/dist/index.js"],
      "env": {
        "BRAINFERNO_MCP_ALLOW_RAW_SCRIPTS": "0",
        "BRAINFERNO_MCP_BRIDGE_INSECURE": "0"
      }
    }
  }
}
```

### Claude Code CLI
```bash
claude mcp add --scope user madel-studio-bridge \
  -e BRAINFERNO_MCP_ALLOW_RAW_SCRIPTS=0 \
  -e BRAINFERNO_MCP_BRIDGE_INSECURE=0 \
  -- node "<path-to-madel-studio-bridge>/packages/server/dist/index.js"
```

### OpenAI Codex CLI
```bash
codex mcp add madel-studio-bridge \
  --env BRAINFERNO_MCP_ALLOW_RAW_SCRIPTS=0 \
  --env BRAINFERNO_MCP_BRIDGE_INSECURE=0 \
  --env BRAINFERNO_MCP_DEFAULT_WAIT=false \
  --env BRAINFERNO_MCP_JOB_WAIT_SECONDS=50 \
  --env BRAINFERNO_MCP_PREVIEW=path \
  -- node "<path-to-madel-studio-bridge>/packages/server/dist/index.js"
```

---

## 3. Install the Photoshop UXP Panel

Double-click `installers/ccx/MADEL-Studio-Bridge-Photoshop.ccx` and confirm installation in Adobe Creative Cloud Desktop.

Inside Photoshop:
1. Go to **Plugins ▸ MADEL Studio Bridge**.
2. Click **Connect** (or it connects automatically upon opening).
3. The badge turns green (`connected`).
