import { spawn } from "node:child_process";
import { readdir, readFile, stat } from "node:fs/promises";
import { request } from "node:http";
import { networkInterfaces } from "node:os";
import { join, posix, win32 } from "node:path";
import { log } from "../logging.js";
const TERMINAL = /success|fail|error|abort|cancel/i;
export function isTerminalStatus(status) {
    return TERMINAL.test(status);
}
export function isSuccessStatus(status) {
    return /success/i.test(status);
}
/** First text inside <tag>…</tag>, or "" — the payloads are flat XML. */
export function tag(xml, name) {
    const m = new RegExp(`<${name}>([\\s\\S]*?)</${name}>`).exec(xml);
    return m ? decodeXml(m[1] ?? "") : "";
}
function decodeXml(s) {
    return s.replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&quot;/g, '"').replace(/&apos;/g, "'").replace(/&amp;/g, "&").trim();
}
function encodeXml(s) {
    return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}
export function parseServer(xml) {
    return {
        serverStatus: tag(xml, "ServerStatus"),
        jobStatus: tag(xml, "JobStatus"),
        jobId: tag(xml, "JobId"),
        jobProgress: tag(xml, "JobProgress"),
        details: tag(xml, "Details"),
        ...(tag(xml, "ServerIP") ? { serverIp: tag(xml, "ServerIP") } : {}),
        ...(tag(xml, "ServerPort") ? { serverPort: tag(xml, "ServerPort") } : {}),
    };
}
export function parseJob(xml) {
    const j = { jobId: tag(xml, "JobId"), jobStatus: tag(xml, "JobStatus"), jobProgress: tag(xml, "JobProgress"), details: tag(xml, "Details") };
    for (const [k, t] of [
        ["sourcePresetPath", "SourcePresetPath"],
        ["sourceFilePath", "SourceFilePath"],
        ["destinationPath", "DestinationPath"],
    ]) {
        const v = tag(xml, t);
        if (v)
            j[k] = v;
    }
    return j;
}
/** History payload: the current job fields plus <CompletedJobs><Job>…</Job></CompletedJobs>. */
export function parseHistory(xml) {
    const out = [];
    const re = /<Job>([\s\S]*?)<\/Job>/g;
    let m;
    while ((m = re.exec(xml)) !== null)
        out.push(parseJob(m[1] ?? ""));
    return out;
}
export function buildManifest(r) {
    const lines = [
        '<?xml version="1.0" encoding="UTF-8"?>',
        "<!DOCTYPE manifest>",
        '<manifest version="1.0">',
        `<SourcePresetPath>${encodeXml(r.presetPath)}</SourcePresetPath>`,
        `<SourceFilePath>${encodeXml(r.sourcePath)}</SourceFilePath>`,
        `<DestinationPath>${encodeXml(r.destinationPath)}</DestinationPath>`,
    ];
    if (r.overwrite)
        lines.push("<OverwriteDestinationIfPresent>true</OverwriteDestinationIfPresent>");
    if (r.sequenceGuid)
        lines.push(`<SequenceGUID>${encodeXml(r.sequenceGuid)}</SequenceGUID>`);
    if (r.notificationTarget)
        lines.push(`<NotificationTarget>${encodeXml(r.notificationTarget)}</NotificationTarget>`);
    lines.push("</manifest>");
    return lines.join("\n");
}
/** Newest "Adobe Media Encoder <year>" console beside the other Adobe apps. `roots` overrides the search folders (tests). */
export async function detectConsoleExe(platform = process.platform, roots) {
    const searchRoots = roots ?? (platform === "win32" ? [join(process.env["ProgramFiles"] ?? "C:\\Program Files", "Adobe")] : platform === "darwin" ? ["/Applications"] : []);
    for (const root of searchRoots) {
        let entries;
        try {
            entries = await readdir(root);
        }
        catch {
            continue;
        }
        const versions = entries.filter((e) => /^Adobe Media Encoder/i.test(e)).sort().reverse();
        for (const v of versions) {
            const candidates = platform === "win32"
                ? [join(root, v, "ame_webservice_console.exe")]
                : [
                    // AME 2026 on macOS: a nested console bundle inside the app bundle.
                    join(root, v, `${v}.app`, "Contents", "ame_webservice_console.app", "Contents", "MacOS", "ame_webservice_console"),
                    join(root, v, `${v}.app`, "Contents", "MacOS", "ame_webservice_console"),
                    join(root, v, "ame_webservice_console"),
                ];
            for (const c of candidates) {
                try {
                    await stat(c);
                    return c;
                }
                catch {
                    /* next */
                }
            }
        }
    }
    return null;
}
/** The outermost `*.app` folder on a macOS path, or null. */
function outerAppBundle(p) {
    const m = /^(.*?\.app)(?=[\\/]|$)/i.exec(p);
    return m ? (m[1] ?? null) : null;
}
/**
 * Where the console reads `ame_webservice_config.ini`. Windows: beside the exe.
 * macOS: `Contents/Resources` of the outer Media Encoder bundle (traced with fs_usage on
 * AME 26.3: the console sits in a nested bundle, ignores the cwd and every flag, and
 * Adobe ships no ini at all — without one it prints "can not open config file" and never
 * listens). The installer creates it.
 */
export function iniPathFor(exePath, platform = process.platform) {
    if (platform === "darwin") {
        const bundle = outerAppBundle(exePath);
        if (bundle)
            return posix.join(bundle, "Contents", "Resources", "ame_webservice_config.ini");
    }
    const path = platform === "win32" ? win32 : posix;
    return path.join(path.dirname(exePath), "ame_webservice_config.ini");
}
/** `port = 8080` from the console's ini; 8080 when unreadable. */
export async function portFromIni(exePath, platform = process.platform) {
    try {
        const ini = await readFile(iniPathFor(exePath, platform), "utf8");
        const m = /^\s*port\s*=\s*(\d+)/m.exec(ini);
        if (m)
            return Number(m[1]);
    }
    catch {
        /* fall through */
    }
    return 8080;
}
/**
 * macOS: pids of the hidden renderers the console launches (`…/Adobe Media Encoder <year>.app/Contents/MacOS/Adobe Media Encoder <year>`).
 * The renderer is re-parented to launchd in its own process group, so killing the console's
 * group does not reach it (verified on 26.3); the driver tracks the ones it caused instead.
 */
export function macRendererPids() {
    return new Promise((resolve) => {
        const out = [];
        const p = spawn("pgrep", ["-f", "/Adobe Media Encoder [0-9]+\\.app/Contents/MacOS/Adobe Media Encoder"], { stdio: ["ignore", "pipe", "ignore"] });
        p.stdout.on("data", (d) => out.push(d.toString()));
        p.on("error", () => resolve(new Set()));
        p.on("close", () => resolve(new Set(out.join("").split(/\s+/).filter(Boolean).map(Number).filter((n) => Number.isInteger(n) && n > 0))));
    });
}
/** Pids in `after` that were not in `before`: the processes a spawn caused. */
export function newPids(before, after) {
    return [...after].filter((pid) => !before.has(pid));
}
export function httpRequest(baseUrl, method, path, body, timeoutMs = 15_000) {
    const url = new URL(baseUrl + path);
    return new Promise((resolve, reject) => {
        const headers = { Host: url.host, Connection: "close" };
        if (body !== undefined) {
            headers["Content-Type"] = "application/xml";
            headers["Content-Length"] = Buffer.byteLength(body);
        }
        const req = request({ host: url.hostname, port: Number(url.port) || 80, method, path: url.pathname + url.search, headers }, (res) => {
            let text = "";
            res.setEncoding("utf8");
            res.on("data", (d) => (text += d));
            res.on("end", () => resolve({ status: res.statusCode ?? 0, text }));
        });
        req.setTimeout(timeoutMs, () => req.destroy(new Error(`Media Encoder web service did not answer ${method} ${path} within ${Math.round(timeoutMs / 1000)} s`)));
        req.on("error", reject);
        req.end(body);
    });
}
/** Loopback first, then every non-internal IPv4 address — the service may bind either. */
export function candidateHosts() {
    const hosts = ["127.0.0.1"];
    for (const list of Object.values(networkInterfaces())) {
        for (const i of list ?? []) {
            if (i.family === "IPv4" && !i.internal && !hosts.includes(i.address))
                hosts.push(i.address);
        }
    }
    return hosts;
}
export class AmeWebService {
    options;
    child = null;
    baseUrl = null;
    idleTimer = null;
    starting = null;
    exe = null;
    /** macOS: renderer pids our console spawned (see macRendererPids). */
    rendererPids = [];
    constructor(options) {
        this.options = options;
        if (options.baseUrl)
            this.baseUrl = options.baseUrl;
    }
    get address() {
        return this.baseUrl;
    }
    get isRunning() {
        return this.baseUrl !== null;
    }
    /**
     * Raw node:http on purpose: the service parses header names case-sensitively
     * and never answers a POST whose `content-length` is lowercase (as `fetch`
     * sends it). Verified live on 26.3.2.
     */
    http(method, path, body, timeoutMs = 15_000) {
        if (!this.baseUrl)
            return Promise.reject(new Error("Media Encoder web service is not running."));
        return httpRequest(this.baseUrl, method, path, body, timeoutMs);
    }
    /** Find a service already answering on any local address (started by us or by the user). */
    async discover(port) {
        for (const host of candidateHosts()) {
            const url = `http://${host}:${port}`;
            try {
                const res = await httpRequest(url, "GET", "/server", undefined, 1500);
                if (res.status === 200 && /<ServerStatus>/.test(res.text))
                    return url;
            }
            catch {
                /* not here */
            }
        }
        return null;
    }
    async resolveExeAndPort() {
        const exe = this.options.exePath || (await detectConsoleExe());
        const port = this.options.port || (exe ? await portFromIni(exe) : 8080);
        return { exe, port };
    }
    /** Start the console if nothing answers yet; resolves with the base URL. */
    async ensureRunning() {
        if (this.baseUrl) {
            try {
                await this.http("GET", "/server", undefined, 3000);
                this.touch();
                return this.baseUrl;
            }
            catch {
                this.baseUrl = null;
            }
        }
        if (this.starting)
            return this.starting;
        this.starting = (async () => {
            const { exe, port } = await this.resolveExeAndPort();
            const found = await this.discover(port);
            if (found) {
                this.baseUrl = found;
                log.info(`Media Encoder web service already running at ${found}`);
                this.touch();
                return found;
            }
            if (!exe)
                throw new Error("Adobe Media Encoder's ame_webservice_console was not found. Install Media Encoder or set BRAINFERNO_MCP_AME_WEBSERVICE to its path.");
            if (process.platform === "darwin") {
                // Without the ini the macOS console hangs before listening; fail fast with the fix instead of after 120 s.
                const ini = iniPathFor(exe, "darwin");
                try {
                    await stat(ini);
                }
                catch {
                    throw new Error(`Media Encoder's web service needs ${ini} on macOS (Adobe ships none). Run the installer (npm run install-cc), or create the file with the lines "ip = 127.0.0.1" and "port = 8080" — Finder can copy it into the bundle when Terminal is not allowed to.`);
                }
            }
            this.exe = exe;
            const listRenderers = this.options.listRenderers ?? (process.platform === "darwin" ? macRendererPids : null);
            const renderersBefore = listRenderers ? await listRenderers() : new Set();
            log.info(`starting Media Encoder web service: ${exe} ${this.options.extraArgs.join(" ")}`);
            this.child = spawn(exe, this.options.extraArgs, { stdio: "ignore", windowsHide: true, detached: process.platform !== "win32" });
            this.child.on("exit", (code) => {
                log.info(`Media Encoder web service exited (${code})`);
                this.child = null;
                this.baseUrl = null;
                // macOS: the renderer is not our child; if the console went away on its own, take the renderer with it.
                for (const pid of this.rendererPids.splice(0)) {
                    try {
                        process.kill(pid, "SIGKILL");
                    }
                    catch {
                        /* already gone */
                    }
                }
            });
            const deadline = Date.now() + 120_000;
            while (Date.now() < deadline) {
                await new Promise((r) => setTimeout(r, 2000));
                if (!this.child)
                    throw new Error("Media Encoder web service exited during startup.");
                const url = await this.discover(port);
                if (url) {
                    this.baseUrl = url;
                    if (listRenderers)
                        this.rendererPids = newPids(renderersBefore, await listRenderers());
                    this.touch();
                    log.info(`Media Encoder web service up at ${url}${this.rendererPids.length ? ` (renderer pid ${this.rendererPids.join(", ")})` : ""}`);
                    return url;
                }
            }
            await this.stop();
            throw new Error(`Media Encoder web service did not answer on port ${port} within 120 s.`);
        })();
        try {
            return await this.starting;
        }
        finally {
            this.starting = null;
        }
    }
    touch() {
        if (this.idleTimer)
            clearTimeout(this.idleTimer);
        if (this.options.idleMs > 0 && this.child) {
            this.idleTimer = setTimeout(() => {
                void this.stop().catch(() => undefined);
            }, this.options.idleMs);
            this.idleTimer.unref();
        }
    }
    async server() {
        const r = await this.http("GET", "/server");
        this.touch();
        return parseServer(r.text);
    }
    async job() {
        const r = await this.http("GET", "/job");
        this.touch();
        return parseJob(r.text);
    }
    async history() {
        const r = await this.http("GET", "/history");
        this.touch();
        return parseHistory(r.text);
    }
    async submit(req, opts = {}) {
        const manifest = buildManifest(req);
        const deadline = Date.now() + (opts.busyWaitMs ?? 30 * 60_000);
        for (;;) {
            // The service loads the source before answering; a .prproj comes in through
            // Dynamic Link and can take minutes on a cold renderer.
            const r = await this.http("POST", "/job", manifest, 10 * 60_000);
            this.touch();
            const info = parseJob(r.text);
            const submitResult = tag(r.text, "SubmitResult") || (r.status === 200 ? "Accepted" : `HTTP ${r.status}`);
            if (r.status === 200 && /accept/i.test(submitResult))
                return { ...info, submitResult };
            // One job at a time: "Busy" while another job (maybe submitted elsewhere) runs.
            if (/busy/i.test(submitResult) && Date.now() < deadline && !opts.signal?.aborted) {
                await new Promise((res) => setTimeout(res, 3000));
                continue;
            }
            throw new Error(`Media Encoder refused the job (${submitResult}): ${info.details || r.text.slice(0, 300)}`);
        }
    }
    async cancel(jobId) {
        const r = await this.http("DELETE", `/job?jobID=${encodeURIComponent(jobId)}`);
        this.touch();
        return parseJob(r.text);
    }
    /** Poll /job until the given job reaches a terminal state. */
    async waitForJob(jobId, opts) {
        const deadline = Date.now() + opts.timeoutMs;
        let last = null;
        while (Date.now() < deadline) {
            if (opts.signal?.aborted) {
                await this.cancel(jobId).catch(() => undefined);
                throw new Error("Media Encoder job cancelled");
            }
            const j = await this.job();
            if (j.jobId === jobId || (!j.jobId && last)) {
                last = j.jobId ? j : last;
                if (j.jobId === jobId) {
                    opts.onProgress?.(j);
                    if (isTerminalStatus(j.jobStatus))
                        return j;
                }
            }
            if (j.jobId && j.jobId !== jobId && last && isTerminalStatus(last.jobStatus))
                return last;
            await new Promise((r) => setTimeout(r, opts.intervalMs ?? 1500));
        }
        throw new Error(`Media Encoder job ${jobId} did not finish within ${Math.round(opts.timeoutMs / 1000)} s (last status: ${last?.jobStatus ?? "unknown"}).`);
    }
    /** Stop the console we started (tree kill: the renderer it spawned goes too). */
    async stop() {
        if (this.idleTimer) {
            clearTimeout(this.idleTimer);
            this.idleTimer = null;
        }
        const child = this.child;
        this.child = null;
        this.baseUrl = this.options.baseUrl ?? null;
        const renderers = this.rendererPids;
        this.rendererPids = [];
        if ((!child || child.pid === undefined) && renderers.length === 0)
            return;
        log.info("stopping Media Encoder web service");
        if (process.platform === "win32") {
            if (!child || child.pid === undefined)
                return;
            await new Promise((resolve) => {
                const k = spawn("taskkill", ["/PID", String(child.pid), "/T", "/F"], { stdio: "ignore", windowsHide: true });
                k.on("close", () => resolve());
                k.on("error", () => resolve());
            });
        }
        else {
            if (child && child.pid !== undefined) {
                try {
                    process.kill(-child.pid, "SIGTERM");
                }
                catch {
                    child.kill("SIGTERM");
                }
            }
            // The renderer outlives the console (own process group, parent launchd): end the ones we caused.
            // SIGKILL on purpose — SIGTERM is caught by Adobe's crash handler, which pops a crash report and keeps the process.
            for (const pid of renderers) {
                try {
                    process.kill(pid, "SIGKILL");
                }
                catch {
                    /* already gone */
                }
            }
        }
    }
    get executable() {
        return this.exe;
    }
}
//# sourceMappingURL=ame-webservice.js.map