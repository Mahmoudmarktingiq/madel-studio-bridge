<script setup lang="ts">
import { ref, onMounted, computed } from "vue";
import { useClientsStore } from "../stores/clients";
import StatusBadge from "../components/StatusBadge.vue";
import DiffViewer from "../components/DiffViewer.vue";
import ConfirmModal from "../components/ConfirmModal.vue";

const clientsStore = useClientsStore();

const filterType = ref<"all" | "configured" | "installed">("all");
const isModalOpen = ref<boolean>(false);
const pendingAction = ref<"connect" | "disconnect" | null>(null);
const targetClientKey = ref<string>("");

onMounted(() => {
  clientsStore.fetchClients();
});

const filteredClients = computed(() => {
  return clientsStore.clientsList.filter((c) => {
    if (filterType.value === "configured") return c.configured;
    if (filterType.value === "installed") return c.installed;
    return true;
  });
});

const handlePlanConnect = async (key: string) => {
  targetClientKey.value = key;
  pendingAction.value = "connect";
  const plan = await clientsStore.planConnect(key);
  if (plan) {
    isModalOpen.value = true;
  }
};

const handlePlanDisconnect = async (key: string) => {
  targetClientKey.value = key;
  pendingAction.value = "disconnect";
  const plan = await clientsStore.planDisconnect(key);
  if (plan) {
    isModalOpen.value = true;
  }
};

const handleConfirmApply = async () => {
  if (pendingAction.value === "connect") {
    await clientsStore.applyConnect(targetClientKey.value);
  } else if (pendingAction.value === "disconnect") {
    await clientsStore.applyDisconnect(targetClientKey.value);
  }
  isModalOpen.value = false;
  pendingAction.value = null;
};

const handleCancelModal = () => {
  isModalOpen.value = false;
  pendingAction.value = null;
  clientsStore.clearPlan();
};
</script>

<template>
  <div class="clients-view">
    <div class="view-header">
      <div>
        <h2 class="view-title">Unified AI Client Manager (P18 Subsystem)</h2>
        <p class="view-desc">
          Declarative registry and atomic configuration manager supporting 17 AI clients.
        </p>
      </div>

      <div class="header-actions">
        <button class="fluent-btn" :disabled="clientsStore.loading" @click="clientsStore.fetchClients">
          <span>↻ Scan Clients</span>
        </button>
      </div>
    </div>

    <!-- Feedback Banner after apply -->
    <div v-if="clientsStore.lastApplyResult" class="apply-banner" :class="clientsStore.lastApplyResult.success ? 'banner-success' : 'banner-error'">
      <div v-if="clientsStore.lastApplyResult.success">
        <strong>Success:</strong> Configuration updated atomically for <code>{{ clientsStore.lastApplyResult.clientKey }}</code>.
        <div v-if="clientsStore.lastApplyResult.backupPath" class="backup-note">
          Timestamped backup created: <code>{{ clientsStore.lastApplyResult.backupPath }}</code>
        </div>
      </div>
      <div v-else>
        <strong>Failed:</strong> {{ clientsStore.lastApplyResult.error }}
      </div>
    </div>

    <!-- Filters Bar -->
    <div class="filters-bar">
      <div class="filter-buttons">
        <button
          class="fluent-btn filter-btn"
          :class="{ active: filterType === 'all' }"
          @click="filterType = 'all'"
        >
          All Clients ({{ clientsStore.clientsList.length }})
        </button>
        <button
          class="fluent-btn filter-btn"
          :class="{ active: filterType === 'configured' }"
          @click="filterType = 'configured'"
        >
          Configured ({{ clientsStore.configuredCount }})
        </button>
        <button
          class="fluent-btn filter-btn"
          :class="{ active: filterType === 'installed' }"
          @click="filterType = 'installed'"
        >
          Installed ({{ clientsStore.installedCount }})
        </button>
      </div>
    </div>

    <!-- Clients Table -->
    <div class="fluent-card no-padding">
      <div class="clients-table">
        <div class="table-header">
          <span class="col-name">Client Name</span>
          <span class="col-status">Status</span>
          <span class="col-format">Format</span>
          <span class="col-transport">Transport</span>
          <span class="col-path">Configuration Path</span>
          <span class="col-actions">Safe Actions</span>
        </div>

        <div v-for="client in filteredClients" :key="client.key" class="table-row">
          <div class="col-name">
            <strong>{{ client.name }}</strong>
            <span class="client-key"><code>{{ client.key }}</code></span>
          </div>

          <div class="col-status">
            <StatusBadge :status="client.status" :label="client.status" />
          </div>

          <div class="col-format">
            <span class="format-badge">{{ (client.format || 'JSON').toUpperCase() }}</span>
          </div>

          <div class="col-transport">
            <code>{{ client.transport || 'stdio' }}</code>
          </div>

          <div class="col-path">
            <code class="path-text" :title="client.configPath">{{ client.configPath || 'N/A' }}</code>
          </div>

          <div class="col-actions">
            <!-- Connect Action -->
            <button
              v-if="!client.configured"
              class="fluent-btn fluent-btn-primary action-btn"
              :disabled="clientsStore.isPlanning"
              @click="handlePlanConnect(client.key)"
            >
              Preview Connect
            </button>

            <!-- Disconnect Action -->
            <button
              v-if="client.configured"
              class="fluent-btn fluent-btn-danger action-btn"
              :disabled="clientsStore.isPlanning"
              @click="handlePlanDisconnect(client.key)"
            >
              Preview Disconnect
            </button>

            <!-- Inspect Action -->
            <button
              class="fluent-btn action-btn"
              @click="clientsStore.selectClient(client.key)"
              title="Inspect configuration file status"
            >
              Inspect
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Confirmation Modal with Diff Preview -->
    <ConfirmModal
      :is-open="isModalOpen"
      :title="pendingAction === 'connect' ? 'Confirm Connect — Atomic Configuration Update' : 'Confirm Disconnect — Safe Configuration Revert'"
      :confirm-text="pendingAction === 'connect' ? 'Apply Connection (with Backup)' : 'Apply Disconnect (with Backup)'"
      :is-processing="clientsStore.isApplying"
      @confirm="handleConfirmApply"
      @cancel="handleCancelModal"
    >
      <div v-if="clientsStore.currentPlan">
        <div class="modal-notice">
          <strong>Mandatory Safety Guarantee:</strong>
          A timestamped <code>.bak</code> backup will be created before modifying the file. Pre-existing third-party MCP servers are 100% preserved.
        </div>
        <DiffViewer :plan="clientsStore.currentPlan" />
      </div>
    </ConfirmModal>
  </div>
</template>

<style scoped>
.clients-view {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.view-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.view-title {
  font-size: 16px;
  font-weight: 700;
  color: var(--text-primary);
}

.view-desc {
  font-size: 12px;
  color: var(--text-muted);
}

.apply-banner {
  padding: 12px 16px;
  border-radius: 6px;
  font-size: 13px;
}

.banner-success {
  background: var(--status-success-bg);
  border: 1px solid var(--status-success);
  color: var(--text-primary);
}

.banner-error {
  background: var(--status-error-bg);
  border: 1px solid var(--status-error);
  color: var(--text-primary);
}

.backup-note {
  font-size: 11px;
  margin-top: 4px;
  color: var(--text-secondary);
}

.filters-bar {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.filter-buttons {
  display: flex;
  gap: 8px;
}

.filter-btn {
  padding: 5px 12px;
  font-size: 12px;
}

.filter-btn.active {
  background: var(--bg-surface);
  border-color: var(--accent-primary);
  color: var(--accent-primary);
  font-weight: 600;
}

.no-padding {
  padding: 0;
  overflow: hidden;
}

.clients-table {
  width: 100%;
}

.table-header,
.table-row {
  display: grid;
  grid-template-columns: 160px 120px 60px 60px minmax(100px, 1fr) 220px;
  padding: 10px 14px;
  align-items: center;
  font-size: 12px;
  gap: 8px;
}

.table-header {
  background: var(--bg-surface);
  font-weight: 600;
  color: var(--text-secondary);
  border-bottom: 1px solid var(--border-subtle);
}

.table-row {
  border-bottom: 1px solid var(--border-subtle);
}

.table-row:last-child {
  border-bottom: none;
}

.col-name {
  display: flex;
  flex-direction: column;
}

.client-key {
  font-size: 11px;
  color: var(--text-muted);
}

.format-badge {
  display: inline-block;
  padding: 2px 5px;
  border-radius: 4px;
  background: var(--bg-surface);
  font-size: 10px;
  font-weight: 700;
  color: var(--text-secondary);
}

.col-path {
  min-width: 0;
  overflow: hidden;
}

.path-text {
  font-size: 11px;
  color: var(--text-muted);
  display: block;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  max-width: 100%;
}

.col-actions {
  display: flex;
  gap: 8px;
  justify-content: flex-end;
}

.action-btn {
  padding: 4px 8px;
  font-size: 11px;
}

.modal-notice {
  background: var(--status-info-bg);
  color: var(--text-primary);
  padding: 10px 14px;
  border-radius: 6px;
  font-size: 12px;
  margin-bottom: 14px;
}
</style>
