import Link from 'next/link'
import { SLOTS, dayLabel, type Slot } from '@/lib/dates'

/**
 * Selector de dia + franja horaria, todo por query params (?day=YYYY-MM-DD
 * &slot=09:00) — sin estado de cliente, sin JS. Asi la pagina es bookmarkable
 * ("mandame el link de manana 15:00") y el server component recalcula solo
 * lo que hace falta, sin mandar los 7 dias x 5 franjas al navegador.
 */
export function DaySlotPicker({
  days,
  todayYmd,
  selectedDay,
  selectedSlot,
  lowConfidenceFrom,
}: {
  days: string[]
  todayYmd: string
  selectedDay: string
  selectedSlot: Slot
  lowConfidenceFrom: number
}) {
  function pillClass(active: boolean) {
    return `shrink-0 rounded-full px-3 py-1.5 text-sm font-medium transition-colors ${
      active ? '' : 'text-[var(--ink-muted)]'
    }`
  }
  function pillStyle(active: boolean) {
    return active ? { background: 'var(--accent)', color: 'var(--bg-raised)' } : undefined
  }

  return (
    <div className="mb-4 flex flex-col gap-2">
      <div className="flex gap-1.5 overflow-x-auto pb-1" role="tablist" aria-label="Dia">
        {days.map((ymd, i) => (
          <Link
            key={ymd}
            href={`/?day=${ymd}&slot=${selectedSlot}`}
            role="tab"
            aria-selected={ymd === selectedDay}
            className={pillClass(ymd === selectedDay)}
            style={pillStyle(ymd === selectedDay)}
          >
            {dayLabel(ymd, todayYmd)}
            {i >= lowConfidenceFrom && <span className="ml-0.5 opacity-60">*</span>}
          </Link>
        ))}
      </div>

      <div className="flex gap-1.5" role="tablist" aria-label="Franja horaria">
        {SLOTS.map((slot) => (
          <Link
            key={slot}
            href={`/?day=${selectedDay}&slot=${slot}`}
            role="tab"
            aria-selected={slot === selectedSlot}
            className={pillClass(slot === selectedSlot)}
            style={pillStyle(slot === selectedSlot)}
          >
            {slot}
          </Link>
        ))}
      </div>

      {days.indexOf(selectedDay) >= lowConfidenceFrom && (
        <p className="text-xs text-[var(--ink-muted)]">
          * Pronóstico a {days.indexOf(selectedDay) + 1} días — menos confiable que los primeros.
        </p>
      )}
    </div>
  )
}
