import type { Spot } from '../lib/types'

// Coordenadas, exposure y ventanas de marea: valores iniciales a ojo (ver
// docs/SPOTS.md). TODAVIA NO estan validados con la escuela — ajustar aqui
// segun la bitacora de docs/SPOTS.md, no en el codigo de scoring. `levels`
// es la lista de niveles que este spot PUEDE llegar a servir; cual aplica
// hoy depende del tamano real de la ola (ver lib/scoring.ts levelTags()).

export const spots: Spot[] = [
  {
    id: 'barranquito',
    name: 'Barranquito',
    region: 'costa-verde',
    coords: { lat: -12.15, lon: -77.025 },
    exposure: 0.55,
    bottom: 'canto-rodado',
    levels: ['kid-beginner', 'beginner'],
    tide: { min: 0.4, max: 1.2 },
  },
  {
    id: 'redondo',
    name: 'Redondo',
    region: 'costa-verde',
    coords: { lat: -12.132, lon: -77.037 },
    exposure: 0.65,
    bottom: 'canto-rodado',
    levels: ['kid-beginner', 'beginner'],
    tide: { min: 0.5, max: 1.2 },
  },
  {
    id: 'makaha',
    name: 'Makaha / Waikiki',
    region: 'costa-verde',
    coords: { lat: -12.122, lon: -77.038 },
    exposure: 0.6,
    bottom: 'canto-rodado',
    levels: ['kid-beginner', 'beginner'],
    tide: { min: 0.4, max: 1.2 },
  },
  {
    id: 'ala-moana',
    name: 'Ala Moana',
    region: 'costa-verde',
    coords: { lat: -12.1567, lon: -77.0267 },
    exposure: 0.6,
    bottom: 'canto-rodado',
    levels: ['kid-beginner', 'beginner'],
    tide: { min: 0.4, max: 1.2 },
  },
  {
    id: 'punta-roquitas',
    name: 'Punta Roquitas',
    region: 'costa-verde',
    coords: { lat: -12.1211, lon: -77.0439 },
    exposure: 0.55,
    bottom: 'canto-rodado',
    levels: ['kid-beginner', 'beginner'],
    tide: { min: 0.4, max: 1.2 },
  },
  {
    id: 'delfines',
    name: 'Delfines',
    region: 'costa-verde',
    coords: { lat: -12.1122, lon: -77.0467 },
    exposure: 0.55,
    bottom: 'canto-rodado',
    levels: ['kid-beginner', 'beginner'],
    tide: { min: 0.4, max: 1.2 },
  },
  {
    id: 'la-pampilla',
    name: 'La Pampilla',
    region: 'costa-verde',
    coords: { lat: -12.1233, lon: -77.0422 },
    exposure: 0.7,
    bottom: 'canto-rodado',
    levels: ['intermediate', 'advanced'],
    tide: { min: 0.3, max: 1.3 },
  },
  {
    id: 'la-herradura',
    name: 'La Herradura',
    region: 'costa-verde',
    coords: { lat: -12.17, lon: -77.04 },
    exposure: 0.85,
    bottom: 'reef',
    levels: ['intermediate', 'advanced'],
    tide: { min: 0.2, max: 1.3 },
  },
  {
    id: 'san-bartolo',
    name: 'San Bartolo',
    region: 'lima-sur',
    coords: { lat: -12.3865, lon: -76.7835 },
    exposure: 0.75,
    bottom: 'canto-rodado',
    levels: ['beginner', 'intermediate'],
    tide: { min: 0.2, max: 1.3 },
  },
  {
    id: 'punta-hermosa',
    name: 'Punta Hermosa',
    region: 'lima-sur',
    coords: { lat: -12.33, lon: -76.83 },
    exposure: 0.9,
    bottom: 'arena',
    levels: ['intermediate', 'advanced'],
    tide: { min: 0.2, max: 1.3 },
  },
  {
    id: 'punta-rocas',
    name: 'Punta Rocas',
    region: 'lima-sur',
    coords: { lat: -12.36, lon: -76.79 },
    exposure: 0.95,
    bottom: 'reef',
    levels: ['advanced'],
    tide: { min: 0.2, max: 1.3, prefers: 'rising' },
  },
  {
    id: 'cerro-azul',
    name: 'Cerro Azul',
    region: 'lima-sur',
    coords: { lat: -13.02, lon: -76.48 },
    exposure: 0.9,
    bottom: 'arena',
    levels: ['intermediate', 'advanced'],
    tide: { min: 0.2, max: 1.3 },
  },
]

export function getSpot(id: string): Spot | undefined {
  return spots.find((s) => s.id === id)
}
