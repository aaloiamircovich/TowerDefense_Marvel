# Automatizacion de sprites PixelLab

No automatizamos cuentas temporales ni rotacion de cuentas para saltar limites de un servicio. El flujo soportado es usar tus propias generaciones y automatizar la parte tediosa: prompts, GIF a frames, nombres, carpetas, atlas y validacion.

## Tamano recomendado

Usa 96x96 como objetivo principal. Se ve mejor que 64x64 y encaja bien con el `visual.size` actual de los heroes. No pases de 128x128 sin cambiar el atlas, porque `scripts/build-sprite-atlas.ps1` empaqueta cada PNG en una celda de 128px.

## 1. Generar prompts

Un heroe:

```powershell
npm run sprite:prompts -- --hero iron_man --size 96
```

Todos los heroes:

```powershell
npm run sprite:prompts -- --all-heroes --out docs/generated-hero-prompts.md
```

Un enemigo:

```powershell
npm run sprite:prompts -- --enemy hydra_soldier --size 96
```

## 2. Importar un GIF o carpeta de frames

El juego espera esta estructura:

```text
assets/images/heroes/<hero_id>/portrait.png
assets/images/heroes/<hero_id>/sprites/south.png
assets/images/heroes/<hero_id>/shoot/0.png ... shoot/8.png
```

Importar un GIF de ataque descargado de PixelLab:

```powershell
npm run sprite:import -- -HeroId iron_man -InputPath C:\Users\W10\Downloads\iron_man_attack.gif -State shoot -FrameCount 9 -Size 96
```

Si PixelLab exporta 8 frames, el script crea 9 duplicando el ultimo frame para respetar el contrato actual del juego.

Importar una carpeta con cuadros PNG:

```powershell
npm run sprite:import -- -HeroId iron_man -InputPath C:\Users\W10\Downloads\iron_man_attack_frames -State shoot -FrameCount 9 -Size 96
```

Importar el idle hacia todas las direcciones, util cuando solo tenes un sprite base:

```powershell
npm run sprite:import -- -HeroId iron_man -InputPath C:\Users\W10\Downloads\iron_man_idle.png -State idle -Direction south -AllDirections -Size 96
```

Importar retrato:

```powershell
npm run sprite:import -- -HeroId iron_man -InputPath C:\Users\W10\Downloads\iron_man_portrait.png -State portrait -Size 96
```

## 3. Reconstruir datos del juego

Despues de importar sprites:

```powershell
npm run build:atlas
npm run build:data
npm run validate
```

Para un control mas duro de assets:

```powershell
npm run validate:strict
```

## Notas de calidad

Pedi siempre fondo transparente, personaje centrado, sin texto, sin UI y sin watermark. Para animaciones, pedi que el pivote del personaje no se mueva entre frames. Eso evita que el sprite "salte" cuando dispara.
