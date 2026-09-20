# Impactos secundarios: contrato actual

Fase 1, lote 2. Fecha: 2026-09-13.
Implementacion: src/systems/CombatSystem.js.
Regresiones: test/secondary-impact-contract.test.js.

Estas reglas describen y prueban el comportamiento generico existente. No se
han convertido todos los rebotes en contagios ni cambiado los radios del roster.
La correccion de motor en este lote es el limite de probabilidad: exito solo
cuando random < chance. Chance 0 nunca activa el efecto, incluso con random 0.

| Mecanica | Seleccion secundaria | Dano | Estados del proyectil |
| --- | --- | --- | --- |
| Explosion (splash) | Todos los vivos dentro del radio del impacto, excepto el principal | Multiplicado por splashFactor | Solo al principal |
| Rebote (chain) | Mas cercano dentro del radio del ultimo salto, sin repetir objetivos | chainFactor elevado al numero de salto | Solo al principal |
| Propagacion | Hasta propagationCount vecinos mas cercanos dentro del radio del impacto inicial | Multiplicado por propagationFactor | Tirada independiente por efecto y destinatario vivo |

## Alcance y deteccion

El objetivo inicial lo elige el heroe segun su deteccion y patron de alcance.
Las victimas secundarias reciben dano incidental: pueden estar fuera de ese
alcance, dentro del punto ciego, ser invisibles o voladoras. No es deteccion
compartida ni permite elegirlas como objetivo principal. No se cambia esta
excepcion existente mientras se revisan los kits individuales.

La propagacion no es recursiva: un vecino alcanzado no vuelve a emitirla.
Su factor reduce el dano directo, no el poder/duracion de los estados. Cada
estado conserva sus unidades (flat, attackDamage, maxHealth), probabilidad,
resistencias y reglas de fusion. Una tirada fallida en el principal no impide
que una tirada independiente tenga exito en otro destinatario.

## Interacciones

- El impacto que mata al principal puede seguir causando efectos secundarios.
  No se aplican estados a enemigos ya muertos ni se acredita una baja dos veces.
- Una explosion o rebote no dispara efectos de objeto ni genera monedas por
  cada vecino. Los efectos de objeto por impacto se resuelven una vez en el
  principal. Domino sigue cobrando por ataque desde Hero.shoot, sin cambios.
- Combinar explosion, rebote y propagacion permite dano de los tres canales
  al mismo vecino, como antes. No transmite tres veces el veneno: solo el canal
  de propagacion aplica estados secundarios. El principal queda excluido.
- Los estados nunca curan la base. La autoria de DoT queda en la fuente del
  DPS mas fuerte; un contagio debil puede refrescar sin apropiarse de su baja.
- Veneno mantiene su bolsa de 12 stacks compartidos; no es todavia un modelo
  de acumulaciones independientes por heroe. Ver pendiente en el plan.

## Pendiente

Actualizacion lote 8: la pasada de Captain Marvel fija un blanco con deteccion
efectiva y alcance especial de 2.2 veces su rango. Sin blanco valido no gasta
60 de energia ni inicia cooldown. Una vez orientada, su linea conserva dano
incidental contra todos los vivos alineados, incluso ocultos, sin revelarlos.
Conserva ancho lateral 26, factor 0.85, penetracion 35%, vuelo de 1.25 s y
regreso al origen. El dibujo del rayo sigue la linea de dano completa, separado
del destino del vuelo (posicion del objetivo con desplazamiento vertical).

Los siete ataques lineales de objetos (Quake, Nebula, Ms. Marvel, Squirrel
Girl, Yondu, Silver Surfer y Ant-Man) dibujan el endpoint geometrico completo,
no el ultimo enemigo segun el orden de la lista. Se prueban los limites de
longitud/ancho y el dano incidental a ocultos; los factores, efectos por
victima, requisitos e intervalos no cambian. No equivale a deteccion compartida.

Actualizacion lote 6: los pulsos de ItemSignatureSystem son una excepcion
existente al splash generico. Nova Flame (Human Torch), Ataque Perfecto
(Jubilee), Dark Phoenix (Jean Grey) y fuego elemental (Crystal) transmiten
quemadura a todos los vecinos del pulso. Se conserva su radio y dano directo;
la quemadura captura el dano efectivo del heroe sin aplicar splashFactor.
No hay recursion, ni procs de dinero/objetos por cada vecino. Estas firmas
requieren evolucion por nivel y el objeto correspondiente en el primer slot.
El fuego ordinario de Human Torch y Formula Phoenix sigue solo en el principal.
Las quemaduras compiten por DPS, nunca se suman, tambien en estos pulsos.

Actualizacion lote 4: el segundo blaster de Star-Lord es un segundo ataque
dirigido, no dano incidental. Excluye al blanco principal y respeta deteccion,
alcance efectivo y patron geometrico. Mantiene la municion del disparo original.

Declarar y probar las excepciones de rayos, ataques de los cuatro KitSystem,
objetos y evoluciones. Evaluar si algun heroe necesita transmitir estados con
su explosion/rebote como habilidad exclusiva; no activarlo globalmente. Los
nuevos efectos deberan explicitar su canal para no introducir procs recursivos.
