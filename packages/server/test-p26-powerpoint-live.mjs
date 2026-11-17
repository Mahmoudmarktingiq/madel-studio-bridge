/**
 * MADEL Studio Bridge — Phase P26 Microsoft PowerPoint Live Acceptance Test
 * Developed and maintained by Mahmoud Adel
 *
 * Verifies real end-to-end automation of Microsoft PowerPoint via Windows COM:
 * 1. PowerPoint application discovery and COM registration
 * 2. PowerPoint application launch and connection (powerpoint_open_app)
 * 3. Blank presentation creation (powerpoint_create_presentation)
 * 4. Slide 1: Cover slide with Arabic RTL title, subtitle, and styled banner
 * 5. Slide 2: Architecture & capabilities with styled bilingual bullet points
 * 6. Slide 3: Visual vector shapes insertion (rectangle, oval, star) with fill colors
 * 7. Slide 4: Data table creation (4 rows x 3 columns) with bilingual matrix
 * 8. Slide 5: Summary slide with speaker notes (set_notes)
 * 9. Slide reordering and deletion testing (addSlide, moveSlide, deleteSlide)
 * 10. Presentation content inspection and slide reading (read_slides)
 * 11. High-resolution slide image export to PNG (export_slide_image)
 * 12. Full presentation export to PDF (export_pdf)
 * 13. PPTX persistence in D:\MCP\Office-Workspace\PowerPoint (save_presentation)
 * 14. Presentation close & reopen from disk (open_presentation)
 * 15. Graceful COM teardown (quit_app)
 */

import assert from "node:assert";
import { existsSync, statSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { PowerPointManager } from "./dist/office/powerpoint/powerpoint-manager.js";
import { OfficeWorkspaceManager } from "./dist/office/common/workspace.js";
import { OfficeDiscovery } from "./dist/office/common/discovery.js";

console.log("================================================================================");
console.log("=== MADEL STUDIO BRIDGE — PHASE P26 POWERPOINT LIVE ACCEPTANCE SUITE ===");
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
const targetPptx = join(workspace.powerPointDir, "madel_p26_presentation.pptx");
const targetPdf = join(workspace.exportsDir, "madel_p26_presentation.pdf");
const targetPng = join(workspace.exportsDir, "madel_p26_slide1_cover.png");

try {
  // Test 1: Discovery
  await runTest("1. Discover Microsoft PowerPoint Installation & COM Registration", async () => {
    const meta = await OfficeDiscovery.discoverApp("powerpoint");
    assert.ok(meta.installed, "Microsoft PowerPoint must be installed");
    assert.strictEqual(meta.status, "LIVE_VERIFIED", "Status should be LIVE_VERIFIED");
    assert.ok(meta.executablePath, "Executable path must be present");
    assert.strictEqual(meta.comProgId, "PowerPoint.Application");
    console.log(`       Detected PowerPoint at: ${meta.executablePath} (Version: ${meta.version})`);
  });

  // Test 2: Open PowerPoint App
  await runTest("2. Connect to / Launch PowerPoint via COM (powerpoint_open_app)", async () => {
    const appInfo = await PowerPointManager.openApp();
    assert.ok(appInfo.name.includes("PowerPoint"), "App name should contain PowerPoint");
    assert.ok(appInfo.version, "App version must be present");
    console.log(`       Connected to ${appInfo.name} v${appInfo.version}. Presentations: ${appInfo.presentationsCount}`);
  });

  // Test 3: Create Blank Presentation
  await runTest("3. Create Blank Presentation (powerpoint_create_presentation)", async () => {
    const presInfo = await PowerPointManager.createPresentation();
    assert.ok(presInfo.presentationName, "Presentation must have a name");
    assert.ok(presInfo.index >= 1, "Presentations count must be >= 1");
    console.log(`       Created presentation: ${presInfo.presentationName}`);
  });

  // Test 4: Slide 1 - Cover Slide with Arabic RTL Title & Subtitle
  await runTest("4. Add Slide 1: Cover Slide with Arabic RTL Typography", async () => {
    const slide1 = await PowerPointManager.addSlide(12); // ppLayoutBlank
    assert.strictEqual(slide1.slideIndex, 1, "Slide index should be 1");

    // Title
    const titleRes = await PowerPointManager.insertText(
      1,
      "منصة MADEL Studio Bridge الذكية — أتمتة PowerPoint",
      {
        left: 60,
        top: 80,
        width: 840,
        height: 90,
        fontName: "Segoe UI",
        fontSize: 32,
        bold: true,
        colorRgb: 0x1B365D, // Deep Navy
        align: "center",
        isRtl: true,
      },
    );
    assert.ok(titleRes.success, "Title insertion must succeed");

    // Subtitle
    const subRes = await PowerPointManager.insertText(
      1,
      "حلول التحكم المكتبي عبر بروتوكول MCP وبيئة Windows COM — تطوير محمود عادل",
      {
        left: 80,
        top: 190,
        width: 800,
        height: 60,
        fontName: "Segoe UI",
        fontSize: 18,
        colorRgb: 0x555555,
        align: "center",
        isRtl: true,
      },
    );
    assert.ok(subRes.success, "Subtitle insertion must succeed");
    console.log("       Configured Arabic title & subtitle on Slide 1");
  });

  // Test 5: Slide 2 - Architecture & Feature Highlights
  await runTest("5. Add Slide 2: Multilingual Capabilities & Architecture", async () => {
    const slide2 = await PowerPointManager.addSlide(12);
    assert.strictEqual(slide2.slideIndex, 2, "Slide index should be 2");

    await PowerPointManager.insertText(2, "الميزات الرئيسية والهندسة المعمارية (Key Features)", {
      left: 50,
      top: 40,
      width: 860,
      height: 50,
      fontName: "Segoe UI",
      fontSize: 24,
      bold: true,
      colorRgb: 0x004080,
      align: "right",
      isRtl: true,
    });

    const bodyText =
      "1. أتمتة حقيقية لتطبيقات Office الثلاثة (Word, Excel, PowerPoint) دون نوافذ منبثقة.\n" +
      "2. دعم كامل للغة العربية والاتجاه من اليمين إلى اليسار (RTL) والترميز الموحد UTF-8.\n" +
      "3. معالجة العمليات الحسابية والرسوم البيانية وتصدير المستندات إلى PDF وصور عالية الدقة.\n" +
      "4. عزلة أمنية صارمة داخل المجلد المعتمد D:\\MCP\\Office-Workspace مع حماية Approval Gate.";

    await PowerPointManager.insertText(2, bodyText, {
      left: 60,
      top: 120,
      width: 840,
      height: 300,
      fontName: "Segoe UI",
      fontSize: 16,
      align: "right",
      isRtl: true,
    });
    console.log("       Configured bilingual architecture notes on Slide 2");
  });

  // Test 6: Slide 3 - Vector Shapes & Coloring
  await runTest("6. Add Slide 3: Insert Vector Shapes (Rectangle, Oval, Star)", async () => {
    const slide3 = await PowerPointManager.addSlide(12);
    assert.strictEqual(slide3.slideIndex, 3, "Slide index should be 3");

    await PowerPointManager.insertText(3, "مخطط الأشكال التوضيحية (Vector Architecture Shapes)", {
      left: 50,
      top: 30,
      width: 860,
      height: 40,
      fontName: "Segoe UI",
      fontSize: 22,
      bold: true,
      colorRgb: 0x003366,
      align: "center",
      isRtl: true,
    });

    // Rectangle
    const rect = await PowerPointManager.insertShape(3, "rectangle", {
      left: 80,
      top: 120,
      width: 200,
      height: 120,
      fillColorRgb: 0xE6F0FA,
      lineColorRgb: 0x0055A5,
      text: "Word Manager\n(COM Automation)",
    });
    assert.ok(rect.success, "Rectangle shape insertion must succeed");

    // Oval
    const oval = await PowerPointManager.insertShape(3, "oval", {
      left: 360,
      top: 120,
      width: 200,
      height: 120,
      fillColorRgb: 0xE8F8E8,
      lineColorRgb: 0x2E7D32,
      text: "Excel Manager\n(Data & Formulas)",
    });
    assert.ok(oval.success, "Oval shape insertion must succeed");

    // Star
    const star = await PowerPointManager.insertShape(3, "star", {
      left: 640,
      top: 100,
      width: 200,
      height: 160,
      fillColorRgb: 0xFFF9E6,
      lineColorRgb: 0xF57F17,
      text: "PowerPoint\n(Presentations)",
    });
    assert.ok(star.success, "Star shape insertion must succeed");
    console.log("       Configured 3 vector shapes on Slide 3");
  });

  // Test 7: Slide 4 - Matrix / Table Insertion
  await runTest("7. Add Slide 4: Data Table Creation (4 rows x 3 cols)", async () => {
    const slide4 = await PowerPointManager.addSlide(12);
    assert.strictEqual(slide4.slideIndex, 4, "Slide index should be 4");

    await PowerPointManager.insertText(4, "جدول مقارنة إمكانيات أتمتة MADEL Office Bridge", {
      left: 50,
      top: 30,
      width: 860,
      height: 40,
      fontName: "Segoe UI",
      fontSize: 22,
      bold: true,
      colorRgb: 0x1A237E,
      align: "center",
      isRtl: true,
    });

    const tableData = [
      ["التطبيق (App)", "أدوات MCP المتاحة", "حالة القبول (Acceptance)"],
      ["Microsoft Word", "17 Tools (Formatting, Tables, PDF)", "LIVE_VERIFIED"],
      ["Microsoft Excel", "17 Tools (Cells, Formulas, Charts)", "LIVE_VERIFIED"],
      ["Microsoft PowerPoint", "17 Tools (Slides, Shapes, PNG)", "LIVE_VERIFIED"],
    ];

    const tblRes = await PowerPointManager.insertTable(4, 4, 3, tableData, {
      left: 80,
      top: 110,
      width: 800,
      height: 240,
    });
    assert.ok(tblRes.success, "Table insertion must succeed");
    console.log("       Created 4x3 comparison table on Slide 4");
  });

  // Test 8: Slide 5 - Summary & Speaker Notes
  await runTest("8. Add Slide 5: Summary & Speaker Notes (set_notes)", async () => {
    const slide5 = await PowerPointManager.addSlide(12);
    assert.strictEqual(slide5.slideIndex, 5, "Slide index should be 5");

    await PowerPointManager.insertText(5, "خاتمة التقرير واعتماد المرحلة P26", {
      left: 50,
      top: 50,
      width: 860,
      height: 40,
      fontName: "Segoe UI",
      fontSize: 24,
      bold: true,
      colorRgb: 0x0D47A1,
      align: "center",
      isRtl: true,
    });

    await PowerPointManager.insertText(
      5,
      "تم بنجاح ربط وتشغيل برامج Microsoft Office الثلاثة عبر MADEL Studio Bridge.\n" +
      "النظام جاهز للاستخدام التشغيلي والإنتاجي وفق أعلى معايير الأمان والاستقرار.",
      {
        left: 80,
        top: 150,
        width: 800,
        height: 100,
        fontName: "Segoe UI",
        fontSize: 18,
        align: "center",
        isRtl: true,
      },
    );

    const notesText = "ملاحظات المحاضر: تم إنشاء هذا العرض التقديمي واختبار كافة عناصره آلياً عبر جسر MADEL Studio Bridge.";
    const notesRes = await PowerPointManager.setNotes(5, notesText);
    assert.ok(notesRes.success, "Setting speaker notes must succeed");
    console.log("       Set speaker notes on Slide 5");
  });

  // Test 9: Slide Manipulation (Add temporary, move, delete)
  await runTest("9. Slide Lifecycle: Add Temporary Slide, Move, and Delete (addSlide, moveSlide, deleteSlide)", async () => {
    // Add slide 6
    const tempSlide = await PowerPointManager.addSlide(12);
    assert.strictEqual(tempSlide.totalSlides, 6, "Total slides should now be 6");

    // Move slide 6 to position 2
    const moveRes = await PowerPointManager.moveSlide(6, 2);
    assert.ok(moveRes.success, "Move slide must succeed");

    // Delete slide at position 2
    const delRes = await PowerPointManager.deleteSlide(2);
    assert.ok(delRes.success, "Delete slide must succeed");
    assert.strictEqual(delRes.remainingSlides, 5, "Remaining slides should be 5");
    console.log("       Verified dynamic slide addition, repositioning, and deletion");
  });

  // Test 10: Read Slides
  await runTest("10. Read Slides & Metadata (powerpoint_read_slides)", async () => {
    const slidesData = await PowerPointManager.readSlides();
    assert.strictEqual(slidesData.slidesCount, 5, "Total slides count should be 5");
    assert.ok(slidesData.slides.length === 5, "Slide array length should be 5");

    // Check slide 5 notes
    const slide5 = slidesData.slides[4];
    assert.ok(slide5.notes.includes("ملاحظات المحاضر"), "Slide 5 notes must contain Arabic text");
    console.log(`       Verified 5 slides. Slide 5 notes length: ${slide5.notes.length} characters`);
  });

  // Test 11: Export Slide 1 to PNG Image
  await runTest("11. Export High-Res Slide 1 Image (powerpoint_export_slide_image)", async () => {
    const imgRes = await PowerPointManager.exportSlideImage(1, targetPng, 1920, 1080);
    assert.ok(existsSync(targetPng), "Exported PNG file must exist on disk");
    assert.ok(imgRes.sizeBytes > 5000, `Exported PNG size should be substantial (>5KB), got ${imgRes.sizeBytes}`);
    console.log(`       Exported Slide 1 PNG: ${targetPng} (${imgRes.sizeBytes} bytes)`);
  });

  // Test 12: Export Entire Presentation to PDF
  await runTest("12. Export Presentation to PDF (powerpoint_export_pdf)", async () => {
    const pdfRes = await PowerPointManager.exportPdf(targetPdf);
    assert.ok(existsSync(targetPdf), "Exported PDF file must exist on disk");
    assert.ok(pdfRes.sizeBytes > 10000, `Exported PDF size should be > 10KB, got ${pdfRes.sizeBytes}`);

    // Verify PDF header magic bytes
    const buf = readFileSync(targetPdf);
    assert.strictEqual(buf.subarray(0, 4).toString("ascii"), "%PDF", "PDF must begin with %PDF magic header");
    console.log(`       Exported PDF: ${targetPdf} (${pdfRes.sizeBytes} bytes)`);
  });

  // Test 13: Save Presentation to PPTX
  await runTest("13. Save Presentation to PPTX (powerpoint_save_presentation)", async () => {
    const saveRes = await PowerPointManager.savePresentation(targetPptx);
    assert.ok(existsSync(targetPptx), "Saved PPTX file must exist on disk");
    assert.ok(saveRes.sizeBytes > 10000, `Saved PPTX size should be > 10KB, got ${saveRes.sizeBytes}`);
    console.log(`       Saved presentation: ${targetPptx} (${saveRes.sizeBytes} bytes)`);
  });

  // Test 14: Close Presentation
  await runTest("14. Close Active Presentation (powerpoint_close_presentation)", async () => {
    const closeRes = await PowerPointManager.closePresentation();
    assert.ok(closeRes.success, "Close presentation must succeed");
    assert.strictEqual(closeRes.closed, true, "Presentation should be marked as closed");
    console.log("       Active presentation closed safely");
  });

  // Test 15: Reopen Presentation from Disk
  await runTest("15. Reopen PPTX from Disk & Verify Slide Count (powerpoint_open_presentation)", async () => {
    const openRes = await PowerPointManager.openPresentation(targetPptx);
    assert.strictEqual(openRes.slidesCount, 5, "Reopened presentation must have 5 slides");
    assert.ok(openRes.path.includes("madel_p26_presentation.pptx"), "Reopened path must match target");
    console.log(`       Successfully reopened ${openRes.name} with ${openRes.slidesCount} slides`);
  });

  // Test 16: Close and Quit
  await runTest("16. Close Presentation and Quit PowerPoint Gracefully (powerpoint_quit_app)", async () => {
    await PowerPointManager.closePresentation();
    const quitRes = await PowerPointManager.quitApp();
    assert.ok(quitRes.success, "Quit app must succeed");
    console.log("       PowerPoint worker stopped gracefully");
  });

  console.log("\n================================================================================");
  console.log(">>> ALL 16 POWERPOINT LIVE ACCEPTANCE TESTS PASSED (100% GREEN) <<<");
  console.log("================================================================================");
} catch (error) {
  console.error("\n>>> TEST SUITE TERMINATED WITH ERRORS <<<");
  try {
    await PowerPointManager.quitApp();
  } catch {}
  process.exit(1);
}
