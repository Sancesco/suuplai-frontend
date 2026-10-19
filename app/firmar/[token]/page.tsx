import type { Metadata } from 'next'
import { Firmar } from './Firmar'

export const metadata: Metadata = {
  title: 'Firmar contrato · Suuplai',
  robots: { index: false, follow: false },
}

export default function FirmarPage({ params }: { params: { token: string } }) {
  return <Firmar token={params.token} />
}
