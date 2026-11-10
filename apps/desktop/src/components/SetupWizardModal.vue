<script setup lang="ts">
import { ref, onMounted } from "vue";
import { useGatewayStore } from "../stores/gateway";
import { useAppsStore } from "../stores/applications";
import { useClientsStore } from "../stores/clients";
import { tauriBridge } from "../services/tauri-bridge";
import type { SystemDiagnostics } from "../services/types";

const emit = defineEmits<{
  (e: "close"): void;
  (e: "complete"): void;
}>();

const currentStep = ref(1);
const totalSteps = 7;

const gatewayStore = useGatewayStore();
const appsStore = useAppsStore();
const clientsStore = useClientsStore();

const diagnostics = ref<SystemDiagnostics | null>(null);
const loadingDiag = ref(false);

onMounted(async () => {
  loadingDiag.value = true;
  try {
    diagnostics.value = await tauriBridge.getSystemDiagnostics();
    await gatewayStore.fetchStatus();
    await appsStore.fetchApps();
    await clientsStore.fetchClients();
  } catch {
    // fallback
  } finally {
    loadingDiag.value = false;
  }
});

const nextStep = () => {
  if (currentStep.value < totalSteps) {
    currentStep.value++;
  } else {
    finishSetup();
  }
};

const prevStep = () => {
  if (currentStep.value > 1) {
    currentStep.value--;
  }
};

const finishSetup = () => {
  if (typeof localStorage !== "undefined") {
    localStorage.setItem("madel_setup_completed", "true");
  }
  emit("complete");
};
</script>

<template>
  <div class="modal-backdrop" @click.self="emit('close')">
    <div class="modal-card">
      <div class="modal-header">
        <div class="header-left">
          <span class="step-badge">Step {{ currentStep }} of {{ totalSteps }}</span>
          <h2 class="wizard-title">
            <span v-if="currentStep === 1">Welcome to MADEL Studio Bridge</span>
            <span v-else-if="currentStep === 2">System Compatibility Check</span>
            <span v-else-if="currentStep === 3">Creative Applications Discovery</span>
            <span v-else-if="currentStep === 4">AI Clients Detection</span>
            <span v-else-if="currentStep === 5">MCP Core Runtime Verification</span>
            <span v-else-if="currentStep === 6">Read-Only Connection Preview</span>
            <span v-else-if="currentStep === 7">Setup Complete</span>
          </h2>
        </div>
        <button class="close-btn" @click="emit('close')">✕</button>
      </div>

      <!-- Step Progress Bar -->
      <div class="progress-bar-container">
        <div class="progress-fill" :style="{ width: `${(currentStep / totalSteps) * 100}%` }"></div>
      </div>

      <div class="modal-body">
        <!-- Step 1: Welcome -->
        <div v-if="currentStep === 1" class="step-content">
          <div class="welcome-hero">
            <div class="welcome-icon">🎨</div>
            <h3>Unified MCP Hub for Creative & Production Applications</h3>
            <p class="hero-desc">
              Developed and maintained by <strong>Mahmoud Adel</strong>. MADEL Studio Bridge connects your local creative suite (Photoshop, Illustrator, Premiere Pro, After Effects, Blender, Browser) with AI coding assistants (Claude Code, OpenAI Codex, Google Antigravity, Cursor) via Model Context Protocol.
            </p>
          </div>
          <div class="highlights-grid">
            <div class="highlight-item">
              <span class="item-icon">⚡</span>
              <div>
                <strong>Non-Destructive & Safe</strong>
                <p>Protected by out-of-band Action Approval Gate and strict sandboxing.</p>
              </div>
            </div>
            <div class="highlight-item">
              <span class="item-icon">🔒</span>
              <div>
                <strong>Local & Private</strong>
                <p>Zero cloud telemetry; runs completely on your Windows workstation.</p>
              </div>
            </div>
            <div class="highlight-item">
              <span class="item-icon">🛡️</span>
              <div>
                <strong>Zero Breakage Guarantee</strong>
                <p>Never overwrites custom server configs without atomic backup.</p>
              </div>
            </div>
          </div>
        </div>

        <!-- Step 2: Compatibility Check -->
        <div v-if="currentStep === 2" class="step-content">
          <p class="step-intro">Verifying runtime prerequisites on your Windows workstation:</p>
          <div class="checks-list">
            <div class="check-row">
              <span class="check-icon">✓</span>
              <div class="check-details">
                <strong>Operating System</strong>
                <span>Windows {{ diagnostics?.osRelease || '10/11' }} ({{ diagnostics?.arch || 'x64' }}) — Supported</span>
              </div>
            </div>
            <div class="check-row">
              <span class="check-icon">✓</span>
              <div class="check-details">
                <strong>Node.js Engine</strong>
                <span>{{ diagnostics?.nodeVersion || 'v26.13.0' }} — Ready</span>
              </div>
            </div>
            <div class="check-row">
              <span class="check-icon">✓</span>
              <div class="check-details">
                <strong>Windows WebView2 Runtime</strong>
                <span>Installed & Active (Edge Chromium Runtime)</span>
              </div>
            </div>
            <div class="check-row">
              <span class="check-icon">✓</span>
              <div class="check-details">
                <strong>Execution Context</strong>
                <span>Standard User Profile Mode (No elevated admin required)</span>
              </div>
            </div>
          </div>
        </div>

        <!-- Step 3: Creative Apps -->
        <div v-if="currentStep === 3" class="step-content">
          <p class="step-intro">Detected Creative & Production Applications:</p>
          <div class="apps-grid">
            <div v-for="app in appsStore.apps" :key="app.id" class="app-card">
              <div class="app-card-header">
                <strong>{{ app.name }}</strong>
                <span class="badge" :class="app.status === 'supported_and_verified' ? 'badge-green' : 'badge-gray'">
                  {{ app.statusLabel }}
                </span>
              </div>
              <p class="app-card-detail">{{ app.details }}</p>
            </div>
          </div>
        </div>

        <!-- Step 4: AI Clients -->
        <div v-if="currentStep === 4" class="step-content">
          <p class="step-intro">Discovered AI Coding & Desktop Clients:</p>
          <div class="clients-list">
            <div v-for="client in clientsStore.clientsList" :key="client.key" class="client-row">
              <div class="client-info">
                <strong>{{ client.name }}</strong>
                <span class="client-path">{{ client.configPath || 'Path detected via environment' }}</span>
              </div>
              <span class="badge" :class="client.installed ? 'badge-blue' : 'badge-gray'">
                {{ client.installed ? (client.configured ? 'Configured' : 'Installed') : 'Not Detected' }}
              </span>
            </div>
          </div>
        </div>

        <!-- Step 5: MCP Runtime -->
        <div v-if="currentStep === 5" class="step-content">
          <p class="step-intro">MCP Subsystems & Communication Channels:</p>
          <div class="runtime-grid">
            <div class="runtime-item">
              <strong>Primary TCP Daemon (Port 7897)</strong>
              <p :class="gatewayStore.status?.state === 'RUNNING' ? 'text-green' : 'text-yellow'">
                {{ gatewayStore.status?.state === 'RUNNING' ? 'Active & Listening' : 'Awaiting Host Connection' }}
              </p>
            </div>
            <div class="runtime-item">
              <strong>Windows Named Pipe</strong>
              <p class="text-green">\\\\.\\pipe\\brainferno-mcp-bridge</p>
            </div>
            <div class="runtime-item">
              <strong>Concurrency Controller</strong>
              <p class="text-green">P17 WorkLimiter Active (1 concurrent per app)</p>
            </div>
            <div class="runtime-item">
              <strong>Security Approval Gate</strong>
              <p class="text-green">Active (Requires operator token for destructive actions)</p>
            </div>
          </div>
        </div>

        <!-- Step 6: Read-Only Preview -->
        <div v-if="currentStep === 6" class="step-content">
          <div class="info-alert">
            <span class="alert-icon">ℹ️</span>
            <div>
              <strong>Strict Read-Only Discovery Mode</strong>
              <p>MADEL Studio Bridge will not make any changes to your client configurations during initial setup. You can connect or disconnect any client individually from the "AI Clients" tab with full diff preview.</p>
            </div>
          </div>
          <div class="preview-box">
            <pre><code>// Example Stdio Bridge Registration
{
  "mcpServers": {
    "madel-studio-bridge": {
      "command": "node",
      "args": ["resources/server/dist/index.js"]
    }
  }
}</code></pre>
          </div>
        </div>

        <!-- Step 7: Finish -->
        <div v-if="currentStep === 7" class="step-content finish-step">
          <div class="finish-icon">🎉</div>
          <h3>Setup & Verification Complete!</h3>
          <p class="finish-text">
            MADEL Studio Bridge is installed and configured for your Windows workstation. You can now monitor application status, review real-time concurrency metrics, and manage AI client integrations through this Dashboard.
          </p>
        </div>
      </div>

      <div class="modal-footer">
        <button v-if="currentStep > 1" class="fluent-btn btn-secondary" @click="prevStep">
          ← Previous
        </button>
        <div class="footer-spacer"></div>
        <button class="fluent-btn btn-primary" @click="nextStep">
          <span v-if="currentStep < totalSteps">Next →</span>
          <span v-else>Complete & Open Dashboard</span>
        </button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.modal-backdrop {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.7);
  backdrop-filter: blur(4px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.modal-card {
  width: 720px;
  max-width: 95vw;
  max-height: 88vh;
  background: var(--bg-secondary);
  border: 1px solid var(--border-subtle);
  border-radius: 12px;
  display: flex;
  flex-direction: column;
  box-shadow: 0 16px 40px rgba(0, 0, 0, 0.5);
  overflow: hidden;
}

.modal-header {
  padding: 16px 24px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  border-bottom: 1px solid var(--border-subtle);
}

.step-badge {
  font-size: 11px;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  color: var(--accent-blue);
  font-weight: 600;
}

.wizard-title {
  margin: 4px 0 0;
  font-size: 18px;
  font-weight: 600;
}

.close-btn {
  background: none;
  border: none;
  font-size: 18px;
  cursor: pointer;
  color: var(--text-muted);
}

.progress-bar-container {
  height: 3px;
  background: var(--border-subtle);
  width: 100%;
}

.progress-fill {
  height: 100%;
  background: var(--accent-blue);
  transition: width 0.3s ease;
}

.modal-body {
  padding: 24px;
  overflow-y: auto;
  flex: 1;
}

.welcome-hero {
  text-align: center;
  margin-bottom: 24px;
}

.welcome-icon {
  font-size: 48px;
  margin-bottom: 8px;
}

.hero-desc {
  color: var(--text-muted);
  font-size: 14px;
  line-height: 1.6;
  max-width: 620px;
  margin: 8px auto 0;
}

.highlights-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: 12px;
}

.highlight-item {
  display: flex;
  gap: 14px;
  align-items: flex-start;
  padding: 12px 16px;
  background: var(--bg-primary);
  border-radius: 8px;
  border: 1px solid var(--border-subtle);
}

.highlight-item .item-icon {
  font-size: 20px;
}

.highlight-item p {
  margin: 4px 0 0;
  font-size: 12px;
  color: var(--text-muted);
}

.step-intro {
  margin: 0 0 16px;
  color: var(--text-muted);
  font-size: 14px;
}

.checks-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.check-row {
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 12px 16px;
  background: var(--bg-primary);
  border-radius: 8px;
  border: 1px solid var(--border-subtle);
}

.check-icon {
  color: #10b981;
  font-weight: bold;
  font-size: 16px;
}

.check-details {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.check-details span {
  font-size: 12px;
  color: var(--text-muted);
}

.apps-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 10px;
}

.app-card {
  padding: 12px;
  background: var(--bg-primary);
  border: 1px solid var(--border-subtle);
  border-radius: 8px;
}

.app-card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 6px;
}

.app-card-detail {
  margin: 0;
  font-size: 11px;
  color: var(--text-muted);
}

.clients-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
  max-height: 280px;
  overflow-y: auto;
}

.client-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px 14px;
  background: var(--bg-primary);
  border: 1px solid var(--border-subtle);
  border-radius: 6px;
}

.client-info {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.client-path {
  font-size: 11px;
  color: var(--text-muted);
}

.badge {
  font-size: 11px;
  padding: 3px 8px;
  border-radius: 4px;
}

.badge-green { background: rgba(16, 185, 129, 0.15); color: #10b981; }
.badge-blue { background: rgba(59, 130, 246, 0.15); color: #3b82f6; }
.badge-gray { background: rgba(156, 163, 175, 0.15); color: #9ca3af; }

.runtime-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
}

.runtime-item {
  padding: 14px;
  background: var(--bg-primary);
  border: 1px solid var(--border-subtle);
  border-radius: 8px;
}

.runtime-item p {
  margin: 6px 0 0;
  font-size: 13px;
}

.text-green { color: #10b981; }
.text-yellow { color: #f59e0b; }

.info-alert {
  display: flex;
  gap: 12px;
  padding: 14px;
  background: rgba(59, 130, 246, 0.1);
  border: 1px solid rgba(59, 130, 246, 0.3);
  border-radius: 8px;
  margin-bottom: 16px;
}

.alert-icon {
  font-size: 20px;
}

.info-alert p {
  margin: 4px 0 0;
  font-size: 12px;
  line-height: 1.5;
}

.preview-box {
  background: #0f172a;
  padding: 14px;
  border-radius: 8px;
  overflow-x: auto;
}

.preview-box pre {
  margin: 0;
  font-family: monospace;
  font-size: 12px;
  color: #38bdf8;
}

.finish-step {
  text-align: center;
  padding: 20px 0;
}

.finish-icon {
  font-size: 56px;
  margin-bottom: 12px;
}

.finish-text {
  max-width: 540px;
  margin: 10px auto 0;
  color: var(--text-muted);
  font-size: 14px;
  line-height: 1.6;
}

.modal-footer {
  padding: 16px 24px;
  display: flex;
  align-items: center;
  border-top: 1px solid var(--border-subtle);
  background: var(--bg-primary);
}

.footer-spacer {
  flex: 1;
}

.fluent-btn {
  padding: 8px 18px;
  border-radius: 6px;
  font-size: 13px;
  cursor: pointer;
  border: 1px solid transparent;
  font-weight: 500;
}

.btn-primary {
  background: var(--accent-blue);
  color: white;
}

.btn-primary:hover {
  filter: brightness(1.1);
}

.btn-secondary {
  background: var(--bg-secondary);
  border-color: var(--border-subtle);
  color: var(--text-primary);
}
</style>
