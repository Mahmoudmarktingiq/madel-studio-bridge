# MADEL Studio Bridge — Phase P25.8 Installer Integrity Report
## Version Unification, Bundled Dependencies & Windows Setup Validation

**Project**: MADEL Studio Bridge  
**Repository**: [Mahmoudmarktingiq/madel-studio-bridge](https://github.com/Mahmoudmarktingiq/madel-studio-bridge)  
**Developer & Maintainer**: Mahmoud Adel (`Mahmoudmarktingiq`)  
**Date**: November 12, 2026  
**Phase**: P25.8 (Installed Desktop Synchronization & Browser Computer Use Acceptance)  
**Release Package**: `MADEL Studio Bridge_0.11.7_x64-setup.exe`  
**Target Platform**: Windows 10 / Windows 11 (64-bit)  
**Build Status**: `VERIFIED — 100% PASS`  

---

### 1. Package Specifications & Checksums

| Attribute | Specification / Verification Value |
| :--- | :--- |
| **Installer File Name** | `MADEL Studio Bridge_0.11.7_x64-setup.exe` |
| **Primary Repository Path**| `installers/windows/MADEL Studio Bridge_0.11.7_x64-setup.exe` |
| **Tauri Build Target Path**| `apps/desktop/src-tauri/target/release/bundle/nsis/MADEL Studio Bridge_0.11.7_x64-setup.exe` |
| **Exact File Size** | `29,765,380 bytes` (28.39 MiB) |
| **SHA-256 Digest** | `73E50D4A5737F458E066235D2AC6603D70FB540871B295C60A8C9E902B14B900` |
| **Target Architecture** | `x64` |
| **Product Version** | `0.11.7.0` |
| **File Version** | `0.11.7.0` |
| **Publisher** | Mahmoud Adel (`madel`) |

---

### 2. Bundled Content & Runtime Independence

The NSIS installer bundles a completely self-contained runtime stack, allowing the application to execute on fresh Windows machines without requiring prior installations of Node.js, Python, or Git:

```
%LOCALAPPDATA%\MADEL Studio Bridge\
├── madel-desktop.exe               # Native Tauri v2 Rust executable (9.87 MB)
├── uninstall.exe                   # Clean uninstaller (110 KB)
└── resources\
    ├── nodejs\
    │   └── node.exe                # Standalone Node.js v26.13.0 runtime (76.8 MB)
    └── server\
        ├── package.json            # Server package metadata
        ├── dist\                   # Compiled TypeScript backend
        │   ├── desktop\bridge-rpc.js
        │   ├── tools\browser-manager.js
        │   ├── tools\browser-security.js
        │   ├── tools\cdp-client.js
        │   ├── tools\file-operations.js
        │   └── ... (all 231 MCP tools)
        └── node_modules\           # 95 essential production dependencies
            ├── @brainferno/
            ├── @hono/
            ├── @modelcontextprotocol/
            ├── ws/
            ├── zod/
            └── ... (complete offline runtime)
```

---

### 3. Verification of Non-Destructive Update

The update from `v0.11.4` to `v0.11.7` was executed via silent switch (`/S`):
1. **Preservation of User Configurations**: Existing user configuration files in `~/.brainferno-mcp-bridge/` (`bridge.json`, tokens) were untouched.
2. **Preservation of Creative Workspaces**: All user projects and assets in `D:\MCP\` remained 100% intact.
3. **Seamless Binary Upgrade**:
   - `madel-desktop.exe` was upgraded from `0.11.4` to `0.11.7`.
   - `resources/server/dist/` was updated with the latest compiled browser and file operation modules.
4. **Zero Lingering Artifacts**: Temporary installation scripts and lock files were cleaned automatically upon installer completion (`ExitCode: 0`).
