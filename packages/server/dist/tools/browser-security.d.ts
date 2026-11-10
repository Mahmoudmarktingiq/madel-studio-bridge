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
     * Approved workspace directory roots for local file access and uploads
     */
    private static readonly APPROVED_WORKSPACE_ROOTS;
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
     * Validates that a path resides within approved workspace roots.
     */
    static isPathInApprovedWorkspace(candidatePath: string): boolean;
    /**
     * Checks whether a client owns a session.
     */
    static validateSessionOwnership(sessionClientId: string | undefined, currentClientId: string | undefined): boolean;
}
