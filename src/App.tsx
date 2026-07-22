import { useEffect, useMemo, useState } from 'react'
import { computeSkyObjects } from './astronomy'
import { SkyCanvas } from './components/SkyCanvas'
import { LocationPanel } from './components/LocationPanel'
import { reverseGeocodeLabel } from './geocode'
import type { GeoLocation, SkyFilter, SkyObject } from './types'
import { displayName, formatDistance, matchesSkyFilter, PRESET_LOCATIONS } from './types'
import './App.css'

const DEFAULT_LOCATION = PRESET_LOCATIONS[0]
const MOTION_SPAN_MS = 6 * 60 * 60 * 1000
/** Wall-clock length of one full 6-hour sky replay. */
const MOTION_CYCLE_MS = 16_000

function formatMotionClock(date: Date, timeZone?: string): string {
  return new Intl.DateTimeFormat(undefined, {
    hour: 'numeric',
    minute: '2-digit',
    timeZone: timeZone || undefined,
  }).format(date)
}

export default function App() {
  const [location, setLocation] = useState<GeoLocation>(DEFAULT_LOCATION)
  const [when, setWhen] = useState(() => new Date())
  const [locating, setLocating] = useState(false)
  const [geoError, setGeoError] = useState<string | null>(null)
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [skyFilter, setSkyFilter] = useState<SkyFilter>('all')
  const [tick, setTick] = useState(0)
  const [motionOn, setMotionOn] = useState(false)
  const [motionProgress, setMotionProgress] = useState(0)

  // Keep "live" sky gently updating when viewing "now" (paused during motion)
  useEffect(() => {
    if (motionOn) return
    const id = window.setInterval(() => {
      setWhen((prev) => {
        const age = Date.now() - prev.getTime()
        // Only auto-advance if within ~2 minutes of wall clock (user hasn't scrubbed far)
        if (Math.abs(age) < 120_000) return new Date()
        return prev
      })
      setTick((t) => t + 1)
    }, 30_000)
    return () => window.clearInterval(id)
  }, [motionOn])

  useEffect(() => {
    if (!motionOn) {
      setMotionProgress(0)
      return
    }

    let raf = 0
    let lastSample = 0
    const start = performance.now()

    const loop = (now: number) => {
      // ~12 fps is enough for sky motion and keeps astronomy work light
      if (now - lastSample >= 80) {
        lastSample = now
        const u = ((now - start) % MOTION_CYCLE_MS) / MOTION_CYCLE_MS
        setMotionProgress(u)
      }
      raf = window.requestAnimationFrame(loop)
    }

    raf = window.requestAnimationFrame(loop)
    return () => window.cancelAnimationFrame(raf)
  }, [motionOn, when, location.latitude, location.longitude])

  const displayWhen = useMemo(() => {
    if (!motionOn) return when
    return new Date(when.getTime() - MOTION_SPAN_MS + motionProgress * MOTION_SPAN_MS)
  }, [motionOn, when, motionProgress])

  const objects = useMemo(
    () => computeSkyObjects(location, displayWhen),
    [location, displayWhen],
  )
  const visibleObjects = objects.filter((o) => matchesSkyFilter(o, skyFilter))
  void tick

  const selected: SkyObject | null =
    selectedId == null ? null : (visibleObjects.find((o) => o.id === selectedId) ?? null)

  const visiblePlanets = objects.filter((o) => o.kind === 'planet' && o.altitude > 0)
  const sun = objects.find((o) => o.kind === 'sun')
  const moon = objects.find((o) => o.kind === 'moon')

  const hoursAgo = motionOn ? (1 - motionProgress) * 6 : 0
  const motionStatus = motionOn
    ? hoursAgo < 0.08
      ? `Motion · ${formatMotionClock(displayWhen, location.timeZone)} (selected time)`
      : `Motion · ${formatMotionClock(displayWhen, location.timeZone)} · ${hoursAgo.toFixed(1)}h ago`
    : null

  const applyBrowserLocation = async (
    latitude: number,
    longitude: number,
    options?: { quiet?: boolean },
  ) => {
    const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone
    // Show coordinates immediately, then swap in the resolved place name.
    setLocation({
      latitude,
      longitude,
      label: 'My location',
      timeZone,
    })

    try {
      const label = await reverseGeocodeLabel(latitude, longitude)
      const next = {
        latitude,
        longitude,
        label,
        timeZone,
      }
      setLocation(next)
      try {
        localStorage.setItem('skyabove:lastLocation', JSON.stringify(next))
      } catch {
        // ignore storage failures (private mode, etc.)
      }
    } catch {
      if (!options?.quiet) {
        setGeoError('Located you, but could not look up the place name.')
      }
    } finally {
      setLocating(false)
    }
  }

  const requestBrowserLocation = (options?: {
    quiet?: boolean
    highAccuracy?: boolean
    timeout?: number
  }) => {
    if (!navigator.geolocation) {
      if (!options?.quiet) {
        setGeoError('Geolocation is not available in this browser.')
      }
      setLocating(false)
      return
    }

    setLocating(true)
    if (!options?.quiet) setGeoError(null)

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        void applyBrowserLocation(pos.coords.latitude, pos.coords.longitude, {
          quiet: options?.quiet,
        })
      },
      (err) => {
        setLocating(false)
        // Always explain — silent New York fallback was confusing.
        const hint =
          err.code === err.PERMISSION_DENIED
            ? 'Location permission is blocked. Allow location for this site, then click “Use my location”.'
            : err.code === err.TIMEOUT
              ? 'Timed out finding your location. Click “Use my location” to try again.'
              : 'Could not read your location. Click “Use my location” and allow access when prompted.'
        setGeoError(hint)
      },
      {
        enableHighAccuracy: options?.highAccuracy ?? false,
        timeout: options?.timeout ?? 12_000,
        maximumAge: 60_000,
      },
    )
  }

  const useMyLocation = () => {
    requestBrowserLocation({ quiet: false, highAccuracy: true, timeout: 15_000 })
  }

  useEffect(() => {
    // Restore last successful location while we ask the browser for a fresh fix.
    try {
      const raw = localStorage.getItem('skyabove:lastLocation')
      if (raw) {
        const saved = JSON.parse(raw) as GeoLocation
        if (
          typeof saved.latitude === 'number' &&
          typeof saved.longitude === 'number' &&
          typeof saved.label === 'string'
        ) {
          setLocation(saved)
        }
      }
    } catch {
      // ignore bad cache
    }

    // Network/IP-friendly first attempt (faster, fewer permission edge cases),
    // then the explicit button can request high accuracy.
    requestBrowserLocation({ quiet: true, highAccuracy: false, timeout: 12_000 })
  }, [])

  return (
    <div className="app">
      <SkyCanvas
        objects={visibleObjects}
        when={displayWhen}
        selectedId={selectedId}
        onSelect={(obj) => setSelectedId(obj?.id ?? null)}
        emphasizeZodiac={skyFilter === 'zodiac'}
      />

      <header className="hero">
        <p className="brand">SkyAbove</p>
        <h1>
          The sky above <span className="place-name">{location.label}</span>
        </h1>
        <p className="lede">
          Planets, stars, moon, and sun from this viewpoint — right now, or any moment you
          choose.
        </p>
      </header>

      <aside className="hud">
        <LocationPanel
          location={location}
          onLocationChange={setLocation}
          locating={locating}
          onUseMyLocation={useMyLocation}
          when={when}
          onWhenChange={setWhen}
          skyFilter={skyFilter}
          onSkyFilterChange={setSkyFilter}
          motionOn={motionOn}
          onToggleMotion={() => setMotionOn((v) => !v)}
          motionStatus={motionStatus}
        />
        {geoError && <p className="error">{geoError}</p>}

        <div className="status">
          {skyFilter === 'all' && (
            <>
              <p className="status-line">
                <span className="label">Sun</span>{' '}
                <strong>
                  {sun && sun.altitude > 0
                    ? `${sun.altitude.toFixed(0)}° up`
                    : 'Below'}
                </strong>
                <span className="status-sep" aria-hidden="true">
                  ·
                </span>
                <span className="label">Moon</span>{' '}
                <strong>
                  {moon && moon.altitude > 0
                    ? `${Math.round((moon.phase ?? 0) * 100)}% · ${moon.altitude.toFixed(0)}°`
                    : 'Below'}
                </strong>
              </p>
              <p className="status-line">
                <span className="label">Planets</span>{' '}
                <strong>
                  {visiblePlanets.length
                    ? visiblePlanets.map((p) => displayName(p)).join(', ')
                    : 'None'}
                </strong>
              </p>
            </>
          )}
          {skyFilter === 'planets' && (
            <p className="status-line">
              <span className="label">Planets</span>{' '}
              <strong>
                {visiblePlanets.length
                  ? visiblePlanets.map((p) => displayName(p)).join(', ')
                  : 'None'}
              </strong>
            </p>
          )}
          {skyFilter === 'stars' && (
            <p className="status-line">
              <span className="label">Showing</span> <strong>Stars only</strong>
            </p>
          )}
          {skyFilter === 'zodiac' && (
            <p className="status-line">
              <span className="label">Showing</span>{' '}
              <strong>Zodiac animals & stars</strong>
            </p>
          )}
        </div>

        {selected && (
          <div className="selection" role="status">
            <span className="kind">{selected.kind}</span>
            <strong>{displayName(selected)}</strong>
            <dl className="selection-facts">
              <div>
                <dt>Name</dt>
                <dd>{selected.name ? selected.name : 'Not known'}</dd>
              </div>
              {selected.zodiacSign && (
                <div>
                  <dt>Astrology sign</dt>
                  <dd>{selected.zodiacSign}</dd>
                </div>
              )}
              <div>
                <dt>Distance from Earth</dt>
                <dd>{formatDistance(selected) ?? 'Not known'}</dd>
              </div>
              <div>
                <dt>Position</dt>
                <dd>
                  Alt {selected.altitude.toFixed(1)}° · Az {selected.azimuth.toFixed(1)}°
                </dd>
              </div>
            </dl>
          </div>
        )}
      </aside>

      <p className="hint">
        Zoom +, then use side arrows, scroll, or drag to explore · tap for details
      </p>
    </div>
  )
}
