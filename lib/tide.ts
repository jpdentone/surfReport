import type { TidePoint } from './types'
import tideData from '../data/tides-callao.json'

/**
 * Marea de Callao — interpolada entre pleamares/bajamares OFICIALES de
 * DIHIDRONAV (Marina de Guerra del Peru, www.dhn.mil.pe).
 *
 * DIHIDRONAV no publica constituyentes armonicas (son propietarias); si
 * publica un PDF mensual con los extremos ya calculados, que es lo que
 * acumula `data/tides-callao.json`. Interpolacion cosenoidal entre extremos
 * consecutivos: la aproximacion estandar para el tramo entre una pleamar y
 * una bajamar.
 *
 * COBERTURA: solo los meses ya descargados (ver `months` en el JSON). Fuera
 * de ese rango estas funciones devuelven `null` en vez de inventar un
 * numero — la app sigue funcionando sin marea, con el score degradado.
 * Refrescar con `scripts/refresh_tides.py` (automatizado mensualmente en
 * .github/workflows/refresh-tides.yml).
 */

type Extreme = { time: string; heightCm: number }

const extremes: Extreme[] = (tideData as { extremes: Extreme[] }).extremes
const times: number[] = extremes.map((e) => new Date(e.time).getTime())

export const tideCoverage = {
  months: (tideData as { months?: string[] }).months ?? [],
  from: times[0],
  to: times[times.length - 1],
}

/** Busqueda binaria del par de extremos que rodea a `ts`. null si esta fuera de rango. */
function findBracket(ts: number): [Extreme, Extreme] | null {
  if (ts < times[0] || ts > times[times.length - 1]) return null
  let lo = 0
  let hi = times.length - 1
  while (hi - lo > 1) {
    const mid = (lo + hi) >> 1
    if (times[mid] <= ts) lo = mid
    else hi = mid
  }
  return [extremes[lo], extremes[hi]]
}

export function getTideAt(date: Date): TidePoint | null {
  const ts = date.getTime()
  const bracket = findBracket(ts)
  if (!bracket) return null

  const [a, b] = bracket
  const t1 = new Date(a.time).getTime()
  const t2 = new Date(b.time).getTime()
  const frac = t2 === t1 ? 0 : (ts - t1) / (t2 - t1)
  const cm = a.heightCm + ((b.heightCm - a.heightCm) * (1 - Math.cos(Math.PI * frac))) / 2

  return {
    time: date.toISOString(),
    height: Math.round(cm) / 100,
    trend: b.heightCm >= a.heightCm ? 'rising' : 'falling',
  }
}

export function getTideSeries(start: Date, hours: number): TidePoint[] | null {
  const points: TidePoint[] = []
  for (let i = 0; i < hours; i++) {
    const p = getTideAt(new Date(start.getTime() + i * 3_600_000))
    if (!p) return null
    points.push(p)
  }
  return points
}

export type UpcomingExtreme = { time: string; height: number; kind: 'pleamar' | 'bajamar' }

/** Proximos extremos reales (pleamar/bajamar) despues de `date`, para mostrar en UI. */
export function getUpcomingExtremes(date: Date, count = 2): UpcomingExtreme[] {
  const ts = date.getTime()
  const startIdx = times.findIndex((t) => t > ts)
  if (startIdx === -1) return []

  return extremes.slice(startIdx, startIdx + count).map((e, i) => {
    const prev = extremes[startIdx + i - 1]
    const kind: 'pleamar' | 'bajamar' = !prev || e.heightCm >= prev.heightCm ? 'pleamar' : 'bajamar'
    return { time: e.time, height: e.heightCm / 100, kind }
  })
}
