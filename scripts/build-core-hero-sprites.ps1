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

function New-StarPoints([float]$cx, [float]$cy, [float]$outer, [float]$inner) {
    $points = New-Object 'System.Collections.Generic.List[System.Drawing.PointF]'
    for ($index = 0; $index -lt 10; $index++) {
        $angle = -[Math]::PI / 2 + $index * [Math]::PI / 5
        $radius = if ($index % 2 -eq 0) { $outer } else { $inner }
        $points.Add([System.Drawing.PointF]::new($cx + [Math]::Cos($angle) * $radius, $cy + [Math]::Sin($angle) * $radius))
    }
    return $points.ToArray()
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

function Draw-Shield($graphics, [int]$x, [int]$y) {
    $graphics.FillEllipse([System.Drawing.Brushes]::DarkRed, $x - 8, $y - 8, 16, 16)
    $graphics.FillEllipse([System.Drawing.Brushes]::WhiteSmoke, $x - 6, $y - 6, 12, 12)
    $graphics.FillEllipse([System.Drawing.Brushes]::Crimson, $x - 4, $y - 4, 8, 8)
    $graphics.FillEllipse([System.Drawing.Brushes]::MidnightBlue, $x - 3, $y - 3, 6, 6)
    $graphics.FillPolygon([System.Drawing.Brushes]::White, (New-StarPoints $x $y 2.5 1.1))
}

function Draw-Lightning($graphics, [int]$x, [int]$y, [int]$reach) {
    $pen = New-Object System.Drawing.Pen ([System.Drawing.Color]::FromArgb(230, 190, 235, 255)), 2
    $points = [System.Drawing.Point[]]@(
        [System.Drawing.Point]::new($x, $y),
        [System.Drawing.Point]::new($x + 3, $y - [Math]::Floor($reach * 0.3)),
        [System.Drawing.Point]::new($x - 2, $y - [Math]::Floor($reach * 0.55)),
        [System.Drawing.Point]::new($x + 2, $y - $reach)
    )
    $graphics.DrawLines($pen, $points)
    $pen.Dispose()
}

function Draw-Captain($graphics, [int]$dx, [int]$dy, [float]$pulse) {
    $back = $dy -lt 0
    $graphics.FillRectangle([System.Drawing.Brushes]::MidnightBlue, 24, 44, 5, 11)
    $graphics.FillRectangle([System.Drawing.Brushes]::MidnightBlue, 34, 44, 5, 11)
    $graphics.FillRectangle([System.Drawing.Brushes]::Firebrick, 23, 53, 7, 4)
    $graphics.FillRectangle([System.Drawing.Brushes]::Firebrick, 33, 53, 7, 4)
    $graphics.FillPolygon([System.Drawing.Brushes]::Navy, [System.Drawing.Point[]]@(
        [System.Drawing.Point]::new(22, 27), [System.Drawing.Point]::new(40, 27),
        [System.Drawing.Point]::new(37, 46), [System.Drawing.Point]::new(25, 46)
    ))
    $graphics.FillRectangle([System.Drawing.Brushes]::WhiteSmoke, 27, 34, 8, 8)
    $graphics.FillRectangle([System.Drawing.Brushes]::Firebrick, 27, 39, 8, 2)
    $graphics.FillEllipse([System.Drawing.Brushes]::NavajoWhite, 26, 16, 11, 13)
    $graphics.FillRectangle([System.Drawing.Brushes]::MidnightBlue, 25, 15, 13, 8)
    $graphics.FillRectangle([System.Drawing.Brushes]::MidnightBlue, 25, 20, 3, 8)
    $graphics.FillRectangle([System.Drawing.Brushes]::MidnightBlue, 35, 20, 3, 8)
    if (-not $back) {
        $graphics.FillRectangle([System.Drawing.Brushes]::White, 30, 16, 3, 5)
        $graphics.FillPolygon([System.Drawing.Brushes]::White, (New-StarPoints 31 34 4 1.7))
    }
    $shieldX = if ($dx -lt 0) { 20 } else { 42 }
    $shieldY = if ($dy -lt 0) { 34 } else { 36 }
    if ($pulse -gt 0) {
        $moveX = if ($dx -eq 0) { 1 } else { $dx }
        $shieldX += [Math]::Round($moveX * 17 * $pulse)
        $shieldY += [Math]::Round($dy * 14 * $pulse)
    }
    Draw-Shield $graphics $shieldX $shieldY
}

function Draw-Thor($graphics, [int]$dx, [int]$dy, [float]$pulse) {
    $back = $dy -lt 0
    $graphics.FillPolygon([System.Drawing.Brushes]::DarkRed, [System.Drawing.Point[]]@(
        [System.Drawing.Point]::new(21, 26), [System.Drawing.Point]::new(41, 26),
        [System.Drawing.Point]::new(45, 52), [System.Drawing.Point]::new(31, 47),
        [System.Drawing.Point]::new(17, 52)
    ))
    $graphics.FillRectangle([System.Drawing.Brushes]::DimGray, 24, 43, 5, 12)
    $graphics.FillRectangle([System.Drawing.Brushes]::DimGray, 34, 43, 5, 12)
    $graphics.FillPolygon([System.Drawing.Brushes]::SteelBlue, [System.Drawing.Point[]]@(
        [System.Drawing.Point]::new(22, 27), [System.Drawing.Point]::new(40, 27),
        [System.Drawing.Point]::new(38, 45), [System.Drawing.Point]::new(24, 45)
    ))
    $graphics.FillEllipse([System.Drawing.Brushes]::Silver, 22, 29, 7, 7)
    $graphics.FillEllipse([System.Drawing.Brushes]::Silver, 34, 29, 7, 7)
    $graphics.FillEllipse([System.Drawing.Brushes]::NavajoWhite, 25, 15, 13, 14)
    $graphics.FillRectangle([System.Drawing.Brushes]::Goldenrod, 23, 13, 17, 6)
    $graphics.FillRectangle([System.Drawing.Brushes]::Goldenrod, 24, 18, 3, 10)
    $graphics.FillRectangle([System.Drawing.Brushes]::Goldenrod, 37, 18, 3, 10)
    if (-not $back) {
        $graphics.FillRectangle([System.Drawing.Brushes]::CornflowerBlue, 28, 20, 2, 2)
        $graphics.FillRectangle([System.Drawing.Brushes]::CornflowerBlue, 34, 20, 2, 2)
    }
    $hammerX = if ($dx -lt 0) { 18 } else { 45 }
    $hammerY = 34 - [Math]::Round(16 * $pulse)
    $graphics.FillRectangle([System.Drawing.Brushes]::SaddleBrown, $hammerX, $hammerY, 3, 14)
    $graphics.FillRectangle([System.Drawing.Brushes]::LightSlateGray, $hammerX - 4, $hammerY - 4, 11, 7)
    $graphics.DrawRectangle([System.Drawing.Pens]::WhiteSmoke, $hammerX - 3, $hammerY - 3, 9, 5)
    if ($pulse -gt 0.25) { Draw-Lightning $graphics ($hammerX + 1) ($hammerY - 4) ([Math]::Round(9 * $pulse)) }
}

function Draw-Strange($graphics, [int]$dx, [int]$dy, [float]$pulse) {
    $back = $dy -lt 0
    $graphics.FillPolygon([System.Drawing.Brushes]::Crimson, [System.Drawing.Point[]]@(
        [System.Drawing.Point]::new(21, 25), [System.Drawing.Point]::new(41, 25),
        [System.Drawing.Point]::new(46, 52), [System.Drawing.Point]::new(32, 47),
        [System.Drawing.Point]::new(16, 52)
    ))
    $graphics.FillRectangle([System.Drawing.Brushes]::MidnightBlue, 25, 43, 5, 12)
    $graphics.FillRectangle([System.Drawing.Brushes]::MidnightBlue, 34, 43, 5, 12)
    $graphics.FillPolygon([System.Drawing.Brushes]::DarkBlue, [System.Drawing.Point[]]@(
        [System.Drawing.Point]::new(22, 27), [System.Drawing.Point]::new(40, 27),
        [System.Drawing.Point]::new(37, 46), [System.Drawing.Point]::new(25, 46)
    ))
    $graphics.FillRectangle([System.Drawing.Brushes]::Goldenrod, 24, 37, 15, 3)
    $graphics.FillEllipse([System.Drawing.Brushes]::NavajoWhite, 26, 15, 11, 14)
    $graphics.FillRectangle([System.Drawing.Brushes]::SaddleBrown, 24, 13, 15, 6)
    $graphics.FillRectangle([System.Drawing.Brushes]::SaddleBrown, 24, 18, 3, 7)
    $graphics.FillRectangle([System.Drawing.Brushes]::SaddleBrown, 36, 18, 3, 7)
    if (-not $back) {
        $graphics.FillPolygon([System.Drawing.Brushes]::Gold, [System.Drawing.Point[]]@(
            [System.Drawing.Point]::new(29, 29), [System.Drawing.Point]::new(34, 29),
            [System.Drawing.Point]::new(31, 34)
        ))
    }
    if ($pulse -gt 0) {
        $forwardX = if ($dx -eq 0) { 1 } else { $dx }
        $centerX = 31 + $forwardX * 18
        $centerY = 35 + $dy * 13
        $radius = 5 + [Math]::Round(8 * $pulse)
        $outerPen = New-Object System.Drawing.Pen ([System.Drawing.Color]::FromArgb(245, 255, 145, 25)), 2
        $innerPen = New-Object System.Drawing.Pen ([System.Drawing.Color]::FromArgb(230, 255, 220, 70)), 1
        $graphics.DrawEllipse($outerPen, $centerX - $radius, $centerY - $radius, $radius * 2, $radius * 2)
        $graphics.DrawEllipse($innerPen, $centerX - $radius + 3, $centerY - $radius + 3, ($radius - 3) * 2, ($radius - 3) * 2)
        $graphics.DrawLine($innerPen, $centerX - $radius, $centerY, $centerX + $radius, $centerY)
        $graphics.DrawLine($innerPen, $centerX, $centerY - $radius, $centerX, $centerY + $radius)
        $outerPen.Dispose()
        $innerPen.Dispose()
    }
}

function New-HeroSprite([string]$hero, [string]$direction, [int]$attackFrame, [string]$path, [int]$size) {
    $bitmap = New-Object System.Drawing.Bitmap 62, 62, ([System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
    $graphics = [System.Drawing.Graphics]::FromImage($bitmap)
    $graphics.Clear([System.Drawing.Color]::Transparent)
    $graphics.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::None
    $graphics.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::Half
    $vector = $directions[$direction]
    $pulse = if ($attackFrame -ge 0) { [Math]::Sin(($attackFrame / 8) * [Math]::PI) } else { 0 }
    switch ($hero) {
        'capitan_america' { Draw-Captain $graphics $vector[0] $vector[1] $pulse }
        'thor' { Draw-Thor $graphics $vector[0] $vector[1] $pulse }
        'doctor_strange' { Draw-Strange $graphics $vector[0] $vector[1] $pulse }
    }
    Save-ScaledSprite $bitmap $path $size
    $graphics.Dispose()
    $bitmap.Dispose()
}

$heroes = @('capitan_america', 'thor', 'doctor_strange')
foreach ($hero in $heroes) {
    $root = Join-Path $ProjectRoot "assets\images\heroes\$hero"
    foreach ($direction in $directions.Keys) {
        New-HeroSprite $hero $direction -1 (Join-Path $root "sprites\$direction.png") 124
    }
    for ($frame = 0; $frame -lt 9; $frame++) {
        New-HeroSprite $hero 'south' $frame (Join-Path $root "shoot\$frame.png") 124
    }
    New-HeroSprite $hero 'south' -1 (Join-Path $root 'portrait.png') 56
}

Write-Host "Sprites centrales generados: $($heroes.Count) heroes, 54 assets PNG"
