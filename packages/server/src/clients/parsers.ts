/**
 * MADEL Studio Bridge — Configuration Format Parsers & Serializers
 * Developed & Maintained by Mahmoud Adel
 * Clean-Room Implementation supporting JSON, JSONC, TOML, and YAML
 */

import { ConfigFormat } from "./types.js";

/**
 * Strips comments and trailing commas from JSONC text while safely preserving string literals.
 */
export function stripJsonComments(input: string): string {
  let insideString = false;
  let stringChar = "";
  let isEscaped = false;
  let inLineComment = false;
  let inBlockComment = false;
  let result = "";

  for (let i = 0; i < input.length; i++) {
    const char = input[i];
    const nextChar = i + 1 < input.length ? input[i + 1] : "";

    if (inLineComment) {
      if (char === "\n" || char === "\r") {
        inLineComment = false;
        result += char;
      }
      continue;
    }

    if (inBlockComment) {
      if (char === "*" && nextChar === "/") {
        inBlockComment = false;
        i++; // skip /
      }
      continue;
    }

    if (insideString) {
      result += char;
      if (isEscaped) {
        isEscaped = false;
      } else if (char === "\\") {
        isEscaped = true;
      } else if (char === stringChar) {
        insideString = false;
      }
      continue;
    }

    // Check for comment starts
    if (char === "/" && nextChar === "/") {
      inLineComment = true;
      i++; // skip second /
      continue;
    }
    if (char === "/" && nextChar === "*") {
      inBlockComment = true;
      i++; // skip *
      continue;
    }

    // Check for string starts
    if (char === '"' || char === "'") {
      insideString = true;
      stringChar = char;
      result += char;
      continue;
    }

    result += char;
  }

  // Remove trailing commas before } or ]
  return result.replace(/,\s*([}\]])/g, "$1");
}

/**
 * A lightweight, reliable clean-room TOML parser tailored for MCP client configurations (e.g. Codex).
 * Parses key-value pairs, strings, numbers, booleans, arrays, and section tables [table.subtable].
 */
export function parseToml(input: string): Record<string, unknown> {
  const root: Record<string, unknown> = {};
  let currentSection: Record<string, unknown> = root;

  const lines = input.split(/\r?\n/);
  for (const rawLine of lines) {
    const line = rawLine.trim();
    if (!line || line.startsWith("#")) continue;

    // Table header: [section] or [section.sub]
    if (line.startsWith("[") && line.endsWith("]")) {
      const header = line.slice(1, -1).trim();
      const parts = header.split(".").map((p) => p.trim());
      let target = root;
      for (const part of parts) {
        if (!target[part] || typeof target[part] !== "object") {
          target[part] = {};
        }
        target = target[part] as Record<string, unknown>;
      }
      currentSection = target;
      continue;
    }

    // Key-value pair
    const eqIdx = line.indexOf("=");
    if (eqIdx !== -1) {
      const key = line.slice(0, eqIdx).trim();
      const valStr = line.slice(eqIdx + 1).trim();
      currentSection[key] = parseTomlValue(valStr);
    }
  }

  return root;
}

function parseTomlValue(val: string): unknown {
  if (val.startsWith('"') && val.endsWith('"')) {
    try {
      return JSON.parse(val);
    } catch {
      return val.slice(1, -1);
    }
  }
  if (val.startsWith("'") && val.endsWith("'")) {
    return val.slice(1, -1);
  }
  if (val === "true") return true;
  if (val === "false") return false;
  if (/^-?\d+(\.\d+)?$/.test(val)) return Number(val);

  // Array: [ "a", "b" ]
  if (val.startsWith("[") && val.endsWith("]")) {
    const inner = val.slice(1, -1).trim();
    if (!inner) return [];
    // Basic array item splitting
    const items = inner.split(",").map((it) => it.trim()).filter(Boolean);
    return items.map((it) => parseTomlValue(it));
  }

  return val;
}

/**
 * Serializes a JavaScript object into clean, formatted TOML.
 */
export function serializeToml(obj: Record<string, unknown>): string {
  const topLevel: string[] = [];
  const tables: string[] = [];

  for (const [key, val] of Object.entries(obj)) {
    if (val && typeof val === "object" && !Array.isArray(val)) {
      serializeTomlTable(key, val as Record<string, unknown>, tables);
    } else {
      topLevel.push(`${key} = ${formatTomlPrimitive(val)}`);
    }
  }

  const chunks: string[] = [];
  if (topLevel.length > 0) chunks.push(topLevel.join("\n"));
  if (tables.length > 0) chunks.push(tables.join("\n\n"));
  return chunks.join("\n\n") + "\n";
}

function serializeTomlTable(prefix: string, table: Record<string, unknown>, output: string[]): void {
  const lines: string[] = [`[${prefix}]`];
  const subTables: Array<{ key: string; val: Record<string, unknown> }> = [];

  for (const [k, v] of Object.entries(table)) {
    if (v && typeof v === "object" && !Array.isArray(v)) {
      subTables.push({ key: `${prefix}.${k}`, val: v as Record<string, unknown> });
    } else {
      lines.push(`${k} = ${formatTomlPrimitive(v)}`);
    }
  }

  output.push(lines.join("\n"));
  for (const sub of subTables) {
    serializeTomlTable(sub.key, sub.val, output);
  }
}

function formatTomlPrimitive(val: unknown): string {
  if (typeof val === "string") {
    return JSON.stringify(val);
  }
  if (typeof val === "boolean" || typeof val === "number") {
    return String(val);
  }
  if (Array.isArray(val)) {
    return `[ ${val.map((it) => formatTomlPrimitive(it)).join(", ")} ]`;
  }
  if (val === null || val === undefined) {
    return '""';
  }
  return JSON.stringify(val);
}

/**
 * Parses simple key-value YAML with multi-level nested dictionaries.
 */
export function parseYamlSimple(input: string): Record<string, unknown> {
  const root: Record<string, unknown> = {};
  const lines = input.split(/\r?\n/);
  const stack: Array<{ indent: number; obj: Record<string, unknown> }> = [{ indent: -1, obj: root }];

  for (const rawLine of lines) {
    if (!rawLine.trim() || rawLine.trim().startsWith("#")) continue;

    const indent = rawLine.search(/\S/);
    const line = rawLine.trim();

    while (stack.length > 1 && stack[stack.length - 1]!.indent >= indent) {
      stack.pop();
    }
    const current = stack[stack.length - 1]!.obj;

    if (line.endsWith(":")) {
      const key = line.slice(0, -1).trim();
      const newObj: Record<string, unknown> = {};
      current[key] = newObj;
      stack.push({ indent, obj: newObj });
      continue;
    }

    const colIdx = line.indexOf(":");
    if (colIdx !== -1) {
      const key = line.slice(0, colIdx).trim();
      const valStr = line.slice(colIdx + 1).trim();
      current[key] = parseTomlValue(valStr);
    }
  }

  return root;
}

/**
 * Serializes simple dictionary to YAML.
 */
export function serializeYamlSimple(obj: Record<string, unknown>): string {
  const lines: string[] = [];
  for (const [k, v] of Object.entries(obj)) {
    if (v && typeof v === "object" && !Array.isArray(v)) {
      lines.push(`${k}:`);
      for (const [sk, sv] of Object.entries(v as Record<string, unknown>)) {
        lines.push(`  ${sk}: ${formatTomlPrimitive(sv)}`);
      }
    } else {
      lines.push(`${k}: ${formatTomlPrimitive(v)}`);
    }
  }
  return lines.join("\n") + "\n";
}

/**
 * Universal config parser supporting JSON, JSONC, TOML, and YAML.
 */
export function parseConfigText(text: string, format: ConfigFormat): Record<string, unknown> {
  if (!text || !text.trim()) {
    return {};
  }

  switch (format) {
    case ConfigFormat.JSON:
      return JSON.parse(text) as Record<string, unknown>;
    case ConfigFormat.JSONC:
      return JSON.parse(stripJsonComments(text)) as Record<string, unknown>;
    case ConfigFormat.TOML:
      return parseToml(text);
    case ConfigFormat.YAML:
      return parseYamlSimple(text);
    default:
      return JSON.parse(text) as Record<string, unknown>;
  }
}

/**
 * Universal config serializer supporting JSON, JSONC, TOML, and YAML.
 */
export function serializeConfigData(data: Record<string, unknown>, format: ConfigFormat): string {
  switch (format) {
    case ConfigFormat.JSON:
    case ConfigFormat.JSONC:
      return JSON.stringify(data, null, 2) + "\n";
    case ConfigFormat.TOML:
      return serializeToml(data);
    case ConfigFormat.YAML:
      return serializeYamlSimple(data);
    default:
      return JSON.stringify(data, null, 2) + "\n";
  }
}
