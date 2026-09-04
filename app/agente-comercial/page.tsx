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
  },
}

export default function AgenteComercialPage() {
  return <AgenteComercial />
}
