'use client'

const MARQUEE_TEXT =
  'MONETIZA TU ESPACIO · ACCEDE AL RETAIL FÍSICO · DATA REAL DE TUS VENTAS · SIN INTERMEDIARIOS · ESPACIO PARA MARCAS INDEPENDIENTES · '

export function MarqueeBanner() {
  return (
    <div
      className="overflow-hidden py-4"
      style={{ background: '#FF6B35' }}
      aria-hidden="true"
    >
      <div
        className="animate-marquee flex whitespace-nowrap"
        style={{ width: 'max-content' }}
        onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.animationPlayState = 'paused' }}
        onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.animationPlayState = 'running' }}
      >
        {/* Two copies for seamless loop */}
        <span
          className="font-syne font-bold text-white mr-0"
          style={{ fontSize: '14px', letterSpacing: '2px' }}
        >
          {MARQUEE_TEXT}
        </span>
        <span
          className="font-syne font-bold text-white"
          style={{ fontSize: '14px', letterSpacing: '2px' }}
        >
          {MARQUEE_TEXT}
        </span>
      </div>
    </div>
  )
}
