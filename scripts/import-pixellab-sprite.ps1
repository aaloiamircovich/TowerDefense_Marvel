param(
    [Parameter(Mandatory = $true)][string]$HeroId,
    [Parameter(Mandatory = $true)][string]$InputPath,
    [ValidateSet('shoot', 'idle', 'portrait')][string]$State = 'shoot',
    [ValidateSet('north', 'north-east', 'east', 'south-east', 'south', 'south-west', 'west', 'north-west')][string]$Direction = 'south',
    [int]$FrameCount = 9,
    [int]$Size = 96,
    [switch]$AllDirections,
    [switch]$NoResize
)

$ErrorActionPreference = 'Stop'
Add-Type -AssemblyName System.Drawing

if ($Size -lt 32 -or $Size -gt 128) {
    throw "Size debe estar entre 32 y 128. El atlas actual usa celdas de 128px; 96px es el valor recomendado."
}

$ProjectRoot = Resolve-Path (Join-Path $PSScriptRoot '..')
$HeroRoot = Join-Path $ProjectRoot "assets\images\heroes\$HeroId"
$Directions = @('north', 'north-east', 'east', 'south-east', 'south', 'south-west', 'west', 'north-west')

function Resolve-InputPath([string]$PathValue) {
    if ([System.IO.Path]::IsPathRooted($PathValue)) {
        return (Resolve-Path $PathValue).Path
    }
    return (Resolve-Path (Join-Path $ProjectRoot $PathValue)).Path
}

function Get-NaturalSortKey([System.IO.FileInfo]$File) {
    $matches = [regex]::Matches($File.BaseName, '\d+')
    if ($matches.Count -gt 0) {
        return '{0:D8}-{1}' -f [int]$matches[$matches.Count - 1].Value, $File.Name
    }
    return $File.Name
}

function Copy-NearestImage([System.Drawing.Image]$Image, [string]$Destination, [int]$TargetSize, [bool]$SkipResize) {
    $parent = Split-Path $Destination -Parent
    New-Item -ItemType Directory -Force -Path $parent | Out-Null

    if ($SkipResize -or ($Image.Width -eq $TargetSize -and $Image.Height -eq $TargetSize)) {
        $clone = New-Object System.Drawing.Bitmap $Image
        $clone.Save($Destination, [System.Drawing.Imaging.ImageFormat]::Png)
        $clone.Dispose()
        return
    }

    $bitmap = New-Object System.Drawing.Bitmap $TargetSize, $TargetSize, ([System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
    $graphics = [System.Drawing.Graphics]::FromImage($bitmap)
    $graphics.Clear([System.Drawing.Color]::Transparent)
    $graphics.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::NearestNeighbor
    $graphics.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::Half
    $graphics.CompositingMode = [System.Drawing.Drawing2D.CompositingMode]::SourceOver
    $graphics.DrawImage($Image, 0, 0, $TargetSize, $TargetSize)
    $bitmap.Save($Destination, [System.Drawing.Imaging.ImageFormat]::Png)
    $graphics.Dispose()
    $bitmap.Dispose()
}

function Read-InputFrames([string]$ResolvedPath) {
    if (Test-Path $ResolvedPath -PathType Container) {
        $files = Get-ChildItem $ResolvedPath -File |
            Where-Object { $_.Extension -match '^\.(png|jpg|jpeg|bmp|gif)$' } |
            Sort-Object { Get-NaturalSortKey $_ }

        if ($files.Count -eq 0) {
            throw "No se encontraron imagenes en $ResolvedPath"
        }

        $frames = New-Object System.Collections.Generic.List[System.Drawing.Image]
        foreach ($file in $files) {
            $image = [System.Drawing.Image]::FromFile($file.FullName)
            $frames.Add((New-Object System.Drawing.Bitmap $image))
            $image.Dispose()
        }
        return $frames
    }

    $source = [System.Drawing.Image]::FromFile($ResolvedPath)
    $frames = New-Object System.Collections.Generic.List[System.Drawing.Image]
    try {
        $extension = [System.IO.Path]::GetExtension($ResolvedPath).ToLowerInvariant()
        if ($extension -eq '.gif') {
            $dimension = New-Object System.Drawing.Imaging.FrameDimension $source.FrameDimensionsList[0]
            $count = $source.GetFrameCount($dimension)
            for ($index = 0; $index -lt $count; $index++) {
                $source.SelectActiveFrame($dimension, $index) | Out-Null
                $frames.Add((New-Object System.Drawing.Bitmap $source))
            }
        } else {
            $frames.Add((New-Object System.Drawing.Bitmap $source))
        }
    } finally {
        $source.Dispose()
    }
    return $frames
}

$ResolvedInput = Resolve-InputPath $InputPath
$Frames = Read-InputFrames $ResolvedInput

try {
    if ($State -eq 'portrait') {
        $destination = Join-Path $HeroRoot 'portrait.png'
        Copy-NearestImage $Frames[0] $destination $Size $NoResize.IsPresent
        Write-Host "Portrait importado: $destination"
        return
    }

    if ($State -eq 'idle') {
        $spritesRoot = Join-Path $HeroRoot 'sprites'
        $targetDirections = if ($AllDirections) { $Directions } else { @($Direction) }
        foreach ($targetDirection in $targetDirections) {
            $destination = Join-Path $spritesRoot "$targetDirection.png"
            Copy-NearestImage $Frames[0] $destination $Size $NoResize.IsPresent
            Write-Host "Idle importado: $destination"
        }
        return
    }

    $shootRoot = Join-Path $HeroRoot 'shoot'
    New-Item -ItemType Directory -Force -Path $shootRoot | Out-Null
    for ($index = 0; $index -lt $FrameCount; $index++) {
        $sourceIndex = [Math]::Min($index, $Frames.Count - 1)
        $destination = Join-Path $shootRoot "$index.png"
        Copy-NearestImage $Frames[$sourceIndex] $destination $Size $NoResize.IsPresent
    }
    Write-Host "Animacion shoot importada: $FrameCount frames en $shootRoot"
} finally {
    foreach ($frame in $Frames) {
        $frame.Dispose()
    }
}
