export type Level = 'kid-beginner' | 'beginner' | 'intermediate' | 'advanced'

export type Bottom = 'canto-rodado' | 'arena' | 'reef'

export type Gates = {
  // Punto de referencia "comodo para aprender" — mientras mas cerca este
  // la condicion real de esto, mas alto el score. Sin umbral duro: nunca
  // cierra la playa por si sola, solo influye el ranking (ver CLAUDE.md,
  // decision #2 — a pedido, ninguna condicion cierra playas de escuela).
  idealBreakingHeight: number // m
  idealPeriod: number // s
}

export type Spot = {
  id: string
  name: string
  // coords YA corregidas a una celda oceanica valida (ver docs/PLAN.md)
  coords: { lat: number; lon: number }
  exposure: number // 0-1, atenuacion del swell offshore al romper
  bottom: Bottom
  levels: Level[]
  gates: Partial<Record<Level, Gates>>
  tide: { min: number; max: number; prefers?: 'rising' | 'falling' }
}

export type Conditions = {
  time: string // ISO, America/Lima
  swell: { height: number; period: number; direction: number }
  wind: { speed: number; direction: number }
  waterTemp: number | null
}

export type TidePoint = {
  time: string
  height: number
  trend: 'rising' | 'falling'
}

export type Verdict =
  | { ok: true; score: number; notes: string[] }
  | { ok: false; reason: string }
