import {
  eciToEcf,
  ecfToLookAngles,
  gstime,
  propagate,
  twoline2satrec,
  type SatRec,
} from 'satellite.js'
import type { GeoLocation, SkyObject } from './types'

const RAD2DEG = 180 / Math.PI
const DEG2RAD = Math.PI / 180

const ISS_NORAD_ID = 25544
const TLE_URL = `https://celestrak.org/NORAD/elements/gp.php?CATNR=${ISS_NORAD_ID}&FORMAT=TLE`
const TLE_CACHE_KEY = 'skyabove:issTle'
const TLE_MAX_AGE_MS = 12 * 60 * 60 * 1000

/** Fresh enough fallback if the network fetch fails (updated periodically via cache). */
const FALLBACK_TLE = {
  name: 'ISS (ZARYA)',
  line1: '1 25544U 98067A   26205.15303990  .00012066  00000+0  22566-3 0  9993',
  line2: '2 25544  51.6315 117.1603 0006931 331.5533  28.5077 15.49135191577483',
  fetchedAt: 0,
}

export type IssTle = {
  name: string
  line1: string
  line2: string
  fetchedAt: number
}

let cachedTle: IssTle | null = null
let cachedSatrec: SatRec | null = null
let loadPromise: Promise<IssTle> | null = null

function parseTleText(text: string, fetchedAt: number): IssTle | null {
  const lines = text
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean)
  if (lines.length < 2) return null

  let name = 'ISS'
  let line1 = ''
  let line2 = ''

  if (lines[0].startsWith('1 ') && lines[1].startsWith('2 ')) {
    line1 = lines[0]
    line2 = lines[1]
  } else if (lines.length >= 3 && lines[1].startsWith('1 ') && lines[2].startsWith('2 ')) {
    name = lines[0].replace(/\s+/g, ' ').trim() || 'ISS'
    line1 = lines[1]
    line2 = lines[2]
  } else {
    return null
  }

  return { name, line1, line2, fetchedAt }
}

function readStoredTle(): IssTle | null {
  try {
    const raw = localStorage.getItem(TLE_CACHE_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw) as IssTle
    if (
      typeof parsed.line1 === 'string' &&
      typeof parsed.line2 === 'string' &&
      typeof parsed.fetchedAt === 'number'
    ) {
      return parsed
    }
  } catch {
    // ignore
  }
  return null
}

function storeTle(tle: IssTle) {
  try {
    localStorage.setItem(TLE_CACHE_KEY, JSON.stringify(tle))
  } catch {
    // ignore
  }
}

function satrecFromTle(tle: IssTle): SatRec {
  return twoline2satrec(tle.line1, tle.line2)
}

function setActiveTle(tle: IssTle) {
  cachedTle = tle
  cachedSatrec = satrecFromTle(tle)
}

/**
 * Load ISS orbit elements (TLE). Uses memory → localStorage → network → baked fallback.
 * Safe to call repeatedly; concurrent callers share one fetch.
 */
export async function ensureIssTle(): Promise<IssTle> {
  if (cachedTle && Date.now() - cachedTle.fetchedAt < TLE_MAX_AGE_MS) {
    return cachedTle
  }

  const stored = readStoredTle()
  if (stored && Date.now() - stored.fetchedAt < TLE_MAX_AGE_MS) {
    setActiveTle(stored)
    return stored
  }

  if (!loadPromise) {
    loadPromise = (async () => {
      try {
        const response = await fetch(TLE_URL)
        if (!response.ok) throw new Error(`TLE HTTP ${response.status}`)
        const text = await response.text()
        const parsed = parseTleText(text, Date.now())
        if (!parsed) throw new Error('Could not parse ISS TLE')
        storeTle(parsed)
        setActiveTle(parsed)
        return parsed
      } catch {
        if (stored) {
          setActiveTle(stored)
          return stored
        }
        const fallback = { ...FALLBACK_TLE, fetchedAt: Date.now() }
        setActiveTle(fallback)
        return fallback
      } finally {
        loadPromise = null
      }
    })()
  }

  return loadPromise
}

export function isIssTleReady(): boolean {
  return cachedSatrec != null
}

type Look = {
  altitude: number
  azimuth: number
  rangeKm: number
}

function lookAnglesAt(satrec: SatRec, location: GeoLocation, when: Date): Look | null {
  const result = propagate(satrec, when)
  if (!result) return null
  const position = result.position
  if (!position || typeof position === 'boolean') return null

  const gmst = gstime(when)
  const positionEcf = eciToEcf(position, gmst)
  const observerGd = {
    longitude: location.longitude * DEG2RAD,
    latitude: location.latitude * DEG2RAD,
    height: 0,
  }
  const look = ecfToLookAngles(observerGd, positionEcf)
  return {
    altitude: look.elevation * RAD2DEG,
    azimuth: look.azimuth * RAD2DEG,
    rangeKm: look.rangeSat,
  }
}

function buildTrail(
  satrec: SatRec,
  location: GeoLocation,
  when: Date,
): { altitude: number; azimuth: number }[] {
  const trail: { altitude: number; azimuth: number }[] = []
  const spanMs = 10 * 60 * 1000
  const stepMs = 30_000
  const start = when.getTime() - spanMs

  for (let t = start; t <= when.getTime(); t += stepMs) {
    const look = lookAnglesAt(satrec, location, new Date(t))
    if (look && look.altitude > -1) {
      trail.push({ altitude: look.altitude, azimuth: look.azimuth })
    }
  }
  return trail
}

/**
 * ISS as a sky object when it is above (or just at) the horizon for this place/time.
 * Returns null when below the horizon or orbit data is not ready.
 */
export function computeIssSkyObject(
  location: GeoLocation,
  when: Date,
): SkyObject | null {
  if (!cachedSatrec) return null

  const look = lookAnglesAt(cachedSatrec, location, when)
  if (!look || look.altitude < -0.5) return null

  const trail = buildTrail(cachedSatrec, location, when)

  return {
    id: 'iss',
    name: 'ISS',
    kind: 'iss',
    altitude: look.altitude,
    azimuth: look.azimuth,
    magnitude: -1.8,
    color: '#9fd4ff',
    distance: { value: look.rangeKm, unit: 'km' },
    trail,
  }
}

const PASS_HORIZON_DEG = 0
const PASS_SEARCH_HOURS = 48
const PASS_COARSE_STEP_MS = 45_000
const PASS_FINE_STEP_MS = 5_000

/**
 * Find the next time the ISS rises above the horizon at this location,
 * searching forward from `from` (default search window: 48 hours).
 */
export function findNextIssPass(location: GeoLocation, from: Date): Date | null {
  if (!cachedSatrec) return null

  const startMs = from.getTime()
  const endMs = startMs + PASS_SEARCH_HOURS * 60 * 60 * 1000

  let prevAlt =
    lookAnglesAt(cachedSatrec, location, from)?.altitude ?? -90

  // Already up — next "pass start" is after this one sets, then rises again.
  // Callers that only care when it's down can ignore this path; we still
  // advance to the next rise after a set.
  for (let t = startMs + PASS_COARSE_STEP_MS; t <= endMs; t += PASS_COARSE_STEP_MS) {
    const look = lookAnglesAt(cachedSatrec, location, new Date(t))
    const alt = look?.altitude ?? -90

    if (prevAlt <= PASS_HORIZON_DEG && alt > PASS_HORIZON_DEG) {
      return refinePassRise(location, t - PASS_COARSE_STEP_MS, t)
    }
    prevAlt = alt
  }

  return null
}

function refinePassRise(
  location: GeoLocation,
  startMs: number,
  endMs: number,
): Date | null {
  if (!cachedSatrec) return null

  let prevAlt =
    lookAnglesAt(cachedSatrec, location, new Date(startMs))?.altitude ?? -90

  for (let t = startMs + PASS_FINE_STEP_MS; t <= endMs; t += PASS_FINE_STEP_MS) {
    const look = lookAnglesAt(cachedSatrec, location, new Date(t))
    const alt = look?.altitude ?? -90
    if (prevAlt <= PASS_HORIZON_DEG && alt > PASS_HORIZON_DEG) {
      return new Date(t)
    }
    prevAlt = alt
  }

  return new Date(endMs)
}

function dayWithOrdinal(day: number): string {
  const mod100 = day % 100
  if (mod100 >= 11 && mod100 <= 13) return `${day}th`
  switch (day % 10) {
    case 1:
      return `${day}st`
    case 2:
      return `${day}nd`
    case 3:
      return `${day}rd`
    default:
      return `${day}th`
  }
}

/** Format like "July 25th, 4:35 PM" in the place timezone when known. */
export function formatIssPassTime(when: Date, timeZone?: string): string {
  const parts = new Intl.DateTimeFormat(undefined, {
    month: 'long',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    timeZone: timeZone || undefined,
  }).formatToParts(when)

  const month = parts.find((p) => p.type === 'month')?.value ?? ''
  const day = Number(parts.find((p) => p.type === 'day')?.value ?? 0)
  const hour = parts.find((p) => p.type === 'hour')?.value ?? ''
  const minute = parts.find((p) => p.type === 'minute')?.value ?? ''
  const dayPeriod = parts.find((p) => p.type === 'dayPeriod')?.value

  const time = dayPeriod ? `${hour}:${minute} ${dayPeriod}` : `${hour}:${minute}`
  return `${month} ${dayWithOrdinal(day)}, ${time}`
}
