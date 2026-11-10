<script setup lang="ts">
import { onMounted } from "vue";
import { useAppsStore } from "../stores/applications";
import StatusBadge from "../components/StatusBadge.vue";

const appsStore = useAppsStore();

onMounted(() => {
  appsStore.fetchApps();
});
</script>

<template>
  <div class="applications-view">
    <div class="view-header">
      <div>
        <h2 class="view-title">Creative & Production Applications</h2>
        <p class="view-desc">
          Live inspection of host software adapters and MCP protocol connectors.
        </p>
      </div>
      <button class="fluent-btn" :disabled="appsStore.loading" @click="appsStore.fetchApps">
        <span>↻ Rescan Host Apps</span>
      </button>
    </div>

    <div class="apps-grid">
      <div v-for="app in appsStore.apps" :key="app.id" class="app-card fluent-card">
        <div class="card-top">
          <div class="app-header-left">
            <h3 class="app-name">{{ app.name }}</h3>
            <span class="app-category">{{ app.category.toUpperCase() }}</span>
          </div>
          <StatusBadge :status="app.status" :label="app.statusLabel" />
        </div>

        <div class="card-details">
          <div class="detail-row">
            <span class="detail-label">Adapter Layer:</span>
            <span class="detail-val"><code>{{ app.adapter }}</code></span>
          </div>
          <div v-if="app.port" class="detail-row">
            <span class="detail-label">Local Port:</span>
            <span class="detail-val"><code>{{ app.port }}</code></span>
          </div>
          <div v-if="app.pid" class="detail-row">
            <span class="detail-label">Process PID:</span>
            <span class="detail-val"><code>{{ app.pid }}</code></span>
          </div>
          <div class="detail-desc">
            {{ app.details }}
          </div>
        </div>

        <div class="card-footer">
          <!-- Operational controls displayed only if supported & verified -->
          <div v-if="app.canControl" class="control-actions">
            <span class="control-badge-verified">✓ Verified Live</span>
            <button class="fluent-btn fluent-btn-primary" disabled title="Primary Daemon is managed by MCP core watchdog">
              Daemon Active
            </button>
          </div>
          <div v-else class="control-status-note">
            <span v-if="app.status === 'configured_not_verified'" class="note-configured">
              Plugin installed • Launch software to activate
            </span>
            <span v-else-if="app.status === 'planned'" class="note-planned">
              Architecture roadmap phase • Zero stub mocks
            </span>
            <span v-else class="note-detected">
              Detected on host machine
            </span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.applications-view {
  display: flex;
  flex-direction: column;
  gap: 20px;
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

.apps-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(340px, 1fr));
  gap: 16px;
}

.app-card {
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  min-height: 200px;
}

.card-top {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 12px;
  padding-bottom: 10px;
  border-bottom: 1px solid var(--border-subtle);
}

.app-header-left {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.app-name {
  font-size: 14px;
  font-weight: 600;
  color: var(--text-primary);
}

.app-category {
  font-size: 10px;
  font-weight: 700;
  color: var(--text-muted);
  letter-spacing: 0.5px;
}

.card-details {
  display: flex;
  flex-direction: column;
  gap: 6px;
  font-size: 12px;
  flex: 1;
}

.detail-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.detail-label {
  color: var(--text-secondary);
}

.detail-val code {
  color: var(--text-link);
}

.detail-desc {
  margin-top: 6px;
  padding: 8px;
  background: var(--bg-surface);
  border-radius: 6px;
  font-size: 11px;
  color: var(--text-secondary);
  line-height: 1.4;
}

.card-footer {
  margin-top: 14px;
  padding-top: 10px;
  border-top: 1px solid var(--border-subtle);
}

.control-actions {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.control-badge-verified {
  font-size: 11px;
  color: var(--status-success);
  font-weight: 600;
}

.control-status-note {
  font-size: 11px;
}

.note-configured {
  color: var(--status-warning);
}

.note-planned {
  color: var(--text-muted);
  font-style: italic;
}

.note-detected {
  color: var(--text-secondary);
}
</style>
