<script setup lang="ts">
import { onMounted } from "vue";
import { useGatewayStore } from "../stores/gateway";
import { useSettingsStore } from "../stores/settings";
import { useApprovalsStore } from "../stores/approvals";
import StatusBadge from "./StatusBadge.vue";

const emit = defineEmits<{
  (e: "open-wizard"): void;
  (e: "open-approvals"): void;
}>();

const gatewayStore = useGatewayStore();
const settingsStore = useSettingsStore();
const approvalsStore = useApprovalsStore();

onMounted(() => {
  approvalsStore.fetchPendingApprovals();
});

const refreshAll = () => {
  gatewayStore.fetchStatus();
  approvalsStore.fetchPendingApprovals();
};
</script>

<template>
  <header class="app-header">
    <div class="header-brand">
      <img src="../assets/logo.svg" alt="MADEL Studio Bridge Logo" class="brand-logo" />
      <div class="brand-text">
        <h1 class="brand-title">MADEL Studio Bridge</h1>
        <p class="brand-subtitle">Unified MCP Hub for Creative & Production Applications</p>
      </div>
    </div>

    <div class="header-controls">
      <div class="gateway-status">
        <StatusBadge
          :status="gatewayStore.status?.state || 'DISCONNECTED'"
          :label="gatewayStore.status?.state === 'RUNNING' ? 'Gateway Active (Port 7897)' : (gatewayStore.status?.state || 'Connecting...')"
        />
      </div>

      <button class="fluent-btn header-btn btn-wizard" @click="emit('open-wizard')" title="Open Setup Wizard">
        <span>🧙 Setup Wizard</span>
      </button>

      <button class="fluent-btn header-btn btn-approvals" @click="emit('open-approvals')" title="Action Approval Gate">
        <span>🛡️ Approvals</span>
        <span v-if="approvalsStore.tickets.length > 0" class="badge-count">{{ approvalsStore.tickets.length }}</span>
      </button>

      <button class="fluent-btn header-btn" :disabled="gatewayStore.loading" @click="refreshAll" title="Refresh Live State">
        <span class="btn-icon">↻</span>
        <span>{{ gatewayStore.loading ? 'Updating...' : 'Refresh' }}</span>
      </button>

      <button class="fluent-btn header-btn" @click="settingsStore.toggleTheme" :title="settingsStore.theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'">
        <span>{{ settingsStore.theme === 'dark' ? '☀ Light' : '🌙 Dark' }}</span>
      </button>

      <button class="fluent-btn header-btn" @click="settingsStore.setLanguage(settingsStore.language === 'en' ? 'ar' : 'en')">
        <span>{{ settingsStore.language === 'en' ? 'العربية' : 'English' }}</span>
      </button>
    </div>
  </header>
</template>

<style scoped>
.app-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px 20px;
  background: var(--bg-secondary);
  border-bottom: 1px solid var(--border-subtle);
  height: 60px;
  flex-shrink: 0;
}

.header-brand {
  display: flex;
  align-items: center;
  gap: 12px;
}

.brand-logo {
  width: 34px;
  height: 34px;
  border-radius: 8px;
}

.brand-title {
  font-size: 15px;
  font-weight: 700;
  letter-spacing: -0.2px;
  color: var(--text-primary);
  line-height: 1.2;
}

.brand-subtitle {
  font-size: 11px;
  color: var(--text-muted);
}

.header-controls {
  display: flex;
  align-items: center;
  gap: 10px;
}

.header-btn {
  padding: 5px 10px;
  font-size: 12px;
}

.badge-count {
  background: #ef4444;
  color: white;
  border-radius: 10px;
  padding: 1px 6px;
  font-size: 10px;
  font-weight: 700;
  margin-left: 4px;
}

.btn-icon {
  font-size: 14px;
}
</style>
