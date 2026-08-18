export const SLOTS = ['06:00', '09:00', '12:00', '15:00', '18:00'] as const
export type Slot = (typeof SLOTS)[number]

/** Fecha calendario (YYYY-MM-DD) de `date` en hora de Lima. */
export function limaYMD(date: Date): string {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'America/Lima',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(date)
}

/** Suma `days` dias calendario a un YYYY-MM-DD (aritmetica de calendario, no de instante). */
export function addDaysYMD(ymd: string, days: number): string {
  const [y, m, d] = ymd.split('-').map(Number)
  const t = Date.UTC(y, m - 1, d + days)
  return new Date(t).toISOString().slice(0, 10)
}

/** Instante real (Date) para un YMD + hora en Lima (UTC-5 fijo, sin horario de verano). */
export function limaDateTime(ymd: string, hourMinute: string): Date {
  return new Date(`${ymd}T${hourMinute}:00-05:00`)
}

export function dayLabel(ymd: string, todayYmd: string): string {
  const tomorrowYmd = addDaysYMD(todayYmd, 1)
  if (ymd === todayYmd) return 'Hoy'
  if (ymd === tomorrowYmd) return 'Mañana'
  const [y, m, d] = ymd.split('-').map(Number)
  const date = new Date(Date.UTC(y, m - 1, d, 12))
  const weekday = date.toLocaleDateString('es-PE', { weekday: 'short', timeZone: 'UTC' })
  return `${weekday.charAt(0).toUpperCase()}${weekday.slice(1)} ${d}`
}

/** Hora actual en Lima (0-23), para elegir la franja por defecto. */
export function limaCurrentHour(date: Date): number {
  return Number(
    new Intl.DateTimeFormat('en-US', { timeZone: 'America/Lima', hour: '2-digit', hour12: false }).format(date),
  )
}

export function defaultSlot(currentHour: number): Slot {
  return SLOTS.find((s) => Number(s.slice(0, 2)) >= currentHour) ?? SLOTS[SLOTS.length - 1]
}
