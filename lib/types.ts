export type Level = 'kid-beginner' | 'beginner' | 'intermediate' | 'advanced'

export type Bottom = 'canto-rodado' | 'arena' | 'reef'

export type Region = 'costa-verde' | 'lima-sur'

export type Spot = {
  id: string
  name: string
  region: Region
  // coords YA corregidas a una celda oceanica valida (ver docs/PLAN.md)
  coords: { lat: number; lon: number }
  exposure: number // 0-1, atenuacion del swell offshore al romper
  bottom: Bottom
  // niveles que ESTE spot puede llegar a servir (segun conocimiento local /
  // fuente). Cual de ellos aplica HOY sale de la altura real rompiendo —
  // ver lib/scoring.ts `levelTags()`. No es un gate, es solo elegibilidad.
  levels: Level[]
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
