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
    static getClientsStatus(): Promise<import("../clients/types.js").ClientDetectionReport[]>;
    static inspectClient(clientKey: string): Promise<import("../clients/types.js").ClientInspectionDetails>;
    static planConnect(clientKey: string, bridgeConfig?: Record<string, unknown>): Promise<import("../clients/types.js").PlanResult>;
    static applyConnect(clientKey: string, bridgeConfig?: Record<string, unknown>): Promise<import("../clients/types.js").ApplyResult>;
    static planDisconnect(clientKey: string): Promise<import("../clients/types.js").PlanResult>;
    static applyDisconnect(clientKey: string): Promise<import("../clients/types.js").ApplyResult>;
    static restoreClient(clientKey: string, backupPath?: string): Promise<import("../clients/types.js").RestoreResult>;
    static getServersStatus(): Promise<ServerInfo[]>;
    static getActivityLogs(): ActivityLogEntry[];
    static getSystemDiagnostics(): SystemDiagnostics;
}
