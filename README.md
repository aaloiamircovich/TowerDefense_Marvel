# Super Hero TD

Tower defense ambientado en escenarios inspirados por Marvel, con siete misiones temáticas, reglas propias por mapa, objetivos secundarios, oleadas escaladas, tienda y colección de héroes.

Incluye dieciséis héroes con kits y sprites completos, constructor de equipo con sinergias y formaciones, mesa táctica, 30 objetos con forja y loadouts, prioridades de objetivo, reposición y venta de héroes, audio por buses, música temática, interfaz responsive, navegación por teclado, alto contraste, reducción de movimiento y escala de UI persistente.

La versión 1.6.0 también puede instalarse como PWA, conserva los recursos esenciales para jugar sin conexión y actualiza código y datos al volver a estar en línea.

> Proyecto fan no oficial, educativo y sin fines comerciales. No está afiliado ni respaldado por Marvel Entertainment o The Walt Disney Company. Consulta [NOTICE.md](NOTICE.md).

## Plan de desarrollo

- [Roadmap completo](docs/ROADMAP.md)
- [Roadmap de expansión 1.2 a 2.0](docs/ROADMAP_EXPANSION.md)
- [Pipeline profesional de sprites](docs/SPRITE_PIPELINE.md)
- [Objetivo y benchmark de rendimiento](docs/PERFORMANCE.md)

## Ejecutar

La forma recomendada es usar el servidor local:

```bash
npm run dev
```

Luego abrir:

```text
http://127.0.0.1:5173/
```

## Calidad

```bash
npm run build:data
npm run build:heroes
npm run build:items
npm run build:synergies
npm run build:cosmic
npm run validate
npm test
npm run balance
npm run benchmark
npm run release:check
npm run check
```

- `build:data` regenera el respaldo para abrir por `file://`.
- `build:heroes` regenera sprites, atlas y datos del equipo central.
- `build:items` regenera los 30 iconos de objetos y el respaldo de datos.
- `build:synergies` normaliza etiquetas, roles, métricas y respaldo de datos.
- `build:cosmic` configura héroes, enemigos y datos de la expansión cósmica.
- `validate` revisa IDs, referencias, rutas, números y assets.
- `validate:strict` también convierte los assets ausentes en errores.
- `test` ejecuta la suite nativa de Node.
- `balance` simula eficiencia de heroes, recompensas por oleada y precios de objetos.
- `benchmark` mide 150 enemigos, 300 proyectiles y 120 VFX contra un presupuesto de 60 FPS.
- `release:check` valida versión, PWA, atlas, caché offline y aviso legal.
- `check` reproduce el control usado por GitHub Actions.

También puede abrirse `index.html` directamente. En ese modo el juego usa `data/bootstrapData.js` como respaldo para evitar problemas de `fetch` con archivos locales.

## GitHub Desktop

Si el remoto todavía no existe, abrir esta carpeta en GitHub Desktop y usar `Publish repository` con el nombre `TowerDefense_Marvel`.
