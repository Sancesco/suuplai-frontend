import type { Metadata } from 'next'
import { Candidato } from './Candidato'

export const metadata: Metadata = {
  title: 'Entrevista · Suuplai',
  robots: { index: false, follow: false },
}

export default function EntrevistaPage({ params }: { params: { token: string } }) {
  return <Candidato token={params.token} />
}
