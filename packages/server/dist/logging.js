/**
 * stdout is the MCP wire when running over stdio, so every diagnostic goes to
 * stderr. Writing a stray console.log anywhere in this server corrupts the
 * protocol stream — always use this logger.
 */
const RANK = { error: 0, warn: 1, info: 2, debug: 3 };
let threshold = "info";
export function setLogLevel(level) {
    threshold = level;
}
/** The current threshold (so a test that changes it can put it back). */
export function getLogLevel() {
    return threshold;
}
function emit(level, message, detail) {
    if (RANK[level] > RANK[threshold])
        return;
    const line = `[brainferno-mcp-bridge] ${level.toUpperCase()} ${message}`;
    process.stderr.write(detail === undefined ? `${line}\n` : `${line} ${format(detail)}\n`);
}
function format(detail) {
    if (detail instanceof Error)
        return `${detail.name}: ${detail.message}`;
    try {
        return JSON.stringify(detail);
    }
    catch {
        return String(detail);
    }
}
export const log = {
    error: (message, detail) => emit("error", message, detail),
    warn: (message, detail) => emit("warn", message, detail),
    info: (message, detail) => emit("info", message, detail),
    debug: (message, detail) => emit("debug", message, detail),
    /**
     * Security audit trail (raw-script calls, the raw-script gate at startup). Written at
     * every log level — BRAINFERNO_MCP_LOG_LEVEL cannot silence it.
     */
    audit: (message) => {
        process.stderr.write(`[brainferno-mcp-bridge] AUDIT ${message}\n`);
    },
};
//# sourceMappingURL=logging.js.map