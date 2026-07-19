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

// Logo oficial vigente: wordmark "suuplai." claro (para fondos oscuros).
// Todas las variantes usan el mismo PNG porque el logo se usa siempre sobre fondo oscuro.
const NEW_WORDMARK = '/logos/suuplai-logo-light.png'
const wordmarkSrc: Record<LogoVariant, string> = {
  'dark':       NEW_WORDMARK,
  'light':      NEW_WORDMARK,
  'mono-white': NEW_WORDMARK,
  'mono-black': NEW_WORDMARK,
}

const isotipoSrc = '/logos/suuplai-isotipo.svg'

// Wordmark PNG es 2400×402 (ratio ~5.97:1)
// Isotipo SVG viewBox is 64×64 (ratio 1:1)
const WORDMARK_RATIO = 2400 / 402
const ISOTIPO_RATIO = 1

export function Logo({
  variant = 'dark',
  showWordmark = true,
  className = 'h-8',
  linkTo = '/',
  ariaLabel = 'Suuplai, ir al inicio',
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
