import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { AppBridge, JsonValue } from "../bridge/types.js";
import type { JobRegistry, JobStepDef } from "../jobs.js";
import { type AudioToolOptions } from "./audio.js";
/**
 * Cross-application pipelines: one tool call chains several apps and the
 * ffmpeg lane, as a job with per-step progress. A failure names the step that
 * broke and the single-app tool that recovers it. Hand-off files live in the
 * job's work folder unless the caller names paths.
 */
export interface PipelineDeps {
    photoshop: AppBridge;
    afterEffects: AppBridge;
    premiere: AppBridge;
    illustrator: AppBridge;
    jobs: JobRegistry;
    audio: AudioToolOptions;
    /** Installer choice: a pipeline is registered only when every app it needs is enabled. Missing = all. */
    enabled?: Set<string>;
    /** Whether pipelines block when the caller passes no `wait` (BRAINFERNO_MCP_DEFAULT_WAIT). */
    defaultWait?: boolean;
}
export declare function registerPipelineTools(server: McpServer, deps: PipelineDeps): void;
/** Exported for tests: a step that just records its context. */
export declare function noopStep(name: string, value: JsonValue): JobStepDef;
