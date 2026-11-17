/**
 * MADEL Studio Bridge — Microsoft PowerPoint COM Automation Manager
 * Developed and maintained by Mahmoud Adel
 *
 * Implements high-level automation methods for Microsoft PowerPoint via Windows COM.
 */
import type { PowerPointPresentationMetadata } from "../common/types.js";
export declare class PowerPointManager {
    private static getWorker;
    static openApp(): Promise<{
        name: string;
        version: string;
        presentationsCount: number;
    }>;
    static createPresentation(): Promise<{
        presentationName: string;
        index: number;
    }>;
    static openPresentation(filePath: string): Promise<PowerPointPresentationMetadata>;
    static addSlide(layoutIndex?: number, // 12 = ppLayoutBlank, 1 = ppLayoutTitle, 2 = ppLayoutText
    insertAt?: number): Promise<{
        slideIndex: number;
        totalSlides: number;
    }>;
    static deleteSlide(slideIndex: number): Promise<{
        success: boolean;
        remainingSlides: number;
    }>;
    static moveSlide(slideIndex: number, toIndex: number): Promise<{
        success: boolean;
    }>;
    static insertText(slideIndex: number, text: string, options?: {
        left?: number;
        top?: number;
        width?: number;
        height?: number;
        fontName?: string;
        fontSize?: number;
        bold?: boolean;
        colorRgb?: number;
        align?: "left" | "center" | "right" | "justify";
        isRtl?: boolean;
    }): Promise<{
        success: boolean;
        shapeName: string;
    }>;
    static insertImage(slideIndex: number, imagePath: string, options?: {
        left?: number;
        top?: number;
        width?: number;
        height?: number;
    }): Promise<{
        success: boolean;
        shapeName: string;
    }>;
    static insertShape(slideIndex: number, shapeType: "rectangle" | "rounded_rectangle" | "oval" | "triangle" | "arrow" | "star", options?: {
        left?: number;
        top?: number;
        width?: number;
        height?: number;
        fillColorRgb?: number;
        lineColorRgb?: number;
        text?: string;
    }): Promise<{
        success: boolean;
        shapeName: string;
    }>;
    static insertTable(slideIndex: number, rows: number, cols: number, data?: string[][], options?: {
        left?: number;
        top?: number;
        width?: number;
        height?: number;
    }): Promise<{
        success: boolean;
        shapeName: string;
    }>;
    static setNotes(slideIndex: number, notesText: string): Promise<{
        success: boolean;
    }>;
    static readSlides(): Promise<{
        slidesCount: number;
        slides: Array<{
            index: number;
            textElements: string[];
            notes: string;
        }>;
    }>;
    static savePresentation(outputPath?: string): Promise<{
        savedPath: string;
        sizeBytes: number;
    }>;
    static exportPdf(outputPath?: string): Promise<{
        pdfPath: string;
        sizeBytes: number;
    }>;
    static exportSlideImage(slideIndex: number, outputPath?: string, width?: number, height?: number): Promise<{
        imagePath: string;
        sizeBytes: number;
    }>;
    static closePresentation(): Promise<{
        success: boolean;
        closed: boolean;
    }>;
    static quitApp(): Promise<{
        success: boolean;
    }>;
}
