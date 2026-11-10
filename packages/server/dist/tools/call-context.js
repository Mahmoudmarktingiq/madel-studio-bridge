/**
 * Which MCP tool call the current async work belongs to (AE-16): the tool name and the arguments
 * the callback received, so an error raised deep inside a bridge call can name both. App-neutral.
 *
 * It is an AsyncLocalStorage store, not a module-level "current tool": concurrent calls (several
 * sessions, several apps, the per-app queue) each keep their own. Awaiting `bridge.evaluate`
 * resumes in the caller's context, so a ScriptError built in the WebSocket handler is still read
 * against the right call. Job steps started from a callback inherit the store, including after a
 * `wait:false` return; only the error enrichment reads it, so that is harmless.
 */
import { AsyncLocalStorage } from "node:async_hooks";
const calls = new AsyncLocalStorage();
/** The tool call the current async context belongs to, if any. */
export function currentToolCall() {
    return calls.getStore();
}
/** Runs fn inside a tool-call context (tests, and AE-03's ae_batch for per-operation context). */
export function runAsToolCall(call, fn) {
    return calls.run(call, fn);
}
/**
 * A registerTool that runs every callback inside a tool-call context. Use it per app, inside the
 * app's register function, so unit tests that build an McpServer directly get it too. The store
 * holds the args object itself (not a copy); handlers do not mutate it, and it is echoed only on
 * failure.
 */
export function withToolContext(server, options = {}) {
    const noArgs = options.noArgs ?? new Set();
    const register = (name, config, cb) => server.registerTool.call(server, name, config, (...a) => {
        // The SDK calls (args, extra) for a tool with an input schema and (extra) without one.
        const args = a.length >= 2 && a[0] !== null && typeof a[0] === "object" ? a[0] : undefined;
        return runAsToolCall({ tool: name, args: noArgs.has(name) ? undefined : args }, () => cb(...a));
    });
    return { registerTool: register };
}
//# sourceMappingURL=call-context.js.map