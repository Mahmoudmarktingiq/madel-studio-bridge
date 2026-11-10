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
export class BrowserSecurityPolicy {
    static ALLOWED_SCHEMES = new Set(["http:", "https:"]);
    static BLOCKED_SCHEMES = new Set([
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
     * Approved workspace directory roots for local file access and uploads
     */
    static APPROVED_WORKSPACE_ROOTS = [
        normalize("D:\\MCP"),
        normalize(process.env.TEMP || "C:\\Windows\\Temp"),
        normalize(process.env.LOCALAPPDATA || "C:\\Users"),
    ];
    /**
     * Validates target navigation URL.
     */
    static validateUrl(inputUrl) {
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
        let parsed;
        try {
            parsed = new URL(trimmed);
        }
        catch {
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
    static validateUploadFiles(filePaths) {
        if (!Array.isArray(filePaths) || filePaths.length === 0) {
            return { valid: false, approvedPaths: [], error: "filePaths must be a non-empty array of file paths." };
        }
        const approvedPaths = [];
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
            if (lowerPath.endsWith(".env") ||
                lowerPath.includes("id_rsa") ||
                lowerPath.endsWith(".pem") ||
                lowerPath.endsWith(".key") ||
                lowerPath.includes("\\.git\\")) {
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
     * Validates that a path resides within approved workspace roots.
     */
    static isPathInApprovedWorkspace(candidatePath) {
        const norm = normalize(candidatePath).toLowerCase();
        for (const root of this.APPROVED_WORKSPACE_ROOTS) {
            const normRoot = normalize(root).toLowerCase();
            if (norm.startsWith(normRoot)) {
                return true;
            }
        }
        return false;
    }
    /**
     * Checks whether a client owns a session.
     */
    static validateSessionOwnership(sessionClientId, currentClientId) {
        // If either is unspecified, allow (standalone/single client mode)
        if (!sessionClientId || !currentClientId)
            return true;
        return sessionClientId === currentClientId;
    }
}
//# sourceMappingURL=browser-security.js.map