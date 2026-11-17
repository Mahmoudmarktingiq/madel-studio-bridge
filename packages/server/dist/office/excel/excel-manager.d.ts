/**
 * MADEL Studio Bridge — Microsoft Excel COM Automation Manager
 * Developed and maintained by Mahmoud Adel
 *
 * Implements high-level automation methods for Microsoft Excel via Windows COM.
 */
import type { ExcelWorkbookMetadata } from "../common/types.js";
export declare class ExcelManager {
    private static getWorker;
    static openApp(): Promise<{
        name: string;
        version: string;
        workbooksCount: number;
    }>;
    static createWorkbook(sheetNames?: string[]): Promise<{
        workbookName: string;
        sheets: string[];
    }>;
    static openWorkbook(filePath: string): Promise<ExcelWorkbookMetadata>;
    static manageSheets(action: "add" | "rename" | "select" | "delete", options?: {
        sheetName?: string;
        newName?: string;
    }): Promise<{
        success: boolean;
        sheets: string[];
        activeSheet: string;
    }>;
    static readRange(rangeAddress?: string, sheetName?: string): Promise<{
        address: string;
        rows: number;
        cols: number;
        values: any[][];
        formulas: string[][];
    }>;
    static writeCells(startCell: string, data: any[][], sheetName?: string): Promise<{
        success: boolean;
        writtenRows: number;
        writtenCols: number;
        targetRange: string;
    }>;
    static setFormula(cellAddress: string, formula: string, sheetName?: string): Promise<{
        success: boolean;
        cell: string;
        formula: string;
        calculatedValue: any;
    }>;
    static getCalculationResult(cellAddress: string, sheetName?: string): Promise<{
        cell: string;
        formula: string;
        calculatedValue: any;
        text: string;
    }>;
    static formatRange(rangeAddress: string, options: {
        bold?: boolean;
        italic?: boolean;
        fontSize?: number;
        fontColorRgb?: number;
        fillColorRgb?: number;
        numberFormat?: string;
        borders?: boolean;
        horizontalAlign?: "left" | "center" | "right";
    }, sheetName?: string): Promise<{
        success: boolean;
        range: string;
    }>;
    static sortRange(rangeAddress: string, keyColumnIndex?: number, descending?: boolean, hasHeader?: boolean, sheetName?: string): Promise<{
        success: boolean;
    }>;
    static filterRange(rangeAddress: string, fieldIndex?: number, criteria?: string, sheetName?: string): Promise<{
        success: boolean;
    }>;
    static createChart(dataRange: string, options?: {
        chartType?: "column" | "bar" | "line" | "pie";
        title?: string;
        left?: number;
        top?: number;
        width?: number;
        height?: number;
    }, sheetName?: string): Promise<{
        success: boolean;
        chartTitle: string;
    }>;
    static manageRowsCols(action: "insert_row" | "delete_row" | "insert_col" | "delete_col" | "autofit" | "set_size", targetIndex: number, options?: {
        count?: number;
        size?: number;
        isColumn?: boolean;
    }, sheetName?: string): Promise<{
        success: boolean;
    }>;
    static searchReplace(findText: string, replaceWith: string, sheetName?: string): Promise<{
        success: boolean;
    }>;
    static saveWorkbook(outputPath?: string): Promise<{
        savedPath: string;
        sizeBytes: number;
    }>;
    static exportPdf(outputPath?: string): Promise<{
        pdfPath: string;
        sizeBytes: number;
    }>;
    static closeWorkbook(saveChanges?: boolean): Promise<{
        success: boolean;
        closed: boolean;
    }>;
    static quitApp(): Promise<{
        success: boolean;
    }>;
}
