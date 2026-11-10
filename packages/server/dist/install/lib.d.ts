import { type InstallableApp, type UserConfigFile } from "../config.js";
export interface AppChoice {
    id: InstallableApp;
    label: string;
    /** Regex on the install folder name (Program Files\Adobe on Windows, /Applications on macOS). */
    folder: RegExp;
    /** What the installer has to set up for it. */
    needs: ("cep" | "uxp" | "illustrator-key" | "ame-ini")[];
}
export declare const APP_CHOICES: readonly AppChoice[];
/** Which of the six are installed, judged by their app folders. */
export declare function detectInstalledApps(platform?: NodeJS.Platform): InstallableApp[];
/** "1,3,5", "1 3", "all", or app names → app ids (in canonical order). */
export declare function pickApps(answer: string, fallback: readonly InstallableApp[]): InstallableApp[];
export declare function appsNeed(apps: readonly InstallableApp[], need: AppChoice["needs"][number]): boolean;
/**
 * Pure pieces of the installer, kept apart from the interactive CLI so they
 * can be unit-tested: config merging, the Media Encoder ini rewrite, the
 * firewall and registration command lines, and the per-platform paths.
 */
export type InstallMode = "local" | "shared";
export declare const DEFAULT_HTTP_PORT = 7898;
export declare function randomToken(): string;
/** Non-internal IPv4 addresses, the ones other machines can reach. */
export declare function lanAddresses(): string[];
/**
 * The Illustrator MCP key as the user pasted it: either the bare `ilst_…` key or
 * the whole `claude mcp add … --header "Authorization: Bearer ilst_…" …` line
 * Illustrator shows. Returns null when nothing key-like is in there.
 */
export declare function extractIllustratorKey(input: string): string | null;
/** The endpoint URL from a pasted `claude mcp add` line, if it carries one. */
export declare function extractIllustratorUrl(input: string): string | null;
export type IllustratorKeyCheck = {
    ok: true;
    serverName: string | null;
} | {
    ok: false;
    reason: "not-running" | "refused" | "unexpected";
    detail: string;
};
/** Try an MCP initialize against Adobe's Illustrator endpoint with the key. */
export declare function checkIllustratorKey(url: string, key: string, timeoutMs?: number): Promise<IllustratorKeyCheck>;
/** Apply the chosen mode to the user config file (other keys untouched). */
export declare function mergeUserConfig(existing: UserConfigFile, mode: InstallMode, o?: {
    port?: number;
    token?: string;
    host?: string;
    illustratorKey?: string | null;
    illustratorUrl?: string | null;
    illustratorApp?: string | null;
    apps?: readonly InstallableApp[];
}): UserConfigFile;
/**
 * Media Encoder's web-service ini: local pins `ip = 127.0.0.1`; shared leaves
 * the address to the service (it picks a LAN adapter). Other lines are kept.
 */
export declare function rewriteAmeIni(ini: string, mode: InstallMode): string;
export interface IllustratorInstall {
    /** Bundle path, e.g. /Applications/Adobe Illustrator 2026/Adobe Illustrator.app */
    path: string;
    /** Bundle id: com.adobe.illustrator (release) or com.adobe.illustratorBeta. */
    bundleId: string;
    /** The folder Adobe installed it in, e.g. "Adobe Illustrator 2026" or "Adobe Illustrator (Beta)". */
    label: string;
    beta: boolean;
}
/**
 * Illustrator bundles under /Applications, newest-looking first, release before Beta.
 * Both bundles are named `Adobe Illustrator.app`, so an AppleScript *name* resolves to whichever
 * one LaunchServices picks; the os-script lane is pinned to a bundle id instead (config
 * `illustratorApp`). `readBundleId` is injectable for tests.
 */
export declare function findIllustratorApps(platform: NodeJS.Platform, appsRoot: string, readBundleId: (bundlePath: string) => string | null): IllustratorInstall[];
/** Seed for a Media Encoder ini that does not exist yet (macOS): the console's default port, no address pin. */
export declare const AME_INI_SEED = "port = 8080\n";
/**
 * AppleScript that has Finder copy `src` into `destDir` (replacing). macOS "App Management"
 * blocks writes into app bundles from a terminal, even with sudo; Finder is allowed.
 */
export declare function finderCopyScript(src: string, destDir: string): string;
export interface PlatformPaths {
    cepExtensionsDir: string;
    csxsDebugCommands: string[][];
    ameIniCandidates: string[];
}
/** Explicit path flavours: a platform's paths must come out the same whichever OS computes them. */
export declare function platformPaths(platform: NodeJS.Platform, home: string, appData?: string): PlatformPaths;
/** Windows Defender Firewall rule for the remote port, private networks only. */
export declare function firewallCommands(platform: NodeJS.Platform, mode: InstallMode, port: number): string[][];
/**
 * The name each MCP client registers the server under. Clients build tool names from it
 * (`mcp__brainferno-adobe-bridge__ae_run_script` in Claude Code); the longest such name is 58
 * characters, within the 64 that clients allow.
 */
export declare const MCP_SERVER_NAME = "brainferno-adobe-bridge";
/** Earlier registration names, removed before each add so a client is never left with two. */
export declare const LEGACY_SERVER_NAMES: readonly string[];
/** The `claude mcp add` lines to print/run. */
export declare function mcpAddCommands(o: {
    mode: InstallMode;
    distIndex: string;
    port: number;
    token: string;
    addresses: string[];
}): {
    local: string;
    remote: string[];
};
export type McpClient = "claude" | "codex" | "gemini";
export declare const MCP_CLIENTS: readonly McpClient[];
export declare function parseClients(raw: string): McpClient[];
/**
 * Env overrides each client's registration carries. Claude Code gets none
 * (blocking waits, inline previews — today's behavior). Codex CLI kills tool
 * calls at 60 seconds by default and cannot show the model MCP image blocks,
 * so long tools return a jobId at once, cc_job_wait polls in 50-second slices,
 * and previews come back as file paths (Codex's view_image reads them).
 * Gemini CLI renders images and has a long tool timeout; only waits change.
 */
export declare const CLIENT_ENV: Record<McpClient, Record<string, string>>;
export interface ClientPlan {
    client: McpClient;
    label: string;
    /** Probe argv: exit 0 means the CLI is installed. */
    probe: string[];
    /** Run before `add`; failures are ignored (stale or renamed entries). */
    removals: string[][];
    /**
     * Run before the removals to read each entry they retire (`claude mcp get <name>`), so env the
     * operator added by hand can be carried into the new entry (`carryEnv`). Claude Code only.
     */
    lookups: string[][];
    /** Registration argv. */
    add: string[];
    /** The same registration as one printable line. */
    addLine: string;
    /** Shared mode: how another computer connects to this server (print-only). */
    remoteLines: string[];
}
/** One registration plan per MCP client CLI (Claude Code, Codex CLI, Gemini CLI). */
export declare function registrationPlans(o: {
    mode: InstallMode;
    distIndex: string;
    port: number;
    token: string;
    addresses: string[];
    clients?: readonly McpClient[];
}): ClientPlan[];
/**
 * The env of one server as `claude mcp get <name>` prints it: the indented `KEY=value` lines
 * under "Environment:". The value is everything after the first `=`.
 */
export declare function envFromMcpGet(out: string): Record<string, string>;
/**
 * The plan's add with the `BRAINFERNO_MCP_*` env an old entry carried (Claude Code's `-e`, before
 * the name). Other keys are not ours to copy, and a value with characters the Windows shell could
 * read (anything but letters, digits and `_.,:/\-`) is not passed through it: `dropped` names both so
 * the installer can say so. Values are passed on, never printed.
 */
export declare function carryEnv(plan: ClientPlan, env: Record<string, string>): {
    add: string[];
    carried: string[];
    dropped: string[];
};
