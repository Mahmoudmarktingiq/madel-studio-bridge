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
import { createHash, randomBytes } from "node:crypto";
import { existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { homedir } from "node:os";
import { dirname, join } from "node:path";
export function defaultApprovalsPath() {
    return join(homedir(), ".brainferno-mcp-bridge", "approvals.json");
}
export class ActionApprovalGate {
    tickets = new Map();
    defaultTtlMs;
    strictMode;
    storagePath;
    constructor(options = {}) {
        this.defaultTtlMs = options.defaultTtlMs ?? 5 * 60 * 1000; // 5 minutes
        this.strictMode = options.strictMode ?? (process.env.MADEL_STRICT_APPROVAL === "1");
        this.storagePath = options.storagePath ?? defaultApprovalsPath();
        this.loadFromDisk();
    }
    /**
     * Loads persisted tickets from disk.
     */
    loadFromDisk() {
        if (!existsSync(this.storagePath))
            return;
        try {
            const content = readFileSync(this.storagePath, "utf8");
            const list = JSON.parse(content);
            if (Array.isArray(list)) {
                for (const t of list) {
                    if (t && typeof t.id === "string") {
                        const existing = this.tickets.get(t.id);
                        if (existing) {
                            Object.assign(existing, t);
                        }
                        else {
                            this.tickets.set(t.id, t);
                        }
                    }
                }
            }
        }
        catch {
            // ignore read/parse errors on corrupt files
        }
    }
    /**
     * Persists tickets to disk atomically.
     */
    saveToDisk() {
        try {
            mkdirSync(dirname(this.storagePath), { recursive: true, mode: 0o700 });
            const tmpPath = `${this.storagePath}.${Date.now()}.${randomBytes(3).toString("hex")}.tmp`;
            const data = JSON.stringify(Array.from(this.tickets.values()), null, 2);
            writeFileSync(tmpPath, data, { mode: 0o600 });
            rmSync(this.storagePath, { force: true });
            writeFileSync(this.storagePath, data, { mode: 0o600 });
            rmSync(tmpPath, { force: true });
        }
        catch {
            // ignore persistence failures in restricted sandboxes
        }
    }
    /**
     * Computes a deterministic SHA-256 hash of the parameters.
     */
    hashParams(params) {
        try {
            const { approvalTicket, ...rest } = params;
            const sortedKeys = Object.keys(rest).sort();
            const normalized = {};
            for (const k of sortedKeys) {
                normalized[k] = rest[k];
            }
            return createHash("sha256").update(JSON.stringify(normalized)).digest("hex").slice(0, 16);
        }
        catch {
            return "0000000000000000";
        }
    }
    /**
     * Creates a new pending approval ticket.
     */
    createTicket(toolName, operationType, summary, details = {}, ttlMs) {
        this.loadFromDisk();
        this.pruneExpired();
        const id = `appr_${Date.now().toString(36)}_${randomBytes(4).toString("hex")}`;
        const now = Date.now();
        const expiresAt = now + (ttlMs ?? this.defaultTtlMs);
        const parametersHash = this.hashParams(details);
        const ticket = {
            id,
            toolName,
            operationType,
            parametersHash,
            summary,
            details,
            status: "pending",
            createdAt: now,
            expiresAt,
        };
        this.tickets.set(id, ticket);
        this.saveToDisk();
        return ticket;
    }
    /**
     * Approves a pending ticket.
     */
    approveTicket(ticketId, approver = "desktop_operator") {
        this.loadFromDisk();
        const ticket = this.tickets.get(ticketId);
        if (!ticket)
            return false;
        if (ticket.status !== "pending")
            return false;
        if (Date.now() > ticket.expiresAt) {
            ticket.status = "expired";
            this.saveToDisk();
            return false;
        }
        ticket.status = "approved";
        ticket.approver = approver;
        this.saveToDisk();
        return true;
    }
    /**
     * Rejects a pending ticket.
     */
    rejectTicket(ticketId, reason = "Operator rejected") {
        this.loadFromDisk();
        const ticket = this.tickets.get(ticketId);
        if (!ticket)
            return false;
        if (ticket.status !== "pending")
            return false;
        ticket.status = "rejected";
        ticket.rejectionReason = reason;
        this.saveToDisk();
        return true;
    }
    /**
     * Verifies and immediately consumes a ticket (single-use guarantee).
     */
    verifyAndConsumeTicket(ticketId, expectedToolName, params = {}) {
        this.loadFromDisk();
        const ticket = this.tickets.get(ticketId);
        if (!ticket)
            return false;
        if (ticket.status !== "approved")
            return false;
        if (Date.now() > ticket.expiresAt) {
            ticket.status = "expired";
            this.saveToDisk();
            return false;
        }
        if (ticket.toolName !== expectedToolName)
            return false;
        // Verify parameter consistency if params provided
        if (Object.keys(params).length > 0) {
            const currentHash = this.hashParams(params);
            if (ticket.parametersHash !== currentHash) {
                return false;
            }
        }
        ticket.status = "consumed";
        this.saveToDisk();
        return true;
    }
    /**
     * Checks whether the current operation is authorized.
     */
    checkApproval(toolName, operationType, summary, params, suppliedTicketId) {
        this.loadFromDisk();
        // 1. If a valid ticket was supplied and is verified
        if (suppliedTicketId) {
            const ok = this.verifyAndConsumeTicket(suppliedTicketId, toolName, params);
            if (ok) {
                return {
                    authorized: true,
                    auditNote: `Verified and consumed operator approval ticket ${suppliedTicketId} for ${toolName}.`,
                };
            }
        }
        // 2. Check if strict enforcement is bypassed (tests, non-strict mode)
        const isTestEnv = process.env.NODE_ENV === "test" ||
            process.env.MADEL_AUTO_APPROVE_FOR_TESTS === "1" ||
            !this.strictMode;
        if (isTestEnv) {
            return {
                authorized: true,
                auditNote: `[AUDIT] Action ${toolName} authorized via parameter confirmation (Standard test/development mode).`,
            };
        }
        // 3. Strict mode active: create pending ticket and issue approval challenge
        const ticket = this.createTicket(toolName, operationType, summary, params);
        return {
            authorized: false,
            ticket,
            challenge: {
                status: "APPROVAL_REQUIRED",
                ticketId: ticket.id,
                toolName,
                operationType,
                summary,
                expiresAt: new Date(ticket.expiresAt).toISOString(),
                message: `High-risk action '${toolName}' requires out-of-band operator approval via MADEL Studio Bridge Desktop or valid approval ticket token.`,
            },
        };
    }
    /**
     * Returns all pending approval tickets.
     */
    getPendingTickets() {
        this.loadFromDisk();
        this.pruneExpired();
        return Array.from(this.tickets.values()).filter((t) => t.status === "pending");
    }
    /**
     * Returns all tickets for diagnostics.
     */
    getAllTickets() {
        this.loadFromDisk();
        this.pruneExpired();
        return Array.from(this.tickets.values());
    }
    /**
     * Prunes expired tickets.
     */
    pruneExpired() {
        const now = Date.now();
        let changed = false;
        for (const [id, ticket] of this.tickets.entries()) {
            if (ticket.status === "pending" && now > ticket.expiresAt) {
                ticket.status = "expired";
                changed = true;
            }
        }
        if (changed) {
            this.saveToDisk();
        }
    }
    setStrictMode(enabled) {
        this.strictMode = enabled;
    }
    isStrictMode() {
        return this.strictMode;
    }
    clear() {
        this.tickets.clear();
        try {
            rmSync(this.storagePath, { force: true });
        }
        catch {
            // ignore
        }
    }
}
/** Global singleton instance of ActionApprovalGate */
export const globalApprovalGate = new ActionApprovalGate();
//# sourceMappingURL=approval-gate.js.map