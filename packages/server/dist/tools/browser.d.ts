/**
 * MADEL Studio Bridge — Browser MCP Tools (Phase P23)
 * Developed and maintained by Mahmoud Adel
 *
 * Implements 27 secure, strictly-typed Browser MCP tools:
 * - Browser Management (4)
 * - Navigation & History (7)
 * - Page Inspection & Content (6)
 * - User Interaction & Forms (6)
 * - Developer & Network Diagnostics (4)
 *
 * Integrates natively with P17 Concurrency Manager (browser:session, browser:navigation,
 * browser:interaction, browser:diagnostics) and enforces session isolation and scheme safety.
 */
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { BrowserManager } from "./browser-manager.js";
export declare function registerBrowserTools(server: McpServer, browserManager?: BrowserManager): void;
