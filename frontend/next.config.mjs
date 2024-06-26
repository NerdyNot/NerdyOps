/**
 * @type {import('next').NextConfig}
 */
const nextConfig = {
  images: {
    unoptimized: true,
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'localhost',
      },
    ],
  },
  env: {
    NEXT_PUBLIC_CENTRAL_SERVER_URL: process.env.NEXT_PUBLIC_CENTRAL_SERVER_URL,
  },
}

export default nextConfig
