<script setup lang="ts">
defineProps<{
  title: string;
  isOpen: boolean;
  confirmText?: string;
  cancelText?: string;
  isProcessing?: boolean;
}>();

const emit = defineEmits<{
  (e: "confirm"): void;
  (e: "cancel"): void;
}>();
</script>

<template>
  <div v-if="isOpen" class="modal-overlay" @click.self="emit('cancel')">
    <div class="modal-dialog fluent-card">
      <div class="modal-header">
        <h3 class="modal-title">{{ title }}</h3>
        <button class="close-btn" @click="emit('cancel')">&times;</button>
      </div>

      <div class="modal-content">
        <slot></slot>
      </div>

      <div class="modal-footer">
        <button class="fluent-btn" :disabled="isProcessing" @click="emit('cancel')">
          {{ cancelText || 'Cancel' }}
        </button>
        <button
          class="fluent-btn fluent-btn-primary"
          :disabled="isProcessing"
          @click="emit('confirm')"
        >
          <span v-if="isProcessing">Applying...</span>
          <span v-else>{{ confirmText || 'Confirm & Apply' }}</span>
        </button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.65);
  backdrop-filter: blur(4px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 20px;
}

.modal-dialog {
  background: var(--bg-secondary);
  border: 1px solid var(--border-default);
  border-radius: 10px;
  width: 100%;
  max-width: 780px;
  max-height: 90vh;
  display: flex;
  flex-direction: column;
  box-shadow: var(--shadow-lg);
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-bottom: 12px;
  border-bottom: 1px solid var(--border-subtle);
}

.modal-title {
  font-size: 15px;
  font-weight: 600;
  color: var(--text-primary);
}

.close-btn {
  background: transparent;
  border: none;
  font-size: 20px;
  color: var(--text-muted);
  cursor: pointer;
  padding: 0 4px;
}

.close-btn:hover {
  color: var(--text-primary);
}

.modal-content {
  padding: 16px 0;
  overflow-y: auto;
  flex: 1;
}

.modal-footer {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  padding-top: 12px;
  border-top: 1px solid var(--border-subtle);
}
</style>
