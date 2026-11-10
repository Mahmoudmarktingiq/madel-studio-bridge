import { defineStore } from "pinia";
import { ref } from "vue";
import { tauriBridge } from "../services/tauri-bridge";
import type { ServerInfo } from "../services/types";

export const useServersStore = defineStore("servers", () => {
  const servers = ref<ServerInfo[]>([]);
  const loading = ref<boolean>(false);
  const error = ref<string | null>(null);

  async function fetchServers(): Promise<void> {
    loading.value = true;
    error.value = null;
    try {
      servers.value = await tauriBridge.getServersStatus();
    } catch (err: unknown) {
      error.value = err instanceof Error ? err.message : String(err);
    } finally {
      loading.value = false;
    }
  }

  return {
    servers,
    loading,
    error,
    fetchServers,
  };
});
