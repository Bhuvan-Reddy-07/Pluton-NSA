/**
 * Next.js Route Handler: /api/quickmap
 * Proxies LROC QuickMap GIS with injected base tag and sanitized CSP/frame headers
 * so it can be seamlessly embedded inside the PLUTON 3D mapping workspace.
 */

import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;

  // Use the exact parameters provided by the user if not specified
  const prjExtent =
    searchParams.get('prjExtent') ||
    '-5095144.3120067,-2313085.1763446,4048602.1172227,2166736.8997208';
  const earthShadowEnabled = searchParams.get('earthShadowEnabled') || 'true';
  const proj = searchParams.get('proj') || '10'; // Lunar South Pole Stereographic
  const stack = searchParams.get('stack') || '3314';
  const defs = searchParams.get('defs') || 'N4IgzGCMAsIFygPYAcCGBjAlgFwJ70gF9Cg';

  const targetUrl = new URL('https://quickmap.lroc.im-ldi.com/');
  targetUrl.searchParams.set('prjExtent', prjExtent);
  targetUrl.searchParams.set('earthShadowEnabled', earthShadowEnabled);
  targetUrl.searchParams.set('proj', proj);
  targetUrl.searchParams.set('stack', stack);
  targetUrl.searchParams.set('defs', defs);

  try {
    const res = await fetch(targetUrl.toString(), {
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
      },
    });

    if (!res.ok) {
      return new NextResponse(`QuickMap fetch error: ${res.statusText}`, {
        status: res.status,
      });
    }

    let html = await res.text();

    // Inject <base href="https://quickmap.lroc.im-ldi.com/"> so relative assets (/assets/...) resolve properly
    const baseTag = '<base href="https://quickmap.lroc.im-ldi.com/">';
    if (html.includes('<head>')) {
      html = html.replace('<head>', `<head>${baseTag}`);
    } else if (html.includes('<head ')) {
      html = html.replace(/<head[^>]*>/, `$&${baseTag}`);
    }

    const headers = new Headers();
    headers.set('Content-Type', 'text/html; charset=utf-8');
    // Remove X-Frame-Options and permit embedding
    headers.set('X-Frame-Options', 'ALLOWALL');
    // Allow scripts and workers from lroc.im-ldi.com
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
      `Failed to proxy QuickMap: ${error instanceof Error ? error.message : 'Unknown error'}`,
      { status: 502 }
    );
  }
}

