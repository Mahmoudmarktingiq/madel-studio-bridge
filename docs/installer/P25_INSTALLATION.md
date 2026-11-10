# MADEL Studio Bridge — Phase P25 Installation Guide
## Clean Windows Installation Procedure & Verification
**Platform Version:** v0.11.0  
**Owner & Lead Architect:** Mahmoud Adel (`Mahmoudmarktingiq`)

---

## 1. System Requirements

| Component | Minimum Requirement | Recommended |
|---|---|---|
| **OS** | Windows 10 (Build 19041+) 64-bit | Windows 11 (22H2+) 64-bit |
| **Architecture** | x86_64 / AMD64 | x86_64 / AMD64 |
| **Runtime** | Microsoft Edge WebView2 Runtime | Evergreen WebView2 (Preinstalled on Win 10/11) |
| **Node.js** | Node.js v20.x or v22+ LTS | Node.js v26+ |
| **RAM** | 4 GB | 16 GB+ for Creative Suites |
| **Disk Space** | 250 MB free space | 1 GB+ free space |
| **Privileges** | Standard User Account | Standard User Account (No UAC elevation required) |

---

## 2. Installation Modes & Behavior

### 2.1 Per-User Installation (`currentUser` Mode — Default)
- **Target Path:** `%LOCALAPPDATA%\Programs\MADEL Studio Bridge\`
- **Privilege Level:** Standard user privileges. No administrative prompt or UAC elevation is requested.
- **Shortcuts:**
  - Start Menu: `%APPDATA%\Microsoft\Windows\Start Menu\Programs\MADEL Studio Bridge.lnk`
  - Desktop: Optional desktop shortcut selectable in setup wizard.
- **Registry Keys:** `HKCU\Software\Microsoft\Windows\CurrentVersion\Uninstall\MADEL Studio Bridge`

### 2.2 Unattended / Silent Installation
The generated NSIS installer supports standard NSIS command-line switches:
```powershell
# Silent install in background:
.\madel-desktop_0.11.0_x64-setup.exe /S

# Specify custom installation directory:
.\madel-desktop_0.11.0_x64-setup.exe /S /D=C:\Tools\MADEL-Bridge
```

---

## 3. Post-Installation Verification Checklist

Upon installation completion, verify:
1. `madel-desktop.exe` exists in the target installation directory.
2. `resources/server/dist/desktop/bridge-rpc.js` is present and readable.
3. Start Menu shortcut launches `MADEL Studio Bridge` with native icon.
4. System Tray icon appears in notification overflow area.
5. Launching the application initiates the 7-step Setup Wizard on first run.
6. Existing daemons (Photoshop on port 7897) remain connected and active without disruption.
