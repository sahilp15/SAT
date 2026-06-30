/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // The importer extracts question figures into /public/question-assets.
  // No remote images are used in V1 (local-first), so no remotePatterns are needed.
};

export default nextConfig;
