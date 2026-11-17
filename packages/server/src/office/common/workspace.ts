/**
 * MADEL Studio Bridge — Microsoft Office Workspace Manager
 * Developed and maintained by Mahmoud Adel
 *
 * Enforces dedicated workspace folders on drive D:
 * D:\MCP\Office-Workspace\Word
 * D:\MCP\Office-Workspace\Excel
 * D:\MCP\Office-Workspace\PowerPoint
 * D:\MCP\Office-Workspace\Exports
 * D:\MCP\Office-Workspace\Reports
 */

import { existsSync, mkdirSync } from "node:fs";
import { isAbsolute, join, normalize, resolve } from "node:path";
import type { OfficeWorkspaceConfig } from "./types.js";

export class OfficeWorkspaceManager {
  private static readonly DEFAULT_ROOT = "D:\\MCP\\Office-Workspace";

  public static getWorkspaceConfig(): OfficeWorkspaceConfig {
    const root = process.env.MADEL_OFFICE_WORKSPACE_ROOT
      ? resolve(process.env.MADEL_OFFICE_WORKSPACE_ROOT)
      : this.DEFAULT_ROOT;

    return {
      root,
      wordDir: join(root, "Word"),
      excelDir: join(root, "Excel"),
      powerPointDir: join(root, "PowerPoint"),
      exportsDir: join(root, "Exports"),
      reportsDir: join(root, "Reports"),
    };
  }

  public static ensureWorkspace(): OfficeWorkspaceConfig {
    const cfg = this.getWorkspaceConfig();
    const dirs = [cfg.root, cfg.wordDir, cfg.excelDir, cfg.powerPointDir, cfg.exportsDir, cfg.reportsDir];

    for (const dir of dirs) {
      if (!existsSync(dir)) {
        try {
          mkdirSync(dir, { recursive: true });
        } catch {
          // If D: is not available (e.g. CI / testing on single drive), fallback to local path
        }
      }
    }
    return cfg;
  }

  public static resolveWorkspacePath(app: "word" | "excel" | "powerpoint" | "exports" | "reports", filename: string): string {
    const cfg = this.ensureWorkspace();
    let baseDir: string;
    switch (app) {
      case "word":
        baseDir = cfg.wordDir;
        break;
      case "excel":
        baseDir = cfg.excelDir;
        break;
      case "powerpoint":
        baseDir = cfg.powerPointDir;
        break;
      case "exports":
        baseDir = cfg.exportsDir;
        break;
      case "reports":
        baseDir = cfg.reportsDir;
        break;
    }

    if (isAbsolute(filename)) {
      return normalize(filename);
    }
    return join(baseDir, filename);
  }
}
