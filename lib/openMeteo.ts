import type { Conditions } from './types'

const MARINE_URL = 'https://marine-api.open-meteo.com/v1/marine'
const FORECAST_URL = 'https://api.open-meteo.com/v1/forecast'

// Revalidacion: el oleaje/viento son forecasts meteorologicos, no hace falta
// pedirlos en cada request. 1h es suficiente margen para uso personal.
const REVALIDATE_SECONDS = 3600

type MarineHourly = {
  time: string[]
  wave_height: number[]
  wave_period: number[]
  wave_direction: number[]
  swell_wave_height: number[]
  swell_wave_period: number[]
  swell_wave_direction: number[]
  sea_surface_temperature: number[]
}

type MarineResponse = {
  latitude: number
  longitude: number
  hourly: MarineHourly
}

type ForecastHourly = {
  time: string[]
  wind_speed_10m: number[]
  wind_direction_10m: number[]
}

type ForecastResponse = {
  hourly: ForecastHourly
}

async function fetchJson<T>(url: string): Promise<T> {
  const res = await fetch(url, { next: { revalidate: REVALIDATE_SECONDS } })
  if (!res.ok) {
    throw new Error(`open-meteo request failed: ${res.status} ${url}`)
  }
  return res.json() as Promise<T>
}

/**
 * Trae oleaje + viento para un punto y los combina en una serie horaria de
 * Conditions. `forecastDays` tope real recomendado: 7 (ver docs/PLAN.md,
 * el skill del modelo decae despues del dia 5-7 aunque la API acepte 10/16).
 */
export async function getConditions(
  lat: number,
  lon: number,
  forecastDays = 7,
): Promise<Conditions[]> {
  const marineUrl =
    `${MARINE_URL}?latitude=${lat}&longitude=${lon}` +
    `&hourly=wave_height,wave_period,wave_direction,swell_wave_height,swell_wave_period,swell_wave_direction,sea_surface_temperature` +
    `&timezone=America%2FLima&forecast_days=${forecastDays}`

  const windUrl =
    `${FORECAST_URL}?latitude=${lat}&longitude=${lon}` +
    `&hourly=wind_speed_10m,wind_direction_10m` +
    `&timezone=America%2FLima&forecast_days=${forecastDays}`

  const [marine, wind] = await Promise.all([
    fetchJson<MarineResponse>(marineUrl),
    fetchJson<ForecastResponse>(windUrl),
  ])

  const windByTime = new Map<string, { speed: number; direction: number }>()
  wind.hourly.time.forEach((t, i) => {
    windByTime.set(t, {
      speed: wind.hourly.wind_speed_10m[i],
      direction: wind.hourly.wind_direction_10m[i],
    })
  })

  return marine.hourly.time.map((t, i) => ({
    time: t,
    swell: {
      height: marine.hourly.swell_wave_height[i],
      period: marine.hourly.swell_wave_period[i],
      direction: marine.hourly.swell_wave_direction[i],
    },
    wind: windByTime.get(t) ?? { speed: 0, direction: 0 },
    waterTemp: marine.hourly.sea_surface_temperature?.[i] ?? null,
  }))
}
