/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  transpilePackages: ['@sovereign/api-platform'],
  webpack: (config) => {
    // The workspace packages ship TS source using .js import specifiers (NodeNext style);
    // let webpack resolve those to the .ts files.
    config.resolve.extensionAlias = { '.js': ['.ts', '.tsx', '.js'] };
    return config;
  },
};

export default nextConfig;
