/**
 * MADEL Studio Bridge — Desktop IPC Bridge RPC
 * Developed and maintained by Mahmoud Adel
 *
 * Provides a secure, strictly-typed bridge between Tauri Desktop and MADEL's core subsystems:
 * - Gateway & Concurrency Metrics (P17)
 * - AI Client Manager & Declarative Registry (P18)
 * - Process & Application Detection (Photoshop, Blender, CapCut, etc.)
 *
 * Pure JSON-RPC runner executed directly by the Tauri Rust backend via std::process::Command.
 * Zero arbitrary shell commands or random CLI execution.
 */
import { type ApprovalTicket } from "../gateway/index.js";
export interface GatewayStatusResponse {
    state: "RUNNING" | "DISCONNECTED" | "NOT_VERIFIED" | "UNAVAILABLE";
    reason?: string;
    daemon: {
        pid?: number;
        port?: number;
        protocolVersion?: number;
        namedPipe: string;
        handshakePath: string;
        isAlive: boolean;
    };
    metrics: {
        activeRequests: number;
        pendingRequests: number;
        completedRequests: number;
        failedRequests: number;
        cancelledRequests: number;
        timeoutRequests: number;
        averageQueueWaitMs: number;
        averageExecutionMs: number;
        resourceQueueDepths: Record<string, number>;
    };
    serverVersion: string;
    timestamp: string;
}
export interface ApplicationInfo {
    id: string;
    name: string;
    category: "design" | "3d" | "video" | "office" | "browser";
    status: "supported_and_verified" | "configured_not_verified" | "detected_only" | "planned" | "not_installed";
    statusLabel: string;
    adapter: string;
    version?: string;
    port?: number;
    pid?: number;
    details: string;
    canControl: boolean;
}
export interface ServerInfo {
    id: string;
    name: string;
    transport: "websocket" | "named_pipe" | "stdio" | "tcp_socket" | "cli";
    processStatus: "running" | "stopped" | "unverified";
    connectionStatus: "connected" | "listening" | "disconnected";
    toolsCount: number;
    diagnosticResult: string;
    lastError?: string;
    endpoint?: string;
    pid?: number;
}
export interface ActivityLogEntry {
    id: string;
    timestamp: string;
    application: string;
    client: string;
    severity: "info" | "warn" | "error" | "audit";
    correlationId: string;
    toolName?: string;
    durationMs?: number;
    message: string;
    details?: Record<string, unknown>;
}
export interface SystemDiagnostics {
    platform: string;
    arch: string;
    osRelease: string;
    nodeVersion: string;
    madelVersion: string;
    heapUsedMb: number;
    heapTotalMb: number;
    rssMb: number;
    primaryDaemonRunning: boolean;
    primaryDaemonPid?: number;
    namedPipeAvailable: boolean;
    handshakeFileExists: boolean;
    handshakeFilePath: string;
    registeredClientsCount: number;
    configuredClientsCount: number;
    activeAppsCount: number;
    timestamp: string;
}
export declare class DesktopBridgeRpc {
    static getGatewayStatus(): Promise<GatewayStatusResponse>;
    static getApplicationsStatus(): Promise<ApplicationInfo[]>;
    static getClientsStatus(): Promise<{
        key: string;
        clientId: string;
        name: string;
        displayName: string;
        installed: boolean;
        configured: boolean;
        isMadelConfigured: boolean;
        connected: boolean;
        running: boolean;
        status: import("../clients/types.js").ClientStatus;
        configPath: string | undefined;
        configExists: boolean;
        format: string;
        transport: import("../clients/types.js").TransportType;
        issues: string[];
    }[]>;
    static inspectClient(clientKey: string): Promise<{
        key: string;
        name: string;
        configured: boolean;
        format: string;
        transport: import("../clients/types.js").TransportType;
        definition: {
            readonly id: string;
            readonly displayName: string;
            readonly configFormat: import("../clients/types.js").ConfigFormat;
            readonly supportedTransports: readonly import("../clients/types.js").TransportType[];
            readonly reloadRequirements: string;
            readonly notes?: string;
        };
        rawConfigSummary?: {
            readonly format: import("../clients/types.js").ConfigFormat;
            readonly otherMcpServers: string[];
            readonly madelEntry?: unknown;
        };
        clientId: string;
        displayName: string;
        status: import("../clients/types.js").ClientStatus;
        isPlatformSupported: boolean;
        installed: boolean;
        running: boolean;
        configPath?: string;
        configExists: boolean;
        isMadelConfigured: boolean;
        detectedExecutable?: string;
        detectedProcesses: string[];
        activeTransport?: import("../clients/types.js").TransportType;
        issues: string[];
    }>;
    static planConnect(clientKey: string, bridgeConfig?: Record<string, unknown>): Promise<{
        clientKey: string;
        clientId: string;
        diffPreview: string;
        originalContent: string;
        plannedContent: string;
        diffSummary: {
            added: string[];
            modified: never[];
            removed: never[];
        };
        hasChanges: boolean;
        conflicts: string[];
        action: "connect" | "disconnect" | "noop";
        configPath: string;
        configExists: boolean;
        format: import("../clients/types.js").ConfigFormat;
        currentMadelEntry?: unknown;
        proposedMadelEntry?: unknown;
        otherServersPreserved: string[];
        willRequireReload: boolean;
        reloadInstructions: string;
        warnings: string[];
    }>;
    static applyConnect(clientKey: string, bridgeConfig?: Record<string, unknown>): Promise<{
        clientKey: string;
        clientId: string;
        success: boolean;
        action: "connect" | "disconnect";
        configPath: string;
        backupPath?: string;
        previousHash?: string;
        newHash?: string;
        reloadInstructions: string;
        error?: string;
    }>;
    static planDisconnect(clientKey: string): Promise<{
        clientKey: string;
        clientId: string;
        diffPreview: string;
        originalContent: string;
        plannedContent: string;
        diffSummary: {
            added: never[];
            modified: never[];
            removed: string[];
        };
        hasChanges: boolean;
        conflicts: string[];
        action: "connect" | "disconnect" | "noop";
        configPath: string;
        configExists: boolean;
        format: import("../clients/types.js").ConfigFormat;
        currentMadelEntry?: unknown;
        proposedMadelEntry?: unknown;
        otherServersPreserved: string[];
        willRequireReload: boolean;
        reloadInstructions: string;
        warnings: string[];
    }>;
    static applyDisconnect(clientKey: string): Promise<{
        clientKey: string;
        clientId: string;
        success: boolean;
        action: "connect" | "disconnect";
        configPath: string;
        backupPath?: string;
        previousHash?: string;
        newHash?: string;
        reloadInstructions: string;
        error?: string;
    }>;
    static restoreClient(clientKey: string, backupPath?: string): Promise<{
        clientKey: string;
        clientId: string;
        success: boolean;
        configPath: string;
        restoredFromBackup: string;
        error?: string;
    }>;
    static getServersStatus(): Promise<ServerInfo[]>;
    static getActivityLogs(): ActivityLogEntry[];
    static getSystemDiagnostics(): SystemDiagnostics;
    static getPendingApprovals(): ApprovalTicket[];
    static approveAction(ticketId: string, approver?: string): {
        success: boolean;
        ticketId: string;
    };
    static rejectAction(ticketId: string, reason?: string): {
        success: boolean;
        ticketId: string;
    };
}
