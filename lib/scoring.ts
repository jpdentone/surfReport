import type { Conditions, Level, Spot, TidePoint, Verdict } from './types'

/** Altura de ola rompiendo en la orilla, estimada desde el swell offshore. */
export function breakingHeight(spot: Spot, conditions: Conditions): number {
  return conditions.swell.height * spot.exposure
}

const BEGINNER_LEVELS: Level[] = ['kid-beginner', 'beginner']

/**
 * Veredicto de un spot para un nivel dado, en un momento dado.
 *
 * Principiantes (incluye kid-beginner): gates duros. Cualquiera que se
 * incumpla veta el spot sin importar que tan buenos esten los demas
 * factores — ver CLAUDE.md, decision de arquitectura #2.
 *
 * Intermedio/avanzado: score ponderado, sin vetos automaticos (el
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
    if (breaking > gates.maxBreakingHeight) {
      return {
        ok: false,
        reason: `ola muy grande (${breaking.toFixed(1)}m est. > ${gates.maxBreakingHeight}m)`,
      }
    }
    if (conditions.swell.period > gates.maxPeriod) {
      return {
        ok: false,
        reason: `demasiada fuerza para el nivel (periodo ${conditions.swell.period}s > ${gates.maxPeriod}s)`,
      }
    }
    if (gates.minTide !== undefined && tide.height < gates.minTide) {
      return {
        ok: false,
        reason: `marea muy baja, riesgo de piedras expuestas (${tide.height}m < ${gates.minTide}m)`,
      }
    }
    if (gates.maxWind !== undefined && conditions.wind.speed > gates.maxWind) {
      return { ok: false, reason: `viento fuerte (${conditions.wind.speed}km/h)` }
    }

    const notes: string[] = [`ola est. ${breaking.toFixed(1)}m`, `marea ${tide.height}m`]
    return { ok: true, score: 1, notes }
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
