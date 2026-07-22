import { useEffect, useRef } from 'react'
import { projectToCanvas, skyTone } from '../astronomy'
import { ZODIAC_ART } from '../data/zodiacArt'
import { ZODIAC_SIGNS } from '../data/zodiac'
import { ZODIAC_FIGURE_COLORS, ZODIAC_FIGURE_LINES } from '../data/zodiacFigures'
import type { SkyObject } from '../types'

type Props = {
  objects: SkyObject[]
  when: Date
  selectedId: string | null
  onSelect: (object: SkyObject | null) => void
  /** When true, name every zodiac star (and include its sign). */
  emphasizeZodiac?: boolean
}

function drawMoon(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  radius: number,
  phase: number,
) {
  ctx.save()
  ctx.beginPath()
  ctx.arc(x, y, radius, 0, Math.PI * 2)
  ctx.fillStyle = '#e8eef5'
  ctx.shadowColor = 'rgba(220, 230, 245, 0.55)'
  ctx.shadowBlur = radius * 1.8
  ctx.fill()

  // Simple phase shadow: illuminated fraction from right
  ctx.beginPath()
  ctx.arc(x, y, radius + 0.5, 0, Math.PI * 2)
  ctx.clip()

  const offset = (1 - 2 * phase) * radius
  ctx.beginPath()
  ctx.arc(x + offset, y, radius, 0, Math.PI * 2)
  ctx.fillStyle = 'rgba(6, 10, 22, 0.88)'
  ctx.shadowBlur = 0
  ctx.fill()
  ctx.restore()
}

function drawSun(ctx: CanvasRenderingContext2D, x: number, y: number, radius: number) {
  const gradient = ctx.createRadialGradient(x, y, 0, x, y, radius * 3)
  gradient.addColorStop(0, 'rgba(255, 244, 210, 1)')
  gradient.addColorStop(0.35, 'rgba(242, 210, 140, 0.85)')
  gradient.addColorStop(1, 'rgba(242, 180, 90, 0)')

  ctx.beginPath()
  ctx.arc(x, y, radius * 3, 0, Math.PI * 2)
  ctx.fillStyle = gradient
  ctx.fill()

  ctx.beginPath()
  ctx.arc(x, y, radius, 0, Math.PI * 2)
  ctx.fillStyle = '#fff4d0'
  ctx.fill()
}

/** Named bright bodies that should keep a readable on-sky label. */
function shouldShowLabel(
  obj: SkyObject,
  selected: boolean,
  emphasizeZodiac: boolean,
): boolean {
  if (!obj.name) return false
  if (selected) return true
  if (obj.kind === 'sun' || obj.kind === 'moon') return true
  // Label every planet above the horizon — there are few of them.
  if (obj.kind === 'planet') return true
  if (emphasizeZodiac && obj.zodiacSign) return true
  // Named stars brighter than ~mag 2 (Sirius through Polaris, Deneb, etc.)
  return obj.magnitude < 2.0
}

function drawLabel(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  emphasis: boolean,
) {
  ctx.save()
  ctx.font = `${emphasis ? '600' : '500'} 11px Sora, sans-serif`
  ctx.textAlign = 'left'
  ctx.textBaseline = 'middle'
  ctx.lineWidth = 3
  ctx.strokeStyle = 'rgba(5, 9, 20, 0.72)'
  ctx.strokeText(text, x, y)
  ctx.fillStyle = emphasis ? 'rgba(248, 250, 255, 0.95)' : 'rgba(230, 238, 250, 0.88)'
  ctx.fillText(text, x, y)
  ctx.restore()
}

type ProjectedStar = { x: number; y: number; visible: boolean }

function rgbaWithAlpha(color: string, alpha: number): string {
  const match = color.match(/rgba?\(([^)]+)\)/)
  if (!match) return color
  const [r, g, b] = match[1].split(',').map((v) => v.trim())
  return `rgba(${r}, ${g}, ${b}, ${alpha})`
}

/**
 * Draw full zodiac animals/characters over each visible constellation,
 * sized to the star group, with a faint star-link underlay.
 */
function drawZodiacFigures(
  ctx: CanvasRenderingContext2D,
  objects: SkyObject[],
  width: number,
  height: number,
  frame: number,
) {
  const byName = new Map<string, ProjectedStar>()
  const starsBySign = new Map<string, { x: number; y: number }[]>()

  for (const obj of objects) {
    if (obj.kind !== 'star' || !obj.name || !obj.zodiacSign) continue
    const p = projectToCanvas(obj.altitude, obj.azimuth, width, height)
    byName.set(obj.name, p)
    if (!p.visible) continue
    const list = starsBySign.get(obj.zodiacSign) ?? []
    list.push({ x: p.x, y: p.y })
    starsBySign.set(obj.zodiacSign, list)
  }

  const breathe = 0.85 + 0.15 * (0.5 + 0.5 * Math.sin(frame * 0.025))

  for (const sign of ZODIAC_SIGNS) {
    const points = starsBySign.get(sign)
    if (!points || points.length < 1) continue

    const color = ZODIAC_FIGURE_COLORS[sign]
    const cx = points.reduce((s, p) => s + p.x, 0) / points.length
    const cy = points.reduce((s, p) => s + p.y, 0) / points.length

    let maxDist = 28
    for (const p of points) {
      maxDist = Math.max(maxDist, Math.hypot(p.x - cx, p.y - cy))
    }
    // Fit the normalized art (±1) into the constellation footprint.
    const scale = Math.min(Math.max(maxDist * 1.15, 36), Math.min(width, height) * 0.22)

    // Faint star-to-star underlay so the sky pattern still reads.
    ctx.save()
    ctx.lineCap = 'round'
    ctx.strokeStyle = rgbaWithAlpha(color, 0.28)
    ctx.lineWidth = 1
    ctx.setLineDash([4, 5])
    for (const [aName, bName] of ZODIAC_FIGURE_LINES[sign]) {
      const a = byName.get(aName)
      const b = byName.get(bName)
      if (!a?.visible || !b?.visible) continue
      ctx.beginPath()
      ctx.moveTo(a.x, a.y)
      ctx.lineTo(b.x, b.y)
      ctx.stroke()
    }
    ctx.setLineDash([])
    ctx.restore()

    // Full animal / character illustration
    ctx.save()
    ctx.translate(cx, cy)
    ctx.scale(scale * breathe, scale * breathe)
    ctx.globalAlpha = 0.88
    ctx.fillStyle = rgbaWithAlpha(color, 0.42)
    ctx.strokeStyle = rgbaWithAlpha(color, 1)
    ctx.lineWidth = 2.4 / scale
    ctx.lineCap = 'round'
    ctx.lineJoin = 'round'
    ctx.shadowColor = rgbaWithAlpha(color, 0.65)
    ctx.shadowBlur = 16 / scale
    ZODIAC_ART[sign](ctx)
    ctx.restore()

    // Sign caption under the figure
    ctx.save()
    ctx.font = '600 13px Fraunces, Georgia, serif'
    ctx.textAlign = 'center'
    ctx.textBaseline = 'top'
    ctx.lineWidth = 4
    ctx.strokeStyle = 'rgba(5, 9, 20, 0.7)'
    ctx.strokeText(sign, cx, cy + scale * 0.95)
    ctx.fillStyle = rgbaWithAlpha(color, 0.98)
    ctx.fillText(sign, cx, cy + scale * 0.95)
    ctx.restore()
  }
}

export function SkyCanvas({
  objects,
  when,
  selectedId,
  onSelect,
  emphasizeZodiac = false,
}: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const objectsRef = useRef(objects)
  objectsRef.current = objects
  const emphasizeZodiacRef = useRef(emphasizeZodiac)
  emphasizeZodiacRef.current = emphasizeZodiac

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    let frame = 0
    let raf = 0
    let width = 0
    let height = 0

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2)
      width = canvas.clientWidth
      height = canvas.clientHeight
      canvas.width = Math.floor(width * dpr)
      canvas.height = Math.floor(height * dpr)
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
    }

    const draw = () => {
      frame += 1
      const sun = objectsRef.current.find((o) => o.kind === 'sun')
      const tone = skyTone(when, sun?.altitude ?? -90)

      const bg = ctx.createLinearGradient(0, 0, 0, height)
      bg.addColorStop(0, tone.top)
      bg.addColorStop(0.55, tone.mid)
      bg.addColorStop(1, tone.bottom)
      ctx.fillStyle = bg
      ctx.fillRect(0, 0, width, height)

      // Soft horizon glow
      const glow = ctx.createRadialGradient(
        width / 2,
        height * 0.92,
        0,
        width / 2,
        height * 0.92,
        Math.min(width, height) * 0.7,
      )
      glow.addColorStop(0, tone.glow)
      glow.addColorStop(1, 'rgba(0,0,0,0)')
      ctx.fillStyle = glow
      ctx.fillRect(0, 0, width, height)

      // Subtle atmospheric vignette / dome edge
      const domeR = Math.min(width, height) * 0.48
      ctx.beginPath()
      ctx.arc(width / 2, height / 2, domeR, 0, Math.PI * 2)
      ctx.strokeStyle = 'rgba(180, 200, 230, 0.08)'
      ctx.lineWidth = 1
      ctx.stroke()

      // Cardinal marks
      ctx.fillStyle = 'rgba(180, 200, 230, 0.35)'
      ctx.font = '500 11px Sora, sans-serif'
      ctx.textAlign = 'center'
      ctx.fillText('N', width / 2, height / 2 - domeR - 10)
      ctx.fillText('S', width / 2, height / 2 + domeR + 18)
      ctx.textAlign = 'right'
      ctx.fillText('W', width / 2 - domeR - 10, height / 2 + 4)
      ctx.textAlign = 'left'
      ctx.fillText('E', width / 2 + domeR + 10, height / 2 + 4)

      const sorted = [...objectsRef.current].sort((a, b) => b.magnitude - a.magnitude)
      const labels: { text: string; x: number; y: number; emphasis: boolean }[] = []

      // Constellation stick figures behind the stars (Zodiac Signs filter).
      if (emphasizeZodiacRef.current) {
        drawZodiacFigures(ctx, objectsRef.current, width, height, frame)
      }

      for (const obj of sorted) {
        const { x, y, visible } = projectToCanvas(obj.altitude, obj.azimuth, width, height)
        if (!visible) continue

        const selected = obj.id === selectedId
        const twinkle =
          obj.kind === 'star' ? 0.75 + 0.25 * Math.sin(frame * 0.04 + obj.azimuth) : 1

        let markerRadius = 3

        if (obj.kind === 'sun') {
          markerRadius = 18
          drawSun(ctx, x, y, markerRadius)
        } else if (obj.kind === 'moon') {
          markerRadius = 14
          drawMoon(ctx, x, y, markerRadius, obj.phase ?? 0.5)
        } else if (obj.kind === 'planet') {
          markerRadius = obj.magnitude < -1 ? 5.5 : obj.magnitude < 1 ? 4.2 : 3.2
          ctx.beginPath()
          ctx.arc(x, y, markerRadius + (selected ? 2 : 0), 0, Math.PI * 2)
          ctx.fillStyle = obj.color
          ctx.shadowColor = obj.color
          ctx.shadowBlur = 12
          ctx.globalAlpha = 0.95
          ctx.fill()
          ctx.shadowBlur = 0
          ctx.globalAlpha = 1

          if (obj.name === 'Saturn') {
            ctx.strokeStyle = 'rgba(212, 196, 154, 0.7)'
            ctx.lineWidth = 1.2
            ctx.beginPath()
            ctx.ellipse(x, y, markerRadius * 2.2, markerRadius * 0.7, -0.4, 0, Math.PI * 2)
            ctx.stroke()
          }
        } else {
          markerRadius = Math.max(0.6, 3.2 - obj.magnitude * 0.55)
          ctx.beginPath()
          ctx.arc(x, y, markerRadius, 0, Math.PI * 2)
          ctx.fillStyle = obj.color
          ctx.globalAlpha = twinkle
          ctx.shadowColor = obj.color
          ctx.shadowBlur = obj.magnitude < 1.5 ? 8 : 0
          ctx.fill()
          ctx.shadowBlur = 0
          ctx.globalAlpha = 1
        }

        if (selected && obj.kind !== 'sun') {
          ctx.beginPath()
          ctx.arc(x, y, 14, 0, Math.PI * 2)
          ctx.strokeStyle = 'rgba(230, 240, 255, 0.45)'
          ctx.lineWidth = 1
          ctx.stroke()
        }

        if (obj.name && shouldShowLabel(obj, selected, emphasizeZodiacRef.current)) {
          const emphasis =
            selected ||
            obj.kind === 'sun' ||
            obj.kind === 'moon' ||
            obj.kind === 'planet' ||
            Boolean(emphasizeZodiacRef.current && obj.zodiacSign)
          const text =
            emphasizeZodiacRef.current && obj.zodiacSign
              ? `${obj.name} · ${obj.zodiacSign}`
              : obj.name
          labels.push({
            text,
            x: x + markerRadius + 6,
            y,
            emphasis,
          })
        }
      }

      // Draw labels after markers so names stay readable over nearby stars.
      for (const label of labels) {
        drawLabel(ctx, label.text, label.x, label.y, label.emphasis)
      }

      raf = requestAnimationFrame(draw)
    }

    resize()
    draw()
    window.addEventListener('resize', resize)

    return () => {
      cancelAnimationFrame(raf)
      window.removeEventListener('resize', resize)
    }
  }, [when, selectedId, emphasizeZodiac])

  const handlePointer = (clientX: number, clientY: number) => {
    const canvas = canvasRef.current
    if (!canvas) return
    const rect = canvas.getBoundingClientRect()
    const x = clientX - rect.left
    const y = clientY - rect.top
    const width = rect.width
    const height = rect.height

    let best: SkyObject | null = null
    let bestDist = 18

    for (const obj of objectsRef.current) {
      const p = projectToCanvas(obj.altitude, obj.azimuth, width, height)
      if (!p.visible) continue
      const d = Math.hypot(p.x - x, p.y - y)
      const hit =
        obj.kind === 'sun' || obj.kind === 'moon' ? 22 : obj.kind === 'planet' ? 14 : 10
      if (d < hit && d < bestDist) {
        bestDist = d
        best = obj
      }
    }
    onSelect(best)
  }

  return (
    <canvas
      ref={canvasRef}
      className="sky-canvas"
      aria-label="Interactive sky map"
      onClick={(e) => handlePointer(e.clientX, e.clientY)}
    />
  )
}
