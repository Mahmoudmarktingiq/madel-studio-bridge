# MADEL Studio Bridge — Phase P20
# Layer Styles Architecture & Effects Descriptor Reference
**Architect & Owner:** Mahmoud Adel (`Mahmoudmarktingiq`)  
**Phase:** P20 — Advanced Photoshop Creative Tools  
**Module:** Layer Styles Subsystem  

---

## 1. Overview & Descriptor Mechanics

In Adobe Photoshop, Layer Styles (layer effects) are procedural styling rules that are computed on the GPU and raster engine dynamically. They are non-destructive and can be stacked, toggled, reconfigured, or stripped at any time without altering the base pixel or vector content of the layer.

MADEL Studio Bridge manages styles directly against the native Photoshop `layerEffects` ActionDescriptor schema. The server normalizes style parameters into typed JSON descriptors, and the UXP panel merges or replaces them inside `executeAsModal`.

---

## 2. Supported Layer Styles & Parameters

| Style Name | Key in `layerEffects` | Configurable Parameters |
|---|---|---|
| **Drop Shadow** | `dropShadow` | `color`, `opacity`, `blendMode`, `distance`, `size` (blur), `spread`, `angle`, `useGlobalAngle`, `noise` |
| **Inner Shadow** | `innerShadow` | `color`, `opacity`, `blendMode`, `distance`, `size` (blur), `spread`, `angle`, `useGlobalAngle`, `noise` |
| **Outer Glow** | `outerGlow` | `color`, `opacity`, `blendMode`, `size`, `spread`, `noise`, `glowTechnique` |
| **Inner Glow** | `innerGlow` | `color`, `opacity`, `blendMode`, `size`, `spread`, `noise`, `innerGlowSource` (`edgeGlow` / `centerGlow`) |
| **Bevel & Emboss**| `bevelEmboss` | `bevelStyle`, `bevelDirection`, `depth`, `size`, `soften`, `highlightColor`, `highlightOpacity`, `shadowColor`, `shadowOpacity`, `altitude`, `angle` |
| **Satin** | `chromeFX` | `color`, `opacity`, `blendMode`, `distance`, `size`, `angle`, `invert` |
| **Color Overlay** | `solidFill` | `color`, `opacity`, `blendMode` |
| **Gradient Overlay**| `gradientFill` | `colors` (array of hex stops), `gradientStyle` (`linear`, `radial`, `angle`, `reflected`, `diamond`), `opacity`, `angle`, `scale`, `reverse`, `alignWithLayer`, `dither` |
| **Stroke** | `frameFX` | `color`, `size` (width in px), `strokePosition` (`outside`, `inside`, `center`), `opacity`, `blendMode` |

---

## 3. Style Operations

### 3.1 `ps_set_layer_style`
Applies a new style or modifies an existing style on a layer.
- **Incremental Merging:**
  When applying a style (e.g. `dropShadow`), existing styles on the layer (e.g. `stroke` or `gradientOverlay`) are fully preserved. The bridge queries the existing `layerEffects` descriptor on the layer, updates or injects the target style key, cleans up any conflicting multi-instance override arrays (such as `dropShadowMulti`), and writes back the updated descriptor.
- **Color Format:**
  Accepts standard hex color strings (e.g. `#1a1a1a`, `#ff0055`) and converts them into Photoshop ActionDescriptor RGB format:
  `{ _obj: "RGBColor", red: r, grain: g, blue: b }` (Note: Photoshop internally spells green as "grain").

### 3.2 `ps_get_layer_styles`
Reads the complete `layerEffects` descriptor on the target layer. Returns `null` if the layer has no styles applied.

### 3.3 `ps_remove_layer_style`
Supports two modes of removal:
1. **Targeted Removal (`style: "dropShadow"`):** Removes only the specified effect while leaving all other active styles intact.
2. **Global Clear (`style: null / omitted`):** Clears all layer effects from the layer.

---

## 4. Multi-Stop Gradient Overlays

The gradient overlay generator supports dynamic multi-stop linear and radial gradients with automatic stop distribution:
```json
{
  "layerId": 4,
  "style": "gradientOverlay",
  "colors": ["#11998e", "#38ef7d"],
  "gradientStyle": "linear",
  "angle": 45,
  "opacity": 95
}
```
The UXP handler maps each color stop to a normalized Photoshop gradient point (0 to 4096) with smooth midpoints (50%) and 100% transfer specs.
