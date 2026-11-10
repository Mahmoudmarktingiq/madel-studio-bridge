import { defineStore } from "pinia";
import { ref, computed } from "vue";
import { tauriBridge } from "../services/tauri-bridge";
import type { GatewayStatus } from "../services/types";

export const useGatewayStore = defineStore("gateway", () => {
  const status = ref<GatewayStatus | null>(null);
  const loading = ref<boolean>(false);
  const error = ref<string | null>(null);
  const lastUpdated = ref<Date | null>(null);

  const isRunning = computed(() => status.value?.state === "RUNNING");
  const stateLabel = computed(() => status.value?.state || "DISCONNECTED");

  const metrics = computed(() => {
    return status.value?.metrics || {
      activeRequests: 0,
      pendingRequests: 0,
      completedRequests: 0,
      failedRequests: 0,
      cancelledRequests: 0,
      timeoutRequests: 0,
      averageQueueWaitMs: 0,
      averageExecutionMs: 0,
      resourceQueueDepths: {},
    };
  });

  async function fetchStatus(): Promise<void> {
    loading.value = true;
    error.value = null;
    try {
      status.value = await tauriBridge.getGatewayStatus();
      lastUpdated.value = new Date();
    } catch (err: unknown) {
      error.value = err instanceof Error ? err.message : String(err);
      status.value = {
        state: "UNAVAILABLE",
        reason: error.value,
        daemon: {
          isAlive: false,
          namedPipe: "\\\\.\\pipe\\brainferno-mcp-bridge",
          handshakePath: "",
        },
        metrics: {
          activeRequests: 0,
          pendingRequests: 0,
          completedRequests: 0,
          failedRequests: 0,
          cancelledRequests: 0,
          timeoutRequests: 0,
          averageQueueWaitMs: 0,
          averageExecutionMs: 0,
          resourceQueueDepths: {},
        },
        serverVersion: "0.4.0",
        timestamp: new Date().toISOString(),
      };
    } finally {
      loading.value = false;
    }
  }

  return {
    status,
    loading,
    error,
    lastUpdated,
    isRunning,
    stateLabel,
    metrics,
    fetchStatus,
  };
});
