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
export interface SecurityValidationResult {
    valid: boolean;
    sanitizedValue?: string;
    error?: string;
}
export declare class BrowserSecurityPolicy {
    private static readonly ALLOWED_SCHEMES;
    private static readonly BLOCKED_SCHEMES;
    /**
     * Approved workspace directory roots for local file access and uploads.
     * Restricted strictly to designated creative workspace brand folders and isolated temp fixtures.
     * Source repositories, system directories, and root instruction files are strictly prohibited.
     */
    private static readonly APPROVED_WORKSPACE_ROOTS;
    static readonly FORBIDDEN_EXTENSIONS: Set<string>;
    private static readonly FORBIDDEN_SUBSTRINGS;
    private static readonly BLOCKED_EXACT_FILES;
    /**
     * Validates target navigation URL.
     */
    static validateUrl(inputUrl: string): SecurityValidationResult;
    /**
     * Validates local files before setting them into file input elements.
     */
    static validateUploadFiles(filePaths: string[]): {
        valid: boolean;
        approvedPaths: string[];
        error?: string;
    };
    /**
     * Validates that a path resides within approved workspace roots and contains no forbidden substrings.
     */
    static isPathInApprovedWorkspace(candidatePath: string): boolean;
    /**
     * Returns default root for Browser Workspace.
     */
    static getBrowserWorkspaceRoot(): string;
    /**
     * Validates a candidate path for sandboxed file operations.
     */
    static validateWorkspacePath(candidatePath: string, options?: {
        checkExists?: boolean;
        allowCreation?: boolean;
        disallowExecutables?: boolean;
    }): {
        valid: boolean;
        normalizedPath: string;
        error?: string;
    };
    /**
     * Sanitizes or redacts sensitive values such as passwords or secrets from logs.
     */
    static redactSensitiveValue(val: string, isPassword?: boolean): string;
    /**
     * Checks whether a client owns a session.
     */
    static validateSessionOwnership(sessionClientId: string | undefined, currentClientId: string | undefined): boolean;
}
