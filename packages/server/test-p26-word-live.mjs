/**
 * MADEL Studio Bridge — Phase P26 Microsoft Word Live Acceptance Test
 * Developed and maintained by Mahmoud Adel
 *
 * Verifies real end-to-end automation of Microsoft Word via Windows COM:
 * 1. Word application launch and connection
 * 2. Document creation
 * 3. Page setup (A4 paper, custom margins)
 * 4. Header & footer configuration
 * 5. Arabic RTL heading insertion (Heading 1)
 * 6. Multilingual text writing with typography styling and Arabic RTL
 * 7. Formatted table creation with headers and data rows
 * 8. Search and replace across document content
 * 9. Content extraction and reading (paragraphs, word count, character count)
 * 10. DOCX file persistence in D:\MCP\Office-Workspace\Word
 * 11. PDF export in D:\MCP\Office-Workspace\Exports
 * 12. Safe close and document reopening from disk
 * 13. Graceful application teardown
 */

import assert from "node:assert";
import { existsSync, statSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { WordManager } from "./dist/office/word/word-manager.js";
import { OfficeWorkspaceManager } from "./dist/office/common/workspace.js";
import { OfficeDiscovery } from "./dist/office/common/discovery.js";

console.log("================================================================================");
console.log("=== MADEL STUDIO BRIDGE — PHASE P26 MICROSOFT WORD LIVE ACCEPTANCE SUITE ===");
console.log("================================================================================");
console.log(`Platform: ${process.platform} (${process.arch})`);

async function runTest(name, fn) {
  const t0 = Date.now();
  try {
    await fn();
    console.log(`[PASS] ${name} (${Date.now() - t0} ms)`);
  } catch (err) {
    console.error(`[FAIL] ${name} (${Date.now() - t0} ms)`);
    console.error(err);
    throw err;
  }
}

const workspace = OfficeWorkspaceManager.ensureWorkspace();
const targetDocx = join(workspace.wordDir, "madel_p26_arabic_acceptance.docx");
const targetPdf = join(workspace.exportsDir, "madel_p26_arabic_acceptance.pdf");

try {
  // Test 1: Discovery
  await runTest("1. Discover Microsoft Word Installation & COM Registration", async () => {
    const meta = await OfficeDiscovery.discoverApp("word");
    assert.ok(meta.installed, "Microsoft Word must be installed");
    assert.strictEqual(meta.status, "LIVE_VERIFIED", "Status should be LIVE_VERIFIED");
    assert.ok(meta.executablePath, "Executable path must be present");
    assert.strictEqual(meta.comProgId, "Word.Application");
    console.log(`       Detected Word at: ${meta.executablePath} (Version: ${meta.version})`);
  });

  // Test 2: Open Word App
  await runTest("2. Connect to / Launch Word via COM (word_open_app)", async () => {
    const appInfo = await WordManager.openApp();
    assert.ok(appInfo.name.includes("Word"), "App name should contain Word");
    assert.ok(appInfo.version, "App version must be present");
    console.log(`       Connected to ${appInfo.name} v${appInfo.version}. Documents: ${appInfo.documentsCount}`);
  });

  // Test 3: Create Document
  await runTest("3. Create Blank Document (word_create_document)", async () => {
    const docInfo = await WordManager.createDocument();
    assert.ok(docInfo.documentName, "Document must have a name");
    assert.ok(docInfo.index >= 1, "Documents count must be >= 1");
    console.log(`       Created new document: ${docInfo.documentName}`);
  });

  // Test 4: Page Setup
  await runTest("4. Configure Page Setup: A4, Margins (word_set_page_setup)", async () => {
    const res = await WordManager.setPageSetup({
      paperSize: "A4",
      orientation: "portrait",
      topMarginPoints: 54, // 0.75 in
      bottomMarginPoints: 54,
      leftMarginPoints: 54,
      rightMarginPoints: 54,
    });
    assert.ok(res.success, "Page setup must succeed");
    console.log("       Page setup configured: A4 portrait with 54pt margins.");
  });

  // Test 5: Header and Footer
  await runTest("5. Configure Header & Footer (word_set_header_footer)", async () => {
    const res = await WordManager.setHeaderFooter({
      headerText: "MADEL Studio Bridge — Phase P26 Office Integration",
      footerText: "سري للغاية — وثيقة اختبار القبول الميداني المعتمدة",
    });
    assert.ok(res.success, "Header and footer must succeed");
    console.log("       Header and Footer configured with bilingual titles.");
  });

  // Test 6: Insert Arabic Heading 1 with RTL
  await runTest("6. Insert Arabic Heading 1 with RTL Direction (word_insert_heading)", async () => {
    const res = await WordManager.insertHeading(
      "تقرير القبول الميداني لنظام MADEL Studio Bridge — الإصدار المكتبي 2026",
      1,
      true, // RTL
    );
    assert.ok(res.success, "Heading insertion must succeed");
    assert.strictEqual(res.level, 1);
    console.log("       Inserted Arabic Heading 1 with RTL reading order.");
  });

  // Test 7: Write Multilingual Text with Styling
  await runTest("7. Write Styled Text & Arabic Paragraphs (word_write_text)", async () => {
    // English overview
    await WordManager.writeText("1. Executive Summary & Architecture Overview:", {
      bold: true,
      fontSize: 14,
      fontName: "Calibri",
      colorRgb: 0x1f497d,
      isRtl: false,
    });
    await WordManager.writeText(
      "This document was generated automatically by MADEL Studio Bridge using direct Windows COM automation. All text, styles, tables, and structures were verified inside Microsoft Word 2016+.",
      {
        bold: false,
        fontSize: 11,
        fontName: "Calibri",
        isRtl: false,
      },
    );

    // Arabic detailed section
    await WordManager.writeText("2. تفاصيل المعمارية والتكامل الهندسي المعتمد:", {
      bold: true,
      fontSize: 14,
      fontName: "Traditional Arabic",
      colorRgb: 0x1f497d,
      isRtl: true,
      align: "right",
    });
    await WordManager.writeText(
      "تم بناء جسر MADEL Studio Bridge ليوفر تحكماً شاملاً وسلساً في حزمة Microsoft Office دون الحاجة إلى تدخل يدوي. يدعم النظام اتجاه الكتابة من اليمين إلى اليسار (RTL) بشكل أصيل مع التنسيق الجداول والأشكال والألوان بدقة بكسلية.",
      {
        bold: false,
        fontSize: 12,
        fontName: "Traditional Arabic",
        isRtl: true,
        align: "right",
      },
    );
    console.log("       Wrote bilingual paragraphs with custom fonts and colors.");
  });

  // Test 8: Create Formatted Table
  await runTest("8. Create and Populate Data Table (word_create_table)", async () => {
    const headers = ["المكون البرمجي", "المحول (Adapter)", "الحالة", "عدد الأدوات"];
    const data = [
      ["Microsoft Word", "Windows COM (Word.Application)", "LIVE_VERIFIED", "17 Tools"],
      ["Microsoft Excel", "Windows COM (Excel.Application)", "LIVE_VERIFIED", "17 Tools"],
      ["Microsoft PowerPoint", "Windows COM (PowerPoint.Application)", "LIVE_VERIFIED", "17 Tools"],
      ["Browser Automation", "Chrome DevTools Protocol (CDP)", "LIVE_VERIFIED", "52 Tools"],
    ];

    const tableRes = await WordManager.createTable(5, 4, data, headers);
    assert.ok(tableRes.success, "Table creation must succeed");
    assert.strictEqual(tableRes.rows, 5);
    assert.strictEqual(tableRes.cols, 4);
    console.log(`       Created ${tableRes.rows}x${tableRes.cols} table populated with matrix data.`);
  });

  // Test 9: Search and Replace
  await runTest("9. Search and Replace Document Text (word_search_replace)", async () => {
    await WordManager.writeText("Target text to be replaced: TEMPORARY_PLACEHOLDER_CODE", { isRtl: false });
    const replaceRes = await WordManager.searchReplace("TEMPORARY_PLACEHOLDER_CODE", "MADEL-OFFICE-VERIFIED-2026");
    assert.ok(replaceRes.success, "Search and replace must succeed");
    console.log("       Executed search and replace successfully.");
  });

  // Test 10: Read Document Content
  await runTest("10. Read Content & Verify Paragraphs (word_read_document)", async () => {
    const docData = await WordManager.readDocument();
    assert.ok(docData.paragraphsCount >= 6, `Expected >= 6 paragraphs, got ${docData.paragraphsCount}`);
    assert.ok(docData.wordsCount >= 50, `Expected >= 50 words, got ${docData.wordsCount}`);
    assert.ok(docData.text.includes("MADEL-OFFICE-VERIFIED-2026"), "Replaced text must exist in document content");
    assert.ok(docData.text.includes("Executive Summary"), "English text must be present");
    assert.ok(docData.text.includes("المعمارية والتكامل الهندسي"), "Arabic text must be present");
    console.log(`       Verified document content: ${docData.paragraphsCount} paragraphs, ${docData.wordsCount} words.`);
  });

  // Test 11: Save DOCX File
  await runTest("11. Save DOCX File to Disk (word_save_document)", async () => {
    const saveRes = await WordManager.saveDocument(targetDocx);
    assert.ok(saveRes.savedPath, "Saved path must be returned");
    assert.ok(existsSync(targetDocx), `File must exist at ${targetDocx}`);
    const stat = statSync(targetDocx);
    assert.ok(stat.size > 5000, `DOCX size must be > 5KB, got ${stat.size} bytes`);
    console.log(`       Saved DOCX file: ${saveRes.savedPath} (${stat.size} bytes)`);
  });

  // Test 12: Export to PDF
  await runTest("12. Export Document to PDF (word_export_pdf)", async () => {
    const pdfRes = await WordManager.exportPdf(targetPdf);
    assert.ok(pdfRes.pdfPath, "PDF path must be returned");
    assert.ok(existsSync(targetPdf), `PDF must exist at ${targetPdf}`);
    const stat = statSync(targetPdf);
    assert.ok(stat.size > 10000, `PDF size must be > 10KB, got ${stat.size} bytes`);

    // Verify PDF header magic bytes %PDF
    const buffer = readFileSync(targetPdf);
    const header = buffer.subarray(0, 4).toString("utf8");
    assert.strictEqual(header, "%PDF", "PDF magic bytes must match %PDF");
    console.log(`       Exported PDF: ${pdfRes.pdfPath} (${stat.size} bytes, verified %PDF magic header)`);
  });

  // Test 13: Close Document
  await runTest("13. Safe Close Active Document (word_close_document)", async () => {
    const closeRes = await WordManager.closeDocument(false);
    assert.ok(closeRes.success, "Close document must succeed");
    assert.strictEqual(closeRes.closed, true);
    console.log("       Closed document safely without prompts.");
  });

  // Test 14: Re-open Saved Document
  await runTest("14. Reopen Saved DOCX & Validate Persistence (word_open_document)", async () => {
    const openRes = await WordManager.openDocument(targetDocx);
    assert.ok(openRes.documentName, "Document must have a name");
    const docData = await WordManager.readDocument();
    assert.ok(docData.text.includes("MADEL-OFFICE-VERIFIED-2026"), "Saved text must be persistent after reopen");
    console.log(`       Reopened ${openRes.documentName} and confirmed persistence.`);
    await WordManager.closeDocument(false);
  });

  // Test 15: Graceful Teardown
  await runTest("15. Clean Application Teardown (word_quit_app)", async () => {
    await WordManager.quitApp();
    console.log("       Word COM worker stopped cleanly.");
  });

  console.log("\n================================================================================");
  console.log("=== ALL 15 WORD ACCEPTANCE TESTS PASSED (100% GREEN) ===");
  console.log("================================================================================\n");
} catch (err) {
  console.error("\n[FATAL] Word Acceptance test suite failed!");
  try {
    await WordManager.quitApp();
  } catch {}
  process.exit(1);
}
