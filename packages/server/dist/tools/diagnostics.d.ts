import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { type AppId } from "@brainferno/mcp-bridge-protocol";
import type { BridgeServer } from "../bridge/socket.js";
import type { AppBridge } from "../bridge/types.js";
import type { RawScriptApp } from "../config.js";
export interface DiagnosticOptions {
    /**
     * Apps whose tools are registered (cc_connected_apps lists these). Required, with no
     * fallback: the raw-script gate refuses any app not listed here before touching a lane.
     */
    enabledApps: readonly AppId[];
    /** Apps the raw-script gate (BRAINFERNO_MCP_ALLOW_RAW_SCRIPTS) opens. Empty = cc_eval_script refuses every call. */
    rawScriptApps: readonly RawScriptApp[];
    /** Gate tokens that named no raw-capable app; reported by cc_get_capabilities. */
    rawScriptIgnored: readonly string[];
    /** BRAINFERNO_MCP_ALLOW_REMOTE_RAW_SCRIPTS: whether a remote session may run raw scripts. */
    allowRemoteRawScripts: boolean;
    /** This McpServer serves a remote (shared HTTP) session. */
    remote: boolean;
    /**
     * The os-script lane Illustrator's raw scripts go through — the SAME instance the ai_*
     * tools use, so its per-host queue serializes them. An interface so tests can inject one.
     */
    illustratorBridge: AppBridge;
    /** Whether the Illustrator delegate key is configured (never the key itself). */
    illustratorDelegateEnabled: boolean;
}
/**
 * Cross-application tools: which hosts are reachable, what this server can do for the
 * calling session, and a gated raw-script escape hatch for work the typed tools do not
 * cover yet.
 */
export declare function registerDiagnosticTools(server: McpServer, bridge: BridgeServer, options: DiagnosticOptions): void;
