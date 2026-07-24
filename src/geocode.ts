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

const US_STATE_BY_ABBREV: Record<string, string> = Object.fromEntries(
  Object.entries(US_STATE_ABBREV).map(([name, code]) => [code, name]),
)

/** Longest first so "New York" wins over "York". */
const US_STATE_NAMES = Object.keys(US_STATE_ABBREV).sort((a, b) => b.length - a.length)

/** Common country suffixes people type after a city ("Rome Italy"). */
const COMMON_COUNTRY_HINTS = [
  'United States',
  'United Kingdom',
  'South Korea',
  'North Korea',
  'New Zealand',
  'Czech Republic',
  'Saudi Arabia',
  'South Africa',
  'Costa Rica',
  'Italy',
  'France',
  'Spain',
  'Germany',
  'Canada',
  'Mexico',
  'Brazil',
  'Argentina',
  'Chile',
  'Peru',
  'Colombia',
  'Japan',
  'China',
  'India',
  'Australia',
  'Ireland',
  'Scotland',
  'Wales',
  'England',
  'Portugal',
  'Greece',
  'Turkey',
  'Egypt',
  'Morocco',
  'Nigeria',
  'Kenya',
  'Poland',
  'Sweden',
  'Norway',
  'Denmark',
  'Finland',
  'Netherlands',
  'Belgium',
  'Switzerland',
  'Austria',
  'Hungary',
  'Romania',
  'Ukraine',
  'Russia',
  'Israel',
  'Lebanon',
  'Jordan',
  'Iraq',
  'Iran',
  'Pakistan',
  'Bangladesh',
  'Thailand',
  'Vietnam',
  'Indonesia',
  'Malaysia',
  'Singapore',
  'Philippines',
  'Taiwan',
  'Korea',
].sort((a, b) => b.length - a.length)

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

export type ParsedPlaceQuery = {
  /** City / place name sent to the geocoder. */
  name: string
  /** US state abbreviation when the query included one (e.g. AZ). */
  stateCode?: string
  /** Country name when the query ended with one (e.g. Italy). */
  countryHint?: string
}

/**
 * Open-Meteo matches city names, not "Phoenix AZ" / "Rome Italy".
 * Strip a trailing state or country so Look up can still resolve the place.
 */
export function parsePlaceQuery(query: string): ParsedPlaceQuery {
  const trimmed = query.trim().replace(/\s+/g, ' ')
  if (!trimmed) return { name: '' }

  const abbrevMatch = trimmed.match(/^(.+?)[, ]+([A-Za-z]{2})$/)
  if (abbrevMatch) {
    const code = abbrevMatch[2].toUpperCase()
    if (US_STATE_BY_ABBREV[code]) {
      return { name: abbrevMatch[1].trim(), stateCode: code }
    }
  }

  for (const stateName of US_STATE_NAMES) {
    const match = trimmed.match(
      new RegExp(`^(.+?)[, ]+${escapeRegExp(stateName)}$`, 'i'),
    )
    if (match) {
      return {
        name: match[1].trim(),
        stateCode: US_STATE_ABBREV[stateName],
      }
    }
  }

  for (const country of COMMON_COUNTRY_HINTS) {
    const match = trimmed.match(
      new RegExp(`^(.+?)[, ]+${escapeRegExp(country)}$`, 'i'),
    )
    if (match) {
      return { name: match[1].trim(), countryHint: country }
    }
  }

  return { name: trimmed }
}

function formatCityLabel(result: OpenMeteoResult): { label: string; detail: string } {
  const isUs = result.country === 'United States' || result.country === 'USA'
  if (isUs) {
    const label = formatUsPlace(result.name, result.admin1)
    const detail = [result.admin1, result.country].filter(Boolean).join(', ')
    return { label, detail: detail || label }
  }

  const parts = [result.admin1, result.country].filter(Boolean)
  const detail = parts.join(', ')
  return {
    label: detail ? `${result.name}, ${result.country ?? detail}` : result.name,
    detail: detail || result.name,
  }
}

function matchesStateHint(result: OpenMeteoResult, stateCode: string): boolean {
  const code = usStateCode(result.admin1)
  return code === stateCode
}

function matchesCountryHint(result: OpenMeteoResult, countryHint: string): boolean {
  const country = (result.country ?? '').toLowerCase()
  const hint = countryHint.toLowerCase()
  if (!country) return false
  if (country === hint) return true
  // "Korea" ↔ "South Korea", "United States" ↔ "USA"
  if (hint === 'korea' && country.includes('korea')) return true
  if (hint === 'united states' && (country === 'usa' || country.includes('united states'))) {
    return true
  }
  if (hint === 'united kingdom' && (country === 'uk' || country.includes('united kingdom'))) {
    return true
  }
  return country.includes(hint) || hint.includes(country)
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

async function fetchOpenMeteoCities(name: string, count: number): Promise<OpenMeteoResult[]> {
  const url = new URL('https://geocoding-api.open-meteo.com/v1/search')
  url.searchParams.set('name', name)
  url.searchParams.set('count', String(count))
  url.searchParams.set('language', 'en')
  url.searchParams.set('format', 'json')

  const response = await fetch(url)
  if (!response.ok) {
    throw new Error('City lookup failed. Try again in a moment.')
  }

  const data = (await response.json()) as OpenMeteoResponse
  return data.results ?? []
}

/** Look up major cities by name via the free Open-Meteo geocoding API. */
export async function searchCities(query: string, limit = 6): Promise<CityMatch[]> {
  const trimmed = query.trim()
  if (trimmed.length < 2) return []

  const parsed = parsePlaceQuery(trimmed)
  if (parsed.name.length < 2) return []

  const fetchCount = Math.max(limit * 4, 16)
  // Prefer the stripped city name when a state/country was typed — the API
  // returns nothing for queries like "Phoenix AZ" or "Rome Italy".
  let results = await fetchOpenMeteoCities(parsed.name, fetchCount)

  // If the raw query differed and the stripped search was empty, try once as typed.
  if (results.length === 0 && parsed.name !== trimmed) {
    results = await fetchOpenMeteoCities(trimmed, fetchCount)
  }

  if (parsed.stateCode) {
    const inState = results.filter((r) => matchesStateHint(r, parsed.stateCode!))
    if (inState.length > 0) results = inState
  } else if (parsed.countryHint) {
    const inCountry = results.filter((r) => matchesCountryHint(r, parsed.countryHint!))
    if (inCountry.length > 0) results = inCountry
  }

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
