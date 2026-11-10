/**
 * MADEL Studio Bridge — aerender.exe Command Runner
 * Developed and maintained by Mahmoud Adel
 *
 * Provides safe, non-blocking execution of Adobe After Effects headless render engine.
 * Hardened against command injection: passes arguments strictly as argv arrays without shell concatenation.
 */

import { spawn } from "node:child_process";
import { existsSync, statSync } from "node:fs";
import { normalize } from "node:path";

export class AerenderRunner {
  static STANDARD_AERENDER_PATHS = [
    "C:\\Program Files\\Adobe\\Adobe After Effects 2026\\Support Files\\aerender.exe",
    "C:\\Program Files\\Adobe\\Adobe After Effects 2025\\Support Files\\aerender.exe",
    "C:\\Program Files\\Adobe\\Adobe After Effects 2024\\Support Files\\aerender.exe",
  ];

  /**
   * Discovers installed aerender.exe executable.
   * @param {string} [customPath]
   * @returns {string | null}
   */
  static findAerenderExecutable(customPath) {
    if (customPath && existsSync(customPath)) {
      return normalize(customPath);
    }
    for (const candidate of this.STANDARD_AERENDER_PATHS) {
      if (existsSync(candidate)) {
        return normalize(candidate);
      }
    }
    return null;
  }

  /**
   * Executes a headless composition render with strict safety validations.
   * @param {Object} options
   * @param {string} [options.aerenderPath]
   * @param {string} options.projectPath
   * @param {string} options.compName
   * @param {string} options.outputPath
   * @param {string} [options.outputModule]
   * @param {number} [options.startFrame]
   * @param {number} [options.endFrame]
   * @param {boolean} options.approved
   * @param {number} [options.timeoutMs]
   * @returns {Promise<{success: boolean, outputPath: string, durationSeconds?: number, fileSizeBytes?: number, exitCode?: number, error?: string}>}
   */
  static async executeRender(options) {
    if (!options.approved) {
      throw new Error("Render execution rejected: Explicit approved: true is required to start a render queue job.");
    }

    if (!options.projectPath || !existsSync(options.projectPath)) {
      throw new Error(`Project file does not exist: '${options.projectPath}'`);
    }

    const exe = this.findAerenderExecutable(options.aerenderPath);
    if (!exe) {
      throw new Error("aerender.exe executable was not found on this system.");
    }

    const normOutput = normalize(options.outputPath);
    const args = ["-project", options.projectPath, "-comp", options.compName, "-output", normOutput];

    if (options.outputModule) {
      args.push("-OMtemplate", options.outputModule);
    }
    if (typeof options.startFrame === "number") {
      args.push("-s", String(options.startFrame));
    }
    if (typeof options.endFrame === "number") {
      args.push("-e", String(options.endFrame));
    }

    const startTime = Date.now();

    return new Promise((resolve, reject) => {
      const child = spawn(exe, args, {
        windowsHide: true,
        stdio: ["ignore", "pipe", "pipe"],
      });

      let stdout = "";
      let stderr = "";

      child.stdout?.on("data", (d) => (stdout += d.toString()));
      child.stderr?.on("data", (d) => (stderr += d.toString()));

      const timeoutTimer = setTimeout(() => {
        try { child.kill("SIGTERM"); } catch {}
        reject(new Error(`aerender timed out after ${options.timeoutMs || 300_000}ms`));
      }, options.timeoutMs || 300_000);

      child.on("close", (code) => {
        clearTimeout(timeoutTimer);
        const durationSeconds = Math.round((Date.now() - startTime) / 1000);

        if (code === 0 && existsSync(normOutput)) {
          const stat = statSync(normOutput);
          resolve({
            success: true,
            outputPath: normOutput,
            durationSeconds,
            fileSizeBytes: stat.size,
            exitCode: code,
          });
        } else {
          resolve({
            success: false,
            outputPath: normOutput,
            exitCode: code || 1,
            error: stderr || stdout || `aerender exited with code ${code}`,
          });
        }
      });

      child.on("error", (err) => {
        clearTimeout(timeoutTimer);
        reject(err);
      });
    });
  }
}
