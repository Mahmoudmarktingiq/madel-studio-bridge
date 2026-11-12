import { defineStore } from "pinia";
import { ref, computed } from "vue";
import { tauriBridge } from "../services/tauri-bridge";
import type { ApplicationInfo } from "../services/types";

export const useAppsStore = defineStore("applications", () => {
  const apps = ref<ApplicationInfo[]>([]);
  const loading = ref<boolean>(false);
  const error = ref<string | null>(null);

  const verifiedApps = computed(() => apps.value.filter((a) => a.status === "supported_and_verified"));
  const configuredApps = computed(() => apps.value.filter((a) => a.status === "configured_not_verified"));
  const plannedApps = computed(() => apps.value.filter((a) => a.status === "planned"));

  async function fetchApps(): Promise<void> {
    loading.value = true;
    error.value = null;
    try {
      apps.value = await tauriBridge.getApplicationsStatus();
    } catch (err: unknown) {
      error.value = err instanceof Error ? err.message : String(err);
    } finally {
      loading.value = false;
    }
  }

  async function stopBrowserSessions(): Promise<void> {
    loading.value = true;
    try {
      await tauriBridge.stopBrowserSessions();
      await fetchApps();
    } catch (err: unknown) {
      error.value = err instanceof Error ? err.message : String(err);
    } finally {
      loading.value = false;
    }
  }

  return {
    apps,
    loading,
    error,
    verifiedApps,
    configuredApps,
    plannedApps,
    fetchApps,
    stopBrowserSessions,
  };
});
