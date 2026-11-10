# MADEL Studio Bridge — Phase P23 Session Security & Guardrails
**Owner & Lead Architect:** Mahmoud Adel (`Mahmoudmarktingiq`)  
**Status:** Verified & Active  
**Date:** 2026-11-10

---

## 1. Threat Model & Design Principles
Browser automation bridges external, untrusted web content into local AI workflows. Without rigorous isolation, risks include credential extraction, cookie compromise, malicious JavaScript payload execution, unauthorized file system access, and termination of personal user sessions.

MADEL Studio Bridge addresses each vector through multi-layered defense:

```text
Untrusted Web Content
       │
       ▼ (1. URL Scheme Allowlist & Blocking)
Isolated Chromium Instance
       │
       ▼ (2. Ephemeral User Profile & Sandbox Flags)
Zero Personal Cookie / Credential Access
       │
       ▼ (3. Read-Only CDP Inspection & Safe Evaluation)
Zero Arbitrary Shell / OS Execution
       │
       ▼ (4. Mandatory Human Approval on Destructive Actions)
Localhost-Only CDP Interface (127.0.0.1)
```

---

## 2. Hardened Chromium Security Flags
Every browser session launched by `BrowserManager` enforces the following startup arguments:
- `--headless=new`: Modern, full-fidelity headless Chromium rendering.
- `--remote-debugging-port=<ephemeral>`: Port chosen dynamically to avoid port collisions.
- `--remote-debugging-address=127.0.0.1`: Explicit binding to IPv4 loopback only.
- `--user-data-dir=<isolatedDir>`: Ephemeral directory completely distinct from `%LOCALAPPDATA%\Google\Chrome\User Data`.
- `--no-first-run --no-default-browser-check`: Disables onboarding wizards.
- `--disable-background-networking`: Suppresses background synchronization and diagnostic pings.
- `--disable-sync`: Disables Google Account sync.
- `--password-store=basic`: Disables Windows DPAPI/OS credential store access.
- `--disable-features=AutofillServerCommunication,OptimizationGuideModelDownloading`: Blocks remote telemetry and auto-fill leaks.

---

## 3. URL Scheme Allowlist & Blocklist
- **Allowed Protocols:** `http:`, `https:`.
- **Approved Local File Access:** `file://` allowed strictly if candidate path resides within approved workspace roots (`D:\MCP` or system temp).
- **Hard-Blocked Protocols:**
  - `javascript:` (Arbitrary script injection)
  - `vbscript:` (Legacy script execution)
  - `data:` (Inline malicious HTML payloads)
  - `chrome:` / `edge:` / `devtools:` / `view-source:` (Internal browser configuration tampering)

---

## 4. Non-Destructive Protection & Process Scoping
1. **Never Kill User Browsers:**
   The `BrowserManager` tracks only child processes whose PIDs were spawned directly by MADEL. When closing sessions or shutting down the platform, `taskkill` operates solely against registered session PIDs.
2. **Ephemeral Profile Deletion:**
   Upon session close, the ephemeral session profile is recursively deleted, leaving zero residual cookies, cached passwords, or history on the file system.
3. **Mandatory Confirmation on Destructive Actions:**
   `browser_upload_local_file` strictly requires `approved: true`. Any attempt to upload files without explicit confirmation immediately throws a security error.
4. **Sensitive File Blacklist:**
   Even within approved workspaces, uploading files matching `.env`, `*id_rsa*`, `*.pem`, `*.key`, or inside `.git` directories is unconditionally rejected.
