export interface GatewayStatus {
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

export interface ClientStatusInfo {
  key: string;
  name: string;
  installed: boolean;
  configured: boolean;
  connected: boolean;
  status: "not_installed" | "installed" | "detected" | "configured" | "connected" | "unsupported" | "not_verified";
  configPath?: string;
  format: "json" | "jsonc" | "toml" | "yaml";
  transport: "stdio" | "websocket" | "sse";
  executableFound?: boolean;
  running?: boolean;
  lastVerifiedAt?: string;
}

export interface PlanResult {
  clientKey: string;
  format: string;
  configPath: string;
  originalContent: string;
  plannedContent: string;
  diffPreview?: string;
  otherServersPreserved?: string[];
  diffSummary: {
    added: string[];
    modified: string[];
    removed: string[];
  };
  hasChanges: boolean;
  conflicts: string[];
}

export interface ApplyResult {
  success: boolean;
  clientKey: string;
  configPath: string;
  backupPath?: string;
  sha256?: string;
  error?: string;
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
