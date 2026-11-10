/**
 * MADEL Studio Bridge — Resource-Scoped Concurrency Manager
 * Developed & Maintained by Mahmoud Adel
 * Coordinates independent, isolated WorkLimiters per application and operation scope
 */
import { getCurrentRequestContext } from "./context.js";
import { GatewayMetricsTracker } from "./metrics.js";
import { WorkLimiter } from "./work-limiter.js";
export const DEFAULT_SCOPE_POLICIES = {
    // Adobe Photoshop: serialized on UXP / ActionDescriptor
    "photoshop:mutation": { concurrency: 1, maxQueueSize: 100, queueWaitTimeoutMs: 30_000, executionTimeoutMs: 60_000 },
    "photoshop:read": { concurrency: 1, maxQueueSize: 100, queueWaitTimeoutMs: 30_000, executionTimeoutMs: 30_000 },
    // Blender: serialized on main socket loop
    "blender:mutation": { concurrency: 1, maxQueueSize: 50, queueWaitTimeoutMs: 30_000, executionTimeoutMs: 60_000 },
    "blender:read": { concurrency: 1, maxQueueSize: 50, queueWaitTimeoutMs: 30_000, executionTimeoutMs: 30_000 },
    // CapCut: file/CLI automation
    "capcut:mutation": { concurrency: 1, maxQueueSize: 50, queueWaitTimeoutMs: 30_000, executionTimeoutMs: 60_000 },
    // After Effects: serialized per ExtendScript/UXP host, renders serialized
    "after_effects:mutation": { concurrency: 1, maxQueueSize: 100, queueWaitTimeoutMs: 30_000, executionTimeoutMs: 60_000 },
    "after_effects:render": { concurrency: 1, maxQueueSize: 20, queueWaitTimeoutMs: 120_000, executionTimeoutMs: 600_000 },
    // Premiere Pro: serialized on UXP host
    "premiere:mutation": { concurrency: 1, maxQueueSize: 100, queueWaitTimeoutMs: 30_000, executionTimeoutMs: 60_000 },
    "premiere:read": { concurrency: 1, maxQueueSize: 100, queueWaitTimeoutMs: 30_000, executionTimeoutMs: 30_000 },
    // Illustrator: serialized on COM / AppleScript
    "illustrator:mutation": { concurrency: 1, maxQueueSize: 50, queueWaitTimeoutMs: 30_000, executionTimeoutMs: 60_000 },
    "illustrator:read": { concurrency: 1, maxQueueSize: 50, queueWaitTimeoutMs: 30_000, executionTimeoutMs: 30_000 },
    // Audition: serialized on CEP / WebSocket
    "audition:mutation": { concurrency: 1, maxQueueSize: 50, queueWaitTimeoutMs: 30_000, executionTimeoutMs: 60_000 },
    // Audio / FFmpeg: CPU subprocesses can run in parallel
    "audio:ffmpeg": { concurrency: 4, maxQueueSize: 100, queueWaitTimeoutMs: 60_000, executionTimeoutMs: 180_000 },
    // Browser: isolated browser session operations (P23)
    "browser:session": { concurrency: 2, maxQueueSize: 50, queueWaitTimeoutMs: 30_000, executionTimeoutMs: 60_000 },
    "browser:navigation": { concurrency: 2, maxQueueSize: 50, queueWaitTimeoutMs: 30_000, executionTimeoutMs: 60_000 },
    "browser:interaction": { concurrency: 2, maxQueueSize: 50, queueWaitTimeoutMs: 30_000, executionTimeoutMs: 30_000 },
    "browser:diagnostics": { concurrency: 4, maxQueueSize: 50, queueWaitTimeoutMs: 15_000, executionTimeoutMs: 20_000 },
    // Diagnostics & Read-only tools
    "diagnostics:read": { concurrency: 4, maxQueueSize: 100, queueWaitTimeoutMs: 10_000, executionTimeoutMs: 10_000 },
    // Default fallback scope
    "default": { concurrency: 1, maxQueueSize: 100, queueWaitTimeoutMs: 30_000, executionTimeoutMs: 60_000 },
};
const FALLBACK_POLICY = {
    concurrency: 1,
    maxQueueSize: 100,
    queueWaitTimeoutMs: 30_000,
    executionTimeoutMs: 60_000,
};
export class ConcurrencyManager {
    limiters = new Map();
    policies = new Map();
    metrics = new GatewayMetricsTracker();
    constructor(customPolicies = {}) {
        // Seed default policies
        for (const [key, pol] of Object.entries(DEFAULT_SCOPE_POLICIES)) {
            this.policies.set(key, pol);
        }
        // Apply custom overrides
        for (const [key, pol] of Object.entries(customPolicies)) {
            const base = this.policies.get(key) || FALLBACK_POLICY;
            this.policies.set(key, {
                concurrency: pol.concurrency ?? base.concurrency,
                maxQueueSize: pol.maxQueueSize ?? base.maxQueueSize,
                queueWaitTimeoutMs: pol.queueWaitTimeoutMs ?? base.queueWaitTimeoutMs,
                executionTimeoutMs: pol.executionTimeoutMs ?? base.executionTimeoutMs,
            });
        }
    }
    /**
     * Resolves the canonical resource scope key based on application and tool.
     */
    resolveScope(applicationId, toolName = "", isMutation = true) {
        const app = applicationId.toLowerCase();
        const tool = toolName.toLowerCase();
        if (app === "photoshop" || tool.startsWith("ps_")) {
            return isMutation ? "photoshop:mutation" : "photoshop:read";
        }
        if (app === "blender") {
            return isMutation ? "blender:mutation" : "blender:read";
        }
        if (app === "capcut") {
            return "capcut:mutation";
        }
        if (app === "after_effects" || tool.startsWith("ae_")) {
            if (tool.includes("render"))
                return "after_effects:render";
            return "after_effects:mutation";
        }
        if (app === "premiere" || tool.startsWith("pp_")) {
            return isMutation ? "premiere:mutation" : "premiere:read";
        }
        if (app === "illustrator" || tool.startsWith("ai_")) {
            return isMutation ? "illustrator:mutation" : "illustrator:read";
        }
        if (app === "audition" || tool.startsWith("au_")) {
            return "audition:mutation";
        }
        if (tool.startsWith("audio_") || app === "audio") {
            return "audio:ffmpeg";
        }
        if (app === "browser" || tool.startsWith("browser_")) {
            if (tool.includes("session") || tool === "browser_list_browsers")
                return "browser:session";
            if (tool.includes("navigate") || tool.includes("open_url") || tool.includes("reload") || tool.includes("back") || tool.includes("forward") || tool.includes("url") || tool.includes("title"))
                return "browser:navigation";
            if (tool.includes("console") || tool.includes("network") || tool.includes("metric") || tool.includes("accessibility") || tool.includes("dom") || tool.includes("find") || tool.includes("metadata") || tool.includes("link") || tool.includes("screenshot") || tool.includes("text"))
                return "browser:diagnostics";
            return "browser:interaction";
        }
        if (tool.startsWith("cc_") || tool.includes("diagnostic") || tool.includes("connected_apps")) {
            return "diagnostics:read";
        }
        return `${app}:${isMutation ? "mutation" : "read"}`;
    }
    /**
     * Retrieves or creates the WorkLimiter dedicated to a resource scope.
     */
    getLimiter(resourceKey, customOptions) {
        let limiter = this.limiters.get(resourceKey);
        if (!limiter) {
            const policy = this.policies.get(resourceKey) || this.policies.get("default") || FALLBACK_POLICY;
            limiter = new WorkLimiter({
                name: resourceKey,
                concurrency: customOptions?.concurrency ?? policy.concurrency,
                maxQueueSize: customOptions?.maxQueueSize ?? policy.maxQueueSize,
                queueWaitTimeoutMs: customOptions?.queueWaitTimeoutMs ?? policy.queueWaitTimeoutMs,
                executionTimeoutMs: customOptions?.executionTimeoutMs ?? policy.executionTimeoutMs,
                metrics: this.metrics,
            });
            this.limiters.set(resourceKey, limiter);
        }
        return limiter;
    }
    /**
     * Schedules a task to execute on the appropriate resource-scoped limiter.
     * Seamlessly propagates active RequestContext if available.
     */
    async schedule(resourceKey, task, options = {}) {
        const ctx = getCurrentRequestContext();
        const effectiveOptions = {
            signal: options.signal || ctx?.cancellationSignal,
            timeoutMs: options.timeoutMs,
            correlationId: options.correlationId || ctx?.correlationId,
            requestId: options.requestId || ctx?.requestId,
            clientId: options.clientId || ctx?.clientId,
        };
        const limiter = this.getLimiter(resourceKey);
        return limiter.execute(task, effectiveOptions);
    }
    /**
     * Cancels all queued tasks across all resource scopes for a disconnected client.
     */
    onClientDisconnect(clientId, reason = "Client disconnected from Gateway") {
        let totalCancelled = 0;
        for (const limiter of this.limiters.values()) {
            totalCancelled += limiter.cancelTasksForClient(clientId, reason);
        }
        return totalCancelled;
    }
    /**
     * Gets aggregated and per-resource metrics snapshot.
     */
    getMetrics() {
        return this.metrics.getSnapshot();
    }
    /**
     * Graceful shutdown of all managed limiters.
     */
    async shutdown(drainTimeoutMs = 5000) {
        const promises = [];
        for (const limiter of this.limiters.values()) {
            promises.push(limiter.shutdown(drainTimeoutMs));
        }
        await Promise.all(promises);
    }
}
// Global default singleton for gateway runtime
export const globalConcurrencyManager = new ConcurrencyManager();
//# sourceMappingURL=concurrency-manager.js.map