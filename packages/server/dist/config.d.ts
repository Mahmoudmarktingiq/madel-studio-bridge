/** Runtime configuration, read once at startup from the environment. */
export declare const DEFAULT_ILLUSTRATOR_MCP_URL = "http://localhost:18412/v1/mcp";
export type LogLevel = "error" | "warn" | "info" | "debug";
/**
 * How preview tools return images: "both" (image block + file path, the
 * default), "inline" (image block only), or "path" (file path only — for MCP
 * clients that cannot show the model image content, e.g. Codex CLI).
 */
export type PreviewMode = "inline" | "path" | "both";
/** Read BRAINFERNO_MCP_X, falling back to the pre-rename ADOBE_CC_MCP_X with a one-time warning. */
export declare function envValue(name: string): string | undefined;
/** Settings live in ~/.brainferno-mcp-bridge; copy config.json from the pre-rename ~/.adobe-cc-mcp once. */
export declare function migrateLegacyUserDir(home?: string): string | null;
export interface Config {
    /** TCP port the in-app panels dial back to (0 lets the OS pick one). */
    bridgePort: number;
    /**
     * Explicit shared secret panels must present. Empty means "generate a random
     * one at startup" unless {@link bridgeInsecure} is set.
     */
    bridgeToken: string;
    /**
     * Disable panel authentication entirely (no token, no handshake file). For
     * local debugging and tests only — never run this on a shared machine, since
     * the bridge evaluates arbitrary script inside your Adobe applications.
     */
    bridgeInsecure: boolean;
    /** Default deadline for a "slow" script result before rejecting. */
    evalTimeoutMs: number;
    /** How often the bridge pings each panel to detect a dead connection. */
    heartbeatIntervalMs: number;
    /**
     * True when at least one app is enabled for raw scripts; gate decisions use
     * {@link rawScriptApps}. Kept for existing callers.
     */
    allowRawScripts: boolean;
    /**
     * Apps whose raw-script tools (`cc_eval_script`, `ae_run_script`, `ps_batch_play`) may run, from
     * BRAINFERNO_MCP_ALLOW_RAW_SCRIPTS (`1`/`all` or a comma list). Empty = every raw
     * call is refused. The tools are always registered; this only opens the gate.
     * Off by default: it is arbitrary code execution at user privilege.
     */
    rawScriptApps: RawScriptApp[];
    /** Tokens in BRAINFERNO_MCP_ALLOW_RAW_SCRIPTS that name no raw-capable app (reported, never enabled). */
    rawScriptIgnored: string[];
    /**
     * Whether remote (shared HTTP) sessions may run raw scripts too
     * (BRAINFERNO_MCP_ALLOW_REMOTE_RAW_SCRIPTS=1). Off by default: remote sessions are refused.
     */
    allowRemoteRawScripts: boolean;
    /** Where to write the port+token handshake file panels read. */
    handshakeFilePath: string;
    /**
     * Extra WebSocket Origins to accept on the upgrade, beyond loopback origins
     * and the no-Origin case (UXP panels send none). Fill in a panel's actual
     * Origin here once a spike establishes what it sends.
     */
    allowedOrigins: string[];
    /** Adobe's official Illustrator (Beta) MCP endpoint the delegate lane dials. */
    illustratorMcpUrl: string;
    /**
     * Bearer key for Adobe's Illustrator (Beta) MCP server. Empty disables the
     * delegate lane. A capability key to the user's local Illustrator — never log
     * it or put it in an error message.
     */
    illustratorMcpKey: string;
    /**
     * Which Illustrator the os-script lane drives: an AppleScript name, a bundle id
     * (`com.adobe.illustrator`, `com.adobe.illustratorBeta`) or an absolute `.app` path on macOS;
     * a COM ProgID on Windows. "" = the app default. Pin it when the release and the Beta are both
     * installed: their bundles share the name `Adobe Illustrator.app`, so a bare name resolves to
     * whichever one LaunchServices picks.
     */
    illustratorApp: string;
    /** ffmpeg / ffprobe executables for the audio process lane (name on PATH or absolute path). */
    ffmpegPath: string;
    ffprobePath: string;
    /** ame_webservice_console(.exe) path; "" = auto-detect the newest Media Encoder. */
    ameWebServicePath: string;
    /** Port of the AME web service; 0 = read it from the ini beside the console. */
    amePort: number;
    /** Stop the AME web service after this idle time; 0 = keep it running. */
    ameIdleMs: number;
    /**
     * Remote mode: also serve MCP over Streamable HTTP on this port (0 = off).
     * Requires {@link httpToken}. Set by the installer's "shared on my network" choice.
     */
    httpPort: number;
    /** Address to bind in remote mode: 127.0.0.1 (this computer) or 0.0.0.0 (network). */
    httpHost: string;
    /** Bearer token every remote request must present. */
    httpToken: string;
    /** Which applications get their tools registered (installer choice; env BRAINFERNO_MCP_APPS overrides). */
    enabledApps: InstallableApp[];
    logLevel: LogLevel;
    /**
     * Whether long tools (renders, exports, pipelines) block until done when the
     * caller does not pass `wait`. False suits clients with short tool timeouts
     * (Codex CLI kills calls at 60s by default): tools return a jobId at once and
     * the client polls cc_job_wait. Set per client in its MCP registration env.
     */
    defaultWait: boolean;
    /** How preview tools return images; see {@link PreviewMode}. */
    preview: PreviewMode;
    /** Default cc_job_wait timeout, seconds. Keep below the client's tool timeout. */
    jobWaitSeconds: number;
}
/** Keys the installer may write to `~/.brainferno-mcp-bridge/config.json` (mode 600). */
/** Everything the installer can switch on or off. */
export declare const INSTALLABLE_APPS: readonly ["photoshop", "after_effects", "premiere", "illustrator", "audition", "media_encoder"];
export type InstallableApp = (typeof INSTALLABLE_APPS)[number];
/** The app a token names (trimmed, case-insensitive, aliases allowed), or undefined. */
export declare function resolveAppToken(token: string): InstallableApp | undefined;
export declare function parseApps(raw: string | undefined, fallback?: readonly InstallableApp[]): InstallableApp[];
/** Apps with a raw-script tool: cc_eval_script (ExtendScript hosts), ae_run_script (After Effects) and ps_batch_play (Photoshop). Canonical order. */
export declare const RAW_SCRIPT_APPS: readonly ["after_effects", "photoshop", "illustrator", "audition"];
export type RawScriptApp = (typeof RAW_SCRIPT_APPS)[number];
export declare function isRawScriptApp(id: string): id is RawScriptApp;
/**
 * Parses BRAINFERNO_MCP_ALLOW_RAW_SCRIPTS: `1`/`true`/`all`/`*` enables every raw-capable app,
 * `0`/`false`/`no`/`off` or unset enables none, anything else is a comma/space list of app ids
 * (aliases allowed). Pure and fail-closed: it never throws, and a token that names no raw-capable
 * app (Premiere Pro, Media Encoder, a typo) is reported in `ignored`, never enabled.
 */
export declare function parseRawScriptApps(raw: string | undefined): {
    apps: RawScriptApp[];
    ignored: string[];
};
/** A strict on/off switch: on only for `1` or `true` (trimmed, any case); anything else is off. */
export declare function parseFlag(raw: string | undefined): boolean;
export interface UserConfigFile {
    /** Apps whose tools are registered; missing = all. */
    enabledApps?: InstallableApp[];
    illustratorKey?: string;
    /** Which Illustrator the os-script lane drives (name, bundle id, or .app path); see Config.illustratorApp. */
    illustratorApp?: string;
    /** Adobe's Illustrator MCP endpoint; override when the shipping release moves it. */
    illustratorUrl?: string;
    httpPort?: number;
    httpHost?: string;
    httpToken?: string;
}
export declare function userConfigPath(): string;
/** The user config file, or {} when missing/malformed. */
export declare function readUserConfig(): UserConfigFile;
export declare function loadConfig(): Config;
