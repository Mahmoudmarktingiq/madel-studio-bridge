<script setup lang="ts">
import { useGatewayStore } from "../stores/gateway";

const gatewayStore = useGatewayStore();
</script>

<template>
  <footer class="app-footer">
    <div class="footer-left">
      <span class="status-indicator" :class="gatewayStore.isRunning ? 'status-online' : 'status-offline'"></span>
      <span class="footer-text">
        {{ gatewayStore.isRunning ? `Daemon PID: ${gatewayStore.status?.daemon.pid || 15940} | Pipe: Active` : 'Daemon: Offline' }}
      </span>
      <span class="separator">•</span>
      <span class="footer-text">Windows Named Pipe: <code>\\.\pipe\brainferno-mcp-bridge</code></span>
    </div>

    <div class="footer-right">
      <span class="copyright">Developed and maintained by Mahmoud Adel</span>
      <span class="separator">•</span>
      <span class="version-tag">v0.11.4-Desktop</span>
    </div>
  </footer>
</template>

<style scoped>
.app-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 6px 16px;
  background: var(--bg-secondary);
  border-top: 1px solid var(--border-subtle);
  font-size: 11px;
  color: var(--text-muted);
  height: 32px;
  flex-shrink: 0;
}

.footer-left,
.footer-right {
  display: flex;
  align-items: center;
  gap: 8px;
}

.status-indicator {
  width: 7px;
  height: 7px;
  border-radius: 50%;
}

.status-online {
  background: var(--status-success);
  box-shadow: 0 0 5px var(--status-success);
}

.status-offline {
  background: var(--status-error);
}

.separator {
  opacity: 0.4;
}

.copyright {
  font-weight: 500;
  color: var(--text-secondary);
}

code {
  font-size: 10px;
  color: var(--text-link);
}
</style>
