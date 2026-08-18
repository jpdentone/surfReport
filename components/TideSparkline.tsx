import type { TidePoint } from '@/lib/types'
import type { UpcomingExtreme } from '@/lib/tide'

type Props = {
  points: TidePoint[] // serie horaria de un dia, empieza a las 00:00
  markHour: number // 0-23, la hora que se esta marcando (franja seleccionada)
  markHeight: number
  markLabel: string // ej. "hoy 09:00" o "ahora"
  upcoming: UpcomingExtreme[]
}

const WIDTH = 320
const HEIGHT = 68
const CURVE_TOP = 8
const CURVE_BOTTOM = 50
const AXIS_Y = 64

// Horas rotuladas en el eje. Sin esto la curva no dice a que hora pasa cada
// cosa — solo se veia "sube y baja" sin referencia.
const HOUR_TICKS = [0, 6, 12, 18, 24]

function formatHour(iso: string) {
  return new Date(iso).toLocaleTimeString('es-PE', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
    timeZone: 'America/Lima',
  })
}

/**
 * La curva de marea real del dia, dibujada a mano desde los extremos
 * oficiales de DIHIDRONAV (ver lib/tide.ts) — no es decorativa, son los
 * mismos puntos que alimentan el scoring. Es la pieza que hace que este
 * reporte diga algo que ningun pronostico generico dice.
 */
export function TideSparkline({ points, markHour, markHeight, markLabel, upcoming }: Props) {
  const heights = points.map((p) => p.height)
  const min = Math.min(...heights)
  const max = Math.max(...heights)
  const range = max - min || 1

  const hoursSpan = points.length - 1
  const hourToX = (hour: number) => (hour / hoursSpan) * WIDTH

  const toXY = (hourFraction: number, h: number) => {
    const x = hourToX(hourFraction)
    const y = CURVE_TOP + (1 - (h - min) / range) * (CURVE_BOTTOM - CURVE_TOP)
    return [x, y] as const
  }

  const path = points
    .map((p, i) => {
      const [x, y] = toXY(i, p.height)
      return `${i === 0 ? 'M' : 'L'}${x.toFixed(1)},${y.toFixed(1)}`
    })
    .join(' ')

  const [markX, markY] = toXY(markHour, markHeight)

  return (
    <div className="flex flex-col gap-1.5">
      <svg
        viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
        className="w-full"
        role="img"
        aria-label={`Marea ${markLabel} ${markHeight.toFixed(2)} metros`}
      >
        {HOUR_TICKS.slice(1, -1).map((hour) => (
          <line
            key={hour}
            x1={hourToX(hour)}
            x2={hourToX(hour)}
            y1={CURVE_TOP - 4}
            y2={CURVE_BOTTOM + 4}
            stroke="var(--line)"
            strokeWidth="0.75"
          />
        ))}
        <path d={path} fill="none" stroke="var(--tide-line)" strokeWidth="1.5" strokeLinecap="round" />
        <circle cx={markX} cy={markY} r="3.5" fill="var(--accent)" />
        <circle cx={markX} cy={markY} r="7" fill="var(--accent)" opacity="0.18" />
        {HOUR_TICKS.map((hour, i) => (
          <text
            key={hour}
            x={hourToX(hour)}
            y={AXIS_Y}
            fontSize="8"
            fill="var(--ink-muted)"
            textAnchor={i === 0 ? 'start' : i === HOUR_TICKS.length - 1 ? 'end' : 'middle'}
          >
            {String(hour % 24).padStart(2, '0')}h
          </text>
        ))}
      </svg>
      <div className="flex justify-between text-xs text-[var(--ink-muted)] tabular-nums">
        <span>
          {markLabel} <span className="text-[var(--ink)] font-medium">{markHeight.toFixed(2)}m</span>
        </span>
        {upcoming.map((e) => (
          <span key={e.time}>
            {e.kind === 'pleamar' ? '↑' : '↓'} {formatHour(e.time)} · {e.height.toFixed(2)}m
          </span>
        ))}
      </div>
    </div>
  )
}
