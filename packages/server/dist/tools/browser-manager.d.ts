/**
 * MADEL Studio Bridge — Browser Automation Session Manager
 * Developed and maintained by Mahmoud Adel
 *
 * Coordinates isolated Chromium instances (Google Chrome & Microsoft Edge)
 * via direct Chrome DevTools Protocol (CDP) on dynamic localhost ports.
 * Strict process scoping: terminates only MADEL-owned PIDs and cleans up ephemeral profiles.
 */
import { ChildProcess } from "node:child_process";
import { CDPClient } from "./cdp-client.js";
export interface BrowserInfo {
    id: string;
    name: string;
    type: "chrome" | "edge" | "brave" | "chromium";
    executablePath: string;
    version?: string;
    isDefault?: boolean;
    supported: boolean;
}
export interface ManagedBrowserSession {
    sessionId: string;
    browserType: string;
    executablePath: string;
    port: number;
    pid: number;
    process: ChildProcess;
    tempProfileDir: string;
    cdpClient: CDPClient;
    createdAt: string;
    headless: boolean;
    ownerClientId?: string;
}
export interface CreateSessionOptions {
    browserType?: "chrome" | "edge" | "brave";
    headless?: boolean;
    viewport?: {
        width?: number;
        height?: number;
    };
    ownerClientId?: string;
}
export declare class BrowserManager {
    private readonly sessions;
    private readonly isWin;
    constructor();
    /**
     * Discovers installed web browsers on the host system.
     */
    listAvailableBrowsers(): BrowserInfo[];
    private getExecutableVersion;
    /**
     * Finds an available free local TCP port dynamically.
     */
    private findFreePort;
    /**
     * Resolves the root directory for temporary browser session profiles.
     */
    private resolveProfileBaseDir;
    /**
     * Creates an isolated browser session with ephemeral user data and connects via CDP.
     */
    createSession(options?: CreateSessionOptions): Promise<ManagedBrowserSession>;
    private fetchJson;
    /**
     * Retrieves a managed session by ID with ownership validation.
     */
    getSession(sessionId: string, clientId?: string): ManagedBrowserSession;
    /**
     * Lists all active sessions currently managed.
     */
    listSessions(): Promise<Array<{
        sessionId: string;
        browserType: string;
        port: number;
        pid: number;
        currentUrl: string;
        title: string;
        headless: boolean;
        createdAt: string;
    }>>;
    /**
     * Safely closes a single managed session, terminates the child process, and removes temp profile.
     */
    closeSession(sessionId: string, clientId?: string): Promise<{
        success: boolean;
        closedPid: number;
        cleanedTempDir: boolean;
    }>;
    private killPid;
    /**
     * Synchronous cleanup on process exit.
     */
    closeAllSessionsSync(): void;
    /**
     * Asynchronous graceful shutdown.
     */
    shutdown(): Promise<void>;
}
export declare const globalBrowserManager: BrowserManager;
