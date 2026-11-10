<script setup lang="ts">
defineProps<{
  status: string;
  label?: string;
}>();
</script>

<template>
  <span
    class="status-badge"
    :class="{
      'badge-success': status === 'RUNNING' || status === 'connected' || status === 'supported_and_verified',
      'badge-warning': status === 'configured' || status === 'configured_not_verified' || status === 'detected',
      'badge-error': status === 'DISCONNECTED' || status === 'UNAVAILABLE' || status === 'not_installed' || status === 'error',
      'badge-info': status === 'planned' || status === 'installed' || status === 'listening',
      'badge-neutral': status === 'NOT_VERIFIED' || status === 'stopped' || status === 'unverified'
    }"
  >
    <span class="status-dot"></span>
    <span class="status-text">{{ label || status }}</span>
  </span>
</template>

<style scoped>
.status-badge {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 3px 8px;
  border-radius: 12px;
  font-size: 11px;
  font-weight: 600;
  letter-spacing: 0.3px;
  text-transform: uppercase;
}

.status-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
}

.badge-success {
  background: var(--status-success-bg);
  color: var(--status-success);
}
.badge-success .status-dot {
  background: var(--status-success);
  box-shadow: 0 0 6px var(--status-success);
}

.badge-warning {
  background: var(--status-warning-bg);
  color: var(--status-warning);
}
.badge-warning .status-dot {
  background: var(--status-warning);
}

.badge-error {
  background: var(--status-error-bg);
  color: var(--status-error);
}
.badge-error .status-dot {
  background: var(--status-error);
}

.badge-info {
  background: var(--status-info-bg);
  color: var(--status-info);
}
.badge-info .status-dot {
  background: var(--status-info);
}

.badge-neutral {
  background: rgba(255, 255, 255, 0.08);
  color: var(--text-muted);
}
.badge-neutral .status-dot {
  background: var(--text-muted);
}
</style>
