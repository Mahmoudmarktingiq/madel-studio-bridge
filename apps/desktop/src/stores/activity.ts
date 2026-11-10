import { defineStore } from "pinia";
import { ref, computed } from "vue";
import { tauriBridge } from "../services/tauri-bridge";
import type { ActivityLogEntry } from "../services/types";

export const useActivityStore = defineStore("activity", () => {
  const logs = ref<ActivityLogEntry[]>([]);
  const loading = ref<boolean>(false);
  const error = ref<string | null>(null);

  const selectedAppFilter = ref<string>("all");
  const selectedSeverityFilter = ref<string>("all");
  const searchQuery = ref<string>("");

  const filteredLogs = computed(() => {
    return logs.value.filter((log) => {
      if (selectedAppFilter.value !== "all" && log.application !== selectedAppFilter.value) {
        return false;
      }
      if (selectedSeverityFilter.value !== "all" && log.severity !== selectedSeverityFilter.value) {
        return false;
      }
      if (searchQuery.value.trim() !== "") {
        const q = searchQuery.value.toLowerCase();
        return (
          log.message.toLowerCase().includes(q) ||
          log.correlationId.toLowerCase().includes(q) ||
          (log.toolName && log.toolName.toLowerCase().includes(q))
        );
      }
      return true;
    });
  });

  async function fetchLogs(): Promise<void> {
    loading.value = true;
    error.value = null;
    try {
      logs.value = await tauriBridge.getActivityLogs();
    } catch (err: unknown) {
      error.value = err instanceof Error ? err.message : String(err);
    } finally {
      loading.value = false;
    }
  }

  function getDiagnosticReport(): string {
    const lines = [
      `=== MADEL STUDIO BRIDGE DIAGNOSTIC ACTIVITY LOG ===`,
      `Generated at: ${new Date().toISOString()}`,
      `Total Log Entries: ${logs.value.length}`,
      `----------------------------------------------------`,
    ];
    for (const log of logs.value) {
      lines.push(
        `[${log.timestamp}] [${log.severity.toUpperCase()}] [${log.application}] [corr:${log.correlationId}]: ${log.message}`
      );
    }
    return lines.join("\n");
  }

  return {
    logs,
    loading,
    error,
    selectedAppFilter,
    selectedSeverityFilter,
    searchQuery,
    filteredLogs,
    fetchLogs,
    getDiagnosticReport,
  };
});
