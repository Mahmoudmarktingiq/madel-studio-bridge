/**
 * MADEL Studio Bridge — Persistent Windows COM Runner for Microsoft Office
 * Developed and maintained by Mahmoud Adel
 *
 * Implements high-performance, silent, persistent Windows COM automation workers
 * for Word, Excel, and PowerPoint. Communicates via base64 UTF-8 JSON over standard
 * streams, enforcing strict timeouts, error recovery, and clean resource disposal.
 */
import { spawn } from "node:child_process";
import { createInterface } from "node:readline";
export class OfficeComWorker {
    appId;
    progId;
    defaultTimeoutMs;
    child = null;
    pending = null;
    isStarting = false;
    startPromise = null;
    constructor(appId, progId, defaultTimeoutMs = 30_000) {
        this.appId = appId;
        this.progId = progId;
        this.defaultTimeoutMs = defaultTimeoutMs;
    }
    isAlive() {
        return Boolean(this.child && this.child.exitCode === null && !this.child.killed);
    }
    async start() {
        if (this.isAlive())
            return;
        if (this.startPromise)
            return this.startPromise;
        this.startPromise = new Promise((resolve, reject) => {
            this.isStarting = true;
            // Script binds COM object, handles UTF-8 lines, and dispatches base64 scripts
            const psScript = `
$ErrorActionPreference = 'Stop'
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8

try {
  $app = [System.Runtime.InteropServices.Marshal]::GetActiveObject('${this.progId}')
} catch {
  $app = New-Object -ComObject ${this.progId}
}
try { $app.Visible = $false } catch {}
[Console]::Out.WriteLine('READY:COM_OK')

while ($line = [Console]::In.ReadLine()) {
  if ($line -eq 'QUIT') {
    break
  }
  try {
    $bytes = [System.Convert]::FromBase64String($line)
    $script = [System.Text.Encoding]::UTF8.GetString($bytes)
    $result = Invoke-Command -ScriptBlock ([ScriptBlock]::Create($script))
    $json = ConvertTo-Json -InputObject $result -Compress -Depth 10
    if (-not $json) { $json = '{}' }
    $respBytes = [System.Text.Encoding]::UTF8.GetBytes($json)
    $b64 = [System.Convert]::ToBase64String($respBytes)
    [Console]::Out.WriteLine("ACK:OK:$b64")
  } catch {
    $errMsg = $_.Exception.Message
    $errBytes = [System.Text.Encoding]::UTF8.GetBytes($errMsg)
    $b64Err = [System.Convert]::ToBase64String($errBytes)
    [Console]::Out.WriteLine("ACK:ERR:$b64Err")
  }
}

try {
  $app.Quit()
  [System.Runtime.InteropServices.Marshal]::ReleaseComObject($app) | Out-Null
} catch {}
[Console]::Out.WriteLine('EXIT:OK')
`;
            let startupTimeout = setTimeout(() => {
                this.reset();
                reject(new Error(`Timed out waiting for ${this.progId} COM worker startup (25s)`));
            }, 25_000);
            try {
                const child = spawn("powershell.exe", ["-NoProfile", "-NonInteractive", "-ExecutionPolicy", "Bypass", "-Command", psScript], {
                    stdio: ["pipe", "pipe", "pipe"],
                    windowsHide: true,
                });
                this.child = child;
                const rl = createInterface({ input: child.stdout });
                rl.on("line", (line) => {
                    const trimmed = line.trim();
                    if (trimmed === "READY:COM_OK") {
                        if (startupTimeout) {
                            clearTimeout(startupTimeout);
                            startupTimeout = null;
                        }
                        this.isStarting = false;
                        resolve();
                    }
                    else if (trimmed.startsWith("ACK:OK:") && this.pending) {
                        const b64 = trimmed.slice(7);
                        const json = Buffer.from(b64, "base64").toString("utf8");
                        let data = {};
                        try {
                            data = JSON.parse(json);
                        }
                        catch {
                            data = { raw: json };
                        }
                        const cb = this.pending;
                        this.pending = null;
                        clearTimeout(cb.timer);
                        cb.resolve(data);
                    }
                    else if (trimmed.startsWith("ACK:ERR:") && this.pending) {
                        const b64 = trimmed.slice(8);
                        const msg = Buffer.from(b64, "base64").toString("utf8");
                        const cb = this.pending;
                        this.pending = null;
                        clearTimeout(cb.timer);
                        cb.reject(new Error(msg));
                    }
                });
                child.on("error", (err) => {
                    if (startupTimeout) {
                        clearTimeout(startupTimeout);
                        startupTimeout = null;
                    }
                    this.reset();
                    reject(err);
                });
                child.on("close", (code) => {
                    if (startupTimeout) {
                        clearTimeout(startupTimeout);
                        startupTimeout = null;
                    }
                    if (this.pending) {
                        const cb = this.pending;
                        this.pending = null;
                        clearTimeout(cb.timer);
                        cb.reject(new Error(`COM worker exited with code ${code}`));
                    }
                    this.reset();
                });
            }
            catch (err) {
                if (startupTimeout) {
                    clearTimeout(startupTimeout);
                }
                this.reset();
                reject(err);
            }
        });
        return this.startPromise;
    }
    async execute(script, timeoutMs) {
        const t0 = Date.now();
        const effectiveTimeout = timeoutMs || this.defaultTimeoutMs;
        try {
            await this.start();
        }
        catch (err) {
            return {
                success: false,
                error: `Failed to start ${this.progId} COM worker: ${err.message}`,
                executionMs: Date.now() - t0,
            };
        }
        if (!this.child || !this.child.stdin || !this.isAlive()) {
            return {
                success: false,
                error: `COM worker for ${this.progId} is not alive`,
                executionMs: Date.now() - t0,
            };
        }
        if (this.pending) {
            return {
                success: false,
                error: `COM worker for ${this.progId} has another call in-flight`,
                executionMs: Date.now() - t0,
            };
        }
        const b64 = Buffer.from(script, "utf8").toString("base64");
        return new Promise((resolve) => {
            const timer = setTimeout(() => {
                if (this.pending) {
                    this.pending = null;
                    this.reset(); // kill and reset on timeout
                    resolve({
                        success: false,
                        error: `Execution on ${this.progId} timed out after ${effectiveTimeout} ms`,
                        executionMs: Date.now() - t0,
                    });
                }
            }, effectiveTimeout);
            this.pending = {
                resolve: (data) => {
                    resolve({
                        success: true,
                        data,
                        executionMs: Date.now() - t0,
                    });
                },
                reject: (err) => {
                    resolve({
                        success: false,
                        error: err.message,
                        executionMs: Date.now() - t0,
                    });
                },
                timer,
            };
            try {
                this.child.stdin.write(b64 + "\n");
            }
            catch (err) {
                clearTimeout(timer);
                this.pending = null;
                resolve({
                    success: false,
                    error: `Failed to write command to worker: ${err.message}`,
                    executionMs: Date.now() - t0,
                });
            }
        });
    }
    async stop() {
        if (this.child) {
            try {
                this.child.stdin?.write("QUIT\n");
            }
            catch { }
            setTimeout(() => {
                this.reset();
            }, 500);
        }
    }
    reset() {
        if (this.child) {
            try {
                this.child.kill();
            }
            catch { }
            this.child = null;
        }
        this.startPromise = null;
        this.isStarting = false;
    }
}
export class OfficeComPool {
    static workers = new Map();
    static getWorker(appId) {
        let worker = this.workers.get(appId);
        if (!worker) {
            let progId;
            switch (appId) {
                case "word":
                    progId = "Word.Application";
                    break;
                case "excel":
                    progId = "Excel.Application";
                    break;
                case "powerpoint":
                    progId = "PowerPoint.Application";
                    break;
            }
            worker = new OfficeComWorker(appId, progId);
            this.workers.set(appId, worker);
        }
        return worker;
    }
    static async closeAll() {
        const promises = [];
        for (const worker of this.workers.values()) {
            promises.push(worker.stop());
        }
        await Promise.all(promises);
        this.workers.clear();
    }
    static async stopAll() {
        return this.closeAll();
    }
}
//# sourceMappingURL=com-runner.js.map