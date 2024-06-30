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
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  webpack: (config) => {
    config.module.rules.push({
      test: /\.js$/,
      use: ["babel-loader"],
      exclude: /node_modules\/(?!react-syntax-highlighter)/,
    });
    return config;
  },
}

export default nextConfig
