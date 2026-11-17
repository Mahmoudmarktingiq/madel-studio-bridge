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
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
export declare function registerExcelTools(server: McpServer): void;
