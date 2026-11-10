import { randomUUID } from "node:crypto";
import { mkdir } from "node:fs/promises";
import { join } from "node:path";
import { jobErrorMessage } from "./tools/result.js";
export class JobCancelledError extends Error {
    constructor(jobId) {
        super(`Job ${jobId} was cancelled.`);
        this.name = "JobCancelledError";
    }
}
const LOG_TAIL = 200;
export class JobRegistry {
    options;
    jobs = new Map();
    constructor(options) {
        this.options = options;
    }
    /** Start a job now. Resolves `done` when it reaches a terminal state (never rejects). */
    start(kind, steps, finalize) {
        const id = randomUUID();
        const job = {
            id,
            kind,
            status: "queued",
            createdAt: Date.now(),
            workDir: join(this.options.workRoot, id),
            steps: steps.map((s) => ({ name: s.name, status: "pending", ...(s.recoveryTool !== undefined ? { recoveryTool: s.recoveryTool } : {}) })),
            progress: { step: null, stepIndex: 0, stepCount: steps.length, percent: 0, message: "queued" },
            artifacts: [],
            log: [],
        };
        const controller = new AbortController();
        const done = this.execute(job, controller, steps, finalize);
        this.jobs.set(id, { job, controller, done });
        this.prune();
        return { job, done };
    }
    get(id) {
        return this.jobs.get(id)?.job;
    }
    list(limit = 50) {
        return [...this.jobs.values()]
            .map((r) => r.job)
            .sort((a, b) => b.createdAt - a.createdAt)
            .slice(0, limit);
    }
    /** Request cancellation. Returns false if the job is unknown or already finished. */
    cancel(id) {
        const rec = this.jobs.get(id);
        if (!rec || isTerminal(rec.job.status))
            return false;
        rec.controller.abort(new JobCancelledError(id));
        return true;
    }
    /** Wait for a terminal state or the timeout; `onTick` fires every ~2 s with the live job. */
    async wait(id, timeoutMs, onTick) {
        const rec = this.jobs.get(id);
        if (!rec)
            throw new Error(`No job ${id}. Call cc_list_jobs.`);
        const deadline = Date.now() + timeoutMs;
        let lastTick = 0;
        while (!isTerminal(rec.job.status) && Date.now() < deadline) {
            if (onTick && Date.now() - lastTick >= 2000) {
                lastTick = Date.now();
                onTick(rec.job);
            }
            await Promise.race([rec.done, sleep(500)]);
        }
        return rec.job;
    }
    prune() {
        const keep = this.options.keep ?? 100;
        if (this.jobs.size <= keep)
            return;
        const finished = [...this.jobs.entries()].filter(([, r]) => isTerminal(r.job.status)).sort((a, b) => a[1].job.createdAt - b[1].job.createdAt);
        for (const [id] of finished.slice(0, this.jobs.size - keep))
            this.jobs.delete(id);
    }
    async execute(job, controller, steps, finalize) {
        const results = [];
        const completed = [];
        const setProgress = (i, message, within = 0) => {
            job.progress = {
                step: steps[i]?.name ?? null,
                stepIndex: i,
                stepCount: steps.length,
                percent: steps.length === 0 ? 100 : Math.min(100, Math.round(((i + within / 100) / steps.length) * 100)),
                message,
            };
        };
        const ctx = (i) => ({
            jobId: job.id,
            workDir: job.workDir,
            signal: controller.signal,
            log: (m) => {
                job.log.push(m);
                if (job.log.length > LOG_TAIL)
                    job.log.splice(0, job.log.length - LOG_TAIL);
                setProgress(i, m, within(job));
            },
            progress: (m, p) => setProgress(i, m, p ?? within(job)),
            artifact: (p) => {
                if (!job.artifacts.includes(p))
                    job.artifacts.push(p);
            },
        });
        const within = (j) => (j.progress.stepIndex === job.progress.stepIndex ? Math.round(((j.progress.percent / 100) * steps.length - j.progress.stepIndex) * 100) : 0);
        job.status = "running";
        job.startedAt = Date.now();
        try {
            await mkdir(job.workDir, { recursive: true });
        }
        catch {
            /* the work dir is a convenience; steps that need it will fail loudly */
        }
        for (let i = 0; i < steps.length; i++) {
            const def = steps[i];
            const step = job.steps[i];
            if (controller.signal.aborted) {
                job.status = "cancelled";
                break;
            }
            if (def.when && !def.when(results)) {
                step.status = "skipped";
                results.push(undefined);
                continue;
            }
            step.status = "running";
            step.startedAt = Date.now();
            setProgress(i, `${def.name}…`);
            try {
                const value = await def.run(ctx(i), results);
                step.result = value;
                step.status = "succeeded";
                step.finishedAt = Date.now();
                results.push(value);
                completed.push(def.name);
            }
            catch (e) {
                step.finishedAt = Date.now();
                if (controller.signal.aborted || e instanceof JobCancelledError) {
                    step.status = "skipped";
                    job.status = "cancelled";
                    break;
                }
                // guard()'s text for a dropped panel, an enriched After Effects ScriptError (AE-16) or an UNKNOWN_COMMAND; anything else its message.
                const message = jobErrorMessage(e);
                step.status = "failed";
                step.error = message;
                job.status = "failed";
                job.error = { step: def.name, message, completedSteps: completed, ...(def.recoveryTool !== undefined ? { recoveryTool: def.recoveryTool } : {}) };
                break;
            }
        }
        if (job.status === "running") {
            job.status = "succeeded";
            try {
                job.result = finalize ? finalize(results, job) : results;
            }
            catch (e) {
                job.status = "failed";
                job.error = { step: "finalize", message: e instanceof Error ? e.message : String(e), completedSteps: completed };
            }
        }
        for (const s of job.steps)
            if (s.status === "pending")
                s.status = "skipped";
        job.finishedAt = Date.now();
        job.progress = { ...job.progress, percent: job.status === "succeeded" ? 100 : job.progress.percent, message: job.status === "succeeded" ? "done" : job.status === "failed" ? `failed at ${job.error?.step ?? "?"}` : job.status };
        return job;
    }
}
export function isTerminal(status) {
    return status === "succeeded" || status === "failed" || status === "cancelled";
}
/** JSON-safe view of a job for tool results (no internal handles, bounded log). */
export function jobView(job, options = {}) {
    return {
        jobId: job.id,
        kind: job.kind,
        status: job.status,
        createdAt: new Date(job.createdAt).toISOString(),
        startedAt: job.startedAt !== undefined ? new Date(job.startedAt).toISOString() : null,
        finishedAt: job.finishedAt !== undefined ? new Date(job.finishedAt).toISOString() : null,
        elapsedSeconds: job.startedAt !== undefined ? Math.round(((job.finishedAt ?? Date.now()) - job.startedAt) / 1000) : 0,
        progress: job.progress,
        steps: job.steps.map((s) => ({ name: s.name, status: s.status, ...(s.error !== undefined ? { error: s.error } : {}), ...(s.recoveryTool !== undefined && s.status === "failed" ? { recoveryTool: s.recoveryTool } : {}) })),
        artifacts: job.artifacts,
        workDir: job.workDir,
        ...(job.result !== undefined ? { result: job.result } : {}),
        ...(job.error !== undefined ? { error: job.error } : {}),
        ...(options.includeLog ? { log: job.log.slice(-40) } : {}),
    };
}
function sleep(ms) {
    return new Promise((r) => setTimeout(r, ms));
}
//# sourceMappingURL=jobs.js.map