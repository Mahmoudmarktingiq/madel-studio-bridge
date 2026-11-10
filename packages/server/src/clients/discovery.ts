/**
 * MADEL Studio Bridge — AI Client Discovery Engine
 * Developed & Maintained by Mahmoud Adel
 * Non-invasive, read-only discovery of installed AI clients and MCP configurations
 */

import { existsSync, readFileSync } from "node:fs";
import { parseConfigText } from "./parsers.js";
import { globalClientRegistry, ClientRegistry } from "./registry.js";
import {
  ClientStatus,
  type ClientDefinition,
  type ClientDetectionReport,
  type Platform,
} from "./types.js";

export interface DiscoveryOptions {
  platform?: Platform;
  env?: Record<string, string | undefined>;
  activeProcesses?: string[];
  registry?: ClientRegistry;
}

/**
 * Discovers and reports the status of a specific client definition on the system.
 */
export function discoverClient(
  definition: ClientDefinition,
  options: DiscoveryOptions = {},
): ClientDetectionReport {
  const platform = options.platform || (process.platform as Platform);
  const env = options.env || process.env;
  const isPlatformSupported = definition.platforms.includes(platform);
  const issues: string[] = [];

  if (!isPlatformSupported) {
    return {
      clientId: definition.id,
      displayName: definition.displayName,
      status: ClientStatus.UNSUPPORTED,
      isPlatformSupported: false,
      installed: false,
      running: false,
      configExists: false,
      isMadelConfigured: false,
      detectedProcesses: [],
      issues: [`Client is not supported on platform: ${platform}`],
    };
  }

  // 1. Resolve configuration paths
  const configLocations = definition.getConfigLocations(platform, env);
  let resolvedConfigPath: string | undefined = configLocations[0];
  let configExists = false;

  for (const loc of configLocations) {
    if (existsSync(loc)) {
      resolvedConfigPath = loc;
      configExists = true;
      break;
    }
  }

  // 2. Detect installation via executable locations
  const execLocations = definition.getExecutableLocations(platform, env);
  let detectedExecutable: string | undefined;
  for (const execPath of execLocations) {
    if (existsSync(execPath)) {
      detectedExecutable = execPath;
      break;
    }
  }

  // Consider installed if executable exists OR config exists
  const installed = Boolean(detectedExecutable || configExists);

  // 3. Detect if process is actively running
  const knownProcessNames = new Set(definition.getProcessNames(platform).map((p) => p.toLowerCase()));
  const activeProcesses = (options.activeProcesses || []).map((p) => p.toLowerCase());
  const detectedProcesses = activeProcesses.filter((p) => knownProcessNames.has(p));
  const running = detectedProcesses.length > 0;

  // 4. Check if MADEL is already configured inside existing configuration
  let isMadelConfigured = false;
  if (configExists && resolvedConfigPath) {
    try {
      const content = readFileSync(resolvedConfigPath, "utf8");
      const parsed = parseConfigText(content, definition.configFormat);
      const extracted = definition.extractMadelEntry(parsed);
      isMadelConfigured = extracted.exists;
    } catch (parseErr) {
      issues.push(`Failed to parse configuration at ${resolvedConfigPath}: ${String(parseErr)}`);
    }
  }

  // 5. Determine precise status
  let status: ClientStatus;
  if (isMadelConfigured) {
    status = ClientStatus.CONFIGURED;
  } else if (installed) {
    status = ClientStatus.INSTALLED;
  } else {
    status = ClientStatus.NOT_INSTALLED;
  }

  return {
    clientId: definition.id,
    displayName: definition.displayName,
    status,
    isPlatformSupported: true,
    installed,
    running,
    configPath: resolvedConfigPath,
    configExists,
    isMadelConfigured,
    detectedExecutable,
    detectedProcesses,
    activeTransport: isMadelConfigured ? definition.defaultTransport : undefined,
    issues,
  };
}

/**
 * Discovers all registered clients and returns comprehensive detection report.
 */
export function discoverAllClients(options: DiscoveryOptions = {}): ClientDetectionReport[] {
  const registry = options.registry || globalClientRegistry;
  return registry.getAll().map((def) => discoverClient(def, options));
}
