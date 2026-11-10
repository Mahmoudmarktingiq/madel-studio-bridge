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
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StreamableHTTPClientTransport } from "@modelcontextprotocol/sdk/client/streamableHttp.js";
import { log } from "../logging.js";
import { SERVER_VERSION } from "../version.js";
/** Raised when Adobe's Illustrator MCP server cannot be reached or used. */
export class DelegateUnavailableError extends Error {
    constructor(message) {
        super(message);
        this.name = "DelegateUnavailableError";
    }
}
const UNAVAILABLE_HINT = "Could not reach Illustrator's built-in MCP server. Open Illustrator (Beta) 30.4+ with a document, turn on " +
    "MCP & Tools, and check the key — regenerating it in Illustrator invalidates the previous one (a 401). Note the " +
    "server only runs while Illustrator Beta is open.";
export class IllustratorDelegate {
    options;
    client;
    connecting;
    constructor(options) {
        this.options = options;
    }
    async connect() {
        if (this.client !== undefined)
            return this.client;
        if (this.connecting !== undefined)
            return this.connecting;
        const factory = this.options.clientFactory ?? defaultClientFactory;
        this.connecting = factory(this.options.url, this.options.token).then((client) => {
            this.client = client;
            this.connecting = undefined;
            return client;
        }, (error) => {
            this.connecting = undefined;
            // Never surface the raw error (it can carry the URL/credentials); log a
            // succinct, secret-free line and hand back an actionable message.
            log.warn(`illustrator delegate connect failed: ${error instanceof Error ? error.name : "error"}`);
            throw new DelegateUnavailableError(UNAVAILABLE_HINT);
        });
        return this.connecting;
    }
    /** Drop the cached client so the next call reconnects (used after any error). */
    reset() {
        const client = this.client;
        this.client = undefined;
        if (client !== undefined)
            void client.close().catch(() => { });
    }
    /** Reachability probe — never throws; safe as the agent's first diagnostic. */
    async status() {
        try {
            const client = await this.connect();
            const { tools } = await client.listTools();
            return { available: true, url: this.options.url, toolCount: tools.length };
        }
        catch (error) {
            this.reset();
            return {
                available: false,
                url: this.options.url,
                message: error instanceof Error ? error.message : String(error),
            };
        }
    }
    /** Discover Adobe's tool surface (names + descriptions). */
    async listTools() {
        try {
            const client = await this.connect();
            const { tools } = await client.listTools();
            return tools.map((tool) => ({ name: tool.name, description: tool.description, inputSchema: tool.inputSchema }));
        }
        catch (error) {
            this.reset();
            throw error instanceof DelegateUnavailableError ? error : new DelegateUnavailableError(UNAVAILABLE_HINT);
        }
    }
    /** Forward a named call to Adobe's server and return its result verbatim. */
    async call(name, args) {
        try {
            const client = await this.connect();
            return await client.callTool({ name, arguments: args ?? {} });
        }
        catch (error) {
            this.reset();
            throw error instanceof DelegateUnavailableError ? error : new DelegateUnavailableError(UNAVAILABLE_HINT);
        }
    }
    async close() {
        this.reset();
    }
}
async function defaultClientFactory(url, token) {
    const client = new Client({ name: "brainferno-mcp-bridge-illustrator-delegate", version: SERVER_VERSION });
    // Static per-install key: goes in requestInit.headers, NOT an authProvider.
    const transport = new StreamableHTTPClientTransport(new URL(url), {
        requestInit: { headers: { Authorization: `Bearer ${token}` } },
    });
    await client.connect(transport);
    return {
        listTools: () => client.listTools(),
        callTool: (args) => client.callTool(args),
        close: () => client.close(),
    };
}
//# sourceMappingURL=illustrator-delegate.js.map