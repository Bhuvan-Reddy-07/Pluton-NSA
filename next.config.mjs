/** @type {import('next').NextConfig} */
const isGithubActions = process.env.GITHUB_ACTIONS || false;

let basePath = '';
if (isGithubActions) {
  const repoName = process.env.GITHUB_REPOSITORY ? process.env.GITHUB_REPOSITORY.split('/')[1] : '';
  if (repoName && !repoName.endsWith('.github.io')) {
    basePath = `/${repoName}`;
  }
}

if (process.env.NEXT_PUBLIC_BASE_PATH) {
  basePath = process.env.NEXT_PUBLIC_BASE_PATH;
}

const nextConfig = {
  reactStrictMode: true,
  transpilePackages: ['three'],
  output: 'export',
  images: {
    unoptimized: true,
  },
  basePath: basePath,
  trailingSlash: true,
};

export default nextConfig;

