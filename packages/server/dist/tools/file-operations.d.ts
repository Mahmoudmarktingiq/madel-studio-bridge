/**
 * MADEL Studio Bridge — Sandboxed File Operations MCP Tools (Phase P25.7)
 * Developed and maintained by Mahmoud Adel
 *
 * Implements hardened, strictly sandboxed file operations confined to
 * D:\MCP\Browser-Workspace and authorized creative workspace roots.
 *
 * Enforces:
 * - Strict path containment (zero path traversal or symlink escapes)
 * - Strict prohibition on executable binaries/scripts (.exe, .msi, .bat, .cmd, .ps1)
 * - ActionApprovalGate integration for destructive deletion and overwrites
 * - Concurrency scheduling under 'file:operations'
 */
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
export declare function registerFileOperationTools(server: McpServer): void;
