import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { type AmeWebService } from "../drivers/ame-webservice.js";
import type { JobRegistry } from "../jobs.js";
/**
 * Adobe Media Encoder through its built-in web service (see
 * drivers/ame-webservice.ts). Headless: no panel, no AME window. The server
 * starts the service on the first job and stops it after an idle period.
 */
export interface MediaEncoderToolOptions {
    jobs?: JobRegistry;
    /** Whether ame_encode blocks when the caller passes no `wait` (BRAINFERNO_MCP_DEFAULT_WAIT). */
    defaultWait?: boolean;
}
/**
 * AME writes `<basename>.<preset format extension>` regardless of the requested
 * extension (an H.264 QuickTime preset yields .mov). Find the file it made.
 */
export declare function resolveWrittenOutput(requested: string, since: number): Promise<string>;
export declare function registerMediaEncoderTools(server: McpServer, ame: AmeWebService, options?: MediaEncoderToolOptions): void;
