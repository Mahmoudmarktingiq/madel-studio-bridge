/**
 * Redaction and caps for text an error echoes back to the client: tool arguments, lines of a
 * generated script, host messages (AE-16). App-neutral.
 *
 * README promises that the server never writes keys or tokens into an error message itself; that
 * the typed After Effects tools' script errors (and the After Effects steps of jobs and pipelines)
 * remove them from the host's message, the echoed arguments and the quoted code, except the few
 * (at most 7) characters of one the host cut a name less than 8 units into; and that in every
 * app an older panel's UNKNOWN_COMMAND text loses them and is put on one line (result.ts). Other
 * apps' script errors pass the host's text on unchanged. Two levels:
 *  - `redactKnown` (R1-R3) for project-derived text (host messages, notes, suggestions):
 *    the configured secrets (also where the host cut a name inside one), Bearer credentials and
 *    Illustrator keys.
 *  - `redact` (R1-R4) for echoed arguments and code excerpts: also any long opaque run that
 *    mixes letters and digits and is not a path segment.
 * Redaction always runs on the full text before any cut or reflow (oneLine), so neither leaves a
 * fragment of a secret that would no longer match. Never redact by argument name (`keys` is a real
 * argument).
 */
export declare const ECHO_LIMITS: {
    readonly string: 80;
    readonly array: 5;
    readonly depth: 3;
    readonly total: 300;
};
export declare const EXCERPT_LIMITS: {
    readonly literal: 80;
    readonly line: 120;
};
/** Code points of host message kept in an error paragraph. */
export declare const MESSAGE_LIMIT = 1500;
export interface RedactionOptions {
    /**
     * The length (UTF-16 units) at which a host cuts the names it quotes (After Effects' __q:
     * AE_NAME_CUT). With it, a secret longer than that is also registered by its first `cut` units,
     * in every form (a name that is the secret, cut); and in a quoted name the host cut — exactly
     * `cut` units, then `mark` — the longest tail of at least 8 units that starts a secret is
     * redacted (a name in which other text comes before the secret, so the cut falls inside it, or
     * a short secret that straddles the cut). Names of any other length are left alone.
     */
    readonly cut?: number;
    /** What the host appends to a name it cut (After Effects' __q: AE_CUT_MARK). Defaults to "...". */
    readonly mark?: string;
}
/**
 * Process-wide exact-match secrets (bridge token, httpToken, Illustrator key), set once in
 * buildRuntime like setPreviewMode. Short values (< 8) are ignored. Each secret is registered in
 * every form it can take in error text: raw; jsStringLiteral's and JSON's inner text (a secret
 * holding `"`, `\` or a control character is still found where text was escaped); blanked, the way
 * a host's name quoting writes it (`"` and `\` escaped, every control character a space); and that
 * quoting decoded again (every control character a space, `"` and `\` raw), the name a "did you
 * mean" list reads back from the host's list.
 */
export declare function setRedactionSecrets(values: readonly (string | undefined)[], options?: RedactionOptions): void;
/**
 * A double-quoted span, its inner text (escape pairs and all) in group 1; or, from a quote that is
 * never closed, the rest of the text, with group 1 undefined. For String.prototype.replace.
 *
 * Linear in the text's length. When a quote is never closed, every later quote is the second half
 * of an escape pair in that same reading, so none of them is closed either: the rest of the text
 * goes in one step. Scanning again from each of those quotes (the plain quoted-span pattern) costs
 * time quadratic in the length: 200 KB of escaped quotes took over 10 seconds. The spans found are
 * the same.
 */
export declare const QUOTED_SPAN: RegExp;
/**
 * R1-R3: for project-derived text (host messages, notes, suggestion names). The cut-name tails go
 * before R1 and again after it (see redactCutTails); the second pass runs only when R1 changed the text.
 */
export declare function redactKnown(text: string): string;
/** R1-R4: for echoed arguments and code excerpts. */
export declare function redact(text: string): string;
/**
 * Drops bidi embeddings, overrides and isolates (U+202A-U+202E, U+2066-U+2069), so supplied text
 * cannot reorder what an error paragraph shows after it. Marks (U+200E/U+200F) and letters stay.
 */
export declare function stripBidi(text: string): string;
/**
 * One paragraph: every line break and every other control character (tab, VT, FF, NEL, ESC, CSI,
 * U+2028, U+2029, any C0 or C1), with the whitespace around it, becomes one space, and bidi
 * overrides are dropped (stripBidi), so text a host or a project supplied cannot start a new line,
 * drive a terminal or reorder what follows it. Redact before calling this: it changes the text.
 */
export declare function oneLine(text: string): string;
/** Cut to `max` code points; a cut text ends "…(+N chars)" (N code points dropped). */
export declare function capCodePoints(text: string, max: number): string;
/** A host message as an error paragraph reads it before the cut: redacted (R1-R3) on the full text, then on one line. */
export declare function messageText(message: string): string;
/**
 * What an error paragraph shows of a host message (scriptErrorText): messageText, cut at
 * MESSAGE_LIMIT code points. The next step After Effects errors get is judged on the same text
 * (after-effects.ts nextStep), so a step the cut drops does not count as shown.
 */
export declare function shownMessage(message: string): string;
/**
 * One-line echo of a tool's arguments (E1-E6): strings redacted (R1-R4), bidi controls dropped,
 * cut at 80 code points and escaped (keys too, unless a plain identifier); numbers/booleans/null as
 * JSON; arrays show 5 items; containers below depth 3 collapse; undefined keys are skipped; the
 * whole echo is cut at 300 code points.
 */
export declare function echoArgs(args: unknown): string;
/**
 * One line of generated script, safe to show (X1-X5): each double-quoted literal is decoded,
 * redacted (R1-R4), cut at 80 code points and re-encoded; the code between literals is
 * redacted; the rebuilt line is cut at 120 code points and kept on one line. A quote that is never
 * closed starts no literal: the rest of the line is code. The literals are QUOTED_SPAN's spans,
 * found in time linear in the line's length.
 */
export declare function excerptLine(code: string): string;
