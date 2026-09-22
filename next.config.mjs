/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  serverExternalPackages: ['pg', 'redis'],
  // Avoid build requiring MODEL_API_KEY at compile time
  env: {},
};
export default nextConfig;
