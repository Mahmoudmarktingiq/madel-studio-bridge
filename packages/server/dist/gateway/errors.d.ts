/**
 * MADEL Studio Bridge — Gateway Structured Error Definitions
 * Developed & Maintained by Mahmoud Adel
 * Clean-Room Implementation adhering to MCP JSON-RPC 2.0 Specifications
 */
export declare const GatewayErrorCode: {
    readonly QUEUE_OVERFLOW: "QUEUE_OVERFLOW";
    readonly QUEUE_WAIT_TIMEOUT: "QUEUE_WAIT_TIMEOUT";
    readonly EXECUTION_TIMEOUT: "EXECUTION_TIMEOUT";
    readonly REQUEST_CANCELLED: "REQUEST_CANCELLED";
    readonly GATEWAY_SHUTDOWN: "GATEWAY_SHUTDOWN";
    readonly RESOURCE_UNAVAILABLE: "RESOURCE_UNAVAILABLE";
};
export type GatewayErrorCode = (typeof GatewayErrorCode)[keyof typeof GatewayErrorCode];
export interface GatewayErrorDetails {
    readonly code: GatewayErrorCode;
    readonly message: string;
    readonly rpcCode: number;
    readonly httpStatus: number;
    readonly retryable: boolean;
    readonly correlationId?: string;
    readonly requestId?: string;
    readonly resourceKey?: string;
    readonly queueWaitMs?: number;
    readonly executionMs?: number;
    readonly details?: Record<string, unknown>;
}
export declare class GatewayError extends Error {
    readonly code: GatewayErrorCode;
    readonly rpcCode: number;
    readonly httpStatus: number;
    readonly retryable: boolean;
    readonly correlationId?: string;
    readonly requestId?: string;
    readonly resourceKey?: string;
    readonly queueWaitMs?: number;
    readonly executionMs?: number;
    readonly details?: Record<string, unknown>;
    constructor(options: GatewayErrorDetails);
    toJSON(): Record<string, unknown>;
    toRpcError(): {
        code: number;
        message: string;
        data?: Record<string, unknown>;
    };
    static queueOverflow(resourceKey: string, queueSize: number, maxQueueSize: number, correlationId?: string, requestId?: string): GatewayError;
    static queueWaitTimeout(resourceKey: string, waitMs: number, limitMs: number, correlationId?: string, requestId?: string): GatewayError;
    static executionTimeout(resourceKey: string, executionMs: number, limitMs: number, correlationId?: string, requestId?: string): GatewayError;
    static cancelled(resourceKey: string, reason?: string, correlationId?: string, requestId?: string, queued?: boolean): GatewayError;
    static shutdown(resourceKey: string, correlationId?: string, requestId?: string): GatewayError;
    static resourceUnavailable(resourceKey: string, message: string, correlationId?: string, requestId?: string): GatewayError;
}
