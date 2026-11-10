# Changelog — MADEL Studio Bridge

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Planned for Phase P26
- Adobe Audition MCP Integration / Specialized Audio Pipelines.

---

## [0.11.0] - 2026-11-11

### Added (Phase P25 — Windows Desktop Installer Beta & Clean Installation Verification)
- **Tauri v2 Windows Installer & NSIS Bundle**:
  - Full native NSIS installer generator (`MADEL Studio Bridge_0.11.0_x64-setup.exe`) supporting per-user (`currentUser`) execution without elevated admin requirements.
  - Native Start Menu shortcut and system notification tray integration with clean window minimizing.
- **Out-of-Band Action Approval Gate (`packages/server/src/gateway/approval-gate.ts`)**:
  - Out-of-band operator authorization mechanism preventing autonomous AI clients from self-authorizing destructive actions (`ae_delete_layer`, `pp_remove_clips`, `browser_upload_local_file`, `ae_render_comp`).
  - Cryptographic single-use ticket lifecycle with SHA-256 parameter hashing, 5-minute TTL, and atomic disk persistence in `~/.brainferno-mcp-bridge/approvals.json`.
  - Desktop Bridge RPC integration (`get_pending_approvals`, `approve_action`, `reject_action`).
- **Decoupled Backend Resource Packaging**:
  - Standalone bundled backend in `resources/server/dist/` eliminates runtime dependencies on developer source code paths in `D:\MCP`.
  - Upgraded Rust bridge script locator (`find_bridge_rpc_script()`) and Node binary locator (`find_node_binary()`) prioritizing installed resources relative to `current_exe()`.
- **Interactive 7-Step Setup Wizard (`SetupWizardModal.vue`)**:
  - First-run onboarding experience with step-by-step guidance: Welcome -> Compatibility Check -> Creative Apps Detection -> AI Clients Discovery -> MCP Runtime Verification -> Read-Only Connection Preview -> Completion.
  - Strict read-only discovery guarantee with zero unauthorized modifications to client configs.
- **Dedicated Automated Test Suite (`test-p25-installer.mjs`)**:
  - 12 comprehensive unit and integration tests covering approval gate creation, operator approval, single-use consumption, parameter tampering rejection, TTL expiration, strict mode challenge issuance, Bridge RPC CLI execution, and uninstaller safety policy.

---

## [0.10.0] - 2026-11-11

### Added (Phase P24 — Adobe After Effects MCP Integration: Motion Graphics, Compositions & Render Queue)
- **57 Dedicated After Effects MCP Tools (Platform Total: 231 Tools)**:
  - **Projects (6 Tools):** `ae_project_info`, `ae_create_project` (net new), `ae_open_project`, `ae_save_project`, `ae_list_footage`, `ae_import_footage`.
  - **Compositions (5 Tools):** `ae_list_compositions`, `ae_create_comp`, `ae_get_comp`, `ae_set_comp_props`, `ae_set_active_comp` (net new).
  - **Layers (10 Tools):** `ae_list_layers` (net new), `ae_add_layer`, `ae_add_text_layer` (net new), `ae_add_solid_layer` (net new), `ae_add_shape`, `ae_rename_layer` (net new), `ae_duplicate_layer`, `ae_delete_layer` (hardened with `confirm: true` guard), `ae_set_layer_visibility` (net new), `ae_set_layer_timing` (net new).
  - **Animation & Transforms (9 Tools):** `ae_get_transform_properties` (net new), `ae_set_position` (net new), `ae_set_scale` (net new), `ae_set_rotation` (net new), `ae_set_opacity` (net new), `ae_set_keyframes`, `ae_get_keyframes`, `ae_remove_keyframes`, `ae_set_keyframe_interpolation` (net new).
  - **Motion Graphics & MOGRT (6 Tools):** `ae_create_shape_animation` (net new), `ae_create_text_animation` (net new), `ae_apply_effect`, `ae_set_effect_param`, `ae_add_to_essential_graphics`, `ae_export_mogrt`.
  - **Rendering & Diagnostics (6 Tools):** `ae_inspect_render_queue` (net new), `ae_queue_render`, `ae_render_frame`, `ae_render_comp` (hardened with `approved: true` guard), `ae_inspect_render_result` (net new), `ae_set_expression`.
  - **Batch, Utility & Undo (15 Tools):** `ae_find_layers`, `ae_import_as_comp`, `ae_add_mask`, `ae_set_layer_props`, `ae_add_layer_style`, `ae_get_layer_styles`, `ae_set_layer_style_param`, `ae_remove_layer_style`, `ae_set_text`, `ae_add_marker`, `ae_batch`, `ae_undo`, `ae_redo`, `ae_run_script`, `ae_get_layer`.
- **Standalone Adapter Architecture (`adapters/after-effects-adapter/`)**:
  - `timing-math.js`: Mathematical conversions across 8 broadcast frame rates (23.976, 24, 25, 29.97, 30, 50, 59.94, 60 FPS), Drop-Frame (`;`) and Non-Drop-Frame (`:`) SMPTE timecodes, and 2D/3D normalized composition coordinates.
  - `aerender-runner.js`: Safe, injection-free execution of headless `aerender.exe` with argument arrays.
  - `bridge-client.js`: Abstract host transport and atomic undo builder.
  - `commands.js`: Complete 57-command constant specifications and scope bindings.
- **Safety & Destructive Guards**:
  - `ae_delete_layer`: Mandatory affirmative `confirm: true` parameter prevents accidental layer loss.
  - `ae_render_comp`: Mandatory affirmative `approved: true` parameter guards headless render execution.
- **P23 Browser Security Follow-up**:
  - Tightened `APPROVED_WORKSPACE_ROOTS` to explicit creative subdirectories and added forbidden substrings for source code, `.git`, `node_modules`, and root instruction files.
- **Desktop RPC & Dashboard Integration**:
  - Added After Effects application detection and `after-effects-bridge` service (57 tools) to Desktop RPC.
- **Dedicated Automated Test Suite**:
  - `test-p24-after-effects.mjs`: 12 automated unit and integration tests passing at 100%.

---

## [0.9.0] - 2026-11-10

### Added (Phase P23 — Browser MCP Gateway & Secure Browser Automation)
- **27 Specialized Browser MCP Tools (Total Server Tools: 213)**:
  - **Browser Management (4 Tools):** `browser_list_browsers`, `browser_create_session`, `browser_list_sessions`, `browser_close_session`.
  - **Navigation & History (7 Tools):** `browser_open_url`, `browser_navigate`, `browser_reload_page`, `browser_go_back`, `browser_go_forward`, `browser_get_current_url`, `browser_get_page_title`.
  - **Page Inspection & Content (6 Tools):** `browser_read_visible_text`, `browser_inspect_dom_elements`, `browser_find_elements`, `browser_get_page_metadata`, `browser_inspect_links`, `browser_get_screenshot`.
  - **User Interaction & Forms (6 Tools):** `browser_click_element`, `browser_fill_input`, `browser_select_option`, `browser_scroll_page`, `browser_wait_for_element`, `browser_upload_local_file` (with mandatory `approved: true` guard).
  - **Developer Diagnostics (4 Tools):** `browser_inspect_console_errors`, `browser_inspect_failed_network_requests`, `browser_get_page_performance_metrics`, `browser_capture_accessibility_snapshot`.
- **Chromium Automation Engine (`cdp-client.ts` & `browser-manager.ts`)**:
  - Direct, zero-dependency Chrome DevTools Protocol (CDP) WebSocket communication on dynamic localhost ports.
  - Native support for Google Chrome (`v157.0.8103.40`) and Microsoft Edge (`v157.0.4341.42`) on Windows.
- **Session Isolation & Security Policy (`browser-security.ts`)**:
  - Ephemeral user profiles with zero cookie, password, or browsing history leakage.
  - Strict URL scheme allowlist (`http:`, `https:`, and approved workspace `file://`).
  - Blocked unsafe schemes (`javascript:`, `data:text/html`, `chrome:`, `edge:`, `devtools:`).
  - Strict process scoping: terminates only MADEL-spawned PIDs; never kills the user's personal browser.
- **Gateway Concurrency & Scoping**:
  - Added `browser:session`, `browser:navigation`, `browser:interaction`, and `browser:diagnostics` resource scopes in P17 Concurrency Manager.
- **Desktop RPC & Dashboard Integration**:
  - Added live Chromium detection and status (`Detected & Ready (Chromium CDP)`) in Desktop Applications and Servers views.
- **Standardized Creative Test Workspace**:
  - Created 8-folder standard project structure at `D:\MCP\11-Other-Apps\Browser\MADEL\P23-Browser-Integration` with `PROJECT_INFO.md` and captured live screenshot `test-preview.png`.
- **Engineering Documentation Suite**:
  - Added 6 technical specifications in `docs/browser/` (`P23_ARCHITECTURE.md`, `P23_TOOL_REGISTRY.md`, `P23_SESSION_SECURITY.md`, `P23_DESKTOP_INTEGRATION.md`, `P23_LIVE_TEST_RESULTS.md`, `P23_TEST_REPORT.md`).
- **Comprehensive Automated Test Suite**:
  - Added `test-p23-browser.mjs` (12 tests passing). Total automated tests: 128 unit/integration tests passing (100% PASS) + 4 Vitest tests passing.

---

## [0.8.0] - 2026-11-10

### Added (Phase P22 — Adobe Premiere Pro MCP Integration)
- **39 Specialized Premiere Pro MCP Tools (Total Server Tools: 186)**:
  - **Project Management (6 Tools):** `pp_project_info`, `pp_inspect_project_metadata`, `pp_open_project`, `pp_create_project`, `pp_save_project`, `pp_list_project_items`.
  - **Media & Bins (4 Tools):** `pp_import_files`, `pp_inspect_media`, `pp_create_bin`, `pp_move_project_item`.
  - **Sequences (5 Tools):** `pp_list_sequences`, `pp_create_sequence`, `pp_get_sequence`, `pp_set_active_sequence`, `pp_get_sequence_duration`.
  - **Multi-Track Management (2 Tools):** `pp_list_video_tracks`, `pp_list_audio_tracks`.
  - **Timeline & Clips (7 Tools):** `pp_insert_clip` (insert vs overwrite), `pp_insert_mogrt`, `pp_inspect_clip`, `pp_move_clip`, `pp_trim_clip`, `pp_remove_clips` (with mandatory `confirm: true` guard), `pp_set_clip_props`.
  - **Playhead & Playback (2 Tools):** `pp_get_player_position`, `pp_set_player_position`.
  - **Markers & Effects (9 Tools):** `pp_list_markers`, `pp_add_marker`, `pp_list_transitions`, `pp_add_transition`, `pp_list_effects`, `pp_get_clip_effects`, `pp_apply_effect`, `pp_remove_effect`, `pp_set_effect_param`.
  - **Production Export (4 Tools):** `pp_inspect_export_capabilities`, `pp_list_export_presets`, `pp_export_frame`, `pp_export_sequence`.
- **Timeline Precision Engine (`timeline-math.ts`)**:
  - Exact BigInt tick calculations ($254,016,000,000\text{ ticks/sec}$) across all 8 standard frame rates (23.976, 24, 25, 29.97, 30, 50, 59.94, 60 FPS) with zero remainder and zero drift.
  - SMPTE timecode formatting and parsing roundtrip (drop-frame and non-drop-frame).
- **Decoupled UXP Adapter (`adapters/premiere-adapter/`)**:
  - Official Premiere Pro UXP action model with `project.lockedAccess` and `project.executeTransaction` for clean atomic undo steps.
- **Gateway Concurrency & Scoping**:
  - Added `"premiere:read"` (30s timeout) alongside `"premiere:mutation"` (60s timeout) with strict FIFO queueing.
- **Desktop RPC Integration**:
  - Live detection of installed Adobe Premiere Pro 2026 (`v26.3.2`) with dynamic state reporting (`configured_not_verified` / `supported_and_verified`).
- **Standardized Creative Test Workspace**:
  - Established 8-folder standard project structure at `D:\MCP\05-Premiere\MADEL\P22-Timeline-Integration` with `PROJECT_INFO.md`.
- **Engineering Documentation Suite**:
  - Added 6 comprehensive technical specifications in `docs/premiere/` (`P22_ARCHITECTURE.md`, `P22_API_COMPATIBILITY.md`, `P22_TOOL_REGISTRY.md`, `P22_TIMELINE_ACCURACY.md`, `P22_SECURITY.md`, `P22_LIVE_TEST_RESULTS.md`).
- **Comprehensive Test Suite & Quality Certification**:
  - Added `packages/server/test-p22-premiere.mjs` (12 tests).
  - Reached **116 / 116 PASS** across all 9 repository test suites (100% success rate).
  - Passed all 4 Desktop Vitest store tests, verified 0 secrets detected, and 0 vulnerabilities.

---

## [0.7.0] - 2026-11-10

### Added (Phase P21 — Adobe Illustrator MCP Integration)
- **38 Specialized Illustrator MCP Tools (Total Server Tools: 176)**:
  - **Documents (7 Tools):** `ai_list_documents`, `ai_get_document_info`, `ai_create_document` (enhanced with pt/mm/in units and RGB/CMYK color modes), `ai_open_document`, `ai_save_document`, `ai_save_as` (AI/EPS), `ai_close_document`.
  - **Artboards (5 Tools):** `ai_list_artboards`, `ai_create_artboard`, `ai_resize_artboard`, `ai_rename_artboard`, `ai_set_active_artboard`.
  - **Vector Objects & Curves (11 Tools):** `ai_create_rectangle` (with corner radii), `ai_create_ellipse`, `ai_create_line`, `ai_create_path` (arbitrary Bézier paths with anchor points and tangent handles), `ai_create_compound_path` (vector cutouts), `ai_move_object`, `ai_resize_object`, `ai_rotate_object`, `ai_duplicate_object`, `ai_delete_object` (with mandatory `confirm: true` guard), `ai_create_shape` (backward-compatible parametric shape creator).
  - **Layers & Hierarchy (6 Tools):** `ai_list_layers`, `ai_create_layer`, `ai_rename_layer`, `ai_group_objects`, `ai_ungroup_objects`, `ai_set_layer_props` (visibility, locked, opacity).
  - **Typography (3 Tools):** `ai_create_text` (point or area text), `ai_update_text`, `ai_set_text_alignment` (left, center, right, justify).
  - **Production Export (5 Tools):** `ai_export_svg` (CSS inline/style elements), `ai_export_pdf` (Acrobat 5–8 compatibility, editability), `ai_export_png` (scaling up to 300 PPI, transparency), `ai_save_as_ai` (native AI format), `ai_export_artboard`, `ai_get_preview`.
- **Decoupled Architecture & Dual-Lane Isolation**:
  - Modular structure in `adapters/illustrator-adapter/` with roadmap for 2027 UXP public beta.
  - Independent Windows COM ExtendScript lane with zero port collisions or interference with the Photoshop UXP daemon on port 7897 (PID 15940).
- **Gateway Concurrency & Scoping**:
  - Added `"illustrator:read"` (30s timeout) and `"illustrator:mutation"` (60s timeout) serialized policies with strict FIFO queueing.
- **Desktop Bridge RPC Integration**:
  - Live detection of installed Adobe Illustrator 2025 (`v29.5.1`) with dynamic state reporting (`configured_not_verified` / `supported_and_verified`).
- **Standardized Creative Test Workspace**:
  - Established 8-folder standard project structure at `D:\MCP\06-Illustrator\MADEL\P21-Vector-Integration` with `PROJECT_INFO.md`.
- **Engineering Documentation Suite**:
  - Added 6 comprehensive technical specifications in `docs/illustrator/` (`P21_ARCHITECTURE.md`, `P21_API_COMPATIBILITY.md`, `P21_TOOL_REGISTRY.md`, `P21_VECTOR_ACCURACY.md`, `P21_SECURITY.md`, `P21_LIVE_TEST_RESULTS.md`).
- **Comprehensive Test Suite & Quality Certification**:
  - Added `packages/server/test-p21-illustrator.mjs` (12 tests).
  - Reached **104 / 104 PASS** across all 8 repository test suites (100% success rate).
  - Passed all 4 Desktop Vitest store tests, verified 0 secrets detected, and 0 vulnerabilities.

---

## [0.6.0] - 2026-11-10

### Added (Phase P20 — Advanced Photoshop Creative Tools)
- **16 New Specialized Photoshop MCP Tools**:
  - `ps_get_document_info`: Comprehensive prepress telemetry including pixel/physical dimensions (inches/mm), resolution (DPI), color mode, bit depth, and profile name.
  - `ps_set_document_resolution`: Adjusts document DPI with or without pixel resampling (`resample: false` for physical print adjustments).
  - `ps_convert_to_smart_object`: Non-destructive conversion of active or targeted layers into embedded Smart Objects via `newPlacedLayer`.
  - `ps_inspect_smart_object`: Queries internal Smart Object metadata via `smartObjectMore` (source file, linked vs embedded, dimensions, DPI).
  - `ps_duplicate_smart_object`: Independent duplication via `placedLayerMakeCopy` ("New Smart Object via Copy") versus linked instance sharing object data.
  - `ps_replace_smart_object`: Replaces Smart Object contents dynamically using UXP session tokens (`placedLayerReplaceContents`), preserving transforms, styles, and masks.
  - `ps_update_linked_smart_object`: Synchronizes modified linked external files via `placedLayerUpdateModified`.
  - `ps_get_selection`: Checks active selection existence and returns bounding coordinates and dimensions.
  - `ps_select_rectangle` & `ps_select_ellipse`: Geometric area selections supporting 4 boolean combination modes (`replace`, `add`, `subtract`, `intersect`).
  - `ps_invert_selection`: Inverts active selection boundary.
  - `ps_feather_selection`: Blurs selection edges across specified pixel radius.
  - `ps_deselect`: Clears active selection on document.
  - `ps_create_layer_mask`: Generates raster layer mask (`revealSelection`, `hideSelection`, `revealAll`, `hideAll`).
  - `ps_set_layer_mask_enabled`: Toggles layer mask on or off without deleting.
  - `ps_delete_layer_mask`: Confirmed mask deletion with mandatory safety flag (`confirm: true`) and optional permanent application (`apply: boolean`).
- **Enhanced Foundational Tools**:
  - `ps_create_document`: Added native support for `"cmyk"` color space with automatic default to 300 DPI for print.
  - `ps_export`: Added support for `"tiff"` format with LZW/none compression, 4-channel CMYK preservation, and embedded ICC color profiles.
- **Dedicated Creative Test Workspace**: Established 8-folder standard project structure under `D:\MCP\04-Photoshop\MADEL\P20-Advanced-Tools` with `PROJECT_INFO.md` and test assets.
- **P20 Test Suite & Zero Regressions**: Added `packages/server/test-p20-photoshop.mjs` (12 tests). Total automated tests reached **96 / 96 PASS** (100% success rate across all 8 suites).
- **Engineering Documentation Suite**: Added 6 comprehensive reports under `docs/photoshop/`:
  - `P20_CAPABILITY_MATRIX.md`
  - `P20_SMART_OBJECTS.md`
  - `P20_LAYER_STYLES.md`
  - `P20_MASKS_SELECTIONS.md`
  - `P20_PRINT_EXPORT.md`
  - `P20_LIVE_TEST_RESULTS.md`

### Added (Phase P19.1 — Real Desktop Acceptance, UI Verification & Integration Fixes)
- **Real Windows Desktop Verification**: Verified real execution of `madel-desktop.exe` (13.7 MB native PE binary) under Windows 11 Pro without white screens, JS errors, or Rust panics.
- **Empirical Visual Acceptance**: Captured and verified 10 live screenshots in `docs/desktop/screenshots/` across all 7 views plus Light Mode, Arabic RTL, and Diff Modal (zero mockups or synthetic AI images).
- **Frontend & Table Layout Hardening**: Refactored CSS grid columns in `ClientsView.vue` with `minmax(100px, 1fr)` and defensive fallbacks to eliminate horizontal clipping and ensure action buttons remain fully visible on standard window viewports.
- **Client Manager Integration Fixes**: Enhanced Bridge RPC schema parity in `packages/server/src/desktop/bridge-rpc.ts` and `apps/desktop/src/stores/clients.ts` to seamlessly adapt client discovery models into enriched desktop store representations.
- **Diff Preview Enhancement**: Upgraded `DiffViewer.vue` to display git-style unified diffs directly from `plan.diffPreview` with optional-chaining guards and safety guarantee notices.
- **Host Photoshop Daemon Preservation**: Verified active Primary Daemon on PID `15940` (port `7897`) and Named Pipe `\\.\pipe\brainferno-mcp-bridge`. Implemented automatic handshake file backup and restoration in `test-stdio-mcp.mjs` to prevent clobbering host daemon state during CI/CD test runs.
- **Isolated Client Manager Acceptance**: Tested complete discovery, plan connect, atomic apply, backup generation, and restore cycle in an isolated sandbox with 100% preservation of third-party tools.
- **Comprehensive P19.1 Test Suite**: Added `packages/server/test-p19-1-acceptance.mjs` (10 tests) and `apps/desktop/src/__tests__/desktop-stores.test.ts` (4 Vitest tests). Total automated test count reached **84 / 84 PASS** (100% pass rate).
- **Engineering Documentation Suite**: Added `P19_1_VISUAL_ACCEPTANCE.md`, `P19_1_INTEGRATION_ACCEPTANCE.md`, `P19_1_RUNTIME_REPORT.md`, and `P19_1_FINAL_QA.md` under `docs/desktop/`.

---

## [0.5.0] - 2026-11-10

### Added (Phase P19 — Native Windows Desktop Dashboard & System Tray)
- **Native Desktop Application**: Full-featured Windows desktop dashboard located in `apps/desktop/` built with Tauri v2, Vue 3, TypeScript, Pinia, and Windows Edge WebView2.
- **Fluent & Apple HIG Design System**: Dark Mode (Fluent Obsidian) primary and Light Mode (Fluent Clean) optional with consistent typography, acrylic cards, responsive grid, accessible controls, and i18n support with complete English and Arabic dictionaries.
- **Live Concurrency & Gateway Telemetry**: Real-time integration with P17 `globalConcurrencyManager` tracking active requests, queue depth, completed, failed, timeouts, and average wait/execution latencies with fallback handling (`DISCONNECTED` / `NOT_VERIFIED` / `UNAVAILABLE`).
- **Unified AI Client GUI Manager**: Interactive management for all 17 AI clients from P18 with dry-run diff previews (`DiffViewer`), user confirmation modal (`ConfirmModal`), automatic `.bak` backups, and atomic configuration updates.
- **Applications Readiness Matrix**: Real-time status monitoring for 8 host software adapters (Photoshop 2026, Blender, CapCut, Illustrator, Premiere, AE, Browser, Office) with strict operational control locking for unverified/planned apps.
- **Windows System Tray Integration**: Native tray icon with menu (`Open MADEL`, `Gateway Status`, `Open Diagnostics`, `Settings`, `Quit`) and window close interception enforcing `Close Window != Stop All MCP Servers`.
- **Safe IPC Dispatcher**: Restricted, strictly-typed Bridge RPC runner (`packages/server/src/desktop/bridge-rpc.ts`) executing Node.js calls via `std::process::Command` without shell, zero arbitrary command injection, and zero secondary daemons.
- **Structured Activity & Sanitized Audit Logs**: Live feed of MCP traffic, correlation IDs, execution latencies, and automatic secret redaction with one-click clipboard diagnostic report export.
- **Rigorous P19 Test Suite**: 20 comprehensive tests covering bridge RPC, live metrics, app detection, diff previews, cancel semantics, tray lifecycle, IPC security, and production frontend bundles (20/20 PASS, 70/70 overall across 5 suites).
- **Comprehensive Desktop Documentation Suite**: 6 engineering reports under `docs/desktop/` detailing architecture, design system, feature matrix, security review, test reports, and build measurements.

---

## [0.4.0] - 2026-11-10

### Added (Phase P18 — Unified AI Client Manager & Declarative Registry)
- **Declarative AI Client Registry**: Centralized registry defining 17+ AI clients (Claude Code, Claude Desktop, OpenAI Codex, Google Antigravity, Gemini CLI, Cursor, VS Code, VS Code Insiders, Windsurf, Cline, Roo Code, Continue, OpenCode, JetBrains, GitHub Copilot, Goose, Generic MCP) using cross-platform environment variables (`%USERPROFILE%`, `%APPDATA%`, `%LOCALAPPDATA%`, `$HOME`) and zero hardcoded paths (`packages/server/src/clients/registry.ts`).
- **Non-Invasive Discovery Engine**: Read-only inspection engine detecting installation status, running processes, configuration files, and active connections across 7 distinct states (`packages/server/src/clients/discovery.ts`).
- **Multi-Format Parsers & Serializers**: Clean-room, universal format support for JSON, JSONC (safe comment stripping preserving URLs/quotes), TOML (dedicated parser for OpenAI Codex `[mcp_servers]`), and YAML (`packages/server/src/clients/parsers.ts`).
- **9-Step High-Assurance Atomic Writer**: Safe file replacement engine featuring pre-write SHA-256 computation, automatic timestamped `.bak.<timestamp>` backups, anti-race modification checks, same-directory temporary file writes, content verification, Windows lock retries (`EBUSY`/`EPERM`) with jitter, atomic renaming, and automatic rollback (`packages/server/src/clients/atomic-writer.ts`).
- **Configuration Manager Orchestrator**: High-level manager providing `listClients`, `detect`, `inspect`, `planConnect` (dry-run diff calculation), `applyConnect`, `planDisconnect`, `applyDisconnect`, and `restore` (`packages/server/src/clients/config-manager.ts`).
- **Preservation Policy**: Strict 100% preservation of third-party MCP servers and unrelated user settings during connect/disconnect cycles.
- **Unified MADEL CLI**: CLI tool supporting `madel clients [list|detect|inspect|plan|connect|disconnect|backup|restore|verify]` with formatted terminal outputs and zero credential leakage (`packages/server/src/clients/cli.ts`).
- **Comprehensive P18 Test Suite**: 20 rigorous tests covering discovery, roundtrip parsing (JSON, TOML, JSONC, YAML), preservation, corrupt config handling, dry-run diffs, atomic writes, race detection, backups, restore, lock retries, and gateway regression (20/20 PASS, 50/50 overall) (`packages/server/test-p18-clients.mjs`).
- **Extensive Documentation Suite**: 6 engineering reports under `docs/clients/` detailing client registry, discovery mechanics, configuration manager, atomic writes, backup/restore, and test reports.

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
