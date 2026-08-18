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

### Agua Dulce (Chorrillos)
- Coords aprox: `-12.175, -77.028` — ⚠️ verificar
- Nivel: kid-beginner, beginner
- Fondo: canto rodado
- `exposure`: _por definir_
- Abrigo / orientación:
- Ventana de marea:
- Altura máx. para niños:
- Notas de la escuela:

### Delfines
- Coords aprox: _por confirmar_
- Notas de la escuela:

---

## Picos intermedio / avanzado

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
