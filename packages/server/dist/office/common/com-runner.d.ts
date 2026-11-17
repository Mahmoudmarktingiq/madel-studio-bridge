/**
 * MADEL Studio Bridge — Persistent Windows COM Runner for Microsoft Office
 * Developed and maintained by Mahmoud Adel
 *
 * Implements high-performance, silent, persistent Windows COM automation workers
 * for Word, Excel, and PowerPoint. Communicates via base64 UTF-8 JSON over standard
 * streams, enforcing strict timeouts, error recovery, and clean resource disposal.
 */
import type { OfficeAppId } from "./types.js";
export interface ComExecutionResult<T = unknown> {
    success: boolean;
    data?: T;
    error?: string;
    executionMs: number;
}
export declare class OfficeComWorker {
    readonly appId: OfficeAppId;
    readonly progId: string;
    private readonly defaultTimeoutMs;
    private child;
    private pending;
    private isStarting;
    private startPromise;
    constructor(appId: OfficeAppId, progId: string, defaultTimeoutMs?: number);
    isAlive(): boolean;
    start(): Promise<void>;
    execute<T = unknown>(script: string, timeoutMs?: number): Promise<ComExecutionResult<T>>;
    stop(): Promise<void>;
    private reset;
}
export declare class OfficeComPool {
    private static workers;
    static getWorker(appId: OfficeAppId): OfficeComWorker;
    static closeAll(): Promise<void>;
    static stopAll(): Promise<void>;
}
