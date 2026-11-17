/**
 * MADEL Studio Bridge — Microsoft Word COM Automation Manager
 * Developed and maintained by Mahmoud Adel
 *
 * Implements high-level automation methods for Microsoft Word via Windows COM.
 */
import { existsSync } from "node:fs";
import { OfficeComPool } from "../common/com-runner.js";
import { OfficeSecurityPolicy } from "../common/security.js";
import { OfficeWorkspaceManager } from "../common/workspace.js";
export class WordManager {
    static getWorker() {
        return OfficeComPool.getWorker("word");
    }
    static async openApp() {
        const worker = this.getWorker();
        const res = await worker.execute(`
      [PSCustomObject]@{
        name = $app.Name
        version = $app.Version
        documentsCount = $app.Documents.Count
      }
    `);
        if (!res.success)
            throw new Error(res.error || "Failed to query Word application");
        return res.data;
    }
    static async createDocument() {
        const worker = this.getWorker();
        const res = await worker.execute(`
      $doc = $app.Documents.Add()
      [PSCustomObject]@{
        documentName = $doc.Name
        index = $app.Documents.Count
      }
    `);
        if (!res.success)
            throw new Error(res.error || "Failed to create Word document");
        return res.data;
    }
    static async openDocument(filePath) {
        const check = OfficeSecurityPolicy.validatePath(filePath, { allowExistingOutsideWorkspace: true });
        if (!check.valid)
            throw new Error(check.error);
        if (!existsSync(check.normalizedPath)) {
            throw new Error(`File does not exist: '${check.normalizedPath}'`);
        }
        const worker = this.getWorker();
        const cleanPath = check.normalizedPath.replace(/'/g, "''");
        const res = await worker.execute(`
      $doc = $app.Documents.Open('${cleanPath}')
      [PSCustomObject]@{
        documentName = $doc.Name
        path = $doc.FullName
      }
    `);
        if (!res.success)
            throw new Error(res.error || `Failed to open document: ${filePath}`);
        return res.data;
    }
    static async readDocument() {
        const worker = this.getWorker();
        const res = await worker.execute(`
      if ($app.Documents.Count -eq 0) {
        throw "No active document open in Word"
      }
      $doc = $app.ActiveDocument
      $paragraphs = @()
      foreach ($p in $doc.Paragraphs) {
        $pText = $p.Range.Text.TrimEnd("\r\n\x07")
        if ($pText.Length -gt 0) {
          $paragraphs += $pText
        }
      }
      $fullText = $doc.Content.Text
      [PSCustomObject]@{
        name = $doc.Name
        path = $doc.FullName
        paragraphsCount = $doc.Paragraphs.Count
        wordsCount = $doc.Words.Count
        charactersCount = $doc.Characters.Count
        sectionsCount = $doc.Sections.Count
        tablesCount = $doc.Tables.Count
        saved = $doc.Saved
        text = $fullText
        paragraphs = $paragraphs
      }
    `);
        if (!res.success)
            throw new Error(res.error || "Failed to read Word document");
        return res.data;
    }
    static async writeText(text, options = {}) {
        const worker = this.getWorker();
        const safeText = text.replace(/'/g, "''");
        const boldVal = options.bold ? 1 : 0;
        const italicVal = options.italic ? 1 : 0;
        const underlineVal = options.underline ? 1 : 0;
        const fontName = options.fontName ? `$rng.Font.Name = '${options.fontName.replace(/'/g, "''")}'` : "";
        const fontSize = options.fontSize ? `$rng.Font.Size = ${options.fontSize}` : "";
        const color = options.colorRgb !== undefined ? `$rng.Font.Color = ${options.colorRgb}` : "";
        const newlineCmd = options.addNewline !== false ? `$rng.Text = '${safeText}' + [Environment]::NewLine` : `$rng.Text = '${safeText}'`;
        let alignCmd = "";
        if (options.align === "center")
            alignCmd = "$rng.ParagraphFormat.Alignment = 1";
        else if (options.align === "right")
            alignCmd = "$rng.ParagraphFormat.Alignment = 2";
        else if (options.align === "justify")
            alignCmd = "$rng.ParagraphFormat.Alignment = 3";
        else if (options.align === "left")
            alignCmd = "$rng.ParagraphFormat.Alignment = 0";
        const rtlCmd = options.isRtl !== undefined ? `$rng.ParagraphFormat.ReadingOrder = ${options.isRtl ? 1 : 0}` : "";
        const res = await worker.execute(`
      if ($app.Documents.Count -eq 0) { $null = $app.Documents.Add() }
      $doc = $app.ActiveDocument
      $content = $doc.Content
      $endPos = $content.End - 1
      $rng = $doc.Range($endPos, $endPos)
      ${newlineCmd}
      $rng.Font.Bold = ${boldVal}
      $rng.Font.Italic = ${italicVal}
      $rng.Font.Underline = ${underlineVal}
      ${fontName}
      ${fontSize}
      ${color}
      ${alignCmd}
      ${rtlCmd}
      [PSCustomObject]@{
        success = $true
        paragraphsCount = $doc.Paragraphs.Count
      }
    `);
        if (!res.success)
            throw new Error(res.error || "Failed to write text in Word");
        return res.data;
    }
    static async editText(findText, replaceWith) {
        const worker = this.getWorker();
        const safeFind = findText.replace(/'/g, "''");
        const safeReplace = replaceWith.replace(/'/g, "''");
        const res = await worker.execute(`
      if ($app.Documents.Count -eq 0) { throw "No active document" }
      $doc = $app.ActiveDocument
      $find = $doc.Content.Find
      $find.ClearFormatting()
      $find.Replacement.ClearFormatting()
      $find.Text = '${safeFind}'
      $find.Replacement.Text = '${safeReplace}'
      $find.Forward = $true
      $find.Wrap = 1 # wdFindContinue
      $find.Format = $false
      $find.MatchCase = $false
      $find.MatchWholeWord = $false
      $res = $find.Execute([ref]$null, [ref]$null, [ref]$null, [ref]$null, [ref]$null, [ref]$null, [ref]$null, [ref]$null, [ref]$null, [ref]$null, 2) # wdReplaceAll = 2
      [PSCustomObject]@{
        replacedCount = if ($res) { 1 } else { 0 }
      }
    `);
        if (!res.success)
            throw new Error(res.error || "Failed to edit/replace text");
        return res.data;
    }
    static async formatText(options) {
        const worker = this.getWorker();
        let alignVal = 0;
        if (options.align === "center")
            alignVal = 1;
        else if (options.align === "right")
            alignVal = 2;
        else if (options.align === "justify")
            alignVal = 3;
        const lineSpacingCmd = options.lineSpacing ? `$doc.Content.ParagraphFormat.LineSpacing = ${options.lineSpacing}` : "";
        const spaceBeforeCmd = options.spaceBefore !== undefined ? `$doc.Content.ParagraphFormat.SpaceBefore = ${options.spaceBefore}` : "";
        const spaceAfterCmd = options.spaceAfter !== undefined ? `$doc.Content.ParagraphFormat.SpaceAfter = ${options.spaceAfter}` : "";
        const res = await worker.execute(`
      if ($app.Documents.Count -eq 0) { throw "No active document" }
      $doc = $app.ActiveDocument
      $doc.Content.ParagraphFormat.Alignment = ${alignVal}
      ${lineSpacingCmd}
      ${spaceBeforeCmd}
      ${spaceAfterCmd}
      [PSCustomObject]@{ success = $true }
    `);
        if (!res.success)
            throw new Error(res.error || "Failed to format text");
        return res.data;
    }
    static async setDirection(direction) {
        const worker = this.getWorker();
        const dirVal = direction === "rtl" ? 1 : 0;
        const res = await worker.execute(`
      if ($app.Documents.Count -eq 0) { throw "No active document" }
      $doc = $app.ActiveDocument
      $doc.Content.ParagraphFormat.ReadingOrder = ${dirVal}
      [PSCustomObject]@{
        success = $true
        direction = '${direction}'
      }
    `);
        if (!res.success)
            throw new Error(res.error || "Failed to set reading direction");
        return res.data;
    }
    static async insertHeading(text, level = 1, isRtl = false) {
        const worker = this.getWorker();
        const safeText = text.replace(/'/g, "''");
        const styleVal = level === 1 ? -2 : level === 2 ? -3 : -4; // wdStyleHeading1=-2, wdStyleHeading2=-3, wdStyleHeading3=-4
        const rtlVal = isRtl ? 1 : 0;
        const res = await worker.execute(`
      if ($app.Documents.Count -eq 0) { $null = $app.Documents.Add() }
      $doc = $app.ActiveDocument
      $content = $doc.Content
      $endPos = $content.End - 1
      $rng = $doc.Range($endPos, $endPos)
      $rng.Text = '${safeText}' + [Environment]::NewLine
      $rng.Style = ${styleVal}
      $rng.ParagraphFormat.ReadingOrder = ${rtlVal}
      [PSCustomObject]@{
        success = $true
        level = ${level}
      }
    `);
        if (!res.success)
            throw new Error(res.error || "Failed to insert heading");
        return res.data;
    }
    static async createTable(rows, cols, data, headers) {
        const worker = this.getWorker();
        const jsonPayload = JSON.stringify({ data: data || [], headers: headers || [] });
        const b64Payload = Buffer.from(jsonPayload, "utf8").toString("base64");
        const res = await worker.execute(`
      if ($app.Documents.Count -eq 0) { $null = $app.Documents.Add() }
      $doc = $app.ActiveDocument
      $content = $doc.Content
      $endPos = $content.End - 1
      $rng = $doc.Range($endPos, $endPos)

      $payload = [System.Text.Encoding]::UTF8.GetString([System.Convert]::FromBase64String('${b64Payload}')) | ConvertFrom-Json
      $tbl = $doc.Tables.Add($rng, ${rows}, ${cols})
      $tbl.Borders.Enable = $true

      # Populate headers if provided
      if ($payload.headers -and $payload.headers.Count -gt 0) {
        for ($c = 1; $c -le [Math]::Min(${cols}, $payload.headers.Count); $c++) {
          $tbl.Cell(1, $c).Range.Text = [string]$payload.headers[$c - 1]
          $tbl.Cell(1, $c).Range.Font.Bold = 1
        }
      }

      # Populate data rows
      if ($payload.data -and $payload.data.Count -gt 0) {
        $startRow = if ($payload.headers.Count -gt 0) { 2 } else { 1 }
        for ($r = 0; $r -lt $payload.data.Count; $r++) {
          $targetRow = $startRow + $r
          if ($targetRow -gt ${rows}) { break }
          $rowArr = $payload.data[$r]
          for ($c = 0; $c -lt $rowArr.Count; $c++) {
            if (($c + 1) -gt ${cols}) { break }
            $tbl.Cell($targetRow, $c + 1).Range.Text = [string]$rowArr[$c]
          }
        }
      }

      [PSCustomObject]@{
        success = $true
        rows = ${rows}
        cols = ${cols}
      }
    `);
        if (!res.success)
            throw new Error(res.error || "Failed to create table");
        return res.data;
    }
    static async insertImage(imagePath, options = {}) {
        const check = OfficeSecurityPolicy.validatePath(imagePath, { allowExistingOutsideWorkspace: true });
        if (!check.valid)
            throw new Error(check.error);
        if (!existsSync(check.normalizedPath)) {
            throw new Error(`Image file not found: '${check.normalizedPath}'`);
        }
        const worker = this.getWorker();
        const cleanPath = check.normalizedPath.replace(/'/g, "''");
        const widthCmd = options.width ? `$shape.Width = ${options.width}` : "";
        const heightCmd = options.height ? `$shape.Height = ${options.height}` : "";
        const res = await worker.execute(`
      if ($app.Documents.Count -eq 0) { $null = $app.Documents.Add() }
      $doc = $app.ActiveDocument
      $content = $doc.Content
      $endPos = $content.End - 1
      $rng = $doc.Range($endPos, $endPos)
      $shape = $doc.InlineShapes.AddPicture('${cleanPath}', $false, $true, $rng)
      ${widthCmd}
      ${heightCmd}
      [PSCustomObject]@{
        success = $true
        path = '${cleanPath}'
      }
    `);
        if (!res.success)
            throw new Error(res.error || "Failed to insert image");
        return res.data;
    }
    static async setHeaderFooter(options) {
        const worker = this.getWorker();
        const headerCmd = options.headerText
            ? `$section.Headers.Item(1).Range.Text = '${options.headerText.replace(/'/g, "''")}'`
            : "";
        const footerCmd = options.footerText
            ? `$section.Footers.Item(1).Range.Text = '${options.footerText.replace(/'/g, "''")}'`
            : "";
        const res = await worker.execute(`
      if ($app.Documents.Count -eq 0) { throw "No active document" }
      $doc = $app.ActiveDocument
      $section = $doc.Sections.Item(1)
      ${headerCmd}
      ${footerCmd}
      [PSCustomObject]@{ success = $true }
    `);
        if (!res.success)
            throw new Error(res.error || "Failed to set header/footer");
        return res.data;
    }
    static async searchReplace(findText, replaceWith, matchCase = false, matchWholeWord = false) {
        const worker = this.getWorker();
        const safeFind = findText.replace(/'/g, "''");
        const safeReplace = replaceWith.replace(/'/g, "''");
        const caseVal = matchCase ? "$true" : "$false";
        const wordVal = matchWholeWord ? "$true" : "$false";
        const res = await worker.execute(`
      if ($app.Documents.Count -eq 0) { throw "No active document" }
      $doc = $app.ActiveDocument
      $find = $doc.Content.Find
      $find.ClearFormatting()
      $find.Replacement.ClearFormatting()
      $find.Text = '${safeFind}'
      $find.Replacement.Text = '${safeReplace}'
      $missing = [System.Reflection.Missing]::Value
      $res = $find.Execute($find.Text, $missing, $missing, $missing, $missing, $missing, $missing, 1, $missing, $find.Replacement.Text, 2)
      [PSCustomObject]@{ success = [bool]$res }
    `);
        if (!res.success)
            throw new Error(res.error || "Failed to search & replace in Word");
        return res.data;
    }
    static async setPageSetup(options) {
        const worker = this.getWorker();
        const top = options.topMarginPoints ? `$doc.PageSetup.TopMargin = ${options.topMarginPoints}` : "";
        const bottom = options.bottomMarginPoints ? `$doc.PageSetup.BottomMargin = ${options.bottomMarginPoints}` : "";
        const left = options.leftMarginPoints ? `$doc.PageSetup.LeftMargin = ${options.leftMarginPoints}` : "";
        const right = options.rightMarginPoints ? `$doc.PageSetup.RightMargin = ${options.rightMarginPoints}` : "";
        const orient = options.orientation === "landscape" ? "$doc.PageSetup.Orientation = 1" : options.orientation === "portrait" ? "$doc.PageSetup.Orientation = 0" : "";
        const size = options.paperSize === "A4" ? "$doc.PageSetup.PaperSize = 7" : options.paperSize === "Letter" ? "$doc.PageSetup.PaperSize = 0" : "";
        const res = await worker.execute(`
      if ($app.Documents.Count -eq 0) { throw "No active document" }
      $doc = $app.ActiveDocument
      ${top}
      ${bottom}
      ${left}
      ${right}
      ${orient}
      ${size}
      [PSCustomObject]@{ success = $true }
    `);
        if (!res.success)
            throw new Error(res.error || "Failed to set page setup");
        return res.data;
    }
    static async saveDocument(outputPath) {
        let targetPath = outputPath;
        if (!targetPath) {
            targetPath = OfficeWorkspaceManager.resolveWorkspacePath("word", `document_${Date.now()}.docx`);
        }
        else {
            const check = OfficeSecurityPolicy.validatePath(targetPath);
            if (!check.valid)
                throw new Error(check.error);
            targetPath = check.normalizedPath;
        }
        const worker = this.getWorker();
        const cleanPath = targetPath.replace(/'/g, "''");
        const res = await worker.execute(`
      if ($app.Documents.Count -eq 0) { throw "No active document to save" }
      $doc = $app.ActiveDocument
      $doc.SaveAs2('${cleanPath}', 12) # 12 = wdFormatXMLDocument (.docx)
      $fileInfo = Get-Item -LiteralPath '${cleanPath}'
      [PSCustomObject]@{
        savedPath = $fileInfo.FullName
        sizeBytes = $fileInfo.Length
      }
    `);
        if (!res.success)
            throw new Error(res.error || `Failed to save Word document to: ${targetPath}`);
        return res.data;
    }
    static async exportPdf(outputPath) {
        let targetPath = outputPath;
        if (!targetPath) {
            targetPath = OfficeWorkspaceManager.resolveWorkspacePath("exports", `document_${Date.now()}.pdf`);
        }
        else {
            const check = OfficeSecurityPolicy.validatePath(targetPath);
            if (!check.valid)
                throw new Error(check.error);
            targetPath = check.normalizedPath;
        }
        const worker = this.getWorker();
        const cleanPath = targetPath.replace(/'/g, "''");
        const res = await worker.execute(`
      if ($app.Documents.Count -eq 0) { throw "No active document to export" }
      $doc = $app.ActiveDocument
      $doc.ExportAsFixedFormat('${cleanPath}', 17) # 17 = wdExportFormatPDF
      $fileInfo = Get-Item -LiteralPath '${cleanPath}'
      [PSCustomObject]@{
        pdfPath = $fileInfo.FullName
        sizeBytes = $fileInfo.Length
      }
    `);
        if (!res.success)
            throw new Error(res.error || `Failed to export Word document to PDF: ${targetPath}`);
        return res.data;
    }
    static async closeDocument(saveChanges = false) {
        const worker = this.getWorker();
        const saveVal = saveChanges ? -1 : 0; // -1 = wdSaveChanges, 0 = wdDoNotSaveChanges
        const res = await worker.execute(`
      if ($app.Documents.Count -eq 0) {
        [PSCustomObject]@{ success = $true; closed = $false }
      } else {
        $doc = $app.ActiveDocument
        $doc.Close(${saveVal})
        [PSCustomObject]@{ success = $true; closed = $true }
      }
    `);
        if (!res.success)
            throw new Error(res.error || "Failed to close document");
        return res.data;
    }
    static async quitApp() {
        const worker = this.getWorker();
        await worker.stop();
        return { success: true };
    }
}
//# sourceMappingURL=word-manager.js.map