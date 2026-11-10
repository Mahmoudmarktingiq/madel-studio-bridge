/** Runtime configuration, read once at startup from the environment. */
import { chmodSync, copyFileSync, existsSync, mkdirSync, readFileSync } from "node:fs";
import { homedir } from "node:os";
import { join } from "node:path";
import { defaultHandshakePath } from "./bridge/handshake.js";
export const DEFAULT_ILLUSTRATOR_MCP_URL = "http://localhost:18412/v1/mcp";
const LOG_LEVELS = ["error", "warn", "info", "debug"];
const PREVIEW_MODES = ["inline", "path", "both"];
const LEGACY_ENV_PREFIX = "ADOBE_CC_MCP_";
const warnedLegacy = new Set();
/** Read BRAINFERNO_MCP_X, falling back to the pre-rename ADOBE_CC_MCP_X with a one-time warning. */
export function envValue(name) {
    const v = process.env[name];
    if (v !== undefined)
        return v;
    const legacy = name.replace(/^BRAINFERNO_MCP_/, LEGACY_ENV_PREFIX);
    const l = process.env[legacy];
    if (l !== undefined && !warnedLegacy.has(legacy)) {
        warnedLegacy.add(legacy);
        console.error(`[brainferno-mcp-bridge] WARN ${legacy} is deprecated; rename it to ${name}`);
    }
    return l;
}
/** Settings live in ~/.brainferno-mcp-bridge; copy config.json from the pre-rename ~/.adobe-cc-mcp once. */
export function migrateLegacyUserDir(home = homedir()) {
    const next = join(home, ".brainferno-mcp-bridge");
    const old = join(home, ".adobe-cc-mcp");
    try {
        if (!existsSync(join(next, "config.json")) && existsSync(join(old, "config.json"))) {
            mkdirSync(next, { recursive: true });
            copyFileSync(join(old, "config.json"), join(next, "config.json"));
            try {
                chmodSync(join(next, "config.json"), 0o600);
            }
            catch { /* Windows */ }
            return old;
        }
    }
    catch {
        /* best effort */
    }
    return null;
}
/** Keys the installer may write to `~/.brainferno-mcp-bridge/config.json` (mode 600). */
/** Everything the installer can switch on or off. */
export const INSTALLABLE_APPS = ["photoshop", "after_effects", "premiere", "illustrator", "audition", "media_encoder"];
/** Every spelling an app may be given as, in BRAINFERNO_MCP_APPS and BRAINFERNO_MCP_ALLOW_RAW_SCRIPTS. */
const APP_ALIASES = {
    ps: "photoshop",
    photoshop: "photoshop",
    ae: "after_effects",
    aftereffects: "after_effects",
    after_effects: "after_effects",
    "after-effects": "after_effects",
    ppro: "premiere",
    pr: "premiere",
    premiere: "premiere",
    premierepro: "premiere",
    ai: "illustrator",
    illustrator: "illustrator",
    au: "audition",
    audition: "audition",
    ame: "media_encoder",
    mediaencoder: "media_encoder",
    media_encoder: "media_encoder",
    "media-encoder": "media_encoder",
};
/** The app a token names (trimmed, case-insensitive, aliases allowed), or undefined. */
export function resolveAppToken(token) {
    const key = token.trim().toLowerCase();
    // Own keys only: "constructor" or "toString" must not resolve through Object.prototype.
    return Object.prototype.hasOwnProperty.call(APP_ALIASES, key) ? APP_ALIASES[key] : undefined;
}
export function parseApps(raw, fallback = INSTALLABLE_APPS) {
    if (raw === undefined || raw.trim() === "" || raw.trim().toLowerCase() === "all")
        return [...fallback];
    const out = [];
    for (const part of raw.split(/[,\s]+/)) {
        const id = resolveAppToken(part);
        if (!id)
            throw new Error(`Unknown app "${part}". Use: ${INSTALLABLE_APPS.join(", ")}`);
        if (!out.includes(id))
            out.push(id);
    }
    return out;
}
/** Apps with a raw-script tool: cc_eval_script (ExtendScript hosts), ae_run_script (After Effects) and ps_batch_play (Photoshop). Canonical order. */
export const RAW_SCRIPT_APPS = ["after_effects", "photoshop", "illustrator", "audition"];
export function isRawScriptApp(id) {
    return RAW_SCRIPT_APPS.includes(id);
}
/**
 * Parses BRAINFERNO_MCP_ALLOW_RAW_SCRIPTS: `1`/`true`/`all`/`*` enables every raw-capable app,
 * `0`/`false`/`no`/`off` or unset enables none, anything else is a comma/space list of app ids
 * (aliases allowed). Pure and fail-closed: it never throws, and a token that names no raw-capable
 * app (Premiere Pro, Media Encoder, a typo) is reported in `ignored`, never enabled.
 */
export function parseRawScriptApps(raw) {
    if (raw === undefined || raw.trim() === "")
        return { apps: [], ignored: [] };
    const whole = raw.trim().toLowerCase();
    if (whole === "1" || whole === "true" || whole === "all" || whole === "*")
        return { apps: [...RAW_SCRIPT_APPS], ignored: [] };
    if (whole === "0" || whole === "false" || whole === "no" || whole === "off")
        return { apps: [], ignored: [] };
    const found = new Set();
    const ignored = [];
    for (const part of raw.split(/[,\s]+/)) {
        const token = part.trim();
        if (token === "")
            continue;
        const id = resolveAppToken(token);
        if (id !== undefined && isRawScriptApp(id))
            found.add(id);
        else
            ignored.push(token);
    }
    return { apps: RAW_SCRIPT_APPS.filter((a) => found.has(a)), ignored };
}
/** A strict on/off switch: on only for `1` or `true` (trimmed, any case); anything else is off. */
export function parseFlag(raw) {
    if (raw === undefined)
        return false;
    const v = raw.trim().toLowerCase();
    return v === "1" || v === "true";
}
export function userConfigPath() {
    return join(homedir(), ".brainferno-mcp-bridge", "config.json");
}
/** The user config file, or {} when missing/malformed. */
export function readUserConfig() {
    try {
        const parsed = JSON.parse(readFileSync(userConfigPath(), "utf8"));
        const out = {};
        if (Array.isArray(parsed["enabledApps"])) {
            const apps = parsed["enabledApps"].filter((a) => typeof a === "string" && INSTALLABLE_APPS.includes(a));
            out.enabledApps = apps;
        }
        if (typeof parsed["illustratorKey"] === "string")
            out.illustratorKey = parsed["illustratorKey"];
        if (typeof parsed["illustratorUrl"] === "string")
            out.illustratorUrl = parsed["illustratorUrl"];
        if (typeof parsed["illustratorApp"] === "string")
            out.illustratorApp = parsed["illustratorApp"];
        if (typeof parsed["httpPort"] === "number")
            out.httpPort = parsed["httpPort"];
        if (typeof parsed["httpHost"] === "string")
            out.httpHost = parsed["httpHost"];
        if (typeof parsed["httpToken"] === "string")
            out.httpToken = parsed["httpToken"];
        return out;
    }
    catch {
        return {};
    }
}
/**
 * The Illustrator delegate key: env first, then the user config file, so the
 * user can paste it once without editing the client config. "" = disabled.
 */
function illustratorKeyFromEnvOrFile(file) {
    const fromEnv = envValue("BRAINFERNO_MCP_ILLUSTRATOR_KEY");
    if (fromEnv !== undefined && fromEnv !== "")
        return fromEnv;
    return file.illustratorKey ?? "";
}
function intFromEnv(name, fallback, { allowZero = false } = {}) {
    const raw = envValue(name);
    if (raw === undefined || raw === "")
        return fallback;
    const parsed = Number.parseInt(raw, 10);
    const floor = allowZero ? 0 : 1;
    if (!Number.isFinite(parsed) || parsed < floor) {
        throw new Error(`${name} must be an integer >= ${floor}, got ${JSON.stringify(raw)}`);
    }
    return parsed;
}
function boolFromEnv(name, fallback = false) {
    const raw = envValue(name);
    if (raw === undefined || raw === "")
        return fallback;
    return raw === "1" || raw === "true";
}
function previewFromEnv() {
    const raw = envValue("BRAINFERNO_MCP_PREVIEW");
    if (raw === undefined || raw === "")
        return "both";
    if (!PREVIEW_MODES.includes(raw)) {
        throw new Error(`BRAINFERNO_MCP_PREVIEW must be one of ${PREVIEW_MODES.join(", ")}, got ${raw}`);
    }
    return raw;
}
function logLevelFromEnv() {
    const raw = envValue("BRAINFERNO_MCP_LOG_LEVEL");
    if (raw === undefined || raw === "")
        return "info";
    if (!LOG_LEVELS.includes(raw)) {
        throw new Error(`BRAINFERNO_MCP_LOG_LEVEL must be one of ${LOG_LEVELS.join(", ")}, got ${raw}`);
    }
    return raw;
}
const warnedGate = new Set();
/** Warn (once per distinct message) about gate tokens that enable nothing. Stderr, like envValue: the logger is not set up yet. */
function warnIgnoredRawScriptTokens(ignored) {
    if (ignored.length === 0)
        return;
    const message = `BRAINFERNO_MCP_ALLOW_RAW_SCRIPTS: ignored ${ignored.join(", ")} ` +
        `(raw scripts exist only for ${RAW_SCRIPT_APPS.join(", ")})`;
    if (warnedGate.has(message))
        return;
    warnedGate.add(message);
    console.error(`[brainferno-mcp-bridge] WARN ${message}`);
}
export function loadConfig() {
    const file = readUserConfig();
    const gate = parseRawScriptApps(envValue("BRAINFERNO_MCP_ALLOW_RAW_SCRIPTS"));
    warnIgnoredRawScriptTokens(gate.ignored);
    return {
        // Port 0 is allowed so the OS can assign one (used in tests); the handshake
        // file makes the real port discoverable regardless.
        bridgePort: intFromEnv("BRAINFERNO_MCP_BRIDGE_PORT", 7897, { allowZero: true }),
        bridgeToken: envValue("BRAINFERNO_MCP_BRIDGE_TOKEN") ?? "",
        bridgeInsecure: boolFromEnv("BRAINFERNO_MCP_BRIDGE_INSECURE"),
        evalTimeoutMs: intFromEnv("BRAINFERNO_MCP_EVAL_TIMEOUT_MS", 30_000),
        // 0 disables the heartbeat.
        heartbeatIntervalMs: intFromEnv("BRAINFERNO_MCP_HEARTBEAT_MS", 15_000, { allowZero: true }),
        allowRawScripts: gate.apps.length > 0,
        rawScriptApps: gate.apps,
        rawScriptIgnored: gate.ignored,
        allowRemoteRawScripts: parseFlag(envValue("BRAINFERNO_MCP_ALLOW_REMOTE_RAW_SCRIPTS")),
        handshakeFilePath: envValue("BRAINFERNO_MCP_HANDSHAKE_FILE") ?? defaultHandshakePath(),
        allowedOrigins: (envValue("BRAINFERNO_MCP_ALLOWED_ORIGINS") ?? "")
            .split(",")
            .map((o) => o.trim())
            .filter((o) => o !== ""),
        illustratorMcpUrl: envValue("BRAINFERNO_MCP_ILLUSTRATOR_URL") ?? file.illustratorUrl ?? DEFAULT_ILLUSTRATOR_MCP_URL,
        illustratorMcpKey: illustratorKeyFromEnvOrFile(file),
        illustratorApp: envValue("BRAINFERNO_MCP_ILLUSTRATOR_APP") ?? file.illustratorApp ?? "",
        ffmpegPath: envValue("BRAINFERNO_MCP_FFMPEG") ?? "ffmpeg",
        ffprobePath: envValue("BRAINFERNO_MCP_FFPROBE") ?? "ffprobe",
        ameWebServicePath: envValue("BRAINFERNO_MCP_AME_WEBSERVICE") ?? "",
        amePort: intFromEnv("BRAINFERNO_MCP_AME_PORT", 0, { allowZero: true }),
        ameIdleMs: intFromEnv("BRAINFERNO_MCP_AME_IDLE_MS", 10 * 60_000, { allowZero: true }),
        httpPort: intFromEnv("BRAINFERNO_MCP_HTTP_PORT", file.httpPort ?? 0, { allowZero: true }),
        httpHost: envValue("BRAINFERNO_MCP_HTTP_HOST") ?? file.httpHost ?? "127.0.0.1",
        httpToken: envValue("BRAINFERNO_MCP_HTTP_TOKEN") ?? file.httpToken ?? "",
        enabledApps: parseApps(envValue("BRAINFERNO_MCP_APPS"), file.enabledApps ?? INSTALLABLE_APPS),
        logLevel: logLevelFromEnv(),
        defaultWait: boolFromEnv("BRAINFERNO_MCP_DEFAULT_WAIT", true),
        preview: previewFromEnv(),
        jobWaitSeconds: intFromEnv("BRAINFERNO_MCP_JOB_WAIT_SECONDS", 300),
    };
}
//# sourceMappingURL=config.js.map