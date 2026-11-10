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
import { isTauri } from "./services/tauri-bridge";

const activeTab = ref<string>("dashboard");
const gatewayStore = useGatewayStore();
const settingsStore = useSettingsStore();

let refreshTimer: ReturnType<typeof setInterval> | null = null;

const startAutoRefresh = () => {
  if (refreshTimer) clearInterval(refreshTimer);
  refreshTimer = setInterval(() => {
    gatewayStore.fetchStatus();
  }, settingsStore.refreshIntervalMs);
};

onMounted(async () => {
  settingsStore.applyTheme();
  await gatewayStore.fetchStatus();
  startAutoRefresh();

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
    <AppHeader />
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
