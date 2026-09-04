import type { Metadata } from 'next'
import { AgenteComercial } from '@/components/agente/AgenteComercial'

export const metadata: Metadata = {
  title: 'Suuplai · Agente Comercial',
  description:
    'El equipo de ventas que no tienes que contratar. Prospectamos, muestreamos y abrimos cuentas para tu marca en tiendas físicas de México. Sin comisiones sobre tus ventas.',
  openGraph: {
    title: 'Suuplai · El equipo de ventas que no tienes que contratar',
    description:
      'Prospectamos, tocamos puertas y abrimos cuentas para tu marca en tiendas físicas de CDMX y Guadalajara.',
    type: 'website',
    locale: 'es_MX',
    url: 'https://www.suuplai.com.mx/agente-comercial',
    images: [{ url: 'https://www.suuplai.com.mx/og-agente.png', width: 1200, height: 630, alt: 'Suuplai · Agente Comercial' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Suuplai · Agente Comercial',
    description: 'El equipo de ventas que no tienes que contratar.',
    images: ['https://www.suuplai.com.mx/og-agente.png'],
  },
}

export default function AgenteComercialPage() {
  return <AgenteComercial />
}
