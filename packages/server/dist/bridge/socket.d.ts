import type { AppId } from "@brainferno/mcp-bridge-protocol";
import { ConcurrencyManager } from "../gateway/index.js";
import { type AppBridge } from "./types.js";
export interface BridgeServerOptions {
    port: number;
    /** Explicit shared secret. Ignored when `insecure` is set. */
    token: string;
    /** Disable authentication and skip the handshake file (debug/tests only). */
    insecure?: boolean;
    defaultTimeoutMs: number;
    /** Ping cadence; 0 disables the heartbeat (tests). */
    heartbeatIntervalMs?: number;
    /** How long a fresh socket has to send a valid hello before it is closed. */
    authDeadlineMs?: number;
    /** Where to write the port+token handshake file. Skipped when `insecure`. */
    handshakeFilePath?: string;
    /** Extra Origins to accept, beyond loopback origins and the no-Origin case. */
    allowedOrigins?: string[];
    /** Maximum concurrent sockets before new upgrades are refused. */
    maxConnections?: number;
    /** Loopback only by default — this port evaluates arbitrary script. */
    host?: string;
    /** Concurrency and request limiter manager (defaults to globalConcurrencyManager). */
    concurrencyManager?: ConcurrencyManager;
}
/**
 * Accepts panel connections and routes commands to whichever application each
 * panel authenticated as. One panel per application; a second authenticated
 * connection for the same application replaces the first.
 *
 * Security posture (a localhost WebSocket is reachable by any local process and,
 * because browsers exempt WebSockets from the same-origin policy, by any web
 * page the user visits): the upgrade is Origin/Host-validated; every socket must
 * present a valid token in its hello within a short deadline before any other
 * frame is honored; and results are matched per-socket so one panel can never
 * settle another's in-flight call.
 */
export declare class BridgeServer {
    private readonly options;
    private wss;
    private readonly panels;
    private readonly states;
    /** Serializes commands per app: one script/modal scope per host at a time. */
    private readonly appQueues;
    /** Per app: how many panels completed a hello (connectionEpoch). Never decremented. */
    private readonly epochs;
    private readonly token;
    private readonly insecure;
    private readonly heartbeatIntervalMs;
    private readonly authDeadlineMs;
    private readonly allowedOrigins;
    private readonly maxConnections;
    readonly concurrencyManager: ConcurrencyManager;
    private heartbeat?;
    constructor(options: BridgeServerOptions);
    private listen;
    /**
     * Resolves once a listening socket is bound. If the preferred port is taken
     * (typically a stale server instance still holding it), falls back to an
     * OS-assigned port: panels discover the real port from the handshake file,
     * so a fixed port is a preference, not a requirement.
     */
    ready(): Promise<void>;
    private waitListening;
    /** The bound port, or 0 before the server is listening. */
    port(): number;
    bridgeFor(appId: AppId): AppBridge;
    /** The effective panel token, for redacting error text in this process only ([] in insecure mode). Never log or send it. */
    redactionSecrets(): string[];
    connectedApps(): AppId[];
    /**
     * What the connected panel for `appId` said in its hello (versions, implemented command
     * names), or null when no panel is connected for that app. Absent fields are null.
     */
    panelInfo(appId: AppId): {
        panelVersion: string | null;
        hostVersion: string | null;
        capabilities: string[] | null;
    } | null;
    private onListening;
    private verifyUpgrade;
    private originAllowed;
    private onConnection;
    private onMessage;
    private handleHello;
    private tokenMatches;
    private settle;
    private onClose;
    private pingAll;
    private execute;
    private dispatch;
    private resolveTimeout;
    private connectHint;
    private send;
    close(): Promise<void>;
}
