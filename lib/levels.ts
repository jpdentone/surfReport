import type { Level } from './types'

export const LEVEL_LABELS: Record<Level, string> = {
  'kid-beginner': 'niños',
  beginner: 'principiante',
  intermediate: 'intermedio',
  advanced: 'avanzado',
}

export const LEVEL_COLORS: Record<Level, { color: string; bg: string }> = {
  'kid-beginner': { color: 'var(--tag-kid)', bg: 'var(--tag-kid-bg)' },
  beginner: { color: 'var(--tag-beginner)', bg: 'var(--tag-beginner-bg)' },
  intermediate: { color: 'var(--tag-intermediate)', bg: 'var(--tag-intermediate-bg)' },
  advanced: { color: 'var(--tag-advanced)', bg: 'var(--tag-advanced-bg)' },
}
