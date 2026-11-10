import type { CallToolResult } from "@modelcontextprotocol/sdk/types.js";
import { AppDisconnectedError, ScriptError } from "../bridge/types.js";
import type { PreviewMode } from "../config.js";
/** Process-wide preview mode (BRAINFERNO_MCP_PREVIEW), set once at startup like the log level. */
export declare function setPreviewMode(mode: PreviewMode): void;
/** Wraps any JSON-serializable value as a tool result the client reads as text. */
export declare function jsonResult(value: unknown): CallToolResult;
export declare function textResult(text: string): CallToolResult;
/**
 * Returns an image the model can see, plus a text block naming the file on
 * disk so pipelines can pass the full-resolution path along. Callers keep the
 * file small (export at a reduced scale) — image bytes count against context.
 * In "path" mode (clients that cannot show the model images) only the text
 * block is returned; in "inline" mode only the image block.
 */
export declare function imageResult(filePath: string, mimeType: "image/png" | "image/jpeg", note?: string): Promise<CallToolResult>;
export declare function errorResult(message: string): CallToolResult;
/**
 * Runs a tool body, turning the bridge's typed failures into readable tool
 * errors rather than letting them escape as protocol-level exceptions. An
 * agent can act on "the panel isn't running"; it cannot act on a stack trace.
 */
export declare function guard(fn: () => Promise<CallToolResult>): Promise<CallToolResult>;
/**
 * The one text for a ScriptError, shared by guard() and failed job steps (src/jobs.ts):
 *  - the panel answered UNKNOWN_COMMAND (any app): the panel is older than this server;
 *  - not enriched (`details.where` unset): exactly the pre-AE-16 text, byte for byte;
 *  - enriched (After Effects tools, AE-16): one paragraph — tool and arguments, where the line
 *    falls, the host message (secrets redacted, capped), the next step when that shows none,
 *    "did you mean", a note, and the failing code.
 */
export declare function scriptErrorText(error: ScriptError): string;
/** guard()'s text for a panel that dropped mid-call (D12): it may have partly run. */
export declare function disconnectedText(error: AppDisconnectedError): string;
/**
 * A failed job step's message, the text guard() gives for the same error: disconnectedText for a
 * panel that dropped mid-step, scriptErrorText for a ScriptError that is enriched or carries
 * UNKNOWN_COMMAND; otherwise exactly what jobs.ts recorded before AE-16 (e.message / String(e)).
 */
export declare function jobErrorMessage(e: unknown): string;
