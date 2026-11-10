# Changelog — MADEL Studio Bridge

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.0.0-alpha] - 2026-11-10

### Added
- **Unified Architecture**: Consolidated MCP platform tree under `D:\MCP\MADEL-Studio-Bridge`.
- **Local Named Pipe Multiplexer**: Multi-client concurrent session router on `\\.\pipe\brainferno-mcp-bridge` allowing Google Antigravity, Claude Code, and OpenAI Codex to simultaneously share one Photoshop bridge daemon.
- **Rebranding to MADEL Studio Bridge**: Brand new original geometric vector logo and icons; Adobe Spectrum dark UI styling; developed and maintained by Mahmoud Adel.
- **Zod 4.6.7 Security Patch**: Full mitigation of GHSA-mrhx-c7xc-m3w5 (0 known vulnerabilities).
- **Photoshop Live E2E Acceptance**: Automated document creation, layer fills, editable text layers, PSD persistence, and PNG exports.
- **Comprehensive Documentation Suite**: 10 engineering reports across PRD, Architecture, Security, Modules, Migration, and QA.

### Changed
- Preserved UXP Plugin ID `com.brainferno.mcp-bridge.photoshop` to ensure seamless in-place CCX upgrade via Adobe Creative Cloud Desktop.
- Restricted UXP WebSocket permissions strictly to loopback (`127.0.0.1`, `localhost`).
- Removed `clipboard` permissions from manifest.
