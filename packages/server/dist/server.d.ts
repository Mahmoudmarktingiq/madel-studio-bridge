import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { BridgeServer } from "./bridge/socket.js";
import type { Config } from "./config.js";
import { AmeWebService } from "./drivers/ame-webservice.js";
import { IllustratorDelegate } from "./drivers/illustrator-delegate.js";
import { OsScriptBridge } from "./drivers/osscript.js";
import { JobRegistry } from "./jobs.js";
import { type AudioToolOptions } from "./tools/audio.js";
/**
 * Everything that lives once per process and is shared by every MCP session:
 * the panel hub, the panel-less drivers, the job registry, the Media Encoder
 * service. An McpServer (one per transport session) is cheap and is created
 * on top of this with {@link createMcpServer}.
 */
export interface Runtime {
    config: Config;
    bridge: BridgeServer;
    /** Illustrator is driven panel-less over COM/AppleScript, not through the hub. */
    illustratorBridge: OsScriptBridge;
    illustratorDelegate: IllustratorDelegate;
    jobs: JobRegistry;
    /** Media Encoder's headless web service, started on demand. */
    mediaEncoder: AmeWebService;
    audio: AudioToolOptions;
}
export interface BuiltServer extends Runtime {
    server: McpServer;
}
export declare function buildRuntime(config: Config): Runtime;
/**
 * A new McpServer with every tool registered against the shared runtime.
 * Tools are registered unconditionally: an application that has no panel
 * connected still advertises its tools, and those tools return an actionable
 * "not connected" error rather than vanishing from the tool list mid-session.
 * The raw-script tools follow the same rule and refuse when their gate is closed.
 *
 * `remote: true` marks a remote (shared HTTP) session: raw-script tools refuse it
 * unless BRAINFERNO_MCP_ALLOW_REMOTE_RAW_SCRIPTS=1.
 */
export declare function createMcpServer(rt: Runtime, opts?: {
    remote?: boolean;
}): McpServer;
/** Runtime plus one McpServer (the stdio session). */
export declare function buildServer(config: Config): BuiltServer;
