/**
 * Next.js Route Handler: /api/trek
 * Proxies NASA Moon Trek GIS with injected base tag and sanitized CSP/frame headers
 * so it can be seamlessly embedded inside the PLUTON 3D mapping workspace.
 */

import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;

  // Use the exact parameters provided by the user if not specified
  const x = searchParams.get('x') || '-26.89453074832113';
  const y = searchParams.get('y') || '-20.874023048125018';
  const z = searchParams.get('z') || '1';
  const p = searchParams.get('p') || 'urn:ogc:def:crs:EPSG::104903';
  const e =
    searchParams.get('e') ||
    '-295.13671324464764,-149.19433315449353,241.34765174800538,107.4462870582435';

  const targetUrl = new URL('https://trek.nasa.gov/moon/');

  try {
    const res = await fetch(targetUrl.toString(), {
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
      },
    });

    if (!res.ok) {
      return new NextResponse(`Moon Trek fetch error: ${res.statusText}`, {
        status: res.status,
      });
    }

    let html = await res.text();

    // Inject <base href="https://trek.nasa.gov/moon/"> so relative scripts and styles resolve directly
    const baseTag = '<base href="https://trek.nasa.gov/moon/">';
    if (html.includes('<head>')) {
      html = html.replace('<head>', `<head>${baseTag}`);
    } else if (html.includes('<head ')) {
      html = html.replace(/<head[^>]*>/, `$&${baseTag}`);
    }

    // Set initial location hash in body if query params exist
    const hashFragment = `#v=0.1&x=${x}&y=${y}&z=${z}&p=${encodeURIComponent(
      p
    )}&d=&locale=&b=moon&e=${encodeURIComponent(e)}&sfz=&w=`;

    const hashScript = `
      <script>
        if (!window.location.hash || window.location.hash.length < 5) {
          window.location.hash = "${hashFragment}";
        }
      </script>
    `;
    if (html.includes('</body>')) {
      html = html.replace('</body>', `${hashScript}</body>`);
    }

    const headers = new Headers();
    headers.set('Content-Type', 'text/html; charset=utf-8');
    // Remove X-Frame-Options and permit embedding
    headers.set('X-Frame-Options', 'ALLOWALL');
    headers.set(
      'Content-Security-Policy',
      "frame-ancestors 'self' *; default-src 'self' https: data: blob: 'unsafe-inline' 'unsafe-eval';"
    );

    return new NextResponse(html, {
      status: 200,
      headers,
    });
  } catch (error) {
    return new NextResponse(
      `Failed to proxy Moon Trek: ${error instanceof Error ? error.message : 'Unknown error'}`,
      { status: 502 }
    );
  }
}

