<script setup lang="ts">
import { onMounted } from "vue";
import { useGatewayStore } from "../stores/gateway";
import { useClientsStore } from "../stores/clients";
import { useAppsStore } from "../stores/applications";
import { useServersStore } from "../stores/servers";
import { useActivityStore } from "../stores/activity";
import MetricCard from "../components/MetricCard.vue";
import StatusBadge from "../components/StatusBadge.vue";

const gatewayStore = useGatewayStore();
const clientsStore = useClientsStore();
const appsStore = useAppsStore();
const serversStore = useServersStore();
const activityStore = useActivityStore();

onMounted(() => {
  gatewayStore.fetchStatus();
  clientsStore.fetchClients();
  appsStore.fetchApps();
  serversStore.fetchServers();
  activityStore.fetchLogs();
});
</script>

<template>
  <div class="dashboard-view">
    <!-- Disconnected Banner if offline -->
    <div v-if="gatewayStore.status?.state !== 'RUNNING'" class="alert-banner" :class="gatewayStore.status?.state === 'NOT_VERIFIED' ? 'banner-warning' : 'banner-error'">
      <div class="banner-icon">⚠️</div>
      <div class="banner-content">
        <h4 class="banner-title">Gateway State: {{ gatewayStore.status?.state || 'DISCONNECTED' }}</h4>
        <p class="banner-msg">
          {{ gatewayStore.status?.reason || 'Photoshop Primary Daemon is not currently active. Open Photoshop and launch MADEL Studio Bridge panel to connect.' }}
        </p>
      </div>
    </div>

    <!-- Top Metrics Grid from P17 -->
    <section class="section">
      <h2 class="section-title">Gateway & Concurrency Metrics (P17 Subsystem)</h2>
      <div class="metrics-grid">
        <MetricCard
          title="Active Requests"
          :value="gatewayStore.metrics.activeRequests"
          :status="gatewayStore.metrics.activeRequests > 0 ? 'warning' : 'success'"
          subtitle="Currently processing in host"
        />
        <MetricCard
          title="Queue Depth (Pending)"
          :value="gatewayStore.metrics.pendingRequests"
          :status="gatewayStore.metrics.pendingRequests > 0 ? 'warning' : 'neutral'"
          subtitle="FIFO WorkLimiter queue"
        />
        <MetricCard
          title="Completed Requests"
          :value="gatewayStore.metrics.completedRequests"
          status="success"
          subtitle="Successfully processed"
        />
        <MetricCard
          title="Failed / Timed Out"
          :value="gatewayStore.metrics.failedRequests + gatewayStore.metrics.timeoutRequests"
          :status="(gatewayStore.metrics.failedRequests + gatewayStore.metrics.timeoutRequests) > 0 ? 'error' : 'neutral'"
          subtitle="Zero unhandled exceptions"
        />
        <MetricCard
          title="Avg Queue Wait"
          :value="gatewayStore.metrics.averageQueueWaitMs"
          unit="ms"
          subtitle="Queue scheduling latency"
        />
        <MetricCard
          title="Avg Execution Time"
          :value="gatewayStore.metrics.averageExecutionMs"
          unit="ms"
          subtitle="Host dispatch time"
        />
      </div>
    </section>

    <!-- Subsystems Overview -->
    <section class="section-grid">
      <!-- Quick Applications Status -->
      <div class="fluent-card">
        <div class="card-header">
          <h3 class="card-title">Creative Applications ({{ appsStore.verifiedApps.length }} Verified)</h3>
          <StatusBadge
            :status="appsStore.verifiedApps.length > 0 ? 'supported_and_verified' : 'configured_not_verified'"
            :label="appsStore.verifiedApps.length > 0 ? 'Connected' : 'Waiting'"
          />
        </div>
        <div class="items-list">
          <div v-for="app in appsStore.apps.slice(0, 4)" :key="app.id" class="list-item">
            <div class="item-info">
              <span class="item-name">{{ app.name }}</span>
              <span class="item-sub">{{ app.adapter }}</span>
            </div>
            <StatusBadge :status="app.status" :label="app.statusLabel" />
          </div>
        </div>
      </div>

      <!-- Quick AI Clients Status (P18) -->
      <div class="fluent-card">
        <div class="card-header">
          <h3 class="card-title">AI Clients ({{ clientsStore.configuredCount }} Configured)</h3>
          <span class="client-count">{{ clientsStore.clientsList.length }} Registered</span>
        </div>
        <div class="items-list">
          <div v-for="client in clientsStore.clientsList.filter(c => c.configured).slice(0, 4)" :key="client.key" class="list-item">
            <div class="item-info">
              <span class="item-name">{{ client.name }}</span>
              <span class="item-sub">Format: {{ client.format.toUpperCase() }} | {{ client.transport }}</span>
            </div>
            <StatusBadge status="configured" label="Configured" />
          </div>
          <div v-if="clientsStore.configuredCount === 0" class="empty-state">
            No AI clients configured yet. Go to AI Clients page to connect.
          </div>
        </div>
      </div>
    </section>

    <!-- Recent MCP Activity Stream -->
    <section class="section">
      <div class="section-header">
        <h2 class="section-title">Recent MCP Audit Stream</h2>
        <span class="section-badge">{{ activityStore.logs.length }} Events</span>
      </div>
      <div class="fluent-card no-padding">
        <div class="activity-table">
          <div class="table-header">
            <span class="col-time">Time</span>
            <span class="col-sev">Severity</span>
            <span class="col-app">Application</span>
            <span class="col-corr">Correlation ID</span>
            <span class="col-msg">Event Details</span>
          </div>
          <div v-for="log in activityStore.logs.slice(0, 5)" :key="log.id" class="table-row">
            <span class="col-time">{{ log.timestamp.split('T')[1]?.substring(0, 8) }}</span>
            <span class="col-sev">
              <span class="sev-tag" :class="`sev-${log.severity}`">{{ log.severity }}</span>
            </span>
            <span class="col-app">{{ log.application }}</span>
            <span class="col-corr"><code>{{ log.correlationId }}</code></span>
            <span class="col-msg">{{ log.message }}</span>
          </div>
        </div>
      </div>
    </section>
  </div>
</template>

<style scoped>
.dashboard-view {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.alert-banner {
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 14px 18px;
  border-radius: 8px;
}

.banner-error {
  background: var(--status-error-bg);
  border: 1px solid var(--status-error);
}

.banner-warning {
  background: var(--status-warning-bg);
  border: 1px solid var(--status-warning);
}

.banner-icon {
  font-size: 24px;
}

.banner-title {
  font-size: 13px;
  font-weight: 700;
  color: var(--text-primary);
  margin-bottom: 2px;
}

.banner-msg {
  font-size: 12px;
  color: var(--text-secondary);
}

.section {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.section-title {
  font-size: 13px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  color: var(--text-secondary);
}

.section-badge {
  font-size: 11px;
  color: var(--text-muted);
}

.metrics-grid {
  display: grid;
  grid-template-columns: repeat(6, 1fr);
  gap: 12px;
}

@media (max-width: 1200px) {
  .metrics-grid {
    grid-template-columns: repeat(3, 1fr);
  }
}

.section-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 14px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
  padding-bottom: 8px;
  border-bottom: 1px solid var(--border-subtle);
}

.card-title {
  font-size: 13px;
  font-weight: 600;
  color: var(--text-primary);
}

.client-count {
  font-size: 11px;
  color: var(--text-muted);
}

.items-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.list-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 6px 0;
  border-bottom: 1px solid rgba(255, 255, 255, 0.03);
}

.item-info {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.item-name {
  font-size: 13px;
  font-weight: 600;
  color: var(--text-primary);
}

.item-sub {
  font-size: 11px;
  color: var(--text-muted);
}

.empty-state {
  padding: 16px;
  text-align: center;
  color: var(--text-muted);
  font-size: 12px;
}

.no-padding {
  padding: 0;
  overflow: hidden;
}

.activity-table {
  width: 100%;
}

.table-header,
.table-row {
  display: grid;
  grid-template-columns: 80px 80px 130px 130px 1fr;
  padding: 8px 16px;
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
</style>
