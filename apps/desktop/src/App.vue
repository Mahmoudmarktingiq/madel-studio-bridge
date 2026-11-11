<script setup lang="ts">
import { ref, onMounted, onUnmounted, watch } from "vue";
import { useGatewayStore } from "./stores/gateway";
import { useSettingsStore } from "./stores/settings";
import AppHeader from "./components/AppHeader.vue";
import AppSidebar from "./components/AppSidebar.vue";
import AppFooter from "./components/AppFooter.vue";
import DashboardView from "./views/DashboardView.vue";
import ApplicationsView from "./views/ApplicationsView.vue";
import ClientsView from "./views/ClientsView.vue";
import ServersView from "./views/ServersView.vue";
import ActivityView from "./views/ActivityView.vue";
import DiagnosticsView from "./views/DiagnosticsView.vue";
import SettingsView from "./views/SettingsView.vue";
import SetupWizardModal from "./components/SetupWizardModal.vue";
import ApprovalsModal from "./components/ApprovalsModal.vue";
import { isTauri } from "./services/tauri-bridge";

const activeTab = ref<string>("dashboard");
const showWizard = ref<boolean>(false);
const showApprovals = ref<boolean>(false);
const gatewayStore = useGatewayStore();
const settingsStore = useSettingsStore();

let refreshTimer: ReturnType<typeof setInterval> | null = null;

const startAutoRefresh = () => {
  if (refreshTimer) clearInterval(refreshTimer);
  refreshTimer = setInterval(() => {
    if (typeof document !== "undefined" && document.hidden) return;
    gatewayStore.fetchStatus();
  }, settingsStore.refreshIntervalMs);
};

onMounted(async () => {
  settingsStore.applyTheme();
  await gatewayStore.fetchStatus();
  startAutoRefresh();

  if (typeof document !== "undefined") {
    document.addEventListener("visibilitychange", () => {
      if (!document.hidden) {
        gatewayStore.fetchStatus();
      }
    });
  }

  // Listen to Tray navigation events when running under Tauri
  if (isTauri()) {
    try {
      const { listen } = await import("@tauri-apps/api/event");
      await listen<string>("navigate-to", (event) => {
        if (event.payload) {
          activeTab.value = event.payload;
        }
      });
    } catch {
      // ignore
    }
  }

  // Check if first-run setup wizard should be displayed
  if (typeof localStorage !== "undefined" && localStorage.getItem("madel_setup_completed") !== "true") {
    showWizard.value = true;
  }
});

watch(
  () => settingsStore.refreshIntervalMs,
  () => {
    startAutoRefresh();
  }
);

onUnmounted(() => {
  if (refreshTimer) clearInterval(refreshTimer);
});
</script>

<template>
  <div class="app-layout">
    <AppHeader @open-wizard="showWizard = true" @open-approvals="showApprovals = true" />
    <div class="app-body">
      <AppSidebar :active-tab="activeTab" @select-tab="activeTab = $event" />
      <main class="app-main">
        <DashboardView v-if="activeTab === 'dashboard'" />
        <ApplicationsView v-else-if="activeTab === 'applications'" />
        <ClientsView v-else-if="activeTab === 'clients'" />
        <ServersView v-else-if="activeTab === 'servers'" />
        <ActivityView v-else-if="activeTab === 'activity'" />
        <DiagnosticsView v-else-if="activeTab === 'diagnostics'" />
        <SettingsView v-else-if="activeTab === 'settings'" />
      </main>
    </div>
    <AppFooter />
    <SetupWizardModal v-if="showWizard" @close="showWizard = false" @complete="showWizard = false" />
    <ApprovalsModal v-if="showApprovals" @close="showApprovals = false" />
  </div>
</template>

<style scoped>
.app-layout {
  display: flex;
  flex-direction: column;
  height: 100vh;
  width: 100vw;
  background: var(--bg-primary);
  overflow: hidden;
}

.app-body {
  display: flex;
  flex: 1;
  overflow: hidden;
}

.app-main {
  flex: 1;
  padding: 20px 24px;
  overflow-y: auto;
  background: var(--bg-primary);
}
</style>
