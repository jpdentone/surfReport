import { getConditions } from '@/lib/openMeteo'
import { getTideAt, getTideSeries, getUpcomingExtremes } from '@/lib/tide'
import { breakingHeight, evaluate, levelTags as computeLevelTags } from '@/lib/scoring'
import { pickBeginnerSpot } from '@/lib/beginnerChain'
import { plainSummary } from '@/lib/summary'
import { spots } from '@/data/spots'
import type { Region, Spot, Verdict } from '@/lib/types'
import { SLOTS, addDaysYMD, dayLabel, defaultSlot, limaCurrentHour, limaDateTime, limaYMD, type Slot } from '@/lib/dates'
import { TideSparkline } from '@/components/TideSparkline'
import { SpotCard } from '@/components/SpotCard'
import { DaySlotPicker } from '@/components/DaySlotPicker'
import { InfoDrawer } from '@/components/InfoDrawer'
import Link from 'next/link'

export const revalidate = 3600

const FORECAST_DAYS = 7
const LOW_CONFIDENCE_FROM = 5 // dias 6 y 7 (indice 5 y 6): el modelo pierde skill despues del dia 5-7

type Entry = {
  spot: Spot
  verdict: Verdict
  levelTags: ReturnType<typeof computeLevelTags>
  swellDirection?: number
  summary?: string
}

function sortByVerdict(entries: Entry[]) {
  return [...entries].sort((a, b) => {
    if (a.verdict.ok && b.verdict.ok) return b.verdict.score - a.verdict.score
    if (a.verdict.ok) return -1
    if (b.verdict.ok) return 1
    return 0
  })
}

function SpotList({ entries, topPickId }: { entries: Entry[]; topPickId?: string }) {
  return (
    <div className="flex flex-col gap-2.5">
      {entries.map(({ spot, verdict, levelTags, swellDirection, summary }, i) => (
        <SpotCard
          key={spot.id}
          spot={spot}
          verdict={verdict}
          levelTags={levelTags}
          swellDirection={swellDirection}
          summary={summary}
          index={i}
          topPick={spot.id === topPickId}
        />
      ))}
    </div>
  )
}

const REGION_LABELS: Record<Region, string> = {
  'costa-verde': 'Costa Verde',
  'lima-sur': 'Lima Sur',
}

/**
 * Agrupa por region (Costa Verde vs Lima Sur) en vez de mezclar todo en una
 * sola lista — no es lo mismo manejar 15 min que un viaje largo, y esa
 * decision ("¿vale la pena ir hasta Lima Sur hoy?") es previa a cual playa
 * puntual conviene dentro de la region.
 */
function RegionGroupedList({ entries }: { entries: Entry[] }) {
  const topPickId = entries.find((e) => e.verdict.ok)?.spot.id

  const regions: Region[] = ['costa-verde', 'lima-sur']
  const sections = regions
    .map((region) => ({ region, items: entries.filter((e) => e.spot.region === region) }))
    .filter((s) => s.items.length > 0)

  if (sections.length <= 1) {
    return <SpotList entries={entries} topPickId={topPickId} />
  }

  return (
    <div className="flex flex-col gap-5">
      {sections.map(({ region, items }) => (
        <div key={region}>
          <h2 className="mb-2 text-xs font-semibold uppercase tracking-widest text-[var(--ink-muted)]">
            {REGION_LABELS[region]}
          </h2>
          <SpotList entries={items} topPickId={topPickId} />
        </div>
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

  const breakingById: Record<string, number> = {}
  for (const { spot, conditions } of bySpot) {
    if (conditions) breakingById[spot.id] = breakingHeight(spot, conditions)
  }
  const beginnerPick = pickBeginnerSpot(breakingById)

  const entries = sortByVerdict(
    bySpot.map(({ spot, conditions }) => {
      if (!conditions || !tide) {
        return { spot, verdict: { ok: false, reason: 'sin datos de marea/oleaje' } as const, levelTags: [] }
      }
      const breaking = breakingHeight(spot, conditions)
      const verdict = evaluate(spot, conditions, tide)
      const tags = computeLevelTags(spot, breaking, beginnerPick.spotId)
      const summary = plainSummary(breaking, conditions.swell.period, conditions.wind.speed)
      return { spot, verdict, levelTags: tags, swellDirection: conditions.swell.direction, summary }
    }),
  )

  const markLabel = `${dayLabel(selectedDay, todayYmd).toLowerCase()} ${selectedSlot}`
  const nowLabel = now.toLocaleTimeString('es-PE', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
    timeZone: 'America/Lima',
  })

  return (
    <main className="mx-auto flex w-full max-w-md flex-1 flex-col px-4 pb-16 pt-8">
      <header className="mb-6">
        <p className="text-xs uppercase tracking-widest text-[var(--ink-muted)]">
          {dayLabel(selectedDay, todayYmd)} · {selectedSlot}
          <span className="ml-2 normal-case tracking-normal opacity-70">(hora actual {nowLabel})</span>
        </p>
        <div className="flex items-center justify-between">
          <h1 className="font-display text-2xl italic">¿Hay Olas?</h1>
          <div className="flex items-center gap-2">
            <Link
              href="/semana"
              className="rounded-full px-2.5 py-1 text-xs font-medium"
              style={{ background: 'var(--bg-raised)', color: 'var(--ink-muted)', border: '1px solid var(--line)' }}
            >
              semana →
            </Link>
            <InfoDrawer />
          </div>
        </div>

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

      {beginnerPick.spotId === null && (
        <p
          className="mb-4 rounded-sm px-3 py-2 text-sm"
          style={{ background: 'var(--stop-bg)', color: 'var(--stop)' }}
        >
          {beginnerPick.reason === 'muy-grande'
            ? 'Principiantes/niños: sin opción hoy — Barranquito y Ala Moana están muy grandes.'
            : 'Principiantes/niños: sin ola hoy en Barranquito, Redondo ni Delfines.'}
        </p>
      )}

      <RegionGroupedList entries={entries} />

      <footer className="mt-10 border-t pt-4 text-xs text-[var(--ink-muted)]">
        Oleaje y viento: Open-Meteo · Marea: DIHIDRONAV (Callao, agosto 2026) · El score mide
        tamaño + orden de la ola, no si te conviene — mirá las etiquetas de nivel. No reemplaza el
        criterio del instructor en el agua.
      </footer>
    </main>
  )
}
