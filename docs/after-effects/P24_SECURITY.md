# MADEL Studio Bridge — Phase P24: Security Architecture & Audit Report
**Developed and maintained by Mahmoud Adel**

## 1. Security Architecture Overview

Phase P24 adheres to MADEL Studio Bridge's strict defense-in-depth security model. Autonomous AI agents interacting with motion graphics software operate within clearly defined sandbox boundaries to protect system integrity, media assets, and source repositories.

```
+-----------------------------------------------------------------------------------------+
|                                    DEFENSE-IN-DEPTH TIERS                               |
+-----------------------------------------------------------------------------------------+
| Tier 1: Input Validation        | Zod 4.6.7 schemas, positive integers, bounded ranges  |
| Tier 2: Affirmative Guards      | confirm: true (delete), approved: true (render)       |
| Tier 3: Subprocess Hardening    | Injection-free argv arrays, hidden console, timeouts  |
| Tier 4: Path & Workspace Bounds | Strict approved roots, forbidden substrings, blocklist|
| Tier 5: Audit & Observability   | SHA-256 script hashing, structured activity logs      |
+-----------------------------------------------------------------------------------------+
```

---

## 2. Affirmative Confirmation Guards

### 2.1 Layer Deletion Guard (`ae_delete_layer`)
Deleting a composition layer permanently destroys artwork, complex expressions, and attached effects.
- **Rule**: Every invocation must provide explicit `confirm: true`.
- **Enforcement**: If `confirm` is omitted or `false`, execution aborts before any script reaches the host:
  ```json
  {
    "isError": true,
    "content": [{ "type": "text", "text": "Action cancelled: ae_delete_layer requires confirm: true to prevent accidental data loss." }]
  }
  ```

### 2.2 Headless Render Guard (`ae_render_comp`)
Spawning background rendering consumes heavy GPU and CPU resources.
- **Rule**: Every invocation must provide explicit `approved: true`.
- **Enforcement**: Aborts before saving the project or spawning `aerender.exe`:
  ```json
  {
    "isError": true,
    "content": [{ "type": "text", "text": "Render aborted: parameter 'approved: true' is required to execute headless render via aerender." }]
  }
  ```

---

## 3. Subprocess Execution Hardening (`aerender.exe`)

1. **No Shell Concatenation**: `child_process.spawn` is used with a strict array of arguments (`['-project', ..., '-comp', ...]`). `shell: true` is strictly prohibited.
2. **Hidden Execution**: `windowsHide: true` prevents intrusive console popup windows on the desktop.
3. **Execution Timeouts**: A strict timeout timer (default: 5 minutes, max: 10 minutes) automatically terminates stalled child processes via `SIGTERM`.

---

## 4. P23 Browser Security Follow-up & Path Sandboxing

During Phase P24 preflight, the `BrowserSecurityPolicy` path sandbox in `packages/server/src/tools/browser-security.ts` was tightened:
1. **Restricted Workspace Roots**: The loose `D:\MCP` root was replaced with explicit creative workspace subdirectories (`D:\MCP\11-Other-Apps\Browser\MADEL`, `D:\MCP\07-AfterEffects\MADEL`, etc.).
2. **Forbidden Substrings**: Path candidates containing `\01-projects\source\`, `\.git\`, `\node_modules\`, `\appdata\roaming\`, or `\windows\system32\` are instantly rejected.
3. **Blocked Exact Files**: Direct file access to root rule files (`AGENTS.md`, `CLAUDE.md`, `CODEX.md`, `GEMINI.md`) is blocked.

---

## 5. Security Scan Results

### 5.1 Secret & Credential Scan (`tools/scan-secrets.mjs`)
- **Files Scanned**: 420 source and configuration files.
- **Alerts Found**: `0`.
- **Status**: **PASS (0 SECRETS DETECTED)**.

### 5.2 Dependency Vulnerability Audit (`npm audit --omit=dev`)
- **Vulnerabilities**: `0`.
- **Status**: **PASS (0 VULNERABILITIES)**.
