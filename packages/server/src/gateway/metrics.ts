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

class ResourceMetricsInternal {
  public activeRequests = 0;
  public pendingRequests = 0;
  public completedRequests = 0;
  public failedRequests = 0;
  public cancelledRequests = 0;
  public timeoutCount = 0;

  public totalQueueWaitMs = 0;
  public queueWaitSamples = 0;
  public maxQueueWaitMs = 0;
  public minQueueWaitMs = Infinity;

  public totalExecutionMs = 0;
  public executionSamples = 0;
  public maxExecutionMs = 0;
  public minExecutionMs = Infinity;

  constructor(public readonly resourceKey: string) {}

  public recordQueueWait(durationMs: number): void {
    this.totalQueueWaitMs += durationMs;
    this.queueWaitSamples += 1;
    if (durationMs > this.maxQueueWaitMs) this.maxQueueWaitMs = durationMs;
    if (durationMs < this.minQueueWaitMs) this.minQueueWaitMs = durationMs;
  }

  public recordExecution(durationMs: number): void {
    this.totalExecutionMs += durationMs;
    this.executionSamples += 1;
    if (durationMs > this.maxExecutionMs) this.maxExecutionMs = durationMs;
    if (durationMs < this.minExecutionMs) this.minExecutionMs = durationMs;
  }

  public toSnapshot(): ResourceMetricSnapshot {
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
  private readonly startedAt: number = Date.now();
  private readonly resources = new Map<string, ResourceMetricsInternal>();

  private getOrCreate(resourceKey: string): ResourceMetricsInternal {
    let metric = this.resources.get(resourceKey);
    if (!metric) {
      metric = new ResourceMetricsInternal(resourceKey);
      this.resources.set(resourceKey, metric);
    }
    return metric;
  }

  public onTaskQueued(resourceKey: string): void {
    this.getOrCreate(resourceKey).pendingRequests += 1;
  }

  public onTaskDequeued(resourceKey: string, queueWaitMs: number): void {
    const m = this.getOrCreate(resourceKey);
    m.pendingRequests = Math.max(0, m.pendingRequests - 1);
    m.recordQueueWait(queueWaitMs);
  }

  public onTaskStarted(resourceKey: string): void {
    this.getOrCreate(resourceKey).activeRequests += 1;
  }

  public onTaskCompleted(resourceKey: string, executionMs: number): void {
    const m = this.getOrCreate(resourceKey);
    m.activeRequests = Math.max(0, m.activeRequests - 1);
    m.completedRequests += 1;
    m.recordExecution(executionMs);
  }

  public onTaskFailed(resourceKey: string, executionMs: number, isTimeout = false): void {
    const m = this.getOrCreate(resourceKey);
    m.activeRequests = Math.max(0, m.activeRequests - 1);
    m.failedRequests += 1;
    if (isTimeout) m.timeoutCount += 1;
    m.recordExecution(executionMs);
  }

  public onTaskCancelled(resourceKey: string, wasActive: boolean, wasTimeout = false): void {
    const m = this.getOrCreate(resourceKey);
    if (wasActive) {
      m.activeRequests = Math.max(0, m.activeRequests - 1);
    } else {
      m.pendingRequests = Math.max(0, m.pendingRequests - 1);
    }
    m.cancelledRequests += 1;
    if (wasTimeout) m.timeoutCount += 1;
  }

  public getSnapshot(): GatewayMetricsSnapshot {
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

    const resourceSnapshots: Record<string, ResourceMetricSnapshot> = {};

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

  public reset(): void {
    this.resources.clear();
  }
}
