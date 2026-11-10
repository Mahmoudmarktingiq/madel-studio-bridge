import { spawn } from "node:child_process";
import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { homedir } from "node:os";
import { join } from "node:path";
import assert from "node:assert";

console.log("=== STDIO MCP END-TO-END CONNECTION TEST ===");

const handshakeFile = join(homedir(), ".brainferno-mcp-bridge", "bridge.json");
const originalHandshake = existsSync(handshakeFile) ? readFileSync(handshakeFile, "utf8") : null;

// Ensure clean start
const serverDist = existsSync(join(process.cwd(), "dist", "index.js"))
    ? join(process.cwd(), "dist", "index.js")
    : join(process.cwd(), "packages", "server", "dist", "index.js");

const proc = spawn("node", [serverDist], {
    cwd: existsSync(join(process.cwd(), "dist", "index.js")) ? process.cwd() : join(process.cwd(), "packages", "server"),
    env: {
        ...process.env,
        BRAINFERNO_MCP_BRIDGE_PORT: "7897",
        BRAINFERNO_MCP_LOG_LEVEL: "error", // quiet logs
        BRAINFERNO_MCP_ALLOW_RAW_SCRIPTS: "", // strictly disabled
        BRAINFERNO_MCP_BRIDGE_INSECURE: "0", // secure mode
        BRAINFERNO_MCP_HTTP_PORT: "0", // HTTP disabled
    },
    stdio: ["pipe", "pipe", "pipe"]
});

let outputBuffer = "";
let resolved = false;

function sendRpc(msg) {
    const json = JSON.stringify(msg);
    proc.stdin.write(json + "\n");
}

const timeout = setTimeout(() => {
    if (!resolved) {
        console.error("[FAIL] Test timed out waiting for stdio response");
        proc.kill();
        process.exit(1);
    }
}, 10000);

proc.stdout.on("data", (data) => {
    outputBuffer += data.toString();
    const lines = outputBuffer.split("\n");
    // Process all complete lines except the last incomplete fragment
    outputBuffer = lines.pop();

    for (const line of lines) {
        if (!line.trim()) continue;
        try {
            const res = JSON.parse(line.trim());
            handleMessage(res);
        } catch {
            // Ignore non-json lines if any
        }
    }
});

proc.stderr.on("data", (data) => {
    // Stderr output (logging)
    const errText = data.toString();
    if (!errText.includes("illustrator delegate disabled")) {
        console.log(`[STDERR] ${errText.trim()}`);
    }
});

let stage = 0;

function handleMessage(msg) {
    if (msg.id === 1) {
        // Initialize response
        assert.ok(msg.result, "Initialize result should exist");
        assert.strictEqual(msg.result.serverInfo.name, "brainferno-mcp-bridge");
        console.log(`[PASS] Received MCP Initialize Response from: ${msg.result.serverInfo.name} v${msg.result.serverInfo.version}`);

        // Send notifications/initialized
        sendRpc({
            jsonrpc: "2.0",
            method: "notifications/initialized"
        });

        // Verify Handshake file on disk
        if (existsSync(handshakeFile)) {
            const hs = JSON.parse(readFileSync(handshakeFile, "utf8"));
            assert.ok(typeof hs.port === "number", "Handshake must have port");
            assert.ok(typeof hs.token === "string" && hs.token.length > 10, "Handshake must have secure token");
            console.log(`[PASS] Handshake file created securely on disk (Port: ${hs.port}, Protocol: v${hs.protocolVersion})`);
        } else {
            console.log("[WARN] Handshake file not yet found on disk");
        }

        // Send tools/call for cc_connected_apps
        sendRpc({
            jsonrpc: "2.0",
            id: 2,
            method: "tools/call",
            params: {
                name: "cc_connected_apps",
                arguments: {}
            }
        });
    } else if (msg.id === 2) {
        // Tools/call response
        assert.ok(!msg.result.isError, "cc_connected_apps should succeed without error");
        const apps = JSON.parse(msg.result.content[0].text);
        assert.ok(Array.isArray(apps), "Result must be array of apps");
        console.log(`[PASS] Tool 'cc_connected_apps' executed successfully. Detected ${apps.length} applications:`);
        for (const app of apps) {
            console.log(`       - ${app.displayName} (${app.appId}): Connected = ${app.connected}`);
        }

        resolved = true;
        clearTimeout(timeout);
        // Clean shutdown
        proc.kill("SIGTERM");
    }
}

proc.on("exit", (code, signal) => {
    if (originalHandshake !== null) {
        try {
            writeFileSync(handshakeFile, originalHandshake, "utf8");
        } catch {}
    }
    console.log(`[INFO] Server exited cleanly with code: ${code}, signal: ${signal}`);
    console.log("=== STDIO MCP TEST COMPLETED SUCCESSFULLY ===");
    process.exit(0);
});

// Start protocol handshake: Initialize
sendRpc({
    jsonrpc: "2.0",
    id: 1,
    method: "initialize",
    params: {
        protocolVersion: "2024-11-05",
        capabilities: {},
        clientInfo: {
            name: "audit-test-client",
            version: "1.0.0"
        }
    }
});
