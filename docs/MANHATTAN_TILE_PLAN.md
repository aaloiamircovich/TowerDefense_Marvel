# Plan de tiles Manhattan

Abre el mapa con:

```text
http://127.0.0.1:5173/?tilePlan=1
```

El mapa usa una grilla de 25 columnas por 19 filas, con tiles de 32x32. Los cuadros se numeran de izquierda a derecha y de arriba hacia abajo:

- `001` es la esquina superior izquierda.
- `025` es la esquina superior derecha.
- `026` inicia la segunda fila.
- `475` es la esquina inferior derecha.

Formato recomendado para pasar instrucciones:

```text
cuadro 001: pasto, foto: ...
cuadros 002-006: borde superior de edificio, foto: ...
cuadros 102, 103, 127, 128: esquina de azotea Stark, foto: ...
fila 8 columnas 4-11: calle horizontal con linea amarilla
```

Conviene definir primero una biblioteca chica de piezas:

- pasto
- vereda
- calle horizontal
- calle vertical
- esquina de calle
- edificio techo superior
- edificio pared
- esquina superior de edificio
- agua
- arbol
- auto/taxi
- decoracion Marvel/Stark/S.H.I.E.L.D.

Despues asignamos esas piezas por cuadro o por rangos.
