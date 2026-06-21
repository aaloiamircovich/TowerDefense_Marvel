param([string]$ProjectRoot = (Get-Location).Path)

Add-Type -AssemblyName System.Drawing

$items = Get-Content -Raw -Encoding UTF8 (Join-Path $ProjectRoot 'data\items.json') | ConvertFrom-Json
$outputRoot = Join-Path $ProjectRoot 'assets\images\items'
[System.IO.Directory]::CreateDirectory($outputRoot) | Out-Null

$setColors = @{
    stark = [System.Drawing.Color]::FromArgb(255, 46, 190, 235)
    vibranium = [System.Drawing.Color]::FromArgb(255, 151, 92, 230)
    pym = [System.Drawing.Color]::FromArgb(255, 230, 58, 78)
    mystic = [System.Drawing.Color]::FromArgb(255, 245, 151, 35)
    symbiote = [System.Drawing.Color]::FromArgb(255, 184, 224, 74)
    shield = [System.Drawing.Color]::FromArgb(255, 70, 160, 220)
}

foreach ($property in $items.PSObject.Properties) {
    $item = $property.Value
    $bitmap = New-Object System.Drawing.Bitmap 64, 64, ([System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
    $graphics = [System.Drawing.Graphics]::FromImage($bitmap)
    $graphics.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias
    $graphics.Clear([System.Drawing.Color]::Transparent)

    $accent = $setColors[$item.set]
    $background = New-Object System.Drawing.SolidBrush ([System.Drawing.Color]::FromArgb(245, 10, 18, 29))
    $accentBrush = New-Object System.Drawing.SolidBrush $accent
    $accentPen = New-Object System.Drawing.Pen $accent, 3
    $graphics.FillEllipse($background, 3, 3, 58, 58)
    $graphics.DrawEllipse($accentPen, 4, 4, 56, 56)

    if ($item.slot -eq 'weapon') {
        $graphics.DrawLine($accentPen, 19, 45, 43, 19)
        $graphics.DrawLine($accentPen, 21, 19, 45, 43)
        $graphics.FillPolygon($accentBrush, [System.Drawing.Point[]]@(
            [System.Drawing.Point]::new(43, 15), [System.Drawing.Point]::new(48, 16),
            [System.Drawing.Point]::new(47, 21), [System.Drawing.Point]::new(40, 22)
        ))
    } elseif ($item.slot -eq 'armor') {
        $graphics.FillPolygon($accentBrush, [System.Drawing.Point[]]@(
            [System.Drawing.Point]::new(32, 14), [System.Drawing.Point]::new(47, 20),
            [System.Drawing.Point]::new(44, 40), [System.Drawing.Point]::new(32, 51),
            [System.Drawing.Point]::new(20, 40), [System.Drawing.Point]::new(17, 20)
        ))
        $graphics.FillPolygon($background, [System.Drawing.Point[]]@(
            [System.Drawing.Point]::new(32, 20), [System.Drawing.Point]::new(41, 24),
            [System.Drawing.Point]::new(39, 37), [System.Drawing.Point]::new(32, 44),
            [System.Drawing.Point]::new(25, 37), [System.Drawing.Point]::new(23, 24)
        ))
    } else {
        $graphics.FillPolygon($accentBrush, [System.Drawing.Point[]]@(
            [System.Drawing.Point]::new(32, 13), [System.Drawing.Point]::new(49, 31),
            [System.Drawing.Point]::new(32, 51), [System.Drawing.Point]::new(15, 31)
        ))
        $graphics.FillEllipse($background, 25, 24, 14, 14)
    }

    $initials = (($item.id -split '_') | Select-Object -First 2 | ForEach-Object { $_.Substring(0, 1).ToUpperInvariant() }) -join ''
    $font = New-Object System.Drawing.Font 'Segoe UI', 8, ([System.Drawing.FontStyle]::Bold)
    $textBrush = New-Object System.Drawing.SolidBrush ([System.Drawing.Color]::White)
    $format = New-Object System.Drawing.StringFormat
    $format.Alignment = [System.Drawing.StringAlignment]::Center
    $format.LineAlignment = [System.Drawing.StringAlignment]::Center
    $graphics.FillEllipse($background, 21, 25, 22, 14)
    $graphics.DrawString($initials, $font, $textBrush, [System.Drawing.RectangleF]::new(21, 24, 22, 15), $format)

    $path = Join-Path $ProjectRoot $item.icon.Replace('/', '\')
    [System.IO.Directory]::CreateDirectory([System.IO.Path]::GetDirectoryName($path)) | Out-Null
    $bitmap.Save($path, [System.Drawing.Imaging.ImageFormat]::Png)

    $format.Dispose()
    $textBrush.Dispose()
    $font.Dispose()
    $accentPen.Dispose()
    $accentBrush.Dispose()
    $background.Dispose()
    $graphics.Dispose()
    $bitmap.Dispose()
}

Write-Host "Iconos de objetos generados: $(@($items.PSObject.Properties).Count) PNG"
