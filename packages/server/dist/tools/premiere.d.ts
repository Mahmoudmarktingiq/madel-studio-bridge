import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { AppBridge, JsonValue } from "../bridge/types.js";
import type { JobRegistry } from "../jobs.js";
/** Folders Adobe installs encoder presets (.epr) into, plus the user's own. */
export declare function presetRoots(platform?: NodeJS.Platform, home?: string): string[];
/** Walks a folder for .epr files (bounded depth), returning name/path/category. */
export declare function findPresets(roots: string[], filter: string | undefined, limit?: number): Promise<{
    name: string;
    path: string;
    category: string;
}[]>;
export interface ExportSequenceOptions {
    sequenceId?: string;
    outputPath: string;
    presetPath: string;
    mode?: "immediately" | "queue_ame" | "queue_app";
    full?: boolean;
}
/** Export a sequence through the panel; shared by pp_export_sequence and the pipelines. */
export declare function exportSequence(bridge: AppBridge, a: ExportSequenceOptions): Promise<JsonValue>;
export declare function waitForAnyFile(paths: string[], timeoutMs: number): Promise<string>;
export interface PremiereToolOptions {
    /** When given, pp_export_sequence runs as a job (progress, cancel, wait:false). */
    jobs?: JobRegistry;
    /** Whether pp_export_sequence blocks when the caller passes no `wait` (BRAINFERNO_MCP_DEFAULT_WAIT). */
    defaultWait?: boolean;
}
export declare function registerPremiereTools(server: McpServer, bridge: AppBridge, options?: PremiereToolOptions): void;
