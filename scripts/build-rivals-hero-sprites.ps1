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
    black_cat = @{ body = '#111827'; accent = '#f8fafc'; skin = '#f0c7a8'; effect = 'claw' }
    elsa_bloodstone = @{ body = '#5b1f1f'; accent = '#ff3b5f'; skin = '#f0c7a8'; effect = 'rifle' }
    gambit = @{ body = '#3b1d5f'; accent = '#d86cff'; skin = '#c99768'; effect = 'cards' }
    hela = @{ body = '#0f172a'; accent = '#69e58c'; skin = '#d1d5db'; effect = 'spear' }
    human_torch = @{ body = '#b91c1c'; accent = '#ffb020'; skin = '#ffd08a'; effect = 'flame' }
    the_hood = @{ body = '#541b2d'; accent = '#b865ff'; skin = '#c99768'; effect = 'hood' }
    psylocke = @{ body = '#4c1d95'; accent = '#ff8cff'; skin = '#c99768'; effect = 'katana' }
    squirrel_girl = @{ body = '#92400e'; accent = '#f59e0b'; skin = '#f0c7a8'; effect = 'burst' }
    venom = @{ body = '#050609'; accent = '#ffffff'; skin = '#111827'; effect = 'symbiote' }
    angela = @{ body = '#7f1d1d'; accent = '#ffd166'; skin = '#f0c7a8'; effect = 'blade' }
    devil_dinosaur = @{ body = '#991b1b'; accent = '#ef4444'; skin = '#b91c1c'; effect = 'stomp' }
    emma_frost = @{ body = '#f8fafc'; accent = '#a7f3ff'; skin = '#f0c7a8'; effect = 'diamond' }
    magneto = @{ body = '#581c87'; accent = '#d946ef'; skin = '#c99768'; effect = 'magnet' }
    peni_parker = @{ body = '#1d4ed8'; accent = '#40c9ff'; skin = '#f0c7a8'; effect = 'spider' }
    adam_warlock = @{ body = '#7c2d12'; accent = '#facc15'; skin = '#f0c7a8'; effect = 'star' }
    deadpool = @{ body = '#991b1b'; accent = '#111827'; skin = '#c99768'; effect = 'dual' }
    invisible_woman = @{ body = '#dbeafe'; accent = '#a7f3ff'; skin = '#f0c7a8'; effect = 'shield' }
    jeff_the_land_shark = @{ body = '#38bdf8'; accent = '#67e8f9'; skin = '#7dd3fc'; effect = 'wave' }
    jubilee = @{ body = '#facc15'; accent = '#f472b6'; skin = '#f0c7a8'; effect = 'spark' }
    loki = @{ body = '#14532d'; accent = '#7ee081'; skin = '#c99768'; effect = 'illusion' }
    luna_snow = @{ body = '#1e3a8a'; accent = '#93c5fd'; skin = '#f0c7a8'; effect = 'ice' }
    mantis = @{ body = '#166534'; accent = '#86efac'; skin = '#c99768'; effect = 'empathy' }
    mister_fantastic = @{ body = '#1d4ed8'; accent = '#5be7ff'; skin = '#f0c7a8'; effect = 'stretch' }
    rocket_raccoon = @{ body = '#7c2d12'; accent = '#f97316'; skin = '#a16207'; effect = 'rocket' }
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
        'claw' {
            $graphics.DrawLine($accentPen, $x - 9, $y + 8, $x + 8, $y - 9)
            $graphics.DrawLine($accentPen, $x - 2, $y + 10, $x + 13, $y - 5)
        }
        'rifle' {
            $graphics.FillRectangle($accentBrush, $x - 18, $y - 4, 28, 7)
            $graphics.FillRectangle($accentBrush, $x - 7, $y + 2, 9, 8)
        }
        'cards' {
            for ($i = 0; $i -lt 3; $i++) { $graphics.FillRectangle($accentBrush, $x - 9 + $i * 7, $y - 10 + $i * 2, 6, 10) }
        }
        'spear' {
            $graphics.DrawLine($accentPen, $x - 13, $y + 14, $x + 12, $y - 15)
            $graphics.FillPolygon($accentBrush, [System.Drawing.Point[]]@(
                [System.Drawing.Point]::new($x + 13, $y - 18),
                [System.Drawing.Point]::new($x + 19, $y - 8),
                [System.Drawing.Point]::new($x + 8, $y - 11)))
        }
        'flame' {
            $graphics.FillEllipse($accentBrush, $x - 10, $y - 12 - $reach, 20, 24 + $reach)
            Draw-Star $graphics $x ($y - 2) 6 $accentBrush
        }
        'hood' {
            $graphics.DrawArc($accentPen, $x - 13, $y - 13, 26, 26, 210, 300)
            $graphics.FillEllipse($accentBrush, $x - 4, $y - 4, 8, 8)
        }
        'katana' {
            $graphics.DrawLine($accentPen, $x - 10, $y + 15, $x + 14, $y - 17)
            Draw-Star $graphics ($x + 15) ($y - 18) 5 $accentBrush
        }
        'burst' {
            Draw-Star $graphics $x $y (11 + [Math]::Round(3 * $pulse)) $accentBrush
        }
        'symbiote' {
            $graphics.FillEllipse($accentBrush, $x - 11, $y - 7, 22, 14)
            $graphics.DrawArc($accentPen, $x - 15, $y - 14, 30, 28, 25, 260)
        }
        'blade' {
            $graphics.DrawLine($accentPen, $x - 12, $y + 12, $x + 11, $y - 13)
            $graphics.DrawLine($accentPen, $x - 9, $y - 8, $x + 8, $y + 8)
        }
        'stomp' {
            $graphics.FillRectangle($accentBrush, $x - 12, $y - 8, 24, 16)
            $graphics.DrawArc($accentPen, $x - 18, $y - 18, 36, 36, 20, 150)
        }
        'diamond' {
            $graphics.FillPolygon($accentBrush, [System.Drawing.Point[]]@(
                [System.Drawing.Point]::new($x, $y - 15),
                [System.Drawing.Point]::new($x + 12, $y),
                [System.Drawing.Point]::new($x, $y + 15),
                [System.Drawing.Point]::new($x - 12, $y)))
        }
        'magnet' {
            $graphics.DrawArc($accentPen, $x - 14, $y - 14, 28, 28, 20, 320)
            $graphics.FillRectangle($accentBrush, $x - 12, $y + 4, 7, 9)
            $graphics.FillRectangle($accentBrush, $x + 5, $y + 4, 7, 9)
        }
        'spider' {
            $graphics.DrawEllipse($accentPen, $x - 10, $y - 10, 20, 20)
            for ($i = -1; $i -le 1; $i += 2) { $graphics.DrawLine($accentPen, $x, $y, $x + 16 * $i, $y - 8) }
        }
        'star' { Draw-Star $graphics $x $y (10 + [Math]::Round(2 * $pulse)) $accentBrush }
        'dual' {
            $graphics.FillRectangle($accentBrush, $x - 16, $y - 6, 14, 5)
            $graphics.FillRectangle($accentBrush, $x + 2, $y + 2, 14, 5)
        }
        'shield' {
            $graphics.DrawEllipse($accentPen, $x - 15, $y - 15, 30, 30)
            $graphics.DrawEllipse($accentPen, $x - 8, $y - 8, 16, 16)
        }
        'wave' {
            $graphics.DrawArc($accentPen, $x - 18, $y - 10, 32, 20, 20, 260)
            $graphics.DrawArc($accentPen, $x - 10, $y - 6, 20, 12, 20, 260)
        }
        'spark' {
            for ($i = 0; $i -lt 5; $i++) { Draw-Star $graphics ($x - 12 + $i * 6) ($y - 6 + ($i % 2) * 7) 4 $accentBrush }
        }
        'illusion' {
            $graphics.DrawEllipse($accentPen, $x - 14, $y - 7, 28, 14)
            $graphics.FillEllipse($accentBrush, $x - 4, $y - 4, 8, 8)
        }
        'ice' {
            $graphics.FillPolygon($accentBrush, [System.Drawing.Point[]]@(
                [System.Drawing.Point]::new($x, $y - 14), [System.Drawing.Point]::new($x + 11, $y), [System.Drawing.Point]::new($x, $y + 14), [System.Drawing.Point]::new($x - 11, $y)))
        }
        'empathy' {
            $graphics.DrawArc($accentPen, $x - 12, $y - 12, 24, 24, 200, 140)
            $graphics.DrawArc($accentPen, $x - 5, $y - 12, 24, 24, 200, 140)
        }
        'stretch' {
            $graphics.DrawBezier($accentPen, 37, 29, $x - 22, $y - 18, $x + 20, $y + 18, $x, $y)
            $graphics.FillEllipse($accentBrush, $x - 7, $y - 7, 14, 14)
        }
        'rocket' {
            $graphics.FillEllipse($accentBrush, $x - 7, $y - 7, 14, 14)
            $graphics.DrawLine($accentPen, $x - 18, $y + 11, $x + 9, $y - 9)
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
    if ($hero -eq 'devil_dinosaur') {
        $graphics.FillRectangle($bodyBrush, 13, 24, 38, 25)
        $graphics.FillEllipse($skinBrush, 39, 17, 16, 14)
        $graphics.FillRectangle([System.Drawing.Brushes]::Black, 20, 47, 7, 10)
        $graphics.FillRectangle([System.Drawing.Brushes]::Black, 40, 47, 7, 10)
    } elseif ($hero -eq 'jeff_the_land_shark') {
        $graphics.FillEllipse($bodyBrush, 17, 20, 30, 28)
        $graphics.FillPolygon($accentBrush, [System.Drawing.Point[]]@(
            [System.Drawing.Point]::new(28, 20), [System.Drawing.Point]::new(36, 20), [System.Drawing.Point]::new(32, 9)))
    }
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

Write-Host "Sprites Rivales generados: $($heroes.Count) heroes, $($heroes.Count * 18) assets PNG"
