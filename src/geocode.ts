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

type PhotonProperties = {
  name?: string
  city?: string
  town?: string
  village?: string
  county?: string
  state?: string
  country?: string
  countrycode?: string
  type?: string
}

type PhotonResponse = {
  features?: Array<{ properties?: PhotonProperties }>
}

type BigDataCloudResponse = {
  city?: string
  locality?: string
  principalSubdivision?: string
  principalSubdivisionCode?: string
  countryName?: string
  countryCode?: string
}

export type CityMatch = GeoLocation & {
  id: number
  detail: string
}

const US_STATE_ABBREV: Record<string, string> = {
  Alabama: 'AL',
  Alaska: 'AK',
  Arizona: 'AZ',
  Arkansas: 'AR',
  California: 'CA',
  Colorado: 'CO',
  Connecticut: 'CT',
  Delaware: 'DE',
  Florida: 'FL',
  Georgia: 'GA',
  Hawaii: 'HI',
  Idaho: 'ID',
  Illinois: 'IL',
  Indiana: 'IN',
  Iowa: 'IA',
  Kansas: 'KS',
  Kentucky: 'KY',
  Louisiana: 'LA',
  Maine: 'ME',
  Maryland: 'MD',
  Massachusetts: 'MA',
  Michigan: 'MI',
  Minnesota: 'MN',
  Mississippi: 'MS',
  Missouri: 'MO',
  Montana: 'MT',
  Nebraska: 'NE',
  Nevada: 'NV',
  'New Hampshire': 'NH',
  'New Jersey': 'NJ',
  'New Mexico': 'NM',
  'New York': 'NY',
  'North Carolina': 'NC',
  'North Dakota': 'ND',
  Ohio: 'OH',
  Oklahoma: 'OK',
  Oregon: 'OR',
  Pennsylvania: 'PA',
  'Rhode Island': 'RI',
  'South Carolina': 'SC',
  'South Dakota': 'SD',
  Tennessee: 'TN',
  Texas: 'TX',
  Utah: 'UT',
  Vermont: 'VT',
  Virginia: 'VA',
  Washington: 'WA',
  'West Virginia': 'WV',
  Wisconsin: 'WI',
  Wyoming: 'WY',
  'District of Columbia': 'DC',
}

function formatCityLabel(result: OpenMeteoResult): { label: string; detail: string } {
  const parts = [result.admin1, result.country].filter(Boolean)
  const detail = parts.join(', ')
  return {
    label: detail ? `${result.name}, ${result.country ?? detail}` : result.name,
    detail: detail || result.name,
  }
}

function usStateCode(stateNameOrCode?: string): string | undefined {
  if (!stateNameOrCode) return undefined
  const trimmed = stateNameOrCode.trim()
  if (/^[A-Za-z]{2}$/.test(trimmed)) return trimmed.toUpperCase()
  const fromIso = trimmed.match(/^US-([A-Z]{2})$/i)
  if (fromIso) return fromIso[1].toUpperCase()
  return US_STATE_ABBREV[trimmed]
}

function formatUsPlace(place: string, stateNameOrCode?: string): string {
  const code = usStateCode(stateNameOrCode)
  if (code) return `${place}, ${code}`
  if (stateNameOrCode) return `${place}, ${stateNameOrCode}`
  return place
}

function formatInternationalPlace(
  place: string,
  region?: string,
  country?: string,
): string {
  if (region && region !== place) return `${place}, ${region}`
  if (country && country !== place) return `${place}, ${country}`
  return place
}

function labelFromPhoton(props: PhotonProperties): string | null {
  const place = props.name || props.city || props.town || props.village
  if (!place) return null

  const countryCode = props.countrycode?.toUpperCase()
  if (countryCode === 'US') {
    return formatUsPlace(place, props.state)
  }
  return formatInternationalPlace(place, props.state, props.country)
}

function labelFromBigDataCloud(data: BigDataCloudResponse): string | null {
  // Prefer locality for CDPs (Palm Harbor) when it differs from a nearby city.
  const place =
    data.locality && data.city && data.locality !== data.city
      ? data.locality
      : data.city || data.locality
  if (!place) return null

  if (data.countryCode === 'US') {
    return formatUsPlace(place, data.principalSubdivisionCode || data.principalSubdivision)
  }

  return formatInternationalPlace(
    place,
    data.principalSubdivision,
    data.countryName?.replace(/\s*\(the\)$/i, ''),
  )
}

async function reverseGeocodePhoton(
  latitude: number,
  longitude: number,
): Promise<string | null> {
  const url = new URL('https://photon.komoot.io/reverse')
  url.searchParams.set('lat', String(latitude))
  url.searchParams.set('lon', String(longitude))

  const response = await fetch(url.toString())
  if (!response.ok) return null

  const data = (await response.json()) as PhotonResponse
  const props = data.features?.[0]?.properties
  if (!props) return null
  return labelFromPhoton(props)
}

async function reverseGeocodeBigDataCloud(
  latitude: number,
  longitude: number,
): Promise<string | null> {
  const url = new URL('https://api.bigdatacloud.net/data/reverse-geocode-client')
  url.searchParams.set('latitude', String(latitude))
  url.searchParams.set('longitude', String(longitude))
  url.searchParams.set('localityLanguage', 'en')

  const response = await fetch(url.toString())
  if (!response.ok) return null

  const data = (await response.json()) as BigDataCloudResponse
  return labelFromBigDataCloud(data)
}

/**
 * Resolve GPS coordinates to a friendly place label (e.g. "Palm Harbor, FL").
 * Falls back to "My location" if reverse geocoding is unavailable.
 */
export async function reverseGeocodeLabel(
  latitude: number,
  longitude: number,
): Promise<string> {
  try {
    const fromPhoton = await reverseGeocodePhoton(latitude, longitude)
    if (fromPhoton) return fromPhoton
  } catch {
    // try fallback below
  }

  try {
    const fromBigData = await reverseGeocodeBigDataCloud(latitude, longitude)
    if (fromBigData) return fromBigData
  } catch {
    // keep generic label
  }

  return 'My location'
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
