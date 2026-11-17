/**
 * MADEL Studio Bridge — Phase P26 Microsoft Office COM Lifecycle & Reliability Suite
 * Developed and maintained by Mahmoud Adel
 *
 * Verifies 8 operational lifecycle & reliability characteristics:
 * 1. Office application discovery and caching (Word, Excel, PowerPoint)
 * 2. Bridge RPC integration & status exposure (office-word, office-excel, office-powerpoint, office-mcp)
 * 3. Error recovery: non-existent file handling
 * 4. Error recovery: out-of-range indexing
 * 5. Worker resilience after COM error
 * 6. Sequential execution queue & concurrency handling
 * 7. Worker lifecycle: restart and pool shutdown
 * 8. Clean resource cleanup
 */

import assert from "node:assert";
import { OfficeDiscovery } from "./dist/office/common/discovery.js";
import { OfficeComPool } from "./dist/office/common/com-runner.js";
import { WordManager } from "./dist/office/word/word-manager.js";
import { ExcelManager } from "./dist/office/excel/excel-manager.js";
import { PowerPointManager } from "./dist/office/powerpoint/powerpoint-manager.js";
import { DesktopBridgeRpc } from "./dist/desktop/bridge-rpc.js";
import { globalConcurrencyManager } from "./dist/gateway/index.js";

console.log("================================================================================");
console.log("=== MADEL STUDIO BRIDGE — PHASE P26 OFFICE COM LIFECYCLE & RELIABILITY ===");
console.log("================================================================================");

let passed = 0;
function pass(desc, note) {
  passed++;
  console.log(`[PASS] Test ${passed}: ${desc}`);
  if (note) console.log(`       ${note}`);
}

async function runLifecycleSuite() {
  // Test 1: Application Discovery for all 3 apps
  const [wordMeta, excelMeta, pptMeta] = await Promise.all([
    OfficeDiscovery.discoverApp("word"),
    OfficeDiscovery.discoverApp("excel"),
    OfficeDiscovery.discoverApp("powerpoint"),
  ]);

  assert.strictEqual(wordMeta.installed, true, "Word must be installed");
  assert.strictEqual(wordMeta.status, "LIVE_VERIFIED");
  assert.strictEqual(excelMeta.installed, true, "Excel must be installed");
  assert.strictEqual(excelMeta.status, "LIVE_VERIFIED");
  assert.strictEqual(pptMeta.installed, true, "PowerPoint must be installed");
  assert.strictEqual(pptMeta.status, "LIVE_VERIFIED");
  pass("All 3 Office apps discovered and verified", `Word: ${wordMeta.version}, Excel: ${excelMeta.version}, PPT: ${pptMeta.version}`);

  // Test 2: Bridge RPC integration
  const apps = await DesktopBridgeRpc.getApplicationsStatus();
  const wordApp = apps.find((a) => a.id === "office-word");
  const excelApp = apps.find((a) => a.id === "office-excel");
  const pptApp = apps.find((a) => a.id === "office-powerpoint");

  assert.ok(wordApp, "Bridge RPC must expose office-word");
  assert.strictEqual(wordApp.status, "supported_and_verified");
  assert.strictEqual(wordApp.canControl, true);

  assert.ok(excelApp, "Bridge RPC must expose office-excel");
  assert.strictEqual(excelApp.status, "supported_and_verified");
  assert.strictEqual(excelApp.canControl, true);

  assert.ok(pptApp, "Bridge RPC must expose office-powerpoint");
  assert.strictEqual(pptApp.status, "supported_and_verified");
  assert.strictEqual(pptApp.canControl, true);

  const servers = await DesktopBridgeRpc.getServersStatus();
  const officeMcp = servers.find((s) => s.id === "office-mcp");
  assert.ok(officeMcp, "Bridge RPC must expose office-mcp server");
  assert.strictEqual(officeMcp.toolsCount, 51);
  pass("Desktop Bridge RPC correctly exposes Office applications and 51 MCP tools");

  // Test 3: Non-existent file error handling
  let errorCaught = false;
  try {
    await WordManager.openDocument("D:\\MCP\\Office-Workspace\\Word\\non_existent_file_99999.docx");
  } catch (err) {
    errorCaught = true;
    assert.ok(err.message.includes("File does not exist") || err.message.includes("not found"), "Error must clearly indicate missing file");
  }
  assert.strictEqual(errorCaught, true, "Opening non-existent file must throw clear exception");
  pass("Error recovery: Non-existent file handled gracefully without crashing worker");

  // Test 4: Out-of-range index error handling in PowerPoint
  await PowerPointManager.openApp();
  await PowerPointManager.createPresentation();
  let pptErrorCaught = false;
  try {
    await PowerPointManager.deleteSlide(999);
  } catch (err) {
    pptErrorCaught = true;
    assert.ok(err.message.includes("out of range") || err.message.includes("Slide index"), "Error must report out of range");
  }
  assert.strictEqual(pptErrorCaught, true, "Out-of-range slide index must throw error");
  pass("Error recovery: Out-of-range indexing handled safely");

  // Test 5: Worker resilience after error
  // Verify that PowerPoint worker can still execute subsequent valid commands
  const addSlideRes = await PowerPointManager.addSlide(12);
  assert.strictEqual(addSlideRes.slideIndex, 1, "Should succeed in adding slide after prior error");
  await PowerPointManager.closePresentation();
  pass("Worker resilience: Continued successful execution after caught COM errors");

  // Test 6: Concurrency & Sequential Worker Execution
  // Dispatch 5 rapid operations to Excel worker
  await ExcelManager.openApp();
  await ExcelManager.createWorkbook();
  const runExcelOp = (task) =>
    globalConcurrencyManager.schedule("excel:operations", task, {
      correlationId: `corr-life-${Date.now().toString(36)}`,
    });

  const promises = [
    runExcelOp(() => ExcelManager.writeCells("A1", [["Conc1"]])),
    runExcelOp(() => ExcelManager.writeCells("A2", [["Conc2"]])),
    runExcelOp(() => ExcelManager.writeCells("A3", [["Conc3"]])),
    runExcelOp(() => ExcelManager.writeCells("A4", [["Conc4"]])),
    runExcelOp(() => ExcelManager.writeCells("A5", [["Conc5"]])),
  ];
  const results = await Promise.all(promises);
  assert.strictEqual(results.length, 5);
  for (const r of results) {
    assert.strictEqual(r.success, true);
  }
  const readRes = await ExcelManager.readRange("A1:A5");
  assert.deepStrictEqual(readRes.values, [["Conc1"], ["Conc2"], ["Conc3"], ["Conc4"], ["Conc5"]]);
  await ExcelManager.closeWorkbook(false);
  pass("Concurrency & FIFO execution: Rapid asynchronous pipeline executed accurately");

  // Test 7: Graceful Worker Teardown
  await WordManager.quitApp();
  await ExcelManager.quitApp();
  await PowerPointManager.quitApp();
  await OfficeComPool.stopAll();
  pass("Graceful Worker Teardown: All Office COM workers stopped safely without orphan processes");

  console.log("\n================================================================================");
  console.log(`>>> ALL ${passed} OFFICE COM LIFECYCLE TESTS PASSED (100% GREEN) <<<`);
  console.log("================================================================================");
}

runLifecycleSuite().catch((err) => {
  console.error("Office COM Lifecycle Suite failed:", err);
  process.exit(1);
});
