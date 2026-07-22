/** The 12 astrology / zodiac constellations. */
export const ZODIAC_SIGNS = [
  'Aries',
  'Taurus',
  'Gemini',
  'Cancer',
  'Leo',
  'Virgo',
  'Libra',
  'Scorpius',
  'Sagittarius',
  'Capricornus',
  'Aquarius',
  'Pisces',
] as const

export type ZodiacSign = (typeof ZODIAC_SIGNS)[number]

/**
 * Bright stars in this app that form the zodiac constellations.
 * Keys are catalog display names from `stars.ts`.
 */
export const ZODIAC_STAR_SIGNS: Record<string, ZodiacSign> = {
  // Aries
  Hamal: 'Aries',
  Sheratan: 'Aries',
  Mesarthim: 'Aries',

  // Taurus
  Aldebaran: 'Taurus',
  Alnath: 'Taurus',
  Elnath: 'Taurus',
  Alcyone: 'Taurus',

  // Gemini
  Castor: 'Gemini',
  Pollux: 'Gemini',
  Alhena: 'Gemini',
  Wasat: 'Gemini',
  Mebsuta: 'Gemini',

  // Cancer
  Acubens: 'Cancer',
  'Asellus Australis': 'Cancer',
  'Asellus Borealis': 'Cancer',
  Altarf: 'Cancer',

  // Leo
  Regulus: 'Leo',
  Algieba: 'Leo',
  Zosma: 'Leo',
  Chertan: 'Leo',
  'Al Jabhah': 'Leo',
  Denebola: 'Leo',

  // Virgo
  Spica: 'Virgo',
  Porrima: 'Virgo',
  Vindemiatrix: 'Virgo',

  // Libra
  Zubeneschamali: 'Libra',
  Zubenelgenubi: 'Libra',
  Zubenelhakrabi: 'Libra',

  // Scorpius
  Antares: 'Scorpius',
  Dschubba: 'Scorpius',
  Acrab: 'Scorpius',
  Sargas: 'Scorpius',
  Shaula: 'Scorpius',
  Lesath: 'Scorpius',

  // Sagittarius
  'Kaus Australis': 'Sagittarius',
  Nunki: 'Sagittarius',
  'Kaus Media': 'Sagittarius',
  'Kaus Borealis': 'Sagittarius',
  'Kaus Borealis B': 'Sagittarius',
  Ascella: 'Sagittarius',

  // Capricornus
  Dabih: 'Capricornus',
  'Deneb Algiedi': 'Capricornus',
  Nashira: 'Capricornus',

  // Aquarius
  Skat: 'Aquarius',
  Ancha: 'Aquarius',
  Sadalmelik: 'Aquarius',
  Sadalsuud: 'Aquarius',

  // Pisces
  Alrescha: 'Pisces',
  Alpherg: 'Pisces',
  Torcular: 'Pisces',
}

export function zodiacSignForStar(name: string | null | undefined): ZodiacSign | null {
  if (!name) return null
  return ZODIAC_STAR_SIGNS[name] ?? null
}

export function isZodiacStar(name: string | null | undefined): boolean {
  return zodiacSignForStar(name) != null
}
