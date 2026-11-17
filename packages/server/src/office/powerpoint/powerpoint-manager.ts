/**
 * MADEL Studio Bridge — Microsoft PowerPoint COM Automation Manager
 * Developed and maintained by Mahmoud Adel
 *
 * Implements high-level automation methods for Microsoft PowerPoint via Windows COM.
 */

import { existsSync } from "node:fs";
import { OfficeComPool } from "../common/com-runner.js";
import { OfficeSecurityPolicy } from "../common/security.js";
import { OfficeWorkspaceManager } from "../common/workspace.js";
import type { PowerPointPresentationMetadata } from "../common/types.js";

export class PowerPointManager {
  private static getWorker() {
    return OfficeComPool.getWorker("powerpoint");
  }

  public static async openApp(): Promise<{ name: string; version: string; presentationsCount: number }> {
    const worker = this.getWorker();
    const res = await worker.execute<{ name: string; version: string; presentationsCount: number }>(`
      [PSCustomObject]@{
        name = $app.Name
        version = $app.Version
        presentationsCount = $app.Presentations.Count
      }
    `);
    if (!res.success) throw new Error(res.error || "Failed to query PowerPoint application");
    return res.data!;
  }

  public static async createPresentation(): Promise<{ presentationName: string; index: number }> {
    const worker = this.getWorker();
    const res = await worker.execute<{ presentationName: string; index: number }>(`
      $pres = $app.Presentations.Add(-1) # -1 = msoTrue (WithWindow)
      [PSCustomObject]@{
        presentationName = $pres.Name
        index = $app.Presentations.Count
      }
    `);
    if (!res.success) throw new Error(res.error || "Failed to create presentation");
    return res.data!;
  }

  public static async openPresentation(filePath: string): Promise<PowerPointPresentationMetadata> {
    const check = OfficeSecurityPolicy.validatePath(filePath, { allowExistingOutsideWorkspace: true });
    if (!check.valid) throw new Error(check.error);
    if (!existsSync(check.normalizedPath)) {
      throw new Error(`File does not exist: '${check.normalizedPath}'`);
    }

    const worker = this.getWorker();
    const cleanPath = check.normalizedPath.replace(/'/g, "''");
    const res = await worker.execute<PowerPointPresentationMetadata>(`
      $pres = $app.Presentations.Open('${cleanPath}', -1, 0, -1)
      [PSCustomObject]@{
        name = $pres.Name
        path = $pres.FullName
        slidesCount = $pres.Slides.Count
        saved = $pres.Saved
      }
    `);
    if (!res.success) throw new Error(res.error || `Failed to open presentation: ${filePath}`);
    return res.data!;
  }

  public static async addSlide(
    layoutIndex = 12, // 12 = ppLayoutBlank, 1 = ppLayoutTitle, 2 = ppLayoutText
    insertAt?: number,
  ): Promise<{ slideIndex: number; totalSlides: number }> {
    const worker = this.getWorker();
    const atCmd = insertAt ? `${insertAt}` : "$pres.Slides.Count + 1";

    const res = await worker.execute<{ slideIndex: number; totalSlides: number }>(`
      if ($app.Presentations.Count -eq 0) { $null = $app.Presentations.Add(-1) }
      $pres = $app.ActivePresentation
      $idx = ${atCmd}
      $slide = $pres.Slides.Add($idx, ${layoutIndex})
      [PSCustomObject]@{
        slideIndex = $slide.SlideIndex
        totalSlides = $pres.Slides.Count
      }
    `);
    if (!res.success) throw new Error(res.error || "Failed to add slide");
    return res.data!;
  }

  public static async deleteSlide(slideIndex: number): Promise<{ success: boolean; remainingSlides: number }> {
    const worker = this.getWorker();
    const res = await worker.execute<{ success: boolean; remainingSlides: number }>(`
      if ($app.Presentations.Count -eq 0) { throw "No active presentation" }
      $pres = $app.ActivePresentation
      if (${slideIndex} -lt 1 -or ${slideIndex} -gt $pres.Slides.Count) {
        throw "Slide index ${slideIndex} out of range"
      }
      $pres.Slides.Item(${slideIndex}).Delete()
      [PSCustomObject]@{
        success = $true
        remainingSlides = $pres.Slides.Count
      }
    `);
    if (!res.success) throw new Error(res.error || "Failed to delete slide");
    return res.data!;
  }

  public static async moveSlide(slideIndex: number, toIndex: number): Promise<{ success: boolean }> {
    const worker = this.getWorker();
    const res = await worker.execute<{ success: boolean }>(`
      if ($app.Presentations.Count -eq 0) { throw "No active presentation" }
      $pres = $app.ActivePresentation
      $pres.Slides.Item(${slideIndex}).MoveTo(${toIndex})
      [PSCustomObject]@{ success = $true }
    `);
    if (!res.success) throw new Error(res.error || "Failed to move slide");
    return res.data!;
  }

  public static async insertText(
    slideIndex: number,
    text: string,
    options: {
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
    } = {},
  ): Promise<{ success: boolean; shapeName: string }> {
    const worker = this.getWorker();
    const safeText = text.replace(/'/g, "''");
    const left = options.left || 50;
    const top = options.top || 50;
    const width = options.width || 600;
    const height = options.height || 100;

    const fontNameCmd = options.fontName ? `$tr.Font.Name = '${options.fontName.replace(/'/g, "''")}'` : "";
    const fontSizeCmd = options.fontSize ? `$tr.Font.Size = ${options.fontSize}` : "";
    const boldCmd = options.bold !== undefined ? `$tr.Font.Bold = ${options.bold ? -1 : 0}` : "";
    const colorCmd = options.colorRgb !== undefined ? `$tr.Font.Color.RGB = ${options.colorRgb}` : "";

    let alignCmd = "";
    if (options.align === "center") alignCmd = "$tr.ParagraphFormat.Alignment = 2"; // ppAlignCenter
    else if (options.align === "right") alignCmd = "$tr.ParagraphFormat.Alignment = 3"; // ppAlignRight
    else if (options.align === "justify") alignCmd = "$tr.ParagraphFormat.Alignment = 4"; // ppAlignJustify
    else if (options.align === "left") alignCmd = "$tr.ParagraphFormat.Alignment = 1"; // ppAlignLeft

    const rtlCmd = options.isRtl !== undefined ? `$shape.TextFrame.TextRange.ParagraphFormat.TextDirection = ${options.isRtl ? 1 : 0}` : "";

    const res = await worker.execute<{ success: boolean; shapeName: string }>(`
      if ($app.Presentations.Count -eq 0) { throw "No active presentation" }
      $pres = $app.ActivePresentation
      $slide = $pres.Slides.Item(${slideIndex})
      $shape = $slide.Shapes.AddTextbox(1, ${left}, ${top}, ${width}, ${height}) # 1 = msoTextOrientationHorizontal
      $tr = $shape.TextFrame.TextRange
      $tr.Text = '${safeText}'
      ${fontNameCmd}
      ${fontSizeCmd}
      ${boldCmd}
      ${colorCmd}
      ${alignCmd}
      ${rtlCmd}
      [PSCustomObject]@{
        success = $true
        shapeName = $shape.Name
      }
    `);
    if (!res.success) throw new Error(res.error || "Failed to insert text in PowerPoint");
    return res.data!;
  }

  public static async insertImage(
    slideIndex: number,
    imagePath: string,
    options: { left?: number; top?: number; width?: number; height?: number } = {},
  ): Promise<{ success: boolean; shapeName: string }> {
    const check = OfficeSecurityPolicy.validatePath(imagePath, { allowExistingOutsideWorkspace: true });
    if (!check.valid) throw new Error(check.error);
    if (!existsSync(check.normalizedPath)) {
      throw new Error(`Image not found: '${check.normalizedPath}'`);
    }

    const worker = this.getWorker();
    const cleanPath = check.normalizedPath.replace(/'/g, "''");
    const left = options.left || 100;
    const top = options.top || 100;
    const width = options.width || 400;
    const height = options.height || 300;

    const res = await worker.execute<{ success: boolean; shapeName: string }>(`
      if ($app.Presentations.Count -eq 0) { throw "No active presentation" }
      $pres = $app.ActivePresentation
      $slide = $pres.Slides.Item(${slideIndex})
      $shape = $slide.Shapes.AddPicture('${cleanPath}', 0, -1, ${left}, ${top}, ${width}, ${height}) # 0 = msoFalse (link), -1 = msoTrue (save)
      [PSCustomObject]@{
        success = $true
        shapeName = $shape.Name
      }
    `);
    if (!res.success) throw new Error(res.error || "Failed to insert image in PowerPoint");
    return res.data!;
  }

  public static async insertShape(
    slideIndex: number,
    shapeType: "rectangle" | "rounded_rectangle" | "oval" | "triangle" | "arrow" | "star",
    options: {
      left?: number;
      top?: number;
      width?: number;
      height?: number;
      fillColorRgb?: number;
      lineColorRgb?: number;
      text?: string;
    } = {},
  ): Promise<{ success: boolean; shapeName: string }> {
    const worker = this.getWorker();
    let typeVal = 1; // 1 = msoShapeRectangle
    if (shapeType === "rounded_rectangle") typeVal = 5;
    else if (shapeType === "oval") typeVal = 9;
    else if (shapeType === "triangle") typeVal = 7;
    else if (shapeType === "arrow") typeVal = 13;
    else if (shapeType === "star") typeVal = 92;

    const left = options.left || 100;
    const top = options.top || 100;
    const width = options.width || 200;
    const height = options.height || 120;

    const fillCmd = options.fillColorRgb !== undefined ? `$shape.Fill.ForeColor.RGB = ${options.fillColorRgb}` : "";
    const lineCmd = options.lineColorRgb !== undefined ? `$shape.Line.ForeColor.RGB = ${options.lineColorRgb}` : "";
    const textCmd = options.text ? `$shape.TextFrame.TextRange.Text = '${options.text.replace(/'/g, "''")}'` : "";

    const res = await worker.execute<{ success: boolean; shapeName: string }>(`
      if ($app.Presentations.Count -eq 0) { throw "No active presentation" }
      $pres = $app.ActivePresentation
      $slide = $pres.Slides.Item(${slideIndex})
      $shape = $slide.Shapes.AddShape(${typeVal}, ${left}, ${top}, ${width}, ${height})
      ${fillCmd}
      ${lineCmd}
      ${textCmd}
      [PSCustomObject]@{
        success = $true
        shapeName = $shape.Name
      }
    `);
    if (!res.success) throw new Error(res.error || "Failed to insert shape in PowerPoint");
    return res.data!;
  }

  public static async insertTable(
    slideIndex: number,
    rows: number,
    cols: number,
    data?: string[][],
    options: { left?: number; top?: number; width?: number; height?: number } = {},
  ): Promise<{ success: boolean; shapeName: string }> {
    const worker = this.getWorker();
    const left = options.left || 80;
    const top = options.top || 100;
    const width = options.width || 560;
    const height = options.height || 250;

    const jsonPayload = JSON.stringify(data || []);
    const b64 = Buffer.from(jsonPayload, "utf8").toString("base64");

    const res = await worker.execute<{ success: boolean; shapeName: string }>(`
      if ($app.Presentations.Count -eq 0) { throw "No active presentation" }
      $pres = $app.ActivePresentation
      $slide = $pres.Slides.Item(${slideIndex})
      $shape = $slide.Shapes.AddTable(${rows}, ${cols}, ${left}, ${top}, ${width}, ${height})
      $tbl = $shape.Table
      $data = [System.Text.Encoding]::UTF8.GetString([System.Convert]::FromBase64String('${b64}')) | ConvertFrom-Json

      if ($data -and $data.Count -gt 0) {
        for ($r = 0; $r -lt [Math]::Min(${rows}, $data.Count); $r++) {
          $rowArr = $data[$r]
          for ($c = 0; $c -lt [Math]::Min(${cols}, $rowArr.Count); $c++) {
            $tbl.Cell($r + 1, $c + 1).Shape.TextFrame.TextRange.Text = [string]$rowArr[$c]
          }
        }
      }

      [PSCustomObject]@{
        success = $true
        shapeName = $shape.Name
      }
    `);
    if (!res.success) throw new Error(res.error || "Failed to insert table in PowerPoint");
    return res.data!;
  }

  public static async setNotes(slideIndex: number, notesText: string): Promise<{ success: boolean }> {
    const worker = this.getWorker();
    const safeNotes = notesText.replace(/'/g, "''");

    const res = await worker.execute<{ success: boolean }>(`
      if ($app.Presentations.Count -eq 0) { throw "No active presentation" }
      $pres = $app.ActivePresentation
      $slide = $pres.Slides.Item(${slideIndex})
      $slide.NotesPage.Shapes.Placeholders.Item(2).TextFrame.TextRange.Text = '${safeNotes}'
      [PSCustomObject]@{ success = $true }
    `);
    if (!res.success) throw new Error(res.error || "Failed to set speaker notes");
    return res.data!;
  }

  public static async readSlides(): Promise<{
    slidesCount: number;
    slides: Array<{ index: number; textElements: string[]; notes: string }>;
  }> {
    const worker = this.getWorker();
    const res = await worker.execute<{
      slidesCount: number;
      slides: Array<{ index: number; textElements: string[]; notes: string }>;
    }>(`
      if ($app.Presentations.Count -eq 0) { throw "No active presentation" }
      $pres = $app.ActivePresentation
      $slideList = @()

      foreach ($s in $pres.Slides) {
        $texts = @()
        foreach ($sh in $s.Shapes) {
          if ($sh.HasTextFrame -and $sh.TextFrame.HasText) {
            $texts += $sh.TextFrame.TextRange.Text.Trim()
          }
        }
        $notes = ""
        try {
          $notes = $s.NotesPage.Shapes.Placeholders.Item(2).TextFrame.TextRange.Text.Trim()
        } catch {}

        $slideList += [PSCustomObject]@{
          index = $s.SlideIndex
          textElements = $texts
          notes = $notes
        }
      }

      [PSCustomObject]@{
        slidesCount = $pres.Slides.Count
        slides = $slideList
      }
    `);
    if (!res.success) throw new Error(res.error || "Failed to read slides");
    return res.data!;
  }

  public static async savePresentation(outputPath?: string): Promise<{ savedPath: string; sizeBytes: number }> {
    let targetPath = outputPath;
    if (!targetPath) {
      targetPath = OfficeWorkspaceManager.resolveWorkspacePath("powerpoint", `presentation_${Date.now()}.pptx`);
    } else {
      const check = OfficeSecurityPolicy.validatePath(targetPath);
      if (!check.valid) throw new Error(check.error);
      targetPath = check.normalizedPath;
    }

    const worker = this.getWorker();
    const cleanPath = targetPath.replace(/'/g, "''");

    const res = await worker.execute<{ savedPath: string; sizeBytes: number }>(`
      if ($app.Presentations.Count -eq 0) { throw "No active presentation to save" }
      $pres = $app.ActivePresentation
      $pres.SaveAs('${cleanPath}', 24) # 24 = ppSaveAsOpenXMLPresentation (.pptx)
      $fileInfo = Get-Item -LiteralPath '${cleanPath}'
      [PSCustomObject]@{
        savedPath = $fileInfo.FullName
        sizeBytes = $fileInfo.Length
      }
    `);
    if (!res.success) throw new Error(res.error || `Failed to save PowerPoint presentation to: ${targetPath}`);
    return res.data!;
  }

  public static async exportPdf(outputPath?: string): Promise<{ pdfPath: string; sizeBytes: number }> {
    let targetPath = outputPath;
    if (!targetPath) {
      targetPath = OfficeWorkspaceManager.resolveWorkspacePath("exports", `presentation_${Date.now()}.pdf`);
    } else {
      const check = OfficeSecurityPolicy.validatePath(targetPath);
      if (!check.valid) throw new Error(check.error);
      targetPath = check.normalizedPath;
    }

    const worker = this.getWorker();
    const cleanPath = targetPath.replace(/'/g, "''");

    const res = await worker.execute<{ pdfPath: string; sizeBytes: number }>(`
      if ($app.Presentations.Count -eq 0) { throw "No active presentation to export" }
      $pres = $app.ActivePresentation
      $pres.SaveCopyAs('${cleanPath}', 32) # 32 = ppSaveAsPDF
      $fileInfo = Get-Item -LiteralPath '${cleanPath}'
      [PSCustomObject]@{
        pdfPath = $fileInfo.FullName
        sizeBytes = $fileInfo.Length
      }
    `);
    if (!res.success) throw new Error(res.error || `Failed to export PowerPoint to PDF: ${targetPath}`);
    return res.data!;
  }

  public static async exportSlideImage(
    slideIndex: number,
    outputPath?: string,
    width = 1920,
    height = 1080,
  ): Promise<{ imagePath: string; sizeBytes: number }> {
    let targetPath = outputPath;
    if (!targetPath) {
      targetPath = OfficeWorkspaceManager.resolveWorkspacePath("exports", `slide_${slideIndex}_${Date.now()}.png`);
    } else {
      const check = OfficeSecurityPolicy.validatePath(targetPath);
      if (!check.valid) throw new Error(check.error);
      targetPath = check.normalizedPath;
    }

    const worker = this.getWorker();
    const cleanPath = targetPath.replace(/'/g, "''");

    const res = await worker.execute<{ imagePath: string; sizeBytes: number }>(`
      if ($app.Presentations.Count -eq 0) { throw "No active presentation" }
      $pres = $app.ActivePresentation
      $slide = $pres.Slides.Item(${slideIndex})
      $slide.Export('${cleanPath}', 'PNG', ${width}, ${height})
      $fileInfo = Get-Item -LiteralPath '${cleanPath}'
      [PSCustomObject]@{
        imagePath = $fileInfo.FullName
        sizeBytes = $fileInfo.Length
      }
    `);
    if (!res.success) throw new Error(res.error || `Failed to export slide image to: ${targetPath}`);
    return res.data!;
  }

  public static async closePresentation(): Promise<{ success: boolean; closed: boolean }> {
    const worker = this.getWorker();
    const res = await worker.execute<{ success: boolean; closed: boolean }>(`
      if ($app.Presentations.Count -eq 0) {
        [PSCustomObject]@{ success = $true; closed = $false }
      } else {
        $pres = $app.ActivePresentation
        $pres.Close()
        [PSCustomObject]@{ success = $true; closed = $true }
      }
    `);
    if (!res.success) throw new Error(res.error || "Failed to close presentation");
    return res.data!;
  }

  public static async quitApp(): Promise<{ success: boolean }> {
    const worker = this.getWorker();
    await worker.stop();
    return { success: true };
  }
}
