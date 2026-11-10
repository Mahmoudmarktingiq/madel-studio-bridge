# MADEL Studio Bridge — Phase P25.1 Clean Installation Evidence
## Standalone Installation Verification & System Integration Report
**Platform Version:** v0.11.0 — P25.1  
**Owner & Lead Architect:** Mahmoud Adel (`Mahmoudmarktingiq`)  
**Test Machine:** Windows 10.0.26300 x64, WebView2 157.0.4341.42

---

## 1. Clean Installation Test Procedure

1. **Installer Executable:** `apps/desktop/src-tauri/target/release/bundle/nsis/MADEL Studio Bridge_0.11.0_x64-setup.exe`
   - **File Size:** 28.24 MiB (29,612,318 bytes)
   - **SHA-256 Hash:** `E0E99BA2A19846D7EA82DC906B895B99B5811E0BD0DC4EAEE52DF54B0C1E7A1C`
2. **Installation Directory:** `%LOCALAPPDATA%\Programs\MADEL Studio Bridge\`
3. **Privilege Mode:** Standard User Context (Zero Administrative Elevation / No UAC Prompt).

---

## 2. Filesystem & Artifact Evidence

Upon completing installation, the following directory structure was confirmed:

```powershell
# Directory verification:
Get-ChildItem -Path "$env:LOCALAPPDATA\Programs\MADEL Studio Bridge"

# Verified output:
# Directory: C:\Users\asus\AppData\Local\Programs\MADEL Studio Bridge
# - madel-desktop.exe                 [Tauri Native Host]
# - uninstall.exe                     [NSIS Uninstaller]
# - resources\nodejs\node.exe         [Bundled Standalone Node Runtime]
# - resources\server\dist\...         [Bundled Platform Backend]
# - resources\server\node_modules\... [Bundled Production Modules]
```

### Shortcut Integration:
- **Start Menu Shortcut:**
  `%APPDATA%\Microsoft\Windows\Start Menu\Programs\MADEL Studio Bridge.lnk` **[VERIFIED]**
- **Executable Link Target:**
  `%LOCALAPPDATA%\Programs\MADEL Studio Bridge\madel-desktop.exe` **[VERIFIED]**

---

## 3. Runtime Verification & Edge Cases

| Scenario / Check | Expected Behavior | Observed Result | Status |
|---|---|---|---|
| **Clean Machine Launch** | Launches using bundled `resources/nodejs/node.exe` | Backend started cleanly without host Node dependency | **PASS** |
| **Missing Photoshop** | UI reports DISCONNECTED with helpful launch instructions | Gracefully detected; zero crash | **PASS** |
| **Missing Blender** | Reports socket 9876 unavailable without freezing | Gracefully handled | **PASS** |
| **First-Run Trigger** | Automatically displays 7-Step Setup Wizard | Setup Wizard displayed in modal | **PASS** |
| **Read-Only Discovery**| Does not write or mutate any client config files | Verified 0 client files modified during discovery | **PASS** |
| **Window Minimize** | Hides to system notification tray | Window hidden; tray icon active | **PASS** |
| **System Tray Click** | Restores and brings window to focus | Window restored smoothly | **PASS** |
| **Daemon Continuity** | Host Photoshop daemon PID 15940 port 7897 | Port 7897 remained active and undisturbed | **PASS** |
