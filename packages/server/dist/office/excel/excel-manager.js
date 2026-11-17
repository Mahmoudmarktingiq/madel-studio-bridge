/**
 * MADEL Studio Bridge — Microsoft Excel COM Automation Manager
 * Developed and maintained by Mahmoud Adel
 *
 * Implements high-level automation methods for Microsoft Excel via Windows COM.
 */
import { existsSync } from "node:fs";
import { OfficeComPool } from "../common/com-runner.js";
import { OfficeSecurityPolicy } from "../common/security.js";
import { OfficeWorkspaceManager } from "../common/workspace.js";
export class ExcelManager {
    static getWorker() {
        return OfficeComPool.getWorker("excel");
    }
    static async openApp() {
        const worker = this.getWorker();
        const res = await worker.execute(`
      [PSCustomObject]@{
        name = $app.Name
        version = $app.Version
        workbooksCount = $app.Workbooks.Count
      }
    `);
        if (!res.success)
            throw new Error(res.error || "Failed to query Excel application");
        return res.data;
    }
    static async createWorkbook(sheetNames) {
        const worker = this.getWorker();
        const namesJson = JSON.stringify(sheetNames || []);
        const b64 = Buffer.from(namesJson, "utf8").toString("base64");
        const res = await worker.execute(`
      $wb = $app.Workbooks.Add()
      $names = [System.Text.Encoding]::UTF8.GetString([System.Convert]::FromBase64String('${b64}')) | ConvertFrom-Json
      if ($names -and $names.Count -gt 0) {
        # Ensure we have enough sheets
        while ($wb.Worksheets.Count -lt $names.Count) {
          $null = $wb.Worksheets.Add([System.Reflection.Missing]::Value, $wb.Worksheets.Item($wb.Worksheets.Count))
        }
        for ($i = 0; $i -lt $names.Count; $i++) {
          $wb.Worksheets.Item($i + 1).Name = [string]$names[$i]
        }
      }
      $sheets = @()
      foreach ($s in $wb.Worksheets) { $sheets += $s.Name }
      [PSCustomObject]@{
        workbookName = $wb.Name
        sheets = $sheets
      }
    `);
        if (!res.success)
            throw new Error(res.error || "Failed to create Excel workbook");
        return res.data;
    }
    static async openWorkbook(filePath) {
        const check = OfficeSecurityPolicy.validatePath(filePath, { allowExistingOutsideWorkspace: true });
        if (!check.valid)
            throw new Error(check.error);
        if (!existsSync(check.normalizedPath)) {
            throw new Error(`File does not exist: '${check.normalizedPath}'`);
        }
        const worker = this.getWorker();
        const cleanPath = check.normalizedPath.replace(/'/g, "''");
        const res = await worker.execute(`
      $wb = $app.Workbooks.Open('${cleanPath}')
      $sheets = @()
      foreach ($s in $wb.Worksheets) { $sheets += $s.Name }
      [PSCustomObject]@{
        name = $wb.Name
        path = $wb.FullName
        sheets = $sheets
        activeSheet = $wb.ActiveSheet.Name
        saved = $wb.Saved
      }
    `);
        if (!res.success)
            throw new Error(res.error || `Failed to open workbook: ${filePath}`);
        return res.data;
    }
    static async manageSheets(action, options = {}) {
        const worker = this.getWorker();
        const sheetName = (options.sheetName || "").replace(/'/g, "''");
        const newName = (options.newName || "").replace(/'/g, "''");
        const res = await worker.execute(`
      if ($app.Workbooks.Count -eq 0) { throw "No active workbook in Excel" }
      $wb = $app.ActiveWorkbook
      $action = '${action}'
      $targetName = '${sheetName}'
      $newName = '${newName}'

      if ($action -eq 'add') {
        $ws = $wb.Worksheets.Add([System.Reflection.Missing]::Value, $wb.Worksheets.Item($wb.Worksheets.Count))
        if ($newName.Length -gt 0) { $ws.Name = $newName }
      } elseif ($action -eq 'rename') {
        $ws = if ($targetName.Length -gt 0) { $wb.Worksheets.Item($targetName) } else { $wb.ActiveSheet }
        $ws.Name = $newName
      } elseif ($action -eq 'select') {
        $ws = $wb.Worksheets.Item($targetName)
        $ws.Activate()
      } elseif ($action -eq 'delete') {
        $app.DisplayAlerts = $false
        $ws = if ($targetName.Length -gt 0) { $wb.Worksheets.Item($targetName) } else { $wb.ActiveSheet }
        $ws.Delete()
        $app.DisplayAlerts = $true
      }

      $sheets = @()
      foreach ($s in $wb.Worksheets) { $sheets += $s.Name }
      [PSCustomObject]@{
        success = $true
        sheets = $sheets
        activeSheet = $wb.ActiveSheet.Name
      }
    `);
        if (!res.success)
            throw new Error(res.error || `Failed to ${action} sheet`);
        return res.data;
    }
    static async readRange(rangeAddress, sheetName) {
        const worker = this.getWorker();
        const sheetCmd = sheetName ? `$wb.Worksheets.Item('${sheetName.replace(/'/g, "''")}')` : "$wb.ActiveSheet";
        const rangeCmd = rangeAddress ? `$ws.Range('${rangeAddress.replace(/'/g, "''")}')` : "$ws.UsedRange";
        const res = await worker.execute(`
      if ($app.Workbooks.Count -eq 0) { throw "No active workbook in Excel" }
      $wb = $app.ActiveWorkbook
      $ws = ${sheetCmd}
      $rng = ${rangeCmd}
      $rowCount = $rng.Rows.Count
      $colCount = $rng.Columns.Count

      $vals = @()
      $forms = @()

      for ($r = 1; $r -le $rowCount; $r++) {
        $rowVals = @()
        $rowForms = @()
        for ($c = 1; $c -le $colCount; $c++) {
          $cell = $rng.Cells.Item($r, $c)
          $v = $cell.Value2
          $f = [string]$cell.Formula
          $rowVals += $v
          $rowForms += $f
        }
        $vals += ,$rowVals
        $forms += ,$rowForms
      }

      [PSCustomObject]@{
        address = [string]$rng.Address()
        rows = $rowCount
        cols = $colCount
        values = $vals
        formulas = $forms
      }
    `);
        if (!res.success)
            throw new Error(res.error || "Failed to read range from Excel");
        return res.data;
    }
    static async writeCells(startCell, data, sheetName) {
        const worker = this.getWorker();
        const jsonStr = JSON.stringify(data);
        const b64 = Buffer.from(jsonStr, "utf8").toString("base64");
        const sheetCmd = sheetName ? `$wb.Worksheets.Item('${sheetName.replace(/'/g, "''")}')` : "$wb.ActiveSheet";
        const res = await worker.execute(`
      if ($app.Workbooks.Count -eq 0) { $null = $app.Workbooks.Add() }
      $wb = $app.ActiveWorkbook
      $ws = ${sheetCmd}
      $data = [System.Text.Encoding]::UTF8.GetString([System.Convert]::FromBase64String('${b64}')) | ConvertFrom-Json
      $startRng = $ws.Range('${startCell.replace(/'/g, "''")}')
      $startRow = $startRng.Row
      $startCol = $startRng.Column

      $rowCount = $data.Count
      $colCount = 0

      for ($r = 0; $r -lt $rowCount; $r++) {
        $rowArr = $data[$r]
        if ($rowArr.Count -gt $colCount) { $colCount = $rowArr.Count }
        for ($c = 0; $c -lt $rowArr.Count; $c++) {
          $val = $rowArr[$c]
          $cell = $ws.Cells.Item($startRow + $r, $startCol + $c)
          if ($val -is [string] -and $val.StartsWith('=')) {
            $cell.Formula = $val
          } else {
            $cell.GetType().InvokeMember("Value2", [System.Reflection.BindingFlags]::SetProperty, $null, $cell, @($val)) | Out-Null
          }
        }
      }

      $endCell = $ws.Cells.Item($startRow + $rowCount - 1, $startCol + $colCount - 1)
      $rangeAddress = [string]$ws.Range($startRng, $endCell).Address()

      [PSCustomObject]@{
        success = $true
        writtenRows = $rowCount
        writtenCols = $colCount
        targetRange = $rangeAddress
      }
    `);
        if (!res.success)
            throw new Error(res.error || "Failed to write cells in Excel");
        return res.data;
    }
    static async setFormula(cellAddress, formula, sheetName) {
        const worker = this.getWorker();
        const sheetCmd = sheetName ? `$wb.Worksheets.Item('${sheetName.replace(/'/g, "''")}')` : "$wb.ActiveSheet";
        const safeFormula = formula.startsWith("=") ? formula : `=${formula}`;
        const res = await worker.execute(`
      if ($app.Workbooks.Count -eq 0) { throw "No active workbook in Excel" }
      $wb = $app.ActiveWorkbook
      $ws = ${sheetCmd}
      $cell = $ws.Range('${cellAddress.replace(/'/g, "''")}')
      $cell.Formula = '${safeFormula.replace(/'/g, "''")}'
      $app.Calculate()
      [PSCustomObject]@{
        success = $true
        cell = [string]$cell.Address()
        formula = $cell.Formula
        calculatedValue = $cell.Value2
      }
    `);
        if (!res.success)
            throw new Error(res.error || "Failed to set formula in Excel");
        return res.data;
    }
    static async getCalculationResult(cellAddress, sheetName) {
        const worker = this.getWorker();
        const sheetCmd = sheetName ? `$wb.Worksheets.Item('${sheetName.replace(/'/g, "''")}')` : "$wb.ActiveSheet";
        const res = await worker.execute(`
      if ($app.Workbooks.Count -eq 0) { throw "No active workbook in Excel" }
      $wb = $app.ActiveWorkbook
      $ws = ${sheetCmd}
      $app.Calculate()
      $cell = $ws.Range('${cellAddress.replace(/'/g, "''")}')
      [PSCustomObject]@{
        cell = [string]$cell.Address()
        formula = $cell.Formula
        calculatedValue = $cell.Value2
        text = $cell.Text
      }
    `);
        if (!res.success)
            throw new Error(res.error || "Failed to get calculation result");
        return res.data;
    }
    static async formatRange(rangeAddress, options, sheetName) {
        const worker = this.getWorker();
        const sheetCmd = sheetName ? `$wb.Worksheets.Item('${sheetName.replace(/'/g, "''")}')` : "$wb.ActiveSheet";
        const boldCmd = options.bold !== undefined ? `$rng.Font.Bold = ${options.bold ? "$true" : "$false"}` : "";
        const italicCmd = options.italic !== undefined ? `$rng.Font.Italic = ${options.italic ? "$true" : "$false"}` : "";
        const sizeCmd = options.fontSize ? `$rng.Font.Size = ${options.fontSize}` : "";
        const fontColorCmd = options.fontColorRgb !== undefined ? `$rng.Font.Color = ${options.fontColorRgb}` : "";
        const fillCmd = options.fillColorRgb !== undefined ? `$rng.Interior.Color = ${options.fillColorRgb}` : "";
        const numFmtCmd = options.numberFormat ? `$rng.NumberFormat = '${options.numberFormat.replace(/'/g, "''")}'` : "";
        const bordersCmd = options.borders ? "$rng.Borders.LineStyle = 1" : "";
        let alignCmd = "";
        if (options.horizontalAlign === "left")
            alignCmd = "$rng.HorizontalAlignment = -4131"; // xlLeft
        else if (options.horizontalAlign === "center")
            alignCmd = "$rng.HorizontalAlignment = -4108"; // xlCenter
        else if (options.horizontalAlign === "right")
            alignCmd = "$rng.HorizontalAlignment = -4152"; // xlRight
        const res = await worker.execute(`
      if ($app.Workbooks.Count -eq 0) { throw "No active workbook in Excel" }
      $wb = $app.ActiveWorkbook
      $ws = ${sheetCmd}
      $rng = $ws.Range('${rangeAddress.replace(/'/g, "''")}')
      ${boldCmd}
      ${italicCmd}
      ${sizeCmd}
      ${fontColorCmd}
      ${fillCmd}
      ${numFmtCmd}
      ${bordersCmd}
      ${alignCmd}
      [PSCustomObject]@{
        success = $true
        range = [string]$rng.Address()
      }
    `);
        if (!res.success)
            throw new Error(res.error || "Failed to format range");
        return res.data;
    }
    static async sortRange(rangeAddress, keyColumnIndex = 1, descending = false, hasHeader = true, sheetName) {
        const worker = this.getWorker();
        const sheetCmd = sheetName ? `$wb.Worksheets.Item('${sheetName.replace(/'/g, "''")}')` : "$wb.ActiveSheet";
        const orderVal = descending ? 2 : 1; // 1 = xlAscending, 2 = xlDescending
        const headerVal = hasHeader ? 1 : 2; // 1 = xlYes, 2 = xlNo
        const res = await worker.execute(`
      if ($app.Workbooks.Count -eq 0) { throw "No active workbook in Excel" }
      $wb = $app.ActiveWorkbook
      $ws = ${sheetCmd}
      $rng = $ws.Range('${rangeAddress.replace(/'/g, "''")}')
      $keyCell = $rng.Columns.Item(${keyColumnIndex})
      $rng.Sort($keyCell, ${orderVal}, [System.Reflection.Missing]::Value, [System.Reflection.Missing]::Value, 1, [System.Reflection.Missing]::Value, 1, ${headerVal}) | Out-Null
      [PSCustomObject]@{ success = $true }
    `);
        if (!res.success)
            throw new Error(res.error || "Failed to sort range");
        return res.data;
    }
    static async filterRange(rangeAddress, fieldIndex = 1, criteria, sheetName) {
        const worker = this.getWorker();
        const sheetCmd = sheetName ? `$wb.Worksheets.Item('${sheetName.replace(/'/g, "''")}')` : "$wb.ActiveSheet";
        const criteriaCmd = criteria ? `,'${criteria.replace(/'/g, "''")}'` : "";
        const res = await worker.execute(`
      if ($app.Workbooks.Count -eq 0) { throw "No active workbook in Excel" }
      $wb = $app.ActiveWorkbook
      $ws = ${sheetCmd}
      $rng = $ws.Range('${rangeAddress.replace(/'/g, "''")}')
      $rng.AutoFilter(${fieldIndex}${criteriaCmd}) | Out-Null
      [PSCustomObject]@{ success = $true }
    `);
        if (!res.success)
            throw new Error(res.error || "Failed to filter range");
        return res.data;
    }
    static async createChart(dataRange, options = {}, sheetName) {
        const worker = this.getWorker();
        const sheetCmd = sheetName ? `$wb.Worksheets.Item('${sheetName.replace(/'/g, "''")}')` : "$wb.ActiveSheet";
        let typeVal = 51; // xlColumnClustered = 51
        if (options.chartType === "bar")
            typeVal = 57; // xlBarClustered
        else if (options.chartType === "line")
            typeVal = 4; // xlLine
        else if (options.chartType === "pie")
            typeVal = 5; // xlPie
        const titleStr = options.title ? options.title.replace(/'/g, "''") : "Chart";
        const left = options.left || 300;
        const top = options.top || 40;
        const width = options.width || 450;
        const height = options.height || 280;
        const res = await worker.execute(`
      if ($app.Workbooks.Count -eq 0) { throw "No active workbook in Excel" }
      $wb = $app.ActiveWorkbook
      $ws = ${sheetCmd}
      $rng = $ws.Range('${dataRange.replace(/'/g, "''")}')
      $chartObj = $ws.ChartObjects().Add(${left}, ${top}, ${width}, ${height})
      $chart = $chartObj.Chart
      $chart.ChartType = ${typeVal}
      $chart.SetSourceData($rng)
      $chart.HasTitle = $true
      $chart.ChartTitle.Text = '${titleStr}'
      [PSCustomObject]@{
        success = $true
        chartTitle = '${titleStr}'
      }
    `);
        if (!res.success)
            throw new Error(res.error || "Failed to create chart in Excel");
        return res.data;
    }
    static async manageRowsCols(action, targetIndex, options = {}, sheetName) {
        const worker = this.getWorker();
        const sheetCmd = sheetName ? `$wb.Worksheets.Item('${sheetName.replace(/'/g, "''")}')` : "$wb.ActiveSheet";
        const count = options.count || 1;
        const res = await worker.execute(`
      if ($app.Workbooks.Count -eq 0) { throw "No active workbook in Excel" }
      $wb = $app.ActiveWorkbook
      $ws = ${sheetCmd}
      $act = '${action}'
      $idx = ${targetIndex}

      if ($act -eq 'insert_row') {
        for ($i = 0; $i -lt ${count}; $i++) { $ws.Rows.Item($idx).Insert() | Out-Null }
      } elseif ($act -eq 'delete_row') {
        for ($i = 0; $i -lt ${count}; $i++) { $ws.Rows.Item($idx).Delete() | Out-Null }
      } elseif ($act -eq 'insert_col') {
        for ($i = 0; $i -lt ${count}; $i++) { $ws.Columns.Item($idx).Insert() | Out-Null }
      } elseif ($act -eq 'delete_col') {
        for ($i = 0; $i -lt ${count}; $i++) { $ws.Columns.Item($idx).Delete() | Out-Null }
      } elseif ($act -eq 'autofit') {
        if (${options.isColumn ? "$true" : "$false"}) {
          $ws.Columns.Item($idx).AutoFit() | Out-Null
        } else {
          $ws.Rows.Item($idx).AutoFit() | Out-Null
        }
      } elseif ($act -eq 'set_size') {
        if (${options.isColumn ? "$true" : "$false"}) {
          $ws.Columns.Item($idx).ColumnWidth = ${options.size || 15}
        } else {
          $ws.Rows.Item($idx).RowHeight = ${options.size || 20}
        }
      }
      [PSCustomObject]@{ success = $true }
    `);
        if (!res.success)
            throw new Error(res.error || `Failed to ${action} in Excel`);
        return res.data;
    }
    static async searchReplace(findText, replaceWith, sheetName) {
        const worker = this.getWorker();
        const sheetCmd = sheetName ? `$wb.Worksheets.Item('${sheetName.replace(/'/g, "''")}')` : "$wb.ActiveSheet";
        const safeFind = findText.replace(/'/g, "''");
        const safeReplace = replaceWith.replace(/'/g, "''");
        const res = await worker.execute(`
      if ($app.Workbooks.Count -eq 0) { throw "No active workbook in Excel" }
      $wb = $app.ActiveWorkbook
      $ws = ${sheetCmd}
      $ws.UsedRange.Replace('${safeFind}', '${safeReplace}', 2, 1, $false, $false) | Out-Null # 2 = xlPart, 1 = xlByRows
      [PSCustomObject]@{ success = $true }
    `);
        if (!res.success)
            throw new Error(res.error || "Failed to search & replace in Excel");
        return res.data;
    }
    static async saveWorkbook(outputPath) {
        let targetPath = outputPath;
        if (!targetPath) {
            targetPath = OfficeWorkspaceManager.resolveWorkspacePath("excel", `workbook_${Date.now()}.xlsx`);
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
      if ($app.Workbooks.Count -eq 0) { throw "No active workbook to save" }
      $wb = $app.ActiveWorkbook
      $app.DisplayAlerts = $false
      $wb.SaveAs('${cleanPath}', 51) # 51 = xlOpenXMLWorkbook (.xlsx)
      $app.DisplayAlerts = $true
      $fileInfo = Get-Item -LiteralPath '${cleanPath}'
      [PSCustomObject]@{
        savedPath = $fileInfo.FullName
        sizeBytes = $fileInfo.Length
      }
    `);
        if (!res.success)
            throw new Error(res.error || `Failed to save Excel workbook to: ${targetPath}`);
        return res.data;
    }
    static async exportPdf(outputPath) {
        let targetPath = outputPath;
        if (!targetPath) {
            targetPath = OfficeWorkspaceManager.resolveWorkspacePath("exports", `workbook_${Date.now()}.pdf`);
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
      if ($app.Workbooks.Count -eq 0) { throw "No active workbook to export" }
      $wb = $app.ActiveWorkbook
      $wb.ExportAsFixedFormat(0, '${cleanPath}') # 0 = xlTypePDF
      $fileInfo = Get-Item -LiteralPath '${cleanPath}'
      [PSCustomObject]@{
        pdfPath = $fileInfo.FullName
        sizeBytes = $fileInfo.Length
      }
    `);
        if (!res.success)
            throw new Error(res.error || `Failed to export Excel workbook to PDF: ${targetPath}`);
        return res.data;
    }
    static async closeWorkbook(saveChanges = false) {
        const worker = this.getWorker();
        const saveVal = saveChanges ? "$true" : "$false";
        const res = await worker.execute(`
      if ($app.Workbooks.Count -eq 0) {
        [PSCustomObject]@{ success = $true; closed = $false }
      } else {
        $wb = $app.ActiveWorkbook
        $app.DisplayAlerts = $false
        $wb.Close(${saveVal})
        $app.DisplayAlerts = $true
        [PSCustomObject]@{ success = $true; closed = $true }
      }
    `);
        if (!res.success)
            throw new Error(res.error || "Failed to close workbook");
        return res.data;
    }
    static async quitApp() {
        const worker = this.getWorker();
        await worker.stop();
        return { success: true };
    }
}
//# sourceMappingURL=excel-manager.js.map