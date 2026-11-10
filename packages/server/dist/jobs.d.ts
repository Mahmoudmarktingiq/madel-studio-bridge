/**
 * In-memory job registry for anything that runs longer than a tool call
 * should block: aerender, Premiere exports, and the cross-app pipelines.
 *
 * A job is a named list of steps run in order. Each step's result is kept,
 * failures record which step broke and which tool recovers it, and a job can
 * be cancelled between steps (process-lane steps also get an AbortSignal so
 * a running ffmpeg/aerender is killed). Every job gets a private work folder
 * under `<workRoot>/<jobId>/` for cross-app hand-offs.
 */
export type JobStatus = "queued" | "running" | "succeeded" | "failed" | "cancelled";
export type StepStatus = "pending" | "running" | "succeeded" | "failed" | "skipped";
export interface JobContext {
    readonly jobId: string;
    readonly workDir: string;
    readonly signal: AbortSignal;
    /** Append a line to the job log (tail kept) and make it the progress message. */
    log(message: string): void;
    /** Report progress inside the current step (0–100). */
    progress(message: string, percent?: number): void;
    /** Record a file the job produced. */
    artifact(path: string): void;
}
export interface JobStepDef {
    name: string;
    /** Tool to call by hand when this step fails. */
    recoveryTool?: string;
    /** Return false to skip this step (recorded as skipped). */
    when?: (previous: unknown[]) => boolean;
    run: (ctx: JobContext, previous: unknown[]) => Promise<unknown>;
}
export interface JobStep {
    name: string;
    status: StepStatus;
    recoveryTool?: string;
    startedAt?: number;
    finishedAt?: number;
    result?: unknown;
    error?: string;
}
export interface JobFailure {
    step: string;
    message: string;
    recoveryTool?: string;
    completedSteps: string[];
}
export interface JobProgress {
    step: string | null;
    stepIndex: number;
    stepCount: number;
    percent: number;
    message: string;
}
export interface Job {
    id: string;
    kind: string;
    status: JobStatus;
    createdAt: number;
    startedAt?: number;
    finishedAt?: number;
    workDir: string;
    steps: JobStep[];
    progress: JobProgress;
    artifacts: string[];
    log: string[];
    result?: unknown;
    error?: JobFailure;
}
export declare class JobCancelledError extends Error {
    constructor(jobId: string);
}
export declare class JobRegistry {
    private readonly options;
    private readonly jobs;
    constructor(options: {
        workRoot: string;
        keep?: number;
    });
    /** Start a job now. Resolves `done` when it reaches a terminal state (never rejects). */
    start(kind: string, steps: JobStepDef[], finalize?: (results: unknown[], job: Job) => unknown): {
        job: Job;
        done: Promise<Job>;
    };
    get(id: string): Job | undefined;
    list(limit?: number): Job[];
    /** Request cancellation. Returns false if the job is unknown or already finished. */
    cancel(id: string): boolean;
    /** Wait for a terminal state or the timeout; `onTick` fires every ~2 s with the live job. */
    wait(id: string, timeoutMs: number, onTick?: (job: Job) => void): Promise<Job>;
    private prune;
    private execute;
}
export declare function isTerminal(status: JobStatus): boolean;
/** JSON-safe view of a job for tool results (no internal handles, bounded log). */
export declare function jobView(job: Job, options?: {
    includeLog?: boolean;
}): {
    log?: string[] | undefined;
    error?: JobFailure | undefined;
    result?: {} | null | undefined;
    jobId: string;
    kind: string;
    status: JobStatus;
    createdAt: string;
    startedAt: string | null;
    finishedAt: string | null;
    elapsedSeconds: number;
    progress: JobProgress;
    steps: {
        recoveryTool?: string | undefined;
        error?: string | undefined;
        name: string;
        status: StepStatus;
    }[];
    artifacts: string[];
    workDir: string;
};
