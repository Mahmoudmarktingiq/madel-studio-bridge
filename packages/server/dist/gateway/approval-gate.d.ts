/**
 * MADEL Studio Bridge — Action Approval Gate
 * Developed and maintained by Mahmoud Adel
 *
 * Implements an out-of-band, operator-controlled authorization gate for destructive,
 * render, and high-risk operations across the bridge platform.
 *
 * Supports cross-process persistence via secure ~/.brainferno-mcp-bridge/approvals.json
 * so Tauri Desktop and Bridge RPC CLI can review and approve tickets issued by MCP servers.
 */
export type ApprovalOperationType = "destructive" | "render" | "upload" | "config";
export type ApprovalStatus = "pending" | "approved" | "rejected" | "consumed" | "expired";
export interface ApprovalTicket {
    id: string;
    toolName: string;
    operationType: ApprovalOperationType;
    parametersHash: string;
    summary: string;
    details: Record<string, unknown>;
    status: ApprovalStatus;
    createdAt: number;
    expiresAt: number;
    approver?: string;
    rejectionReason?: string;
}
export interface ApprovalChallenge {
    status: "APPROVAL_REQUIRED";
    ticketId: string;
    toolName: string;
    operationType: ApprovalOperationType;
    summary: string;
    expiresAt: string;
    message: string;
}
export interface CheckApprovalResult {
    authorized: boolean;
    ticket?: ApprovalTicket;
    challenge?: ApprovalChallenge;
    auditNote?: string;
}
export declare function defaultApprovalsPath(): string;
export declare class ActionApprovalGate {
    private tickets;
    private defaultTtlMs;
    private strictMode;
    private storagePath;
    constructor(options?: {
        defaultTtlMs?: number;
        strictMode?: boolean;
        storagePath?: string;
    });
    /**
     * Loads persisted tickets from disk.
     */
    private loadFromDisk;
    /**
     * Persists tickets to disk atomically.
     */
    private saveToDisk;
    /**
     * Computes a deterministic SHA-256 hash of the parameters.
     */
    private hashParams;
    /**
     * Creates a new pending approval ticket.
     */
    createTicket(toolName: string, operationType: ApprovalOperationType, summary: string, details?: Record<string, unknown>, ttlMs?: number): ApprovalTicket;
    /**
     * Approves a pending ticket.
     */
    approveTicket(ticketId: string, approver?: string): boolean;
    /**
     * Rejects a pending ticket.
     */
    rejectTicket(ticketId: string, reason?: string): boolean;
    /**
     * Verifies and immediately consumes a ticket (single-use guarantee).
     */
    verifyAndConsumeTicket(ticketId: string, expectedToolName: string, params?: Record<string, unknown>): boolean;
    /**
     * Checks whether the current operation is authorized.
     */
    checkApproval(toolName: string, operationType: ApprovalOperationType, summary: string, params: Record<string, unknown>, suppliedTicketId?: string): CheckApprovalResult;
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
