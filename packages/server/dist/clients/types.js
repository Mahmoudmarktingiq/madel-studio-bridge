/**
 * MADEL Studio Bridge — AI Client Manager Types & Contracts
 * Developed & Maintained by Mahmoud Adel
 * Clean-Room Specification for Declarative Client Discovery and Configuration
 */
export const ClientStatus = {
    INSTALLED: "installed",
    NOT_INSTALLED: "not_installed",
    DETECTED: "detected",
    CONFIGURED: "configured",
    CONNECTED: "connected",
    UNSUPPORTED: "unsupported",
    NOT_VERIFIED: "not_verified",
};
export const ConfigFormat = {
    JSON: "json",
    JSONC: "jsonc",
    TOML: "toml",
    YAML: "yaml",
};
export const TransportType = {
    STDIO: "stdio",
    NAMED_PIPE: "namedPipe",
    WEBSOCKET: "websocket",
    SSE: "sse",
};
//# sourceMappingURL=types.js.map