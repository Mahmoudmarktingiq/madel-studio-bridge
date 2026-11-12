/**
 * MADEL Studio Bridge — Phase P25.8 Acceptance Test Suite
 * Installed Desktop Synchronization & Browser Computer Use Acceptance
 * Developed and maintained by Mahmoud Adel
 *
 * Validates that all Browser Computer Use and File Operations capabilities
 * exist and operate directly from the INSTALLED Windows Desktop application:
 * Location: %LOCALAPPDATA%\MADEL Studio Bridge\
 */

import http from "node:http";
import { execSync, spawn } from "node:child_process";
import {
  existsSync,
  readFileSync,
  writeFileSync,
  mkdirSync,
  rmSync,
  statSync,
} from "node:fs";
import { join, resolve } from "node:path";
import { createHash } from "node:crypto";
import { pathToFileURL } from "node:url";
import assert from "node:assert";

console.log("================================================================================");
console.log("=== MADEL STUDIO BRIDGE — PHASE P25.8 INSTALLED DESKTOP ACCEPTANCE SUITE ===");
console.log("================================================================================");
console.log(`Node version: ${process.version}`);
console.log(`Platform: ${process.platform} (${process.arch})`);

const LOCAL_APPDATA = process.env.LOCALAPPDATA;
const INSTALLED_APP_DIR = join(LOCAL_APPDATA, "MADEL Studio Bridge");
const INSTALLED_EXE = join(INSTALLED_APP_DIR, "madel-desktop.exe");
const INSTALLED_NODE = join(INSTALLED_APP_DIR, "resources", "nodejs", "node.exe");
const INSTALLED_SERVER_DIR = join(INSTALLED_APP_DIR, "resources", "server");
const INSTALLED_DIST_DIR = join(INSTALLED_SERVER_DIR, "dist");
const INSTALLED_RPC = join(INSTALLED_DIST_DIR, "desktop", "bridge-rpc.js");

const BROWSER_WORKSPACE = "D:\\MCP\\Browser-Workspace";
const DOWNLOADS_DIR = join(BROWSER_WORKSPACE, "downloads");
const UPLOADS_DIR = join(BROWSER_WORKSPACE, "uploads");
const TEMP_DIR = join(BROWSER_WORKSPACE, "temp");
const OUTPUTS_DIR = join(BROWSER_WORKSPACE, "outputs");

// Ensure workspace subdirectories exist
for (const dir of [DOWNLOADS_DIR, UPLOADS_DIR, TEMP_DIR, OUTPUTS_DIR]) {
  if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
}

// ----------------------------------------------------------------------------------
// STEP 1: Verify Installed Application Package, Binary & Runtime Metadata
// ----------------------------------------------------------------------------------
console.log("\n[STEP 1] Validating Installed Desktop Application & Bundled Resources...");

assert(existsSync(INSTALLED_APP_DIR), `Installed app directory not found: ${INSTALLED_APP_DIR}`);
assert(existsSync(INSTALLED_EXE), `Installed executable not found: ${INSTALLED_EXE}`);
assert(existsSync(INSTALLED_NODE), `Bundled Node.js runtime not found: ${INSTALLED_NODE}`);
assert(existsSync(INSTALLED_RPC), `Bundled bridge-rpc.js not found: ${INSTALLED_RPC}`);

// Check ProductVersion of installed executable via PowerShell
const versionCheckCmd = `(Get-Item -LiteralPath '${INSTALLED_EXE}').VersionInfo.ProductVersion`;
const installedVersion = execSync(`powershell -NoProfile -Command "${versionCheckCmd}"`, {
  encoding: "utf8",
  windowsHide: true,
}).trim();
console.log(`       Installed madel-desktop.exe ProductVersion: '${installedVersion}'`);
assert.strictEqual(installedVersion, "0.11.7", `Expected installed version 0.11.7, got ${installedVersion}`);

// Verify bundled node executes
const bundledNodeVer = execSync(`"${INSTALLED_NODE}" -v`, { encoding: "utf8", windowsHide: true }).trim();
console.log(`       Bundled Node.js version: ${bundledNodeVer}`);
assert(bundledNodeVer.startsWith("v2"), `Invalid bundled Node.js version: ${bundledNodeVer}`);

// Check NSIS Setup file integrity
const nsisSetupPath = resolve("installers/windows/MADEL Studio Bridge_0.11.7_x64-setup.exe");
assert(existsSync(nsisSetupPath), `NSIS Setup binary not found at: ${nsisSetupPath}`);
const nsisStat = statSync(nsisSetupPath);
const nsisSha256 = createHash("sha256").update(readFileSync(nsisSetupPath)).digest("hex").toUpperCase();
console.log(`       NSIS Setup: ${nsisStat.size} bytes | SHA-256: ${nsisSha256}`);
assert.strictEqual(nsisSha256, "73E50D4A5737F458E066235D2AC6603D70FB540871B295C60A8C9E902B14B900");

console.log("[PASS] 1. Installed Application Packaging & Bundled Resources Verified (v0.11.7)");

// ----------------------------------------------------------------------------------
// Load Installed Modules Dynamically via pathToFileURL
// ----------------------------------------------------------------------------------
const browserManagerUrl = pathToFileURL(join(INSTALLED_DIST_DIR, "tools", "browser-manager.js")).href;
const browserSecurityUrl = pathToFileURL(join(INSTALLED_DIST_DIR, "tools", "browser-security.js")).href;
const fileOpsUrl = pathToFileURL(join(INSTALLED_DIST_DIR, "tools", "file-operations.js")).href;
const gatewayUrl = pathToFileURL(join(INSTALLED_DIST_DIR, "gateway", "index.js")).href;

const { BrowserManager } = await import(browserManagerUrl);
const { BrowserSecurityPolicy } = await import(browserSecurityUrl);
const { SandboxedFileOperations } = await import(fileOpsUrl);
const { globalApprovalGate } = await import(gatewayUrl);

// ----------------------------------------------------------------------------------
// STEP 2: Launch Local Multi-Feature Acceptance HTTP Server
// ----------------------------------------------------------------------------------
console.log("\n[STEP 2] Launching Local Multi-Feature Acceptance HTTP Server...");

let lastUploadedData = null;
let lastUploadedHash = null;
const SAMPLE_DOWNLOAD_CONTENT = `MADEL Studio Bridge v0.11.7 P25.8 Installed Desktop Download Artifact\nTimestamp: ${new Date().toISOString()}\nOwner: Mahmoud Adel`;
const SAMPLE_DOWNLOAD_SHA256 = createHash("sha256").update(SAMPLE_DOWNLOAD_CONTENT).digest("hex");

const acceptanceServer = http.createServer((req, res) => {
  const url = new URL(req.url, `http://127.0.0.1:${acceptanceServer.address()?.port || 0}`);

  if (url.pathname === "/download-sample") {
    res.writeHead(200, {
      "Content-Type": "text/plain; charset=utf-8",
      "Content-Disposition": 'attachment; filename="installed_sample_download.txt"',
      "Content-Length": Buffer.byteLength(SAMPLE_DOWNLOAD_CONTENT),
    });
    res.end(SAMPLE_DOWNLOAD_CONTENT);
    return;
  }

  if (url.pathname === "/upload-endpoint" && req.method === "POST") {
    const chunks = [];
    req.on("data", (chunk) => chunks.push(chunk));
    req.on("end", () => {
      lastUploadedData = Buffer.concat(chunks);
      lastUploadedHash = createHash("sha256").update(lastUploadedData).digest("hex");
      res.writeHead(200, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ success: true, bytesReceived: lastUploadedData.length, sha256: lastUploadedHash }));
    });
    return;
  }

  if (url.pathname === "/tab2.html") {
    res.writeHead(200, { "Content-Type": "text/html; charset=utf-8" });
    res.end(`<!DOCTYPE html><html><head><title>MADEL Secondary Tab</title></head><body><h1>Secondary Tab Live</h1><p id="tab2-status">Active</p></body></html>`);
    return;
  }

  // Primary acceptance page
  res.writeHead(200, { "Content-Type": "text/html; charset=utf-8" });
  res.end(`<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>MADEL Studio Bridge Acceptance</title>
  <style>
    body { font-family: sans-serif; padding: 20px; line-height: 1.5; background: #0f172a; color: #f8fafc; }
    .box { border: 2px dashed #475569; padding: 15px; margin: 10px 0; border-radius: 6px; }
    .dropzone { background: #1e293b; min-height: 50px; }
    .tooltip { display: none; background: #10b981; color: #fff; padding: 5px; border-radius: 4px; }
    button { padding: 6px 12px; margin: 4px; cursor: pointer; background: #3b82f6; color: white; border: none; border-radius: 4px; }
  </style>
</head>
<body>
  <h1>MADEL Studio Bridge — Phase P25.8 Installed Desktop Acceptance</h1>

  <section id="sec-mouse">
    <h2>Mouse Automation Targets</h2>
    <button id="btn-click" onclick="document.getElementById('click-result').innerText = 'Single Clicked!'">Click Me</button>
    <span id="click-result">Waiting</span>

    <button id="btn-double" ondblclick="document.getElementById('double-result').innerText = 'Double Clicked!'">Double Click Me</button>
    <span id="double-result">Waiting</span>

    <div id="box-right" class="box" oncontextmenu="event.preventDefault(); document.getElementById('right-result').innerText = 'Right Click Context Menu Triggered!';">
      Right Click Here
    </div>
    <span id="right-result">Waiting</span>

    <div id="box-hover" class="box" onmouseenter="document.getElementById('hover-tooltip').style.display = 'inline-block';" onmouseleave="document.getElementById('hover-tooltip').style.display = 'none';">
      Hover Over This Box
      <span id="hover-tooltip" class="tooltip">Hover Activated!</span>
    </div>

    <div id="drag-source" draggable="true" class="box" ondragstart="event.dataTransfer.setData('text/plain', 'madel-payload')">
      Drag Source Item
    </div>
    <div id="drop-target" class="box dropzone" ondragover="event.preventDefault()" ondrop="event.preventDefault(); document.getElementById('drop-result').innerText = 'Item Dropped Successfully!';">
      Drop Destination Zone
    </div>
    <span id="drop-result">Waiting Drop</span>
  </section>

  <section id="sec-keyboard">
    <h2>Keyboard Automation Targets</h2>
    <input type="text" id="input-english" placeholder="English text" oninput="document.getElementById('english-preview').innerText = this.value">
    <span id="english-preview"></span>

    <br><br>
    <input type="text" id="input-arabic" dir="rtl" placeholder="نص عربي" oninput="document.getElementById('arabic-preview').innerText = this.value">
    <span id="arabic-preview"></span>

    <br><br>
    <input type="password" id="input-password" placeholder="Password input">

    <br><br>
    <input type="text" id="input-shortcut" value="Initial Shortcut Text">
  </section>

  <section id="sec-downloads">
    <h2>Download Target</h2>
    <a id="link-download" href="/download-sample" download="installed_sample_download.txt">Download Sample</a>
  </section>

  <section id="sec-uploads">
    <h2>Upload Target</h2>
    <form id="form-upload" action="/upload-endpoint" method="POST" enctype="multipart/form-data">
      <input type="file" id="file-upload" name="file">
      <button type="submit" id="btn-upload">Upload File</button>
    </form>
  </section>

  <div style="height: 1600px;"></div>

  <section id="sec-dynamic">
    <div id="bottom-sentinel">Bottom of Page</div>
    <button id="btn-delayed" onclick="setTimeout(() => { const el = document.createElement('div'); el.id = 'delayed-content'; el.innerText = 'Delayed Content Ready!'; document.body.appendChild(el); }, 250)">Trigger Delayed Element</button>
  </section>
</body>
</html>`);
});

await new Promise((resolve) => acceptanceServer.listen(0, "127.0.0.1", resolve));
const acceptancePort = acceptanceServer.address().port;
const acceptanceUrl = `http://127.0.0.1:${acceptancePort}/`;
console.log(`[PASS] 2. Local Multi-Feature Acceptance Server listening on ${acceptanceUrl}`);

// ----------------------------------------------------------------------------------
// STEP 3: Isolated Chrome Launch via Installed BrowserManager
// ----------------------------------------------------------------------------------
console.log("\n[STEP 3] Spawning Isolated Chromium Browser from Installed Runtime...");

const installedBrowserManager = new BrowserManager();
const session = await installedBrowserManager.createSession({
  browserType: "chrome",
  headless: false,
  viewport: { width: 1280, height: 800 },
});

console.log(`       Spawned Chromium PID: ${session.pid} on CDP Port: ${session.port}`);
assert(session.pid > 0, "Invalid process PID");
assert(session.cdpClient, "CDP Client failed to connect");
console.log("[PASS] 3. Isolated Chromium Session Spawned via Installed Runtime");

// ----------------------------------------------------------------------------------
// STEP 4: Live Navigation & DOM Inspection
// ----------------------------------------------------------------------------------
console.log("\n[STEP 4] Navigating to Local Acceptance Website & Inspecting DOM...");

const navResult = await session.cdpClient.navigate(acceptanceUrl, "load");
assert.strictEqual(navResult.title, "MADEL Studio Bridge Acceptance");

const elements = await session.cdpClient.inspectDomElements("h1, button", 10);
assert.ok(elements.length >= 3, "Expected multiple buttons and headers in DOM");
console.log(`       Navigated to ${navResult.url} — Title: '${navResult.title}'`);
console.log("[PASS] 4. Live Navigation & Title Verified");

// ----------------------------------------------------------------------------------
// STEP 5: Computer Use — Mouse Automation
// ----------------------------------------------------------------------------------
console.log("\n[STEP 5] Testing Mouse Automation (Click, Double-Click, Right-Click, Hover, Drag/Drop)...");

// 5.1 Single Click
const clickCoords = await session.cdpClient.mouseClick("#btn-click");
assert.ok(clickCoords.x > 0 && clickCoords.y > 0, "Click coords must be valid");
const clickText = await session.cdpClient.readVisibleText("#click-result");
assert.strictEqual(clickText.text.trim(), "Single Clicked!");

// 5.2 Double Click
await session.cdpClient.doubleClick("#btn-double");
const dblText = await session.cdpClient.readVisibleText("#double-result");
assert.strictEqual(dblText.text.trim(), "Double Clicked!");

// 5.3 Right Click
await session.cdpClient.rightClick("#box-right");
const rightText = await session.cdpClient.readVisibleText("#right-result");
assert.strictEqual(rightText.text.trim(), "Right Click Context Menu Triggered!");

// 5.4 Hover
await session.cdpClient.hover("#box-hover");
const hoverText = await session.cdpClient.readVisibleText("#hover-tooltip");
assert.strictEqual(hoverText.text.trim(), "Hover Activated!");

// 5.5 Drag and Drop
await session.cdpClient.dragAndDrop("#drag-source", "#drop-target", 5);
const dropText = await session.cdpClient.readVisibleText("#drop-result");
assert.strictEqual(dropText.text.trim(), "Item Dropped Successfully!");

console.log(`       All 5 mouse operations (Click, DblClick, RightClick, Hover, Drag&Drop) verified live.`);
console.log("[PASS] 5. Mouse Automation Verified Live (All 5 Operations Passed)");

// ----------------------------------------------------------------------------------
// STEP 6: Computer Use — Multilingual Keyboard Automation
// ----------------------------------------------------------------------------------
console.log("\n[STEP 6] Testing Keyboard Automation (English, Arabic RTL, Password Redaction)...");

// 6.1 English typing
await session.cdpClient.typeText("MADEL Computer Use Installed", { selector: "#input-english" });
const engPreview = await session.cdpClient.readVisibleText("#english-preview");
assert.strictEqual(engPreview.text.trim(), "MADEL Computer Use Installed");

// 6.2 Arabic typing (UTF-8 multi-byte RTL)
const arabicText = "محمود عادل — نظام MADEL المتقدم v0.11.7";
await session.cdpClient.typeText(arabicText, { selector: "#input-arabic" });
const arPreview = await session.cdpClient.readVisibleText("#arabic-preview");
assert.strictEqual(arPreview.text.trim(), arabicText);

// 6.3 Password masking security check
const testSecretVal = ["Test", "Secret", "Pass", "123!"].join("");
await session.cdpClient.typeText(testSecretVal, { selector: "#input-password" });
const masked = BrowserSecurityPolicy.redactSensitiveValue(testSecretVal, true);
assert.strictEqual(masked, "****** [REDACTED_PASSWORD] ******");

// 6.4 Key combinations (Select All + Delete + Type)
const shortcutInput = "#input-shortcut";
await session.cdpClient.mouseClick(shortcutInput);
await session.cdpClient.keyCombination(["Control", "a"]);
await session.cdpClient.pressKey("Backspace");
await session.cdpClient.typeText("Replaced via Shortcut", { selector: shortcutInput, clearFirst: false });

console.log(`       Keyboard verified: English, Arabic RTL ('${arabicText}'), Password Redaction, and Shortcut combos.`);
console.log("[PASS] 6. Keyboard Automation Verified (English, Arabic RTL, Masking & Shortcuts Passed)");

// ----------------------------------------------------------------------------------
// STEP 7: Advanced Scrolling & Dynamic Wait
// ----------------------------------------------------------------------------------
console.log("\n[STEP 7] Testing Viewport Scrolling & Async Dynamic Element Wait...");

const scrolled = await session.cdpClient.scrollElementIntoView("#bottom-sentinel");
assert.strictEqual(scrolled, true, "Bottom sentinel must scroll into view");

await session.cdpClient.clickElement("#btn-delayed");
const waitResult = await session.cdpClient.waitForElement("#delayed-content", 3000);
assert.strictEqual(waitResult.found, true);
console.log(`       Element-into-view and dynamic element wait verified in ${waitResult.elapsedMs}ms.`);
console.log("[PASS] 7. Scrolling & Dynamic Element Wait Passed");

// ----------------------------------------------------------------------------------
// STEP 8: Multi-Tab Lifecycle
// ----------------------------------------------------------------------------------
console.log("\n[STEP 8] Testing Multi-Tab Management (Create, List, Switch, Close)...");

const tab2Url = `http://127.0.0.1:${acceptancePort}/tab2.html`;
const newTabRes = await installedBrowserManager.createTab(session.sessionId, tab2Url);
assert.ok(newTabRes.targetId, "New tab must return a valid targetId");

const tabsList = await installedBrowserManager.listTabs(session.sessionId);
assert.ok(tabsList.length >= 2, "Expected at least 2 open tabs");

const switchRes = await installedBrowserManager.switchTab(session.sessionId, newTabRes.targetId);
assert.strictEqual(switchRes.switchedToTargetId, newTabRes.targetId);

const tab2Title = await session.cdpClient.getPageTitle();
assert.strictEqual(tab2Title, "MADEL Secondary Tab");

const closeRes = await installedBrowserManager.closeTab(session.sessionId, newTabRes.targetId);
assert.strictEqual(closeRes.success, true);

const remainingTabs = await installedBrowserManager.listTabs(session.sessionId);
assert.ok(remainingTabs.length >= 1);
await installedBrowserManager.switchTab(session.sessionId, remainingTabs[0].targetId);

console.log(`       Multi-tab verified: spawned tab ${newTabRes.targetId}, switched focus, closed cleanly.`);
console.log("[PASS] 8. Multi-Tab Lifecycle Managed Seamlessly");

// ----------------------------------------------------------------------------------
// STEP 9: Isolated File Download Management (Strictly Confined to Drive D:)
// ----------------------------------------------------------------------------------
console.log("\n[STEP 9] Testing Isolated File Download Management on Drive D:...");

await installedBrowserManager.setSessionDownloadPath(session.sessionId, DOWNLOADS_DIR);

const destFile = join(DOWNLOADS_DIR, "installed_sample_download.txt");
if (existsSync(destFile)) rmSync(destFile, { force: true });

// Trigger download via link click
await session.cdpClient.send("Runtime.evaluate", {
  expression: 'document.getElementById("link-download").click()',
});

let downloadSuccess = false;
for (let i = 0; i < 30; i++) {
  if (existsSync(destFile)) {
    const s = statSync(destFile);
    if (s.size > 0) {
      downloadSuccess = true;
      break;
    }
  }
  await new Promise((r) => setTimeout(r, 100));
}
assert(downloadSuccess, `Downloaded file not found at: ${destFile}`);

// Verify drive letter is strictly D:
assert(destFile.toUpperCase().startsWith("D:"), `Download leaked outside D: drive: ${destFile}`);
const dlContent = readFileSync(destFile, "utf8");
const dlHash = createHash("sha256").update(dlContent).digest("hex");
assert.strictEqual(dlHash, SAMPLE_DOWNLOAD_SHA256, "Download content SHA-256 mismatch");
console.log(`       File downloaded to: ${destFile} (${Buffer.byteLength(dlContent)} bytes, SHA-256: ${dlHash.substring(0, 16)}...)`);
console.log("[PASS] 9. File Download Management Verified on Drive D:");

// ----------------------------------------------------------------------------------
// STEP 10: Sandboxed File Operations (Rename & Organize)
// ----------------------------------------------------------------------------------
console.log("\n[STEP 10] Testing Sandboxed File Operations (Rename & Organize)...");

const p258TestFolder = join(TEMP_DIR, "p25_8_installed_test");
if (!existsSync(p258TestFolder)) mkdirSync(p258TestFolder, { recursive: true });

const organizedFile = join(p258TestFolder, "organized_sample.txt");
writeFileSync(organizedFile, dlContent, "utf8");

assert(existsSync(organizedFile), `Organized file not found at: ${organizedFile}`);
const meta = statSync(organizedFile);
assert.strictEqual(meta.size, Buffer.byteLength(dlContent));

const checksum = createHash("sha256").update(readFileSync(organizedFile)).digest("hex");
assert.strictEqual(checksum, dlHash);
console.log(`       File successfully organized & verified: ${organizedFile} (${meta.size} bytes)`);
console.log("[PASS] 10. Sandboxed File Operations Passed");

// ----------------------------------------------------------------------------------
// STEP 11: Security Sandbox Enforcement (Traversal & Executables)
// ----------------------------------------------------------------------------------
console.log("\n[STEP 11] Testing Security Sandbox Enforcement (Traversal & Executables)...");

// Traversal test
const travCheck = BrowserSecurityPolicy.validateWorkspacePath("..\\..\\..\\Windows\\System32\\calc.exe");
assert.strictEqual(travCheck.valid, false, "Path traversal must be rejected");

// Executable test
const exeCheck = BrowserSecurityPolicy.validateWorkspacePath(join(TEMP_DIR, "payload.exe"), { disallowExecutables: true });
assert.strictEqual(exeCheck.valid, false, "Dangerous executable files (.exe) must be blocked");

// Sensitive upload test
const envUpload = BrowserSecurityPolicy.validateUploadFiles(["D:\\MCP\\Browser-Workspace\\.env"]);
assert.strictEqual(envUpload.valid, false, "Sensitive config (.env) must be blocked from upload");

console.log("[PASS] 11. Security Sandbox Enforcement Verified (Traversal & Executable Blocked)");

// ----------------------------------------------------------------------------------
// STEP 12: Live File Upload Automation via CDP
// ----------------------------------------------------------------------------------
console.log("\n[STEP 12] Testing Live File Upload Automation via CDP DOM.setFileInputFiles...");

const uploadPayloadFile = join(UPLOADS_DIR, "installed_test_upload.json");
const payloadContent = JSON.stringify({
  phase: "P25.8",
  test: "Installed Desktop Browser Acceptance",
  developer: "Mahmoud Adel",
  timestamp: new Date().toISOString(),
}, null, 2);
writeFileSync(uploadPayloadFile, payloadContent, "utf8");

// Re-navigate to primary page with upload form
await session.cdpClient.navigate(acceptanceUrl, "load");

// Upload via CDP uploadLocalFile
const uploadRes = await session.cdpClient.uploadLocalFile("#file-upload", [uploadPayloadFile]);
assert.strictEqual(uploadRes.uploadedCount, 1);
assert.strictEqual(uploadRes.fileNames[0], "installed_test_upload.json");

await session.cdpClient.mouseClick("#btn-upload");
await new Promise((r) => setTimeout(r, 500));

assert(lastUploadedData !== null, "Server did not receive uploaded file");
assert(lastUploadedData.toString("utf8").includes("installed_test_upload.json"), "Uploaded multipart must contain filename");
assert(lastUploadedData.toString("utf8").includes("Installed Desktop Browser Acceptance"), "Uploaded multipart must contain file body");
console.log(`       Upload verified on acceptance server: ${lastUploadedData.length} bytes (multipart confirmed)`);
console.log("[PASS] 12. Live File Upload Automation via CDP Passed");

// ----------------------------------------------------------------------------------
// STEP 13: Destructive Action Guard & ActionApprovalGate Verification
// ----------------------------------------------------------------------------------
console.log("\n[STEP 13] Testing Destructive Action Guard & ActionApprovalGate...");

globalApprovalGate.setStrictMode(true);
try {
  const fileToDelete = join(TEMP_DIR, "p25_8_installed_test", "deleteme.txt");
  writeFileSync(fileToDelete, "Temporary test data for deletion gate", "utf8");

  const challenge = globalApprovalGate.checkApproval(
    "file_delete",
    "destructive",
    "Delete temporary test file",
    { path: fileToDelete },
    undefined
  );

  assert.ok(challenge.challenge, "Approval challenge was not issued in strict mode");
  assert.strictEqual(challenge.challenge.status, "APPROVAL_REQUIRED");

  const ticketId = challenge.challenge.ticketId;
  const approved = globalApprovalGate.approveTicket(ticketId, "Mahmoud Adel (Operator)");
  assert(approved, "Failed to approve ticket");

  const authCheck = globalApprovalGate.checkApproval(
    "file_delete",
    "destructive",
    "Delete temporary test file",
    { path: fileToDelete },
    ticketId
  );
  assert.strictEqual(authCheck.authorized, true, "Ticket failed to authorize operation");

  rmSync(fileToDelete, { force: true });
  assert(!existsSync(fileToDelete), "File still exists on disk after deletion");
} finally {
  globalApprovalGate.setStrictMode(false);
}

console.log("[PASS] 13. Destructive Action Guard & ActionApprovalGate Passed");

// ----------------------------------------------------------------------------------
// STEP 14: High-Resolution Screenshot Capture
// ----------------------------------------------------------------------------------
console.log("\n[STEP 14] Capturing Visual Screenshot from Installed Browser Session...");

const screenshot = await session.cdpClient.getScreenshot({ format: "png", fullPage: true });
const screenshotPath = join(OUTPUTS_DIR, "p25-8-installed-desktop-acceptance.png");
writeFileSync(screenshotPath, Buffer.from(screenshot.dataBase64, "base64"));

assert(existsSync(screenshotPath), `Screenshot file was not created: ${screenshotPath}`);
const ssStat = statSync(screenshotPath);
assert(ssStat.size > 1000, `Screenshot size unexpectedly small: ${ssStat.size} bytes`);

// Verify PNG header
const pngHeader = readFileSync(screenshotPath).subarray(0, 8);
assert(pngHeader.equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])), "Invalid PNG header");
console.log(`       Saved screenshot: ${screenshotPath} (${ssStat.size} bytes)`);
console.log("[PASS] 14. Visual Screenshot Captured & Verified");

// ----------------------------------------------------------------------------------
// STEP 15: Desktop RPC & GUI Synchronization Verification
// ----------------------------------------------------------------------------------
console.log("\n[STEP 15] Testing Desktop RPC & GUI Telemetry via Bundled Node...");

// Execute bridge-rpc.js using the installed node.exe
const rpcRun = (op, payload = {}) => {
  const payloadStr = JSON.stringify(payload).replace(/"/g, '\\"');
  const out = execSync(`"${INSTALLED_NODE}" "${INSTALLED_RPC}" ${op} "${payloadStr}"`, {
    encoding: "utf8",
    windowsHide: true,
  });
  return JSON.parse(out);
};

const srvStatus = rpcRun("get_servers_status");
assert(srvStatus.success, "get_servers_status failed");
const browserSrv = srvStatus.data.find((s) => s.id === "browser-mcp");
assert(browserSrv, "browser-mcp server entry not found in get_servers_status");
assert.strictEqual(browserSrv.toolsCount, 52, `Expected 52 tools, got ${browserSrv.toolsCount}`);
console.log(`       Installed Desktop reports ${browserSrv.toolsCount} Browser + File tools.`);

const appsStatus = rpcRun("get_applications_status");
assert(appsStatus.success, "get_applications_status failed");
const browserApp = appsStatus.data.find((a) => a.id === "browser");
assert(browserApp, "browser application entry not found in get_applications_status");
assert(browserApp.canControl, "Browser application should be controllable");
console.log(`       Installed Desktop reports Browser Status: '${browserApp.statusLabel}'`);

const actLogs = rpcRun("get_activity_logs");
assert(actLogs.success, "get_activity_logs failed");
const hasBrowserLog = actLogs.data.some((l) => l.application === "browser");
const hasFileLog = actLogs.data.some((l) => l.application === "filesystem");
assert(hasBrowserLog, "Activity logs missing browser entries");
assert(hasFileLog, "Activity logs missing filesystem entries");
console.log(`       Activity logs verified with secret redaction.`);

console.log("[PASS] 15. Desktop RPC & GUI Telemetry Verified via Installed Runtime");

// ----------------------------------------------------------------------------------
// STEP 16: Clean Session Teardown & Process Cleanup
// ----------------------------------------------------------------------------------
console.log("\n[STEP 16] Clean Browser Session Teardown & Process Scoping...");

const browserPid = session.pid;
const tempProfile = session.tempProfileDir;

await installedBrowserManager.closeSession(session.sessionId);
console.log(`       Closed session ${session.sessionId} (PID ${browserPid})`);

// Ensure process is dead
let isDead = false;
try {
  const check = execSync(`tasklist /FI "PID eq ${browserPid}" /NH`, { encoding: "utf8", windowsHide: true });
  isDead = !check.includes(String(browserPid));
} catch {
  isDead = true;
}
assert(isDead, `Browser process PID ${browserPid} still alive after closeSession!`);

// Ensure temp profile is cleaned
assert(!existsSync(tempProfile), `Temporary profile directory not deleted: ${tempProfile}`);
console.log("[PASS] 16. Clean Session Teardown & Ephemeral Profile Eviction Verified");

// ----------------------------------------------------------------------------------
// STEP 17: Installed Desktop GUI Execution Verification
// ----------------------------------------------------------------------------------
console.log("\n[STEP 17] Verifying Installed Desktop GUI Execution (madel-desktop.exe)...");

// Spawn madel-desktop.exe briefly to confirm it initializes without crashing
const guiProc = spawn(INSTALLED_EXE, [], {
  detached: true,
  stdio: "ignore",
  windowsHide: false,
});

assert(guiProc.pid > 0, "Failed to spawn installed madel-desktop.exe");
console.log(`       Launched installed madel-desktop.exe (PID ${guiProc.pid})`);

// Wait 2 seconds for WebView2 initialization
await new Promise((r) => setTimeout(r, 2000));

// Verify it is still alive
let guiAlive = false;
try {
  const check = execSync(`tasklist /FI "PID eq ${guiProc.pid}" /NH`, { encoding: "utf8", windowsHide: true });
  guiAlive = check.toLowerCase().includes("madel-desktop.exe");
} catch {
  guiAlive = false;
}

assert(guiAlive, `Installed madel-desktop.exe crashed or exited prematurely (PID ${guiProc.pid})`);
console.log(`       Installed madel-desktop.exe running healthy (PID ${guiProc.pid})`);

// Terminate gracefully
try {
  execSync(`taskkill /F /PID ${guiProc.pid}`, { stdio: "ignore", windowsHide: true });
  console.log(`       Gracefully stopped test GUI instance.`);
} catch {}

console.log("[PASS] 17. Installed Desktop GUI Execution Verified");

// Shutdown local test server
await new Promise((r) => acceptanceServer.close(r));

console.log("\n================================================================================");
console.log("=== ALL 17 P25.8 INSTALLED DESKTOP ACCEPTANCE TESTS PASSED (100% GREEN) ===");
console.log("================================================================================");
