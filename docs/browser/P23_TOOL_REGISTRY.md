# MADEL Studio Bridge — Phase P23 Tool Registry
## Complete 27 Browser MCP Tools Specification
**Owner & Lead Architect:** Mahmoud Adel (`Mahmoudmarktingiq`)  
**Status:** IMPLEMENTED & LIVE VERIFIED  
**Date:** 2026-11-10

---

### Group 1: Browser Management (4 Tools)
| Tool Name | Scope | Input Schema | Description |
| :--- | :--- | :--- | :--- |
| `browser_list_browsers` | `browser:session` | `{}` | Lists detected Chromium browsers (Google Chrome, Microsoft Edge, Brave) on Windows. |
| `browser_create_session` | `browser:session` | `{ browserType?, headless?, viewport? }` | Spawns an isolated Chromium instance with ephemeral profile directory and connects via CDP on a dynamic localhost port. |
| `browser_list_sessions` | `browser:session` | `{}` | Lists all active browser sessions currently managed by MADEL Studio Bridge. |
| `browser_close_session` | `browser:session` | `{ sessionId: string }` | Safely closes a managed browser session, terminates only the owned child PID, and deletes its ephemeral temporary user profile. |

### Group 2: Navigation & History (7 Tools)
| Tool Name | Scope | Input Schema | Description |
| :--- | :--- | :--- | :--- |
| `browser_open_url` | `browser:navigation` | `{ url: string, sessionId?, waitUntil? }` | Opens a URL in a new or specified browser session with scheme validation (http, https, or approved file://). |
| `browser_navigate` | `browser:navigation` | `{ sessionId: string, url: string, waitUntil? }` | Navigates the specified managed browser session to a new URL. |
| `browser_reload_page` | `browser:navigation` | `{ sessionId: string, ignoreCache?: boolean }` | Reloads the active page in the specified managed browser session. |
| `browser_go_back` | `browser:navigation` | `{ sessionId: string }` | Navigates backward in browser history for the specified session. |
| `browser_go_forward` | `browser:navigation` | `{ sessionId: string }` | Navigates forward in browser history for the specified session. |
| `browser_get_current_url` | `browser:navigation` | `{ sessionId: string }` | Retrieves the active URL and parsed components (protocol, hostname, pathname, search). |
| `browser_get_page_title` | `browser:navigation` | `{ sessionId: string }` | Reads `document.title` of the active page in the specified session. |

### Group 3: Page Inspection & Content (6 Tools)
| Tool Name | Scope | Input Schema | Description |
| :--- | :--- | :--- | :--- |
| `browser_read_visible_text` | `browser:diagnostics` | `{ sessionId: string, selector?, maxLength? }` | Safely reads visible text from document.body or a target CSS selector. |
| `browser_inspect_dom_elements` | `browser:diagnostics` | `{ sessionId: string, selector: string, limit? }` | Inspects elements matching a CSS selector, returning tag, attributes, bounds, and text summary. |
| `browser_find_elements` | `browser:diagnostics` | `{ sessionId: string, query: string, by? }` | Searches for interactive elements by CSS selector, visible text, or ARIA role. |
| `browser_get_page_metadata` | `browser:diagnostics` | `{ sessionId: string }` | Extracts structured metadata (title, description, OpenGraph, canonical, favicon). |
| `browser_inspect_links` | `browser:diagnostics` | `{ sessionId: string, limit? }` | Extracts anchor links from the active page, categorized by internal, external, and download. |
| `browser_get_screenshot` | `browser:diagnostics` | `{ sessionId: string, format?, quality?, fullPage?, savePath? }` | Captures a high-resolution screenshot via CDP Page.captureScreenshot (base64 and optional workspace save). |

### Group 4: User Interaction & Forms (6 Tools)
| Tool Name | Scope | Input Schema | Description |
| :--- | :--- | :--- | :--- |
| `browser_click_element` | `browser:interaction` | `{ sessionId: string, selector: string, button?, clickCount? }` | Clicks an element identified by CSS selector using native CDP mouse press/release events. |
| `browser_fill_input` | `browser:interaction` | `{ sessionId: string, selector: string, value: string, clearFirst? }` | Focuses an input/textarea element, clears text, inserts value, and triggers change event. |
| `browser_select_option` | `browser:interaction` | `{ sessionId: string, selector: string, value?, label?, index? }` | Selects an option in an HTML `<select>` dropdown by value, label, or index. |
| `browser_scroll_page` | `browser:interaction` | `{ sessionId: string, direction?, deltaY?, deltaX? }` | Scrolls the page or viewport by delta or jumps to top/bottom. |
| `browser_wait_for_element` | `browser:interaction` | `{ sessionId: string, selector: string, timeoutMs?, state? }` | Waits for an element matching a CSS selector to become visible or attached in the DOM. |
| `browser_upload_local_file` | `browser:interaction` | `{ sessionId: string, selector: string, filePaths: string[], approved: boolean }` | Sets local files on an `<input type='file'>` element with mandatory safety approval (`approved: true`) and path validation. |

### Group 5: Developer & Network Diagnostics (4 Tools)
| Tool Name | Scope | Input Schema | Description |
| :--- | :--- | :--- | :--- |
| `browser_inspect_console_errors` | `browser:diagnostics` | `{ sessionId: string, severity?, limit? }` | Inspects console logs, warnings, and error messages emitted by the page in the specified session. |
| `browser_inspect_failed_network_requests` | `browser:diagnostics` | `{ sessionId: string, limit? }` | Inspects failed HTTP/HTTPS network requests, HTTP error statuses (4xx/5xx), or aborted connections. |
| `browser_get_page_performance_metrics` | `browser:diagnostics` | `{ sessionId: string }` | Retrieves runtime performance metrics via CDP Performance.getMetrics (heap, layout, nodes, etc.). |
| `browser_capture_accessibility_snapshot` | `browser:diagnostics` | `{ sessionId: string, maxDepth? }` | Captures full accessibility (AX) tree snapshot for semantic inspection and screen reader analysis. |

---

### Platform Tool Count Summary
- Total Base Tools (P22): **186**
- Net New Browser Tools (P23): **27**
- **Total Registered Tools (P23): 213**
