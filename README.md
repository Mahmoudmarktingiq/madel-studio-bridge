# MADEL Studio Bridge
**Unified MCP Platform for Creative & Production Applications**  
**Developed and maintained by Mahmoud Adel (محمود عادل)**  
*Based in part on Brainferno MCP Bridge (Apache-2.0)*

[![License: Apache-2.0](https://img.shields.io/badge/License-Apache--2.0-blue.svg)](LICENSE)
[![MCP Protocol](https://img.shields.io/badge/MCP-2024--11--05-brightgreen.svg)](https://modelcontextprotocol.io)
[![Platform: Windows](https://img.shields.io/badge/Platform-Windows-0078D6.svg)](#)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.9.3-3178C6.svg)](#)
[![Security: 0 CVEs](https://img.shields.io/badge/Security-Audited%20(0%20Vulnerabilities)-success.svg)](#)

---

## What is MADEL Studio Bridge?

**MADEL Studio Bridge** is an extensible, local-first [Model Context Protocol (MCP)](https://modelcontextprotocol.io) platform that gives AI coding assistants and autonomous agents direct, safe control over professional creative applications.

Instead of running separate, isolated tools that consume excessive disk space and collide over network ports, MADEL Studio Bridge provides a **unified gateway** featuring a local Windows Named Pipe multiplexer. A single background server daemon can simultaneously serve multiple AI clients while driving creative software natively.

---

## Current Status & Capabilities

### ✅ Live & Operational (Production Tested)
- **Adobe Photoshop 2026 (UXP BatchPlay)**:
  - Direct local WebSocket (`ws://127.0.0.1:7897`) connection with token-based handshake.
  - Native document creation, layer management, vector fill layers, and non-destructive editable text layers.
  - Document export (PNG/PSD), image inspection, and live preview rendering.
  - Hardened with **Zod 4.6.7** schema validation (GHSA-mrhx-c7xc-m3w5 patched).
- **Blender 4.x / 5.x LTS**:
  - 3D scene automation, object generation, materials, cameras, lighting, and rendering via Python bridge.
  - Isolated runtime environment with shared cache on secondary storage (`D:\MCP\runtime\uv-cache`).
- **CapCut Desktop (Windows)**:
  - Automated project and timeline inspection (`draft_content.json`).
  - Subtitle generation, Ken-Burns animation styling, and clip proxy workflows.
- **Concurrent Multi-Client Multiplexing**:
  - Validated simultaneous connections from **Google Antigravity**, **Claude Code**, and **OpenAI Codex** through Windows Named Pipe (`\\.\pipe\brainferno-mcp-bridge`).

### 🚧 Under Active Development (Roadmap)
- **Adobe Premiere Pro Integration**: Sequence automation and clip editing (planned for P22).
- **Adobe Illustrator Integration**: Vector and artboard generation (planned for P21).
- **Browser MCP Gateway**: Web automation bridge for visual reference capture (planned for P23).
- **Desktop Dashboard**: GUI control center for connection monitoring (planned for P19).
- **Windows Installer Package**: Standalone MSI/EXE setup wizard (planned for P25 — *currently developer CLI only*).

---

## Tested AI Clients

- **Google Antigravity**
- **Claude Code CLI**
- **OpenAI Codex CLI**
- **Cursor IDE**
- **VS Code** (Cline, Roo Code, Continue)
- **Gemini CLI**

---

## Requirements

- **Operating System:** Windows 10 or Windows 11 (64-bit).
- **Runtime:** [Node.js](https://nodejs.org) v20.x or newer (tested on Node v26.13.0).
- **Creative Software (Optional based on workflow):**
  - Adobe Photoshop 2024–2026 (for Photoshop MCP).
  - Blender 4.x / 5.x LTS (for 3D MCP).
  - CapCut Desktop for Windows (for video editing automation).

---

## Developer Quick Start

### 1. Clone the Repository
```bash
git clone https://github.com/Mahmoudmarktingiq/madel-studio-bridge.git
cd madel-studio-bridge
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Build from Source
```bash
npm run build
```

### 4. Run Test Suite
```bash
npm test
```
*Executes all 13 compatibility and regression tests plus end-to-end stdio MCP protocol tests.*

### 5. Start the Server Daemon
```bash
npm start
```

---

## Configuring AI Clients

To connect your AI assistant, configure the MCP client to launch the Bridge server via stdio:

### Example: Claude Code (`~/.claude.json`) or Antigravity (`mcp_config.json`)
```json
{
  "mcpServers": {
    "madel-studio-bridge": {
      "command": "node",
      "args": [
        "D:\\MCP\\01-Projects\\Source\\MADEL-Studio-Bridge\\packages\\server\\dist\\index.js"
      ],
      "env": {
        "BRAINFERNO_MCP_ALLOW_RAW_SCRIPTS": "0",
        "BRAINFERNO_MCP_BRIDGE_INSECURE": "0"
      }
    }
  }
}
```

---

## Security Model

- **Local Loopback Only:** All network sockets strictly bind to `127.0.0.1` / `localhost`.
- **Privilege Separation:** Runs completely under user space without requiring Administrator privileges.
- **Script Execution Disabled by Default:** `BRAINFERNO_MCP_ALLOW_RAW_SCRIPTS=0` blocks arbitrary code evaluation in creative applications unless explicitly unlocked by the user.
- **Zero Vulnerabilities:** Continuously audited with `npm audit` (0 CVEs).

---

## Documentation

- [Arabic Documentation (دليل باللغة العربية)](README_AR.md)
- [Future Roadmap](ROADMAP.md)
- [Development Workflow Policy](docs/DEVELOPMENT_WORKFLOW.md)
- [GitHub Release Policy](docs/GITHUB_RELEASE_POLICY.md)
- [Master Project Progress](docs/PROJECT_PROGRESS.md)
- [Installation Guide](INSTALLATION.md)
- [Compatibility Matrix](COMPATIBILITY.md)
- [Security Policy](SECURITY.md)
- [Contributing Guidelines](CONTRIBUTING.md)
- [Changelog](CHANGELOG.md)

---

## License & Attribution

- Licensed under the [Apache License, Version 2.0](LICENSE).
- Developed and maintained by **Mahmoud Adel**.
- Based in part on [Brainferno MCP Bridge](https://github.com/Brainferno), Copyright 2026 Brainferno, LLC (Vincent Parker). See [NOTICE](NOTICE) and [THIRD_PARTY_NOTICES.md](THIRD_PARTY_NOTICES.md) for full legal disclosures and third-party notices.
