import type { Metadata } from 'next'
import { RhPanel } from './RhPanel'

export const metadata: Metadata = {
  title: 'RH · Suuplai',
  robots: { index: false, follow: false },
}

export default function RhPage() {
  return <RhPanel />
}
