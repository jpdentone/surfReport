import { describe, expect, it } from 'vitest'
import { breakingHeight, evaluate, levelTags, seccion } from '../scoring'
import { pickBeginnerSpot } from '../beginnerChain'
import { getSpot, spots } from '../../data/spots'
import type { Conditions, Spot, TidePoint } from '../types'

const spot = (id: string): Spot => {
  const s = getSpot(id)
  if (!s) throw new Error(`spot desconocido en el test: ${id}`)
  return s
}

const cond = (height: number, period: number, direction: number, wind = 10): Conditions => ({
  time: 'x',
  swell: { height, period, direction },
  wind: { speed: wind, direction: 180 },
  waterTemp: 20,
})

const tide = (height: number, trend: 'rising' | 'falling' = 'rising'): TidePoint => ({
  time: 'x',
  height,
  trend,
})

/** Alturas rompiendo de toda la Costa Verde para un swell dado. */
function breakingCostaVerde(c: Conditions): Record<string, number> {
  const out: Record<string, number> = {}
  for (const s of spots) out[s.id] = breakingHeight(s, c)
  return out
}

describe('score unico (no depende del nivel)', () => {
  // Caso de referencia de docs/PLAN.md: el 14-ago fue casi un metro mas chico
  // que el 18 pero con 14.2s de periodo — groundswell ordenado. Si el score
  // rankea el 18 por encima, volvimos a "rankear por altura", que es el error
  // que este proyecto existe para evitar.
  it('premia periodo largo sobre altura bruta', () => {
    const pr = spot('punta-rocas')
    const dia14 = evaluate(pr, cond(1.88, 14.2, 210), tide(0.7))
    const dia18 = evaluate(pr, cond(2.8, 10.15, 219), tide(0.7))
    expect(dia14.ok && dia18.ok).toBe(true)
    if (dia14.ok && dia18.ok) expect(dia14.score).toBeGreaterThan(dia18.score)
  })

  it('funciona sin marea, con puntaje degradado y nota explicita', () => {
    const c = cond(1.5, 12, 220)
    const conMarea = evaluate(spot('barranquito'), c, tide(0.7))
    const sinMarea = evaluate(spot('barranquito'), c, null)
    expect(sinMarea.ok).toBe(true)
    if (sinMarea.ok && conMarea.ok) {
      expect(sinMarea.notes).toContain('marea sin datos')
      expect(sinMarea.score).toBeLessThan(conMarea.score)
    }
  })
})

describe('exposicion direccional', () => {
  // Barranquito mira al 264° y Delfines al 232°. Antes ambos tenian el mismo
  // `exposure` fijo y el modelo no podia distinguirlos.
  it('con swell del sur, Barranquito queda mas tapado que Delfines', () => {
    const sur = cond(1.5, 10, 182)
    expect(breakingHeight(spot('barranquito'), sur)).toBeLessThan(
      breakingHeight(spot('delfines'), sur),
    )
  })

  it('a Delfines le entra mucho menos el swell del norte que el del suroeste', () => {
    const norte = cond(1.5, 10, 315)
    const suroeste = cond(1.5, 10, 225)
    expect(breakingHeight(spot('delfines'), norte)).toBeLessThan(
      breakingHeight(spot('delfines'), suroeste) * 0.5,
    )
  })

  // El usuario: "en verano mayormente viene swell norte, en delfines es
  // chiquito y la playa muy bien porque si se crea ese channel".
  it('con swell del norte, Delfines queda mas chico que Barranquito', () => {
    const norte = cond(1.5, 10, 315)
    expect(breakingHeight(spot('delfines'), norte)).toBeLessThan(
      breakingHeight(spot('barranquito'), norte),
    )
  })
})

describe('etiquetas de nivel', () => {
  it('en playas que cierran, no hay etiqueta de principiante salvo con mar chico', () => {
    const delfines = spot('delfines')
    expect(levelTags(delfines, 0.9, 'delfines')).toEqual([])
    expect(levelTags(delfines, 0.3, 'delfines').length).toBeGreaterThan(0)
  })

  it('solo el ganador de la cadena recibe la etiqueta, aunque otro califique por tamano', () => {
    expect(levelTags(spot('redondo'), 0.4, 'redondo').length).toBeGreaterThan(0)
    expect(levelTags(spot('redondo'), 0.4, 'barranquito')).toEqual([])
  })
})

describe('secciones', () => {
  it('mar chico manda al point; mediano o grande, a la seccion interna', () => {
    expect(seccion(0.3)).toBe('point')
    expect(seccion(0.9)).toBe('interna')
  })
})

// Estas dos son las observaciones REALES de la escuela que calibraron el
// modelo (ver docs/SPOTS.md). Si alguna se rompe, la calibracion se perdio.
describe('observaciones reales de la escuela', () => {
  it('19-ago (2.4m del 196°): van a Barranquito, seccion interna', () => {
    const c = cond(2.4, 7.3, 196)
    const pick = pickBeginnerSpot(breakingCostaVerde(c))
    expect(pick.spotId).toBe('barranquito')
    expect(seccion(breakingHeight(spot('barranquito'), c))).toBe('interna')
  })

  it('23-ago (0.92m del 182°): Barranquito queda flat y pasa a Redondo/Delfines', () => {
    const c = cond(0.92, 6.75, 182)
    const breaking = breakingCostaVerde(c)
    const pick = pickBeginnerSpot(breaking)
    expect(pick.spotId).not.toBe('barranquito')
    expect(['redondo', 'delfines']).toContain(pick.spotId)
    // la escuela dudaba entre las dos: el modelo debe darlas casi empatadas
    expect(Math.abs(breaking.redondo - breaking.delfines)).toBeLessThan(0.1)
  })
})
