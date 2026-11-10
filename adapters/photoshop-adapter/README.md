# MADEL Studio Bridge — Photoshop UXP Panel
**Developer:** Mahmoud Adel (محمود عادل)  
**Based in part on:** Brainferno MCP Bridge (Apache-2.0)

A hardened UXP panel connecting Adobe Photoshop 2026 to the MADEL Studio Bridge local MCP runtime via WebSocket loopback.

## Features
- **Local Loopback Communication:** Connects to `ws://localhost:7897` with token authentication.
- **Spectrum Dark UI:** Seamless integration with Photoshop's native dark interface theme.
- **Strict Hardening:** Restricts network domains to local loopback; clipboard permissions disabled.
- **Multi-Client MCP Support:** Integrates with Google Antigravity, Claude Code, and OpenAI Codex.
- **Native Document Automation:** Full support for Photoshop layers, text layers, vector masks, and PSD export.

## File Structure
- `manifest.json`: UXP Manifest v5 defining plugin metadata, display name, and hardened permissions.
- `index.html`: Responsive panel interface styled for Adobe Photoshop.
- `main.js`: Panel runtime, handshake reader, and logger.
- `bridge-client.js`: Loopback WebSocket client protocol implementation.
- `commands.js`: Photoshop batchPlay and DOM command handlers.
- `icons/`: Original brand icons and vector logo.
