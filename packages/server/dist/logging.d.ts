import type { LogLevel } from "./config.js";
export declare function setLogLevel(level: LogLevel): void;
/** The current threshold (so a test that changes it can put it back). */
export declare function getLogLevel(): LogLevel;
export declare const log: {
    error: (message: string, detail?: unknown) => void;
    warn: (message: string, detail?: unknown) => void;
    info: (message: string, detail?: unknown) => void;
    debug: (message: string, detail?: unknown) => void;
    /**
     * Security audit trail (raw-script calls, the raw-script gate at startup). Written at
     * every log level — BRAINFERNO_MCP_LOG_LEVEL cannot silence it.
     */
    audit: (message: string) => void;
};
