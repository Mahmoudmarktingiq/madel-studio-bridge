/**
 * MADEL Studio Bridge — Universal Configuration Manager & Orchestrator
 * Developed & Maintained by Mahmoud Adel
 * Plans, dry-runs, and applies atomic client configuration updates
 */
import { type DiscoveryOptions } from "./discovery.js";
import { ClientRegistry } from "./registry.js";
import { type ApplyResult, type ClientInspectionDetails, type MadelServerConfigOptions, type PlanResult, type RestoreResult } from "./types.js";
export interface ConfigManagerOptions {
    registry?: ClientRegistry;
    defaultServerOptions?: MadelServerConfigOptions;
}
export declare class ConfigManager {
    private readonly registry;
    private readonly defaultServerOptions;
    constructor(options?: ConfigManagerOptions);
    /**
     * Lists summary of all supported clients in the registry.
     */
    listClients(): Array<{
        id: string;
        displayName: string;
        format: string;
        platforms: readonly string[];
    }>;
    /**
     * Discovers and inspects all registered clients on the system.
     */
    detect(options?: DiscoveryOptions): import("./types.js").ClientDetectionReport[];
    /**
     * Inspects detailed configuration state of a single client.
     */
    inspect(clientId: string, options?: DiscoveryOptions): ClientInspectionDetails;
    /**
     * Plans and dry-runs connection of MADEL Studio Bridge to target client without writing to disk.
     */
    planConnect(clientId: string, serverOptions?: MadelServerConfigOptions, discoveryOpts?: DiscoveryOptions): PlanResult;
    /**
     * Applies the connection plan and atomically writes the configuration to disk.
     */
    applyConnect(clientId: string, serverOptions?: MadelServerConfigOptions, discoveryOpts?: DiscoveryOptions): ApplyResult;
    /**
     * Plans and dry-runs removal of MADEL Studio Bridge entry from client configuration.
     */
    planDisconnect(clientId: string, discoveryOpts?: DiscoveryOptions): PlanResult;
    /**
     * Applies the disconnection plan and removes the MADEL entry atomically.
     */
    applyDisconnect(clientId: string, discoveryOpts?: DiscoveryOptions): ApplyResult;
    /**
     * Restores a client's configuration from a backup file.
     */
    restore(clientId: string, customBackupPath?: string, discoveryOpts?: DiscoveryOptions): RestoreResult;
}
export declare const globalConfigManager: ConfigManager;
