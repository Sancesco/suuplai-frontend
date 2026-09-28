/** @type {import('next').NextConfig} */
const nextConfig = {
  // Sirve el archivo estático public/dictado.html en la ruta limpia /dictado.
  async rewrites() {
    return [{ source: '/dictado', destination: '/dictado.html' }]
  },
}

module.exports = nextConfig
