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

function Draw-Hulk($graphics, [int]$dx, [int]$dy, [float]$pulse) {
    $back = $dy -lt 0
    $swing = [Math]::Round(9 * $pulse)
    $graphics.FillRectangle([System.Drawing.Brushes]::Indigo, 21, 43, 9, 13)
    $graphics.FillRectangle([System.Drawing.Brushes]::Indigo, 34, 43, 9, 13)
    $graphics.FillRectangle([System.Drawing.Brushes]::MediumPurple, 20, 39, 24, 9)
    $graphics.FillPolygon([System.Drawing.Brushes]::ForestGreen, [System.Drawing.Point[]]@(
        [System.Drawing.Point]::new(18, 24), [System.Drawing.Point]::new(45, 24),
        [System.Drawing.Point]::new(41, 43), [System.Drawing.Point]::new(23, 43)
    ))
    $graphics.FillEllipse([System.Drawing.Brushes]::YellowGreen, 24, 11, 16, 16)
    $graphics.FillRectangle([System.Drawing.Brushes]::DarkGreen, 23, 10, 18, 6)
    $left = 12 - $swing
    $right = 43 + $swing
    $graphics.FillRectangle([System.Drawing.Brushes]::ForestGreen, $left, 27, 9, 18)
    $graphics.FillRectangle([System.Drawing.Brushes]::ForestGreen, $right, 27, 9, 18)
    $graphics.FillEllipse([System.Drawing.Brushes]::YellowGreen, $left - 2, 41, 13, 12)
    $graphics.FillEllipse([System.Drawing.Brushes]::YellowGreen, $right - 2, 41, 13, 12)
    if (-not $back) {
        $graphics.FillRectangle([System.Drawing.Brushes]::White, 27, 18, 3, 2)
        $graphics.FillRectangle([System.Drawing.Brushes]::White, 35, 18, 3, 2)
        $graphics.FillRectangle([System.Drawing.Brushes]::DarkGreen, 29, 23, 7, 2)
    }
}

function Draw-Widow($graphics, [int]$dx, [int]$dy, [float]$pulse) {
    $back = $dy -lt 0
    $reach = [Math]::Round(13 * $pulse)
    $graphics.FillRectangle([System.Drawing.Brushes]::Black, 24, 43, 6, 13)
    $graphics.FillRectangle([System.Drawing.Brushes]::Black, 34, 43, 6, 13)
    $graphics.FillPolygon([System.Drawing.Brushes]::DarkSlateGray, [System.Drawing.Point[]]@(
        [System.Drawing.Point]::new(22, 26), [System.Drawing.Point]::new(41, 26),
        [System.Drawing.Point]::new(38, 45), [System.Drawing.Point]::new(25, 45)
    ))
    $graphics.FillRectangle([System.Drawing.Brushes]::Goldenrod, 24, 39, 15, 3)
    $graphics.FillEllipse([System.Drawing.Brushes]::NavajoWhite, 25, 14, 14, 15)
    $graphics.FillEllipse([System.Drawing.Brushes]::Firebrick, 22, 11, 20, 14)
    $graphics.FillEllipse([System.Drawing.Brushes]::NavajoWhite, 26, 15, 12, 12)
    if (-not $back) {
        $graphics.FillRectangle([System.Drawing.Brushes]::DeepSkyBlue, 27, 20, 2, 2)
        $graphics.FillRectangle([System.Drawing.Brushes]::DeepSkyBlue, 35, 20, 2, 2)
        $graphics.FillPolygon([System.Drawing.Brushes]::Crimson, (New-StarPoints 32 34 4 1.3))
    }
    $left = 17 - $reach
    $right = 44 + $reach
    $graphics.FillRectangle([System.Drawing.Brushes]::Black, $left, 28, 6, 16)
    $graphics.FillRectangle([System.Drawing.Brushes]::Black, $right, 28, 6, 16)
    $pen = New-Object System.Drawing.Pen ([System.Drawing.Color]::DeepSkyBlue), 3
    $graphics.DrawLine($pen, $left + 2, 31, $left - 2, 45)
    $graphics.DrawLine($pen, $right + 3, 31, $right + 7, 45)
    $pen.Dispose()
}

function Draw-Hawkeye($graphics, [int]$dx, [int]$dy, [float]$pulse) {
    $back = $dy -lt 0
    $draw = [Math]::Round(10 * $pulse)
    $graphics.FillRectangle([System.Drawing.Brushes]::Black, 24, 43, 6, 13)
    $graphics.FillRectangle([System.Drawing.Brushes]::Black, 34, 43, 6, 13)
    $graphics.FillPolygon([System.Drawing.Brushes]::Indigo, [System.Drawing.Point[]]@(
        [System.Drawing.Point]::new(22, 26), [System.Drawing.Point]::new(41, 26),
        [System.Drawing.Point]::new(38, 45), [System.Drawing.Point]::new(25, 45)
    ))
    $graphics.FillRectangle([System.Drawing.Brushes]::Black, 30, 27, 4, 18)
    $graphics.FillEllipse([System.Drawing.Brushes]::NavajoWhite, 25, 14, 14, 15)
    $graphics.FillRectangle([System.Drawing.Brushes]::Purple, 24, 14, 16, 7)
    if (-not $back) {
        $graphics.FillRectangle([System.Drawing.Brushes]::White, 27, 19, 3, 2)
        $graphics.FillRectangle([System.Drawing.Brushes]::White, 35, 19, 3, 2)
    }
    $bowX = if ($dx -lt 0) { 16 - $draw } else { 47 + $draw }
    $pen = New-Object System.Drawing.Pen ([System.Drawing.Color]::MediumPurple), 3
    $graphics.DrawArc($pen, $bowX - 7, 24, 14, 27, 70, 220)
    $graphics.DrawLine([System.Drawing.Pens]::WhiteSmoke, $bowX, 26, $bowX, 49)
    $graphics.DrawLine([System.Drawing.Pens]::Goldenrod, 31, 36, $bowX + ($(if ($dx -lt 0) { -9 } else { 9 })), 36)
    $pen.Dispose()
}

function Draw-Panther($graphics, [int]$dx, [int]$dy, [float]$pulse) {
    $back = $dy -lt 0
    $reach = [Math]::Round(12 * $pulse)
    $graphics.FillRectangle([System.Drawing.Brushes]::Black, 24, 43, 6, 13)
    $graphics.FillRectangle([System.Drawing.Brushes]::Black, 34, 43, 6, 13)
    $graphics.FillPolygon([System.Drawing.Brushes]::Black, [System.Drawing.Point[]]@(
        [System.Drawing.Point]::new(21, 25), [System.Drawing.Point]::new(42, 25),
        [System.Drawing.Point]::new(38, 46), [System.Drawing.Point]::new(25, 46)
    ))
    $purple = New-Object System.Drawing.Pen ([System.Drawing.Color]::MediumPurple), 2
    $graphics.DrawPolygon($purple, [System.Drawing.Point[]]@(
        [System.Drawing.Point]::new(21, 25), [System.Drawing.Point]::new(42, 25),
        [System.Drawing.Point]::new(38, 46), [System.Drawing.Point]::new(25, 46)
    ))
    $graphics.FillEllipse([System.Drawing.Brushes]::Black, 24, 12, 16, 17)
    $graphics.FillPolygon([System.Drawing.Brushes]::Black, [System.Drawing.Point[]]@(
        [System.Drawing.Point]::new(25, 15), [System.Drawing.Point]::new(27, 8), [System.Drawing.Point]::new(31, 14),
        [System.Drawing.Point]::new(37, 14), [System.Drawing.Point]::new(40, 8), [System.Drawing.Point]::new(40, 18)
    ))
    if (-not $back) {
        $graphics.FillPolygon([System.Drawing.Brushes]::White, [System.Drawing.Point[]]@(
            [System.Drawing.Point]::new(27, 19), [System.Drawing.Point]::new(31, 20), [System.Drawing.Point]::new(27, 22)
        ))
        $graphics.FillPolygon([System.Drawing.Brushes]::White, [System.Drawing.Point[]]@(
            [System.Drawing.Point]::new(38, 19), [System.Drawing.Point]::new(34, 20), [System.Drawing.Point]::new(38, 22)
        ))
        for ($i = 0; $i -lt 5; $i++) { $graphics.FillEllipse([System.Drawing.Brushes]::WhiteSmoke, 25 + $i * 3, 29 + [Math]::Abs(2 - $i), 2, 3) }
    }
    $graphics.DrawLine($purple, 20 - $reach, 30, 13 - $reach, 46)
    $graphics.DrawLine($purple, 44 + $reach, 30, 51 + $reach, 46)
    $purple.Dispose()
}

function Draw-Vision($graphics, [int]$dx, [int]$dy, [float]$pulse) {
    $back = $dy -lt 0
    $graphics.FillPolygon([System.Drawing.Brushes]::Goldenrod, [System.Drawing.Point[]]@(
        [System.Drawing.Point]::new(20, 24), [System.Drawing.Point]::new(43, 24),
        [System.Drawing.Point]::new(48, 53), [System.Drawing.Point]::new(32, 47), [System.Drawing.Point]::new(16, 53)
    ))
    $graphics.FillRectangle([System.Drawing.Brushes]::DarkGreen, 24, 43, 6, 13)
    $graphics.FillRectangle([System.Drawing.Brushes]::DarkGreen, 34, 43, 6, 13)
    $graphics.FillPolygon([System.Drawing.Brushes]::SeaGreen, [System.Drawing.Point[]]@(
        [System.Drawing.Point]::new(22, 25), [System.Drawing.Point]::new(41, 25),
        [System.Drawing.Point]::new(38, 45), [System.Drawing.Point]::new(25, 45)
    ))
    $graphics.FillEllipse([System.Drawing.Brushes]::IndianRed, 25, 13, 14, 16)
    $graphics.FillPolygon([System.Drawing.Brushes]::Gold, [System.Drawing.Point[]]@(
        [System.Drawing.Point]::new(32, 14), [System.Drawing.Point]::new(35, 18), [System.Drawing.Point]::new(32, 21), [System.Drawing.Point]::new(29, 18)
    ))
    if (-not $back) {
        $graphics.FillRectangle([System.Drawing.Brushes]::LightCyan, 27, 21, 3, 2)
        $graphics.FillRectangle([System.Drawing.Brushes]::LightCyan, 35, 21, 3, 2)
    }
    if ($pulse -gt 0) {
        $pen = New-Object System.Drawing.Pen ([System.Drawing.Color]::Gold), (2 + [Math]::Round(3 * $pulse))
        $graphics.DrawLine($pen, 32, 17, 32 + ($(if ($dx -eq 0) { 1 } else { $dx })) * (15 + [Math]::Round(15 * $pulse)), 17 + $dy * 18)
        $pen.Dispose()
    }
}

function Draw-Falcon($graphics, [int]$dx, [int]$dy, [float]$pulse) {
    $back = $dy -lt 0
    $spread = 10 + [Math]::Round(13 * $pulse)
    $graphics.FillRectangle([System.Drawing.Brushes]::DimGray, 24, 43, 6, 13)
    $graphics.FillRectangle([System.Drawing.Brushes]::DimGray, 34, 43, 6, 13)
    $graphics.FillPolygon([System.Drawing.Brushes]::Firebrick, [System.Drawing.Point[]]@(
        [System.Drawing.Point]::new(22, 25), [System.Drawing.Point]::new(41, 25),
        [System.Drawing.Point]::new(38, 45), [System.Drawing.Point]::new(25, 45)
    ))
    $graphics.FillRectangle([System.Drawing.Brushes]::Silver, 28, 27, 8, 18)
    $graphics.FillEllipse([System.Drawing.Brushes]::SaddleBrown, 25, 13, 14, 16)
    $graphics.FillRectangle([System.Drawing.Brushes]::Silver, 24, 16, 16, 7)
    if (-not $back) {
        $graphics.FillRectangle([System.Drawing.Brushes]::Crimson, 26, 18, 5, 2)
        $graphics.FillRectangle([System.Drawing.Brushes]::Crimson, 34, 18, 5, 2)
    }
    $graphics.FillPolygon([System.Drawing.Brushes]::LightGray, [System.Drawing.Point[]]@(
        [System.Drawing.Point]::new(22, 27), [System.Drawing.Point]::new(8 - $spread, 18),
        [System.Drawing.Point]::new(14 - $spread, 38), [System.Drawing.Point]::new(24, 42)
    ))
    $graphics.FillPolygon([System.Drawing.Brushes]::LightGray, [System.Drawing.Point[]]@(
        [System.Drawing.Point]::new(41, 27), [System.Drawing.Point]::new(55 + $spread, 18),
        [System.Drawing.Point]::new(49 + $spread, 38), [System.Drawing.Point]::new(39, 42)
    ))
    $graphics.DrawLine([System.Drawing.Pens]::Crimson, 11 - $spread, 22, 22, 32)
    $graphics.DrawLine([System.Drawing.Pens]::Crimson, 52 + $spread, 22, 41, 32)
}

function Draw-CosmicHero($graphics, [string]$hero, [int]$dx, [int]$dy, [float]$pulse) {
    $back = $dy -lt 0
    $reach = [Math]::Round(14 * $pulse)
    switch ($hero) {
        'captain_marvel' {
            $graphics.FillRectangle([System.Drawing.Brushes]::DarkRed, 24, 43, 6, 13)
            $graphics.FillRectangle([System.Drawing.Brushes]::DarkRed, 34, 43, 6, 13)
            $graphics.FillPolygon([System.Drawing.Brushes]::MidnightBlue, [System.Drawing.Point[]]@(
                [System.Drawing.Point]::new(22, 25), [System.Drawing.Point]::new(41, 25),
                [System.Drawing.Point]::new(38, 45), [System.Drawing.Point]::new(25, 45)))
            $graphics.FillRectangle([System.Drawing.Brushes]::Crimson, 22, 31, 19, 9)
            $graphics.FillPolygon([System.Drawing.Brushes]::Gold, (New-StarPoints 32 34 6 2.2))
            $graphics.FillEllipse([System.Drawing.Brushes]::NavajoWhite, 25, 13, 14, 15)
            $graphics.FillPolygon([System.Drawing.Brushes]::Goldenrod, [System.Drawing.Point[]]@(
                [System.Drawing.Point]::new(26, 16), [System.Drawing.Point]::new(31, 7), [System.Drawing.Point]::new(34, 16)))
            if (-not $back) {
                $graphics.FillRectangle([System.Drawing.Brushes]::LightCyan, 27, 20, 3, 2)
                $graphics.FillRectangle([System.Drawing.Brushes]::LightCyan, 35, 20, 3, 2)
            }
            if ($pulse -gt 0) {
                $goldPen = New-Object System.Drawing.Pen ([System.Drawing.Color]::Gold), 4
                $graphics.DrawLine($goldPen, 17 - $reach, 34, 9 - $reach, 45)
                $graphics.DrawLine($goldPen, 46 + $reach, 34, 54 + $reach, 45)
                $goldPen.Dispose()
            }
        }
        'star_lord' {
            $graphics.FillRectangle([System.Drawing.Brushes]::SaddleBrown, 24, 43, 6, 13)
            $graphics.FillRectangle([System.Drawing.Brushes]::SaddleBrown, 34, 43, 6, 13)
            $graphics.FillPolygon([System.Drawing.Brushes]::Firebrick, [System.Drawing.Point[]]@(
                [System.Drawing.Point]::new(21, 25), [System.Drawing.Point]::new(42, 25),
                [System.Drawing.Point]::new(38, 46), [System.Drawing.Point]::new(25, 46)))
            $graphics.FillRectangle([System.Drawing.Brushes]::DarkSlateGray, 28, 28, 8, 17)
            $graphics.FillEllipse([System.Drawing.Brushes]::LightSlateGray, 24, 12, 16, 17)
            $graphics.FillRectangle([System.Drawing.Brushes]::Crimson, 23, 16, 18, 7)
            if (-not $back) {
                $graphics.FillEllipse([System.Drawing.Brushes]::OrangeRed, 27, 18, 4, 4)
                $graphics.FillEllipse([System.Drawing.Brushes]::OrangeRed, 34, 18, 4, 4)
            }
            $left = 16 - $reach
            $right = 45 + $reach
            $graphics.FillRectangle([System.Drawing.Brushes]::DimGray, $left, 31, 7, 13)
            $graphics.FillRectangle([System.Drawing.Brushes]::DimGray, $right, 31, 7, 13)
            if ($pulse -gt 0.3) {
                $graphics.FillEllipse([System.Drawing.Brushes]::DeepSkyBlue, $left - 4, 28, 6, 6)
                $graphics.FillEllipse([System.Drawing.Brushes]::DeepSkyBlue, $right + 5, 28, 6, 6)
            }
        }
        'groot' {
            $graphics.FillRectangle([System.Drawing.Brushes]::SaddleBrown, 24, 42, 7, 15)
            $graphics.FillRectangle([System.Drawing.Brushes]::SaddleBrown, 34, 42, 7, 15)
            $graphics.FillPolygon([System.Drawing.Brushes]::Peru, [System.Drawing.Point[]]@(
                [System.Drawing.Point]::new(22, 24), [System.Drawing.Point]::new(42, 24),
                [System.Drawing.Point]::new(39, 47), [System.Drawing.Point]::new(25, 47)))
            $graphics.FillPolygon([System.Drawing.Brushes]::SaddleBrown, [System.Drawing.Point[]]@(
                [System.Drawing.Point]::new(24, 27), [System.Drawing.Point]::new(19, 8), [System.Drawing.Point]::new(28, 16),
                [System.Drawing.Point]::new(32, 5), [System.Drawing.Point]::new(36, 16), [System.Drawing.Point]::new(45, 8), [System.Drawing.Point]::new(40, 28)))
            if (-not $back) {
                $graphics.FillEllipse([System.Drawing.Brushes]::LightGreen, 27, 19, 3, 3)
                $graphics.FillEllipse([System.Drawing.Brushes]::LightGreen, 35, 19, 3, 3)
            }
            $branchPen = New-Object System.Drawing.Pen ([System.Drawing.Color]::SaddleBrown), 6
            $graphics.DrawLine($branchPen, 23, 29, 10 - $reach, 42)
            $graphics.DrawLine($branchPen, 41, 29, 54 + $reach, 42)
            $branchPen.Dispose()
        }
        'gamora' {
            $graphics.FillRectangle([System.Drawing.Brushes]::Black, 24, 43, 6, 13)
            $graphics.FillRectangle([System.Drawing.Brushes]::Black, 34, 43, 6, 13)
            $graphics.FillPolygon([System.Drawing.Brushes]::DarkSlateGray, [System.Drawing.Point[]]@(
                [System.Drawing.Point]::new(22, 25), [System.Drawing.Point]::new(41, 25),
                [System.Drawing.Point]::new(38, 45), [System.Drawing.Point]::new(25, 45)))
            $graphics.FillEllipse([System.Drawing.Brushes]::YellowGreen, 25, 13, 14, 16)
            $graphics.FillRectangle([System.Drawing.Brushes]::Indigo, 23, 11, 18, 8)
            if (-not $back) {
                $graphics.FillRectangle([System.Drawing.Brushes]::White, 27, 20, 3, 2)
                $graphics.FillRectangle([System.Drawing.Brushes]::White, 35, 20, 3, 2)
            }
            $swordX = if ($dx -lt 0) { 18 - $reach } else { 46 + $reach }
            $bladePen = New-Object System.Drawing.Pen ([System.Drawing.Color]::LightGreen), 4
            $graphics.DrawLine($bladePen, $swordX, 42, $swordX + ($(if ($dx -lt 0) { -7 } else { 7 })), 17 - $reach)
            $bladePen.Dispose()
        }
        'silver_surfer' {
            $graphics.FillEllipse([System.Drawing.Brushes]::LightGray, 17, 48, 30, 8)
            $graphics.DrawEllipse([System.Drawing.Pens]::White, 17, 48, 30, 8)
            $graphics.FillRectangle([System.Drawing.Brushes]::Silver, 24, 40, 6, 13)
            $graphics.FillRectangle([System.Drawing.Brushes]::Silver, 34, 40, 6, 13)
            $graphics.FillPolygon([System.Drawing.Brushes]::Silver, [System.Drawing.Point[]]@(
                [System.Drawing.Point]::new(22, 23), [System.Drawing.Point]::new(41, 23),
                [System.Drawing.Point]::new(38, 43), [System.Drawing.Point]::new(25, 43)))
            $graphics.FillEllipse([System.Drawing.Brushes]::LightGray, 25, 11, 14, 15)
            if (-not $back) {
                $graphics.FillRectangle([System.Drawing.Brushes]::White, 27, 18, 3, 2)
                $graphics.FillRectangle([System.Drawing.Brushes]::White, 35, 18, 3, 2)
            }
            if ($pulse -gt 0) {
                $cosmicPen = New-Object System.Drawing.Pen ([System.Drawing.Color]::LightCyan), 3
                $graphics.DrawEllipse($cosmicPen, 24 - $reach, 25 - $reach, 16 + $reach * 2, 16 + $reach * 2)
                $cosmicPen.Dispose()
            }
        }
    }
}

function Draw-StreetHero($graphics, [string]$hero, [int]$dx, [int]$dy, [float]$pulse) {
    $back = $dy -lt 0
    $reach = [Math]::Round(13 * $pulse)
    switch ($hero) {
        'daredevil' {
            $graphics.FillRectangle([System.Drawing.Brushes]::DarkRed, 24, 42, 7, 15)
            $graphics.FillRectangle([System.Drawing.Brushes]::DarkRed, 34, 42, 7, 15)
            $graphics.FillPolygon([System.Drawing.Brushes]::Firebrick, [System.Drawing.Point[]]@(
                [System.Drawing.Point]::new(21, 25), [System.Drawing.Point]::new(43, 25),
                [System.Drawing.Point]::new(39, 46), [System.Drawing.Point]::new(25, 46)))
            $graphics.FillEllipse([System.Drawing.Brushes]::Crimson, 24, 12, 16, 17)
            $graphics.FillPolygon([System.Drawing.Brushes]::Crimson, [System.Drawing.Point[]]@(
                [System.Drawing.Point]::new(25, 15), [System.Drawing.Point]::new(27, 7), [System.Drawing.Point]::new(31, 14),
                [System.Drawing.Point]::new(35, 14), [System.Drawing.Point]::new(38, 7), [System.Drawing.Point]::new(40, 16)))
            if (-not $back) { $graphics.FillRectangle([System.Drawing.Brushes]::Black, 26, 19, 13, 3) }
            $batonPen = New-Object System.Drawing.Pen ([System.Drawing.Color]::IndianRed), 3
            $graphics.DrawLine($batonPen, 20 - $reach, 31, 13 - $reach, 47)
            $graphics.DrawLine($batonPen, 44 + $reach, 31, 51 + $reach, 47)
            $batonPen.Dispose()
        }
        'moon_knight' {
            $graphics.FillRectangle([System.Drawing.Brushes]::LightGray, 24, 42, 7, 15)
            $graphics.FillRectangle([System.Drawing.Brushes]::LightGray, 34, 42, 7, 15)
            $graphics.FillPolygon([System.Drawing.Brushes]::WhiteSmoke, [System.Drawing.Point[]]@(
                [System.Drawing.Point]::new(20, 25), [System.Drawing.Point]::new(44, 25),
                [System.Drawing.Point]::new(40, 47), [System.Drawing.Point]::new(24, 47)))
            $graphics.FillPolygon([System.Drawing.Brushes]::Gainsboro, [System.Drawing.Point[]]@(
                [System.Drawing.Point]::new(24, 17), [System.Drawing.Point]::new(32, 7),
                [System.Drawing.Point]::new(40, 17), [System.Drawing.Point]::new(39, 28), [System.Drawing.Point]::new(25, 28)))
            if (-not $back) {
                $graphics.FillRectangle([System.Drawing.Brushes]::White, 27, 19, 3, 2)
                $graphics.FillRectangle([System.Drawing.Brushes]::White, 35, 19, 3, 2)
                $moonPen = New-Object System.Drawing.Pen ([System.Drawing.Color]::Silver), 2
                $graphics.DrawArc($moonPen, 28, 31, 9, 9, 55, 250)
                $moonPen.Dispose()
            }
            $graphics.FillPolygon([System.Drawing.Brushes]::Silver, [System.Drawing.Point[]]@(
                [System.Drawing.Point]::new(15 - $reach, 34), [System.Drawing.Point]::new(21 - $reach, 31),
                [System.Drawing.Point]::new(18 - $reach, 40)))
        }
        'blade' {
            $graphics.FillRectangle([System.Drawing.Brushes]::Black, 23, 42, 8, 15)
            $graphics.FillRectangle([System.Drawing.Brushes]::Black, 34, 42, 8, 15)
            $graphics.FillPolygon([System.Drawing.Brushes]::Black, [System.Drawing.Point[]]@(
                [System.Drawing.Point]::new(19, 24), [System.Drawing.Point]::new(45, 24),
                [System.Drawing.Point]::new(41, 51), [System.Drawing.Point]::new(23, 51)))
            $graphics.FillRectangle([System.Drawing.Brushes]::DarkRed, 28, 27, 8, 21)
            $graphics.FillEllipse([System.Drawing.Brushes]::SaddleBrown, 25, 12, 14, 15)
            if (-not $back) { $graphics.FillRectangle([System.Drawing.Brushes]::Black, 24, 17, 16, 4) }
            $swordPen = New-Object System.Drawing.Pen ([System.Drawing.Color]::Silver), 4
            $graphics.DrawLine($swordPen, 44 + $reach, 43, 52 + $reach, 12)
            $swordPen.Dispose()
            $graphics.DrawLine([System.Drawing.Pens]::DarkRed, 43 + $reach, 39, 51 + $reach, 42)
        }
        'ghost_rider' {
            $graphics.FillRectangle([System.Drawing.Brushes]::Black, 23, 42, 8, 15)
            $graphics.FillRectangle([System.Drawing.Brushes]::Black, 34, 42, 8, 15)
            $graphics.FillPolygon([System.Drawing.Brushes]::Black, [System.Drawing.Point[]]@(
                [System.Drawing.Point]::new(20, 25), [System.Drawing.Point]::new(44, 25),
                [System.Drawing.Point]::new(40, 47), [System.Drawing.Point]::new(24, 47)))
            $graphics.DrawLine([System.Drawing.Pens]::Silver, 22, 31, 42, 40)
            $graphics.FillEllipse([System.Drawing.Brushes]::Ivory, 25, 13, 14, 15)
            if (-not $back) {
                $graphics.FillRectangle([System.Drawing.Brushes]::Black, 27, 18, 3, 3)
                $graphics.FillRectangle([System.Drawing.Brushes]::Black, 35, 18, 3, 3)
            }
            $graphics.FillPolygon([System.Drawing.Brushes]::OrangeRed, [System.Drawing.Point[]]@(
                [System.Drawing.Point]::new(24, 16), [System.Drawing.Point]::new(27, 5), [System.Drawing.Point]::new(31, 11),
                [System.Drawing.Point]::new(34, 2), [System.Drawing.Point]::new(37, 12), [System.Drawing.Point]::new(42, 6), [System.Drawing.Point]::new(40, 18)))
            $chainPen = New-Object System.Drawing.Pen ([System.Drawing.Color]::LightGray), 2
            $graphics.DrawArc($chainPen, 8 - $reach, 27, 20 + $reach, 22, 80, 220)
            $chainPen.Dispose()
        }
        'luke_cage' {
            $graphics.FillRectangle([System.Drawing.Brushes]::MidnightBlue, 23, 42, 8, 15)
            $graphics.FillRectangle([System.Drawing.Brushes]::MidnightBlue, 34, 42, 8, 15)
            $graphics.FillPolygon([System.Drawing.Brushes]::Gold, [System.Drawing.Point[]]@(
                [System.Drawing.Point]::new(19, 24), [System.Drawing.Point]::new(45, 24),
                [System.Drawing.Point]::new(40, 47), [System.Drawing.Point]::new(24, 47)))
            $graphics.FillEllipse([System.Drawing.Brushes]::SaddleBrown, 24, 11, 16, 16)
            if (-not $back) {
                $graphics.FillRectangle([System.Drawing.Brushes]::Black, 27, 18, 3, 2)
                $graphics.FillRectangle([System.Drawing.Brushes]::Black, 35, 18, 3, 2)
            }
            $graphics.FillEllipse([System.Drawing.Brushes]::SaddleBrown, 10 - $reach, 30, 13, 13)
            $graphics.FillEllipse([System.Drawing.Brushes]::SaddleBrown, 42 + $reach, 30, 13, 13)
        }
        'shang_chi' {
            $graphics.FillRectangle([System.Drawing.Brushes]::Black, 23, 42, 8, 15)
            $graphics.FillRectangle([System.Drawing.Brushes]::Black, 34, 42, 8, 15)
            $graphics.FillPolygon([System.Drawing.Brushes]::Crimson, [System.Drawing.Point[]]@(
                [System.Drawing.Point]::new(20, 24), [System.Drawing.Point]::new(44, 24),
                [System.Drawing.Point]::new(39, 47), [System.Drawing.Point]::new(25, 47)))
            $graphics.FillRectangle([System.Drawing.Brushes]::Black, 29, 25, 6, 22)
            $graphics.FillEllipse([System.Drawing.Brushes]::NavajoWhite, 25, 12, 14, 15)
            $graphics.FillRectangle([System.Drawing.Brushes]::Black, 24, 10, 16, 7)
            $ringPen = New-Object System.Drawing.Pen ([System.Drawing.Color]::Gold), 2
            for ($i = 0; $i -lt 5; $i++) {
                $graphics.DrawEllipse($ringPen, 11 - $reach + $i, 28 + $i * 4, 9, 5)
                $graphics.DrawEllipse($ringPen, 44 + $reach - $i, 28 + $i * 4, 9, 5)
            }
            $ringPen.Dispose()
        }
        'she_hulk' {
            $graphics.FillRectangle([System.Drawing.Brushes]::Purple, 22, 42, 9, 15)
            $graphics.FillRectangle([System.Drawing.Brushes]::Purple, 34, 42, 9, 15)
            $graphics.FillPolygon([System.Drawing.Brushes]::DarkMagenta, [System.Drawing.Point[]]@(
                [System.Drawing.Point]::new(18, 25), [System.Drawing.Point]::new(46, 25),
                [System.Drawing.Point]::new(41, 47), [System.Drawing.Point]::new(23, 47)))
            $graphics.FillEllipse([System.Drawing.Brushes]::YellowGreen, 24, 11, 16, 17)
            $graphics.FillRectangle([System.Drawing.Brushes]::DarkGreen, 23, 9, 18, 8)
            if (-not $back) {
                $graphics.FillRectangle([System.Drawing.Brushes]::White, 27, 19, 3, 2)
                $graphics.FillRectangle([System.Drawing.Brushes]::White, 35, 19, 3, 2)
            }
            $graphics.FillEllipse([System.Drawing.Brushes]::YellowGreen, 8 - $reach, 29, 15, 15)
            $graphics.FillEllipse([System.Drawing.Brushes]::YellowGreen, 42 + $reach, 29, 15, 15)
        }
    }
}

function Draw-ReserveHero($graphics, [string]$hero, [int]$dx, [int]$dy, [float]$pulse) {
    $back = $dy -lt 0
    $reach = [Math]::Round(14 * $pulse)
    $body = [System.Drawing.Brushes]::DarkSlateGray
    $legs = [System.Drawing.Brushes]::Black
    $skin = [System.Drawing.Brushes]::NavajoWhite
    switch ($hero) {
        'wolverine' { $body = [System.Drawing.Brushes]::Gold; $legs = [System.Drawing.Brushes]::DarkBlue; $skin = [System.Drawing.Brushes]::Gold }
        'jean_grey' { $body = [System.Drawing.Brushes]::DarkGreen; $legs = [System.Drawing.Brushes]::Gold; $skin = [System.Drawing.Brushes]::NavajoWhite }
        'cyclops' { $body = [System.Drawing.Brushes]::MidnightBlue; $legs = [System.Drawing.Brushes]::MidnightBlue; $skin = [System.Drawing.Brushes]::NavajoWhite }
        'storm' { $body = [System.Drawing.Brushes]::WhiteSmoke; $legs = [System.Drawing.Brushes]::Black; $skin = [System.Drawing.Brushes]::SaddleBrown }
        'domino' { $body = [System.Drawing.Brushes]::Black; $legs = [System.Drawing.Brushes]::Black; $skin = [System.Drawing.Brushes]::WhiteSmoke }
        'scarlet_witch' { $body = [System.Drawing.Brushes]::Crimson; $legs = [System.Drawing.Brushes]::DarkRed; $skin = [System.Drawing.Brushes]::NavajoWhite }
        'ant_man' { $body = [System.Drawing.Brushes]::Firebrick; $legs = [System.Drawing.Brushes]::Black; $skin = [System.Drawing.Brushes]::Silver }
        'winter_soldier' { $body = [System.Drawing.Brushes]::Black; $legs = [System.Drawing.Brushes]::DarkSlateGray; $skin = [System.Drawing.Brushes]::NavajoWhite }
    }
    $graphics.FillRectangle($legs, 23, 42, 8, 15)
    $graphics.FillRectangle($legs, 34, 42, 8, 15)
    $graphics.FillPolygon($body, [System.Drawing.Point[]]@(
        [System.Drawing.Point]::new(20, 24), [System.Drawing.Point]::new(44, 24),
        [System.Drawing.Point]::new(40, 47), [System.Drawing.Point]::new(24, 47)))
    $graphics.DrawPolygon([System.Drawing.Pens]::Gray, [System.Drawing.Point[]]@(
        [System.Drawing.Point]::new(20, 24), [System.Drawing.Point]::new(44, 24),
        [System.Drawing.Point]::new(40, 47), [System.Drawing.Point]::new(24, 47)))
    $graphics.FillEllipse($skin, 24, 11, 16, 17)
    switch ($hero) {
        'wolverine' {
            $graphics.FillPolygon([System.Drawing.Brushes]::DarkBlue, [System.Drawing.Point[]]@(
                [System.Drawing.Point]::new(24, 18), [System.Drawing.Point]::new(22, 7), [System.Drawing.Point]::new(29, 14),
                [System.Drawing.Point]::new(35, 14), [System.Drawing.Point]::new(42, 7), [System.Drawing.Point]::new(40, 19)))
            if (-not $back) { $graphics.FillRectangle([System.Drawing.Brushes]::White, 27, 18, 3, 2); $graphics.FillRectangle([System.Drawing.Brushes]::White, 35, 18, 3, 2) }
            $clawPen = New-Object System.Drawing.Pen ([System.Drawing.Color]::Silver), 2
            for ($i = 0; $i -lt 3; $i++) { $graphics.DrawLine($clawPen, 15 - $reach, 31 + $i * 3, 4 - $reach, 28 + $i * 3); $graphics.DrawLine($clawPen, 49 + $reach, 31 + $i * 3, 60 + $reach, 28 + $i * 3) }
            $clawPen.Dispose()
        }
        'jean_grey' {
            $graphics.FillPolygon([System.Drawing.Brushes]::DarkRed, [System.Drawing.Point[]]@(
                [System.Drawing.Point]::new(23, 18), [System.Drawing.Point]::new(25, 8), [System.Drawing.Point]::new(40, 10), [System.Drawing.Point]::new(42, 23)))
            $graphics.FillPolygon([System.Drawing.Brushes]::Gold, (New-StarPoints 32 34 5 2))
            if ($pulse -gt 0) { $graphics.FillEllipse([System.Drawing.Brushes]::HotPink, 8 - $reach, 28, 13, 13); $graphics.FillEllipse([System.Drawing.Brushes]::HotPink, 43 + $reach, 28, 13, 13) }
        }
        'cyclops' {
            $graphics.FillRectangle([System.Drawing.Brushes]::Gold, 29, 25, 6, 22)
            $graphics.FillRectangle([System.Drawing.Brushes]::Gold, 23, 16, 18, 6)
            if (-not $back) { $graphics.FillRectangle([System.Drawing.Brushes]::Red, 25, 18, 14, 2) }
            if ($pulse -gt 0) { $beamPen = New-Object System.Drawing.Pen ([System.Drawing.Color]::Red), 4; $graphics.DrawLine($beamPen, 32, 19, 32 + ($(if ($dx -eq 0) { 1 } else { $dx })) * (17 + $reach), 19 + $dy * 17); $beamPen.Dispose() }
        }
        'storm' {
            $graphics.FillPolygon([System.Drawing.Brushes]::White, [System.Drawing.Point[]]@(
                [System.Drawing.Point]::new(22, 16), [System.Drawing.Point]::new(26, 5), [System.Drawing.Point]::new(31, 10), [System.Drawing.Point]::new(36, 4), [System.Drawing.Point]::new(43, 17)))
            $graphics.FillPolygon([System.Drawing.Brushes]::LightGray, [System.Drawing.Point[]]@(
                [System.Drawing.Point]::new(21, 26), [System.Drawing.Point]::new(7 - $reach, 40), [System.Drawing.Point]::new(24, 44)))
            $graphics.FillPolygon([System.Drawing.Brushes]::LightGray, [System.Drawing.Point[]]@(
                [System.Drawing.Point]::new(43, 26), [System.Drawing.Point]::new(57 + $reach, 40), [System.Drawing.Point]::new(40, 44)))
        }
        'domino' {
            $graphics.FillPolygon([System.Drawing.Brushes]::Black, [System.Drawing.Point[]]@(
                [System.Drawing.Point]::new(24, 17), [System.Drawing.Point]::new(25, 8), [System.Drawing.Point]::new(40, 10), [System.Drawing.Point]::new(41, 22)))
            if (-not $back) { $graphics.FillEllipse([System.Drawing.Brushes]::Black, 26, 16, 6, 7); $graphics.FillRectangle([System.Drawing.Brushes]::White, 35, 18, 3, 2) }
            $graphics.FillRectangle([System.Drawing.Brushes]::DimGray, 12 - $reach, 30, 8, 13)
            $graphics.FillRectangle([System.Drawing.Brushes]::DimGray, 44 + $reach, 30, 8, 13)
        }
        'scarlet_witch' {
            $graphics.FillPolygon([System.Drawing.Brushes]::DarkRed, [System.Drawing.Point[]]@(
                [System.Drawing.Point]::new(23, 17), [System.Drawing.Point]::new(25, 6), [System.Drawing.Point]::new(32, 13), [System.Drawing.Point]::new(39, 6), [System.Drawing.Point]::new(41, 18)))
            $graphics.FillPolygon([System.Drawing.Brushes]::DarkRed, [System.Drawing.Point[]]@(
                [System.Drawing.Point]::new(20, 26), [System.Drawing.Point]::new(13, 54), [System.Drawing.Point]::new(51, 54), [System.Drawing.Point]::new(44, 26)))
            if ($pulse -gt 0) { $graphics.FillEllipse([System.Drawing.Brushes]::DeepPink, 8 - $reach, 27, 14, 14); $graphics.FillEllipse([System.Drawing.Brushes]::DeepPink, 42 + $reach, 27, 14, 14) }
        }
        'ant_man' {
            $graphics.FillRectangle([System.Drawing.Brushes]::Silver, 28, 26, 8, 19)
            $graphics.FillEllipse([System.Drawing.Brushes]::Firebrick, 23, 10, 18, 18)
            $graphics.FillRectangle([System.Drawing.Brushes]::Silver, 22, 15, 20, 8)
            $graphics.DrawLine([System.Drawing.Pens]::Silver, 26, 12, 22, 5); $graphics.DrawLine([System.Drawing.Pens]::Silver, 38, 12, 42, 5)
            if (-not $back) { $graphics.FillRectangle([System.Drawing.Brushes]::Red, 26, 18, 4, 3); $graphics.FillRectangle([System.Drawing.Brushes]::Red, 35, 18, 4, 3) }
        }
        'winter_soldier' {
            $graphics.FillPolygon([System.Drawing.Brushes]::Silver, [System.Drawing.Point[]]@(
                [System.Drawing.Point]::new(41, 25), [System.Drawing.Point]::new(48 + $reach, 29), [System.Drawing.Point]::new(45 + $reach, 43), [System.Drawing.Point]::new(38, 40)))
            $graphics.DrawLine([System.Drawing.Pens]::Black, 42, 27, 46 + $reach, 40)
            $graphics.FillRectangle([System.Drawing.Brushes]::DarkSlateGray, 8 - $reach, 29, 25, 6)
            $graphics.FillRectangle([System.Drawing.Brushes]::SaddleBrown, 17 - $reach, 35, 12, 4)
            $graphics.FillPolygon([System.Drawing.Brushes]::SaddleBrown, [System.Drawing.Point[]]@(
                [System.Drawing.Point]::new(23, 17), [System.Drawing.Point]::new(25, 8), [System.Drawing.Point]::new(40, 10), [System.Drawing.Point]::new(42, 22)))
        }
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
        'hulk' { Draw-Hulk $graphics $vector[0] $vector[1] $pulse }
        'black_widow' { Draw-Widow $graphics $vector[0] $vector[1] $pulse }
        'hawkeye' { Draw-Hawkeye $graphics $vector[0] $vector[1] $pulse }
        'black_panther' { Draw-Panther $graphics $vector[0] $vector[1] $pulse }
        'vision' { Draw-Vision $graphics $vector[0] $vector[1] $pulse }
        'falcon' { Draw-Falcon $graphics $vector[0] $vector[1] $pulse }
        'captain_marvel' { Draw-CosmicHero $graphics $hero $vector[0] $vector[1] $pulse }
        'star_lord' { Draw-CosmicHero $graphics $hero $vector[0] $vector[1] $pulse }
        'groot' { Draw-CosmicHero $graphics $hero $vector[0] $vector[1] $pulse }
        'gamora' { Draw-CosmicHero $graphics $hero $vector[0] $vector[1] $pulse }
        'silver_surfer' { Draw-CosmicHero $graphics $hero $vector[0] $vector[1] $pulse }
        'daredevil' { Draw-StreetHero $graphics $hero $vector[0] $vector[1] $pulse }
        'moon_knight' { Draw-StreetHero $graphics $hero $vector[0] $vector[1] $pulse }
        'blade' { Draw-StreetHero $graphics $hero $vector[0] $vector[1] $pulse }
        'ghost_rider' { Draw-StreetHero $graphics $hero $vector[0] $vector[1] $pulse }
        'luke_cage' { Draw-StreetHero $graphics $hero $vector[0] $vector[1] $pulse }
        'shang_chi' { Draw-StreetHero $graphics $hero $vector[0] $vector[1] $pulse }
        'she_hulk' { Draw-StreetHero $graphics $hero $vector[0] $vector[1] $pulse }
        'wolverine' { Draw-ReserveHero $graphics $hero $vector[0] $vector[1] $pulse }
        'jean_grey' { Draw-ReserveHero $graphics $hero $vector[0] $vector[1] $pulse }
        'cyclops' { Draw-ReserveHero $graphics $hero $vector[0] $vector[1] $pulse }
        'storm' { Draw-ReserveHero $graphics $hero $vector[0] $vector[1] $pulse }
        'domino' { Draw-ReserveHero $graphics $hero $vector[0] $vector[1] $pulse }
        'scarlet_witch' { Draw-ReserveHero $graphics $hero $vector[0] $vector[1] $pulse }
        'ant_man' { Draw-ReserveHero $graphics $hero $vector[0] $vector[1] $pulse }
        'winter_soldier' { Draw-ReserveHero $graphics $hero $vector[0] $vector[1] $pulse }
    }
    Save-ScaledSprite $bitmap $path $size
    $graphics.Dispose()
    $bitmap.Dispose()
}

$heroes = @('capitan_america', 'thor', 'doctor_strange', 'hulk', 'black_widow', 'hawkeye', 'black_panther', 'vision', 'falcon', 'captain_marvel', 'star_lord', 'groot', 'gamora', 'silver_surfer', 'daredevil', 'moon_knight', 'blade', 'ghost_rider', 'luke_cage', 'shang_chi', 'she_hulk', 'wolverine', 'jean_grey', 'cyclops', 'storm', 'domino', 'scarlet_witch', 'ant_man', 'winter_soldier')
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

Write-Host "Sprites centrales generados: $($heroes.Count) heroes, $($heroes.Count * 18) assets PNG"
