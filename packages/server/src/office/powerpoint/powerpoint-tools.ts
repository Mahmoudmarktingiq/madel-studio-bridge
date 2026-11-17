/**
 * MADEL Studio Bridge — Microsoft PowerPoint MCP Tools
 * Developed and maintained by Mahmoud Adel
 *
 * Implements 17 typed MCP tools for controlling Microsoft PowerPoint:
 * - powerpoint_open_app
 * - powerpoint_create_presentation
 * - powerpoint_open_presentation (with approval check)
 * - powerpoint_add_slide
 * - powerpoint_delete_slide (with approval check)
 * - powerpoint_move_slide
 * - powerpoint_insert_text (with RTL support)
 * - powerpoint_insert_image
 * - powerpoint_insert_shape
 * - powerpoint_insert_table
 * - powerpoint_set_notes
 * - powerpoint_read_slides
 * - powerpoint_save_presentation
 * - powerpoint_export_pdf
 * - powerpoint_export_slide_image
 * - powerpoint_close_presentation
 * - powerpoint_quit_app
 */

import { z } from "zod";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { globalApprovalGate, globalConcurrencyManager } from "../../gateway/index.js";
import { guard, jsonResult } from "../../tools/result.js";
import { PowerPointManager } from "./powerpoint-manager.js";

export function registerPowerPointTools(server: McpServer): void {
  const schedule = async <T>(toolName: string, task: () => Promise<T>): Promise<T> => {
    return globalConcurrencyManager.schedule("powerpoint:operations", async () => task(), {
      correlationId: `corr-ppt-${Date.now().toString(36)}`,
    });
  };

  // 1. powerpoint_open_app
  server.registerTool(
    "powerpoint_open_app",
    {
      title: "PowerPoint: Open Application",
      description: "Connects to or launches Microsoft PowerPoint via Windows COM, returning application status and presentation count.",
      inputSchema: {},
    },
    async () =>
      guard(async () => {
        const info = await schedule("powerpoint_open_app", async () => PowerPointManager.openApp());
        return jsonResult(info);
      }),
  );

  // 2. powerpoint_create_presentation
  server.registerTool(
    "powerpoint_create_presentation",
    {
      title: "PowerPoint: Create Presentation",
      description: "Creates a new blank presentation in Microsoft PowerPoint.",
      inputSchema: {},
    },
    async () =>
      guard(async () => {
        const res = await schedule("powerpoint_create_presentation", async () => PowerPointManager.createPresentation());
        return jsonResult(res);
      }),
  );

  // 3. powerpoint_open_presentation
  server.registerTool(
    "powerpoint_open_presentation",
    {
      title: "PowerPoint: Open Existing Presentation",
      description: "Opens an existing PowerPoint presentation (.pptx, .ppt) from disk.",
      inputSchema: {
        path: z.string().describe("Path to the presentation file."),
        approvalTicket: z.string().optional().describe("Operator approval ticket if opening user sensitive files outside workspace."),
      },
    },
    async ({ path, approvalTicket }) =>
      guard(async () => {
        return schedule("powerpoint_open_presentation", async () => {
          if (!path.toLowerCase().includes("office-workspace")) {
            const gateCheck = globalApprovalGate.checkApproval(
              "powerpoint_open_presentation",
              "config",
              `Open external PowerPoint presentation: '${path}'`,
              { path },
              approvalTicket,
            );
            if (!gateCheck.authorized) {
              return jsonResult(gateCheck.challenge);
            }
          }
          const res = await PowerPointManager.openPresentation(path);
          return jsonResult(res);
        });
      }),
  );

  // 4. powerpoint_add_slide
  server.registerTool(
    "powerpoint_add_slide",
    {
      title: "PowerPoint: Add Slide",
      description: "Adds a slide with a specified layout (Blank=12, Title=1, Title & Content=2, Two Content=3).",
      inputSchema: {
        layoutIndex: z.number().int().optional().describe("Layout index. Default 12 (Blank)."),
        insertAt: z.number().int().optional().describe("1-based slide position to insert at. If omitted, appends to end."),
      },
    },
    async ({ layoutIndex, insertAt }) =>
      guard(async () => {
        const res = await schedule("powerpoint_add_slide", async () =>
          PowerPointManager.addSlide(layoutIndex ?? 12, insertAt),
        );
        return jsonResult(res);
      }),
  );

  // 5. powerpoint_delete_slide
  server.registerTool(
    "powerpoint_delete_slide",
    {
      title: "PowerPoint: Delete Slide",
      description: "Permanently deletes a slide from the presentation by 1-based index. Requires confirm=true and approval ticket.",
      inputSchema: {
        slideIndex: z.number().int().min(1).describe("1-based index of the slide to delete."),
        confirm: z.boolean().describe("Explicit confirmation boolean. Must be true to delete."),
        approvalTicket: z.string().optional().describe("Operator approval ticket required for destructive deletion."),
      },
    },
    async ({ slideIndex, confirm, approvalTicket }) =>
      guard(async () => {
        return schedule("powerpoint_delete_slide", async () => {
          if (!confirm) {
            throw new Error("Slide deletion aborted: 'confirm' must be explicitly set to true.");
          }
          const gateCheck = globalApprovalGate.checkApproval(
            "powerpoint_delete_slide",
            "destructive",
            `Delete PowerPoint slide at index ${slideIndex}`,
            { slideIndex },
            approvalTicket,
          );
          if (!gateCheck.authorized) {
            return jsonResult(gateCheck.challenge);
          }
          const res = await PowerPointManager.deleteSlide(slideIndex);
          return jsonResult(res);
        });
      }),
  );

  // 6. powerpoint_move_slide
  server.registerTool(
    "powerpoint_move_slide",
    {
      title: "PowerPoint: Move Slide",
      description: "Moves a slide from one position to another in the presentation.",
      inputSchema: {
        slideIndex: z.number().int().min(1).describe("Current 1-based slide index."),
        toIndex: z.number().int().min(1).describe("Target 1-based slide position."),
      },
    },
    async ({ slideIndex, toIndex }) =>
      guard(async () => {
        const res = await schedule("powerpoint_move_slide", async () => PowerPointManager.moveSlide(slideIndex, toIndex));
        return jsonResult(res);
      }),
  );

  // 7. powerpoint_insert_text
  server.registerTool(
    "powerpoint_insert_text",
    {
      title: "PowerPoint: Insert Textbox",
      description: "Adds a textbox to a slide with position, font styling, alignment, and RTL reading order.",
      inputSchema: {
        slideIndex: z.number().int().min(1).describe("1-based slide index."),
        text: z.string().describe("Text content to insert."),
        left: z.number().optional().describe("Left coordinate in points. Default 50."),
        top: z.number().optional().describe("Top coordinate in points. Default 50."),
        width: z.number().optional().describe("Width in points. Default 600."),
        height: z.number().optional().describe("Height in points. Default 100."),
        fontName: z.string().optional().describe("Font name (e.g. 'Calibri', 'Arial', 'Traditional Arabic')."),
        fontSize: z.number().optional().describe("Font size in points (e.g. 24, 32, 44)."),
        bold: z.boolean().optional().describe("Bold text."),
        colorRgb: z.number().optional().describe("Text color RGB integer."),
        align: z.enum(["left", "center", "right", "justify"]).optional().describe("Paragraph alignment."),
        isRtl: z.boolean().optional().describe("Set true for Arabic right-to-left direction."),
      },
    },
    async (params) =>
      guard(async () => {
        const res = await schedule("powerpoint_insert_text", async () =>
          PowerPointManager.insertText(params.slideIndex, params.text, params),
        );
        return jsonResult(res);
      }),
  );

  // 8. powerpoint_insert_image
  server.registerTool(
    "powerpoint_insert_image",
    {
      title: "PowerPoint: Insert Image",
      description: "Inserts an image file (.png, .jpg) onto a slide.",
      inputSchema: {
        slideIndex: z.number().int().min(1).describe("1-based slide index."),
        imagePath: z.string().describe("Path to the image file."),
        left: z.number().optional().describe("Left coordinate in points. Default 100."),
        top: z.number().optional().describe("Top coordinate in points. Default 100."),
        width: z.number().optional().describe("Width in points. Default 400."),
        height: z.number().optional().describe("Height in points. Default 300."),
      },
    },
    async ({ slideIndex, imagePath, left, top, width, height }) =>
      guard(async () => {
        const res = await schedule("powerpoint_insert_image", async () =>
          PowerPointManager.insertImage(slideIndex, imagePath, { left, top, width, height }),
        );
        return jsonResult(res);
      }),
  );

  // 9. powerpoint_insert_shape
  server.registerTool(
    "powerpoint_insert_shape",
    {
      title: "PowerPoint: Insert Shape",
      description: "Inserts a geometric vector shape (rectangle, rounded_rectangle, oval, triangle, arrow, star) with fill and line colors.",
      inputSchema: {
        slideIndex: z.number().int().min(1).describe("1-based slide index."),
        shapeType: z.enum(["rectangle", "rounded_rectangle", "oval", "triangle", "arrow", "star"]).describe("Type of shape."),
        left: z.number().optional().describe("Left coordinate. Default 100."),
        top: z.number().optional().describe("Top coordinate. Default 100."),
        width: z.number().optional().describe("Width. Default 200."),
        height: z.number().optional().describe("Height. Default 120."),
        fillColorRgb: z.number().optional().describe("Fill color RGB integer."),
        lineColorRgb: z.number().optional().describe("Border line color RGB integer."),
        text: z.string().optional().describe("Optional text inside shape."),
      },
    },
    async (params) =>
      guard(async () => {
        const res = await schedule("powerpoint_insert_shape", async () =>
          PowerPointManager.insertShape(params.slideIndex, params.shapeType, params),
        );
        return jsonResult(res);
      }),
  );

  // 10. powerpoint_insert_table
  server.registerTool(
    "powerpoint_insert_table",
    {
      title: "PowerPoint: Insert Table",
      description: "Inserts a structured data table onto a slide.",
      inputSchema: {
        slideIndex: z.number().int().min(1).describe("1-based slide index."),
        rows: z.number().int().min(1).describe("Number of rows."),
        cols: z.number().int().min(1).describe("Number of columns."),
        data: z.array(z.array(z.string())).optional().describe("2D array of cell string values."),
        left: z.number().optional().describe("Left position. Default 80."),
        top: z.number().optional().describe("Top position. Default 100."),
        width: z.number().optional().describe("Width. Default 560."),
        height: z.number().optional().describe("Height. Default 250."),
      },
    },
    async (params) =>
      guard(async () => {
        const res = await schedule("powerpoint_insert_table", async () =>
          PowerPointManager.insertTable(params.slideIndex, params.rows, params.cols, params.data, params),
        );
        return jsonResult(res);
      }),
  );

  // 11. powerpoint_set_notes
  server.registerTool(
    "powerpoint_set_notes",
    {
      title: "PowerPoint: Set Speaker Notes",
      description: "Adds or updates speaker notes on a slide.",
      inputSchema: {
        slideIndex: z.number().int().min(1).describe("1-based slide index."),
        notesText: z.string().describe("Speaker notes content."),
      },
    },
    async ({ slideIndex, notesText }) =>
      guard(async () => {
        const res = await schedule("powerpoint_set_notes", async () =>
          PowerPointManager.setNotes(slideIndex, notesText),
        );
        return jsonResult(res);
      }),
  );

  // 12. powerpoint_read_slides
  server.registerTool(
    "powerpoint_read_slides",
    {
      title: "PowerPoint: Read Slides",
      description: "Reads all slides in the active presentation, extracting text from shapes, element counts, and speaker notes.",
      inputSchema: {},
    },
    async () =>
      guard(async () => {
        const res = await schedule("powerpoint_read_slides", async () => PowerPointManager.readSlides());
        return jsonResult(res);
      }),
  );

  // 13. powerpoint_save_presentation
  server.registerTool(
    "powerpoint_save_presentation",
    {
      title: "PowerPoint: Save Presentation (PPTX)",
      description: "Saves the active presentation as a .pptx file in the approved workspace.",
      inputSchema: {
        outputPath: z.string().optional().describe("Target .pptx file path. If omitted, saves to D:\\MCP\\Office-Workspace\\PowerPoint."),
      },
    },
    async ({ outputPath }) =>
      guard(async () => {
        const res = await schedule("powerpoint_save_presentation", async () => PowerPointManager.savePresentation(outputPath));
        return jsonResult(res);
      }),
  );

  // 14. powerpoint_export_pdf
  server.registerTool(
    "powerpoint_export_pdf",
    {
      title: "PowerPoint: Export PDF",
      description: "Exports the active presentation to PDF format.",
      inputSchema: {
        outputPath: z.string().optional().describe("Target .pdf file path. If omitted, exports to D:\\MCP\\Office-Workspace\\Exports."),
      },
    },
    async ({ outputPath }) =>
      guard(async () => {
        const res = await schedule("powerpoint_export_pdf", async () => PowerPointManager.exportPdf(outputPath));
        return jsonResult(res);
      }),
  );

  // 15. powerpoint_export_slide_image
  server.registerTool(
    "powerpoint_export_slide_image",
    {
      title: "PowerPoint: Export Slide as Image (PNG)",
      description: "Renders and exports a specific slide as a high-resolution PNG image on disk.",
      inputSchema: {
        slideIndex: z.number().int().min(1).describe("1-based slide index to export."),
        outputPath: z.string().optional().describe("Target .png file path. If omitted, exports to D:\\MCP\\Office-Workspace\\Exports."),
        width: z.number().optional().describe("Image width in pixels. Default 1920."),
        height: z.number().optional().describe("Image height in pixels. Default 1080."),
      },
    },
    async ({ slideIndex, outputPath, width, height }) =>
      guard(async () => {
        const res = await schedule("powerpoint_export_slide_image", async () =>
          PowerPointManager.exportSlideImage(slideIndex, outputPath, width, height),
        );
        return jsonResult(res);
      }),
  );

  // 16. powerpoint_close_presentation
  server.registerTool(
    "powerpoint_close_presentation",
    {
      title: "PowerPoint: Close Presentation",
      description: "Safely closes the active presentation in PowerPoint.",
      inputSchema: {},
    },
    async () =>
      guard(async () => {
        const res = await schedule("powerpoint_close_presentation", async () => PowerPointManager.closePresentation());
        return jsonResult(res);
      }),
  );

  // 17. powerpoint_quit_app
  server.registerTool(
    "powerpoint_quit_app",
    {
      title: "PowerPoint: Quit Application",
      description: "Safely closes the PowerPoint COM runner and application.",
      inputSchema: {},
    },
    async () =>
      guard(async () => {
        const res = await schedule("powerpoint_quit_app", async () => PowerPointManager.quitApp());
        return jsonResult(res);
      }),
  );
}
