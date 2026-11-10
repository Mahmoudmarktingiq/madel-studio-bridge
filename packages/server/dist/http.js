import { randomUUID, timingSafeEqual } from "node:crypto";
import { createServer } from "node:http";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import { isInitializeRequest } from "@modelcontextprotocol/sdk/types.js";
import { log } from "./logging.js";
function tokenMatches(header, token) {
    if (!header)
        return false;
    const m = /^Bearer\s+(.+)$/i.exec(header.trim());
    if (!m)
        return false;
    const given = Buffer.from(m[1] ?? "", "utf8");
    const want = Buffer.from(token, "utf8");
    return given.length === want.length && timingSafeEqual(given, want);
}
function readBody(req, limit = 4 * 1024 * 1024) {
    return new Promise((resolve, reject) => {
        let data = "";
        req.setEncoding("utf8");
        req.on("data", (d) => {
            data += d;
            if (data.length > limit) {
                reject(new Error("request body too large"));
                req.destroy();
            }
        });
        req.on("end", () => resolve(data));
        req.on("error", reject);
    });
}
function reply(res, status, body) {
    res.writeHead(status, { "content-type": "application/json" });
    res.end(JSON.stringify(body));
}
export async function startHttpServer(createSession, o) {
    if (!o.token || o.token.length < 16)
        throw new Error("Remote mode needs a token of at least 16 characters (BRAINFERNO_MCP_HTTP_TOKEN or httpToken in ~/.brainferno-mcp-bridge/config.json).");
    const path = o.path ?? "/mcp";
    const sessions = new Map();
    const handle = async (req, res) => {
        const url = new URL(req.url ?? "/", "http://localhost");
        if (url.pathname !== path)
            return reply(res, 404, { error: "not found" });
        if (!tokenMatches(req.headers["authorization"], o.token)) {
            res.setHeader("www-authenticate", 'Bearer realm="brainferno-mcp-bridge"');
            return reply(res, 401, { jsonrpc: "2.0", error: { code: -32001, message: "Unauthorized: missing or wrong bearer token" }, id: null });
        }
        const sessionId = req.headers["mcp-session-id"];
        const existing = typeof sessionId === "string" ? sessions.get(sessionId) : undefined;
        if (existing) {
            const body = req.method === "POST" ? await readBody(req) : undefined;
            let parsed = undefined;
            if (body !== undefined && body !== "") {
                try {
                    parsed = JSON.parse(body);
                }
                catch {
                    return reply(res, 400, { jsonrpc: "2.0", error: { code: -32700, message: "Parse error" }, id: null });
                }
            }
            await existing.transport.handleRequest(req, res, parsed);
            return;
        }
        if (req.method !== "POST")
            return reply(res, 400, { jsonrpc: "2.0", error: { code: -32000, message: "No session: send an initialize request first" }, id: null });
        let parsed;
        try {
            parsed = JSON.parse(await readBody(req));
        }
        catch {
            return reply(res, 400, { jsonrpc: "2.0", error: { code: -32700, message: "Parse error" }, id: null });
        }
        if (!isInitializeRequest(parsed))
            return reply(res, 400, { jsonrpc: "2.0", error: { code: -32000, message: "Unknown session id; send initialize to start one" }, id: null });
        const server = createSession();
        const transport = new StreamableHTTPServerTransport({
            sessionIdGenerator: () => randomUUID(),
            onsessioninitialized: (id) => {
                sessions.set(id, { transport, server });
                log.info(`remote session ${id.slice(0, 8)} opened from ${req.socket.remoteAddress ?? "?"} (${sessions.size} open)`);
            },
        });
        transport.onclose = () => {
            const id = transport.sessionId;
            if (id && sessions.delete(id))
                log.info(`remote session ${id.slice(0, 8)} closed (${sessions.size} open)`);
            void server.close().catch(() => undefined);
        };
        await server.connect(transport);
        await transport.handleRequest(req, res, parsed);
    };
    const httpServer = createServer((req, res) => {
        handle(req, res).catch((e) => {
            log.warn("remote request failed", e);
            if (!res.headersSent)
                reply(res, 500, { jsonrpc: "2.0", error: { code: -32603, message: e instanceof Error ? e.message : String(e) }, id: null });
            else
                res.end();
        });
    });
    await new Promise((resolve, reject) => {
        httpServer.once("error", reject);
        httpServer.listen(o.port, o.host, () => {
            httpServer.off("error", reject);
            resolve();
        });
    });
    const addr = httpServer.address();
    const port = typeof addr === "object" && addr ? addr.port : o.port;
    log.info(`remote MCP listening on http://${o.host}:${port}${path} (bearer token required)`);
    return {
        host: o.host,
        port,
        path,
        sessions: () => sessions.size,
        close: async () => {
            for (const [id, s] of sessions) {
                sessions.delete(id);
                await s.transport.close().catch(() => undefined);
                await s.server.close().catch(() => undefined);
            }
            await new Promise((resolve) => httpServer.close(() => resolve()));
        },
    };
}
//# sourceMappingURL=http.js.map