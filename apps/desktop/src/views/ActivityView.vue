<script setup lang="ts">
import { ref, onMounted } from "vue";
import { useActivityStore } from "../stores/activity";

const activityStore = useActivityStore();
const copied = ref<boolean>(false);

onMounted(() => {
  activityStore.fetchLogs();
});

const handleCopyReport = async () => {
  const report = activityStore.getDiagnosticReport();
  if (navigator?.clipboard) {
    await navigator.clipboard.writeText(report);
    copied.value = true;
    setTimeout(() => {
      copied.value = false;
    }, 2500);
  }
};
</script>

<template>
  <div class="activity-view">
    <div class="view-header">
      <div>
        <h2 class="view-title">Activity & Audit Logs</h2>
        <p class="view-desc">
          Structured log streams with correlation ID tracking and automatic secret sanitization.
        </p>
      </div>

      <div class="header-actions">
        <button class="fluent-btn" @click="handleCopyReport">
          <span>{{ copied ? '✓ Copied to Clipboard!' : '📋 Copy Diagnostic Report' }}</span>
        </button>
        <button class="fluent-btn" :disabled="activityStore.loading" @click="activityStore.fetchLogs">
          <span>↻ Refresh Logs</span>
        </button>
      </div>
    </div>

    <!-- Filters Bar -->
    <div class="fluent-card filters-card">
      <div class="filter-group">
        <label>Filter by Application:</label>
        <select v-model="activityStore.selectedAppFilter" class="fluent-select">
          <option value="all">All Applications</option>
          <option value="photoshop">Photoshop</option>
          <option value="gateway">Gateway</option>
          <option value="clients">Clients</option>
          <option value="desktop">Desktop UI</option>
        </select>
      </div>

      <div class="filter-group">
        <label>Filter by Severity:</label>
        <select v-model="activityStore.selectedSeverityFilter" class="fluent-select">
          <option value="all">All Severities</option>
          <option value="audit">Audit Only</option>
          <option value="info">Info</option>
          <option value="warn">Warning</option>
          <option value="error">Error</option>
        </select>
      </div>

      <div class="filter-group search-group">
        <label>Search Correlation ID / Keywords:</label>
        <input
          v-model="activityStore.searchQuery"
          type="text"
          placeholder="e.g. corr-init-001 or connected_apps"
          class="fluent-input"
        />
      </div>
    </div>

    <!-- Logs Table -->
    <div class="fluent-card no-padding">
      <div class="logs-table">
        <div class="table-header">
          <span class="col-time">Timestamp</span>
          <span class="col-sev">Severity</span>
          <span class="col-app">Application</span>
          <span class="col-client">Client</span>
          <span class="col-corr">Correlation ID</span>
          <span class="col-dur">Duration</span>
          <span class="col-msg">Message & Redacted Audit</span>
        </div>

        <div v-if="activityStore.filteredLogs.length === 0" class="empty-state">
          No log records matched the current filters.
        </div>

        <div v-for="log in activityStore.filteredLogs" :key="log.id" class="table-row">
          <span class="col-time">{{ log.timestamp.split('T')[1]?.substring(0, 8) }}</span>
          <span class="col-sev">
            <span class="sev-tag" :class="`sev-${log.severity}`">{{ log.severity }}</span>
          </span>
          <span class="col-app">{{ log.application }}</span>
          <span class="col-client">{{ log.client }}</span>
          <span class="col-corr"><code>{{ log.correlationId }}</code></span>
          <span class="col-dur">{{ log.durationMs !== undefined ? `${log.durationMs}ms` : '—' }}</span>
          <span class="col-msg">{{ log.message }}</span>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.activity-view {
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

.header-actions {
  display: flex;
  gap: 10px;
}

.filters-card {
  display: flex;
  gap: 20px;
  align-items: center;
  padding: 12px 16px;
}

.filter-group {
  display: flex;
  flex-direction: column;
  gap: 4px;
  font-size: 11px;
  color: var(--text-secondary);
}

.search-group {
  flex: 1;
}

.fluent-select,
.fluent-input {
  background: var(--bg-surface);
  border: 1px solid var(--border-default);
  border-radius: 6px;
  padding: 6px 10px;
  color: var(--text-primary);
  font-size: 12px;
  outline: none;
}

.fluent-select:focus,
.fluent-input:focus {
  border-color: var(--accent-primary);
}

.no-padding {
  padding: 0;
  overflow: hidden;
}

.logs-table {
  width: 100%;
}

.table-header,
.table-row {
  display: grid;
  grid-template-columns: 85px 80px 110px 120px 140px 75px 1fr;
  padding: 10px 16px;
  align-items: center;
  font-size: 12px;
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

.col-corr code {
  color: var(--text-link);
  font-size: 11px;
}

.sev-tag {
  display: inline-block;
  padding: 2px 6px;
  border-radius: 4px;
  font-size: 10px;
  font-weight: 700;
  text-transform: uppercase;
}

.sev-audit {
  background: var(--status-info-bg);
  color: var(--status-info);
}

.sev-info {
  background: rgba(255, 255, 255, 0.08);
  color: var(--text-secondary);
}

.sev-warn {
  background: var(--status-warning-bg);
  color: var(--status-warning);
}

.sev-error {
  background: var(--status-error-bg);
  color: var(--status-error);
}

.empty-state {
  padding: 24px;
  text-align: center;
  color: var(--text-muted);
}
</style>
