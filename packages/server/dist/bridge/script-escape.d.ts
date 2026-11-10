/**
 * Turning a runtime string into a literal that is safe to splice into generated
 * host script source (ExtendScript ES3, or UXP JS).
 *
 * `JSON.stringify` is *not* a correct JS-source escaper: it emits U+2028 (LINE
 * SEPARATOR) and U+2029 (PARAGRAPH SEPARATOR) verbatim, and both are line
 * terminators to a JavaScript parser — an ES3 engine treats them as a newline
 * mid-string and throws a syntax error (and, for attacker-influenced input such
 * as a layer or comp name, it is a script-injection seam). Escape them, along
 * with quotes, backslashes, and the other control characters, explicitly.
 */
/**
 * Returns a double-quoted JavaScript string literal (quotes included) encoding
 * `value`, safe to embed directly in generated script source.
 */
export declare function jsStringLiteral(value: string): string;
