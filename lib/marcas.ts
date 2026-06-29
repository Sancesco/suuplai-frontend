// Marcas que ya están o han probado Suuplai.
// Para mostrar el logo real: guarda el archivo en public/logos-marcas/
// y pon su ruta en `logo`. Si `logo` es null, la tarjeta muestra el nombre
// en texto (se ve limpio, no roto) hasta que agregues la imagen.

export interface Marca {
  slug: string
  nombre: string
  logo: string | null
  categoria: string
}

export const MARCAS: Marca[] = [
  {
    slug: 'salsa-norte',
    nombre: 'Salsa Norte',
    logo: '/logos-marcas/salsa-norte.jpg',
    categoria: 'Salsas artesanales',
  },
  {
    slug: 'porfirio',
    nombre: 'Cervecería Porfirio',
    logo: '/logos-marcas/porfirio.png',
    categoria: 'Cerveza artesanal',
  },
  {
    slug: 'cuna-de-tierra',
    nombre: 'Cuna de Tierra',
    logo: '/logos-marcas/cuna-de-tierra.png',
    categoria: 'Vinos mexicanos',
  },
  {
    slug: 'flavourit-snacks',
    nombre: 'Flavourit Snacks',
    logo: '/logos-marcas/flavourit.jpg',
    categoria: 'Snacks / botanas',
  },
]
