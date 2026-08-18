import type { Conditions, Level, Spot, TidePoint, Verdict } from './types'

/** Altura de ola rompiendo en la orilla, estimada desde el swell offshore. */
export function breakingHeight(spot: Spot, conditions: Conditions): number {
  return conditions.swell.height * spot.exposure
}

const BEGINNER_LEVELS: Level[] = ['kid-beginner', 'beginner']

/**
 * Veredicto de un spot para un nivel dado, en un momento dado.
 *
 * Principiantes (incluye kid-beginner): la escuela de surf es un negocio,
 * da clases todos los dias — a pedido, NINGUNA condicion cierra una playa
 * de este grupo. Siempre se muestran las 4, con un score de que tan comoda
 * esta la ola para aprender ese dia. `idealBreakingHeight`/`idealPeriod`
 * son solo referencia para el ranking, no umbrales que vetan — ver
 * CLAUDE.md, decision #2 (revisada 2 veces: primero gates duros, despues
 * peligro-real-veta, ahora sin ningun umbral).
 *
 * Intermedio/avanzado: mismo espiritu, score ponderado sin vetos (el
 * criterio de que tan grande/fuerte es aceptable lo pone el surfista).
 */
export function evaluate(
  spot: Spot,
  conditions: Conditions,
  tide: TidePoint,
  level: Level,
): Verdict {
  if (!spot.levels.includes(level)) {
    return { ok: false, reason: `${spot.name} no es un spot para nivel ${level}` }
  }

  const breaking = breakingHeight(spot, conditions)

  if (BEGINNER_LEVELS.includes(level)) {
    const gates = spot.gates[level]
    if (!gates) {
      return { ok: false, reason: `sin gates configurados para ${level}` }
    }

    const notes: string[] = []
    let score = 0

    // mientras mas cerca de lo ideal, mejor — decae suave sin cortar en seco
    const sizeFit = Math.min(gates.idealBreakingHeight / Math.max(breaking, 0.01), 1)
    score += sizeFit * 45
    notes.push(`ola est. ${breaking.toFixed(1)}m`)

    const periodFit = Math.min(gates.idealPeriod / Math.max(conditions.swell.period, 0.01), 1)
    score += periodFit * 25
    notes.push(`periodo ${conditions.swell.period}s`)

    const windFit = 1 - Math.min(conditions.wind.speed / 30, 1)
    score += windFit * 15
    notes.push(`viento ${conditions.wind.speed}km/h`)

    const inWindow = tide.height >= spot.tide.min && tide.height <= spot.tide.max
    score += inWindow ? 15 : 5
    notes.push(`marea ${tide.height}m${inWindow ? ' (en ventana)' : ''}`)

    return { ok: true, score: Math.round(score), notes }
  }

  // intermedio / avanzado: score ponderado, sin veto duro
  const notes: string[] = []
  let score = 0

  // periodo largo = groundswell de verdad, mas pared y fuerza (hasta ~16s)
  const periodScore = Math.min(conditions.swell.period / 16, 1)
  score += periodScore * 40
  notes.push(`periodo ${conditions.swell.period}s`)

  // altura rompiendo: util hasta un punto, pasado eso ya no suma mas
  const heightScore = Math.min(breaking / 2.5, 1)
  score += heightScore * 30
  notes.push(`ola est. ${breaking.toFixed(1)}m`)

  // viento fuerte deshace la cara de la ola, sin importar la direccion exacta
  const windPenalty = Math.min(conditions.wind.speed / 40, 1)
  score += (1 - windPenalty) * 15
  notes.push(`viento ${conditions.wind.speed}km/h`)

  // marea dentro de la ventana preferida del spot
  const inWindow = tide.height >= spot.tide.min && tide.height <= spot.tide.max
  if (inWindow) {
    score += 10
    notes.push(`marea ${tide.height}m (en ventana)`)
  } else {
    notes.push(`marea ${tide.height}m (fuera de ventana ${spot.tide.min}-${spot.tide.max}m)`)
  }
  if (spot.tide.prefers && tide.trend === spot.tide.prefers) {
    score += 5
    notes.push(`marea ${tide.trend === 'rising' ? 'subiendo' : 'bajando'} (preferida)`)
  }

  return { ok: true, score: Math.round(score), notes }
}
