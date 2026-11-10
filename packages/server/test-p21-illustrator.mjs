import assert from "node:assert";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { registerIllustratorTools } from "./dist/tools/illustrator.js";
import { globalConcurrencyManager } from "./dist/gateway/index.js";
import { DesktopBridgeRpc } from "./dist/desktop/bridge-rpc.js";

console.log("=== MADEL STUDIO BRIDGE — P21 ADOBE ILLUSTRATOR VECTOR INTEGRATION TEST SUITE ===");
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

// Mock OsScriptBridge implementation to capture generated ExtendScript without needing a live UI pop-up
class MockIllustratorBridge {
  constructor() {
    this.evaluatedScripts = [];
    this.mockResponses = {};
  }

  async evaluate(script, opts) {
    this.evaluatedScripts.push({ script, opts });
    for (const pattern in this.mockResponses) {
      if (script.includes(pattern)) {
        const resp = this.mockResponses[pattern];
        return typeof resp === "function" ? resp(script) : resp;
      }
    }
    return { ok: true };
  }

  setResponse(pattern, response) {
    this.mockResponses[pattern] = response;
  }

  lastScript() {
    return this.evaluatedScripts[this.evaluatedScripts.length - 1]?.script || "";
  }

  reset() {
    this.evaluatedScripts = [];
  }
}

const mockBridge = new MockIllustratorBridge();
const server = new McpServer(
  { name: "test-illustrator-p21", version: "0.4.0" },
  { capabilities: { tools: {} } }
);

registerIllustratorTools(server, mockBridge);
const tools = server._registeredTools;

// Test 1: Verify all 37 Illustrator tools are registered
await runTest("1. Registration of all 37 specialized Illustrator MCP tools", async () => {
  const expectedTools = [
    // Documents (7)
    "ai_list_documents",
    "ai_get_document_info",
    "ai_create_document",
    "ai_open_document",
    "ai_save_document",
    "ai_save_as",
    "ai_close_document",
    // Artboards (5)
    "ai_list_artboards",
    "ai_create_artboard",
    "ai_resize_artboard",
    "ai_rename_artboard",
    "ai_set_active_artboard",
    // Vector Objects (11)
    "ai_create_rectangle",
    "ai_create_ellipse",
    "ai_create_line",
    "ai_create_path",
    "ai_create_compound_path",
    "ai_move_object",
    "ai_resize_object",
    "ai_rotate_object",
    "ai_duplicate_object",
    "ai_delete_object",
    "ai_create_shape",
    // Layers & Groups (6)
    "ai_list_layers",
    "ai_create_layer",
    "ai_rename_layer",
    "ai_group_objects",
    "ai_ungroup_objects",
    "ai_set_layer_props",
    // Typography (3)
    "ai_create_text",
    "ai_update_text",
    "ai_set_text_alignment",
    // Export & Previews (5)
    "ai_export_svg",
    "ai_export_pdf",
    "ai_export_png",
    "ai_save_as_ai",
    "ai_export_artboard",
    "ai_get_preview",
  ];

  for (const name of expectedTools) {
    assert.ok(tools[name], `Tool ${name} must be registered on McpServer`);
  }
  console.log(`       All ${expectedTools.length} tools registered cleanly on McpServer.`);
});

// Test 2: Document Creation with Units (pt, mm, in) and Color Modes
await runTest("2. Document Creation with unit conversions (pt/mm/in) and color spaces", async () => {
  mockBridge.reset();
  const createDoc = tools["ai_create_document"];

  // Create A4 in mm: 210 x 297 mm, CMYK
  await createDoc.handler({
    width: 210,
    height: 297,
    units: "mm",
    colorMode: "cmyk",
    name: "Corporate_Brochure",
  }, {});

  const script = mockBridge.lastScript();
  assert.ok(script.includes("DocumentColorSpace.CMYK"), "Must set CMYK color space");
  assert.ok(script.includes("__toPt(210, \"mm\")"), "Must convert 210 mm to points");
  assert.ok(script.includes("__toPt(297, \"mm\")"), "Must convert 297 mm to points");
  console.log("       Verified CMYK A4 document creation with millimeter to point conversion.");
});

// Test 3: Document Telemetry Extraction
await runTest("3. Document Telemetry Extraction (ai_get_document_info)", async () => {
  mockBridge.reset();
  mockBridge.setResponse("dimensionsMm", {
    name: "Vector_Master.ai",
    path: "D:/MCP/06-Illustrator/MADEL/P21-Vector-Integration/03-Project/Vector_Master.ai",
    width: 595.28,
    height: 841.89,
    dimensionsMm: { width: 210.0, height: 297.0 },
    dimensionsInches: { width: 8.27, height: 11.69 },
    colorMode: "DocumentColorSpace.CMYK",
    artboardsCount: 2,
    activeArtboardIndex: 0,
    activeArtboardName: "Cover Page",
    layersCount: 4,
    pageItemsCount: 18,
    saved: true,
  });

  const getInfo = tools["ai_get_document_info"];
  const res = await getInfo.handler({}, {});
  assert.ok(!res.isError);
  const data = JSON.parse(res.content[0].text);
  assert.strictEqual(data.dimensionsMm.width, 210.0);
  assert.strictEqual(data.dimensionsMm.height, 297.0);
  assert.strictEqual(data.colorMode, "DocumentColorSpace.CMYK");
  assert.strictEqual(data.artboardsCount, 2);
  console.log("       Verified document telemetry: 210 x 297 mm, 2 artboards, 18 page items.");
});

// Test 4: Artboards Management (List, Add, Resize, Rename, Set Active)
await runTest("4. Artboard lifecycle: create, resize, rename, activate", async () => {
  mockBridge.reset();
  const createAb = tools["ai_create_artboard"];
  const resizeAb = tools["ai_resize_artboard"];
  const renameAb = tools["ai_rename_artboard"];
  const setActiveAb = tools["ai_set_active_artboard"];

  // Add Artboard
  await createAb.handler({ width: 800, height: 600, x: 900, y: 0, name: "Banner Artboard" }, {});
  assert.ok(mockBridge.lastScript().includes("var left = 900, top = 0;"));
  assert.ok(mockBridge.lastScript().includes("d.artboards.add([left, top, right, bottom])"));

  // Resize Artboard
  await resizeAb.handler({ artboardIndex: 1, width: 1200, height: 800 }, {});
  assert.ok(mockBridge.lastScript().includes("ab.artboardRect = [left, top, left + 1200, top - 800]"));

  // Rename Artboard
  await renameAb.handler({ artboardIndex: 1, name: "Social Media 1200x800" }, {});
  assert.ok(mockBridge.lastScript().includes("d.artboards[idx].name = \"Social Media 1200x800\""));

  // Set Active Artboard
  await setActiveAb.handler({ artboardIndex: 1 }, {});
  assert.ok(mockBridge.lastScript().includes("d.artboards.setActiveArtboardIndex(1)"));
  console.log("       Verified artboard creation, rectangular bounds mapping, and activation.");
});

// Test 5: Vector Rectangle, Ellipse & Line Creation with Accurate Coordinates
await runTest("5. Vector primitives (Rectangle, Ellipse, Line) coordinate transforms", async () => {
  mockBridge.reset();
  const rectTool = tools["ai_create_rectangle"];
  const ellipTool = tools["ai_create_ellipse"];
  const lineTool = tools["ai_create_line"];

  // Rectangle with rounded corners
  await rectTool.handler({
    x: 50,
    y: 100,
    width: 300,
    height: 200,
    cornerRadius: 15,
    fill: "#3b82f6",
    stroke: "#1d4ed8",
    strokeWidth: 2,
    name: "Hero Card",
  }, {});
  let s = mockBridge.lastScript();
  assert.ok(s.includes("d.pathItems.roundedRectangle(top, left, w, h, cr, cr)"));
  assert.ok(s.includes("__style(item, \"#3b82f6\", \"#1d4ed8\", 2)"));

  // Ellipse
  await ellipTool.handler({
    x: 100,
    y: 100,
    width: 150,
    height: 150,
    fill: "#10b981",
    name: "Badge Circle",
  }, {});
  s = mockBridge.lastScript();
  assert.ok(s.includes("d.pathItems.ellipse(top, left, 150, 150)"));

  // Line
  await lineTool.handler({
    x1: 0,
    y1: 50,
    x2: 500,
    y2: 50,
    stroke: "#64748b",
    strokeWidth: 1.5,
    name: "Divider Line",
  }, {});
  s = mockBridge.lastScript();
  assert.ok(s.includes("item.setEntirePath([p1, p2])"));
  console.log("       Verified primitive vector coordinates mapped to native Y-up coordinates.");
});

// Test 6: Complex Bézier Path with Tangent Handles & Vertex Types
await runTest("6. Arbitrary Bézier Path generation with anchor points and handles", async () => {
  mockBridge.reset();
  const pathTool = tools["ai_create_path"];

  await pathTool.handler({
    points: [
      { x: 100, y: 100, outHandle: [30, -20], pointType: "smooth" },
      { x: 250, y: 180, inHandle: [-40, 10], outHandle: [40, -10], pointType: "smooth" },
      { x: 400, y: 120, inHandle: [-30, -20], pointType: "corner" },
    ],
    closed: true,
    fill: "#8b5cf6",
    stroke: "#6d28d9",
    strokeWidth: 3,
    name: "Wave Vector",
  }, {});

  const s = mockBridge.lastScript();
  assert.ok(s.includes("path.closed = true"));
  assert.ok(s.includes("pt.leftDirection = [ax + p.inHandle[0], ay - p.inHandle[1]]"));
  assert.ok(s.includes("pt.rightDirection = [ax + p.outHandle[0], ay - p.outHandle[1]]"));
  assert.ok(s.includes("PointType.SMOOTH"));
  console.log("       Verified multi-vertex Bézier path with smooth/corner anchors and tangents.");
});

// Test 7: Transformations (Move, Scale, Rotate, Duplicate) & Destructive Confirmation Guard
await runTest("7. Vector transformations and mandatory delete confirmation guard", async () => {
  mockBridge.reset();
  const moveTool = tools["ai_move_object"];
  const resizeTool = tools["ai_resize_object"];
  const rotateTool = tools["ai_rotate_object"];
  const dupTool = tools["ai_duplicate_object"];
  const deleteTool = tools["ai_delete_object"];

  // Move
  await moveTool.handler({ name: "Hero Card", dx: 40, dy: 60 }, {});
  assert.ok(mockBridge.lastScript().includes("item.translate(40, -60)"));

  // Scale
  await resizeTool.handler({ name: "Hero Card", scaleX: 125, scaleY: 125 }, {});
  assert.ok(mockBridge.lastScript().includes("item.resize(125, 125"));

  // Rotate
  await rotateTool.handler({ name: "Hero Card", angle: 45 }, {});
  assert.ok(mockBridge.lastScript().includes("item.rotate(45"));

  // Duplicate
  await dupTool.handler({ name: "Hero Card", newName: "Hero Card Copy", dx: 20, dy: 20 }, {});
  assert.ok(mockBridge.lastScript().includes("var copy = item.duplicate()"));

  // Delete without confirmation must reject
  await assert.rejects(
    async () => {
      await deleteTool.handler({ name: "Hero Card Copy", confirm: false }, {});
    },
    /confirm: true/,
    "Must throw safety error when confirm is false"
  );

  // Delete with confirmation succeeds
  await deleteTool.handler({ name: "Hero Card Copy", confirm: true }, {});
  assert.ok(mockBridge.lastScript().includes("item.remove()"));
  console.log("       Verified object transformation methods and mandatory deletion safety guard.");
});

// Test 8: Layers & Group Hierarchy
await runTest("8. Layer organization, properties, and object grouping/ungrouping", async () => {
  mockBridge.reset();
  const listLayers = tools["ai_list_layers"];
  const createLayer = tools["ai_create_layer"];
  const groupTool = tools["ai_group_objects"];
  const ungroupTool = tools["ai_ungroup_objects"];
  const setLayerProps = tools["ai_set_layer_props"];

  // Create layer
  await createLayer.handler({ name: "Branding Assets" }, {});
  assert.ok(mockBridge.lastScript().includes("l.name = \"Branding Assets\""));

  // Group objects
  await groupTool.handler({ objectNames: ["Hero Card", "Badge Circle"], groupName: "Hero Component" }, {});
  assert.ok(mockBridge.lastScript().includes("d.groupItems.add()"));

  // Ungroup
  await ungroupTool.handler({ groupName: "Hero Component" }, {});
  assert.ok(mockBridge.lastScript().includes("grp.typename !== \"GroupItem\""));

  // Set layer props (lock & visible)
  await setLayerProps.handler({ layerName: "Branding Assets", visible: true, locked: true }, {});
  assert.ok(mockBridge.lastScript().includes("l.locked = true"));
  console.log("       Verified layer management, object grouping, and hierarchy manipulation.");
});

// Test 9: Typography & Text Alignment
await runTest("9. Typography: point/area text, styling, fonts, and paragraph alignment", async () => {
  mockBridge.reset();
  const createText = tools["ai_create_text"];
  const updateText = tools["ai_update_text"];
  const setAlign = tools["ai_set_text_alignment"];

  // Create Point Text
  await createText.handler({
    text: "MADEL Studio Bridge",
    x: 50,
    y: 80,
    fontSize: 36,
    font: "Arial-BoldMT",
    fill: "#0f172a",
    alignment: "left",
    name: "Main Heading",
  }, {});
  let s = mockBridge.lastScript();
  assert.ok(s.includes("t.contents = \"MADEL Studio Bridge\""));
  assert.ok(s.includes("var size = 36;"));
  assert.ok(s.includes("ca.size = size;"));
  assert.ok(s.includes("Arial-BoldMT"));

  // Create Area Text with wrapping bounds
  await createText.handler({
    text: "Professional vector engine with native Bézier and typography support.",
    x: 50,
    y: 130,
    width: 400,
    height: 100,
    fontSize: 14,
    alignment: "justify",
    name: "Body Text",
  }, {});
  s = mockBridge.lastScript();
  assert.ok(s.includes("d.textFrames.areaText"));
  assert.ok(s.includes("Justification.FULLJUSTIFY"));

  // Update text
  await updateText.handler({ name: "Main Heading", fontSize: 42, fill: "#2563eb" }, {});
  s = mockBridge.lastScript();
  assert.ok(s.includes("var size = 42;"));

  // Align text
  await setAlign.handler({ name: "Main Heading", alignment: "center" }, {});
  s = mockBridge.lastScript();
  assert.ok(s.includes("Justification.CENTER"));
  console.log("       Verified point/area text frames, character attributes, and justification.");
});

// Test 10: Production Export (SVG, PDF, PNG, Native AI)
await runTest("10. Production Export: SVG (CSS inline/style), Vector PDF, Raster PNG", async () => {
  mockBridge.reset();
  const exportSvg = tools["ai_export_svg"];
  const exportPdf = tools["ai_export_pdf"];
  const exportPng = tools["ai_export_png"];
  const saveAi = tools["ai_save_as_ai"];

  // SVG Export
  await exportSvg.handler({
    path: "D:/MCP/06-Illustrator/MADEL/P21-Vector-Integration/05-Exports/logo.svg",
    embedRasterImages: true,
    cssProperties: "inline",
  }, {});
  let s = mockBridge.lastScript();
  assert.ok(s.includes("ExportType.SVG"));
  assert.ok(s.includes("SVGCSSPropertyLocation.STYLEATTRIBUTES"));

  // PDF Export
  await exportPdf.handler({
    path: "D:/MCP/06-Illustrator/MADEL/P21-Vector-Integration/05-Exports/flyer.pdf",
    compatibility: "acrobat7",
    preserveEditability: true,
  }, {});
  s = mockBridge.lastScript();
  assert.ok(s.includes("PDFSaveOptions"));
  assert.ok(s.includes("PDFCompatibility.ACROBAT7"));
  assert.ok(s.includes("po.preserveEditability = true"));

  // PNG Export at 300 PPI (scale 416%)
  await exportPng.handler({
    path: "D:/MCP/06-Illustrator/MADEL/P21-Vector-Integration/05-Exports/preview.png",
    scalePercent: 416,
    transparency: true,
  }, {});
  s = mockBridge.lastScript();
  assert.ok(s.includes("ExportOptionsPNG24"));
  assert.ok(s.includes("po.horizontalScale = 416"));

  // Native AI
  await saveAi.handler({
    path: "D:/MCP/06-Illustrator/MADEL/P21-Vector-Integration/03-Project/master.ai",
    pdfCompatible: true,
  }, {});
  s = mockBridge.lastScript();
  assert.ok(s.includes("IllustratorSaveOptions"));
  assert.ok(s.includes("io.pdfCompatible = true"));
  console.log("       Verified SVG, PDF, PNG-300DPI, and native .ai export options.");
});

// Test 11: Creative Workspace Directory Verification
await runTest("11. Verify 8-folder standard creative workspace for P21", async () => {
  const baseDir = "D:/MCP/06-Illustrator/MADEL/P21-Vector-Integration";
  assert.ok(existsSync(baseDir), "P21 Illustrator directory must exist");

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
  assert.ok(infoContent.includes("P21 Adobe Illustrator Vector Integration"), "PROJECT_INFO.md must contain phase title");

  console.log("       Verified 8/8 standardized directories and PROJECT_INFO.md.");
});

// Test 12: Gateway Concurrency Scoping & Desktop RPC Parity
await runTest("12. Concurrency Scoping (illustrator:mutation / read) & Desktop Status", async () => {
  const readScope = globalConcurrencyManager.resolveScope("illustrator", "ai_list_documents", false);
  const writeScope = globalConcurrencyManager.resolveScope("illustrator", "ai_create_rectangle", true);

  assert.strictEqual(readScope, "illustrator:read");
  assert.strictEqual(writeScope, "illustrator:mutation");

  const apps = await DesktopBridgeRpc.getApplicationsStatus();
  const aiApp = apps.find((a) => a.id === "illustrator");
  assert.ok(aiApp, "Illustrator application entry must exist in Desktop RPC");
  assert.ok(
    aiApp.status === "configured_not_verified" || aiApp.status === "supported_and_verified",
    `Status must be configured_not_verified or supported_and_verified (got: ${aiApp.status})`
  );
  assert.ok(aiApp.canControl, "canControl must be true when Illustrator is installed/ready");
  console.log(`       Verified concurrency scoping and Desktop status (${aiApp.statusLabel}).`);
});

console.log(`\nP21 Test Results: ${totalPassed} passed, ${totalFailed} failed.`);
if (totalFailed > 0) {
  process.exit(1);
} else {
  console.log("=== P21 ADOBE ILLUSTRATOR TEST SUITE PASSED SUCCESSFULLY ===");
  process.exit(0);
}
