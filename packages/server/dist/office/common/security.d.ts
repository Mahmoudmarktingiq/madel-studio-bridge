/**
 * MADEL Studio Bridge — Microsoft Office Security Policy & Validation
 * Developed and maintained by Mahmoud Adel
 *
 * Implements strict path validation, sandbox containment, and macro/executable protections.
 */
export declare class OfficeSecurityPolicy {
    private static readonly PROHIBITED_EXTENSIONS;
    private static readonly MACRO_ENABLED_EXTENSIONS;
    static validatePath(inputPath: string, options?: {
        allowExistingOutsideWorkspace?: boolean;
    }): {
        valid: boolean;
        normalizedPath: string;
        error?: string;
    };
    static sanitizeDiagnostic(input: unknown): unknown;
}
