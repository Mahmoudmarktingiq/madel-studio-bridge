/**
 * MADEL Studio Bridge — Microsoft Word MCP Tools
 * Developed and maintained by Mahmoud Adel
 *
 * Implements 17 typed MCP tools for controlling Microsoft Word:
 * - word_open_app
 * - word_create_document
 * - word_open_document (with approval check)
 * - word_read_document
 * - word_write_text
 * - word_edit_text
 * - word_format_text
 * - word_set_direction (RTL/LTR)
 * - word_insert_heading
 * - word_create_table
 * - word_insert_image
 * - word_set_header_footer
 * - word_search_replace
 * - word_set_page_setup
 * - word_save_document
 * - word_export_pdf
 * - word_close_document
 */
import { z } from "zod";
import { globalApprovalGate, globalConcurrencyManager } from "../../gateway/index.js";
import { guard, jsonResult } from "../../tools/result.js";
import { WordManager } from "./word-manager.js";
export function registerWordTools(server) {
    const schedule = async (toolName, task) => {
        return globalConcurrencyManager.schedule("word:operations", async () => task(), {
            correlationId: `corr-word-${Date.now().toString(36)}`,
        });
    };
    // 1. word_open_app
    server.registerTool("word_open_app", {
        title: "Word: Open Application",
        description: "Connects to or launches Microsoft Word via Windows COM, returning application status and open document count.",
        inputSchema: {},
    }, async () => guard(async () => {
        const info = await schedule("word_open_app", async () => WordManager.openApp());
        return jsonResult(info);
    }));
    // 2. word_create_document
    server.registerTool("word_create_document", {
        title: "Word: Create Document",
        description: "Creates a new blank document in Microsoft Word.",
        inputSchema: {},
    }, async () => guard(async () => {
        const doc = await schedule("word_create_document", async () => WordManager.createDocument());
        return jsonResult(doc);
    }));
    // 3. word_open_document
    server.registerTool("word_open_document", {
        title: "Word: Open Existing Document",
        description: "Opens an existing Word document from disk.",
        inputSchema: {
            path: z.string().describe("Absolute or relative path to the Word document (.docx, .doc)."),
            approvalTicket: z.string().optional().describe("Operator approval ticket if opening user sensitive files outside workspace."),
        },
    }, async ({ path, approvalTicket }) => guard(async () => {
        return schedule("word_open_document", async () => {
            if (!path.toLowerCase().includes("office-workspace")) {
                const gateCheck = globalApprovalGate.checkApproval("word_open_document", "config", `Open external Word document: '${path}'`, { path }, approvalTicket);
                if (!gateCheck.authorized) {
                    return jsonResult(gateCheck.challenge);
                }
            }
            const res = await WordManager.openDocument(path);
            return jsonResult(res);
        });
    }));
    // 4. word_read_document
    server.registerTool("word_read_document", {
        title: "Word: Read Document Content",
        description: "Reads paragraphs, word count, character count, and structural metadata from the active Word document.",
        inputSchema: {},
    }, async () => guard(async () => {
        const data = await schedule("word_read_document", async () => WordManager.readDocument());
        return jsonResult(data);
    }));
    // 5. word_write_text
    server.registerTool("word_write_text", {
        title: "Word: Write / Append Text",
        description: "Writes or appends text to the active Word document with font styling, alignment, and RTL support.",
        inputSchema: {
            text: z.string().describe("The text string to insert."),
            bold: z.boolean().optional().describe("Whether text should be bold."),
            italic: z.boolean().optional().describe("Whether text should be italic."),
            underline: z.boolean().optional().describe("Whether text should be underlined."),
            fontName: z.string().optional().describe("Font family name (e.g. 'Calibri', 'Arial', 'Traditional Arabic')."),
            fontSize: z.number().optional().describe("Font size in points (e.g. 12, 14, 18)."),
            colorRgb: z.number().optional().describe("Color RGB integer value."),
            align: z.enum(["left", "center", "right", "justify"]).optional().describe("Paragraph alignment."),
            isRtl: z.boolean().optional().describe("Set true for Arabic / Hebrew right-to-left reading order."),
            addNewline: z.boolean().optional().describe("Whether to append a newline after the text. Default true."),
        },
    }, async (params) => guard(async () => {
        const res = await schedule("word_write_text", async () => WordManager.writeText(params.text, params));
        return jsonResult(res);
    }));
    // 6. word_edit_text
    server.registerTool("word_edit_text", {
        title: "Word: Edit / Replace Text",
        description: "Finds and replaces text occurrences across the active Word document.",
        inputSchema: {
            findText: z.string().describe("Text to search for."),
            replaceWith: z.string().describe("New replacement text."),
        },
    }, async ({ findText, replaceWith }) => guard(async () => {
        const res = await schedule("word_edit_text", async () => WordManager.editText(findText, replaceWith));
        return jsonResult(res);
    }));
    // 7. word_format_text
    server.registerTool("word_format_text", {
        title: "Word: Format Text / Paragraphs",
        description: "Sets paragraph alignment, line spacing, and spacing before/after for document content.",
        inputSchema: {
            align: z.enum(["left", "center", "right", "justify"]).optional().describe("Paragraph alignment."),
            lineSpacing: z.number().optional().describe("Line spacing in points."),
            spaceBefore: z.number().optional().describe("Spacing before paragraph in points."),
            spaceAfter: z.number().optional().describe("Spacing after paragraph in points."),
        },
    }, async (params) => guard(async () => {
        const res = await schedule("word_format_text", async () => WordManager.formatText(params));
        return jsonResult(res);
    }));
    // 8. word_set_direction
    server.registerTool("word_set_direction", {
        title: "Word: Set Reading Direction (RTL/LTR)",
        description: "Sets paragraph reading order to Right-to-Left (RTL for Arabic) or Left-to-Right (LTR).",
        inputSchema: {
            direction: z.enum(["rtl", "ltr"]).describe("Reading order direction."),
        },
    }, async ({ direction }) => guard(async () => {
        const res = await schedule("word_set_direction", async () => WordManager.setDirection(direction));
        return jsonResult(res);
    }));
    // 9. word_insert_heading
    server.registerTool("word_insert_heading", {
        title: "Word: Insert Heading",
        description: "Inserts a structured heading (Heading 1, 2, or 3) into the Word document.",
        inputSchema: {
            text: z.string().describe("Heading text content."),
            level: z.union([z.literal(1), z.literal(2), z.literal(3)]).optional().describe("Heading level (1, 2, or 3). Default 1."),
            isRtl: z.boolean().optional().describe("Right-to-left direction for Arabic headings. Default false."),
        },
    }, async ({ text, level, isRtl }) => guard(async () => {
        const res = await schedule("word_insert_heading", async () => WordManager.insertHeading(text, level || 1, isRtl));
        return jsonResult(res);
    }));
    // 10. word_create_table
    server.registerTool("word_create_table", {
        title: "Word: Create Table",
        description: "Creates and inserts a formatted table with rows, columns, optional headers, and 2D data into Word.",
        inputSchema: {
            rows: z.number().int().min(1).describe("Number of rows."),
            cols: z.number().int().min(1).describe("Number of columns."),
            headers: z.array(z.string()).optional().describe("Column headers array."),
            data: z.array(z.array(z.string())).optional().describe("2D array of cell string values."),
        },
    }, async ({ rows, cols, headers, data }) => guard(async () => {
        const res = await schedule("word_create_table", async () => WordManager.createTable(rows, cols, data, headers));
        return jsonResult(res);
    }));
    // 11. word_insert_image
    server.registerTool("word_insert_image", {
        title: "Word: Insert Image",
        description: "Inserts an image file (.png, .jpg) into the active Word document.",
        inputSchema: {
            imagePath: z.string().describe("Absolute or relative path to the image file."),
            width: z.number().optional().describe("Image width in points."),
            height: z.number().optional().describe("Image height in points."),
        },
    }, async ({ imagePath, width, height }) => guard(async () => {
        const res = await schedule("word_insert_image", async () => WordManager.insertImage(imagePath, { width, height }));
        return jsonResult(res);
    }));
    // 12. word_set_header_footer
    server.registerTool("word_set_header_footer", {
        title: "Word: Set Header & Footer",
        description: "Configures header and footer text for the primary section of the Word document.",
        inputSchema: {
            headerText: z.string().optional().describe("Header text string."),
            footerText: z.string().optional().describe("Footer text string."),
        },
    }, async ({ headerText, footerText }) => guard(async () => {
        const res = await schedule("word_set_header_footer", async () => WordManager.setHeaderFooter({ headerText, footerText }));
        return jsonResult(res);
    }));
    // 13. word_search_replace
    server.registerTool("word_search_replace", {
        title: "Word: Search & Replace",
        description: "Performs full document search and replacement with optional case matching and whole word flags.",
        inputSchema: {
            findText: z.string().describe("Target string to find."),
            replaceWith: z.string().describe("Replacement string."),
            matchCase: z.boolean().optional().describe("Match exact case."),
            matchWholeWord: z.boolean().optional().describe("Match whole word only."),
        },
    }, async ({ findText, replaceWith, matchCase, matchWholeWord }) => guard(async () => {
        const res = await schedule("word_search_replace", async () => WordManager.searchReplace(findText, replaceWith, matchCase, matchWholeWord));
        return jsonResult(res);
    }));
    // 14. word_set_page_setup
    server.registerTool("word_set_page_setup", {
        title: "Word: Page Setup",
        description: "Configures margins, orientation, and paper size for the document.",
        inputSchema: {
            topMarginPoints: z.number().optional().describe("Top margin in points (e.g. 72 for 1 inch)."),
            bottomMarginPoints: z.number().optional().describe("Bottom margin in points."),
            leftMarginPoints: z.number().optional().describe("Left margin in points."),
            rightMarginPoints: z.number().optional().describe("Right margin in points."),
            orientation: z.enum(["portrait", "landscape"]).optional().describe("Page orientation."),
            paperSize: z.enum(["A4", "Letter"]).optional().describe("Paper size."),
        },
    }, async (params) => guard(async () => {
        const res = await schedule("word_set_page_setup", async () => WordManager.setPageSetup(params));
        return jsonResult(res);
    }));
    // 15. word_save_document
    server.registerTool("word_save_document", {
        title: "Word: Save Document (DOCX)",
        description: "Saves the active Word document as a .docx file on disk in the approved Office workspace.",
        inputSchema: {
            outputPath: z.string().optional().describe("Target .docx file path. If omitted, saves to D:\\MCP\\Office-Workspace\\Word."),
        },
    }, async ({ outputPath }) => guard(async () => {
        const res = await schedule("word_save_document", async () => WordManager.saveDocument(outputPath));
        return jsonResult(res);
    }));
    // 16. word_export_pdf
    server.registerTool("word_export_pdf", {
        title: "Word: Export PDF",
        description: "Exports the active Word document to fixed PDF format.",
        inputSchema: {
            outputPath: z.string().optional().describe("Target .pdf file path. If omitted, exports to D:\\MCP\\Office-Workspace\\Exports."),
        },
    }, async ({ outputPath }) => guard(async () => {
        const res = await schedule("word_export_pdf", async () => WordManager.exportPdf(outputPath));
        return jsonResult(res);
    }));
    // 17. word_close_document
    server.registerTool("word_close_document", {
        title: "Word: Close Document",
        description: "Safely closes the active Word document, optionally saving changes.",
        inputSchema: {
            saveChanges: z.boolean().optional().describe("Whether to save changes before closing. Default false."),
        },
    }, async ({ saveChanges }) => guard(async () => {
        const res = await schedule("word_close_document", async () => WordManager.closeDocument(saveChanges));
        return jsonResult(res);
    }));
}
//# sourceMappingURL=word-tools.js.map