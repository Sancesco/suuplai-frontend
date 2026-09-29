/** @type {import('next').NextConfig} */
const nextConfig = {
  // Sirve el archivo estático public/dictado.html en la ruta limpia /dictado.
  async rewrites() {
    return [{ source: '/dictado', destination: '/dictado.html' }]
  },
  // Asegura que content/perfil.md quede en el bundle serverless (se lee con fs en runtime).
  experimental: {
    outputFileTracingIncludes: {
      '/api/aplicaciones/**': ['./content/**'],
      '/aplicaciones/**': ['./content/**'],
    },
  },
}

module.exports = nextConfig
