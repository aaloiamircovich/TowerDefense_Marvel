# Cierre de la pasada de interfaz

Actualizado: 2026-09-13.

Este seguimiento delimita la pasada actual. No incorpora las expansiones de
los roadmaps antiguos ni autoriza cambios de sprites, mapas o balance.

## Completado antes de esta lista

- Navegacion por teclado y ayudas emergentes.
- Inspeccion de enemigos desde el radar.
- Coleccion compacta e iconos locales.
- Inventario y flujo de equipamiento.
- Tienda y estados de compra/reclutamiento.
- Ficha de heroes y comparaciones de atributos.
- Despliegue automatico de main en Railway reactivado y comprobado.

## Estado de las fases

1. Perfil - COMPLETADO. Pestanas adelantadas, resumen solo en su vista,
   maestrias/logros/emblemas/retos desplegables, todos los retos accesibles y
   navegacion conservada. Pruebas de escritorio/movil y regresiones aprobadas.
2. Ajustes - COMPLETADO. Controles compactos, audio agrupado, secciones y foco
   conservados al cambiar preferencias. Persistencia, navegacion, idiomas y
   tamanos de interfaz comprobados en escritorio y movil.
3. Radar y seleccion de mapas - COMPLETADO. Cabeceras compactas, evaluacion
   tactica y retos desplegables, estados de mapas visibles y briefings con
   regreso y navegacion. Pruebas desktop/movil y umbrales de estrellas aprobados.
4. Revision final - COMPLETADO. Recorrido de los ocho menus en escritorio y
   movil, pausa y foco conservados. Recarga y Continuar verifican dinero,
   estrellas, heroes, mejoras, equipo, objetos, progreso de mapas y ajustes.
   npm run check aprobado; Radar y mapas comprobados tambien en Railway.

Cada fase se cierra con pruebas, commit, push y verificacion de los archivos
publicos de Railway. Actualizar esta lista al cerrar una fase; no ampliar
automaticamente su alcance con funcionalidades nuevas.

Pendientes de esta pasada: 0. No se modificaron sprites, mapas ni balance.

## Verificacion de cierre

- Chromium: 1366x768 y 390x844, sin desbordes horizontales en los ocho menus.
- Prueba aislada de guardado tras compras, equipamiento, mejoras y ajustes.
- Mapas bloqueados, desplegables, briefings y regreso comprobados.
- Railway: archivos publicados coincidentes y recorrido de Radar/mapas en
  ambos tamanos, sin errores de JavaScript. Commit funcional: d9c9082.
- No sustituye una prueba manual prolongada de balance ni una auditoria
  exhaustiva en todos los navegadores; esas tareas quedan fuera de esta pasada.
