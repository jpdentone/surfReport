import type { Conditions, Level, Spot, TidePoint, Verdict } from './types'
import { BEGINNER_CHAIN_SPOT_IDS } from './beginnerChain'

/**
 * Cuanto del swell offshore llega a romper, segun de donde venga.
 *
 * Una playa no responde igual a todo swell: depende del angulo entre la
 * direccion del swell y el rumbo hacia el que mira la playa (`facing`,
 * calculado de la geometria real de costa de OSM). Por eso Barranquito
 * —que mira casi al oeste— queda tapado con swell del sur, mientras que
 * Delfines —que mira al suroeste— lo recibe de frente.
 *
 * La curva es (0.5 + 0.5·cos Δ)^1.5 en vez de un coseno pelado: el coseno
 * corta seco a los 90° y da cero, lo cual es fisicamente falso — el swell
 * refracta y envuelve, asi que a una playa tapada igual le entra algo.
 * Exponente y forma son aproximados, calibrados contra observaciones
 * reales de la escuela (ver docs/SPOTS.md).
 */
export function directionalExposure(spot: Spot, swellDirection: number): number {
  const delta = Math.abs(((swellDirection - spot.facing + 180) % 360) - 180)
  const factor = Math.pow(0.5 + 0.5 * Math.cos((delta * Math.PI) / 180), 1.5)
  return spot.exposurePeak * factor
}

/** Altura de ola rompiendo en la orilla, estimada desde el swell offshore. */
export function breakingHeight(spot: Spot, conditions: Conditions): number {
  return conditions.swell.height * directionalExposure(spot, conditions.swell.direction)
}

/**
 * Por debajo de esta altura rompiendo, en las playas que cierran se forma
 * canal y recien ahi sirven para principiantes. Tambien es el umbral por
 * el cual la escuela se va al pico de afuera (point/reventa) en vez de a
 * las secciones internas. Valor a ojo, pendiente de calibrar.
 */
const CANAL_SE_FORMA_BAJO = 0.5

export type Seccion = 'point' | 'interna'

/**
 * Con mar chico se usa el pico de afuera (point, o "la reventa" en Makaha),
 * que es lo unico que rompe. Con mar mediano o grande, las secciones
 * internas. Regla del usuario, vale para toda la Costa Verde.
 */
export function seccion(breaking: number): Seccion {
  return breaking < CANAL_SE_FORMA_BAJO ? 'point' : 'interna'
}

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
 * Dos reglas encima del rango de altura:
 *  1. En spots de `salida: 'cierra'` (Delfines, Punta Roquitas/3 Picos) las
 *     etiquetas de principiante solo salen cuando esta chico — el problema
 *     ahi no es el tamano sino que no hay por donde volver.
 *  2. En los 4 spots de la cadena real de principiantes, la etiqueta la
 *     recibe solo el ganador de la cadena (ver lib/beginnerChain.ts).
 */
export function levelTags(spot: Spot, breaking: number, beginnerPickId?: string | null): Level[] {
  const isChainSpot = (BEGINNER_CHAIN_SPOT_IDS as readonly string[]).includes(spot.id)

  return spot.levels.filter((level) => {
    if (BEGINNER_LEVELS.includes(level)) {
      if (spot.salida === 'cierra' && breaking >= CANAL_SE_FORMA_BAJO) return false
      if (isChainSpot) return spot.id === beginnerPickId
    }
    const [min, max] = LEVEL_RANGES[level]
    return breaking >= min && breaking <= max
  })
}

/**
 * Score UNICO por spot: "cuanta ola hay y que tan ordenada viene" —
 * tamano + periodo, modulado por viento y marea. A proposito NO opina si
 * eso es "bueno para vos": un score alto significa lo mismo sin importar
 * quien pregunta. Quien es para quien lo dice `levelTags()`.
 * Ver CLAUDE.md, decision #2.
 */
export function evaluate(spot: Spot, conditions: Conditions, tide: TidePoint | null): Verdict {
  const breaking = breakingHeight(spot, conditions)
  const notes: string[] = []
  let score = 0

  // Periodo pesa mas que altura (45 vs 25) — ver CLAUDE.md decision #5.
  // No es arbitrario: con 35/35 el dia 18-ago (2.8m/10.15s) le ganaba al
  // 14-ago (1.88m/14.2s), que es exactamente el error que este proyecto
  // existe para evitar. Hay un test que lo fija (lib/__tests__/scoring.test.ts).
  const periodFit = Math.min(conditions.swell.period / 16, 1)
  score += periodFit * 45
  notes.push(`periodo ${conditions.swell.period}s`)

  const heightFit = Math.min(breaking / 2.5, 1)
  score += heightFit * 25
  notes.push(`ola est. ${breaking.toFixed(1)}m`)

  const windFit = 1 - Math.min(conditions.wind.speed / 40, 1)
  score += windFit * 15
  notes.push(`viento ${conditions.wind.speed}km/h`)

  if (tide) {
    const inWindow = tide.height >= spot.tide.min && tide.height <= spot.tide.max
    score += inWindow ? 15 : 5
    notes.push(`marea ${tide.height}m${inWindow ? ' (en ventana)' : ''}`)
    if (spot.tide.prefers && tide.trend === spot.tide.prefers) {
      notes.push(`marea ${tide.trend === 'rising' ? 'subiendo' : 'bajando'} (preferida)`)
    }
  } else {
    // Sin tabla de mareas para esa fecha: puntaje neutro en vez de romper.
    // Ver COBERTURA en lib/tide.ts.
    score += 10
    notes.push('marea sin datos')
  }

  return { ok: true, score: Math.round(score), notes }
}
