# MADEL Studio Bridge — Adobe Premiere Pro Adapter
**Author:** Mahmoud Adel (`Mahmoudmarktingiq`)  
**Phase:** P22  
**Host Application:** Adobe Premiere Pro 2026 (v26.3.2) / 2025 (v25.6+)  
**Technology:** Adobe UXP Panel + Protocol v2 WebSocket Client + Action Model  

---

## 1. Overview

The `premiere-adapter` connects Adobe Premiere Pro 2025/2026 to the MADEL Studio Bridge platform.

Unlike Photoshop (which operates an embedded WebSocket server daemon) or Illustrator (which operates via Windows COM ExtendScript), Adobe Premiere Pro 25.6+ provides a modern **Unified Extensibility Platform (UXP)** action model:
- The panel runs inside Premiere Pro via `require("premierepro")`.
- It connects as a client to the MADEL Studio Bridge gateway.
- Mutations run inside `project.lockedAccess` and `project.executeTransaction`, guaranteeing that each MCP tool execution corresponds to a single, clean Undo step in Premiere Pro's history stack.

---

## 2. Timeline Precision & Integer Tick Engine

Premiere Pro's internal engine represents time in **Ticks**, where:
$$\text{Ticks per Second} = 254,016,000,000$$

The adapter includes `timeline-math.js`, which handles exact conversions across:
- 23.976 FPS (Cinema / NTSC fractional) -> 10,594,584,000 ticks/frame
- 24.0 FPS (Cinema theatrical) -> 10,584,000,000 ticks/frame
- 25.0 FPS (PAL broadcast) -> 10,160,640,000 ticks/frame
- 29.97 FPS (NTSC broadcast) -> 8,475,667,200 ticks/frame
- 30.0 FPS (Web / digital) -> 8,467,200,000 ticks/frame
- 50.0 FPS (PAL high framerate) -> 5,080,320,000 ticks/frame
- 59.94 FPS (Broadcast high framerate) -> 4,237,833,600 ticks/frame
- 60.0 FPS (Digital high framerate) -> 4,233,600,000 ticks/frame

All calculations are performed with BigInt integer math, guaranteeing zero floating-point accumulation drift and zero off-by-one frame errors.

---

## 3. Installation & Loading (Developer Mode)

1. In Adobe Premiere Pro: Go to **Settings → Plugins → Enable developer mode**, then restart Premiere Pro.
2. In Adobe UXP Developer Tool (UDT):
   - Click **Add Plugin**.
   - Select `adapters/premiere-adapter/manifest.json`.
   - Click **Load**.
3. Open the panel via **Window → Extensions (UXP) → MADEL Studio Bridge**.
4. The panel will automatically dial the MADEL Studio Bridge gateway over the ephemeral WebSocket port recorded in `runtime/handshake.json`.
