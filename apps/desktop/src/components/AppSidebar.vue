<script setup lang="ts">
defineProps<{
  activeTab: string;
}>();

const emit = defineEmits<{
  (e: "select-tab", tab: string): void;
}>();

const navItems = [
  { id: "dashboard", label: "Dashboard", icon: "📊" },
  { id: "applications", label: "Applications", icon: "🎨" },
  { id: "clients", label: "AI Clients", icon: "🤖" },
  { id: "servers", label: "MCP Servers", icon: "🔌" },
  { id: "activity", label: "Activity & Logs", icon: "📝" },
  { id: "diagnostics", label: "Diagnostics", icon: "🩺" },
  { id: "settings", label: "Settings", icon: "⚙️" },
];
</script>

<template>
  <aside class="app-sidebar">
    <nav class="sidebar-nav">
      <button
        v-for="item in navItems"
        :key="item.id"
        class="nav-item"
        :class="{ active: activeTab === item.id }"
        @click="emit('select-tab', item.id)"
      >
        <span class="nav-icon">{{ item.icon }}</span>
        <span class="nav-label">{{ item.label }}</span>
      </button>
    </nav>
  </aside>
</template>

<style scoped>
.app-sidebar {
  width: 210px;
  background: var(--bg-primary);
  border-right: 1px solid var(--border-subtle);
  display: flex;
  flex-direction: column;
  padding: 12px 8px;
  flex-shrink: 0;
}

.sidebar-nav {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.nav-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 8px 12px;
  border-radius: 6px;
  background: transparent;
  border: 1px solid transparent;
  color: var(--text-secondary);
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  text-align: left;
  transition: all 0.15s ease;
}

.nav-item:hover {
  background: var(--bg-hover);
  color: var(--text-primary);
}

.nav-item.active {
  background: var(--bg-surface);
  border-color: var(--border-subtle);
  color: var(--accent-primary);
  font-weight: 600;
}

.nav-icon {
  font-size: 15px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 20px;
}

.nav-label {
  flex: 1;
}
</style>
