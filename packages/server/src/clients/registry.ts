/**
 * MADEL Studio Bridge — Declarative AI Client Registry
 * Developed & Maintained by Mahmoud Adel
 * Universal ClientDefinition specifications for 17+ AI and coding clients
 */

import { homedir } from "node:os";
import { join } from "node:path";
import {
  ConfigFormat,
  TransportType,
  type ClientDefinition,
  type MadelServerConfigOptions,
  type Platform,
} from "./types.js";

function getEnvPath(env: Record<string, string | undefined> | undefined, key: string): string {
  if (env && env[key]) return env[key]!;
  if (process.env[key]) return process.env[key]!;
  return "";
}

function resolveUserDir(env?: Record<string, string | undefined>): string {
  const profile = getEnvPath(env, "USERPROFILE");
  if (profile) return profile;
  const home = getEnvPath(env, "HOME");
  if (home) return home;
  return homedir();
}

function resolveAppData(env?: Record<string, string | undefined>): string {
  const appData = getEnvPath(env, "APPDATA");
  if (appData) return appData;
  return join(resolveUserDir(env), "AppData", "Roaming");
}

function resolveLocalAppData(env?: Record<string, string | undefined>): string {
  const localAppData = getEnvPath(env, "LOCALAPPDATA");
  if (localAppData) return localAppData;
  return join(resolveUserDir(env), "AppData", "Local");
}

/**
 * Standard default payload generator for MADEL Studio Bridge MCP server.
 */
function defaultGenerateServerConfig(options: MadelServerConfigOptions): Record<string, unknown> {
  const serverPath = options.serverPath || "D:\\MCP\\01-Projects\\Installed\\MADEL-Studio-Bridge\\dist\\index.js";
  const nodeExe = options.nodePath || "node";

  return {
    command: nodeExe,
    args: [serverPath],
    env: {
      MADEL_MCP_CLIENT_SESSION: "1",
      ...(options.environmentVariables || {}),
    },
  };
}

/**
 * Standard extraction helper for object-based configs with mcpServers key.
 */
function standardExtractMadel(configData: Record<string, unknown>, serverKey = "mcpServers") {
  const servers = configData[serverKey] as Record<string, unknown> | undefined;
  if (!servers || typeof servers !== "object") {
    return { exists: false };
  }
  const entry = servers["madel"] || servers["madel-studio-bridge"] || servers["brainferno-mcp-bridge"];
  return {
    exists: Boolean(entry),
    entry,
    entryKey: servers["madel"] ? "madel" : servers["madel-studio-bridge"] ? "madel-studio-bridge" : servers["brainferno-mcp-bridge"] ? "brainferno-mcp-bridge" : undefined,
  };
}

/**
 * Standard insert helper preserving all unrelated keys and servers.
 */
function standardInsertMadel(
  configData: Record<string, unknown>,
  entry: Record<string, unknown>,
  serverKey = "mcpServers",
  preferredName = "madel",
): Record<string, unknown> {
  const cloned = { ...configData };
  const existingServers = (cloned[serverKey] && typeof cloned[serverKey] === "object" ? { ...(cloned[serverKey] as Record<string, unknown>) } : {}) as Record<string, unknown>;

  existingServers[preferredName] = entry;
  cloned[serverKey] = existingServers;
  return cloned;
}

/**
 * Standard remove helper.
 */
function standardRemoveMadel(configData: Record<string, unknown>, serverKey = "mcpServers") {
  const cloned = { ...configData };
  const existingServers = (cloned[serverKey] && typeof cloned[serverKey] === "object" ? { ...(cloned[serverKey] as Record<string, unknown>) } : {}) as Record<string, unknown>;

  let modified = false;
  for (const k of ["madel", "madel-studio-bridge", "brainferno-mcp-bridge"]) {
    if (existingServers[k]) {
      delete existingServers[k];
      modified = true;
    }
  }

  cloned[serverKey] = existingServers;
  return { modified, data: cloned };
}

// 1. Claude Code
export const claudeCodeDefinition: ClientDefinition = {
  id: "claude-code",
  displayName: "Claude Code CLI",
  description: "Anthropic's official terminal assistant for agentic coding",
  platforms: ["win32", "darwin", "linux"],
  configFormat: ConfigFormat.JSON,
  supportedTransports: [TransportType.STDIO, TransportType.NAMED_PIPE],
  defaultTransport: TransportType.STDIO,
  mcpServersKey: "mcpServers",
  reloadRequirements: "Automatic reload on new session prompt",
  getConfigLocations: (p, env) => [join(resolveUserDir(env), ".claude.json")],
  getExecutableLocations: (p, env) => [
    join(resolveUserDir(env), "AppData", "Roaming", "npm", "claude.cmd"),
    "claude",
  ],
  getProcessNames: () => ["claude", "claude.exe"],
  generateServerConfig: defaultGenerateServerConfig,
  extractMadelEntry: (c) => standardExtractMadel(c, "mcpServers"),
  insertMadelEntry: (c, e) => standardInsertMadel(c, e, "mcpServers", "madel"),
  removeMadelEntry: (c) => standardRemoveMadel(c, "mcpServers"),
};

// 2. Claude Desktop
export const claudeDesktopDefinition: ClientDefinition = {
  id: "claude-desktop",
  displayName: "Claude Desktop",
  description: "Anthropic's native desktop application for macOS and Windows",
  platforms: ["win32", "darwin"],
  configFormat: ConfigFormat.JSON,
  supportedTransports: [TransportType.STDIO],
  defaultTransport: TransportType.STDIO,
  mcpServersKey: "mcpServers",
  reloadRequirements: "Restart Claude Desktop application",
  getConfigLocations: (p, env) => {
    if (p === "win32") return [join(resolveAppData(env), "Claude", "claude_desktop_config.json")];
    if (p === "darwin") return [join(resolveUserDir(env), "Library", "Application Support", "Claude", "claude_desktop_config.json")];
    return [join(resolveUserDir(env), ".config", "Claude", "claude_desktop_config.json")];
  },
  getExecutableLocations: (p, env) => [
    join(resolveLocalAppData(env), "Programs", "Claude", "Claude.exe"),
    join(resolveUserDir(env), "AppData", "Local", "AnthropicClaude", "claude.exe"),
  ],
  getProcessNames: () => ["Claude", "Claude.exe"],
  generateServerConfig: defaultGenerateServerConfig,
  extractMadelEntry: (c) => standardExtractMadel(c, "mcpServers"),
  insertMadelEntry: (c, e) => standardInsertMadel(c, e, "mcpServers", "madel"),
  removeMadelEntry: (c) => standardRemoveMadel(c, "mcpServers"),
};

// 3. OpenAI Codex
export const openaiCodexDefinition: ClientDefinition = {
  id: "openai-codex",
  displayName: "OpenAI Codex CLI",
  description: "OpenAI's advanced command-line coding and runtime assistant",
  platforms: ["win32", "darwin", "linux"],
  configFormat: ConfigFormat.TOML,
  supportedTransports: [TransportType.STDIO, TransportType.NAMED_PIPE],
  defaultTransport: TransportType.STDIO,
  mcpServersKey: "mcp_servers",
  reloadRequirements: "Automatic reload on new codex run",
  getConfigLocations: (p, env) => [join(resolveUserDir(env), ".codex", "config.toml")],
  getExecutableLocations: () => ["codex", "codex.exe"],
  getProcessNames: () => ["codex", "OpenAI.CodexPrimaryRuntime"],
  generateServerConfig: defaultGenerateServerConfig,
  extractMadelEntry: (c) => {
    const servers = (c["mcp_servers"] || c["mcpServers"]) as Record<string, unknown> | undefined;
    if (!servers || typeof servers !== "object") return { exists: false };
    const entry = servers["madel"] || servers["brainferno"];
    return { exists: Boolean(entry), entry, entryKey: servers["madel"] ? "madel" : "brainferno" };
  },
  insertMadelEntry: (c, e) => {
    const cloned = { ...c };
    const key = c["mcpServers"] ? "mcpServers" : "mcp_servers";
    const existing = (cloned[key] && typeof cloned[key] === "object" ? { ...(cloned[key] as Record<string, unknown>) } : {}) as Record<string, unknown>;
    existing["madel"] = e;
    cloned[key] = existing;
    return cloned;
  },
  removeMadelEntry: (c) => {
    const cloned = { ...c };
    let modified = false;
    for (const key of ["mcp_servers", "mcpServers"]) {
      if (cloned[key] && typeof cloned[key] === "object") {
        const servers = { ...(cloned[key] as Record<string, unknown>) };
        if (servers["madel"] || servers["brainferno"]) {
          delete servers["madel"];
          delete servers["brainferno"];
          modified = true;
          cloned[key] = servers;
        }
      }
    }
    return { modified, data: cloned };
  },
};

// 4. Google Antigravity
export const googleAntigravityDefinition: ClientDefinition = {
  id: "google-antigravity",
  displayName: "Google Antigravity IDE",
  description: "DeepMind's advanced agentic coding pair programming IDE",
  platforms: ["win32", "darwin", "linux"],
  configFormat: ConfigFormat.JSON,
  supportedTransports: [TransportType.STDIO, TransportType.NAMED_PIPE],
  defaultTransport: TransportType.STDIO,
  mcpServersKey: "mcpServers",
  reloadRequirements: "Restart Antigravity or refresh MCP servers via settings",
  getConfigLocations: (p, env) => [join(resolveUserDir(env), ".gemini", "config", "mcp_config.json")],
  getExecutableLocations: (p, env) => [
    join(resolveLocalAppData(env), "Programs", "Antigravity", "Antigravity.exe"),
  ],
  getProcessNames: () => ["Antigravity", "Antigravity.exe"],
  generateServerConfig: defaultGenerateServerConfig,
  extractMadelEntry: (c) => standardExtractMadel(c, "mcpServers"),
  insertMadelEntry: (c, e) => standardInsertMadel(c, e, "mcpServers", "madel"),
  removeMadelEntry: (c) => standardRemoveMadel(c, "mcpServers"),
};

// 5. Gemini CLI
export const geminiCliDefinition: ClientDefinition = {
  id: "gemini-cli",
  displayName: "Google Gemini CLI",
  description: "Official Google Gemini command line development utility",
  platforms: ["win32", "darwin", "linux"],
  configFormat: ConfigFormat.JSON,
  supportedTransports: [TransportType.STDIO],
  defaultTransport: TransportType.STDIO,
  mcpServersKey: "mcpServers",
  reloadRequirements: "Automatic reload on next CLI invocation",
  getConfigLocations: (p, env) => [join(resolveUserDir(env), ".gemini", "settings.json")],
  getExecutableLocations: () => ["gemini", "gemini.cmd"],
  getProcessNames: () => ["gemini"],
  generateServerConfig: defaultGenerateServerConfig,
  extractMadelEntry: (c) => standardExtractMadel(c, "mcpServers"),
  insertMadelEntry: (c, e) => standardInsertMadel(c, e, "mcpServers", "madel"),
  removeMadelEntry: (c) => standardRemoveMadel(c, "mcpServers"),
};

// 6. Cursor IDE
export const cursorDefinition: ClientDefinition = {
  id: "cursor",
  displayName: "Cursor IDE",
  description: "AI-first code editor built on VS Code",
  platforms: ["win32", "darwin", "linux"],
  configFormat: ConfigFormat.JSON,
  supportedTransports: [TransportType.STDIO],
  defaultTransport: TransportType.STDIO,
  mcpServersKey: "mcpServers",
  reloadRequirements: "Reload Cursor Window",
  getConfigLocations: (p, env) => [
    join(resolveUserDir(env), ".cursor", "mcp.json"),
    join(resolveAppData(env), "Cursor", "User", "globalStorage", "mcp.json"),
  ],
  getExecutableLocations: (p, env) => [
    join(resolveLocalAppData(env), "Programs", "cursor", "Cursor.exe"),
    "cursor",
  ],
  getProcessNames: () => ["Cursor", "Cursor.exe"],
  generateServerConfig: defaultGenerateServerConfig,
  extractMadelEntry: (c) => standardExtractMadel(c, "mcpServers"),
  insertMadelEntry: (c, e) => standardInsertMadel(c, e, "mcpServers", "madel"),
  removeMadelEntry: (c) => standardRemoveMadel(c, "mcpServers"),
};

// 7. VS Code
export const vsCodeDefinition: ClientDefinition = {
  id: "vscode",
  displayName: "Visual Studio Code",
  description: "Microsoft Visual Studio Code editor",
  platforms: ["win32", "darwin", "linux"],
  configFormat: ConfigFormat.JSONC,
  supportedTransports: [TransportType.STDIO],
  defaultTransport: TransportType.STDIO,
  mcpServersKey: "mcp.servers",
  reloadRequirements: "Reload VS Code Window",
  getConfigLocations: (p, env) => {
    if (p === "win32") return [join(resolveAppData(env), "Code", "User", "settings.json")];
    if (p === "darwin") return [join(resolveUserDir(env), "Library", "Application Support", "Code", "User", "settings.json")];
    return [join(resolveUserDir(env), ".config", "Code", "User", "settings.json")];
  },
  getExecutableLocations: (p, env) => [
    join(resolveLocalAppData(env), "Programs", "Microsoft VS Code", "Code.exe"),
    "code",
  ],
  getProcessNames: () => ["Code", "Code.exe"],
  generateServerConfig: defaultGenerateServerConfig,
  extractMadelEntry: (c) => standardExtractMadel(c, "mcp.servers"),
  insertMadelEntry: (c, e) => standardInsertMadel(c, e, "mcp.servers", "madel"),
  removeMadelEntry: (c) => standardRemoveMadel(c, "mcp.servers"),
};

// 8. VS Code Insiders
export const vsCodeInsidersDefinition: ClientDefinition = {
  id: "vscode-insiders",
  displayName: "VS Code Insiders",
  description: "Microsoft Visual Studio Code Insiders daily build",
  platforms: ["win32", "darwin", "linux"],
  configFormat: ConfigFormat.JSONC,
  supportedTransports: [TransportType.STDIO],
  defaultTransport: TransportType.STDIO,
  mcpServersKey: "mcp.servers",
  reloadRequirements: "Reload VS Code Insiders Window",
  getConfigLocations: (p, env) => [join(resolveAppData(env), "Code - Insiders", "User", "settings.json")],
  getExecutableLocations: (p, env) => [
    join(resolveLocalAppData(env), "Programs", "Microsoft VS Code Insiders", "Code - Insiders.exe"),
  ],
  getProcessNames: () => ["Code - Insiders", "Code - Insiders.exe"],
  generateServerConfig: defaultGenerateServerConfig,
  extractMadelEntry: (c) => standardExtractMadel(c, "mcp.servers"),
  insertMadelEntry: (c, e) => standardInsertMadel(c, e, "mcp.servers", "madel"),
  removeMadelEntry: (c) => standardRemoveMadel(c, "mcp.servers"),
};

// 9. Windsurf
export const windsurfDefinition: ClientDefinition = {
  id: "windsurf",
  displayName: "Windsurf Editor",
  description: "Codeium's agentic IDE built with native MCP capabilities",
  platforms: ["win32", "darwin", "linux"],
  configFormat: ConfigFormat.JSON,
  supportedTransports: [TransportType.STDIO],
  defaultTransport: TransportType.STDIO,
  mcpServersKey: "mcpServers",
  reloadRequirements: "Reload Windsurf Window",
  getConfigLocations: (p, env) => [join(resolveUserDir(env), ".codeium", "windsurf", "mcp_config.json")],
  getExecutableLocations: (p, env) => [
    join(resolveLocalAppData(env), "Programs", "Windsurf", "Windsurf.exe"),
  ],
  getProcessNames: () => ["Windsurf", "Windsurf.exe"],
  generateServerConfig: defaultGenerateServerConfig,
  extractMadelEntry: (c) => standardExtractMadel(c, "mcpServers"),
  insertMadelEntry: (c, e) => standardInsertMadel(c, e, "mcpServers", "madel"),
  removeMadelEntry: (c) => standardRemoveMadel(c, "mcpServers"),
};

// 10. Cline
export const clineDefinition: ClientDefinition = {
  id: "cline",
  displayName: "Cline (VS Code Extension)",
  description: "Autonomous coding agent extension for VS Code",
  platforms: ["win32", "darwin", "linux"],
  configFormat: ConfigFormat.JSON,
  supportedTransports: [TransportType.STDIO],
  defaultTransport: TransportType.STDIO,
  mcpServersKey: "mcpServers",
  reloadRequirements: "Restart Cline tab / Reload VS Code",
  getConfigLocations: (p, env) => [
    join(resolveAppData(env), "Code", "User", "globalStorage", "saoudrizwan.claude-dev", "settings", "cline_mcp_settings.json"),
  ],
  getExecutableLocations: () => [],
  getProcessNames: () => ["Code", "Code.exe"],
  generateServerConfig: defaultGenerateServerConfig,
  extractMadelEntry: (c) => standardExtractMadel(c, "mcpServers"),
  insertMadelEntry: (c, e) => standardInsertMadel(c, e, "mcpServers", "madel"),
  removeMadelEntry: (c) => standardRemoveMadel(c, "mcpServers"),
};

// 11. Roo Code
export const rooCodeDefinition: ClientDefinition = {
  id: "roo-code",
  displayName: "Roo Code (VS Code Extension)",
  description: "Enhanced community fork of Cline for VS Code",
  platforms: ["win32", "darwin", "linux"],
  configFormat: ConfigFormat.JSON,
  supportedTransports: [TransportType.STDIO],
  defaultTransport: TransportType.STDIO,
  mcpServersKey: "mcpServers",
  reloadRequirements: "Restart Roo Code tab / Reload VS Code",
  getConfigLocations: (p, env) => [
    join(resolveAppData(env), "Code", "User", "globalStorage", "rooveterinaryinc.roo-cline", "settings", "cline_mcp_settings.json"),
  ],
  getExecutableLocations: () => [],
  getProcessNames: () => ["Code", "Code.exe"],
  generateServerConfig: defaultGenerateServerConfig,
  extractMadelEntry: (c) => standardExtractMadel(c, "mcpServers"),
  insertMadelEntry: (c, e) => standardInsertMadel(c, e, "mcpServers", "madel"),
  removeMadelEntry: (c) => standardRemoveMadel(c, "mcpServers"),
};

// 12. Continue
export const continueDefinition: ClientDefinition = {
  id: "continue",
  displayName: "Continue Extension",
  description: "Open-source autopilot extension for VS Code and JetBrains",
  platforms: ["win32", "darwin", "linux"],
  configFormat: ConfigFormat.JSON,
  supportedTransports: [TransportType.STDIO],
  defaultTransport: TransportType.STDIO,
  mcpServersKey: "mcpServers",
  reloadRequirements: "Automatic reload on save",
  getConfigLocations: (p, env) => [join(resolveUserDir(env), ".continue", "config.json")],
  getExecutableLocations: () => [],
  getProcessNames: () => [],
  generateServerConfig: defaultGenerateServerConfig,
  extractMadelEntry: (c) => standardExtractMadel(c, "mcpServers"),
  insertMadelEntry: (c, e) => standardInsertMadel(c, e, "mcpServers", "madel"),
  removeMadelEntry: (c) => standardRemoveMadel(c, "mcpServers"),
};

// 13. OpenCode
export const openCodeDefinition: ClientDefinition = {
  id: "opencode",
  displayName: "OpenCode",
  description: "Open-source terminal-first AI development environment",
  platforms: ["win32", "darwin", "linux"],
  configFormat: ConfigFormat.JSON,
  supportedTransports: [TransportType.STDIO],
  defaultTransport: TransportType.STDIO,
  mcpServersKey: "mcpServers",
  reloadRequirements: "Restart OpenCode session",
  getConfigLocations: (p, env) => [join(resolveUserDir(env), ".opencode", "config.json")],
  getExecutableLocations: () => ["opencode"],
  getProcessNames: () => ["opencode"],
  generateServerConfig: defaultGenerateServerConfig,
  extractMadelEntry: (c) => standardExtractMadel(c, "mcpServers"),
  insertMadelEntry: (c, e) => standardInsertMadel(c, e, "mcpServers", "madel"),
  removeMadelEntry: (c) => standardRemoveMadel(c, "mcpServers"),
};

// 14. JetBrains IDEs
export const jetbrainsDefinition: ClientDefinition = {
  id: "jetbrains",
  displayName: "JetBrains IDEs",
  description: "IntelliJ IDEA, WebStorm, PyCharm, and other JetBrains environments",
  platforms: ["win32", "darwin", "linux"],
  configFormat: ConfigFormat.JSON,
  supportedTransports: [TransportType.STDIO],
  defaultTransport: TransportType.STDIO,
  mcpServersKey: "mcpServers",
  reloadRequirements: "Restart IDE or refresh MCP settings",
  getConfigLocations: (p, env) => [join(resolveAppData(env), "JetBrains", "mcp.json")],
  getExecutableLocations: () => [],
  getProcessNames: () => ["idea64.exe", "webstorm64.exe", "pycharm64.exe"],
  generateServerConfig: defaultGenerateServerConfig,
  extractMadelEntry: (c) => standardExtractMadel(c, "mcpServers"),
  insertMadelEntry: (c, e) => standardInsertMadel(c, e, "mcpServers", "madel"),
  removeMadelEntry: (c) => standardRemoveMadel(c, "mcpServers"),
};

// 15. GitHub Copilot
export const githubCopilotDefinition: ClientDefinition = {
  id: "github-copilot",
  displayName: "GitHub Copilot",
  description: "GitHub Copilot agent MCP integration where applicable",
  platforms: ["win32", "darwin"],
  configFormat: ConfigFormat.JSON,
  supportedTransports: [TransportType.STDIO],
  defaultTransport: TransportType.STDIO,
  mcpServersKey: "mcpServers",
  reloadRequirements: "Reload Host Environment",
  getConfigLocations: (p, env) => [join(resolveAppData(env), "GitHub Copilot", "mcp.json")],
  getExecutableLocations: () => [],
  getProcessNames: () => [],
  generateServerConfig: defaultGenerateServerConfig,
  extractMadelEntry: (c) => standardExtractMadel(c, "mcpServers"),
  insertMadelEntry: (c, e) => standardInsertMadel(c, e, "mcpServers", "madel"),
  removeMadelEntry: (c) => standardRemoveMadel(c, "mcpServers"),
};

// 16. Goose
export const gooseDefinition: ClientDefinition = {
  id: "goose",
  displayName: "Block Goose",
  description: "Open-source autonomous AI agent from Block",
  platforms: ["win32", "darwin", "linux"],
  configFormat: ConfigFormat.YAML,
  supportedTransports: [TransportType.STDIO],
  defaultTransport: TransportType.STDIO,
  mcpServersKey: "extensions",
  reloadRequirements: "Restart goose agent",
  getConfigLocations: (p, env) => [join(resolveUserDir(env), ".config", "goose", "config.yaml")],
  getExecutableLocations: () => ["goose"],
  getProcessNames: () => ["goose"],
  generateServerConfig: (opts) => ({
    name: "madel",
    cmd: opts.nodePath || "node",
    args: [opts.serverPath || "D:\\MCP\\01-Projects\\Installed\\MADEL-Studio-Bridge\\dist\\index.js"],
    type: "stdio",
  }),
  extractMadelEntry: (c) => {
    const ext = c["extensions"] as Record<string, unknown> | undefined;
    if (!ext || typeof ext !== "object") return { exists: false };
    const entry = ext["madel"] || ext["madel-studio-bridge"];
    return { exists: Boolean(entry), entry, entryKey: ext["madel"] ? "madel" : "madel-studio-bridge" };
  },
  insertMadelEntry: (c, e) => standardInsertMadel(c, e, "extensions", "madel"),
  removeMadelEntry: (c) => standardRemoveMadel(c, "extensions"),
};

// 17. Generic MCP Client
export const genericMcpDefinition: ClientDefinition = {
  id: "generic-mcp",
  displayName: "Generic MCP Client",
  description: "Standard JSON-based MCP Client definition",
  platforms: ["win32", "darwin", "linux"],
  configFormat: ConfigFormat.JSON,
  supportedTransports: [TransportType.STDIO],
  defaultTransport: TransportType.STDIO,
  mcpServersKey: "mcpServers",
  reloadRequirements: "Restart client",
  getConfigLocations: () => ["mcp_config.json"],
  getExecutableLocations: () => [],
  getProcessNames: () => [],
  generateServerConfig: defaultGenerateServerConfig,
  extractMadelEntry: (c) => standardExtractMadel(c, "mcpServers"),
  insertMadelEntry: (c, e) => standardInsertMadel(c, e, "mcpServers", "madel"),
  removeMadelEntry: (c) => standardRemoveMadel(c, "mcpServers"),
};

export class ClientRegistry {
  private readonly definitions = new Map<string, ClientDefinition>();

  constructor() {
    this.register(claudeCodeDefinition);
    this.register(claudeDesktopDefinition);
    this.register(openaiCodexDefinition);
    this.register(googleAntigravityDefinition);
    this.register(geminiCliDefinition);
    this.register(cursorDefinition);
    this.register(vsCodeDefinition);
    this.register(vsCodeInsidersDefinition);
    this.register(windsurfDefinition);
    this.register(clineDefinition);
    this.register(rooCodeDefinition);
    this.register(continueDefinition);
    this.register(openCodeDefinition);
    this.register(jetbrainsDefinition);
    this.register(githubCopilotDefinition);
    this.register(gooseDefinition);
    this.register(genericMcpDefinition);
  }

  public register(definition: ClientDefinition): void {
    this.definitions.set(definition.id, definition);
  }

  public get(clientId: string): ClientDefinition | undefined {
    return this.definitions.get(clientId);
  }

  public getAll(): ClientDefinition[] {
    return Array.from(this.definitions.values());
  }

  public has(clientId: string): boolean {
    return this.definitions.has(clientId);
  }
}

export const globalClientRegistry = new ClientRegistry();
