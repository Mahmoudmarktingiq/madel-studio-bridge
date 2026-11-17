/**
 * MADEL Studio Bridge — Microsoft Office Security Policy & Validation
 * Developed and maintained by Mahmoud Adel
 *
 * Implements strict path validation, sandbox containment, and macro/executable protections.
 */
import { extname, isAbsolute, normalize, resolve } from "node:path";
import { OfficeWorkspaceManager } from "./workspace.js";
export class OfficeSecurityPolicy {
    static PROHIBITED_EXTENSIONS = new Set([
        ".exe",
        ".msi",
        ".bat",
        ".cmd",
        ".ps1",
        ".vbs",
        ".js",
        ".wsf",
        ".com",
        ".scr",
        ".pif",
        ".hta",
        ".cpl",
        ".msc",
        ".jar",
        ".reg",
    ]);
    static MACRO_ENABLED_EXTENSIONS = new Set([
        ".docm",
        ".dotm",
        ".xlsm",
        ".xltm",
        ".xlam",
        ".pptm",
        ".potm",
        ".ppam",
        ".ppsm",
    ]);
    static validatePath(inputPath, options = {}) {
        if (!inputPath || typeof inputPath !== "string") {
            return { valid: false, normalizedPath: "", error: "File path must be a non-empty string." };
        }
        if (inputPath.includes("\0")) {
            return { valid: false, normalizedPath: "", error: "Null byte injection detected in path." };
        }
        const normalized = normalize(resolve(inputPath));
        const ext = extname(normalized).toLowerCase();
        if (this.PROHIBITED_EXTENSIONS.has(ext)) {
            return { valid: false, normalizedPath: normalized, error: `Execution of unsafe file extension '${ext}' is strictly prohibited.` };
        }
        if (this.MACRO_ENABLED_EXTENSIONS.has(ext)) {
            return { valid: false, normalizedPath: normalized, error: `Macro-enabled Office documents ('${ext}') are blocked by security policy.` };
        }
        // Path traversal check
        if (inputPath.includes("..")) {
            return { valid: false, normalizedPath: normalized, error: "Path traversal ('..') is prohibited." };
        }
        // Workspace confinement
        const workspaceConfig = OfficeWorkspaceManager.ensureWorkspace();
        const workspaceRoot = normalize(workspaceConfig.root).toLowerCase();
        const normalizedLower = normalized.toLowerCase();
        const isInsideWorkspace = normalizedLower.startsWith(workspaceRoot);
        if (!isInsideWorkspace && !options.allowExistingOutsideWorkspace) {
            // By default restrict all new writes and operations to workspace
            return {
                valid: false,
                normalizedPath: normalized,
                error: `Path '${normalized}' is outside approved Office workspace root '${workspaceConfig.root}'.`,
            };
        }
        return { valid: true, normalizedPath: normalized };
    }
    static sanitizeDiagnostic(input) {
        if (!input || typeof input !== "object")
            return input;
        const SENSITIVE_KEYWORDS = ["password", "token", "secret", "key", "apikey", "bearer", "credential", "authorization"];
        function sanitizeVal(val) {
            if (val === null || val === undefined)
                return val;
            if (Array.isArray(val)) {
                return val.map((item) => sanitizeVal(item));
            }
            if (typeof val === "object") {
                const out = {};
                for (const [k, v] of Object.entries(val)) {
                    const lowerK = k.toLowerCase();
                    if (SENSITIVE_KEYWORDS.some((kw) => lowerK.includes(kw))) {
                        out[k] = "[REDACTED]";
                    }
                    else {
                        out[k] = sanitizeVal(v);
                    }
                }
                return out;
            }
            return val;
        }
        return sanitizeVal(input);
    }
}
//# sourceMappingURL=security.js.map