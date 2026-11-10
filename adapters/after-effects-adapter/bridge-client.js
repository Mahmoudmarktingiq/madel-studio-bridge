/**
 * MADEL Studio Bridge — After Effects Host Transport Client
 * Developed and maintained by Mahmoud Adel
 *
 * Implements the abstract host communication bridge for Adobe After Effects.
 * Translates structured tool parameters into ExtendScript execution bundles,
 * handling timeout guards and atomic undo groupings.
 */

export class AfterEffectsBridgeClient {
  constructor(options = {}) {
    this.appId = "after_effects";
    this.port = options.port || 7897;
    this.timeoutMs = options.timeoutMs || 30_000;
  }

  /**
   * Generates safe ES3 ExtendScript code wrapped in an atomic undo group.
   * @param {string} undoName
   * @param {string} es3Code
   * @returns {string}
   */
  wrapUndoGroup(undoName, es3Code) {
    const safeName = JSON.stringify(undoName || "MADEL AE Operation");
    return [
      `(function() {`,
      `  app.beginUndoGroup(${safeName});`,
      `  try {`,
      `    ${es3Code}`,
      `  } catch(e) {`,
      `    app.endUndoGroup();`,
      `    throw e;`,
      `  }`,
      `  app.endUndoGroup();`,
      `})();`,
    ].join("\n");
  }

  /**
   * Formats a standard composition lookup script.
   * @param {number | string} compRef
   * @returns {string}
   */
  buildCompLookup(compRef) {
    if (typeof compRef === "number") {
      return `var comp = app.project.itemByID(${compRef}); if (!comp || !(comp instanceof CompItem)) throw new Error("Composition ID ${compRef} not found");`;
    }
    const safeName = JSON.stringify(compRef);
    return [
      `var comp = null;`,
      `for (var i = 1; i <= app.project.numItems; i++) {`,
      `  var item = app.project.item(i);`,
      `  if (item instanceof CompItem && item.name === ${safeName}) { comp = item; break; }`,
      `}`,
      `if (!comp) throw new Error("Composition '" + ${safeName} + "' not found");`,
    ].join("\n");
  }
}
