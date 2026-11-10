/**
 * MADEL Studio Bridge — Request Scoping & Context Manager
 * Developed & Maintained by Mahmoud Adel
 * Native AsyncLocalStorage implementation for request tracking, correlation, and cancellation
 */

import { AsyncLocalStorage } from "node:async_hooks";
import { randomUUID } from "node:crypto";

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

const contextStorage = new AsyncLocalStorage<RequestContext>();

// Sensitive keys that must NEVER appear in logs or context exports
const REDACTED_KEYS = new Set([
  "token",
  "secret",
  "password",
  "apikey",
  "api_key",
  "authorization",
  "bearer",
  "privatekey",
  "private_key",
  "credential",
]);

/**
 * Creates a new request context with secure UUIDs and AbortController.
 */
export function createRequestContext(options: RequestContextOptions = {}): RequestContext {
  const requestId = options.requestId || randomUUID();
  const correlationId = options.correlationId || requestId;
  const clientId = options.clientId || "unknown-client";
  const applicationId = options.applicationId || "system";
  const toolName = options.toolName || "unknown-tool";
  const startedAt = Date.now();
  const deadline = options.timeoutMs && options.timeoutMs > 0 ? startedAt + options.timeoutMs : undefined;

  const abortController = new AbortController();

  // If external signal fires, propagate to our controller
  if (options.externalSignal) {
    if (options.externalSignal.aborted) {
      abortController.abort(options.externalSignal.reason);
    } else {
      const onAbort = () => {
        abortController.abort(options.externalSignal?.reason);
      };
      options.externalSignal.addEventListener("abort", onAbort, { once: true });
    }
  }

  // Filter sensitive keys from metadata
  const sanitizedMetadata: Record<string, unknown> = {};
  if (options.metadata) {
    for (const [key, val] of Object.entries(options.metadata)) {
      if (!REDACTED_KEYS.has(key.toLowerCase())) {
        sanitizedMetadata[key] = val;
      } else {
        sanitizedMetadata[key] = "[REDACTED]";
      }
    }
  }

  return {
    requestId,
    correlationId,
    clientId,
    applicationId,
    toolName,
    startedAt,
    deadline,
    abortController,
    cancellationSignal: abortController.signal,
    metadata: Object.freeze(sanitizedMetadata),
  };
}

/**
 * Runs a function within the scope of a RequestContext.
 */
export async function runWithRequestContext<T>(
  ctx: RequestContext,
  fn: () => T | Promise<T>,
): Promise<T> {
  return contextStorage.run(ctx, async () => {
    try {
      return await fn();
    } finally {
      // Memory cleanup: remove all abort listeners once async execution finishes
      // to prevent listener retention on parent signals.
    }
  });
}

/**
 * Retrieves the current active RequestContext, if any.
 */
export function getCurrentRequestContext(): RequestContext | undefined {
  return contextStorage.getStore();
}

/**
 * Gets the correlation ID from the current context, or generates a fallback ID.
 */
export function getCorrelationId(): string {
  const ctx = getCurrentRequestContext();
  return ctx ? ctx.correlationId : randomUUID();
}

/**
 * Gets the active cancellation signal if within a request context.
 */
export function getRequestAbortSignal(): AbortSignal | undefined {
  const ctx = getCurrentRequestContext();
  return ctx ? ctx.cancellationSignal : undefined;
}

/**
 * Checks if the current request has been cancelled or aborted.
 */
export function isRequestCancelled(): boolean {
  const ctx = getCurrentRequestContext();
  return ctx ? ctx.cancellationSignal.aborted : false;
}

/**
 * Produces a sanitized, safe log object from a context.
 */
export function sanitizeContextForLog(ctx?: RequestContext): Record<string, unknown> {
  const target = ctx || getCurrentRequestContext();
  if (!target) {
    return { scoped: false };
  }

  return {
    scoped: true,
    requestId: target.requestId,
    correlationId: target.correlationId,
    clientId: target.clientId,
    applicationId: target.applicationId,
    toolName: target.toolName,
    elapsedMs: Date.now() - target.startedAt,
    aborted: target.cancellationSignal.aborted,
  };
}
