<script setup lang="ts">
import { onMounted } from "vue";
import { useServersStore } from "../stores/servers";
import StatusBadge from "../components/StatusBadge.vue";

const serversStore = useServersStore();

onMounted(() => {
  serversStore.fetchServers();
});
</script>

<template>
  <div class="servers-view">
    <div class="view-header">
      <div>
        <h2 class="view-title">MCP Servers & IPC Transports</h2>
        <p class="view-desc">
          Live inspection and diagnostic status of all registered MADEL MCP server instances.
        </p>
      </div>
      <button class="fluent-btn" :disabled="serversStore.loading" @click="serversStore.fetchServers">
        <span>↻ Rescan Servers</span>
      </button>
    </div>

    <div class="servers-grid">
      <div v-for="srv in serversStore.servers" :key="srv.id" class="server-card fluent-card">
        <div class="card-header">
          <div>
            <h3 class="server-name">{{ srv.name }}</h3>
            <span class="transport-tag">Transport: {{ srv.transport.toUpperCase() }}</span>
          </div>
          <StatusBadge :status="srv.connectionStatus" :label="srv.connectionStatus" />
        </div>

        <div class="server-body">
          <div class="stat-row">
            <span class="stat-label">Process State:</span>
            <span class="stat-val"><code>{{ srv.processStatus }}</code></span>
          </div>
          <div v-if="srv.pid" class="stat-row">
            <span class="stat-label">Process PID:</span>
            <span class="stat-val"><code>{{ srv.pid }}</code></span>
          </div>
          <div class="stat-row">
            <span class="stat-label">Available Tools:</span>
            <span class="stat-val"><strong>{{ srv.toolsCount }} tools registered</strong></span>
          </div>
          <div v-if="srv.endpoint" class="stat-row">
            <span class="stat-label">Endpoint:</span>
            <span class="stat-val"><code>{{ srv.endpoint }}</code></span>
          </div>

          <div class="diag-box">
            <strong>Diagnostic:</strong> {{ srv.diagnosticResult }}
          </div>
          <div v-if="srv.lastError" class="error-box">
            <strong>Last Error:</strong> {{ srv.lastError }}
          </div>
        </div>

        <div class="card-footer">
          <span class="ownership-tag">Managed by MADEL Supervisor</span>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.servers-view {
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

.servers-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(360px, 1fr));
  gap: 16px;
}

.server-card {
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  min-height: 220px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 12px;
  padding-bottom: 8px;
  border-bottom: 1px solid var(--border-subtle);
}

.server-name {
  font-size: 14px;
  font-weight: 600;
  color: var(--text-primary);
}

.transport-tag {
  font-size: 11px;
  color: var(--text-muted);
}

.server-body {
  display: flex;
  flex-direction: column;
  gap: 6px;
  font-size: 12px;
  flex: 1;
}

.stat-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.stat-label {
  color: var(--text-secondary);
}

.stat-val code {
  color: var(--text-link);
}

.diag-box {
  margin-top: 8px;
  padding: 8px 10px;
  background: var(--bg-surface);
  border-radius: 6px;
  font-size: 11px;
  color: var(--text-secondary);
  line-height: 1.4;
}

.error-box {
  margin-top: 6px;
  padding: 8px 10px;
  background: var(--status-error-bg);
  border-radius: 6px;
  font-size: 11px;
  color: var(--status-error);
}

.card-footer {
  margin-top: 14px;
  padding-top: 8px;
  border-top: 1px solid var(--border-subtle);
  display: flex;
  justify-content: flex-end;
}

.ownership-tag {
  font-size: 10px;
  color: var(--text-muted);
  text-transform: uppercase;
  letter-spacing: 0.5px;
}
</style>
