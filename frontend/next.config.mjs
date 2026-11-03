/** @type {import('next').NextConfig} */
const nextConfig = {
  output: "standalone",
  experimental: {
    turbopackFileSystemCacheForDev: false,
  },
};

export default nextConfig;
