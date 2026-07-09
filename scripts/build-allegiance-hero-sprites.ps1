param([string]$ProjectRoot = (Get-Location).Path)

Add-Type -AssemblyName System.Drawing

$directions = [ordered]@{
    'north' = @(0, -1)
    'north-east' = @(1, -1)
    'east' = @(1, 0)
    'south-east' = @(1, 1)
    'south' = @(0, 1)
    'south-west' = @(-1, 1)
    'west' = @(-1, 0)
    'north-west' = @(-1, -1)
}

$heroes = [ordered]@{
    shuri = @{ body = '#2d1b55'; accent = '#9c7cff'; skin = '#7a4f2c'; effect = 'gauntlet' }
    okoye = @{ body = '#7f1d1d'; accent = '#f6c453'; skin = '#6f3f25'; effect = 'spear' }
    black_bolt = @{ body = '#111827'; accent = '#38bdf8'; skin = '#c99768'; effect = 'sonic' }
    crystal = @{ body = '#f97316'; accent = '#fde047'; skin = '#c99768'; effect = 'element' }
    namora = @{ body = '#0f766e'; accent = '#22d3ee'; skin = '#c99768'; effect = 'trident' }
    triton = @{ body = '#064e3b'; accent = '#67e8f9'; skin = '#7dd3fc'; effect = 'wave' }
}

function Color([string]$hex) {
    return [System.Drawing.ColorTranslator]::FromHtml($hex)
}

function Brush([string]$hex) {
    return New-Object System.Drawing.SolidBrush (Color $hex)
}

function Pen([string]$hex, [float]$width = 2) {
    return New-Object System.Drawing.Pen (Color $hex), $width
}

function Save-ScaledSprite($source, [string]$path, [int]$size) {
    $target = New-Object System.Drawing.Bitmap $size, $size, ([System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
    $graphics = [System.Drawing.Graphics]::FromImage($target)
    $graphics.Clear([System.Drawing.Color]::Transparent)
    $graphics.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::NearestNeighbor
    $graphics.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::Half
    $graphics.DrawImage($source, 0, 0, $size, $size)
    [System.IO.Directory]::CreateDirectory([System.IO.Path]::GetDirectoryName($path)) | Out-Null
    $target.Save($path, [System.Drawing.Imaging.ImageFormat]::Png)
    $graphics.Dispose()
    $target.Dispose()
}

function Draw-Star($graphics, [int]$x, [int]$y, [int]$size, $brush) {
    $graphics.FillPolygon($brush, [System.Drawing.Point[]]@(
        [System.Drawing.Point]::new($x, $y - $size),
        [System.Drawing.Point]::new($x + 2, $y - 2),
        [System.Drawing.Point]::new($x + $size, $y),
        [System.Drawing.Point]::new($x + 2, $y + 2),
        [System.Drawing.Point]::new($x, $y + $size),
        [System.Drawing.Point]::new($x - 2, $y + 2),
        [System.Drawing.Point]::new($x - $size, $y),
        [System.Drawing.Point]::new($x - 2, $y - 2)
    ))
}

function Draw-Effect($graphics, [string]$effect, [int]$dx, [int]$dy, [float]$pulse, $accentBrush, $accentPen) {
    $fx = if ($dx -eq 0) { 1 } else { $dx }
    $reach = [Math]::Round(16 * $pulse)
    $x = 32 + $fx * (18 + $reach)
    $y = 32 + $dy * (12 + $reach)
    switch ($effect) {
        'gauntlet' {
            $graphics.FillEllipse($accentBrush, $x - 8, $y - 8, 16, 16)
            $graphics.DrawLine($accentPen, 38, 31, $x, $y)
            Draw-Star $graphics $x $y 10 $accentBrush
        }
        'spear' {
            $graphics.DrawLine($accentPen, $x - 15, $y + 14, $x + 13, $y - 14)
            $graphics.FillPolygon($accentBrush, [System.Drawing.Point[]]@(
                [System.Drawing.Point]::new($x + 13, $y - 17),
                [System.Drawing.Point]::new($x + 19, $y - 8),
                [System.Drawing.Point]::new($x + 9, $y - 11)
            ))
        }
        'sonic' {
            $graphics.DrawArc($accentPen, $x - 18, $y - 12, 34, 24, 300, 120)
            $graphics.DrawArc($accentPen, $x - 11, $y - 8, 22, 16, 300, 120)
            $graphics.DrawLine($accentPen, 32, 22, $x, $y)
        }
        'element' {
            $graphics.FillEllipse($accentBrush, $x - 7, $y - 7, 14, 14)
            $graphics.DrawArc($accentPen, $x - 14, $y - 14, 28, 28, 15, 260)
            Draw-Star $graphics ($x + 8) ($y - 8) 5 $accentBrush
        }
        'trident' {
            $graphics.DrawLine($accentPen, $x, $y + 12, $x, $y - 17)
            $graphics.DrawLine($accentPen, $x - 8, $y - 12, $x + 8, $y - 12)
            $graphics.DrawLine($accentPen, $x - 8, $y - 12, $x - 8, $y - 19)
            $graphics.DrawLine($accentPen, $x + 8, $y - 12, $x + 8, $y - 19)
            $graphics.DrawLine($accentPen, $x, $y - 17, $x, $y - 22)
        }
        'wave' {
            $graphics.DrawArc($accentPen, $x - 18, $y - 10, 32, 20, 20, 260)
            $graphics.DrawArc($accentPen, $x - 10, $y - 6, 20, 12, 20, 260)
            $graphics.FillEllipse($accentBrush, $x + 7, $y - 4, 7, 7)
        }
    }
}

function New-HeroSprite([string]$hero, [string]$direction, [int]$attackFrame, [string]$path, [int]$size) {
    $palette = $heroes[$hero]
    $bitmap = New-Object System.Drawing.Bitmap 62, 62, ([System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
    $graphics = [System.Drawing.Graphics]::FromImage($bitmap)
    $graphics.Clear([System.Drawing.Color]::Transparent)
    $graphics.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::None
    $graphics.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::Half
    $vector = $directions[$direction]
    $pulse = if ($attackFrame -ge 0) { [Math]::Sin(($attackFrame / 8) * [Math]::PI) } else { 0 }
    $back = $vector[1] -lt 0
    $bodyBrush = Brush $palette.body
    $accentBrush = Brush $palette.accent
    $skinBrush = Brush $palette.skin
    $accentPen = Pen $palette.accent 3

    $graphics.FillRectangle([System.Drawing.Brushes]::Black, 23, 43, 8, 14)
    $graphics.FillRectangle([System.Drawing.Brushes]::Black, 34, 43, 8, 14)
    $graphics.FillPolygon($bodyBrush, [System.Drawing.Point[]]@(
        [System.Drawing.Point]::new(20, 24), [System.Drawing.Point]::new(44, 24),
        [System.Drawing.Point]::new(40, 47), [System.Drawing.Point]::new(24, 47)))
    $graphics.FillRectangle($accentBrush, 28, 28, 8, 18)
    $graphics.FillEllipse($skinBrush, 24, 11, 16, 17)
    if ($back) {
        $graphics.FillRectangle($bodyBrush, 23, 10, 18, 9)
    } else {
        $graphics.FillRectangle([System.Drawing.Brushes]::Black, 27, 18, 3, 2)
        $graphics.FillRectangle([System.Drawing.Brushes]::Black, 35, 18, 3, 2)
        $graphics.DrawLine($accentPen, 27, 23, 37, 23)
    }
    Draw-Effect $graphics $palette.effect $vector[0] $vector[1] $pulse $accentBrush $accentPen

    Save-ScaledSprite $bitmap $path $size
    $accentPen.Dispose()
    $bodyBrush.Dispose()
    $accentBrush.Dispose()
    $skinBrush.Dispose()
    $graphics.Dispose()
    $bitmap.Dispose()
}

foreach ($hero in $heroes.Keys) {
    $root = Join-Path $ProjectRoot "assets\images\heroes\$hero"
    foreach ($direction in $directions.Keys) {
        New-HeroSprite $hero $direction -1 (Join-Path $root "sprites\$direction.png") 124
    }
    for ($frame = 0; $frame -lt 9; $frame++) {
        New-HeroSprite $hero 'south' $frame (Join-Path $root "shoot\$frame.png") 124
    }
    New-HeroSprite $hero 'south' -1 (Join-Path $root 'portrait.png') 56
}

Write-Host "Sprites de agrupaciones generados: $($heroes.Count) heroes, $($heroes.Count * 18) assets PNG"
