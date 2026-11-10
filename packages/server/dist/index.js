#!/usr/bin/env node
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { loadConfig, migrateLegacyUserDir } from "./config.js";
import { startHttpServer } from "./http.js";
import { log } from "./logging.js";
import { buildRuntime, createMcpServer } from "./server.js";
async function main() {
    const migrated = migrateLegacyUserDir();
    if (migrated)
        log.info(`copied settings from ${migrated} to ~/.brainferno-mcp-bridge (the old folder can be deleted)`);
    const config = loadConfig();
    const rt = buildRuntime(config);
    await rt.bridge.ready();
    const server = createMcpServer(rt);
    const transport = new StdioServerTransport();
    await server.connect(transport);
    log.info("MCP server ready on stdio");
    let remote = null;
    if (config.httpPort > 0) {
        // Remote sessions are marked so raw-script tools fail closed for them (BRAINFERNO_MCP_ALLOW_REMOTE_RAW_SCRIPTS).
        remote = await startHttpServer(() => createMcpServer(rt, { remote: true }), { host: config.httpHost, port: config.httpPort, token: config.httpToken });
    }
    const shutdown = (signal) => {
        void (async () => {
            log.info(`received ${signal}, shutting down`);
            await server.close().catch((error) => log.warn("error closing MCP server", error));
            if (remote)
                await remote.close().catch((error) => log.warn("error closing remote listener", error));
            await rt.bridge.close().catch((error) => log.warn("error closing bridge", error));
            await rt.illustratorDelegate.close().catch((error) => log.warn("error closing delegate", error));
            await rt.illustratorBridge.close().catch((error) => log.warn("error closing illustrator bridge", error));
            await rt.mediaEncoder.stop().catch((error) => log.warn("error stopping Media Encoder service", error));
            process.exit(0);
        })();
    };
    process.on("SIGINT", () => shutdown("SIGINT"));
    process.on("SIGTERM", () => shutdown("SIGTERM"));
}
main().catch((error) => {
    log.error("fatal", error);
    process.exit(1);
});
//# sourceMappingURL=index.js.map