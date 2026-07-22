import { useEffect, useState } from 'react'
import { computeSkyObjects } from './astronomy'
import { SkyCanvas } from './components/SkyCanvas'
import { LocationPanel } from './components/LocationPanel'
import type { GeoLocation, SkyFilter, SkyObject } from './types'
import { displayName, formatDistance, matchesSkyFilter, PRESET_LOCATIONS } from './types'
import './App.css'

const DEFAULT_LOCATION = PRESET_LOCATIONS[0]

export default function App() {
  const [location, setLocation] = useState<GeoLocation>(DEFAULT_LOCATION)
  const [when, setWhen] = useState(() => new Date())
  const [locating, setLocating] = useState(false)
  const [geoError, setGeoError] = useState<string | null>(null)
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [skyFilter, setSkyFilter] = useState<SkyFilter>('all')
  const [tick, setTick] = useState(0)

  // Keep "live" sky gently updating when viewing "now"
  useEffect(() => {
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
  }, [])

  const objects = computeSkyObjects(location, when)
  const visibleObjects = objects.filter((o) => matchesSkyFilter(o, skyFilter))
  void tick

  const selected: SkyObject | null =
    selectedId == null ? null : (visibleObjects.find((o) => o.id === selectedId) ?? null)

  const visiblePlanets = objects.filter((o) => o.kind === 'planet' && o.altitude > 0)
  const sun = objects.find((o) => o.kind === 'sun')
  const moon = objects.find((o) => o.kind === 'moon')

  const useMyLocation = () => {
    if (!navigator.geolocation) {
      setGeoError('Geolocation is not available in this browser.')
      return
    }
    setLocating(true)
    setGeoError(null)
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLocation({
          latitude: pos.coords.latitude,
          longitude: pos.coords.longitude,
          label: 'My location',
          timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        })
        setLocating(false)
      },
      (err) => {
        setGeoError(err.message || 'Could not read your location.')
        setLocating(false)
      },
      { enableHighAccuracy: true, timeout: 12_000 },
    )
  }

  useEffect(() => {
    // Attempt location on first visit; fall back quietly to New York
    if (!navigator.geolocation) return
    setLocating(true)
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLocation({
          latitude: pos.coords.latitude,
          longitude: pos.coords.longitude,
          label: 'My location',
          timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        })
        setLocating(false)
      },
      () => setLocating(false),
      { timeout: 8000 },
    )
  }, [])

  return (
    <div className="app">
      <SkyCanvas
        objects={visibleObjects}
        when={when}
        selectedId={selectedId}
        onSelect={(obj) => setSelectedId(obj?.id ?? null)}
        emphasizeZodiac={skyFilter === 'zodiac'}
      />

      <header className="hero">
        <p className="brand">SkyLight</p>
        <h1>The sky above you</h1>
        <p className="lede">
          Planets, stars, moon, and sun drawn for {location.label} — right now, or any moment
          you choose.
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
              <strong>Zodiac outlines & stars</strong>
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

      <p className="hint">Tap a star or planet for name &amp; distance</p>
    </div>
  )
}
