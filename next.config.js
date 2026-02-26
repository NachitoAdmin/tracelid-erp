/** @type {import('next').NextConfig} */
const nextConfig = {
  // No experimental features needed for Next.js 14
  generateBuildId: async () => {
    return Date.now().toString()
  },
  async headers() {
    return [
      {
        source: '/',
        headers: [
          {
            key: 'Cache-Control',
            value: 'no-store, must-revalidate'
          },
          {
            key: 'CDN-Cache-Control',
            value: 'no-store'
          },
          {
            key: 'Vercel-CDN-Cache-Control',
            value: 'no-store'
          },
        ],
      },
      {
        source: '/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'no-store, must-revalidate'
          },
          {
            key: 'CDN-Cache-Control',
            value: 'no-store'
          },
          {
            key: 'Vercel-CDN-Cache-Control',
            value: 'no-store'
          },
        ],
      },
    ]
  }
}

module.exports = nextConfig