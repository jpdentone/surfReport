import { getConditions } from '@/lib/openMeteo'
import { getTideAt, getTideSeries, getUpcomingExtremes } from '@/lib/tide'
import { evaluate } from '@/lib/scoring'
import { spots } from '@/data/spots'
import type { Level, Spot, Verdict } from '@/lib/types'
import { TideSparkline } from '@/components/TideSparkline'
import { SpotCard } from '@/components/SpotCard'
import { LevelSwitcher } from '@/components/LevelSwitcher'

export const revalidate = 3600

function pickLevel(spot: Spot, preferred: Level, fallback: Level): Level {
  return spot.levels.includes(preferred) ? preferred : fallback
}

type Entry = { spot: Spot; verdict: Verdict; swellDirection?: number }

function sortByVerdict(entries: Entry[]) {
  return [...entries].sort((a, b) => {
    if (a.verdict.ok && b.verdict.ok) return b.verdict.score - a.verdict.score
    if (a.verdict.ok) return -1
    if (b.verdict.ok) return 1
    return 0
  })
}

function SpotList({ entries }: { entries: Entry[] }) {
  return (
    <div className="flex flex-col gap-2.5">
      {entries.map(({ spot, verdict, swellDirection }, i) => (
        <SpotCard key={spot.id} spot={spot} verdict={verdict} swellDirection={swellDirection} index={i} />
      ))}
    </div>
  )
}

export default async function Home() {
  const now = new Date()
  const today = new Date(now)
  today.setMinutes(0, 0, 0)

  const bySpot = await Promise.all(
    spots.map(async (spot) => {
      const conditions = await getConditions(spot.coords.lat, spot.coords.lon, 1)
      return { spot, conditions: conditions[0] }
    }),
  )

  let tide
  let sparkline: { points: ReturnType<typeof getTideSeries>; upcoming: ReturnType<typeof getUpcomingExtremes> } | null = null
  try {
    tide = getTideAt(now)
    sparkline = { points: getTideSeries(today, 25), upcoming: getUpcomingExtremes(now, 2) }
  } catch {
    tide = null
  }

  const escuela = sortByVerdict(
    bySpot
      .filter(({ spot }) => spot.levels.includes('kid-beginner') || spot.levels.includes('beginner'))
      .map(({ spot, conditions }) => {
        const level = pickLevel(spot, 'kid-beginner', 'beginner')
        const verdict =
          conditions && tide
            ? evaluate(spot, conditions, tide, level)
            : ({ ok: false, reason: 'sin datos de marea/oleaje' } as const)
        return { spot, verdict, swellDirection: conditions?.swell.direction }
      }),
  )

  const avanzado = sortByVerdict(
    bySpot
      .filter(({ spot }) => spot.levels.includes('advanced') || spot.levels.includes('intermediate'))
      .map(({ spot, conditions }) => {
        const level = pickLevel(spot, 'advanced', 'intermediate')
        const verdict =
          conditions && tide
            ? evaluate(spot, conditions, tide, level)
            : ({ ok: false, reason: 'sin datos de marea/oleaje' } as const)
        return { spot, verdict, swellDirection: conditions?.swell.direction }
      }),
  )

  const dateLabel = now.toLocaleDateString('es-PE', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    timeZone: 'America/Lima',
  })

  return (
    <main className="mx-auto flex w-full max-w-md flex-1 flex-col px-4 pb-16 pt-8">
      <header className="mb-6">
        <p className="text-xs uppercase tracking-widest text-[var(--ink-muted)]">{dateLabel}</p>
        <h1 className="font-display text-2xl italic">surfReport Lima</h1>

        <div className="mt-4">
          {sparkline ? (
            <TideSparkline points={sparkline.points} nowHeight={tide!.height} upcoming={sparkline.upcoming} />
          ) : (
            <p className="text-sm" style={{ color: 'var(--stop)' }}>
              Sin datos de marea para hoy — falta refrescar la tabla del mes (ver docs/PLAN.md).
            </p>
          )}
        </div>
      </header>

      <LevelSwitcher
        escuela={<SpotList entries={escuela} />}
        avanzado={<SpotList entries={avanzado} />}
      />

      <footer className="mt-10 border-t pt-4 text-xs text-[var(--ink-muted)]">
        Oleaje y viento: Open-Meteo · Marea: DIHIDRONAV (Callao, agosto 2026) · No reemplaza el
        criterio del instructor en el agua.
      </footer>
    </main>
  )
}
