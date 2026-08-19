# surfReport Lima

App personal de reporte de surf para Lima, Perú. Uso familiar: recomienda a qué
playa ir según las condiciones **y según el nivel de cada surfista**.

Nombre visible de la app: **"surfReport Lima"**. El 2026-08-18 se probó
renombrarla a "¿Hay Olas?" y el usuario decidió volver atrás el mismo día —
no reintroducir ese nombre sin que lo pida.

Dos perfiles reales de uso, en la MISMA lista (sin toggle de nivel — ver
decisión #2 reescrita):
- Adulto intermedio/avanzado → picos como Punta Rocas, La Herradura, Cerro Azul.
- Niño de 9 años en escuela de surf + amigos → playas de la Costa Verde y
  alrededores (Barranquito, Redondo, Makaha/Waikiki, Ala Moana, Punta
  Roquitas, Delfines, San Bartolo).

> El plan completo está en `docs/PLAN.md`. El conocimiento local por playa
> (lo que no viene de ninguna API) se captura en `docs/SPOTS.md`.

## Stack

- Next.js (App Router) + TypeScript + Tailwind
- Deploy en Vercel (plan Hobby — permite múltiples proyectos gratis)
- Sin base de datos, sin auth, sin librería de estado global
- Los spots viven en un archivo `.ts`, no en una DB

## Decisiones de arquitectura (no revertir sin discutir)

1. **La lógica de scoring vive en `lib/`, como funciones puras.** Separada de
   todo componente React. Se va a ajustar durante meses según lo observado en el
   agua; tiene que ser testeable sin levantar UI.

2. **UN SOLO score por spot, level-agnostic — no dos fórmulas por nivel.**
   Reescrito 2026-08-18, tercera iteración de esta decisión (historial
   completo en `docs/PLAN.md`, vale la pena leerlo antes de tocar esto de
   nuevo):
   1. Primero: gates duros (veto por "no es ideal para principiante").
   2. Después: veto solo por peligro real.
   3. Después: sin veto, pero con DOS fórmulas de score paralelas (una que
      premiaba tamaño para avanzado, otra que lo penalizaba para
      principiante) — el usuario notó que compartir la app así confundía:
      un "72" en la pestaña escuela no significa lo mismo que un "72" en
      avanzado, y quien lo mira sin contexto no lo sabe.
   4. **Actual**: `evaluate()` en `lib/scoring.ts` da un solo score
      "cuánta ola hay y qué tan ordenada viene" (tamaño + periodo + viento +
      marea), igual para cualquier spot, sin opinar sobre para quién es
      buena. Por separado, `levelTags()` calcula a qué niveles le sirve HOY
      ese tamaño de ola (rangos globales de altura por nivel en
      `LEVEL_RANGES`, no por spot). El score nunca cambia según quién
      pregunta; las etiquetas sí. Sin toggle de nivel en la UI — una sola
      lista, agrupada por región, con las etiquetas visibles en cada card.
   ⚠️ No reintroducir un score dual o un veto por nivel sin discutirlo — ya
   se iteró 3 veces sobre este punto.

4. **Cada spot necesita un coeficiente `exposure`.** La API entrega swell
   offshore; hay que atenuarlo por refracción/abrigo para estimar la ola que
   realmente rompe en cada playa. Ver punto crítico abajo.

5. **El periodo pesa MÁS que la altura en el score (45 vs 25 en
   `evaluate()`).** Un día grande pero de periodo corto (desordenado) no
   debe ganarle a uno más chico pero de periodo largo (ordenado). Los pesos
   no son arbitrarios: con 35/35 el caso de referencia del plan (14-ago
   1.88m/14.2s vs 18-ago 2.8m/10.15s) se invertía — el día grande y
   desordenado ganaba. Pasó desapercibido cuando se unificó el score y lo
   detectaron recién los tests. **Hay un test que fija este caso**
   (`lib/__tests__/scoring.test.ts`); si se tocan los pesos, tiene que
   seguir pasando.

6. **La marea se precalcula, no se consulta.** Es astronomía, no clima.

7. **La cadena real de principiantes/niños vive en `lib/beginnerChain.ts`,
   separada de `levelTags()`.** Conocimiento local de varios años del
   usuario, no una formula generica: Barranquito es la playa por defecto;
   si esta flat se prueba Redondo, despues Delfines; si esta muy grande se
   prueba Ala Moana; si esa tambien esta grande, se cancela el surf de
   principiantes ese dia (se muestra un aviso). Es una decision SECUENCIAL
   (una playa a la vez, en ese orden), no "todas las que califiquen por
   rango" — por eso el ganador de la cadena es el UNICO de esos 4 spots que
   recibe la etiqueta kid-beginner/beginner ese dia, aunque otro tambien
   caiga en rango por altura. Otros spots de principiantes fuera de la
   cadena (Makaha, Punta Roquitas, San Bartolo) siguen con el rango
   generico de `LEVEL_RANGES` — no tenemos ese mismo conocimiento local
   para ellos todavia.

8. **No mostrar "Wave Energy" (kJ) tipo Surfline.** Se puede calcular con la
   fórmula física estándar (P ≈ 0.49 × H² × T), pero Surfline suma varios
   trenes de swell (datos espectrales de boya) y nosotros solo tenemos el
   swell dominante de Open-Meteo — el número saldría sistemáticamente
   subestimado, con apariencia de precisión que no tiene. Decisión explícita
   del usuario 2026-08-18: mejor no mostrar nada que mostrar algo falso. No
   reintroducir sin discutirlo primero.

## Punto crítico sobre los datos

**La Marine API no distingue entre las playas de la Costa Verde.** Verificado:
Barranquito, Redondo, Makaha, Ala Moana, Punta Roquitas, Delfines y La
Pampilla devuelven todos la misma celda de grilla, con valores idénticos.
Están a 2-6 km entre sí y el modelo global las ve como un solo punto. San
Bartolo (Lima Sur) también comparte celda con Punta Rocas pese a ~1.5km de
distancia — mismo fenómeno, otra zona.

Consecuencia: **la diferenciación entre playas NO puede venir de la API.** Viene
100% del config local en `docs/SPOTS.md` (exposición, fondo, abrigo, ventana de
marea). Ahí está el valor real de esta app.

## Alcance / límites

- Es una herramienta de *"probablemente hoy toca Barranquito"*, no un semáforo
  de seguridad. Con el niño, la decisión final es del instructor que está
  mirando el agua. No presentar la app como autoridad de seguridad.
- Uso personal y no comercial (requisito del plan Hobby de Vercel).

<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
