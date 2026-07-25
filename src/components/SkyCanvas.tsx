import { useEffect, useRef, useState } from 'react'
import { projectToCanvas, skyDomeRadius, skyTone } from '../astronomy'
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

type ViewTransform = {
  scale: number
  panX: number
  panY: number
}

const MIN_SCALE = 1
const MAX_SCALE = 5

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

function shouldShowLabel(
  obj: SkyObject,
  selected: boolean,
  emphasizeZodiac: boolean,
): boolean {
  if (!obj.name) return false
  if (selected) return true
  if (obj.kind === 'sun' || obj.kind === 'moon') return true
  if (obj.kind === 'planet' || obj.kind === 'iss') return true
  if (emphasizeZodiac && obj.zodiacSign) return true
  return obj.magnitude < 2.0
}

function drawIss(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  selected: boolean,
  sizeBoost: number,
) {
  const r = 5.5 * sizeBoost
  ctx.save()
  ctx.translate(x, y)

  // Soft glow
  ctx.beginPath()
  ctx.arc(0, 0, r * 2.4, 0, Math.PI * 2)
  ctx.fillStyle = 'rgba(159, 212, 255, 0.22)'
  ctx.fill()

  // Solar panels
  ctx.fillStyle = 'rgba(120, 170, 220, 0.95)'
  ctx.fillRect(-r * 2.6, -r * 0.35, r * 1.7, r * 0.7)
  ctx.fillRect(r * 0.9, -r * 0.35, r * 1.7, r * 0.7)

  // Core module
  ctx.beginPath()
  ctx.arc(0, 0, r * 0.85, 0, Math.PI * 2)
  ctx.fillStyle = '#e8f4ff'
  ctx.fill()
  ctx.strokeStyle = selected ? 'rgba(255, 255, 255, 0.95)' : 'rgba(180, 220, 255, 0.9)'
  ctx.lineWidth = selected ? 1.6 : 1.1
  ctx.stroke()

  ctx.restore()
}

function drawIssTrail(
  ctx: CanvasRenderingContext2D,
  trail: { altitude: number; azimuth: number }[],
  width: number,
  height: number,
) {
  if (trail.length < 2) return
  const points = trail
    .map((p) => projectToCanvas(p.altitude, p.azimuth, width, height))
    .filter((p) => p.visible)
  if (points.length < 2) return

  ctx.save()
  ctx.lineCap = 'round'
  ctx.lineJoin = 'round'
  ctx.strokeStyle = 'rgba(159, 212, 255, 0.45)'
  ctx.lineWidth = 1.6
  ctx.setLineDash([3, 5])
  ctx.beginPath()
  ctx.moveTo(points[0].x, points[0].y)
  for (let i = 1; i < points.length; i++) {
    ctx.lineTo(points[i].x, points[i].y)
  }
  ctx.stroke()
  ctx.setLineDash([])
  ctx.restore()
}

function drawLabel(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  emphasis: boolean,
  fontSize = 11,
  color?: string,
) {
  ctx.save()
  ctx.font = `${emphasis ? '600' : '500'} ${fontSize}px Sora, sans-serif`
  ctx.textAlign = 'left'
  ctx.textBaseline = 'middle'
  ctx.lineWidth = emphasis ? 4 : 3
  ctx.strokeStyle = 'rgba(5, 9, 20, 0.78)'
  ctx.strokeText(text, x, y)
  ctx.fillStyle =
    color ?? (emphasis ? 'rgba(248, 250, 255, 0.97)' : 'rgba(230, 238, 250, 0.9)')
  ctx.fillText(text, x, y)
  ctx.restore()
}

function isCoarsePointer(): boolean {
  return typeof window !== 'undefined' && window.matchMedia('(pointer: coarse)').matches
}

type ProjectedStar = { x: number; y: number; visible: boolean }

function rgbaWithAlpha(color: string, alpha: number): string {
  const match = color.match(/rgba?\(([^)]+)\)/)
  if (!match) return color
  const [r, g, b] = match[1].split(',').map((v) => v.trim())
  return `rgba(${r}, ${g}, ${b}, ${alpha})`
}

function clamp(n: number, min: number, max: number) {
  return Math.min(max, Math.max(min, n))
}

function clampView(view: ViewTransform, width: number, height: number): ViewTransform {
  const scale = clamp(view.scale, MIN_SCALE, MAX_SCALE)
  if (scale <= 1.001) {
    return { scale: 1, panX: 0, panY: 0 }
  }
  const maxX = (width / 2) * (scale - 1) + 48
  const maxY = (height / 2) * (scale - 1) + 48
  return {
    scale,
    panX: clamp(view.panX, -maxX, maxX),
    panY: clamp(view.panY, -maxY, maxY),
  }
}

/** Map unzoomed sky coords → screen pixels. */
function worldToScreen(
  x: number,
  y: number,
  view: ViewTransform,
  width: number,
  height: number,
) {
  const cx = width / 2
  const cy = height / 2
  return {
    x: (x - cx) * view.scale + cx + view.panX,
    y: (y - cy) * view.scale + cy + view.panY,
  }
}

/** Map screen pixels → unzoomed sky coords. */
function screenToWorld(
  x: number,
  y: number,
  view: ViewTransform,
  width: number,
  height: number,
) {
  const cx = width / 2
  const cy = height / 2
  return {
    x: (x - cx - view.panX) / view.scale + cx,
    y: (y - cy - view.panY) / view.scale + cy,
  }
}

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
    const scale = Math.min(Math.max(maxDist * 1.15, 36), Math.min(width, height) * 0.22)

    ctx.save()
    ctx.lineCap = 'round'
    ctx.strokeStyle = rgbaWithAlpha(color, 0.14)
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

    // Light translucent characters so star names stay easy to read.
    ctx.save()
    ctx.translate(cx, cy)
    ctx.scale(scale * breathe, scale * breathe)
    ctx.globalAlpha = 0.4
    ctx.fillStyle = rgbaWithAlpha(color, 0.1)
    ctx.strokeStyle = rgbaWithAlpha(color, 0.42)
    ctx.lineWidth = 1.8 / scale
    ctx.lineCap = 'round'
    ctx.lineJoin = 'round'
    ctx.shadowColor = rgbaWithAlpha(color, 0.2)
    ctx.shadowBlur = 8 / scale
    ZODIAC_ART[sign](ctx)
    ctx.restore()

    ctx.save()
    ctx.font = '600 13px Fraunces, Georgia, serif'
    ctx.textAlign = 'center'
    ctx.textBaseline = 'top'
    ctx.lineWidth = 4
    ctx.strokeStyle = 'rgba(5, 9, 20, 0.55)'
    ctx.strokeText(sign, cx, cy + scale * 0.95)
    ctx.fillStyle = rgbaWithAlpha(color, 0.72)
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
  const whenRef = useRef(when)
  whenRef.current = when
  const selectedIdRef = useRef(selectedId)
  selectedIdRef.current = selectedId
  const emphasizeZodiacRef = useRef(emphasizeZodiac)
  emphasizeZodiacRef.current = emphasizeZodiac
  const viewRef = useRef<ViewTransform>({ scale: 1, panX: 0, panY: 0 })
  const [viewUi, setViewUi] = useState<ViewTransform>(viewRef.current)

  const syncView = (next: ViewTransform, width: number, height: number) => {
    const clamped = clampView(next, width, height)
    viewRef.current = clamped
    setViewUi(clamped)
    return clamped
  }

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
      const nextWidth = canvas.clientWidth
      const nextHeight = canvas.clientHeight
      // Avoid clearing/resizing the buffer when size hasn't changed (motion used to
      // remount this effect every frame and shrink/flicker the dome).
      if (nextWidth === width && nextHeight === height && canvas.width > 0) {
        syncView(viewRef.current, width, height)
        return
      }
      width = nextWidth
      height = nextHeight
      canvas.width = Math.floor(width * dpr)
      canvas.height = Math.floor(height * dpr)
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
      syncView(viewRef.current, width, height)
    }

    const draw = () => {
      frame += 1
      const view = viewRef.current
      const selectedIdNow = selectedIdRef.current
      const sun = objectsRef.current.find((o) => o.kind === 'sun')
      const tone = skyTone(whenRef.current, sun?.altitude ?? -90)

      // Full-bleed background (not zoomed)
      const bg = ctx.createLinearGradient(0, 0, 0, height)
      bg.addColorStop(0, tone.top)
      bg.addColorStop(0.55, tone.mid)
      bg.addColorStop(1, tone.bottom)
      ctx.fillStyle = bg
      ctx.fillRect(0, 0, width, height)

      const glow = ctx.createRadialGradient(
        width / 2 + view.panX,
        height * 0.92 + view.panY,
        0,
        width / 2 + view.panX,
        height * 0.92 + view.panY,
        Math.min(width, height) * 0.7 * view.scale,
      )
      glow.addColorStop(0, tone.glow)
      glow.addColorStop(1, 'rgba(0,0,0,0)')
      ctx.fillStyle = glow
      ctx.fillRect(0, 0, width, height)

      ctx.save()
      // Zoom around sky center, then pan
      const cx = width / 2
      const cy = height / 2
      ctx.translate(cx + view.panX, cy + view.panY)
      ctx.scale(view.scale, view.scale)
      ctx.translate(-cx, -cy)

      const domeR = skyDomeRadius(width, height)

      // Soft outer halo so the sky sphere edge reads on day and night tones.
      ctx.beginPath()
      ctx.arc(cx, cy, domeR + 1.5 / view.scale, 0, Math.PI * 2)
      ctx.strokeStyle = 'rgba(210, 225, 245, 0.1)'
      ctx.lineWidth = 5 / view.scale
      ctx.stroke()

      // Main horizon / dome border
      ctx.beginPath()
      ctx.arc(cx, cy, domeR, 0, Math.PI * 2)
      ctx.strokeStyle = 'rgba(210, 225, 245, 0.34)'
      ctx.lineWidth = 1.5 / view.scale
      ctx.stroke()

      // Inner tick ring — faint sphere cue without crowding labels
      ctx.beginPath()
      ctx.arc(cx, cy, domeR * 0.995, 0, Math.PI * 2)
      ctx.strokeStyle = 'rgba(180, 200, 230, 0.16)'
      ctx.lineWidth = 1 / view.scale
      ctx.stroke()

      ctx.fillStyle = 'rgba(210, 225, 245, 0.55)'
      ctx.font = '500 11px Sora, sans-serif'
      ctx.textAlign = 'center'
      ctx.fillText('N', cx, cy - domeR - 10)
      ctx.fillText('S', cx, cy + domeR + 18)
      ctx.textAlign = 'right'
      ctx.fillText('W', cx - domeR - 10, cy + 4)
      ctx.textAlign = 'left'
      ctx.fillText('E', cx + domeR + 10, cy + 4)

      const sorted = [...objectsRef.current].sort((a, b) => b.magnitude - a.magnitude)
      const labels: {
        text: string
        x: number
        y: number
        emphasis: boolean
        color?: string
      }[] = []

      if (emphasizeZodiacRef.current) {
        drawZodiacFigures(ctx, objectsRef.current, width, height, frame)
      }

      const coarse = isCoarsePointer()
      const labelSize = coarse ? 13 : 11
      const sizeBoost = coarse ? 1.25 : 1

      for (const obj of sorted) {
        if (obj.kind === 'iss' && obj.trail?.length) {
          drawIssTrail(ctx, obj.trail, width, height)
        }
      }

      for (const obj of sorted) {
        const { x, y, visible } = projectToCanvas(obj.altitude, obj.azimuth, width, height)
        if (!visible) continue

        const selected = obj.id === selectedIdNow
        const twinkle =
          obj.kind === 'star' ? 0.75 + 0.25 * Math.sin(frame * 0.04 + obj.azimuth) : 1

        let markerRadius = 3

        if (obj.kind === 'sun') {
          markerRadius = 18 * sizeBoost
          drawSun(ctx, x, y, markerRadius)
        } else if (obj.kind === 'moon') {
          markerRadius = 14 * sizeBoost
          drawMoon(ctx, x, y, markerRadius, obj.phase ?? 0.5)
        } else if (obj.kind === 'iss') {
          markerRadius = 7 * sizeBoost
          drawIss(ctx, x, y, selected, sizeBoost)
        } else if (obj.kind === 'planet') {
          markerRadius =
            (obj.magnitude < -1 ? 5.5 : obj.magnitude < 1 ? 4.2 : 3.2) * sizeBoost
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
          markerRadius = Math.max(0.9, (3.2 - obj.magnitude * 0.55) * sizeBoost)
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
          ctx.arc(x, y, coarse ? 18 : 14, 0, Math.PI * 2)
          ctx.strokeStyle = 'rgba(230, 240, 255, 0.55)'
          ctx.lineWidth = coarse ? 2 : 1
          ctx.stroke()
        }

        if (obj.name && shouldShowLabel(obj, selected, emphasizeZodiacRef.current)) {
          const emphasis =
            selected ||
            obj.kind === 'sun' ||
            obj.kind === 'moon' ||
            obj.kind === 'planet' ||
            obj.kind === 'iss' ||
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
            color: obj.kind === 'iss' ? 'rgba(92, 220, 140, 0.98)' : undefined,
          })
        }
      }

      for (const label of labels) {
        drawLabel(
          ctx,
          label.text,
          label.x,
          label.y,
          label.emphasis,
          labelSize,
          label.color,
        )
      }

      ctx.restore()

      raf = requestAnimationFrame(draw)
    }

    resize()
    draw()
    window.addEventListener('resize', resize)

    return () => {
      cancelAnimationFrame(raf)
      window.removeEventListener('resize', resize)
    }
    // Keep this effect mounted across motion time updates — only restart if the
    // canvas node is replaced. Live values are read from refs each frame.
  }, [])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    let dragging = false
    let moved = false
    let lastX = 0
    let lastY = 0
    let pinchStartDist = 0
    let pinchStartScale = 1

    const size = () => ({
      width: canvas.clientWidth,
      height: canvas.clientHeight,
    })

    const zoomAt = (screenX: number, screenY: number, factor: number) => {
      const { width, height } = size()
      const view = viewRef.current
      const before = screenToWorld(screenX, screenY, view, width, height)
      const nextScale = clamp(view.scale * factor, MIN_SCALE, MAX_SCALE)
      const tentative = { ...view, scale: nextScale }
      // Keep the pointed sky location under the cursor after zooming.
      const after = worldToScreen(before.x, before.y, tentative, width, height)
      syncView(
        {
          scale: nextScale,
          panX: view.panX + (screenX - after.x),
          panY: view.panY + (screenY - after.y),
        },
        width,
        height,
      )
    }

    const onWheel = (e: WheelEvent) => {
      e.preventDefault()
      const rect = canvas.getBoundingClientRect()
      const x = e.clientX - rect.left
      const y = e.clientY - rect.top
      const { width, height } = size()

      // Pinch-zoom / ctrl+wheel zooms toward the cursor.
      // Once zoomed, plain scrolling pans so off-screen sky stays reachable.
      // Shift+wheel maps vertical mouse wheels to side-to-side pan.
      const wantsZoom = e.ctrlKey || e.metaKey || viewRef.current.scale <= 1.001

      if (!wantsZoom) {
        const horizontal =
          e.shiftKey && Math.abs(e.deltaX) < Math.abs(e.deltaY)
            ? e.deltaY
            : e.deltaX
        const vertical = e.shiftKey && Math.abs(e.deltaX) < Math.abs(e.deltaY) ? 0 : e.deltaY
        syncView(
          {
            ...viewRef.current,
            panX: viewRef.current.panX - horizontal,
            panY: viewRef.current.panY - vertical,
          },
          width,
          height,
        )
        return
      }

      const factor = e.deltaY < 0 ? 1.12 : 1 / 1.12
      zoomAt(x, y, factor)
    }

    const onPointerDown = (e: PointerEvent) => {
      if (e.button !== 0) return
      dragging = true
      moved = false
      lastX = e.clientX
      lastY = e.clientY
      canvas.setPointerCapture(e.pointerId)
      canvas.classList.add('is-panning')
    }

    const onPointerMove = (e: PointerEvent) => {
      if (!dragging) return
      const dx = e.clientX - lastX
      const dy = e.clientY - lastY
      if (Math.hypot(dx, dy) > 3) moved = true
      lastX = e.clientX
      lastY = e.clientY

      if (viewRef.current.scale <= 1.001) return
      const { width, height } = size()
      syncView(
        {
          ...viewRef.current,
          panX: viewRef.current.panX + dx,
          panY: viewRef.current.panY + dy,
        },
        width,
        height,
      )
    }

    const pickObject = (clientX: number, clientY: number) => {
      const rect = canvas.getBoundingClientRect()
      const screenX = clientX - rect.left
      const screenY = clientY - rect.top
      const { width, height } = size()
      const world = screenToWorld(screenX, screenY, viewRef.current, width, height)
      const coarse = isCoarsePointer()
      const hitScale = 1 / viewRef.current.scale
      const touchBoost = coarse ? 1.7 : 1

      let best: SkyObject | null = null
      let bestDist = 22 * hitScale * touchBoost

      for (const obj of objectsRef.current) {
        const p = projectToCanvas(obj.altitude, obj.azimuth, width, height)
        if (!p.visible) continue
        const d = Math.hypot(p.x - world.x, p.y - world.y)
        const hit =
          (obj.kind === 'sun' || obj.kind === 'moon'
            ? 26
            : obj.kind === 'planet' || obj.kind === 'iss'
              ? 18
              : 14) *
          hitScale *
          touchBoost
        if (d < hit && d < bestDist) {
          bestDist = d
          best = obj
        }
      }
      onSelect(best)
    }

    const onPointerUp = (e: PointerEvent) => {
      if (!dragging) return
      dragging = false
      canvas.classList.remove('is-panning')
      try {
        canvas.releasePointerCapture(e.pointerId)
      } catch {
        // ignore
      }
      if (!moved) pickObject(e.clientX, e.clientY)
    }

    const touchDistance = (touches: TouchList) => {
      const a = touches[0]
      const b = touches[1]
      return Math.hypot(a.clientX - b.clientX, a.clientY - b.clientY)
    }

    const onTouchStart = (e: TouchEvent) => {
      if (e.touches.length === 2) {
        pinchStartDist = touchDistance(e.touches)
        pinchStartScale = viewRef.current.scale
      }
    }

    const onTouchMove = (e: TouchEvent) => {
      if (e.touches.length !== 2 || pinchStartDist <= 0) return
      e.preventDefault()
      const rect = canvas.getBoundingClientRect()
      const midX = (e.touches[0].clientX + e.touches[1].clientX) / 2 - rect.left
      const midY = (e.touches[0].clientY + e.touches[1].clientY) / 2 - rect.top
      const dist = touchDistance(e.touches)
      const nextScale = clamp(
        pinchStartScale * (dist / pinchStartDist),
        MIN_SCALE,
        MAX_SCALE,
      )
      const factor = nextScale / viewRef.current.scale
      if (Number.isFinite(factor) && factor > 0) zoomAt(midX, midY, factor)
    }

    canvas.addEventListener('wheel', onWheel, { passive: false })
    canvas.addEventListener('pointerdown', onPointerDown)
    canvas.addEventListener('pointermove', onPointerMove)
    canvas.addEventListener('pointerup', onPointerUp)
    canvas.addEventListener('pointercancel', onPointerUp)
    canvas.addEventListener('touchstart', onTouchStart, { passive: true })
    canvas.addEventListener('touchmove', onTouchMove, { passive: false })

    return () => {
      canvas.removeEventListener('wheel', onWheel)
      canvas.removeEventListener('pointerdown', onPointerDown)
      canvas.removeEventListener('pointermove', onPointerMove)
      canvas.removeEventListener('pointerup', onPointerUp)
      canvas.removeEventListener('pointercancel', onPointerUp)
      canvas.removeEventListener('touchstart', onTouchStart)
      canvas.removeEventListener('touchmove', onTouchMove)
    }
  }, [onSelect])

  const bumpZoom = (factor: number) => {
    const canvas = canvasRef.current
    if (!canvas) return
    const width = canvas.clientWidth
    const height = canvas.clientHeight
    zoomAtCenter(factor, width, height)
  }

  const zoomAtCenter = (factor: number, width: number, height: number) => {
    const view = viewRef.current
    const before = screenToWorld(width / 2, height / 2, view, width, height)
    const nextScale = clamp(view.scale * factor, MIN_SCALE, MAX_SCALE)
    const tentative = { ...view, scale: nextScale }
    const after = worldToScreen(before.x, before.y, tentative, width, height)
    syncView(
      {
        scale: nextScale,
        panX: view.panX + (width / 2 - after.x),
        panY: view.panY + (height / 2 - after.y),
      },
      width,
      height,
    )
  }

  const resetView = () => {
    const canvas = canvasRef.current
    if (!canvas) return
    syncView({ scale: 1, panX: 0, panY: 0 }, canvas.clientWidth, canvas.clientHeight)
  }

  const panBy = (dx: number, dy: number) => {
    const canvas = canvasRef.current
    if (!canvas) return
    if (viewRef.current.scale <= 1.001) return
    syncView(
      {
        ...viewRef.current,
        panX: viewRef.current.panX + dx,
        panY: viewRef.current.panY + dy,
      },
      canvas.clientWidth,
      canvas.clientHeight,
    )
  }

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (viewRef.current.scale <= 1.001) return
      const target = e.target as HTMLElement | null
      if (
        target &&
        (target.tagName === 'INPUT' ||
          target.tagName === 'SELECT' ||
          target.tagName === 'TEXTAREA' ||
          target.isContentEditable)
      ) {
        return
      }

      const step = e.shiftKey ? 140 : 80
      switch (e.key) {
        case 'ArrowLeft':
          e.preventDefault()
          panBy(step, 0)
          break
        case 'ArrowRight':
          e.preventDefault()
          panBy(-step, 0)
          break
        case 'ArrowUp':
          e.preventDefault()
          panBy(0, step)
          break
        case 'ArrowDown':
          e.preventDefault()
          panBy(0, -step)
          break
        default:
          break
      }
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [])

  const zoomPercent = Math.round(viewUi.scale * 100)
  const isZoomed = viewUi.scale > 1.01

  const panLimits = (() => {
    const canvas = canvasRef.current
    const width = canvas?.clientWidth ?? 1
    const height = canvas?.clientHeight ?? 1
    const maxX = isZoomed ? (width / 2) * (viewUi.scale - 1) + 48 : 0
    const maxY = isZoomed ? (height / 2) * (viewUi.scale - 1) + 48 : 0
    return {
      canLeft: viewUi.panX < maxX - 1,
      canRight: viewUi.panX > -maxX + 1,
      canUp: viewUi.panY < maxY - 1,
      canDown: viewUi.panY > -maxY + 1,
    }
  })()

  const panStep = () => {
    const canvas = canvasRef.current
    if (!canvas) return 96
    return Math.max(72, Math.round(canvas.clientWidth * 0.22))
  }

  const startEdgePan = (dx: number, dy: number) => {
    const stepOnce = () => {
      const amount = Math.max(14, panStep() * 0.22)
      panBy(dx * amount, dy * amount)
    }
    stepOnce()
    const timer = window.setInterval(stepOnce, 45)
    const stop = () => {
      window.clearInterval(timer)
      window.removeEventListener('pointerup', stop)
      window.removeEventListener('pointercancel', stop)
      window.removeEventListener('blur', stop)
    }
    window.addEventListener('pointerup', stop)
    window.addEventListener('pointercancel', stop)
    window.addEventListener('blur', stop)
  }

  return (
    <div className="sky-stage">
      <canvas
        ref={canvasRef}
        className={`sky-canvas${isZoomed ? ' is-zoomable' : ''}`}
        aria-label="Interactive sky map. Zoom in, then use side arrows, drag, or scroll to explore."
      />

      {isZoomed && (
        <div className="pan-controls" aria-label="Sky pan">
          <div className="pan-horizontal" role="group" aria-label="Side-to-side pan">
            <button
              type="button"
              className="pan-btn pan-left"
              aria-label="Pan left"
              title="Pan left (or Shift+scroll)"
              disabled={!panLimits.canLeft}
              onPointerDown={(e) => {
                if (e.button !== 0 || !panLimits.canLeft) return
                e.preventDefault()
                e.stopPropagation()
                startEdgePan(1, 0)
              }}
            >
              ‹
            </button>
            <button
              type="button"
              className="pan-btn pan-right"
              aria-label="Pan right"
              title="Pan right (or Shift+scroll)"
              disabled={!panLimits.canRight}
              onPointerDown={(e) => {
                if (e.button !== 0 || !panLimits.canRight) return
                e.preventDefault()
                e.stopPropagation()
                startEdgePan(-1, 0)
              }}
            >
              ›
            </button>
          </div>
          <button
            type="button"
            className="pan-btn pan-up"
            aria-label="Pan up"
            title="Pan up"
            disabled={!panLimits.canUp}
            onPointerDown={(e) => {
              if (e.button !== 0 || !panLimits.canUp) return
              e.preventDefault()
              e.stopPropagation()
              startEdgePan(0, 1)
            }}
          >
            ˄
          </button>
          <button
            type="button"
            className="pan-btn pan-down"
            aria-label="Pan down"
            title="Pan down"
            disabled={!panLimits.canDown}
            onPointerDown={(e) => {
              if (e.button !== 0 || !panLimits.canDown) return
              e.preventDefault()
              e.stopPropagation()
              startEdgePan(0, -1)
            }}
          >
            ˅
          </button>
        </div>
      )}

      <div className="zoom-controls" role="group" aria-label="Sky zoom">
        <button
          type="button"
          className="zoom-btn"
          aria-label="Zoom in"
          onClick={() => bumpZoom(1.2)}
          disabled={viewUi.scale >= MAX_SCALE - 0.01}
        >
          +
        </button>
        <button
          type="button"
          className="zoom-btn"
          aria-label="Zoom out"
          onClick={() => bumpZoom(1 / 1.2)}
          disabled={viewUi.scale <= MIN_SCALE + 0.01}
        >
          −
        </button>
        <button
          type="button"
          className="zoom-btn zoom-reset"
          aria-label="Reset zoom"
          onClick={resetView}
          disabled={viewUi.scale <= MIN_SCALE + 0.01}
        >
          {zoomPercent}%
        </button>
      </div>
    </div>
  )
}
