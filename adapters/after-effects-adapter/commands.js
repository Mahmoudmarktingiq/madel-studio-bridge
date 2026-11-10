/**
 * MADEL Studio Bridge — After Effects Command Specification
 * Developed and maintained by Mahmoud Adel
 *
 * Defines the unified command registry and scope mappings for Adobe After Effects.
 */

export const AE_COMMANDS = {
  // Projects
  PROJECT_INFO: "ae_project_info",
  CREATE_PROJECT: "ae_create_project",
  OPEN_PROJECT: "ae_open_project",
  SAVE_PROJECT: "ae_save_project",
  LIST_FOOTAGE: "ae_list_footage",
  IMPORT_FOOTAGE: "ae_import_footage",
  IMPORT_AS_COMP: "ae_import_as_comp",

  // Compositions
  LIST_COMPOSITIONS: "ae_list_compositions",
  CREATE_COMP: "ae_create_comp",
  GET_COMP: "ae_get_comp",
  SET_COMP_PROPS: "ae_set_comp_props",
  SET_ACTIVE_COMP: "ae_set_active_comp",

  // Layers
  LIST_LAYERS: "ae_list_layers",
  FIND_LAYERS: "ae_find_layers",
  GET_LAYER: "ae_get_layer",
  ADD_LAYER: "ae_add_layer",
  ADD_TEXT_LAYER: "ae_add_text_layer",
  ADD_SOLID_LAYER: "ae_add_solid_layer",
  ADD_SHAPE: "ae_add_shape",
  ADD_MASK: "ae_add_mask",
  RENAME_LAYER: "ae_rename_layer",
  DUPLICATE_LAYER: "ae_duplicate_layer",
  DELETE_LAYER: "ae_delete_layer",
  SET_LAYER_PROPS: "ae_set_layer_props",
  SET_LAYER_VISIBILITY: "ae_set_layer_visibility",
  SET_LAYER_TIMING: "ae_set_layer_timing",

  // Animation & Transforms
  GET_TRANSFORM: "ae_get_transform_properties",
  SET_POSITION: "ae_set_position",
  SET_SCALE: "ae_set_scale",
  SET_ROTATION: "ae_set_rotation",
  SET_OPACITY: "ae_set_opacity",
  SET_KEYFRAMES: "ae_set_keyframes",
  GET_KEYFRAMES: "ae_get_keyframes",
  REMOVE_KEYFRAMES: "ae_remove_keyframes",
  SET_INTERPOLATION: "ae_set_keyframe_interpolation",
  SET_EXPRESSION: "ae_set_expression",

  // Motion Graphics & MOGRT
  CREATE_SHAPE_ANIMATION: "ae_create_shape_animation",
  CREATE_TEXT_ANIMATION: "ae_create_text_animation",
  APPLY_EFFECT: "ae_apply_effect",
  SET_EFFECT_PARAM: "ae_set_effect_param",
  ADD_LAYER_STYLE: "ae_add_layer_style",
  GET_LAYER_STYLES: "ae_get_layer_styles",
  SET_LAYER_STYLE_PARAM: "ae_set_layer_style_param",
  REMOVE_LAYER_STYLE: "ae_remove_layer_style",
  SET_TEXT: "ae_set_text",
  ADD_MARKER: "ae_add_marker",
  ADD_TO_ESSENTIAL_GRAPHICS: "ae_add_to_essential_graphics",
  EXPORT_MOGRT: "ae_export_mogrt",

  // Rendering
  RENDER_FRAME: "ae_render_frame",
  INSPECT_RENDER_QUEUE: "ae_inspect_render_queue",
  QUEUE_RENDER: "ae_queue_render",
  RENDER_COMP: "ae_render_comp",
  INSPECT_RENDER_RESULT: "ae_inspect_render_result",

  // Batch & Undo
  BATCH: "ae_batch",
  UNDO: "ae_undo",
  REDO: "ae_redo",
  RUN_SCRIPT: "ae_run_script",
};

export const AE_SCOPES = {
  MUTATION: "after_effects:mutation",
  READ: "after_effects:mutation",
  RENDER: "after_effects:render",
};
