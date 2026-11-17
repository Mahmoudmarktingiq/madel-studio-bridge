/**
 * MADEL Studio Bridge — Phase P26 Microsoft Excel Live Acceptance Test
 * Developed and maintained by Mahmoud Adel
 *
 * Verifies real end-to-end automation of Microsoft Excel via Windows COM:
 * 1. Discover Excel installation & COM registration
 * 2. Launch / connect to Excel via COM (excel_open_app)
 * 3. Create workbook with multiple sheets (excel_create_workbook)
 * 4. Write tabular data matrix (excel_write_cells)
 * 5. Set formula calculations: Subtotals, SUM, AVERAGE (excel_set_formula)
 * 6. Read evaluated calculation results inside Excel (excel_get_calculation_result)
 * 7. Format cells: Typography, fill colors, borders, currency format (excel_format_range)
 * 8. Sort range by revenue descending (excel_sort_range)
 * 9. Apply AutoFilter (excel_filter_range)
 * 10. Generate embedded Column Chart (excel_create_chart)
 * 11. Manage rows and columns: Autofit, row height (excel_manage_rows_cols)
 * 12. Search and replace worksheet content (excel_search_replace)
 * 13. Read range values and formulas (excel_read_range)
 * 14. Save XLSX to D:\MCP\Office-Workspace\Excel (excel_save_workbook)
 * 15. Export PDF to D:\MCP\Office-Workspace\Exports (excel_export_pdf)
 * 16. Reopen workbook and verify persistence (excel_open_workbook)
 * 17. Safe close and clean teardown (excel_close_workbook, excel_quit_app)
 */

import assert from "node:assert";
import { existsSync, statSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { ExcelManager } from "./dist/office/excel/excel-manager.js";
import { OfficeWorkspaceManager } from "./dist/office/common/workspace.js";
import { OfficeDiscovery } from "./dist/office/common/discovery.js";

console.log("================================================================================");
console.log("=== MADEL STUDIO BRIDGE — PHASE P26 MICROSOFT EXCEL LIVE ACCEPTANCE SUITE ===");
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
const targetXlsx = join(workspace.excelDir, "madel_p26_sales_model.xlsx");
const targetPdf = join(workspace.exportsDir, "madel_p26_sales_model.pdf");

try {
  // Test 1: Discovery
  await runTest("1. Discover Microsoft Excel Installation & COM Registration", async () => {
    const meta = await OfficeDiscovery.discoverApp("excel");
    assert.ok(meta.installed, "Microsoft Excel must be installed");
    assert.strictEqual(meta.status, "LIVE_VERIFIED");
    assert.ok(meta.executablePath, "Executable path must be present");
    assert.strictEqual(meta.comProgId, "Excel.Application");
    console.log(`       Detected Excel at: ${meta.executablePath} (Version: ${meta.version})`);
  });

  // Test 2: Open Excel App
  await runTest("2. Connect to / Launch Excel via COM (excel_open_app)", async () => {
    const appInfo = await ExcelManager.openApp();
    assert.ok(appInfo.name.includes("Excel"), "App name should contain Excel");
    assert.ok(appInfo.version, "App version must be present");
    console.log(`       Connected to ${appInfo.name} v${appInfo.version}. Workbooks: ${appInfo.workbooksCount}`);
  });

  // Test 3: Create Workbook with Multiple Sheets
  await runTest("3. Create Workbook with Custom Sheets (excel_create_workbook)", async () => {
    const sheetNames = ["Sales_Q1", "Summary", "Analytics"];
    const wbInfo = await ExcelManager.createWorkbook(sheetNames);
    assert.ok(wbInfo.workbookName, "Workbook must have a name");
    for (const name of sheetNames) {
      assert.ok(wbInfo.sheets.includes(name), `Workbook should include sheet: ${name}`);
    }
    console.log(`       Created workbook: ${wbInfo.workbookName} with sheets: [${wbInfo.sheets.join(", ")}]`);
  });

  // Test 4: Write Data Table Matrix
  await runTest("4. Populate Data Table Matrix (excel_write_cells)", async () => {
    const tableData = [
      ["Product Name", "Units Sold", "Unit Price", "Total Revenue"],
      ["MADEL Bridge Pro", 120, 250, "=B2*C2"],
      ["Adobe Adapter Suite", 85, 180, "=B3*C3"],
      ["Browser Automation Core", 210, 95, "=B4*C4"],
      ["Office COM Engine", 150, 140, "=B5*C5"],
    ];

    const writeRes = await ExcelManager.writeCells("A1", tableData, "Sales_Q1");
    assert.ok(writeRes.success, "Write cells must succeed");
    assert.strictEqual(writeRes.writtenRows, 5);
    assert.strictEqual(writeRes.writtenCols, 4);
    console.log(`       Populated 5 rows x 4 columns starting at A1 in 'Sales_Q1'.`);
  });

  // Test 5: Set Formulas (SUM & AVERAGE)
  await runTest("5. Set Calculation Formulas for Totals & Averages (excel_set_formula)", async () => {
    // Total label and formula
    await ExcelManager.writeCells("C6", [["Total:"]], "Sales_Q1");
    const sumRes = await ExcelManager.setFormula("D6", "=SUM(D2:D5)", "Sales_Q1");
    assert.ok(sumRes.success, "SUM formula must succeed");

    // Average label and formula
    await ExcelManager.writeCells("C7", [["Average:"]], "Sales_Q1");
    const avgRes = await ExcelManager.setFormula("D7", "=AVERAGE(D2:D5)", "Sales_Q1");
    assert.ok(avgRes.success, "AVERAGE formula must succeed");

    console.log(`       Formulas set: D6 = ${sumRes.formula}, D7 = ${avgRes.formula}`);
  });

  // Test 6: Verify Evaluation Results inside Excel
  await runTest("6. Verify Real Calculated Numerical Results inside Excel (excel_get_calculation_result)", async () => {
    // Expected values:
    // Row 2: 120 * 250 = 30000
    // Row 3: 85 * 180 = 15300
    // Row 4: 210 * 95 = 19950
    // Row 5: 150 * 140 = 21000
    // SUM: 30000 + 15300 + 19950 + 21000 = 86250
    // AVERAGE: 86250 / 4 = 21562.5

    const r2 = await ExcelManager.getCalculationResult("D2", "Sales_Q1");
    assert.strictEqual(Number(r2.calculatedValue), 30000, "D2 calculation must equal 30,000");

    const r3 = await ExcelManager.getCalculationResult("D3", "Sales_Q1");
    assert.strictEqual(Number(r3.calculatedValue), 15300, "D3 calculation must equal 15,300");

    const sumVal = await ExcelManager.getCalculationResult("D6", "Sales_Q1");
    assert.strictEqual(Number(sumVal.calculatedValue), 86250, "SUM(D2:D5) must evaluate exactly to 86,250 inside Excel");

    const avgVal = await ExcelManager.getCalculationResult("D7", "Sales_Q1");
    assert.strictEqual(Number(avgVal.calculatedValue), 21562.5, "AVERAGE(D2:D5) must evaluate exactly to 21,562.5 inside Excel");

    console.log(`       Verified exact numerical formula results inside Excel:`);
    console.log(`       - Row 2 (120 * $250): ${r2.calculatedValue}`);
    console.log(`       - Row 3 (85 * $180): ${r3.calculatedValue}`);
    console.log(`       - Total SUM(D2:D5): ${sumVal.calculatedValue}`);
    console.log(`       - Total AVERAGE(D2:D5): ${avgVal.calculatedValue}`);
  });

  // Test 7: Format Range (Typography, Fill Colors, Borders, Currency)
  await runTest("7. Format Table Range & Numbers (excel_format_range)", async () => {
    // Header format
    await ExcelManager.formatRange(
      "A1:D1",
      {
        bold: true,
        fillColorRgb: 0xd9e1f2, // Soft blue
        fontColorRgb: 0x1f497d,
        horizontalAlign: "center",
        borders: true,
      },
      "Sales_Q1",
    );

    // Number formats on Unit Price and Revenue
    await ExcelManager.formatRange(
      "C2:D7",
      {
        numberFormat: "$#,##0.00",
        borders: true,
      },
      "Sales_Q1",
    );

    // Summary totals bold
    await ExcelManager.formatRange(
      "C6:D7",
      {
        bold: true,
        fillColorRgb: 0xf2f2f2,
      },
      "Sales_Q1",
    );

    console.log("       Formatted headers, grid borders, and currency styling ($#,##0.00).");
  });

  // Test 8: Sort Range
  await runTest("8. Sort Data Range by Revenue Descending (excel_sort_range)", async () => {
    const sortRes = await ExcelManager.sortRange("A1:D5", 4, true, true, "Sales_Q1");
    assert.ok(sortRes.success, "Sort must succeed");

    // After sort descending by revenue:
    // First product should be MADEL Bridge Pro (Revenue 30000)
    const topProd = await ExcelManager.getCalculationResult("A2", "Sales_Q1");
    assert.strictEqual(topProd.text, "MADEL Bridge Pro", "Top product by revenue must be MADEL Bridge Pro");
    console.log(`       Sorted data range: top revenue item is '${topProd.text}'.`);
  });

  // Test 9: Apply AutoFilter
  await runTest("9. Apply AutoFilter on Table (excel_filter_range)", async () => {
    const filterRes = await ExcelManager.filterRange("A1:D5", 1, undefined, "Sales_Q1");
    assert.ok(filterRes.success, "Filter must succeed");
    console.log("       Applied AutoFilter to table headers.");
  });

  // Test 10: Create Embedded Column Chart
  await runTest("10. Generate Embedded Clustered Column Chart (excel_create_chart)", async () => {
    const chartRes = await ExcelManager.createChart(
      "A1:B5", // Product vs Units Sold
      {
        chartType: "column",
        title: "Q1 Product Sales Volume",
        left: 280,
        top: 20,
        width: 480,
        height: 280,
      },
      "Sales_Q1",
    );
    assert.ok(chartRes.success, "Chart creation must succeed");
    assert.strictEqual(chartRes.chartTitle, "Q1 Product Sales Volume");
    console.log(`       Created chart: '${chartRes.chartTitle}' positioned on 'Sales_Q1'.`);
  });

  // Test 11: Manage Rows and Columns
  await runTest("11. Autofit Columns and Set Row Dimensions (excel_manage_rows_cols)", async () => {
    // Autofit column A, B, C, D
    for (let c = 1; c <= 4; c++) {
      await ExcelManager.manageRowsCols("autofit", c, { isColumn: true }, "Sales_Q1");
    }
    // Set header row height to 25
    await ExcelManager.manageRowsCols("set_size", 1, { size: 25, isColumn: false }, "Sales_Q1");
    console.log("       Autofitted columns A-D and set header row height to 25pt.");
  });

  // Test 12: Search and Replace
  await runTest("12. Search and Replace Worksheet Text (excel_search_replace)", async () => {
    await ExcelManager.writeCells("A10", [["TEMP_MARKER_CODE"]], "Sales_Q1");
    const repRes = await ExcelManager.searchReplace("TEMP_MARKER_CODE", "MADEL_EXCEL_VERIFIED", "Sales_Q1");
    assert.ok(repRes.success, "Search and replace must succeed");

    const checkCell = await ExcelManager.getCalculationResult("A10", "Sales_Q1");
    assert.strictEqual(checkCell.text, "MADEL_EXCEL_VERIFIED", "Cell A10 must reflect replaced text");
    console.log("       Search and replace executed and verified in cell A10.");
  });

  // Test 13: Read Range Values and Formulas
  await runTest("13. Read Full Range Matrix & Formulas (excel_read_range)", async () => {
    const rangeData = await ExcelManager.readRange("A1:D5", "Sales_Q1");
    assert.strictEqual(rangeData.rows, 5);
    assert.strictEqual(rangeData.cols, 4);
    assert.ok(rangeData.values.length === 5);
    assert.strictEqual(rangeData.values[0][0], "Product Name");
    console.log(`       Read range A1:D5 (${rangeData.rows}x${rangeData.cols}) with exact formulas.`);
  });

  // Test 14: Save Workbook (XLSX)
  await runTest("14. Save XLSX Workbook to Disk (excel_save_workbook)", async () => {
    const saveRes = await ExcelManager.saveWorkbook(targetXlsx);
    assert.ok(saveRes.savedPath, "Saved path must be returned");
    assert.ok(existsSync(targetXlsx), `Workbook must exist at ${targetXlsx}`);
    const stat = statSync(targetXlsx);
    assert.ok(stat.size > 5000, `XLSX size must be > 5KB, got ${stat.size} bytes`);
    console.log(`       Saved XLSX workbook: ${saveRes.savedPath} (${stat.size} bytes)`);
  });

  // Test 15: Export PDF
  await runTest("15. Export Workbook / Sheet to PDF (excel_export_pdf)", async () => {
    const pdfRes = await ExcelManager.exportPdf(targetPdf);
    assert.ok(pdfRes.pdfPath, "PDF path must be returned");
    assert.ok(existsSync(targetPdf), `PDF must exist at ${targetPdf}`);
    const stat = statSync(targetPdf);
    assert.ok(stat.size > 10000, `PDF size must be > 10KB, got ${stat.size} bytes`);

    const buffer = readFileSync(targetPdf);
    const header = buffer.subarray(0, 4).toString("utf8");
    assert.strictEqual(header, "%PDF", "PDF magic bytes must match %PDF");
    console.log(`       Exported PDF: ${pdfRes.pdfPath} (${stat.size} bytes, verified %PDF magic header)`);
  });

  // Test 16: Close and Reopen
  await runTest("16. Reopen Saved Workbook & Confirm Persistence (excel_open_workbook)", async () => {
    await ExcelManager.closeWorkbook(false);
    const wbMeta = await ExcelManager.openWorkbook(targetXlsx);
    assert.ok(wbMeta.name.includes("madel_p26_sales_model"), "Opened workbook name must match");
    assert.ok(wbMeta.sheets.includes("Sales_Q1"), "Sheets must persist");

    // Check sum is still 86250
    const sumCheck = await ExcelManager.getCalculationResult("D6", "Sales_Q1");
    assert.strictEqual(Number(sumCheck.calculatedValue), 86250, "Persisted SUM must equal 86,250");
    console.log(`       Reopened workbook and confirmed persistent calculation results.`);
    await ExcelManager.closeWorkbook(false);
  });

  // Test 17: Teardown
  await runTest("17. Clean Excel Application Teardown (excel_quit_app)", async () => {
    await ExcelManager.quitApp();
    console.log("       Excel COM worker stopped cleanly.");
  });

  console.log("\n================================================================================");
  console.log("=== ALL 17 EXCEL ACCEPTANCE TESTS PASSED (100% GREEN) ===");
  console.log("================================================================================\n");
} catch (err) {
  console.error("\n[FATAL] Excel Acceptance test suite failed!");
  try {
    await ExcelManager.quitApp();
  } catch {}
  process.exit(1);
}
