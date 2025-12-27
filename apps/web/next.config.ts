import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  transpilePackages: [
    '@finance-app/shared-types',
    '@finance-app/validation',
    '@finance-app/api-client',
    '@finance-app/finance-engine',
  ],
}

export default nextConfig
