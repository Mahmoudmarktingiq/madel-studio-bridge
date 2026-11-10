<script setup lang="ts">
import type { PlanResult } from "../services/types";

defineProps<{
  plan: PlanResult;
}>();
</script>

<template>
  <div class="diff-viewer">
    <div class="diff-header">
      <div class="diff-path">
        <strong>Target File:</strong> <code>{{ plan.configPath }}</code>
      </div>
      <div class="diff-summary-badges">
        <span v-if="plan.diffSummary?.added?.length" class="badge-added">
          +{{ plan.diffSummary.added.length }} added
        </span>
        <span v-if="plan.diffSummary?.modified?.length" class="badge-modified">
          ~{{ plan.diffSummary.modified.length }} modified
        </span>
        <span v-if="plan.diffSummary?.removed?.length" class="badge-removed">
          -{{ plan.diffSummary.removed.length }} removed
        </span>
      </div>
    </div>

    <div v-if="(plan.conflicts || []).length > 0" class="conflict-alert">
      <strong>Warning:</strong> Potential conflicts detected with:
      <ul>
        <li v-for="c in plan.conflicts" :key="c">{{ c }}</li>
      </ul>
    </div>

    <div v-if="plan.diffPreview" class="unified-diff-pane">
      <div class="pane-title">Git-Style Unified Diff Preview</div>
      <pre class="code-block diff-preview-block">{{ plan.diffPreview }}</pre>
    </div>
    <div v-else class="diff-panes">
      <div class="diff-pane">
        <div class="pane-title">Current File on Disk</div>
        <pre class="code-block">{{ plan.originalContent || "(Empty or file does not exist yet)" }}</pre>
      </div>
      <div class="diff-pane">
        <div class="pane-title">Planned Atomic Update</div>
        <pre class="code-block code-planned">{{ plan.plannedContent }}</pre>
      </div>
    </div>
  </div>
</template>

<style scoped>
.diff-viewer {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.diff-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 12px;
  background: var(--bg-surface);
  border-radius: 6px;
  font-size: 12px;
}

.diff-path code {
  color: var(--text-link);
}

.diff-summary-badges {
  display: flex;
  gap: 8px;
}

.badge-added {
  background: var(--status-success-bg);
  color: var(--status-success);
  padding: 2px 6px;
  border-radius: 4px;
  font-size: 11px;
  font-weight: 600;
}

.badge-modified {
  background: var(--status-warning-bg);
  color: var(--status-warning);
  padding: 2px 6px;
  border-radius: 4px;
  font-size: 11px;
  font-weight: 600;
}

.badge-removed {
  background: var(--status-error-bg);
  color: var(--status-error);
  padding: 2px 6px;
  border-radius: 4px;
  font-size: 11px;
  font-weight: 600;
}

.conflict-alert {
  background: var(--status-warning-bg);
  color: var(--status-warning);
  padding: 10px;
  border-radius: 6px;
  font-size: 12px;
}

.diff-panes {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
}

.diff-pane {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.pane-title {
  font-size: 11px;
  font-weight: 600;
  text-transform: uppercase;
  color: var(--text-secondary);
}

.code-block {
  max-height: 280px;
  overflow: auto;
}

.code-planned {
  border-color: var(--accent-primary);
}
</style>
