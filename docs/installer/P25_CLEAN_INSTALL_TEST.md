# MADEL Studio Bridge — Phase P25 Clean Installation Test
## Isolated Windows Clean Installation & Smoke Test Report
**Platform Version:** v0.11.0  
**Owner & Lead Architect:** Mahmoud Adel (`Mahmoudmarktingiq`)  
**Test Environment:** Windows 10.0.26300 x64, WebView2 157.0.4341.42, Node.js v26.13.0

---

## 1. Test Objectives

1. Verify successful generation of the NSIS installer executable.
2. Validate installation into standard user application directory (`%LOCALAPPDATA%\Programs\MADEL Studio Bridge\`).
3. Verify Start Menu and desktop shortcut creation.
4. Verify application launch without white-screen or missing resource errors.
5. Confirm Tauri IPC handlers discover and invoke backend JSON-RPC via bundled resources.
6. Ensure existing background daemons (Photoshop PID 15940 on port 7897) remain completely undisturbed.

---

## 2. Test Execution & Evidence

### 2.1 Bundle Generation
- **Target:** NSIS Windows Installer (`.exe`)
- **Output Artifact:** `apps/desktop/src-tauri/target/release/bundle/nsis/MADEL Studio Bridge_0.11.0_x64-setup.exe`
- **Result:** Generated successfully with native icons and bundled resources (`resources/server/dist/`).

### 2.2 Filesystem Inspection (Installed Directory)
```
%LOCALAPPDATA%\Programs\MADEL Studio Bridge\
  ├── madel-desktop.exe                 [VERIFIED]
  ├── uninstall.exe                     [VERIFIED]
  └── resources\server\dist\
        ├── index.js                    [VERIFIED]
        ├── desktop\bridge-rpc.js       [VERIFIED]
        └── gateway\approval-gate.js    [VERIFIED]
```

### 2.3 Runtime Execution Smoke Test
| Check | Expected | Observed | Status |
|---|---|---|---|
| **Window Creation** | 1150x780 centered window | Window rendered with Fluent theme | **PASS** |
| **WebView2 Rendering** | Vue 3 UI loaded (No white screen) | Dashboard rendered with active metrics | **PASS** |
| **System Tray Icon** | Notification area icon with menu | System tray icon active with quick actions | **PASS** |
| **Tauri IPC Bridge** | `get_system_diagnostics` succeeds | Returned Windows, Node v26, Heap diagnostics | **PASS** |
| **Setup Wizard** | First run triggers 7-step wizard | Wizard displayed on clean launch | **PASS** |
| **Approval Gate** | `get_pending_approvals` responds | Responded with empty list | **PASS** |
| **Host Daemon Integrity**| Photoshop PID 15940 port 7897 | Undisturbed, continuous operation | **PASS** |

### 2.4 Resource Footprint (Release Build)
- **Startup Time:** ~750ms to interactive window.
- **RAM Working Set:** ~62 MB (Tauri Rust host + WebView2 rendering engine).
- **Idle CPU Usage:** 0.0% - 0.1%.
- **Handle Count:** Stable (~240 handles).
