/**
 * MADEL Studio Bridge — Hardened Action Approval Gate
 * Developed and maintained by Mahmoud Adel
 *
 * Implements an out-of-band, operator-controlled authorization gate for destructive,
 * render, and high-risk operations across the bridge platform.
 *
 * Core Security Controls:
 * 1. Cryptographic HMAC-SHA256 signature on approvals prevents manual disk file tampering.
 * 2. Mandatory single-use consumption state transition prevents replay attacks.
 * 3. Parameter SHA-256 hash locked at ticket creation prevents parameter tampering.
 * 4. Client ID binding prevents cross-client ticket interception.
 * 5. Strict 5-minute TTL enforcement.
 * 6. Fail-closed error handling throughout.
 */
export type ApprovalOperationType = "destructive" | "render" | "upload" | "config";
export type ApprovalStatus = "pending" | "approved" | "rejected" | "consumed" | "expired";
export type RiskLevel = "LOW" | "MEDIUM" | "HIGH";
export interface ApprovalTicket {
    id: string;
    toolName: string;
    operationType: ApprovalOperationType;
    riskLevel: RiskLevel;
    parametersHash: string;
    summary: string;
    details: Record<string, unknown>;
    status: ApprovalStatus;
    createdAt: number;
    expiresAt: number;
    clientId?: string;
    approver?: string;
    rejectionReason?: string;
    signature?: string;
    nonce: string;
}
export interface ApprovalChallenge {
    status: "APPROVAL_REQUIRED";
    ticketId: string;
    toolName: string;
    operationType: ApprovalOperationType;
    riskLevel: RiskLevel;
    summary: string;
    expiresAt: string;
    message: string;
    clientId?: string;
}
export interface CheckApprovalResult {
    authorized: boolean;
    ticket?: ApprovalTicket;
    challenge?: ApprovalChallenge;
    auditNote?: string;
}
export declare function defaultApprovalsPath(): string;
export declare function defaultKeyPath(): string;
export declare class ActionApprovalGate {
    private tickets;
    private defaultTtlMs;
    private strictMode;
    private storagePath;
    private keyPath;
    private secretKey;
    constructor(options?: {
        defaultTtlMs?: number;
        strictMode?: boolean;
        storagePath?: string;
        keyPath?: string;
    });
    /**
     * Initializes or loads the cryptographic HMAC secret key.
     */
    private initSecretKey;
    /**
     * Enforces Windows NTFS user-only DACLs if running on Windows.
     */
    private enforceFileSecurity;
    /**
     * Computes an HMAC-SHA256 signature for a ticket.
     */
    private computeSignature;
    /**
     * Loads persisted tickets from disk.
     */
    private loadFromDisk;
    /**
     * Persists tickets to disk atomically with user-only permissions.
     */
    private saveToDisk;
    /**
     * Computes a deterministic SHA-256 hash of the parameters.
     */
    private hashParams;
    /**
     * Creates a new pending approval ticket.
     */
    createTicket(toolName: string, operationType: ApprovalOperationType, summary: string, details?: Record<string, unknown>, options?: {
        ttlMs?: number;
        clientId?: string;
        riskLevel?: RiskLevel;
    }): ApprovalTicket;
    /**
     * Approves a pending ticket out-of-band and signs it with HMAC-SHA256.
     */
    approveTicket(ticketId: string, approver?: string): boolean;
    /**
     * Rejects a pending ticket.
     */
    rejectTicket(ticketId: string, reason?: string): boolean;
    /**
     * Verifies and immediately consumes a ticket (single-use guarantee).
     */
    verifyAndConsumeTicket(ticketId: string, expectedToolName: string, params?: Record<string, unknown>, expectedClientId?: string): boolean;
    /**
     * Checks whether the current operation is authorized.
     */
    checkApproval(toolName: string, operationType: ApprovalOperationType, summary: string, params: Record<string, unknown>, suppliedTicketId?: string, clientId?: string, riskLevel?: RiskLevel): CheckApprovalResult;
    /**
     * Returns all pending approval tickets.
     */
    getPendingTickets(): ApprovalTicket[];
    /**
     * Returns all tickets for diagnostics.
     */
    getAllTickets(): ApprovalTicket[];
    /**
     * Prunes expired tickets.
     */
    private pruneExpired;
    setStrictMode(enabled: boolean): void;
    isStrictMode(): boolean;
    clear(): void;
}
/** Global singleton instance of ActionApprovalGate */
export declare const globalApprovalGate: ActionApprovalGate;
