# MADEL Studio Bridge — Phase P20
# Photoshop Capability Matrix & Protocol Specification
**Architect & Owner:** Mahmoud Adel (`Mahmoudmarktingiq`)  
**Phase:** P20 — Advanced Photoshop Creative Tools  
**Revision:** 1.0 (Production Ready)  
**Host App Target:** Adobe Photoshop 2026 (v26.x+) / Windows 11  

---

## 1. Executive Summary

Phase P20 expands MADEL Studio Bridge's Adobe Photoshop integration from foundational layer manipulation into a professional-grade creative automation powerhouse. The suite provides native Model Context Protocol (MCP) tools communicating with Photoshop via UXP (Unified Extensibility Platform) executing inside modal scopes (`core.executeAsModal`) with ActionDescriptor batchPlay backing.

The total Photoshop capability set now comprises **38 dedicated MCP tools** (22 foundational + 16 new P20 creative tools) categorized into 5 core subsystems:
1. **Document & Print Engine** (Dimensions, physical units, 300 DPI, CMYK color space, TIFF LZW).
2. **Smart Object Subsystem** (Conversion, inspection, independent duplication, non-destructive replacement, linked sync).
3. **Selections & Geometric Masking** (Rectangular, elliptical, feathering, inversion, boolean combine modes).
4. **Layer Masks Subsystem** (Reveal/hide creation, runtime enable/disable toggle, confirmed deletion safety).
5. **Layer Styles Engine** (Drop shadow, inner shadow, outer/inner glow, bevel & emboss, satin, color overlay, gradient overlay, stroke, blend modes).

---

## 2. Photoshop MCP Tools Registry (38 Tools)

| # | MCP Tool Name | Wire Command (`ps.*`) | Category | Modal Execution | Concurrency Scope | Annotations |
|---|---|---|---|---|---|---|
| 1 | `ps_list_documents` | `ps.list_documents` | Document | No | `photoshop:read` | `readOnlyHint: true` |
| 2 | `ps_get_document_info` | `ps.get_document_info` | Document / Print | No | `photoshop:read` | `readOnlyHint: true` |
| 3 | `ps_create_document` | `ps.create_document` | Document / Print | Yes | `photoshop:mutation` | Destructive |
| 4 | `ps_set_document_resolution`| `ps.set_document_resolution` | Document / Print | Yes | `photoshop:mutation` | `destructiveHint: true` |
| 5 | `ps_open_document` | `ps.open_document` | Document | Yes | `photoshop:mutation` | Non-destructive |
| 6 | `ps_save_document` | `ps.save_document` | Document | Yes | `photoshop:mutation` | `destructiveHint: true` |
| 7 | `ps_export` | `ps.export` | Document / Export | Yes | `photoshop:mutation` | `destructiveHint: true` |
| 8 | `ps_get_preview` | `ps.preview` | Preview | Yes | `photoshop:read` | `readOnlyHint: true` |
| 9 | `ps_list_layers` | `ps.list_layers` | Layers | No | `photoshop:read` | `readOnlyHint: true` |
| 10 | `ps_create_layer` | `ps.create_layer` | Layers | Yes | `photoshop:mutation` | Non-destructive |
| 11 | `ps_create_text_layer` | `ps.create_text_layer` | Layers | Yes | `photoshop:mutation` | Non-destructive |
| 12 | `ps_set_layer_props` | `ps.set_layer_props` | Layers | Yes | `photoshop:mutation` | Non-destructive |
| 13 | `ps_move_layer` | `ps.move_layer` | Layers | Yes | `photoshop:mutation` | Non-destructive |
| 14 | `ps_duplicate_layer` | `ps.duplicate_layer` | Layers | Yes | `photoshop:mutation` | Non-destructive |
| 15 | `ps_delete_layer` | `ps.delete_layer` | Layers | Yes | `photoshop:mutation` | `destructiveHint: true` |
| 16 | `ps_convert_to_smart_object`| `ps.convert_to_smart_object` | Smart Objects | Yes | `photoshop:mutation` | `destructiveHint: true` |
| 17 | `ps_inspect_smart_object` | `ps.inspect_smart_object` | Smart Objects | No | `photoshop:read` | `readOnlyHint: true` |
| 18 | `ps_duplicate_smart_object`| `ps.duplicate_smart_object` | Smart Objects | Yes | `photoshop:mutation` | Non-destructive |
| 19 | `ps_replace_smart_object` | `ps.replace_smart_object` | Smart Objects | Yes | `photoshop:mutation` | `destructiveHint: true` |
| 20 | `ps_update_linked_smart_object`| `ps.update_linked_smart_object`| Smart Objects | Yes | `photoshop:mutation` | `destructiveHint: true` |
| 21 | `ps_get_selection` | `ps.get_selection` | Selections | No | `photoshop:read` | `readOnlyHint: true` |
| 22 | `ps_select_rectangle` | `ps.select_rectangle` | Selections | Yes | `photoshop:read` | Non-destructive |
| 23 | `ps_select_ellipse` | `ps.select_ellipse` | Selections | Yes | `photoshop:read` | Non-destructive |
| 24 | `ps_invert_selection` | `ps.invert_selection` | Selections | Yes | `photoshop:read` | Non-destructive |
| 25 | `ps_feather_selection` | `ps.feather_selection` | Selections | Yes | `photoshop:read` | Non-destructive |
| 26 | `ps_deselect` | `ps.deselect` | Selections | Yes | `photoshop:read` | Non-destructive |
| 27 | `ps_create_layer_mask` | `ps.create_layer_mask` | Layer Masks | Yes | `photoshop:mutation` | `destructiveHint: true` |
| 28 | `ps_set_layer_mask_enabled`| `ps.set_layer_mask_enabled` | Layer Masks | Yes | `photoshop:mutation` | `destructiveHint: true` |
| 29 | `ps_delete_layer_mask` | `ps.delete_layer_mask` | Layer Masks | Yes | `photoshop:mutation` | `destructiveHint: true` (Requires confirm) |
| 30 | `ps_set_layer_style` | `ps.set_layer_style` | Layer Styles | Yes | `photoshop:mutation` | Non-destructive |
| 31 | `ps_get_layer_styles` | `ps.get_layer_styles` | Layer Styles | No | `photoshop:read` | `readOnlyHint: true` |
| 32 | `ps_remove_layer_style` | `ps.remove_layer_style` | Layer Styles | Yes | `photoshop:mutation` | `destructiveHint: true` |
| 33 | `ps_place_image` | `ps.place_image` | Pixels | Yes | `photoshop:mutation` | Non-destructive |
| 34 | `ps_fill` | `ps.fill` | Pixels | Yes | `photoshop:mutation` | Non-destructive |
| 35 | `ps_apply_filter` | `ps.apply_filter` | Pixels | Yes | `photoshop:mutation` | Non-destructive |
| 36 | `ps_resize_image` | `ps.resize_image` | Pixels | Yes | `photoshop:mutation` | `destructiveHint: true` |
| 37 | `ps_crop` | `ps.crop` | Pixels | Yes | `photoshop:mutation` | `destructiveHint: true` |
| 38 | `ps_batch_play` | `ps.batch_play` | Raw Escape Hatch | Yes | `photoshop:mutation` | `destructiveHint: true` (Gated) |

---

## 3. Concurrency Integration & Resource Scoping

Under the Phase P17 Concurrency Gateway:
- Every tool prefixed with `ps_` is dynamically classified into either:
  - `photoshop:read` (max concurrency: 1, timeout: 30s)
  - `photoshop:mutation` (max concurrency: 1, timeout: 60s)
- This guarantees that rapid parallel requests from multiple AI agents (e.g. Claude Code, Cursor, Antigravity) are strictly serialized through FIFO WorkLimiters, preventing Photoshop modal collisions or corrupted history states.
