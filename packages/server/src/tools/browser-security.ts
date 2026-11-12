/**
 * MADEL Studio Bridge — Browser Security & Guardrails
 * Developed and maintained by Mahmoud Adel
 *
 * Implements strict security validations for browser automation:
 * - URL scheme allowlist (http, https, approved local files)
 * - Blocking unsafe schemes (javascript:, chrome:, edge:, data:text/html)
 * - Safe file upload path verification
 * - Client session isolation and ownership validation
 */

import { existsSync, statSync } from "node:fs";
import { isAbsolute, normalize, resolve } from "node:path";

export interface SecurityValidationResult {
  valid: boolean;
  sanitizedValue?: string;
  error?: string;
}

export class BrowserSecurityPolicy {
  private static readonly ALLOWED_SCHEMES = new Set(["http:", "https:"]);
  private static readonly BLOCKED_SCHEMES = new Set([
    "javascript:",
    "vbscript:",
    "data:",
    "chrome:",
    "chrome-extension:",
    "edge:",
    "brave:",
    "devtools:",
    "view-source:",
  ]);

  /**
   * Approved workspace directory roots for local file access and uploads.
   * Restricted strictly to designated creative workspace brand folders and isolated temp fixtures.
   * Source repositories, system directories, and root instruction files are strictly prohibited.
   */
  private static readonly APPROVED_WORKSPACE_ROOTS = [
    normalize("D:\\MCP\\Browser-Workspace"),
    normalize("D:\\MCP\\11-Other-Apps\\Browser\\MADEL"),
    normalize("D:\\MCP\\07-AfterEffects\\MADEL"),
    normalize("D:\\MCP\\05-Premiere\\MADEL"),
    normalize("D:\\MCP\\04-Photoshop\\MADEL"),
    normalize("D:\\MCP\\06-Illustrator\\MADEL"),
    normalize("D:\\MCP\\02-Blender\\MADEL"),
    normalize("D:\\MCP\\03-CapCut\\MADEL"),
    normalize(process.env.TEMP || "C:\\Windows\\Temp"),
  ];

  public static readonly FORBIDDEN_EXTENSIONS = new Set([
    ".exe",
    ".msi",
    ".bat",
    ".cmd",
    ".ps1",
    ".vbs",
    ".vbe",
    ".js",
    ".jse",
    ".wsf",
    ".wsh",
    ".com",
    ".scr",
    ".pif",
  ]);

  private static readonly FORBIDDEN_SUBSTRINGS = [
    "\\01-projects\\source\\",
    "\\.git\\",
    "\\node_modules\\",
    "\\appdata\\roaming\\",
    "\\windows\\system32\\",
  ];

  private static readonly BLOCKED_EXACT_FILES = new Set([
    normalize("D:\\MCP\\AGENTS.md").toLowerCase(),
    normalize("D:\\MCP\\CLAUDE.md").toLowerCase(),
    normalize("D:\\MCP\\CODEX.md").toLowerCase(),
    normalize("D:\\MCP\\GEMINI.md").toLowerCase(),
  ]);

  /**
   * Validates target navigation URL.
   */
  public static validateUrl(inputUrl: string): SecurityValidationResult {
    if (!inputUrl || typeof inputUrl !== "string") {
      return { valid: false, error: "URL must be a non-empty string" };
    }

    const trimmed = inputUrl.trim();

    // Check for about:blank special case
    if (trimmed === "about:blank") {
      return { valid: true, sanitizedValue: trimmed };
    }

    // Check for blocked schemes explicitly
    const lower = trimmed.toLowerCase();
    for (const blocked of this.BLOCKED_SCHEMES) {
      if (lower.startsWith(blocked)) {
        return { valid: false, error: `Blocked unsafe URL scheme: ${blocked}` };
      }
    }

    let parsed: URL;
    try {
      parsed = new URL(trimmed);
    } catch {
      return { valid: false, error: `Malformed URL: ${trimmed}` };
    }

    // Allow standard HTTP/HTTPS
    if (this.ALLOWED_SCHEMES.has(parsed.protocol)) {
      return { valid: true, sanitizedValue: parsed.toString() };
    }

    // Handle file: scheme with strict path verification
    if (parsed.protocol === "file:") {
      const pathname = decodeURIComponent(parsed.pathname);
      // On Windows, file:///D:/path yields /D:/path -> strip leading slash
      const localPath = normalize(pathname.startsWith("/") && pathname[2] === ":" ? pathname.slice(1) : pathname);

      const isAllowed = this.isPathInApprovedWorkspace(localPath);
      if (!isAllowed) {
        return {
          valid: false,
          error: `Access to local file path rejected. Path '${localPath}' is outside authorized workspace boundaries.`,
        };
      }

      if (!existsSync(localPath)) {
        return { valid: false, error: `Referenced local file does not exist: '${localPath}'` };
      }

      return { valid: true, sanitizedValue: `file:///${localPath.replace(/\\/g, "/")}` };
    }

    return {
      valid: false,
      error: `Unsupported or disallowed protocol '${parsed.protocol}'. Only http, https, and approved file URLs are permitted.`,
    };
  }

  /**
   * Validates local files before setting them into file input elements.
   */
  public static validateUploadFiles(filePaths: string[]): { valid: boolean; approvedPaths: string[]; error?: string } {
    if (!Array.isArray(filePaths) || filePaths.length === 0) {
      return { valid: false, approvedPaths: [], error: "filePaths must be a non-empty array of file paths." };
    }

    const approvedPaths: string[] = [];

    for (const rawPath of filePaths) {
      if (!rawPath || typeof rawPath !== "string") {
        return { valid: false, approvedPaths: [], error: "All file paths must be valid strings." };
      }

      const fullPath = isAbsolute(rawPath) ? normalize(rawPath) : resolve(process.cwd(), rawPath);

      if (!existsSync(fullPath)) {
        return { valid: false, approvedPaths: [], error: `File not found: '${fullPath}'` };
      }

      const stat = statSync(fullPath);
      if (!stat.isFile()) {
        return { valid: false, approvedPaths: [], error: `Path is not a regular file: '${fullPath}'` };
      }

      if (!this.isPathInApprovedWorkspace(fullPath)) {
        return {
          valid: false,
          approvedPaths: [],
          error: `File '${fullPath}' is outside authorized workspace directories.`,
        };
      }

      // Check for sensitive files (.env, private keys, etc.)
      const lowerPath = fullPath.toLowerCase();
      if (
        lowerPath.endsWith(".env") ||
        lowerPath.includes("id_rsa") ||
        lowerPath.endsWith(".pem") ||
        lowerPath.endsWith(".key") ||
        lowerPath.includes("\\.git\\")
      ) {
        return {
          valid: false,
          approvedPaths: [],
          error: `Refusing to upload sensitive configuration or credential file: '${fullPath}'`,
        };
      }

      approvedPaths.push(fullPath);
    }

    return { valid: true, approvedPaths };
  }

  /**
   * Validates that a path resides within approved workspace roots and contains no forbidden substrings.
   */
  public static isPathInApprovedWorkspace(candidatePath: string): boolean {
    const norm = normalize(candidatePath).toLowerCase();

    // Check exact blocked root files
    if (this.BLOCKED_EXACT_FILES.has(norm)) {
      return false;
    }

    // Check forbidden substrings (e.g. source repos, .git, node_modules)
    for (const forbidden of this.FORBIDDEN_SUBSTRINGS) {
      if (norm.includes(forbidden)) {
        return false;
      }
    }

    // Must start with one of the approved workspace roots
    for (const root of this.APPROVED_WORKSPACE_ROOTS) {
      const normRoot = normalize(root).toLowerCase();
      if (norm.startsWith(normRoot)) {
        return true;
      }
    }
    return false;
  }

  /**
   * Returns default root for Browser Workspace.
   */
  public static getBrowserWorkspaceRoot(): string {
    return normalize("D:\\MCP\\Browser-Workspace");
  }

  /**
   * Validates a candidate path for sandboxed file operations.
   */
  public static validateWorkspacePath(
    candidatePath: string,
    options: { checkExists?: boolean; allowCreation?: boolean; disallowExecutables?: boolean } = {},
  ): { valid: boolean; normalizedPath: string; error?: string } {
    if (!candidatePath || typeof candidatePath !== "string") {
      return { valid: false, normalizedPath: "", error: "Path must be a non-empty string" };
    }

    const trimmed = candidatePath.trim();
    // Prevent obvious path traversal tokens
    if (trimmed.includes("..\\..\\..") || trimmed.includes("../../../")) {
      return { valid: false, normalizedPath: "", error: "Illegal path traversal attempt detected." };
    }

    const normalizedPath = isAbsolute(trimmed)
      ? normalize(trimmed)
      : normalize(resolve(this.getBrowserWorkspaceRoot(), trimmed));

    if (!this.isPathInApprovedWorkspace(normalizedPath)) {
      return {
        valid: false,
        normalizedPath,
        error: `Access denied: Path '${normalizedPath}' is outside approved workspace boundaries.`,
      };
    }

    // Check executable ban if requested (default: true)
    if (options.disallowExecutables !== false) {
      const lower = normalizedPath.toLowerCase();
      for (const ext of this.FORBIDDEN_EXTENSIONS) {
        if (lower.endsWith(ext)) {
          return {
            valid: false,
            normalizedPath,
            error: `Operation blocked: Execution or creation of dangerous executable type '${ext}' is strictly prohibited.`,
          };
        }
      }
    }

    if (options.checkExists && !existsSync(normalizedPath)) {
      return {
        valid: false,
        normalizedPath,
        error: `File or directory not found: '${normalizedPath}'`,
      };
    }

    return { valid: true, normalizedPath };
  }

  /**
   * Sanitizes or redacts sensitive values such as passwords or secrets from logs.
   */
  public static redactSensitiveValue(val: string, isPassword = false): string {
    if (!val) return val;
    if (isPassword) {
      return "****** [REDACTED_PASSWORD] ******";
    }
    return val;
  }

  /**
   * Checks whether a client owns a session.
   */
  public static validateSessionOwnership(sessionClientId: string | undefined, currentClientId: string | undefined): boolean {
    // If either is unspecified, allow (standalone/single client mode)
    if (!sessionClientId || !currentClientId) return true;
    return sessionClientId === currentClientId;
  }
}
