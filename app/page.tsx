import { getConditions } from '@/lib/openMeteo'
import { getTideAt, getTideSeries, getUpcomingExtremes } from '@/lib/tide'
import { evaluate } from '@/lib/scoring'
import { spots } from '@/data/spots'
import type { Level, Spot, Verdict } from '@/lib/types'
import { SLOTS, addDaysYMD, dayLabel, defaultSlot, limaCurrentHour, limaDateTime, limaYMD, type Slot } from '@/lib/dates'
import { TideSparkline } from '@/components/TideSparkline'
import { SpotCard } from '@/components/SpotCard'
import { LevelSwitcher } from '@/components/LevelSwitcher'
import { DaySlotPicker } from '@/components/DaySlotPicker'

export const revalidate = 3600

const FORECAST_DAYS = 7
const LOW_CONFIDENCE_FROM = 5 // dias 6 y 7 (indice 5 y 6): el modelo pierde skill despues del dia 5-7

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

function SpotList({ entries, markTopPick = false }: { entries: Entry[]; markTopPick?: boolean }) {
  return (
    <div className="flex flex-col gap-2.5">
      {entries.map(({ spot, verdict, swellDirection }, i) => (
        <SpotCard
          key={spot.id}
          spot={spot}
          verdict={verdict}
          swellDirection={swellDirection}
          index={i}
          topPick={markTopPick && i === 0 && verdict.ok}
        />
      ))}
    </div>
  )
}

type PageProps = {
  searchParams: Promise<{ day?: string; slot?: string }>
}

export default async function Home({ searchParams }: PageProps) {
  const now = new Date()
  const todayYmd = limaYMD(now)
  const days = Array.from({ length: FORECAST_DAYS }, (_, i) => addDaysYMD(todayYmd, i))

  const sp = await searchParams
  const selectedDay = days.includes(sp.day ?? '') ? (sp.day as string) : todayYmd
  const selectedSlot = (SLOTS as readonly string[]).includes(sp.slot ?? '')
    ? (sp.slot as Slot)
    : defaultSlot(limaCurrentHour(now))

  const targetDateTime = limaDateTime(selectedDay, selectedSlot)

  const bySpot = await Promise.all(
    spots.map(async (spot) => {
      const hourly = await getConditions(spot.coords.lat, spot.coords.lon, FORECAST_DAYS)
      const conditions = hourly.find((c) => c.time === `${selectedDay}T${selectedSlot}`)
      return { spot, conditions }
    }),
  )

  let tide
  let sparkline: { points: ReturnType<typeof getTideSeries>; upcoming: ReturnType<typeof getUpcomingExtremes> } | null = null
  try {
    tide = getTideAt(targetDateTime)
    const startOfSelectedDay = limaDateTime(selectedDay, '00:00')
    sparkline = { points: getTideSeries(startOfSelectedDay, 25), upcoming: getUpcomingExtremes(targetDateTime, 2) }
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

  const markLabel = `${dayLabel(selectedDay, todayYmd).toLowerCase()} ${selectedSlot}`

  return (
    <main className="mx-auto flex w-full max-w-md flex-1 flex-col px-4 pb-16 pt-8">
      <header className="mb-6">
        <p className="text-xs uppercase tracking-widest text-[var(--ink-muted)]">
          {dayLabel(selectedDay, todayYmd)} · {selectedSlot}
        </p>
        <h1 className="font-display text-2xl italic">surfReport Lima</h1>

        <div className="mt-4">
          {sparkline ? (
            <TideSparkline
              points={sparkline.points}
              markHour={Number(selectedSlot.slice(0, 2))}
              markHeight={tide!.height}
              markLabel={markLabel}
              upcoming={sparkline.upcoming}
            />
          ) : (
            <p className="text-sm" style={{ color: 'var(--stop)' }}>
              Sin datos de marea para esa fecha — falta refrescar la tabla del mes (ver docs/PLAN.md).
            </p>
          )}
        </div>
      </header>

      <DaySlotPicker
        days={days}
        todayYmd={todayYmd}
        selectedDay={selectedDay}
        selectedSlot={selectedSlot}
        lowConfidenceFrom={LOW_CONFIDENCE_FROM}
      />

      <LevelSwitcher
        escuela={<SpotList entries={escuela} markTopPick />}
        avanzado={<SpotList entries={avanzado} />}
      />

      <footer className="mt-10 border-t pt-4 text-xs text-[var(--ink-muted)]">
        Oleaje y viento: Open-Meteo · Marea: DIHIDRONAV (Callao, agosto 2026) · No reemplaza el
        criterio del instructor en el agua.
      </footer>
    </main>
  )
}
