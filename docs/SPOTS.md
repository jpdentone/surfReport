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

## Lo que de verdad decide con chicos: la salida, no el tamaño (2026-08-18)

Del usuario, y es el hallazgo mas importante del proyecto hasta ahora:

> Delfines es como Punta Roquitas o 3 Picos: beach points, mucha ola que
> cierra y **no hay channel para poder volver tranquilo** (como si tienen
> Barranquito o Redondo). Los chicos y principiantes la pasan mal porque se
> les complica la regresada, una ola tras otra. En verano viene swell del
> norte, en Delfines es chiquito y ahi si se crea el channel — esa epoca la
> playa es muy buena.

Osea: el factor limitante para un chico **no es el tamaño de la ola sino si
puede salir y volver**. Una ola "chica" segun cualquier reporte igual lo
agota si tiene que atravesar linea tras linea de espuma sin descanso.

Makaha muestra que "sin channel" no es automaticamente malo: no tiene canal,
pero rompe blanda y esparcida en 3-4 secciones (mas "la reventa" al fondo,
para avanzados), asi que la espuma no se apila. Por eso el modelo distingue
tres casos en `Spot.salida`:

| Playa | `salida` | Por que |
|---|---|---|
| Barranquito, Redondo, Ala Moana, La Pampilla | `channel` | tienen canal |
| Makaha / Waikiki | `suave` | sin canal, pero blanda y esparcida |
| Delfines, Punta Roquitas / 3 Picos | `cierra` | sin canal y cierra parejo |

En las de `cierra`, la etiqueta de principiante solo sale cuando esta chico
(`CANAL_SE_FORMA_BAJO` en `lib/scoring.ts`). Antes de esto la app las
recomendaba en pleno swell del SO, que es justo cuando peor la pasan.

## Orientacion de cada playa, calculada (no estimada)

`facing` sale de la geometria real de costa de **OpenStreetMap** (via
Overpass API), no de estimaciones. Metodo: se baja la linea de costa de la
zona, se pega cada spot al tramo mas cercano, y se promedia la normal hacia
el mar de los tramos dentro de 300 m.

| Playa | Mira hacia |
|---|---|
| La Pampilla | 212° |
| Punta Roquitas / 3 Picos | 217° |
| Makaha / Waikiki | 224° |
| Redondo | 227° |
| Delfines | 232° |
| La Herradura | 243° |
| Barranquito | 264° |
| Ala Moana | 290° |
| San Bartolo | 217° |
| Punta Hermosa / Punta Rocas | 243° |
| Cerro Azul | 258° |
| Puerto Viejo | 242° |

**Esto valida el modelo solo:** Delfines mira al 232°, asi que el swell del
SO (~225°) le entra de frente — por eso cierra todo el año. El del norte le
llega con 85-130° de desvio, casi no le entra — por eso en verano esta
chiquito y se forma el canal. Reproduce exactamente lo que el usuario
observo en años de agua, sin haberselo dicho al modelo.

Tambien explica el rol de cada playa en la cadena: Barranquito (264°) y Ala
Moana (290°) son las mas tapadas del swell SO dominante — por eso son la
default y la opcion de dia grande respectivamente.

⚠️ Ojo: varias coordenadas venian de busquedas web y caian tierra adentro
(Delfines a 580 m de la orilla, Makaha a 392 m). Ya estan pegadas a la costa.
Punta Rocas todavia da 1017 m — su `facing` es el de Punta Hermosa, que esta
al lado; conviene corregir esa coordenada.

**Lo que la comunidad NO da:** Surf-Forecast, Stormrider y Wannasurf tienen
paginas por spot, pero la direccion optima que publican es "Southwest" para
Barranquito **y tambien** para Makaha. Es el swell dominante de Lima, no algo
que distinga playas. Sirve de contraste, no como fuente de diferenciacion.

### Puerto Viejo (Cañete)
- Coords: `-12.5806, -76.7053` (pegadas a la costa; las originales caían
  480 m tierra adentro). Km 71.5 Panamericana Sur, distrito de San Antonio.
- Cae en **su propia celda** de Open-Meteo (-12.625, -76.708), distinta a la
  de Punta Rocas/Punta Hermosa — o sea, acá sí tiene datos propios.
- ⚠️ **Sin confirmar por el usuario**: `salida: 'suave'`, fondo arena y
  niveles beginner/intermediate están puestos a ojo, por reputación de playa
  amigable para principiantes. Confirmar antes de confiar en sus etiquetas.

## La cadena real de principiantes/niños (2026-08-18)

Del usuario, de varios años de experiencia — implementada en
`lib/beginnerChain.ts`:

> Barranquito es la playa por defecto. Si Barranquito está FLAT, se prueba
> Redondo; si Redondo también está flat, Delfines. Si en cambio Barranquito
> está muy grande, se prueba Ala Moana; si Ala Moana también está grande,
> se cancela el surf de principiantes ese día.

Es una decisión **secuencial** (se prueba una playa a la vez, en ese orden),
no "cualquiera que califique por tamaño". Los umbrales se **recalibraron el
2026-08-18** a `FLAT_MAX = 0.35m` y `BIG_MIN = 1.25m` contra dos
observaciones reales (ver "Observaciones" abajo).

**Regla de secciones**, tambien del usuario: cuando el mar esta grande o
mediano usan la **seccion interna** de cualquier playa de la Costa Verde;
cuando esta muy chico se van **al point** (o "la reventa" en Makaha), que es
lo unico que rompe y ademas esta vacio porque los avanzados no van a esas
playas. Las escuelas casi nunca van a Lima Sur, salvo full day. Si en la práctica la
cadena recomienda algo distinto de lo que la escuela habría elegido ese
día, es señal de que hay que ajustar estos dos números, no la lógica.

Pendiente: Makaha, Punta Roquitas y San Bartolo también sirven a
principiantes pero no están en esta cadena — no tenemos el mismo
conocimiento local para ellos. Si el usuario cuenta cómo decide entre esos
también, se puede extender la cadena o crear una para Lima Sur.

---

## Fichas por playa

> La orientación (`facing`) y el tipo de salida ya están en las tablas de
> arriba — son datos calculados/confirmados, no hace falta llenarlos acá.
> Lo que sigue faltando en estas fichas es la **ventana de marea** por playa
> y las notas sueltas de la escuela.

### Playas de principiantes — Costa Verde

Fondo de **canto rodado** (no arena). Importa: con marea baja quedan piedras
expuestas justo donde los chicos se paran y caen. Para el perfil `kid-beginner`
la marea mínima es gate de seguridad, no preferencia de calidad.

### Barranquito
- Coords: `-12.150, -77.0249`
- Salida: `channel`
- Nivel: kid-beginner, beginner
- Fondo: canto rodado
- Ventana de marea: _min ___ m / max ___ m / ¿prefiere llenando o vaciando?_
- Altura máx. para niños: _____ m
- Notas de la escuela:

### Redondo (1 y 2)
- Coords: `-12.1322, -77.0367`
- Salida: `channel`
- Nivel: kid-beginner, beginner
- Fondo: canto rodado
- Ventana de marea:
- Altura máx. para niños:
- Notas de la escuela:

### Makaha / Waikiki
- Coords: `-12.1247, -77.0403` (corregidas, antes caían 392 m tierra adentro)
- Salida: `suave` — sin canal pero blanda y esparcida; "la reventa" al fondo es para avanzados
- Nivel: kid-beginner, beginner
- Fondo: canto rodado
- Ventana de marea:
- Altura máx. para niños:
- Notas de la escuela:

### Ala Moana (Chorrillos)
- Coords: `-12.1567, -77.0265` — reemplazó a Agua Dulce en la lista (a pedido)
- Salida: `channel`. La más tapada de todas (mira al 290°)
- Nivel: kid-beginner, beginner
- Fondo: canto rodado (asumido, no confirmado)
- Ventana de marea:
- Altura máx. para niños:
- Notas de la escuela:

### Punta Roquitas / 3 Picos
- Coords: `-12.1222, -77.0446` (Miraflores) — misma playa que 3 Picos,
  unificadas a pedido del usuario
- Salida: `cierra` (igual que Delfines)
- Nivel: kid-beginner, beginner
- Fondo: canto rodado (asumido por el nombre — "roquitas" — no confirmado)
- Notas de la escuela:

### Delfines
- Coords: `-12.1151, -77.0511` (corregidas: las anteriores caían 580 m
  tierra adentro)
- Salida: `cierra` — ver sección de arriba, es el caso central del modelo
- (Miraflores, sector centro-norte de la Costa Verde) — confirmado que cae en la misma celda oceánica que las otras 4
  playas de la Costa Verde (esperado, ver `CLAUDE.md`)
- Nivel: kid-beginner, beginner
- Fondo: canto rodado ("playa de piedras muy tranquila")
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
- Mejor con marea media/alta según la fuente
- Peligros mencionados: erizos de mar, rocas
- Notas:

### La Herradura
- Coords aprox: `-12.17, -77.04` — ⚠️ verificar
- Nivel: intermediate, advanced
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


## Observaciones reales (para calibrar)

| Fecha | Swell | Que hizo la escuela | Modelo |
|---|---|---|---|
| 19-ago-2026 | 2.4m del 196° | Barranquito, segunda seccion | Barranquito 0.8m, seccion interna ✅ |
| 23-ago-2026 | 0.92m del 182° | Barranquito descartado, dudan Redondo vs Delfines | Barranquito 0.17m flat; Redondo 0.46m vs Delfines 0.44m (empate) ✅ |

El modelo direccional reproduce los tres aspectos (playa, seccion, y el
empate del domingo) con `facing` derivado de geometria, sin numeros
inventados por playa. **Pero son 2 observaciones** — sigue siendo
calibracion debil. Anotar cada dato nuevo aca.

**Prediccion pendiente:** para el domingo 23 el modelo elige **Redondo**
(0.46m) sobre Delfines (0.44m). Verificar que eligieron en realidad.
