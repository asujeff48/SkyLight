import type { GeoLocation } from './types'

type OpenMeteoResult = {
  id: number
  name: string
  latitude: number
  longitude: number
  country?: string
  admin1?: string
  population?: number
  timezone?: string
}

type OpenMeteoResponse = {
  results?: OpenMeteoResult[]
}

export type CityMatch = GeoLocation & {
  id: number
  detail: string
}

function formatCityLabel(result: OpenMeteoResult): { label: string; detail: string } {
  const parts = [result.admin1, result.country].filter(Boolean)
  const detail = parts.join(', ')
  return {
    label: detail ? `${result.name}, ${result.country ?? detail}` : result.name,
    detail: detail || result.name,
  }
}

/** Look up major cities by name via the free Open-Meteo geocoding API. */
export async function searchCities(query: string, limit = 6): Promise<CityMatch[]> {
  const trimmed = query.trim()
  if (trimmed.length < 2) return []

  const url = new URL('https://geocoding-api.open-meteo.com/v1/search')
  url.searchParams.set('name', trimmed)
  url.searchParams.set('count', String(Math.max(limit * 3, 12)))
  url.searchParams.set('language', 'en')
  url.searchParams.set('format', 'json')

  const response = await fetch(url)
  if (!response.ok) {
    throw new Error('City lookup failed. Try again in a moment.')
  }

  const data = (await response.json()) as OpenMeteoResponse
  const results = data.results ?? []

  // Prefer major cities: drop tiny places when larger matches exist.
  const sorted = [...results].sort((a, b) => (b.population ?? 0) - (a.population ?? 0))
  const major = sorted.filter((r) => (r.population ?? 0) >= 50_000)
  const chosen = major.length > 0 ? major : sorted

  return chosen.slice(0, limit).map((result) => {
    const { label, detail } = formatCityLabel(result)
    return {
      id: result.id,
      latitude: result.latitude,
      longitude: result.longitude,
      label,
      detail,
      timeZone: result.timezone,
    }
  })
}
