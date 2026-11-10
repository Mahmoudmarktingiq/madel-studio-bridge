import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { type IllustratorDelegate } from "../drivers/illustrator-delegate.js";
/**
 * Tools that proxy Adobe's official Illustrator (Beta) MCP server. Registered
 * only when a key is configured. We don't mirror Adobe's ~40 tools (unpublished,
 * moving beta target) — instead we expose discovery + a passthrough, so the
 * surface tracks Adobe's automatically.
 */
export declare function registerIllustratorDelegateTools(server: McpServer, delegate: IllustratorDelegate, enabled: boolean): void;
