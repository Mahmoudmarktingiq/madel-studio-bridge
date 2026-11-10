import { randomBytes } from "node:crypto";
import { networkInterfaces } from "node:os";
import { join, posix, win32 } from "node:path";
import { existsSync, readdirSync } from "node:fs";
import { INSTALLABLE_APPS, parseApps } from "../config.js";
import { SERVER_VERSION } from "../version.js";
export const APP_CHOICES = [
    { id: "photoshop", label: "Photoshop", folder: /^Adobe Photoshop/i, needs: ["uxp"] },
    { id: "after_effects", label: "After Effects", folder: /^Adobe After Effects/i, needs: ["cep"] },
    { id: "premiere", label: "Premiere Pro", folder: /^Adobe Premiere Pro/i, needs: ["uxp"] },
    { id: "illustrator", label: "Illustrator", folder: /^Adobe Illustrator/i, needs: ["illustrator-key"] },
    { id: "audition", label: "Audition", folder: /^Adobe Audition/i, needs: ["cep"] },
    { id: "media_encoder", label: "Media Encoder", folder: /^Adobe Media Encoder/i, needs: ["ame-ini"] },
];
/** Which of the six are installed, judged by their app folders. */
export function detectInstalledApps(platform = process.platform) {
    const root = platform === "win32" ? join(process.env["ProgramFiles"] ?? "C:\\Program Files", "Adobe") : platform === "darwin" ? "/Applications" : "";
    if (!root || !existsSync(root))
        return [];
    let names;
    try {
        names = readdirSync(root);
    }
    catch {
        return [];
    }
    return APP_CHOICES.filter((c) => names.some((n) => c.folder.test(n))).map((c) => c.id);
}
/** "1,3,5", "1 3", "all", or app names → app ids (in canonical order). */
export function pickApps(answer, fallback) {
    const a = answer.trim().toLowerCase();
    if (a === "")
        return [...fallback];
    if (a === "all" || a === "*")
        return [...INSTALLABLE_APPS];
    if (/^[\d,\s]+$/.test(a)) {
        const idx = a.split(/[,\s]+/).filter(Boolean).map(Number);
        return APP_CHOICES.filter((_, i) => idx.includes(i + 1)).map((c) => c.id);
    }
    // Names like "ps, ae" — the config parser throws on unknown names.
    return parseApps(answer);
}
export function appsNeed(apps, need) {
    return APP_CHOICES.some((c) => apps.includes(c.id) && c.needs.includes(need));
}
export const DEFAULT_HTTP_PORT = 7898;
export function randomToken() {
    return randomBytes(24).toString("base64url");
}
/** Non-internal IPv4 addresses, the ones other machines can reach. */
export function lanAddresses() {
    const out = [];
    for (const list of Object.values(networkInterfaces())) {
        for (const i of list ?? [])
            if (i.family === "IPv4" && !i.internal)
                out.push(i.address);
    }
    return out;
}
/**
 * The Illustrator MCP key as the user pasted it: either the bare `ilst_…` key or
 * the whole `claude mcp add … --header "Authorization: Bearer ilst_…" …` line
 * Illustrator shows. Returns null when nothing key-like is in there.
 */
export function extractIllustratorKey(input) {
    const s = input.trim();
    if (s === "")
        return null;
    const bearer = /Bearer\s+([A-Za-z0-9_.-]+)/i.exec(s);
    if (bearer)
        return bearer[1] ?? null;
    if (/^[A-Za-z0-9_.-]{12,}$/.test(s))
        return s;
    return null;
}
/** The endpoint URL from a pasted `claude mcp add` line, if it carries one. */
export function extractIllustratorUrl(input) {
    const m = /(https?:\/\/[^\s"']+\/mcp)\b/i.exec(input);
    return m ? (m[1] ?? null) : null;
}
/** Try an MCP initialize against Adobe's Illustrator endpoint with the key. */
export async function checkIllustratorKey(url, key, timeoutMs = 4000) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);
    try {
        const res = await fetch(url, {
            method: "POST",
            signal: controller.signal,
            headers: { authorization: `Bearer ${key}`, "content-type": "application/json", accept: "application/json, text/event-stream" },
            body: JSON.stringify({ jsonrpc: "2.0", id: 1, method: "initialize", params: { protocolVersion: "2025-03-26", capabilities: {}, clientInfo: { name: "brainferno-mcp-bridge-installer", version: SERVER_VERSION } } }),
        });
        if (res.status === 401 || res.status === 403)
            return { ok: false, reason: "refused", detail: `HTTP ${res.status}` };
        if (!res.ok)
            return { ok: false, reason: "unexpected", detail: `HTTP ${res.status}` };
        const text = await res.text();
        const m = /"serverInfo"\s*:\s*\{[^}]*"name"\s*:\s*"([^"]+)"/.exec(text);
        return { ok: true, serverName: m ? (m[1] ?? null) : null };
    }
    catch (e) {
        const msg = e instanceof Error ? e.message : String(e);
        return { ok: false, reason: /ECONNREFUSED|abort|fetch failed/i.test(msg) ? "not-running" : "unexpected", detail: msg };
    }
    finally {
        clearTimeout(timer);
    }
}
/** Apply the chosen mode to the user config file (other keys untouched). */
export function mergeUserConfig(existing, mode, o = {}) {
    const next = { ...existing };
    if (o.apps !== undefined) {
        const all = INSTALLABLE_APPS.every((a) => o.apps.includes(a));
        if (all)
            delete next.enabledApps;
        else
            next.enabledApps = INSTALLABLE_APPS.filter((a) => o.apps.includes(a));
    }
    if (o.illustratorKey !== undefined) {
        if (o.illustratorKey === null)
            delete next.illustratorKey;
        else
            next.illustratorKey = o.illustratorKey;
    }
    if (o.illustratorUrl !== undefined) {
        if (o.illustratorUrl === null)
            delete next.illustratorUrl;
        else
            next.illustratorUrl = o.illustratorUrl;
    }
    if (o.illustratorApp !== undefined) {
        if (o.illustratorApp === null)
            delete next.illustratorApp;
        else
            next.illustratorApp = o.illustratorApp;
    }
    if (mode === "local") {
        delete next.httpPort;
        delete next.httpHost;
        delete next.httpToken;
        return next;
    }
    next.httpPort = o.port ?? existing.httpPort ?? DEFAULT_HTTP_PORT;
    next.httpHost = o.host ?? "0.0.0.0";
    next.httpToken = o.token ?? existing.httpToken ?? randomToken();
    return next;
}
/**
 * Media Encoder's web-service ini: local pins `ip = 127.0.0.1`; shared leaves
 * the address to the service (it picks a LAN adapter). Other lines are kept.
 */
export function rewriteAmeIni(ini, mode) {
    const lines = ini.split(/\r?\n/);
    let seen = false;
    const out = lines.map((line) => {
        const m = /^\s*(#\s*)?ip\s*=\s*(.*)$/.exec(line);
        if (!m)
            return line;
        seen = true;
        return mode === "local" ? "ip = 127.0.0.1" : "#ip = 127.0.0.1";
    });
    if (!seen && mode === "local")
        out.unshift("ip = 127.0.0.1");
    const eol = ini.includes("\r\n") ? "\r\n" : "\n";
    return out.join(eol);
}
/**
 * Illustrator bundles under /Applications, newest-looking first, release before Beta.
 * Both bundles are named `Adobe Illustrator.app`, so an AppleScript *name* resolves to whichever
 * one LaunchServices picks; the os-script lane is pinned to a bundle id instead (config
 * `illustratorApp`). `readBundleId` is injectable for tests.
 */
export function findIllustratorApps(platform, appsRoot, readBundleId) {
    if (platform !== "darwin")
        return [];
    let names;
    try {
        names = readdirSync(appsRoot);
    }
    catch {
        return [];
    }
    const found = [];
    for (const label of names.filter((n) => /^Adobe Illustrator/i.test(n)).sort().reverse()) {
        const path = join(appsRoot, label, "Adobe Illustrator.app");
        if (!existsSync(path))
            continue;
        const bundleId = readBundleId(path);
        if (!bundleId)
            continue;
        found.push({ path, bundleId, label, beta: /beta/i.test(label) || /beta$/i.test(bundleId) });
    }
    return found.sort((a, b) => Number(a.beta) - Number(b.beta));
}
/** Seed for a Media Encoder ini that does not exist yet (macOS): the console's default port, no address pin. */
export const AME_INI_SEED = "port = 8080\n";
/**
 * AppleScript that has Finder copy `src` into `destDir` (replacing). macOS "App Management"
 * blocks writes into app bundles from a terminal, even with sudo; Finder is allowed.
 */
export function finderCopyScript(src, destDir) {
    const q = (p) => p.replace(/\\/g, "\\\\").replace(/"/g, '\\"');
    return `tell application "Finder" to duplicate file (POSIX file "${q(src)}" as alias) to folder (POSIX file "${q(destDir)}" as alias) with replacing`;
}
/** Explicit path flavours: a platform's paths must come out the same whichever OS computes them. */
export function platformPaths(platform, home, appData) {
    if (platform === "win32") {
        const roaming = appData ?? win32.join(home, "AppData", "Roaming");
        const pf = process.env["ProgramFiles"] ?? "C:\\Program Files";
        return {
            cepExtensionsDir: win32.join(roaming, "Adobe", "CEP", "extensions"),
            csxsDebugCommands: [11, 12, 13, 14].map((v) => ["reg", "add", `HKCU\\Software\\Adobe\\CSXS.${v}`, "/v", "PlayerDebugMode", "/t", "REG_SZ", "/d", "1", "/f"]),
            ameIniCandidates: [2027, 2026, 2025, 2024].map((y) => win32.join(pf, "Adobe", `Adobe Media Encoder ${y}`, "ame_webservice_config.ini")),
        };
    }
    if (platform === "darwin") {
        return {
            cepExtensionsDir: posix.join(home, "Library", "Application Support", "Adobe", "CEP", "extensions"),
            csxsDebugCommands: [11, 12, 13, 14].map((v) => ["defaults", "write", `com.adobe.CSXS.${v}`, "PlayerDebugMode", "1"]),
            // The console reads the ini from the app bundle's Resources folder (see drivers/ame-webservice.ts); Adobe ships none.
            ameIniCandidates: [2027, 2026, 2025, 2024].map((y) => posix.join("/Applications", `Adobe Media Encoder ${y}`, `Adobe Media Encoder ${y}.app`, "Contents", "Resources", "ame_webservice_config.ini")),
        };
    }
    // Adobe ships Creative Cloud for Windows and macOS only, so there is nothing to set up elsewhere.
    throw new Error(`${platform} is not supported: the Adobe applications this bridge drives run on Windows and macOS only.`);
}
/** Windows Defender Firewall rule for the remote port, private networks only. */
export function firewallCommands(platform, mode, port) {
    if (platform !== "win32")
        return [];
    const name = "Brainferno MCP Bridge (remote MCP)";
    const del = ["netsh", "advfirewall", "firewall", "delete", "rule", `name=${name}`];
    if (mode === "local")
        return [del];
    return [del, ["netsh", "advfirewall", "firewall", "add", "rule", `name=${name}`, "dir=in", "action=allow", "protocol=TCP", `localport=${port}`, "profile=private"]];
}
/**
 * The name each MCP client registers the server under. Clients build tool names from it
 * (`mcp__brainferno-adobe-bridge__ae_run_script` in Claude Code); the longest such name is 58
 * characters, within the 64 that clients allow.
 */
export const MCP_SERVER_NAME = "brainferno-adobe-bridge";
/** Earlier registration names, removed before each add so a client is never left with two. */
export const LEGACY_SERVER_NAMES = ["brainferno", "adobe-cc"];
/** The `claude mcp add` lines to print/run. */
export function mcpAddCommands(o) {
    const local = `claude mcp add --scope user ${MCP_SERVER_NAME} -- node "${o.distIndex}"`;
    const remote = o.mode === "shared" ? o.addresses.map((a) => `claude mcp add --scope user --transport http --header "Authorization: Bearer ${o.token}" ${MCP_SERVER_NAME} http://${a}:${o.port}/mcp`) : [];
    return { local, remote };
}
export const MCP_CLIENTS = ["claude", "codex", "gemini"];
export function parseClients(raw) {
    const out = [];
    for (const part of raw.split(/[,\s]+/).filter(Boolean)) {
        const id = part.trim().toLowerCase();
        if (!MCP_CLIENTS.includes(id))
            throw new Error(`Unknown MCP client "${part}". Use: ${MCP_CLIENTS.join(", ")}`);
        if (!out.includes(id))
            out.push(id);
    }
    return out;
}
/**
 * Env overrides each client's registration carries. Claude Code gets none
 * (blocking waits, inline previews — today's behavior). Codex CLI kills tool
 * calls at 60 seconds by default and cannot show the model MCP image blocks,
 * so long tools return a jobId at once, cc_job_wait polls in 50-second slices,
 * and previews come back as file paths (Codex's view_image reads them).
 * Gemini CLI renders images and has a long tool timeout; only waits change.
 */
export const CLIENT_ENV = {
    claude: {},
    codex: { BRAINFERNO_MCP_DEFAULT_WAIT: "false", BRAINFERNO_MCP_PREVIEW: "path", BRAINFERNO_MCP_JOB_WAIT_SECONDS: "50" },
    gemini: { BRAINFERNO_MCP_DEFAULT_WAIT: "false" },
};
/** One registration plan per MCP client CLI (Claude Code, Codex CLI, Gemini CLI). */
export function registrationPlans(o) {
    const chosen = o.clients ?? MCP_CLIENTS;
    const plans = [];
    const urls = o.addresses.map((a) => `http://${a}:${o.port}/mcp`);
    // The old names, then the current one (a re-run replaces it).
    const names = [...LEGACY_SERVER_NAMES, MCP_SERVER_NAME];
    if (chosen.includes("claude")) {
        const cmds = mcpAddCommands(o);
        plans.push({
            client: "claude",
            label: "Claude Code",
            probe: ["claude", "--version"],
            removals: ["user", "local"].flatMap((scope) => names.map((n) => ["claude", "mcp", "remove", "--scope", scope, n])),
            lookups: names.map((n) => ["claude", "mcp", "get", n]),
            add: ["claude", "mcp", "add", "--scope", "user", MCP_SERVER_NAME, "--", "node", o.distIndex],
            addLine: cmds.local,
            remoteLines: cmds.remote,
        });
    }
    if (chosen.includes("codex")) {
        const envArgs = Object.entries(CLIENT_ENV.codex).flatMap(([k, v]) => ["--env", `${k}=${v}`]);
        plans.push({
            client: "codex",
            label: "Codex CLI",
            probe: ["codex", "--version"],
            removals: names.map((n) => ["codex", "mcp", "remove", n]),
            lookups: [],
            add: ["codex", "mcp", "add", MCP_SERVER_NAME, ...envArgs, "--", "node", o.distIndex],
            addLine: `codex mcp add ${MCP_SERVER_NAME} ${envArgs.join(" ")} -- node "${o.distIndex}"`,
            // Codex reads the bearer token from an env var, not a header: point it at a TOML block.
            remoteLines: o.mode === "shared"
                ? [
                    "in ~/.codex/config.toml:",
                    `  [mcp_servers.${MCP_SERVER_NAME}]`,
                    `  url = "${urls[0] ?? ""}"`,
                    ...urls.slice(1).map((u) => `  # or: url = "${u}"`),
                    '  bearer_token_env_var = "BRAINFERNO_MCP_TOKEN"',
                    `then run Codex with BRAINFERNO_MCP_TOKEN=${o.token}`,
                ]
                : [],
        });
    }
    if (chosen.includes("gemini")) {
        const envArgs = Object.entries(CLIENT_ENV.gemini).flatMap(([k, v]) => ["-e", `${k}=${v}`]);
        plans.push({
            client: "gemini",
            label: "Gemini CLI",
            probe: ["gemini", "--version"],
            removals: names.map((n) => ["gemini", "mcp", "remove", "-s", "user", n]),
            lookups: [],
            add: ["gemini", "mcp", "add", "-s", "user", ...envArgs, MCP_SERVER_NAME, "node", o.distIndex],
            addLine: `gemini mcp add -s user ${envArgs.join(" ")} ${MCP_SERVER_NAME} node "${o.distIndex}"`,
            remoteLines: o.mode === "shared"
                ? [
                    'in ~/.gemini/settings.json, under "mcpServers":',
                    ...urls.map((u) => `  "${MCP_SERVER_NAME}": { "httpUrl": "${u}", "headers": { "Authorization": "Bearer ${o.token}" } }`),
                ]
                : [],
        });
    }
    return plans;
}
/**
 * The env of one server as `claude mcp get <name>` prints it: the indented `KEY=value` lines
 * under "Environment:". The value is everything after the first `=`.
 */
export function envFromMcpGet(out) {
    const env = {};
    let inEnv = false;
    for (const line of out.split(/\r?\n/)) {
        if (/^\s*Environment:\s*$/.test(line)) {
            inEnv = true;
            continue;
        }
        if (!inEnv)
            continue;
        const m = /^\s+([A-Za-z_][A-Za-z0-9_]*)=(.*)$/.exec(line);
        if (!m)
            break;
        env[m[1]] = m[2];
    }
    return env;
}
/**
 * The plan's add with the `BRAINFERNO_MCP_*` env an old entry carried (Claude Code's `-e`, before
 * the name). Other keys are not ours to copy, and a value with characters the Windows shell could
 * read (anything but letters, digits and `_.,:/\-`) is not passed through it: `dropped` names both so
 * the installer can say so. Values are passed on, never printed.
 */
export function carryEnv(plan, env) {
    const keys = Object.keys(env);
    const carried = plan.client === "claude" ? keys.filter((k) => k.startsWith("BRAINFERNO_MCP_") && /^[A-Za-z0-9_.,:\/\\-]*$/.test(env[k])) : [];
    const dropped = keys.filter((k) => !carried.includes(k));
    if (carried.length === 0)
        return { add: plan.add, carried, dropped };
    const at = plan.add.indexOf(MCP_SERVER_NAME);
    const flags = carried.flatMap((k) => ["-e", `${k}=${env[k]}`]);
    return { add: [...plan.add.slice(0, at), ...flags, ...plan.add.slice(at)], carried, dropped };
}
//# sourceMappingURL=lib.js.map