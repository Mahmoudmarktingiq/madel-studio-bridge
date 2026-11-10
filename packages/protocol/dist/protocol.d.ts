/**
 * Wire protocol (v2) between this server's hub and the companion panel running
 * inside each Creative Cloud application.
 *
 * The panel is the client: it dials in to the bridge port, announces which
 * application it lives in (and authenticates), then waits for commands. Keeping
 * the panel on the connecting side is not a preference — UXP plugins cannot
 * listen on a socket, only dial out — and it keeps the one listener the whole
 * system trusts on the server side, where it can be hardened.
 *
 * Commands are *named*, not raw script: the server sends `{name, params}` and
 * the panel maps the name to a local function. UXP restricts `eval`, and the
 * Premiere UXP API has no script engine at all, so shipping script strings does
 * not work there. The generic `eval` command (params `{script}`) is the escape
 * hatch panels on an ExtendScript engine implement via `evalScript`, which is a
 * host API rather than JS `eval`.
 *
 * Every panel->server frame is validated against a zod schema before use; the
 * hub never trusts the shape of a frame from the wire.
 */
import { z } from "zod";
export declare const PROTOCOL_VERSION = 2;
/** How long the server will wait for a command result, by command weight. */
export type TimeoutClass = "fast" | "slow" | "render";
/** Panel -> server, the first frame on every connection (within the deadline). */
export declare const helloFrameSchema: z.ZodObject<{
    type: z.ZodLiteral<"hello">;
    protocolVersion: z.ZodNumber;
    appId: z.ZodEnum<{
        after_effects: "after_effects";
        premiere: "premiere";
        photoshop: "photoshop";
        illustrator: "illustrator";
        audition: "audition";
    }>;
    hostVersion: z.ZodOptional<z.ZodString>;
    panelVersion: z.ZodOptional<z.ZodString>;
    token: z.ZodOptional<z.ZodString>;
    capabilities: z.ZodOptional<z.ZodArray<z.ZodString>>;
}, z.core.$strip>;
/** Panel -> server, the outcome of one command. */
export declare const resultFrameSchema: z.ZodObject<{
    type: z.ZodLiteral<"result">;
    id: z.ZodString;
    ok: z.ZodBoolean;
    value: z.ZodOptional<z.ZodUnknown>;
    error: z.ZodOptional<z.ZodObject<{
        code: z.ZodString;
        message: z.ZodString;
        line: z.ZodOptional<z.ZodNumber>;
    }, z.core.$strip>>;
    appState: z.ZodOptional<z.ZodObject<{
        activeDocument: z.ZodOptional<z.ZodNullable<z.ZodString>>;
        selection: z.ZodOptional<z.ZodUnknown>;
        dirty: z.ZodOptional<z.ZodBoolean>;
    }, z.core.$strip>>;
}, z.core.$strip>;
/** Panel -> server, incremental progress for a long-running command. */
export declare const progressFrameSchema: z.ZodObject<{
    type: z.ZodLiteral<"progress">;
    id: z.ZodString;
    progress: z.ZodOptional<z.ZodNumber>;
    total: z.ZodOptional<z.ZodNumber>;
    message: z.ZodOptional<z.ZodString>;
}, z.core.$strip>;
/** Panel -> server, liveness. */
export declare const pongFrameSchema: z.ZodObject<{
    type: z.ZodLiteral<"pong">;
    ts: z.ZodOptional<z.ZodNumber>;
}, z.core.$strip>;
export declare const pingFrameSchema: z.ZodObject<{
    type: z.ZodLiteral<"ping">;
    ts: z.ZodOptional<z.ZodNumber>;
}, z.core.$strip>;
/** Panel -> server, graceful shutdown (e.g. the kill switch was engaged). */
export declare const byeFrameSchema: z.ZodObject<{
    type: z.ZodLiteral<"bye">;
    reason: z.ZodOptional<z.ZodString>;
}, z.core.$strip>;
declare const panelFrameSchema: z.ZodDiscriminatedUnion<[z.ZodObject<{
    type: z.ZodLiteral<"hello">;
    protocolVersion: z.ZodNumber;
    appId: z.ZodEnum<{
        after_effects: "after_effects";
        premiere: "premiere";
        photoshop: "photoshop";
        illustrator: "illustrator";
        audition: "audition";
    }>;
    hostVersion: z.ZodOptional<z.ZodString>;
    panelVersion: z.ZodOptional<z.ZodString>;
    token: z.ZodOptional<z.ZodString>;
    capabilities: z.ZodOptional<z.ZodArray<z.ZodString>>;
}, z.core.$strip>, z.ZodObject<{
    type: z.ZodLiteral<"result">;
    id: z.ZodString;
    ok: z.ZodBoolean;
    value: z.ZodOptional<z.ZodUnknown>;
    error: z.ZodOptional<z.ZodObject<{
        code: z.ZodString;
        message: z.ZodString;
        line: z.ZodOptional<z.ZodNumber>;
    }, z.core.$strip>>;
    appState: z.ZodOptional<z.ZodObject<{
        activeDocument: z.ZodOptional<z.ZodNullable<z.ZodString>>;
        selection: z.ZodOptional<z.ZodUnknown>;
        dirty: z.ZodOptional<z.ZodBoolean>;
    }, z.core.$strip>>;
}, z.core.$strip>, z.ZodObject<{
    type: z.ZodLiteral<"progress">;
    id: z.ZodString;
    progress: z.ZodOptional<z.ZodNumber>;
    total: z.ZodOptional<z.ZodNumber>;
    message: z.ZodOptional<z.ZodString>;
}, z.core.$strip>, z.ZodObject<{
    type: z.ZodLiteral<"pong">;
    ts: z.ZodOptional<z.ZodNumber>;
}, z.core.$strip>, z.ZodObject<{
    type: z.ZodLiteral<"ping">;
    ts: z.ZodOptional<z.ZodNumber>;
}, z.core.$strip>, z.ZodObject<{
    type: z.ZodLiteral<"bye">;
    reason: z.ZodOptional<z.ZodString>;
}, z.core.$strip>], "type">;
export type HelloFrame = z.infer<typeof helloFrameSchema>;
export type ResultFrame = z.infer<typeof resultFrameSchema>;
export type ProgressFrame = z.infer<typeof progressFrameSchema>;
export type PanelFrame = z.infer<typeof panelFrameSchema>;
/** Server -> panel, accepting the hello. */
export interface WelcomeFrame {
    type: "welcome";
    protocolVersion: number;
    serverVersion: string;
    heartbeatIntervalMs: number;
}
/** Server -> panel, a named command to run. */
export interface CmdFrame {
    type: "cmd";
    id: string;
    name: string;
    params: unknown;
    timeoutClass: TimeoutClass;
}
export interface ServerPingFrame {
    type: "ping";
    ts: number;
}
export interface ServerByeFrame {
    type: "bye";
    reason: string;
}
export type ServerFrame = WelcomeFrame | CmdFrame | ServerPingFrame | ServerByeFrame;
/**
 * Parses and validates a raw text frame from a panel. Throws a descriptive
 * Error on anything that is not a well-formed panel frame — callers drop the
 * frame rather than trusting a partially-shaped object.
 */
export declare function parsePanelFrame(raw: string): PanelFrame;
export {};
