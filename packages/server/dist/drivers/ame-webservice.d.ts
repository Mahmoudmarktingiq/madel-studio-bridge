/**
 * Adobe Media Encoder's built-in "Remote AME" web service
 * (`ame_webservice_console.exe`, shipped with every AME since CC 2014).
 *
 * The console starts a hidden AME renderer and serves a tiny XML-over-HTTP
 * API: GET /server, GET/POST/DELETE /job, GET /history. One job at a time;
 * sources can be media files, a .prproj (+ sequence GUID) or FCP XML; the
 * encoder settings come from an .epr preset. Verified on AME 26.3.2 (Windows):
 * listener up in ~5 s, a WAV→MP3 job accepted and finished in <5 s.
 *
 * Facts this driver is built on:
 * - The service binds the address in `ame_webservice_config.ini` beside the
 *   exe; with `ip` unset it picks a LAN adapter, not loopback. We probe every
 *   local IPv4 address for the configured port.
 * - Killing the console leaves the renderer alive: stop with a tree kill.
 * - Job status strings seen: Queued, Encoding, Success; failures carry
 *   "Fail"/"Error" and abort "Abort" in JobStatus, with <Details>.
 */
export interface AmeWebServiceOptions {
    /** Path to ame_webservice_console(.exe); "" = auto-detect. */
    exePath: string;
    /** Port override; 0 = read `port` from the ini beside the exe (default 8080). */
    port: number;
    /** Extra command-line arguments for the console. */
    extraArgs: string[];
    /** Stop the service after this long without a job. 0 = never. */
    idleMs: number;
    /** For tests: fixed base URL of an already-running service; skips spawning. */
    baseUrl?: string;
    /** For tests: overrides how running renderer pids are listed (macOS). */
    listRenderers?: () => Promise<Set<number>>;
}
export interface AmeServerInfo {
    serverStatus: string;
    jobStatus: string;
    jobId: string;
    jobProgress: string;
    details: string;
    serverIp?: string;
    serverPort?: string;
}
export interface AmeJobInfo {
    jobId: string;
    jobStatus: string;
    jobProgress: string;
    details: string;
    sourcePresetPath?: string;
    sourceFilePath?: string;
    destinationPath?: string;
}
export interface AmeSubmitRequest {
    sourcePath: string;
    presetPath: string;
    destinationPath: string;
    sequenceGuid?: string;
    overwrite?: boolean;
    notificationTarget?: string;
}
export declare function isTerminalStatus(status: string): boolean;
export declare function isSuccessStatus(status: string): boolean;
/** First text inside <tag>…</tag>, or "" — the payloads are flat XML. */
export declare function tag(xml: string, name: string): string;
export declare function parseServer(xml: string): AmeServerInfo;
export declare function parseJob(xml: string): AmeJobInfo;
/** History payload: the current job fields plus <CompletedJobs><Job>…</Job></CompletedJobs>. */
export declare function parseHistory(xml: string): AmeJobInfo[];
export declare function buildManifest(r: AmeSubmitRequest): string;
/** Newest "Adobe Media Encoder <year>" console beside the other Adobe apps. `roots` overrides the search folders (tests). */
export declare function detectConsoleExe(platform?: NodeJS.Platform, roots?: string[]): Promise<string | null>;
/**
 * Where the console reads `ame_webservice_config.ini`. Windows: beside the exe.
 * macOS: `Contents/Resources` of the outer Media Encoder bundle (traced with fs_usage on
 * AME 26.3: the console sits in a nested bundle, ignores the cwd and every flag, and
 * Adobe ships no ini at all — without one it prints "can not open config file" and never
 * listens). The installer creates it.
 */
export declare function iniPathFor(exePath: string, platform?: NodeJS.Platform): string;
/** `port = 8080` from the console's ini; 8080 when unreadable. */
export declare function portFromIni(exePath: string, platform?: NodeJS.Platform): Promise<number>;
/**
 * macOS: pids of the hidden renderers the console launches (`…/Adobe Media Encoder <year>.app/Contents/MacOS/Adobe Media Encoder <year>`).
 * The renderer is re-parented to launchd in its own process group, so killing the console's
 * group does not reach it (verified on 26.3); the driver tracks the ones it caused instead.
 */
export declare function macRendererPids(): Promise<Set<number>>;
/** Pids in `after` that were not in `before`: the processes a spawn caused. */
export declare function newPids(before: Set<number>, after: Set<number>): number[];
export declare function httpRequest(baseUrl: string, method: "GET" | "POST" | "DELETE", path: string, body?: string, timeoutMs?: number): Promise<{
    status: number;
    text: string;
}>;
/** Loopback first, then every non-internal IPv4 address — the service may bind either. */
export declare function candidateHosts(): string[];
export declare class AmeWebService {
    private readonly options;
    private child;
    private baseUrl;
    private idleTimer;
    private starting;
    private exe;
    /** macOS: renderer pids our console spawned (see macRendererPids). */
    private rendererPids;
    constructor(options: AmeWebServiceOptions);
    get address(): string | null;
    get isRunning(): boolean;
    /**
     * Raw node:http on purpose: the service parses header names case-sensitively
     * and never answers a POST whose `content-length` is lowercase (as `fetch`
     * sends it). Verified live on 26.3.2.
     */
    private http;
    /** Find a service already answering on any local address (started by us or by the user). */
    discover(port: number): Promise<string | null>;
    private resolveExeAndPort;
    /** Start the console if nothing answers yet; resolves with the base URL. */
    ensureRunning(): Promise<string>;
    private touch;
    server(): Promise<AmeServerInfo>;
    job(): Promise<AmeJobInfo>;
    history(): Promise<AmeJobInfo[]>;
    submit(req: AmeSubmitRequest, opts?: {
        busyWaitMs?: number;
        signal?: AbortSignal;
    }): Promise<AmeJobInfo & {
        submitResult: string;
    }>;
    cancel(jobId: string): Promise<AmeJobInfo>;
    /** Poll /job until the given job reaches a terminal state. */
    waitForJob(jobId: string, opts: {
        timeoutMs: number;
        signal?: AbortSignal;
        onProgress?: (j: AmeJobInfo) => void;
        intervalMs?: number;
    }): Promise<AmeJobInfo>;
    /** Stop the console we started (tree kill: the renderer it spawned goes too). */
    stop(): Promise<void>;
    get executable(): string | null;
}
