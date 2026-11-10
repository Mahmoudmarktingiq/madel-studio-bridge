# MADEL Studio Bridge — Phase P25.2 Setup Package Audit Report
## Binary Integrity, Privacy Verification & Open Source Licensing
**Platform Version:** v0.11.1 (P25.2 Release Candidate)  
**Owner & Lead Architect:** Mahmoud Adel (`Mahmoudmarktingiq`)  
**Package Target:** `apps/desktop/src-tauri/target/release/bundle/nsis/MADEL Studio Bridge_0.11.0_x64-setup.exe`  
**Package Size:** 29,060,219 bytes (27.71 MiB)  
**SHA-256 Checksum:** `9E2C7776A30CB0ED29B1CBD41377D35996A3A572FD0E92E58364555C67E1008D`  
**Status:** **AUDITED & VERIFIED (0 PRIVACY LEAKS, PERMISSIVE LICENSES ONLY)**

---

## 1. Package Payload Audit

An automated recursive scan was executed across all packaged files in `apps/desktop/src-tauri/resources/`:

```
apps/desktop/src-tauri/resources/
├── nodejs/
│   └── node.exe                         [Clean Node.js v26.13.0 Binary]
└── server/
    ├── package.json                     [Server Manifest]
    ├── dist/                            [Compiled Pure JavaScript Runtime]
    │   ├── index.js                     [Stdio Server Entrypoint]
    │   ├── server.js                    [231 Tool Registry Builder]
    │   ├── desktop/bridge-rpc.js        [Bridge JSON-RPC Handler]
    │   ├── gateway/approval-gate.js     [Hardened Action Approval Gate]
    │   ├── gateway/concurrency-manager.js [FIFO WorkLimiter Engine]
    │   ├── clients/                     [Declarative Client Registry]
    │   └── tools/                       [Specialized Creative Tools]
    └── node_modules/                    [Essential Production Modules Only]
        ├── @brainferno/                 [Apache-2.0 Protocol Engine]
        ├── @modelcontextprotocol/       [MIT MCP Official SDK]
        ├── zod/                         [MIT Schema Validation]
        ├── ws/                          [MIT Local WebSocket Transport]
        └── path-browserify/             [MIT Path Utilities]
```

---

## 2. Privacy & Secret Hygiene Verification

The automated file scanner checked 100% of packaged files against the following exclusion criteria:

| Category | Scan Criteria | Result | Evidence |
|---|---|:---:|---|
| **API Keys & Tokens** | `ghp_`, `sk-`, `AIza`, `AKIA` patterns | **0 Found** | Clean scan |
| **Passwords / Credentials** | `password`, `credentials.json`, `token.json` | **0 Found** | None included |
| **Git Credentials** | `.git/`, `.gitconfig`, `.git-credentials` | **0 Found** | None included |
| **Browser Data** | Cookies, history, session files | **0 Found** | None included |
| **Personal Files** | Any file outside platform architecture | **0 Found** | None included |
| **Test Assets** | `*.test.*`, `__tests__/`, `test-*`, `.tmp`, `.orig` | **0 Found** | Strictly filtered |
| **Source Maps** | `*.map` | **0 Found** | Excluded from bundle |

---

## 3. Open Source Licensing & Redistribution Audit

All runtime components bundled inside the installer are governed by permissive open source licenses that permit commercial and private redistribution:

| Component | Bundled Path | License Type | Redistribution Rights |
|---|---|:---:|:---:|
| **Node.js Runtime** | `resources/nodejs/node.exe` | MIT License | Permitted with copyright notice |
| **MCP SDK** | `node_modules/@modelcontextprotocol/` | MIT License | Permitted |
| **Brainferno Protocol** | `node_modules/@brainferno/` | Apache-2.0 | Permitted with notice |
| **Zod** | `node_modules/zod/` | MIT License | Permitted |
| **WS (WebSocket)** | `node_modules/ws/` | MIT License | Permitted |
| **Path Browserify** | `node_modules/path-browserify/` | MIT License | Permitted |

---

## 4. Code Signing & Windows SmartScreen Notice

- **Code Signing Certificate:** None configured (`certificateThumbprint: null`).
- **Binary Status:** **Unsigned Release Candidate (Self-Contained / Ad-Hoc)**.
- **SmartScreen Behavior:**  
  When running the installer on a machine where it has not accumulated reputation or was downloaded over HTTP/browser, Windows Defender SmartScreen will display:
  > *"Windows protected your PC — Microsoft Defender SmartScreen prevented an unrecognized app from starting."*
- **Policy Compliance:**  
  As instructed in platform rules, **SmartScreen must not be circumvented, spoofed, or bypassed**. Users and beta testers running the private beta execute the binary via standard Windows standard-user click *"More info -> Run anyway"*. Code signing with a hardware EV token or trusted publisher certificate is deferred to public distribution milestones.
