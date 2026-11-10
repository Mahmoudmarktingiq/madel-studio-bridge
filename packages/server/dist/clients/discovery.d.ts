/**
 * MADEL Studio Bridge — AI Client Discovery Engine
 * Developed & Maintained by Mahmoud Adel
 * Non-invasive, read-only discovery of installed AI clients and MCP configurations
 */
import { ClientRegistry } from "./registry.js";
import { type ClientDefinition, type ClientDetectionReport, type Platform } from "./types.js";
export interface DiscoveryOptions {
    platform?: Platform;
    env?: Record<string, string | undefined>;
    activeProcesses?: string[];
    registry?: ClientRegistry;
}
/**
 * Discovers and reports the status of a specific client definition on the system.
 */
export declare function discoverClient(definition: ClientDefinition, options?: DiscoveryOptions): ClientDetectionReport;
/**
 * Discovers all registered clients and returns comprehensive detection report.
 */
export declare function discoverAllClients(options?: DiscoveryOptions): ClientDetectionReport[];
