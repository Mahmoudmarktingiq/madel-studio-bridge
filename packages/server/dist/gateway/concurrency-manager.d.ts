/**
 * MADEL Studio Bridge — Resource-Scoped Concurrency Manager
 * Developed & Maintained by Mahmoud Adel
 * Coordinates independent, isolated WorkLimiters per application and operation scope
 */
import { GatewayMetricsTracker, type GatewayMetricsSnapshot } from "./metrics.js";
import { WorkLimiter, type TaskOptions, type WorkLimiterOptions } from "./work-limiter.js";
export interface ResourceScopePolicy {
    readonly concurrency: number;
    readonly maxQueueSize: number;
    readonly queueWaitTimeoutMs: number;
    readonly executionTimeoutMs: number;
}
export declare const DEFAULT_SCOPE_POLICIES: Record<string, ResourceScopePolicy>;
export declare class ConcurrencyManager {
    private readonly limiters;
    private readonly policies;
    readonly metrics: GatewayMetricsTracker;
    constructor(customPolicies?: Record<string, Partial<ResourceScopePolicy>>);
    /**
     * Resolves the canonical resource scope key based on application and tool.
     */
    resolveScope(applicationId: string, toolName?: string, isMutation?: boolean): string;
    /**
     * Retrieves or creates the WorkLimiter dedicated to a resource scope.
     */
    getLimiter(resourceKey: string, customOptions?: Partial<WorkLimiterOptions>): WorkLimiter;
    /**
     * Schedules a task to execute on the appropriate resource-scoped limiter.
     * Seamlessly propagates active RequestContext if available.
     */
    schedule<T>(resourceKey: string, task: (signal: AbortSignal) => Promise<T>, options?: TaskOptions): Promise<T>;
    /**
     * Cancels all queued tasks across all resource scopes for a disconnected client.
     */
    onClientDisconnect(clientId: string, reason?: string): number;
    /**
     * Gets aggregated and per-resource metrics snapshot.
     */
    getMetrics(): GatewayMetricsSnapshot;
    /**
     * Graceful shutdown of all managed limiters.
     */
    shutdown(drainTimeoutMs?: number): Promise<void>;
}
export declare const globalConcurrencyManager: ConcurrencyManager;
