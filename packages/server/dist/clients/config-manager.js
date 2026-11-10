/**
 * MADEL Studio Bridge — Universal Configuration Manager & Orchestrator
 * Developed & Maintained by Mahmoud Adel
 * Plans, dry-runs, and applies atomic client configuration updates
 */
import { existsSync, readFileSync } from "node:fs";
import { atomicWriteConfigFile, restoreConfigFile } from "./atomic-writer.js";
import { discoverClient } from "./discovery.js";
import { parseConfigText, serializeConfigData } from "./parsers.js";
import { globalClientRegistry, ClientRegistry } from "./registry.js";
import { ClientStatus, } from "./types.js";
export class ConfigManager {
    registry;
    defaultServerOptions;
    constructor(options = {}) {
        this.registry = options.registry || globalClientRegistry;
        this.defaultServerOptions = options.defaultServerOptions || {
            serverPath: "D:\\MCP\\01-Projects\\Installed\\MADEL-Studio-Bridge\\dist\\index.js",
            nodePath: "node",
        };
    }
    /**
     * Lists summary of all supported clients in the registry.
     */
    listClients() {
        return this.registry.getAll().map((def) => ({
            id: def.id,
            displayName: def.displayName,
            format: def.configFormat,
            platforms: def.platforms,
        }));
    }
    /**
     * Discovers and inspects all registered clients on the system.
     */
    detect(options) {
        return this.registry.getAll().map((def) => discoverClient(def, { ...options, registry: this.registry }));
    }
    /**
     * Inspects detailed configuration state of a single client.
     */
    inspect(clientId, options) {
        const def = this.registry.get(clientId);
        if (!def) {
            throw new Error(`Client '${clientId}' is not registered in MADEL ClientRegistry`);
        }
        const report = discoverClient(def, { ...options, registry: this.registry });
        let rawConfigSummary;
        if (report.configExists && report.configPath) {
            try {
                const text = readFileSync(report.configPath, "utf8");
                const parsed = parseConfigText(text, def.configFormat);
                const servers = parsed[def.mcpServersKey] || {};
                const otherServers = Object.keys(servers).filter((k) => k !== "madel" && k !== "madel-studio-bridge" && k !== "brainferno-mcp-bridge");
                const extracted = def.extractMadelEntry(parsed);
                rawConfigSummary = {
                    format: def.configFormat,
                    otherMcpServers: otherServers,
                    madelEntry: extracted.entry,
                };
            }
            catch { }
        }
        return {
            ...report,
            definition: {
                id: def.id,
                displayName: def.displayName,
                configFormat: def.configFormat,
                supportedTransports: def.supportedTransports,
                reloadRequirements: def.reloadRequirements,
                notes: def.notes,
            },
            rawConfigSummary,
        };
    }
    /**
     * Plans and dry-runs connection of MADEL Studio Bridge to target client without writing to disk.
     */
    planConnect(clientId, serverOptions, discoveryOpts) {
        const def = this.registry.get(clientId);
        if (!def) {
            throw new Error(`Client '${clientId}' is not registered in MADEL ClientRegistry`);
        }
        const report = discoverClient(def, { ...discoveryOpts, registry: this.registry });
        const configPath = report.configPath || def.getConfigLocations("win32")[0] || "mcp_config.json";
        const configExists = existsSync(configPath);
        const warnings = [];
        let currentParsed = {};
        if (configExists) {
            try {
                const currentText = readFileSync(configPath, "utf8");
                currentParsed = parseConfigText(currentText, def.configFormat);
            }
            catch (err) {
                warnings.push(`Existing configuration file had parse warnings: ${String(err)}`);
            }
        }
        const extracted = def.extractMadelEntry(currentParsed);
        const opts = { ...this.defaultServerOptions, ...(serverOptions || {}) };
        const proposedEntry = def.generateServerConfig(opts);
        // List all existing servers that will be preserved
        const serversMap = currentParsed[def.mcpServersKey] || {};
        const otherServers = Object.keys(serversMap).filter((k) => k !== "madel" && k !== "madel-studio-bridge" && k !== "brainferno-mcp-bridge");
        // Generate modified configuration object
        const modifiedData = def.insertMadelEntry(currentParsed, proposedEntry);
        const currentSerialized = configExists ? serializeConfigData(currentParsed, def.configFormat) : "(file did not exist)";
        const proposedSerialized = serializeConfigData(modifiedData, def.configFormat);
        const diffPreview = generateUnifiedDiffPreview(configPath, currentSerialized, proposedSerialized);
        return {
            clientId,
            action: "connect",
            configPath,
            configExists,
            format: def.configFormat,
            currentMadelEntry: extracted.entry,
            proposedMadelEntry: proposedEntry,
            otherServersPreserved: otherServers,
            diffPreview,
            willRequireReload: true,
            reloadInstructions: def.reloadRequirements,
            warnings,
        };
    }
    /**
     * Applies the connection plan and atomically writes the configuration to disk.
     */
    applyConnect(clientId, serverOptions, discoveryOpts) {
        const plan = this.planConnect(clientId, serverOptions, discoveryOpts);
        const def = this.registry.get(clientId);
        let currentParsed = {};
        if (plan.configExists) {
            try {
                const currentText = readFileSync(plan.configPath, "utf8");
                currentParsed = parseConfigText(currentText, def.configFormat);
            }
            catch (err) {
                return {
                    success: false,
                    clientId,
                    action: "connect",
                    configPath: plan.configPath,
                    reloadInstructions: plan.reloadInstructions,
                    error: `Cannot apply: existing config cannot be read safely: ${String(err)}`,
                };
            }
        }
        const opts = { ...this.defaultServerOptions, ...(serverOptions || {}) };
        const proposedEntry = def.generateServerConfig(opts);
        const modifiedData = def.insertMadelEntry(currentParsed, proposedEntry);
        const serialized = serializeConfigData(modifiedData, def.configFormat);
        const writeResult = atomicWriteConfigFile({
            filePath: plan.configPath,
            newContent: serialized,
            format: def.configFormat,
            createBackup: true,
        });
        if (!writeResult.success) {
            return {
                success: false,
                clientId,
                action: "connect",
                configPath: plan.configPath,
                backupPath: writeResult.backupPath,
                reloadInstructions: plan.reloadInstructions,
                error: writeResult.error,
            };
        }
        return {
            success: true,
            clientId,
            action: "connect",
            configPath: plan.configPath,
            backupPath: writeResult.backupPath,
            previousHash: writeResult.originalHash,
            newHash: writeResult.newHash,
            reloadInstructions: plan.reloadInstructions,
        };
    }
    /**
     * Plans and dry-runs removal of MADEL Studio Bridge entry from client configuration.
     */
    planDisconnect(clientId, discoveryOpts) {
        const def = this.registry.get(clientId);
        if (!def) {
            throw new Error(`Client '${clientId}' is not registered in MADEL ClientRegistry`);
        }
        const report = discoverClient(def, { ...discoveryOpts, registry: this.registry });
        const configPath = report.configPath || def.getConfigLocations("win32")[0] || "mcp_config.json";
        const configExists = existsSync(configPath);
        const warnings = [];
        if (!configExists) {
            return {
                clientId,
                action: "noop",
                configPath,
                configExists: false,
                format: def.configFormat,
                otherServersPreserved: [],
                diffPreview: "(Config file does not exist; nothing to disconnect)",
                willRequireReload: false,
                reloadInstructions: "None",
                warnings: ["Configuration file does not exist."],
            };
        }
        const currentText = readFileSync(configPath, "utf8");
        const currentParsed = parseConfigText(currentText, def.configFormat);
        const extracted = def.extractMadelEntry(currentParsed);
        if (!extracted.exists) {
            return {
                clientId,
                action: "noop",
                configPath,
                configExists: true,
                format: def.configFormat,
                otherServersPreserved: Object.keys(currentParsed[def.mcpServersKey] || {}),
                diffPreview: "(MADEL entry not found in configuration; no changes required)",
                willRequireReload: false,
                reloadInstructions: "None",
                warnings: ["MADEL entry was not present in this client's configuration."],
            };
        }
        const { data: cleanedData } = def.removeMadelEntry(currentParsed);
        const serversMap = cleanedData[def.mcpServersKey] || {};
        const otherServers = Object.keys(serversMap);
        const currentSerialized = serializeConfigData(currentParsed, def.configFormat);
        const proposedSerialized = serializeConfigData(cleanedData, def.configFormat);
        const diffPreview = generateUnifiedDiffPreview(configPath, currentSerialized, proposedSerialized);
        return {
            clientId,
            action: "disconnect",
            configPath,
            configExists: true,
            format: def.configFormat,
            currentMadelEntry: extracted.entry,
            otherServersPreserved: otherServers,
            diffPreview,
            willRequireReload: true,
            reloadInstructions: def.reloadRequirements,
            warnings,
        };
    }
    /**
     * Applies the disconnection plan and removes the MADEL entry atomically.
     */
    applyDisconnect(clientId, discoveryOpts) {
        const plan = this.planDisconnect(clientId, discoveryOpts);
        if (plan.action === "noop") {
            return {
                success: true,
                clientId,
                action: "disconnect",
                configPath: plan.configPath,
                reloadInstructions: plan.reloadInstructions,
            };
        }
        const def = this.registry.get(clientId);
        const currentText = readFileSync(plan.configPath, "utf8");
        const currentParsed = parseConfigText(currentText, def.configFormat);
        const { data: cleanedData } = def.removeMadelEntry(currentParsed);
        const serialized = serializeConfigData(cleanedData, def.configFormat);
        const writeResult = atomicWriteConfigFile({
            filePath: plan.configPath,
            newContent: serialized,
            format: def.configFormat,
            createBackup: true,
        });
        if (!writeResult.success) {
            return {
                success: false,
                clientId,
                action: "disconnect",
                configPath: plan.configPath,
                backupPath: writeResult.backupPath,
                reloadInstructions: plan.reloadInstructions,
                error: writeResult.error,
            };
        }
        return {
            success: true,
            clientId,
            action: "disconnect",
            configPath: plan.configPath,
            backupPath: writeResult.backupPath,
            previousHash: writeResult.originalHash,
            newHash: writeResult.newHash,
            reloadInstructions: plan.reloadInstructions,
        };
    }
    /**
     * Restores a client's configuration from a backup file.
     */
    restore(clientId, customBackupPath, discoveryOpts) {
        const def = this.registry.get(clientId);
        if (!def) {
            throw new Error(`Client '${clientId}' is not registered`);
        }
        const report = discoverClient(def, { ...discoveryOpts, registry: this.registry });
        const configPath = report.configPath || def.getConfigLocations("win32")[0] || "mcp_config.json";
        const result = restoreConfigFile(configPath, customBackupPath);
        return {
            success: result.success,
            clientId,
            configPath,
            restoredFromBackup: result.restoredPath,
            error: result.error,
        };
    }
}
function generateUnifiedDiffPreview(path, original, proposed) {
    const origLines = original.split(/\r?\n/);
    const propLines = proposed.split(/\r?\n/);
    const diff = [`--- ${path} (current)`, `+++ ${path} (proposed)`];
    const max = Math.max(origLines.length, propLines.length);
    for (let i = 0; i < max; i++) {
        const o = origLines[i];
        const p = propLines[i];
        if (o === p) {
            if (o !== undefined)
                diff.push(`  ${o}`);
        }
        else {
            if (o !== undefined)
                diff.push(`- ${o}`);
            if (p !== undefined)
                diff.push(`+ ${p}`);
        }
    }
    return diff.slice(0, 50).join("\n") + (diff.length > 50 ? `\n... (${diff.length - 50} more lines)` : "");
}
export const globalConfigManager = new ConfigManager();
//# sourceMappingURL=config-manager.js.map