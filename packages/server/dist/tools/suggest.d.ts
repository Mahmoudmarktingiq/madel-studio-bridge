/**
 * "Did you mean" ranking, shared by every tool that can name what the caller probably meant
 * (After Effects effect, property and parameter names today; fonts in AE-04). App-neutral:
 * the After Effects vendor-tag strip is opt-in through `RankOptions.normalize`.
 *
 * Distances are Levenshtein over code points (insert, delete, substitute = 1) on case-folded
 * text. A name is close when its distance is at most the threshold, about 30 % of the query.
 */
export interface Ranked<T> {
    readonly item: T;
    /** The key that matched, as given (not folded or normalized). */
    readonly key: string;
    /** Distance between the normalized, folded query and that key. */
    readonly distance: number;
}
export interface RankOptions {
    /** How many results at most. Default 3. */
    readonly limit?: number;
    /** Largest distance that still counts. Default suggestionThreshold(normalize(fold(query))). */
    readonly threshold?: number;
    /** Applied after fold() to the query and to every key before distances are measured. Default: identity. */
    readonly normalize?: (folded: string) => string;
}
/** Case-fold for comparison: NFC, then toLowerCase (locale-independent). */
export declare function fold(s: string): string;
/**
 * Drops a leading vendor tag from a fold()ed After Effects name: "adbe ", "cc ", "apc ", "visinf ",
 * "bcc " (or the same with "_"). The shared tag otherwise dominates every match-name distance.
 * Opt-in via RankOptions.normalize; font names must not use it ("PT Sans" is not "Sans").
 */
export declare const stripAeVendor: (folded: string) => string;
/** max(2, floor(0.3 × code-point length of the query)); pass the query already folded and normalized. */
export declare function suggestionThreshold(query: string): number;
/** Levenshtein over code points; returns max + 1 as soon as the result must exceed max. */
export declare function editDistance(a: string, b: string, max?: number): number;
/**
 * The best `limit` items within the threshold, best first; distance 0 (a case-folded hit) is
 * included. Each item appears once, scored by its best key. Order: distance, then the
 * unnormalized distance, then the length gap, then the key (code-unit order), then input order.
 */
export declare function rank<T>(query: string, items: readonly T[], keys: (item: T) => readonly string[], options?: RankOptions): Ranked<T>[];
/** rank() over plain names: exact duplicates collapsed (first kept), a name identical (===) to the query dropped. */
export declare function closestNames(query: string, names: readonly string[], options?: RankOptions): string[];
