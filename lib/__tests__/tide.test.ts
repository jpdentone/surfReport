import { describe, expect, it } from 'vitest'
import { getTideAt, getTideSeries, getUpcomingExtremes, tideCoverage } from '../tide'

describe('marea', () => {
  it('cubre al menos un mes y lo declara', () => {
    expect(tideCoverage.months.length).toBeGreaterThan(0)
  })

  it('interpola dentro del rango cubierto', () => {
    const p = getTideAt(new Date('2026-08-20T09:00:00-05:00'))
    expect(p).not.toBeNull()
    expect(p!.height).toBeGreaterThan(0)
    expect(['rising', 'falling']).toContain(p!.trend)
  })

  // En el timestamp exacto de un extremo publicado por DIHIDRONAV, la
  // interpolacion tiene que devolver la altura publicada, no una aproximacion.
  it('clava la altura publicada en un extremo exacto', () => {
    // 18-ago 09:12 -> 71 cm, del PDF oficial
    const p = getTideAt(new Date('2026-08-18T09:12:00-05:00'))
    expect(p!.height).toBeCloseTo(0.71, 2)
  })

  // Lo importante: fuera de rango devuelve null en vez de inventar un numero
  // o tirar excepcion. La app sigue andando sin marea.
  it('devuelve null fuera del rango cubierto, sin romper', () => {
    expect(getTideAt(new Date('2026-09-05T09:00:00-05:00'))).toBeNull()
    expect(getTideAt(new Date('2026-07-05T09:00:00-05:00'))).toBeNull()
    expect(getTideSeries(new Date('2026-09-05T00:00:00-05:00'), 25)).toBeNull()
    expect(getUpcomingExtremes(new Date('2026-12-31T00:00:00-05:00'))).toEqual([])
  })

  it('los proximos extremos alternan pleamar y bajamar', () => {
    const ex = getUpcomingExtremes(new Date('2026-08-18T09:00:00-05:00'), 2)
    expect(ex.length).toBe(2)
    expect(ex[0].kind).not.toBe(ex[1].kind)
  })
})
