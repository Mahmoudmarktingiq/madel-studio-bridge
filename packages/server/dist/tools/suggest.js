/**
 * "Did you mean" ranking, shared by every tool that can name what the caller probably meant
 * (After Effects effect, property and parameter names today; fonts in AE-04). App-neutral:
 * the After Effects vendor-tag strip is opt-in through `RankOptions.normalize`.
 *
 * Distances are Levenshtein over code points (insert, delete, substitute = 1) on case-folded
 * text. A name is close when its distance is at most the threshold, about 30 % of the query.
 */
/** Case-fold for comparison: NFC, then toLowerCase (locale-independent). */
export function fold(s) {
    return s.normalize("NFC").toLowerCase();
}
/**
 * Drops a leading vendor tag from a fold()ed After Effects name: "adbe ", "cc ", "apc ", "visinf ",
 * "bcc " (or the same with "_"). The shared tag otherwise dominates every match-name distance.
 * Opt-in via RankOptions.normalize; font names must not use it ("PT Sans" is not "Sans").
 */
export const stripAeVendor = (folded) => folded.replace(/^(?:adbe|cc|apc|visinf|bcc)[ _]/, "");
const codePoints = (s) => Array.from(s);
/** max(2, floor(0.3 × code-point length of the query)); pass the query already folded and normalized. */
export function suggestionThreshold(query) {
    // Integer arithmetic: 0.3 * 30 is 8.999… in floating point.
    return Math.max(2, Math.floor((3 * codePoints(query).length) / 10));
}
/** Levenshtein over code points; returns max + 1 as soon as the result must exceed max. */
export function editDistance(a, b, max = Number.POSITIVE_INFINITY) {
    const A = codePoints(a);
    const B = codePoints(b);
    if (Math.abs(A.length - B.length) > max)
        return max + 1;
    let prev = Array.from({ length: B.length + 1 }, (_, j) => j);
    for (let i = 1; i <= A.length; i++) {
        const cur = [i];
        let rowMin = i;
        for (let j = 1; j <= B.length; j++) {
            const cost = A[i - 1] === B[j - 1] ? 0 : 1;
            const v = Math.min(prev[j] + 1, cur[j - 1] + 1, prev[j - 1] + cost);
            cur.push(v);
            if (v < rowMin)
                rowMin = v;
        }
        if (rowMin > max)
            return max + 1;
        prev = cur;
    }
    const d = prev[B.length];
    return d > max ? max + 1 : d;
}
/**
 * The best `limit` items within the threshold, best first; distance 0 (a case-folded hit) is
 * included. Each item appears once, scored by its best key. Order: distance, then the
 * unnormalized distance, then the length gap, then the key (code-unit order), then input order.
 */
export function rank(query, items, keys, options = {}) {
    const normalize = options.normalize ?? ((s) => s);
    const fq = fold(query);
    const q = normalize(fq);
    const n = codePoints(q).length;
    const t = options.threshold ?? suggestionThreshold(q);
    const limit = options.limit ?? 3;
    const scored = [];
    items.forEach((item, index) => {
        let best = null;
        for (const key of keys(item)) {
            const fk = fold(key);
            const nk = normalize(fk);
            const lengthGap = Math.abs(codePoints(nk).length - n);
            if (lengthGap > t)
                continue;
            const distance = editDistance(q, nk, t);
            if (distance > t)
                continue;
            const raw = editDistance(fq, fk);
            if (best === null || distance < best.distance || (distance === best.distance && raw < best.raw)) {
                best = { item, key, distance, raw, lengthGap, index };
            }
        }
        if (best !== null)
            scored.push(best);
    });
    scored.sort((x, y) => x.distance - y.distance ||
        x.raw - y.raw ||
        x.lengthGap - y.lengthGap ||
        (x.key < y.key ? -1 : x.key > y.key ? 1 : 0) ||
        x.index - y.index);
    return scored.slice(0, Math.max(0, limit)).map(({ item, key, distance }) => ({ item, key, distance }));
}
/** rank() over plain names: exact duplicates collapsed (first kept), a name identical (===) to the query dropped. */
export function closestNames(query, names, options = {}) {
    const unique = [...new Set(names)].filter((name) => name !== query);
    return rank(query, unique, (name) => [name], options).map((r) => r.item);
}
//# sourceMappingURL=suggest.js.map