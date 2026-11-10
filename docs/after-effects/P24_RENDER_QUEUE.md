# MADEL Studio Bridge — Phase P24: Render Queue & Headless aerender Engine
**Developed and maintained by Mahmoud Adel**

## 1. Architecture Overview

Rendering complex motion graphics compositions is computationally intensive. Freezing the operator's Adobe After Effects GUI during a multi-minute render disrupts human-AI collaboration.

MADEL Studio Bridge addresses this by implementing a **dual-mode render architecture**:

```
+------------------------------------------------------------------------------------+
|                                Render Request Pipeline                             |
+------------------------------------------------------------------------------------+
                                      |
                 +--------------------+--------------------+
                 |                                         |
                 v                                         v
     [Mode 1: Interactive Preview]              [Mode 2: Production Render]
           ae_render_frame                            ae_render_comp
                 |                                         |
     Fast single-frame snapshot                Background Headless Execution
       (CompItem.saveFrameToPng)                      (aerender.exe)
                 |                                         |
     Returns base64 PNG preview               Renders full composition without
     without touching disk files               blocking the user's After Effects UI
```

---

## 2. Headless aerender Execution Lifecycle

```
[AI Client: ae_render_comp (approved: true)]
                 │
                 ▼
[1. Preflight Validation]
  ├── Verify approved: true
  ├── Check project is saved to disk
  └── Discover aerender.exe executable
                 │
                 ▼
[2. Concurrency Lock: scope "after_effects:render"]
  ├── Concurrency = 1 (Exclusive GPU/CPU render slot)
  └── Timeout = 600,000 ms (10 minutes)
                 │
                 ▼
[3. Project State Sync]
  └── Invoke ae_save_project to persist latest composition edits
                 │
                 ▼
[4. Spawn aerender.exe Process]
  ├── Injection-free argv array: ['-project', ..., '-comp', ..., '-output', ...]
  ├── stdio pipes for progress capture
  └── Windows hidden console window (windowsHide: true)
                 │
                 ▼
[5. Completion & Artifact Verification]
  ├── Verify process exit code == 0
  ├── Verify file exists on disk
  └── Invoke ae_inspect_render_result for byte size & timestamps
                 │
                 ▼
[Return Result & Release Concurrency Slot]
```

---

## 3. Render Output Formats & Templates

`ae_render_comp` supports Adobe's output module and render settings templates:
- **Output Modules (`-OMtemplate`)**:
  - `H.264 - Match Render Settings` (Standard MP4 delivery)
  - `Lossless` (QuickTime Animation / ProRes with alpha)
  - `PNG Sequence with Alpha` (Frame sequence export)
- **Render Settings (`-RStemplate`)**:
  - `Best Settings` (Full resolution, motion blur enabled)
  - `Draft Settings` (Half resolution for rapid validation)

---

## 4. Verification via `ae_inspect_render_result`

To prevent AI hallucination regarding output file existence, `ae_inspect_render_result` performs direct OS-level `stat()` inspection:
- Confirms file presence on disk.
- Reports exact byte size and human-readable Megabytes.
- Extracts creation and modification timestamps (`birthtime`, `mtime`).
- Confirms node type is a valid regular file.
