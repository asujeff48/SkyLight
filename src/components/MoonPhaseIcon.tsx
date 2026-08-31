import { useId } from 'react'

type Props = {
  /** Sun–Moon elongation degrees: 0 new, 90 first quarter, 180 full, 270 last quarter */
  elongation: number
  size?: number
  className?: string
}

/**
 * Northern-hemisphere style moon glyph: waxing lit on the right, waning on the left.
 * Shadow is a same-radius disk whose offset tracks illuminated fraction.
 */
export function MoonPhaseIcon({ elongation, size = 18, className }: Props) {
  const rawId = useId()
  const maskId = `moon-phase-mask-${rawId.replace(/:/g, '')}`
  const e = ((elongation % 360) + 360) % 360
  const r = 10
  const cx = 12
  const cy = 12
  const illum = (1 - Math.cos((e * Math.PI) / 180)) / 2
  const shadowOffset = (e <= 180 ? -1 : 1) * 2 * r * illum

  return (
    <svg
      className={className}
      width={size}
      height={size}
      viewBox="0 0 24 24"
      aria-hidden="true"
      focusable="false"
    >
      <circle
        cx={cx}
        cy={cy}
        r={r}
        fill="rgba(232, 238, 245, 0.14)"
        stroke="rgba(232, 238, 245, 0.4)"
        strokeWidth="0.9"
      />
      <defs>
        <mask id={maskId}>
          <circle cx={cx} cy={cy} r={r} fill="#fff" />
          <circle cx={cx + shadowOffset} cy={cy} r={r} fill="#000" />
        </mask>
      </defs>
      <circle cx={cx} cy={cy} r={r} fill="#e8eef5" mask={`url(#${maskId})`} />
    </svg>
  )
}
