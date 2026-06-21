param([string]$ProjectRoot = (Get-Location).Path)

Add-Type -AssemblyName System.Drawing

$sourceRoot = Join-Path $ProjectRoot 'assets\images\heroes'
$files = Get-ChildItem $sourceRoot -Recurse -Filter '*.png' |
    Where-Object { $_.Name -ne 'atlas.png' } |
    Sort-Object FullName

$cellSize = 128
$columns = 8
$rows = [Math]::Ceiling($files.Count / $columns)
$bitmap = New-Object System.Drawing.Bitmap ($columns * $cellSize), ($rows * $cellSize), ([System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
$graphics = [System.Drawing.Graphics]::FromImage($bitmap)
$graphics.Clear([System.Drawing.Color]::Transparent)
$graphics.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::NearestNeighbor
$graphics.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::Half
$frames = [ordered]@{}

for ($index = 0; $index -lt $files.Count; $index++) {
    $file = $files[$index]
    $image = [System.Drawing.Image]::FromFile($file.FullName)
    $cellX = ($index % $columns) * $cellSize
    $cellY = [Math]::Floor($index / $columns) * $cellSize
    $x = $cellX + [Math]::Floor(($cellSize - $image.Width) / 2)
    $y = $cellY + [Math]::Floor(($cellSize - $image.Height) / 2)
    $graphics.DrawImage($image, $x, $y, $image.Width, $image.Height)
    $relative = $file.FullName.Substring($ProjectRoot.Length + 1).Replace('\', '/')
    $frames[$relative] = [ordered]@{ x = $x; y = $y; width = $image.Width; height = $image.Height }
    $image.Dispose()
}

$atlasPath = Join-Path $sourceRoot 'atlas.png'
$bitmap.Save($atlasPath, [System.Drawing.Imaging.ImageFormat]::Png)
$graphics.Dispose()
$bitmap.Dispose()

$payload = [ordered]@{ image = 'assets/images/heroes/atlas.png'; frames = $frames }
$json = $payload | ConvertTo-Json -Depth 5 -Compress
$source = "window.__MARVEL_TD_ATLAS__ = $json;`n"
[System.IO.File]::WriteAllText((Join-Path $ProjectRoot 'data\sprite-atlas.js'), $source, (New-Object System.Text.UTF8Encoding($false)))
Write-Host "Atlas generado: $($files.Count) sprites en $columns x $rows celdas"
