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
import { OfficeWorkspaceManager } from "./common/workspace.js";
import { registerWordTools } from "./word/word-tools.js";
import { registerExcelTools } from "./excel/excel-tools.js";
import { registerPowerPointTools } from "./powerpoint/powerpoint-tools.js";
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
export function registerOfficeTools(server) {
    // Ensure dedicated workspace structure on drive D:
    OfficeWorkspaceManager.ensureWorkspace();
    // Register tools for all 3 applications
    registerWordTools(server);
    registerExcelTools(server);
    registerPowerPointTools(server);
}
//# sourceMappingURL=index.js.map