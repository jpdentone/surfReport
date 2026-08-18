import Link from 'next/link'
import { getConditions } from '@/lib/openMeteo'
import { SLOTS, addDaysYMD, dayLabel, limaYMD, type Slot } from '@/lib/dates'

export const revalidate = 3600

const FORECAST_DAYS = 7

// Punto de referencia GENERICO para toda la costa de Lima, no un spot real
// (es el mismo punto con el que arrancamos probando la API al inicio del
// proyecto). Esta vista responde "que tan grande va a estar el mar esta
// semana", sin bajar a nivel de playa — para eso esta la vista de detalle.
const REFERENCE_POINT = { lat: -12.13, lon: -77.05 }

function waveBand(height: number): { label: string; color: string; bg: string } {
  if (height < 1.2) return { label: 'pequeño', color: 'var(--ink-muted)', bg: 'var(--bg)' }
  if (height < 2.0) return { label: 'moderado', color: 'var(--go)', bg: 'var(--go-bg)' }
  if (height < 3.0) return { label: 'grande', color: 'var(--tag-intermediate)', bg: 'var(--tag-intermediate-bg)' }
  return { label: 'muy grande', color: 'var(--stop)', bg: 'var(--stop-bg)' }
}

export default async function Semana() {
  const todayYmd = limaYMD(new Date())
  const days = Array.from({ length: FORECAST_DAYS }, (_, i) => addDaysYMD(todayYmd, i))

  const hourly = await getConditions(REFERENCE_POINT.lat, REFERENCE_POINT.lon, FORECAST_DAYS)
  const byTime = new Map(hourly.map((c) => [c.time, c]))

  return (
    <main className="mx-auto flex w-full max-w-md flex-1 flex-col px-4 pb-16 pt-8">
      <header className="mb-6">
        <Link href="/" className="text-xs text-[var(--ink-muted)]">
          ← volver al detalle
        </Link>
        <h1 className="font-display text-2xl italic">La semana</h1>
        <p className="mt-1 text-sm text-[var(--ink-muted)]">
          Tamaño y periodo del swell en la costa de Lima en general — no por playa. Tocá una celda
          para ver el detalle de esa franja.
        </p>
      </header>

      <div className="overflow-x-auto">
        <table className="w-full border-separate" style={{ borderSpacing: '4px' }}>
          <thead>
            <tr>
              <th className="w-16 text-left text-xs font-medium text-[var(--ink-muted)]">día</th>
              {SLOTS.map((slot) => (
                <th key={slot} className="text-xs font-medium text-[var(--ink-muted)]">
                  {slot}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {days.map((ymd) => (
              <tr key={ymd}>
                <td className="pr-1 text-xs font-medium text-[var(--ink-muted)]">
                  {dayLabel(ymd, todayYmd)}
                </td>
                {SLOTS.map((slot: Slot) => {
                  const c = byTime.get(`${ymd}T${slot}`)
                  const band = c ? waveBand(c.swell.height) : null
                  return (
                    <td key={slot} className="text-center">
                      <Link
                        href={`/?day=${ymd}&slot=${slot}`}
                        className="flex flex-col items-center rounded-md px-1 py-1.5 tabular-nums"
                        style={band ? { background: band.bg, color: band.color } : undefined}
                      >
                        {c ? (
                          <>
                            <span className="text-sm font-semibold">{c.swell.height.toFixed(1)}m</span>
                            <span className="text-[10px] opacity-80">{Math.round(c.swell.period)}s</span>
                          </>
                        ) : (
                          <span className="text-xs text-[var(--ink-muted)]">—</span>
                        )}
                      </Link>
                    </td>
                  )
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <p className="mt-4 text-xs text-[var(--ink-muted)]">
        Altura de swell offshore (no la que rompe en cada playa) — pequeño &lt;1.2m · moderado
        1.2-2.0m · grande 2.0-3.0m · muy grande 3.0m+.
      </p>

      <footer className="mt-10 border-t pt-4 text-xs text-[var(--ink-muted)]">
        Oleaje: Open-Meteo. Vista de referencia general, no reemplaza el detalle por playa.
      </footer>
    </main>
  )
}
