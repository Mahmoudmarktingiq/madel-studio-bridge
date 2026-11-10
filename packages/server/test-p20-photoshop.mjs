import assert from "node:assert";
import { existsSync, readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { registerPhotoshopTools } from "./dist/tools/photoshop.js";

console.log("=== MADEL STUDIO BRIDGE — P20 ADVANCED PHOTOSHOP CREATIVE TOOLS TEST SUITE ===");
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

// Mock bridge implementation to capture tool invocations and verify payload formatting
class MockPhotoshopBridge {
  constructor() {
    this.history = [];
    this.mockResponses = {};
  }

  async execute(name, params, opts) {
    this.history.push({ name, params, opts });
    if (this.mockResponses[name]) {
      if (typeof this.mockResponses[name] === "function") {
        return this.mockResponses[name](params);
      }
      return this.mockResponses[name];
    }
    return { ok: true, name, params };
  }

  setResponse(name, response) {
    this.mockResponses[name] = response;
  }

  lastCall() {
    return this.history[this.history.length - 1];
  }

  reset() {
    this.history = [];
  }
}

const mockBridge = new MockPhotoshopBridge();
const server = new McpServer(
  { name: "test-photoshop-p20", version: "0.4.0" },
  { capabilities: { tools: {} } }
);

registerPhotoshopTools(server, mockBridge, {
  rawScriptApps: ["photoshop"],
  remote: false,
  allowRemoteRawScripts: false,
});

const tools = server._registeredTools;

// Test 1: Verify all 16 new tools and total tool registration count
await runTest("1. Registration of all P20 Advanced Photoshop tools", async () => {
  const p20ToolNames = [
    "ps_get_document_info",
    "ps_set_document_resolution",
    "ps_convert_to_smart_object",
    "ps_inspect_smart_object",
    "ps_duplicate_smart_object",
    "ps_replace_smart_object",
    "ps_update_linked_smart_object",
    "ps_get_selection",
    "ps_select_rectangle",
    "ps_select_ellipse",
    "ps_invert_selection",
    "ps_feather_selection",
    "ps_deselect",
    "ps_create_layer_mask",
    "ps_set_layer_mask_enabled",
    "ps_delete_layer_mask",
  ];

  for (const name of p20ToolNames) {
    assert.ok(tools[name], `Tool ${name} must be registered on McpServer`);
  }
  console.log(`       All 16 P20 specialized tools registered cleanly.`);
});

// Test 2: Print Document Setup — CMYK, 300 DPI, Dimensions Validation
await runTest("2. Print Document Setup: CMYK 300 DPI validation", async () => {
  mockBridge.reset();
  const createTool = tools["ps_create_document"];
  assert.ok(createTool, "ps_create_document must exist");

  // Call with CMYK mode and 300 DPI
  const result = await createTool.handler({
    width: 2480,
    height: 3508,
    resolution: 300,
    mode: "cmyk",
    name: "A4_Print_Poster",
    fill: "white",
  }, {});

  assert.ok(!result.isError, "Creation should succeed");
  const last = mockBridge.lastCall();
  assert.strictEqual(last.name, "ps.create_document");
  assert.strictEqual(last.params.mode, "cmyk");
  assert.strictEqual(last.params.resolution, 300);
  assert.strictEqual(last.params.width, 2480);
  assert.strictEqual(last.params.height, 3508);
  console.log("       Verified CMYK 300 DPI document creation parameters passed to bridge.");
});

// Test 3: Document Information & Physical Dimensions (Inches/MM)
await runTest("3. Document Information extraction and physical print units", async () => {
  mockBridge.reset();
  mockBridge.setResponse("ps.get_document_info", {
    id: 1,
    name: "A4_Print_Poster.psd",
    width: 2480,
    height: 3508,
    resolution: 300,
    mode: "CMYKColorMode",
    bitsPerChannel: 8,
    colorProfileName: "U.S. Web Coated (SWOP) v2",
    layerCount: 5,
    activeLayerId: 3,
    dimensions: {
      pixels: { width: 2480, height: 3508 },
      inches: { width: 8.27, height: 11.69 },
      mm: { width: 210.0, height: 297.0 },
    },
  });

  const infoTool = tools["ps_get_document_info"];
  const res = await infoTool.handler({ documentId: 1 }, {});
  assert.ok(!res.isError);
  const data = JSON.parse(res.content[0].text);
  assert.strictEqual(data.mode, "CMYKColorMode");
  assert.strictEqual(data.resolution, 300);
  assert.strictEqual(data.dimensions.mm.width, 210.0);
  assert.strictEqual(data.dimensions.mm.height, 297.0);
  console.log("       Verified physical A4 print dimensions: 210 x 297 mm at 300 DPI.");
});

// Test 4: Document Resolution Resampling vs DPI update
await runTest("4. Document Resolution adjustment (resample true vs false)", async () => {
  mockBridge.reset();
  const resTool = tools["ps_set_document_resolution"];

  // Resample false (change print resolution without touching pixel count)
  await resTool.handler({ resolution: 300, resample: false }, {});
  let last = mockBridge.lastCall();
  assert.strictEqual(last.name, "ps.set_document_resolution");
  assert.strictEqual(last.params.resolution, 300);
  assert.strictEqual(last.params.resample, false);

  // Resample true (default)
  await resTool.handler({ resolution: 150 }, {});
  last = mockBridge.lastCall();
  assert.strictEqual(last.params.resolution, 150);
  assert.strictEqual(last.params.resample, true);
  console.log("       Verified resolution change with and without pixel resampling.");
});

// Test 5: Professional Print Export — TIFF with LZW and CMYK support
await runTest("5. Professional Print Export (TIFF LZW/None, PNG, JPEG)", async () => {
  mockBridge.reset();
  const exportTool = tools["ps_export"];

  // TIFF export
  await exportTool.handler({
    path: "D:/MCP/04-Photoshop/MADEL/P20-Advanced-Tools/05-Exports/flyer.tiff",
    format: "tiff",
    compression: "lzw",
  }, {});

  const last = mockBridge.lastCall();
  assert.strictEqual(last.name, "ps.export");
  assert.strictEqual(last.params.format, "tiff");
  assert.strictEqual(last.params.compression, "lzw");
  assert.strictEqual(last.params.path, "D:/MCP/04-Photoshop/MADEL/P20-Advanced-Tools/05-Exports/flyer.tiff");
  console.log("       Verified TIFF export with LZW compression parameter dispatch.");
});

// Test 6: Smart Object Conversion & Inspection
await runTest("6. Smart Object Conversion and Metadata Inspection", async () => {
  mockBridge.reset();
  mockBridge.setResponse("ps.convert_to_smart_object", {
    converted: true,
    layer: { id: 10, name: "Hero Image", kind: "smartObject" },
  });
  mockBridge.setResponse("ps.inspect_smart_object", {
    layerId: 10,
    name: "Hero Image",
    kind: "smartObject",
    isSmartObject: true,
    details: {
      fileReference: "D:/MCP/04-Photoshop/MADEL/P20-Advanced-Tools/02-Assets/hero_asset.png",
      linked: false,
      size: { width: 1200, height: 800 },
      resolution: 300,
    },
  });

  const convertTool = tools["ps_convert_to_smart_object"];
  const inspectTool = tools["ps_inspect_smart_object"];

  const convRes = await convertTool.handler({ layerId: 10 }, {});
  assert.ok(!convRes.isError);
  const convData = JSON.parse(convRes.content[0].text);
  assert.strictEqual(convData.converted, true);
  assert.strictEqual(convData.layer.kind, "smartObject");

  const inspRes = await inspectTool.handler({ layerId: 10 }, {});
  assert.ok(!inspRes.isError);
  const inspData = JSON.parse(inspRes.content[0].text);
  assert.strictEqual(inspData.isSmartObject, true);
  assert.strictEqual(inspData.details.resolution, 300);
  console.log("       Verified Smart Object conversion and metadata inspection.");
});

// Test 7: Smart Object Independent Duplication vs Linked Duplication
await runTest("7. Smart Object Duplication: Independent Copy vs Linked Instance", async () => {
  mockBridge.reset();
  const dupTool = tools["ps_duplicate_smart_object"];

  // Independent copy (placedLayerMakeCopy)
  await dupTool.handler({ layerId: 10, independentCopy: true, name: "Hero Image Copy Independent" }, {});
  let last = mockBridge.lastCall();
  assert.strictEqual(last.name, "ps.duplicate_smart_object");
  assert.strictEqual(last.params.independentCopy, true);
  assert.strictEqual(last.params.name, "Hero Image Copy Independent");

  // Standard linked copy
  await dupTool.handler({ layerId: 10, independentCopy: false, name: "Hero Image Linked Instance" }, {});
  last = mockBridge.lastCall();
  assert.strictEqual(last.params.independentCopy, false);
  console.log("       Verified independent vs linked smart object duplication parameters.");
});

// Test 8: Smart Object Content Replacement & Linked Update
await runTest("8. Smart Object Content Replacement and Linked Update", async () => {
  mockBridge.reset();
  const replaceTool = tools["ps_replace_smart_object"];
  const updateTool = tools["ps_update_linked_smart_object"];

  const replacePath = "D:/MCP/04-Photoshop/MADEL/P20-Advanced-Tools/02-Assets/replacement_asset.png";
  await replaceTool.handler({ layerId: 10, path: replacePath }, {});
  let last = mockBridge.lastCall();
  assert.strictEqual(last.name, "ps.replace_smart_object");
  assert.strictEqual(last.params.path, replacePath);

  await updateTool.handler({ layerId: 10 }, {});
  last = mockBridge.lastCall();
  assert.strictEqual(last.name, "ps.update_linked_smart_object");
  assert.strictEqual(last.params.layerId, 10);
  console.log("       Verified smart object replacement and linked update dispatch.");
});

// Test 9: Selections: Rectangle, Ellipse, Invert, Feather, Deselect
await runTest("9. Selections: Rectangular, Elliptical, Invert, Feather, Deselect", async () => {
  mockBridge.reset();
  const rectTool = tools["ps_select_rectangle"];
  const ellipTool = tools["ps_select_ellipse"];
  const invertTool = tools["ps_invert_selection"];
  const featherTool = tools["ps_feather_selection"];
  const deselectTool = tools["ps_deselect"];
  const getSelTool = tools["ps_get_selection"];

  // Rectangle
  await rectTool.handler({ left: 100, top: 100, right: 500, bottom: 400, mode: "replace" }, {});
  assert.strictEqual(mockBridge.lastCall().name, "ps.select_rectangle");

  // Ellipse with Add mode
  await ellipTool.handler({ left: 200, top: 200, right: 600, bottom: 600, mode: "add" }, {});
  assert.strictEqual(mockBridge.lastCall().name, "ps.select_ellipse");
  assert.strictEqual(mockBridge.lastCall().params.mode, "add");

  // Invert
  await invertTool.handler({}, {});
  assert.strictEqual(mockBridge.lastCall().name, "ps.invert_selection");

  // Feather
  await featherTool.handler({ radius: 8 }, {});
  assert.strictEqual(mockBridge.lastCall().name, "ps.feather_selection");
  assert.strictEqual(mockBridge.lastCall().params.radius, 8);

  // Deselect
  await deselectTool.handler({}, {});
  assert.strictEqual(mockBridge.lastCall().name, "ps.deselect");

  // Get selection
  mockBridge.setResponse("ps.get_selection", {
    hasSelection: true,
    bounds: { left: 100, top: 100, right: 500, bottom: 400 },
    width: 400,
    height: 300,
  });
  const selRes = await getSelTool.handler({}, {});
  const selData = JSON.parse(selRes.content[0].text);
  assert.strictEqual(selData.hasSelection, true);
  assert.strictEqual(selData.width, 400);
  console.log("       Verified selection creation, boolean mode combining, feathering, and query.");
});

// Test 10: Layer Masks: Creation, Enable/Disable, Confirmed Deletion
await runTest("10. Layer Masks: Create, Enable/Disable, and Confirmed Deletion Safety", async () => {
  mockBridge.reset();
  const maskCreateTool = tools["ps_create_layer_mask"];
  const maskToggleTool = tools["ps_set_layer_mask_enabled"];
  const maskDeleteTool = tools["ps_delete_layer_mask"];

  // Create mask (revealSelection)
  await maskCreateTool.handler({ layerId: 5, mode: "revealSelection" }, {});
  assert.strictEqual(mockBridge.lastCall().name, "ps.create_layer_mask");
  assert.strictEqual(mockBridge.lastCall().params.mode, "revealSelection");

  // Toggle mask disabled (shift-click)
  await maskToggleTool.handler({ layerId: 5, enabled: false }, {});
  assert.strictEqual(mockBridge.lastCall().name, "ps.set_layer_mask_enabled");
  assert.strictEqual(mockBridge.lastCall().params.enabled, false);

  // Delete mask with confirm: true
  await maskDeleteTool.handler({ layerId: 5, apply: true, confirm: true }, {});
  assert.strictEqual(mockBridge.lastCall().name, "ps.delete_layer_mask");
  assert.strictEqual(mockBridge.lastCall().params.confirm, true);
  assert.strictEqual(mockBridge.lastCall().params.apply, true);

  console.log("       Verified layer mask lifecycle and safety confirmation flag.");
});

// Test 11: Layer Styles: Drop Shadow, Stroke, Gradient Overlay, Blend Modes
await runTest("11. Layer Styles: Extended properties & blend mode coverage", async () => {
  mockBridge.reset();
  const styleTool = tools["ps_set_layer_style"];

  // Apply Drop Shadow
  await styleTool.handler({
    layerId: 3,
    style: "dropShadow",
    color: "#1a1a1a",
    opacity: 65,
    distance: 12,
    size: 20,
    spread: 15,
    blendMode: "multiply",
  }, {});
  let last = mockBridge.lastCall();
  assert.strictEqual(last.name, "ps.set_layer_style");
  assert.strictEqual(last.params.style, "dropShadow");
  assert.strictEqual(last.params.opacity, 65);

  // Apply Gradient Overlay
  await styleTool.handler({
    layerId: 3,
    style: "gradientOverlay",
    colors: ["#ff0055", "#00ccff"],
    gradientStyle: "linear",
    opacity: 90,
  }, {});
  last = mockBridge.lastCall();
  assert.strictEqual(last.params.style, "gradientOverlay");
  assert.deepStrictEqual(last.params.colors, ["#ff0055", "#00ccff"]);

  // Apply Stroke
  await styleTool.handler({
    layerId: 3,
    style: "stroke",
    color: "#ffffff",
    size: 4,
    strokePosition: "outside",
  }, {});
  last = mockBridge.lastCall();
  assert.strictEqual(last.params.style, "stroke");
  assert.strictEqual(last.params.size, 4);
  console.log("       Verified drop shadow, gradient overlay, and stroke styles.");
});

// Test 12: Creative Workspace Structure Verification
await runTest("12. Verify Creative Test Workspace Directory Structure", async () => {
  const baseDir = "D:/MCP/04-Photoshop/MADEL/P20-Advanced-Tools";
  assert.ok(existsSync(baseDir), "P20 test directory must exist");

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
    const fullPath = join(baseDir, sub);
    assert.ok(existsSync(fullPath), `Subdirectory ${sub} must exist`);
  }

  const infoPath = join(baseDir, "PROJECT_INFO.md");
  assert.ok(existsSync(infoPath), "PROJECT_INFO.md must exist in test project root");
  const infoContent = readFileSync(infoPath, "utf8");
  assert.ok(infoContent.includes("P20 Advanced Photoshop Creative Tools"), "PROJECT_INFO.md must contain phase title");

  const heroAsset = join(baseDir, "02-Assets", "hero_asset.png");
  const replAsset = join(baseDir, "02-Assets", "replacement_asset.png");
  assert.ok(existsSync(heroAsset), "Sample hero_asset.png must exist in 02-Assets");
  assert.ok(existsSync(replAsset), "Sample replacement_asset.png must exist in 02-Assets");

  console.log("       Verified 8/8 standardized directories and test assets in P20-Advanced-Tools.");
});

console.log(`\nP20 Test Results: ${totalPassed} passed, ${totalFailed} failed.`);
if (totalFailed > 0) {
  process.exit(1);
} else {
  console.log("=== P20 ADVANCED PHOTOSHOP TEST SUITE PASSED SUCCESSFULLY ===");
  process.exit(0);
}
