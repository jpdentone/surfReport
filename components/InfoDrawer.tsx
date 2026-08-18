'use client'

import { useEffect, useState } from 'react'

const TERMS: { term: string; explanation: string }[] = [
  {
    term: 'Score',
    explanation:
      'Qué tanta ola hay y qué tan ordenada viene. No dice si te conviene — para eso mirá las etiquetas de color de abajo.',
  },
  {
    term: 'Periodo',
    explanation:
      'Cada cuántos segundos llega una ola. Más segundos = ola más ordenada y con más fuerza (una de 14s pega más fuerte que una de 8s aunque midan lo mismo).',
  },
  {
    term: 'Marea "en ventana"',
    explanation:
      'La altura del agua está en el rango bueno para esa playa — ni tan baja que queden piedras expuestas, ni tan alta que tape la ola.',
  },
  {
    term: 'Etiquetas de nivel',
    explanation:
      'A quién le sirve esa playa hoy con ese tamaño de ola (niños, principiante, intermedio, avanzado). Si no hay ninguna, hoy no calza para nadie en ese spot.',
  },
  {
    term: 'Dirección (ej. "SO 219°")',
    explanation: 'De dónde viene el swell. En Lima casi siempre es del suroeste.',
  },
]

export function InfoDrawer() {
  const [open, setOpen] = useState(false)

  useEffect(() => {
    if (!open) return
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') setOpen(false)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open])

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        aria-label="Qué significan estos datos"
        className="flex h-6 w-6 items-center justify-center rounded-full text-xs font-semibold"
        style={{ background: 'var(--bg-raised)', color: 'var(--ink-muted)', border: '1px solid var(--line)' }}
      >
        i
      </button>

      {open && (
        // Bottom sheet en celular (se alcanza con el pulgar), modal centrado
        // en desktop — un panel que sube desde abajo se siente raro con mouse.
        <div className="fixed inset-0 z-50 flex items-end justify-center md:items-center md:p-6">
          <button
            aria-label="Cerrar"
            onClick={() => setOpen(false)}
            className="absolute inset-0"
            style={{ background: 'rgba(0,0,0,0.4)' }}
          />
          <div
            role="dialog"
            aria-modal="true"
            aria-label="Qué significan estos datos"
            className="rise-in relative max-h-[85vh] w-full max-w-md overflow-y-auto rounded-t-2xl px-5 pb-8 pt-4 md:max-w-lg md:rounded-2xl md:pb-6 md:shadow-xl"
            style={{ background: 'var(--bg-raised)', animationDuration: '0.25s' }}
          >
            <div className="mx-auto mb-3 h-1 w-10 rounded-full md:hidden" style={{ background: 'var(--line)' }} />
            <div className="flex items-center justify-between">
              <h2 className="font-display text-lg">Qué significa esto</h2>
              <button
                onClick={() => setOpen(false)}
                aria-label="Cerrar"
                className="text-sm text-[var(--ink-muted)]"
              >
                cerrar
              </button>
            </div>
            <dl className="mt-3 flex flex-col gap-3">
              {TERMS.map((t) => (
                <div key={t.term}>
                  <dt className="text-sm font-semibold">{t.term}</dt>
                  <dd className="text-sm text-[var(--ink-muted)]">{t.explanation}</dd>
                </div>
              ))}
            </dl>
          </div>
        </div>
      )}
    </>
  )
}
