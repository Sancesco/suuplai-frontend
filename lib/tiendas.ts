// Datos confirmados por Santiago (2026-05-11).

export interface Tienda {
  slug: string
  nombre: string
  logo: string
  sucursales: number
  zonas: string
  tagline: string
}

export const TIENDAS: Tienda[] = [
  {
    slug: 'alchef',
    nombre: 'Alchef',
    logo: '/logos-tiendas/alchef.jpg',
    sucursales: 11,
    zonas: 'Polanco, Roma, Condesa, Del Valle y más',
    tagline: 'Compartiendo lo mejor',
  },
  {
    slug: 'casa-bruna',
    nombre: 'Casa Bruna',
    logo: '/logos-tiendas/casabruna.png',
    sucursales: 4,
    zonas: 'Roma, Condesa, Nápoles, Polanco',
    tagline: 'Eco shop & coffee',
  },
  {
    slug: 'moramora',
    nombre: 'Moramora Market',
    logo: '/logos-tiendas/MoraMora-Market.webp',
    sucursales: 6,
    zonas: 'Polanco, Condesa, Santa Fe y más',
    tagline: 'Mercados de barrio premium',
  },
  {
    slug: 'supercope',
    nombre: 'SuperCope',
    logo: '/logos-tiendas/Supercope.png',
    sucursales: 2,
    zonas: 'San Miguel Chapultepec',
    tagline: 'Curaduría natural',
  },
  {
    slug: 'numu',
    nombre: 'Numu Market',
    logo: '/logos-tiendas/numu-market.png',
    sucursales: 1,
    zonas: 'Coyoacán',
    tagline: 'Mercado gourmet de barrio',
  },
  {
    slug: 'commando',
    nombre: 'Commando Studios',
    logo: '/logos-tiendas/Commandostudios.webp',
    sucursales: 19,
    zonas: 'CDMX',
    tagline: 'Boutique fitness studios',
  },
]
