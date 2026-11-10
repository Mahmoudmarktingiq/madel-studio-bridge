/**
 * MADEL Studio Bridge — Gateway Observability & Metrics Tracker
 * Developed & Maintained by Mahmoud Adel
 * Tracks throughput, latency, queue durations, and cancellation metrics for all MCP resources
 */
class ResourceMetricsInternal {
    resourceKey;
    activeRequests = 0;
    pendingRequests = 0;
    completedRequests = 0;
    failedRequests = 0;
    cancelledRequests = 0;
    timeoutCount = 0;
    totalQueueWaitMs = 0;
    queueWaitSamples = 0;
    maxQueueWaitMs = 0;
    minQueueWaitMs = Infinity;
    totalExecutionMs = 0;
    executionSamples = 0;
    maxExecutionMs = 0;
    minExecutionMs = Infinity;
    constructor(resourceKey) {
        this.resourceKey = resourceKey;
    }
    recordQueueWait(durationMs) {
        this.totalQueueWaitMs += durationMs;
        this.queueWaitSamples += 1;
        if (durationMs > this.maxQueueWaitMs)
            this.maxQueueWaitMs = durationMs;
        if (durationMs < this.minQueueWaitMs)
            this.minQueueWaitMs = durationMs;
    }
    recordExecution(durationMs) {
        this.totalExecutionMs += durationMs;
        this.executionSamples += 1;
        if (durationMs > this.maxExecutionMs)
            this.maxExecutionMs = durationMs;
        if (durationMs < this.minExecutionMs)
            this.minExecutionMs = durationMs;
    }
    toSnapshot() {
        return {
            resourceKey: this.resourceKey,
            activeRequests: this.activeRequests,
            pendingRequests: this.pendingRequests,
            completedRequests: this.completedRequests,
            failedRequests: this.failedRequests,
            cancelledRequests: this.cancelledRequests,
            timeoutCount: this.timeoutCount,
            totalRequests: this.completedRequests + this.failedRequests + this.cancelledRequests,
            avgQueueWaitMs: this.queueWaitSamples > 0 ? Math.round((this.totalQueueWaitMs / this.queueWaitSamples) * 100) / 100 : 0,
            maxQueueWaitMs: this.maxQueueWaitMs,
            minQueueWaitMs: this.minQueueWaitMs === Infinity ? 0 : this.minQueueWaitMs,
            avgExecutionMs: this.executionSamples > 0 ? Math.round((this.totalExecutionMs / this.executionSamples) * 100) / 100 : 0,
            maxExecutionMs: this.maxExecutionMs,
            minExecutionMs: this.minExecutionMs === Infinity ? 0 : this.minExecutionMs,
        };
    }
}
export class GatewayMetricsTracker {
    startedAt = Date.now();
    resources = new Map();
    getOrCreate(resourceKey) {
        let metric = this.resources.get(resourceKey);
        if (!metric) {
            metric = new ResourceMetricsInternal(resourceKey);
            this.resources.set(resourceKey, metric);
        }
        return metric;
    }
    onTaskQueued(resourceKey) {
        this.getOrCreate(resourceKey).pendingRequests += 1;
    }
    onTaskDequeued(resourceKey, queueWaitMs) {
        const m = this.getOrCreate(resourceKey);
        m.pendingRequests = Math.max(0, m.pendingRequests - 1);
        m.recordQueueWait(queueWaitMs);
    }
    onTaskStarted(resourceKey) {
        this.getOrCreate(resourceKey).activeRequests += 1;
    }
    onTaskCompleted(resourceKey, executionMs) {
        const m = this.getOrCreate(resourceKey);
        m.activeRequests = Math.max(0, m.activeRequests - 1);
        m.completedRequests += 1;
        m.recordExecution(executionMs);
    }
    onTaskFailed(resourceKey, executionMs, isTimeout = false) {
        const m = this.getOrCreate(resourceKey);
        m.activeRequests = Math.max(0, m.activeRequests - 1);
        m.failedRequests += 1;
        if (isTimeout)
            m.timeoutCount += 1;
        m.recordExecution(executionMs);
    }
    onTaskCancelled(resourceKey, wasActive, wasTimeout = false) {
        const m = this.getOrCreate(resourceKey);
        if (wasActive) {
            m.activeRequests = Math.max(0, m.activeRequests - 1);
        }
        else {
            m.pendingRequests = Math.max(0, m.pendingRequests - 1);
        }
        m.cancelledRequests += 1;
        if (wasTimeout)
            m.timeoutCount += 1;
    }
    getSnapshot() {
        let totalActive = 0;
        let totalPending = 0;
        let totalCompleted = 0;
        let totalFailed = 0;
        let totalCancelled = 0;
        let totalTimeouts = 0;
        let totalQueueWait = 0;
        let totalQueueSamples = 0;
        let totalExecWait = 0;
        let totalExecSamples = 0;
        const resourceSnapshots = {};
        for (const [key, metric] of this.resources.entries()) {
            const snap = metric.toSnapshot();
            resourceSnapshots[key] = snap;
            totalActive += snap.activeRequests;
            totalPending += snap.pendingRequests;
            totalCompleted += snap.completedRequests;
            totalFailed += snap.failedRequests;
            totalCancelled += snap.cancelledRequests;
            totalTimeouts += snap.timeoutCount;
            totalQueueWait += metric.totalQueueWaitMs;
            totalQueueSamples += metric.queueWaitSamples;
            totalExecWait += metric.totalExecutionMs;
            totalExecSamples += metric.executionSamples;
        }
        return {
            timestamp: Date.now(),
            uptimeMs: Date.now() - this.startedAt,
            totals: {
                activeRequests: totalActive,
                pendingRequests: totalPending,
                completedRequests: totalCompleted,
                failedRequests: totalFailed,
                cancelledRequests: totalCancelled,
                timeoutCount: totalTimeouts,
                totalProcessed: totalCompleted + totalFailed + totalCancelled,
                avgQueueWaitMs: totalQueueSamples > 0 ? Math.round((totalQueueWait / totalQueueSamples) * 100) / 100 : 0,
                avgExecutionMs: totalExecSamples > 0 ? Math.round((totalExecWait / totalExecSamples) * 100) / 100 : 0,
            },
            resources: resourceSnapshots,
        };
    }
    reset() {
        this.resources.clear();
    }
}
//# sourceMappingURL=metrics.js.map