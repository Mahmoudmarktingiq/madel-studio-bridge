/**
 * The one raw-script contract shared by every escape-hatch tool (`cc_eval_script`,
 * `ae_run_script`, `ps_batch_play`): the result envelope, the ES3 wrapper that runs a
 * caller's ExtendScript, the gate, the refusal texts and the audit line. Tools import
 * these; none of them re-implements a piece.
 *
 * Error-shape rule (stated in every tool's description): a tool error with PLAIN TEXT
 * means the caller's script was not dispatched (gate off, app not enabled, app not
 * connected, args or script refused, an After Effects script that closes or replaces the
 * open project sent to cc_eval_script, or a project switch the operator did not approve
 * (ae_run_script), whose read-only project check may have run); a tool error whose text
 * is a JSON ENVELOPE means the script/batch was sent and may have partly run.
 */
import type { CallToolResult } from "@modelcontextprotocol/sdk/types.js";
import { type AppId } from "@brainferno/mcp-bridge-protocol";
export interface RawScriptError {
    message: string;
    /** The line the host reported, as it reported it (null when it gave none). */
    line: number | null;
    /**
     * The line in the caller's script that failed; null when the error was raised outside the
     * caller's own text (a $.evalFile'd library, a helper an earlier call left as a global) or the
     * host's numbering cannot be calibrated.
     */
    bodyLine: number | null;
}
export interface RawScriptEnvelope {
    ok: boolean;
    error?: RawScriptError;
    /** Server round trip around the call, in ms (includes queue wait behind other calls to the app). */
    durationMs: number;
    value: unknown;
    logs: string[];
    /** Log lines dropped by the caps; present only when > 0. */
    logsDropped?: number;
}
/**
 * Builds an envelope with its keys in a fixed order — ok, error, durationMs, value, logs,
 * logsDropped — so the verdict survives a client truncating a long result.
 */
export declare function makeEnvelope(parts: {
    ok: boolean;
    error?: RawScriptError;
    durationMs: number;
    value: unknown;
    logs: string[];
    logsDropped?: number;
}): RawScriptEnvelope;
/** ok → a normal JSON result; not ok → isError with the envelope as its JSON text (= dispatched). */
export declare function envelopeResult(env: RawScriptEnvelope): CallToolResult;
/** jsStringLiteral, then every non-ASCII code unit as \uXXXX: a pure-ASCII ES3 string literal. */
export declare function asciiLiteral(value: string): string;
/** Lines in a script, counting every JS line terminator (CRLF once). */
export declare function lineCount(script: string): number;
/**
 * Wraps a caller's ExtendScript into one ES3 IIFE expression that returns the raw
 * envelope `{ ok, error?: { message, line, lineBase }, value, logs, logsDropped }`.
 * The script enters only as an ASCII string literal (never spliced as code).
 */
export declare function rawScriptWrapper(script: string): string;
/**
 * Maps what the wrapper returned (through the host's JSON) to the public envelope:
 * key order fixed, `lineBase` turned into `bodyLine` and dropped. A value that is not
 * envelope-shaped passes through as `{ ok: true, value }`.
 */
export declare function toEnvelope(raw: unknown, script: string, durationMs: number): RawScriptEnvelope;
/**
 * The envelope for a call that WAS dispatched but failed outside the wrapper: the host
 * rejected it (ScriptError), it timed out, the panel went away mid-call, or the os-script
 * runner failed after the script may have reached the app (an error marked
 * `dispatched === true`, i.e. RunnerExitedError). Null for anything else — a plain
 * AppNotConnectedError means nothing was dispatched → plain text via guard().
 */
export declare function dispatchedFailure(error: unknown, durationMs: number, what: {
    noun: string;
    onScriptError: (message: string) => string;
}): RawScriptEnvelope | null;
/**
 * cc_eval_script's text for an Illustrator call that left no result file. The os-script lane
 * says NO_RESULT_MESSAGE ("probably failed to parse"), which is right for the typed ai_* tools
 * but not for a raw script: the wrapper catches the caller's syntax errors and reports them.
 */
export declare const ILLUSTRATOR_RAW_NO_RESULT_MESSAGE: string;
/** X-01's sentence, verbatim. */
export declare const RAW_SCRIPTS_DISABLED_MESSAGE: string;
export declare const REMOTE_RAW_SCRIPTS_REFUSED_MESSAGE: string;
/**
 * BRAINFERNO_MCP_APPS replaces the installer's saved app list rather than adding to it, so the
 * text asks for the full list: "add <app> to it" would leave only that app's tools.
 */
export declare function appNotEnabledMessage(app: AppId): string;
export declare function rawScriptsDisabledMessage(app: AppId, gate: readonly AppId[]): string;
export type RawGateState = {
    open: true;
} | {
    open: false;
    reason: string;
};
/**
 * Whether a raw call for `app` may run in this session. Refusals, in precedence order:
 * the app's tools are not enabled on this server; the raw-script gate does not include
 * the app; the session is remote and remote raw scripts are not allowed.
 */
export declare function rawGateState(app: AppId, gate: readonly AppId[], enabled: readonly AppId[], session: {
    remote: boolean;
    allowRemote: boolean;
}): RawGateState;
/**
 * JSON for an audit payload, always a string and never throwing, so every raw call still writes exactly one
 * audit line. `fallback` is the payload to use instead, already serialized: it is returned as given when
 * JSON.stringify throws or gives no text (undefined, a function, a symbol). It throws on V8 before 13.8 (Node 24 and
 * older) for input nested a few thousand levels deep, which JSON.parse and z.record(z.unknown()) both accept (13.8's
 * fast path serializes plain data iteratively); a cycle, a toJSON that throws or a BigInt fails on every engine.
 */
export declare function auditJson(value: unknown, fallback: string): string;
/**
 * Exactly one always-on audit line per raw call, run or refused. Records a hash and the
 * length of the payload (the script, the JSON of the descriptors, or of `{ script, args }`)
 * — never the payload itself; the first 200 characters go to the debug log on a run,
 * escaped onto one line.
 */
export declare function auditRawCall(call: {
    tool: string;
    app: AppId;
    payload: string;
    count?: number;
    outcome: "run" | "refused";
    via: string;
    /**
     * ae_run_script, a script that closes or replaces the open project (AE-01): "needed" on the refusal that shows the
     * risk, "flag" on the run allowProjectSwitch: true let through after it (the model sets the flag once the operator
     * agreed in the chat; the server cannot check that). The run line is written before dispatch, so a flagged call that
     * then finds After Effects not connected has one too, and keeps its OK for a retry.
     */
    consent?: "flag" | "needed" | undefined;
}): void;
/**
 * Which transport a call came over, for the audit line: "stdio", or "http:" plus the first
 * 8 characters of the session id (matching http.ts's "remote session xxxxxxxx opened" line).
 */
export declare function viaOf(extra: {
    sessionId?: string;
} | undefined): string;
