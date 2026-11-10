#!/usr/bin/env node
/**
 * MADEL Studio Bridge — AI Client Management CLI
 * Developed & Maintained by Mahmoud Adel
 * Unified CLI interface for discovering, inspecting, and managing AI client configurations
 */
import { globalConfigManager } from "./config-manager.js";
import { globalClientRegistry } from "./registry.js";
import { ClientStatus } from "./types.js";
function printHelp() {
    console.log(`
MADEL Studio Bridge — AI Client Manager CLI
Developed & Maintained by Mahmoud Adel

USAGE:
  madel clients <subcommand> [arguments] [options]

SUBCOMMANDS:
  list                  List all supported AI clients in the registry
  detect                Detect installed and configured AI clients on this machine
  inspect <id>          Inspect detailed configuration state of a specific client
  plan <id> [action]    Preview changes for connecting or disconnecting MADEL (Dry Run)
  connect <id> [--yes]  Connect MADEL Studio Bridge to target client configuration
  disconnect <id> [--yes] Disconnect MADEL Studio Bridge from target client
  backup <id>           Create an immediate timestamped backup of client configuration
  restore <id> [file]   Restore client configuration from latest or specific backup
  verify <id>           Verify configuration integrity and transport readiness

EXAMPLES:
  node dist/clients/cli.js list
  node dist/clients/cli.js detect
  node dist/clients/cli.js inspect claude-code
  node dist/clients/cli.js plan claude-code connect
  node dist/clients/cli.js connect claude-code --yes
`);
}
export async function runClientsCli(args) {
    const subcommand = args[0] || "help";
    const targetId = args[1];
    switch (subcommand) {
        case "list": {
            console.log("\nSupported AI Clients in MADEL Registry:");
            console.log("------------------------------------------------------------");
            const clients = globalConfigManager.listClients();
            for (const c of clients) {
                console.log(`- ${c.id.padEnd(20)} | ${c.displayName.padEnd(25)} | [${c.format.toUpperCase()}]`);
            }
            console.log(`\nTotal: ${clients.length} clients registered.\n`);
            return 0;
        }
        case "detect": {
            console.log("\nScanning system for installed and configured AI clients...");
            console.log("--------------------------------------------------------------------------------");
            const reports = globalConfigManager.detect();
            for (const r of reports) {
                const statusTag = formatStatus(r.status);
                const configuredTag = r.isMadelConfigured ? "[MADEL CONNECTED]" : "[NOT CONNECTED]";
                console.log(`* ${r.clientId.padEnd(18)} : ${statusTag.padEnd(16)} | ${configuredTag.padEnd(18)} | ${r.configPath || "no config found"}`);
            }
            console.log("--------------------------------------------------------------------------------\n");
            return 0;
        }
        case "inspect": {
            if (!targetId) {
                console.error("Error: Client ID is required. Example: madel clients inspect claude-code");
                return 1;
            }
            if (!globalClientRegistry.has(targetId)) {
                console.error(`Error: Unknown client '${targetId}'. Run 'madel clients list' to view registered IDs.`);
                return 1;
            }
            const details = globalConfigManager.inspect(targetId);
            console.log(`\n=== Client Details: ${details.displayName} (${details.clientId}) ===`);
            console.log(`Status            : ${details.status.toUpperCase()}`);
            console.log(`Installed         : ${details.installed ? "YES" : "NO"}`);
            console.log(`Process Running   : ${details.running ? "YES" : "NO"}`);
            console.log(`Config Path       : ${details.configPath || "None"}`);
            console.log(`Config Exists     : ${details.configExists ? "YES" : "NO"}`);
            console.log(`MADEL Configured  : ${details.isMadelConfigured ? "YES" : "NO"}`);
            console.log(`Config Format     : ${details.definition.configFormat.toUpperCase()}`);
            console.log(`Supported Transports: ${details.definition.supportedTransports.join(", ")}`);
            console.log(`Reload Requirement: ${details.definition.reloadRequirements}`);
            if (details.rawConfigSummary?.otherMcpServers && details.rawConfigSummary.otherMcpServers.length > 0) {
                console.log(`Other MCP Servers : ${details.rawConfigSummary.otherMcpServers.join(", ")}`);
            }
            console.log("");
            return 0;
        }
        case "plan": {
            if (!targetId) {
                console.error("Error: Client ID is required. Example: madel clients plan claude-code connect");
                return 1;
            }
            const action = (args[2] || "connect").toLowerCase();
            if (action !== "connect" && action !== "disconnect") {
                console.error("Error: Action must be 'connect' or 'disconnect'.");
                return 1;
            }
            console.log(`\n[DRY RUN] Planning ${action.toUpperCase()} for client '${targetId}'...`);
            const plan = action === "connect" ? globalConfigManager.planConnect(targetId) : globalConfigManager.planDisconnect(targetId);
            console.log(`Target Config File : ${plan.configPath}`);
            console.log(`Format             : ${plan.format.toUpperCase()}`);
            console.log(`Preserved Servers  : ${plan.otherServersPreserved.join(", ") || "(none)"}`);
            console.log(`Reload Requirement : ${plan.reloadInstructions}`);
            console.log("\nProposed Changes Diff Preview:");
            console.log("------------------------------------------------------------");
            console.log(plan.diffPreview);
            console.log("------------------------------------------------------------");
            console.log("This was a Dry Run. No files were modified.");
            console.log(`To apply these changes, run: madel clients ${action} ${targetId} --yes\n`);
            return 0;
        }
        case "connect": {
            if (!targetId) {
                console.error("Error: Client ID is required. Example: madel clients connect claude-code --yes");
                return 1;
            }
            const force = args.includes("--yes") || args.includes("-y") || args.includes("--force");
            if (!force) {
                console.log(`Safety Gate: Modifying '${targetId}' configuration requires confirmation.`);
                console.log(`To preview changes first:  madel clients plan ${targetId} connect`);
                console.log(`To apply changes directly: madel clients connect ${targetId} --yes\n`);
                return 1;
            }
            console.log(`Connecting MADEL Studio Bridge to client '${targetId}'...`);
            const res = globalConfigManager.applyConnect(targetId);
            if (!res.success) {
                console.error(`FAILED: ${res.error}`);
                return 1;
            }
            console.log(`SUCCESS: MADEL Studio Bridge configured for ${targetId}!`);
            console.log(`Config Updated     : ${res.configPath}`);
            if (res.backupPath)
                console.log(`Backup Created     : ${res.backupPath}`);
            console.log(`Reload Requirement : ${res.reloadInstructions}\n`);
            return 0;
        }
        case "disconnect": {
            if (!targetId) {
                console.error("Error: Client ID is required. Example: madel clients disconnect claude-code --yes");
                return 1;
            }
            const force = args.includes("--yes") || args.includes("-y") || args.includes("--force");
            if (!force) {
                console.log(`Safety Gate: Removing MADEL entry from '${targetId}' requires confirmation.`);
                console.log(`To preview removal first:  madel clients plan ${targetId} disconnect`);
                console.log(`To apply removal directly: madel clients disconnect ${targetId} --yes\n`);
                return 1;
            }
            console.log(`Disconnecting MADEL Studio Bridge from client '${targetId}'...`);
            const res = globalConfigManager.applyDisconnect(targetId);
            if (!res.success) {
                console.error(`FAILED: ${res.error}`);
                return 1;
            }
            console.log(`SUCCESS: MADEL Studio Bridge removed from ${targetId}!`);
            console.log(`Config Updated     : ${res.configPath}`);
            if (res.backupPath)
                console.log(`Backup Created     : ${res.backupPath}\n`);
            return 0;
        }
        case "restore": {
            if (!targetId) {
                console.error("Error: Client ID is required. Example: madel clients restore claude-code");
                return 1;
            }
            const customBackup = args[2];
            const res = globalConfigManager.restore(targetId, customBackup);
            if (!res.success) {
                console.error(`Restore failed: ${res.error}`);
                return 1;
            }
            console.log(`SUCCESS: Restored configuration for ${targetId} from ${res.restoredFromBackup}\n`);
            return 0;
        }
        case "verify": {
            if (!targetId) {
                console.error("Error: Client ID is required.");
                return 1;
            }
            const details = globalConfigManager.inspect(targetId);
            console.log(`\nVerifying Client Integrity: ${details.displayName}`);
            console.log(`Platform Compatible : ${details.isPlatformSupported ? "PASS" : "FAIL"}`);
            console.log(`Installation State  : ${details.installed ? "PASS (Found)" : "FAIL (Not Installed)"}`);
            console.log(`Configuration State : ${details.configExists ? "PASS (Found)" : "NOT FOUND"}`);
            console.log(`MADEL Connection    : ${details.isMadelConfigured ? "PASS (Configured)" : "NOT CONFIGURED"}`);
            console.log("");
            return 0;
        }
        case "help":
        default:
            printHelp();
            return 0;
    }
}
function formatStatus(status) {
    switch (status) {
        case ClientStatus.CONFIGURED:
            return "[CONFIGURED]";
        case ClientStatus.INSTALLED:
            return "[INSTALLED]";
        case ClientStatus.NOT_INSTALLED:
            return "[NOT INSTALLED]";
        case ClientStatus.UNSUPPORTED:
            return "[UNSUPPORTED]";
        default:
            return `[${status.toUpperCase()}]`;
    }
}
// Allow direct execution
if (process.argv[1] && process.argv[1].endsWith("cli.js")) {
    runClientsCli(process.argv.slice(2)).then((code) => {
        if (code !== 0)
            process.exit(code);
    });
}
//# sourceMappingURL=cli.js.map