import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { AppBridge } from "../bridge/types.js";
export declare function createDocumentScript(width: number, height: number, colorMode: "rgb" | "cmyk"): string;
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
export declare function createShapeScript(p: ShapeParams): string;
export interface TextParams {
    text: string;
    x: number;
    y: number;
    fontSize?: number;
    font?: string;
    fill?: string;
    width?: number;
    height?: number;
    name?: string;
}
export declare function createTextScript(p: TextParams): string;
export declare function saveDocumentScript(path: string | undefined): string;
export type ExportFormat = "png" | "jpg" | "svg";
export declare function exportArtboardScript(format: ExportFormat, path: string, scalePercent: number): string;
export declare function previewScript(path: string, maxDimension: number): string;
export declare function registerIllustratorTools(server: McpServer, bridge: AppBridge): void;
