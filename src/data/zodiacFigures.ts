import type { ZodiacSign } from './zodiac'

/** Line segments (by star name) that sketch each zodiac constellation. */
export const ZODIAC_FIGURE_LINES: Record<ZodiacSign, [string, string][]> = {
  Aries: [
    ['Mesarthim', 'Sheratan'],
    ['Sheratan', 'Hamal'],
  ],
  Taurus: [
    ['Alnath', 'Aldebaran'],
    ['Aldebaran', 'Alcyone'],
  ],
  Gemini: [
    ['Castor', 'Pollux'],
    ['Castor', 'Mebsuta'],
    ['Mebsuta', 'Alhena'],
    ['Pollux', 'Wasat'],
    ['Wasat', 'Alhena'],
  ],
  Cancer: [
    ['Asellus Borealis', 'Asellus Australis'],
    ['Asellus Australis', 'Acubens'],
    ['Asellus Borealis', 'Acubens'],
  ],
  Leo: [
    // Sickle / head
    ['Regulus', 'Al Jabhah'],
    ['Al Jabhah', 'Algieba'],
    // Body / haunches
    ['Regulus', 'Chertan'],
    ['Chertan', 'Zosma'],
    ['Zosma', 'Denebola'],
  ],
  Virgo: [
    ['Vindemiatrix', 'Porrima'],
    ['Porrima', 'Spica'],
  ],
  Libra: [
    ['Zubenelgenubi', 'Zubeneschamali'],
    ['Zubeneschamali', 'Zubenelhakrabi'],
    ['Zubenelgenubi', 'Zubenelhakrabi'],
  ],
  Scorpius: [
    ['Acrab', 'Dschubba'],
    ['Dschubba', 'Antares'],
    ['Antares', 'Sargas'],
    ['Sargas', 'Shaula'],
    ['Shaula', 'Lesath'],
  ],
  Sagittarius: [
    // Teapot outline
    ['Kaus Borealis', 'Kaus Media'],
    ['Kaus Media', 'Kaus Australis'],
    ['Kaus Australis', 'Ascella'],
    ['Ascella', 'Nunki'],
    ['Nunki', 'Kaus Borealis'],
    ['Kaus Media', 'Ascella'],
  ],
  Capricornus: [
    ['Dabih', 'Nashira'],
    ['Nashira', 'Deneb Algiedi'],
    ['Dabih', 'Deneb Algiedi'],
  ],
  Aquarius: [
    ['Sadalsuud', 'Sadalmelik'],
    ['Sadalmelik', 'Ancha'],
    ['Ancha', 'Skat'],
    ['Sadalsuud', 'Skat'],
  ],
  Pisces: [
    ['Alpherg', 'Torcular'],
    ['Torcular', 'Alrescha'],
  ],
}

/** Soft accent color per sign for figure strokes. */
export const ZODIAC_FIGURE_COLORS: Record<ZodiacSign, string> = {
  Aries: 'rgba(232, 160, 140, 0.75)',
  Taurus: 'rgba(232, 201, 155, 0.75)',
  Gemini: 'rgba(190, 210, 240, 0.75)',
  Cancer: 'rgba(180, 220, 220, 0.75)',
  Leo: 'rgba(242, 200, 120, 0.8)',
  Virgo: 'rgba(200, 220, 170, 0.75)',
  Libra: 'rgba(210, 200, 230, 0.75)',
  Scorpius: 'rgba(230, 140, 130, 0.8)',
  Sagittarius: 'rgba(220, 190, 150, 0.75)',
  Capricornus: 'rgba(170, 200, 190, 0.75)',
  Aquarius: 'rgba(150, 190, 230, 0.8)',
  Pisces: 'rgba(170, 180, 230, 0.75)',
}
