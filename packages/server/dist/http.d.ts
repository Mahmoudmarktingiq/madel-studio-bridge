import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
/**
 * Remote mode: the same tools over MCP's Streamable HTTP transport, for a
 * Claude on another computer. Every request must carry
 * `Authorization: Bearer <token>`; there is no anonymous path. One McpServer
 * per session, all sharing the process-wide runtime (hub, jobs, drivers).
 *
 * The wire is plain HTTP: run it on a trusted LAN, a VPN/Tailscale, or behind
 * a TLS tunnel. The Adobe panels never use this listener — they keep dialing
 * the loopback hub.
 */
export interface HttpServerOptions {
    host: string;
    port: number;
    token: string;
    /** URL path; defaults to /mcp. */
    path?: string;
}
export interface RunningHttpServer {
    host: string;
    port: number;
    path: string;
    sessions(): number;
    close(): Promise<void>;
}
export declare function startHttpServer(createSession: () => McpServer, o: HttpServerOptions): Promise<RunningHttpServer>;
