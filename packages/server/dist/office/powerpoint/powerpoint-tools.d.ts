/**
 * MADEL Studio Bridge — Microsoft PowerPoint MCP Tools
 * Developed and maintained by Mahmoud Adel
 *
 * Implements 17 typed MCP tools for controlling Microsoft PowerPoint:
 * - powerpoint_open_app
 * - powerpoint_create_presentation
 * - powerpoint_open_presentation (with approval check)
 * - powerpoint_add_slide
 * - powerpoint_delete_slide (with approval check)
 * - powerpoint_move_slide
 * - powerpoint_insert_text (with RTL support)
 * - powerpoint_insert_image
 * - powerpoint_insert_shape
 * - powerpoint_insert_table
 * - powerpoint_set_notes
 * - powerpoint_read_slides
 * - powerpoint_save_presentation
 * - powerpoint_export_pdf
 * - powerpoint_export_slide_image
 * - powerpoint_close_presentation
 * - powerpoint_quit_app
 */
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
export declare function registerPowerPointTools(server: McpServer): void;
