param(
    [string]$SourceDir = "C:\Users\W10\Downloads\heroes\Evos",
    [string]$ProjectRoot = (Resolve-Path ".").Path
)

$ErrorActionPreference = "Stop"
Add-Type -AssemblyName System.IO.Compression.FileSystem

$imports = @(
    @{ Pattern = "AdamWarlockGauntlet.zip"; Id = "adam_warlock_gauntlet"; HeroId = "adam_warlock" },
    @{ Pattern = "AngelaQueenofHell.zip"; Id = "angela_evolution"; HeroId = "angela" },
    @{ Pattern = "Binary.zip"; Id = "captain_marvel_evolution"; HeroId = "captain_marvel" },
    @{ Pattern = "CaptainAmericaMjolnir.zip"; Id = "capitan_america_mjolnir"; HeroId = "capitan_america" },
    @{ Pattern = "CyclopsDesatado.zip"; Id = "cyclops_evolution"; HeroId = "cyclops" },
    @{ Pattern = "Darkchylde.zip"; Id = "magik_evolution"; HeroId = "magik" },
    @{ Pattern = "DarkPhoenix.zip"; Id = "dark_phoenix"; HeroId = "jean_grey" },
    @{ Pattern = "DarkSurfer.zip"; Id = "dark_surfer"; HeroId = "silver_surfer" },
    @{ Pattern = "DiosdelaMagia.zip"; Id = "doctor_strange_dios_magia"; HeroId = "doctor_strange" },
    @{ Pattern = "EmmaFrostDiamondForm.zip"; Id = "emma_frost_evolution"; HeroId = "emma_frost" },
    @{ Pattern = "GhostRiderKingofHell.zip"; Id = "ghost_rider_evolution"; HeroId = "ghost_rider" },
    @{ Pattern = "JeffTheLandSharkVenom.zip"; Id = "venom_jeff"; HeroId = "jeff_the_land_shark" },
    @{ Pattern = "KingGroot.zip"; Id = "groot_evolution"; HeroId = "groot" },
    @{ Pattern = "KinginBlackVenom.zip"; Id = "king_in_black_venom"; HeroId = "venom" },
    @{ Pattern = "KingThor.zip"; Id = "thor_evolution"; HeroId = "thor" },
    @{ Pattern = "LokiGodofStories.zip"; Id = "loki_evolution"; HeroId = "loki" },
    @{ Pattern = "MasteroftheSun.zip"; Id = "star_lord_evolution"; HeroId = "star_lord" },
    @{ Pattern = "Ronin.zip"; Id = "hawkeye_evolution"; HeroId = "hawkeye" },
    @{ Pattern = "SuperiorIronMan.zip"; Id = "iron_man_extremis"; HeroId = "iron_man" },
    @{ Pattern = "TheMaker.zip"; Id = "mister_fantastic_evolution"; HeroId = "mister_fantastic" },
    @{ Pattern = "TheVoid.zip"; Id = "the_void"; HeroId = "sentry" },
    @{ Pattern = "WorldBreakerHulk.zip"; Id = "hulk_evolution"; HeroId = "hulk" },
    @{ Pattern = "SpiderManSymbionte.zip"; Id = "spiderman_black_suit"; HeroId = "spiderman" }
)

$directions = @("south", "south-east", "east", "north-east", "north", "north-west", "west", "south-west")
$cardinals = @("south", "north", "east", "west")
$manifest = [ordered]@{}
$parentDir = Split-Path -Parent $SourceDir
$searchDirs = @($SourceDir, $parentDir) |
    Where-Object { $_ -and (Test-Path -LiteralPath $_) } |
    Select-Object -Unique

function Find-ZipFile {
    param([string]$Pattern)

    foreach ($dir in $searchDirs) {
        $zipFile = Get-ChildItem -LiteralPath $dir -File -Filter "*.zip" |
            Where-Object { $_.Name -like $Pattern } |
            Sort-Object LastWriteTime -Descending |
            Select-Object -First 1
        if ($zipFile) { return $zipFile }
    }

    return $null
}

function Copy-Entry {
    param($Zip, [string]$EntryName, [string]$Destination)
    $entry = $Zip.GetEntry($EntryName)
    if ($null -eq $entry) { return $false }
    $dir = Split-Path -Parent $Destination
    if (!(Test-Path -LiteralPath $dir)) { New-Item -ItemType Directory -Path $dir -Force | Out-Null }
    [System.IO.Compression.ZipFileExtensions]::ExtractToFile($entry, $Destination, $true)
    return $true
}

foreach ($item in $imports) {
    $zipFile = Find-ZipFile $item.Pattern
    if (!$zipFile) {
        Write-Warning "No existe ZIP para $($item.Id): $($item.Pattern)"
        continue
    }

    $targetDir = Join-Path $ProjectRoot "assets\images\evolutions\$($item.Id)"
    if (!(Test-Path -LiteralPath $targetDir)) { New-Item -ItemType Directory -Path $targetDir -Force | Out-Null }

    $zip = [System.IO.Compression.ZipFile]::OpenRead($zipFile.FullName)
    try {
        $rotationEntry = $zip.Entries | Where-Object { $_.FullName -match "/rotations/south\.png$" } | Select-Object -First 1
        if (!$rotationEntry) { throw "No se encontro rotations/south.png en $($zipFile.Name)" }
        $rotationRoot = $rotationEntry.FullName -replace "south\.png$", ""

        $idle = [ordered]@{}
        foreach ($direction in $directions) {
            $source = "$rotationRoot$direction.png"
            $target = Join-Path $targetDir "idle\$direction.png"
            if (Copy-Entry $zip $source $target) {
                $idle[$direction] = "assets/images/evolutions/$($item.Id)/idle/$direction.png"
            }
        }
        Copy-Item -LiteralPath (Join-Path $targetDir "idle\south.png") -Destination (Join-Path $targetDir "portrait.png") -Force

        $animationDirs = $zip.Entries |
            Where-Object { $_.FullName -match "/animations/[^/]+/[^/]+/frame_\d+\.png$" } |
            ForEach-Object {
                $parts = $_.FullName -split "/"
                "$($parts[0])/$($parts[1])/$($parts[2])"
            } |
            Sort-Object -Unique
        $attackDir = ($animationDirs | Where-Object { $_ -notmatch "/Walking$" } | Select-Object -First 1)

        $attack = [ordered]@{}
        if ($attackDir) {
            foreach ($direction in $cardinals) {
                $frames = @($zip.Entries |
                    Where-Object { $_.FullName -match [regex]::Escape("$attackDir/$direction/") -and $_.FullName -match "frame_\d+\.png$" } |
                    Sort-Object FullName)
                if ($frames.Count -eq 0) { continue }
                $attack[$direction] = @()
                for ($index = 0; $index -lt $frames.Count; $index++) {
                    $target = Join-Path $targetDir "attack\$direction\$index.png"
                    $targetDirName = Split-Path -Parent $target
                    if (!(Test-Path -LiteralPath $targetDirName)) { New-Item -ItemType Directory -Path $targetDirName -Force | Out-Null }
                    [System.IO.Compression.ZipFileExtensions]::ExtractToFile($frames[$index], $target, $true)
                    $attack[$direction] += "assets/images/evolutions/$($item.Id)/attack/$direction/$index.png"
                }
            }
        }

        $visual = [ordered]@{
            size = 96
            anchor = @{ x = 0.5; y = 0.62 }
            defaultDirection = "south"
            portrait = "assets/images/evolutions/$($item.Id)/portrait.png"
            idle = $idle
        }
        if ($attack.Count -gt 0) {
            $visual.attack = @{ fps = 10; frames = $attack }
        }

        $manifest[$item.Id] = [ordered]@{
            id = $item.Id
            heroId = $item.HeroId
            sprite = "assets/images/evolutions/$($item.Id)/portrait.png"
            visual = $visual
        }
        Write-Output "Importada evolucion $($item.Id) desde $($zipFile.Name)"
    } finally {
        $zip.Dispose()
    }
}

$manifestPath = Join-Path $ProjectRoot "data\evolutionVisuals.json"
$json = ($manifest | ConvertTo-Json -Depth 16) + [Environment]::NewLine
$utf8NoBom = New-Object System.Text.UTF8Encoding($false)
[System.IO.File]::WriteAllText($manifestPath, $json, $utf8NoBom)
Write-Output "Manifest de evoluciones: $manifestPath"
