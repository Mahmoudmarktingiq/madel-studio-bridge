import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { AppBridge } from "../bridge/types.js";
import type { RawScriptApp } from "../config.js";
/**
 * Photoshop is driven through its UXP panel. UXP cannot evaluate script
 * strings, so — per protocol v2 — these tools send *named* commands and the
 * panel implements them against the `photoshop` module (DOM + batchPlay,
 * inside `executeAsModal` for anything that changes the document). The panel
 * advertises the names it implements in its hello `capabilities`; an
 * unimplemented name comes back as UNKNOWN_COMMAND.
 *
 * Coordinates are document pixels from the top-left. Colors are hex.
 */
export interface PhotoshopToolOptions {
    /** The raw-script gate: `ps_batch_play` runs only when it includes "photoshop". Always registered. */
    rawScriptApps: readonly RawScriptApp[];
    /** This McpServer serves a remote (shared HTTP) session. */
    remote: boolean;
    /** BRAINFERNO_MCP_ALLOW_REMOTE_RAW_SCRIPTS: whether a remote session may run raw batches. */
    allowRemoteRawScripts: boolean;
}
export declare function registerPhotoshopTools(server: McpServer, bridge: AppBridge, options: PhotoshopToolOptions): void;
