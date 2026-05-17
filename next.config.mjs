/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // A stray lockfile higher up the tree confuses workspace-root inference.
  turbopack: {
    root: import.meta.dirname,
  },
  images: {
    remotePatterns: [{ hostname: "avatars.githubusercontent.com" }],
  },
};

export default nextConfig;
