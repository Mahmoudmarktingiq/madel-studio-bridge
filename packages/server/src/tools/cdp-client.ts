/**
 * MADEL Studio Bridge — Chrome DevTools Protocol (CDP) WebSocket Client
 * Developed and maintained by Mahmoud Adel
 *
 * Direct, lightweight, and resilient CDP client leveraging Node's native WebSocket (`ws`).
 * Manages two-way event and method RPC multiplexing with the browser page target.
 */

import { WebSocket } from "ws";

export interface ConsoleLogEntry {
  type: string;
  text: string;
  url?: string;
  lineNumber?: number;
  timestamp: string;
}

export interface FailedNetworkEntry {
  url: string;
  method?: string;
  status?: number;
  errorText?: string;
  timestamp: string;
}

export interface CdpResponse<T = unknown> {
  id: number;
  result?: T;
  error?: {
    code: number;
    message: string;
    data?: string;
  };
}

export class CDPClient {
  private ws: WebSocket | null = null;
  private messageId = 1;
  private isClosing = false;
  private readonly pendingRequests = new Map<number, { resolve: (res: any) => void; reject: (err: Error) => void; timeout: NodeJS.Timeout }>();
  private readonly eventListeners = new Map<string, Set<(params: any) => void>>();

  public readonly consoleLogs: ConsoleLogEntry[] = [];
  public readonly failedRequests: FailedNetworkEntry[] = [];
  private readonly pendingNetworkMap = new Map<string, { url: string; method: string }>();

  constructor(public readonly wsUrl: string) {}

  /**
   * Connects to the CDP target WebSocket URL.
   */
  public async connect(timeoutMs = 10_000): Promise<void> {
    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => {
        if (this.ws) {
          try { this.ws.close(); } catch {}
        }
        reject(new Error(`Timeout connecting to CDP WebSocket at ${this.wsUrl}`));
      }, timeoutMs);

      try {
        this.ws = new WebSocket(this.wsUrl);

        this.ws.on("open", async () => {
          clearTimeout(timer);
          try {
            await this.initializeBaseDomains();
            resolve();
          } catch (initErr) {
            reject(initErr instanceof Error ? initErr : new Error(String(initErr)));
          }
        });

        this.ws.on("message", (raw: string | Buffer) => {
          this.handleIncomingMessage(raw.toString());
        });

        this.ws.on("error", (err) => {
          if (this.isClosing) return;
          clearTimeout(timer);
          reject(err);
        });

        this.ws.on("close", () => {
          if (this.isClosing) return;
          this.cleanupPending(new Error("CDP WebSocket connection closed"));
        });
      } catch (err) {
        clearTimeout(timer);
        reject(err instanceof Error ? err : new Error(String(err)));
      }
    });
  }

  /**
   * Initializes base CDP domains and attaches event listeners.
   */
  private async initializeBaseDomains(): Promise<void> {
    await this.send("Page.enable");
    await this.send("Runtime.enable");
    await this.send("DOM.enable");
    await this.send("Network.enable");

    // Listen to console API calls
    this.on("Runtime.consoleAPICalled", (params: any) => {
      const text = (params.args || [])
        .map((a: any) => (a.value !== undefined ? String(a.value) : (a.description || JSON.stringify(a))))
        .join(" ");

      this.recordConsoleLog({
        type: params.type || "log",
        text,
        url: params.stackTrace?.callFrames?.[0]?.url,
        lineNumber: params.stackTrace?.callFrames?.[0]?.lineNumber,
        timestamp: new Date().toISOString(),
      });
    });

    // Listen to network tracking
    this.on("Network.requestWillBeSent", (params: any) => {
      if (params.requestId && params.request) {
        this.pendingNetworkMap.set(params.requestId, {
          url: params.request.url,
          method: params.request.method,
        });
      }
    });

    this.on("Network.responseReceived", (params: any) => {
      if (params.response && params.response.status >= 400) {
        this.recordFailedNetwork({
          url: params.response.url,
          status: params.response.status,
          errorText: `HTTP ${params.response.status} ${params.response.statusText || ""}`.trim(),
          timestamp: new Date().toISOString(),
        });
      }
      if (params.requestId) {
        this.pendingNetworkMap.delete(params.requestId);
      }
    });

    this.on("Network.loadingFailed", (params: any) => {
      const tracked = params.requestId ? this.pendingNetworkMap.get(params.requestId) : undefined;
      this.recordFailedNetwork({
        url: tracked?.url || "unknown",
        method: tracked?.method,
        errorText: params.errorText || "Network request failed",
        timestamp: new Date().toISOString(),
      });
      if (params.requestId) {
        this.pendingNetworkMap.delete(params.requestId);
      }
    });
  }

  private recordConsoleLog(entry: ConsoleLogEntry) {
    this.consoleLogs.push(entry);
    if (this.consoleLogs.length > 500) {
      this.consoleLogs.shift();
    }
  }

  private recordFailedNetwork(entry: FailedNetworkEntry) {
    this.failedRequests.push(entry);
    if (this.failedRequests.length > 500) {
      this.failedRequests.shift();
    }
  }

  /**
   * Sends a typed JSON-RPC message over CDP and waits for the correlated reply.
   */
  public send<T = any>(method: string, params: Record<string, unknown> = {}, timeoutMs = 30_000): Promise<T> {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
      return Promise.reject(new Error("CDP WebSocket is not connected"));
    }

    const id = this.messageId++;
    const payload = JSON.stringify({ id, method, params });

    return new Promise<T>((resolve, reject) => {
      const timeout = setTimeout(() => {
        this.pendingRequests.delete(id);
        reject(new Error(`CDP command '${method}' timed out after ${timeoutMs}ms`));
      }, timeoutMs);

      this.pendingRequests.set(id, { resolve, reject, timeout });

      try {
        this.ws!.send(payload, (err) => {
          if (err) {
            clearTimeout(timeout);
            this.pendingRequests.delete(id);
            reject(err);
          }
        });
      } catch (sendErr) {
        clearTimeout(timeout);
        this.pendingRequests.delete(id);
        reject(sendErr instanceof Error ? sendErr : new Error(String(sendErr)));
      }
    });
  }

  /**
   * Registers a callback for an incoming CDP event.
   */
  public on(event: string, callback: (params: any) => void): () => void {
    let set = this.eventListeners.get(event);
    if (!set) {
      set = new Set();
      this.eventListeners.set(event, set);
    }
    set.add(callback);
    return () => set?.delete(callback);
  }

  /**
   * Waits for a specific event once with a timeout.
   */
  public once(event: string, timeoutMs = 15_000): Promise<any> {
    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => {
        cleanup();
        reject(new Error(`Timeout waiting for CDP event '${event}'`));
      }, timeoutMs);

      const cleanup = this.on(event, (params) => {
        clearTimeout(timer);
        cleanup();
        resolve(params);
      });
    });
  }

  private handleIncomingMessage(raw: string) {
    try {
      const msg = JSON.parse(raw);

      // Correlation reply
      if (typeof msg.id === "number") {
        const pending = this.pendingRequests.get(msg.id);
        if (pending) {
          clearTimeout(pending.timeout);
          this.pendingRequests.delete(msg.id);
          if (msg.error) {
            pending.reject(new Error(`CDP error ${msg.error.code}: ${msg.error.message}`));
          } else {
            pending.resolve(msg.result);
          }
        }
        return;
      }

      // Event notification
      if (typeof msg.method === "string") {
        const listeners = this.eventListeners.get(msg.method);
        if (listeners) {
          for (const listener of listeners) {
            try {
              listener(msg.params || {});
            } catch (err) {
              console.error(`Error in CDP listener for ${msg.method}:`, err);
            }
          }
        }
      }
    } catch (err) {
      console.error("Failed to parse CDP frame:", err);
    }
  }

  private cleanupPending(reason: Error) {
    for (const pending of this.pendingRequests.values()) {
      clearTimeout(pending.timeout);
      pending.reject(reason);
    }
    this.pendingRequests.clear();
  }

  /**
   * Closes the WebSocket connection gracefully.
   */
  public close(): void {
    this.isClosing = true;
    if (this.ws) {
      try {
        this.ws.removeAllListeners();
        this.ws.close();
      } catch {}
      this.ws = null;
    }
    this.cleanupPending(new Error("CDP client closed"));
  }

  /* ---------------- High-Level Automation Methods ---------------- */

  public async navigate(url: string, waitUntil: "load" | "domcontentloaded" | "networkidle" = "load"): Promise<{ url: string; title: string }> {
    const loadPromise = waitUntil === "domcontentloaded"
      ? this.once("Page.domContentEventFired", 20_000)
      : this.once("Page.loadEventFired", 20_000);

    await this.send("Page.navigate", { url });
    await loadPromise.catch(() => {}); // continue if event already fired or timed out

    const title = await this.getPageTitle();
    const currentUrl = await this.getCurrentUrl();
    return { url: currentUrl, title };
  }

  public async reload(ignoreCache = false): Promise<boolean> {
    const loadPromise = this.once("Page.loadEventFired", 15_000);
    await this.send("Page.reload", { ignoreCache });
    await loadPromise.catch(() => {});
    return true;
  }

  public async getNavigationHistory(): Promise<{ currentIndex: number; entries: any[] }> {
    const res = await this.send("Page.getNavigationHistory");
    return {
      currentIndex: res.currentIndex || 0,
      entries: res.entries || [],
    };
  }

  public async goBack(): Promise<{ url: string; title: string }> {
    const history = await this.getNavigationHistory();
    if (history.currentIndex > 0) {
      const prevEntry = history.entries[history.currentIndex - 1];
      await this.send("Page.navigateToHistoryEntry", { entryId: prevEntry.id });
      await this.once("Page.loadEventFired", 10_000).catch(() => {});
    }
    return { url: await this.getCurrentUrl(), title: await this.getPageTitle() };
  }

  public async goForward(): Promise<{ url: string; title: string }> {
    const history = await this.getNavigationHistory();
    if (history.currentIndex < history.entries.length - 1) {
      const nextEntry = history.entries[history.currentIndex + 1];
      await this.send("Page.navigateToHistoryEntry", { entryId: nextEntry.id });
      await this.once("Page.loadEventFired", 10_000).catch(() => {});
    }
    return { url: await this.getCurrentUrl(), title: await this.getPageTitle() };
  }

  public async getCurrentUrl(): Promise<string> {
    const res = await this.send("Runtime.evaluate", {
      expression: "window.location.href",
      returnByValue: true,
    });
    return String(res?.result?.value || "");
  }

  public async getPageTitle(): Promise<string> {
    const res = await this.send("Runtime.evaluate", {
      expression: "document.title",
      returnByValue: true,
    });
    return String(res?.result?.value || "");
  }

  public async readVisibleText(selector = "body", maxLength = 50_000): Promise<{ text: string; truncated: boolean; textLength: number }> {
    const expr = `
      (() => {
        const el = document.querySelector(${JSON.stringify(selector)});
        if (!el) return null;
        return el.innerText || el.textContent || "";
      })()
    `;
    const res = await this.send("Runtime.evaluate", { expression: expr, returnByValue: true });
    if (res?.result?.value === null) {
      throw new Error(`Element matching selector '${selector}' not found`);
    }

    const fullText = String(res?.result?.value || "");
    const truncated = fullText.length > maxLength;
    const text = truncated ? fullText.slice(0, maxLength) : fullText;

    return { text, truncated, textLength: fullText.length };
  }

  public async inspectDomElements(selector: string, limit = 10): Promise<any[]> {
    const expr = `
      (() => {
        const nodes = Array.from(document.querySelectorAll(${JSON.stringify(selector)})).slice(0, ${Math.max(1, limit)});
        return nodes.map(n => {
          const rect = n.getBoundingClientRect();
          const attrs = {};
          for (const a of n.attributes) attrs[a.name] = a.value;
          return {
            tagName: n.tagName.toLowerCase(),
            id: n.id || null,
            className: n.className || null,
            attributes: attrs,
            bounds: { x: Math.round(rect.x), y: Math.round(rect.y), width: Math.round(rect.width), height: Math.round(rect.height) },
            textContent: (n.innerText || n.textContent || "").trim().slice(0, 100),
          };
        });
      })()
    `;
    const res = await this.send("Runtime.evaluate", { expression: expr, returnByValue: true });
    return res?.result?.value || [];
  }

  public async findElements(query: string, by: "selector" | "text" | "role" = "selector"): Promise<any[]> {
    const expr = `
      (() => {
        const query = ${JSON.stringify(query)};
        const by = ${JSON.stringify(by)};
        let matches = [];

        if (by === "selector") {
          matches = Array.from(document.querySelectorAll(query));
        } else if (by === "text") {
          const all = Array.from(document.querySelectorAll("button, a, p, span, h1, h2, h3, h4, label, li"));
          matches = all.filter(el => (el.innerText || el.textContent || "").toLowerCase().includes(query.toLowerCase()));
        } else if (by === "role") {
          matches = Array.from(document.querySelectorAll(\`[role="\${query}"], \${query}\`));
        }

        return matches.slice(0, 20).map(n => {
          const rect = n.getBoundingClientRect();
          return {
            tagName: n.tagName.toLowerCase(),
            id: n.id || null,
            className: n.className || null,
            text: (n.innerText || n.textContent || "").trim().slice(0, 80),
            visible: rect.width > 0 && rect.height > 0,
            bounds: { x: Math.round(rect.x), y: Math.round(rect.y), width: Math.round(rect.width), height: Math.round(rect.height) },
          };
        });
      })()
    `;
    const res = await this.send("Runtime.evaluate", { expression: expr, returnByValue: true });
    return res?.result?.value || [];
  }

  public async getPageMetadata(): Promise<Record<string, unknown>> {
    const expr = `
      (() => {
        const meta = {};
        const getMeta = (name) => {
          const el = document.querySelector(\`meta[name="\${name}"], meta[property="\${name}"]\`);
          return el ? el.getAttribute("content") : null;
        };

        const faviconEl = document.querySelector('link[rel~="icon"]');
        const canonicalEl = document.querySelector('link[rel="canonical"]');

        return {
          title: document.title,
          description: getMeta("description") || getMeta("og:description"),
          keywords: getMeta("keywords"),
          canonical: canonicalEl ? canonicalEl.href : null,
          openGraph: {
            title: getMeta("og:title"),
            type: getMeta("og:type"),
            image: getMeta("og:image"),
            url: getMeta("og:url"),
          },
          faviconUrl: faviconEl ? faviconEl.href : null,
        };
      })()
    `;
    const res = await this.send("Runtime.evaluate", { expression: expr, returnByValue: true });
    return res?.result?.value || {};
  }

  public async inspectLinks(limit = 50): Promise<any[]> {
    const expr = `
      (() => {
        const anchors = Array.from(document.querySelectorAll("a[href]")).slice(0, ${Math.max(1, limit)});
        const origin = window.location.origin;
        return anchors.map(a => {
          const href = a.href;
          const isExternal = href.startsWith("http") && !href.startsWith(origin);
          const isDownload = a.hasAttribute("download") || /\\.(zip|pdf|exe|dmg|mp4|png|jpg)$/i.test(href);
          return {
            text: (a.innerText || a.textContent || "").trim(),
            href,
            isExternal,
            isDownload,
          };
        });
      })()
    `;
    const res = await this.send("Runtime.evaluate", { expression: expr, returnByValue: true });
    return res?.result?.value || [];
  }

  public async getScreenshot(options: { format?: "png" | "jpeg"; quality?: number; fullPage?: boolean } = {}): Promise<{ dataBase64: string; format: string }> {
    const format = options.format || "png";
    const params: Record<string, unknown> = {
      format,
      fromSurface: true,
    };
    if (format === "jpeg" && options.quality) {
      params.quality = Math.max(1, Math.min(100, options.quality));
    }
    if (options.fullPage) {
      params.captureBeyondViewport = true;
    }

    const res = await this.send("Page.captureScreenshot", params);
    return {
      dataBase64: res.data,
      format,
    };
  }

  public async clickElement(selector: string, button: "left" | "right" | "middle" = "left", clickCount = 1): Promise<{ x: number; y: number }> {
    // Scroll element into view and get its center coordinates
    const expr = `
      (() => {
        const el = document.querySelector(${JSON.stringify(selector)});
        if (!el) return null;
        el.scrollIntoView({ behavior: "instant", block: "center", inline: "center" });
        const r = el.getBoundingClientRect();
        return { x: r.left + r.width / 2, y: r.top + r.height / 2, found: true };
      })()
    `;
    const res = await this.send("Runtime.evaluate", { expression: expr, returnByValue: true });
    if (!res?.result?.value) {
      throw new Error(`Element to click matching '${selector}' not found`);
    }

    const { x, y } = res.result.value;

    await this.send("Input.dispatchMouseEvent", {
      type: "mousePressed",
      x,
      y,
      button,
      clickCount,
    });

    await this.send("Input.dispatchMouseEvent", {
      type: "mouseReleased",
      x,
      y,
      button,
      clickCount,
    });

    return { x: Math.round(x), y: Math.round(y) };
  }

  public async fillInput(selector: string, value: string, clearFirst = true): Promise<{ length: number }> {
    const expr = `
      (() => {
        const el = document.querySelector(${JSON.stringify(selector)});
        if (!el) return false;
        el.focus();
        if (${clearFirst}) {
          el.value = "";
          el.dispatchEvent(new Event("input", { bubbles: true }));
        }
        return true;
      })()
    `;
    const res = await this.send("Runtime.evaluate", { expression: expr, returnByValue: true });
    if (!res?.result?.value) {
      throw new Error(`Input element matching '${selector}' not found`);
    }

    await this.send("Input.insertText", { text: value });

    // Trigger change event to ensure frameworks like React / Vue pick it up
    await this.send("Runtime.evaluate", {
      expression: `
        (() => {
          const el = document.querySelector(${JSON.stringify(selector)});
          if (el) el.dispatchEvent(new Event("change", { bubbles: true }));
        })()
      `,
    });

    return { length: value.length };
  }

  public async selectOption(selector: string, option: { value?: string; label?: string; index?: number }): Promise<{ selectedValue: string; selectedLabel: string }> {
    const expr = `
      (() => {
        const el = document.querySelector(${JSON.stringify(selector)});
        if (!el || el.tagName.toLowerCase() !== "select") return null;

        const val = ${JSON.stringify(option.value || null)};
        const lbl = ${JSON.stringify(option.label || null)};
        const idx = ${JSON.stringify(option.index ?? null)};

        let targetOption = null;
        for (let i = 0; i < el.options.length; i++) {
          const opt = el.options[i];
          if (idx !== null && i === idx) { targetOption = opt; break; }
          if (val !== null && opt.value === val) { targetOption = opt; break; }
          if (lbl !== null && (opt.text || opt.label) === lbl) { targetOption = opt; break; }
        }

        if (!targetOption) return false;
        el.value = targetOption.value;
        el.dispatchEvent(new Event("change", { bubbles: true }));
        return { selectedValue: targetOption.value, selectedLabel: targetOption.text || targetOption.label };
      })()
    `;
    const res = await this.send("Runtime.evaluate", { expression: expr, returnByValue: true });
    if (res?.result?.value === null) {
      throw new Error(`Select element matching '${selector}' not found`);
    }
    if (res?.result?.value === false) {
      throw new Error(`Option matching ${JSON.stringify(option)} not found in select '${selector}'`);
    }

    return res.result.value;
  }

  public async scrollPage(options: { direction?: "down" | "up" | "toTop" | "toBottom"; deltaY?: number; deltaX?: number }): Promise<{ scrollX: number; scrollY: number }> {
    const dir = options.direction || "down";
    let dY = options.deltaY ?? 400;
    const dX = options.deltaX ?? 0;

    if (dir === "up") dY = -Math.abs(dY);
    else if (dir === "down") dY = Math.abs(dY);

    const expr = `
      (() => {
        const dir = ${JSON.stringify(dir)};
        if (dir === "toTop") window.scrollTo({ top: 0, left: 0, behavior: "instant" });
        else if (dir === "toBottom") window.scrollTo({ top: document.body.scrollHeight, left: 0, behavior: "instant" });
        else window.scrollBy({ top: ${dY}, left: ${dX}, behavior: "instant" });
        return { scrollX: window.scrollX, scrollY: window.scrollY };
      })()
    `;
    const res = await this.send("Runtime.evaluate", { expression: expr, returnByValue: true });
    return res?.result?.value || { scrollX: 0, scrollY: 0 };
  }

  public async waitForElement(selector: string, timeoutMs = 5000, state: "visible" | "attached" = "visible"): Promise<{ found: boolean; elapsedMs: number }> {
    const startTime = Date.now();
    const pollInterval = 100;

    while (Date.now() - startTime < timeoutMs) {
      const expr = `
        (() => {
          const el = document.querySelector(${JSON.stringify(selector)});
          if (!el) return false;
          if (${JSON.stringify(state)} === "attached") return true;
          const rect = el.getBoundingClientRect();
          return rect.width > 0 && rect.height > 0 && window.getComputedStyle(el).visibility !== "hidden";
        })()
      `;
      const res = await this.send("Runtime.evaluate", { expression: expr, returnByValue: true });
      if (res?.result?.value === true) {
        return { found: true, elapsedMs: Date.now() - startTime };
      }
      await new Promise((r) => setTimeout(r, pollInterval));
    }

    throw new Error(`Element matching '${selector}' did not become ${state} within ${timeoutMs}ms`);
  }

  public async uploadLocalFile(selector: string, filePaths: string[]): Promise<{ uploadedCount: number; fileNames: string[] }> {
    // Get document root
    const doc = await this.send("DOM.getDocument");
    const nodeRes = await this.send("DOM.querySelector", {
      nodeId: doc.root.nodeId,
      selector,
    });

    if (!nodeRes.nodeId) {
      throw new Error(`File input element matching '${selector}' not found`);
    }

    await this.send("DOM.setFileInputFiles", {
      nodeId: nodeRes.nodeId,
      files: filePaths,
    });

    const fileNames = filePaths.map((p) => p.split(/[\\/]/).pop() || p);
    return { uploadedCount: filePaths.length, fileNames };
  }

  public async getPerformanceMetrics(): Promise<Record<string, number>> {
    await this.send("Performance.enable").catch(() => {});
    const res = await this.send("Performance.getMetrics");
    const map: Record<string, number> = {};
    if (Array.isArray(res.metrics)) {
      for (const m of res.metrics) {
        map[m.name] = m.value;
      }
    }
    return map;
  }

  public async getAccessibilitySnapshot(maxDepth = 5): Promise<any> {
    await this.send("Accessibility.enable").catch(() => {});
    const res = await this.send("Accessibility.getFullAXTree", { depth: maxDepth });
    return res.nodes || [];
  }

  /* ---------------- Computer Use: Advanced Mouse Actions ---------------- */

  /**
   * Resolves a target (selector string or explicit {x, y} coordinate) to absolute page coordinates.
   */
  public async resolveTargetCoords(target: string | { x: number; y: number }): Promise<{ x: number; y: number }> {
    if (typeof target === "object" && target !== null && "x" in target && "y" in target) {
      return { x: Math.round(target.x), y: Math.round(target.y) };
    }

    const selector = String(target);
    const expr = `
      (() => {
        const el = document.querySelector(${JSON.stringify(selector)});
        if (!el) return null;
        el.scrollIntoView({ behavior: "instant", block: "center", inline: "center" });
        const r = el.getBoundingClientRect();
        return { x: r.left + r.width / 2, y: r.top + r.height / 2 };
      })()
    `;
    const res = await this.send("Runtime.evaluate", { expression: expr, returnByValue: true });
    if (!res?.result?.value) {
      throw new Error(`Target element matching '${selector}' not found`);
    }
    return { x: Math.round(res.result.value.x), y: Math.round(res.result.value.y) };
  }

  public async mouseMove(x: number, y: number, buttons = 0, modifiers = 0): Promise<void> {
    await this.send("Input.dispatchMouseEvent", {
      type: "mouseMoved",
      x,
      y,
      buttons,
      modifiers,
    });
  }

  public async mouseDown(x: number, y: number, button: "left" | "right" | "middle" = "left", clickCount = 1, modifiers = 0): Promise<void> {
    const buttons = button === "right" ? 2 : button === "middle" ? 4 : 1;
    await this.send("Input.dispatchMouseEvent", {
      type: "mousePressed",
      x,
      y,
      button,
      buttons,
      clickCount,
      modifiers,
    });
  }

  public async mouseUp(x: number, y: number, button: "left" | "right" | "middle" = "left", clickCount = 1, modifiers = 0): Promise<void> {
    await this.send("Input.dispatchMouseEvent", {
      type: "mouseReleased",
      x,
      y,
      button,
      buttons: 0,
      clickCount,
      modifiers,
    });
  }

  public async mouseClick(
    target: string | { x: number; y: number },
    button: "left" | "right" | "middle" = "left",
    clickCount = 1,
    modifiers = 0,
  ): Promise<{ x: number; y: number; button: string; clickCount: number }> {
    const { x, y } = await this.resolveTargetCoords(target);
    await this.mouseMove(x, y, 0, modifiers);
    await this.mouseDown(x, y, button, clickCount, modifiers);
    await this.mouseUp(x, y, button, clickCount, modifiers);
    return { x, y, button, clickCount };
  }

  public async doubleClick(target: string | { x: number; y: number }): Promise<{ x: number; y: number }> {
    const { x, y } = await this.resolveTargetCoords(target);
    await this.mouseMove(x, y);
    await this.mouseDown(x, y, "left", 1);
    await this.mouseUp(x, y, "left", 1);
    await this.mouseDown(x, y, "left", 2);
    await this.mouseUp(x, y, "left", 2);

    // Also trigger dblclick DOM event if selector string
    if (typeof target === "string") {
      await this.send("Runtime.evaluate", {
        expression: `
          (() => {
            const el = document.querySelector(${JSON.stringify(target)});
            if (el) el.dispatchEvent(new MouseEvent("dblclick", { bubbles: true, cancelable: true, view: window }));
          })()
        `,
      });
    }

    return { x, y };
  }

  public async rightClick(target: string | { x: number; y: number }): Promise<{ x: number; y: number }> {
    const { x, y } = await this.resolveTargetCoords(target);
    await this.mouseMove(x, y);
    await this.mouseDown(x, y, "right", 1);
    await this.mouseUp(x, y, "right", 1);

    // Also trigger contextmenu DOM event
    if (typeof target === "string") {
      await this.send("Runtime.evaluate", {
        expression: `
          (() => {
            const el = document.querySelector(${JSON.stringify(target)});
            if (el) el.dispatchEvent(new MouseEvent("contextmenu", { bubbles: true, cancelable: true, view: window, button: 2 }));
          })()
        `,
      });
    }

    return { x, y };
  }

  public async hover(target: string | { x: number; y: number }): Promise<{ x: number; y: number }> {
    const { x, y } = await this.resolveTargetCoords(target);
    await this.mouseMove(x, y);

    if (typeof target === "string") {
      await this.send("Runtime.evaluate", {
        expression: `
          (() => {
            const el = document.querySelector(${JSON.stringify(target)});
            if (el) {
              el.dispatchEvent(new MouseEvent("mouseenter", { bubbles: false }));
              el.dispatchEvent(new MouseEvent("mouseover", { bubbles: true }));
            }
          })()
        `,
      });
    }

    return { x, y };
  }

  public async dragAndDrop(
    from: string | { x: number; y: number },
    to: string | { x: number; y: number },
    steps = 5,
  ): Promise<{ from: { x: number; y: number }; to: { x: number; y: number } }> {
    const start = await this.resolveTargetCoords(from);
    const end = await this.resolveTargetCoords(to);

    // 1. Dispatch native mouse events across interpolated steps
    await this.mouseMove(start.x, start.y);
    await this.mouseDown(start.x, start.y, "left", 1);

    const stepCount = Math.max(1, steps);
    for (let i = 1; i <= stepCount; i++) {
      const curX = Math.round(start.x + (end.x - start.x) * (i / stepCount));
      const curY = Math.round(start.y + (end.y - start.y) * (i / stepCount));
      await this.mouseMove(curX, curY, 1);
      await new Promise((r) => setTimeout(r, 20));
    }

    await this.mouseUp(end.x, end.y, "left", 1);

    // 2. Also simulate HTML5 Drag and Drop events if selectors are strings
    if (typeof from === "string" && typeof to === "string") {
      await this.send("Runtime.evaluate", {
        expression: `
          (() => {
            const src = document.querySelector(${JSON.stringify(from)});
            const dst = document.querySelector(${JSON.stringify(to)});
            if (src && dst) {
              const dt = new DataTransfer();
              src.dispatchEvent(new DragEvent("dragstart", { bubbles: true, cancelable: true, dataTransfer: dt }));
              dst.dispatchEvent(new DragEvent("dragenter", { bubbles: true, cancelable: true, dataTransfer: dt }));
              dst.dispatchEvent(new DragEvent("dragover", { bubbles: true, cancelable: true, dataTransfer: dt }));
              dst.dispatchEvent(new DragEvent("drop", { bubbles: true, cancelable: true, dataTransfer: dt }));
              src.dispatchEvent(new DragEvent("dragend", { bubbles: true, cancelable: true, dataTransfer: dt }));
            }
          })()
        `,
      });
    }

    return { from: start, to: end };
  }

  public async scrollElementIntoView(selector: string): Promise<boolean> {
    const expr = `
      (() => {
        const el = document.querySelector(${JSON.stringify(selector)});
        if (!el) return false;
        el.scrollIntoView({ behavior: "instant", block: "center", inline: "center" });
        return true;
      })()
    `;
    const res = await this.send("Runtime.evaluate", { expression: expr, returnByValue: true });
    return Boolean(res?.result?.value);
  }

  /* ---------------- Computer Use: Advanced Keyboard Actions ---------------- */

  private static readonly KEY_DEFINITIONS: Record<string, { key: string; code: string; keyCode: number }> = {
    enter: { key: "Enter", code: "Enter", keyCode: 13 },
    tab: { key: "Tab", code: "Tab", keyCode: 9 },
    escape: { key: "Escape", code: "Escape", keyCode: 27 },
    backspace: { key: "Backspace", code: "Backspace", keyCode: 8 },
    delete: { key: "Delete", code: "Delete", keyCode: 46 },
    arrowup: { key: "ArrowUp", code: "ArrowUp", keyCode: 38 },
    arrowdown: { key: "ArrowDown", code: "ArrowDown", keyCode: 40 },
    arrowleft: { key: "ArrowLeft", code: "ArrowLeft", keyCode: 37 },
    arrowright: { key: "ArrowRight", code: "ArrowRight", keyCode: 39 },
    pageup: { key: "PageUp", code: "PageUp", keyCode: 33 },
    pagedown: { key: "PageDown", code: "PageDown", keyCode: 34 },
    home: { key: "Home", code: "Home", keyCode: 36 },
    end: { key: "End", code: "End", keyCode: 35 },
    space: { key: " ", code: "Space", keyCode: 32 },
    control: { key: "Control", code: "ControlLeft", keyCode: 17 },
    ctrl: { key: "Control", code: "ControlLeft", keyCode: 17 },
    shift: { key: "Shift", code: "ShiftLeft", keyCode: 16 },
    alt: { key: "Alt", code: "AltLeft", keyCode: 18 },
    meta: { key: "Meta", code: "MetaLeft", keyCode: 91 },
    command: { key: "Meta", code: "MetaLeft", keyCode: 91 },
  };

  public async pressKey(key: string, modifiers: string[] = []): Promise<boolean> {
    let modBit = 0;
    for (const m of modifiers) {
      const ml = m.toLowerCase();
      if (ml === "alt") modBit |= 1;
      else if (ml === "ctrl" || ml === "control") modBit |= 2;
      else if (ml === "meta" || ml === "command") modBit |= 4;
      else if (ml === "shift") modBit |= 8;
    }

    const keyLower = key.toLowerCase();
    const def = CDPClient.KEY_DEFINITIONS[keyLower] || {
      key,
      code: key.length === 1 ? `Key${key.toUpperCase()}` : key,
      keyCode: key.length === 1 ? key.toUpperCase().charCodeAt(0) : 0,
    };

    await this.send("Input.dispatchKeyEvent", {
      type: "rawKeyDown",
      key: def.key,
      code: def.code,
      windowsVirtualKeyCode: def.keyCode,
      modifiers: modBit,
    });

    if (key.length === 1 && !modifiers.includes("control") && !modifiers.includes("ctrl")) {
      await this.send("Input.dispatchKeyEvent", {
        type: "char",
        text: key,
        unmodifiedText: key,
        modifiers: modBit,
      });
    }

    await this.send("Input.dispatchKeyEvent", {
      type: "keyUp",
      key: def.key,
      code: def.code,
      windowsVirtualKeyCode: def.keyCode,
      modifiers: modBit,
    });

    return true;
  }

  public async keyCombination(keys: string[]): Promise<boolean> {
    if (!Array.isArray(keys) || keys.length === 0) return false;

    // Handle combinations like ["Control", "a"] or ["Ctrl", "c"]
    const modifiers: string[] = [];
    let mainKey = "";

    for (const k of keys) {
      const kl = k.toLowerCase();
      if (["control", "ctrl", "alt", "shift", "meta", "command"].includes(kl)) {
        modifiers.push(kl);
      } else {
        mainKey = k;
      }
    }

    // Special handler for Select All (Control+A) inside active element
    if (modifiers.some((m) => m === "control" || m === "ctrl") && mainKey.toLowerCase() === "a") {
      await this.send("Runtime.evaluate", {
        expression: `
          (() => {
            const el = document.activeElement;
            if (el && typeof el.select === "function") {
              el.select();
            } else {
              const sel = window.getSelection();
              const range = document.createRange();
              range.selectNodeContents(document.body);
              sel.removeAllRanges();
              sel.addRange(range);
            }
          })()
        `,
      });
    }

    if (mainKey) {
      await this.pressKey(mainKey, modifiers);
    }

    return true;
  }

  public async typeText(
    text: string,
    options: { selector?: string; delayMs?: number; clearFirst?: boolean } = {},
  ): Promise<{ textLength: number }> {
    if (options.selector) {
      const clearFirst = options.clearFirst !== false;
      const expr = `
        (() => {
          const el = document.querySelector(${JSON.stringify(options.selector)});
          if (!el) return false;
          el.focus();
          if (${clearFirst}) {
            if ("value" in el) el.value = "";
            else el.innerText = "";
            el.dispatchEvent(new Event("input", { bubbles: true }));
          }
          return true;
        })()
      `;
      const res = await this.send("Runtime.evaluate", { expression: expr, returnByValue: true });
      if (!res?.result?.value) {
        throw new Error(`Element matching '${options.selector}' not found`);
      }
    }

    if (options.delayMs && options.delayMs > 0) {
      for (const char of text) {
        await this.send("Input.insertText", { text: char });
        await new Promise((r) => setTimeout(r, options.delayMs));
      }
    } else {
      // Direct insertion handles multiline, Arabic RTL, unicode symbols natively
      await this.send("Input.insertText", { text });
    }

    if (options.selector) {
      await this.send("Runtime.evaluate", {
        expression: `
          (() => {
            const el = document.querySelector(${JSON.stringify(options.selector)});
            if (el) {
              el.dispatchEvent(new Event("input", { bubbles: true }));
              el.dispatchEvent(new Event("change", { bubbles: true }));
            }
          })()
        `,
      });
    }

    return { textLength: text.length };
  }

  /* ---------------- Downloads & Tab Management ---------------- */

  public async setDownloadBehavior(downloadPath: string, behavior: "allow" | "deny" | "default" = "allow"): Promise<void> {
    try {
      await this.send("Browser.setDownloadBehavior", {
        behavior,
        downloadPath,
        eventsEnabled: true,
      });
    } catch {
      // Fallback to Page.setDownloadBehavior for older Chromium protocol revisions
      await this.send("Page.setDownloadBehavior", {
        behavior,
        downloadPath,
      }).catch(() => {});
    }
  }

  public async createTarget(url = "about:blank"): Promise<{ targetId: string }> {
    const res = await this.send("Target.createTarget", { url });
    return { targetId: res.targetId };
  }

  public async closeTarget(targetId: string): Promise<boolean> {
    const res = await this.send("Target.closeTarget", { targetId });
    return Boolean(res?.success);
  }

  public async getTargets(): Promise<Array<{ targetId: string; type: string; title: string; url: string; attached: boolean }>> {
    const res = await this.send("Target.getTargets");
    if (!Array.isArray(res?.targetInfos)) return [];
    return res.targetInfos.map((t: any) => ({
      targetId: t.targetId,
      type: t.type,
      title: t.title || "",
      url: t.url || "",
      attached: Boolean(t.attached),
    }));
  }

  public async activateTarget(targetId: string): Promise<boolean> {
    await this.send("Target.activateTarget", { targetId });
    return true;
  }
}
