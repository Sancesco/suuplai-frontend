'use client'

import Link from 'next/link'
import Image from 'next/image'

type LogoVariant = 'dark' | 'light' | 'mono-white' | 'mono-black'

interface LogoProps {
  variant?: LogoVariant
  showWordmark?: boolean
  className?: string
  linkTo?: string | null
  ariaLabel?: string
}

const wordmarkSrc: Record<LogoVariant, string> = {
  'dark':       '/logos/suuplai-logo-dark.svg',
  'light':      '/logos/suuplai-logo-light.svg',
  'mono-white': '/logos/suuplai-logo-mono-white.svg',
  'mono-black': '/logos/suuplai-logo-mono-black.svg',
}

const isotipoSrc = '/logos/suuplai-isotipo.svg'

// Wordmark SVG viewBox is 320×80 (ratio 4:1)
// Isotipo SVG viewBox is 64×64 (ratio 1:1)
const WORDMARK_RATIO = 320 / 80
const ISOTIPO_RATIO = 1

export function Logo({
  variant = 'dark',
  showWordmark = true,
  className = 'h-8',
  linkTo = '/',
  ariaLabel = 'Suuplai — ir al inicio',
}: LogoProps) {
  const src = showWordmark ? wordmarkSrc[variant] : isotipoSrc
  const ratio = showWordmark ? WORDMARK_RATIO : ISOTIPO_RATIO

  // Render height base 80px → width derived from ratio. Tailwind className controls actual h.
  const renderHeight = 80
  const renderWidth = Math.round(renderHeight * ratio)

  const img = (
    <Image
      src={src}
      alt="Suuplai"
      width={renderWidth}
      height={renderHeight}
      priority
      className={`${className} w-auto`}
      style={{ objectFit: 'contain' }}
    />
  )

  if (linkTo === null) {
    return img
  }

  return (
    <Link
      href={linkTo}
      className="inline-flex items-center hover:opacity-85 transition-opacity duration-200"
      aria-label={ariaLabel}
    >
      {img}
    </Link>
  )
}
