# Checklist de lanzamiento 2.0

## Datos y migracion

- [x] Guardados 1.x migran al esquema v7 sin perder heroes, objetos, mapas ni rankings.
- [x] Exportacion e importacion usan un formato identificado y validado.
- [x] Evoluciones, maestrias, codice, logros y estadisticas persisten por separado.

## Juego

- [x] Iron Man Extremis, Iron Spider y Phoenix son reversibles y cambian mecanicas reales.
- [x] Cinco modos tienen resultados y rankings aislados de campana.
- [x] Replays guardan semilla, despliegues, ramas y elecciones de draft.
- [x] Enemigos, invocaciones, empujes y convoy permanecen sobre rutas validas.

## Accesibilidad y controles

- [x] Teclado reasignable y soporte base de mando.
- [x] Alto contraste, movimiento reducido, escalado de interfaz y volumen por bus.
- [x] Auditoria estatica de nombres accesibles, dialogo, idioma y regiones de anuncios.
- [x] Textos de sistema preparados para catalogos ES/EN.

## Rendimiento y publicacion

- [x] Objetivo de frame p95 inferior a 16,67 ms.
- [x] Presupuesto de memoria JavaScript fijado en 128 MB y visible en Perfil.
- [x] Suite de 220 pruebas, smoke browser, balance, benchmark, accesibilidad y validacion integrados en `npm run check`.
- [x] Service worker y version publica sincronizados en 2.22.0.
