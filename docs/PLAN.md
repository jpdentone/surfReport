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

### Mareas — resuelto con datos oficiales de DIHIDRONAV (18-ago-2026)

**Actualización: DIHIDRONAV no publica constituyentes armónicas** (verificado
con WebFetch a su portal) — son datos propietarios que no comparten
públicamente. Lo que sí publican, sin necesidad de key ni scraping de
terceros, es el PDF mensual ya calculado:

```
https://www.dhn.mil.pe/portal/pdf-tabla-marea/CALLAO
```

Este endpoint devuelve siempre el **mes corriente** (probado el 18-ago-2026,
devolvió agosto 2026 completo: 31 días × 4 extremos). Se parseó con `pypdf` y
se guardó en `data/tides-callao-2026-08.json`. `lib/tide.ts` interpola entre
esos extremos con una curva cosenoidal — mucho más confiable que constituyentes
inventadas, aunque menos preciso que un análisis armónico real minuto a minuto.

**Limitación activa: la data cubre solo agosto 2026.** Refrescar mensualmente
bajando el PDF del mes y repitiendo el parseo (ver Fase 2). Descartadas por
ahora las alternativas con API key (Stormglass, WorldTides) — no hacen falta
mientras el refresco manual mensual sea viable.

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
- [x] `create-next-app` (App Router, TypeScript, Tailwind) — puerto **3010**
      (3000 lo usa otro proyecto local, hatlab)
- [x] Estructura: `lib/` (lógica pura), `app/` (UI), `data/` (spots)
- [ ] Deploy vacío a Vercel para confirmar el pipeline end-to-end
- [ ] `.env.example` (aún sin secrets — marea quedó sin API key, ver Fase 2)

### Fase 1 — Capa de datos
- [x] `lib/openMeteo.ts`: fetch de marine + wind, tipado, `revalidate: 3600`
- [x] Normalizar ambas respuestas a un solo `Conditions` por hora
- [ ] Verificar y corregir las coordenadas de cada spot (siguen con ⚠️ en
      `docs/SPOTS.md` — probado que funcionan, no que sean la celda óptima)
- [x] `data/spots.ts` con valores iniciales a ojo — pendiente afinar con la
      escuela (ver `docs/SPOTS.md`)

### Fase 2 — Marea
- [x] **Reemplazado el modelo inventado por datos oficiales reales.**
      DIHIDRONAV no publica constituyentes armónicas (confirmado — son
      propietarias), pero sí publica PDFs mensuales con pleamar/bajamar ya
      calculados: `https://www.dhn.mil.pe/portal/pdf-tabla-marea/CALLAO`.
      Se bajó el PDF de agosto 2026, se parseó (120 extremos) y se guardó en
      `data/tides-callao-2026-08.json`.
- [x] `lib/tide.ts`: interpola con curva cosenoidal entre extremos reales
      consecutivos (curva suave estándar entre pleamar y bajamar). Verificado
      contra los propios extremos del PDF: en el timestamp exacto de un
      extremo, la interpolación devuelve la altura publicada.
- [x] `getTideAt`/`getTideSeries` — dan `{ height, trend }`. `trend` sale de
      comparar contra el siguiente extremo (confiable, no aproximado).
- [ ] ⚠️ **Cobertura de datos: solo agosto 2026.** Fuera de ese rango
      `getTideAt` tira un error explícito (no inventa un número). Para seguir
      usando la app en septiembre hay que repetir el proceso: bajar el PDF de
      ese mes desde la misma URL (el endpoint siempre devuelve el mes
      corriente) y parsearlo — es manual por ahora, ver TODO abajo.
- [ ] Automatizar el refresco mensual. **Probado (18-ago-2026): el endpoint
      IGNORA parámetros de mes/año** (`?mes=09`, `/09/2026`, etc. — mismo
      PDF de agosto siempre, byte a byte). No hay archivo navegable ni forma
      de traer meses futuros por adelantado. Solo trae "el mes corriente".
      Decisión: no automatizar todavía (septiembre está a ~2 semanas, UI
      pesa más ahora). Cuando se retome, la opción real es un cron mensual
      en Vercel que repita el proceso (bajar PDF del mes corriente + parsear
      + sobreescribir JSON) — portar el parser de `pypdf` a JS/TS
      (`pdf-parse` o similar). Alternativa sin cron: refresco manual mensual
      (repetir lo hecho hoy, ~5 min).
- [ ] `nextExtremeIn` (cuánto falta para el próximo extremo) — no
      implementado, aunque con los extremos reales ya cargados es trivial
      agregarlo (`extremes[i+1].time - now`).

### Fase 3 — Scoring (el corazón)
- [x] `lib/scoring.ts`, funciones puras, cero imports de React
- [x] `evaluate(spot, conditions, tide, level): Verdict`
- [x] Gates duros primero (early return con razón legible), score después
- [x] Verificado a mano contra el caso 14-ago vs 18-ago (abajo) — pasa:
      14-ago (14.2s) puntúa 84 vs 18-ago (10.15s) puntúa 82 para advanced;
      ambos días vetados para kid-beginner por tamaño. Correcto.
- [ ] **Falta formalizar como test automatizado** (vitest o similar) —
      la verificación de arriba fue un script one-off, no vive en el repo.

### Fase 4 — UI
- [x] Diseño real implementado (no el placeholder de antes). Dirección:
      "garúa limeña" — gris-plomo/navy frio, nada de tema de surf tropical
      generico. Fraunces (display, itálica en el logotipo) + Inter (cuerpo,
      `tabular-nums` en los datos). Acento coral/"boya" para lo destacado,
      verde musgo / rojo arcilla para veredictos (deliberadamente distintos
      del acento).
- [x] **Elemento distintivo**: sparkline de marea en el header, dibujado a
      mano en SVG desde los mismos puntos reales de `lib/tide.ts` (no es
      decorativo — son los datos que alimentan el scoring), con marcador de
      "ahora" y próximos pleamar/bajamar reales.
- [x] Selector de nivel (`components/LevelSwitcher.tsx`, cliente), persistido
      en localStorage (`surfreport:level-group`) — confirmado que sobrevive
      un refresh de página.
- [x] Ordenar playas por score descendente dentro de cada grupo; las vetadas
      quedan al final. Verificado en el navegador (Avanzado: Punta Rocas 66,
      Punta Hermosa 65, La Herradura 63, Cerro Azul 63).
- [x] Mobile-first: contenedor `max-w-md` centrado incluso en desktop — a
      propósito, el uso real es con el celular parado en el malecón.
      Probado en viewport 375×812 y desktop, light y dark mode.
- [x] **Vista 7 días × 5 franjas horarias (06/09/12/15/18)**, inspirada en
      el PDF que la escuela manda de noche por WhatsApp (ALTAMAR — altura
      significante, periodo, dirección, mañana/tarde). Se decidió mostrar un
      día/franja a la vez (no la tabla completa) para que funcione bien en
      celular. Selector 100% server-side vía query params
      (`?day=YYYY-MM-DD&slot=HH:MM`, ver `components/DaySlotPicker.tsx` y
      `lib/dates.ts`) — sin JS de cliente, bookmarkable/compartible
      ("mandame el link de mañana 15:00"). El sparkline de marea del header
      ahora sigue el día/franja seleccionada (antes solo mostraba "ahora").
      Confianza degradada con nota visual a partir del día 6 (índice 5),
      como estaba planeado. Probado en navegador: cambio de día, de franja,
      y de nivel (Escuela/Avanzado) todos funcionando con datos reales.
- [ ] Gráfico de olas del día más allá del sparkline de marea (ej. altura de
      swell por hora) — no implementado.
- [ ] `nextExtremeIn` en horas/minutos ya viene de `getUpcomingExtremes` pero
      se muestra como hora del reloj, no como cuenta regresiva — decisión de
      diseño, no pendiente técnico.

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
- **2026-08-18** — Fases 0-3 implementadas (scaffold, capa de datos, marea
  aproximada, scoring). Corriendo en `localhost:3010` (3000 ocupado por otro
  proyecto local). Verificado end-to-end con datos reales: hoy el swell viene
  grande y las 4 playas de la Costa Verde quedaron correctamente vetadas para
  `kid-beginner` ("ola muy grande"), mientras los picos de avanzado mostraron
  score. Caso de referencia 14-ago vs 18-ago verificado a mano, pasa.
  UI sigue siendo un placeholder (dos listas con verde/rojo), a propósito: se
  decidió esperar a tener scoring antes de invertir en diseño.
- **2026-08-18** — Marea resuelta con datos reales. DIHIDRONAV no publica
  constituyentes armónicas (confirmado), pero sí un PDF mensual de
  pleamar/bajamar ya calculado, sin key: `dhn.mil.pe/portal/pdf-tabla-marea/CALLAO`.
  Bajado y parseado agosto 2026 completo (120 extremos) →
  `data/tides-callao-2026-08.json`. `lib/tide.ts` reescrito para interpolar
  entre esos extremos reales (curva cosenoidal) en vez de usar amplitudes
  inventadas. Verificado: en el timestamp exacto de un extremo del PDF, la
  interpolación devuelve la altura publicada. Limitación activa: solo cubre
  agosto 2026, hay que refrescar el PDF cada mes a mano (ver Fase 2).
- **2026-08-18** — Probado si el endpoint de DIHIDRONAV acepta parámetros de
  mes/año (`?mes=09`, `/09/2026`, etc.) para bajar varios meses de una vez.
  **No los acepta** — devuelve siempre el mismo PDF de agosto, byte a byte
  idéntico, sin importar el parámetro. No hay archivo navegable. Se decidió
  no automatizar el refresco todavía (septiembre está a ~2 semanas, prioridad
  fue la UI) — ver Fase 2 para las opciones cuando se retome.
- **2026-08-18** — Se agregó `region` a `Spot` (`costa-verde` | `lima-sur`)
  y se agrupan las listas por región dentro de cada nivel (encabezado
  "Costa Verde" / "Lima Sur" en vez de una sola lista mezclada), a pedido
  del usuario tras notar que San Bartolo (52km) no debería aparecer mezclado
  con Barranquito (10 min) sin distinción. Sin tiempo de manejo mostrado (a
  pedido explícito) — solo el nombre de la región. El "mejor hoy" sigue
  siendo un solo pick global (la mejor playa entre TODAS las regiones), no
  uno por región — verificado en navegador: hoy San Bartolo (score 72) se
  llevó la etiqueta global, apareciendo bajo "Lima Sur", mientras Barranquito
  lidera "Costa Verde" sin la etiqueta. Nueva sección solo se muestra si hay
  más de una región con spots en esa lista (evita header inútil si algún día
  un grupo queda con una sola región).
- **2026-08-18** — Corrección: el usuario indicó que La Pampilla NO es para
  niños/principiantes, es de nivel intermedio para arriba — se movió del
  grupo escuela al grupo avanzado (`levels: ['intermediate','advanced']`,
  sin gates de principiante). También se agregó San Bartolo
  (-12.3865,-76.7835, coords convertidas desde wannasurf.com — point break
  de canto rodado/boulder, ola principal accesible para beginner/
  intermediate, con una ola aparte "Peñascal" solo para expertos que NO se
  agregó). San Bartolo aparece en ambos grupos (escuela y avanzado) porque
  su nivel incluye tanto `beginner` como `intermediate`. Su celda oceánica
  coincide con la de Punta Rocas (~1.5km de distancia) — mismo patrón ya
  documentado, no es un bug. Verificado en navegador que ambos grupos
  quedaron correctos.
- **2026-08-18** — El usuario agregó 3 playas de escuela usando coordenadas
  reales sacadas de una búsqueda con IA (Wikipedia/Scribd citados): La
  Pampilla (-12.1233,-77.0422) y Delfines (-12.1122,-77.0467) se sumaron;
  Agua Dulce se sacó y se reemplazó por Ala Moana (-12.1567,-77.0267).
  Las 3 caen en la misma celda oceánica que el resto de la Costa Verde
  (esperado, no es un bug). Nivel asignado a las 3 por defecto:
  kid-beginner/beginner igual que las demás — con una salvedad marcada en
  `docs/SPOTS.md`: Wikipedia describe La Pampilla como "rompiente de ola"
  (rompiente real, no solo playa de baño), lo que sugiere que podría tener
  más fuerza de la asumida — revisar con la escuela antes de confiar en
  esa clasificación para niños. Grupo escuela ahora tiene 6 playas:
  Barranquito, Redondo, Makaha/Waikiki, La Pampilla, Delfines, Ala Moana.
- **2026-08-18** — Se evaluó agregar "Wave Energy" (kJ) como muestra
  Surfline. Confirmado: Open-Meteo no tiene ese campo (no existe
  `wave_energy_flux`). Se puede calcular con la formula fisica estandar
  (P ≈ 0.49 × H² × T, potencia de ola en aguas profundas), pero se
  descartó implementarlo: Surfline suma varios trenes de swell (primario +
  secundario, datos espectrales de boya) y nosotros solo tenemos el swell
  dominante de Open-Meteo — cualquier numero que calculemos quedaria
  sistematicamente subestimado frente al de Surfline, con apariencia de
  precision que no tiene. Decision del usuario: mejor no mostrar nada que
  mostrar un numero con falsa precision. NO implementar esto sin volver a
  discutirlo — ver CLAUDE.md.
- **2026-08-18** — Tres pedidos del usuario (papás/mamás sin experiencia
  leyendo reportes de surf; vista panorámica tipo ALTAMAR):
  1. **Frase en lenguaje llano** (`lib/summary.ts` `plainSummary()`):
     "grande y ordenada", "chica y picada", etc., a partir de altura +
     periodo + viento — mismos datos que ya alimentan el score, sin costo
     extra de API. Se muestra arriba de las notas técnicas en cada card.
  2. **Drawer de glosario** (`components/InfoDrawer.tsx`, cliente): botón
     ⓘ en el header abre un bottom sheet con 5 términos explicados en
     criollo (score, periodo, marea "en ventana", etiquetas de nivel,
     dirección). Cierra con Escape, tap en el fondo, o botón "cerrar".
  3. **Vista semanal genérica** (`app/semana/page.tsx`), inspirada en el
     PDF de ALTAMAR pero para toda la costa de Lima, NO por playa (a
     pedido explícito — "de verdad ago generico no x playa"). Usa un punto
     de referencia fijo (-12.13,-77.05, el mismo con el que se probó la
     API al principio del proyecto), tabla 7 días × 5 franjas, coloreada
     por banda de altura de swell offshore (no la que rompe en cada playa).
     Cada celda linkea a `/?day=X&slot=Y` para ver el detalle. Quedó
     pre-renderizada estática (no depende de searchParams).
  Verificado en navegador: frase visible y coherente ("Muy grande y
  picada" con el swell grande de hoy), drawer abre/cierra bien, tabla de
  semana con degradado de colores correcto (swell bajando de ~2.3m hoy a
  ~0.9m el lunes, consistente con el patrón real que se viene observando).
- **2026-08-18** — Renombrada la app (nombre visible, no el repo/paquete):
  **"¿Hay Olas?"**. Se probaron varias opciones (surfReport Lima sonaba
  generico); el usuario eligio esta. Cambiado en `app/layout.tsx`
  (metadata.title), `app/page.tsx` (h1), `README.md`. `package.json` pasó
  a `hay-olas` (nombre de paquete, invisible para el usuario). El repo/
  carpeta sigue llamandose `surfReport` — no se renombró, y no hace falta:
  el dominio de Vercel se elige aparte al importar el proyecto y no
  depende de `package.json` ni del nombre del repo. El usuario prefiere
  `surfreport-lima.vercel.app` como dominio cuando se despliegue, que es
  perfectamente válido aunque el título de la app diga otra cosa.
- **2026-08-18** — Colores por nivel en las etiquetas (`--tag-kid`,
  `--tag-beginner`, `--tag-intermediate`, `--tag-advanced` en
  `app/globals.css`, mapeados en `lib/levels.ts`). Y más importante: se
  implementó la cadena REAL de decisión para principiantes/niños que el
  usuario describió de su experiencia de varios años (documentada en
  `docs/SPOTS.md`): Barranquito por defecto → si flat, Redondo → si
  también flat, Delfines. Si Barranquito muy grande → Ala Moana → si
  también grande, cancelado. Vive en `lib/beginnerChain.ts`, separada de
  `levelTags()` genérico. Solo el ganador de la cadena recibe la etiqueta
  kid-beginner/beginner ese día entre esos 4 spots — otros de la Costa
  Verde que también calificarían por rango genérico (ej. Redondo con 0.6m)
  NO la reciben si no fueron el elegido, porque la cadena es secuencial,
  no "todos los que califiquen". Cuando se cancela, aparece un aviso rojo
  arriba de la lista. Verificado en navegador con 3 escenarios reales:
  swell grande (hoy) → cancelado correctamente (Barranquito 1.4m y Ala
  Moana 1.5m, ambos > BIG_MIN); swell chico (23-ago) → Barranquito elegido
  correctamente, Redondo/Delfines/Ala Moana sin etiqueta aunque calificaran
  por tamaño. Umbrales (`FLAT_MAX=0.25m`, `BIG_MIN=1.1m`) a ojo, pendientes
  de calibrar.
- **2026-08-18** — **Cambio grande de arquitectura: score unificado, sin
  toggle de nivel.** Historial completo de esta decisión (útil si hay que
  volver a discutirla):
  1. Empezamos con gates duros para principiantes (veto por "no ideal").
  2. El usuario señaló que una escuela de surf da clases todos los días —
     cambiamos a veto solo por peligro real.
  3. El usuario pidió sacar TODO umbral — sin veto, pero quedaron DOS
     fórmulas de score paralelas (una premiaba tamaño para avanzado, otra
     lo penalizaba para principiante).
  4. El usuario notó el problema real de fondo: si esto se comparte, nadie
     sabe que hay dos escalas de score ocultas — un "72" no significa lo
     mismo en cada pestaña. Sugirió sacar el toggle y mostrar todo en una
     lista con tags de nivel. Se afinó la propuesta: un score neutro
     ("cuánta ola hay y qué tan ordenada viene": tamaño + periodo + viento +
     marea) que no opina sobre para quién es buena, más un cálculo
     SEPARADO de a qué niveles le sirve ese tamaño hoy (`levelTags()`,
     rangos globales de altura por nivel, no por spot).
  Resultado: `lib/scoring.ts` tiene una sola `evaluate()` (antes eran dos
  ramas con fórmulas distintas) + `levelTags()`. `Gates`/`idealBreakingHeight`
  salieron de `Spot` — ya no existen. `LevelSwitcher.tsx` se borró (sin
  toggle). `app/page.tsx` calcula una sola lista, ordenada por score,
  agrupada por región (Costa Verde / Lima Sur, sin cambios ahí). Cada card
  muestra tags de nivel (`components/SpotCard.tsx`) — si el tamaño de hoy
  no cae en el rango de ningún nivel que ese spot pueda servir, se muestra
  "sin nivel claro hoy" en vez de ocultar la playa.
  Verificado en navegador con datos reales: Redondo hoy (swell grande) no
  mostró ninguna etiqueta de nivel — correcto, ningún nivel de los que
  sirve (kid-beginner/beginner) calza con el tamaño de hoy. San Bartolo
  mostró solo "intermedio" (no "principiante") por el mismo motivo. "Mejor
  hoy" sigue siendo un pick global entre TODOS los spots (hoy: Punta Rocas,
  score 74) — no cambió con este refactor.
  ⚠️ No reintroducir un score por nivel sin discutirlo — ver CLAUDE.md
  decisión #2.
- **2026-08-18** — El usuario compartió una captura de lo que la escuela
  manda por WhatsApp de noche: un PDF de ALTAMAR con altura/periodo/dirección
  por AM/PM para 8 días, codificado por color. Pidió algo similar pero con
  mas granularidad horaria (06/09/12/15/18). Se implementó una vista de
  día+franja (no tabla completa, por mobile) reutilizando los mismos datos
  horarios de Open-Meteo que ya se pedían — sin cambios en la capa de datos,
  solo en cómo se navega la misma información. Diferencia clave respecto al
  PDF de la escuela: en vez de mostrar altura de ola offshore genérica, cada
  celda ya resuelve "cuál playa conviene" usando el scoring existente.
- **2026-08-18** — Corrección posterior: el usuario marcó que "cerrado" en
  Barranquito por marea baja (0.21m < 0.4m) estaba mal — pedido explícito de
  sacar TODO umbral para el grupo escuela, no solo el de peligro real. Se
  simplificó `Gates` a solo `idealBreakingHeight`/`idealPeriod` (referencia
  de score, nunca veto) y se quitaron `dangerBreakingHeight`, `dangerPeriod`,
  `minTide`, `maxWind`. Ahora las 4 playas de la Costa Verde siempre
  aparecen con veredicto "sí", rankeadas — verificado en navegador con los
  datos reales de hoy: Barranquito 68 (mejor hoy), Agua Dulce 66, Makaha 65,
  Redondo 63. Documentado en CLAUDE.md que este punto ya se revisó dos veces
  y no conviene reintroducir vetos sin discutirlo primero.
- **2026-08-18** — Cambio de arquitectura en el scoring de principiantes,
  a pedido: una escuela de surf da clases todos los días (es un negocio),
  no tiene sentido vetar por "no es ideal". `Gates` ahora separa `ideal*`
  (resta puntaje si se pasa, no cierra) de `danger*` (peligro real, ahí sí
  veta). Con el swell de hoy (grande mas no peligroso, ~0.9-1.1m estimado)
  las 4 playas de la Costa Verde pasaron de "no recomendado por tamaño" a
  rankeadas con score — pero la marea baja de la tarde SÍ las vetó
  ("cerrado") por riesgo real de piedras expuestas en canto rodado, que
  sigue siendo un veto de seguridad genuino, no de calidad. UI: badge de
  veto ahora dice "cerrado" (no "no"), y la playa #1 del grupo escuela se
  marca "mejor hoy". Verificado con script: en rango seguro el score baja
  de 90 a 62 conforme crece la ola, pero nunca cierra.
- **2026-08-18** — Fase 4 (UI) implementada con dirección de diseño propia
  ("garúa limeña": gris-plomo/navy, Fraunces + Inter, acento coral, verde/rojo
  para veredictos). Sparkline de marea real como elemento distintivo del
  header. Selector de nivel con persistencia en localStorage, verificado que
  sobrevive refresh. Playas ordenadas por score. Probado en navegador real
  (mobile 375px, desktop, light y dark mode) — todo funcionando con datos
  reales de hoy. Build y lint limpios. Pendiente: vista de varios días y
  gráfico de oleaje por hora (no implementados, la vista actual es solo
  "hoy").
