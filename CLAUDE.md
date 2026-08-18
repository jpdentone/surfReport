# surfReport

App personal de reporte de surf para Lima, Perú. Uso familiar: recomienda a qué
playa ir según las condiciones **y según el nivel de cada surfista**.

Dos perfiles reales de uso:
- Adulto intermedio/avanzado → picos como Punta Rocas, La Herradura, Cerro Azul.
- Niño de 9 años en escuela de surf + amigos → playas de principiantes de la
  Costa Verde (Barranquito, Redondo, Makaha/Waikiki, Agua Dulce).

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

2. **Para principiantes: SIN umbrales de ningún tipo — siempre se
   muestran las 4 playas, rankeadas.** Revisado dos veces el 2026-08-18:
   primero se probó con gates duros (veto por "no es ideal"), después con
   veto solo por peligro real (`danger*`), y finalmente —a pedido explícito—
   se sacó todo umbral. La escuela de surf es un negocio y da clases todos
   los días; ninguna condición por sí sola debe decir "cerrado". `Gates`
   ahora solo tiene `idealBreakingHeight`/`idealPeriod` como referencia de
   score (cuanto más lejos de lo ideal, menos puntaje, pero nunca `ok:
   false`). El objetivo es señalar la MEJOR playa disponible ese día, nunca
   decir que no hay ninguna. Para nivel avanzado sigue usándose score
   ponderado sin veto (salvo que el spot no aplique al nivel — eso es
   config, no condición del mar).
   ⚠️ Si en el futuro se necesita un veto real de seguridad (ej. una
   marejada extraordinaria), discutirlo con el usuario antes de
   reintroducirlo — ya se probó dos veces y se pidió explícitamente
   sacarlo.

3. **El score se invierte según nivel.** Periodo largo y altura son ✅ para
   avanzado y ❌ para principiante. No existe una sola escala de "bueno".

4. **Cada spot necesita un coeficiente `exposure`.** La API entrega swell
   offshore; hay que atenuarlo por refracción/abrigo para estimar la ola que
   realmente rompe en cada playa. Ver punto crítico abajo.

5. **El periodo pesa más que la altura.** Rankear por altura manda al agua el
   día equivocado.

6. **La marea se precalcula, no se consulta.** Es astronomía, no clima.

## Punto crítico sobre los datos

**La Marine API no distingue entre las playas de la Costa Verde.** Verificado:
Barranquito, Redondo, Makaha y Agua Dulce devuelven todos la misma celda de
grilla (`-12.208,-77.042`), con valores idénticos. Están a 2-6 km entre sí y el
modelo global las ve como un solo punto.

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
