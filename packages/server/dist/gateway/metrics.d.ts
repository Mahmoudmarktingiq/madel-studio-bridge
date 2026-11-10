/**
 * MADEL Studio Bridge — Gateway Observability & Metrics Tracker
 * Developed & Maintained by Mahmoud Adel
 * Tracks throughput, latency, queue durations, and cancellation metrics for all MCP resources
 */
export interface ResourceMetricSnapshot {
    readonly resourceKey: string;
    readonly activeRequests: number;
    readonly pendingRequests: number;
    readonly completedRequests: number;
    readonly failedRequests: number;
    readonly cancelledRequests: number;
    readonly timeoutCount: number;
    readonly totalRequests: number;
    readonly avgQueueWaitMs: number;
    readonly maxQueueWaitMs: number;
    readonly minQueueWaitMs: number;
    readonly avgExecutionMs: number;
    readonly maxExecutionMs: number;
    readonly minExecutionMs: number;
}
export interface GatewayMetricsSnapshot {
    readonly timestamp: number;
    readonly uptimeMs: number;
    readonly totals: {
        readonly activeRequests: number;
        readonly pendingRequests: number;
        readonly completedRequests: number;
        readonly failedRequests: number;
        readonly cancelledRequests: number;
        readonly timeoutCount: number;
        readonly totalProcessed: number;
        readonly avgQueueWaitMs: number;
        readonly avgExecutionMs: number;
    };
    readonly resources: Record<string, ResourceMetricSnapshot>;
}
export declare class GatewayMetricsTracker {
    private readonly startedAt;
    private readonly resources;
    private getOrCreate;
    onTaskQueued(resourceKey: string): void;
    onTaskDequeued(resourceKey: string, queueWaitMs: number): void;
    onTaskStarted(resourceKey: string): void;
    onTaskCompleted(resourceKey: string, executionMs: number): void;
    onTaskFailed(resourceKey: string, executionMs: number, isTimeout?: boolean): void;
    onTaskCancelled(resourceKey: string, wasActive: boolean, wasTimeout?: boolean): void;
    getSnapshot(): GatewayMetricsSnapshot;
    reset(): void;
}
