/**
 * MADEL Studio Bridge — Microsoft Word COM Automation Manager
 * Developed and maintained by Mahmoud Adel
 *
 * Implements high-level automation methods for Microsoft Word via Windows COM.
 */
import type { WordDocumentMetadata } from "../common/types.js";
export declare class WordManager {
    private static getWorker;
    static openApp(): Promise<{
        name: string;
        version: string;
        documentsCount: number;
    }>;
    static createDocument(): Promise<{
        documentName: string;
        index: number;
    }>;
    static openDocument(filePath: string): Promise<{
        documentName: string;
        path: string;
    }>;
    static readDocument(): Promise<WordDocumentMetadata & {
        text: string;
        paragraphs: string[];
    }>;
    static writeText(text: string, options?: {
        bold?: boolean;
        italic?: boolean;
        underline?: boolean;
        fontName?: string;
        fontSize?: number;
        colorRgb?: number;
        align?: "left" | "center" | "right" | "justify";
        isRtl?: boolean;
        addNewline?: boolean;
    }): Promise<{
        success: boolean;
        paragraphsCount: number;
    }>;
    static editText(findText: string, replaceWith: string): Promise<{
        replacedCount: number;
    }>;
    static formatText(options: {
        align?: "left" | "center" | "right" | "justify";
        lineSpacing?: number;
        spaceBefore?: number;
        spaceAfter?: number;
    }): Promise<{
        success: boolean;
    }>;
    static setDirection(direction: "rtl" | "ltr"): Promise<{
        success: boolean;
        direction: string;
    }>;
    static insertHeading(text: string, level?: 1 | 2 | 3, isRtl?: boolean): Promise<{
        success: boolean;
        level: number;
    }>;
    static createTable(rows: number, cols: number, data?: string[][], headers?: string[]): Promise<{
        success: boolean;
        rows: number;
        cols: number;
    }>;
    static insertImage(imagePath: string, options?: {
        width?: number;
        height?: number;
    }): Promise<{
        success: boolean;
        path: string;
    }>;
    static setHeaderFooter(options: {
        headerText?: string;
        footerText?: string;
    }): Promise<{
        success: boolean;
    }>;
    static searchReplace(findText: string, replaceWith: string, matchCase?: boolean, matchWholeWord?: boolean): Promise<{
        success: boolean;
    }>;
    static setPageSetup(options: {
        topMarginPoints?: number;
        bottomMarginPoints?: number;
        leftMarginPoints?: number;
        rightMarginPoints?: number;
        orientation?: "portrait" | "landscape";
        paperSize?: "A4" | "Letter";
    }): Promise<{
        success: boolean;
    }>;
    static saveDocument(outputPath?: string): Promise<{
        savedPath: string;
        sizeBytes: number;
    }>;
    static exportPdf(outputPath?: string): Promise<{
        pdfPath: string;
        sizeBytes: number;
    }>;
    static closeDocument(saveChanges?: boolean): Promise<{
        success: boolean;
        closed: boolean;
    }>;
    static quitApp(): Promise<{
        success: boolean;
    }>;
}
