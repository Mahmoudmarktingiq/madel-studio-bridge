<script setup lang="ts">
import { useSettingsStore } from "../stores/settings";

const settingsStore = useSettingsStore();
</script>

<template>
  <div class="settings-view">
    <div class="view-header">
      <div>
        <h2 class="view-title">Settings & Preferences</h2>
        <p class="view-desc">
          Configure application appearance, Windows background behaviors, and system tray integration.
        </p>
      </div>
    </div>

    <div class="settings-sections">
      <!-- Appearance -->
      <div class="fluent-card settings-card">
        <h3 class="section-title">Visual Appearance & Themes</h3>
        <p class="section-desc">Choose between dark and light themes inspired by Microsoft Fluent and Apple HIG.</p>

        <div class="theme-options">
          <button
            class="fluent-btn theme-btn"
            :class="{ active: settingsStore.theme === 'dark' }"
            @click="settingsStore.setTheme('dark')"
          >
            <span class="theme-icon">🌙</span>
            <div class="theme-text">
              <strong>Dark Mode (Fluent Obsidian)</strong>
              <span>Recommended for creative studios and low-light coding.</span>
            </div>
          </button>

          <button
            class="fluent-btn theme-btn"
            :class="{ active: settingsStore.theme === 'light' }"
            @click="settingsStore.setTheme('light')"
          >
            <span class="theme-icon">☀</span>
            <div class="theme-text">
              <strong>Light Mode (Fluent Clean)</strong>
              <span>High contrast clean surface for daylight environments.</span>
            </div>
          </button>
        </div>
      </div>

      <!-- System Tray & Background Lifecycle -->
      <div class="fluent-card settings-card">
        <h3 class="section-title">Windows System Tray & Lifecycle</h3>
        <p class="section-desc">Manage how the desktop dashboard interacts with long-running MCP background daemons.</p>

        <div class="setting-toggle">
          <div class="toggle-info">
            <strong>Minimize to System Tray on Close</strong>
            <span>Closing the main window hides the UI and keeps background MCP servers running for Claude, Codex, and Antigravity.</span>
          </div>
          <input
            v-model="settingsStore.autoMinimizeToTray"
            type="checkbox"
            class="fluent-checkbox"
          />
        </div>

        <div class="setting-toggle">
          <div class="toggle-info">
            <strong>Launch MADEL Desktop at Windows Startup</strong>
            <span>Starts the dashboard minimized to the system tray upon user login.</span>
          </div>
          <input
            v-model="settingsStore.launchAtLogin"
            type="checkbox"
            class="fluent-checkbox"
          />
        </div>
      </div>

      <!-- Language & Auto-Refresh -->
      <div class="fluent-card settings-card">
        <h3 class="section-title">Localization & Refresh Cadence</h3>

        <div class="setting-field">
          <label>Interface Language / لغة الواجهة:</label>
          <div class="lang-buttons">
            <button
              class="fluent-btn lang-btn"
              :class="{ active: settingsStore.language === 'en' }"
              @click="settingsStore.setLanguage('en')"
            >
              English (Default)
            </button>
            <button
              class="fluent-btn lang-btn"
              :class="{ active: settingsStore.language === 'ar' }"
              @click="settingsStore.setLanguage('ar')"
            >
              العربية (RTL)
            </button>
          </div>
        </div>

        <div class="setting-field">
          <label>Metrics Polling Interval:</label>
          <select v-model="settingsStore.refreshIntervalMs" class="fluent-select">
            <option :value="2000">Every 2 seconds (Fast)</option>
            <option :value="5000">Every 5 seconds (Recommended)</option>
            <option :value="10000">Every 10 seconds (Power saver)</option>
          </select>
        </div>
      </div>

      <!-- About / Maintainer -->
      <div class="fluent-card settings-card about-card">
        <h3 class="section-title">About MADEL Studio Bridge</h3>
        <p class="about-lead">
          MADEL Studio Bridge is an enterprise-grade Model Context Protocol (MCP) hub connecting Adobe Creative Cloud (Photoshop, Illustrator, Premiere Pro, After Effects), 3D graphics (Blender), Browser Automation (Chrome/Edge), and CapCut desktop tools to frontier AI assistants.
        </p>
        <div class="about-meta">
          <div><strong>Architect & Lead Developer:</strong> Mahmoud Adel (محمود عادل)</div>
          <div><strong>GitHub Repository:</strong> <a href="https://github.com/Mahmoudmarktingiq/madel-studio-bridge" target="_blank" class="about-link">Mahmoudmarktingiq/madel-studio-bridge</a></div>
          <div><strong>License:</strong> Apache-2.0 Open Source License</div>
          <div><strong>Version:</strong> v0.11.4 (Phase P25.4 Real Desktop GUI & Integration Acceptance)</div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.settings-view {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.view-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.view-title {
  font-size: 16px;
  font-weight: 700;
  color: var(--text-primary);
}

.view-desc {
  font-size: 12px;
  color: var(--text-muted);
}

.settings-sections {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.settings-card {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.section-title {
  font-size: 14px;
  font-weight: 600;
  color: var(--text-primary);
}

.section-desc {
  font-size: 12px;
  color: var(--text-muted);
}

.theme-options {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
}

.theme-btn {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px;
  text-align: left;
  border-radius: 8px;
}

.theme-btn.active {
  border-color: var(--accent-primary);
  background: var(--accent-surface);
}

.theme-icon {
  font-size: 22px;
}

.theme-text {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.theme-text strong {
  font-size: 13px;
  color: var(--text-primary);
}

.theme-text span {
  font-size: 11px;
  color: var(--text-muted);
}

.setting-toggle {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px 0;
  border-top: 1px solid var(--border-subtle);
}

.toggle-info {
  display: flex;
  flex-direction: column;
  gap: 2px;
  max-width: 80%;
}

.toggle-info strong {
  font-size: 13px;
  color: var(--text-primary);
}

.toggle-info span {
  font-size: 11px;
  color: var(--text-muted);
}

.fluent-checkbox {
  width: 18px;
  height: 18px;
  accent-color: var(--accent-primary);
  cursor: pointer;
}

.setting-field {
  display: flex;
  flex-direction: column;
  gap: 6px;
  font-size: 12px;
  color: var(--text-secondary);
}

.lang-buttons {
  display: flex;
  gap: 10px;
}

.lang-btn {
  padding: 6px 14px;
}

.lang-btn.active {
  border-color: var(--accent-primary);
  color: var(--accent-primary);
  font-weight: 600;
}

.fluent-select {
  background: var(--bg-surface);
  border: 1px solid var(--border-default);
  border-radius: 6px;
  padding: 6px 10px;
  color: var(--text-primary);
  font-size: 12px;
  max-width: 280px;
}

.about-card {
  background: var(--bg-surface);
}

.about-lead {
  font-size: 12px;
  line-height: 1.5;
  color: var(--text-secondary);
}

.about-meta {
  display: flex;
  flex-direction: column;
  gap: 6px;
  font-size: 12px;
  padding-top: 8px;
  border-top: 1px solid var(--border-subtle);
}

.about-link {
  color: var(--text-link);
  text-decoration: none;
}

.about-link:hover {
  text-decoration: underline;
}
</style>
