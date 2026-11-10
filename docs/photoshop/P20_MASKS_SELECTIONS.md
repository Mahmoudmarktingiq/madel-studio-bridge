# MADEL Studio Bridge — Phase P20
# Selections & Layer Masks Architecture & Safety Specification
**Architect & Owner:** Mahmoud Adel (`Mahmoudmarktingiq`)  
**Phase:** P20 — Advanced Photoshop Creative Tools  
**Module:** Selections & Layer Masks Subsystem  

---

## 1. Overview & Conceptual Model

Selections define active regions of interest on a document's pixel raster grid. In Photoshop, selections are internally represented as an 8-bit grayscale alpha channel (`selection` property on the document).

Layer Masks are grayscale rasters attached to individual layers that control visibility without destroying pixels. White reveals, black conceals, and gray values create partial transparency.

Phase P20 introduces a complete toolchain for programmatic selection generation and non-destructive layer masking with strict safety guarantees.

---

## 2. Selection Subsystem Tools

| Tool | Parameters | Description |
|---|---|---|
| `ps_select_rectangle` | `left`, `top`, `right`, `bottom`, `mode` | Selects a rectangular canvas coordinate region. Mode supports `replace`, `add`, `subtract`, `intersect`. |
| `ps_select_ellipse` | `left`, `top`, `right`, `bottom`, `mode` | Selects an elliptical region inscribed inside the bounding box. Supports same 4 boolean modes. |
| `ps_invert_selection` | None | Inverts the active selection (selects everything previously unselected). |
| `ps_feather_selection`| `radius` | Blurs the selection boundary across the specified pixel radius for soft transitions. |
| `ps_deselect` | None | Clears the active selection boundary. |
| `ps_get_selection` | None | Queries whether an active selection exists and returns its bounding box and dimensions. |

### Boolean Combination Modes
- `replace`: Clears any previous selection and establishes the new geometric boundary (`SelectionType.REPLACE`).
- `add`: Extends the existing selection by union with the new shape (`SelectionType.EXTEND`).
- `subtract`: Cuts the new shape out of the existing selection (`SelectionType.SUBTRACT`).
- `intersect`: Retains only the overlapping area between the existing selection and the new shape (`SelectionType.INTERSECT`).

---

## 3. Layer Masks Subsystem Tools

### 3.1 `ps_create_layer_mask`
Attaches a raster layer mask to the active or specified layer.
- **Modes:**
  - `revealSelection`: Turns active selection into a mask where selected areas remain visible and unselected areas are hidden.
  - `hideSelection`: Inverts the active selection so selected areas are concealed.
  - `revealAll`: Attaches a full white mask (entire layer remains visible).
  - `hideAll`: Attaches a full black mask (entire layer is hidden until painted).
- **BatchPlay Target:**
  ```javascript
  {
    _obj: "make",
    new: { _class: "channel" },
    at: { _ref: "channel", _enum: "channel", _value: "mask" },
    using: { _enum: "userMaskOptions", _value: mode }
  }
  ```

### 3.2 `ps_set_layer_mask_enabled`
Programmatically toggles a layer mask on or off without deleting it (equivalent to Shift-clicking the mask thumbnail in Photoshop's Layers panel).
- **BatchPlay Descriptor:**
  ```javascript
  {
    _obj: "set",
    _target: [{ _ref: "layer", _id: layerId }],
    to: { _obj: "layer", userMaskEnabled: enabled }
  }
  ```

### 3.3 `ps_delete_layer_mask` — Safety Confirmation Protocol
Deleting a layer mask can permanently discard hours of meticulous masking work or irrevocably alter pixel visibility if applied blindly.
MADEL Studio Bridge enforces two strict safety guards:
1. **Mandatory Confirmation Flag (`confirm: true`):**
   If `confirm` is omitted or false, the operation is immediately rejected:
   `Error: Action cancelled: delete_layer_mask requires confirm: true to prevent unintended data loss.`
2. **Explicit Application Option (`apply: boolean`):**
   - If `apply: true`, Photoshop bakes the mask transparency directly into the layer pixels before deleting the mask channel.
   - If `apply: false`, Photoshop discards the mask and restores full layer visibility.
