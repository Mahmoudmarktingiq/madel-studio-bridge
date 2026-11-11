import assert from "node:assert";
import { existsSync, statSync, rmSync } from "node:fs";
import { join } from "node:path";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { OsScriptBridge } from "./dist/drivers/osscript.js";
import { registerIllustratorTools } from "./dist/tools/illustrator.js";

console.log("================================================================================");
console.log("  MADEL Studio Bridge — P25.5 Real Adobe Illustrator MCP Live Acceptance Test  ");
console.log("================================================================================");
console.log(`Node version: ${process.version}`);
console.log(`Platform: ${process.platform}`);
console.log(`Time: ${new Date().toISOString()}\n`);

const AI_OUT_DIR = "D:/MCP/01-Projects/Source/MADEL-Studio-Bridge/artifacts/acceptance/p25-5/illustrator";
const AI_FILE_PATH = `${AI_OUT_DIR}/madel_p25_5_acceptance.ai`;
const PNG_FILE_PATH = `${AI_OUT_DIR}/madel_p25_5_acceptance.png`;

let totalTests = 0;
let passedTests = 0;
let failedTests = 0;

async function testStep(stepName, fn) {
  totalTests++;
  process.stdout.write(`[STEP ${totalTests}] ${stepName} ... `);
  const t0 = Date.now();
  try {
    const result = await fn();
    const dt = Date.now() - t0;
    console.log(`PASS (${dt}ms)`);
    passedTests++;
    return result;
  } catch (err) {
    const dt = Date.now() - t0;
    console.log(`FAIL (${dt}ms)`);
    console.error(`       Error: ${err.message}`);
    failedTests++;
    throw err;
  }
}

async function main() {
  // Preflight cleanup of stale lock file
  try {
    const lck = "C:/Users/asus/AppData/Roaming/Adobe/Adobe Illustrator 29 Settings/en_US/x64/IllustratorSession.lck$$";
    if (existsSync(lck)) rmSync(lck, { force: true });
  } catch {}

  const bridge = new OsScriptBridge({
    appId: "illustrator",
    defaultTimeoutMs: 60000,
  });

  const server = new McpServer({
    name: "madel-illustrator-acceptance",
    version: "0.11.4",
  });

  registerIllustratorTools(server, bridge);

  async function callTool(name, args = {}) {
    const tool = server._registeredTools[name];
    if (!tool) throw new Error(`Tool "${name}" is not registered on McpServer.`);
    const res = await tool.handler(args);
    if (res.isError) {
      const msg = res.content?.map(c => c.text).join(" ") || "Unknown tool error";
      throw new Error(`Tool ${name} failed: ${msg}`);
    }
    const text = res.content?.[0]?.text;
    if (text) {
      try {
        return JSON.parse(text);
      } catch {
        return text;
      }
    }
    return res;
  }

  try {
    // 1. Connection check & initial doc list
    const initialDocs = await testStep("Connect to live Illustrator and list documents (ai_list_documents)", async () => {
      const res = await callTool("ai_list_documents");
      assert(Array.isArray(res), "Expected array of documents");
      return res;
    });
    console.log(`       Currently open documents: ${initialDocs.length}`);

    // Clean up any lingering unsaved docs from previous runs
    for (let i = 0; i < initialDocs.length; i++) {
      try {
        await callTool("ai_close_document", { save: false });
      } catch {}
    }

    // 2. Create new A4 Document
    const createdDoc = await testStep("Create A4 RGB document (ai_create_document)", async () => {
      const res = await callTool("ai_create_document", {
        width: 595.28,
        height: 841.89,
        units: "pt",
        colorMode: "rgb",
        name: "MADEL_P25_5_Acceptance",
      });
      assert(res && res.name, "Expected document info with name");
      return res;
    });
    console.log(`       Created doc: ${createdDoc.name} (${createdDoc.width} x ${createdDoc.height} pt)`);

    // 3. Draw Rectangle with fill and stroke
    const rectRes = await testStep("Draw rectangle with styling (ai_create_rectangle)", async () => {
      const res = await callTool("ai_create_rectangle", {
        name: "MadelRect",
        x: 50,
        y: 50,
        width: 250,
        height: 120,
        fill: "#1f77b4",
        stroke: "#0a2f4d",
        strokeWidth: 2,
      });
      assert(res && res.name === "MadelRect", "Rectangle name mismatch");
      return res;
    });
    console.log(`       Created rectangle: ${rectRes.name}`);

    // 4. Draw Circle with fill and stroke
    const circleRes = await testStep("Draw circle with styling (ai_create_ellipse)", async () => {
      const res = await callTool("ai_create_ellipse", {
        name: "MadelCircle",
        x: 330,
        y: 50,
        width: 120,
        height: 120,
        fill: "#ff7f0e",
        stroke: "#803c00",
        strokeWidth: 2,
      });
      assert(res && res.name === "MadelCircle", "Circle name mismatch");
      return res;
    });
    console.log(`       Created circle: ${circleRes.name}`);

    // 5. Create Layer
    const layerRes = await testStep("Create new layer (ai_create_layer)", async () => {
      const res = await callTool("ai_create_layer", {
        name: "TempLayer",
      });
      assert(res && res.name === "TempLayer", "Layer creation mismatch");
      return res;
    });
    console.log(`       Created layer: ${layerRes.name}`);

    // 6. Rename Layer
    const renamedLayerRes = await testStep("Rename layer (ai_rename_layer)", async () => {
      const res = await callTool("ai_rename_layer", {
        currentName: "TempLayer",
        newName: "MADEL_Verification_Layer",
      });
      assert(res && res.name === "MADEL_Verification_Layer", "Layer rename mismatch");
      return res;
    });
    console.log(`       Renamed layer to: ${renamedLayerRes.name}`);

    // 7. Create Text Object
    const textRes = await testStep("Create text object (ai_create_text)", async () => {
      const res = await callTool("ai_create_text", {
        text: "MADEL Studio Bridge P25.5 Verified",
        x: 50,
        y: 220,
        fontSize: 22,
        fill: "#2ca02c",
        name: "MadelTitleText",
      });
      assert(res && res.name === "MadelTitleText", "Text creation mismatch");
      return res;
    });
    console.log(`       Created text frame: ${textRes.name}`);

    // 8. Extract Document Telemetry
    const docInfo = await testStep("Extract document telemetry (ai_get_document_info)", async () => {
      const res = await callTool("ai_get_document_info", {});
      assert(res && typeof res.colorMode === "string" && res.colorMode.includes("RGB"), "Document colorMode mismatch");
      assert(res.artboardsCount >= 1, "Expected at least 1 artboard");
      assert(res.pageItemsCount >= 3, `Expected at least 3 page items, got ${res.pageItemsCount}`);
      return res;
    });
    console.log(`       Document telemetry: ColorMode=${docInfo.colorMode}, PageItems=${docInfo.pageItemsCount}, Layers=${docInfo.layersCount}`);

    // 9. Save as Native .ai File
    const saveRes = await testStep("Save document as native .ai (ai_save_as)", async () => {
      const res = await callTool("ai_save_as", {
        path: AI_FILE_PATH,
        format: "ai",
        pdfCompatible: true,
      });
      assert(res && res.saved, "Expected saved: true");
      return res;
    });
    console.log(`       Saved .ai to: ${saveRes.path}`);

    // 10. Export .png Copy
    const pngRes = await testStep("Export document as PNG copy (ai_export_png)", async () => {
      const res = await callTool("ai_export_png", {
        path: PNG_FILE_PATH,
        scalePercent: 100,
        transparency: true,
      });
      assert(res && res.path, "Expected res.path");
      return res;
    });
    console.log(`       Exported PNG to: ${pngRes.path}`);

    // 11. Security Check: Destructive deletion without confirmation MUST be rejected
    await testStep("Safety check: ai_delete_object without confirm must be rejected", async () => {
      let threw = false;
      try {
        await callTool("ai_delete_object", {
          name: "MadelRect",
          confirm: false,
        });
      } catch (err) {
        threw = true;
        assert(err.message.includes("requires confirm: true"), `Unexpected error message: ${err.message}`);
      }
      assert(threw, "ai_delete_object without confirm should have thrown!");
    });

    // 12. Create temp shape and delete WITH confirmation
    await testStep("Execute confirmed deletion of temp object (ai_delete_object)", async () => {
      await callTool("ai_create_rectangle", {
        name: "TempTrashRect",
        x: 50,
        y: 300,
        width: 50,
        height: 50,
      });
      const delRes = await callTool("ai_delete_object", {
        name: "TempTrashRect",
        confirm: true,
      });
      assert(delRes && delRes.deleted, "Expected deleted: true");
    });

    // 13. Error Handling: Non-existent document index must throw
    await testStep("Error handling: invalid document index must return error", async () => {
      let threw = false;
      try {
        await callTool("ai_get_document_info", { documentIndex: 9999 });
      } catch (err) {
        threw = true;
      }
      assert(threw, "Invalid documentIndex should have thrown!");
    });

    // 14. Close document cleanly
    await testStep("Close document cleanly (ai_close_document)", async () => {
      const res = await callTool("ai_close_document", { save: false });
      assert(res && res.closed, "Expected closed: true");
    });

    // 15. Verify physical files on disk
    await testStep("Verify generated acceptance files exist on disk with valid size", async () => {
      assert(existsSync(AI_FILE_PATH), `Missing .ai file at ${AI_FILE_PATH}`);
      const aiStat = statSync(AI_FILE_PATH);
      assert(aiStat.size > 1000, `AI file size too small: ${aiStat.size} bytes`);

      assert(existsSync(PNG_FILE_PATH), `Missing .png file at ${PNG_FILE_PATH}`);
      const pngStat = statSync(PNG_FILE_PATH);
      assert(pngStat.size > 1000, `PNG file size too small: ${pngStat.size} bytes`);

      console.log(`\n       [DISK VERIFICATION SUCCESS]`);
      console.log(`       .ai:  ${AI_FILE_PATH} (${(aiStat.size / 1024).toFixed(1)} KB)`);
      console.log(`       .png: ${PNG_FILE_PATH} (${(pngStat.size / 1024).toFixed(1)} KB)`);
    });

  } finally {
    await bridge.close();
  }

  console.log("\n================================================================================");
  console.log(`  SUMMARY: ${passedTests}/${totalTests} steps passed (${failedTests} failed)`);
  console.log("================================================================================");
}

main().catch((err) => {
  console.error("\nFATAL ERROR in Illustrator Acceptance Test:", err);
  process.exit(1);
});
