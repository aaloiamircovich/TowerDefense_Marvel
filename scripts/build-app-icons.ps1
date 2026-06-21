param([string]$ProjectRoot = (Get-Location).Path)

Add-Type -AssemblyName System.Drawing
$target = Join-Path $ProjectRoot 'assets\icons'
New-Item -ItemType Directory -Force -Path $target | Out-Null

foreach ($size in @(192, 512)) {
    $bitmap = New-Object System.Drawing.Bitmap $size, $size, ([System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
    $graphics = [System.Drawing.Graphics]::FromImage($bitmap)
    $graphics.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias
    $graphics.Clear([System.Drawing.Color]::FromArgb(8, 11, 16))
    $margin = [Math]::Round($size * 0.14)
    $shield = @(
        [System.Drawing.PointF]::new($size * 0.5, $margin),
        [System.Drawing.PointF]::new($size - $margin, $size * 0.28),
        [System.Drawing.PointF]::new($size * 0.82, $size * 0.72),
        [System.Drawing.PointF]::new($size * 0.5, $size - $margin),
        [System.Drawing.PointF]::new($size * 0.18, $size * 0.72),
        [System.Drawing.PointF]::new($margin, $size * 0.28)
    )
    $graphics.FillPolygon((New-Object System.Drawing.SolidBrush ([System.Drawing.Color]::FromArgb(20, 38, 56))), $shield)
    $graphics.DrawPolygon((New-Object System.Drawing.Pen ([System.Drawing.Color]::FromArgb(64, 201, 255)), ($size * 0.035)), $shield)
    $font = New-Object System.Drawing.Font 'Segoe UI', ($size * 0.27), ([System.Drawing.FontStyle]::Bold), ([System.Drawing.GraphicsUnit]::Pixel)
    $format = New-Object System.Drawing.StringFormat
    $format.Alignment = [System.Drawing.StringAlignment]::Center
    $format.LineAlignment = [System.Drawing.StringAlignment]::Center
    $graphics.DrawString('TD', $font, (New-Object System.Drawing.SolidBrush ([System.Drawing.Color]::FromArgb(252, 163, 17))), ([System.Drawing.RectangleF]::new(0, 0, $size, $size)), $format)
    $bitmap.Save((Join-Path $target "icon-$size.png"), [System.Drawing.Imaging.ImageFormat]::Png)
    $format.Dispose(); $font.Dispose(); $graphics.Dispose(); $bitmap.Dispose()
}

Write-Host 'Iconos PWA generados'
