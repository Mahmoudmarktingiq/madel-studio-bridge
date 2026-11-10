import { z } from "zod";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { type AppBridge, type EvalOptions, type JsonValue } from "../bridge/types.js";
import type { RawScriptApp } from "../config.js";
import type { JobRegistry } from "../jobs.js";
/**
 * A composition or layer reference (AE-03): a number is an id (comp) or an index (layer), a string an exact
 * name. __comp and __layer take either, so a builder emits num() for a number, which keeps every index-based
 * script byte-identical, and lit() for a name.
 */
export type AeRef = number | string;
/**
 * Blank lines between "(function () {" and HELPERS. The CEP panel's host.jsx (62 lines) reports an
 * error it raises while serializing a result with ITS OWN line number (the observed "line 40" was
 * host.jsx:40, a host object in the result). With this guard such a line can never land on a
 * helper or body line, so locateAeError() reports it as outside the tool's code instead of blaming
 * a helper. Keep it above host.jsx's line count (after-effects-errors.test.ts checks the tracked
 * packages/panel-cep/host.jsx).
 */
export declare const HOST_LINE_GUARD = 100;
/** wrap() for callers that assemble After Effects scripts outside this file (AE-03's ae_batch, tests). */
export declare const wrapAe: (body: string) => string;
/**
 * Script lines wholly taken by the prelude ("(function () {", the guard, HELPERS). Body-string
 * line k is script line AE_PRELUDE_LINES + k. Derived, never typed.
 */
export declare const AE_PRELUDE_LINES: number;
/** A helper's script lines, inclusive. */
export interface AeHelperRange {
    readonly name: string;
    readonly first: number;
    readonly last: number;
}
/** What __q appends to a name it cut (checked against __q's source with AE_NAME_CUT). */
export declare const AE_CUT_MARK = "...";
/**
 * How many UTF-16 units of a name __q keeps before it cuts the rest and appends "...". Read from
 * __q's source, so the number is typed once: a cut name can never resolve (aeListSuggestions drops
 * it), and buildRuntime passes it (with AE_CUT_MARK) to redaction, which then finds a secret in a
 * name __q cut, whether the name was the secret or the secret came after other text.
 */
export declare const AE_NAME_CUT: number;
/** The shared helpers' script-line ranges (tests, AE-03). */
export declare function aeHelperRanges(): readonly AeHelperRange[];
export type AeErrorLocation = {
    readonly kind: "body";
    readonly bodyLine: number;
} | {
    readonly kind: "helper";
    readonly helper: string;
} | {
    readonly kind: "outside";
} | {
    readonly kind: "unknown";
};
/**
 * Where a host-reported line falls in a wrap()ped script: a body line (the first body statement
 * is 1), a shared helper, outside the tool's code (the guard, line 1, a top-level helper var, the
 * empty first body line, the closing line, or past the end: host.jsx's serializer), or unknown.
 */
export declare function locateAeError(script: string, scriptLine: number | undefined): AeErrorLocation;
/**
 * Where a host-reported line falls in an ae_batch script (AE-03): a shared helper; a body line of operation `at`
 * (its first statement is body line 1); or outside (the frame, the lines that open and close each operation, another
 * operation's body, past the end). Without `at` (a failure the panel itself reported) any operation's body counts.
 */
export declare function locateAeBatchError(batch: AeBatch, scriptLine: number | undefined, at?: number): AeErrorLocation;
/** aeExcerpt for operation `at` of an ae_batch script. */
export declare function aeBatchExcerpt(batch: AeBatch, at: number, bodyLine: number): string[];
/** How enrichAeError reads a script that wrap() did not build as one body (AE-03's ae_batch). */
export interface AeLocator {
    locate(scriptLine: number | undefined): AeErrorLocation;
    excerpt(bodyLine: number): string[];
}
/** The locator for an ae_batch script: operation `at`'s body, or any operation's when `at` is not given. */
export declare function aeBatchLocator(batch: AeBatch, at?: number): AeLocator;
/** Up to 3 lines around bodyLine, as "N: code" with ">>> " on the failing one; blank neighbours dropped; redacted and capped. */
export declare function aeExcerpt(script: string, bodyLine: number): string[];
/**
 * Adds AE-16's details to an After Effects ScriptError raised by `script`: where the line falls,
 * the code around a body line, the tool and its arguments (from the tool-call context), "did you
 * mean" names from a list the host message carries, and a next step when the paragraph would show
 * none (nextStep).
 * Anything else is returned unchanged; message, appId and scriptLine never change.
 */
export declare function enrichAeError(error: unknown, script: string, locator?: AeLocator): unknown;
/**
 * bridge.evaluate for wrap()ped After Effects scripts: a ScriptError comes back enriched. Use it at every AE evaluate
 * site. `locator` reads a script that is not one wrap()ped body (AE-03's ae_batch).
 */
export declare function evaluateAe(bridge: AppBridge, script: string, options?: EvalOptions, locator?: AeLocator): Promise<JsonValue>;
/**
 * Ranks the names a host message lists against the name it could not find, leaving out cut names,
 * the empty name (no one can pass it; __kids lists none, and rank would offer it for a query of 1
 * or 2 characters), names that repeat in the list and names the host says repeat among children
 * it did not list; [] when the message is not one of these misses or does not parse.
 *
 * A repeated name is never offered, since it cannot pick one item. When one is as near the query as
 * any of the names (listed, or named as repeated; alone or tied, whatever order the tie sorts in), a
 * name farther from the query is not offered either: the caller most likely meant the repeated name,
 * and the message's advice says how to reach one of its copies where the tool has a way (by match
 * name for effect and layer-style parameters, by the effect's index, or by renaming them where After
 * Effects allows that); a farther name would point away from it. Names as near as it stay, and when
 * no name at the smallest distance repeats, every suggestion stays.
 *
 * Bounded before any parsing, because reading a long text costs time that grows faster than its
 * length (the path pattern looks for its list from every "segment" to the end of the text; an edit
 * distance costs the product of the two names' lengths), and a host message can carry long client
 * text (an expression error). No message the helpers write is longer than MESSAGE_LIMIT (__miss
 * keeps to __MSG, ae_queue_render's list stays under 1000), and __q writes no name longer than
 * QUOTED_NAME_MAX: anything longer is not one of these misses.
 */
export declare function aeListSuggestions(message: string): string[];
export declare const LIST_COMPOSITIONS: string;
export declare const PROJECT_INFO: string;
export declare const LIST_FOOTAGE: string;
export declare function getCompScript(compId: AeRef): string;
export declare function getLayerScript(compId: AeRef, layerIndex: AeRef): string;
export declare function openProjectScript(path: string): string;
export declare function saveProjectScript(path: string | undefined): string;
export declare function importFootageScript(path: string): string;
/**
 * Import a layered PSD or AI as a composition (one AE layer per source layer).
 * ImportAsType.COMP keeps each layer at document size; COMP_CROPPED_LAYERS crops
 * to content. The importer preserves blend modes and positions, and — for PSD —
 * layer styles as After Effects imports them. There is no ImportOptions flag for
 * the dialog's "editable vs merged layer styles"; AE uses its own default.
 */
export interface ImportAsCompOptions {
    duration?: number;
    frameRate?: number;
}
export declare function importAsCompScript(path: string, cropped: boolean, opts?: ImportAsCompOptions): string;
export interface CreateCompParams {
    name: string;
    width: number;
    height: number;
    frameRate: number;
    duration: number;
    pixelAspect: number;
}
export declare function createCompScript(p: CreateCompParams): string;
export declare function createCompBody(p: CreateCompParams): string;
export interface CompProps {
    name?: string;
    duration?: number;
    frameRate?: number;
    width?: number;
    height?: number;
}
export declare function setCompPropsScript(compId: AeRef, p: CompProps): string;
export declare function setCompPropsBody(compId: AeRef, p: CompProps): string;
export interface AddLayerParams {
    compId: AeRef;
    kind: "footage" | "solid" | "text" | "null" | "adjustment";
    itemId?: number;
    color?: string;
    name?: string;
    text?: string;
    width?: number;
    height?: number;
    /** text: where the anchor goes. center (default) = position is the text's visual centre; origin = position is the left baseline. */
    anchor?: TextAnchor;
}
export type TextAnchor = "center" | "origin";
export declare function addLayerScript(p: AddLayerParams): string;
export declare function addLayerBody(p: AddLayerParams): string;
export interface AddShapeParams {
    compId: AeRef;
    kind: "rectangle" | "ellipse" | "star" | "polygon";
    width?: number;
    height?: number;
    points?: number;
    outerRadius?: number;
    innerRadius?: number;
    roundness?: number;
    position?: [number, number];
    fill?: string | null;
    stroke?: string | null;
    strokeWidth?: number;
    name?: string;
}
/**
 * Create a shape layer with one parametric shape (rectangle/ellipse/star/polygon)
 * plus an optional fill and stroke. The vector tree is layer → "ADBE Root Vectors
 * Group" (Contents) → "ADBE Vector Group" → its "ADBE Vectors Group" holding the
 * shape, then Fill, then Stroke (stroke last so it draws on top). Verified live.
 */
export declare function addShapeScript(p: AddShapeParams): string;
export declare function addShapeBody(p: AddShapeParams): string;
export interface AddMaskParams {
    compId: AeRef;
    layerIndex: AeRef;
    kind: "rectangle" | "ellipse";
    left?: number;
    top?: number;
    right?: number;
    bottom?: number;
    mode?: "add" | "subtract" | "intersect" | "lighten" | "darken" | "difference" | "none";
    feather?: number;
    opacity?: number;
    expansion?: number;
    name?: string;
}
/**
 * Add a rectangle or ellipse mask to a layer, in that layer's coordinates. A rect
 * is a 4-vertex closed Shape; an ellipse is a 4-vertex closed Shape with the
 * standard 0.5523·radius bezier handles. Bounds default to the whole comp.
 * Verified live on a solid.
 */
export declare function addMaskScript(p: AddMaskParams): string;
export declare function addMaskBody(p: AddMaskParams): string;
export interface LayerProps {
    name?: string;
    enabled?: boolean;
    inPoint?: number;
    outPoint?: number;
    startTime?: number;
    position?: number[];
    scale?: number[];
    rotation?: number;
    opacity?: number;
    anchorPoint?: number[];
    /** The new parent: its index, or (AE-03) its exact name; null unparents. */
    parentIndex?: AeRef | null;
}
export declare function setLayerPropsScript(compId: AeRef, layerIndex: AeRef, p: LayerProps): string;
export declare function setLayerPropsBody(compId: AeRef, layerIndex: AeRef, p: LayerProps): string;
export declare function duplicateLayerScript(compId: AeRef, layerIndex: AeRef, name: string | undefined): string;
export declare function duplicateLayerBody(compId: AeRef, layerIndex: AeRef, name: string | undefined): string;
export declare function deleteLayerScript(compId: AeRef, layerIndex: AeRef): string;
export declare function deleteLayerBody(compId: AeRef, layerIndex: AeRef): string;
export interface KeyframeParams {
    compId: AeRef;
    layerIndex: AeRef;
    property: string;
    propertyPath?: string[];
    keys: {
        time: number;
        value: number | number[];
        easy?: boolean;
    }[];
}
export declare function setKeyframesScript(p: KeyframeParams): string;
export declare function setKeyframesBody(p: KeyframeParams): string;
export declare function getKeyframesScript(compId: AeRef, layerIndex: AeRef, property: string, propertyPath: string[] | undefined): string;
export declare function removeKeyframesScript(compId: AeRef, layerIndex: AeRef, property: string, propertyPath: string[] | undefined): string;
export declare function removeKeyframesBody(compId: AeRef, layerIndex: AeRef, property: string, propertyPath: string[] | undefined): string;
export declare function setExpressionScript(compId: AeRef, layerIndex: AeRef, property: string, propertyPath: string[] | undefined, expression: string | null): string;
export declare function setExpressionBody(compId: AeRef, layerIndex: AeRef, property: string, propertyPath: string[] | undefined, expression: string | null): string;
/** The marker both the ES3 throw in applyEffectScript and the server's "did you mean" check use. */
export declare const EFFECT_MISS = "Effect not available: ";
/**
 * The longest effect name ae_apply_effect takes, in UTF-16 units. After Effects' match and display
 * names are a few dozen characters, so no real name comes near it. The miss path (withEffectSuggestions,
 * the catalog's filtered read) folds and ranks no longer name: fold's NFC reorders a run of combining
 * marks in time quadratic in its length (a 100K-unit name held the event loop for about 16 seconds), and no
 * installed name could match one, since rank keeps only names within 30 % of the query's length.
 */
export declare const EFFECT_NAME_MAX = 1024;
export declare function applyEffectScript(compId: AeRef, layerIndex: AeRef, matchName: string, name?: string): string;
export declare function applyEffectBody(compId: AeRef, layerIndex: AeRef, matchName: string, name?: string): string;
export declare function setEffectParamScript(compId: AeRef, layerIndex: AeRef, effect: number | string, param: string, value: number | number[] | string): string;
export declare function setEffectParamBody(compId: AeRef, layerIndex: AeRef, effect: number | string, param: string, value: number | number[] | string): string;
/**
 * Host facts the live probes settled (AE-16 spec §13, probe 13; After Effects 26.5, 2026-10-10).
 * The messages withEffectSuggestions writes follow from them.
 *  - EFFECT_NAMES_CASE_SENSITIVE: canAddProperty rejects a case-folded match name ("adbe gaussian
 *    blur 2" was refused).
 *  - EFFECT_DISPLAY_NAMES_ACCEPTED: canAddProperty/addProperty accept a display name ("Gaussian
 *    Blur" was applied as ADBE Gaussian Blur 2), so ae_apply_effect's "or display name" holds.
 */
export declare const EFFECT_NAMES_CASE_SENSITIVE = true;
export declare const EFFECT_DISPLAY_NAMES_ACCEPTED = true;
/** A full app.effects read slower than this switches the catalog to the filtered read for later connections. */
export declare const SLOW_EFFECTS_READ_MS = 3000;
/** Every installed effect as [matchName, displayName] tuples (compact on purpose: __acmStr serializes per character). */
export declare const LIST_INSTALLED_EFFECTS: string;
/**
 * Installed effects whose names are about as long as `query` (the catalog's filtered read). Read-only.
 * `query` is the requested name folded and without its vendor tag, `threshold` its rank threshold;
 * the window is the threshold plus 2, so UTF-16 vs code-point lengths can only add entries, never
 * drop one the server would keep. The server ranks the subset with the same code as a full list.
 */
export declare function filteredEffectsScript(query: string, threshold: number): string;
export interface InstalledEffect {
    readonly matchName: string;
    readonly displayName: string;
}
/**
 * The installed effects, for one MCP session (built in registerAfterEffectsTools), read only on an
 * effect miss. Cached per panel connection (the bridge's connectionEpoch): restarting After
 * Effects, installing a plugin or reloading the panel reconnects, so the next miss re-reads.
 *
 * Failures are not cached and are retried on the next miss, except a timeout: the server cannot
 * cancel the host, so a timed-out read stops reads for the rest of that connection, and every
 * later connection uses the filtered read. A full read that succeeds but takes more than
 * SLOW_EFFECTS_READ_MS is kept for this connection and also switches later connections to the
 * filtered read. Concurrent misses share one read.
 */
export declare class EffectCatalog {
    private readonly bridge;
    private readonly clock;
    private list;
    private inflight;
    /** The full read proved slow or timed out: later reads send filteredEffectsScript. */
    private filtered;
    /** A read timed out on this connection: no more reads until the panel reconnects (the host may still be busy with it). */
    private timedOutEpoch;
    constructor(bridge: AppBridge, clock?: () => number);
    private epoch;
    /** Effects worth ranking against `requested`: the cached full list, or a filtered subset. Rejects when no read is possible now. */
    candidates(requested: string): Promise<readonly InstalledEffect[]>;
    private readAll;
    private readFiltered;
}
/** The two probe-settled facts, as a parameter so tests cover every branch without mutating exports. */
export interface EffectNameRules {
    readonly caseSensitive: boolean;
    readonly displayNamesAccepted: boolean;
}
/**
 * ae_apply_effect's miss path: an installed effect After Effects refused (by its match name, or by
 * its display name, which After Effects takes) gets a note that the layer would not take it; a case
 * slip gets the name as After Effects spells it (the match name, or the display name) and a note
 * that case counts; a typo gets up to 3 close installed names. Under rules other than the shipped
 * ones (tests), a display name gets the match name to pass instead. Returns `error` unchanged for
 * anything else, or when the installed list cannot be read now. A name longer than EFFECT_NAME_MAX
 * is only compared exactly: it is never folded or ranked.
 */
export declare function withEffectSuggestions(catalog: EffectCatalog, error: unknown, requested: string, rules?: EffectNameRules): Promise<unknown>;
/**
 * Layer styles are Photoshop's effects (drop shadow, stroke, …) living under
 * "ADBE Layer Styles". Each maps to an internal key; the group is addressed by
 * its match name "<key>/enabled" and its parameters by "<key>/<param>".
 */
export declare const LAYER_STYLE_KEYS: {
    readonly dropShadow: "dropShadow";
    readonly innerShadow: "innerShadow";
    readonly outerGlow: "outerGlow";
    readonly innerGlow: "innerGlow";
    readonly bevelEmboss: "bevelEmboss";
    readonly satin: "chromeFX";
    readonly colorOverlay: "solidFill";
    readonly gradientOverlay: "gradientFill";
    readonly stroke: "frameFX";
};
export type LayerStyleName = keyof typeof LAYER_STYLE_KEYS;
export declare function addLayerStyleScript(compId: AeRef, layerIndex: AeRef, style: LayerStyleName): string;
export declare function getLayerStylesScript(compId: AeRef, layerIndex: AeRef): string;
export declare function setLayerStyleParamScript(compId: AeRef, layerIndex: AeRef, style: LayerStyleName, param: string, value: number | number[] | string): string;
export declare function setLayerStyleParamBody(compId: AeRef, layerIndex: AeRef, style: LayerStyleName, param: string, value: number | number[] | string): string;
export declare function removeLayerStyleScript(compId: AeRef, layerIndex: AeRef, style: LayerStyleName): string;
export declare function removeLayerStyleBody(compId: AeRef, layerIndex: AeRef, style: LayerStyleName): string;
/**
 * Expose a layer property in the comp's Essential Graphics panel so the comp can
 * be exported as a Motion Graphics template. Verified live on AE 26.3:
 * canAddToMotionGraphicsTemplate / addToMotionGraphicsTemplate take the comp the
 * property lives in; the control is named after the property (AE 26.3 has no
 * script to rename it). Source Text lives at ADBE Text Properties > Text Document.
 */
export declare function addToEssentialGraphicsScript(compId: AeRef, layerIndex: AeRef, property: string, propertyPath: string[] | undefined): string;
export declare function addToEssentialGraphicsBody(compId: AeRef, layerIndex: AeRef, property: string, propertyPath: string[] | undefined): string;
/**
 * Export the comp as a .mogrt. The host's exportAsMotionGraphicsTemplate takes a
 * *folder* and names the file from motionGraphicsTemplateName, so we split the
 * requested path, set the name, and write <folder>/<name>.mogrt. Verified live on
 * AE 26.3 (the pre-24.3 "always returns false" bug is gone; we still check the
 * file exists). The project must be saved — a dirty project makes AE prompt.
 * Without overwrite, an existing file is refused before anything is saved or exported, so the
 * file check after the export only ever sees a folder it could not write or an export that failed.
 */
export declare function exportMogrtScript(compId: AeRef, folder: string, name: string, overwrite: boolean): string;
export interface SetTextParams {
    compId: AeRef;
    layerIndex: AeRef;
    text?: string;
    fontSize?: number;
    font?: string;
    color?: string;
    justification?: "left" | "center" | "right";
    anchor?: TextAnchor;
}
export declare function setTextScript(p: SetTextParams): string;
export declare function setTextBody(p: SetTextParams): string;
export declare function addMarkerScript(compId: AeRef, time: number, comment: string, layerIndex: AeRef | undefined, duration: number | undefined): string;
/**
 * AE-03: the layer is looked up before the undo group opens (a bad index or name changes nothing), and a layer
 * marker's result adds layerName; `on` stays "layer " + its index, as before.
 */
export declare function addMarkerBody(compId: AeRef, time: number, comment: string, layerIndex: AeRef | undefined, duration: number | undefined): string;
export declare function renderFrameScript(compId: AeRef, time: number, path: string, maxDimension: number): string;
/** Add a comp (by name) to the render queue with an output path and optional output-module template. */
export declare function queueRenderScript(compName: string, outputPath: string, templateName: string | undefined): string;
export declare function queueRenderBody(compName: string, outputPath: string, templateName: string | undefined): string;
/** The kinds __kind reports, which ae_find_layers filters on (camera and light added to the FR's list). */
export declare const AE_LAYER_KINDS: readonly ["text", "shape", "solid", "null", "precomp", "footage", "adjustment", "camera", "light"];
export type AeLayerKind = (typeof AE_LAYER_KINDS)[number];
export interface FindLayersFilter {
    /** Substring of the layer name, case-insensitive. */
    nameContains?: string;
    kind?: AeLayerKind;
    /** Substring of a text layer's source text, case-insensitive; matches text layers only. */
    textContains?: string;
    enabled?: boolean;
}
/** ae_find_layers: [{ index, name, kind, enabled }] in timeline order, every filter ANDed. Read-only. */
export declare function findLayersScript(comp: AeRef, f: FindLayersFilter): string;
/**
 * The one composition with this exact name, or __compNamed's error (none, or several). Read-only. ae_render_comp runs
 * it before it saves: aerender's -comp takes the first match, so a repeated name fails here instead (spec 11.4).
 */
export declare function compByNameScript(name: string): string;
/**
 * Edit > Undo and Edit > Redo as app.executeCommand ids, read live on After Effects 26.5x89 (Windows 11, English UI,
 * 2026-10-13; spike 06, docs/quirks/ae-undo-redo.md). Fixed ids, never a label lookup: findMenuCommandId("Undo")
 * returns 2371, which is Edit > Purge > Undo (between Purge 2370 and All Memory 2373) and would clear the history, and
 * findMenuCommandId("Redo") returns 0. Command ids are expected not to depend on the UI language (not verified: only an
 * English After Effects was probed, L12).
 */
export declare const AE_UNDO_COMMAND = 16;
export declare const AE_REDO_COMMAND = 2035;
/**
 * ae_undo / ae_redo: run Edit > Undo or Redo once. No undo group (one around an Undo is undefined). With nothing to undo
 * After Effects does nothing and shows no dialog (live L3); the script cannot read which step it undid.
 */
export declare function undoRedoScript(which: "undo" | "redo"): string;
/** Where one ae_batch operation's body sits in the batch script: script lines `first` (its body line 1) to `last`. */
export interface AeBatchSegment {
    readonly tool: string;
    readonly first: number;
    readonly last: number;
    /** The body as sent (after asciiSource), for the excerpt. */
    readonly body: string;
}
export interface AeBatch {
    readonly script: string;
    readonly segments: readonly AeBatchSegment[];
}
/** The empty folder an atomic batch adds first inside its group (and removes inside it on success). */
export declare const AE_BATCH_SENTINEL = "__acm_batch";
/**
 * ae_batch's script: the prelude, one undo group around every operation's body (each in its own function, so its
 * `var`s stay its own), and the suffix. Every frame line is its own script line, so the segment map is exact.
 *
 * - The frame owns the one group: __undo is shimmed to just run its function, so no operation opens a nested group.
 *   __comp is shimmed to record each composition an operation looks up (for nameToIndex); __comp0 is the original,
 *   so a miss still throws inside __comp or __compNamed.
 * - __at is the running operation (1-based), 0 outside the operations: it names the failing one, the line does not.
 * - Every statement after app.beginUndoGroup runs inside the try, and app.endUndoGroup() runs exactly once.
 * - atomic: an empty folder (AE_BATCH_SENTINEL) is added first inside the group, so the group is never empty (an empty
 *   group makes no undo entry, and Edit > Undo would then revert the operator's previous step) and its absence proves
 *   a rollback took. On success it is removed inside the group: one entry. On a failure the group is closed, Edit >
 *   Undo (AE_UNDO_COMMAND) runs in the same eval (it takes effect synchronously, live 2026-10-13), and itemByID of the
 *   folder decides rolledBack: it throws for an item that is gone. The folder is never touched after the group
 *   closes: that would be a new undo entry, and Ctrl-Z would then restore the folder instead of removing the batch.
 * - not atomic: no folder; what ran stays as one entry, and the current names come back with the failure. entered says
 *   whether any operation reached its change step (the shimmed __undo): false means nothing changed, so the group was
 *   empty and left no undo entry (a lookup runs before any change, spec 3.3).
 * Returns { ok: true, results, names } or { ok: false, at, message, line, results, rolledBack | names + entered }: a failure is a
 * value, not a throw, because the panel keeps only a thrown error's message and line, and the cursor would be lost.
 */
export declare function buildAeBatch(ops: readonly {
    tool: string;
    body: string;
}[], atomic: boolean, undoGroupName: string): AeBatch;
/** buildAeBatch's script alone (the classify test's builder; NO_UNDO_OK: it opens its own app.beginUndoGroup). */
export declare function aeBatchScript(ops: readonly {
    tool: string;
    body: string;
}[], atomic: boolean, undoGroupName: string): string;
/**
 * nameToIndex from the plain data __names returns ([{ id, layers: [[index, name], ...] }]): { "<comp id>": { "<layer
 * name>": index, or [indexes] for a name more than one layer has } }. Built with Map and Object.fromEntries, so a
 * layer named __proto__, toString or constructor is an ordinary own key. Anything else in the data is skipped.
 */
export declare function aeNameToIndex(names: unknown): Record<string, Record<string, number | number[]>>;
export declare const AERENDER_INFO: string;
export declare function aerenderExecutable(appFolder: string, isWindows: boolean): string;
export interface RenderCompOptions {
    compName: string;
    outputPath: string;
    outputModule?: string;
    renderSettings?: string;
}
/**
 * Save the project, then render one comp with aerender. Shared by the
 * ae_render_comp tool and the pipelines; throws with an actionable message.
 */
export declare function renderCompHeadless(bridge: AppBridge, o: RenderCompOptions, ctx?: {
    signal?: AbortSignal;
    log?: (line: string) => void;
}): Promise<{
    outputPath: string;
    compName: string;
    log: string;
}>;
/**
 * ae_run_script's script: the X-01 wrapper inside one undo group, with __args in scope, alert/confirm/prompt
 * shadowed, and dialogs optionally suppressed. `o.args` must be aeArgsLiteral's literal.
 *
 * An end call's failure is reported, never lost and never allowed to replace the result. After a result it is
 * annotated onto the envelope (__closed: value and logs kept). After a throw (the wrapper itself, or a begin
 * call, failed) it is appended to the thrown message (__thrown), which escapes to the panel as one plain object
 * with no line; a throw no end call added to is rethrown as it was. So each end call runs from a catch, not a
 * finally: under ES3 a finally cannot see what was thrown, and a throw from it replaces the original.
 *
 * Not built on wrap(): the AE helpers stay out of the caller's scope, and the caller's text enters only as the
 * wrapper's string literal (__src), so bodyLine still counts lines of the caller's script. Everything added
 * around the wrapper sits outside __src and cannot produce a false bodyLine: the shims throw a plain object (no
 * line), an end call's failure is an annotation with line null, and anything that escapes to the panel gets
 * none from dispatchedFailure.
 *
 * The shims stop only a bare alert/confirm/prompt whose scope chain passes through this IIFE, i.e. written in the
 * caller's text. Window.alert, $.global.alert, this.alert, and global code ($.evalFile'd libraries, helpers an
 * earlier call left as globals) still reach After Effects' own dialogs; the model-facing texts say so.
 */
export declare function runRawScript(script: string, o: {
    args: string;
    undoGroupName: string;
    suppressDialogs: boolean;
}): string;
/**
 * ae_run_script's args as one pure-ASCII ES3 object literal (every key quoted), or the plain-text refusal for a
 * value ExtendScript cannot receive as data. Depth is checked before each recursion, so it never recurses more
 * than ARGS_MAX_DEPTH + 1 levels, however deep the input. (ExtendScript has no JSON to parse a string with, so
 * the literal is the only way in; it goes into ae_run_script's outer IIFE, never inside __src.)
 */
export declare function aeArgsLiteral(args: Readonly<Record<string, unknown>>): {
    literal: string;
} | {
    refusal: string;
};
/** The refusal for a script that names a call the tool manages itself (D11). */
export declare const RUN_SCRIPT_MANAGED_REFUSAL: string;
export interface ProjectSwitchCall {
    /** The call as the operator reads it, e.g. "app.open". */
    readonly call: string;
    /** The script line of its first match (1-based, counted as lineCount counts). */
    readonly line: number;
}
/** Each distinct call in `script` that closes or replaces the open project, in order of first appearance. */
export declare function projectSwitchCalls(script: string): ProjectSwitchCall[];
/** What PROJECT_INFO (the read-only check) reports that the refusal states (stateSentence, riskSentence). */
export interface ProjectState {
    /** The project file's full path, or null for a project that was never saved. */
    readonly path: string | null;
    readonly dirty: boolean;
    readonly numItems: number;
}
/** PROJECT_INFO's answer as a ProjectState, or null when it is not one. */
export declare function projectState(raw: unknown): ProjectState | null;
/** The values of After Effects' CloseOptions, which decide what Project.close does with unsaved changes. */
export type CloseOption = "DO_NOT_SAVE_CHANGES" | "SAVE_CHANGES" | "PROMPT_TO_SAVE_CHANGES";
/**
 * The CloseOptions values whose outcome a refusal states for the closes in `script`, judged per close (fix A1; never a
 * value named elsewhere in the text): a close stands for one value only when its own argument is that value, written
 * out (CloseOptions.X or CloseOptions['X'] / ["X"]). Every other close stands for all three: a close through app.project
 * whose argument is a variable, a number, a computed name, more than the value or nothing; a close on any other object
 * whose argument is anything but empty or one value (round-2 fix B2: an alias of app.project the text does not show;
 * a File's or a window's close with an argument over-warns, the safe direction); and a CloseOptions named anywhere
 * but as a close's whole argument (a variable, a comment). The union over all closes: the values in order of first
 * appearance, or all three in CLOSE_OPTIONS' order; none when the scan sees no close (no CloseOptions named, no close
 * through app.project), whatever other closes the text has.
 */
export declare function closeOptionsOf(script: string): CloseOption[];
/**
 * What After Effects does with unsaved changes for each call `script` makes, scoped to what the AE-01 consent live run
 * saw (D15; outcomeOf): for the project's state (a file or none) and suppressDialogs, a call's seen outcome is stated as
 * fact, an expected save prompt as expected (not verified live), and anything not tried is listed as not verified. A
 * close is described by the values closeOptionsOf finds: one value only for a close whose own argument is that value,
 * else each value. Calls with the same outcome share a sentence, in order of first appearance; the first sentence says
 * suppressDialogs' value. Every call is judged on the project open now, so a script with two switch calls or more (two
 * distinct calls, or one call twice: switchCallCount) ends with LATER_CALLS.
 */
export declare function riskSentence(script: string, s: ProjectState, suppress: boolean): string;
/**
 * ae_run_script's refusal of a script that closes or replaces the open project: what it calls, the project's state, the
 * risk (riskSentence), that the approved call does not read the project again, and how the operator's OK in the chat
 * comes back (allowProjectSwitch: true, the same call, once, within 10 minutes). `flagged`: the call already had
 * allowProjectSwitch: true, but no refusal to match it.
 */
export declare function switchRefusal(script: string, s: ProjectState, suppress: boolean, remote: boolean, flagged: boolean): string;
/** The refusal when the read-only check failed (After Effects not connected is the usual plain text, not this). */
export declare function switchCheckFailed(error: unknown): string;
/** cc_eval_script's refusal for an After Effects script that closes or replaces the open project (CS-1). */
export declare function evalSwitchRefusal(calls: readonly ProjectSwitchCall[]): string;
/** How long a refusal lets the same call through with allowProjectSwitch: true. */
export declare const SWITCH_REFUSAL_TTL_MS: number;
/** The most refusals one session remembers; recording one more drops the oldest. */
export declare const SWITCH_REFUSALS_MAX = 64;
/**
 * One call's key for the refuse-first guard: the SHA-256 of its audit payload (the JSON of { script, args }, so a run
 * and the refusal it follows audit the same sha256) and its effective suppressDialogs. The fixed-length prefix keeps the
 * two parts apart.
 */
export declare function switchKey(payload: string, suppressDialogs: boolean): string;
/**
 * ae_run_script's refuse-first guard (AE-01 consent, chat only). A refusal of a script that closes or replaces the open
 * project records its key (switchKey); allowProjectSwitch: true then runs that same call once, within
 * SWITCH_REFUSAL_TTL_MS of the refusal. So the flag works only after the model got the refusal, with the risk it must
 * pass on to the operator; the server cannot tell whether the operator was then asked. One per session (one MCP
 * connection): registerAfterEffectsTools makes one per McpServer, and createMcpServer (server.ts) builds a new McpServer
 * for each stdio session and, through http.ts's createSession on each initialize, for each remote one. Nothing is shared
 * across sessions; but in Claude Code a window is one stdio server process, so its subagents and a new conversation
 * after /clear there are expected to share one (not verified live). `now` is the clock (injectable for tests).
 */
export declare class SwitchRefusals {
    private readonly now;
    /** Key → when it was refused, on `now`'s clock; at most SWITCH_REFUSALS_MAX. */
    private readonly refusedAt;
    constructor(now?: () => number);
    /** Records that the call with this key was just refused (a repeat counts from now). */
    record(key: string): void;
    /**
     * Takes the OK of a call refused within the TTL, so a second call at the same time cannot take it too; null when there
     * is none. The function returned puts it back, keeping its refusal time, for a call whose script never reached the
     * bridge.
     */
    take(key: string): (() => void) | null;
    /** Refused at most SWITCH_REFUSAL_TTL_MS ago; a clock that went back makes it stale (fail closed). */
    private fresh;
    /** Stores the key, drops stale ones, then the oldest beyond the bound. */
    private keep;
}
/**
 * ae_run_script's model-facing description. Claude Code shows a tool description only up to 2,048 characters, so
 * it holds the safety text, in this order: what the tool does and the one undo step, the error-shape rule, the
 * modal-UI warning, the project switch (the auto-save hazard, scoped to the calls the live runs saw it with: AE-01
 * probe 10 and the consent live run's T1 and T2; and the operator's OK in the chat after a refusal), the gate, the
 * envelope. The detail lives in the parameters' texts
 * (RUN_SCRIPT_SCRIPT_TEXT, RUN_SCRIPT_SUPPRESS_TEXT, RUN_SCRIPT_ALLOW_SWITCH_TEXT). It promises only what is
 * verified (AE-01 D15): the dialogs named are the ones suppression hid in the live run on After Effects 26.5
 * (spike 06), never every dialog.
 */
export declare const RUN_SCRIPT_DESCRIPTION: string;
export declare function createProjectScript(force?: boolean): string;
export declare function setActiveCompBody(compId: AeRef): string;
export declare function setActiveCompScript(compId: AeRef): string;
export declare function listLayersBody(compId: AeRef): string;
export declare function listLayersScript(compId: AeRef): string;
export interface AddTextLayerParams {
    compId: AeRef;
    text: string;
    name?: string;
    fontSize?: number;
    fontColor?: number[];
}
export declare function addTextLayerBody(p: AddTextLayerParams): string;
export declare function addTextLayerScript(p: AddTextLayerParams): string;
export interface AddSolidLayerParams {
    compId: AeRef;
    name: string;
    color?: number[];
    width?: number;
    height?: number;
    duration?: number;
}
export declare function addSolidLayerBody(p: AddSolidLayerParams): string;
export declare function addSolidLayerScript(p: AddSolidLayerParams): string;
export declare function renameLayerBody(compId: AeRef, layerIndex: AeRef, newName: string): string;
export declare function renameLayerScript(compId: AeRef, layerIndex: AeRef, newName: string): string;
export declare function setLayerVisibilityBody(compId: AeRef, layerIndex: AeRef, enabled: boolean): string;
export declare function setLayerVisibilityScript(compId: AeRef, layerIndex: AeRef, enabled: boolean): string;
export interface SetLayerTimingParams {
    compId: AeRef;
    layerIndex: AeRef;
    startTime?: number;
    inPoint?: number;
    outPoint?: number;
}
export declare function setLayerTimingBody(p: SetLayerTimingParams): string;
export declare function setLayerTimingScript(p: SetLayerTimingParams): string;
export declare function getTransformPropertiesBody(compId: AeRef, layerIndex: AeRef): string;
export declare function getTransformPropertiesScript(compId: AeRef, layerIndex: AeRef): string;
export declare function setPositionBody(compId: AeRef, layerIndex: AeRef, x: number, y: number, z?: number): string;
export declare function setPositionScript(compId: AeRef, layerIndex: AeRef, x: number, y: number, z?: number): string;
export declare function setScaleBody(compId: AeRef, layerIndex: AeRef, x: number, y: number, z?: number): string;
export declare function setScaleScript(compId: AeRef, layerIndex: AeRef, x: number, y: number, z?: number): string;
export declare function setRotationBody(compId: AeRef, layerIndex: AeRef, degrees: number): string;
export declare function setRotationScript(compId: AeRef, layerIndex: AeRef, degrees: number): string;
export declare function setOpacityBody(compId: AeRef, layerIndex: AeRef, opacity: number): string;
export declare function setOpacityScript(compId: AeRef, layerIndex: AeRef, opacity: number): string;
export interface SetKeyframeInterpolationParams {
    compId: AeRef;
    layerIndex: AeRef;
    property: string;
    propertyPath?: string[];
    keyIndex: number;
    inType: "linear" | "bezier" | "hold";
    outType: "linear" | "bezier" | "hold";
}
export declare function setKeyframeInterpolationBody(p: SetKeyframeInterpolationParams): string;
export declare function setKeyframeInterpolationScript(p: SetKeyframeInterpolationParams): string;
export interface CreateShapeAnimationParams {
    compId: AeRef;
    shapeType: "rect" | "ellipse";
    name?: string;
    startScale?: number;
    endScale?: number;
    duration?: number;
}
export declare function createShapeAnimationBody(p: CreateShapeAnimationParams): string;
export declare function createShapeAnimationScript(p: CreateShapeAnimationParams): string;
export interface CreateTextAnimationParams {
    compId: AeRef;
    text: string;
    name?: string;
    animationType: "fade_in" | "slide_up" | "typewriter";
    duration?: number;
}
export declare function createTextAnimationBody(p: CreateTextAnimationParams): string;
export declare function createTextAnimationScript(p: CreateTextAnimationParams): string;
export declare const INSPECT_RENDER_QUEUE: string;
/** The plain-text refusals for a reference pair (spec 3.1). */
export declare const AE_REF_TEXTS: {
    readonly bothComp: "Pass compId or compName, not both — compId picks the composition by id, compName by its exact name; drop one.";
    readonly noComp: "Pass compId or compName — ae_list_compositions lists both.";
    readonly bothLayer: "Pass layerIndex or layerName, not both — layerIndex picks the layer by position, layerName by its exact name; drop one.";
    readonly noLayer: "Pass layerIndex or layerName — ae_find_layers or ae_get_comp lists both.";
    readonly bothParent: "Pass parentIndex or parentName, not both — drop one (parentIndex null unparents).";
};
type Refused = {
    readonly error: string;
};
type Prepared = {
    readonly body: string;
} | Refused;
interface BatchOpDef<S extends z.ZodRawShape> {
    readonly shape: S;
    /** The tool's script body for its parsed args, or the plain-text refusal of a bad reference. */
    readonly body: (a: z.output<z.ZodObject<S>>) => Prepared;
    /** ae_batch only: false when the args change nothing (a tool whose fields are all optional). */
    readonly changes?: (a: z.output<z.ZodObject<S>>) => boolean;
}
/**
 * Every tool ae_batch can run (spec 5.2: the mutating tools whose builders use __undo, minus the ones in
 * AE_BATCH_EXCLUDED), with its input shape and how its args become its script body. The single tools register with
 * the same shape and mapping, so the two cannot drift.
 */
export declare const AE_BATCH_OPS: {
    ae_create_comp: BatchOpDef<{
        name: z.ZodString;
        width: z.ZodNumber;
        height: z.ZodNumber;
        frameRate: z.ZodOptional<z.ZodNumber>;
        duration: z.ZodOptional<z.ZodNumber>;
        pixelAspect: z.ZodOptional<z.ZodNumber>;
    }>;
    ae_set_comp_props: BatchOpDef<{
        compId: z.ZodOptional<z.ZodNumber>;
        compName: z.ZodOptional<z.ZodString>;
        name: z.ZodOptional<z.ZodString>;
        duration: z.ZodOptional<z.ZodNumber>;
        frameRate: z.ZodOptional<z.ZodNumber>;
        width: z.ZodOptional<z.ZodNumber>;
        height: z.ZodOptional<z.ZodNumber>;
    }>;
    ae_add_layer: BatchOpDef<{
        compId: z.ZodOptional<z.ZodNumber>;
        compName: z.ZodOptional<z.ZodString>;
        kind: z.ZodEnum<{
            text: "text";
            null: "null";
            footage: "footage";
            solid: "solid";
            adjustment: "adjustment";
        }>;
        itemId: z.ZodOptional<z.ZodNumber>;
        color: z.ZodOptional<z.ZodString>;
        name: z.ZodOptional<z.ZodString>;
        text: z.ZodOptional<z.ZodString>;
        anchor: z.ZodOptional<z.ZodEnum<{
            origin: "origin";
            center: "center";
        }>>;
        width: z.ZodOptional<z.ZodNumber>;
        height: z.ZodOptional<z.ZodNumber>;
    }>;
    ae_add_shape: BatchOpDef<{
        compId: z.ZodOptional<z.ZodNumber>;
        compName: z.ZodOptional<z.ZodString>;
        kind: z.ZodEnum<{
            rectangle: "rectangle";
            ellipse: "ellipse";
            star: "star";
            polygon: "polygon";
        }>;
        width: z.ZodOptional<z.ZodNumber>;
        height: z.ZodOptional<z.ZodNumber>;
        points: z.ZodOptional<z.ZodNumber>;
        outerRadius: z.ZodOptional<z.ZodNumber>;
        innerRadius: z.ZodOptional<z.ZodNumber>;
        roundness: z.ZodOptional<z.ZodNumber>;
        position: z.ZodOptional<z.ZodArray<z.ZodNumber>>;
        fill: z.ZodOptional<z.ZodNullable<z.ZodString>>;
        stroke: z.ZodOptional<z.ZodString>;
        strokeWidth: z.ZodOptional<z.ZodNumber>;
        name: z.ZodOptional<z.ZodString>;
    }>;
    ae_add_mask: BatchOpDef<{
        compId: z.ZodOptional<z.ZodNumber>;
        compName: z.ZodOptional<z.ZodString>;
        layerIndex: z.ZodOptional<z.ZodNumber>;
        layerName: z.ZodOptional<z.ZodString>;
        kind: z.ZodEnum<{
            rectangle: "rectangle";
            ellipse: "ellipse";
        }>;
        left: z.ZodOptional<z.ZodNumber>;
        top: z.ZodOptional<z.ZodNumber>;
        right: z.ZodOptional<z.ZodNumber>;
        bottom: z.ZodOptional<z.ZodNumber>;
        mode: z.ZodOptional<z.ZodEnum<{
            none: "none";
            add: "add";
            subtract: "subtract";
            intersect: "intersect";
            lighten: "lighten";
            darken: "darken";
            difference: "difference";
        }>>;
        feather: z.ZodOptional<z.ZodNumber>;
        opacity: z.ZodOptional<z.ZodNumber>;
        expansion: z.ZodOptional<z.ZodNumber>;
        name: z.ZodOptional<z.ZodString>;
    }>;
    ae_set_layer_props: BatchOpDef<{
        compId: z.ZodOptional<z.ZodNumber>;
        compName: z.ZodOptional<z.ZodString>;
        layerIndex: z.ZodOptional<z.ZodNumber>;
        layerName: z.ZodOptional<z.ZodString>;
        name: z.ZodOptional<z.ZodString>;
        enabled: z.ZodOptional<z.ZodBoolean>;
        startTime: z.ZodOptional<z.ZodNumber>;
        inPoint: z.ZodOptional<z.ZodNumber>;
        outPoint: z.ZodOptional<z.ZodNumber>;
        position: z.ZodOptional<z.ZodArray<z.ZodNumber>>;
        scale: z.ZodOptional<z.ZodArray<z.ZodNumber>>;
        rotation: z.ZodOptional<z.ZodNumber>;
        opacity: z.ZodOptional<z.ZodNumber>;
        anchorPoint: z.ZodOptional<z.ZodArray<z.ZodNumber>>;
        parentIndex: z.ZodOptional<z.ZodNullable<z.ZodNumber>>;
        parentName: z.ZodOptional<z.ZodString>;
    }>;
    ae_duplicate_layer: BatchOpDef<{
        compId: z.ZodOptional<z.ZodNumber>;
        compName: z.ZodOptional<z.ZodString>;
        layerIndex: z.ZodOptional<z.ZodNumber>;
        layerName: z.ZodOptional<z.ZodString>;
        name: z.ZodOptional<z.ZodString>;
    }>;
    ae_delete_layer: BatchOpDef<{
        compId: z.ZodOptional<z.ZodNumber>;
        compName: z.ZodOptional<z.ZodString>;
        layerIndex: z.ZodOptional<z.ZodNumber>;
        layerName: z.ZodOptional<z.ZodString>;
        confirm: z.ZodBoolean;
        approvalTicket: z.ZodOptional<z.ZodString>;
    }>;
    ae_set_keyframes: BatchOpDef<{
        compId: z.ZodOptional<z.ZodNumber>;
        compName: z.ZodOptional<z.ZodString>;
        layerIndex: z.ZodOptional<z.ZodNumber>;
        layerName: z.ZodOptional<z.ZodString>;
        property: z.ZodEnum<{
            position: "position";
            scale: "scale";
            rotation: "rotation";
            opacity: "opacity";
            anchorPoint: "anchorPoint";
        }>;
        propertyPath: z.ZodOptional<z.ZodArray<z.ZodString>>;
        keys: z.ZodArray<z.ZodObject<{
            time: z.ZodNumber;
            value: z.ZodUnion<readonly [z.ZodNumber, z.ZodArray<z.ZodNumber>]>;
            easy: z.ZodOptional<z.ZodBoolean>;
        }, z.core.$strip>>;
    }>;
    ae_remove_keyframes: BatchOpDef<{
        compId: z.ZodOptional<z.ZodNumber>;
        compName: z.ZodOptional<z.ZodString>;
        layerIndex: z.ZodOptional<z.ZodNumber>;
        layerName: z.ZodOptional<z.ZodString>;
        property: z.ZodEnum<{
            position: "position";
            scale: "scale";
            rotation: "rotation";
            opacity: "opacity";
            anchorPoint: "anchorPoint";
        }>;
        propertyPath: z.ZodOptional<z.ZodArray<z.ZodString>>;
    }>;
    ae_set_expression: BatchOpDef<{
        compId: z.ZodOptional<z.ZodNumber>;
        compName: z.ZodOptional<z.ZodString>;
        layerIndex: z.ZodOptional<z.ZodNumber>;
        layerName: z.ZodOptional<z.ZodString>;
        property: z.ZodEnum<{
            position: "position";
            scale: "scale";
            rotation: "rotation";
            opacity: "opacity";
            anchorPoint: "anchorPoint";
        }>;
        propertyPath: z.ZodOptional<z.ZodArray<z.ZodString>>;
        expression: z.ZodNullable<z.ZodString>;
    }>;
    ae_apply_effect: BatchOpDef<{
        compId: z.ZodOptional<z.ZodNumber>;
        compName: z.ZodOptional<z.ZodString>;
        layerIndex: z.ZodOptional<z.ZodNumber>;
        layerName: z.ZodOptional<z.ZodString>;
        matchName: z.ZodString;
        name: z.ZodOptional<z.ZodString>;
    }>;
    ae_set_effect_param: BatchOpDef<{
        compId: z.ZodOptional<z.ZodNumber>;
        compName: z.ZodOptional<z.ZodString>;
        layerIndex: z.ZodOptional<z.ZodNumber>;
        layerName: z.ZodOptional<z.ZodString>;
        effect: z.ZodUnion<readonly [z.ZodNumber, z.ZodString]>;
        param: z.ZodString;
        value: z.ZodUnion<readonly [z.ZodNumber, z.ZodArray<z.ZodNumber>, z.ZodString]>;
    }>;
    ae_set_layer_style_param: BatchOpDef<{
        compId: z.ZodOptional<z.ZodNumber>;
        compName: z.ZodOptional<z.ZodString>;
        layerIndex: z.ZodOptional<z.ZodNumber>;
        layerName: z.ZodOptional<z.ZodString>;
        style: z.ZodEnum<{
            dropShadow: "dropShadow";
            innerShadow: "innerShadow";
            outerGlow: "outerGlow";
            innerGlow: "innerGlow";
            bevelEmboss: "bevelEmboss";
            satin: "satin";
            colorOverlay: "colorOverlay";
            gradientOverlay: "gradientOverlay";
            stroke: "stroke";
        }>;
        param: z.ZodString;
        value: z.ZodUnion<readonly [z.ZodNumber, z.ZodArray<z.ZodNumber>, z.ZodString]>;
    }>;
    ae_remove_layer_style: BatchOpDef<{
        compId: z.ZodOptional<z.ZodNumber>;
        compName: z.ZodOptional<z.ZodString>;
        layerIndex: z.ZodOptional<z.ZodNumber>;
        layerName: z.ZodOptional<z.ZodString>;
        style: z.ZodEnum<{
            dropShadow: "dropShadow";
            innerShadow: "innerShadow";
            outerGlow: "outerGlow";
            innerGlow: "innerGlow";
            bevelEmboss: "bevelEmboss";
            satin: "satin";
            colorOverlay: "colorOverlay";
            gradientOverlay: "gradientOverlay";
            stroke: "stroke";
        }>;
    }>;
    ae_add_to_essential_graphics: BatchOpDef<{
        compId: z.ZodOptional<z.ZodNumber>;
        compName: z.ZodOptional<z.ZodString>;
        layerIndex: z.ZodOptional<z.ZodNumber>;
        layerName: z.ZodOptional<z.ZodString>;
        property: z.ZodOptional<z.ZodEnum<{
            position: "position";
            scale: "scale";
            rotation: "rotation";
            opacity: "opacity";
            anchorPoint: "anchorPoint";
            sourceText: "sourceText";
        }>>;
        propertyPath: z.ZodOptional<z.ZodArray<z.ZodString>>;
    }>;
    ae_set_text: BatchOpDef<{
        compId: z.ZodOptional<z.ZodNumber>;
        compName: z.ZodOptional<z.ZodString>;
        layerIndex: z.ZodOptional<z.ZodNumber>;
        layerName: z.ZodOptional<z.ZodString>;
        text: z.ZodOptional<z.ZodString>;
        fontSize: z.ZodOptional<z.ZodNumber>;
        font: z.ZodOptional<z.ZodString>;
        color: z.ZodOptional<z.ZodString>;
        justification: z.ZodOptional<z.ZodEnum<{
            center: "center";
            left: "left";
            right: "right";
        }>>;
        anchor: z.ZodOptional<z.ZodEnum<{
            origin: "origin";
            center: "center";
        }>>;
    }>;
    ae_add_marker: BatchOpDef<{
        compId: z.ZodOptional<z.ZodNumber>;
        compName: z.ZodOptional<z.ZodString>;
        time: z.ZodNumber;
        comment: z.ZodString;
        layerIndex: z.ZodOptional<z.ZodNumber>;
        layerName: z.ZodOptional<z.ZodString>;
        duration: z.ZodOptional<z.ZodNumber>;
    }>;
    ae_queue_render: BatchOpDef<{
        compName: z.ZodString;
        outputPath: z.ZodString;
        templateName: z.ZodOptional<z.ZodString>;
    }>;
};
export type AeBatchTool = keyof typeof AE_BATCH_OPS;
/** The 19 tools ae_batch can run, in AE_BATCH_OPS order. */
export declare const AE_BATCH_TOOLS: AeBatchTool[];
/** Every other ae_* tool, with why ae_batch refuses it (spec 5.2). A new tool is classified on purpose (server test). */
export declare const AE_BATCH_EXCLUDED: Readonly<Record<string, string>>;
/** ae_batch's caps (spec 11.6): checked before anything is sent. */
export declare const AE_BATCH_MAX_OPS = 200;
export declare const AE_BATCH_MAX_CHARS = 2000000;
export interface AfterEffectsToolOptions {
    /** When given, ae_render_comp runs as a job (progress, cancel, wait:false). */
    jobs?: JobRegistry;
    /** Whether ae_render_comp blocks when the caller passes no `wait` (BRAINFERNO_MCP_DEFAULT_WAIT). */
    defaultWait?: boolean;
    /** The raw-script gate: ae_run_script runs only when it includes "after_effects". Always registered. */
    rawScriptApps: readonly RawScriptApp[];
    /** This McpServer serves a remote (shared HTTP) session. */
    remote: boolean;
    /** BRAINFERNO_MCP_ALLOW_REMOTE_RAW_SCRIPTS: whether a remote session may run raw scripts. */
    allowRemoteRawScripts: boolean;
    /** The clock (ms) ae_run_script's project-switch guard reads (SwitchRefusals); defaults to Date.now. Tests inject one. */
    now?: () => number;
}
export declare function registerAfterEffectsTools(mcp: McpServer, bridge: AppBridge, options: AfterEffectsToolOptions): void;
export {};
