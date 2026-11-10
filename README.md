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
- **Browser MCP Gateway (P23 Chromium Automation & Visual Reference)**:
  - 27 dedicated MCP tools (213 server tools total across the MADEL platform).
  - **Chromium Automation Engine:** Direct, lightweight Chrome DevTools Protocol (CDP over WebSocket) controlling Google Chrome and Microsoft Edge on Windows with zero added heavyweight dependencies.
  - **Ephemeral Session Isolation:** Isolated `--user-data-dir` profiles on dynamic localhost ports with zero cookie, password, or browsing history leakage from personal user browsers.
  - **Visual Reference Capture:** High-resolution full-page and viewport screenshots (`browser_get_screenshot`) with automated workspace saving.
  - **DOM Inspection & Interaction:** Deep element search, form typing, dropdown selection, native CDP mouse click dispatch, and visible text extraction.
  - **Developer Diagnostics:** Real-time console error logging, failed network request capture (HTTP 4xx/5xx), performance metrics (`browser_get_page_performance_metrics`), and full accessibility tree snapshots (`browser_capture_accessibility_snapshot`).
  - **Hardened Security & Process Scoping:** URL scheme allowlist (`http:`, `https:`, approved `file://`), mandatory confirmation guards (`approved: true` for file uploads), and strict process scoping (terminates only MADEL-spawned PIDs; never kills user browsers).
- **Adobe Premiere Pro 2026 (P22 Video, Sequence & Timeline Integration)**:
  - 39 dedicated MCP tools (186 server tools total across creative platform).
  - **Timeline Assembly & Editing:** Nanosecond-level integer tick timebase (254,016,000,000 ticks/sec), clip insertion (`mode: insert` vs `overwrite`), displacement, edge trimming, and ripple deletion with mandatory affirmative `confirm: true` safety guard.
  - **Multi-Track Management:** Dedicated video and audio track inspection with lock, mute, and solo controls.
  - **Sequence Control:** Creation, active sequence switching, duration reporting, and SMPTE timecode conversions across 8 standard frame rates (23.976, 24, 25, 29.97, 30, 50, 59.94, 60 FPS).
  - **Media & Bins:** Media file importing, source media inspection, bin folder creation, and item reorganization.
  - **Production Export:** Encoder preset discovery (`.epr`), preview frame export (PNG), and sequence rendering.
  - **Action Model Safety:** All edits execute inside UXP `project.lockedAccess` and `project.executeTransaction`, guaranteeing single reversible Undo steps.
- **Adobe Illustrator 2025 (P21 Vector, Artboard & SVG Integration)**:
  - 38 dedicated MCP tools.
  - **Vector Primitives & Curves:** Rectangles (with corner radii), ellipses, straight lines, multi-vertex Bézier curves with incoming/outgoing tangent handles (`ai_create_path`), and compound paths (`ai_create_compound_path`).
  - **Artboard Management:** Dynamic artboard creation with physical coordinate transforms, resizing, renaming, and activation index switching.
  - **Typography & Layout:** Point text and constrained area text frames, PostScript font binding, font sizing, fill/stroke colors, and 4-way paragraph justifications (`left`, `center`, `right`, `justify`).
  - **Production Export:** Standards-compliant SVG (CSS inline or style elements), vector PDF (Acrobat 5–8 compatibility), high-resolution raster PNG (up to 300 PPI), and native `.ai` persistence.
  - **Dual-Lane Isolation:** Native Windows COM ExtendScript lane with zero port collisions or interference with the Photoshop UXP daemon (Port 7897 / PID 15940).
- **Adobe Photoshop 2026 (UXP BatchPlay & P20 Advanced Creative Tools)**:
  - 38 dedicated MCP tools communicating over local WebSocket (`ws://127.0.0.1:7897`).
  - **Smart Objects:** Non-destructive conversion, metadata inspection, independent copies via `placedLayerMakeCopy`, content replacement (`placedLayerReplaceContents`), and linked modification sync.
  - **Layer Styles:** Procedural GPU drop shadow, inner shadow, glows, bevel & emboss, satin, solid/gradient fills, and strokes.
  - **Selections & Masks:** Geometric rectangular and elliptical selections (replace, add, subtract, intersect), feathering, inversion, and raster layer masks with safety deletion guards.
  - **Professional Print Prepress:** Native CMYK color space support, 300 DPI resolution handling, and lossless TIFF export with LZW compression.
  - Hardened with **Zod 4.6.7** schema validation (GHSA-mrhx-c7xc-m3w5 patched).
- **Blender 4.x / 5.x LTS**:
  - 3D scene automation, object generation, materials, cameras, lighting, and rendering via Python bridge.
  - Isolated runtime environment with shared cache on secondary storage (`D:\MCP\runtime\uv-cache`).
- **CapCut Desktop (Windows)**:
  - Automated project and timeline inspection (`draft_content.json`).
  - Subtitle generation, Ken-Burns animation styling, and clip proxy workflows.
- **Concurrent Multi-Client Multiplexing (P17 Gateway)**:
  - Validated simultaneous connections from **Google Antigravity**, **Claude Code**, and **OpenAI Codex** through Windows Named Pipe (`\\.\pipe\brainferno-mcp-bridge`).
  - FIFO WorkLimiter concurrency control with request scoping and cancellation eviction.
- **Unified AI Client Manager (P18)**:
  - Declarative client registry supporting 17 AI clients (Claude, Codex, Antigravity, Cursor, etc.).
  - Atomic config updates, timestamped `.bak` backups, and diff plan dry-runs.
- **Native Windows Desktop Dashboard & System Tray (P19 & P19.1)**:
  - High-performance, lightweight desktop manager (`apps/desktop/`) built with Tauri v2, Vue 3, Pinia, and Windows Edge WebView2.
  - Real-time concurrency telemetry, host application readiness matrix, and Windows System Tray integration with non-destructive window lifecycle (`Close Window != Stop MCP Servers`).

### 🚧 Under Active Development (Roadmap)
- **Adobe After Effects Motion Graphics**: Composition rendering and animation pipeline (planned for P24).
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
  - Adobe Premiere Pro 2024–2026 (for Premiere Video MCP).
  - Adobe Illustrator 2024–2025 (for Illustrator Vector MCP).
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
