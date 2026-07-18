import type { Metadata } from 'next'
import { Syne, DM_Sans, Space_Mono } from 'next/font/google'
import Script from 'next/script'
import './globals.css'

// Google Tag Manager — contenedor donde se administra Google Analytics y demás tags.
const GTM_ID = 'GTM-PPRBP6ZT'

const syne = Syne({
  subsets: ['latin'],
  weight: ['400', '700', '800'],
  variable: '--font-syne',
  display: 'swap',
})

const dmSans = DM_Sans({
  subsets: ['latin'],
  weight: ['300', '400', '500'],
  variable: '--font-dm-sans',
  display: 'swap',
})

const spaceMono = Space_Mono({
  subsets: ['latin'],
  weight: ['400', '700'],
  variable: '--font-space-mono',
  display: 'swap',
})

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://suuplai.com'

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: 'Suuplai',
  description:
    'Conectamos tiendas independientes con marcas que necesitan presencia física. Sin costos de entrada millonarios, sin meses de espera.',
  keywords: ['retail', 'tiendas', 'marcas', 'espacio en tienda', 'marketplace', 'México', 'CDMX'],
  openGraph: {
    title: 'Suuplai — El espacio en tienda ya no es solo de los grandes',
    description:
      'Conectamos tiendas independientes con marcas que necesitan presencia física.',
    type: 'website',
    locale: 'es_MX',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Suuplai — El espacio en tienda ya no es solo de los grandes',
    description:
      'Conectamos tiendas independientes con marcas que necesitan presencia física.',
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="es" className={`${syne.variable} ${dmSans.variable} ${spaceMono.variable}`}>
      <head>
        {/* Google Tag Manager */}
        <Script id="google-tag-manager" strategy="afterInteractive">
          {`(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
          new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
          j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
          'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
          })(window,document,'script','dataLayer','${GTM_ID}');`}
        </Script>
      </head>
      <body className="bg-suu-bg text-suu-text font-dm antialiased">
        {/* Google Tag Manager (noscript) */}
        <noscript>
          <iframe
            src={`https://www.googletagmanager.com/ns.html?id=${GTM_ID}`}
            height="0"
            width="0"
            style={{ display: 'none', visibility: 'hidden' }}
          />
        </noscript>
        {children}
      </body>
    </html>
  )
}
