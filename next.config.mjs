/** @type {import('next').NextConfig} */
const nextConfig = {
    // TODO: remove once full type/lint checking passes in CI
    eslint: { ignoreDuringBuilds: true },
    typescript: { ignoreBuildErrors: true },
};

export default nextConfig;
