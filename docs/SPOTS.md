# Conocimiento local por playa

**Este es el archivo más valioso del proyecto.** Nada de lo que va acá existe en
ninguna API: la Marine API ve toda la Costa Verde como un solo punto (ver
`CLAUDE.md`). La diferenciación entre playas sale enteramente de esta tabla.

## Cómo llenarlo

Dos fuentes, ambas mejores que cualquier dato satelital:

1. **Los instructores de la escuela.** Preguntarles *por qué* eligen cada playa
   cada día. Frases del tipo "con swell del sur grande nos vamos a Barranquito
   porque está más tapado" o "Redondo con marea baja no, se pelan las rodillas"
   son literalmente el config que necesita la app.
2. **Observación propia.** Anotar sesión por sesión y contrastar con
   `past_days` de la API.

Llenar de a pocos. Los campos vacíos son honestos; inventarlos es peor que
dejarlos en blanco, porque el scoring los va a tratar como verdad.

## La cadena real de principiantes/niños (2026-08-18)

Del usuario, de varios años de experiencia — implementada en
`lib/beginnerChain.ts`:

> Barranquito es la playa por defecto. Si Barranquito está FLAT, se prueba
> Redondo; si Redondo también está flat, Delfines. Si en cambio Barranquito
> está muy grande, se prueba Ala Moana; si Ala Moana también está grande,
> se cancela el surf de principiantes ese día.

Es una decisión **secuencial** (se prueba una playa a la vez, en ese orden),
no "cualquiera que califique por tamaño". Los umbrales (`FLAT_MAX = 0.25m`,
`BIG_MIN = 1.1m` de ola rompiendo) están puestos a ojo — **pendientes de
calibrar con la escuela o con sesiones reales**. Si en la práctica la
cadena recomienda algo distinto de lo que la escuela habría elegido ese
día, es señal de que hay que ajustar estos dos números, no la lógica.

Pendiente: Makaha, Punta Roquitas y San Bartolo también sirven a
principiantes pero no están en esta cadena — no tenemos el mismo
conocimiento local para ellos. Si el usuario cuenta cómo decide entre esos
también, se puede extender la cadena o crear una para Lima Sur.

---

## Playas de principiantes — Costa Verde

Fondo de **canto rodado** (no arena). Importa: con marea baja quedan piedras
expuestas justo donde los chicos se paran y caen. Para el perfil `kid-beginner`
la marea mínima es gate de seguridad, no preferencia de calidad.

### Barranquito
- Coords aprox: `-12.150, -77.025` — ⚠️ verificar celda oceánica asignada
- Nivel: kid-beginner, beginner
- Fondo: canto rodado
- `exposure` (0-1): _por definir_
- Abrigo / orientación: _¿de qué direcciones de swell está tapado?_
- Ventana de marea: _min ___ m / max ___ m / ¿prefiere llenando o vaciando?_
- Altura máx. para niños: _____ m
- Notas de la escuela:

### Redondo (1 y 2)
- Coords aprox: `-12.132, -77.037` — ⚠️ verificar
- Nivel: kid-beginner, beginner
- Fondo: canto rodado
- `exposure`: _por definir_ (más abierto al SW que Barranquito)
- Abrigo / orientación:
- Ventana de marea:
- Altura máx. para niños:
- Notas de la escuela:

### Makaha / Waikiki
- Coords aprox: `-12.122, -77.038` — ⚠️ verificar
- Nivel: kid-beginner, beginner
- Fondo: canto rodado
- `exposure`: _por definir_
- Abrigo / orientación:
- Ventana de marea:
- Altura máx. para niños:
- Notas de la escuela:

### Ala Moana (Chorrillos)
- Coords: `-12.1567, -77.0267` — reemplazó a Agua Dulce en la lista (a pedido)
- Nivel: kid-beginner, beginner
- Fondo: canto rodado (asumido, no confirmado)
- `exposure` (0-1): 0.6 (placeholder a ojo)
- Abrigo / orientación:
- Ventana de marea:
- Altura máx. para niños:
- Notas de la escuela:

### Punta Roquitas
- Coords: `-12.1211, -77.0439` (Miraflores)
- Nivel: kid-beginner, beginner
- Fondo: canto rodado (asumido por el nombre — "roquitas" — no confirmado)
- `exposure` (0-1): 0.55 (placeholder a ojo)
- Notas de la escuela:

### Delfines
- Coords: `-12.1122, -77.0467` (Miraflores, sector centro-norte de la Costa
  Verde) — confirmado que cae en la misma celda oceánica que las otras 4
  playas de la Costa Verde (esperado, ver `CLAUDE.md`)
- Nivel: kid-beginner, beginner
- Fondo: canto rodado ("playa de piedras muy tranquila")
- `exposure` (0-1): 0.55 (placeholder a ojo, igual que las demás — pendiente
  de validar con la escuela)
- Notas de la escuela:

---

## Picos intermedio / avanzado

### La Pampilla
- Coords: `-12.1233, -77.0422` (Miraflores) — misma celda oceánica que la
  Costa Verde (esperado)
- Nivel: intermediate, advanced — corregido 2026-08-18: el usuario indicó
  que NO es para niños/principiantes, es una rompiente de intermedio para
  arriba. Antes estaba mal clasificada en el grupo escuela.
- Fondo: canto rodado (asumido)
- `exposure` (0-1): 0.7 (placeholder a ojo, subido respecto al valor de
  cuando estaba en el grupo escuela)
- Notas:

### San Bartolo
- Coords: `-12.3865, -76.7835` (convertidas de 12°23.192'S 76°47.007'W,
  fuente: wannasurf.com) — cae en la misma celda oceánica que Punta Rocas
  (~1.5km de distancia, esperado, ver punto crítico de coordenadas)
- Nivel: beginner, intermediate. Fuente: la rompiente principal es
  accesible para principiantes/intermedios; hay una ola aparte (Peñascal,
  right-point) descrita como "solo expertos" que NO se agregó como spot
  separado — si se quiere, habría que sumarla aparte.
- Fondo: boulder / canto rodado, con zona de arena fina al norte
- Tamaño típico: 1.0-1.5m subiendo a 3m+ — bastante más grande que la
  Costa Verde
- `exposure` (0-1): 0.75 (placeholder a ojo)
- Mejor con marea media/alta según la fuente
- Peligros mencionados: erizos de mar, rocas
- Notas:

### La Herradura
- Coords aprox: `-12.17, -77.04` — ⚠️ verificar
- Nivel: intermediate, advanced
- `exposure`: _por definir_
- Ventana de marea:
- Notas:

### Punta Hermosa
- Coords aprox: `-12.33, -76.83` → la API devolvió `-12.29, -76.79`
- Nivel: intermediate, advanced
- Notas:

### Punta Rocas
- Coords aprox: `-12.36, -76.79` — ⚠️ verificar (puede colapsar con Punta Hermosa)
- Nivel: advanced
- Notas: prende con swell SW/SSW (200-220°) y periodo >13 s

### Cerro Azul
- Coords aprox: `-13.02, -76.48` — ⚠️ verificar
- Nivel: intermediate, advanced
- Notas:

---

## Patrones generales de Lima (a validar)

Hipótesis de partida, **no verificadas**. Confirmarlas o corregirlas con la
escuela y con observación propia antes de meterlas al scoring:

- Los picos son en su mayoría de fondo SW/SSW. Un swell de 200-220° con periodo
  >13 s es el que enciende los picos de Punta Hermosa / Punta Rocas.
- En verano el viento suele entrar del S a partir de las 10-11 am, así que la
  ventana buena es temprano.
- Rango de marea en Lima ~1 m. Modula, rara vez decide sola — salvo el gate de
  canto rodado para niños.

---

## Registro de sesiones (para calibrar)

| Fecha | Playa | Nivel | ¿Estuvo bueno? | Qué predijo la app | Ajuste |
|---|---|---|---|---|---|
| | | | | | |
