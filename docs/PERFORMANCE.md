# Rendimiento

## Objetivo

Super Hero TD tiene un presupuesto de 16.67 ms por frame y 128 MB de heap JavaScript. El monitor integrado muestra promedio, p95, memoria pico, entidades y objetos reutilizados.

## Escenario de referencia

`npm run benchmark` ejecuta 600 actualizaciones con:

- 150 enemigos activos.
- 300 proyectiles simultaneos.
- 120 efectos visuales.
- Object pools activos para proyectiles y VFX.

El control falla si el p95 supera 16.67 ms. En la preparacion de la version 1.0.0 se midieron 0.034 ms de promedio y 0.081 ms de p95 en la simulacion automatizada; 300 proyectiles se crearon y luego se reutilizaron.

## Control de regresiones

`npm run check` ejecuta validación de datos y assets, 180 tests, simulación de balance, benchmark, auditoría de accesibilidad, control de lanzamiento y smoke browser del primer minuto. GitHub Actions reproduce el mismo comando en cada push y pull request.
