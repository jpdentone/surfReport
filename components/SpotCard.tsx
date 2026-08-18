import type { Level, Spot, Verdict } from '@/lib/types'
import { LEVEL_COLORS, LEVEL_LABELS } from '@/lib/levels'
import { SwellDirection } from './SwellDirection'

export function SpotCard({
  spot,
  verdict,
  levelTags,
  swellDirection,
  index,
  topPick = false,
}: {
  spot: Spot
  verdict: Verdict
  levelTags: Level[]
  swellDirection?: number
  index: number
  topPick?: boolean
}) {
  const ok = verdict.ok

  return (
    <article
      className="rise-in flex flex-col gap-1.5 rounded-sm border-l-[3px] px-4 py-3.5 transition-colors"
      style={{
        background: 'var(--bg-raised)',
        borderLeftColor: topPick ? 'var(--accent)' : 'var(--line)',
        animationDelay: `${index * 40}ms`,
      }}
    >
      {topPick && (
        <span
          className="self-start rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide"
          style={{ background: 'var(--accent)', color: 'var(--bg-raised)' }}
        >
          mejor hoy
        </span>
      )}

      <div className="flex items-baseline justify-between gap-3">
        <h3 className="font-display text-lg leading-tight">{spot.name}</h3>
        {ok ? (
          <span
            className="shrink-0 rounded-full px-2 py-0.5 text-xs font-semibold tabular-nums"
            style={{ background: 'var(--go-bg)', color: 'var(--go)' }}
          >
            {verdict.score}
          </span>
        ) : (
          <span
            className="shrink-0 rounded-full px-2 py-0.5 text-xs font-semibold"
            style={{ background: 'var(--stop-bg)', color: 'var(--stop)' }}
          >
            sin datos
          </span>
        )}
      </div>

      {swellDirection !== undefined && <SwellDirection degrees={swellDirection} />}

      {ok && (
        <div className="flex flex-wrap gap-1.5">
          {levelTags.length > 0 ? (
            levelTags.map((level) => (
              <span
                key={level}
                className="rounded-full px-2 py-0.5 text-[11px] font-medium"
                style={{ background: LEVEL_COLORS[level].bg, color: LEVEL_COLORS[level].color }}
              >
                {LEVEL_LABELS[level]}
              </span>
            ))
          ) : (
            <span className="text-[11px] italic text-[var(--ink-muted)]">
              sin nivel claro hoy con este tamaño
            </span>
          )}
        </div>
      )}

      {ok ? (
        <p className="text-sm text-[var(--ink-muted)] tabular-nums">{verdict.notes.join(' · ')}</p>
      ) : (
        <p className="text-sm" style={{ color: 'var(--stop)' }}>
          {verdict.reason}
        </p>
      )}
    </article>
  )
}
