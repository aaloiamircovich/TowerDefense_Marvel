param(
    [string]$SourceDir = "C:\Users\W10\Downloads\heroes",
    [string]$ProjectRoot = (Resolve-Path ".").Path
)

$ErrorActionPreference = "Stop"
Add-Type -AssemblyName System.IO.Compression.FileSystem

$imports = @(
    @{ Pattern = "CazadordelaOrden.zip"; Id = "black_order_hunter"; SingleAnimation = "walk" },
    @{ Pattern = "Cient*I.M*.zip"; Id = "aim_scientist"; SingleAnimation = "walk" },
    @{ Pattern = "ElfoOscuro.zip"; Id = "dark_elf"; SingleAnimation = "walk" },
    @{ Pattern = "GigantedeHielo.zip"; Id = "frost_giant_scout"; SingleAnimation = "walk" },
    @{ Pattern = "GuerreroChitauriescudobarrera.zip"; Id = "chitauri_warrior"; SingleAnimation = "walk" },
    @{ Pattern = "Hela.zip"; Id = "hela"; SingleAnimation = "attack" },
    @{ Pattern = "InfiltradoSkrull.zip"; Id = "skrull_infiltrator"; SingleAnimation = "walk" },
    @{ Pattern = "Kang.zip"; Id = "kang"; SingleAnimation = "attack" },
    @{ Pattern = "Loki8directions.zip"; Id = "loki"; SingleAnimation = "walk" },
    @{ Pattern = "Magneto.zip"; Id = "magneto"; SingleAnimation = "attack" },
    @{ Pattern = "NinjadelaMano.zip"; Id = "hand_ninja"; SingleAnimation = "walk" },
    @{ Pattern = "PrisionerodeRaft.zip"; Id = "raft_escapee"; SingleAnimation = "walk" },
    @{ Pattern = "SoldadoSakaarano.zip"; Id = "sakaaran_soldier"; SingleAnimation = "walk" },
    @{ Pattern = "Thanos.zip"; Id = "thanos_final"; SingleAnimation = "attack" },
    @{ Pattern = "Ultron.zip"; Id = "ultron_prime"; SingleAnimation = "attack" },
    @{ Pattern = "Venom.zip"; Id = "symbiote_spawn"; SingleAnimation = "attack" },
    @{ Pattern = "SoldadoHydra.zip"; Id = "hydra_soldier"; SingleAnimation = "walk" },
    @{ Pattern = "Centinela.zip"; Id = "sentinel"; SingleAnimation = "walk" },
    @{ Pattern = "Outrider.zip"; Id = "outrider"; SingleAnimation = "walk" },
    @{ Pattern = "Doombot.zip"; Id = "doombot"; SingleAnimation = "walk" },
    @{ Pattern = "GuardiaHellfire.zip"; Id = "hellfire_guard"; SingleAnimation = "walk" },
    @{ Pattern = "MutantedelaHermandad.zip"; Id = "brotherhood_mutant"; SingleAnimation = "walk" },
    @{ Pattern = "DrondeUltron.zip"; Id = "ultron_drone"; SingleAnimation = "walk" },
    @{ Pattern = "SaqueadordeVibranium.zip"; Id = "mercenary_raider"; SingleAnimation = "walk" },
    @{ Pattern = "TraidorAsgardiano.zip"; Id = "asgardian_traitor"; SingleAnimation = "walk" },
    @{ Pattern = "FanaticoOscuro.zip"; Id = "dark_zealot"; SingleAnimation = "walk" },
    @{ Pattern = "DoctorDoom.zip"; Id = "doctor_doom"; SingleAnimation = "attack" },
    @{ Pattern = "GreenGoblin.zip"; Id = "green_goblin"; SingleAnimation = "attack" },
    @{ Pattern = "RedSkull.zip"; Id = "red_skull"; SingleAnimation = "attack" },
    @{ Pattern = "Kingpin.zip"; Id = "kingpin"; SingleAnimation = "attack" },
    @{ Pattern = "Apocalypse.zip"; Id = "apocalypse"; SingleAnimation = "attack" },
    @{ Pattern = "Carnage.zip"; Id = "carnage"; SingleAnimation = "attack" },
    @{ Pattern = "Dormammu.zip"; Id = "dormammu"; SingleAnimation = "attack" }
)

$directions = @("south", "south-east", "east", "north-east", "north", "north-west", "west", "south-west")
$cardinals = @("south", "north", "east", "west")
$manifest = @{}
$searchDirs = @($SourceDir, (Join-Path $SourceDir "Enemigos")) |
    Where-Object { Test-Path -LiteralPath $_ } |
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
    $zipPath = $zipFile.FullName

    $enemyDir = Join-Path $ProjectRoot "assets\images\enemies\$($item.Id)"
    if (!(Test-Path -LiteralPath $enemyDir)) { New-Item -ItemType Directory -Path $enemyDir -Force | Out-Null }
    $zip = [System.IO.Compression.ZipFile]::OpenRead($zipPath)
    try {
        $rotationRoot = ($zip.Entries | Where-Object { $_.FullName -match "/rotations/south\.png$" } | Select-Object -First 1).FullName -replace "south\.png$", ""
        if (!$rotationRoot) { throw "No se encontro rotations/south.png en $($zipFile.Name)" }

        $idle = @{}
        foreach ($direction in $directions) {
            $source = "$rotationRoot$direction.png"
            $target = Join-Path $enemyDir "idle\$direction.png"
            if (Copy-Entry $zip $source $target) {
                $idle[$direction] = "assets/images/enemies/$($item.Id)/idle/$direction.png"
            }
        }
        Copy-Item -LiteralPath (Join-Path $enemyDir "idle\south.png") -Destination (Join-Path $enemyDir "portrait.png") -Force

        $animationDirs = $zip.Entries |
            Where-Object { $_.FullName -match "/animations/[^/]+/[^/]+/frame_\d+\.png$" } |
            ForEach-Object {
                $parts = $_.FullName -split "/"
                "$($parts[0])/$($parts[1])/$($parts[2])"
            } |
            Sort-Object -Unique

        $walkingDir = ($animationDirs | Where-Object { $_ -match "/Walking$" } | Select-Object -First 1)
        $otherDirs = @($animationDirs | Where-Object { $_ -ne $walkingDir })
        if (!$walkingDir -and $otherDirs.Count -eq 1 -and $item.SingleAnimation -eq "walk") {
            $walkingDir = $otherDirs[0]
            $otherDirs = @()
        }

        if (!$walkingDir -and $otherDirs.Count -gt 0) {
            $hasCardinalSet = $true
            foreach ($direction in $cardinals) {
                if (-not ($zip.Entries | Where-Object { $_.FullName -match [regex]::Escape("$($otherDirs[0])/$direction/") } | Select-Object -First 1)) {
                    $hasCardinalSet = $false
                }
            }
            if ($hasCardinalSet -and $otherDirs.Count -gt 1) {
                $walkingDir = $otherDirs[0]
                $otherDirs = @($otherDirs | Select-Object -Skip 1)
            }
        }

        $walk = @{}
        if ($walkingDir) {
            foreach ($direction in $cardinals) {
                $frames = @($zip.Entries |
                    Where-Object { $_.FullName -match [regex]::Escape("$walkingDir/$direction/") -and $_.FullName -match "frame_\d+\.png$" } |
                    Sort-Object FullName)
                $walk[$direction] = @()
                for ($index = 0; $index -lt $frames.Count; $index++) {
                    $target = Join-Path $enemyDir "walk\$direction\$index.png"
                    $targetDir = Split-Path -Parent $target
                    if (!(Test-Path -LiteralPath $targetDir)) { New-Item -ItemType Directory -Path $targetDir -Force | Out-Null }
                    [System.IO.Compression.ZipFileExtensions]::ExtractToFile($frames[$index], $target, $true)
                    $walk[$direction] += "assets/images/enemies/$($item.Id)/walk/$direction/$index.png"
                }
            }
        } else {
            foreach ($direction in $cardinals) {
                $walk[$direction] = @(
                    "assets/images/enemies/$($item.Id)/idle/$direction.png",
                    "assets/images/enemies/$($item.Id)/idle/$direction.png",
                    "assets/images/enemies/$($item.Id)/idle/$direction.png",
                    "assets/images/enemies/$($item.Id)/idle/$direction.png"
                )
            }
        }

        $attack = @()
        $attackDir = ($otherDirs | Select-Object -First 1)
        if ($attackDir) {
            $attackFrames = @($zip.Entries |
                Where-Object { $_.FullName -match [regex]::Escape("$attackDir/south/") -and $_.FullName -match "frame_\d+\.png$" } |
                Sort-Object FullName)
            for ($index = 0; $index -lt $attackFrames.Count; $index++) {
                $target = Join-Path $enemyDir "attack\$index.png"
                $targetDir = Split-Path -Parent $target
                if (!(Test-Path -LiteralPath $targetDir)) { New-Item -ItemType Directory -Path $targetDir -Force | Out-Null }
                [System.IO.Compression.ZipFileExtensions]::ExtractToFile($attackFrames[$index], $target, $true)
                $attack += "assets/images/enemies/$($item.Id)/attack/$index.png"
            }
        }

        $manifest[$item.Id] = @{
            sprite = "assets/images/enemies/$($item.Id)/portrait.png"
            visual = @{
                size = 96
                anchor = @{ x = 0.5; y = 0.62 }
                defaultDirection = "south"
                portrait = "assets/images/enemies/$($item.Id)/portrait.png"
                idle = $idle
                walk = @{ fps = 8; frames = $walk }
            }
        }
        if ($attack.Count -gt 0) {
            $manifest[$item.Id].visual.attack = @{ fps = 10; frames = $attack }
        }
        Write-Output "Importado $($item.Id) desde $($zipFile.Name)"
    } finally {
        $zip.Dispose()
    }
}

$manifestPath = Join-Path $ProjectRoot "tmp_enemy_sprite_manifest.json"
$manifest | ConvertTo-Json -Depth 12 | Set-Content -LiteralPath $manifestPath -Encoding UTF8
Write-Output "Manifest: $manifestPath"
