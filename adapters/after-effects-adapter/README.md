# MADEL Studio Bridge — Adobe After Effects MCP Adapter
**Owner & Lead Architect:** Mahmoud Adel (`Mahmoudmarktingiq`)  
**Phase:** P24 — Adobe After Effects MCP Integration  
**Platform:** Adobe After Effects (Compositions, Layers, Keyframes, Motion Graphics & Render Queue)

---

## 1. Overview
The After Effects Adapter connects AI clients (Claude, OpenAI Codex, Gemini CLI, Antigravity) to Adobe After Effects through MADEL's high-assurance MCP Gateway. It provides professional motion graphics generation, kinetic typography, multi-layer timeline positioning, and headless rendering automation.

## 2. Architecture
```text
AI Client (Claude / OpenAI / Gemini / Antigravity)
       │
       ▼
MADEL MCP Gateway
       │
       ▼
P17 Concurrency Manager (after_effects:mutation, after_effects:render)
       │
       ▼
After Effects Adapter (adapters/after-effects-adapter/)
       │
       ├─► ExtendScript Host Bridge (WebSocket Panel / COM)
       │         │
       │         ▼
       │   Adobe After Effects GUI
       │
       └─► aerender Runner (Non-blocking headless CLI)
                 │
                 ▼
           Video / Frame Export
```

## 3. Tool Capabilities (57 Total Tools)
- **Projects (6):** `ae_project_info`, `ae_create_project`, `ae_open_project`, `ae_save_project`, `ae_list_footage`, `ae_import_footage`
- **Compositions (5):** `ae_list_compositions`, `ae_create_comp`, `ae_get_comp`, `ae_set_comp_props`, `ae_set_active_comp`
- **Layers (10):** `ae_list_layers`, `ae_add_layer`, `ae_add_text_layer`, `ae_add_solid_layer`, `ae_add_shape`, `ae_rename_layer`, `ae_duplicate_layer`, `ae_delete_layer` (with `confirm: true`), `ae_set_layer_visibility`, `ae_set_layer_timing`
- **Animation & Keyframes (9):** `ae_get_transform_properties`, `ae_set_position`, `ae_set_scale`, `ae_set_rotation`, `ae_set_opacity`, `ae_set_keyframes`, `ae_get_keyframes`, `ae_remove_keyframes`, `ae_set_keyframe_interpolation`
- **Motion Graphics (6):** `ae_create_shape_animation`, `ae_create_text_animation`, `ae_apply_effect`, `ae_set_effect_param`, `ae_add_to_essential_graphics`, `ae_export_mogrt`
- **Rendering & Diagnostics (6):** `ae_inspect_render_queue`, `ae_queue_render`, `ae_render_frame`, `ae_render_comp` (with `approved: true`), `ae_inspect_render_result`, `ae_set_expression`
- **Batch, Undo & Raw (15):** `ae_find_layers`, `ae_import_as_comp`, `ae_add_mask`, `ae_set_layer_props`, `ae_add_layer_style`, `ae_get_layer_styles`, `ae_set_layer_style_param`, `ae_remove_layer_style`, `ae_set_text`, `ae_add_marker`, `ae_batch`, `ae_undo`, `ae_redo`, `ae_run_script`, `ae_get_layer`

## 4. Safety & Non-Destructive Guardrails
- **Atomic Undo Isolation:** Every modification runs inside `app.beginUndoGroup()` and `app.endUndoGroup()` guaranteeing single Ctrl-Z undo steps.
- **Mandatory Confirmation on Deletions:** `ae_delete_layer` requires affirmative `confirm: true`.
- **Explicit Approval for Renders:** `ae_render_comp` requires explicit `approved: true`.
- **Command Injection Prevention:** `aerender` executes strictly with argument arrays without shell concatenation.
