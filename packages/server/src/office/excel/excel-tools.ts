/**
 * MADEL Studio Bridge — Microsoft Excel MCP Tools
 * Developed and maintained by Mahmoud Adel
 *
 * Implements 17 typed MCP tools for controlling Microsoft Excel:
 * - excel_open_app
 * - excel_create_workbook
 * - excel_open_workbook (with approval check)
 * - excel_manage_sheets (delete sheet requires approval)
 * - excel_read_range
 * - excel_write_cells
 * - excel_set_formula
 * - excel_get_calculation_result
 * - excel_format_range
 * - excel_sort_range
 * - excel_filter_range
 * - excel_create_chart
 * - excel_manage_rows_cols
 * - excel_search_replace
 * - excel_save_workbook
 * - excel_export_pdf
 * - excel_close_workbook
 */

import { z } from "zod";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { globalApprovalGate, globalConcurrencyManager } from "../../gateway/index.js";
import { guard, jsonResult } from "../../tools/result.js";
import { ExcelManager } from "./excel-manager.js";

export function registerExcelTools(server: McpServer): void {
  const schedule = async <T>(toolName: string, task: () => Promise<T>): Promise<T> => {
    return globalConcurrencyManager.schedule("excel:operations", async () => task(), {
      correlationId: `corr-excel-${Date.now().toString(36)}`,
    });
  };

  // 1. excel_open_app
  server.registerTool(
    "excel_open_app",
    {
      title: "Excel: Open Application",
      description: "Connects to or launches Microsoft Excel via Windows COM, returning application status and workbook count.",
      inputSchema: {},
    },
    async () =>
      guard(async () => {
        const info = await schedule("excel_open_app", async () => ExcelManager.openApp());
        return jsonResult(info);
      }),
  );

  // 2. excel_create_workbook
  server.registerTool(
    "excel_create_workbook",
    {
      title: "Excel: Create Workbook",
      description: "Creates a new blank workbook in Microsoft Excel with optional custom sheet names.",
      inputSchema: {
        sheetNames: z.array(z.string()).optional().describe("Array of sheet names to initialize."),
      },
    },
    async ({ sheetNames }) =>
      guard(async () => {
        const res = await schedule("excel_create_workbook", async () => ExcelManager.createWorkbook(sheetNames));
        return jsonResult(res);
      }),
  );

  // 3. excel_open_workbook
  server.registerTool(
    "excel_open_workbook",
    {
      title: "Excel: Open Existing Workbook",
      description: "Opens an existing Excel workbook (.xlsx, .xls, .csv) from disk.",
      inputSchema: {
        path: z.string().describe("Path to the workbook file."),
        approvalTicket: z.string().optional().describe("Operator approval ticket if opening user sensitive files outside workspace."),
      },
    },
    async ({ path, approvalTicket }) =>
      guard(async () => {
        return schedule("excel_open_workbook", async () => {
          if (!path.toLowerCase().includes("office-workspace")) {
            const gateCheck = globalApprovalGate.checkApproval(
              "excel_open_workbook",
              "config",
              `Open external Excel workbook: '${path}'`,
              { path },
              approvalTicket,
            );
            if (!gateCheck.authorized) {
              return jsonResult(gateCheck.challenge);
            }
          }
          const res = await ExcelManager.openWorkbook(path);
          return jsonResult(res);
        });
      }),
  );

  // 4. excel_manage_sheets
  server.registerTool(
    "excel_manage_sheets",
    {
      title: "Excel: Manage Sheets",
      description: "Adds, renames, selects, or deletes worksheets in the active Excel workbook. Deleting requires confirm=true and approval.",
      inputSchema: {
        action: z.enum(["add", "rename", "select", "delete"]).describe("Sheet operation to perform."),
        sheetName: z.string().optional().describe("Target sheet name (for rename, select, delete)."),
        newName: z.string().optional().describe("New sheet name (for add or rename)."),
        confirm: z.boolean().optional().describe("Required true for delete action."),
        approvalTicket: z.string().optional().describe("Approval ticket required for delete action."),
      },
    },
    async ({ action, sheetName, newName, confirm, approvalTicket }) =>
      guard(async () => {
        return schedule("excel_manage_sheets", async () => {
          if (action === "delete") {
            if (!confirm) {
              throw new Error("Sheet deletion aborted: 'confirm' must be explicitly set to true.");
            }
            const gateCheck = globalApprovalGate.checkApproval(
              "excel_manage_sheets",
              "destructive",
              `Delete worksheet '${sheetName}'`,
              { action, sheetName },
              approvalTicket,
            );
            if (!gateCheck.authorized) {
              return jsonResult(gateCheck.challenge);
            }
          }
          const res = await ExcelManager.manageSheets(action, { sheetName, newName });
          return jsonResult(res);
        });
      }),
  );

  // 5. excel_read_range
  server.registerTool(
    "excel_read_range",
    {
      title: "Excel: Read Range",
      description: "Reads cell values, formulas, dimensions, and addresses from a range (e.g. 'A1:D10') or the entire used range.",
      inputSchema: {
        rangeAddress: z.string().optional().describe("A1-style range address (e.g. 'A1:C5'). If omitted, reads used range."),
        sheetName: z.string().optional().describe("Sheet name. If omitted, uses active sheet."),
      },
    },
    async ({ rangeAddress, sheetName }) =>
      guard(async () => {
        const res = await schedule("excel_read_range", async () => ExcelManager.readRange(rangeAddress, sheetName));
        return jsonResult(res);
      }),
  );

  // 6. excel_write_cells
  server.registerTool(
    "excel_write_cells",
    {
      title: "Excel: Write Cells",
      description: "Writes a 2D array of values or formulas into Excel starting at a specified top-left cell.",
      inputSchema: {
        startCell: z.string().describe("Top-left cell coordinate (e.g. 'A1', 'B2')."),
        data: z.array(z.array(z.any())).describe("2D matrix of values (strings, numbers, booleans, or formulas starting with '=')."),
        sheetName: z.string().optional().describe("Sheet name. If omitted, uses active sheet."),
      },
    },
    async ({ startCell, data, sheetName }) =>
      guard(async () => {
        const res = await schedule("excel_write_cells", async () => ExcelManager.writeCells(startCell, data, sheetName));
        return jsonResult(res);
      }),
  );

  // 7. excel_set_formula
  server.registerTool(
    "excel_set_formula",
    {
      title: "Excel: Set Formula",
      description: "Sets an Excel formula (e.g. '=SUM(B2:B10)', '=AVERAGE(A1:A5)') in a cell and recalculates workbook.",
      inputSchema: {
        cellAddress: z.string().describe("Cell address to receive formula (e.g. 'B11')."),
        formula: z.string().describe("Excel formula string (e.g. '=SUM(B2:B10)')."),
        sheetName: z.string().optional().describe("Sheet name. If omitted, uses active sheet."),
      },
    },
    async ({ cellAddress, formula, sheetName }) =>
      guard(async () => {
        const res = await schedule("excel_set_formula", async () => ExcelManager.setFormula(cellAddress, formula, sheetName));
        return jsonResult(res);
      }),
  );

  // 8. excel_get_calculation_result
  server.registerTool(
    "excel_get_calculation_result",
    {
      title: "Excel: Get Calculation Result",
      description: "Forces workbook calculation and returns the evaluated result of a formula cell inside Excel.",
      inputSchema: {
        cellAddress: z.string().describe("Cell coordinate to evaluate (e.g. 'C15')."),
        sheetName: z.string().optional().describe("Sheet name. If omitted, uses active sheet."),
      },
    },
    async ({ cellAddress, sheetName }) =>
      guard(async () => {
        const res = await schedule("excel_get_calculation_result", async () =>
          ExcelManager.getCalculationResult(cellAddress, sheetName),
        );
        return jsonResult(res);
      }),
  );

  // 9. excel_format_range
  server.registerTool(
    "excel_format_range",
    {
      title: "Excel: Format Range",
      description: "Applies typography, colors, borders, number formatting, and alignment to an Excel range.",
      inputSchema: {
        rangeAddress: z.string().describe("A1-style range to format (e.g. 'A1:E1')."),
        bold: z.boolean().optional().describe("Bold text."),
        italic: z.boolean().optional().describe("Italic text."),
        fontSize: z.number().optional().describe("Font size in points."),
        fontColorRgb: z.number().optional().describe("Font color RGB integer."),
        fillColorRgb: z.number().optional().describe("Background interior fill color RGB integer."),
        numberFormat: z.string().optional().describe("Number format string (e.g. '$#,##0.00', '0.0%', 'yyyy-mm-dd')."),
        borders: z.boolean().optional().describe("Enable grid borders."),
        horizontalAlign: z.enum(["left", "center", "right"]).optional().describe("Horizontal alignment."),
        sheetName: z.string().optional().describe("Sheet name. If omitted, uses active sheet."),
      },
    },
    async (params) =>
      guard(async () => {
        const res = await schedule("excel_format_range", async () =>
          ExcelManager.formatRange(params.rangeAddress, params, params.sheetName),
        );
        return jsonResult(res);
      }),
  );

  // 10. excel_sort_range
  server.registerTool(
    "excel_sort_range",
    {
      title: "Excel: Sort Range",
      description: "Sorts a tabular range by a specific column in ascending or descending order.",
      inputSchema: {
        rangeAddress: z.string().describe("Range address including headers (e.g. 'A1:D20')."),
        keyColumnIndex: z.number().int().min(1).optional().describe("1-based column index to sort by. Default 1."),
        descending: z.boolean().optional().describe("Sort descending if true. Default false."),
        hasHeader: z.boolean().optional().describe("Whether the first row contains headers. Default true."),
        sheetName: z.string().optional().describe("Sheet name."),
      },
    },
    async ({ rangeAddress, keyColumnIndex, descending, hasHeader, sheetName }) =>
      guard(async () => {
        const res = await schedule("excel_sort_range", async () =>
          ExcelManager.sortRange(rangeAddress, keyColumnIndex, descending, hasHeader, sheetName),
        );
        return jsonResult(res);
      }),
  );

  // 11. excel_filter_range
  server.registerTool(
    "excel_filter_range",
    {
      title: "Excel: AutoFilter Range",
      description: "Applies or clears Excel AutoFilter on a data table range.",
      inputSchema: {
        rangeAddress: z.string().describe("Table range address (e.g. 'A1:E50')."),
        fieldIndex: z.number().int().min(1).optional().describe("1-based column field index to filter."),
        criteria: z.string().optional().describe("Filter criteria string (e.g. '>100', 'Active'). If omitted, toggles AutoFilter."),
        sheetName: z.string().optional().describe("Sheet name."),
      },
    },
    async ({ rangeAddress, fieldIndex, criteria, sheetName }) =>
      guard(async () => {
        const res = await schedule("excel_filter_range", async () =>
          ExcelManager.filterRange(rangeAddress, fieldIndex, criteria, sheetName),
        );
        return jsonResult(res);
      }),
  );

  // 12. excel_create_chart
  server.registerTool(
    "excel_create_chart",
    {
      title: "Excel: Create Chart",
      description: "Generates an embedded chart (column, bar, line, or pie) from a data range and positions it on the worksheet.",
      inputSchema: {
        dataRange: z.string().describe("Data range feeding the chart (e.g. 'A1:B10')."),
        chartType: z.enum(["column", "bar", "line", "pie"]).optional().describe("Type of chart. Default 'column'."),
        title: z.string().optional().describe("Chart title."),
        left: z.number().optional().describe("Left position in points. Default 300."),
        top: z.number().optional().describe("Top position in points. Default 40."),
        width: z.number().optional().describe("Width in points. Default 450."),
        height: z.number().optional().describe("Height in points. Default 280."),
        sheetName: z.string().optional().describe("Target worksheet name."),
      },
    },
    async (params) =>
      guard(async () => {
        const res = await schedule("excel_create_chart", async () =>
          ExcelManager.createChart(params.dataRange, params, params.sheetName),
        );
        return jsonResult(res);
      }),
  );

  // 13. excel_manage_rows_cols
  server.registerTool(
    "excel_manage_rows_cols",
    {
      title: "Excel: Manage Rows & Columns",
      description: "Inserts, deletes, resizes, or autofits rows and columns in the worksheet.",
      inputSchema: {
        action: z.enum(["insert_row", "delete_row", "insert_col", "delete_col", "autofit", "set_size"]).describe("Action to perform."),
        targetIndex: z.number().int().min(1).describe("1-based row or column index."),
        count: z.number().int().min(1).optional().describe("Number of rows/cols to insert or delete. Default 1."),
        size: z.number().optional().describe("Height (for row) or width (for column) in points when action is 'set_size'."),
        isColumn: z.boolean().optional().describe("Set true when action applies to a column (for autofit/set_size)."),
        sheetName: z.string().optional().describe("Worksheet name."),
      },
    },
    async ({ action, targetIndex, count, size, isColumn, sheetName }) =>
      guard(async () => {
        const res = await schedule("excel_manage_rows_cols", async () =>
          ExcelManager.manageRowsCols(action, targetIndex, { count, size, isColumn }, sheetName),
        );
        return jsonResult(res);
      }),
  );

  // 14. excel_search_replace
  server.registerTool(
    "excel_search_replace",
    {
      title: "Excel: Search & Replace",
      description: "Finds and replaces text or numbers across the worksheet.",
      inputSchema: {
        findText: z.string().describe("Target string to find."),
        replaceWith: z.string().describe("Replacement string."),
        sheetName: z.string().optional().describe("Sheet name."),
      },
    },
    async ({ findText, replaceWith, sheetName }) =>
      guard(async () => {
        const res = await schedule("excel_search_replace", async () =>
          ExcelManager.searchReplace(findText, replaceWith, sheetName),
        );
        return jsonResult(res);
      }),
  );

  // 15. excel_save_workbook
  server.registerTool(
    "excel_save_workbook",
    {
      title: "Excel: Save Workbook (XLSX)",
      description: "Saves the active Excel workbook as a .xlsx file in the approved workspace.",
      inputSchema: {
        outputPath: z.string().optional().describe("Target .xlsx file path. If omitted, saves to D:\\MCP\\Office-Workspace\\Excel."),
      },
    },
    async ({ outputPath }) =>
      guard(async () => {
        const res = await schedule("excel_save_workbook", async () => ExcelManager.saveWorkbook(outputPath));
        return jsonResult(res);
      }),
  );

  // 16. excel_export_pdf
  server.registerTool(
    "excel_export_pdf",
    {
      title: "Excel: Export PDF",
      description: "Exports the active Excel workbook or worksheet to PDF.",
      inputSchema: {
        outputPath: z.string().optional().describe("Target .pdf file path. If omitted, exports to D:\\MCP\\Office-Workspace\\Exports."),
      },
    },
    async ({ outputPath }) =>
      guard(async () => {
        const res = await schedule("excel_export_pdf", async () => ExcelManager.exportPdf(outputPath));
        return jsonResult(res);
      }),
  );

  // 17. excel_close_workbook
  server.registerTool(
    "excel_close_workbook",
    {
      title: "Excel: Close Workbook",
      description: "Safely closes the active Excel workbook, optionally saving changes.",
      inputSchema: {
        saveChanges: z.boolean().optional().describe("Whether to save changes before closing. Default false."),
      },
    },
    async ({ saveChanges }) =>
      guard(async () => {
        const res = await schedule("excel_close_workbook", async () => ExcelManager.closeWorkbook(saveChanges));
        return jsonResult(res);
      }),
  );
}
