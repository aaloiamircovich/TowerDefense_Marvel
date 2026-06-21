# Pipeline de sprites

## Formato base

- Tamaño recomendado en mundo: `48x48` o `64x64` por frame.
- Retratos: `256x256`, fondo transparente y silueta legible.
- Pivote consistente: centro horizontal y pies en la misma coordenada vertical.
- Ocho direcciones: `north`, `north-east`, `east`, `south-east`, `south`, `south-west`, `west`, `north-west`.
- No mezclar resoluciones o escalas entre heroes del mismo tier visual.

## Estados minimos por heroe

- `idle`: 4-6 frames.
- `attack`: 6-10 frames.
- `ability`: 8-14 frames.
- `hit`: 2-4 frames.
- `deploy`: 6-10 frames.

Las animaciones deben indicar el impacto antes de que aparezca el daño. El frame de disparo debe exponer un punto de origen para proyectiles.

## Estructura

```text
assets/images/heroes/<hero-id>/
  portrait.png
  atlas.png
  atlas.json
  vfx/
    projectile.png
    impact.png
```

Mientras no haya atlas, la estructura direccional actual puede mantenerse como transición.

## Contrato de datos propuesto

```json
{
  "portrait": "assets/images/heroes/iron_man/portrait.png",
  "animationSet": "iron_man",
  "projectileVfx": "repulsor_blue",
  "scale": 1,
  "anchor": { "x": 0.5, "y": 0.82 }
}
```

## Dirección artística Marvel

- Siluetas primero: capa de Thor, escudo de Steve, capa de Strange, postura aérea de Iron Man.
- VFX por fuente de poder: tecnología cian/blanca, magia con runas doradas, cósmico magenta, gamma verde, mutante amarillo/azul.
- Evitar recolores como sustituto de personajes distintos.
- Reservar los destellos más intensos para críticos y habilidades, no para ataques normales.
- Mantener contraste contra Manhattan, Avengers HQ y Wakanda.

## Reglas técnicas

- Precargar assets antes de iniciar la partida.
- Nunca crear objetos `Image` dentro de `update()` o `render()`.
- Usar nearest-neighbor si el arte es pixel art; usar filtrado suave si es ilustración raster.
- Limitar transparencias vacías alrededor del personaje.
- Validar que todos los paths declarados existan durante `npm run validate`.
- El fallback debe ser visible para desarrollo, pero ninguna build de release debe depender de él.
