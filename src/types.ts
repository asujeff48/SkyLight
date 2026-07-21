export type GeoLocation = {
  latitude: number
  longitude: number
  label: string
}

export type SkyBodyKind = 'star' | 'planet' | 'moon' | 'sun'

export type SkyObject = {
  id: string
  name: string
  kind: SkyBodyKind
  altitude: number
  azimuth: number
  magnitude: number
  /** 0–1 illuminated fraction for Moon; unused for others */
  phase?: number
  color: string
}

export const PRESET_LOCATIONS: GeoLocation[] = [
  { latitude: 40.7128, longitude: -74.006, label: 'New York' },
  { latitude: 51.5074, longitude: -0.1278, label: 'London' },
  { latitude: 35.6762, longitude: 139.6503, label: 'Tokyo' },
  { latitude: -33.8688, longitude: 151.2093, label: 'Sydney' },
  { latitude: 48.8566, longitude: 2.3522, label: 'Paris' },
  { latitude: -22.9068, longitude: -43.1729, label: 'Rio de Janeiro' },
  { latitude: 19.4326, longitude: -99.1332, label: 'Mexico City' },
  { latitude: 1.3521, longitude: 103.8198, label: 'Singapore' },
  { latitude: 64.1466, longitude: -21.9426, label: 'Reykjavík' },
  { latitude: -33.9249, longitude: 18.4241, label: 'Cape Town' },
]
