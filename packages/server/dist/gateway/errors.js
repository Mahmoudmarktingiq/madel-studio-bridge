/**
 * MADEL Studio Bridge — Gateway Structured Error Definitions
 * Developed & Maintained by Mahmoud Adel
 * Clean-Room Implementation adhering to MCP JSON-RPC 2.0 Specifications
 */
export const GatewayErrorCode = {
    QUEUE_OVERFLOW: "QUEUE_OVERFLOW",
    QUEUE_WAIT_TIMEOUT: "QUEUE_WAIT_TIMEOUT",
    EXECUTION_TIMEOUT: "EXECUTION_TIMEOUT",
    REQUEST_CANCELLED: "REQUEST_CANCELLED",
    GATEWAY_SHUTDOWN: "GATEWAY_SHUTDOWN",
    RESOURCE_UNAVAILABLE: "RESOURCE_UNAVAILABLE",
};
export class GatewayError extends Error {
    code;
    rpcCode;
    httpStatus;
    retryable;
    correlationId;
    requestId;
    resourceKey;
    queueWaitMs;
    executionMs;
    details;
    constructor(options) {
        super(options.message);
        this.name = "GatewayError";
        this.code = options.code;
        this.rpcCode = options.rpcCode;
        this.httpStatus = options.httpStatus;
        this.retryable = options.retryable;
        this.correlationId = options.correlationId;
        this.requestId = options.requestId;
        this.resourceKey = options.resourceKey;
        this.queueWaitMs = options.queueWaitMs;
        this.executionMs = options.executionMs;
        this.details = options.details;
        // Preserve clean stack trace
        if (Error.captureStackTrace) {
            Error.captureStackTrace(this, GatewayError);
        }
    }
    toJSON() {
        return {
            name: this.name,
            code: this.code,
            message: this.message,
            rpcCode: this.rpcCode,
            httpStatus: this.httpStatus,
            retryable: this.retryable,
            correlationId: this.correlationId,
            requestId: this.requestId,
            resourceKey: this.resourceKey,
            queueWaitMs: this.queueWaitMs,
            executionMs: this.executionMs,
            details: this.details,
        };
    }
    toRpcError() {
        return {
            code: this.rpcCode,
            message: this.message,
            data: {
                code: this.code,
                retryable: this.retryable,
                correlationId: this.correlationId,
                requestId: this.requestId,
                resourceKey: this.resourceKey,
            },
        };
    }
    static queueOverflow(resourceKey, queueSize, maxQueueSize, correlationId, requestId) {
        return new GatewayError({
            code: GatewayErrorCode.QUEUE_OVERFLOW,
            message: `Queue overflow for resource '${resourceKey}': reached maximum capacity (${queueSize}/${maxQueueSize} queued). Request dropped under backpressure.`,
            rpcCode: -32001,
            httpStatus: 429,
            retryable: true,
            correlationId,
            requestId,
            resourceKey,
            details: { queueSize, maxQueueSize },
        });
    }
    static queueWaitTimeout(resourceKey, waitMs, limitMs, correlationId, requestId) {
        return new GatewayError({
            code: GatewayErrorCode.QUEUE_WAIT_TIMEOUT,
            message: `Queue wait timeout for resource '${resourceKey}': waited ${waitMs}ms exceeding maximum allowed wait of ${limitMs}ms before acquiring execution slot.`,
            rpcCode: -32002,
            httpStatus: 504,
            retryable: true,
            correlationId,
            requestId,
            resourceKey,
            queueWaitMs: waitMs,
            details: { limitMs },
        });
    }
    static executionTimeout(resourceKey, executionMs, limitMs, correlationId, requestId) {
        return new GatewayError({
            code: GatewayErrorCode.EXECUTION_TIMEOUT,
            message: `Execution timeout for resource '${resourceKey}': task ran for ${executionMs}ms exceeding execution limit of ${limitMs}ms.`,
            rpcCode: -32003,
            httpStatus: 504,
            retryable: false, // Do not auto-retry mutations that timed out in host
            correlationId,
            requestId,
            resourceKey,
            executionMs,
            details: { limitMs },
        });
    }
    static cancelled(resourceKey, reason = "Request was cancelled", correlationId, requestId, queued = true) {
        return new GatewayError({
            code: GatewayErrorCode.REQUEST_CANCELLED,
            message: `Request cancelled (${queued ? "queued" : "in-flight"}) for resource '${resourceKey}': ${reason}.`,
            rpcCode: -32004,
            httpStatus: 499,
            retryable: false,
            correlationId,
            requestId,
            resourceKey,
            details: { queued, reason },
        });
    }
    static shutdown(resourceKey, correlationId, requestId) {
        return new GatewayError({
            code: GatewayErrorCode.GATEWAY_SHUTDOWN,
            message: `Gateway is shutting down. Pending task on resource '${resourceKey}' was safely evicted.`,
            rpcCode: -32005,
            httpStatus: 503,
            retryable: true,
            correlationId,
            requestId,
            resourceKey,
        });
    }
    static resourceUnavailable(resourceKey, message, correlationId, requestId) {
        return new GatewayError({
            code: GatewayErrorCode.RESOURCE_UNAVAILABLE,
            message: `Resource '${resourceKey}' unavailable: ${message}`,
            rpcCode: -32006,
            httpStatus: 503,
            retryable: true,
            correlationId,
            requestId,
            resourceKey,
        });
    }
}
//# sourceMappingURL=errors.js.map