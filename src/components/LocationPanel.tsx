import { useEffect, useRef, useState } from 'react'
import type { GeoLocation, MotionSpeedId, SkyFilter } from '../types'
import { MOTION_SPEEDS, SKY_FILTERS } from '../types'
import { formatCoords, formatSunTimesSummary } from '../astronomy'
import { searchCities, type CityMatch } from '../geocode'

type Props = {
  location: GeoLocation
  onLocationChange: (location: GeoLocation) => void
  locating: boolean
  onUseMyLocation: () => void
  when: Date
  onWhenChange: (when: Date) => void
  skyFilter: SkyFilter
  onSkyFilterChange: (filter: SkyFilter) => void
  motionOn: boolean
  onToggleMotion: () => void
  motionStatus: string | null
  motionSpeed: MotionSpeedId
  onMotionSpeedChange: (speed: MotionSpeedId) => void
  onLastIssPass: () => void
  issPassMessage: string | null
  issPassMessageIsError?: boolean
  issPassChoiceOpen?: boolean
  onRepeatIssPass?: () => void
  onReturnFromIssPass?: () => void
}

function toLocalInputValue(date: Date): string {
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`
}

/**
 * Option B layout: current place as the panel header, with Near me / Change place.
 * Prior layout is preserved in LocationPanel.legacy.tsx for rollback.
 */
export function LocationPanel({
  location,
  onLocationChange,
  locating,
  onUseMyLocation,
  when,
  onWhenChange,
  skyFilter,
  onSkyFilterChange,
  motionOn,
  onToggleMotion,
  motionStatus,
  motionSpeed,
  onMotionSpeedChange,
  onLastIssPass,
  issPassMessage,
  issPassMessageIsError = false,
  issPassChoiceOpen = false,
  onRepeatIssPass,
  onReturnFromIssPass,
}: Props) {
  const [changingPlace, setChangingPlace] = useState(false)
  const [cityQuery, setCityQuery] = useState('')
  const [matches, setMatches] = useState<CityMatch[]>([])
  const [searching, setSearching] = useState(false)
  const [searchError, setSearchError] = useState<string | null>(null)
  const searchRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (changingPlace) {
      searchRef.current?.focus()
    }
  }, [changingPlace])

  const closeSearch = () => {
    setChangingPlace(false)
    setCityQuery('')
    setMatches([])
    setSearchError(null)
  }

  const pickCity = (city: CityMatch) => {
    onLocationChange({
      latitude: city.latitude,
      longitude: city.longitude,
      label: city.label,
      timeZone: city.timeZone,
    })
    closeSearch()
  }

  const lookUpCity = async () => {
    const query = cityQuery.trim()
    if (query.length < 2) {
      setSearchError('Enter at least 2 letters of a city name.')
      setMatches([])
      return
    }

    setSearching(true)
    setSearchError(null)
    try {
      const results = await searchCities(query)
      setMatches(results)
      if (results.length === 0) {
        setSearchError('No cities found. Try another spelling.')
        return
      }
      // One clear match → switch the sky immediately (Find alone felt incomplete).
      if (results.length === 1) {
        pickCity(results[0])
      }
    } catch (err) {
      setMatches([])
      setSearchError(err instanceof Error ? err.message : 'City lookup failed.')
    } finally {
      setSearching(false)
    }
  }

  return (
    <div className="panel">
      <header className="place-header" aria-live="polite">
        <p className="place-kicker">Viewing</p>
        <h2 className="place-title">{location.label}</h2>
        <p className="place-meta">
          <span>{formatCoords(location)}</span>
          <span className="place-meta-sep" aria-hidden="true">
            ·
          </span>
          <span>{formatSunTimesSummary(location, when)}</span>
        </p>
      </header>

      <div className="place-actions">
        <button
          type="button"
          className="btn ghost place-action"
          onClick={onUseMyLocation}
          disabled={locating}
          title="Detect your current location"
        >
          {locating ? 'Finding…' : 'Near me'}
        </button>
        <button
          type="button"
          className={`btn place-action${changingPlace ? ' ghost' : ''}`}
          aria-expanded={changingPlace}
          aria-controls="place-search"
          onClick={() => {
            if (changingPlace) closeSearch()
            else setChangingPlace(true)
          }}
        >
          {changingPlace ? 'Cancel' : 'Change place'}
        </button>
      </div>

      {changingPlace && (
        <div id="place-search" className="place-search">
          <div className="panel-row">
            <label className="field grow">
              <span>Search cities</span>
              <input
                ref={searchRef}
                type="search"
                name="city"
                autoComplete="address-level2"
                placeholder="e.g. Chicago, Mumbai, Cairo"
                value={cityQuery}
                onChange={(e) => {
                  setCityQuery(e.target.value)
                  setSearchError(null)
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault()
                    void lookUpCity()
                  }
                  if (e.key === 'Escape') {
                    e.preventDefault()
                    closeSearch()
                  }
                }}
              />
            </label>
            <button
              type="button"
              className="btn ghost"
              onClick={() => void lookUpCity()}
              disabled={searching}
            >
              {searching ? 'Finding…' : 'Find'}
            </button>
          </div>

          {searchError && <p className="error">{searchError}</p>}

          {matches.length > 0 && (
            <>
              <p className="place-search-hint">
                Tap View sky on a result to switch the map to that place.
              </p>
              <ul className="city-results" role="listbox" aria-label="City matches">
                {matches.map((city) => (
                  <li key={city.id}>
                    <button
                      type="button"
                      className="city-result"
                      onClick={() => pickCity(city)}
                    >
                      <span className="city-result-text">
                        <span className="city-result-name">{city.label}</span>
                        <span className="city-result-detail">{city.detail}</span>
                      </span>
                      <span className="city-result-go">View sky</span>
                    </button>
                  </li>
                ))}
              </ul>
            </>
          )}
        </div>
      )}

      <div className="panel-row">
        <label className="field grow">
          <span>Date & time</span>
          <input
            type="datetime-local"
            value={toLocalInputValue(when)}
            onChange={(e) => {
              const next = new Date(e.target.value)
              if (!Number.isNaN(next.getTime())) onWhenChange(next)
            }}
          />
        </label>
        <button
          type="button"
          className="btn ghost"
          onClick={() => onWhenChange(new Date())}
        >
          Now
        </button>
      </div>

      <div className="panel-row motion-row">
        <button
          type="button"
          className={`btn motion-btn${motionOn ? ' active' : ' ghost'}`}
          aria-pressed={motionOn}
          onClick={onToggleMotion}
          disabled={issPassChoiceOpen}
        >
          {issPassChoiceOpen
            ? 'ISS pass finished'
            : motionOn
              ? 'Stop motion'
              : 'Play last 6 hours'}
        </button>
        {motionStatus && (
          <p className="motion-status" role="status">
            {motionStatus}
          </p>
        )}
      </div>

      {issPassChoiceOpen && (
        <div className="iss-pass-choice" role="group" aria-label="After ISS pass">
          <p className="iss-pass-choice-text">What would you like to do next?</p>
          <div className="iss-pass-choice-actions">
            <button type="button" className="btn" onClick={onRepeatIssPass}>
              Repeat ISS Pass
            </button>
            <button type="button" className="btn ghost" onClick={onReturnFromIssPass}>
              Return to Previous View
            </button>
          </div>
        </div>
      )}

      <div className="filter-block motion-speed-block">
        <span className="filter-label">Motion speed</span>
        <div className="filter-group" role="group" aria-label="Motion playback speed">
          {MOTION_SPEEDS.map((option) => (
            <button
              key={option.id}
              type="button"
              className={`filter-btn${motionSpeed === option.id ? ' active' : ''}`}
              aria-pressed={motionSpeed === option.id}
              title={option.hint}
              disabled={issPassChoiceOpen && !option.isPassAction}
              onClick={() => {
                if (option.isPassAction) onLastIssPass()
                else onMotionSpeedChange(option.id)
              }}
            >
              {option.label}
            </button>
          ))}
        </div>
        <p
          className={`motion-speed-hint${issPassMessageIsError ? ' is-error' : ''}`}
          role={issPassMessage ? 'status' : undefined}
        >
          {issPassMessage ??
            MOTION_SPEEDS.find((s) => s.id === motionSpeed)?.hint ??
            ''}
        </p>
      </div>

      <div className="filter-block">
        <span className="filter-label">Show</span>
        <div className="filter-group" role="group" aria-label="Sky object filter">
          {SKY_FILTERS.map((option) => (
            <button
              key={option.id}
              type="button"
              className={`filter-btn${skyFilter === option.id ? ' active' : ''}`}
              aria-pressed={skyFilter === option.id}
              onClick={() => onSkyFilterChange(option.id)}
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
