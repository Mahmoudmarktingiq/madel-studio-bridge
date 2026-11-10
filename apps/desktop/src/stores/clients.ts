import { defineStore } from "pinia";
import { ref, computed } from "vue";
import { tauriBridge } from "../services/tauri-bridge";
import type { ClientStatusInfo, PlanResult, ApplyResult } from "../services/types";

export const useClientsStore = defineStore("clients", () => {
  const clientsMap = ref<Record<string, ClientStatusInfo>>({});
  const loading = ref<boolean>(false);
  const error = ref<string | null>(null);
  const selectedKey = ref<string | null>(null);
  const currentPlan = ref<PlanResult | null>(null);
  const isPlanning = ref<boolean>(false);
  const isApplying = ref<boolean>(false);
  const lastApplyResult = ref<ApplyResult | null>(null);

  const clientsList = computed(() => Object.values(clientsMap.value));
  const configuredCount = computed(() => clientsList.value.filter((c) => c.configured).length);
  const installedCount = computed(() => clientsList.value.filter((c) => c.installed).length);

  const selectedClient = computed(() => {
    return selectedKey.value ? clientsMap.value[selectedKey.value] || null : null;
  });

  async function fetchClients(): Promise<void> {
    loading.value = true;
    error.value = null;
    try {
      clientsMap.value = await tauriBridge.getClientsStatus();
    } catch (err: unknown) {
      error.value = err instanceof Error ? err.message : String(err);
    } finally {
      loading.value = false;
    }
  }

  async function selectClient(key: string): Promise<void> {
    selectedKey.value = key;
    currentPlan.value = null;
    lastApplyResult.value = null;
    try {
      const inspected = await tauriBridge.inspectClient(key);
      clientsMap.value[key] = inspected;
    } catch {
      // ignore
    }
  }

  async function planConnect(key: string): Promise<PlanResult | null> {
    isPlanning.value = true;
    error.value = null;
    try {
      const plan = await tauriBridge.planClientConnect(key);
      currentPlan.value = plan;
      return plan;
    } catch (err: unknown) {
      error.value = err instanceof Error ? err.message : String(err);
      return null;
    } finally {
      isPlanning.value = false;
    }
  }

  async function applyConnect(key: string): Promise<ApplyResult> {
    isApplying.value = true;
    error.value = null;
    try {
      const res = await tauriBridge.applyClientConnect(key);
      lastApplyResult.value = res;
      currentPlan.value = null;
      await fetchClients();
      return res;
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      const res: ApplyResult = {
        success: false,
        clientKey: key,
        configPath: "",
        error: message,
      };
      lastApplyResult.value = res;
      return res;
    } finally {
      isApplying.value = false;
    }
  }

  async function planDisconnect(key: string): Promise<PlanResult | null> {
    isPlanning.value = true;
    error.value = null;
    try {
      const plan = await tauriBridge.planClientDisconnect(key);
      currentPlan.value = plan;
      return plan;
    } catch (err: unknown) {
      error.value = err instanceof Error ? err.message : String(err);
      return null;
    } finally {
      isPlanning.value = false;
    }
  }

  async function applyDisconnect(key: string): Promise<ApplyResult> {
    isApplying.value = true;
    error.value = null;
    try {
      const res = await tauriBridge.applyClientDisconnect(key);
      lastApplyResult.value = res;
      currentPlan.value = null;
      await fetchClients();
      return res;
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      const res: ApplyResult = {
        success: false,
        clientKey: key,
        configPath: "",
        error: message,
      };
      lastApplyResult.value = res;
      return res;
    } finally {
      isApplying.value = false;
    }
  }

  async function restoreClient(key: string, backupPath?: string): Promise<ApplyResult> {
    isApplying.value = true;
    error.value = null;
    try {
      const res = await tauriBridge.restoreClient(key, backupPath);
      lastApplyResult.value = res;
      await fetchClients();
      return res;
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      return {
        success: false,
        clientKey: key,
        configPath: "",
        error: message,
      };
    } finally {
      isApplying.value = false;
    }
  }

  function clearPlan(): void {
    currentPlan.value = null;
  }

  return {
    clientsMap,
    clientsList,
    configuredCount,
    installedCount,
    selectedKey,
    selectedClient,
    currentPlan,
    isPlanning,
    isApplying,
    lastApplyResult,
    loading,
    error,
    fetchClients,
    selectClient,
    planConnect,
    applyConnect,
    planDisconnect,
    applyDisconnect,
    restoreClient,
    clearPlan,
  };
});
