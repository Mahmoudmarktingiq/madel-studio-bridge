/**
 * MADEL Studio Bridge — Browser Automation Session Manager
 * Developed and maintained by Mahmoud Adel
 *
 * Coordinates isolated Chromium instances (Google Chrome & Microsoft Edge)
 * via direct Chrome DevTools Protocol (CDP) on dynamic localhost ports.
 * Strict process scoping: terminates only MADEL-owned PIDs and cleans up ephemeral profiles.
 */

import { ChildProcess, execSync, spawn } from "node:child_process";
import { existsSync, mkdirSync, rmSync } from "node:fs";
import * as http from "node:http";
import * as net from "node:net";
import { homedir, platform, tmpdir } from "node:os";
import { join, normalize } from "node:path";

import { BrowserSecurityPolicy } from "./browser-security.js";
import { CDPClient } from "./cdp-client.js";

export interface BrowserInfo {
  id: string;
  name: string;
  type: "chrome" | "edge" | "brave" | "chromium";
  executablePath: string;
  version?: string;
  isDefault?: boolean;
  supported: boolean;
}

export interface ManagedBrowserSession {
  sessionId: string;
  browserType: string;
  executablePath: string;
  port: number;
  pid: number;
  process: ChildProcess;
  tempProfileDir: string;
  cdpClient: CDPClient;
  createdAt: string;
  headless: boolean;
  ownerClientId?: string;
}

export interface CreateSessionOptions {
  browserType?: "chrome" | "edge" | "brave";
  headless?: boolean;
  viewport?: { width?: number; height?: number };
  ownerClientId?: string;
}

export class BrowserManager {
  private readonly sessions = new Map<string, ManagedBrowserSession>();
  private readonly isWin = platform() === "win32";

  constructor() {
    // Hook graceful process exit
    const cleanup = () => {
      this.closeAllSessionsSync();
    };
    process.on("exit", cleanup);
    process.on("SIGINT", () => {
      cleanup();
      process.exit(0);
    });
    process.on("SIGTERM", () => {
      cleanup();
      process.exit(0);
    });
  }

  /**
   * Discovers installed web browsers on the host system.
   */
  public listAvailableBrowsers(): BrowserInfo[] {
    const browsers: BrowserInfo[] = [];

    const userProfile = process.env.USERPROFILE || homedir();
    const localAppData = process.env.LOCALAPPDATA || join(userProfile, "AppData", "Local");
    const programFiles = process.env.ProgramFiles || "C:\\Program Files";
    const programFilesX86 = process.env["ProgramFiles(x86)"] || "C:\\Program Files (x86)";

    // 1. Google Chrome
    const chromeCandidates = [
      join(programFiles, "Google", "Chrome", "Application", "chrome.exe"),
      join(programFilesX86, "Google", "Chrome", "Application", "chrome.exe"),
      join(localAppData, "Google", "Chrome", "Application", "chrome.exe"),
    ];
    for (const p of chromeCandidates) {
      if (existsSync(p)) {
        browsers.push({
          id: "chrome",
          name: "Google Chrome",
          type: "chrome",
          executablePath: p,
          version: this.getExecutableVersion(p),
          isDefault: true,
          supported: true,
        });
        break;
      }
    }

    // 2. Microsoft Edge
    const edgeCandidates = [
      join(programFilesX86, "Microsoft", "Edge", "Application", "msedge.exe"),
      join(programFiles, "Microsoft", "Edge", "Application", "msedge.exe"),
    ];
    for (const p of edgeCandidates) {
      if (existsSync(p)) {
        browsers.push({
          id: "edge",
          name: "Microsoft Edge",
          type: "edge",
          executablePath: p,
          version: this.getExecutableVersion(p),
          isDefault: false,
          supported: true,
        });
        break;
      }
    }

    // 3. Brave Browser (optional detection)
    const braveCandidates = [
      join(programFiles, "BraveSoftware", "Brave-Browser", "Application", "brave.exe"),
      join(localAppData, "BraveSoftware", "Brave-Browser", "Application", "brave.exe"),
    ];
    for (const p of braveCandidates) {
      if (existsSync(p)) {
        browsers.push({
          id: "brave",
          name: "Brave Browser",
          type: "brave",
          executablePath: p,
          version: this.getExecutableVersion(p),
          isDefault: false,
          supported: true,
        });
        break;
      }
    }

    return browsers;
  }

  private getExecutableVersion(exePath: string): string | undefined {
    if (!this.isWin) return undefined;
    try {
      const output = execSync(
        `powershell -NoProfile -Command "(Get-ItemProperty -LiteralPath '${exePath}').VersionInfo.ProductVersion"`,
        { encoding: "utf8", windowsHide: true, timeout: 3000 },
      );
      return output.trim() || undefined;
    } catch {
      return undefined;
    }
  }

  /**
   * Finds an available free local TCP port dynamically.
   */
  private async findFreePort(): Promise<number> {
    return new Promise((resolve, reject) => {
      const server = net.createServer();
      server.unref();
      server.on("error", reject);
      server.listen(0, "127.0.0.1", () => {
        const addr = server.address() as net.AddressInfo;
        const port = addr.port;
        server.close(() => resolve(port));
      });
    });
  }

  /**
   * Resolves the root directory for temporary browser session profiles.
   */
  private resolveProfileBaseDir(): string {
    const customWorkspace = normalize("D:\\MCP\\11-Other-Apps\\Browser\\MADEL\\P23-Browser-Integration\\03-Project\\sessions");
    if (existsSync("D:\\MCP")) {
      if (!existsSync(customWorkspace)) {
        mkdirSync(customWorkspace, { recursive: true });
      }
      return customWorkspace;
    }
    const fallback = join(tmpdir(), "madel-browser-sessions");
    if (!existsSync(fallback)) mkdirSync(fallback, { recursive: true });
    return fallback;
  }

  /**
   * Creates an isolated browser session with ephemeral user data and connects via CDP.
   */
  public async createSession(options: CreateSessionOptions = {}): Promise<ManagedBrowserSession> {
    const browsers = this.listAvailableBrowsers();
    if (browsers.length === 0) {
      throw new Error("No supported Chromium browser (Google Chrome or Microsoft Edge) found on this machine.");
    }

    const requestedType = options.browserType || "chrome";
    let selectedBrowser = browsers.find((b) => b.type === requestedType) || browsers[0];
    if (!selectedBrowser) {
      throw new Error("No supported Chromium browser found on this machine.");
    }

    const sessionId = `madel-browser-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 7)}`;
    const port = await this.findFreePort();

    const baseDir = this.resolveProfileBaseDir();
    const tempProfileDir = join(baseDir, sessionId);
    mkdirSync(tempProfileDir, { recursive: true });

    const headless = options.headless !== false;
    const width = options.viewport?.width || 1280;
    const height = options.viewport?.height || 800;

    const args = [
      headless ? "--headless=new" : "--no-headless",
      `--remote-debugging-port=${port}`,
      "--remote-debugging-address=127.0.0.1",
      `--user-data-dir=${tempProfileDir}`,
      "--no-first-run",
      "--no-default-browser-check",
      "--disable-background-networking",
      "--disable-sync",
      "--disable-translate",
      "--disable-default-apps",
      "--disable-features=AutofillServerCommunication,OptimizationGuideModelDownloading",
      "--password-store=basic",
      `--window-size=${width},${height}`,
      "about:blank",
    ];

    const child = spawn(selectedBrowser.executablePath, args, {
      detached: false,
      stdio: "ignore",
      windowsHide: headless,
    });

    if (!child.pid) {
      try { rmSync(tempProfileDir, { recursive: true, force: true }); } catch {}
      throw new Error(`Failed to spawn browser process: ${selectedBrowser.executablePath}`);
    }

    const pid = child.pid;

    // Handle early crash
    let crashed = false;
    child.once("exit", () => {
      crashed = true;
      this.sessions.delete(sessionId);
    });

    // Poll for CDP endpoint readiness
    let targetWsUrl: string | undefined;
    const startTime = Date.now();
    const maxWaitMs = 15_000;

    while (Date.now() - startTime < maxWaitMs) {
      if (crashed) {
        throw new Error(`Browser process PID ${pid} exited prematurely during startup.`);
      }

      try {
        const pages = await this.fetchJson<any[]>(`http://127.0.0.1:${port}/json/list`);
        if (Array.isArray(pages) && pages.length > 0) {
          const pageTarget = pages.find((p) => p.type === "page" && p.webSocketDebuggerUrl) || pages[0];
          if (pageTarget?.webSocketDebuggerUrl) {
            targetWsUrl = pageTarget.webSocketDebuggerUrl;
            break;
          }
        }
      } catch {
        // Not ready yet, retry
      }
      await new Promise((r) => setTimeout(r, 200));
    }

    if (!targetWsUrl) {
      this.killPid(pid);
      try { rmSync(tempProfileDir, { recursive: true, force: true }); } catch {}
      throw new Error(`Browser CDP endpoint failed to respond on 127.0.0.1:${port} within ${maxWaitMs}ms`);
    }

    // Connect CDP Client
    const cdpClient = new CDPClient(targetWsUrl);
    await cdpClient.connect(10_000);

    const session: ManagedBrowserSession = {
      sessionId,
      browserType: selectedBrowser.type,
      executablePath: selectedBrowser.executablePath,
      port,
      pid,
      process: child,
      tempProfileDir,
      cdpClient,
      createdAt: new Date().toISOString(),
      headless,
      ownerClientId: options.ownerClientId,
    };

    this.sessions.set(sessionId, session);
    return session;
  }

  private fetchJson<T>(url: string, timeoutMs = 2000): Promise<T> {
    return new Promise((resolve, reject) => {
      const req = http.get(url, { timeout: timeoutMs }, (res) => {
        let data = "";
        res.on("data", (chunk) => (data += chunk));
        res.on("end", () => {
          try {
            resolve(JSON.parse(data) as T);
          } catch (e) {
            reject(e);
          }
        });
      });
      req.on("error", reject);
      req.on("timeout", () => {
        req.destroy();
        reject(new Error("HTTP GET timeout"));
      });
    });
  }

  /**
   * Retrieves a managed session by ID with ownership validation.
   */
  public getSession(sessionId: string, clientId?: string): ManagedBrowserSession {
    const session = this.sessions.get(sessionId);
    if (!session) {
      throw new Error(`Managed browser session '${sessionId}' not found or already closed.`);
    }

    if (!BrowserSecurityPolicy.validateSessionOwnership(session.ownerClientId, clientId)) {
      throw new Error(`Access denied: Session '${sessionId}' belongs to another AI client.`);
    }

    return session;
  }

  /**
   * Lists all active sessions currently managed.
   */
  public async listSessions(): Promise<Array<{
    sessionId: string;
    browserType: string;
    port: number;
    pid: number;
    currentUrl: string;
    title: string;
    headless: boolean;
    createdAt: string;
  }>> {
    const result = [];
    for (const [id, s] of this.sessions.entries()) {
      let currentUrl = "about:blank";
      let title = "";
      try {
        currentUrl = await s.cdpClient.getCurrentUrl();
        title = await s.cdpClient.getPageTitle();
      } catch {}

      result.push({
        sessionId: id,
        browserType: s.browserType,
        port: s.port,
        pid: s.pid,
        currentUrl,
        title,
        headless: s.headless,
        createdAt: s.createdAt,
      });
    }
    return result;
  }

  /**
   * Safely closes a single managed session, terminates the child process, and removes temp profile.
   */
  public async closeSession(sessionId: string, clientId?: string): Promise<{ success: boolean; closedPid: number; cleanedTempDir: boolean }> {
    const session = this.getSession(sessionId, clientId);

    // Close CDP connection
    try {
      session.cdpClient.close();
    } catch {}

    // Kill ONLY the process MADEL spawned
    const pid = session.pid;
    this.killPid(pid);

    // Delete temp profile directory
    let cleaned = false;
    try {
      if (existsSync(session.tempProfileDir)) {
        rmSync(session.tempProfileDir, { recursive: true, force: true, maxRetries: 3, retryDelay: 200 });
        cleaned = true;
      }
    } catch {
      cleaned = false;
    }

    this.sessions.delete(sessionId);
    return { success: true, closedPid: pid, cleanedTempDir: cleaned };
  }

  private killPid(pid: number) {
    if (this.isWin) {
      try {
        execSync(`taskkill /F /T /PID ${pid}`, { stdio: "ignore", windowsHide: true });
      } catch {}
    } else {
      try {
        process.kill(pid, "SIGTERM");
      } catch {}
    }
  }

  /**
   * Synchronous cleanup on process exit.
   */
  public closeAllSessionsSync(): void {
    for (const [id, s] of this.sessions.entries()) {
      try { s.cdpClient.close(); } catch {}
      this.killPid(s.pid);
      try {
        if (existsSync(s.tempProfileDir)) {
          rmSync(s.tempProfileDir, { recursive: true, force: true });
        }
      } catch {}
    }
    this.sessions.clear();
  }

  /**
   * Asynchronous graceful shutdown.
   */
  public async shutdown(): Promise<void> {
    const ids = Array.from(this.sessions.keys());
    for (const id of ids) {
      await this.closeSession(id).catch(() => {});
    }
  }
}

// Global default singleton
export const globalBrowserManager = new BrowserManager();
