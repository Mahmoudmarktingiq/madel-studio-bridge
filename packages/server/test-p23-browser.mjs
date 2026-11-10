/**
 * MADEL Studio Bridge — Phase P23 Browser MCP Integration Test Suite
 * Developed and maintained by Mahmoud Adel
 *
 * Verifies 27 Browser MCP tools, CDP session isolation, security policies,
 * live Chromium automation (navigation, DOM inspection, element interaction, screenshot capture),
 * and clean process scoping on Windows.
 */

import assert from "node:assert";
import { existsSync, unlinkSync } from "node:fs";
import { resolve } from "node:path";

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { registerBrowserTools } from "./dist/tools/browser.js";
import { BrowserManager } from "./dist/tools/browser-manager.js";
import { BrowserSecurityPolicy } from "./dist/tools/browser-security.js";
import { DesktopBridgeRpc } from "./dist/desktop/bridge-rpc.js";
import { globalConcurrencyManager } from "./dist/gateway/index.js";

console.log("=== MADEL STUDIO BRIDGE — P23 BROWSER MCP INTEGRATION TEST SUITE ===");
console.log(`Node version: ${process.version}`);

async function runTest(name, fn) {
  try {
    await fn();
    console.log(`[PASS] ${name}`);
  } catch (err) {
    console.error(`[FAIL] ${name}`);
    console.error(err);
    process.exit(1);
  }
}

const EXPECTED_BROWSER_TOOLS = [
  // 1. Management (4)
  "browser_list_browsers",
  "browser_create_session",
  "browser_list_sessions",
  "browser_close_session",

  // 2. Navigation (7)
  "browser_open_url",
  "browser_navigate",
  "browser_reload_page",
  "browser_go_back",
  "browser_go_forward",
  "browser_get_current_url",
  "browser_get_page_title",

  // 3. Inspection (6)
  "browser_read_visible_text",
  "browser_inspect_dom_elements",
  "browser_find_elements",
  "browser_get_page_metadata",
  "browser_inspect_links",
  "browser_get_screenshot",

  // 4. Interaction (6)
  "browser_click_element",
  "browser_fill_input",
  "browser_select_option",
  "browser_scroll_page",
  "browser_wait_for_element",
  "browser_upload_local_file",

  // 5. Diagnostics (4)
  "browser_inspect_console_errors",
  "browser_inspect_failed_network_requests",
  "browser_get_page_performance_metrics",
  "browser_capture_accessibility_snapshot",
];

const testFixtureHtmlPath = resolve("D:/MCP/11-Other-Apps/Browser/MADEL/P23-Browser-Integration/01-Source/test-page.html");
const testPreviewImgPath = resolve("D:/MCP/11-Other-Apps/Browser/MADEL/P23-Browser-Integration/04-Previews/test-preview.png");

const mcp = new McpServer(
  { name: "madel-browser-test", version: "0.4.0" },
  { capabilities: { tools: {} } }
);
const browserManager = new BrowserManager();
registerBrowserTools(mcp, browserManager);
let liveSession = null;

try {
  // Test 1: Tool Registration
  await runTest("1. Registration of all 27 specialized Browser MCP tools", async () => {
    const registeredTools = mcp._registeredTools;
    assert.ok(registeredTools, "_registeredTools must exist");
    const registeredNames = new Set(Object.keys(registeredTools));

    for (const toolName of EXPECTED_BROWSER_TOOLS) {
      assert.ok(registeredNames.has(toolName), `Tool '${toolName}' must be registered on McpServer`);
    }

    assert.strictEqual(EXPECTED_BROWSER_TOOLS.length, 27, "Expected exactly 27 Browser MCP tools");
    console.log(`       All 27 Browser tools verified registered cleanly on McpServer.`);
  });

  // Test 2: Browser Discovery
  await runTest("2. Browser Discovery: detects local Google Chrome and/or Microsoft Edge", async () => {
    const browsers = browserManager.listAvailableBrowsers();
    assert.ok(Array.isArray(browsers) && browsers.length > 0, "At least one Chromium browser must be detected");

    const chrome = browsers.find((b) => b.type === "chrome");
    const edge = browsers.find((b) => b.type === "edge");

    assert.ok(chrome || edge, "Either Chrome or Edge must be detected on Windows");
    if (chrome) {
      assert.ok(existsSync(chrome.executablePath), `Chrome binary must exist at ${chrome.executablePath}`);
      console.log(`       Detected Google Chrome: ${chrome.version || "unknown"} at ${chrome.executablePath}`);
    }
    if (edge) {
      assert.ok(existsSync(edge.executablePath), `Edge binary must exist at ${edge.executablePath}`);
      console.log(`       Detected Microsoft Edge: ${edge.version || "unknown"} at ${edge.executablePath}`);
    }
  });

  // Test 3: URL Scheme Security Policy
  await runTest("3. Security Policy: URL Scheme Allowlist & Strict Scheme Validation", async () => {
    // Valid URLs
    const v1 = BrowserSecurityPolicy.validateUrl("https://example.com/asset");
    assert.strictEqual(v1.valid, true);

    const v2 = BrowserSecurityPolicy.validateUrl("http://localhost:3000/dashboard");
    assert.strictEqual(v2.valid, true);

    const v3 = BrowserSecurityPolicy.validateUrl("about:blank");
    assert.strictEqual(v3.valid, true);

    // Blocked malicious or dangerous schemes
    const b1 = BrowserSecurityPolicy.validateUrl("javascript:alert(1)");
    assert.strictEqual(b1.valid, false);
    assert.ok(b1.error.includes("Blocked unsafe URL scheme"));

    const b2 = BrowserSecurityPolicy.validateUrl("data:text/html,<script>alert(1)</script>");
    assert.strictEqual(b2.valid, false);

    const b3 = BrowserSecurityPolicy.validateUrl("chrome://settings");
    assert.strictEqual(b3.valid, false);

    const b4 = BrowserSecurityPolicy.validateUrl("edge://flags");
    assert.strictEqual(b4.valid, false);

    // Local file inside approved workspace
    const validFile = BrowserSecurityPolicy.validateUrl(`file:///${testFixtureHtmlPath.replace(/\\/g, "/")}`);
    assert.strictEqual(validFile.valid, true);

    // Local file outside approved workspace
    const blockedFile = BrowserSecurityPolicy.validateUrl("file:///C:/Windows/System32/drivers/etc/hosts");
    assert.strictEqual(blockedFile.valid, false);
    assert.ok(blockedFile.error.includes("outside authorized workspace boundaries"));
  });

  // Test 4: File Upload Security
  await runTest("4. Security Policy: Safe File Upload Validation & Sensitive File Rejection", async () => {
    // Valid file in workspace
    const validUpload = BrowserSecurityPolicy.validateUploadFiles([testFixtureHtmlPath]);
    assert.strictEqual(validUpload.valid, true);
    assert.strictEqual(validUpload.approvedPaths.length, 1);

    // Non-existent file
    const invalidUpload = BrowserSecurityPolicy.validateUploadFiles(["D:/MCP/non-existent-image.png"]);
    assert.strictEqual(invalidUpload.valid, false);
    assert.ok(invalidUpload.error.includes("File not found"));

    // Sensitive credential file rejection
    const envFileCheck = BrowserSecurityPolicy.validateUploadFiles(["D:/MCP/01-Projects/Source/MADEL-Studio-Bridge/.env"]);
    assert.strictEqual(envFileCheck.valid, false);
  });

  // Test 5: Live Browser Launch & Session Isolation
  await runTest("5. Live Session Launch: creates isolated ephemeral profile & connects via CDP", async () => {
    liveSession = await browserManager.createSession({
      browserType: "chrome",
      headless: true,
      viewport: { width: 1280, height: 800 },
    });

    assert.ok(liveSession.sessionId, "Session must have an ID");
    assert.ok(liveSession.pid > 0, "Session must have a valid child process PID");
    assert.ok(liveSession.port > 0, "Session must have an allocated local port");
    assert.ok(existsSync(liveSession.tempProfileDir), "Ephemeral profile directory must exist on disk");
    assert.strictEqual(liveSession.headless, true);

    const sessions = await browserManager.listSessions();
    assert.ok(sessions.some((s) => s.sessionId === liveSession.sessionId), "Session must be listed in active registry");
    console.log(`       Spawned isolated Chromium PID ${liveSession.pid} on port ${liveSession.port}`);
  });

  // Test 6: Live Navigation
  await runTest("6. Live Navigation: opens local authorized test fixture and reads URL/Title", async () => {
    assert.ok(liveSession, "Live session must be active");
    const fileUrl = `file:///${testFixtureHtmlPath.replace(/\\/g, "/")}`;

    const nav = await liveSession.cdpClient.navigate(fileUrl, "load");
    assert.ok(nav.url.toLowerCase().includes("test-page.html"), "Current URL must match test fixture");
    assert.strictEqual(nav.title, "MADEL Studio Bridge — Test Page");

    const currentUrl = await liveSession.cdpClient.getCurrentUrl();
    const pageTitle = await liveSession.cdpClient.getPageTitle();
    assert.strictEqual(pageTitle, "MADEL Studio Bridge — Test Page");
    assert.ok(currentUrl.toLowerCase().includes("test-page.html"));
    console.log(`       Successfully navigated to ${fileUrl}`);
  });

  // Test 7: Page Content Inspection
  await runTest("7. Page Content Inspection: reads visible text and queries DOM elements", async () => {
    assert.ok(liveSession, "Live session must be active");

    const textRes = await liveSession.cdpClient.readVisibleText("body", 5000);
    assert.ok(textRes.text.includes("MADEL Creative Reference Hub"), "Visible text must include page heading");
    assert.ok(textRes.text.includes("Asset Search Query"), "Visible text must include section title");
    assert.strictEqual(textRes.truncated, false);

    const elements = await liveSession.cdpClient.inspectDomElements(".interactive-card", 10);
    assert.strictEqual(elements.length, 2, "Expected exactly 2 .interactive-card elements");
    assert.strictEqual(elements[0].tagName, "section");
    assert.strictEqual(elements[0].id, "form-card");

    const buttons = await liveSession.cdpClient.findElements("button", "selector");
    assert.ok(buttons.length >= 1, "Must find search button");
    assert.strictEqual(buttons[0].text, "Search Assets");
    console.log(`       Verified DOM inspection: 2 sections and 1 button detected.`);
  });

  // Test 8: Structured Metadata & Link Extraction
  await runTest("8. Structured Metadata & Link Extraction", async () => {
    assert.ok(liveSession, "Live session must be active");

    const meta = await liveSession.cdpClient.getPageMetadata();
    assert.strictEqual(meta.title, "MADEL Studio Bridge — Test Page");
    assert.strictEqual(meta.description, "Test fixture for MADEL Studio Bridge Browser MCP integration");
    assert.strictEqual(meta.canonical, "https://madel.local/test");
    assert.strictEqual(meta.openGraph.title, "MADEL Browser Test");

    const links = await liveSession.cdpClient.inspectLinks(20);
    assert.strictEqual(links.length, 3, "Expected 3 links on test page");
    const ext = links.find((l) => l.href.includes("example.com"));
    assert.ok(ext && ext.isExternal, "External link must be flagged as external");
    const download = links.find((l) => l.isDownload);
    assert.ok(download, "Download link must be flagged as download");
    console.log(`       Extracted metadata and 3 categorized links successfully.`);
  });

  // Test 9: User Interaction & Form Submission
  await runTest("9. Element Interaction: fill text input, select dropdown option, and click button", async () => {
    assert.ok(liveSession, "Live session must be active");

    // Fill query input
    const fillRes = await liveSession.cdpClient.fillInput("#query-input", "Cyberpunk Neon");
    assert.strictEqual(fillRes.length, "Cyberpunk Neon".length);

    // Select category option
    const selectRes = await liveSession.cdpClient.selectOption("#category-select", { value: "photos" });
    assert.strictEqual(selectRes.selectedValue, "photos");

    // Click search button
    const clickRes = await liveSession.cdpClient.clickElement("#search-btn", "left", 1);
    assert.ok(clickRes.x > 0 && clickRes.y > 0, "Click coordinates must be positive numbers");

    // Check DOM update
    await new Promise((r) => setTimeout(r, 200));
    const statusText = await liveSession.cdpClient.readVisibleText("#result-status");
    assert.strictEqual(statusText.text.trim(), "Searched: Cyberpunk Neon [photos]");
    console.log(`       Form interaction verified: #result-status updated to '${statusText.text.trim()}'.`);
  });

  // Test 10: Screenshot Capture
  await runTest("10. High-Resolution Screenshot Capture: verifies base64 data and workspace save", async () => {
    assert.ok(liveSession, "Live session must be active");

    const ss = await liveSession.cdpClient.getScreenshot({ format: "png", fullPage: true });
    assert.strictEqual(ss.format, "png");
    assert.ok(ss.dataBase64.length > 5000, "Base64 screenshot payload must be non-empty");

    // Call tool via McpServer tools/call request handler with savePath
    const callHandler = mcp.server._requestHandlers.get("tools/call");
    assert.ok(callHandler, "tools/call handler must exist");

    const toolRes = await callHandler({
      method: "tools/call",
      params: {
        name: "browser_get_screenshot",
        arguments: {
          sessionId: liveSession.sessionId,
          format: "png",
          savePath: testPreviewImgPath,
        },
      },
    }, {});

    assert.ok(!toolRes.isError, `Screenshot tool call must not fail: ${JSON.stringify(toolRes)}`);
    const parsed = JSON.parse(toolRes.content[0].text);
    assert.strictEqual(parsed.savedPath, testPreviewImgPath);
    assert.ok(existsSync(testPreviewImgPath), `Saved screenshot file must exist at ${testPreviewImgPath}`);
    console.log(`       Screenshot captured: ${parsed.dataBase64Length} bytes, saved to ${testPreviewImgPath}`);
  });

  // Test 11: Developer Diagnostics & Clean Process Scoping
  await runTest("11. Developer Diagnostics & Clean Process Scoping", async () => {
    assert.ok(liveSession, "Live session must be active");

    // Inspect console logs
    const consoleLogs = liveSession.cdpClient.consoleLogs;
    assert.ok(consoleLogs.length >= 1, "At least 1 console log entry must be captured from search click");
    assert.ok(consoleLogs.some((l) => l.text.includes("Search dispatched for query: Cyberpunk Neon")));

    // Get performance metrics
    const metrics = await liveSession.cdpClient.getPerformanceMetrics();
    assert.ok(typeof metrics.JSHeapUsedSize === "number", "JSHeapUsedSize metric must be a number");
    assert.ok(typeof metrics.Nodes === "number", "Nodes count must be a number");

    // Capture accessibility tree
    const axTree = await liveSession.cdpClient.getAccessibilitySnapshot(3);
    assert.ok(Array.isArray(axTree) && axTree.length > 0, "Accessibility tree must contain nodes");

    // Clean Session Close
    const closeRes = await browserManager.closeSession(liveSession.sessionId);
    assert.strictEqual(closeRes.success, true);
    assert.strictEqual(closeRes.closedPid, liveSession.pid);
    liveSession = null;
    console.log(`       Diagnostics collected and process terminated cleanly.`);
  });

  // Test 12: Concurrency Scoping & Desktop RPC Integration
  await runTest("12. Concurrency Scoping & Desktop RPC Status Verification", async () => {
    // Concurrency manager scopes
    const scope1 = globalConcurrencyManager.resolveScope("browser", "browser_create_session");
    assert.strictEqual(scope1, "browser:session");

    const scope2 = globalConcurrencyManager.resolveScope("browser", "browser_open_url");
    assert.strictEqual(scope2, "browser:navigation");

    const scope3 = globalConcurrencyManager.resolveScope("browser", "browser_click_element");
    assert.strictEqual(scope3, "browser:interaction");

    const scope4 = globalConcurrencyManager.resolveScope("browser", "browser_inspect_console_errors");
    assert.strictEqual(scope4, "browser:diagnostics");

    // Desktop RPC applications status
    const apps = await DesktopBridgeRpc.getApplicationsStatus();
    const browserApp = apps.find((a) => a.id === "browser");
    assert.ok(browserApp, "Browser app must be listed in Desktop applications");
    assert.strictEqual(browserApp.category, "browser");
    assert.strictEqual(browserApp.status, "configured_not_verified");
    assert.strictEqual(browserApp.statusLabel, "Detected & Ready (Chromium CDP)");
    assert.strictEqual(browserApp.canControl, true);

    // Desktop RPC servers status
    const servers = await DesktopBridgeRpc.getServersStatus();
    const browserServer = servers.find((s) => s.id === "browser-mcp");
    assert.ok(browserServer, "Browser MCP server must be listed in Desktop servers");
    assert.strictEqual(browserServer.toolsCount, 27);
    console.log(`       Verified Desktop status: Detected & Ready (Chromium CDP) with 27 tools.`);
  });

  console.log("\nAll 12 P23 Browser tests passed successfully!");
} finally {
  if (liveSession) {
    try {
      await browserManager.closeSession(liveSession.sessionId);
    } catch {}
  }
}
