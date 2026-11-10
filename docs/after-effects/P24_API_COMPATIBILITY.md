# MADEL Studio Bridge — Phase P24: Adobe After Effects API Compatibility & Specification
**Developed and maintained by Mahmoud Adel**

## 1. Overview & Host Environment Matrix

This specification details the API surfaces, runtime characteristics, and version compatibility matrix for Adobe After Effects integration within MADEL Studio Bridge.

| Target Software | Version Range | Primary API Surface | Execution Engine | Status on Local Host |
|---|---|---|---|---|
| Adobe After Effects 2026 | v26.0 – v26.5+ | ExtendScript (ES3) + aerender | Desktop GUI + CLI | Not Installed (Simulated/Tested) |
| Adobe After Effects 2025 | v25.0 – v25.5 | ExtendScript (ES3) + aerender | Desktop GUI + CLI | Not Installed (Simulated/Tested) |
| Adobe After Effects 2024 | v24.0 – v24.6 | ExtendScript (ES3) + aerender | Desktop GUI + CLI | Not Installed (Simulated/Tested) |

---

## 2. ExtendScript (ES3) Object Model Hierarchy

The After Effects object model is structured hierarchically. The MADEL Studio Bridge runtime interacts strictly with safe, validated node instances:

```
app (Application)
 └── project (Project)
      ├── numItems (Integer)
      ├── item(i) (Item: CompItem, FootageItem, FolderItem)
      │    └── CompItem
      │         ├── id, name, width, height, pixelAspect, frameRate, duration
      │         ├── layers (LayerCollection)
      │         │    └── Layer (AVLayer, TextLayer, ShapeLayer, CameraLayer, LightLayer)
      │         │         ├── index, name, enabled, locked, inPoint, outPoint, startTime
      │         │         ├── transform (PropertyGroup)
      │         │         │    ├── position, scale, rotation, opacity, anchorPoint
      │         │         ├── property("Text") (TextDocument, Source Text)
      │         │         └── property("Contents") / property("Effects")
      │         └── openInViewer()
      └── renderQueue (RenderQueue)
           ├── numItems (Integer)
           └── item(i) (RenderQueueItem)
                ├── status, comp
                └── outputModule(j) (OutputModule: file, templates)
```

### 2.1 Match Names vs Display Names
To ensure scripts execute reliably across localized After Effects installations (English, German, French, Japanese, Arabic UI), MADEL Studio Bridge uses canonical match names where available:
- Shape Layers: `ADBE Vector Group`, `ADBE Vector Shape - Rect`, `ADBE Vector Shape - Ellipse`, `ADBE Vector Graphic - Fill`, `ADBE Vector Graphic - Stroke`
- Text Animators: `ADBE Text Animator`, `ADBE Text Selectors`, `ADBE Text Selector`, `ADBE Text Opacity`
- Effect Hierarchy: `ADBE Effect Parade`
- Layer Styles: `ADBE Layer Styles`, `dropShadow`, `innerShadow`, `outerGlow`, `stroke`

---

## 3. Headless aerender.exe CLI Interface

Adobe provides `aerender.exe` as the standard high-throughput, headless background render utility. It executes without launching the heavy After Effects graphical interface and does not block the operator's workspace.

### 3.1 Standard CLI Arguments
| Flag | Parameter | Description |
|---|---|---|
| `-project` | `<path>` | Full path to the `.aep` or `.aet` project file. |
| `-comp` | `<compName>` | Exact composition name to render. |
| `-output` | `<outputPath>` | Target media file path (`.mp4`, `.mov`, `.png`, `.wav`). |
| `-OMtemplate` | `<templateName>` | Output Module preset (e.g. `H.264 - Match Render Settings`). |
| `-RStemplate` | `<templateName>` | Render Settings preset (e.g. `Best Settings`). |
| `-s` | `<frameNumber>` | Start frame integer. |
| `-e` | `<frameNumber>` | End frame integer. |
| `-close` | `[DO_NOT_SAVE_CHANGES]` | Ensures project state is untouched post-render. |

### 3.2 Injection-Free Invocation
MADEL Studio Bridge executes `aerender.exe` using `child_process.spawn` passing arguments strictly as an array of discrete strings:
```typescript
const args = ["-project", projectPath, "-comp", compName, "-output", outputPath];
if (outputModule) args.push("-OMtemplate", outputModule);
if (startFrame !== undefined) args.push("-s", String(startFrame));
if (endFrame !== undefined) args.push("-e", String(endFrame));
```
No shell concatenation (`cmd.exe /c` or PowerShell string expansion) is ever performed, eliminating shell injection vulnerabilities completely.

---

## 4. CEP / UXP Migration Roadmap

Adobe is actively transitioning After Effects plugins to modern UXP paradigms:
1. **Current State**: After Effects 2024-2026 supports ExtendScript with optional CEP HTML5 panels.
2. **UXP Hybrid Horizon**: Once Adobe enables full UXP DOM manipulation for After Effects (matching Photoshop's `batchPlay` or Premiere's `uxp.host`), `@madel/after-effects-adapter` will route commands to the WebSocket transport without modifying tool names, argument schemas, or AI client interaction contracts.
