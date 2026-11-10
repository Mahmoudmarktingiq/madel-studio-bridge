<script setup lang="ts">
defineProps<{
  title: string;
  value: string | number;
  unit?: string;
  trend?: string;
  status?: "success" | "warning" | "error" | "info" | "neutral";
  subtitle?: string;
}>();
</script>

<template>
  <div class="metric-card fluent-card" :class="status ? `status-${status}` : ''">
    <div class="metric-header">
      <span class="metric-title">{{ title }}</span>
      <span v-if="trend" class="metric-trend">{{ trend }}</span>
    </div>
    <div class="metric-body">
      <span class="metric-value">{{ value }}</span>
      <span v-if="unit" class="metric-unit">{{ unit }}</span>
    </div>
    <div v-if="subtitle" class="metric-subtitle">
      {{ subtitle }}
    </div>
  </div>
</template>

<style scoped>
.metric-card {
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  min-height: 85px;
}

.metric-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 6px;
}

.metric-title {
  font-size: 11px;
  font-weight: 500;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  color: var(--text-secondary);
}

.metric-body {
  display: flex;
  align-items: baseline;
  gap: 4px;
}

.metric-value {
  font-size: 24px;
  font-weight: 700;
  color: var(--text-primary);
  font-feature-settings: "tnum";
}

.metric-unit {
  font-size: 12px;
  color: var(--text-muted);
}

.metric-subtitle {
  font-size: 11px;
  color: var(--text-muted);
  margin-top: 4px;
}

.status-success .metric-value {
  color: var(--status-success);
}
.status-warning .metric-value {
  color: var(--status-warning);
}
.status-error .metric-value {
  color: var(--status-error);
}
.status-info .metric-value {
  color: var(--status-info);
}
</style>
