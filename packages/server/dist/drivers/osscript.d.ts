/**
 * The os-script lane: drive an Adobe app that has no panel by injecting
 * ExtendScript from outside the process.
 *
 *   Windows: PowerShell -> COM `Illustrator.Application` -> DoJavaScript
 *   macOS:   osascript  -> AppleScript `do javascript`
 *
 * Both runners execute one tiny bootstrap (`$.evalFile(<temp .jsx>)`) so the
 * real script never travels through shell quoting. The script's result comes
 * back through a JSON result file the .jsx writes, not through stdout — return
 * strings from COM/AppleScript are lossy and size-limited.
 *
 * ExtendScript is ES3 with no JSON object, so every script is wrapped in a
 * prelude that ships a small stringifier, catches errors (with the line), and
 * writes the outcome. Illustrator has no "allow scripts to write files"
 * preference, so this works out of the box (unlike After Effects).
 *
 * Calls are serialized: one script at a time per host.
 */
import { type AppId } from "@brainferno/mcp-bridge-protocol";
import { AppNotConnectedError, type AppBridge, type EvalOptions, type JsonValue } from "../bridge/types.js";
/**
 * Runs the bootstrap that evaluates `jsxPath` inside the host. Injectable for tests.
 *
 * `timeoutMs` is the call's deadline: the server aborts `signal` when it passes. A runner whose
 * transport has a deadline of its own (AppleScript's Apple-event timeout) must set it longer,
 * so the server's deadline is the one that fires.
 *
 * Failure contract: reject with AppNotConnectedError only when the script provably never
 * reached the host; with RunnerExitedError when it may have (see spawnRunner). Anything else
 * a runner throws is treated as "may have been dispatched".
 */
export type ScriptRunner = (jsxPath: string, signal: AbortSignal, timeoutMs: number) => Promise<void>;
/**
 * What a call reports when the host wrote no result file. The typed ai_* tools show it as is;
 * cc_eval_script rewords it, because a raw script's syntax errors come back through its wrapper.
 */
export declare const NO_RESULT_MESSAGE = "The script produced no result \u2014 it probably failed to parse (ES3 syntax only).";
/** The longest explicit `timeoutMs` cc_eval_script accepts (its schema's max); staleTempFileMs builds on it. */
export declare const MAX_EXPLICIT_TIMEOUT_MS: number;
/**
 * How old one of the lane's temp files must be before a sweep treats it as a leftover: twice
 * the longest deadline a call on this bridge can get (cc_eval_script's 30-minute cap on an
 * explicit timeoutMs, or the default deadline — `BRAINFERNO_MCP_EVAL_TIMEOUT_MS`, which has no
 * upper bound — when that is longer), plus 5 minutes. Twice, because a call's .jsx can wait in
 * Illustrator behind another call before it is read. It is a margin, not a guarantee: another
 * server sharing the work dir with a longer default deadline, or a script that keeps
 * Illustrator busy well past its own deadline, can outlast it, and a sweep can then remove a
 * .jsx before Illustrator reads it.
 */
export declare function staleTempFileMs(defaultTimeoutMs: number): number;
export interface OsScriptBridgeOptions {
    appId: AppId;
    defaultTimeoutMs: number;
    /** Override the platform runner (tests, or a custom bootstrap). */
    runner?: ScriptRunner;
    /**
     * Which application the platform runner drives: an AppleScript name, a bundle id, or an
     * absolute `.app` path on macOS; a COM ProgID on Windows. "" / undefined = the app's default.
     */
    target?: string;
    /** Where temp .jsx/.json files go. Defaults to the OS temp dir. */
    workDir?: string;
}
/**
 * ES3-safe prelude: a JSON stringifier and the result-file writer. Kept as a
 * raw string so the backslashes below reach ExtendScript unchanged. No arrow
 * functions, no const/let, no template literals, no JSON global — on purpose.
 */
export declare const JSX_PRELUDE: string;
/** Wraps a user script (an expression, typically an IIFE) into a self-reporting .jsx. */
export declare function wrapScript(script: string, resultPath: string): string;
/** Forward-slash path for use inside a JS/ExtendScript string on any OS. */
export declare function jsxPath(path: string): string;
/**
 * How one platform's runner reports a failure: the hint in its error message (what the typed
 * ai_* tools show), and which failures provably happened before the script reached the app.
 */
export interface RunnerProfile {
    notConnectedHint: string;
    /** True only when the runner's first stderr line proves nothing was dispatched. */
    beforeDispatch: (firstLine: string) => boolean;
}
/** Windows (powershell.exe -> COM). */
export declare const WINDOWS_RUNNER_PROFILE: RunnerProfile;
/** macOS (osascript -> AppleScript `do javascript`). */
export declare const MAC_RUNNER_PROFILE: RunnerProfile;
/**
 * The error for a runner process that exited non-zero: AppNotConnectedError when its output
 * proves the script never reached the app, otherwise RunnerExitedError (when in doubt,
 * dispatched). The message is the same either way, so the typed ai_* tools read as before.
 */
export declare function runnerExitError(code: number | null, stderr: string, profile: RunnerProfile): AppNotConnectedError;
/** Spawns a runner process; resolves on exit 0, rejects with the classified error otherwise. */
export declare function spawnRunner(cmd: string, args: string[], signal: AbortSignal, profile: RunnerProfile): Promise<void>;
/**
 * Windows persistent COM runner: maintains a single background PowerShell session
 * holding the COM automation instance. This completely eliminates the 10+ second
 * cold-start overhead per call, prevents class factory race conditions and
 * single-instance mutex deadlocks, and reduces per-call latency to ~25ms.
 */
export declare class PersistentWindowsComRunner {
    private child;
    private pending;
    private startPromise;
    private progId;
    constructor(progId: string);
    private start;
    private reset;
    run(path: string, signal: AbortSignal): Promise<void>;
    kill(): void;
}
export declare function getWindowsComWorker(progId: string): PersistentWindowsComRunner;
export declare function closeWindowsComWorkers(): void;
/**
 * Windows: PowerShell drives the COM automation server via persistent worker;
 * a running instance is reused.
 */
export declare function windowsRunner(progId: string): ScriptRunner;
/**
 * How an app is addressed in AppleScript. A bare name is what Adobe documents, but on a Mac
 * with both the release and the Beta installed BOTH bundles are named `Adobe Illustrator.app`,
 * so a name resolves to whichever LaunchServices picks — in practice the one already running,
 * which flips mid-session. A bundle id or an absolute `.app` path is unambiguous, so the target
 * may be given as any of the three (config `illustratorApp` / `BRAINFERNO_MCP_ILLUSTRATOR_APP`).
 */
export declare function appleScriptTarget(target: string): string;
/**
 * The AppleScript the macOS runner sends, one line per `-e`. AppleScript gives up waiting for
 * an Apple-event reply after 120 s by default (-1712) while the app keeps running the script,
 * so `do javascript` runs inside a timeout 5 s longer than the call's own deadline: the
 * server's deadline always fires first.
 */
export declare function appleScriptLines(target: string, path: string, timeoutMs: number): string[];
/** macOS: AppleScript `do javascript`. First run prompts for Automation permission (TCC). */
export declare function macRunner(appleScriptName: string): ScriptRunner;
export declare function platformRunner(appId: AppId, target?: string): ScriptRunner;
export declare class OsScriptBridge implements AppBridge {
    private readonly options;
    readonly appId: AppId;
    /** The stale-file sweep started when the bridge was built (never rejects; awaitable by tests). */
    readonly initialSweep: Promise<void>;
    private readonly runner;
    private readonly workDir;
    /** staleTempFileMs for this bridge's default deadline. */
    private readonly staleAfterMs;
    private queue;
    constructor(options: OsScriptBridgeOptions);
    /**
     * Best effort, never throws: removes the lane's temp files (`<uuid>.jsx`, `<uuid>.result.json`)
     * older than staleTempFileMs(defaultTimeoutMs) — the files of a server killed mid-call, or a
     * result written by a script that outlived its call's timeout. Several servers may share the
     * work dir, so only old files go; anything else in the directory is left alone.
     */
    private sweepStaleFiles;
    /** The lane can launch the app itself, so it is always "reachable". */
    isConnected(): boolean;
    execute(name: string, params?: JsonValue, options?: EvalOptions): Promise<JsonValue>;
    evaluate(script: string, options?: EvalOptions): Promise<JsonValue>;
    private runOne;
    close(): Promise<void>;
}
