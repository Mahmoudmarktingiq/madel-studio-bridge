import assert from "node:assert";
import { APPS, APP_IDS, PROTOCOL_VERSION, parsePanelFrame, helloFrameSchema, resultFrameSchema, progressFrameSchema, pongFrameSchema, pingFrameSchema, byeFrameSchema } from "@brainferno/mcp-bridge-protocol";
import { createMcpServer } from "./dist/server.js";
import { ListToolsRequestSchema, CallToolRequestSchema } from "@modelcontextprotocol/sdk/types.js";
import { z } from "zod";

console.log("=== COMPREHENSIVE COMPATIBILITY & REGRESSION TEST SUITE ===");
console.log(`Node version: ${process.version}`);
console.log(`Zod version: ${z.version || "4.x"}`);

let passed = 0;
let failed = 0;

function runTest(name, fn) {
    try {
        fn();
        console.log(`[PASS] ${name}`);
        passed++;
    } catch (err) {
        console.error(`[FAIL] ${name}`);
        console.error(`       Error: ${err.message}`);
        console.error(err.stack);
        failed++;
    }
}

async function runAsyncTest(name, fn) {
    try {
        await fn();
        console.log(`[PASS] ${name}`);
        passed++;
    } catch (err) {
        console.error(`[FAIL] ${name}`);
        console.error(`       Error: ${err.message}`);
        console.error(err.stack);
        failed++;
    }
}

// 1. Module Loading Tests
runTest("1.1 Load @brainferno/mcp-bridge-protocol modules", () => {
    assert.strictEqual(PROTOCOL_VERSION, 2);
    assert.ok(Array.isArray(APP_IDS));
    assert.strictEqual(APP_IDS.length, 5);
    assert.ok(APPS.photoshop);
    assert.ok(APPS.after_effects);
    assert.ok(APPS.premiere);
    assert.ok(APPS.illustrator);
    assert.ok(APPS.audition);
});

runTest("1.2 Load server modules & createMcpServer export", () => {
    assert.strictEqual(typeof createMcpServer, "function");
});

// 2. Data Validation Tests (Wire Protocol)
runTest("2.1 Parse valid helloFrame", () => {
    const raw = JSON.stringify({
        type: "hello",
        protocolVersion: 2,
        appId: "photoshop",
        hostVersion: "25.0.0",
        panelVersion: "0.3.4",
        token: "secret-token",
        capabilities: ["ps_batch_play", "ps_echo"]
    });
    const parsed = parsePanelFrame(raw);
    assert.strictEqual(parsed.type, "hello");
    assert.strictEqual(parsed.appId, "photoshop");
});

runTest("2.2 Parse valid resultFrame with appState", () => {
    const raw = JSON.stringify({
        type: "result",
        id: "req-123",
        ok: true,
        value: { layers: 5 },
        appState: {
            activeDocument: "test.psd",
            dirty: false
        }
    });
    const parsed = parsePanelFrame(raw);
    assert.strictEqual(parsed.type, "result");
    assert.strictEqual(parsed.ok, true);
    assert.strictEqual(parsed.id, "req-123");
});

runTest("2.3 Parse progress, ping, pong, bye frames", () => {
    const progress = parsePanelFrame(JSON.stringify({ type: "progress", id: "p1", progress: 50, total: 100, message: "rendering" }));
    assert.strictEqual(progress.type, "progress");

    const ping = parsePanelFrame(JSON.stringify({ type: "ping", ts: Date.now() }));
    assert.strictEqual(ping.type, "ping");

    const pong = parsePanelFrame(JSON.stringify({ type: "pong", ts: Date.now() }));
    assert.strictEqual(pong.type, "pong");

    const bye = parsePanelFrame(JSON.stringify({ type: "bye", reason: "shutdown" }));
    assert.strictEqual(bye.type, "bye");
});

runTest("2.4 Reject malformed JSON frame", () => {
    assert.throws(() => {
        parsePanelFrame("not a json string");
    }, /frame was not valid JSON/);
});

runTest("2.5 Reject invalid frame schema (wrong appId, missing type)", () => {
    assert.throws(() => {
        parsePanelFrame(JSON.stringify({
            type: "hello",
            protocolVersion: 2,
            appId: "invalid_app"
        }));
    }, /invalid panel frame/);
});

runTest("2.6 Wire protocol strict validation on extra or invalid fields", () => {
    // result frame with non-boolean ok
    assert.throws(() => {
        parsePanelFrame(JSON.stringify({
            type: "result",
            id: "req-123",
            ok: "yes" // should be boolean
        }));
    }, /invalid panel frame/);

    // progress frame with negative or invalid progress
    assert.throws(() => {
        parsePanelFrame(JSON.stringify({
            type: "progress",
            id: "p1",
            progress: "fifty"
        }));
    }, /invalid panel frame/);
});

// Setup mock runtime
function createTestRuntime() {
    const dummyConfig = {
        logLevel: "error",
        preview: false,
        rawScriptApps: ["after_effects", "photoshop"],
        allowRemoteRawScripts: false,
        bridgePort: 0,
        bridgeToken: "dummy-token-123",
        bridgeInsecure: true,
        evalTimeoutMs: 5000,
        heartbeatIntervalMs: 0,
        handshakeFilePath: "dummy-handshake.json",
        allowedOrigins: ["*"],
        ameWebServicePath: "",
        amePort: 8080,
        ameIdleMs: 60000,
        ffmpegPath: "ffmpeg",
        ffprobePath: "ffprobe",
        illustratorApp: "",
        illustratorMcpUrl: "http://localhost:8001",
        illustratorMcpKey: "",
        enabledApps: ["after_effects", "premiere", "photoshop", "illustrator", "audition"],
        defaultWait: false,
        httpToken: "http-token"
    };

    const mockBridge = {
        connectedApps: () => ["photoshop", "after_effects"],
        redactionSecrets: () => [],
        bridgeFor: (appId) => ({
            appId,
            isConnected: () => true,
            execute: async (name, params) => ({ ok: true, value: { executed: name, params } }),
            evaluate: async (script) => ({ ok: true, value: { script } }),
            close: async () => {},
            connectionEpoch: () => 1,
        }),
        panelInfo: () => ({ panelVersion: "0.3.4", hostVersion: "25.0.0" }),
    };

    const mockIllustratorBridge = {
        appId: "illustrator",
        evalWithQueue: async (script) => ({ ok: true, value: script }),
        queueState: () => ({ pending: 0, running: false }),
        execute: async (name, params) => ({ ok: true, value: { name, params } }),
    };

    const mockJobs = {
        list: () => [],
        get: () => null,
    };

    return {
        config: dummyConfig,
        bridge: mockBridge,
        illustratorBridge: mockIllustratorBridge,
        illustratorDelegate: null,
        jobs: mockJobs,
        mediaEncoder: null,
        audio: { ffmpegPath: "ffmpeg", ffprobePath: "ffprobe" }
    };
}

// 3. MCP Protocol & Server Initialization Tests
let testServer;
let testRt;
await runAsyncTest("3.1 Initialize McpServer & register tools in-memory", async () => {
    testRt = createTestRuntime();
    testServer = createMcpServer(testRt);
    assert.ok(testServer, "McpServer should be instantiated");

    const registered = testServer._registeredTools;
    assert.ok(registered, "Registered tools should exist");
    const toolNames = Object.keys(registered);
    console.log(`       Registered ${toolNames.length} MCP tools across all 5 Adobe apps.`);
    assert.strictEqual(toolNames.length, 176, "Expected exactly 176 tools (145 base + 31 P21 Illustrator tools)");
});

// 4. JSON Schema Generation for ALL 176 tools
await runAsyncTest("4.1 MCP JSON Schema Generation across all 176 tools", async () => {
    // In McpServer, tools list handler converts all schemas to JSON Schema
    const listHandler = testServer.server._requestHandlers.get("tools/list");
    assert.ok(listHandler, "tools/list handler must be registered");

    const response = await listHandler({ method: "tools/list", params: {} }, {});
    assert.ok(response && Array.isArray(response.tools), "tools list response must have tools array");
    assert.strictEqual(response.tools.length, 176, "All 176 tools must be listed");

    for (const tool of response.tools) {
        assert.ok(tool.name, "Tool must have name");
        assert.ok(tool.inputSchema, `Tool ${tool.name} must have inputSchema`);
        assert.strictEqual(tool.inputSchema.type, "object", `Tool ${tool.name} inputSchema must have type object`);
        assert.ok(tool.inputSchema.properties !== undefined, `Tool ${tool.name} must have properties object`);
    }
    console.log("       Successfully generated valid JSON Schemas for all 176 tools.");
});

// 5. Tool Input Validation & Execution Tests
await runAsyncTest("5.1 Tool Call Validation & Execution (valid arguments)", async () => {
    const callHandler = testServer.server._requestHandlers.get("tools/call");
    assert.ok(callHandler, "tools/call handler must be registered");

    // Call cc_connected_apps (takes empty args)
    const res1 = await callHandler({
        method: "tools/call",
        params: {
            name: "cc_connected_apps",
            arguments: {}
        }
    }, {});
    assert.ok(!res1.isError, "cc_connected_apps should succeed");
    const content = JSON.parse(res1.content[0].text);
    assert.ok(Array.isArray(content), "cc_connected_apps returns array of apps");
    assert.strictEqual(content.length, 5);

    // Call ae_create_comp with valid args
    const res2 = await callHandler({
        method: "tools/call",
        params: {
            name: "ae_create_comp",
            arguments: {
                name: "Main Comp",
                width: 1920,
                height: 1080,
                duration: 10
            }
        }
    }, {});
    assert.ok(!res2.isError, `ae_create_comp should succeed: ${JSON.stringify(res2)}`);

    // Call ps_batch_play with z.record(z.unknown())
    const res3 = await callHandler({
        method: "tools/call",
        params: {
            name: "ps_batch_play",
            arguments: {
                descriptors: [
                    { _obj: "select", _target: [{ _ref: "layer", _name: "Layer 1" }] }
                ]
            }
        }
    }, {});
    assert.ok(!res3.isError, `ps_batch_play should succeed: ${JSON.stringify(res3)}`);

    // Call pp_set_effect_param with z.tuple([z.number(), z.number()])
    const res4 = await callHandler({
        method: "tools/call",
        params: {
            name: "pp_set_effect_param",
            arguments: {
                sequenceId: "seq1",
                trackType: "video",
                trackIndex: 0,
                clipIndex: 0,
                component: "Motion",
                param: "Position",
                value: [960, 540] // tuple test
            }
        }
    }, {});
    assert.ok(!res4.isError, `pp_set_effect_param with tuple should succeed: ${JSON.stringify(res4)}`);

    // Call ae_run_script with z.record(z.unknown())
    const res5 = await callHandler({
        method: "tools/call",
        params: {
            name: "ae_run_script",
            arguments: {
                script: "app.project.items.length",
                args: { count: 10, mode: "fast", options: { nested: true } }
            }
        }
    }, {});
    assert.ok(!res5.isError, `ae_run_script with record should succeed: ${JSON.stringify(res5)}`);
});

// 6. Tool Input Validation Rejecting Invalid Data
await runAsyncTest("6.1 Tool Call Validation Rejections (invalid arguments)", async () => {
    const callHandler = testServer.server._requestHandlers.get("tools/call");

    // Call ae_create_comp with invalid types (e.g. negative width, wrong type)
    const res1 = await callHandler({
        method: "tools/call",
        params: {
            name: "ae_create_comp",
            arguments: {
                name: 12345, // invalid: name must be string
                width: -100
            }
        }
    }, {});
    assert.ok(res1.isError, "ae_create_comp should fail validation for invalid name");
    assert.ok(res1.content[0].text.includes("validation error") || res1.content[0].text.includes("Invalid arguments"),
        `Error text should mention validation error: ${res1.content[0].text}`);

    // Call ps_batch_play with invalid descriptors (empty array when min(1) required)
    const res2 = await callHandler({
        method: "tools/call",
        params: {
            name: "ps_batch_play",
            arguments: {
                descriptors: [] // min(1) required
            }
        }
    }, {});
    assert.ok(res2.isError, "ps_batch_play should fail validation for empty descriptors");

    // Call non-existent tool
    const res3 = await callHandler({
        method: "tools/call",
        params: {
            name: "non_existent_adobe_tool",
            arguments: {}
        }
    }, {});
    assert.ok(res3.isError, "Calling non-existent tool must return error");
});

// 7. Test Memory Exhaustion Constraint (GHSA-mrhx-c7xc-m3w5) Protection
runTest("7.1 Verify GHSA-mrhx-c7xc-m3w5 oversized collection handling in Zod 4", () => {
    const constrainedSchema = z.array(z.string()).max(5);

    // Creating an oversized array
    const oversized = new Array(100).fill("test");
    const result = constrainedSchema.safeParse(oversized);
    assert.strictEqual(result.success, false, "Oversized array must be rejected");
    assert.ok(result.error.issues.length > 0, "Issues should be reported");
    assert.strictEqual(result.error.issues[0].code, "too_big", "Should reject with too_big code");
});

console.log(`\nResults: ${passed} passed, ${failed} failed.`);
if (failed > 0) {
    process.exit(1);
}
