export type GeoLocation = {
  latitude: number
  longitude: number
  label: string
  /** IANA timezone when known — used for sunrise/sunset local times */
  timeZone?: string
}

export type SkyBodyKind = 'star' | 'planet' | 'moon' | 'sun' | 'iss'

/** What to draw on the sky map. Default view is `all`. */
export type SkyFilter = 'all' | 'planets' | 'stars' | 'zodiac'

/** How long wall-clock time it takes to replay the last 6 hours of sky. */
export type MotionSpeedId = 'fast' | 'normal' | 'slow' | 'iss'

export const MOTION_SPEEDS: {
  id: MotionSpeedId
  label: string
  /** Wall-clock ms for one full 6-hour replay loop */
  cycleMs: number
  hint: string
  /** When true, the control jumps the sky to the last ISS pass instead of only changing speed. */
  isPassAction?: boolean
}[] = [
  { id: 'fast', label: 'Fast', cycleMs: 16_000, hint: '6h in 16s' },
  { id: 'normal', label: 'Normal', cycleMs: 60_000, hint: '6h in 1 min' },
  { id: 'slow', label: 'Slow', cycleMs: 180_000, hint: '6h in 3 min' },
  {
    id: 'iss',
    label: 'Last ISS Pass',
    cycleMs: 360_000,
    hint: 'Jump to last pass · 6h in 6 min',
    isPassAction: true,
  },
]

export const DEFAULT_MOTION_SPEED: MotionSpeedId = 'normal'

export const SKY_FILTERS: { id: SkyFilter; label: string }[] = [
  { id: 'all', label: 'All' },
  { id: 'planets', label: 'Planets Only' },
  { id: 'stars', label: 'Stars Only' },
  { id: 'zodiac', label: 'Zodiac Signs' },
]

export function matchesSkyFilter(
  object: { kind: SkyBodyKind; zodiacSign?: string | null },
  filter: SkyFilter,
): boolean {
  if (filter === 'all') return true
  if (filter === 'stars') return object.kind === 'star'
  if (filter === 'zodiac') return object.kind === 'star' && Boolean(object.zodiacSign)
  // Planets Only: solar-system planets (not Sun/Moon/ISS)
  return object.kind === 'planet'
}

export type DistanceUnit = 'au' | 'km' | 'ly'

export type SkyObject = {
  id: string
  /** Display name when known; null for unnamed field stars */
  name: string | null
  kind: SkyBodyKind
  altitude: number
  azimuth: number
  magnitude: number
  /** 0–1 illuminated fraction for Moon; unused for others */
  phase?: number
  color: string
  /** Astrology / zodiac constellation when this star belongs to one */
  zodiacSign?: string | null
  /** Distance from Earth when known */
  distance?: {
    value: number
    unit: DistanceUnit
  }
  /** Recent path along a satellite pass (for ISS trail) */
  trail?: { altitude: number; azimuth: number }[]
}

export const PRESET_LOCATIONS: GeoLocation[] = [
  { latitude: 40.7128, longitude: -74.006, label: 'New York', timeZone: 'America/New_York' },
  { latitude: 51.5074, longitude: -0.1278, label: 'London', timeZone: 'Europe/London' },
  { latitude: 35.6762, longitude: 139.6503, label: 'Tokyo', timeZone: 'Asia/Tokyo' },
  { latitude: -33.8688, longitude: 151.2093, label: 'Sydney', timeZone: 'Australia/Sydney' },
  { latitude: 48.8566, longitude: 2.3522, label: 'Paris', timeZone: 'Europe/Paris' },
  { latitude: -22.9068, longitude: -43.1729, label: 'Rio de Janeiro', timeZone: 'America/Sao_Paulo' },
  { latitude: 19.4326, longitude: -99.1332, label: 'Mexico City', timeZone: 'America/Mexico_City' },
  { latitude: 1.3521, longitude: 103.8198, label: 'Singapore', timeZone: 'Asia/Singapore' },
  { latitude: 64.1466, longitude: -21.9426, label: 'Reykjavík', timeZone: 'Atlantic/Reykjavik' },
  { latitude: -33.9249, longitude: 18.4241, label: 'Cape Town', timeZone: 'Africa/Johannesburg' },
]

const AU_KM = 149_597_870.7

export function displayName(object: SkyObject): string {
  if (object.kind === 'iss') return 'International Space Station'
  if (object.name) return object.name
  if (object.kind === 'star') return 'Unnamed star'
  return 'Unknown'
}

export function formatDistance(object: SkyObject): string | null {
  if (!object.distance) return null
  const { value, unit } = object.distance

  if (unit === 'ly') {
    if (value >= 1000) return `${(value / 1000).toFixed(1)} thousand light-years`
    if (value >= 100) return `${Math.round(value)} light-years`
    if (value >= 10) return `${value.toFixed(0)} light-years`
    return `${value.toFixed(1)} light-years`
  }

  if (unit === 'km') {
    if (value >= 1_000_000) {
      return `${(value / 1_000_000).toFixed(2)} million km`
    }
    return `${Math.round(value).toLocaleString('en-US')} km`
  }

  // AU — also show approximate km for intuition
  const km = value * AU_KM
  const auLabel =
    value >= 10 ? `${value.toFixed(1)} AU` : value >= 1 ? `${value.toFixed(2)} AU` : `${value.toFixed(3)} AU`
  if (km >= 1_000_000_000) {
    return `${auLabel} · ${(km / 1_000_000_000).toFixed(2)} billion km`
  }
  if (km >= 1_000_000) {
    return `${auLabel} · ${(km / 1_000_000).toFixed(1)} million km`
  }
  return `${auLabel} · ${Math.round(km).toLocaleString('en-US')} km`
}
