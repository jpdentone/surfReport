import { toCardinal } from '@/lib/direction'

/**
 * Mini rosa de los vientos: la flecha apunta hacia el rumbo del que viene
 * el swell (convencion meteorologica estandar, igual que la direccion del
 * viento). Es importante mostrarlo porque el mismo swell "grande" puede no
 * llegar igual a cada playa segun de donde venga.
 */
export function SwellDirection({ degrees, size = 22 }: { degrees: number; size?: number }) {
  const cardinal = toCardinal(degrees)

  return (
    <span className="inline-flex items-center gap-1.5" title={`Swell del ${cardinal} (${Math.round(degrees)}°)`}>
      <svg width={size} height={size} viewBox="0 0 24 24" className="shrink-0">
        <circle cx="12" cy="12" r="10.5" fill="none" stroke="var(--line)" strokeWidth="1" />
        <g transform={`rotate(${degrees} 12 12)`}>
          <line x1="12" y1="12" x2="12" y2="4" stroke="var(--tide-line)" strokeWidth="1.6" strokeLinecap="round" />
          <path d="M12 2.5 L15 7 L12 5.5 L9 7 Z" fill="var(--tide-line)" />
        </g>
      </svg>
      <span className="text-xs font-medium tabular-nums text-[var(--ink-muted)]">
        {cardinal} · {Math.round(degrees)}°
      </span>
    </span>
  )
}
