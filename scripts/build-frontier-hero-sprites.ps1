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
    war_machine = @{ body = '#4f5968'; accent = '#9bd1ff'; skin = '#c2a27a'; effect = 'missile' }
    nick_fury = @{ body = '#111827'; accent = '#88aaff'; skin = '#7a4f2c'; effect = 'mark' }
    wasp = @{ body = '#1f1a24'; accent = '#ffd447'; skin = '#c99768'; effect = 'wing' }
    nova = @{ body = '#1d4ed8'; accent = '#ffdf6f'; skin = '#c99768'; effect = 'star' }
    quake = @{ body = '#243b53'; accent = '#76e4f7'; skin = '#c99768'; effect = 'wave' }
    medusa = @{ body = '#5b2245'; accent = '#ff5d8f'; skin = '#c99768'; effect = 'hair' }
    namor = @{ body = '#0e7490'; accent = '#40c9ff'; skin = '#c99768'; effect = 'trident' }
    iron_fist = @{ body = '#166534'; accent = '#f7d04a'; skin = '#c99768'; effect = 'fist' }
    punisher = @{ body = '#1f2937'; accent = '#d9d9d9'; skin = '#c99768'; effect = 'rifle' }
    elektra = @{ body = '#991b1b'; accent = '#ff3b5f'; skin = '#c99768'; effect = 'sai' }
    jessica_jones = @{ body = '#243447'; accent = '#b47cff'; skin = '#c99768'; effect = 'impact' }
    cloak = @{ body = '#11113f'; accent = '#5d4bff'; skin = '#2f1b45'; effect = 'cloak' }
    dagger = @{ body = '#f8fafc'; accent = '#fff2a8'; skin = '#c99768'; effect = 'dagger' }
    magik = @{ body = '#3b0764'; accent = '#ff9cff'; skin = '#c99768'; effect = 'sword' }
    iceman = @{ body = '#a7f3ff'; accent = '#ffffff'; skin = '#dff9ff'; effect = 'ice' }
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
        'missile' {
            $graphics.FillRectangle($accentBrush, $x - 4, $y - 3, 12, 6)
            $graphics.DrawLine($accentPen, 42, 29, $x, $y)
        }
        'mark' {
            $graphics.DrawEllipse($accentPen, $x - 8, $y - 8, 16, 16)
            $graphics.DrawLine($accentPen, $x - 11, $y, $x + 11, $y)
            $graphics.DrawLine($accentPen, $x, $y - 11, $x, $y + 11)
        }
        'wing' {
            $graphics.FillPolygon($accentBrush, [System.Drawing.Point[]]@(
                [System.Drawing.Point]::new(20 - $reach, 25), [System.Drawing.Point]::new(5 - $reach, 36), [System.Drawing.Point]::new(22, 39)))
            $graphics.FillPolygon($accentBrush, [System.Drawing.Point[]]@(
                [System.Drawing.Point]::new(44 + $reach, 25), [System.Drawing.Point]::new(59 + $reach, 36), [System.Drawing.Point]::new(42, 39)))
        }
        'star' { Draw-Star $graphics $x $y (8 + [Math]::Round(3 * $pulse)) $accentBrush }
        'wave' {
            $graphics.DrawArc($accentPen, $x - 16, $y - 8, 28, 16, 20, 260)
            $graphics.DrawArc($accentPen, $x - 10, $y - 5, 18, 10, 20, 260)
        }
        'hair' {
            for ($i = 0; $i -lt 4; $i++) { $graphics.DrawBezier($accentPen, 26 + $i * 3, 14, 12 - $reach, 23 + $i * 4, 12 + $reach, 42, 27, 44) }
        }
        'trident' {
            $graphics.DrawLine($accentPen, $x, $y + 10, $x, $y - 16)
            $graphics.DrawLine($accentPen, $x - 7, $y - 12, $x + 7, $y - 12)
            $graphics.DrawLine($accentPen, $x - 7, $y - 12, $x - 7, $y - 18)
            $graphics.DrawLine($accentPen, $x + 7, $y - 12, $x + 7, $y - 18)
        }
        'fist' { $graphics.FillEllipse($accentBrush, $x - 8, $y - 8, 16, 16) }
        'rifle' {
            $graphics.FillRectangle($accentBrush, $x - 20, $y - 4, 28, 6)
            $graphics.FillRectangle($accentBrush, $x - 6, $y + 2, 10, 8)
        }
        'sai' {
            $graphics.DrawLine($accentPen, $x - 9, $y + 10, $x - 2, $y - 14)
            $graphics.DrawLine($accentPen, $x + 9, $y + 10, $x + 2, $y - 14)
        }
        'impact' {
            $graphics.FillEllipse($accentBrush, $x - 9, $y - 9, 18, 18)
            Draw-Star $graphics $x $y 12 $accentBrush
        }
        'cloak' {
            $graphics.FillPie($accentBrush, $x - 14, $y - 14, 28, 28, 20, 280)
        }
        'dagger' {
            $graphics.DrawLine($accentPen, $x - 14, $y + 12, $x + 11, $y - 13)
            Draw-Star $graphics ($x + 12) ($y - 14) 5 $accentBrush
        }
        'sword' {
            $graphics.DrawLine($accentPen, $x - 8, $y + 16, $x + 12, $y - 18)
            $graphics.DrawLine($accentPen, $x - 12, $y + 4, $x + 1, $y + 12)
        }
        'ice' {
            $graphics.FillPolygon($accentBrush, [System.Drawing.Point[]]@(
                [System.Drawing.Point]::new($x, $y - 14), [System.Drawing.Point]::new($x + 11, $y), [System.Drawing.Point]::new($x, $y + 14), [System.Drawing.Point]::new($x - 11, $y)))
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

Write-Host "Sprites frontera generados: $($heroes.Count) heroes, $($heroes.Count * 18) assets PNG"
