/**
 * MADEL Studio Bridge — Configuration Format Parsers & Serializers
 * Developed & Maintained by Mahmoud Adel
 * Clean-Room Implementation supporting JSON, JSONC, TOML, and YAML
 */
import { ConfigFormat } from "./types.js";
/**
 * Strips comments and trailing commas from JSONC text while safely preserving string literals.
 */
export declare function stripJsonComments(input: string): string;
/**
 * A lightweight, reliable clean-room TOML parser tailored for MCP client configurations (e.g. Codex).
 * Parses key-value pairs, strings, numbers, booleans, arrays, and section tables [table.subtable].
 */
export declare function parseToml(input: string): Record<string, unknown>;
/**
 * Serializes a JavaScript object into clean, formatted TOML.
 */
export declare function serializeToml(obj: Record<string, unknown>): string;
/**
 * Parses simple key-value YAML with multi-level nested dictionaries.
 */
export declare function parseYamlSimple(input: string): Record<string, unknown>;
/**
 * Serializes simple dictionary to YAML.
 */
export declare function serializeYamlSimple(obj: Record<string, unknown>): string;
/**
 * Universal config parser supporting JSON, JSONC, TOML, and YAML.
 */
export declare function parseConfigText(text: string, format: ConfigFormat): Record<string, unknown>;
/**
 * Universal config serializer supporting JSON, JSONC, TOML, and YAML.
 */
export declare function serializeConfigData(data: Record<string, unknown>, format: ConfigFormat): string;
