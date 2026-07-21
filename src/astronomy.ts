import {
  Body,
  Equator,
  Horizon,
  Illumination,
  MakeTime,
  Observer,
  type AstroTime,
} from 'astronomy-engine'
import { BRIGHT_STARS } from './data/stars'
import type { GeoLocation, SkyObject } from './types'

const PLANETS: { body: Body; name: string; color: string; magnitude: number }[] = [
  { body: Body.Mercury, name: 'Mercury', color: '#c9b8a0', magnitude: 0.2 },
  { body: Body.Venus, name: 'Venus', color: '#f5e6c8', magnitude: -4.0 },
  { body: Body.Mars, name: 'Mars', color: '#e07a5f', magnitude: 0.8 },
  { body: Body.Jupiter, name: 'Jupiter', color: '#e8c99b', magnitude: -2.2 },
  { body: Body.Saturn, name: 'Saturn', color: '#d4c49a', magnitude: 0.5 },
  { body: Body.Uranus, name: 'Uranus', color: '#9ec8d4', magnitude: 5.5 },
  { body: Body.Neptune, name: 'Neptune', color: '#6b8fd4', magnitude: 7.8 },
]

function starColor(mag: number): string {
  if (mag < 0) return '#fff8e8'
  if (mag < 1) return '#f0f4ff'
  if (mag < 2) return '#dce6f5'
  if (mag < 3) return '#b8c7dc'
  return '#8fa3bf'
}

function toHorizontal(
  raHours: number,
  decDegrees: number,
  time: AstroTime,
  observer: Observer,
): { altitude: number; azimuth: number } {
  const hor = Horizon(time, observer, raHours, decDegrees, 'normal')
  return { altitude: hor.altitude, azimuth: hor.azimuth }
}

export function computeSkyObjects(
  location: GeoLocation,
  when: Date,
): SkyObject[] {
  const observer = new Observer(location.latitude, location.longitude, 0)
  const time = MakeTime(when)
  const objects: SkyObject[] = []

  for (const star of BRIGHT_STARS) {
    const { altitude, azimuth } = toHorizontal(star.ra, star.dec, time, observer)
    if (altitude < -2) continue
    objects.push({
      id: `star-${star.ra}-${star.dec}-${star.mag}`,
      name: star.name ?? 'Star',
      kind: 'star',
      altitude,
      azimuth,
      magnitude: star.mag,
      color: starColor(star.mag),
    })
  }

  for (const planet of PLANETS) {
    const equ = Equator(planet.body, time, observer, true, true)
    const { altitude, azimuth } = toHorizontal(equ.ra, equ.dec, time, observer)
    if (altitude < -5) continue
    objects.push({
      id: `planet-${planet.name}`,
      name: planet.name,
      kind: 'planet',
      altitude,
      azimuth,
      magnitude: planet.magnitude,
      color: planet.color,
    })
  }

  {
    const equ = Equator(Body.Sun, time, observer, true, true)
    const { altitude, azimuth } = toHorizontal(equ.ra, equ.dec, time, observer)
    objects.push({
      id: 'sun',
      name: 'Sun',
      kind: 'sun',
      altitude,
      azimuth,
      magnitude: -26.7,
      color: '#f2e6c4',
    })
  }

  {
    const equ = Equator(Body.Moon, time, observer, true, true)
    const { altitude, azimuth } = toHorizontal(equ.ra, equ.dec, time, observer)
    const illum = Illumination(Body.Moon, time)
    objects.push({
      id: 'moon',
      name: 'Moon',
      kind: 'moon',
      altitude,
      azimuth,
      magnitude: -12.0,
      phase: illum.phase_fraction,
      color: '#e8eef5',
    })
  }

  return objects
}

/** Stereographic-ish projection of alt/az onto a circular sky dome. */
export function projectToCanvas(
  altitude: number,
  azimuth: number,
  width: number,
  height: number,
): { x: number; y: number; visible: boolean } {
  if (altitude < -1) {
    return { x: 0, y: 0, visible: false }
  }

  const cx = width / 2
  const cy = height / 2
  const radius = Math.min(width, height) * 0.48

  // Zenith at center; horizon at outer rim. Azimuth: 0° north, clockwise.
  const zenithDistance = ((90 - altitude) * Math.PI) / 180
  const r = radius * (zenithDistance / (Math.PI / 2))
  const azRad = ((azimuth - 90) * Math.PI) / 180

  return {
    x: cx + r * Math.cos(azRad),
    y: cy + r * Math.sin(azRad),
    visible: altitude >= -1 && r <= radius * 1.02,
  }
}

export function formatCoords(location: GeoLocation): string {
  const ns = location.latitude >= 0 ? 'N' : 'S'
  const ew = location.longitude >= 0 ? 'E' : 'W'
  return `${Math.abs(location.latitude).toFixed(2)}°${ns} · ${Math.abs(location.longitude).toFixed(2)}°${ew}`
}

export function skyTone(when: Date, sunAltitude: number): {
  top: string
  mid: string
  bottom: string
  glow: string
} {
  if (sunAltitude > 8) {
    return {
      top: '#4a7ab5',
      mid: '#7aa8d4',
      bottom: '#c5d8ea',
      glow: 'rgba(242, 230, 196, 0.35)',
    }
  }
  if (sunAltitude > -4) {
    return {
      top: '#1a2a4a',
      mid: '#3d4a6e',
      bottom: '#8b6b5a',
      glow: 'rgba(232, 150, 90, 0.28)',
    }
  }
  if (sunAltitude > -12) {
    return {
      top: '#080e1c',
      mid: '#121c35',
      bottom: '#2a2430',
      glow: 'rgba(180, 120, 70, 0.12)',
    }
  }
  const hour = when.getHours() + when.getMinutes() / 60
  const nightDeep = hour < 4 || hour > 22
  return {
    top: nightDeep ? '#03060f' : '#060b18',
    mid: nightDeep ? '#0a1228' : '#0d1630',
    bottom: nightDeep ? '#101828' : '#152038',
    glow: 'rgba(150, 180, 220, 0.08)',
  }
}
