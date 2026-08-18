export type Level = 'kid-beginner' | 'beginner' | 'intermediate' | 'advanced'

export type Bottom = 'canto-rodado' | 'arena' | 'reef'

export type Region = 'costa-verde' | 'lima-sur'

/**
 * Que tan facil es salir y volver — el factor que de verdad decide si un
 * chico la pasa bien, mas que el tamano de la ola:
 *  - 'channel': hay canal, se sale y se vuelve tranquilo.
 *  - 'suave':   sin canal, pero la ola rompe blanda y esparcida en varias
 *               secciones, asi que la espuma no se apila (ej. Makaha).
 *  - 'cierra':  sin canal y cierra parejo — la regresada se complica con
 *               una ola tras otra. Solo sirve para principiantes cuando
 *               esta realmente chico (ahi se forma canal).
 */
export type Salida = 'channel' | 'suave' | 'cierra'

export type Spot = {
  id: string
  name: string
  region: Region
  // coords YA corregidas a una celda oceanica valida (ver docs/PLAN.md)
  coords: { lat: number; lon: number }
  // Rumbo (grados) hacia el que mira la playa, CALCULADO de la geometria
  // real de costa de OpenStreetMap — no estimado a ojo. Ver docs/SPOTS.md.
  facing: number
  // 0-1: cuanto del swell offshore llega a romper cuando entra de frente.
  // La atenuacion por angulo se calcula aparte (ver lib/scoring.ts).
  exposurePeak: number
  salida: Salida
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
