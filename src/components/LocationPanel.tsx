import type { GeoLocation } from '../types'
import { PRESET_LOCATIONS } from '../types'
import { formatCoords } from '../astronomy'

type Props = {
  location: GeoLocation
  onLocationChange: (location: GeoLocation) => void
  locating: boolean
  onUseMyLocation: () => void
  when: Date
  onWhenChange: (when: Date) => void
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
}: Props) {
  return (
    <div className="panel">
      <div className="panel-row">
        <label className="field">
          <span>Place</span>
          <select
            value={PRESET_LOCATIONS.find((p) => p.label === location.label)?.label ?? 'custom'}
            onChange={(e) => {
              const preset = PRESET_LOCATIONS.find((p) => p.label === e.target.value)
              if (preset) onLocationChange(preset)
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
        >
          {locating ? 'Finding…' : 'Use my location'}
        </button>
      </div>

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

      <p className="coords">{formatCoords(location)}</p>
    </div>
  )
}
