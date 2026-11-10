# MADEL Studio Bridge — Browser MCP Adapter
**Owner & Lead Architect:** Mahmoud Adel (`Mahmoudmarktingiq`)  
**Phase:** P23 — Browser MCP Gateway & Secure Browser Automation  
**Platform:** Chromium Automation Layer (Google Chrome & Microsoft Edge on Windows)

---

## 1. Overview
The Browser Adapter bridges AI clients connected through the MADEL Studio Bridge Gateway to local Chromium web browsers (Google Chrome and Microsoft Edge) installed on Windows. It enables visual reference capture, typography/asset research, web automation, and digital asset ingestion directly into creative suites (Photoshop, Illustrator, Premiere Pro).

## 2. Architecture
```text
AI Client (Claude / OpenAI / Gemini / Antigravity)
       │
       ▼
MADEL MCP Gateway
       │
       ▼
P17 Concurrency Manager (browser:session, browser:navigation, browser:interaction, browser:diagnostics)
       │
       ▼
Browser Adapter & Session Manager
       │
       ▼
Chrome DevTools Protocol (CDP over localhost WebSocket)
       │
       ▼
Google Chrome / Microsoft Edge (Isolated Ephemeral Profile)
```

## 3. Security & Non-Destructive Guardrails
- **Ephemeral Session Profiles:** All sessions use isolated, ephemeral `--user-data-dir` stores. User personal cookies, passwords, bookmarks, and browsing history are never accessed, copied, or touched.
- **Localhost Only:** CDP interfaces bind strictly to `127.0.0.1` on dynamically allocated free TCP ports.
- **Strict Process Scoping:** Only PIDs directly spawned by MADEL are tracked and terminated. The user's personal browser is never terminated.
- **Scheme Allowlist:** Blocks dangerous schemes (`javascript:`, `chrome:`, `edge:`, `view-source:`).
- **Approved Workspace Uploads:** Local file uploads require explicit approval (`approved: true`) and must reside within authorized project roots (`D:\MCP`).
- **Destructive Action Protection:** Never executes financial, account deletion, or unauthorized form submissions without human approval.

## 4. Tool Registry (27 Tools)
1. **Management (4):** `browser_list_browsers`, `browser_create_session`, `browser_list_sessions`, `browser_close_session`
2. **Navigation (7):** `browser_open_url`, `browser_navigate`, `browser_reload_page`, `browser_go_back`, `browser_go_forward`, `browser_get_current_url`, `browser_get_page_title`
3. **Inspection (6):** `browser_read_visible_text`, `browser_inspect_dom_elements`, `browser_find_elements`, `browser_get_page_metadata`, `browser_inspect_links`, `browser_get_screenshot`
4. **Interaction (6):** `browser_click_element`, `browser_fill_input`, `browser_select_option`, `browser_scroll_page`, `browser_wait_for_element`, `browser_upload_local_file`
5. **Diagnostics (4):** `browser_inspect_console_errors`, `browser_inspect_failed_network_requests`, `browser_get_page_performance_metrics`, `browser_capture_accessibility_snapshot`
