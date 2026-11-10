# Changelog — MADEL Studio Bridge

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Planned for Phase P18
- Unified AI Client Manager & Declarative Registry (15+ AI clients across Windows/macOS/Linux).
- Atomic File Writing Engine (temp write -> validate -> atomic rename) for client configurations.
- CLI Configuration Automation Tool (`madel client sync`).

---

## [0.3.0] - 2026-11-10

### Added (Phase P17 — Core Gateway Request Scoping & Concurrency Control)
- **Native AsyncLocalStorage Request Scoping**: Request lifecycle tracking with UUIDv4 `requestId`, `correlationId`, `clientId`, `applicationId`, `toolName`, `startedAt`, `deadline`, and `cancellationSignal` (`packages/server/src/gateway/context.ts`).
- **Bounded FIFO WorkLimiter**: Reusable queue manager enforcing concurrency limits, backpressure guard (`QUEUE_OVERFLOW`), queue wait timeouts (`QUEUE_WAIT_TIMEOUT`), and execution timeouts (`EXECUTION_TIMEOUT`) (`packages/server/src/gateway/work-limiter.ts`).
- **Resource-Scoped Queues**: Independent, non-blocking queues for Photoshop, Blender, CapCut, After Effects, Premiere, Illustrator, Audition, and Audio (`packages/server/src/gateway/concurrency-manager.ts`).
- **Immediate Cancellation Mechanics**: Instantly evicts queued tasks upon client `AbortSignal` or transport disconnect without waiting for host engine (`cancelTasksForClient`).
- **Comprehensive Gateway Observability**: Real-time metrics tracker measuring active, pending, completed, failed, cancelled, and timeout durations for future P19 Dashboard (`packages/server/src/gateway/metrics.ts`).
- **Mandatory P17 Test Suite**: 16 rigorous tests covering FIFO order, concurrency bounding, cross-app parallelism, backpressure, timeouts, cancellation, context isolation, correlation propagation, recovery, shutdown, cleanup, and multi-client stress test (`packages/server/test-p17-gateway.mjs`).
- **Full Backward Compatibility**: Seamless integration with MCP tool context and zero regression on existing wire protocol and stdio suites (30/30 tests passed).
- **Comprehensive Documentation Suite**: 5 engineering reports under `docs/gateway/` detailing request context, work limiter, concurrency policy, cancellation semantics, and test reports.

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
