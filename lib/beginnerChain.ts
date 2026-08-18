/**
 * Progresion REAL con la que se elige playa de principiantes/ninos en la
 * Costa Verde, segun la experiencia del usuario (varios anios, no una
 * formula inventada):
 *
 *   Barranquito es la playa por defecto.
 *   - Si Barranquito esta FLAT (sin ola) -> se prueba Redondo.
 *     - Si Redondo tambien esta flat -> se prueba Delfines.
 *   - Si Barranquito esta MUY GRANDE -> se prueba Ala Moana.
 *     - Si Ala Moana tambien esta grande -> se cancela el surf de
 *       principiantes ese dia.
 *
 * Esto NO es "cualquier spot de la cadena que califique" — es una decision
 * secuencial: se prueba una playa a la vez, en este orden especifico, y se
 * elige la PRIMERA que sirve. Por eso vive aparte de `levelTags()`
 * (rangos genericos por altura), que sigue aplicando a los demas spots de
 * principiantes que no son parte de esta cadena (Makaha, Punta Roquitas,
 * San Bartolo) — para esos no tenemos el mismo conocimiento local todavia,
 * ver docs/SPOTS.md.
 *
 * Umbrales (FLAT_MAX, BIG_MIN) puestos a ojo, sin calibrar con datos reales.
 */

export const BEGINNER_CHAIN_SPOT_IDS = ['barranquito', 'redondo', 'delfines', 'ala-moana'] as const

// Recalibrados 2026-08-18 contra dos observaciones reales de la escuela
// (ver docs/SPOTS.md): mañana 19-ago van a Barranquito, y el domingo 23
// Barranquito queda descartado y dudan entre Redondo y Delfines. Con la
// exposicion direccional nueva, estos dos valores reproducen ambos casos.
const FLAT_MAX = 0.35 // m — por debajo de esto no hay ola para pararse
const BIG_MIN = 1.25 // m — por encima de esto ya es grande para principiantes/ninos

export type BeginnerPick =
  | { spotId: string; reason: 'ok' }
  | { spotId: null; reason: 'muy-grande' | 'sin-olas' }

export function pickBeginnerSpot(breakingById: Record<string, number>): BeginnerPick {
  const barranquito = breakingById['barranquito']
  if (barranquito === undefined) return { spotId: null, reason: 'sin-olas' }

  if (barranquito < FLAT_MAX) {
    for (const id of ['redondo', 'delfines']) {
      const h = breakingById[id]
      if (h !== undefined && h >= FLAT_MAX) return { spotId: id, reason: 'ok' }
    }
    return { spotId: null, reason: 'sin-olas' }
  }

  if (barranquito > BIG_MIN) {
    const alaMoana = breakingById['ala-moana']
    if (alaMoana !== undefined && alaMoana <= BIG_MIN) return { spotId: 'ala-moana', reason: 'ok' }
    return { spotId: null, reason: 'muy-grande' }
  }

  return { spotId: 'barranquito', reason: 'ok' }
}
