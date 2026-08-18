'use client'

import { useEffect, useState, type ReactNode } from 'react'

type Group = 'escuela' | 'avanzado'

const STORAGE_KEY = 'surfreport:level-group'

const TABS: { id: Group; label: string }[] = [
  { id: 'escuela', label: 'Escuela (niños)' },
  { id: 'avanzado', label: 'Avanzado' },
]

export function LevelSwitcher({
  escuela,
  avanzado,
}: {
  escuela: ReactNode
  avanzado: ReactNode
}) {
  const [group, setGroup] = useState<Group>('escuela')
  const [ready, setReady] = useState(false)

  useEffect(() => {
    // localStorage no existe en el render del servidor — hay que leerlo
    // recien montado en el cliente, por eso el estado inicial es fijo y se
    // corrige aca. `ready` evita el flash del valor por defecto.
    const saved = window.localStorage.getItem(STORAGE_KEY)
    if (saved === 'escuela' || saved === 'avanzado') {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- lectura unica post-mount de localStorage, no hay forma de evitarla
      setGroup(saved)
    }
    setReady(true)
  }, [])

  function select(g: Group) {
    setGroup(g)
    window.localStorage.setItem(STORAGE_KEY, g)
  }

  return (
    <div className={ready ? '' : 'invisible'}>
      <div
        role="tablist"
        aria-label="Nivel"
        className="mb-4 inline-flex rounded-full p-0.5"
        style={{ background: 'var(--bg-raised)', border: '1px solid var(--line)' }}
      >
        {TABS.map((tab) => (
          <button
            key={tab.id}
            role="tab"
            aria-selected={group === tab.id}
            onClick={() => select(tab.id)}
            className="rounded-full px-3.5 py-1.5 text-sm font-medium transition-colors"
            style={
              group === tab.id
                ? { background: 'var(--accent)', color: 'var(--bg-raised)' }
                : { color: 'var(--ink-muted)' }
            }
          >
            {tab.label}
          </button>
        ))}
      </div>

      {group === 'escuela' ? escuela : avanzado}
    </div>
  )
}
