/**
 * The five Creative Cloud hosts this server drives: which *lane* reaches each
 * one, which in-app *panel* (if any) it needs, and which scripting *engine*
 * runs the work.
 *
 * There is no single automation surface across all five, so the server routes
 * each app down one of three lanes:
 *   - "socket":    an in-app panel dials out to the bridge hub. Photoshop and
 *                  Premiere Pro use a UXP panel; After Effects and Audition use
 *                  a CEP panel. UXP plugins cannot listen on a socket, so the
 *                  panel is always the client and the hub the server.
 *   - "os-script": no panel — the server injects ExtendScript from outside via
 *                  `osascript 'do javascript'` (macOS) or COM `DoJavaScript`
 *                  (Windows). Illustrator has no public UXP, so this is its only
 *                  complete surface.
 *
 * This mapping is deliberate and current (2026): Illustrator UXP is Adobe
 * internal-only, and Premiere's ExtendScript/CEP surface is being removed in
 * favor of UXP — so Premiere is UXP and Illustrator is os-script ExtendScript,
 * not the other way around.
 */
export declare const APP_IDS: readonly ["after_effects", "premiere", "photoshop", "illustrator", "audition"];
export type AppId = (typeof APP_IDS)[number];
/** How the server reaches a host. */
export type Lane = "socket" | "os-script";
/** Which in-app panel technology hosts the bridge client, when there is one. */
export type PanelKind = "uxp" | "cep";
/** Which scripting engine the host's commands ultimately run in. */
export type ScriptEngine = "uxp-batchplay" | "premierepro-api" | "extendscript";
export interface AppInfo {
    id: AppId;
    /** Human-readable name, used in tool descriptions and error messages. */
    displayName: string;
    lane: Lane;
    /** The panel that dials into the hub, for socket-lane apps. */
    panel?: PanelKind;
    engine: ScriptEngine;
    /**
     * Application name as AppleScript sees it, for the macOS os-script lane.
     * Undefined where no such lane exists.
     */
    appleScriptName?: string;
    /**
     * Windows COM ProgID for the os-script lane. Bind a versioned ProgID at
     * runtime (e.g. "Illustrator.Application.30") when multiple versions coexist.
     */
    winProgId?: string;
}
export declare const APPS: Record<AppId, AppInfo>;
export declare function appInfo(id: AppId): AppInfo;
