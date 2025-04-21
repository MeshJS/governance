import type { NextConfig } from 'next'

const config: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'avatars.githubusercontent.com',
        port: '',          // leave empty string for default ports
        pathname: '/**',   // allow any path under this host
      },
    ],
  },
}

export default config
