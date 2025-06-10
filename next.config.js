/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
  env: {
    NEXT_PUBLIC_SM_TOKEN_ADDRESS: process.env.NEXT_PUBLIC_SM_TOKEN_ADDRESS || "0xd7d7dd989642222B6f685aF0220dc0065F489ae0",
    NEXT_PUBLIC_SM_EXCHANGE_ADDRESS: process.env.NEXT_PUBLIC_SM_EXCHANGE_ADDRESS || "0xF0c4729f07d7B2F03E2E2F2feED36386Dc8bFb8E",
    NEXT_PUBLIC_WALLET_CONNECT_PROJECT_ID: process.env.NEXT_PUBLIC_WALLET_CONNECT_PROJECT_ID || "fced525820007c9c024132cf432ffcae"
  },
}

module.exports = nextConfig
