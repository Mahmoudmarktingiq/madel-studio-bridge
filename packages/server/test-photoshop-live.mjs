import { spawn, execSync } from "node:child_process";
import { readFileSync, existsSync } from "node:fs";
import { homedir } from "node:os";
import { join } from "node:path";

console.log("=== ADOBE PHOTOSHOP 2026 LIVE MCP INTEGRATION TEST ===");

const home = homedir();
const handshakeFile = join(home, ".brainferno-mcp-bridge", "bridge.json");
const panelLogFile = join(home, ".brainferno-mcp-bridge", "panel-photoshop.log");
const testWorkspace = "D:\\MCP\\Adobe-Bridge-Audit\\photoshop-test-workspace";
const testPsdPath = join(testWorkspace, "audit-test.psd").replace(/\\/g, "/");

// Start MCP Server locally via stdio
console.log("[1/5] Starting local MCP Bridge Server...");
const proc = spawn("node", ["dist/index.js"], {
    cwd: process.cwd(),
    env: {
        ...process.env,
        BRAINFERNO_MCP_BRIDGE_PORT: "7897",
        BRAINFERNO_MCP_LOG_LEVEL: "info",
        BRAINFERNO_MCP_ALLOW_RAW_SCRIPTS: "0",
        BRAINFERNO_MCP_BRIDGE_INSECURE: "0",
        BRAINFERNO_MCP_HTTP_PORT: "0",
        BRAINFERNO_MCP_APPS: "photoshop"
    },
    stdio: ["pipe", "pipe", "pipe"]
});

let outputBuffer = "";
let rpcId = 1;
const pendingRequests = new Map();

function sendRpc(method, params = {}) {
    const id = rpcId++;
    const msg = { jsonrpc: "2.0", id, method, params };
    proc.stdin.write(JSON.stringify(msg) + "\n");
    return new Promise((resolve, reject) => {
        pendingRequests.set(id, { resolve, reject });
    });
}

proc.stdout.on("data", (data) => {
    outputBuffer += data.toString();
    const lines = outputBuffer.split("\n");
    outputBuffer = lines.pop();

    for (const line of lines) {
        if (!line.trim()) continue;
        try {
            const res = JSON.parse(line.trim());
            if (res.id && pendingRequests.has(res.id)) {
                const { resolve, reject } = pendingRequests.get(res.id);
                pendingRequests.delete(res.id);
                if (res.error) reject(new Error(res.error.message || JSON.stringify(res.error)));
                else resolve(res.result);
            }
        } catch {
            // non-json line
        }
    }
});

proc.stderr.on("data", (data) => {
    const txt = data.toString().trim();
    if (txt) console.log(`[SERVER LOG] ${txt}`);
});

async function sleep(ms) {
    return new Promise((r) => setTimeout(r, ms));
}

async function main() {
    // 1. Initialize MCP
    const initRes = await sendRpc("initialize", {
        protocolVersion: "2024-11-05",
        capabilities: {},
        clientInfo: { name: "photoshop-acceptance-tester", version: "1.0.0" }
    });
    console.log(`[PASS] Server initialized: ${initRes.serverInfo.name} v${initRes.serverInfo.version}`);

    // Send initialized notification
    proc.stdin.write(JSON.stringify({ jsonrpc: "2.0", method: "notifications/initialized" }) + "\n");

    // Verify Handshake file
    await sleep(1000);
    if (!existsSync(handshakeFile)) {
        throw new Error("Handshake file was not created on disk!");
    }
    const hs = JSON.parse(readFileSync(handshakeFile, "utf8"));
    console.log(`[PASS] Bridge WebSocket listening on 127.0.0.1:${hs.port} with secure token.`);

    // 2. Check Photoshop Process
    console.log("[2/5] Checking Photoshop 2026 process...");
    let psRunning = false;
    try {
        const pList = execSync('powershell -Command "Get-Process -Name *Photoshop* -ErrorAction SilentlyContinue | Select-Object -ExpandProperty Id"').toString().trim();
        if (pList) {
            console.log(`[INFO] Photoshop is already running (PID: ${pList.split(/\s+/)[0]})`);
            psRunning = true;
        }
    } catch {}

    if (!psRunning) {
        console.log("[INFO] Launching Adobe Photoshop 2026...");
        execSync('powershell -Command "Start-Process \'C:\\Program Files\\Adobe\\Adobe Photoshop 2026\\Photoshop.exe\'"');
    }

    // 3. Wait for Photoshop Panel connection
    console.log("[3/5] Waiting for Photoshop UXP Panel connection (up to 60s)...");
    let connected = false;
    const startWait = Date.now();
    while (Date.now() - startWait < 60000) {
        const appsRes = await sendRpc("tools/call", { name: "cc_connected_apps", arguments: {} });
        const apps = JSON.parse(appsRes.content[0].text);
        const psApp = apps.find(a => a.appId === "photoshop");
        if (psApp && psApp.connected) {
            connected = true;
            console.log("\n>>> [SUCCESS] Photoshop 2026 CONNECTED to MCP Bridge! <<<");
            break;
        }
        process.stdout.write(".");
        await sleep(2500);
    }

    if (!connected) {
        console.log("\n[STATUS] Photoshop panel did not connect within 60s.");
        if (existsSync(panelLogFile)) {
            console.log(`[PANEL LOG]:\n${readFileSync(panelLogFile, "utf8")}`);
        } else {
            console.log("[PANEL LOG] No panel log created yet in ~/.brainferno-mcp-bridge/panel-photoshop.log");
        }
        return { connected: false };
    }

    // 4. Test Document Operations inside testWorkspace
    console.log("\n[4/5] Executing document test operations inside test workspace...");

    // 4.1 Create document
    console.log("  -> Creating new document: 800x600 RGB...");
    const createRes = await sendRpc("tools/call", {
        name: "ps_create_document",
        arguments: { name: "AuditAcceptanceTest", width: 800, height: 600, mode: "RGBColor", resolution: 72 }
    });
    console.log(`  [PASS] Document created: ${createRes.content[0].text}`);

    // 4.2 Create pixel layer and fill with shape/color
    console.log("  -> Creating layer: ShapeLayer & filling with #2980b9...");
    const layerRes = await sendRpc("tools/call", {
        name: "ps_create_layer",
        arguments: { name: "ColoredShapeLayer", kind: "pixel" }
    });
    console.log(`  [PASS] Layer created: ${layerRes.content[0].text}`);

    const fillRes = await sendRpc("tools/call", {
        name: "ps_fill",
        arguments: { color: "#2980b9", left: 100, top: 100, right: 400, bottom: 400 }
    });
    console.log(`  [PASS] Layer filled: ${fillRes.content[0].text}`);

    // 4.3 Create text layer
    console.log("  -> Creating text layer: 'Antigravity Photoshop Audit'...");
    const textRes = await sendRpc("tools/call", {
        name: "ps_create_text_layer",
        arguments: {
            text: "Antigravity Photoshop Audit",
            x: 100,
            y: 500,
            fontSize: 32,
            color: "#ffffff"
        }
    });
    console.log(`  [PASS] Text layer created: ${textRes.content[0].text}`);

    // 4.4 Read document info without mutation
    console.log("  -> Listing document layers (read-only)...");
    const listRes = await sendRpc("tools/call", {
        name: "ps_list_layers",
        arguments: {}
    });
    const layers = JSON.parse(listRes.content[0].text);
    console.log(`  [PASS] Detected ${layers.length} layers in document:`);
    for (const l of layers) console.log(`         - [${l.id}] ${l.name} (${l.kind || 'layer'})`);

    // 4.5 Save PSD to test workspace
    console.log(`  -> Saving PSD to ${testPsdPath}...`);
    const saveRes = await sendRpc("tools/call", {
        name: "ps_save_document",
        arguments: { path: testPsdPath }
    });
    console.log(`  [PASS] Save result: ${saveRes.content[0].text}`);

    if (existsSync(testPsdPath)) {
        console.log(`  [PASS] Verified PSD file on disk at ${testPsdPath} (Size: ${readFileSync(testPsdPath).length} bytes)`);
    } else {
        console.log(`  [FAIL] PSD file not found on disk at ${testPsdPath}`);
    }

    return { connected: true, testPsdPath };
}

main()
    .then((result) => {
        console.log("\n[5/5] Test routine complete.");
        proc.kill("SIGTERM");
        process.exit(result && result.connected ? 0 : 1);
    })
    .catch((err) => {
        console.error(`\n[FATAL] ${err.message}`);
        proc.kill("SIGTERM");
        process.exit(1);
    });
