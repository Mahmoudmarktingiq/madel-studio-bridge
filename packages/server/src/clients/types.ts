/**
 * MADEL Studio Bridge — AI Client Manager Types & Contracts
 * Developed & Maintained by Mahmoud Adel
 * Clean-Room Specification for Declarative Client Discovery and Configuration
 */

export type Platform = "win32" | "darwin" | "linux";

export const ClientStatus = {
  INSTALLED: "installed",
  NOT_INSTALLED: "not_installed",
  DETECTED: "detected",
  CONFIGURED: "configured",
  CONNECTED: "connected",
  UNSUPPORTED: "unsupported",
  NOT_VERIFIED: "not_verified",
} as const;

export type ClientStatus = (typeof ClientStatus)[keyof typeof ClientStatus];

export const ConfigFormat = {
  JSON: "json",
  JSONC: "jsonc",
  TOML: "toml",
  YAML: "yaml",
} as const;

export type ConfigFormat = (typeof ConfigFormat)[keyof typeof ConfigFormat];

export const TransportType = {
  STDIO: "stdio",
  NAMED_PIPE: "namedPipe",
  WEBSOCKET: "websocket",
  SSE: "sse",
} as const;

export type TransportType = (typeof TransportType)[keyof typeof TransportType];

export interface MadelServerConfigOptions {
  serverPath?: string;
  pipeName?: string;
  nodePath?: string;
  port?: number;
  environmentVariables?: Record<string, string>;
  preferPipe?: boolean;
}

export interface ClientDefinition {
  readonly id: string;
  readonly displayName: string;
  readonly description: string;
  readonly platforms: readonly Platform[];
  readonly configFormat: ConfigFormat;
  readonly supportedTransports: readonly TransportType[];
  readonly defaultTransport: TransportType;
  readonly mcpServersKey: string;
  readonly reloadRequirements: string;
  readonly notes?: string;
  readonly unsupportedFeatures?: readonly string[];

  /**
   * Returns list of candidate configuration paths for the target platform.
   * Uses environment variables (%APPDATA%, %USERPROFILE%, $HOME) rather than hardcoded usernames.
   */
  getConfigLocations(platform: Platform, env?: Record<string, string | undefined>): string[];

  /**
   * Returns candidate paths or binary names to detect client executable installation.
   */
  getExecutableLocations(platform: Platform, env?: Record<string, string | undefined>): string[];

  /**
   * Returns known process names to detect if client is currently running.
   */
  getProcessNames(platform: Platform): string[];

  /**
   * Generates the client-specific MADEL Studio Bridge server definition payload.
   */
  generateServerConfig(options: MadelServerConfigOptions): Record<string, unknown>;

  /**
   * Inspects parsed configuration data to extract existing MADEL entry if present.
   */
  extractMadelEntry(configData: Record<string, unknown>): {
    exists: boolean;
    entry?: unknown;
    entryKey?: string;
    matchesCurrent?: boolean;
  };

  /**
   * Inserts or updates the MADEL Studio Bridge entry inside the parsed configuration structure.
   * MUST preserve all other preexisting MCP servers and unrelated fields.
   */
  insertMadelEntry(
    configData: Record<string, unknown>,
    entry: Record<string, unknown>,
  ): Record<string, unknown>;

  /**
   * Removes MADEL Studio Bridge entry from parsed configuration structure.
   */
  removeMadelEntry(configData: Record<string, unknown>): {
    modified: boolean;
    data: Record<string, unknown>;
  };
}

export interface ClientDetectionReport {
  readonly clientId: string;
  readonly displayName: string;
  readonly status: ClientStatus;
  readonly isPlatformSupported: boolean;
  readonly installed: boolean;
  readonly running: boolean;
  readonly configPath?: string;
  readonly configExists: boolean;
  readonly isMadelConfigured: boolean;
  readonly detectedExecutable?: string;
  readonly detectedProcesses: string[];
  readonly activeTransport?: TransportType;
  readonly issues: string[];
}

export interface ClientInspectionDetails extends ClientDetectionReport {
  readonly definition: {
    readonly id: string;
    readonly displayName: string;
    readonly configFormat: ConfigFormat;
    readonly supportedTransports: readonly TransportType[];
    readonly reloadRequirements: string;
    readonly notes?: string;
  };
  readonly rawConfigSummary?: {
    readonly format: ConfigFormat;
    readonly otherMcpServers: string[];
    readonly madelEntry?: unknown;
  };
}

export interface PlanResult {
  readonly clientId: string;
  readonly action: "connect" | "disconnect" | "noop";
  readonly configPath: string;
  readonly configExists: boolean;
  readonly format: ConfigFormat;
  readonly currentMadelEntry?: unknown;
  readonly proposedMadelEntry?: unknown;
  readonly otherServersPreserved: string[];
  readonly diffPreview: string;
  readonly willRequireReload: boolean;
  readonly reloadInstructions: string;
  readonly warnings: string[];
}

export interface ApplyResult {
  readonly success: boolean;
  readonly clientId: string;
  readonly action: "connect" | "disconnect";
  readonly configPath: string;
  readonly backupPath?: string;
  readonly previousHash?: string;
  readonly newHash?: string;
  readonly reloadInstructions: string;
  readonly error?: string;
}

export interface RestoreResult {
  readonly success: boolean;
  readonly clientId: string;
  readonly configPath: string;
  readonly restoredFromBackup: string;
  readonly error?: string;
}
