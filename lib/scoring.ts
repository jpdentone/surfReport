import type { Conditions, Level, Spot, TidePoint, Verdict } from './types'
import { BEGINNER_CHAIN_SPOT_IDS } from './beginnerChain'

/** Altura de ola rompiendo en la orilla, estimada desde el swell offshore. */
export function breakingHeight(spot: Spot, conditions: Conditions): number {
  return conditions.swell.height * spot.exposure
}

/**
 * Rango de altura rompiente (m) que le sirve a cada nivel. Es global, no
 * por spot — la fuerza real de una ola de cierta altura es mas o menos la
 * misma en cualquier playa; lo que cambia entre playas es `spot.levels`
 * (que niveles esa playa puede llegar a servir en algun momento) y el
 * `exposure` (cuanto de esa altura le llega). Rangos se solapan a
 * proposito: un dia de 0.8m puede calzar en beginner E intermediate.
 * Valores a ojo — ajustar con la bitacora de docs/SPOTS.md.
 */
const LEVEL_RANGES: Record<Level, [min: number, max: number]> = {
  'kid-beginner': [0, 0.6],
  beginner: [0, 1.0],
  intermediate: [0.5, 2.2],
  advanced: [1.0, Infinity],
}

const BEGINNER_LEVELS: Level[] = ['kid-beginner', 'beginner']

/**
 * Que niveles de los que este spot puede servir aplican HOY.
 *
 * Para los 4 spots de la cadena real de principiantes (ver
 * `lib/beginnerChain.ts`), la etiqueta kid-beginner/beginner NO sale de
 * rangos genericos — sale de si ese spot fue el elegido por la cadena.
 * No es "cualquiera que califique", es "la playa a la que realmente se va".
 * Para el resto de spots (incluidos otros que tambien sirven a
 * principiantes, como Makaha o San Bartolo) se usa el rango generico.
 */
export function levelTags(spot: Spot, breaking: number, beginnerPickId?: string | null): Level[] {
  const isChainSpot = (BEGINNER_CHAIN_SPOT_IDS as readonly string[]).includes(spot.id)

  return spot.levels.filter((level) => {
    if (isChainSpot && BEGINNER_LEVELS.includes(level)) {
      return spot.id === beginnerPickId
    }
    const [min, max] = LEVEL_RANGES[level]
    return breaking >= min && breaking <= max
  })
}

/**
 * Score UNICO por spot: "cuanta ola hay y que tan ordenada viene" —
 * tamano + periodo (mas periodo = groundswell mas limpio, no oleaje
 * picado), modulado por viento y marea. A proposito NO opina si eso es
 * "bueno para vos": un score alto significa lo mismo sin importar quien
 * pregunta. Quien es para quien lo dice `levelTags()`, no el score.
 * Ver CLAUDE.md, decision #2 (reescrita 2026-08-18 — antes habia dos
 * formulas de score distintas por nivel; se unificaron a pedido del
 * usuario porque compartir dos escalas ocultas confundia).
 */
export function evaluate(spot: Spot, conditions: Conditions, tide: TidePoint): Verdict {
  const breaking = breakingHeight(spot, conditions)
  const notes: string[] = []
  let score = 0

  // periodo largo = groundswell de verdad, mas ordenado (hasta ~16s)
  const periodFit = Math.min(conditions.swell.period / 16, 1)
  score += periodFit * 35
  notes.push(`periodo ${conditions.swell.period}s`)

  // altura: mas ola = mas score, con retornos decrecientes pasado los 2.5m
  const heightFit = Math.min(breaking / 2.5, 1)
  score += heightFit * 35
  notes.push(`ola est. ${breaking.toFixed(1)}m`)

  // viento fuerte deshace el orden de la ola sin importar la direccion exacta
  const windFit = 1 - Math.min(conditions.wind.speed / 40, 1)
  score += windFit * 15
  notes.push(`viento ${conditions.wind.speed}km/h`)

  // marea dentro de la ventana preferida del spot
  const inWindow = tide.height >= spot.tide.min && tide.height <= spot.tide.max
  score += inWindow ? 15 : 5
  notes.push(`marea ${tide.height}m${inWindow ? ' (en ventana)' : ''}`)
  if (spot.tide.prefers && tide.trend === spot.tide.prefers) {
    notes.push(`marea ${tide.trend === 'rising' ? 'subiendo' : 'bajando'} (preferida)`)
  }

  return { ok: true, score: Math.round(score), notes }
}
