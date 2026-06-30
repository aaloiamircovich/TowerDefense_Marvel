# Super Hero TD 2.0

Tower defense ambientado en escenarios inspirados por Marvel, con once misiones temáticas, reglas propias por mapa, objetivos secundarios, oleadas escaladas, tienda y colección de héroes.

Incluye los treinta y un héroes del roster con kits y sprites completos, evoluciones reversibles, maestría, códice, cinco modos de juego, director de encuentros con afijos y ramas de botín, 30 objetos con forja, replays por semilla, mando, controles configurables y estadísticas históricas.

La version 2.19.0 puede instalarse como PWA, conserva los recursos esenciales para jugar sin conexion, migra guardados 1.x al esquema actual, suma validacion browser del primer minuto de juego, mejora el slice visual inicial de Manhattan, agrega mejoras de campo rapidas, refuerza la integridad de rutas enemigas, dirige las primeras oleadas de campana, aclara costes de mejora en el roster, suma lectura de amenaza por oleada, mide la cobertura real de ruta durante la colocacion, conecta el CTA de inicio con el riesgo de la oleada, agrega asesor de preparacion tactica, recomienda counters directamente en el roster, muestra preparacion recomendada antes de iniciar, alerta presion de fuga durante el combate, ofrece mejora de emergencia desde esa alerta, muestra un informe tactico al cerrar cada oleada, permite mejorar al MVP desde esa lectura, cambia prioridad de objetivo desde el roster desplegado y suma atajos configurables para ciclar objetivo y mejorar al heroe seleccionado.

> Proyecto fan no oficial, educativo y sin fines comerciales. No está afiliado ni respaldado por Marvel Entertainment o The Walt Disney Company. Consulta [NOTICE.md](NOTICE.md).

## Plan de desarrollo

- [Roadmap completo](docs/ROADMAP.md)
- [Roadmap de expansión 1.2 a 2.0](docs/ROADMAP_EXPANSION.md)
- [Roadmap profesional 3.0](docs/ROADMAP_PROFESSIONAL_3_0.md)
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
npm run build:street
npm run build:mutants
npm run build:worlds
npm run validate
npm test
npm run balance
npm run benchmark
npm run release:check
npm run smoke:browser
npm run check
```

- `build:data` regenera el respaldo para abrir por `file://`.
- `build:heroes` regenera sprites, atlas y datos del equipo central.
- `build:items` regenera los 30 iconos de objetos y el respaldo de datos.
- `build:synergies` normaliza etiquetas, roles, métricas y respaldo de datos.
- `build:cosmic` configura héroes, enemigos y datos de la expansión cósmica.
- `build:street` configura los héroes callejeros y Midnight Suns, sus roles y el respaldo de datos.
- `build:mutants` configura los mutantes y la reserva táctica que completan el roster.
- `build:worlds` genera los cuatro mapas, facciones y jefes de mundos en colisión.
- `validate` revisa IDs, referencias, rutas, números y assets.
- `validate:strict` también convierte los assets ausentes en errores.
- `test` ejecuta la suite nativa de Node.
- `balance` simula eficiencia de heroes, recompensas por oleada y precios de objetos.
- `benchmark` mide 150 enemigos, 300 proyectiles y 120 VFX contra un presupuesto de 60 FPS.
- `release:check` valida versión, PWA, atlas, caché offline y aviso legal.
- `smoke:browser` abre Chromium, despliega un héroe, completa una oleada y controla que los enemigos sigan la ruta.
- `check` reproduce el control usado por GitHub Actions.

También puede abrirse `index.html` directamente. En ese modo el juego usa `data/bootstrapData.js` como respaldo para evitar problemas de `fetch` con archivos locales.

## GitHub Desktop

Si el remoto todavía no existe, abrir esta carpeta en GitHub Desktop y usar `Publish repository` con el nombre `TowerDefense_Marvel`.
