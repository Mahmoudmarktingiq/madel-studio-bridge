/**
 * MADEL Studio Bridge — Bounded FIFO WorkLimiter
 * Developed & Maintained by Mahmoud Adel
 * Clean-Room concurrency bounding, queue timeouts, cancellation, and backpressure
 */
import { GatewayMetricsTracker } from "./metrics.js";
export interface WorkLimiterOptions {
    readonly name?: string;
    readonly concurrency?: number;
    readonly maxQueueSize?: number;
    readonly queueWaitTimeoutMs?: number;
    readonly executionTimeoutMs?: number;
    readonly metrics?: GatewayMetricsTracker;
}
export interface TaskOptions {
    readonly signal?: AbortSignal;
    readonly timeoutMs?: number;
    readonly correlationId?: string;
    readonly requestId?: string;
    readonly clientId?: string;
}
export declare class WorkLimiter {
    readonly name: string;
    private readonly concurrency;
    private readonly maxQueueSize;
    private readonly queueWaitTimeoutMs;
    private readonly executionTimeoutMs;
    private readonly metrics?;
    private activeCount;
    private readonly queue;
    private isShuttingDown;
    private shutdownPromise?;
    constructor(options?: WorkLimiterOptions);
    get active(): number;
    get pending(): number;
    get capacity(): number;
    get maxQueue(): number;
    /**
     * Schedules a task to run within the concurrency limits of this WorkLimiter.
     */
    execute<T>(task: (signal: AbortSignal) => Promise<T>, options?: TaskOptions): Promise<T>;
    private removeQueuedItem;
    /**
     * Cancels all pending tasks belonging to a specific client ID (e.g. on client disconnect).
     */
    cancelTasksForClient(clientId: string, reason?: string): number;
    private dispatchNext;
    /**
     * Graceful shutdown: rejects pending tasks and optionally waits for active tasks to complete.
     */
    shutdown(drainTimeoutMs?: number): Promise<void>;
}
