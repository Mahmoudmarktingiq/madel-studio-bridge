<script setup lang="ts">
import { onMounted } from "vue";
import { useApprovalsStore } from "../stores/approvals";

const emit = defineEmits<{
  (e: "close"): void;
}>();

const approvalsStore = useApprovalsStore();

onMounted(() => {
  approvalsStore.fetchPendingApprovals();
});

const handleApprove = async (ticketId: string) => {
  await approvalsStore.approve(ticketId);
};

const handleReject = async (ticketId: string) => {
  await approvalsStore.reject(ticketId, "Operator cancelled from Desktop");
};
</script>

<template>
  <div class="modal-backdrop" @click.self="emit('close')">
    <div class="modal-card">
      <div class="modal-header">
        <div class="header-left">
          <span class="shield-badge">🛡️ Action Approval Gate</span>
          <h2 class="modal-title">Pending Human Authorization Requests</h2>
        </div>
        <button class="close-btn" @click="emit('close')">✕</button>
      </div>

      <div class="modal-body">
        <p class="body-intro">
          The following operations were requested by connected AI clients and require out-of-band operator authorization before execution.
        </p>

        <div v-if="approvalsStore.loading && approvalsStore.tickets.length === 0" class="empty-state">
          Loading pending tickets...
        </div>

        <div v-else-if="approvalsStore.tickets.length === 0" class="empty-state">
          <span class="empty-icon">✓</span>
          <p>No actions currently pending approval.</p>
        </div>

        <div v-else class="tickets-list">
          <div v-for="ticket in approvalsStore.tickets" :key="ticket.id" class="ticket-card">
            <div class="ticket-header">
              <div class="ticket-title-block">
                <span class="op-badge" :class="ticket.operationType">{{ ticket.operationType }}</span>
                <strong class="tool-name">{{ ticket.toolName }}</strong>
              </div>
              <span class="ticket-id">{{ ticket.id }}</span>
            </div>

            <p class="ticket-summary">{{ ticket.summary }}</p>

            <div class="ticket-details-box">
              <pre><code>{{ JSON.stringify(ticket.details, null, 2) }}</code></pre>
            </div>

            <div class="ticket-actions">
              <span class="expiry-label">Expires: {{ new Date(ticket.expiresAt).toLocaleTimeString() }}</span>
              <div class="action-buttons">
                <button class="btn-reject" :disabled="approvalsStore.loading" @click="handleReject(ticket.id)">
                  Reject
                </button>
                <button class="btn-approve" :disabled="approvalsStore.loading" @click="handleApprove(ticket.id)">
                  Approve (Single Use)
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div class="modal-footer">
        <button class="fluent-btn btn-refresh" @click="approvalsStore.fetchPendingApprovals">
          ↻ Refresh
        </button>
        <div class="footer-spacer"></div>
        <button class="fluent-btn btn-close" @click="emit('close')">
          Close
        </button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.modal-backdrop {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.75);
  backdrop-filter: blur(4px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.modal-card {
  width: 740px;
  max-width: 95vw;
  max-height: 85vh;
  background: var(--bg-secondary);
  border: 1px solid var(--border-subtle);
  border-radius: 12px;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  box-shadow: 0 16px 40px rgba(0, 0, 0, 0.6);
}

.modal-header {
  padding: 16px 24px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-bottom: 1px solid var(--border-subtle);
}

.shield-badge {
  font-size: 11px;
  color: #f59e0b;
  font-weight: 600;
  text-transform: uppercase;
}

.modal-title {
  margin: 4px 0 0;
  font-size: 18px;
  font-weight: 600;
}

.close-btn {
  background: none;
  border: none;
  font-size: 18px;
  cursor: pointer;
  color: var(--text-muted);
}

.modal-body {
  padding: 24px;
  overflow-y: auto;
  flex: 1;
}

.body-intro {
  margin: 0 0 16px;
  font-size: 13px;
  color: var(--text-muted);
}

.empty-state {
  text-align: center;
  padding: 40px 0;
  color: var(--text-muted);
}

.empty-icon {
  font-size: 36px;
  color: #10b981;
  display: block;
  margin-bottom: 8px;
}

.tickets-list {
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.ticket-card {
  background: var(--bg-primary);
  border: 1px solid var(--border-subtle);
  border-radius: 8px;
  padding: 16px;
}

.ticket-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}

.ticket-title-block {
  display: flex;
  align-items: center;
  gap: 10px;
}

.op-badge {
  font-size: 11px;
  padding: 2px 8px;
  border-radius: 4px;
  text-transform: uppercase;
  font-weight: 600;
}

.op-badge.destructive { background: rgba(239, 68, 68, 0.2); color: #ef4444; }
.op-badge.render { background: rgba(245, 158, 11, 0.2); color: #f59e0b; }
.op-badge.upload { background: rgba(59, 130, 246, 0.2); color: #3b82f6; }
.op-badge.config { background: rgba(168, 85, 247, 0.2); color: #a855f7; }

.tool-name {
  font-size: 15px;
}

.ticket-id {
  font-family: monospace;
  font-size: 11px;
  color: var(--text-muted);
}

.ticket-summary {
  margin: 0 0 10px;
  font-size: 13px;
}

.ticket-details-box {
  background: #0f172a;
  border-radius: 6px;
  padding: 10px;
  max-height: 120px;
  overflow-y: auto;
  margin-bottom: 12px;
}

.ticket-details-box pre {
  margin: 0;
  font-family: monospace;
  font-size: 11px;
  color: #cbd5e1;
}

.ticket-actions {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.expiry-label {
  font-size: 11px;
  color: var(--text-muted);
}

.action-buttons {
  display: flex;
  gap: 8px;
}

.btn-reject {
  background: transparent;
  border: 1px solid var(--border-subtle);
  color: #ef4444;
  padding: 6px 14px;
  border-radius: 6px;
  font-size: 12px;
  cursor: pointer;
}

.btn-approve {
  background: #10b981;
  border: none;
  color: white;
  padding: 6px 14px;
  border-radius: 6px;
  font-size: 12px;
  cursor: pointer;
  font-weight: 600;
}

.btn-approve:hover {
  filter: brightness(1.1);
}

.modal-footer {
  padding: 14px 24px;
  display: flex;
  align-items: center;
  border-top: 1px solid var(--border-subtle);
  background: var(--bg-primary);
}

.footer-spacer {
  flex: 1;
}

.fluent-btn {
  padding: 7px 16px;
  border-radius: 6px;
  font-size: 13px;
  cursor: pointer;
  border: 1px solid var(--border-subtle);
  background: var(--bg-secondary);
  color: var(--text-primary);
}
</style>
