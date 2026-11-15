/**
 * Resolves static asset paths with automatic GitHub Pages basePath support.
 * Ensures images, 3D GLB models, and PDFs resolve correctly on both localhost
 * and GitHub Pages (e.g., https://<username>.github.io/<repo>/...).
 */
export function getAssetPath(path: string): string {
  if (!path) return '';
  if (path.startsWith('http://') || path.startsWith('https://') || path.startsWith('data:')) {
    return path;
  }

  const cleanPath = path.startsWith('/') ? path : `/${path}`;

  // 1. If running in browser environment, detect repo prefix from window.location.pathname
  if (typeof window !== 'undefined') {
    const pathname = window.location.pathname;
    const match = pathname.match(/^\/([^\/]+)\//);
    if (match) {
      const firstSegment = match[1];
      if (firstSegment.toLowerCase() === 'pluton-nsa' && !cleanPath.toLowerCase().startsWith('/pluton-nsa')) {
        return `/${firstSegment}${cleanPath}`;
      }
    }
  }

  // 2. Next.js environment variable baked at build time
  const envBasePath = process.env.NEXT_PUBLIC_BASE_PATH || '';
  if (envBasePath && !cleanPath.startsWith(envBasePath)) {
    return `${envBasePath}${cleanPath}`;
  }

  return cleanPath;
}
