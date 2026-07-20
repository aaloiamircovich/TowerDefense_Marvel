Add-Type -AssemblyName System.Drawing

$root = Split-Path -Parent $PSScriptRoot
$baseDir = Join-Path $root 'assets/images/enemies/aim_scientist'
$idleDir = Join-Path $baseDir 'idle'
$walkDir = Join-Path $baseDir 'walk'

New-Item -ItemType Directory -Force -Path $baseDir, $idleDir | Out-Null
foreach ($direction in @('south', 'north', 'east', 'west')) {
    New-Item -ItemType Directory -Force -Path (Join-Path $walkDir $direction) | Out-Null
}

function New-Brush($hex) {
    return New-Object System.Drawing.SolidBrush ([System.Drawing.ColorTranslator]::FromHtml($hex))
}

function Draw-AimScientist($path, $direction = 'south', $step = 0) {
    $size = 72
    $bitmap = New-Object System.Drawing.Bitmap $size, $size
    $graphics = [System.Drawing.Graphics]::FromImage($bitmap)
    $graphics.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::None
    $graphics.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::NearestNeighbor
    $graphics.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::Half
    $graphics.Clear([System.Drawing.Color]::Transparent)

    $shadow = New-Brush '#071018'
    $suit = New-Brush '#ffd23f'
    $suitDark = New-Brush '#c89b18'
    $visor = New-Brush '#58d6ff'
    $glove = New-Brush '#101820'
    $accent = New-Brush '#fca311'
    $line = New-Object System.Drawing.Pen ([System.Drawing.ColorTranslator]::FromHtml('#101820')), 3
    $tube = New-Object System.Drawing.Pen ([System.Drawing.ColorTranslator]::FromHtml('#58d6ff')), 2

    $bob = if ($step % 2 -eq 0) { 0 } else { 2 }
    $lean = 0
    if ($direction -eq 'east') { $lean = 2 }
    if ($direction -eq 'west') { $lean = -2 }

    $graphics.FillEllipse($shadow, 19, 54, 34, 8)

    $graphics.FillRectangle($suitDark, 25 + $lean, 27 + $bob, 22, 24)
    $graphics.DrawRectangle($line, 25 + $lean, 27 + $bob, 22, 24)
    $graphics.FillRectangle($accent, 32 + $lean, 31 + $bob, 8, 13)

    $graphics.FillEllipse($suit, 20 + $lean, 11 + $bob, 32, 28)
    $graphics.DrawEllipse($line, 20 + $lean, 11 + $bob, 32, 28)
    $graphics.FillRectangle($visor, 27 + $lean, 20 + $bob, 18, 7)
    $graphics.DrawRectangle($line, 27 + $lean, 20 + $bob, 18, 7)

    $graphics.DrawLine($tube, 24 + $lean, 34 + $bob, 16 + $lean, 43 + $bob)
    $graphics.DrawLine($tube, 48 + $lean, 34 + $bob, 56 + $lean, 43 + $bob)

    $graphics.FillRectangle($suit, 14 + $lean, 35 + $bob, 9, 16)
    $graphics.FillRectangle($suit, 49 + $lean, 35 + $bob, 9, 16)
    $graphics.DrawRectangle($line, 14 + $lean, 35 + $bob, 9, 16)
    $graphics.DrawRectangle($line, 49 + $lean, 35 + $bob, 9, 16)
    $graphics.FillEllipse($glove, 13 + $lean, 49 + $bob, 11, 8)
    $graphics.FillEllipse($glove, 48 + $lean, 49 + $bob, 11, 8)

    $graphics.FillRectangle($suitDark, 25 + $lean, 50 + $bob, 8, 10)
    $graphics.FillRectangle($suitDark, 39 + $lean, 50 + $bob, 8, 10)
    $graphics.DrawRectangle($line, 25 + $lean, 50 + $bob, 8, 10)
    $graphics.DrawRectangle($line, 39 + $lean, 50 + $bob, 8, 10)

    $graphics.FillRectangle($glove, 21 + $lean, 59 + $bob, 13, 5)
    $graphics.FillRectangle($glove, 39 + $lean, 59 + $bob, 13, 5)

    $bitmap.Save($path, [System.Drawing.Imaging.ImageFormat]::Png)
    $graphics.Dispose()
    $bitmap.Dispose()
    $shadow.Dispose()
    $suit.Dispose()
    $suitDark.Dispose()
    $visor.Dispose()
    $glove.Dispose()
    $accent.Dispose()
    $line.Dispose()
    $tube.Dispose()
}

Draw-AimScientist (Join-Path $baseDir 'portrait.png') 'south' 0

foreach ($direction in @('south', 'south-east', 'east', 'north-east', 'north', 'north-west', 'west', 'south-west')) {
    Draw-AimScientist (Join-Path $idleDir "$direction.png") $direction 0
}

foreach ($direction in @('south', 'north', 'east', 'west')) {
    for ($index = 0; $index -lt 4; $index++) {
        Draw-AimScientist (Join-Path (Join-Path $walkDir $direction) "$index.png") $direction $index
    }
}
