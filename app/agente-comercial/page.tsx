import type { Metadata } from 'next'
import { AgenteComercial } from '@/components/agente/AgenteComercial'

export const metadata: Metadata = {
  title: 'Suuplai · Agente Comercial',
  description:
    'El equipo de ventas que no tienes que contratar. Prospectamos, muestreamos y abrimos cuentas para tu marca en tiendas gourmet de México. $3,000 + IVA al mes, sin comisiones.',
  openGraph: {
    title: 'Suuplai · Agente Comercial',
    description:
      'El equipo de ventas que no tienes que contratar. Con que una tienda te recompre cada mes, el servicio se paga solo.',
    type: 'website',
    locale: 'es_MX',
  },
}

export default function AgenteComercialPage() {
  return <AgenteComercial />
}
