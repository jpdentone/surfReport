export type Level = 'kid-beginner' | 'beginner' | 'intermediate' | 'advanced'

export type Bottom = 'canto-rodado' | 'arena' | 'reef'

export type Gates = {
  maxBreakingHeight: number // m
  maxPeriod: number // s — mas periodo = mas fuerza, peor para novato
  minTide?: number // gate de seguridad en canto rodado
  maxWind?: number // km/h
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
