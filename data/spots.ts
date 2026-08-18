import type { Spot } from '../lib/types'

// `facing` (rumbo hacia el que mira cada playa) esta CALCULADO de la geometria
// real de costa de OpenStreetMap, no estimado a ojo — ver docs/SPOTS.md para
// el metodo. Las coords estan pegadas a la linea de costa por el mismo
// calculo (varias venian de busquedas web y caian tierra adentro).
//
// `exposurePeak`, `salida` y las ventanas de marea SI son valores locales:
// vienen del conocimiento del usuario o estan puestos a ojo. Ajustar aqui
// segun la bitacora de docs/SPOTS.md, no en el codigo de scoring.

export const spots: Spot[] = [
  {
    id: 'barranquito',
    name: 'Barranquito',
    region: 'costa-verde',
    coords: { lat: -12.15, lon: -77.0249 },
    facing: 264,
    exposurePeak: 0.62,
    salida: 'channel',
    bottom: 'canto-rodado',
    levels: ['kid-beginner', 'beginner'],
    tide: { min: 0.4, max: 1.2 },
  },
  {
    id: 'redondo',
    name: 'Redondo',
    region: 'costa-verde',
    coords: { lat: -12.1322, lon: -77.0367 },
    facing: 227,
    exposurePeak: 0.62,
    salida: 'channel',
    bottom: 'canto-rodado',
    levels: ['kid-beginner', 'beginner'],
    tide: { min: 0.5, max: 1.2 },
  },
  {
    id: 'makaha',
    name: 'Makaha / Waikiki',
    region: 'costa-verde',
    coords: { lat: -12.1247, lon: -77.0403 },
    facing: 224,
    exposurePeak: 0.62,
    // sin canal, pero rompe blanda y esparcida en 3-4 secciones: la espuma
    // no se apila, asi que el chico puede ir avanzando de a poco.
    salida: 'suave',
    bottom: 'canto-rodado',
    levels: ['kid-beginner', 'beginner'],
    tide: { min: 0.4, max: 1.2 },
  },
  {
    id: 'ala-moana',
    name: 'Ala Moana',
    region: 'costa-verde',
    coords: { lat: -12.1567, lon: -77.0265 },
    // la mas tapada de todas (mira al ONO) — por eso es la playa a la que
    // se van cuando Barranquito esta muy grande.
    facing: 290,
    exposurePeak: 0.62,
    salida: 'channel',
    bottom: 'canto-rodado',
    levels: ['kid-beginner', 'beginner'],
    tide: { min: 0.4, max: 1.2 },
  },
  {
    id: 'punta-roquitas',
    name: 'Punta Roquitas / 3 Picos',
    region: 'costa-verde',
    coords: { lat: -12.1222, lon: -77.0446 },
    facing: 217,
    exposurePeak: 0.62,
    salida: 'cierra',
    bottom: 'canto-rodado',
    levels: ['kid-beginner', 'beginner'],
    tide: { min: 0.4, max: 1.2 },
  },
  {
    id: 'delfines',
    name: 'Delfines',
    region: 'costa-verde',
    coords: { lat: -12.1151, lon: -77.0511 },
    facing: 232,
    exposurePeak: 0.62,
    // beach point que cierra parejo y sin canal: la regresada se complica
    // con una ola tras otra. Solo sirve para chicos cuando esta chico
    // (tipico de verano con swell del norte, que le entra muy oblicuo).
    salida: 'cierra',
    bottom: 'canto-rodado',
    levels: ['kid-beginner', 'beginner'],
    tide: { min: 0.4, max: 1.2 },
  },
  {
    id: 'la-pampilla',
    name: 'La Pampilla',
    region: 'costa-verde',
    coords: { lat: -12.1235, lon: -77.0423 },
    facing: 212,
    exposurePeak: 0.7,
    salida: 'channel',
    bottom: 'canto-rodado',
    levels: ['intermediate', 'advanced'],
    tide: { min: 0.3, max: 1.3 },
  },
  {
    id: 'la-herradura',
    name: 'La Herradura',
    region: 'costa-verde',
    coords: { lat: -12.1685, lon: -77.0385 },
    facing: 243,
    exposurePeak: 0.9,
    salida: 'channel',
    bottom: 'reef',
    levels: ['intermediate', 'advanced'],
    tide: { min: 0.2, max: 1.3 },
  },
  {
    id: 'san-bartolo',
    name: 'San Bartolo',
    region: 'lima-sur',
    coords: { lat: -12.3865, lon: -76.7835 },
    facing: 217,
    exposurePeak: 0.8,
    salida: 'channel',
    bottom: 'canto-rodado',
    levels: ['beginner', 'intermediate'],
    tide: { min: 0.2, max: 1.3 },
  },
  {
    id: 'punta-hermosa',
    name: 'Punta Hermosa',
    region: 'lima-sur',
    coords: { lat: -12.33, lon: -76.83 },
    facing: 243,
    exposurePeak: 0.95,
    salida: 'channel',
    bottom: 'arena',
    levels: ['intermediate', 'advanced'],
    tide: { min: 0.2, max: 1.3 },
  },
  {
    id: 'punta-rocas',
    name: 'Punta Rocas',
    region: 'lima-sur',
    coords: { lat: -12.36, lon: -76.79 },
    facing: 243,
    exposurePeak: 0.95,
    salida: 'channel',
    bottom: 'reef',
    levels: ['advanced'],
    tide: { min: 0.2, max: 1.3, prefers: 'rising' },
  },
  {
    id: 'puerto-viejo',
    name: 'Puerto Viejo',
    region: 'lima-sur',
    // Cañete, km 71.5 de la Panamericana Sur (San Antonio). Coords pegadas
    // a la costa; las originales caian 480 m tierra adentro.
    coords: { lat: -12.5806, lon: -76.7053 },
    facing: 242,
    exposurePeak: 0.85,
    // ⚠️ `salida`, `bottom` y `levels` NO estan confirmados por el usuario —
    // puestos a ojo por reputacion de playa amigable para principiantes.
    // Confirmar antes de confiar en las etiquetas de nivel de este spot.
    salida: 'suave',
    bottom: 'arena',
    levels: ['beginner', 'intermediate'],
    tide: { min: 0.2, max: 1.3 },
  },
  {
    id: 'cerro-azul',
    name: 'Cerro Azul',
    region: 'lima-sur',
    coords: { lat: -13.02, lon: -76.48 },
    facing: 258,
    exposurePeak: 0.9,
    salida: 'channel',
    bottom: 'arena',
    levels: ['intermediate', 'advanced'],
    tide: { min: 0.2, max: 1.3 },
  },
]

export function getSpot(id: string): Spot | undefined {
  return spots.find((s) => s.id === id)
}
