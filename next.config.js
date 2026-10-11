/** @type {import('next').NextConfig} */
const nextConfig = {
  // Sirve archivos estáticos de public/ en rutas limpias.
  async rewrites() {
    return [
      { source: '/dictado', destination: '/dictado.html' },
      { source: '/jime', destination: '/jime.html' },
    ]
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
