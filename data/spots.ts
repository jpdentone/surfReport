import type { Spot } from '../lib/types'

// Coordenadas y gates: valores iniciales a ojo (ver docs/SPOTS.md).
// exposure y ventanas de marea TODAVIA NO estan validados con la escuela —
// ajustar aqui segun la bitacora de docs/SPOTS.md, no en el codigo de scoring.

export const spots: Spot[] = [
  {
    id: 'barranquito',
    name: 'Barranquito',
    coords: { lat: -12.15, lon: -77.025 },
    exposure: 0.55,
    bottom: 'canto-rodado',
    levels: ['kid-beginner', 'beginner'],
    gates: {
      'kid-beginner': { idealBreakingHeight: 0.6, idealPeriod: 10 },
      beginner: { idealBreakingHeight: 0.9, idealPeriod: 12 },
    },
    tide: { min: 0.4, max: 1.2 },
  },
  {
    id: 'redondo',
    name: 'Redondo',
    coords: { lat: -12.132, lon: -77.037 },
    exposure: 0.65,
    bottom: 'canto-rodado',
    levels: ['kid-beginner', 'beginner'],
    gates: {
      'kid-beginner': { idealBreakingHeight: 0.6, idealPeriod: 10 },
      beginner: { idealBreakingHeight: 0.9, idealPeriod: 12 },
    },
    tide: { min: 0.5, max: 1.2 },
  },
  {
    id: 'makaha',
    name: 'Makaha / Waikiki',
    coords: { lat: -12.122, lon: -77.038 },
    exposure: 0.6,
    bottom: 'canto-rodado',
    levels: ['kid-beginner', 'beginner'],
    gates: {
      'kid-beginner': { idealBreakingHeight: 0.6, idealPeriod: 10 },
      beginner: { idealBreakingHeight: 0.9, idealPeriod: 12 },
    },
    tide: { min: 0.4, max: 1.2 },
  },
  {
    id: 'agua-dulce',
    name: 'Agua Dulce',
    coords: { lat: -12.175, lon: -77.028 },
    exposure: 0.6,
    bottom: 'canto-rodado',
    levels: ['kid-beginner', 'beginner'],
    gates: {
      'kid-beginner': { idealBreakingHeight: 0.6, idealPeriod: 10 },
      beginner: { idealBreakingHeight: 0.9, idealPeriod: 12 },
    },
    tide: { min: 0.4, max: 1.2 },
  },
  {
    id: 'la-herradura',
    name: 'La Herradura',
    coords: { lat: -12.17, lon: -77.04 },
    exposure: 0.85,
    bottom: 'reef',
    levels: ['intermediate', 'advanced'],
    gates: {},
    tide: { min: 0.2, max: 1.3 },
  },
  {
    id: 'punta-hermosa',
    name: 'Punta Hermosa',
    coords: { lat: -12.33, lon: -76.83 },
    exposure: 0.9,
    bottom: 'arena',
    levels: ['intermediate', 'advanced'],
    gates: {},
    tide: { min: 0.2, max: 1.3 },
  },
  {
    id: 'punta-rocas',
    name: 'Punta Rocas',
    coords: { lat: -12.36, lon: -76.79 },
    exposure: 0.95,
    bottom: 'reef',
    levels: ['advanced'],
    gates: {},
    tide: { min: 0.2, max: 1.3, prefers: 'rising' },
  },
  {
    id: 'cerro-azul',
    name: 'Cerro Azul',
    coords: { lat: -13.02, lon: -76.48 },
    exposure: 0.9,
    bottom: 'arena',
    levels: ['intermediate', 'advanced'],
    gates: {},
    tide: { min: 0.2, max: 1.3 },
  },
]

export function getSpot(id: string): Spot | undefined {
  return spots.find((s) => s.id === id)
}
