import { useEffect, useMemo, useRef, useState } from 'react'
import { computeSkyObjects } from './astronomy'
import { SkyCanvas } from './components/SkyCanvas'
import { LocationPanel } from './components/LocationPanel'
import { reverseGeocodeLabel } from './geocode'
import {
  computeIssSkyObject,
  ensureIssTle,
  findLastIssPassWindow,
  findNextIssPassWindow,
  formatIssPassRange,
  formatIssPassTime,
  isIssTleReady,
} from './iss'
import type { GeoLocation, MotionSpeedId, SkyFilter, SkyObject } from './types'
import {
  DEFAULT_MOTION_SPEED,
  displayName,
  formatDistance,
  matchesSkyFilter,
  MOTION_SPEEDS,
  PRESET_LOCATIONS,
} from './types'
import './App.css'

const DEFAULT_LOCATION = PRESET_LOCATIONS[0]
const MOTION_SPAN_MS = 6 * 60 * 60 * 1000
/** Wall-clock length of one ISS rise→set replay (slow enough to follow). */
const ISS_PASS_PLAYBACK_MS = 55_000
const MOBILE_MQ = '(max-width: 720px)'

type IssPassSession = {
  rise: Date
  set: Date
  previousWhen: Date
  previousSpeed: MotionSpeedId
  previousMotionOn: boolean
}

function formatMotionClock(date: Date, timeZone?: string): string {
  return new Intl.DateTimeFormat(undefined, {
    hour: 'numeric',
    minute: '2-digit',
    timeZone: timeZone || undefined,
  }).format(date)
}

function useIsMobile(): boolean {
  const [isMobile, setIsMobile] = useState(() =>
    typeof window !== 'undefined' ? window.matchMedia(MOBILE_MQ).matches : false,
  )

  useEffect(() => {
    const mq = window.matchMedia(MOBILE_MQ)
    const onChange = () => setIsMobile(mq.matches)
    onChange()
    mq.addEventListener('change', onChange)
    return () => mq.removeEventListener('change', onChange)
  }, [])

  return isMobile
}

export default function App() {
  const isMobile = useIsMobile()
  const [location, setLocation] = useState<GeoLocation>(DEFAULT_LOCATION)
  const [when, setWhen] = useState(() => new Date())
  const [locating, setLocating] = useState(false)
  const [geoError, setGeoError] = useState<string | null>(null)
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [skyFilter, setSkyFilter] = useState<SkyFilter>('all')
  const [tick, setTick] = useState(0)
  const [motionOn, setMotionOn] = useState(false)
  const [motionProgress, setMotionProgress] = useState(0)
  const [motionSpeed, setMotionSpeed] = useState<MotionSpeedId>(DEFAULT_MOTION_SPEED)
  const [issPassMessage, setIssPassMessage] = useState<string | null>(null)
  const [issPassMessageIsError, setIssPassMessageIsError] = useState(false)
  const [issPassSession, setIssPassSession] = useState<IssPassSession | null>(null)
  const [issPassChoiceOpen, setIssPassChoiceOpen] = useState(false)
  const motionProgressRef = useRef(0)
  // On phones, keep the sky open and tuck controls away until needed.
  const [controlsOpen, setControlsOpen] = useState(() =>
    typeof window !== 'undefined' ? !window.matchMedia(MOBILE_MQ).matches : true,
  )
  /** Bumps when the user picks a place so a late GPS fix cannot overwrite it. */
  const locationChoiceRef = useRef(0)
  /** Orbit catalog ready — recomputes sky with ISS when TLE loads. */
  const [issReady, setIssReady] = useState(false)

  useEffect(() => {
    let cancelled = false
    void ensureIssTle().then(() => {
      if (!cancelled) setIssReady(true)
    })
    return () => {
      cancelled = true
    }
  }, [])

  useEffect(() => {
    if (isMobile) setControlsOpen(false)
    else setControlsOpen(true)
  }, [isMobile])

  useEffect(() => {
    motionProgressRef.current = motionProgress
  }, [motionProgress])

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

  const motionCycleMs = issPassSession
    ? ISS_PASS_PLAYBACK_MS
    : (MOTION_SPEEDS.find((s) => s.id === motionSpeed)?.cycleMs ??
      MOTION_SPEEDS.find((s) => s.id === DEFAULT_MOTION_SPEED)!.cycleMs)

  useEffect(() => {
    if (!motionOn) {
      if (!issPassSession) setMotionProgress(0)
      return
    }

    let raf = 0
    let lastSample = 0
    const start = performance.now() - motionProgressRef.current * motionCycleMs
    const playOnce = Boolean(issPassSession)

    const loop = (now: number) => {
      if (now - lastSample >= 80) {
        lastSample = now
        const elapsed = now - start
        if (playOnce) {
          const u = Math.min(1, elapsed / motionCycleMs)
          setMotionProgress(u)
          if (u >= 1) {
            setMotionOn(false)
            setIssPassChoiceOpen(true)
            if (issPassSession) {
              setIssPassMessage(
                `Last pass — ${formatIssPassRange(issPassSession.rise, issPassSession.set, location.timeZone)}`,
              )
            }
            setIssPassMessageIsError(false)
            return
          }
        } else {
          const u =
            (((elapsed % motionCycleMs) + motionCycleMs) % motionCycleMs) / motionCycleMs
          setMotionProgress(u)
        }
      }
      raf = window.requestAnimationFrame(loop)
    }

    raf = window.requestAnimationFrame(loop)
    return () => window.cancelAnimationFrame(raf)
  }, [
    motionOn,
    motionCycleMs,
    when,
    location.latitude,
    location.longitude,
    location.timeZone,
    issPassSession,
  ])

  const displayWhen = useMemo(() => {
    if (issPassSession) {
      const span = issPassSession.set.getTime() - issPassSession.rise.getTime()
      const u = issPassChoiceOpen ? 1 : motionOn ? motionProgress : 0
      return new Date(issPassSession.rise.getTime() + Math.min(1, Math.max(0, u)) * span)
    }
    if (!motionOn) return when
    return new Date(when.getTime() - MOTION_SPAN_MS + motionProgress * MOTION_SPAN_MS)
  }, [motionOn, when, motionProgress, issPassSession, issPassChoiceOpen])

  const objects = useMemo(() => {
    const sky = computeSkyObjects(location, displayWhen)
    if (issReady) {
      const iss = computeIssSkyObject(location, displayWhen)
      if (iss) sky.push(iss)
    }
    return sky
  }, [location, displayWhen, issReady])
  const visibleObjects = objects.filter((o) => matchesSkyFilter(o, skyFilter))
  void tick

  const selected: SkyObject | null =
    selectedId == null ? null : (visibleObjects.find((o) => o.id === selectedId) ?? null)

  const visiblePlanets = objects.filter((o) => o.kind === 'planet' && o.altitude > 0)
  const sun = objects.find((o) => o.kind === 'sun')
  const moon = objects.find((o) => o.kind === 'moon')
  const iss = objects.find((o) => o.kind === 'iss')

  // Next forecast for the selected place, from wall clock (not motion scrub frames).
  // `tick` refreshes the forecast on the live-sky interval.
  const nextIssPassWindow = useMemo(() => {
    if (!issReady) return null
    void tick
    return findNextIssPassWindow(location, new Date())
  }, [location, issReady, tick])

  const nextIssPassSummary = nextIssPassWindow
    ? formatIssPassRange(
        nextIssPassWindow.rise,
        nextIssPassWindow.set,
        location.timeZone,
      )
    : null

  const hoursAgo = motionOn && !issPassSession ? (1 - motionProgress) * 6 : 0
  const issPassSummary = issPassSession
    ? formatIssPassRange(issPassSession.rise, issPassSession.set, location.timeZone)
    : null
  const motionStatus = issPassSession
    ? motionOn
      ? `Now playing · ${formatIssPassTime(displayWhen, location.timeZone)}`
      : issPassChoiceOpen
        ? 'ISS pass finished'
        : `Paused · ${formatIssPassTime(displayWhen, location.timeZone)}`
    : motionOn
      ? hoursAgo < 0.08
        ? `Motion · ${formatMotionClock(displayWhen, location.timeZone)} (selected time)`
        : `Motion · ${formatMotionClock(displayWhen, location.timeZone)} · ${hoursAgo.toFixed(1)}h ago`
      : null

  const changeMotionSpeed = (speed: MotionSpeedId) => {
    if (issPassSession) return
    setIssPassMessage(null)
    setIssPassMessageIsError(false)
    setMotionSpeed(speed)
  }

  const jumpToLastIssPass = () => {
    if (!issReady || !isIssTleReady()) {
      setIssPassMessage('No recent ISS pass found for this location.')
      setIssPassMessageIsError(true)
      return
    }

    const searchBefore = new Date(Math.max(when.getTime(), Date.now()))
    const window = findLastIssPassWindow(location, searchBefore)
    if (!window) {
      setIssPassMessage('No recent ISS pass found for this location.')
      setIssPassMessageIsError(true)
      return
    }

    setIssPassSession({
      rise: window.rise,
      set: window.set,
      previousWhen: issPassSession?.previousWhen ?? when,
      previousSpeed:
        issPassSession?.previousSpeed ??
        (motionSpeed === 'iss' ? DEFAULT_MOTION_SPEED : motionSpeed),
      previousMotionOn: issPassSession?.previousMotionOn ?? motionOn,
    })
    setWhen(window.rise)
    setMotionSpeed('iss')
    setMotionProgress(0)
    setIssPassChoiceOpen(false)
    setMotionOn(true)
    setSelectedId('iss')
    setIssPassMessage(
      `Playing last pass — ${formatIssPassRange(window.rise, window.set, location.timeZone)}`,
    )
    setIssPassMessageIsError(false)
  }

  const repeatIssPass = () => {
    if (!issPassSession) return
    setWhen(issPassSession.rise)
    setMotionProgress(0)
    setIssPassChoiceOpen(false)
    setMotionOn(true)
    setSelectedId('iss')
    setIssPassMessage(
      `Playing last pass — ${formatIssPassRange(issPassSession.rise, issPassSession.set, location.timeZone)}`,
    )
    setIssPassMessageIsError(false)
  }

  const returnFromIssPass = () => {
    if (!issPassSession) return
    const { previousWhen, previousSpeed, previousMotionOn } = issPassSession
    setIssPassSession(null)
    setIssPassChoiceOpen(false)
    setMotionProgress(0)
    setWhen(previousWhen)
    setMotionSpeed(previousSpeed)
    setMotionOn(previousMotionOn)
    setIssPassMessage(null)
    setIssPassMessageIsError(false)
    setSelectedId(null)
  }

  const toggleMotion = () => {
    if (issPassSession) {
      if (motionOn) {
        setMotionOn(false)
        setIssPassChoiceOpen(true)
        if (issPassSession) {
          setIssPassMessage(
            `Paused — ${formatIssPassRange(issPassSession.rise, issPassSession.set, location.timeZone)}`,
          )
        }
        setIssPassMessageIsError(false)
      } else if (issPassChoiceOpen) {
        repeatIssPass()
      } else {
        setMotionOn(true)
      }
      return
    }
    setMotionOn((v) => !v)
  }

  const persistLocation = (next: GeoLocation) => {
    setLocation(next)
    try {
      localStorage.setItem('skyabove:lastLocation', JSON.stringify(next))
    } catch {
      // ignore storage failures (private mode, etc.)
    }
  }

  /** City search / manual place — wins over any in-flight GPS request. */
  const chooseLocation = (next: GeoLocation) => {
    locationChoiceRef.current += 1
    setLocating(false)
    setGeoError(null)
    if (issPassSession) {
      setIssPassSession(null)
      setIssPassChoiceOpen(false)
      setMotionOn(false)
      setMotionProgress(0)
      setIssPassMessage(null)
      setIssPassMessageIsError(false)
      setMotionSpeed(
        issPassSession.previousSpeed === 'iss'
          ? DEFAULT_MOTION_SPEED
          : issPassSession.previousSpeed,
      )
    }
    persistLocation(next)
  }

  const applyBrowserLocation = async (
    latitude: number,
    longitude: number,
    options?: { quiet?: boolean; choiceId?: number },
  ) => {
    const choiceId = options?.choiceId ?? locationChoiceRef.current
    if (choiceId !== locationChoiceRef.current) return

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
      if (choiceId !== locationChoiceRef.current) return
      persistLocation({
        latitude,
        longitude,
        label,
        timeZone,
      })
    } catch {
      if (!options?.quiet) {
        setGeoError('Located you, but could not look up the place name.')
      }
    } finally {
      if (choiceId === locationChoiceRef.current) setLocating(false)
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

    const choiceId = ++locationChoiceRef.current
    setLocating(true)
    if (!options?.quiet) setGeoError(null)

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        void applyBrowserLocation(pos.coords.latitude, pos.coords.longitude, {
          quiet: options?.quiet,
          choiceId,
        })
      },
      (err) => {
        if (choiceId !== locationChoiceRef.current) return
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
    <div className={`app${isMobile ? ' is-mobile' : ''}${controlsOpen ? ' controls-open' : ''}`}>
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

      {isMobile && selected && (
        <div className="identify-card" role="status">
          <div className="identify-card-top">
            <span className="kind">{selected.kind === 'iss' ? 'satellite' : selected.kind}</span>
            <button
              type="button"
              className="identify-dismiss"
              aria-label="Clear selection"
              onClick={() => setSelectedId(null)}
            >
              Close
            </button>
          </div>
          <strong>{displayName(selected)}</strong>
          <p className="identify-distance">
            {formatDistance(selected) ?? 'Distance not known'}
          </p>
          <p className="identify-pos">
            Alt {selected.altitude.toFixed(0)}° · Az {selected.azimuth.toFixed(0)}°
            {selected.zodiacSign ? ` · ${selected.zodiacSign}` : ''}
          </p>
        </div>
      )}

      {isMobile && (
        <div className="mobile-dock">
          <div className="mobile-bar">
            <div className="mobile-place">
              <span className="mobile-place-label">Location</span>
              <strong>{location.label}</strong>
            </div>
            <button
              type="button"
              className={`btn mobile-controls-toggle${controlsOpen ? ' active' : ''}`}
              aria-expanded={controlsOpen}
              onClick={() => setControlsOpen((v) => !v)}
            >
              {controlsOpen ? 'Hide Controls' : 'Controls'}
            </button>
          </div>
          {geoError && !controlsOpen && <p className="error mobile-error">{geoError}</p>}
        </div>
      )}

      <aside className={`hud${controlsOpen ? ' is-open' : ''}`} hidden={isMobile && !controlsOpen}>
        <LocationPanel
          location={location}
          onLocationChange={chooseLocation}
          locating={locating}
          onUseMyLocation={useMyLocation}
          when={when}
          onWhenChange={setWhen}
          skyFilter={skyFilter}
          onSkyFilterChange={setSkyFilter}
          motionOn={motionOn}
          onToggleMotion={toggleMotion}
          motionStatus={motionStatus}
          motionSpeed={motionSpeed}
          onMotionSpeedChange={changeMotionSpeed}
          onLastIssPass={jumpToLastIssPass}
          issPassMessage={issPassMessage}
          issPassMessageIsError={issPassMessageIsError}
          issPassSummary={issPassSummary}
          nextIssPassSummary={nextIssPassSummary}
          issPassChoiceOpen={issPassChoiceOpen}
          onRepeatIssPass={repeatIssPass}
          onReturnFromIssPass={returnFromIssPass}
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
              <p className="status-line">
                <span className="label">ISS</span>{' '}
                <strong>
                  {issPassSummary
                    ? iss
                      ? `${iss.altitude.toFixed(0)}° up · Last pass — ${issPassSummary}`
                      : `Last pass — ${issPassSummary}`
                    : iss
                      ? `${iss.altitude.toFixed(0)}° up · Az ${iss.azimuth.toFixed(0)}°`
                      : 'Not in this sky'}
                  {nextIssPassSummary
                    ? ` · Next — ${nextIssPassSummary}`
                    : issReady
                      ? ' · Next — unknown'
                      : ''}
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

        {selected && !isMobile && (
          <div className="selection" role="status">
            <span className="kind">{selected.kind === 'iss' ? 'satellite' : selected.kind}</span>
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
        {isMobile
          ? 'Tap a star or planet to identify · pinch to zoom'
          : 'Zoom +, then use side arrows, scroll, or drag to explore · tap for details'}
      </p>
    </div>
  )
}
