/**
 * MADEL Studio Bridge — Microsoft Office Integration Types (Phase P26)
 * Developed and maintained by Mahmoud Adel
 */
export type OfficeAppId = "word" | "excel" | "powerpoint";
export type OfficeAppStatus = "NOT_INSTALLED" | "DETECTED" | "CONFIGURED" | "CONNECTED" | "LIVE_VERIFIED" | "BLOCKED";
export interface OfficeAppMetadata {
    id: OfficeAppId;
    name: string;
    executableName: string;
    executablePath?: string;
    comProgId: string;
    clsid?: string;
    version?: string;
    productVersion?: string;
    installType?: "ClickToRun" | "MSI" | "WindowsStore" | "Unknown";
    status: OfficeAppStatus;
    statusLabel: string;
    installed: boolean;
    canControl: boolean;
    registeredToolsCount: number;
    diagnostic?: string;
}
export interface OfficeWorkspaceConfig {
    root: string;
    wordDir: string;
    excelDir: string;
    powerPointDir: string;
    exportsDir: string;
    reportsDir: string;
}
export interface DocumentInfo {
    name: string;
    path?: string;
    saved: boolean;
    readOnly?: boolean;
}
export interface WordDocumentMetadata {
    name: string;
    path?: string;
    paragraphsCount: number;
    wordsCount: number;
    charactersCount: number;
    sectionsCount: number;
    tablesCount: number;
    saved: boolean;
}
export interface ExcelWorkbookMetadata {
    name: string;
    path?: string;
    sheets: string[];
    activeSheet: string;
    saved: boolean;
}
export interface PowerPointPresentationMetadata {
    name: string;
    path?: string;
    slidesCount: number;
    saved: boolean;
}
export interface OfficeCommandResult<T = unknown> {
    success: boolean;
    data?: T;
    error?: string;
    details?: Record<string, unknown>;
    executionMs?: number;
}
