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
    }
    Save-ScaledSprite $bitmap $path $size
    $graphics.Dispose()
    $bitmap.Dispose()
}

$heroes = @('capitan_america', 'thor', 'doctor_strange', 'hulk', 'black_widow', 'hawkeye', 'black_panther', 'vision', 'falcon')
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
