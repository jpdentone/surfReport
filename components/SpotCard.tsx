import type { Spot, Verdict } from '@/lib/types'
import { SwellDirection } from './SwellDirection'

export function SpotCard({
  spot,
  verdict,
  swellDirection,
  index,
}: {
  spot: Spot
  verdict: Verdict
  swellDirection?: number
  index: number
}) {
  const ok = verdict.ok

  return (
    <article
      className="rise-in flex flex-col gap-1.5 rounded-sm border-l-[3px] bg-[var(--bg-raised)] px-4 py-3.5 transition-colors"
      style={{
        borderLeftColor: ok ? 'var(--go)' : 'var(--stop)',
        animationDelay: `${index * 40}ms`,
      }}
    >
      <div className="flex items-baseline justify-between gap-3">
        <h3 className="font-display text-lg leading-tight">{spot.name}</h3>
        {ok ? (
          <span
            className="shrink-0 rounded-full px-2 py-0.5 text-xs font-semibold tabular-nums"
            style={{ background: 'var(--go-bg)', color: 'var(--go)' }}
          >
            sí · {verdict.score}
          </span>
        ) : (
          <span
            className="shrink-0 rounded-full px-2 py-0.5 text-xs font-semibold"
            style={{ background: 'var(--stop-bg)', color: 'var(--stop)' }}
          >
            no
          </span>
        )}
      </div>

      {swellDirection !== undefined && (
        <SwellDirection degrees={swellDirection} />
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
