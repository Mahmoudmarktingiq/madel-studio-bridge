# MADEL Studio Bridge — Phase P25.7 Browser Computer Use
## Autonomous Web Browser Automation, Interaction & Navigation Specification

**Project**: MADEL Studio Bridge  
**Repository**: [Mahmoudmarktingiq/madel-studio-bridge](https://github.com/Mahmoudmarktingiq/madel-studio-bridge)  
**Developer & Maintainer**: Mahmoud Adel (`Mahmoudmarktingiq`)  
**Date**: November 12, 2026  
**Phase**: P25.7 (Full Browser Computer Use + Downloads, Uploads & File Operations)  
**Version**: v0.11.7  
**Status**: `COMPLETED — 100% VERIFIED`  

---

### 1. Architectural Overview

Phase P25.7 advances the MADEL Studio Bridge Browser Adapter from passive inspection (DOM snapshots and static screenshot capture) into a **complete Computer Use platform**. The AI model directly controls an isolated, real-world Chromium browser process (Google Chrome or Microsoft Edge) via the Chrome DevTools Protocol (CDP) over a secure local WebSocket connection.

```
+---------------------------------------------------------------------------------------+
|                               MADEL Studio Bridge MCP Gateway                         |
|                             (52 Integrated Production Tools)                          |
+---------------------------------------------------------------------------------------+
        |                                                       |
        v                                                       v
+-------------------------------+               +-------------------------------+
|     Browser Manager & CDP     |               |    Sandboxed File Operations  |
|  (43 Tools: Mouse, Keyboard,  |               |  (9 Tools: List, Copy, Move,  |
|     Tabs, Downloads, Uploads) |               |     Rename, SHA-256, Delete)  |
+-------------------------------+               +-------------------------------+
        |                                                       |
        v                                                       v
+-------------------------------+               +-------------------------------+
| Isolated Chromium / Edge (CDP)|               |    Dedicated Workspace:       |
| Port: Ephemeral (e.g. 52848)  |               |  D:\MCP\Browser-Workspace\    |
| Profile: %TEMP%\madel-profile |               |  [downloads, uploads, outputs]|
+-------------------------------+               +-------------------------------+
```

The system operates with zero console popups (`windowsHide: true`), strict sandbox boundaries confined to `D:\MCP\Browser-Workspace\`, and atomic concurrency controls (`browser:session` and `file:operations`).

---

### 2. Full Mouse Automation Suite

MADEL provides pixel-accurate, event-driven mouse emulation via `Input.dispatchMouseEvent`:

| MCP Tool | Description | Target Coordinate Resolution |
| :--- | :--- | :--- |
| `browser_mouse_click` | Dispatches `mousePressed` and `mouseReleased` events (left button) with optional click count and modifiers. | CSS Selector or explicit `(x, y)` |
| `browser_mouse_double_click` | Dispatches sequential clicks with `clickCount: 2`. | CSS Selector or explicit `(x, y)` |
| `browser_mouse_right_click` | Dispatches context menu mouse event (`button: "right"`). | CSS Selector or explicit `(x, y)` |
| `browser_mouse_hover` | Dispatches `mouseMoved` to target coordinates, triggering CSS `:hover` states and tooltips. | CSS Selector or explicit `(x, y)` |
| `browser_mouse_drag_and_drop` | Synthesizes continuous drag-and-drop: mouse move to source, left button press, interpolated drag path (steps), and release over destination. | Source `(x1, y1)` -> Target `(x2, y2)` |
| `browser_scroll` | Supports directional and delta scrolling via `Input.dispatchMouseEvent` with `type: "mouseWheel"`, or element-focused scrolling via `scrollElementIntoView`. | `deltaX`, `deltaY`, or Target Selector |

#### Coordinate Resolution Strategy
When a CSS selector is specified without explicit coordinates, the CDP client executes:
```javascript
const box = await DOM.getBoxModel({ nodeId });
// Calculates centroid of the content quad:
const x = (box.content[0] + box.content[2] + box.content[4] + box.content[6]) / 4;
const y = (box.content[1] + box.content[3] + box.content[5] + box.content[7]) / 4;
```
This guarantees physical click precision regardless of viewport dimensions or CSS transformations.

---

### 3. Full Keyboard Automation Suite

Keyboard interaction supports complete UTF-8 character encoding, complex scripts (including right-to-left Arabic), modifier combinations, and secure password masking:

| MCP Tool | Description | Key Features |
| :--- | :--- | :--- |
| `browser_type_text` | Synthesizes text typing into active or target elements via `Input.insertText` and `Input.dispatchKeyEvent`. | RTL Arabic support (`محمود عادل`), optional input clearing (`clearFirst: true`), configurable keystroke delay (`delayMs`). |
| `browser_press_key` | Dispatches raw keydown/keyup events for navigation and control keys (`Enter`, `Tab`, `Escape`, `Backspace`, Arrow keys). | Accurate Windows Virtual Key (VK) codes and key identifiers. |
| `browser_key_combination` | Executes atomic modifier shortcuts (`Control+A`, `Control+C`, `Control+V`, `Alt+F4`). | Precise down-sequence and reverse up-sequence execution. |

#### Password Protection & Security
When interacting with sensitive input elements (`input[type="password"]` or fields flagged with `isPassword: true`), MADEL automatically applies `BrowserSecurityPolicy.redactSensitiveValue(...)`. The typed value is transferred directly to the browser DOM, but the MCP tool execution response and diagnostic logs record `****** [REDACTED_PASSWORD] ******`, preventing credential leakage in conversation transcripts.

---

### 4. Multi-Tab & Target Lifecycle Management

The Browser Adapter maintains full state awareness across multiple tabs and targets:

| MCP Tool | Description | Behavior |
| :--- | :--- | :--- |
| `browser_new_tab` | Spawns a new tab (`Target.createTarget`) and establishes an active CDP connection. | Returns `targetId` and URL. |
| `browser_list_tabs` | Queries `/json/list` to return all open pages, target IDs, titles, and active statuses. | Real-time target inventory. |
| `browser_switch_tab` | Activates target (`Target.activateTarget`) and switches the active CDP client session. | Seamless context switching. |
| `browser_close_tab` | Closes specified target via CDP or HTTP fallback (`/json/close/{targetId}`). | Non-destructive tab termination. |

Target connections are cached within `session.tabClients: Map<string, CDPClient>`, ensuring that background tabs maintain listener continuity without connection drops.

---

### 5. Download Management Architecture

MADEL eliminates unreliable browser download prompts and enforces strict workspace confinement:

1. **Browser-Target Binding**:
   - `Browser.setDownloadBehavior` is dispatched directly to the persistent **Browser target WebSocket** (`/devtools/browser/{guid}`) rather than transient Page targets:
     ```json
     {
       "method": "Browser.setDownloadBehavior",
       "params": {
         "behavior": "allowAndName",
         "downloadPath": "D:\\MCP\\Browser-Workspace\\downloads",
         "eventsEnabled": true
       }
     }
     ```
2. **Profile Pre-seeding**:
   - Prior to Chromium launch, MADEL initializes the profile's `Default/Preferences` JSON with:
     ```json
     {
       "download": {
         "default_directory": "D:\\MCP\\Browser-Workspace\\downloads",
         "directory_upgrade": true,
         "prompt_for_download": false
       }
     }
     ```
   - This prevents Chromium from ever defaulting to the host user's personal `C:\Users\asus\Downloads` folder.
3. **Event Tracking & Integrity**:
   - The `Browser.downloadProgress` event stream tracks download state (`inProgress`, `completed`, `canceled`), transmitted bytes, and destination file name.
   - The `browser_verify_download` tool computes the file size and SHA-256 cryptographic checksum, verifying data integrity before downstream consumption.

---

### 6. File Upload Automation

File uploading leverages native CDP DOM integration without invoking OS native file dialogs:

1. Resolves target `<input type="file">` node via `DOM.querySelector`.
2. Validates that the local file exists, resides within an approved workspace root (`D:\MCP\Browser-Workspace\` or configured project directories), and does not match forbidden executable extensions.
3. Invokes `DOM.setFileInputFiles`:
   ```json
   {
     "method": "DOM.setFileInputFiles",
     "params": {
       "files": ["D:\\MCP\\Browser-Workspace\\uploads\\sample.png"],
       "nodeId": 12
     }
   }
   ```
4. Dispatches synthetic `change` and `input` events on the DOM element to trigger client-side validation scripts.

---

### 7. Concurrency & Lifecycle Scoping

- **Concurrency Scope**: All browser actions are governed by `browser:session` locking, preventing interleaved commands from racing across threads.
- **Process Isolation**: Every session runs inside a uniquely partitioned, ephemeral user-data-dir (`%TEMP%\madel-browser-{timestamp}`).
- **Graceful Cleanup**: Upon session termination or process exit, all child processes are terminated cleanly (`SIGTERM`/`SIGKILL`), and temporary profiles are wiped.
