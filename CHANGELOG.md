# Changelog — MADEL Studio Bridge

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Planned for Phase P17
- Core Gateway Request Scoping (`AsyncLocalStorage` Request Context).
- Concurrency Bounding & FIFO Queueing (`WorkLimiter`) for single-threaded Adobe engines.
- Request Cancellation & Timeout handling via `AbortSignal`.

---

## [0.2.0] - 2026-11-10

### Added (Phase P16 — External MCP Research & Architecture Comparison)
- **Empirical Research on 3 Upstream Open-Source Projects**:
  - Cloned and verified builds/tests in an isolated sandbox (`research/upstream/`): `mcpx` (Bun / TypeScript), `vinkius-mcp-desktop` (Rust / Tauri v2), and `dcc-mcp-photoshop` (Python / Hatchling).
  - Documented 6 comprehensive engineering reports under `docs/research/`:
    - `P16_UPSTREAM_AUDIT.md`: Complete metadata, repository specs, licenses, and architecture summaries.
    - `P16_FEATURE_COMPARISON.md`: Comparative feature matrix (Named Pipes vs HTTP/TCP, WorkLimiter, Client Registry, Atomic Configs, Smart Objects).
    - `P16_ARCHITECTURE_FINDINGS.md`: Structural diagrams and analysis against MADEL's 2-tier Node.js Named Pipe architecture.
    - `P16_SECURITY_LICENSE_REVIEW.md`: Strict Clean-Room implementation policy, license compatibility (MIT / Apache-2.0), port safety, and secret sanitization.
    - `P16_TEST_RESULTS.md`: Empirical test logs (14/14 tests in mcpx, 311 crates cargo check in Vinkius, 40/40 tests in dcc-mcp, 13/13 MADEL regression tests, 0 secrets).
    - `P16_RECOMMENDATION.md`: Official recommendation for Phase P17 — focusing strictly on Core Gateway Request Scoping & Concurrency Limiting (`WorkLimiter` + `AsyncLocalStorage`).
- **Roadmap Refinement**: Sequenced upcoming milestones (P17: Gateway Scoping & Concurrency, P18: Unified Client Registry, P19: Tauri v2 Desktop Dashboard, P20: Advanced Photoshop Creative Suite).

---

## [0.1.0] - 2026-11-10

### Added (Phase P15 — GitHub Repository Initialization & First Safe Publication)
- **Official Open-Source Repository**: Initialized Git repository and published first public release to [GitHub](https://github.com/Mahmoudmarktingiq/madel-studio-bridge).
- **Workspace Consolidation**: Consolidated complete MCP platform tree under `D:\MCP\01-Projects\Source\MADEL-Studio-Bridge`.
- **Local Named Pipe Multiplexer**: Multi-client concurrent session router on `\\.\pipe\brainferno-mcp-bridge` allowing Google Antigravity, Claude Code, and OpenAI Codex to simultaneously share one Photoshop bridge daemon.
- **Rebranding to MADEL Studio Bridge**: Brand new original geometric vector logo and icons; Adobe Spectrum dark UI styling; developed and maintained by Mahmoud Adel.
- **Zod 4.6.7 Security Patch**: Full mitigation of GHSA-mrhx-c7xc-m3w5 (0 known vulnerabilities).
- **Photoshop Live E2E Acceptance**: Automated document creation, layer fills, editable text layers, PSD persistence, and PNG exports.
- **Master Documentation Suite**: Comprehensive documentation across PRD, Architecture, Security, Modules, Migration, QA, and Workspace manifests.
