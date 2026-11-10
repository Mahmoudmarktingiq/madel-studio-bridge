/**
 * MADEL Studio Bridge — Request Scoping & Context Manager
 * Developed & Maintained by Mahmoud Adel
 * Native AsyncLocalStorage implementation for request tracking, correlation, and cancellation
 */
export interface RequestContextOptions {
    requestId?: string;
    correlationId?: string;
    clientId?: string;
    applicationId?: string;
    toolName?: string;
    timeoutMs?: number;
    externalSignal?: AbortSignal;
    metadata?: Readonly<Record<string, unknown>>;
}
export interface RequestContext {
    readonly requestId: string;
    readonly correlationId: string;
    readonly clientId: string;
    readonly applicationId: string;
    readonly toolName: string;
    readonly startedAt: number;
    readonly deadline?: number;
    readonly abortController: AbortController;
    readonly cancellationSignal: AbortSignal;
    readonly metadata: Readonly<Record<string, unknown>>;
}
/**
 * Creates a new request context with secure UUIDs and AbortController.
 */
export declare function createRequestContext(options?: RequestContextOptions): RequestContext;
/**
 * Runs a function within the scope of a RequestContext.
 */
export declare function runWithRequestContext<T>(ctx: RequestContext, fn: () => T | Promise<T>): Promise<T>;
/**
 * Retrieves the current active RequestContext, if any.
 */
export declare function getCurrentRequestContext(): RequestContext | undefined;
/**
 * Gets the correlation ID from the current context, or generates a fallback ID.
 */
export declare function getCorrelationId(): string;
/**
 * Gets the active cancellation signal if within a request context.
 */
export declare function getRequestAbortSignal(): AbortSignal | undefined;
/**
 * Checks if the current request has been cancelled or aborted.
 */
export declare function isRequestCancelled(): boolean;
/**
 * Produces a sanitized, safe log object from a context.
 */
export declare function sanitizeContextForLog(ctx?: RequestContext): Record<string, unknown>;
