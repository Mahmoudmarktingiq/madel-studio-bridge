import { randomUUID } from "node:crypto";
import { mkdir } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { z } from "zod";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";

import { jsStringLiteral } from "../bridge/script-escape.js";
import type { AppBridge } from "../bridge/types.js";
import { guard, imageResult, jsonResult } from "./result.js";

/**
 * Illustrator has no public UXP (as of 2026/2027) — it is driven through ExtendScript (ES3)
 * via the os-script lane (COM on Windows, AppleScript on macOS): `var` only, no arrow functions,
 * no modern JS syntax, no native JSON global.
 *
 * Coordinates: every x/y here is measured from the **top-left of the active artboard,
 * y going down** (like web / UI layout). The helpers convert to Illustrator's native
 * y-up coordinate system where top > bottom.
 */

/** ES3 helpers prepended to every script that touches a document. */
const HELPERS = `
function __doc() {
  if (app.documents.length === 0) { throw new Error("No document is open. Create or open one first (ai_create_document)."); }
  return app.activeDocument;
}
function __ab(d) {
  var ab = d.artboards[d.artboards.getActiveArtboardIndex()];
  var r = ab.artboardRect;
  return { left: r[0], top: r[1], right: r[2], bottom: r[3], width: r[2] - r[0], height: r[1] - r[3] };
}
function __rgb(hex) {
  var c = new RGBColor();
  c.red = parseInt(hex.substr(1, 2), 16);
  c.green = parseInt(hex.substr(3, 2), 16);
  c.blue = parseInt(hex.substr(5, 2), 16);
  return c;
}
function __style(item, fill, stroke, strokeWidth) {
  if (fill === null || fill === undefined) { item.filled = false; } else { item.filled = true; item.fillColor = __rgb(fill); }
  if (stroke === null || stroke === undefined) { item.stroked = false; } else {
    item.stroked = true; item.strokeColor = __rgb(stroke);
    if (strokeWidth !== null && strokeWidth !== undefined) { item.strokeWidth = strokeWidth; }
  }
}
function __info(item) {
  var b = item.geometricBounds;
  return { name: item.name, type: item.typename, bounds: { left: b[0], top: b[1], right: b[2], bottom: b[3] } };
}
function __findItem(d, ref) {
  if (typeof ref === "number") {
    if (ref >= 0 && ref < d.pageItems.length) return d.pageItems[ref];
    throw new Error("PageItem index " + ref + " out of bounds (0.." + (d.pageItems.length - 1) + ")");
  }
  for (var i = 0; i < d.pageItems.length; i++) {
    if (d.pageItems[i].name === ref) return d.pageItems[i];
  }
  throw new Error("PageItem with name '" + ref + "' not found in active document.");
}
function __findLayer(d, ref) {
  if (typeof ref === "number") {
    if (ref >= 0 && ref < d.layers.length) return d.layers[ref];
    throw new Error("Layer index " + ref + " out of bounds (0.." + (d.layers.length - 1) + ")");
  }
  for (var i = 0; i < d.layers.length; i++) {
    if (d.layers[i].name === ref) return d.layers[i];
  }
  throw new Error("Layer with name '" + ref + "' not found in active document.");
}
function __toPt(val, unit) {
  if (unit === "mm") return val * 2.83464567;
  if (unit === "in") return val * 72.0;
  if (unit === "cm") return val * 28.3464567;
  return val;
}
`;

const lit = jsStringLiteral;
const num = (n: number): string => String(n);
const opt = (v: string | null | undefined): string => (v === undefined || v === null ? "null" : lit(v));
const optNum = (v: number | null | undefined): string => (v === undefined || v === null ? "null" : num(v));
const optBool = (v: boolean | null | undefined, dflt: boolean): string => (v === undefined || v === null ? String(dflt) : String(v));

const hexColor = z
  .string()
  .regex(/^#[0-9a-fA-F]{6}$/, "hex color like #ff8800")
  .describe("Hex color like #ff8800.");
const coord = (what: string) => z.number().finite().describe(`${what}, in points from the active artboard's top-left (y goes down).`);
const size = (what: string) => z.number().finite().positive().describe(`${what} in points.`);

// ---- script generators ----------------------------------------------------

export function listDocumentsScript(): string {
  return `(function () {
  var out = [];
  for (var i = 0; i < app.documents.length; i++) {
    var doc = app.documents[i];
    var path = null;
    try { path = doc.fullName.fsName; } catch (e) { path = null; }
    out.push({
      index: i,
      name: doc.name,
      path: path,
      width: doc.width,
      height: doc.height,
      artboardCount: doc.artboards.length,
      colorSpace: String(doc.documentColorSpace),
      saved: path !== null
    });
  }
  return out;
})()`;
}

export function getDocumentInfoScript(documentIndex?: number): string {
  return `(function () {${HELPERS}
  var d = ${optNum(documentIndex)} !== null ? app.documents[${documentIndex}] : __doc();
  var path = null;
  try { path = d.fullName.fsName; } catch (e) { path = null; }
  var activeAb = d.artboards.getActiveArtboardIndex();
  var ab = d.artboards[activeAb];
  var r = ab.artboardRect;
  return {
    name: d.name,
    path: path,
    width: d.width,
    height: d.height,
    dimensionsMm: {
      width: Number((d.width / 2.83464567).toFixed(1)),
      height: Number((d.height / 2.83464567).toFixed(1))
    },
    dimensionsInches: {
      width: Number((d.width / 72.0).toFixed(2)),
      height: Number((d.height / 72.0).toFixed(2))
    },
    colorMode: String(d.documentColorSpace),
    artboardsCount: d.artboards.length,
    activeArtboardIndex: activeAb,
    activeArtboardName: ab.name,
    activeArtboardRect: { left: r[0], top: r[1], right: r[2], bottom: r[3] },
    layersCount: d.layers.length,
    pageItemsCount: d.pageItems.length,
    saved: path !== null
  };
})()`;
}

export function createDocumentScript(width: number, height: number, colorMode: "rgb" | "cmyk", units = "pt", name?: string): string {
  const space = colorMode === "cmyk" ? "DocumentColorSpace.CMYK" : "DocumentColorSpace.RGB";
  return `(function () {${HELPERS}
  var wPt = __toPt(${num(width)}, ${lit(units)});
  var hPt = __toPt(${num(height)}, ${lit(units)});
  var d = app.documents.add(${space}, wPt, hPt);
  var docName = ${opt(name)};
  return {
    name: d.name,
    width: d.width,
    height: d.height,
    colorSpace: String(d.documentColorSpace),
    artboardCount: d.artboards.length,
    units: ${lit(units)}
  };
})()`;
}

export function openDocumentScript(path: string): string {
  return `(function () {
  var f = new File(${lit(path)});
  if (!f.exists) { throw new Error("File not found at path: " + ${lit(path)}); }
  var doc = app.open(f);
  return {
    name: doc.name,
    path: f.fsName,
    width: doc.width,
    height: doc.height,
    artboardCount: doc.artboards.length,
    colorSpace: String(doc.documentColorSpace)
  };
})()`;
}

export function saveDocumentScript(path?: string): string {
  return `(function () {${HELPERS}
  var d = __doc();
  var path = ${opt(path)};
  if (path === null) {
    var known = null;
    try { known = d.fullName.fsName; } catch (e) { known = null; }
    if (known === null) { throw new Error("This document has never been saved — pass a path ending in .ai."); }
    d.save();
    return { path: known, saved: true };
  }
  var f = new File(path);
  d.saveAs(f, new IllustratorSaveOptions());
  return { path: f.fsName, saved: true };
})()`;
}

export function saveAsScript(path: string, format = "ai", pdfCompatible = true): string {
  return `(function () {${HELPERS}
  var d = __doc();
  var f = new File(${lit(path)});
  var fmt = ${lit(format.toLowerCase())};
  if (fmt === "eps") {
    var eo = new EPSSaveOptions();
    d.saveAs(f, eo);
  } else {
    var io = new IllustratorSaveOptions();
    io.pdfCompatible = ${String(pdfCompatible)};
    d.saveAs(f, io);
  }
  return { path: f.fsName, format: fmt, saved: true };
})()`;
}

export function closeDocumentScript(save = true): string {
  return `(function () {${HELPERS}
  var d = __doc();
  var name = d.name;
  var opt = ${save ? "SaveOptions.SAVECHANGES" : "SaveOptions.DONOTSAVECHANGES"};
  d.close(opt);
  return { closed: name, saved: ${String(save)} };
})()`;
}

// ---- Artboards scripts ----------------------------------------------------

export function listArtboardsScript(): string {
  return `(function () {${HELPERS}
  var d = __doc();
  var out = [];
  var activeIdx = d.artboards.getActiveArtboardIndex();
  for (var i = 0; i < d.artboards.length; i++) {
    var ab = d.artboards[i];
    var r = ab.artboardRect;
    out.push({
      index: i,
      name: ab.name,
      rect: { left: r[0], top: r[1], right: r[2], bottom: r[3] },
      width: r[2] - r[0],
      height: r[1] - r[3],
      isActive: i === activeIdx
    });
  }
  return out;
})()`;
}

export function createArtboardScript(width: number, height: number, x = 0, y = 0, name?: string): string {
  return `(function () {${HELPERS}
  var d = __doc();
  var left = ${num(x)}, top = ${num(y === 0 ? 0 : -y)};
  var right = left + ${num(width)}, bottom = top - ${num(height)};
  var ab = d.artboards.add([left, top, right, bottom]);
  var abName = ${opt(name)};
  if (abName !== null) { ab.name = abName; }
  var idx = d.artboards.length - 1;
  return {
    index: idx,
    name: ab.name,
    rect: { left: left, top: top, right: right, bottom: bottom },
    width: ${num(width)},
    height: ${num(height)}
  };
})()`;
}

export function resizeArtboardScript(width: number, height: number, artboardIndex?: number, x?: number, y?: number): string {
  return `(function () {${HELPERS}
  var d = __doc();
  var idx = ${optNum(artboardIndex)} !== null ? ${artboardIndex} : d.artboards.getActiveArtboardIndex();
  if (idx < 0 || idx >= d.artboards.length) { throw new Error("Artboard index out of range: " + idx); }
  var ab = d.artboards[idx];
  var r = ab.artboardRect;
  var left = ${optNum(x)} !== null ? ${x} : r[0];
  var top = ${optNum(y)} !== null ? -${y} : r[1];
  ab.artboardRect = [left, top, left + ${num(width)}, top - ${num(height)}];
  return {
    index: idx,
    name: ab.name,
    width: ${num(width)},
    height: ${num(height)},
    rect: { left: left, top: top, right: left + ${num(width)}, bottom: top - ${num(height)} }
  };
})()`;
}

export function renameArtboardScript(name: string, artboardIndex?: number): string {
  return `(function () {${HELPERS}
  var d = __doc();
  var idx = ${optNum(artboardIndex)} !== null ? ${artboardIndex} : d.artboards.getActiveArtboardIndex();
  if (idx < 0 || idx >= d.artboards.length) { throw new Error("Artboard index out of range: " + idx); }
  d.artboards[idx].name = ${lit(name)};
  return { index: idx, name: ${lit(name)} };
})()`;
}

export function setActiveArtboardScript(artboardIndex: number): string {
  return `(function () {${HELPERS}
  var d = __doc();
  if (${artboardIndex} < 0 || ${artboardIndex} >= d.artboards.length) {
    throw new Error("Artboard index out of range: " + ${artboardIndex});
  }
  d.artboards.setActiveArtboardIndex(${artboardIndex});
  return { activeArtboardIndex: ${artboardIndex}, name: d.artboards[${artboardIndex}].name };
})()`;
}

// ---- Vector Objects scripts -----------------------------------------------

export function createRectangleScript(x: number, y: number, width: number, height: number, cornerRadius?: number, fill?: string, stroke?: string, strokeWidth?: number, name?: string): string {
  return `(function () {${HELPERS}
  var d = __doc(); var ab = __ab(d);
  var left = ab.left + ${num(x)}, top = ab.top - ${num(y)};
  var w = ${num(width)}, h = ${num(height)};
  var cr = ${optNum(cornerRadius)};
  var item = cr !== null && cr > 0 ? d.pathItems.roundedRectangle(top, left, w, h, cr, cr) : d.pathItems.rectangle(top, left, w, h);
  __style(item, ${opt(fill)}, ${opt(stroke)}, ${optNum(strokeWidth)});
  var n = ${opt(name)}; if (n !== null) { item.name = n; }
  return __info(item);
})()`;
}

export function createEllipseScript(x: number, y: number, width: number, height: number, fill?: string, stroke?: string, strokeWidth?: number, name?: string): string {
  return `(function () {${HELPERS}
  var d = __doc(); var ab = __ab(d);
  var left = ab.left + ${num(x)}, top = ab.top - ${num(y)};
  var item = d.pathItems.ellipse(top, left, ${num(width)}, ${num(height)});
  __style(item, ${opt(fill)}, ${opt(stroke)}, ${optNum(strokeWidth)});
  var n = ${opt(name)}; if (n !== null) { item.name = n; }
  return __info(item);
})()`;
}

export function createLineScript(x1: number, y1: number, x2: number, y2: number, stroke = "#000000", strokeWidth = 1, name?: string): string {
  return `(function () {${HELPERS}
  var d = __doc(); var ab = __ab(d);
  var p1 = [ab.left + ${num(x1)}, ab.top - ${num(y1)}];
  var p2 = [ab.left + ${num(x2)}, ab.top - ${num(y2)}];
  var item = d.pathItems.add();
  item.setEntirePath([p1, p2]);
  __style(item, null, ${opt(stroke)}, ${optNum(strokeWidth)});
  var n = ${opt(name)}; if (n !== null) { item.name = n; }
  return __info(item);
})()`;
}

export interface PathPointParam {
  x: number;
  y: number;
  inHandle?: [number, number];
  outHandle?: [number, number];
  pointType?: "corner" | "smooth";
}

export function createPathScript(points: PathPointParam[], closed = false, fill?: string, stroke?: string, strokeWidth?: number, name?: string): string {
  const ptsJson = JSON.stringify(points);
  return `(function () {${HELPERS}
  var d = __doc(); var ab = __ab(d);
  var pts = ${ptsJson};
  var path = d.pathItems.add();
  path.closed = ${String(closed)};
  for (var i = 0; i < pts.length; i++) {
    var p = pts[i];
    var pt = path.pathPoints.add();
    var ax = ab.left + p.x, ay = ab.top - p.y;
    pt.anchor = [ax, ay];
    if (p.inHandle && p.inHandle.length === 2) {
      pt.leftDirection = [ax + p.inHandle[0], ay - p.inHandle[1]];
    } else {
      pt.leftDirection = [ax, ay];
    }
    if (p.outHandle && p.outHandle.length === 2) {
      pt.rightDirection = [ax + p.outHandle[0], ay - p.outHandle[1]];
    } else {
      pt.rightDirection = [ax, ay];
    }
    if (p.pointType === "smooth") {
      pt.pointType = PointType.SMOOTH;
    } else {
      pt.pointType = PointType.CORNER;
    }
  }
  __style(path, ${opt(fill)}, ${opt(stroke)}, ${optNum(strokeWidth)});
  var n = ${opt(name)}; if (n !== null) { path.name = n; }
  return __info(path);
})()`;
}

export function createCompoundPathScript(objectNames: string[], name?: string): string {
  const namesJson = JSON.stringify(objectNames);
  return `(function () {${HELPERS}
  var d = __doc();
  var names = ${namesJson};
  var cp = d.compoundPathItems.add();
  for (var i = 0; i < names.length; i++) {
    var item = __findItem(d, names[i]);
    item.moveToBeginning(cp);
  }
  var n = ${opt(name)}; if (n !== null) { cp.name = n; }
  return __info(cp);
})()`;
}

export function moveObjectScript(name: string, dx: number, dy: number): string {
  return `(function () {${HELPERS}
  var d = __doc();
  var item = __findItem(d, ${lit(name)});
  item.translate(${num(dx)}, -${num(dy)});
  return __info(item);
})()`;
}

export function resizeObjectScript(name: string, scaleX: number, scaleY: number): string {
  return `(function () {${HELPERS}
  var d = __doc();
  var item = __findItem(d, ${lit(name)});
  item.resize(${num(scaleX)}, ${num(scaleY)}, true, true, true, true, true, Transformation.CENTER);
  return __info(item);
})()`;
}

export function rotateObjectScript(name: string, angle: number): string {
  return `(function () {${HELPERS}
  var d = __doc();
  var item = __findItem(d, ${lit(name)});
  item.rotate(${num(angle)}, true, true, true, true, Transformation.CENTER);
  return __info(item);
})()`;
}

export function duplicateObjectScript(name: string, newName?: string, dx = 0, dy = 0): string {
  return `(function () {${HELPERS}
  var d = __doc();
  var item = __findItem(d, ${lit(name)});
  var copy = item.duplicate();
  var n = ${opt(newName)}; if (n !== null) { copy.name = n; }
  if (${num(dx)} !== 0 || ${num(dy)} !== 0) {
    copy.translate(${num(dx)}, -${num(dy)});
  }
  return __info(copy);
})()`;
}

export function deleteObjectScript(name: string): string {
  return `(function () {${HELPERS}
  var d = __doc();
  var item = __findItem(d, ${lit(name)});
  var n = item.name || item.typename;
  item.remove();
  return { deleted: n };
})()`;
}

// ---- Legacy shape generator -----------------------------------------------

export interface ShapeParams {
  kind: "rect" | "ellipse" | "line" | "polygon" | "star";
  x: number;
  y: number;
  width: number;
  height: number;
  fill?: string;
  stroke?: string;
  strokeWidth?: number;
  cornerRadius?: number;
  sides?: number;
  points?: number;
  innerRadiusRatio?: number;
  name?: string;
}

export function createShapeScript(p: ShapeParams): string {
  return `(function () {${HELPERS}
  var d = __doc(); var ab = __ab(d);
  var x = ${num(p.x)}, y = ${num(p.y)}, w = ${num(p.width)}, h = ${num(p.height)};
  var left = ab.left + x, top = ab.top - y;
  var cx = left + w / 2, cy = top - h / 2, radius = Math.min(w, h) / 2;
  var kind = ${lit(p.kind)}, item;
  if (kind === "rect") {
    var cr = ${optNum(p.cornerRadius)};
    item = cr !== null && cr > 0 ? d.pathItems.roundedRectangle(top, left, w, h, cr, cr) : d.pathItems.rectangle(top, left, w, h);
  } else if (kind === "ellipse") {
    item = d.pathItems.ellipse(top, left, w, h);
  } else if (kind === "polygon") {
    item = d.pathItems.polygon(cx, cy, radius, ${optNum(p.sides) === "null" ? "6" : num(p.sides as number)});
  } else if (kind === "star") {
    item = d.pathItems.star(cx, cy, radius, radius * ${num(p.innerRadiusRatio ?? 0.5)}, ${optNum(p.points) === "null" ? "5" : num(p.points as number)});
  } else {
    item = d.pathItems.add();
    item.setEntirePath([[left, top], [left + w, top - h]]);
  }
  __style(item, ${opt(p.fill)}, ${opt(p.stroke)}, ${optNum(p.strokeWidth)});
  var name = ${opt(p.name)};
  if (name !== null) { item.name = name; }
  return __info(item);
})()`;
}

// ---- Layers & Groups scripts ----------------------------------------------

export function listLayersScript(): string {
  return `(function () {${HELPERS}
  var d = __doc();
  var out = [];
  for (var i = 0; i < d.layers.length; i++) {
    var l = d.layers[i];
    out.push({
      index: i,
      name: l.name,
      visible: l.visible,
      locked: l.locked,
      opacity: l.opacity,
      pageItemsCount: l.pageItems.length
    });
  }
  return out;
})()`;
}

export function createLayerScript(name: string, above?: string): string {
  return `(function () {${HELPERS}
  var d = __doc();
  var l = d.layers.add();
  l.name = ${lit(name)};
  var targetName = ${opt(above)};
  if (targetName !== null) {
    try {
      var target = __findLayer(d, targetName);
      l.move(target, ElementPlacement.PLACEBEFORE);
    } catch (e) {}
  }
  return { name: l.name, visible: l.visible, locked: l.locked };
})()`;
}

export function renameLayerScript(currentName: string, newName: string): string {
  return `(function () {${HELPERS}
  var d = __doc();
  var l = __findLayer(d, ${lit(currentName)});
  l.name = ${lit(newName)};
  return { oldName: ${lit(currentName)}, name: l.name };
})()`;
}

export function groupObjectsScript(objectNames: string[], groupName?: string): string {
  const namesJson = JSON.stringify(objectNames);
  return `(function () {${HELPERS}
  var d = __doc();
  var names = ${namesJson};
  var grp = d.groupItems.add();
  for (var i = 0; i < names.length; i++) {
    var it = __findItem(d, names[i]);
    it.moveToBeginning(grp);
  }
  var n = ${opt(groupName)}; if (n !== null) { grp.name = n; }
  return __info(grp);
})()`;
}

export function ungroupObjectsScript(groupName: string): string {
  return `(function () {${HELPERS}
  var d = __doc();
  var grp = __findItem(d, ${lit(groupName)});
  if (grp.typename !== "GroupItem") { throw new Error("Item '" + ${lit(groupName)} + "' is not a GroupItem."); }
  var parentLayer = grp.layer;
  while (grp.pageItems.length > 0) {
    grp.pageItems[0].move(parentLayer, ElementPlacement.PLACEATEND);
  }
  grp.remove();
  return { ungrouped: ${lit(groupName)} };
})()`;
}

export function setLayerPropsScript(layerName: string, visible?: boolean, locked?: boolean, opacity?: number): string {
  return `(function () {${HELPERS}
  var d = __doc();
  var l = __findLayer(d, ${lit(layerName)});
  if (${optBool(visible, true)} !== null) { l.visible = ${optBool(visible, true)}; }
  if (${optBool(locked, false)} !== null) { l.locked = ${optBool(locked, false)}; }
  if (${optNum(opacity)} !== null) { l.opacity = ${optNum(opacity)}; }
  return { name: l.name, visible: l.visible, locked: l.locked, opacity: l.opacity };
})()`;
}

// ---- Typography scripts ---------------------------------------------------

export interface TextParams {
  text: string;
  x: number;
  y: number;
  fontSize?: number;
  font?: string;
  fill?: string;
  stroke?: string;
  strokeWidth?: number;
  width?: number;
  height?: number;
  name?: string;
  alignment?: "left" | "center" | "right" | "justify";
}

export function createTextScript(p: TextParams): string {
  return `(function () {${HELPERS}
  var d = __doc(); var ab = __ab(d);
  var left = ab.left + ${num(p.x)}, top = ab.top - ${num(p.y)};
  var w = ${optNum(p.width)}, h = ${optNum(p.height)};
  var t;
  if (w !== null && h !== null) {
    t = d.textFrames.areaText(d.pathItems.rectangle(top, left, w, h));
  } else {
    t = d.textFrames.add();
    t.position = [left, top];
  }
  t.contents = ${lit(p.text)};
  var ca = t.textRange.characterAttributes;
  var size = ${optNum(p.fontSize)};
  if (size !== null) { ca.size = size; }
  var fontName = ${opt(p.font)};
  if (fontName !== null) {
    try { ca.textFont = app.textFonts.getByName(fontName); }
    catch (e) { throw new Error("Font not found: " + fontName + ". Use the PostScript name, e.g. ArialMT, Arial-BoldMT, Helvetica-Bold."); }
  }
  var fill = ${opt(p.fill)};
  if (fill !== null) { ca.fillColor = __rgb(fill); }
  var stroke = ${opt(p.stroke)};
  if (stroke !== null) {
    ca.stroked = true;
    ca.strokeColor = __rgb(stroke);
    if (${optNum(p.strokeWidth)} !== null) { ca.strokeWeight = ${optNum(p.strokeWidth)}; }
  }
  var align = ${opt(p.alignment)};
  if (align !== null && t.textRange.paragraphAttributes) {
    var pa = t.textRange.paragraphAttributes;
    if (align === "center") { pa.justification = Justification.CENTER; }
    else if (align === "right") { pa.justification = Justification.RIGHT; }
    else if (align === "justify") { pa.justification = Justification.FULLJUSTIFY; }
    else { pa.justification = Justification.LEFT; }
  }
  var name = ${opt(p.name)};
  if (name !== null) { t.name = name; }
  var info = __info(t); info.contents = t.contents; return info;
})()`;
}

export function updateTextScript(name: string, text?: string, fontSize?: number, font?: string, fill?: string, alignment?: "left" | "center" | "right" | "justify"): string {
  return `(function () {${HELPERS}
  var d = __doc();
  var t = __findItem(d, ${lit(name)});
  if (t.typename !== "TextFrame") { throw new Error("Item '" + ${lit(name)} + "' is not a TextFrame."); }
  var newText = ${opt(text)};
  if (newText !== null) { t.contents = newText; }
  var ca = t.textRange.characterAttributes;
  var size = ${optNum(fontSize)};
  if (size !== null) { ca.size = size; }
  var fontName = ${opt(font)};
  if (fontName !== null) {
    try { ca.textFont = app.textFonts.getByName(fontName); }
    catch (e) { throw new Error("Font not found: " + fontName); }
  }
  var fill = ${opt(fill)};
  if (fill !== null) { ca.fillColor = __rgb(fill); }
  var align = ${opt(alignment)};
  if (align !== null && t.textRange.paragraphAttributes) {
    var pa = t.textRange.paragraphAttributes;
    if (align === "center") { pa.justification = Justification.CENTER; }
    else if (align === "right") { pa.justification = Justification.RIGHT; }
    else if (align === "justify") { pa.justification = Justification.FULLJUSTIFY; }
    else { pa.justification = Justification.LEFT; }
  }
  var info = __info(t); info.contents = t.contents; return info;
})()`;
}

export function setTextAlignmentScript(name: string, alignment: "left" | "center" | "right" | "justify"): string {
  return `(function () {${HELPERS}
  var d = __doc();
  var t = __findItem(d, ${lit(name)});
  if (t.typename !== "TextFrame") { throw new Error("Item '" + ${lit(name)} + "' is not a TextFrame."); }
  var pa = t.textRange.paragraphAttributes;
  var align = ${lit(alignment)};
  if (align === "center") { pa.justification = Justification.CENTER; }
  else if (align === "right") { pa.justification = Justification.RIGHT; }
  else if (align === "justify") { pa.justification = Justification.FULLJUSTIFY; }
  else { pa.justification = Justification.LEFT; }
  return { name: t.name, alignment: align };
})()`;
}

// ---- Export & Preview scripts ---------------------------------------------

export function exportSvgScript(path: string, embedRasterImages = true, cssProperties = "inline"): string {
  return `(function () {${HELPERS}
  var d = __doc();
  var f = new File(${lit(path)});
  var so = new ExportOptionsSVG();
  so.embedRasterImages = ${String(embedRasterImages)};
  if (${lit(cssProperties)} === "style_elements") {
    so.cssProperties = SVGCSSPropertyLocation.STYLEELEMENTS;
  } else {
    so.cssProperties = SVGCSSPropertyLocation.STYLEATTRIBUTES;
  }
  so.fontSubsetting = SVGFontSubsetting.GLYPHSUSED;
  d.exportFile(f, ExportType.SVG, so);
  return { path: f.fsName, format: "svg" };
})()`;
}

export function exportPdfScript(path: string, compatibility = "acrobat7", preserveEditability = true): string {
  return `(function () {${HELPERS}
  var d = __doc();
  var f = new File(${lit(path)});
  var po = new PDFSaveOptions();
  po.preserveEditability = ${String(preserveEditability)};
  var comp = ${lit(compatibility.toLowerCase())};
  if (comp === "acrobat8") { po.compatibility = PDFCompatibility.ACROBAT8; }
  else if (comp === "acrobat6") { po.compatibility = PDFCompatibility.ACROBAT6; }
  else if (comp === "acrobat5") { po.compatibility = PDFCompatibility.ACROBAT5; }
  else { po.compatibility = PDFCompatibility.ACROBAT7; }
  d.saveAs(f, po);
  return { path: f.fsName, format: "pdf", compatibility: comp };
})()`;
}

export function exportPngScript(path: string, scalePercent = 100, transparency = true, antiAliasing = true): string {
  return `(function () {${HELPERS}
  var d = __doc();
  var f = new File(${lit(path)});
  var po = new ExportOptionsPNG24();
  po.artBoardClipping = true;
  po.antiAliasing = ${String(antiAliasing)};
  po.transparency = ${String(transparency)};
  po.horizontalScale = ${num(scalePercent)};
  po.verticalScale = ${num(scalePercent)};
  d.exportFile(f, ExportType.PNG24, po);
  return { path: f.fsName, format: "png", scalePercent: ${num(scalePercent)} };
})()`;
}

export type ExportFormat = "png" | "jpg" | "svg";

export function exportArtboardScript(format: ExportFormat, path: string, scalePercent: number): string {
  return `(function () {${HELPERS}
  var d = __doc();
  var f = new File(${lit(path)});
  var format = ${lit(format)};
  var scale = ${num(scalePercent)};
  if (format === "png") {
    var po = new ExportOptionsPNG24();
    po.artBoardClipping = true; po.antiAliasing = true; po.transparency = true;
    po.horizontalScale = scale; po.verticalScale = scale;
    d.exportFile(f, ExportType.PNG24, po);
  } else if (format === "jpg") {
    var jo = new ExportOptionsJPEG();
    jo.artBoardClipping = true; jo.antiAliasing = true; jo.qualitySetting = 85;
    jo.horizontalScale = scale; jo.verticalScale = scale;
    d.exportFile(f, ExportType.JPEG, jo);
  } else {
    var so = new ExportOptionsSVG();
    so.embedRasterImages = true;
    d.exportFile(f, ExportType.SVG, so);
  }
  return { path: f.fsName, format: format, scalePercent: scale };
})()`;
}

export function previewScript(path: string, maxDimension: number): string {
  return `(function () {${HELPERS}
  var d = __doc(); var ab = __ab(d);
  var longest = Math.max(ab.width, ab.height);
  var scale = longest > ${num(maxDimension)} ? (100 * ${num(maxDimension)}) / longest : 100;
  var f = new File(${lit(path)});
  var po = new ExportOptionsPNG24();
  po.artBoardClipping = true; po.antiAliasing = true; po.transparency = true;
  po.horizontalScale = scale; po.verticalScale = scale;
  d.exportFile(f, ExportType.PNG24, po);
  return { path: f.fsName, artboardWidth: ab.width, artboardHeight: ab.height, scalePercent: scale };
})()`;
}

// ---- Register Tools -------------------------------------------------------

export function registerIllustratorTools(server: McpServer, bridge: AppBridge): void {
  // ---- 1. Documents -------------------------------------------------------
  server.registerTool(
    "ai_list_documents",
    {
      title: "Illustrator: list open documents",
      description: "List every open Illustrator document with dimensions, artboard count, color space, and save status.",
      inputSchema: {},
      annotations: { readOnlyHint: true },
    },
    async () => guard(async () => jsonResult(await bridge.evaluate(listDocumentsScript()))),
  );

  server.registerTool(
    "ai_get_document_info",
    {
      title: "Illustrator: get document information",
      description: "Get detailed telemetry for active or specified document: dimensions (pt/mm/inches), color mode, artboards, layers, and page items count.",
      inputSchema: {
        documentIndex: z.number().int().min(0).optional().describe("0-based document index. Defaults to the active document."),
      },
      annotations: { readOnlyHint: true },
    },
    async ({ documentIndex }) => guard(async () => jsonResult(await bridge.evaluate(getDocumentInfoScript(documentIndex)))),
  );

  server.registerTool(
    "ai_create_document",
    {
      title: "Illustrator: create a document",
      description: "Create a new Illustrator document with artboard dimensions, measurement units (pt/mm/px/in), and color mode.",
      inputSchema: {
        width: size("Artboard width"),
        height: size("Artboard height"),
        units: z.enum(["pt", "mm", "px", "in"]).optional().describe("Measurement units. Defaults to pt."),
        colorMode: z.enum(["rgb", "cmyk"]).optional().describe("Document color mode. Defaults to rgb."),
        name: z.string().min(1).optional().describe("Document title."),
      },
    },
    async ({ width, height, units, colorMode, name }) =>
      guard(async () => jsonResult(await bridge.evaluate(createDocumentScript(width, height, colorMode ?? "rgb", units ?? "pt", name)))),
  );

  server.registerTool(
    "ai_open_document",
    {
      title: "Illustrator: open a file",
      description: "Open an existing .ai, .eps, .svg, or .pdf vector document and make it active.",
      inputSchema: {
        path: z.string().min(1).describe("Absolute path to the vector file."),
      },
    },
    async ({ path }) => guard(async () => jsonResult(await bridge.evaluate(openDocumentScript(path)))),
  );

  server.registerTool(
    "ai_save_document",
    {
      title: "Illustrator: save the document",
      description: "Save the active document as a native .ai file. Pass path for Save As; omit to save in place.",
      inputSchema: {
        path: z.string().min(1).optional().describe("Absolute path ending in .ai. Omit to save to current file."),
      },
      annotations: { destructiveHint: true },
    },
    async ({ path }) => guard(async () => jsonResult(await bridge.evaluate(saveDocumentScript(path)))),
  );

  server.registerTool(
    "ai_save_as",
    {
      title: "Illustrator: save document as",
      description: "Save active document to a new location with specified format (AI or EPS).",
      inputSchema: {
        path: z.string().min(1).describe("Absolute path ending in .ai or .eps."),
        format: z.enum(["ai", "eps"]).optional().describe("File format. Defaults to ai."),
        pdfCompatible: z.boolean().optional().describe("AI only: embed PDF compatibility. Defaults to true."),
      },
      annotations: { destructiveHint: true },
    },
    async ({ path, format, pdfCompatible }) =>
      guard(async () => jsonResult(await bridge.evaluate(saveAsScript(path, format ?? "ai", pdfCompatible ?? true)))),
  );

  server.registerTool(
    "ai_close_document",
    {
      title: "Illustrator: close document",
      description: "Close the active Illustrator document. Optionally save or discard pending changes.",
      inputSchema: {
        save: z.boolean().optional().describe("Whether to save changes before closing. Defaults to true."),
      },
      annotations: { destructiveHint: true },
    },
    async ({ save }) => guard(async () => jsonResult(await bridge.evaluate(closeDocumentScript(save ?? true)))),
  );

  // ---- 2. Artboards -------------------------------------------------------
  server.registerTool(
    "ai_list_artboards",
    {
      title: "Illustrator: list artboards",
      description: "List all artboards in the active document with index, name, rectangular coordinates, and active status.",
      inputSchema: {},
      annotations: { readOnlyHint: true },
    },
    async () => guard(async () => jsonResult(await bridge.evaluate(listArtboardsScript()))),
  );

  server.registerTool(
    "ai_create_artboard",
    {
      title: "Illustrator: create artboard",
      description: "Add a new artboard with the specified width and height in points.",
      inputSchema: {
        width: size("Artboard width in points"),
        height: size("Artboard height in points"),
        x: z.number().finite().optional().describe("Canvas X offset in points. Defaults to 0."),
        y: z.number().finite().optional().describe("Canvas Y offset in points. Defaults to 0."),
        name: z.string().min(1).optional().describe("Artboard name."),
      },
    },
    async ({ width, height, x, y, name }) =>
      guard(async () => jsonResult(await bridge.evaluate(createArtboardScript(width, height, x ?? 0, y ?? 0, name)))),
  );

  server.registerTool(
    "ai_resize_artboard",
    {
      title: "Illustrator: resize artboard",
      description: "Resize and optionally reposition an artboard by index or active artboard.",
      inputSchema: {
        width: size("New artboard width in points"),
        height: size("New artboard height in points"),
        artboardIndex: z.number().int().min(0).optional().describe("0-based index. Defaults to active artboard."),
        x: z.number().finite().optional().describe("New X position in points."),
        y: z.number().finite().optional().describe("New Y position in points."),
      },
      annotations: { destructiveHint: true },
    },
    async ({ width, height, artboardIndex, x, y }) =>
      guard(async () => jsonResult(await bridge.evaluate(resizeArtboardScript(width, height, artboardIndex, x, y)))),
  );

  server.registerTool(
    "ai_rename_artboard",
    {
      title: "Illustrator: rename artboard",
      description: "Rename an existing artboard by index or active artboard.",
      inputSchema: {
        name: z.string().min(1).describe("New name for the artboard."),
        artboardIndex: z.number().int().min(0).optional().describe("0-based index. Defaults to active artboard."),
      },
    },
    async ({ name, artboardIndex }) =>
      guard(async () => jsonResult(await bridge.evaluate(renameArtboardScript(name, artboardIndex)))),
  );

  server.registerTool(
    "ai_set_active_artboard",
    {
      title: "Illustrator: set active artboard",
      description: "Switch the active artboard index in the current document.",
      inputSchema: {
        artboardIndex: z.number().int().min(0).describe("0-based index of artboard to make active."),
      },
    },
    async ({ artboardIndex }) =>
      guard(async () => jsonResult(await bridge.evaluate(setActiveArtboardScript(artboardIndex)))),
  );

  // ---- 3. Vector Objects --------------------------------------------------
  server.registerTool(
    "ai_create_rectangle",
    {
      title: "Illustrator: draw rectangle",
      description: "Draw a rectangular vector shape on the active artboard. Supports optional corner radius, fill color, and stroke.",
      inputSchema: {
        x: coord("Left edge"),
        y: coord("Top edge"),
        width: size("Width"),
        height: size("Height"),
        cornerRadius: z.number().finite().nonnegative().optional().describe("Corner radius in points for rounded rectangle."),
        fill: hexColor.optional().describe("Hex fill color; omit for transparent fill."),
        stroke: hexColor.optional().describe("Hex stroke color; omit for no stroke."),
        strokeWidth: z.number().finite().positive().optional().describe("Stroke width in points."),
        name: z.string().min(1).optional().describe("Layer name for the object."),
      },
    },
    async ({ x, y, width, height, cornerRadius, fill, stroke, strokeWidth, name }) =>
      guard(async () => jsonResult(await bridge.evaluate(createRectangleScript(x, y, width, height, cornerRadius, fill, stroke, strokeWidth, name)))),
  );

  server.registerTool(
    "ai_create_ellipse",
    {
      title: "Illustrator: draw ellipse",
      description: "Draw an elliptical vector shape on the active artboard inside the bounding box.",
      inputSchema: {
        x: coord("Left edge"),
        y: coord("Top edge"),
        width: size("Width"),
        height: size("Height"),
        fill: hexColor.optional().describe("Hex fill color."),
        stroke: hexColor.optional().describe("Hex stroke color."),
        strokeWidth: z.number().finite().positive().optional().describe("Stroke width in points."),
        name: z.string().min(1).optional().describe("Layer name."),
      },
    },
    async ({ x, y, width, height, fill, stroke, strokeWidth, name }) =>
      guard(async () => jsonResult(await bridge.evaluate(createEllipseScript(x, y, width, height, fill, stroke, strokeWidth, name)))),
  );

  server.registerTool(
    "ai_create_line",
    {
      title: "Illustrator: draw line",
      description: "Draw a straight vector line segment between two points on the active artboard.",
      inputSchema: {
        x1: coord("Start X"),
        y1: coord("Start Y"),
        x2: coord("End X"),
        y2: coord("End Y"),
        stroke: hexColor.optional().describe("Hex stroke color. Defaults to #000000."),
        strokeWidth: z.number().finite().positive().optional().describe("Stroke width in points. Defaults to 1."),
        name: z.string().min(1).optional().describe("Layer name."),
      },
    },
    async ({ x1, y1, x2, y2, stroke, strokeWidth, name }) =>
      guard(async () => jsonResult(await bridge.evaluate(createLineScript(x1, y1, x2, y2, stroke ?? "#000000", strokeWidth ?? 1, name)))),
  );

  server.registerTool(
    "ai_create_path",
    {
      title: "Illustrator: draw Bézier path",
      description: "Draw an arbitrary open or closed Bézier vector path with anchor points and tangent in/out handles.",
      inputSchema: {
        points: z
          .array(
            z.object({
              x: z.number().finite().describe("X coordinate from artboard top-left."),
              y: z.number().finite().describe("Y coordinate from artboard top-left."),
              inHandle: z.tuple([z.number().finite(), z.number().finite()]).optional().describe("Tangent in handle offset [dx, dy]."),
              outHandle: z.tuple([z.number().finite(), z.number().finite()]).optional().describe("Tangent out handle offset [dx, dy]."),
              pointType: z.enum(["corner", "smooth"]).optional().describe("Anchor type. Defaults to corner."),
            }),
          )
          .min(2)
          .describe("Array of Bézier anchor vertices."),
        closed: z.boolean().optional().describe("Whether to close the path. Defaults to false."),
        fill: hexColor.optional().describe("Fill color."),
        stroke: hexColor.optional().describe("Stroke color."),
        strokeWidth: z.number().finite().positive().optional().describe("Stroke width in points."),
        name: z.string().min(1).optional().describe("Layer name."),
      },
    },
    async ({ points, closed, fill, stroke, strokeWidth, name }) =>
      guard(async () => jsonResult(await bridge.evaluate(createPathScript(points, closed ?? false, fill, stroke, strokeWidth, name)))),
  );

  server.registerTool(
    "ai_create_compound_path",
    {
      title: "Illustrator: create compound path",
      description: "Combine multiple path items by name into a single compound path item.",
      inputSchema: {
        objectNames: z.array(z.string().min(1)).min(2).describe("Names of 2 or more path items to combine."),
        name: z.string().min(1).optional().describe("Compound path name."),
      },
    },
    async ({ objectNames, name }) =>
      guard(async () => jsonResult(await bridge.evaluate(createCompoundPathScript(objectNames, name)))),
  );

  server.registerTool(
    "ai_move_object",
    {
      title: "Illustrator: move object",
      description: "Translate a vector object by dx and dy in document points.",
      inputSchema: {
        name: z.string().min(1).describe("Name of the object to translate."),
        dx: z.number().finite().describe("Horizontal offset in points."),
        dy: z.number().finite().describe("Vertical offset in points (positive moves down)."),
      },
    },
    async ({ name, dx, dy }) => guard(async () => jsonResult(await bridge.evaluate(moveObjectScript(name, dx, dy)))),
  );

  server.registerTool(
    "ai_resize_object",
    {
      title: "Illustrator: scale object",
      description: "Resize an object by percentage scale factors (100 = 100%, 150 = 150%).",
      inputSchema: {
        name: z.string().min(1).describe("Name of the object to resize."),
        scaleX: z.number().finite().positive().describe("Horizontal scale factor percentage."),
        scaleY: z.number().finite().positive().describe("Vertical scale factor percentage."),
      },
      annotations: { destructiveHint: true },
    },
    async ({ name, scaleX, scaleY }) =>
      guard(async () => jsonResult(await bridge.evaluate(resizeObjectScript(name, scaleX, scaleY)))),
  );

  server.registerTool(
    "ai_rotate_object",
    {
      title: "Illustrator: rotate object",
      description: "Rotate an object around its center point by angle in degrees.",
      inputSchema: {
        name: z.string().min(1).describe("Name of the object to rotate."),
        angle: z.number().finite().describe("Angle in degrees (positive rotates counterclockwise)."),
      },
      annotations: { destructiveHint: true },
    },
    async ({ name, angle }) => guard(async () => jsonResult(await bridge.evaluate(rotateObjectScript(name, angle)))),
  );

  server.registerTool(
    "ai_duplicate_object",
    {
      title: "Illustrator: duplicate object",
      description: "Duplicate an existing vector object with optional new name and position offset.",
      inputSchema: {
        name: z.string().min(1).describe("Name of the object to duplicate."),
        newName: z.string().min(1).optional().describe("Name for the duplicate."),
        dx: z.number().finite().optional().describe("Optional X shift in points."),
        dy: z.number().finite().optional().describe("Optional Y shift in points."),
      },
    },
    async ({ name, newName, dx, dy }) =>
      guard(async () => jsonResult(await bridge.evaluate(duplicateObjectScript(name, newName, dx ?? 0, dy ?? 0)))),
  );

  server.registerTool(
    "ai_delete_object",
    {
      title: "Illustrator: delete object",
      description: "Delete a vector object. Requires explicit confirm: true to prevent accidental data loss.",
      inputSchema: {
        name: z.string().min(1).describe("Name of the object to delete."),
        confirm: z.boolean().describe("Safety flag: must be true to execute deletion."),
      },
      annotations: { destructiveHint: true },
    },
    async ({ name, confirm }) => {
      if (confirm !== true) {
        throw new Error("Action cancelled: ai_delete_object requires confirm: true to prevent accidental data loss.");
      }
      return guard(async () => jsonResult(await bridge.evaluate(deleteObjectScript(name))));
    },
  );

  server.registerTool(
    "ai_create_shape",
    {
      title: "Illustrator: draw legacy shape",
      description: "Draw a rectangle, ellipse, line, polygon, or star on the active artboard (legacy helper).",
      inputSchema: {
        kind: z.enum(["rect", "ellipse", "line", "polygon", "star"]).describe("Shape type."),
        x: coord("Left edge"),
        y: coord("Top edge"),
        width: size("Width"),
        height: size("Height"),
        fill: hexColor.optional().describe("Fill color; omit for no fill."),
        stroke: hexColor.optional().describe("Stroke color; omit for no stroke."),
        strokeWidth: z.number().finite().positive().optional().describe("Stroke width in points."),
        cornerRadius: z.number().finite().nonnegative().optional().describe("rect only: corner radius in points."),
        sides: z.number().int().min(3).max(100).optional().describe("polygon only: number of sides. Defaults to 6."),
        points: z.number().int().min(3).max(100).optional().describe("star only: number of points. Defaults to 5."),
        innerRadiusRatio: z.number().gt(0).lt(1).optional().describe("star only: inner/outer radius. Defaults to 0.5."),
        name: z.string().min(1).optional().describe("Layer-panel name for the new item."),
      },
    },
    async (params) => guard(async () => jsonResult(await bridge.evaluate(createShapeScript(params)))),
  );

  // ---- 4. Layers & Groups -------------------------------------------------
  server.registerTool(
    "ai_list_layers",
    {
      title: "Illustrator: list layers",
      description: "List every layer in the document with visibility, lock status, and page items count.",
      inputSchema: {},
      annotations: { readOnlyHint: true },
    },
    async () => guard(async () => jsonResult(await bridge.evaluate(listLayersScript()))),
  );

  server.registerTool(
    "ai_create_layer",
    {
      title: "Illustrator: create layer",
      description: "Create a new document layer, optionally positioning it above an existing layer.",
      inputSchema: {
        name: z.string().min(1).describe("Name for the new layer."),
        above: z.string().min(1).optional().describe("Optional name of existing layer to position above."),
      },
    },
    async ({ name, above }) => guard(async () => jsonResult(await bridge.evaluate(createLayerScript(name, above)))),
  );

  server.registerTool(
    "ai_rename_layer",
    {
      title: "Illustrator: rename layer",
      description: "Rename an existing layer in the active document.",
      inputSchema: {
        currentName: z.string().min(1).describe("Current name of layer."),
        newName: z.string().min(1).describe("New name for layer."),
      },
    },
    async ({ currentName, newName }) =>
      guard(async () => jsonResult(await bridge.evaluate(renameLayerScript(currentName, newName)))),
  );

  server.registerTool(
    "ai_group_objects",
    {
      title: "Illustrator: group objects",
      description: "Group two or more vector objects together into a single group container.",
      inputSchema: {
        objectNames: z.array(z.string().min(1)).min(1).describe("Names of objects to group."),
        groupName: z.string().min(1).optional().describe("Name for the new group."),
      },
    },
    async ({ objectNames, groupName }) =>
      guard(async () => jsonResult(await bridge.evaluate(groupObjectsScript(objectNames, groupName)))),
  );

  server.registerTool(
    "ai_ungroup_objects",
    {
      title: "Illustrator: ungroup objects",
      description: "Dissolve a group item, returning its contents back to the parent layer.",
      inputSchema: {
        groupName: z.string().min(1).describe("Name of the group item to dissolve."),
      },
    },
    async ({ groupName }) => guard(async () => jsonResult(await bridge.evaluate(ungroupObjectsScript(groupName)))),
  );

  server.registerTool(
    "ai_set_layer_props",
    {
      title: "Illustrator: set layer properties",
      description: "Update visibility, lock state, or opacity of a layer.",
      inputSchema: {
        layerName: z.string().min(1).describe("Name of the layer."),
        visible: z.boolean().optional().describe("Visibility status."),
        locked: z.boolean().optional().describe("Lock status."),
        opacity: z.number().min(0).max(100).optional().describe("Opacity 0-100."),
      },
    },
    async ({ layerName, visible, locked, opacity }) =>
      guard(async () => jsonResult(await bridge.evaluate(setLayerPropsScript(layerName, visible, locked, opacity)))),
  );

  // ---- 5. Typography ------------------------------------------------------
  server.registerTool(
    "ai_create_text",
    {
      title: "Illustrator: add text",
      description: "Add point text or area text on the active artboard. Font is PostScript name (e.g. ArialMT, Helvetica-Bold).",
      inputSchema: {
        text: z.string().min(1).describe("Text content. Use \\n for line breaks."),
        x: coord("Left edge"),
        y: coord("Top edge"),
        fontSize: z.number().finite().positive().optional().describe("Font size in points."),
        font: z.string().min(1).optional().describe("PostScript font name."),
        fill: hexColor.optional().describe("Fill color."),
        stroke: hexColor.optional().describe("Stroke color."),
        strokeWidth: z.number().finite().positive().optional().describe("Stroke width."),
        width: z.number().finite().positive().optional().describe("Area-text box width."),
        height: z.number().finite().positive().optional().describe("Area-text box height."),
        alignment: z.enum(["left", "center", "right", "justify"]).optional().describe("Text justification."),
        name: z.string().min(1).optional().describe("Layer name for text frame."),
      },
    },
    async (params) => guard(async () => jsonResult(await bridge.evaluate(createTextScript(params)))),
  );

  server.registerTool(
    "ai_update_text",
    {
      title: "Illustrator: update text",
      description: "Update content, font, size, fill color, or alignment of an existing text frame.",
      inputSchema: {
        name: z.string().min(1).describe("Name of the text frame."),
        text: z.string().min(1).optional().describe("New text content."),
        fontSize: z.number().finite().positive().optional().describe("New font size."),
        font: z.string().min(1).optional().describe("New PostScript font name."),
        fill: hexColor.optional().describe("New fill color."),
        alignment: z.enum(["left", "center", "right", "justify"]).optional().describe("New alignment."),
      },
      annotations: { destructiveHint: true },
    },
    async ({ name, text, fontSize, font, fill, alignment }) =>
      guard(async () => jsonResult(await bridge.evaluate(updateTextScript(name, text, fontSize, font, fill, alignment)))),
  );

  server.registerTool(
    "ai_set_text_alignment",
    {
      title: "Illustrator: set text alignment",
      description: "Change paragraph alignment on a text frame: left, center, right, or justify.",
      inputSchema: {
        name: z.string().min(1).describe("Name of the text frame."),
        alignment: z.enum(["left", "center", "right", "justify"]).describe("Paragraph justification."),
      },
    },
    async ({ name, alignment }) =>
      guard(async () => jsonResult(await bridge.evaluate(setTextAlignmentScript(name, alignment)))),
  );

  // ---- 6. Export & Previews -----------------------------------------------
  server.registerTool(
    "ai_export_svg",
    {
      title: "Illustrator: export SVG",
      description: "Export the active document to scalable vector graphics (SVG) format with CSS styling and font subsetting.",
      inputSchema: {
        path: z.string().min(1).describe("Absolute path ending in .svg."),
        embedRasterImages: z.boolean().optional().describe("Embed images into SVG. Defaults to true."),
        cssProperties: z.enum(["inline", "style_elements"]).optional().describe("CSS styling mode. Defaults to inline."),
      },
      annotations: { destructiveHint: true },
    },
    async ({ path, embedRasterImages, cssProperties }) =>
      guard(async () => jsonResult(await bridge.evaluate(exportSvgScript(path, embedRasterImages ?? true, cssProperties ?? "inline")))),
  );

  server.registerTool(
    "ai_export_pdf",
    {
      title: "Illustrator: export PDF",
      description: "Export the active document as a vector PDF with compatibility settings and editability preservation.",
      inputSchema: {
        path: z.string().min(1).describe("Absolute path ending in .pdf."),
        compatibility: z.enum(["acrobat5", "acrobat6", "acrobat7", "acrobat8"]).optional().describe("PDF version. Defaults to acrobat7."),
        preserveEditability: z.boolean().optional().describe("Keep Illustrator editing capabilities. Defaults to true."),
      },
      annotations: { destructiveHint: true },
    },
    async ({ path, compatibility, preserveEditability }) =>
      guard(async () => jsonResult(await bridge.evaluate(exportPdfScript(path, compatibility ?? "acrobat7", preserveEditability ?? true)))),
  );

  server.registerTool(
    "ai_export_png",
    {
      title: "Illustrator: export PNG",
      description: "Export the active artboard as a high-resolution raster PNG image.",
      inputSchema: {
        path: z.string().min(1).describe("Absolute path ending in .png."),
        scalePercent: z.number().finite().positive().max(1000).optional().describe("Scale percent: 100 = 72 ppi, 200 = 144 ppi, 416 = 300 ppi. Defaults to 100."),
        transparency: z.boolean().optional().describe("Transparent background. Defaults to true."),
        antiAliasing: z.boolean().optional().describe("Smooth edge rendering. Defaults to true."),
      },
      annotations: { destructiveHint: true },
    },
    async ({ path, scalePercent, transparency, antiAliasing }) =>
      guard(async () => jsonResult(await bridge.evaluate(exportPngScript(path, scalePercent ?? 100, transparency ?? true, antiAliasing ?? true)))),
  );

  server.registerTool(
    "ai_save_as_ai",
    {
      title: "Illustrator: save as native AI",
      description: "Save active document to a specified path as a native .ai file with optional PDF compatibility.",
      inputSchema: {
        path: z.string().min(1).describe("Absolute path ending in .ai."),
        pdfCompatible: z.boolean().optional().describe("Create PDF-compatible file. Defaults to true."),
      },
      annotations: { destructiveHint: true },
    },
    async ({ path, pdfCompatible }) =>
      guard(async () => jsonResult(await bridge.evaluate(saveAsScript(path, "ai", pdfCompatible ?? true)))),
  );

  server.registerTool(
    "ai_export_artboard",
    {
      title: "Illustrator: export the active artboard (legacy)",
      description: "Export the active artboard to PNG, JPG, or SVG.",
      inputSchema: {
        format: z.enum(["png", "jpg", "svg"]).describe("Output format."),
        path: z.string().min(1).describe("Absolute output path."),
        scalePercent: z.number().finite().positive().max(1000).optional().describe("Scale percentage. Defaults to 100."),
      },
      annotations: { destructiveHint: true },
    },
    async ({ format, path, scalePercent }) =>
      guard(async () => jsonResult(await bridge.evaluate(exportArtboardScript(format, path, scalePercent ?? 100)))),
  );

  server.registerTool(
    "ai_get_preview",
    {
      title: "Illustrator: preview the active artboard",
      description: "Render the active artboard to a temporary PNG image and return it for visual inspection.",
      inputSchema: {
        maxDimension: z.number().int().min(64).max(2048).optional().describe("Longest edge in pixels. Defaults to 1024."),
      },
      annotations: { readOnlyHint: true },
    },
    async ({ maxDimension }) =>
      guard(async () => {
        const dir = join(tmpdir(), "brainferno-mcp-bridge", "previews");
        await mkdir(dir, { recursive: true });
        const path = join(dir, `${randomUUID()}.png`);
        const info = await bridge.evaluate(previewScript(path.replace(/\\/g, "/"), maxDimension ?? 1024), {
          timeoutClass: "slow",
        });
        const written = typeof info === "object" && info !== null && !Array.isArray(info) ? info["path"] : undefined;
        return imageResult(typeof written === "string" ? written : path, "image/png", "Active artboard preview");
      }),
  );
}
