import { describe, it, expect, beforeEach } from "vitest";
import { setActivePinia, createPinia } from "pinia";
import { useSettingsStore } from "../stores/settings";
import { useGatewayStore } from "../stores/gateway";
import { useClientsStore } from "../stores/clients";

describe("Desktop Dashboard Pinia Stores", () => {
  beforeEach(() => {
    setActivePinia(createPinia());
  });

  it("SettingsStore initializes with dark theme and toggles correctly", () => {
    const settings = useSettingsStore();
    expect(settings.theme).toBe("dark");

    settings.toggleTheme();
    expect(settings.theme).toBe("light");

    settings.toggleTheme();
    expect(settings.theme).toBe("dark");
  });

  it("SettingsStore handles language switching and theme attributes", () => {
    const settings = useSettingsStore();
    expect(settings.language).toBe("en");

    settings.setLanguage("ar");
    expect(settings.language).toBe("ar");

    settings.setLanguage("en");
    expect(settings.language).toBe("en");
  });

  it("GatewayStore initializes with null status and default state", () => {
    const gateway = useGatewayStore();
    expect(gateway.status).toBeNull();
    expect(gateway.loading).toBe(false);
    expect(gateway.error).toBeNull();
    expect(gateway.isRunning).toBe(false);
    expect(gateway.stateLabel).toBe("DISCONNECTED");
    expect(gateway.metrics.activeRequests).toBe(0);
  });

  it("ClientsStore parses and filters client lists cleanly", () => {
    const clients = useClientsStore();
    expect(clients.clientsList).toEqual([]);
    expect(clients.configuredCount).toBe(0);
    expect(clients.installedCount).toBe(0);

    // Mock client addition
    clients.clientsMap["claude-code"] = {
      key: "claude-code",
      name: "Claude Code CLI",
      installed: true,
      configured: false,
      connected: false,
      status: "installed",
      format: "json",
      transport: "stdio",
      configPath: "C:\\Users\\asus\\.claude.json",
    };

    clients.clientsMap["photoshop-mcp"] = {
      key: "photoshop-mcp",
      name: "Photoshop MCP",
      installed: true,
      configured: true,
      connected: true,
      status: "connected",
      format: "json",
      transport: "stdio",
      configPath: "C:\\Users\\asus\\.mcp.json",
    };

    expect(clients.clientsList.length).toBe(2);
    expect(clients.configuredCount).toBe(1);
    expect(clients.installedCount).toBe(2);
  });
});
