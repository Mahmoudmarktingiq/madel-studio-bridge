/**
 * MADEL Studio Bridge — Bounded FIFO WorkLimiter
 * Developed & Maintained by Mahmoud Adel
 * Clean-Room concurrency bounding, queue timeouts, cancellation, and backpressure
 */
import { GatewayError } from "./errors.js";
import { GatewayMetricsTracker } from "./metrics.js";
export class WorkLimiter {
    name;
    concurrency;
    maxQueueSize;
    queueWaitTimeoutMs;
    executionTimeoutMs;
    metrics;
    activeCount = 0;
    queue = [];
    isShuttingDown = false;
    shutdownPromise;
    constructor(options = {}) {
        this.name = options.name || "default";
        this.concurrency = Math.max(1, options.concurrency ?? 1);
        this.maxQueueSize = Math.max(1, options.maxQueueSize ?? 100);
        this.queueWaitTimeoutMs = options.queueWaitTimeoutMs ?? 30_000;
        this.executionTimeoutMs = options.executionTimeoutMs ?? 60_000;
        this.metrics = options.metrics;
    }
    get active() {
        return this.activeCount;
    }
    get pending() {
        return this.queue.length;
    }
    get capacity() {
        return this.concurrency;
    }
    get maxQueue() {
        return this.maxQueueSize;
    }
    /**
     * Schedules a task to run within the concurrency limits of this WorkLimiter.
     */
    execute(task, options = {}) {
        if (this.isShuttingDown) {
            return Promise.reject(GatewayError.shutdown(this.name, options.correlationId, options.requestId));
        }
        // Check if task is already aborted prior to enqueueing
        if (options.signal?.aborted) {
            if (this.metrics)
                this.metrics.onTaskCancelled(this.name, false);
            return Promise.reject(GatewayError.cancelled(this.name, String(options.signal.reason || "Task signal was already aborted"), options.correlationId, options.requestId, true));
        }
        // Apply backpressure if queue is full
        if (this.queue.length >= this.maxQueueSize) {
            if (this.metrics)
                this.metrics.onTaskFailed(this.name, 0);
            return Promise.reject(GatewayError.queueOverflow(this.name, this.queue.length, this.maxQueueSize, options.correlationId, options.requestId));
        }
        return new Promise((resolve, reject) => {
            const item = {
                id: options.requestId || Math.random().toString(36).slice(2),
                task,
                resolve,
                reject,
                enqueuedAt: Date.now(),
                signal: options.signal,
                timeoutMs: options.timeoutMs,
                correlationId: options.correlationId,
                requestId: options.requestId,
                clientId: options.clientId,
            };
            // Set up queue wait timeout
            const waitTimeoutMs = this.queueWaitTimeoutMs;
            if (waitTimeoutMs > 0 && waitTimeoutMs !== Infinity) {
                item.waitTimer = setTimeout(() => {
                    this.removeQueuedItem(item);
                    const waited = Date.now() - item.enqueuedAt;
                    if (this.metrics)
                        this.metrics.onTaskCancelled(this.name, false, true);
                    item.reject(GatewayError.queueWaitTimeout(this.name, waited, waitTimeoutMs, item.correlationId, item.requestId));
                }, waitTimeoutMs);
                item.waitTimer.unref?.();
            }
            // Set up abort listener for queued task
            if (item.signal) {
                const onAbort = () => {
                    this.removeQueuedItem(item);
                    if (this.metrics)
                        this.metrics.onTaskCancelled(this.name, false);
                    item.reject(GatewayError.cancelled(this.name, String(item.signal?.reason || "Client cancelled queued task"), item.correlationId, item.requestId, true));
                };
                item.abortListener = onAbort;
                item.signal.addEventListener("abort", onAbort, { once: true });
            }
            if (this.metrics)
                this.metrics.onTaskQueued(this.name);
            this.queue.push(item);
            this.dispatchNext();
        });
    }
    removeQueuedItem(item) {
        const idx = this.queue.indexOf(item);
        if (idx !== -1) {
            this.queue.splice(idx, 1);
            if (item.waitTimer)
                clearTimeout(item.waitTimer);
            if (item.signal && item.abortListener) {
                item.signal.removeEventListener("abort", item.abortListener);
            }
            return true;
        }
        return false;
    }
    /**
     * Cancels all pending tasks belonging to a specific client ID (e.g. on client disconnect).
     */
    cancelTasksForClient(clientId, reason = "Client disconnected") {
        let cancelled = 0;
        for (let i = this.queue.length - 1; i >= 0; i--) {
            const item = this.queue[i];
            if (!item)
                continue;
            if (item.clientId === clientId) {
                this.queue.splice(i, 1);
                if (item.waitTimer)
                    clearTimeout(item.waitTimer);
                if (item.signal && item.abortListener) {
                    item.signal.removeEventListener("abort", item.abortListener);
                }
                if (this.metrics)
                    this.metrics.onTaskCancelled(this.name, false);
                item.reject(GatewayError.cancelled(this.name, reason, item.correlationId, item.requestId, true));
                cancelled++;
            }
        }
        return cancelled;
    }
    dispatchNext() {
        if (this.activeCount >= this.concurrency || this.queue.length === 0 || this.isShuttingDown) {
            return;
        }
        const item = this.queue.shift();
        if (!item)
            return;
        // Clean up wait timer and queue abort listener
        if (item.waitTimer)
            clearTimeout(item.waitTimer);
        if (item.signal && item.abortListener) {
            item.signal.removeEventListener("abort", item.abortListener);
        }
        const queueWaitMs = Date.now() - item.enqueuedAt;
        if (this.metrics)
            this.metrics.onTaskDequeued(this.name, queueWaitMs);
        // If aborted right at the moment of dequeuing, don't execute
        if (item.signal?.aborted) {
            if (this.metrics)
                this.metrics.onTaskCancelled(this.name, false);
            item.reject(GatewayError.cancelled(this.name, String(item.signal.reason || "Task was aborted prior to execution"), item.correlationId, item.requestId, true));
            this.dispatchNext();
            return;
        }
        this.activeCount++;
        if (this.metrics)
            this.metrics.onTaskStarted(this.name);
        const execStartTime = Date.now();
        const execTimeoutMs = item.timeoutMs && item.timeoutMs > 0 ? item.timeoutMs : this.executionTimeoutMs;
        // Build execution controller linking parent signal and execution deadline
        const execController = new AbortController();
        let execTimer;
        let timedOut = false;
        let settled = false;
        if (execTimeoutMs > 0 && execTimeoutMs !== Infinity) {
            execTimer = setTimeout(() => {
                timedOut = true;
                execController.abort(new Error(`Execution exceeded limit of ${execTimeoutMs}ms`));
                if (!settled) {
                    settled = true;
                    if (this.metrics)
                        this.metrics.onTaskFailed(this.name, execTimeoutMs, true);
                    item.reject(GatewayError.executionTimeout(this.name, execTimeoutMs, execTimeoutMs, item.correlationId, item.requestId));
                }
            }, execTimeoutMs);
            execTimer.unref?.();
        }
        let onParentAbort;
        if (item.signal) {
            onParentAbort = () => {
                execController.abort(item.signal?.reason);
                if (!settled) {
                    settled = true;
                    if (this.metrics)
                        this.metrics.onTaskCancelled(this.name, true);
                    item.reject(GatewayError.cancelled(this.name, String(item.signal?.reason || "Running task cancelled by client"), item.correlationId, item.requestId, false));
                }
            };
            item.signal.addEventListener("abort", onParentAbort, { once: true });
        }
        const cleanup = () => {
            if (execTimer)
                clearTimeout(execTimer);
            if (item.signal && onParentAbort) {
                item.signal.removeEventListener("abort", onParentAbort);
            }
            this.activeCount = Math.max(0, this.activeCount - 1);
        };
        // Run the actual task
        item
            .task(execController.signal)
            .then((result) => {
            const executionMs = Date.now() - execStartTime;
            cleanup();
            if (settled)
                return;
            settled = true;
            if (this.metrics)
                this.metrics.onTaskCompleted(this.name, executionMs);
            item.resolve(result);
        })
            .catch((err) => {
            const executionMs = Date.now() - execStartTime;
            cleanup();
            if (settled)
                return;
            settled = true;
            if (timedOut) {
                if (this.metrics)
                    this.metrics.onTaskFailed(this.name, executionMs, true);
                item.reject(GatewayError.executionTimeout(this.name, executionMs, execTimeoutMs, item.correlationId, item.requestId));
            }
            else if (execController.signal.aborted) {
                if (this.metrics)
                    this.metrics.onTaskCancelled(this.name, true);
                item.reject(GatewayError.cancelled(this.name, String(err?.message || "Running task aborted"), item.correlationId, item.requestId, false));
            }
            else {
                if (this.metrics)
                    this.metrics.onTaskFailed(this.name, executionMs, false);
                item.reject(err instanceof Error ? err : new Error(String(err)));
            }
        })
            .finally(() => {
            this.dispatchNext();
        });
    }
    /**
     * Graceful shutdown: rejects pending tasks and optionally waits for active tasks to complete.
     */
    async shutdown(drainTimeoutMs = 5000) {
        if (this.shutdownPromise)
            return this.shutdownPromise;
        this.isShuttingDown = true;
        // Reject all queued tasks immediately
        while (this.queue.length > 0) {
            const item = this.queue.shift();
            if (item) {
                if (item.waitTimer)
                    clearTimeout(item.waitTimer);
                if (item.signal && item.abortListener) {
                    item.signal.removeEventListener("abort", item.abortListener);
                }
                if (this.metrics)
                    this.metrics.onTaskCancelled(this.name, false);
                item.reject(GatewayError.shutdown(this.name, item.correlationId, item.requestId));
            }
        }
        if (this.activeCount === 0) {
            return Promise.resolve();
        }
        this.shutdownPromise = new Promise((resolve) => {
            const deadline = Date.now() + drainTimeoutMs;
            const check = setInterval(() => {
                if (this.activeCount === 0 || Date.now() >= deadline) {
                    clearInterval(check);
                    resolve();
                }
            }, 50);
            check.unref?.();
        });
        return this.shutdownPromise;
    }
}
//# sourceMappingURL=work-limiter.js.map