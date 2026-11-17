/**
 * MADEL Studio Bridge — Microsoft Office Workspace Manager
 * Developed and maintained by Mahmoud Adel
 *
 * Enforces dedicated workspace folders on drive D:
 * D:\MCP\Office-Workspace\Word
 * D:\MCP\Office-Workspace\Excel
 * D:\MCP\Office-Workspace\PowerPoint
 * D:\MCP\Office-Workspace\Exports
 * D:\MCP\Office-Workspace\Reports
 */
import type { OfficeWorkspaceConfig } from "./types.js";
export declare class OfficeWorkspaceManager {
    private static readonly DEFAULT_ROOT;
    static getWorkspaceConfig(): OfficeWorkspaceConfig;
    static ensureWorkspace(): OfficeWorkspaceConfig;
    static resolveWorkspacePath(app: "word" | "excel" | "powerpoint" | "exports" | "reports", filename: string): string;
}
