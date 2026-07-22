import { useState } from 'react'
import type { GeoLocation, SkyFilter } from '../types'
import { PRESET_LOCATIONS, SKY_FILTERS } from '../types'
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
}

function toLocalInputValue(date: Date): string {
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`
}

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
}: Props) {
  const [cityQuery, setCityQuery] = useState('')
  const [matches, setMatches] = useState<CityMatch[]>([])
  const [searching, setSearching] = useState(false)
  const [searchError, setSearchError] = useState<string | null>(null)

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
      }
    } catch (err) {
      setMatches([])
      setSearchError(err instanceof Error ? err.message : 'City lookup failed.')
    } finally {
      setSearching(false)
    }
  }

  const pickCity = (city: CityMatch) => {
    onLocationChange({
      latitude: city.latitude,
      longitude: city.longitude,
      label: city.label,
      timeZone: city.timeZone,
    })
    setCityQuery(city.label)
    setMatches([])
    setSearchError(null)
  }

  return (
    <div className="panel">
      <div className="panel-row">
        <label className="field">
          <span>Place</span>
          <select
            value={PRESET_LOCATIONS.find((p) => p.label === location.label)?.label ?? 'custom'}
            onChange={(e) => {
              const preset = PRESET_LOCATIONS.find((p) => p.label === e.target.value)
              if (preset) {
                onLocationChange(preset)
                setCityQuery('')
                setMatches([])
                setSearchError(null)
              }
            }}
          >
            {!PRESET_LOCATIONS.some((p) => p.label === location.label) && (
              <option value="custom">{location.label}</option>
            )}
            {PRESET_LOCATIONS.map((p) => (
              <option key={p.label} value={p.label}>
                {p.label}
              </option>
            ))}
          </select>
        </label>

        <button
          type="button"
          className="btn"
          onClick={onUseMyLocation}
          disabled={locating}
          title={
            location.label !== 'My location'
              ? `Currently showing ${location.label}`
              : 'Detect your current location'
          }
        >
          {locating ? 'Finding…' : 'Use my location'}
        </button>
      </div>
      {!PRESET_LOCATIONS.some((p) => p.label === location.label) &&
        location.label !== 'My location' && (
          <p className="current-place" aria-live="polite">
            Showing <strong>{location.label}</strong>
          </p>
        )}

      <div className="panel-row">
        <label className="field grow">
          <span>Find a city</span>
          <input
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
            }}
          />
        </label>
        <button
          type="button"
          className="btn ghost"
          onClick={() => void lookUpCity()}
          disabled={searching}
        >
          {searching ? 'Looking…' : 'Look up'}
        </button>
      </div>

      {searchError && <p className="error">{searchError}</p>}

      {matches.length > 0 && (
        <ul className="city-results" role="listbox" aria-label="City matches">
          {matches.map((city) => (
            <li key={city.id}>
              <button
                type="button"
                className="city-result"
                onClick={() => pickCity(city)}
              >
                <span className="city-result-name">{city.label}</span>
                <span className="city-result-detail">{city.detail}</span>
              </button>
            </li>
          ))}
        </ul>
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
        >
          {motionOn ? 'Stop motion' : 'Play last 6 hours'}
        </button>
        {motionStatus && (
          <p className="motion-status" role="status">
            {motionStatus}
          </p>
        )}
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

      <p className="coords">{formatCoords(location)}</p>
      <p className="sun-times">{formatSunTimesSummary(location, when)}</p>
    </div>
  )
}
