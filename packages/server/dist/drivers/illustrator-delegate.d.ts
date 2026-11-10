/**
 * Delegate lane for Illustrator: a thin MCP *client* to Adobe's official
 * built-in Illustrator (Beta) MCP server (Streamable HTTP on localhost, Bearer
 * key auth). It complements our os-script lane — Adobe's server analyzes,
 * batch-recolors, and exports but cannot create or save, which is exactly what
 * the os-script lane does.
 *
 * We do not mirror Adobe's ~40 tools (their names/schemas are unpublished and a
 * moving beta target); instead we discover them at runtime and pass calls
 * through. The connection is lazy — Illustrator Beta opens and closes
 * independently of this server, so we connect on first use and degrade to a
 * clear, actionable error when it is not reachable.
 *
 * The Bearer key is a capability key to the user's local Illustrator. It is held
 * privately here, never logged, never put in an error message, and never sent to
 * the model.
 */
import type { CallToolResult } from "@modelcontextprotocol/sdk/types.js";
export interface DelegateToolInfo {
    name: string;
    description?: string;
    /** JSON Schema for the tool arguments, passed through from Adobe verbatim. */
    inputSchema?: unknown;
}
/** The subset of an MCP client this delegate needs — injectable for tests. */
export interface DelegateClient {
    listTools(): Promise<{
        tools: {
            name: string;
            description?: string;
            inputSchema?: unknown;
        }[];
    }>;
    callTool(args: {
        name: string;
        arguments?: Record<string, unknown>;
    }): Promise<CallToolResult>;
    close(): Promise<void>;
}
export type DelegateClientFactory = (url: string, token: string) => Promise<DelegateClient>;
/** Raised when Adobe's Illustrator MCP server cannot be reached or used. */
export declare class DelegateUnavailableError extends Error {
    constructor(message: string);
}
export interface IllustratorDelegateOptions {
    url: string;
    token: string;
    /** Injectable for tests; defaults to a real Streamable-HTTP MCP client. */
    clientFactory?: DelegateClientFactory;
}
export declare class IllustratorDelegate {
    private readonly options;
    private client;
    private connecting;
    constructor(options: IllustratorDelegateOptions);
    private connect;
    /** Drop the cached client so the next call reconnects (used after any error). */
    private reset;
    /** Reachability probe — never throws; safe as the agent's first diagnostic. */
    status(): Promise<{
        available: boolean;
        url: string;
        toolCount?: number;
        message?: string;
    }>;
    /** Discover Adobe's tool surface (names + descriptions). */
    listTools(): Promise<DelegateToolInfo[]>;
    /** Forward a named call to Adobe's server and return its result verbatim. */
    call(name: string, args: Record<string, unknown> | undefined): Promise<CallToolResult>;
    close(): Promise<void>;
}
