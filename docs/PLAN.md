# Plan de implementación — surfReport

Documento de trabajo entre sesiones de Claude Code. Al terminar una fase, marcar
sus casillas y anotar lo aprendido en "Bitácora" al final.

---

## 1. Datos: qué se verificó (18 ago 2026)

Todo esto está **probado con llamadas reales**, no asumido. Una sesión futura no
necesita re-verificarlo.

### Open-Meteo Marine API — oleaje
Sin API key, sin registro, gratis para uso no comercial.

```
https://marine-api.open-meteo.com/v1/marine
  ?latitude=-12.13&longitude=-77.05
  &hourly=wave_height,wave_period,wave_direction,
          swell_wave_height,swell_wave_period,swell_wave_direction,
          sea_surface_temperature
  &timezone=America/Lima
```

- `forecast_days` → hasta **10** (verificado)
- `past_days` → funciona, sirve para calibrar el scoring contra lo observado
- también acepta `daily=` con agregados (`wave_height_max`, etc.) y `current=`
- expone `sea_surface_temperature` — relevante para duración de sesión del niño

### Open-Meteo Forecast API — viento
```
https://api.open-meteo.com/v1/forecast
  ?latitude=-12.13&longitude=-77.05
  &hourly=wind_speed_10m,wind_direction_10m,temperature_2m
  &timezone=America/Lima
```
- `forecast_days` → hasta **16** (verificado)

### Horizonte útil real: 5-7 días, NO 10
Los modelos de oleaje (WAM de ECMWF) mantienen skill decente hasta ~día 5-7.
Más allá el swell es ruido. Mostrar 7 días, pero **degradar la confianza
visualmente después del día 5** (opacidad, o sin score numérico). Un número
preciso a 9 días miente.

### Gotcha: la API mueve las coordenadas
La Marine API asigna la celda oceánica más cercana. Ejemplos reales:
- pedido `-12.33,-76.83` (Punta Hermosa) → devolvió `-12.29,-76.79`
- pedido `-12.13,-77.05` (Miraflores) → devolvió `-12.125,-77.125` (~8 km al oeste)

**Verificar spot por spot** que la celda asignada sea agua y no se cruce con la
de otro pico. Guardar en el config las coordenadas ya corregidas.

### Gotcha mayor: la Costa Verde colapsa a una sola celda
```
Barranquito  -> -12.208,-77.042 | 2.52m 10.55s | 21.4C
Redondo      -> -12.208,-77.042 | 2.52m 10.55s | 21.4C
Makaha       -> -12.208,-77.042 | 2.52m 10.55s | 21.4C
Agua Dulce   -> -12.208,-77.042 | 2.52m 10.55s | 21.2C
```
Idénticos. Ver `CLAUDE.md` → "Punto crítico sobre los datos".

### Mareas — NO están en Open-Meteo
Tres opciones, en orden de preferencia:

1. **Precalcular desde constituyentes armónicas** (recomendado). La marea es
   astronomía: se genera un JSON estático con años de datos, precisión ~10 cm,
   más que suficiente. En Lima no hay marejadas de tormenta que descuadren el
   pronóstico. Elimina la única dependencia de API key del proyecto.
   Fuente de constituyentes: DIHIDRONAV (Marina de Guerra del Perú), tablas
   oficiales del Callao. Resolver con `pytides` (script one-shot en Python).
2. **Stormglass.io** `/tide/extremes/point` — free tier 10 req/día, pero acepta
   rango de fechas, así que **1 llamada/día trae la semana**. Requiere key →
   obliga a Route Handler server-side. Buen punto de partida si el precálculo se
   complica.
3. **WorldTides.info** — tier gratuito limitado. Última opción.

**Una sola estación (Callao) cubre todo el litoral de Lima.** De Ancón a Cerro
Azul el desfase es de minutos. No se necesita marea por spot: se necesita *una*
curva + una preferencia por spot.

### Descartado
- **API de Surfline**: existe pero es no-oficial, viola sus términos y la rompen
  periódicamente. No usar.

---

## 2. Modelo de dominio

```ts
type Level = 'kid-beginner' | 'beginner' | 'intermediate' | 'advanced'

type Spot = {
  id: string
  name: string
  coords: { lat: number; lon: number }   // ya corregidas a celda oceánica válida
  exposure: number                        // 0-1, atenuación del swell offshore
  bottom: 'canto-rodado' | 'arena' | 'reef'
  levels: Level[]                         // qué niveles admite esta playa
  gates: Partial<Record<Level, Gates>>    // límites duros por nivel
  tide: { min: number; max: number; prefers?: 'rising' | 'falling' }
}

type Gates = {
  maxBreakingHeight: number   // m
  maxPeriod: number           // s — más periodo = más fuerza, peor para novato
  minTide?: number            // gate de seguridad en canto rodado
  maxWind?: number            // km/h
}

type Conditions = {
  swell: { height: number; period: number; direction: number }
  wind:  { speed: number; direction: number }
  tide:  { height: number; trend: 'rising' | 'falling'; nextExtremeIn: number }
  waterTemp: number
}

type Verdict =
  | { ok: true;  score: number; notes: string[] }
  | { ok: false; reason: string }        // veto — no lleva score
```

### Traducción offshore → ola que rompe
```
breaking = swell.height * exposure(spot, swell.direction)
```
Ese coeficiente es lo que hace que un solo dato de API genere veredictos
distintos por playa. Es la pieza central del proyecto.

### La marea es multiplicador, no sumando
El rango en Lima es chico (~1 m), así que rara vez mata una sesión sola: modula
la calidad del swell. **Excepción:** para `kid-beginner` en canto rodado, la
marea mínima es un gate duro de seguridad (piedras expuestas donde los chicos se
paran y caen), no una preferencia.

### Modelar tendencia, no solo altura
Guardar solo "marea: 0.8m" es el error clásico. Importa:
- altura actual
- **si está subiendo o bajando** — muchos picos rompen distinto en cada caso
  aunque la altura sea idéntica
- cuánto falta para el próximo extremo

---

## 3. Fases

### Fase 0 — Scaffold
- [ ] `create-next-app` (App Router, TypeScript, Tailwind)
- [ ] Estructura: `lib/` (lógica pura), `app/` (UI), `data/` (spots, marea)
- [ ] Deploy vacío a Vercel para confirmar el pipeline end-to-end
- [ ] `.env.example` (aunque idealmente termine sin secrets)

### Fase 1 — Capa de datos
- [ ] `lib/openMeteo.ts`: fetch de marine + wind, tipado, `revalidate: 3600`
- [ ] Normalizar ambas respuestas a un solo `Conditions` por hora
- [ ] Verificar y corregir las coordenadas de cada spot (ver gotchas arriba)
- [ ] `data/spots.ts` con valores iniciales a ojo — se afinan después

### Fase 2 — Marea
- [ ] Decidir: precálculo armónico vs Stormglass (arrancar por lo que desbloquee)
- [ ] Si precálculo: script Python one-shot → `data/tides-callao.json`
- [ ] `lib/tide.ts`: dado un timestamp → `{ height, trend, nextExtremeIn }`

### Fase 3 — Scoring (el corazón)
- [ ] `lib/scoring.ts`, funciones puras, cero imports de React
- [ ] `evaluate(spot, conditions, level): Verdict`
- [ ] Gates duros primero (early return con razón legible), score después
- [ ] Tests unitarios con casos reales — incluir el caso 14-ago vs 18-ago (abajo)

### Fase 4 — UI
- [ ] Selector de nivel (persistido en localStorage)
- [ ] Vista "hoy": playas ordenadas por veredicto, con la razón visible
- [ ] Vista 7 días, con confianza degradada tras el día 5
- [ ] Gráfico de olas/marea del día (Recharts o SVG a mano — **no** Chart.js,
      pesa más y no se lleva bien con SSR)
- [ ] Mobile-first: el uso real es parado en el malecón mirando si bajar

### Fase 5 — Calibración
- [ ] Registrar sesiones reales: fecha, playa, "estuvo bueno/malo"
- [ ] Contrastar con `past_days` de la API y ajustar `exposure` y gates
- [ ] Incorporar el conocimiento de la escuela (ver `docs/SPOTS.md`)

---

## 4. Caso de prueba de referencia

Datos reales de Lima, agosto 2026:

| Fecha | Altura | Periodo | Veredicto esperado |
|---|---|---|---|
| 14 ago | 1.88 m | **14.2 s** | Mejor día para avanzado |
| 18 ago | **2.80 m** | 10.15 s | Más grande pero desordenado |

El 14 fue casi un metro más chico y casi con seguridad mejor: 14 s es
groundswell de verdad, líneas ordenadas y fuerza real. El 18 tiene más agua
moviéndose pero a 10 s es más desordenado y con menos pared.

**Si el scoring rankea el 18 por encima del 14 para nivel avanzado, está mal.**
Y para `kid-beginner` ambos días deberían dar veto por periodo/altura.

Este caso debe vivir como test unitario desde la Fase 3.

---

## 5. Bitácora

Anotar aquí lo que se descubre entre sesiones: valores de `exposure` que
funcionaron, correcciones de la escuela, gates ajustados.

- **2026-08-18** — Investigación de APIs y diseño. Verificado Open-Meteo marine
  (10 días) y wind (16 días), `past_days`, y el colapso de la Costa Verde a una
  sola celda. Definida la arquitectura de gates vs score ponderado.
