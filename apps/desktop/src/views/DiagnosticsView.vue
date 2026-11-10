<script setup lang="ts">
import { ref, onMounted } from "vue";
import { tauriBridge } from "../services/tauri-bridge";
import type { SystemDiagnostics } from "../services/types";
import MetricCard from "../components/MetricCard.vue";

const diagnostics = ref<SystemDiagnostics | null>(null);
const loading = ref<boolean>(false);
const error = ref<string | null>(null);

const fetchDiagnostics = async () => {
  loading.value = true;
  error.value = null;
  try {
    diagnostics.value = await tauriBridge.getSystemDiagnostics();
  } catch (err: unknown) {
    error.value = err instanceof Error ? err.message : String(err);
  } finally {
    loading.value = false;
  }
};

onMounted(() => {
  fetchDiagnostics();
});
</script>

<template>
  <div class="diagnostics-view">
    <div class="view-header">
      <div>
        <h2 class="view-title">System Diagnostics & Platform Health</h2>
        <p class="view-desc">
          Low-level inspection of the Node.js runtime environment, IPC pipes, and host resources.
        </p>
      </div>

      <button class="fluent-btn" :disabled="loading" @click="fetchDiagnostics">
        <span>↻ Run Diagnostics</span>
      </button>
    </div>

    <div v-if="diagnostics" class="diag-content">
      <!-- Memory & Runtime Metrics -->
      <div class="metrics-grid">
        <MetricCard
          title="Node.js Heap Used"
          :value="diagnostics.heapUsedMb"
          unit="MB"
          status="info"
          subtitle="Active V8 heap allocations"
        />
        <MetricCard
          title="Total Heap Allocated"
          :value="diagnostics.heapTotalMb"
          unit="MB"
          subtitle="V8 reserved heap space"
        />
        <MetricCard
          title="Resident Set Size (RSS)"
          :value="diagnostics.rssMb"
          unit="MB"
          subtitle="Total memory consumed"
        />
        <MetricCard
          title="Registered Clients"
          :value="diagnostics.registeredClientsCount"
          status="success"
          subtitle="P18 declarative registry"
        />
      </div>

      <!-- Detailed Diagnostics Specs -->
      <div class="specs-grid">
        <div class="fluent-card spec-card">
          <h3 class="spec-title">Operating System & Environment</h3>
          <div class="spec-list">
            <div class="spec-row">
              <span class="spec-label">Operating System:</span>
              <span class="spec-val"><code>{{ diagnostics.platform }} ({{ diagnostics.arch }})</code></span>
            </div>
            <div class="spec-row">
              <span class="spec-label">Windows Kernel Release:</span>
              <span class="spec-val"><code>{{ diagnostics.osRelease }}</code></span>
            </div>
            <div class="spec-row">
              <span class="spec-label">Node.js Engine:</span>
              <span class="spec-val"><code>{{ diagnostics.nodeVersion }}</code></span>
            </div>
            <div class="spec-row">
              <span class="spec-label">MADEL Server Baseline:</span>
              <span class="spec-val"><code>v{{ diagnostics.madelVersion }}</code></span>
            </div>
          </div>
        </div>

        <div class="fluent-card spec-card">
          <h3 class="spec-title">IPC & Daemon Security Channels</h3>
          <div class="spec-list">
            <div class="spec-row">
              <span class="spec-label">Windows Named Pipe:</span>
              <span class="spec-val">
                <span class="badge" :class="diagnostics.namedPipeAvailable ? 'badge-ok' : 'badge-warn'">
                  {{ diagnostics.namedPipeAvailable ? 'Available' : 'Unavailable' }}
                </span>
              </span>
            </div>
            <div class="spec-row">
              <span class="spec-label">Primary Daemon Process:</span>
              <span class="spec-val">
                <code>{{ diagnostics.primaryDaemonRunning ? `PID ${diagnostics.primaryDaemonPid} (Active)` : 'Offline' }}</code>
              </span>
            </div>
            <div class="spec-row">
              <span class="spec-label">Handshake File:</span>
              <span class="spec-val">
                <span class="badge" :class="diagnostics.handshakeFileExists ? 'badge-ok' : 'badge-warn'">
                  {{ diagnostics.handshakeFileExists ? 'Verified' : 'Missing' }}
                </span>
              </span>
            </div>
            <div class="spec-row">
              <span class="spec-label">Handshake Path:</span>
              <span class="spec-val path-val"><code>{{ diagnostics.handshakeFilePath }}</code></span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.diagnostics-view {
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

.diag-content {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.metrics-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 12px;
}

.specs-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
}

.spec-title {
  font-size: 13px;
  font-weight: 600;
  color: var(--text-primary);
  margin-bottom: 12px;
  padding-bottom: 8px;
  border-bottom: 1px solid var(--border-subtle);
}

.spec-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
  font-size: 12px;
}

.spec-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 4px 0;
}

.spec-label {
  color: var(--text-secondary);
}

.spec-val code {
  color: var(--text-link);
}

.path-val code {
  font-size: 10px;
  max-width: 250px;
  display: block;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.badge {
  padding: 2px 6px;
  border-radius: 4px;
  font-size: 11px;
  font-weight: 600;
}

.badge-ok {
  background: var(--status-success-bg);
  color: var(--status-success);
}

.badge-warn {
  background: var(--status-warning-bg);
  color: var(--status-warning);
}
</style>
