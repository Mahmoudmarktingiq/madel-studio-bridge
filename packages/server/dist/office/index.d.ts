/**
 * MADEL Studio Bridge — Microsoft Office MCP Integration Module
 * Developed and maintained by Mahmoud Adel
 *
 * Exposes full real-time Windows COM automation for:
 * - Microsoft Word (17 tools)
 * - Microsoft Excel (17 tools)
 * - Microsoft PowerPoint (17 tools)
 * Total: 51 specialized Office MCP tools.
 */
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
export * from "./common/types.js";
export * from "./common/workspace.js";
export * from "./common/security.js";
export * from "./common/discovery.js";
export * from "./common/com-runner.js";
export * from "./word/word-manager.js";
export * from "./word/word-tools.js";
export * from "./excel/excel-manager.js";
export * from "./excel/excel-tools.js";
export * from "./powerpoint/powerpoint-manager.js";
export * from "./powerpoint/powerpoint-tools.js";
export declare function registerOfficeTools(server: McpServer): void;
