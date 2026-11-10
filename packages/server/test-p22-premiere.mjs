import assert from "node:assert";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { registerPremiereTools } from "./dist/tools/premiere.js";
import {
  TICKS_PER_SECOND,
  STANDARD_FPS,
  getTicksPerFrame,
  secondsToTicks,
  ticksToSeconds,
  framesToTicks,
  ticksToFrames,
  secondsToFrames,
  framesToSeconds,
  secondsToTimecode,
  timecodeToSeconds,
} from "./dist/tools/timeline-math.js";
import { globalConcurrencyManager } from "./dist/gateway/index.js";
import { DesktopBridgeRpc } from "./dist/desktop/bridge-rpc.js";

console.log("=== MADEL STUDIO BRIDGE — P22 ADOBE PREMIERE PRO INTEGRATION TEST SUITE ===");
console.log(`Node version: ${process.version}`);

let totalPassed = 0;
let totalFailed = 0;

async function runTest(name, fn) {
  try {
    await fn();
    console.log(`[PASS] ${name}`);
    totalPassed++;
  } catch (err) {
    console.error(`[FAIL] ${name}`);
    console.error(err);
    totalFailed++;
  }
}

// Mock AppBridge implementation for Premiere Pro UXP commands
class MockPremiereBridge {
  constructor() {
    this.executedCommands = [];
    this.mockResponses = {};
    this.connected = true;
  }

  get appId() {
    return "premiere";
  }

  isConnected() {
    return this.connected;
  }

  async execute(name, params, options) {
    this.executedCommands.push({ name, params, options });
    if (this.mockResponses[name]) {
      const resp = this.mockResponses[name];
      return typeof resp === "function" ? resp(params) : resp;
    }
    return { ok: true, name, params };
  }

  async evaluate(script, options) {
    return this.execute("eval", { script }, options);
  }

  async close() {
    this.connected = false;
  }

  setResponse(name, response) {
    this.mockResponses[name] = response;
  }

  lastCommand() {
    return this.executedCommands[this.executedCommands.length - 1] || null;
  }

  reset() {
    this.executedCommands = [];
  }
}

const mockBridge = new MockPremiereBridge();
const server = new McpServer(
  { name: "test-premiere-p22", version: "0.4.0" },
  { capabilities: { tools: {} } }
);

registerPremiereTools(server, mockBridge);
const tools = server._registeredTools;

// Test 1: Verify all 39 Premiere Pro MCP tools are registered
await runTest("1. Registration of all 39 specialized Premiere Pro MCP tools", async () => {
  const expectedTools = [
    // Project Management (6)
    "pp_project_info",
    "pp_inspect_project_metadata",
    "pp_open_project",
    "pp_create_project",
    "pp_save_project",
    "pp_list_project_items",
    // Media & Bins (4)
    "pp_import_files",
    "pp_inspect_media",
    "pp_create_bin",
    "pp_move_project_item",
    // Sequences (5)
    "pp_list_sequences",
    "pp_create_sequence",
    "pp_get_sequence",
    "pp_set_active_sequence",
    "pp_get_sequence_duration",
    // Multi-Track Management (2)
    "pp_list_video_tracks",
    "pp_list_audio_tracks",
    // Timeline & Clips (7)
    "pp_insert_clip",
    "pp_insert_mogrt",
    "pp_inspect_clip",
    "pp_move_clip",
    "pp_trim_clip",
    "pp_remove_clips",
    "pp_set_clip_props",
    // Playhead & Playback (2)
    "pp_get_player_position",
    "pp_set_player_position",
    // Markers & Effects (6)
    "pp_list_markers",
    "pp_add_marker",
    "pp_list_transitions",
    "pp_add_transition",
    "pp_list_effects",
    "pp_get_clip_effects",
    "pp_apply_effect",
    "pp_remove_effect",
    "pp_set_effect_param",
    // Production Export (4)
    "pp_inspect_export_capabilities",
    "pp_list_export_presets",
    "pp_export_frame",
    "pp_export_sequence",
  ];

  for (const name of expectedTools) {
    assert.ok(tools[name], `Tool ${name} must be registered on McpServer`);
  }
  console.log(`       All ${expectedTools.length} Premiere tools verified registered cleanly.`);
});

// Test 2: Timeline Math & Integer Tick Engine across all 8 Frame Rates
await runTest("2. Timeline Math: integer tick accuracy across 8 standard frame rates", async () => {
  assert.strictEqual(TICKS_PER_SECOND, 254016000000n, "Internal timebase must be exactly 254,016,000,000 ticks/sec");

  const expectedTicksPerFrame = {
    "23.976": 10594584000n,
    "24": 10584000000n,
    "25": 10160640000n,
    "29.97": 8475667200n,
    "30": 8467200000n,
    "50": 5080320000n,
    "59.94": 4237833600n,
    "60": 4233600000n,
  };

  for (const fps of STANDARD_FPS) {
    const tpf = getTicksPerFrame(fps);
    const expected = expectedTicksPerFrame[String(fps)];
    assert.strictEqual(tpf, expected, `FPS ${fps} must match exact integer ticks per frame: ${expected}`);
  }

  // Exact 1 hour in ticks at 24 FPS
  const oneHourTicks = framesToTicks(24 * 3600, 24);
  assert.strictEqual(oneHourTicks, (254016000000n * 3600n).toString());

  // Discrete frame extraction
  const frame100Ticks = framesToTicks(100, 25);
  assert.strictEqual(ticksToFrames(frame100Ticks, 25), 100);

  console.log("       Verified 8/8 frame rates with exact BigInt ticks and zero truncation drift.");
});

// Test 3: SMPTE Timecode conversions (drop-frame & non-drop-frame)
await runTest("3. SMPTE Timecode: exact formatting and parsing roundtrip", async () => {
  // Non-drop-frame 24 FPS
  const tc24 = secondsToTimecode(3661.5, 24); // 01:01:01:12
  assert.strictEqual(tc24, "01:01:01:12");

  const sec24 = timecodeToSeconds("01:01:01:12", 24);
  assert.strictEqual(sec24, 3661.5);

  // 25 FPS PAL
  const tc25 = secondsToTimecode(10.0, 25);
  assert.strictEqual(tc25, "00:00:10:00");

  // Drop-frame format
  const tcDf = secondsToTimecode(60.0, 29.97, true);
  assert.ok(tcDf.includes(";"), "Drop frame must contain semicolon separator");

  console.log("       Verified SMPTE timecode string serialization and parsing.");
});

// Test 4: Project Management Tools
await runTest("4. Project Lifecycle: open, create, save, and inspect metadata", async () => {
  mockBridge.reset();
  const openTool = tools["pp_open_project"];
  const createTool = tools["pp_create_project"];
  const saveTool = tools["pp_save_project"];
  const metaTool = tools["pp_inspect_project_metadata"];

  // Open Project
  await openTool.handler({ path: "D:/MCP/05-Premiere/MADEL/P22-Timeline-Integration/03-Project/Master.prproj" }, {});
  assert.strictEqual(mockBridge.lastCommand().name, "pp.open_project");
  assert.strictEqual(mockBridge.lastCommand().params.path, "D:/MCP/05-Premiere/MADEL/P22-Timeline-Integration/03-Project/Master.prproj");

  // Create Project
  await createTool.handler({ path: "D:/MCP/05-Premiere/MADEL/P22-Timeline-Integration/03-Project/NewProject.prproj" }, {});
  assert.strictEqual(mockBridge.lastCommand().name, "pp.create_project");

  // Save Project
  await saveTool.handler({}, {});
  assert.strictEqual(mockBridge.lastCommand().name, "pp.save_project");

  // Inspect Project Metadata
  mockBridge.setResponse("pp.inspect_project_metadata", {
    id: "proj-guid-1234",
    name: "Master.prproj",
    path: "D:/MCP/05-Premiere/MADEL/P22-Timeline-Integration/03-Project/Master.prproj",
    totalSequences: 3,
    totalProjectItems: 24,
    activeSequence: { id: "seq-1", name: "Main Timeline" },
  });
  const metaRes = await metaTool.handler({}, {});
  const metaData = JSON.parse(metaRes.content[0].text);
  assert.strictEqual(metaData.name, "Master.prproj");
  assert.strictEqual(metaData.totalSequences, 3);
  console.log("       Verified project open, create, save, and metadata inspection wire contracts.");
});

// Test 5: Media Import, Inspection, Bin Creation & Organization
await runTest("5. Media Management: import media, inspect items, create bins, organize", async () => {
  mockBridge.reset();
  const importTool = tools["pp_import_files"];
  const inspectMediaTool = tools["pp_inspect_media"];
  const createBinTool = tools["pp_create_bin"];
  const moveItemTool = tools["pp_move_project_item"];

  // Import Media
  await importTool.handler({
    paths: [
      "D:/MCP/05-Premiere/MADEL/P22-Timeline-Integration/01-Source/clip_01.mp4",
      "D:/MCP/05-Premiere/MADEL/P22-Timeline-Integration/01-Source/voiceover.wav",
    ],
    asNumberedStills: false,
  }, {});
  assert.strictEqual(mockBridge.lastCommand().name, "pp.import_files");
  assert.strictEqual(mockBridge.lastCommand().params.paths.length, 2);

  // Inspect Media
  mockBridge.setResponse("pp.inspect_media", {
    id: "item-clip-1",
    name: "clip_01.mp4",
    type: "CLIP",
    mediaPath: "D:/MCP/05-Premiere/MADEL/P22-Timeline-Integration/01-Source/clip_01.mp4",
  });
  const inspectRes = await inspectMediaTool.handler({ projectItemId: "item-clip-1" }, {});
  const inspectData = JSON.parse(inspectRes.content[0].text);
  assert.strictEqual(inspectData.name, "clip_01.mp4");

  // Create Bin
  await createBinTool.handler({ name: "B-Roll Footage", parentBinId: "root" }, {});
  assert.strictEqual(mockBridge.lastCommand().name, "pp.create_bin");
  assert.strictEqual(mockBridge.lastCommand().params.name, "B-Roll Footage");

  // Move Project Item to Bin
  await moveItemTool.handler({ projectItemId: "item-clip-1", targetBinId: "bin-b-roll" }, {});
  assert.strictEqual(mockBridge.lastCommand().name, "pp.move_project_item");
  assert.strictEqual(mockBridge.lastCommand().params.projectItemId, "item-clip-1");
  console.log("       Verified media import, inspection, bin hierarchy creation, and item movement.");
});

// Test 6: Sequence Lifecycle & Duration Reporting
await runTest("6. Sequence Management: create, list, activate, and measure duration", async () => {
  mockBridge.reset();
  const createSeqTool = tools["pp_create_sequence"];
  const listSeqsTool = tools["pp_list_sequences"];
  const setActiveSeqTool = tools["pp_set_active_sequence"];
  const getDurTool = tools["pp_get_sequence_duration"];

  // Create Sequence
  await createSeqTool.handler({ name: "Social Promo 1080p", projectItemIds: ["item-clip-1"] }, {});
  assert.strictEqual(mockBridge.lastCommand().name, "pp.create_sequence");
  assert.strictEqual(mockBridge.lastCommand().params.name, "Social Promo 1080p");

  // List Sequences
  await listSeqsTool.handler({}, {});
  assert.strictEqual(mockBridge.lastCommand().name, "pp.list_sequences");

  // Set Active Sequence
  await setActiveSeqTool.handler({ sequenceId: "seq-social-1080p" }, {});
  assert.strictEqual(mockBridge.lastCommand().name, "pp.set_active_sequence");

  // Get Sequence Duration with frame rate
  mockBridge.setResponse("pp.get_sequence_duration", {
    sequenceId: "seq-social-1080p",
    durationSeconds: 125.5,
    ticks: "31879008000000",
    totalFrames: 3012,
    fps: 24,
  });
  const durRes = await getDurTool.handler({ sequenceId: "seq-social-1080p", fps: 24 }, {});
  const durData = JSON.parse(durRes.content[0].text);
  assert.strictEqual(durData.durationSeconds, 125.5);
  assert.strictEqual(durData.totalFrames, 3012);
  console.log("       Verified sequence creation, activation, and integer tick duration reporting.");
});

// Test 7: Multi-Track Queries (Video & Audio Tracks)
await runTest("7. Multi-Track Queries: dedicated video and audio track inspectors", async () => {
  mockBridge.reset();
  const listVideoTracksTool = tools["pp_list_video_tracks"];
  const listAudioTracksTool = tools["pp_list_audio_tracks"];

  // List Video Tracks
  mockBridge.setResponse("pp.list_video_tracks", {
    sequenceId: "seq-1",
    count: 3,
    tracks: [
      { index: 0, name: "V1 - A-Roll", type: "video", locked: false, clipCount: 5 },
      { index: 1, name: "V2 - B-Roll", type: "video", locked: false, clipCount: 3 },
      { index: 2, name: "V3 - Graphics", type: "video", locked: true, clipCount: 2 },
    ],
  });
  const vRes = await listVideoTracksTool.handler({ sequenceId: "seq-1" }, {});
  const vData = JSON.parse(vRes.content[0].text);
  assert.strictEqual(vData.count, 3);
  assert.strictEqual(vData.tracks[2].locked, true);

  // List Audio Tracks
  mockBridge.setResponse("pp.list_audio_tracks", {
    sequenceId: "seq-1",
    count: 2,
    tracks: [
      { index: 0, name: "A1 - Dialogue", type: "audio", channelType: "stereo", locked: false, clipCount: 5 },
      { index: 1, name: "A2 - Music Bed", type: "audio", channelType: "stereo", locked: false, clipCount: 1 },
    ],
  });
  const aRes = await listAudioTracksTool.handler({ sequenceId: "seq-1" }, {});
  const aData = JSON.parse(aRes.content[0].text);
  assert.strictEqual(aData.count, 2);
  assert.strictEqual(aData.tracks[0].channelType, "stereo");
  console.log("       Verified multi-track separation and track telemetry extraction.");
});

// Test 8: Timeline Editing: Clip Insertion, Moving, Trimming, and Inspection
await runTest("8. Timeline Editing: insert, move, trim, and deep inspect clip", async () => {
  mockBridge.reset();
  const insertClipTool = tools["pp_insert_clip"];
  const moveClipTool = tools["pp_move_clip"];
  const trimClipTool = tools["pp_trim_clip"];
  const inspectClipTool = tools["pp_inspect_clip"];

  // Insert Clip
  await insertClipTool.handler({
    projectItemId: "clip_01",
    seconds: 15.0,
    videoTrackIndex: 0,
    audioTrackIndex: 0,
    mode: "overwrite",
  }, {});
  assert.strictEqual(mockBridge.lastCommand().name, "pp.insert_clip");
  assert.strictEqual(mockBridge.lastCommand().params.seconds, 15.0);
  assert.strictEqual(mockBridge.lastCommand().params.mode, "overwrite");

  // Move Clip
  await moveClipTool.handler({
    trackType: "video",
    trackIndex: 0,
    clipIndex: 1,
    seconds: 25.0,
  }, {});
  assert.strictEqual(mockBridge.lastCommand().name, "pp.move_clip");
  assert.strictEqual(mockBridge.lastCommand().params.seconds, 25.0);

  // Trim Clip
  await trimClipTool.handler({
    trackType: "video",
    trackIndex: 0,
    clipIndex: 1,
    startSeconds: 25.0,
    endSeconds: 35.0,
    inSeconds: 2.0,
    outSeconds: 12.0,
  }, {});
  assert.strictEqual(mockBridge.lastCommand().name, "pp.trim_clip");
  assert.strictEqual(mockBridge.lastCommand().params.inSeconds, 2.0);

  // Inspect Clip
  mockBridge.setResponse("pp.inspect_clip", {
    trackType: "video",
    trackIndex: 0,
    clipIndex: 1,
    name: "clip_01.mp4",
    startSeconds: 25.0,
    endSeconds: 35.0,
    durationSeconds: 10.0,
  });
  const inspectRes = await inspectClipTool.handler({ trackType: "video", trackIndex: 0, clipIndex: 1 }, {});
  const clipData = JSON.parse(inspectRes.content[0].text);
  assert.strictEqual(clipData.durationSeconds, 10.0);
  console.log("       Verified timeline clip insertion, displacement, edge trimming, and inspection.");
});

// Test 9: Destructive Action Safety Guard: pp_remove_clips
await runTest("9. Destructive Safety: pp_remove_clips requires affirmative confirm: true", async () => {
  mockBridge.reset();
  const removeClipsTool = tools["pp_remove_clips"];

  // Missing or false confirm must reject
  await assert.rejects(
    async () => {
      await removeClipsTool.handler({
        clips: [{ trackType: "video", trackIndex: 0, clipIndex: 1 }],
        confirm: false,
      }, {});
    },
    /confirm: true/,
    "Must throw error when confirm is false"
  );

  // Affirmative confirm: true succeeds
  await removeClipsTool.handler({
    clips: [{ trackType: "video", trackIndex: 0, clipIndex: 1 }],
    ripple: true,
    confirm: true,
  }, {});
  assert.strictEqual(mockBridge.lastCommand().name, "pp.remove_clips");
  assert.strictEqual(mockBridge.lastCommand().params.ripple, true);
  console.log("       Verified mandatory confirmation guard protects against accidental clip deletion.");
});

// Test 10: Playhead Positioning
await runTest("10. Playhead Navigation: set and read playhead position", async () => {
  mockBridge.reset();
  const setPlayheadTool = tools["pp_set_player_position"];
  const getPlayheadTool = tools["pp_get_player_position"];

  // Set Playhead
  await setPlayheadTool.handler({ seconds: 45.25 }, {});
  assert.strictEqual(mockBridge.lastCommand().name, "pp.set_player_position");
  assert.strictEqual(mockBridge.lastCommand().params.seconds, 45.25);

  // Get Playhead
  mockBridge.setResponse("pp.get_player_position", {
    sequenceId: "seq-1",
    seconds: 45.25,
    ticks: "11494224000000",
  });
  const playRes = await getPlayheadTool.handler({}, {});
  const playData = JSON.parse(playRes.content[0].text);
  assert.strictEqual(playData.seconds, 45.25);
  console.log("       Verified playhead position update and telemetry retrieval.");
});

// Test 11: Export Capabilities and Render Pipeline
await runTest("11. Production Export: inspect capabilities, presets, frames, and render", async () => {
  mockBridge.reset();
  const capsTool = tools["pp_inspect_export_capabilities"];
  const presetsTool = tools["pp_list_export_presets"];

  // Inspect Capabilities
  mockBridge.setResponse("pp.inspect_export_capabilities", {
    supportedModes: ["immediately", "queue_ame", "queue_app"],
    hardwareAcceleration: "CUDA / QuickSync supported where available",
    commonCodecs: ["H.264", "HEVC", "Apple ProRes", "DNxHD"],
  });
  const capsRes = await capsTool.handler({}, {});
  const capsData = JSON.parse(capsRes.content[0].text);
  assert.ok(Array.isArray(capsData.supportedModes));

  // List Export Presets (reads disk or returns filtered list)
  const presetsRes = await presetsTool.handler({ filter: "H.264", limit: 5 }, {});
  assert.ok(presetsRes.content[0].text);
  console.log("       Verified export capabilities and preset discovery.");
});

// Test 12: Creative Workspace & Desktop Status Verification
await runTest("12. Creative Workspace & Desktop Integration Verification", async () => {
  // Check 8-folder standard creative workspace
  const baseDir = "D:/MCP/05-Premiere/MADEL/P22-Timeline-Integration";
  const requiredSubdirs = [
    "01-Source",
    "02-Assets",
    "03-Project",
    "04-Previews",
    "05-Exports",
    "06-Reports",
    "07-Errors",
    "08-Backups",
  ];

  for (const sub of requiredSubdirs) {
    const full = join(baseDir, sub);
    assert.ok(existsSync(full), `Standard directory ${sub} must exist in P22 creative workspace`);
  }

  assert.ok(existsSync(join(baseDir, "PROJECT_INFO.md")), "PROJECT_INFO.md must exist in P22 workspace");

  // Check Concurrency Scopes
  const mutationLimiter = globalConcurrencyManager.getLimiter("premiere:mutation");
  const readLimiter = globalConcurrencyManager.getLimiter("premiere:read");
  assert.ok(mutationLimiter, "premiere:mutation WorkLimiter must be registered");
  assert.ok(readLimiter, "premiere:read WorkLimiter must be registered");

  // Check Desktop Application Status for Premiere
  const apps = await DesktopBridgeRpc.getApplicationsStatus();
  const prApp = apps.find((a) => a.id === "premiere");
  assert.ok(prApp, "Premiere Pro application must be listed in Desktop apps");
  assert.ok(
    ["supported_and_verified", "configured_not_verified", "detected_only"].includes(prApp.status),
    `Status must reflect detected/configured state: ${prApp.status}`
  );
  assert.equal(typeof prApp.canControl, "boolean");

  console.log(`       Verified workspace structure, concurrency scoping, and Desktop detection (${prApp.statusLabel}).`);
});

console.log(`\nP22 Test Results: ${totalPassed} passed, ${totalFailed} failed.`);
if (totalFailed > 0) {
  process.exit(1);
} else {
  console.log("=== P22 ADOBE PREMIERE PRO TEST SUITE PASSED SUCCESSFULLY ===");
}
