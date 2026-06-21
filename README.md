# Super Hero TD

Tower defense ambientado en escenarios inspirados por Marvel, con siete misiones temáticas, reglas propias por mapa, objetivos secundarios, oleadas escaladas, tienda y colección de héroes.

Incluye audio por buses, música temática, interfaz responsive, navegación por teclado, alto contraste, reducción de movimiento y escala de UI persistente.

## Plan de desarrollo

- [Roadmap completo](docs/ROADMAP.md)
- [Pipeline profesional de sprites](docs/SPRITE_PIPELINE.md)

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
npm run validate
npm test
npm run balance
npm run check
```

- `build:data` regenera el respaldo para abrir por `file://`.
- `validate` revisa IDs, referencias, rutas, números y assets.
- `validate:strict` también convierte los assets ausentes en errores.
- `test` ejecuta la suite nativa de Node.
- `balance` simula eficiencia de heroes, recompensas por oleada y precios de objetos.
- `check` reproduce el control usado por GitHub Actions.

También puede abrirse `index.html` directamente. En ese modo el juego usa `data/bootstrapData.js` como respaldo para evitar problemas de `fetch` con archivos locales.

## GitHub Desktop

Si el remoto todavía no existe, abrir esta carpeta en GitHub Desktop y usar `Publish repository` con el nombre `TowerDefense_Marvel`.
