import { z } from "zod";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { CallToolResult } from "@modelcontextprotocol/sdk/types.js";
import { type Job, type JobRegistry, type JobStepDef } from "../jobs.js";
/** The slice of the SDK's request `extra` that progress reporting needs. */
export interface ProgressExtra {
    _meta?: {
        progressToken?: string | number;
    };
    sendNotification?: (notification: {
        method: "notifications/progress";
        params: {
            progressToken: string | number;
            progress: number;
            total?: number;
            message?: string;
        };
    }) => Promise<void>;
}
export type ProgressFn = (message: string, percent?: number) => void;
/**
 * The `wait` parameter of a long tool, described to match the configured
 * default (BRAINFERNO_MCP_DEFAULT_WAIT) so every client sees the truth.
 */
export declare function waitParam(defaultWait: boolean, what: string): z.ZodOptional<z.ZodBoolean>;
/**
 * Best-effort MCP progress notifications against the client's progressToken.
 * A client that sent no token gets a no-op. Sending never throws into the tool.
 */
export declare function progressReporter(extra: ProgressExtra | undefined): ProgressFn;
export interface RunOrQueueOptions {
    /** Block until the job finishes (or the timeout), streaming progress. */
    wait: boolean;
    timeoutMs: number;
    extra?: ProgressExtra;
}
/**
 * Start a job. With `wait` the call blocks (with progress notifications) and
 * returns the job's result, or an error naming the failed step and its
 * recovery tool; without it the call returns the jobId at once so the caller
 * can cc_job_wait / cc_job_status.
 */
export declare function runOrQueue(jobs: JobRegistry, kind: string, steps: JobStepDef[], finalize: ((results: unknown[], job: Job) => unknown) | undefined, options: RunOrQueueOptions): Promise<CallToolResult>;
export declare function jobResult(job: Job, timeoutMs?: number): CallToolResult;
export interface JobToolOptions {
    /** Default cc_job_wait timeout, seconds. Keep below the client's own tool timeout. */
    defaultWaitSeconds?: number;
}
export declare function registerJobTools(server: McpServer, jobs: JobRegistry, options?: JobToolOptions): void;
