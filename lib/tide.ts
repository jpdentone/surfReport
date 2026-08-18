import type { TidePoint } from './types'
import tideData from '../data/tides-callao-2026-08.json'

/**
 * Marea de Callao — interpolada entre pleamares/bajamares OFICIALES de
 * DIHIDRONAV (Marina de Guerra del Peru, www.dhn.mil.pe), no entre
 * constituyentes armonicas inventadas. DIHIDRONAV no publica constituyentes
 * publicamente; lo que sí publican son los extremos ya calculados por mes en
 * PDF, que es lo que esta cargado en `data/tides-callao-2026-08.json`.
 *
 * Interpolacion cosenoidal entre extremos consecutivos: es la aproximacion
 * estandar para el tramo entre una pleamar y una bajamar (curva suave tipo
 * "rule of twelfths" continua). No es exacta minuto a minuto, pero es mucho
 * mas confiable que un modelo armonico con amplitudes a ojo.
 *
 * LIMITE IMPORTANTE: la data cargada solo cubre agosto 2026. Fuera de ese
 * rango, `getTideAt` tira un error explicito en vez de inventar un numero.
 * Para refrescar: bajar el PDF del mes siguiente de
 * https://www.dhn.mil.pe/portal/pdf-tabla-marea/CALLAO y parsearlo con el
 * mismo formato (ver docs/PLAN.md Fase 2).
 */

type Extreme = { time: string; heightCm: number }

const extremes: Extreme[] = (tideData as { extremes: Extreme[] }).extremes

function findBracket(date: Date): [Extreme, Extreme] {
  const ts = date.getTime()
  for (let i = 0; i < extremes.length - 1; i++) {
    const t1 = new Date(extremes[i].time).getTime()
    const t2 = new Date(extremes[i + 1].time).getTime()
    if (ts >= t1 && ts <= t2) {
      return [extremes[i], extremes[i + 1]]
    }
  }
  const first = new Date(extremes[0].time).getTime()
  const last = new Date(extremes[extremes.length - 1].time).getTime()
  throw new Error(
    `getTideAt: ${date.toISOString()} fuera del rango de datos cargados ` +
      `(${new Date(first).toISOString()} a ${new Date(last).toISOString()}). ` +
      `Falta refrescar data/tides-callao-*.json con el PDF del mes correspondiente.`,
  )
}

function heightAt(date: Date): number {
  const [a, b] = findBracket(date)
  const t1 = new Date(a.time).getTime()
  const t2 = new Date(b.time).getTime()
  const frac = (date.getTime() - t1) / (t2 - t1)
  const cm = a.heightCm + (b.heightCm - a.heightCm) * (1 - Math.cos(Math.PI * frac)) / 2
  return cm / 100
}

export function getTideAt(date: Date): TidePoint {
  const [a, b] = findBracket(date)
  const height = heightAt(date)
  const trend: 'rising' | 'falling' = b.heightCm >= a.heightCm ? 'rising' : 'falling'
  return { time: date.toISOString(), height: Math.round(height * 100) / 100, trend }
}

export function getTideSeries(start: Date, hours: number): TidePoint[] {
  const points: TidePoint[] = []
  for (let i = 0; i < hours; i++) {
    const t = new Date(start.getTime() + i * 3_600_000)
    points.push(getTideAt(t))
  }
  return points
}

export type UpcomingExtreme = { time: string; height: number; kind: 'pleamar' | 'bajamar' }

/** Proximos extremos reales (pleamar/bajamar) despues de `date`, para mostrar en UI. */
export function getUpcomingExtremes(date: Date, count = 2): UpcomingExtreme[] {
  const ts = date.getTime()
  const upcoming = extremes.filter((e) => new Date(e.time).getTime() > ts).slice(0, count)
  return upcoming.map((e, i) => {
    const prev = i === 0 ? extremes[extremes.indexOf(e) - 1] : upcoming[i - 1]
    const kind: 'pleamar' | 'bajamar' = !prev || e.heightCm >= prev.heightCm ? 'pleamar' : 'bajamar'
    return { time: e.time, height: e.heightCm / 100, kind }
  })
}
