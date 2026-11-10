import { defineStore } from "pinia";
import { ref } from "vue";
import { tauriBridge } from "../services/tauri-bridge";
import type { ApprovalTicket } from "../services/types";

export const useApprovalsStore = defineStore("approvals", () => {
  const tickets = ref<ApprovalTicket[]>([]);
  const loading = ref(false);
  const error = ref<string | null>(null);

  async function fetchPendingApprovals(): Promise<void> {
    loading.value = true;
    error.value = null;
    try {
      tickets.value = await tauriBridge.getPendingApprovals();
    } catch (err: unknown) {
      error.value = err instanceof Error ? err.message : String(err);
      tickets.value = [];
    } finally {
      loading.value = false;
    }
  }

  async function approve(ticketId: string): Promise<boolean> {
    loading.value = true;
    try {
      const res = await tauriBridge.approveAction(ticketId);
      if (res.success) {
        tickets.value = tickets.value.filter((t) => t.id !== ticketId);
        return true;
      }
      return false;
    } catch (err: unknown) {
      error.value = err instanceof Error ? err.message : String(err);
      return false;
    } finally {
      loading.value = false;
    }
  }

  async function reject(ticketId: string, reason?: string): Promise<boolean> {
    loading.value = true;
    try {
      const res = await tauriBridge.rejectAction(ticketId, reason);
      if (res.success) {
        tickets.value = tickets.value.filter((t) => t.id !== ticketId);
        return true;
      }
      return false;
    } catch (err: unknown) {
      error.value = err instanceof Error ? err.message : String(err);
      return false;
    } finally {
      loading.value = false;
    }
  }

  return {
    tickets,
    loading,
    error,
    fetchPendingApprovals,
    approve,
    reject,
  };
});
