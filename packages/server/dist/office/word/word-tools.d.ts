/**
 * MADEL Studio Bridge — Microsoft Word MCP Tools
 * Developed and maintained by Mahmoud Adel
 *
 * Implements 17 typed MCP tools for controlling Microsoft Word:
 * - word_open_app
 * - word_create_document
 * - word_open_document (with approval check)
 * - word_read_document
 * - word_write_text
 * - word_edit_text
 * - word_format_text
 * - word_set_direction (RTL/LTR)
 * - word_insert_heading
 * - word_create_table
 * - word_insert_image
 * - word_set_header_footer
 * - word_search_replace
 * - word_set_page_setup
 * - word_save_document
 * - word_export_pdf
 * - word_close_document
 */
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
export declare function registerWordTools(server: McpServer): void;
