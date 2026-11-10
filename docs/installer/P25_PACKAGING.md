# MADEL Studio Bridge — Phase P25 Packaging Specification
## Tauri v2 Windows Bundling & Resource Packaging
**Platform Version:** v0.11.0  
**Owner & Lead Architect:** Mahmoud Adel (`Mahmoudmarktingiq`)

---

## 1. Bundling Objectives

The primary packaging goal for Phase P25 is to produce a self-contained Windows Installer that:
1. Bundles the compiled Vue 3 desktop interface (`apps/desktop/dist/`).
2. Packages the compiled Node.js backend (`packages/server/dist/`) and its manifest into application resources.
3. Configures NSIS installer targets with per-user installation semantics.
4. Ensures the application can execute from any arbitrary directory without requiring access to `D:\MCP` development source code.
5. Declares unsigned code status honestly without falsifying certificates or attempting Defender bypasses.

---

## 2. Tauri Configuration (`tauri.conf.json`)

The packaging configuration is declared in `apps/desktop/src-tauri/tauri.conf.json`:

```json
{
  "$schema": "https://schema.tauri.app/config/2",
  "productName": "MADEL Studio Bridge",
  "version": "0.11.0",
  "identifier": "com.madel.studiobridge",
  "build": {
    "beforeDevCommand": "npm run dev",
    "devUrl": "http://localhost:1420",
    "beforeBuildCommand": "npm run build",
    "frontendDist": "../dist"
  },
  "app": {
    "windows": [
      {
        "title": "MADEL Studio Bridge",
        "width": 1150,
        "height": 780,
        "minWidth": 900,
        "minHeight": 650,
        "decorations": true,
        "center": true,
        "resizable": true
      }
    ],
    "security": {
      "csp": "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data: asset:; font-src 'self' data:;"
    },
    "trayIcon": {
      "iconPath": "icons/icon.png",
      "iconAsTemplate": true,
      "tooltip": "MADEL Studio Bridge"
    }
  },
  "bundle": {
    "active": true,
    "targets": ["nsis"],
    "icon": [
      "icons/32x32.png",
      "icons/128x128.png",
      "icons/icon.ico"
    ],
    "resources": [
      "resources/**/*"
    ],
    "windows": {
      "nsis": {
        "installMode": "currentUser",
        "languages": ["en-US"],
        "installerIcon": "icons/icon.ico"
      }
    }
  }
}
```

---

## 3. Resource Preparation Automation

The resource preparation script `scripts/prepare-desktop-resources.mjs` runs automatically during `npm run build` in `apps/desktop`:
```js
// Synchronizes compiled server distribution to Tauri resources
cpSync(serverDist, targetDist, { recursive: true });
copyFileSync(serverPkg, join(targetServerDir, "package.json"));
```

This ensures that whenever the desktop app is built or packaged, `resources/server/dist` matches the latest compiled backend code with zero manual copying.

---

## 4. Unsigned Code Notice & Code Signing Policy

- **Current Status**: Local Beta Development Release (Self-Built / Unsigned).
- **Code Signing**: No commercial EV (Extended Validation) code signing certificate is attached in this private local build.
- **Windows SmartScreen**: Windows SmartScreen or Windows Defender may display an unrecognized publisher notification if executed outside the local developer profile.
- **Verification**: The build does NOT attempt to bypass, disable, or tamper with Windows Defender, SmartScreen, or code integrity policies. Users running local test installations can verify the installer binary via SHA-256 hash checksums.
