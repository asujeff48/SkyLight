import type { ZodiacSign } from './zodiac'

export type ZodiacArtDrawer = (ctx: CanvasRenderingContext2D) => void

/**
 * Stylized zodiac animals/characters drawn in a normalized box
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

function strokeFill(ctx: CanvasRenderingContext2D) {
  ctx.fill()
  ctx.stroke()
}

/** Ram with curling horns */
function drawAries(ctx: CanvasRenderingContext2D) {
  // Body
  ctx.beginPath()
  ctx.ellipse(0.05, 0.25, 0.55, 0.38, -0.15, 0, Math.PI * 2)
  strokeFill(ctx)

  // Head
  ctx.beginPath()
  ctx.ellipse(0.55, -0.05, 0.28, 0.24, 0.2, 0, Math.PI * 2)
  strokeFill(ctx)

  // Left horn curl
  ctx.beginPath()
  ctx.moveTo(0.4, -0.2)
  ctx.bezierCurveTo(0.15, -0.75, -0.35, -0.85, -0.55, -0.35)
  ctx.bezierCurveTo(-0.65, -0.1, -0.35, -0.05, -0.15, -0.25)
  ctx.stroke()

  // Right horn curl
  ctx.beginPath()
  ctx.moveTo(0.65, -0.25)
  ctx.bezierCurveTo(0.85, -0.7, 0.55, -1.05, 0.15, -0.95)
  ctx.bezierCurveTo(-0.05, -0.9, 0.05, -0.55, 0.35, -0.4)
  ctx.stroke()

  // Legs
  for (const x of [-0.25, 0.05, 0.25, 0.45]) {
    ctx.beginPath()
    ctx.moveTo(x, 0.5)
    ctx.lineTo(x - 0.05, 0.95)
    ctx.stroke()
  }
}

/** Bull head and shoulders */
function drawTaurus(ctx: CanvasRenderingContext2D) {
  // Head
  ctx.beginPath()
  ctx.moveTo(-0.35, 0.15)
  ctx.quadraticCurveTo(0, 0.55, 0.35, 0.15)
  ctx.quadraticCurveTo(0.55, -0.15, 0.35, -0.4)
  ctx.quadraticCurveTo(0, -0.55, -0.35, -0.4)
  ctx.quadraticCurveTo(-0.55, -0.15, -0.35, 0.15)
  ctx.closePath()
  strokeFill(ctx)

  // Left horn
  ctx.beginPath()
  ctx.moveTo(-0.3, -0.35)
  ctx.bezierCurveTo(-0.55, -0.7, -0.85, -0.85, -0.95, -0.55)
  ctx.bezierCurveTo(-0.7, -0.55, -0.45, -0.35, -0.3, -0.2)
  ctx.closePath()
  strokeFill(ctx)

  // Right horn
  ctx.beginPath()
  ctx.moveTo(0.3, -0.35)
  ctx.bezierCurveTo(0.55, -0.7, 0.85, -0.85, 0.95, -0.55)
  ctx.bezierCurveTo(0.7, -0.55, 0.45, -0.35, 0.3, -0.2)
  ctx.closePath()
  strokeFill(ctx)

  // Nostrils / snout detail
  ctx.beginPath()
  ctx.ellipse(-0.1, 0.2, 0.04, 0.03, 0, 0, Math.PI * 2)
  ctx.ellipse(0.1, 0.2, 0.04, 0.03, 0, 0, Math.PI * 2)
  ctx.fill()
}

/** Twin figures */
function drawGemini(ctx: CanvasRenderingContext2D) {
  for (const side of [-1, 1]) {
    ctx.save()
    ctx.translate(side * 0.35, 0)

    // Head
    ctx.beginPath()
    ctx.arc(0, -0.65, 0.18, 0, Math.PI * 2)
    strokeFill(ctx)

    // Torso
    ctx.beginPath()
    ctx.moveTo(-0.2, -0.4)
    ctx.lineTo(0.2, -0.4)
    ctx.lineTo(0.16, 0.25)
    ctx.lineTo(-0.16, 0.25)
    ctx.closePath()
    strokeFill(ctx)

    // Arms raised outward
    ctx.beginPath()
    ctx.moveTo(-0.18, -0.3)
    ctx.lineTo(-0.45, -0.55)
    ctx.moveTo(0.18, -0.3)
    ctx.lineTo(0.45, -0.55)
    ctx.stroke()

    // Legs
    ctx.beginPath()
    ctx.moveTo(-0.1, 0.25)
    ctx.lineTo(-0.18, 0.9)
    ctx.moveTo(0.1, 0.25)
    ctx.lineTo(0.18, 0.9)
    ctx.stroke()

    ctx.restore()
  }

  // Linking bar between twins
  ctx.beginPath()
  ctx.moveTo(-0.2, -0.15)
  ctx.lineTo(0.2, -0.15)
  ctx.stroke()
}

/** Crab */
function drawCancer(ctx: CanvasRenderingContext2D) {
  // Shell
  ctx.beginPath()
  ctx.ellipse(0, 0.05, 0.45, 0.32, 0, 0, Math.PI * 2)
  strokeFill(ctx)

  // Eyes
  ctx.beginPath()
  ctx.arc(-0.12, -0.15, 0.06, 0, Math.PI * 2)
  ctx.arc(0.12, -0.15, 0.06, 0, Math.PI * 2)
  strokeFill(ctx)

  // Claws
  for (const side of [-1, 1]) {
    ctx.beginPath()
    ctx.moveTo(side * 0.35, -0.05)
    ctx.quadraticCurveTo(side * 0.75, -0.35, side * 0.85, -0.05)
    ctx.quadraticCurveTo(side * 0.7, 0.15, side * 0.4, 0.05)
    ctx.closePath()
    strokeFill(ctx)

    // Claw tip notch
    ctx.beginPath()
    ctx.moveTo(side * 0.78, -0.12)
    ctx.lineTo(side * 0.92, -0.22)
    ctx.moveTo(side * 0.78, 0)
    ctx.lineTo(side * 0.92, 0.1)
    ctx.stroke()
  }

  // Legs
  for (const side of [-1, 1]) {
    for (let i = 0; i < 3; i++) {
      const y = 0.05 + i * 0.18
      ctx.beginPath()
      ctx.moveTo(side * 0.35, y)
      ctx.quadraticCurveTo(side * 0.7, y + 0.1, side * 0.85, y + 0.35)
      ctx.stroke()
    }
  }
}

/** Lion */
function drawLeo(ctx: CanvasRenderingContext2D) {
  // Mane
  ctx.beginPath()
  for (let i = 0; i < 12; i++) {
    const a = (i / 12) * Math.PI * 2 - Math.PI / 2
    const r = 0.55 + (i % 2) * 0.12
    const x = Math.cos(a) * r - 0.15
    const y = Math.sin(a) * r - 0.15
    if (i === 0) ctx.moveTo(x, y)
    else ctx.lineTo(x, y)
  }
  ctx.closePath()
  strokeFill(ctx)

  // Face
  ctx.beginPath()
  ctx.arc(-0.15, -0.15, 0.32, 0, Math.PI * 2)
  strokeFill(ctx)

  // Body
  ctx.beginPath()
  ctx.ellipse(0.35, 0.2, 0.55, 0.28, -0.1, 0, Math.PI * 2)
  strokeFill(ctx)

  // Tail curve
  ctx.beginPath()
  ctx.moveTo(0.85, 0.15)
  ctx.bezierCurveTo(1.05, -0.15, 0.95, -0.55, 0.7, -0.45)
  ctx.stroke()

  // Tail tuft
  ctx.beginPath()
  ctx.arc(0.68, -0.48, 0.08, 0, Math.PI * 2)
  strokeFill(ctx)

  // Legs
  for (const x of [0.05, 0.25, 0.45, 0.65]) {
    ctx.beginPath()
    ctx.moveTo(x, 0.4)
    ctx.lineTo(x - 0.04, 0.9)
    ctx.stroke()
  }
}

/** Maiden */
function drawVirgo(ctx: CanvasRenderingContext2D) {
  // Head
  ctx.beginPath()
  ctx.arc(0, -0.7, 0.16, 0, Math.PI * 2)
  strokeFill(ctx)

  // Hair / wheat sheaf suggestion
  ctx.beginPath()
  ctx.moveTo(-0.12, -0.75)
  ctx.quadraticCurveTo(-0.35, -0.95, -0.2, -1.05)
  ctx.moveTo(0.12, -0.75)
  ctx.quadraticCurveTo(0.35, -0.95, 0.2, -1.05)
  ctx.moveTo(0, -0.8)
  ctx.quadraticCurveTo(0, -1.1, 0.05, -1.15)
  ctx.stroke()

  // Dress / torso triangle
  ctx.beginPath()
  ctx.moveTo(-0.15, -0.5)
  ctx.lineTo(0.15, -0.5)
  ctx.lineTo(0.45, 0.95)
  ctx.lineTo(-0.45, 0.95)
  ctx.closePath()
  strokeFill(ctx)

  // Arms
  ctx.beginPath()
  ctx.moveTo(-0.15, -0.35)
  ctx.lineTo(-0.55, -0.05)
  ctx.moveTo(0.15, -0.35)
  ctx.lineTo(0.55, -0.05)
  ctx.stroke()

  // Wheat stalk in hand
  ctx.beginPath()
  ctx.moveTo(0.55, -0.05)
  ctx.lineTo(0.75, -0.45)
  ctx.moveTo(0.65, -0.25)
  ctx.lineTo(0.85, -0.3)
  ctx.moveTo(0.68, -0.35)
  ctx.lineTo(0.82, -0.45)
  ctx.stroke()
}

/** Scales */
function drawLibra(ctx: CanvasRenderingContext2D) {
  // Central pillar
  ctx.beginPath()
  ctx.moveTo(0, -0.85)
  ctx.lineTo(0, 0.85)
  ctx.stroke()

  // Base
  ctx.beginPath()
  ctx.moveTo(-0.35, 0.85)
  ctx.lineTo(0.35, 0.85)
  ctx.stroke()

  // Beam
  ctx.beginPath()
  ctx.moveTo(-0.85, -0.45)
  ctx.lineTo(0.85, -0.45)
  ctx.stroke()

  // Decorative top
  ctx.beginPath()
  ctx.arc(0, -0.85, 0.12, 0, Math.PI * 2)
  strokeFill(ctx)

  // Left pan
  ctx.beginPath()
  ctx.moveTo(-0.85, -0.45)
  ctx.lineTo(-0.85, -0.05)
  ctx.moveTo(-1.1, -0.05)
  ctx.quadraticCurveTo(-0.85, 0.35, -0.6, -0.05)
  ctx.closePath()
  strokeFill(ctx)

  // Right pan
  ctx.beginPath()
  ctx.moveTo(0.85, -0.45)
  ctx.lineTo(0.85, -0.05)
  ctx.moveTo(0.6, -0.05)
  ctx.quadraticCurveTo(0.85, 0.35, 1.1, -0.05)
  ctx.closePath()
  strokeFill(ctx)
}

/** Scorpion */
function drawScorpius(ctx: CanvasRenderingContext2D) {
  // Body segments
  const body = [
    [-0.55, 0.1],
    [-0.25, 0.05],
    [0.05, 0.08],
    [0.35, 0.15],
  ] as const
  for (const [x, y] of body) {
    ctx.beginPath()
    ctx.ellipse(x, y, 0.18, 0.14, 0, 0, Math.PI * 2)
    strokeFill(ctx)
  }

  // Pincers
  for (const side of [-1, 1]) {
    ctx.beginPath()
    ctx.moveTo(-0.65, 0.05)
    ctx.quadraticCurveTo(-0.95, side * 0.45, -0.7, side * 0.65)
    ctx.quadraticCurveTo(-0.55, side * 0.45, -0.6, side * 0.2)
    ctx.stroke()
  }

  // Curved tail with stinger
  ctx.beginPath()
  ctx.moveTo(0.45, 0.15)
  ctx.bezierCurveTo(0.85, 0.35, 1.05, -0.05, 0.75, -0.45)
  ctx.bezierCurveTo(0.55, -0.7, 0.35, -0.55, 0.45, -0.35)
  ctx.stroke()

  // Stinger
  ctx.beginPath()
  ctx.moveTo(0.45, -0.35)
  ctx.lineTo(0.25, -0.75)
  ctx.lineTo(0.55, -0.5)
  ctx.closePath()
  strokeFill(ctx)

  // Legs
  for (let i = 0; i < 4; i++) {
    const x = -0.45 + i * 0.22
    ctx.beginPath()
    ctx.moveTo(x, 0.2)
    ctx.quadraticCurveTo(x + 0.05, 0.55, x - 0.05, 0.85)
    ctx.stroke()
  }
}

/** Archer / centaur with bow */
function drawSagittarius(ctx: CanvasRenderingContext2D) {
  // Horse body
  ctx.beginPath()
  ctx.ellipse(0.15, 0.25, 0.55, 0.28, 0, 0, Math.PI * 2)
  strokeFill(ctx)

  // Horse rear / legs
  for (const x of [-0.2, 0.05, 0.35, 0.55]) {
    ctx.beginPath()
    ctx.moveTo(x, 0.45)
    ctx.lineTo(x - 0.05, 0.95)
    ctx.stroke()
  }

  // Human torso
  ctx.beginPath()
  ctx.moveTo(-0.15, 0.05)
  ctx.lineTo(0.05, 0.05)
  ctx.lineTo(0.0, -0.45)
  ctx.lineTo(-0.25, -0.45)
  ctx.closePath()
  strokeFill(ctx)

  // Head
  ctx.beginPath()
  ctx.arc(-0.12, -0.6, 0.14, 0, Math.PI * 2)
  strokeFill(ctx)

  // Bow
  ctx.beginPath()
  ctx.arc(-0.65, -0.25, 0.45, -1.1, 1.1)
  ctx.stroke()

  // Bowstring
  ctx.beginPath()
  ctx.moveTo(-0.55, -0.65)
  ctx.lineTo(-0.55, 0.15)
  ctx.stroke()

  // Arrow
  ctx.beginPath()
  ctx.moveTo(-0.95, -0.25)
  ctx.lineTo(-0.15, -0.25)
  ctx.moveTo(-0.95, -0.25)
  ctx.lineTo(-0.82, -0.35)
  ctx.moveTo(-0.95, -0.25)
  ctx.lineTo(-0.82, -0.15)
  ctx.stroke()
}

/** Sea-goat */
function drawCapricorn(ctx: CanvasRenderingContext2D) {
  // Goat forequarters
  ctx.beginPath()
  ctx.ellipse(-0.25, 0.0, 0.4, 0.32, -0.2, 0, Math.PI * 2)
  strokeFill(ctx)

  // Head
  ctx.beginPath()
  ctx.ellipse(-0.65, -0.25, 0.22, 0.18, -0.3, 0, Math.PI * 2)
  strokeFill(ctx)

  // Horn
  ctx.beginPath()
  ctx.moveTo(-0.7, -0.4)
  ctx.bezierCurveTo(-0.75, -0.75, -0.45, -0.95, -0.25, -0.7)
  ctx.stroke()

  // Front legs
  ctx.beginPath()
  ctx.moveTo(-0.4, 0.25)
  ctx.lineTo(-0.5, 0.75)
  ctx.moveTo(-0.15, 0.25)
  ctx.lineTo(-0.1, 0.75)
  ctx.stroke()

  // Fish tail
  ctx.beginPath()
  ctx.moveTo(0.1, 0.05)
  ctx.bezierCurveTo(0.55, -0.15, 0.85, 0.25, 0.55, 0.55)
  ctx.bezierCurveTo(0.95, 0.45, 1.05, 0.85, 0.65, 0.9)
  ctx.bezierCurveTo(0.35, 0.55, 0.15, 0.35, 0.05, 0.2)
  ctx.closePath()
  strokeFill(ctx)
}

/** Water bearer */
function drawAquarius(ctx: CanvasRenderingContext2D) {
  // Head
  ctx.beginPath()
  ctx.arc(0, -0.7, 0.16, 0, Math.PI * 2)
  strokeFill(ctx)

  // Torso
  ctx.beginPath()
  ctx.moveTo(-0.2, -0.5)
  ctx.lineTo(0.2, -0.5)
  ctx.lineTo(0.15, 0.15)
  ctx.lineTo(-0.15, 0.15)
  ctx.closePath()
  strokeFill(ctx)

  // Legs
  ctx.beginPath()
  ctx.moveTo(-0.08, 0.15)
  ctx.lineTo(-0.15, 0.85)
  ctx.moveTo(0.08, 0.15)
  ctx.lineTo(0.15, 0.85)
  ctx.stroke()

  // Arms holding urn
  ctx.beginPath()
  ctx.moveTo(-0.2, -0.35)
  ctx.lineTo(-0.55, 0.05)
  ctx.moveTo(0.2, -0.35)
  ctx.lineTo(0.55, 0.05)
  ctx.stroke()

  // Urn
  ctx.beginPath()
  ctx.moveTo(-0.35, 0.0)
  ctx.lineTo(0.35, 0.0)
  ctx.lineTo(0.25, 0.45)
  ctx.quadraticCurveTo(0, 0.65, -0.25, 0.45)
  ctx.closePath()
  strokeFill(ctx)

  // Water waves
  ctx.beginPath()
  ctx.moveTo(-0.15, 0.55)
  ctx.bezierCurveTo(-0.35, 0.75, -0.55, 0.7, -0.7, 0.9)
  ctx.moveTo(0.05, 0.6)
  ctx.bezierCurveTo(-0.1, 0.85, -0.3, 0.8, -0.45, 1.0)
  ctx.moveTo(0.25, 0.55)
  ctx.bezierCurveTo(0.1, 0.8, -0.05, 0.85, -0.15, 1.05)
  ctx.stroke()
}

/** Two fish */
function drawPisces(ctx: CanvasRenderingContext2D) {
  for (const [dx, dy, rot, flip] of [
    [-0.25, -0.25, -0.4, 1],
    [0.25, 0.3, 2.6, -1],
  ] as const) {
    ctx.save()
    ctx.translate(dx, dy)
    ctx.rotate(rot)
    ctx.scale(flip, 1)

    // Body
    ctx.beginPath()
    ctx.moveTo(-0.55, 0)
    ctx.quadraticCurveTo(-0.1, -0.35, 0.4, 0)
    ctx.quadraticCurveTo(-0.1, 0.35, -0.55, 0)
    ctx.closePath()
    strokeFill(ctx)

    // Tail
    ctx.beginPath()
    ctx.moveTo(0.35, 0)
    ctx.lineTo(0.7, -0.25)
    ctx.lineTo(0.55, 0)
    ctx.lineTo(0.7, 0.25)
    ctx.closePath()
    strokeFill(ctx)

    // Eye
    ctx.beginPath()
    ctx.arc(-0.3, -0.05, 0.05, 0, Math.PI * 2)
    ctx.fill()

    ctx.restore()
  }

  // Cord linking the fish
  ctx.beginPath()
  ctx.moveTo(-0.35, -0.05)
  ctx.quadraticCurveTo(0, 0.05, 0.3, 0.2)
  ctx.stroke()
}
