/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // @sovereign/core ships TS source directly; let Next transpile it.
  transpilePackages: ['@sovereign/core'],
};

export default nextConfig;
