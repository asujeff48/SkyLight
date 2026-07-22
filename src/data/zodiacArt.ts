import type { ZodiacSign } from './zodiac'

export type ZodiacArtDrawer = (ctx: CanvasRenderingContext2D) => void

/**
 * Filled zodiac animal/character silhouettes in a normalized box
 * roughly spanning x,y ∈ [-1, 1]. Callers translate/scale/rotate.
 */
export const ZODIAC_ART: Record<ZodiacSign, ZodiacArtDrawer> = {
  Aries: drawAries,
  Taurus: drawTaurus,
  Gemini: drawGemini,
  Cancer: drawCancer,
  Leo: drawLeo,
  Virgo: drawVirgo,
  Libra: drawLibra,
  Scorpius: drawScorpius,
  Sagittarius: drawSagittarius,
  Capricornus: drawCapricorn,
  Aquarius: drawAquarius,
  Pisces: drawPisces,
}

function paint(ctx: CanvasRenderingContext2D) {
  ctx.fill()
  ctx.stroke()
}

function roundRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number,
) {
  const rr = Math.min(r, w / 2, h / 2)
  ctx.beginPath()
  ctx.moveTo(x + rr, y)
  ctx.arcTo(x + w, y, x + w, y + h, rr)
  ctx.arcTo(x + w, y + h, x, y + h, rr)
  ctx.arcTo(x, y + h, x, y, rr)
  ctx.arcTo(x, y, x + w, y, rr)
  ctx.closePath()
}

/** Ram */
function drawAries(ctx: CanvasRenderingContext2D) {
  // Body
  ctx.beginPath()
  ctx.ellipse(0.1, 0.28, 0.58, 0.4, -0.12, 0, Math.PI * 2)
  paint(ctx)

  // Chest / neck
  ctx.beginPath()
  ctx.ellipse(0.45, 0.05, 0.28, 0.26, 0.35, 0, Math.PI * 2)
  paint(ctx)

  // Head
  ctx.beginPath()
  ctx.ellipse(0.68, -0.12, 0.26, 0.22, 0.25, 0, Math.PI * 2)
  paint(ctx)

  // Woolly hip
  ctx.beginPath()
  ctx.ellipse(-0.25, 0.2, 0.28, 0.3, 0.2, 0, Math.PI * 2)
  paint(ctx)

  // Horns (filled curls)
  ctx.beginPath()
  ctx.moveTo(0.55, -0.25)
  ctx.bezierCurveTo(0.35, -0.85, -0.25, -0.95, -0.65, -0.45)
  ctx.bezierCurveTo(-0.8, -0.15, -0.45, 0.05, -0.2, -0.2)
  ctx.bezierCurveTo(0.05, -0.45, 0.35, -0.35, 0.5, -0.15)
  ctx.closePath()
  paint(ctx)

  ctx.beginPath()
  ctx.moveTo(0.75, -0.28)
  ctx.bezierCurveTo(0.95, -0.75, 0.7, -1.1, 0.25, -1.0)
  ctx.bezierCurveTo(0.05, -0.95, 0.15, -0.55, 0.45, -0.4)
  ctx.bezierCurveTo(0.6, -0.35, 0.7, -0.25, 0.75, -0.15)
  ctx.closePath()
  paint(ctx)

  // Legs
  for (const [x0, x1] of [
    [-0.2, -0.28],
    [0.05, 0.0],
    [0.3, 0.28],
    [0.5, 0.55],
  ]) {
    ctx.beginPath()
    ctx.moveTo(x0, 0.55)
    ctx.lineTo(x0 - 0.06, 0.55)
    ctx.lineTo(x1 - 0.08, 0.98)
    ctx.lineTo(x1 + 0.06, 0.98)
    ctx.closePath()
    paint(ctx)
  }
}

/** Bull */
function drawTaurus(ctx: CanvasRenderingContext2D) {
  // Shoulders
  ctx.beginPath()
  ctx.ellipse(0, 0.35, 0.7, 0.42, 0, 0, Math.PI * 2)
  paint(ctx)

  // Head
  ctx.beginPath()
  ctx.moveTo(-0.45, 0.05)
  ctx.quadraticCurveTo(0, 0.55, 0.45, 0.05)
  ctx.quadraticCurveTo(0.65, -0.25, 0.4, -0.5)
  ctx.quadraticCurveTo(0, -0.7, -0.4, -0.5)
  ctx.quadraticCurveTo(-0.65, -0.25, -0.45, 0.05)
  ctx.closePath()
  paint(ctx)

  // Left horn
  ctx.beginPath()
  ctx.moveTo(-0.35, -0.4)
  ctx.bezierCurveTo(-0.55, -0.75, -0.9, -0.95, -1.05, -0.55)
  ctx.bezierCurveTo(-0.85, -0.45, -0.55, -0.25, -0.3, -0.15)
  ctx.closePath()
  paint(ctx)

  // Right horn
  ctx.beginPath()
  ctx.moveTo(0.35, -0.4)
  ctx.bezierCurveTo(0.55, -0.75, 0.9, -0.95, 1.05, -0.55)
  ctx.bezierCurveTo(0.85, -0.45, 0.55, -0.25, 0.3, -0.15)
  ctx.closePath()
  paint(ctx)

  // Snout
  ctx.beginPath()
  ctx.ellipse(0, 0.2, 0.22, 0.14, 0, 0, Math.PI * 2)
  paint(ctx)
}

/** Twins */
function drawGemini(ctx: CanvasRenderingContext2D) {
  for (const side of [-1, 1]) {
    ctx.save()
    ctx.translate(side * 0.38, 0)

    // Head
    ctx.beginPath()
    ctx.arc(0, -0.68, 0.2, 0, Math.PI * 2)
    paint(ctx)

    // Torso
    roundRect(ctx, -0.2, -0.45, 0.4, 0.55, 0.12)
    paint(ctx)

    // Arms
    ctx.beginPath()
    ctx.moveTo(-0.18, -0.3)
    ctx.quadraticCurveTo(-0.45, -0.2, -0.55, -0.55)
    ctx.lineTo(-0.42, -0.6)
    ctx.quadraticCurveTo(-0.35, -0.3, -0.1, -0.25)
    ctx.closePath()
    paint(ctx)

    ctx.beginPath()
    ctx.moveTo(0.18, -0.3)
    ctx.quadraticCurveTo(0.45, -0.2, 0.55, -0.55)
    ctx.lineTo(0.42, -0.6)
    ctx.quadraticCurveTo(0.35, -0.3, 0.1, -0.25)
    ctx.closePath()
    paint(ctx)

    // Legs
    ctx.beginPath()
    ctx.moveTo(-0.12, 0.1)
    ctx.lineTo(-0.22, 0.95)
    ctx.lineTo(-0.05, 0.95)
    ctx.lineTo(0.02, 0.1)
    ctx.closePath()
    paint(ctx)

    ctx.beginPath()
    ctx.moveTo(0.12, 0.1)
    ctx.lineTo(0.22, 0.95)
    ctx.lineTo(0.05, 0.95)
    ctx.lineTo(-0.02, 0.1)
    ctx.closePath()
    paint(ctx)

    ctx.restore()
  }

  // Joined hands
  ctx.beginPath()
  ctx.ellipse(0, -0.2, 0.18, 0.08, 0, 0, Math.PI * 2)
  paint(ctx)
}

/** Crab */
function drawCancer(ctx: CanvasRenderingContext2D) {
  // Shell
  ctx.beginPath()
  ctx.ellipse(0, 0.08, 0.5, 0.36, 0, 0, Math.PI * 2)
  paint(ctx)

  // Carapace ridge
  ctx.beginPath()
  ctx.ellipse(0, 0.0, 0.38, 0.18, 0, 0, Math.PI * 2)
  paint(ctx)

  // Eye stalks
  for (const side of [-1, 1]) {
    ctx.beginPath()
    ctx.moveTo(side * 0.12, -0.2)
    ctx.lineTo(side * 0.18, -0.45)
    ctx.lineWidth = (ctx.lineWidth || 0.05) * 1.2
    ctx.stroke()
    ctx.beginPath()
    ctx.arc(side * 0.2, -0.5, 0.09, 0, Math.PI * 2)
    paint(ctx)
  }

  // Big claws
  for (const side of [-1, 1]) {
    ctx.beginPath()
    ctx.moveTo(side * 0.4, 0.0)
    ctx.bezierCurveTo(side * 0.75, -0.35, side * 1.05, -0.15, side * 0.9, 0.15)
    ctx.bezierCurveTo(side * 0.75, 0.35, side * 0.5, 0.2, side * 0.4, 0.1)
    ctx.closePath()
    paint(ctx)

    // Claw opening
    ctx.beginPath()
    ctx.moveTo(side * 0.78, -0.05)
    ctx.lineTo(side * 1.0, -0.2)
    ctx.moveTo(side * 0.8, 0.1)
    ctx.lineTo(side * 1.02, 0.18)
    ctx.stroke()
  }

  // Walking legs
  for (const side of [-1, 1]) {
    for (let i = 0; i < 4; i++) {
      const y = -0.05 + i * 0.16
      ctx.beginPath()
      ctx.moveTo(side * 0.42, y)
      ctx.quadraticCurveTo(side * 0.78, y + 0.12, side * 0.95, y + 0.4)
      ctx.lineTo(side * 0.85, y + 0.45)
      ctx.quadraticCurveTo(side * 0.65, y + 0.15, side * 0.4, y + 0.08)
      ctx.closePath()
      paint(ctx)
    }
  }
}

/** Lion */
function drawLeo(ctx: CanvasRenderingContext2D) {
  // Mane disc
  ctx.beginPath()
  for (let i = 0; i < 16; i++) {
    const a = (i / 16) * Math.PI * 2
    const r = 0.52 + (i % 2 === 0 ? 0.18 : 0.05)
    const x = Math.cos(a) * r - 0.2
    const y = Math.sin(a) * r - 0.2
    if (i === 0) ctx.moveTo(x, y)
    else ctx.lineTo(x, y)
  }
  ctx.closePath()
  paint(ctx)

  // Face
  ctx.beginPath()
  ctx.arc(-0.2, -0.2, 0.34, 0, Math.PI * 2)
  paint(ctx)

  // Body
  ctx.beginPath()
  ctx.ellipse(0.4, 0.22, 0.62, 0.32, -0.08, 0, Math.PI * 2)
  paint(ctx)

  // Hindquarter
  ctx.beginPath()
  ctx.ellipse(0.75, 0.15, 0.28, 0.28, 0.2, 0, Math.PI * 2)
  paint(ctx)

  // Tail
  ctx.beginPath()
  ctx.moveTo(0.95, 0.1)
  ctx.bezierCurveTo(1.15, -0.2, 1.0, -0.65, 0.7, -0.55)
  ctx.bezierCurveTo(0.85, -0.35, 0.95, -0.05, 0.85, 0.15)
  ctx.closePath()
  paint(ctx)

  ctx.beginPath()
  ctx.arc(0.68, -0.58, 0.12, 0, Math.PI * 2)
  paint(ctx)

  // Legs
  for (const x of [0.05, 0.28, 0.52, 0.75]) {
    ctx.beginPath()
    ctx.moveTo(x, 0.4)
    ctx.lineTo(x - 0.1, 0.4)
    ctx.lineTo(x - 0.14, 0.95)
    ctx.lineTo(x + 0.04, 0.95)
    ctx.closePath()
    paint(ctx)
  }
}

/** Maiden */
function drawVirgo(ctx: CanvasRenderingContext2D) {
  // Head
  ctx.beginPath()
  ctx.arc(0, -0.72, 0.18, 0, Math.PI * 2)
  paint(ctx)

  // Hair
  ctx.beginPath()
  ctx.moveTo(-0.15, -0.7)
  ctx.bezierCurveTo(-0.45, -0.85, -0.4, -1.15, -0.05, -1.1)
  ctx.bezierCurveTo(-0.2, -0.95, -0.15, -0.8, -0.05, -0.75)
  ctx.closePath()
  paint(ctx)
  ctx.beginPath()
  ctx.moveTo(0.15, -0.7)
  ctx.bezierCurveTo(0.45, -0.85, 0.4, -1.15, 0.05, -1.1)
  ctx.bezierCurveTo(0.2, -0.95, 0.15, -0.8, 0.05, -0.75)
  ctx.closePath()
  paint(ctx)

  // Bodice
  roundRect(ctx, -0.18, -0.52, 0.36, 0.35, 0.1)
  paint(ctx)

  // Skirt
  ctx.beginPath()
  ctx.moveTo(-0.18, -0.2)
  ctx.lineTo(0.18, -0.2)
  ctx.lineTo(0.55, 0.95)
  ctx.lineTo(-0.55, 0.95)
  ctx.closePath()
  paint(ctx)

  // Arms
  ctx.beginPath()
  ctx.moveTo(-0.18, -0.4)
  ctx.quadraticCurveTo(-0.5, -0.2, -0.65, 0.05)
  ctx.lineTo(-0.5, 0.12)
  ctx.quadraticCurveTo(-0.35, -0.1, -0.1, -0.28)
  ctx.closePath()
  paint(ctx)

  ctx.beginPath()
  ctx.moveTo(0.18, -0.4)
  ctx.quadraticCurveTo(0.5, -0.25, 0.7, -0.55)
  ctx.lineTo(0.58, -0.65)
  ctx.quadraticCurveTo(0.4, -0.35, 0.12, -0.3)
  ctx.closePath()
  paint(ctx)

  // Wheat bundle
  ctx.beginPath()
  ctx.moveTo(0.65, -0.55)
  ctx.lineTo(0.85, -0.95)
  ctx.moveTo(0.7, -0.65)
  ctx.lineTo(0.95, -0.75)
  ctx.moveTo(0.72, -0.72)
  ctx.lineTo(0.92, -0.9)
  ctx.stroke()
}

/** Scales */
function drawLibra(ctx: CanvasRenderingContext2D) {
  // Base platform
  ctx.beginPath()
  ctx.moveTo(-0.45, 0.9)
  ctx.lineTo(0.45, 0.9)
  ctx.lineTo(0.35, 0.75)
  ctx.lineTo(-0.35, 0.75)
  ctx.closePath()
  paint(ctx)

  // Pillar
  roundRect(ctx, -0.08, -0.7, 0.16, 1.45, 0.06)
  paint(ctx)

  // Top ornament
  ctx.beginPath()
  ctx.arc(0, -0.78, 0.16, 0, Math.PI * 2)
  paint(ctx)

  // Beam
  roundRect(ctx, -0.95, -0.55, 1.9, 0.12, 0.05)
  paint(ctx)

  for (const side of [-1, 1]) {
    // Chains
    ctx.beginPath()
    ctx.moveTo(side * 0.75, -0.43)
    ctx.lineTo(side * 0.75, 0.05)
    ctx.stroke()

    // Pan
    ctx.beginPath()
    ctx.moveTo(side * 0.5, 0.05)
    ctx.lineTo(side * 1.0, 0.05)
    ctx.quadraticCurveTo(side * 0.75, 0.55, side * 0.5, 0.05)
    ctx.closePath()
    paint(ctx)
  }
}

/** Scorpion */
function drawScorpius(ctx: CanvasRenderingContext2D) {
  // Cephalothorax
  ctx.beginPath()
  ctx.ellipse(-0.55, 0.05, 0.32, 0.26, 0, 0, Math.PI * 2)
  paint(ctx)

  // Body segments
  const segs = [
    [-0.2, 0.08, 0.24],
    [0.1, 0.12, 0.22],
    [0.38, 0.18, 0.2],
  ] as const
  for (const [x, y, r] of segs) {
    ctx.beginPath()
    ctx.ellipse(x, y, r, r * 0.75, 0, 0, Math.PI * 2)
    paint(ctx)
  }

  // Pincers
  for (const side of [-1, 1]) {
    ctx.beginPath()
    ctx.moveTo(-0.7, side * 0.05)
    ctx.bezierCurveTo(-1.05, side * 0.35, -1.15, side * 0.75, -0.75, side * 0.8)
    ctx.bezierCurveTo(-0.55, side * 0.55, -0.5, side * 0.25, -0.55, side * 0.1)
    ctx.closePath()
    paint(ctx)
  }

  // Tail arc
  ctx.beginPath()
  ctx.moveTo(0.5, 0.2)
  ctx.bezierCurveTo(0.95, 0.45, 1.15, 0.05, 0.9, -0.4)
  ctx.bezierCurveTo(0.7, -0.75, 0.4, -0.7, 0.35, -0.4)
  ctx.bezierCurveTo(0.7, -0.35, 0.85, 0.05, 0.55, 0.25)
  ctx.closePath()
  paint(ctx)

  // Stinger
  ctx.beginPath()
  ctx.moveTo(0.35, -0.45)
  ctx.lineTo(0.1, -0.95)
  ctx.lineTo(0.55, -0.65)
  ctx.closePath()
  paint(ctx)

  // Legs
  for (let i = 0; i < 4; i++) {
    const x = -0.45 + i * 0.25
    ctx.beginPath()
    ctx.moveTo(x, 0.25)
    ctx.quadraticCurveTo(x + 0.1, 0.55, x - 0.05, 0.9)
    ctx.lineTo(x + 0.1, 0.92)
    ctx.quadraticCurveTo(x + 0.25, 0.55, x + 0.12, 0.22)
    ctx.closePath()
    paint(ctx)
  }
}

/** Archer centaur */
function drawSagittarius(ctx: CanvasRenderingContext2D) {
  // Horse body
  ctx.beginPath()
  ctx.ellipse(0.2, 0.3, 0.65, 0.32, 0, 0, Math.PI * 2)
  paint(ctx)

  // Horse neck / chest
  ctx.beginPath()
  ctx.ellipse(-0.25, 0.1, 0.28, 0.28, 0.4, 0, Math.PI * 2)
  paint(ctx)

  // Legs
  for (const x of [-0.15, 0.1, 0.4, 0.65]) {
    ctx.beginPath()
    ctx.moveTo(x, 0.5)
    ctx.lineTo(x - 0.1, 0.5)
    ctx.lineTo(x - 0.12, 0.98)
    ctx.lineTo(x + 0.05, 0.98)
    ctx.closePath()
    paint(ctx)
  }

  // Human torso
  roundRect(ctx, -0.35, -0.45, 0.32, 0.55, 0.1)
  paint(ctx)

  // Head
  ctx.beginPath()
  ctx.arc(-0.2, -0.62, 0.16, 0, Math.PI * 2)
  paint(ctx)

  // Bow
  ctx.beginPath()
  ctx.arc(-0.7, -0.2, 0.5, -1.2, 1.2)
  ctx.stroke()
  ctx.beginPath()
  ctx.moveTo(-0.55, -0.65)
  ctx.lineTo(-0.55, 0.25)
  ctx.stroke()

  // Arrow
  ctx.beginPath()
  ctx.moveTo(-1.05, -0.2)
  ctx.lineTo(-0.15, -0.2)
  ctx.moveTo(-1.05, -0.2)
  ctx.lineTo(-0.9, -0.32)
  ctx.moveTo(-1.05, -0.2)
  ctx.lineTo(-0.9, -0.08)
  ctx.stroke()
}

/** Sea-goat */
function drawCapricorn(ctx: CanvasRenderingContext2D) {
  // Goat body
  ctx.beginPath()
  ctx.ellipse(-0.2, 0.05, 0.48, 0.36, -0.15, 0, Math.PI * 2)
  paint(ctx)

  // Head
  ctx.beginPath()
  ctx.ellipse(-0.65, -0.25, 0.26, 0.2, -0.35, 0, Math.PI * 2)
  paint(ctx)

  // Ear
  ctx.beginPath()
  ctx.moveTo(-0.7, -0.4)
  ctx.lineTo(-0.85, -0.65)
  ctx.lineTo(-0.55, -0.45)
  ctx.closePath()
  paint(ctx)

  // Horn
  ctx.beginPath()
  ctx.moveTo(-0.7, -0.4)
  ctx.bezierCurveTo(-0.8, -0.85, -0.4, -1.05, -0.15, -0.7)
  ctx.bezierCurveTo(-0.35, -0.75, -0.55, -0.55, -0.55, -0.35)
  ctx.closePath()
  paint(ctx)

  // Front legs
  ctx.beginPath()
  ctx.moveTo(-0.4, 0.3)
  ctx.lineTo(-0.55, 0.85)
  ctx.lineTo(-0.4, 0.85)
  ctx.lineTo(-0.28, 0.3)
  ctx.closePath()
  paint(ctx)
  ctx.beginPath()
  ctx.moveTo(-0.1, 0.3)
  ctx.lineTo(-0.05, 0.85)
  ctx.lineTo(0.1, 0.85)
  ctx.lineTo(0.05, 0.3)
  ctx.closePath()
  paint(ctx)

  // Fish tail
  ctx.beginPath()
  ctx.moveTo(0.15, 0.0)
  ctx.bezierCurveTo(0.65, -0.25, 1.05, 0.15, 0.7, 0.5)
  ctx.bezierCurveTo(1.1, 0.55, 1.15, 1.0, 0.65, 0.95)
  ctx.bezierCurveTo(0.35, 0.55, 0.2, 0.3, 0.1, 0.15)
  ctx.closePath()
  paint(ctx)
}

/** Water bearer */
function drawAquarius(ctx: CanvasRenderingContext2D) {
  // Head
  ctx.beginPath()
  ctx.arc(0, -0.72, 0.18, 0, Math.PI * 2)
  paint(ctx)

  // Torso
  roundRect(ctx, -0.22, -0.52, 0.44, 0.55, 0.12)
  paint(ctx)

  // Legs / draped lower body
  ctx.beginPath()
  ctx.moveTo(-0.2, 0.0)
  ctx.lineTo(0.2, 0.0)
  ctx.lineTo(0.3, 0.95)
  ctx.lineTo(-0.3, 0.95)
  ctx.closePath()
  paint(ctx)

  // Arms
  ctx.beginPath()
  ctx.moveTo(-0.22, -0.35)
  ctx.quadraticCurveTo(-0.55, -0.1, -0.45, 0.25)
  ctx.lineTo(-0.3, 0.2)
  ctx.quadraticCurveTo(-0.35, -0.05, -0.1, -0.25)
  ctx.closePath()
  paint(ctx)
  ctx.beginPath()
  ctx.moveTo(0.22, -0.35)
  ctx.quadraticCurveTo(0.55, -0.1, 0.45, 0.25)
  ctx.lineTo(0.3, 0.2)
  ctx.quadraticCurveTo(0.35, -0.05, 0.1, -0.25)
  ctx.closePath()
  paint(ctx)

  // Urn
  ctx.beginPath()
  ctx.moveTo(-0.4, 0.15)
  ctx.lineTo(0.4, 0.15)
  ctx.lineTo(0.3, 0.55)
  ctx.quadraticCurveTo(0, 0.8, -0.3, 0.55)
  ctx.closePath()
  paint(ctx)

  // Water streams
  ctx.beginPath()
  ctx.moveTo(-0.1, 0.65)
  ctx.bezierCurveTo(-0.35, 0.85, -0.55, 0.8, -0.75, 1.05)
  ctx.moveTo(0.1, 0.7)
  ctx.bezierCurveTo(-0.05, 0.95, -0.25, 0.9, -0.4, 1.1)
  ctx.moveTo(0.25, 0.65)
  ctx.bezierCurveTo(0.15, 0.9, 0.0, 0.95, -0.1, 1.15)
  ctx.stroke()
}

/** Two fish */
function drawPisces(ctx: CanvasRenderingContext2D) {
  for (const [dx, dy, rot, flip] of [
    [-0.2, -0.3, -0.5, 1],
    [0.25, 0.35, 2.5, -1],
  ] as const) {
    ctx.save()
    ctx.translate(dx, dy)
    ctx.rotate(rot)
    ctx.scale(flip, 1)

    // Body
    ctx.beginPath()
    ctx.moveTo(-0.65, 0)
    ctx.quadraticCurveTo(-0.1, -0.4, 0.45, 0)
    ctx.quadraticCurveTo(-0.1, 0.4, -0.65, 0)
    ctx.closePath()
    paint(ctx)

    // Tail
    ctx.beginPath()
    ctx.moveTo(0.35, 0)
    ctx.lineTo(0.8, -0.32)
    ctx.lineTo(0.55, 0)
    ctx.lineTo(0.8, 0.32)
    ctx.closePath()
    paint(ctx)

    // Eye
    ctx.beginPath()
    ctx.arc(-0.35, -0.06, 0.06, 0, Math.PI * 2)
    ctx.fill()

    // Fin
    ctx.beginPath()
    ctx.moveTo(-0.05, -0.15)
    ctx.lineTo(0.05, -0.45)
    ctx.lineTo(0.2, -0.1)
    ctx.closePath()
    paint(ctx)

    ctx.restore()
  }

  // Cord
  ctx.beginPath()
  ctx.moveTo(-0.4, -0.1)
  ctx.quadraticCurveTo(0.05, 0.1, 0.35, 0.25)
  ctx.stroke()
}
