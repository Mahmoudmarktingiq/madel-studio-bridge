# MADEL Studio Bridge — Phase P24: Complete Tool Registry (57 Tools)
**Developed and maintained by Mahmoud Adel**

This document provides the definitive specification of all **57 Adobe After Effects MCP tools** registered in MADEL Studio Bridge.

---

## 1. Projects (6 Tools)

### `ae_project_info`
- **Category**: Projects
- **Scope**: `after_effects:mutation`
- **Annotations**: `readOnlyHint: true`
- **Inputs**: None (`{}`)
- **Returns**: `{ path: string | null, numItems: number, bitsPerChannel: number, dirty: boolean }`
- **Description**: Inspect open After Effects project metadata, file location, item count, and dirty state.

### `ae_create_project` *(Net New)*
- **Category**: Projects
- **Scope**: `after_effects:mutation`
- **Annotations**: `destructiveHint: true`
- **Inputs**:
  - `force?: boolean` — Discards unsaved changes in current project without prompting. Default: `false`.
- **Returns**: `{ created: boolean, name?: string, prompt?: string }`
- **Description**: Creates a new blank project in After Effects.

### `ae_open_project`
- **Category**: Projects
- **Scope**: `after_effects:mutation`
- **Annotations**: `destructiveHint: true`
- **Inputs**:
  - `path: string` — Absolute path to `.aep` project file.
- **Returns**: `{ path: string, numItems: number }`
- **Description**: Opens an existing After Effects project from disk.

### `ae_save_project`
- **Category**: Projects
- **Scope**: `after_effects:mutation`
- **Inputs**:
  - `path?: string` — Destination path for Save As (optional).
- **Returns**: `{ path: string }`
- **Description**: Saves the open project to its current file or to a specified path.

### `ae_list_footage`
- **Category**: Projects
- **Scope**: `after_effects:mutation`
- **Annotations**: `readOnlyHint: true`
- **Inputs**: None (`{}`)
- **Returns**: `[{ id: number, name: string, file: string | null, width: number, height: number, duration: number }]`
- **Description**: Lists all imported footage, image assets, and solids in the project pool.

### `ae_import_footage`
- **Category**: Projects
- **Scope**: `after_effects:mutation`
- **Inputs**:
  - `filePath: string` — Absolute file path to import.
  - `sequence?: boolean` — Import as image sequence.
- **Returns**: `{ id: number, name: string, type: string }`
- **Description**: Imports a media asset into the project pool.

---

## 2. Compositions (5 Tools)

### `ae_list_compositions`
- **Category**: Compositions
- **Scope**: `after_effects:mutation`
- **Annotations**: `readOnlyHint: true`
- **Inputs**: None (`{}`)
- **Returns**: `[{ id: number, name: string, width: number, height: number, frameRate: number, duration: number, layerCount: number }]`
- **Description**: Returns all compositions in the active project.

### `ae_create_comp`
- **Category**: Compositions
- **Scope**: `after_effects:mutation`
- **Inputs**:
  - `name: string` — Composition name.
  - `width?: number` — Default: `1920`.
  - `height?: number` — Default: `1080`.
  - `pixelAspect?: number` — Default: `1.0`.
  - `duration?: number` — Duration in seconds (default: `10.0`).
  - `frameRate?: number` — FPS (default: `29.97`).
- **Returns**: `{ id: number, name: string, width: number, height: number, duration: number }`
- **Description**: Creates a new composition with explicit canvas dimensions and framerate.

### `ae_get_comp`
- **Category**: Compositions
- **Scope**: `after_effects:mutation`
- **Annotations**: `readOnlyHint: true`
- **Inputs**: `compId?: number`, `compName?: string`
- **Returns**: Full composition descriptor including every child layer summary.
- **Description**: Deep inspection of composition properties and timeline layers.

### `ae_set_comp_props`
- **Category**: Compositions
- **Scope**: `after_effects:mutation`
- **Inputs**: `compId?: number`, `compName?: string`, `name?: string`, `width?: number`, `height?: number`, `duration?: number`, `frameRate?: number`
- **Returns**: Updated composition properties.
- **Description**: Modifies settings of an existing composition.

### `ae_set_active_comp` *(Net New)*
- **Category**: Compositions
- **Scope**: `after_effects:mutation`
- **Inputs**: `compId?: number`, `compName?: string`
- **Returns**: `{ compId: number, compName: string, active: boolean }`
- **Description**: Opens and focuses the specified composition in the UI viewer panel.

---

## 3. Layers (10 Tools)

### `ae_list_layers` *(Net New)*
- **Category**: Layers
- **Scope**: `after_effects:mutation`
- **Annotations**: `readOnlyHint: true`
- **Inputs**: `compId?: number`, `compName?: string`
- **Returns**: `{ compId: number, compName: string, layerCount: number, layers: Array<{ index, name, kind, enabled, locked, inPoint, outPoint, startTime, duration, hasVideo, hasAudio }> }`
- **Description**: Quick, lightweight listing of all layers on the composition timeline.

### `ae_add_layer`
- **Category**: Layers
- **Scope**: `after_effects:mutation`
- **Inputs**: `compId?: number`, `compName?: string`, `footageId: number`, `startTime?: number`, `name?: string`
- **Returns**: Layer descriptor.
- **Description**: Adds an imported footage asset or solid to the timeline.

### `ae_add_text_layer` *(Net New)*
- **Category**: Layers
- **Scope**: `after_effects:mutation`
- **Inputs**: `compId?: number`, `compName?: string`, `text: string`, `name?: string`, `fontSize?: number`, `fontColor?: number[]`
- **Returns**: `{ compId: number, layerIndex: number, name: string, text: string }`
- **Description**: Creates a new text layer with styling.

### `ae_add_solid_layer` *(Net New)*
- **Category**: Layers
- **Scope**: `after_effects:mutation`
- **Inputs**: `compId?: number`, `compName?: string`, `name: string`, `color?: number[]`, `width?: number`, `height?: number`, `duration?: number`
- **Returns**: `{ compId: number, layerIndex: number, name: string, width: number, height: number, duration: number }`
- **Description**: Adds a solid color background or mask plate to the composition.

### `ae_add_shape`
- **Category**: Layers
- **Scope**: `after_effects:mutation`
- **Inputs**: `compId?: number`, `compName?: string`, `name?: string`
- **Returns**: Shape layer descriptor.
- **Description**: Inserts a blank vector shape layer.

### `ae_rename_layer` *(Net New)*
- **Category**: Layers
- **Scope**: `after_effects:mutation`
- **Inputs**: `compId?: number`, `compName?: string`, `layerIndex?: number`, `layerName?: string`, `newName: string`
- **Returns**: `{ compId: number, layerIndex: number, oldName: string, newName: string }`
- **Description**: Renames a timeline layer.

### `ae_duplicate_layer`
- **Category**: Layers
- **Scope**: `after_effects:mutation`
- **Inputs**: `compId?: number`, `compName?: string`, `layerIndex?: number`, `layerName?: string`, `name?: string`
- **Returns**: Descriptor of duplicated layer.
- **Description**: Clones a layer immediately above the original.

### `ae_delete_layer` *(Hardened with Safety Guard)*
- **Category**: Layers
- **Scope**: `after_effects:mutation`
- **Annotations**: `destructiveHint: true`
- **Inputs**:
  - `compId?: number`, `compName?: string`
  - `layerIndex?: number`, `layerName?: string`
  - **`confirm: boolean`** — **MANDATORY**: Must be `true` to execute deletion.
- **Returns**: `{ deleted: string }`
- **Description**: Permanently removes a layer from the composition timeline.

### `ae_set_layer_visibility` *(Net New)*
- **Category**: Layers
- **Scope**: `after_effects:mutation`
- **Inputs**: `compId?: number`, `compName?: string`, `layerIndex?: number`, `layerName?: string`, `enabled: boolean`
- **Returns**: `{ compId: number, layerIndex: number, name: string, enabled: boolean }`
- **Description**: Toggles layer video eyeball visibility on/off.

### `ae_set_layer_timing` *(Net New)*
- **Category**: Layers
- **Scope**: `after_effects:mutation`
- **Inputs**: `compId?: number`, `compName?: string`, `layerIndex?: number`, `layerName?: string`, `startTime?: number`, `inPoint?: number`, `outPoint?: number`
- **Returns**: `{ compId: number, layerIndex: number, name: string, startTime: number, inPoint: number, outPoint: number, duration: number }`
- **Description**: Modifies in-point, out-point, and start offset on the timeline.

---

## 4. Animation & Transforms (9 Tools)

### `ae_get_transform_properties` *(Net New)*
- **Category**: Animation
- **Scope**: `after_effects:mutation`
- **Annotations**: `readOnlyHint: true`
- **Inputs**: `compId?: number`, `compName?: string`, `layerIndex?: number`, `layerName?: string`
- **Returns**: `{ position, scale, rotation, opacity, anchorPoint, is3D }`
- **Description**: Reads all core transform spatial and temporal values.

### `ae_set_position` *(Net New)*
- **Category**: Animation
- **Scope**: `after_effects:mutation`
- **Inputs**: `compId?: number`, `compName?: string`, `layerIndex?: number`, `layerName?: string`, `x: number`, `y: number`, `z?: number`
- **Returns**: `{ compId, layerIndex, name, position: [x, y, z?] }`
- **Description**: Sets static 2D or 3D position coordinates.

### `ae_set_scale` *(Net New)*
- **Category**: Animation
- **Scope**: `after_effects:mutation`
- **Inputs**: `compId?: number`, `compName?: string`, `layerIndex?: number`, `layerName?: string`, `x: number`, `y: number`, `z?: number`
- **Returns**: `{ compId, layerIndex, name, scale: [x, y, z?] }`
- **Description**: Sets percentage scale dimensions.

### `ae_set_rotation` *(Net New)*
- **Category**: Animation
- **Scope**: `after_effects:mutation`
- **Inputs**: `compId?: number`, `compName?: string`, `layerIndex?: number`, `layerName?: string`, `degrees: number`
- **Returns**: `{ compId, layerIndex, name, rotation: number }`
- **Description**: Sets planar or 3D Z-axis rotation angle in degrees.

### `ae_set_opacity` *(Net New)*
- **Category**: Animation
- **Scope**: `after_effects:mutation`
- **Inputs**: `compId?: number`, `compName?: string`, `layerIndex?: number`, `layerName?: string`, `opacity: number` (0..100)
- **Returns**: `{ compId, layerIndex, name, opacity: number }`
- **Description**: Sets transparency percentage.

### `ae_set_keyframes`
- **Category**: Animation
- **Scope**: `after_effects:mutation`
- **Inputs**: `compId?: number`, `compName?: string`, `layerIndex?: number`, `layerName?: string`, `property: string`, `keys: [{ time: number, value: number | number[], easy?: boolean }]`
- **Returns**: Updated keyframe summary.
- **Description**: Inserts or updates keyframes along the timeline with optional auto-easing.

### `ae_get_keyframes`
- **Category**: Animation
- **Scope**: `after_effects:mutation`
- **Annotations**: `readOnlyHint: true`
- **Inputs**: `compId?: number`, `compName?: string`, `layerIndex?: number`, `layerName?: string`, `property: string`
- **Returns**: `[{ index, time, value }]`
- **Description**: Retrieves existing keyframe values and timestamps.

### `ae_remove_keyframes`
- **Category**: Animation
- **Scope**: `after_effects:mutation`
- **Inputs**: `compId?: number`, `compName?: string`, `layerIndex?: number`, `layerName?: string`, `property: string`
- **Returns**: `{ cleared: boolean }`
- **Description**: Removes all keyframes from a property.

### `ae_set_keyframe_interpolation` *(Net New)*
- **Category**: Animation
- **Scope**: `after_effects:mutation`
- **Inputs**: `compId?: number`, `compName?: string`, `layerIndex?: number`, `layerName?: string`, `property: string`, `keyIndex: number`, `inType: "linear" | "bezier" | "hold"`, `outType: "linear" | "bezier" | "hold"`
- **Returns**: `{ property, keyIndex, inType, outType }`
- **Description**: Controls interpolation curve dynamics for specific keyframes.

---

## 5. Motion Graphics & MOGRT (6 Tools)

### `ae_create_shape_animation` *(Net New)*
- **Category**: Motion Graphics
- **Scope**: `after_effects:mutation`
- **Inputs**: `compId?: number`, `compName?: string`, `shapeType: "rect" | "ellipse"`, `name?: string`, `startScale?: number`, `endScale?: number`, `duration?: number`
- **Returns**: Layer descriptor with animated properties.
- **Description**: Generates procedural vector shape animation with smooth scale easing.

### `ae_create_text_animation` *(Net New)*
- **Category**: Motion Graphics
- **Scope**: `after_effects:mutation`
- **Inputs**: `compId?: number`, `compName?: string`, `text: string`, `name?: string`, `animationType: "fade_in" | "slide_up" | "typewriter"`, `duration?: number`
- **Returns**: Layer descriptor.
- **Description**: Instantiates animated typography presets.

### `ae_apply_effect`
- **Category**: Motion Graphics
- **Scope**: `after_effects:mutation`
- **Inputs**: `compId?: number`, `compName?: string`, `layerIndex?: number`, `layerName?: string`, `matchName: string`
- **Returns**: Effect descriptor.
- **Description**: Adds an effect filter (e.g. `ADBE Gaussian Blur 2`) to the layer.

### `ae_set_effect_param`
- **Category**: Motion Graphics
- **Scope**: `after_effects:mutation`
- **Inputs**: `compId?: number`, `compName?: string`, `layerIndex?: number`, `layerName?: string`, `effectName: string`, `paramName: string`, `value: any`
- **Returns**: Parameter value status.
- **Description**: Sets effect parameter values.

### `ae_add_to_essential_graphics`
- **Category**: Motion Graphics
- **Scope**: `after_effects:mutation`
- **Inputs**: `compId?: number`, `compName?: string`, `layerIndex?: number`, `layerName?: string`, `property: string`, `name?: string`
- **Returns**: `{ added: boolean }`
- **Description**: Exposes a property to the Essential Graphics panel for MOGRT authoring.

### `ae_export_mogrt`
- **Category**: Motion Graphics
- **Scope**: `after_effects:mutation`
- **Inputs**: `compName: string`, `outputPath: string`, `overwrite?: boolean`
- **Returns**: `{ outputPath: string }`
- **Description**: Packages the composition as a Motion Graphics Template (`.mogrt`).

---

## 6. Rendering & Diagnostics (6 Tools)

### `ae_inspect_render_queue` *(Net New)*
- **Category**: Rendering
- **Scope**: `after_effects:render`
- **Annotations**: `readOnlyHint: true`
- **Inputs**: None (`{}`)
- **Returns**: `{ numItems: number, items: Array<{ index, compName, status, outputModules }> }`
- **Description**: Queries all queued render items and destinations.

### `ae_queue_render`
- **Category**: Rendering
- **Scope**: `after_effects:render`
- **Inputs**: `compName: string`, `outputPath: string`, `outputModule?: string`, `renderSettings?: string`
- **Returns**: `{ queued: boolean, renderQueueIndex: number }`
- **Description**: Adds a composition to the UI render queue.

### `ae_render_frame`
- **Category**: Rendering
- **Scope**: `after_effects:render`
- **Inputs**: `compId?: number`, `compName?: string`, `time?: number`, `outputPath?: string`
- **Returns**: Image data or saved frame file path.
- **Description**: Fast single frame export (PNG) for visual preview and validation.

### `ae_render_comp` *(Hardened with Safety Guard)*
- **Category**: Rendering
- **Scope**: `after_effects:render`
- **Annotations**: `destructiveHint: true`
- **Inputs**:
  - `compName: string` — Composition to render.
  - **`approved: boolean`** — **MANDATORY**: Must be `true` to execute headless aerender.
  - `outputPath: string` — Output media file path.
  - `outputModule?: string` — Preset name (e.g. `H.264`).
  - `renderSettings?: string` — Settings preset (e.g. `Best Settings`).
  - `wait?: boolean` — Block until render finishes.
- **Returns**: `{ outputPath: string, compName: string, log: string }`
- **Description**: Saves the project and renders headlessly in the background via `aerender.exe`.

### `ae_inspect_render_result` *(Net New)*
- **Category**: Rendering
- **Scope**: `after_effects:render`
- **Annotations**: `readOnlyHint: true`
- **Inputs**:
  - `filePath: string` — File path of output media to verify.
- **Returns**: `{ exists: boolean, filePath: string, sizeBytes: number, sizeMB: number, createdAt: string, modifiedAt: string, isFile: boolean }`
- **Description**: Verifies generated render output file on disk using native Node.js stat.

### `ae_set_expression`
- **Category**: Rendering & Logic
- **Scope**: `after_effects:mutation`
- **Inputs**: `compId?: number`, `compName?: string`, `layerIndex?: number`, `layerName?: string`, `property: string`, `expression: string`
- **Returns**: `{ property, expression }`
- **Description**: Attaches an ExtendScript expression curve (e.g. `wiggle(5, 20)`).

---

## 7. Batch, Utility & Undo (15 Tools)

### `ae_find_layers`
- **Inputs**: `compId?: number`, `compName?: string`, `name?: string`, `kind?: string`, `enabled?: boolean`
- **Description**: Discovers layers matching multi-property filter criteria.

### `ae_import_as_comp`
- **Inputs**: `filePath: string`
- **Description**: Imports a multi-layer file (PSD / AI) as an assembled composition.

### `ae_add_mask`
- **Inputs**: Mask geometry, mode, and feather params.
- **Description**: Generates vector masks on a layer.

### `ae_set_layer_props`
- **Inputs**: Compound layer properties including parenting (`parentIndex` or `parentName`).
- **Description**: Multi-property atomic layer modifier.

### `ae_add_layer_style`, `ae_get_layer_styles`, `ae_set_layer_style_param`, `ae_remove_layer_style`
- **Description**: Full layer style manipulation (Drop Shadow, Stroke, Glow, Overlay).

### `ae_set_text`
- **Inputs**: New string content for text layers.
- **Description**: Updates text document content.

### `ae_add_marker`
- **Inputs**: Timestamp, comment text, and duration.
- **Description**: Adds timeline composition markers.

### `ae_batch`
- **Inputs**: Array of discrete tool operations.
- **Description**: Executes multi-operation workflows in a single atomic undo transaction.

### `ae_undo`, `ae_redo`
- **Description**: Invokes host Undo / Redo command IDs.

### `ae_run_script`
- **Description**: Raw ExtendScript execution escape hatch (strictly audited and gated).

### `ae_get_layer`
- **Description**: Deep layer inspection.
