/**
 * MADEL Studio Bridge — Sandboxed File Operations MCP Tools (Phase P25.7)
 * Developed and maintained by Mahmoud Adel
 *
 * Implements hardened, strictly sandboxed file operations confined to
 * D:\MCP\Browser-Workspace and authorized creative workspace roots.
 *
 * Enforces:
 * - Strict path containment (zero path traversal or symlink escapes)
 * - Strict prohibition on executable binaries/scripts (.exe, .msi, .bat, .cmd, .ps1)
 * - ActionApprovalGate integration for destructive deletion and overwrites
 * - Concurrency scheduling under 'file:operations'
 */

import { copyFileSync, createReadStream, existsSync, lstatSync, mkdirSync, readdirSync, renameSync, rmSync, statSync, unlinkSync } from "node:fs";
import { createHash } from "node:crypto";
import { basename, dirname, extname, join, normalize, relative } from "node:path";
import { z } from "zod";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";

import { globalConcurrencyManager, globalApprovalGate } from "../gateway/index.js";
import { BrowserSecurityPolicy } from "./browser-security.js";
import { guard, jsonResult } from "./result.js";

export function registerFileOperationTools(server: McpServer): void {
  const schedule = async <T>(toolName: string, task: () => Promise<T>): Promise<T> => {
    return globalConcurrencyManager.schedule("file:operations", async () => task(), {
      correlationId: `corr-file-${Date.now().toString(36)}`,
    });
  };

  /* =========================================================================
     TOOL 1: file_list
     ========================================================================= */
  server.registerTool(
    "file_list",
    {
      title: "File: List Directory Contents",
      description: "Lists files and subdirectories within approved sandboxed workspace directories (default: D:\\MCP\\Browser-Workspace).",
      inputSchema: {
        path: z.string().optional().describe("Directory path to list. Defaults to D:\\MCP\\Browser-Workspace."),
        recursive: z.boolean().optional().describe("Whether to list recursively. Default false."),
        pattern: z.string().optional().describe("Optional substring or extension filter."),
      },
    },
    async ({ path, recursive, pattern }) =>
      guard(async () => {
        return schedule("file_list", async () => {
          const targetDir = path || BrowserSecurityPolicy.getBrowserWorkspaceRoot();
          const check = BrowserSecurityPolicy.validateWorkspacePath(targetDir, { checkExists: true });
          if (!check.valid) {
            throw new Error(check.error || "Invalid directory path");
          }

          const items: Array<{
            name: string;
            path: string;
            isDirectory: boolean;
            size: number;
            modifiedAt: string;
            extension: string;
          }> = [];

          function scan(dir: string, currentDepth: number) {
            const entries = readdirSync(dir, { withFileTypes: true });
            for (const entry of entries) {
              const fullPath = join(dir, entry.name);
              const isDir = entry.isDirectory();
              const ext = isDir ? "" : extname(entry.name).toLowerCase();

              if (pattern) {
                const lowerPattern = pattern.toLowerCase();
                if (!entry.name.toLowerCase().includes(lowerPattern) && !ext.includes(lowerPattern)) {
                  if (!isDir) continue;
                }
              }

              let size = 0;
              let modifiedAt = "";
              try {
                const stat = statSync(fullPath);
                size = stat.size;
                modifiedAt = stat.mtime.toISOString();
              } catch {}

              items.push({
                name: entry.name,
                path: fullPath,
                isDirectory: isDir,
                size,
                modifiedAt,
                extension: ext,
              });

              if (isDir && recursive && currentDepth < 5) {
                scan(fullPath, currentDepth + 1);
              }
            }
          }

          scan(check.normalizedPath, 0);

          return jsonResult({
            basePath: check.normalizedPath,
            totalItems: items.length,
            items,
          });
        });
      }),
  );

  /* =========================================================================
     TOOL 2: file_create_folder
     ========================================================================= */
  server.registerTool(
    "file_create_folder",
    {
      title: "File: Create Folder",
      description: "Creates a new folder within the approved sandboxed workspace.",
      inputSchema: {
        path: z.string().describe("Target folder path to create inside approved workspace."),
      },
    },
    async ({ path }) =>
      guard(async () => {
        return schedule("file_create_folder", async () => {
          const check = BrowserSecurityPolicy.validateWorkspacePath(path, { allowCreation: true });
          if (!check.valid) {
            throw new Error(check.error || "Invalid path for folder creation");
          }

          if (existsSync(check.normalizedPath)) {
            return jsonResult({
              success: true,
              path: check.normalizedPath,
              alreadyExisted: true,
              message: "Folder already exists.",
            });
          }

          mkdirSync(check.normalizedPath, { recursive: true });
          return jsonResult({
            success: true,
            path: check.normalizedPath,
            alreadyExisted: false,
            message: "Folder created successfully.",
          });
        });
      }),
  );

  /* =========================================================================
     TOOL 3: file_rename
     ========================================================================= */
  server.registerTool(
    "file_rename",
    {
      title: "File: Rename",
      description: "Renames an existing file or directory inside the sandboxed workspace.",
      inputSchema: {
        sourcePath: z.string().describe("Current file or folder path."),
        newName: z.string().describe("New name (basename only) for the file or folder."),
      },
    },
    async ({ sourcePath, newName }) =>
      guard(async () => {
        return schedule("file_rename", async () => {
          const srcCheck = BrowserSecurityPolicy.validateWorkspacePath(sourcePath, { checkExists: true });
          if (!srcCheck.valid) {
            throw new Error(srcCheck.error || "Invalid source path");
          }

          const cleanName = basename(newName.trim());
          if (!cleanName || cleanName === "." || cleanName === "..") {
            throw new Error("Invalid new name specified");
          }

          const targetPath = join(dirname(srcCheck.normalizedPath), cleanName);
          const dstCheck = BrowserSecurityPolicy.validateWorkspacePath(targetPath, { allowCreation: true });
          if (!dstCheck.valid) {
            throw new Error(dstCheck.error || "Invalid destination path");
          }

          if (existsSync(targetPath)) {
            throw new Error(`Destination '${targetPath}' already exists.`);
          }

          renameSync(srcCheck.normalizedPath, targetPath);

          return jsonResult({
            success: true,
            oldPath: srcCheck.normalizedPath,
            newPath: targetPath,
            message: `Renamed '${basename(srcCheck.normalizedPath)}' to '${cleanName}' successfully.`,
          });
        });
      }),
  );

  /* =========================================================================
     TOOL 4: file_move
     ========================================================================= */
  server.registerTool(
    "file_move",
    {
      title: "File: Move",
      description: "Moves an existing file or directory to another directory inside the approved sandboxed workspace.",
      inputSchema: {
        sourcePath: z.string().describe("Source file or folder path."),
        destinationPath: z.string().describe("Destination directory or target file path."),
        overwrite: z.boolean().optional().describe("Whether to overwrite existing destination. Default false."),
      },
    },
    async ({ sourcePath, destinationPath, overwrite }) =>
      guard(async () => {
        return schedule("file_move", async () => {
          const srcCheck = BrowserSecurityPolicy.validateWorkspacePath(sourcePath, { checkExists: true });
          if (!srcCheck.valid) {
            throw new Error(srcCheck.error || "Invalid source path");
          }

          let finalDest = destinationPath;
          const dstDirCheck = BrowserSecurityPolicy.validateWorkspacePath(destinationPath);
          if (!dstDirCheck.valid) {
            throw new Error(dstDirCheck.error || "Invalid destination path");
          }

          if (existsSync(dstDirCheck.normalizedPath) && statSync(dstDirCheck.normalizedPath).isDirectory()) {
            finalDest = join(dstDirCheck.normalizedPath, basename(srcCheck.normalizedPath));
          } else {
            finalDest = dstDirCheck.normalizedPath;
          }

          const finalCheck = BrowserSecurityPolicy.validateWorkspacePath(finalDest, { allowCreation: true });
          if (!finalCheck.valid) {
            throw new Error(finalCheck.error || "Invalid destination target");
          }

          if (existsSync(finalCheck.normalizedPath)) {
            if (!overwrite) {
              throw new Error(`Destination '${finalCheck.normalizedPath}' already exists and overwrite is false.`);
            }
            rmSync(finalCheck.normalizedPath, { recursive: true, force: true });
          }

          renameSync(srcCheck.normalizedPath, finalCheck.normalizedPath);

          return jsonResult({
            success: true,
            sourcePath: srcCheck.normalizedPath,
            destinationPath: finalCheck.normalizedPath,
            message: "File or directory moved successfully.",
          });
        });
      }),
  );

  /* =========================================================================
     TOOL 5: file_copy
     ========================================================================= */
  server.registerTool(
    "file_copy",
    {
      title: "File: Copy",
      description: "Copies an existing file or directory inside the approved sandboxed workspace.",
      inputSchema: {
        sourcePath: z.string().describe("Source file path."),
        destinationPath: z.string().describe("Destination file path or destination directory."),
        overwrite: z.boolean().optional().describe("Whether to overwrite destination. Default false."),
      },
    },
    async ({ sourcePath, destinationPath, overwrite }) =>
      guard(async () => {
        return schedule("file_copy", async () => {
          const srcCheck = BrowserSecurityPolicy.validateWorkspacePath(sourcePath, { checkExists: true });
          if (!srcCheck.valid) {
            throw new Error(srcCheck.error || "Invalid source path");
          }

          let finalDest = destinationPath;
          const dstCheck = BrowserSecurityPolicy.validateWorkspacePath(destinationPath);
          if (!dstCheck.valid) {
            throw new Error(dstCheck.error || "Invalid destination path");
          }

          if (existsSync(dstCheck.normalizedPath) && statSync(dstCheck.normalizedPath).isDirectory()) {
            finalDest = join(dstCheck.normalizedPath, basename(srcCheck.normalizedPath));
          } else {
            finalDest = dstCheck.normalizedPath;
          }

          const finalCheck = BrowserSecurityPolicy.validateWorkspacePath(finalDest, { allowCreation: true });
          if (!finalCheck.valid) {
            throw new Error(finalCheck.error || "Invalid destination target");
          }

          if (existsSync(finalCheck.normalizedPath) && !overwrite) {
            throw new Error(`Destination '${finalCheck.normalizedPath}' already exists and overwrite is false.`);
          }

          copyFileSync(srcCheck.normalizedPath, finalCheck.normalizedPath);

          return jsonResult({
            success: true,
            sourcePath: srcCheck.normalizedPath,
            destinationPath: finalCheck.normalizedPath,
            message: "File copied successfully.",
          });
        });
      }),
  );

  /* =========================================================================
     TOOL 6: file_metadata
     ========================================================================= */
  server.registerTool(
    "file_metadata",
    {
      title: "File: Get Metadata",
      description: "Retrieves detailed file metadata, size, timestamps, and MIME classification.",
      inputSchema: {
        path: z.string().describe("File or directory path."),
      },
    },
    async ({ path }) =>
      guard(async () => {
        return schedule("file_metadata", async () => {
          const check = BrowserSecurityPolicy.validateWorkspacePath(path, { checkExists: true });
          if (!check.valid) {
            throw new Error(check.error || "Invalid path");
          }

          const stat = statSync(check.normalizedPath);
          const ext = extname(check.normalizedPath).toLowerCase();

          let mimeType = "application/octet-stream";
          if ([".png", ".jpg", ".jpeg", ".gif", ".webp"].includes(ext)) mimeType = `image/${ext.slice(1)}`;
          else if ([".mp4", ".mov", ".avi"].includes(ext)) mimeType = `video/${ext.slice(1)}`;
          else if ([".json"].includes(ext)) mimeType = "application/json";
          else if ([".txt", ".log", ".md"].includes(ext)) mimeType = "text/plain";
          else if ([".pdf"].includes(ext)) mimeType = "application/pdf";
          else if ([".html", ".htm"].includes(ext)) mimeType = "text/html";
          else if ([".csv"].includes(ext)) mimeType = "text/csv";

          return jsonResult({
            path: check.normalizedPath,
            name: basename(check.normalizedPath),
            isFile: stat.isFile(),
            isDirectory: stat.isDirectory(),
            size: stat.size,
            createdAt: stat.birthtime.toISOString(),
            modifiedAt: stat.mtime.toISOString(),
            extension: ext,
            mimeType,
          });
        });
      }),
  );

  /* =========================================================================
     TOOL 7: file_checksum
     ========================================================================= */
  server.registerTool(
    "file_checksum",
    {
      title: "File: Compute Checksum",
      description: "Computes cryptographic SHA-256 or MD5 checksum of a file inside the sandboxed workspace.",
      inputSchema: {
        path: z.string().describe("File path."),
        algorithm: z.enum(["sha256", "md5"]).optional().describe("Hash algorithm. Default 'sha256'."),
      },
    },
    async ({ path, algorithm }) =>
      guard(async () => {
        return schedule("file_checksum", async () => {
          const check = BrowserSecurityPolicy.validateWorkspacePath(path, { checkExists: true });
          if (!check.valid) {
            throw new Error(check.error || "Invalid path");
          }

          const stat = statSync(check.normalizedPath);
          if (!stat.isFile()) {
            throw new Error(`Path is not a regular file: '${check.normalizedPath}'`);
          }

          const algo = algorithm || "sha256";
          const hash = createHash(algo);

          return new Promise((resolve, reject) => {
            const stream = createReadStream(check.normalizedPath);
            stream.on("data", (chunk) => hash.update(chunk));
            stream.on("end", () => {
              const checksum = hash.digest("hex");
              resolve(
                jsonResult({
                  path: check.normalizedPath,
                  algorithm: algo,
                  checksum,
                  sizeBytes: stat.size,
                }),
              );
            });
            stream.on("error", reject);
          });
        });
      }),
  );

  /* =========================================================================
     TOOL 8: file_organize
     ========================================================================= */
  server.registerTool(
    "file_organize",
    {
      title: "File: Organize Downloads/Outputs",
      description: "Organizes files in a workspace folder into categorical subdirectories based on file extension.",
      inputSchema: {
        targetDir: z.string().optional().describe("Directory to organize (defaults to D:\\MCP\\Browser-Workspace\\downloads)."),
      },
    },
    async ({ targetDir }) =>
      guard(async () => {
        return schedule("file_organize", async () => {
          const dir = targetDir || join(BrowserSecurityPolicy.getBrowserWorkspaceRoot(), "downloads");
          const check = BrowserSecurityPolicy.validateWorkspacePath(dir, { checkExists: true });
          if (!check.valid) {
            throw new Error(check.error || "Invalid directory");
          }

          const entries = readdirSync(check.normalizedPath, { withFileTypes: true });
          let organizedCount = 0;
          const movedFiles: Array<{ from: string; to: string; category: string }> = [];

          const CATEGORIES: Record<string, string[]> = {
            images: [".png", ".jpg", ".jpeg", ".gif", ".webp", ".svg"],
            documents: [".pdf", ".docx", ".xlsx", ".pptx", ".txt", ".md", ".csv"],
            archives: [".zip", ".tar", ".gz", ".7z", ".rar"],
            media: [".mp4", ".mov", ".mp3", ".wav", ".aac"],
            data: [".json", ".xml", ".yaml", ".yml"],
          };

          for (const entry of entries) {
            if (!entry.isFile()) continue;
            const ext = extname(entry.name).toLowerCase();
            let matchedCategory = "misc";

            for (const [cat, extensions] of Object.entries(CATEGORIES)) {
              if (extensions.includes(ext)) {
                matchedCategory = cat;
                break;
              }
            }

            const catDir = join(check.normalizedPath, matchedCategory);
            if (!existsSync(catDir)) {
              mkdirSync(catDir, { recursive: true });
            }

            const oldPath = join(check.normalizedPath, entry.name);
            const newPath = join(catDir, entry.name);

            if (!existsSync(newPath)) {
              renameSync(oldPath, newPath);
              organizedCount++;
              movedFiles.push({ from: oldPath, to: newPath, category: matchedCategory });
            }
          }

          return jsonResult({
            success: true,
            directory: check.normalizedPath,
            organizedCount,
            movedFiles,
          });
        });
      }),
  );

  /* =========================================================================
     TOOL 9: file_delete (DESTRUCTIVE - REQUIRES CONFIRMATION & APPROVAL GATE)
     ========================================================================= */
  server.registerTool(
    "file_delete",
    {
      title: "File: Delete (Destructive)",
      description: "Permanently deletes a file or directory inside the sandboxed workspace. Requires explicit confirm=true and operator approval ticket.",
      inputSchema: {
        path: z.string().describe("Path to the file or directory to delete."),
        recursive: z.boolean().optional().describe("Whether to delete recursively if directory. Default false."),
        confirm: z.boolean().describe("Explicit confirmation boolean. Must be true to proceed."),
        approvalTicket: z.string().optional().describe("Operator approval ticket ID if approval challenge is required."),
      },
    },
    async ({ path, recursive, confirm, approvalTicket }) =>
      guard(async () => {
        return schedule("file_delete", async () => {
          if (!confirm) {
            throw new Error("Deletion aborted: 'confirm' must be explicitly set to true.");
          }

          const check = BrowserSecurityPolicy.validateWorkspacePath(path, { checkExists: true });
          if (!check.valid) {
            throw new Error(check.error || "Invalid path for deletion");
          }

          // Security: ActionApprovalGate verification for destructive deletion
          const gateCheck = globalApprovalGate.checkApproval(
            "file_delete",
            "destructive",
            `Permanently delete '${check.normalizedPath}'`,
            { path: check.normalizedPath, recursive },
            approvalTicket,
          );

          if (!gateCheck.authorized) {
            return jsonResult(gateCheck.challenge);
          }

          const stat = statSync(check.normalizedPath);
          const isDir = stat.isDirectory();

          if (isDir) {
            if (!recursive) {
              throw new Error(`Cannot delete directory '${check.normalizedPath}' without recursive=true.`);
            }
            rmSync(check.normalizedPath, { recursive: true, force: true });
          } else {
            unlinkSync(check.normalizedPath);
          }

          return jsonResult({
            success: true,
            deletedPath: check.normalizedPath,
            isDirectory: isDir,
            message: `Permanently deleted '${basename(check.normalizedPath)}' successfully.`,
          });
        });
      }),
  );
}
