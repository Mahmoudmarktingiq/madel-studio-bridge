import type {
  GatewayStatus,
  ApplicationInfo,
  ClientStatusInfo,
  PlanResult,
  ApplyResult,
  ServerInfo,
  ActivityLogEntry,
  SystemDiagnostics,
  ApprovalTicket,
} from "./types";

declare global {
  interface Window {
    __TAURI_INTERNALS__?: unknown;
  }
}

export const isTauri = (): boolean => {
  return typeof window !== "undefined" && Boolean(window.__TAURI_INTERNALS__);
};

async function invokeTauri<T>(cmd: string, args: Record<string, unknown> = {}): Promise<T> {
  if (isTauri()) {
    const { invoke } = await import("@tauri-apps/api/core");
    return await invoke<T>(cmd, args);
  }

  // Graceful browser fallback for unit testing and UI development
  return mockFallback<T>(cmd, args);
}

export const tauriBridge = {
  async getGatewayStatus(): Promise<GatewayStatus> {
    return invokeTauri<GatewayStatus>("get_gateway_status");
  },

  async getApplicationsStatus(): Promise<ApplicationInfo[]> {
    return invokeTauri<ApplicationInfo[]>("get_applications_status");
  },

  async getClientsStatus(): Promise<Record<string, ClientStatusInfo>> {
    return invokeTauri<Record<string, ClientStatusInfo>>("get_clients_status");
  },

  async inspectClient(clientKey: string): Promise<ClientStatusInfo> {
    return invokeTauri<ClientStatusInfo>("inspect_client", { clientKey });
  },

  async planClientConnect(clientKey: string, bridgeConfig?: Record<string, unknown>): Promise<PlanResult> {
    return invokeTauri<PlanResult>("plan_client_connect", { clientKey, bridgeConfig });
  },

  async applyClientConnect(clientKey: string, bridgeConfig?: Record<string, unknown>): Promise<ApplyResult> {
    return invokeTauri<ApplyResult>("apply_client_connect", { clientKey, bridgeConfig });
  },

  async planClientDisconnect(clientKey: string): Promise<PlanResult> {
    return invokeTauri<PlanResult>("plan_client_disconnect", { clientKey });
  },

  async applyClientDisconnect(clientKey: string): Promise<ApplyResult> {
    return invokeTauri<ApplyResult>("apply_client_disconnect", { clientKey });
  },

  async restoreClient(clientKey: string, backupPath?: string): Promise<ApplyResult> {
    return invokeTauri<ApplyResult>("restore_client", { clientKey, backupPath });
  },

  async getServersStatus(): Promise<ServerInfo[]> {
    return invokeTauri<ServerInfo[]>("get_servers_status");
  },

  async getActivityLogs(): Promise<ActivityLogEntry[]> {
    return invokeTauri<ActivityLogEntry[]>("get_activity_logs");
  },

  async getSystemDiagnostics(): Promise<SystemDiagnostics> {
    return invokeTauri<SystemDiagnostics>("get_system_diagnostics");
  },

  async getPendingApprovals(): Promise<ApprovalTicket[]> {
    return invokeTauri<ApprovalTicket[]>("get_pending_approvals");
  },

  async approveAction(ticketId: string): Promise<{ success: boolean; ticketId: string }> {
    return invokeTauri<{ success: boolean; ticketId: string }>("approve_action", { ticketId });
  },

  async rejectAction(ticketId: string, reason?: string): Promise<{ success: boolean; ticketId: string }> {
    return invokeTauri<{ success: boolean; ticketId: string }>("reject_action", { ticketId, reason });
  },
};

function mockFallback<T>(cmd: string, args: Record<string, unknown>): Promise<T> {
  const now = new Date().toISOString();

  switch (cmd) {
    case "get_gateway_status":
      return Promise.resolve({
        state: "RUNNING",
        daemon: {
          pid: 15940,
          port: 7897,
          protocolVersion: 2,
          namedPipe: "\\\\.\\pipe\\brainferno-mcp-bridge",
          handshakePath: "C:\\Users\\asus\\.brainferno-mcp-bridge\\bridge.json",
          isAlive: true,
        },
        metrics: {
          activeRequests: 0,
          pendingRequests: 0,
          completedRequests: 142,
          failedRequests: 0,
          cancelledRequests: 0,
          timeoutRequests: 0,
          averageQueueWaitMs: 3,
          averageExecutionMs: 48,
          resourceQueueDepths: { photoshop: 0, blender: 0 },
        },
        serverVersion: "0.4.0",
        timestamp: now,
      } as unknown as T);

    case "get_applications_status":
      return Promise.resolve([
        {
          id: "photoshop",
          name: "Adobe Photoshop 2026",
          category: "design",
          status: "supported_and_verified",
          statusLabel: "Active & Connected",
          adapter: "UXP BatchPlay WebSocket",
          port: 7897,
          pid: 15940,
          details: "Primary daemon listening on 127.0.0.1:7897 with Windows Named Pipe multiplexer.",
          canControl: true,
        },
        {
          id: "blender",
          name: "Blender 4.x / 5.x",
          category: "3d",
          status: "configured_not_verified",
          statusLabel: "Configured (Awaiting Launch)",
          adapter: "Python uvx 9876 socket",
          port: 9876,
          details: "Configured with uvx blender-mcp.",
          canControl: false,
        },
        {
          id: "capcut",
          name: "CapCut Desktop",
          category: "video",
          status: "configured_not_verified",
          statusLabel: "Draft Store Detected",
          adapter: "Draft JSON / CLI Automation",
          details: "Local draft directory detected.",
          canControl: false,
        },
        {
          id: "illustrator",
          name: "Adobe Illustrator",
          category: "design",
          status: "planned",
          statusLabel: "Planned (Phase P21)",
          adapter: "UXP / ExtendScript",
          details: "Scheduled for Phase P21.",
          canControl: false,
        },
      ] as unknown as T);

    case "get_clients_status":
      return Promise.resolve({
        "claude-code": {
          key: "claude-code",
          name: "Claude Code CLI",
          installed: true,
          configured: true,
          connected: false,
          status: "configured",
          format: "json",
          transport: "stdio",
        },
        "openai-codex": {
          key: "openai-codex",
          name: "OpenAI Codex CLI",
          installed: true,
          configured: true,
          connected: false,
          status: "configured",
          format: "toml",
          transport: "stdio",
        },
        "google-antigravity": {
          key: "google-antigravity",
          name: "Google Antigravity",
          installed: true,
          configured: true,
          connected: false,
          status: "configured",
          format: "json",
          transport: "stdio",
        },
      } as unknown as T);

    case "plan_client_connect":
      return Promise.resolve({
        clientKey: String(args.clientKey || "claude-code"),
        format: "json",
        configPath: "C:\\Users\\mock\\.claude.json",
        originalContent: "{\n  \"mcpServers\": {}\n}",
        plannedContent: "{\n  \"mcpServers\": {\n    \"madel-studio-bridge\": {\n      \"command\": \"node\",\n      \"args\": [\"D:\\\\MCP\\\\...\\\\index.js\"]\n    }\n  }\n}",
        diffSummary: {
          added: ["mcpServers.madel-studio-bridge"],
          modified: [],
          removed: [],
        },
        hasChanges: true,
        conflicts: [],
      } as unknown as T);

    case "apply_client_connect":
      return Promise.resolve({
        success: true,
        clientKey: String(args.clientKey || "claude-code"),
        configPath: "C:\\Users\\mock\\.claude.json",
        backupPath: "C:\\Users\\mock\\.claude.json.bak.1731260000",
        sha256: "abc123456789",
      } as unknown as T);

    case "get_servers_status":
      return Promise.resolve([
        {
          id: "photoshop-bridge",
          name: "MADEL Studio Bridge Primary Daemon",
          transport: "websocket",
          processStatus: "running",
          connectionStatus: "listening",
          toolsCount: 129,
          diagnosticResult: "Port 7897 bound. 129 tools registered.",
          endpoint: "ws://127.0.0.1:7897",
          pid: 15940,
        },
      ] as unknown as T);

    case "get_activity_logs":
      return Promise.resolve([
        {
          id: "log-1",
          timestamp: now,
          application: "photoshop",
          client: "google-antigravity",
          severity: "audit",
          correlationId: "corr-dev-01",
          toolName: "cc_connected_apps",
          durationMs: 38,
          message: "Handshake verified for Photoshop.",
        },
      ] as unknown as T);

    case "get_system_diagnostics":
      return Promise.resolve({
        platform: "win32",
        arch: "x64",
        osRelease: "10.0.26300",
        nodeVersion: "v26.13.0",
        madelVersion: "0.4.0",
        heapUsedMb: 6.4,
        heapTotalMb: 9.2,
        rssMb: 54.1,
        primaryDaemonRunning: true,
        primaryDaemonPid: 15940,
        namedPipeAvailable: true,
        handshakeFileExists: true,
        handshakeFilePath: "C:\\Users\\asus\\.brainferno-mcp-bridge\\bridge.json",
        registeredClientsCount: 17,
        configuredClientsCount: 3,
        activeAppsCount: 1,
        timestamp: now,
      } as unknown as T);

    case "get_pending_approvals":
      return Promise.resolve([] as unknown as T);

    case "approve_action":
      return Promise.resolve({ success: true, ticketId: String(args.ticketId || "") } as unknown as T);

    case "reject_action":
      return Promise.resolve({ success: true, ticketId: String(args.ticketId || "") } as unknown as T);

    default:
      return Promise.resolve({} as T);
  }
}
