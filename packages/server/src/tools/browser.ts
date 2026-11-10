/**
 * MADEL Studio Bridge — Browser MCP Tools (Phase P23)
 * Developed and maintained by Mahmoud Adel
 *
 * Implements 27 secure, strictly-typed Browser MCP tools:
 * - Browser Management (4)
 * - Navigation & History (7)
 * - Page Inspection & Content (6)
 * - User Interaction & Forms (6)
 * - Developer & Network Diagnostics (4)
 *
 * Integrates natively with P17 Concurrency Manager (browser:session, browser:navigation,
 * browser:interaction, browser:diagnostics) and enforces session isolation and scheme safety.
 */

import { writeFileSync } from "node:fs";
import { z } from "zod";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";

import { globalConcurrencyManager } from "../gateway/index.js";
import { BrowserManager, globalBrowserManager } from "./browser-manager.js";
import { BrowserSecurityPolicy } from "./browser-security.js";
import { guard, jsonResult } from "./result.js";

export function registerBrowserTools(
  server: McpServer,
  browserManager: BrowserManager = globalBrowserManager,
): void {
  const schedule = async <T>(scope: string, toolName: string, task: () => Promise<T>): Promise<T> => {
    return globalConcurrencyManager.schedule(scope, async () => task(), {
      correlationId: `corr-browser-${Date.now().toString(36)}`,
    });
  };

  /* =========================================================================
     GROUP 1: BROWSER MANAGEMENT (4 TOOLS)
     ========================================================================= */

  // 1. browser_list_browsers
  server.registerTool(
    "browser_list_browsers",
    {
      title: "Browser: List Available Browsers",
      description: "Lists installed Chromium browsers (Google Chrome, Microsoft Edge, Brave) detected on Windows.",
      inputSchema: {},
    },
    async () =>
      guard(async () => {
        const browsers = await schedule("browser:session", "browser_list_browsers", async () =>
          browserManager.listAvailableBrowsers(),
        );
        return jsonResult({
          totalDetected: browsers.length,
          browsers,
        });
      }),
  );

  // 2. browser_create_session
  server.registerTool(
    "browser_create_session",
    {
      title: "Browser: Create Isolated Session",
      description:
        "Spawns an isolated Chromium instance with ephemeral profile directory and connects via Chrome DevTools Protocol on dynamic localhost port.",
      inputSchema: {
        browserType: z.enum(["chrome", "edge", "brave"]).optional().describe("Browser engine. Default is 'chrome'."),
        headless: z.boolean().optional().describe("Whether to run in headless mode. Default is true."),
        viewport: z
          .object({
            width: z.number().int().min(320).max(3840).optional().describe("Viewport width. Default 1280."),
            height: z.number().int().min(240).max(2160).optional().describe("Viewport height. Default 800."),
          })
          .optional()
          .describe("Initial window dimensions."),
      },
    },
    async ({ browserType, headless, viewport }) =>
      guard(async () => {
        const session = await schedule("browser:session", "browser_create_session", async () =>
          browserManager.createSession({ browserType, headless, viewport }),
        );
        return jsonResult({
          sessionId: session.sessionId,
          browserType: session.browserType,
          executablePath: session.executablePath,
          port: session.port,
          pid: session.pid,
          headless: session.headless,
          createdAt: session.createdAt,
          message: "Isolated browser session created successfully.",
        });
      }),
  );

  // 3. browser_list_sessions
  server.registerTool(
    "browser_list_sessions",
    {
      title: "Browser: List Managed Sessions",
      description: "Lists all active browser sessions currently managed by MADEL Studio Bridge.",
      inputSchema: {},
    },
    async () =>
      guard(async () => {
        const sessions = await schedule("browser:session", "browser_list_sessions", async () =>
          browserManager.listSessions(),
        );
        return jsonResult({
          totalActiveSessions: sessions.length,
          sessions,
        });
      }),
  );

  // 4. browser_close_session
  server.registerTool(
    "browser_close_session",
    {
      title: "Browser: Close Managed Session",
      description:
        "Safely closes a managed browser session, terminates only the owned child PID, and deletes its ephemeral temporary user profile.",
      inputSchema: {
        sessionId: z.string().min(1).describe("ID of the managed browser session to close."),
      },
    },
    async ({ sessionId }) =>
      guard(async () => {
        const result = await schedule("browser:session", "browser_close_session", async () =>
          browserManager.closeSession(sessionId),
        );
        return jsonResult({
          sessionId,
          ...result,
          message: `Managed session '${sessionId}' closed cleanly.`,
        });
      }),
  );

  /* =========================================================================
     GROUP 2: NAVIGATION & HISTORY (7 TOOLS)
     ========================================================================= */

  // 5. browser_open_url
  server.registerTool(
    "browser_open_url",
    {
      title: "Browser: Open URL",
      description:
        "Opens a URL in a new or specified browser session with scheme validation (http, https, or approved file://).",
      inputSchema: {
        url: z.string().min(1).describe("Target URL to open."),
        sessionId: z.string().optional().describe("Session ID. If omitted, uses active or creates new session."),
        waitUntil: z
          .enum(["load", "domcontentloaded"])
          .optional()
          .describe("Wait condition. Defaults to 'load'."),
      },
    },
    async ({ url, sessionId, waitUntil }) =>
      guard(async () => {
        const validation = BrowserSecurityPolicy.validateUrl(url);
        if (!validation.valid) throw new Error(validation.error);

        return schedule("browser:navigation", "browser_open_url", async () => {
          let s = sessionId ? browserManager.getSession(sessionId) : undefined;
          if (!s) {
            const activeList = await browserManager.listSessions();
            if (activeList.length > 0 && activeList[0]) {
              s = browserManager.getSession(activeList[0].sessionId);
            } else {
              s = await browserManager.createSession();
            }
          }

          const res = await s.cdpClient.navigate(validation.sanitizedValue!, waitUntil);
          return jsonResult({
            sessionId: s.sessionId,
            ...res,
            status: "navigated",
          });
        });
      }),
  );

  // 6. browser_navigate
  server.registerTool(
    "browser_navigate",
    {
      title: "Browser: Navigate",
      description: "Navigates the specified managed browser session to a new URL.",
      inputSchema: {
        sessionId: z.string().min(1).describe("Target session ID."),
        url: z.string().min(1).describe("Destination URL."),
        waitUntil: z.enum(["load", "domcontentloaded"]).optional().describe("Wait condition."),
      },
    },
    async ({ sessionId, url, waitUntil }) =>
      guard(async () => {
        const validation = BrowserSecurityPolicy.validateUrl(url);
        if (!validation.valid) throw new Error(validation.error);

        return schedule("browser:navigation", "browser_navigate", async () => {
          const s = browserManager.getSession(sessionId);
          const res = await s.cdpClient.navigate(validation.sanitizedValue!, waitUntil);
          return jsonResult({
            sessionId,
            ...res,
          });
        });
      }),
  );

  // 7. browser_reload_page
  server.registerTool(
    "browser_reload_page",
    {
      title: "Browser: Reload Page",
      description: "Reloads the active page in the specified managed browser session.",
      inputSchema: {
        sessionId: z.string().min(1).describe("Target session ID."),
        ignoreCache: z.boolean().optional().describe("Whether to bypass cache. Default is false."),
      },
    },
    async ({ sessionId, ignoreCache }) =>
      guard(async () => {
        return schedule("browser:navigation", "browser_reload_page", async () => {
          const s = browserManager.getSession(sessionId);
          const reloaded = await s.cdpClient.reload(ignoreCache);
          return jsonResult({
            sessionId,
            reloaded,
            currentUrl: await s.cdpClient.getCurrentUrl(),
          });
        });
      }),
  );

  // 8. browser_go_back
  server.registerTool(
    "browser_go_back",
    {
      title: "Browser: Go Back",
      description: "Navigates backward in browser history for the specified session.",
      inputSchema: {
        sessionId: z.string().min(1).describe("Target session ID."),
      },
    },
    async ({ sessionId }) =>
      guard(async () => {
        return schedule("browser:navigation", "browser_go_back", async () => {
          const s = browserManager.getSession(sessionId);
          const res = await s.cdpClient.goBack();
          return jsonResult({
            sessionId,
            ...res,
          });
        });
      }),
  );

  // 9. browser_go_forward
  server.registerTool(
    "browser_go_forward",
    {
      title: "Browser: Go Forward",
      description: "Navigates forward in browser history for the specified session.",
      inputSchema: {
        sessionId: z.string().min(1).describe("Target session ID."),
      },
    },
    async ({ sessionId }) =>
      guard(async () => {
        return schedule("browser:navigation", "browser_go_forward", async () => {
          const s = browserManager.getSession(sessionId);
          const res = await s.cdpClient.goForward();
          return jsonResult({
            sessionId,
            ...res,
          });
        });
      }),
  );

  // 10. browser_get_current_url
  server.registerTool(
    "browser_get_current_url",
    {
      title: "Browser: Get Current URL",
      description: "Retrieves the active URL and parsed components of the specified browser session.",
      inputSchema: {
        sessionId: z.string().min(1).describe("Target session ID."),
      },
    },
    async ({ sessionId }) =>
      guard(async () => {
        return schedule("browser:navigation", "browser_get_current_url", async () => {
          const s = browserManager.getSession(sessionId);
          const rawUrl = await s.cdpClient.getCurrentUrl();
          let parsed: URL | null = null;
          try {
            parsed = new URL(rawUrl);
          } catch {}

          return jsonResult({
            sessionId,
            url: rawUrl,
            protocol: parsed?.protocol || null,
            hostname: parsed?.hostname || null,
            pathname: parsed?.pathname || null,
            search: parsed?.search || null,
          });
        });
      }),
  );

  // 11. browser_get_page_title
  server.registerTool(
    "browser_get_page_title",
    {
      title: "Browser: Get Page Title",
      description: "Reads document.title of the active page in the specified session.",
      inputSchema: {
        sessionId: z.string().min(1).describe("Target session ID."),
      },
    },
    async ({ sessionId }) =>
      guard(async () => {
        return schedule("browser:navigation", "browser_get_page_title", async () => {
          const s = browserManager.getSession(sessionId);
          const title = await s.cdpClient.getPageTitle();
          return jsonResult({
            sessionId,
            title,
          });
        });
      }),
  );

  /* =========================================================================
     GROUP 3: PAGE INSPECTION & CONTENT (6 TOOLS)
     ========================================================================= */

  // 12. browser_read_visible_text
  server.registerTool(
    "browser_read_visible_text",
    {
      title: "Browser: Read Visible Text",
      description: "Safely reads visible text from document.body or a target CSS selector.",
      inputSchema: {
        sessionId: z.string().min(1).describe("Target session ID."),
        selector: z.string().optional().describe("CSS selector. Defaults to 'body'."),
        maxLength: z
          .number()
          .int()
          .min(100)
          .max(200_000)
          .optional()
          .describe("Maximum character count. Default is 50,000."),
      },
    },
    async ({ sessionId, selector, maxLength }) =>
      guard(async () => {
        return schedule("browser:diagnostics", "browser_read_visible_text", async () => {
          const s = browserManager.getSession(sessionId);
          const res = await s.cdpClient.readVisibleText(selector || "body", maxLength || 50_000);
          return jsonResult({
            sessionId,
            selector: selector || "body",
            ...res,
          });
        });
      }),
  );

  // 13. browser_inspect_dom_elements
  server.registerTool(
    "browser_inspect_dom_elements",
    {
      title: "Browser: Inspect DOM Elements",
      description: "Inspects elements matching a CSS selector, returning tag, attributes, bounds, and text.",
      inputSchema: {
        sessionId: z.string().min(1).describe("Target session ID."),
        selector: z.string().min(1).describe("CSS selector to inspect."),
        limit: z.number().int().min(1).max(100).optional().describe("Maximum elements to inspect. Default 10."),
      },
    },
    async ({ sessionId, selector, limit }) =>
      guard(async () => {
        return schedule("browser:diagnostics", "browser_inspect_dom_elements", async () => {
          const s = browserManager.getSession(sessionId);
          const elements = await s.cdpClient.inspectDomElements(selector, limit || 10);
          return jsonResult({
            sessionId,
            selector,
            totalMatches: elements.length,
            elements,
          });
        });
      }),
  );

  // 14. browser_find_elements
  server.registerTool(
    "browser_find_elements",
    {
      title: "Browser: Find Elements",
      description: "Searches for interactive elements by CSS selector, visible text, or ARIA role.",
      inputSchema: {
        sessionId: z.string().min(1).describe("Target session ID."),
        query: z.string().min(1).describe("Search string (text, selector, or role)."),
        by: z.enum(["selector", "text", "role"]).optional().describe("Search strategy. Default is 'selector'."),
      },
    },
    async ({ sessionId, query, by }) =>
      guard(async () => {
        return schedule("browser:diagnostics", "browser_find_elements", async () => {
          const s = browserManager.getSession(sessionId);
          const matches = await s.cdpClient.findElements(query, by || "selector");
          return jsonResult({
            sessionId,
            query,
            by: by || "selector",
            count: matches.length,
            matches,
          });
        });
      }),
  );

  // 15. browser_get_page_metadata
  server.registerTool(
    "browser_get_page_metadata",
    {
      title: "Browser: Get Page Metadata",
      description: "Extracts structured metadata (title, description, OpenGraph, canonical, favicon).",
      inputSchema: {
        sessionId: z.string().min(1).describe("Target session ID."),
      },
    },
    async ({ sessionId }) =>
      guard(async () => {
        return schedule("browser:diagnostics", "browser_get_page_metadata", async () => {
          const s = browserManager.getSession(sessionId);
          const metadata = await s.cdpClient.getPageMetadata();
          return jsonResult({
            sessionId,
            metadata,
          });
        });
      }),
  );

  // 16. browser_inspect_links
  server.registerTool(
    "browser_inspect_links",
    {
      title: "Browser: Inspect Links",
      description: "Extracts anchor links from the active page, categorized by internal, external, and download.",
      inputSchema: {
        sessionId: z.string().min(1).describe("Target session ID."),
        limit: z.number().int().min(1).max(200).optional().describe("Maximum links to inspect. Default 50."),
      },
    },
    async ({ sessionId, limit }) =>
      guard(async () => {
        return schedule("browser:diagnostics", "browser_inspect_links", async () => {
          const s = browserManager.getSession(sessionId);
          const links = await s.cdpClient.inspectLinks(limit || 50);
          return jsonResult({
            sessionId,
            totalLinks: links.length,
            links,
          });
        });
      }),
  );

  // 17. browser_get_screenshot
  server.registerTool(
    "browser_get_screenshot",
    {
      title: "Browser: Get Screenshot",
      description:
        "Captures a high-resolution screenshot via CDP Page.captureScreenshot (base64 and optional workspace save).",
      inputSchema: {
        sessionId: z.string().min(1).describe("Target session ID."),
        format: z.enum(["png", "jpeg"]).optional().describe("Image format. Default 'png'."),
        quality: z.number().int().min(1).max(100).optional().describe("JPEG quality (1-100)."),
        fullPage: z.boolean().optional().describe("Whether to capture full scrollable document height."),
        savePath: z.string().optional().describe("Optional path in approved workspace to write image file."),
      },
    },
    async ({ sessionId, format, quality, fullPage, savePath }) =>
      guard(async () => {
        return schedule("browser:diagnostics", "browser_get_screenshot", async () => {
          const s = browserManager.getSession(sessionId);
          const screenshot = await s.cdpClient.getScreenshot({ format, quality, fullPage });

          let savedPath: string | undefined;
          if (savePath) {
            if (!BrowserSecurityPolicy.isPathInApprovedWorkspace(savePath)) {
              throw new Error(`Screenshot save path '${savePath}' is outside approved workspace boundaries.`);
            }
            const buffer = Buffer.from(screenshot.dataBase64, "base64");
            writeFileSync(savePath, buffer);
            savedPath = savePath;
          }

          return jsonResult({
            sessionId,
            format: screenshot.format,
            fullPage: fullPage || false,
            dataBase64Length: screenshot.dataBase64.length,
            savedPath: savedPath || null,
          });
        });
      }),
  );

  /* =========================================================================
     GROUP 4: USER INTERACTION & FORMS (6 TOOLS)
     ========================================================================= */

  // 18. browser_click_element
  server.registerTool(
    "browser_click_element",
    {
      title: "Browser: Click Element",
      description: "Clicks an element identified by CSS selector using native CDP mouse press/release events.",
      inputSchema: {
        sessionId: z.string().min(1).describe("Target session ID."),
        selector: z.string().min(1).describe("CSS selector of target element."),
        button: z.enum(["left", "right", "middle"]).optional().describe("Mouse button. Default 'left'."),
        clickCount: z.number().int().min(1).max(3).optional().describe("Click count (1=single, 2=double)."),
      },
    },
    async ({ sessionId, selector, button, clickCount }) =>
      guard(async () => {
        return schedule("browser:interaction", "browser_click_element", async () => {
          const s = browserManager.getSession(sessionId);
          const coords = await s.cdpClient.clickElement(selector, button || "left", clickCount || 1);
          return jsonResult({
            sessionId,
            selector,
            clicked: true,
            coordinates: coords,
          });
        });
      }),
  );

  // 19. browser_fill_input
  server.registerTool(
    "browser_fill_input",
    {
      title: "Browser: Fill Input",
      description: "Focuses an input/textarea element, clears text, inserts value, and triggers change event.",
      inputSchema: {
        sessionId: z.string().min(1).describe("Target session ID."),
        selector: z.string().min(1).describe("CSS selector of input or textarea."),
        value: z.string().describe("Text value to type into the element."),
        clearFirst: z.boolean().optional().describe("Clear existing text before typing. Default true."),
      },
    },
    async ({ sessionId, selector, value, clearFirst }) =>
      guard(async () => {
        return schedule("browser:interaction", "browser_fill_input", async () => {
          const s = browserManager.getSession(sessionId);
          const res = await s.cdpClient.fillInput(selector, value, clearFirst !== false);
          return jsonResult({
            sessionId,
            selector,
            filled: true,
            length: res.length,
          });
        });
      }),
  );

  // 20. browser_select_option
  server.registerTool(
    "browser_select_option",
    {
      title: "Browser: Select Option",
      description: "Selects an option in an HTML <select> dropdown by value, label, or index.",
      inputSchema: {
        sessionId: z.string().min(1).describe("Target session ID."),
        selector: z.string().min(1).describe("CSS selector of select element."),
        value: z.string().optional().describe("Option value attribute to select."),
        label: z.string().optional().describe("Option visible label to select."),
        index: z.number().int().min(0).optional().describe("Option 0-based index to select."),
      },
    },
    async ({ sessionId, selector, value, label, index }) =>
      guard(async () => {
        return schedule("browser:interaction", "browser_select_option", async () => {
          const s = browserManager.getSession(sessionId);
          const res = await s.cdpClient.selectOption(selector, { value, label, index });
          return jsonResult({
            sessionId,
            selector,
            ...res,
          });
        });
      }),
  );

  // 21. browser_scroll_page
  server.registerTool(
    "browser_scroll_page",
    {
      title: "Browser: Scroll Page",
      description: "Scrolls the page or viewport by delta or jumps to top/bottom.",
      inputSchema: {
        sessionId: z.string().min(1).describe("Target session ID."),
        direction: z
          .enum(["down", "up", "toTop", "toBottom"])
          .optional()
          .describe("Scroll direction. Default 'down'."),
        deltaY: z.number().optional().describe("Vertical scroll pixels. Default 400."),
        deltaX: z.number().optional().describe("Horizontal scroll pixels. Default 0."),
      },
    },
    async ({ sessionId, direction, deltaY, deltaX }) =>
      guard(async () => {
        return schedule("browser:interaction", "browser_scroll_page", async () => {
          const s = browserManager.getSession(sessionId);
          const res = await s.cdpClient.scrollPage({ direction, deltaY, deltaX });
          return jsonResult({
            sessionId,
            ...res,
          });
        });
      }),
  );

  // 22. browser_wait_for_element
  server.registerTool(
    "browser_wait_for_element",
    {
      title: "Browser: Wait for Element",
      description: "Waits for an element matching a CSS selector to become visible or attached in the DOM.",
      inputSchema: {
        sessionId: z.string().min(1).describe("Target session ID."),
        selector: z.string().min(1).describe("CSS selector to wait for."),
        timeoutMs: z.number().int().min(100).max(30_000).optional().describe("Timeout in ms. Default 5000."),
        state: z.enum(["visible", "attached"]).optional().describe("Required element state. Default 'visible'."),
      },
    },
    async ({ sessionId, selector, timeoutMs, state }) =>
      guard(async () => {
        return schedule("browser:interaction", "browser_wait_for_element", async () => {
          const s = browserManager.getSession(sessionId);
          const res = await s.cdpClient.waitForElement(selector, timeoutMs || 5000, state || "visible");
          return jsonResult({
            sessionId,
            selector,
            ...res,
          });
        });
      }),
  );

  // 23. browser_upload_local_file
  server.registerTool(
    "browser_upload_local_file",
    {
      title: "Browser: Upload Local File",
      description:
        "Sets local files on an <input type='file'> element with mandatory safety approval and path validation.",
      inputSchema: {
        sessionId: z.string().min(1).describe("Target session ID."),
        selector: z.string().min(1).describe("CSS selector of <input type='file'>."),
        filePaths: z.array(z.string().min(1)).min(1).describe("List of absolute local file paths to upload."),
        approved: z
          .boolean()
          .describe("Explicit mandatory safety approval. Must be true to permit file upload."),
      },
    },
    async ({ sessionId, selector, filePaths, approved }) =>
      guard(async () => {
        if (!approved) {
          throw new Error("Safety check: File upload requires explicit approved: true parameter");
        }

        const validation = BrowserSecurityPolicy.validateUploadFiles(filePaths);
        if (!validation.valid) throw new Error(validation.error);

        return schedule("browser:interaction", "browser_upload_local_file", async () => {
          const s = browserManager.getSession(sessionId);
          const res = await s.cdpClient.uploadLocalFile(selector, validation.approvedPaths);
          return jsonResult({
            sessionId,
            selector,
            ...res,
          });
        });
      }),
  );

  /* =========================================================================
     GROUP 5: DEVELOPER & NETWORK DIAGNOSTICS (4 TOOLS)
     ========================================================================= */

  // 24. browser_inspect_console_errors
  server.registerTool(
    "browser_inspect_console_errors",
    {
      title: "Browser: Inspect Console Errors",
      description: "Inspects console logs, warnings, and error messages emitted by the page in the specified session.",
      inputSchema: {
        sessionId: z.string().min(1).describe("Target session ID."),
        severity: z.enum(["all", "error", "warning"]).optional().describe("Log severity filter. Default 'all'."),
        limit: z.number().int().min(1).max(200).optional().describe("Maximum entries to retrieve. Default 50."),
      },
    },
    async ({ sessionId, severity, limit }) =>
      guard(async () => {
        return schedule("browser:diagnostics", "browser_inspect_console_errors", async () => {
          const s = browserManager.getSession(sessionId);
          let logs = s.cdpClient.consoleLogs;
          if (severity === "error") {
            logs = logs.filter((l) => l.type === "error");
          } else if (severity === "warning") {
            logs = logs.filter((l) => l.type === "warning" || l.type === "warn");
          }
          const sliced = logs.slice(-(limit || 50));
          return jsonResult({
            sessionId,
            totalRecorded: logs.length,
            entriesCount: sliced.length,
            entries: sliced,
          });
        });
      }),
  );

  // 25. browser_inspect_failed_network_requests
  server.registerTool(
    "browser_inspect_failed_network_requests",
    {
      title: "Browser: Inspect Failed Network Requests",
      description: "Inspects failed HTTP/HTTPS network requests, HTTP error statuses (4xx/5xx), or aborted connections.",
      inputSchema: {
        sessionId: z.string().min(1).describe("Target session ID."),
        limit: z.number().int().min(1).max(200).optional().describe("Maximum entries to retrieve. Default 50."),
      },
    },
    async ({ sessionId, limit }) =>
      guard(async () => {
        return schedule("browser:diagnostics", "browser_inspect_failed_network_requests", async () => {
          const s = browserManager.getSession(sessionId);
          const failed = s.cdpClient.failedRequests.slice(-(limit || 50));
          return jsonResult({
            sessionId,
            totalRecordedFailed: s.cdpClient.failedRequests.length,
            entriesCount: failed.length,
            failedRequests: failed,
          });
        });
      }),
  );

  // 26. browser_get_page_performance_metrics
  server.registerTool(
    "browser_get_page_performance_metrics",
    {
      title: "Browser: Get Page Performance Metrics",
      description: "Retrieves runtime performance metrics via CDP Performance.getMetrics (heap, layout, nodes, etc.).",
      inputSchema: {
        sessionId: z.string().min(1).describe("Target session ID."),
      },
    },
    async ({ sessionId }) =>
      guard(async () => {
        return schedule("browser:diagnostics", "browser_get_page_performance_metrics", async () => {
          const s = browserManager.getSession(sessionId);
          const metrics = await s.cdpClient.getPerformanceMetrics();
          return jsonResult({
            sessionId,
            metrics,
            timestamp: new Date().toISOString(),
          });
        });
      }),
  );

  // 27. browser_capture_accessibility_snapshot
  server.registerTool(
    "browser_capture_accessibility_snapshot",
    {
      title: "Browser: Capture Accessibility Snapshot",
      description: "Captures full accessibility (AX) tree snapshot for semantic inspection and screen reader analysis.",
      inputSchema: {
        sessionId: z.string().min(1).describe("Target session ID."),
        maxDepth: z.number().int().min(1).max(20).optional().describe("Maximum tree traversal depth. Default 5."),
      },
    },
    async ({ sessionId, maxDepth }) =>
      guard(async () => {
        return schedule("browser:diagnostics", "browser_capture_accessibility_snapshot", async () => {
          const s = browserManager.getSession(sessionId);
          const tree = await s.cdpClient.getAccessibilitySnapshot(maxDepth || 5);
          return jsonResult({
            sessionId,
            nodeCount: Array.isArray(tree) ? tree.length : 0,
            accessibilityTree: tree,
          });
        });
      }),
  );
}
