Add-Type -AssemblyName System.Drawing

function Generate-MadelIcon([int]$size, [string]$outputPath) {
    $bmp = New-Object System.Drawing.Bitmap($size, $size, [System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
    $g = [System.Drawing.Graphics]::FromImage($bmp)
    $g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias
    $g.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
    $g.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality
    $g.Clear([System.Drawing.Color]::Transparent)

    # Rounded base squircle
    $pad = 1.0
    $rect = New-Object System.Drawing.RectangleF($pad, $pad, ($size - 2.0 * $pad), ($size - 2.0 * $pad))
    $radius = $size * 0.22
    $path = New-Object System.Drawing.Drawing2D.GraphicsPath
    $path.AddArc($rect.X, $rect.Y, $radius * 2, $radius * 2, 180, 90)
    $path.AddArc($rect.Right - ($radius * 2), $rect.Y, $radius * 2, $radius * 2, 270, 90)
    $path.AddArc($rect.Right - ($radius * 2), $rect.Bottom - ($radius * 2), $radius * 2, $radius * 2, 0, 90)
    $path.AddArc($rect.X, $rect.Bottom - ($radius * 2), $radius * 2, $radius * 2, 90, 90)
    $path.CloseFigure()

    # Background gradient
    $bgBrush = New-Object System.Drawing.Drawing2D.LinearGradientBrush(
        $rect,
        [System.Drawing.Color]::FromArgb(255, 18, 24, 38),
        [System.Drawing.Color]::FromArgb(255, 8, 12, 20),
        [System.Drawing.Drawing2D.LinearGradientMode]::ForwardDiagonal
    )
    $g.FillPath($bgBrush, $path)

    # Border stroke
    $borderPen = New-Object System.Drawing.Pen([System.Drawing.Color]::FromArgb(180, 0, 180, 255), 1.2)
    $g.DrawPath($borderPen, $path)

    # Geometric Monogram 'M' with Bridge Arch
    $strokeWidth = [Math]::Max(1.8, ($size * 0.10))
    $mPen = New-Object System.Drawing.Pen([System.Drawing.Color]::FromArgb(255, 0, 210, 255), $strokeWidth)
    $mPen.StartCap = [System.Drawing.Drawing2D.LineCap]::Round
    $mPen.EndCap = [System.Drawing.Drawing2D.LineCap]::Round
    $mPen.LineJoin = [System.Drawing.Drawing2D.LineJoin]::Round

    $leftX = $size * 0.24
    $centerX = $size * 0.50
    $rightX = $size * 0.76

    $topY = $size * 0.28
    $midY = $size * 0.56
    $botY = $size * 0.74

    # Monogram M lines
    $g.DrawLine($mPen, [float]$leftX, [float]$botY, [float]$leftX, [float]$topY)
    $g.DrawLine($mPen, [float]$leftX, [float]$topY, [float]$centerX, [float]$midY)
    $g.DrawLine($mPen, [float]$centerX, [float]$midY, [float]$rightX, [float]$topY)
    $g.DrawLine($mPen, [float]$rightX, [float]$topY, [float]$rightX, [float]$botY)

    # Studio Bridge accent arch (connecting below M center)
    $archStroke = [Math]::Max(1.2, ($size * 0.07))
    $archPen = New-Object System.Drawing.Pen([System.Drawing.Color]::FromArgb(230, 255, 255, 255), $archStroke)
    $archPen.StartCap = [System.Drawing.Drawing2D.LineCap]::Round
    $archPen.EndCap = [System.Drawing.Drawing2D.LineCap]::Round
    $g.DrawArc($archPen, [float]($size * 0.32), [float]($size * 0.52), [float]($size * 0.36), [float]($size * 0.28), 180, 180)

    $bmp.Save($outputPath, [System.Drawing.Imaging.ImageFormat]::Png)
    $g.Dispose()
    $bmp.Dispose()
    Write-Host "Generated: $outputPath ($size x $size)"
}

$iconDir = 'D:\MCP\MADEL-Studio-Bridge\panels\panel-uxp-photoshop\icons'
Generate-MadelIcon 48 (Join-Path $iconDir 'icon.png')
Generate-MadelIcon 23 (Join-Path $iconDir 'icon@1x.png')
Generate-MadelIcon 46 (Join-Path $iconDir 'icon@2x.png')
