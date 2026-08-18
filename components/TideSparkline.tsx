import type { TidePoint } from '@/lib/types'
import type { UpcomingExtreme } from '@/lib/tide'

type Props = {
  points: TidePoint[] // serie horaria, la primera es "ahora"
  nowHeight: number
  upcoming: UpcomingExtreme[]
}

const WIDTH = 320
const HEIGHT = 56
const PAD_Y = 8

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
export function TideSparkline({ points, nowHeight, upcoming }: Props) {
  const heights = points.map((p) => p.height)
  const min = Math.min(...heights)
  const max = Math.max(...heights)
  const range = max - min || 1

  const toXY = (i: number, h: number) => {
    const x = (i / (points.length - 1)) * WIDTH
    const y = PAD_Y + (1 - (h - min) / range) * (HEIGHT - PAD_Y * 2)
    return [x, y] as const
  }

  const path = points
    .map((p, i) => {
      const [x, y] = toXY(i, p.height)
      return `${i === 0 ? 'M' : 'L'}${x.toFixed(1)},${y.toFixed(1)}`
    })
    .join(' ')

  const [nowX, nowY] = toXY(0, nowHeight)

  return (
    <div className="flex flex-col gap-1.5">
      <svg
        viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
        className="w-full"
        role="img"
        aria-label={`Marea actual ${nowHeight.toFixed(2)} metros`}
      >
        <path d={path} fill="none" stroke="var(--tide-line)" strokeWidth="1.5" strokeLinecap="round" />
        <circle cx={nowX} cy={nowY} r="3.5" fill="var(--accent)" />
        <circle cx={nowX} cy={nowY} r="7" fill="var(--accent)" opacity="0.18" />
      </svg>
      <div className="flex justify-between text-xs text-[var(--ink-muted)] tabular-nums">
        <span>
          ahora <span className="text-[var(--ink)] font-medium">{nowHeight.toFixed(2)}m</span>
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
