/**
 * PLUTON - LROC QuickMap GIS Service & Polar Stereographic Coordinate Projector
 * Connects directly to NASA/LRO QuickMap (LROC IM-LDI) infrastructure
 */

export const QUICKMAP_DEFAULT_URL =
  'https://quickmap.lroc.im-ldi.com/?prjExtent=-5095144.3120067%2C-2313085.1763446%2C4048602.1172227%2C2166736.8997208&earthShadowEnabled=true&proj=10&stack=3314&defs=N4IgzGCMAsIFygPYAcCGBjAlgFwJ70gF9Cg';

const MOON_RADIUS_METERS = 1737400.0;
const DEG2RAD = Math.PI / 180.0;

export interface PolarStereographicCoord {
  x: number; // meters
  y: number; // meters
}

/**
 * Converts lunar polar coordinates (latitude, longitude) into Lunar South Pole
 * Stereographic projection coordinates (meters) used by LROC QuickMap (proj=10).
 *
 * @param latDeg Latitude in degrees (-90 to -60)
 * @param lonDeg Longitude in degrees East (0 to 360)
 */
export function latLonToSouthPoleStereographic(latDeg: number, lonDeg: number): PolarStereographicCoord {
  // Colatitude in radians: 0 at South Pole (-90°), 0.1745 rad at -80°
  const colatitudeRad = (90.0 + latDeg) * DEG2RAD;
  // Stereographic radius from South Pole
  const r = 2.0 * MOON_RADIUS_METERS * Math.tan(colatitudeRad / 2.0);

  const lonRad = lonDeg * DEG2RAD;
  // QuickMap proj=10 coordinates: X = r * sin(lon), Y = -r * cos(lon)
  const x = r * Math.sin(lonRad);
  const y = -r * Math.cos(lonRad);

  return { x, y };
}

export type QuickMapZoomLevel = 'CLOSEUP' | 'REGIONAL' | 'SYNOPTIC' | 'USER_DEFAULT';

/**
 * Builds a targeted LROC QuickMap URL centered on a specific lunar south pole coordinate
 * with customized zoom extent, Earth Shadow simulation, and layer stack.
 */
export function buildQuickMapUrl(
  latDeg: number,
  lonDeg: number,
  zoom: QuickMapZoomLevel = 'CLOSEUP',
  stack: string = '3314',
  defs: string = 'N4IgzGCMAsIFygPYAcCGBjAlgFwJ70gF9Cg'
): string {
  if (zoom === 'USER_DEFAULT') {
    return QUICKMAP_DEFAULT_URL;
  }

  const { x, y } = latLonToSouthPoleStereographic(latDeg, lonDeg);

  // Define radius span in meters based on zoom level
  let spanM = 60000; // 60 km span for CLOSEUP
  if (zoom === 'REGIONAL') {
    spanM = 250000; // 250 km span
  } else if (zoom === 'SYNOPTIC') {
    spanM = 800000; // 800 km span
  }

  const minX = (x - spanM).toFixed(4);
  const minY = (y - spanM).toFixed(4);
  const maxX = (x + spanM).toFixed(4);
  const maxY = (y + spanM).toFixed(4);

  const prjExtent = `${minX},${minY},${maxX},${maxY}`;

  const url = new URL('https://quickmap.lroc.im-ldi.com/');
  url.searchParams.set('prjExtent', prjExtent);
  url.searchParams.set('earthShadowEnabled', 'true');
  url.searchParams.set('proj', '10'); // South Pole Stereographic
  url.searchParams.set('stack', stack);
  url.searchParams.set('defs', defs);

  return url.toString();
}

/**
 * Builds the proxy URL that serves QuickMap embedded inside an iframe with stripped CSP/frame headers.
 */
export function buildQuickMapProxyUrl(
  latDeg: number,
  lonDeg: number,
  zoom: QuickMapZoomLevel = 'USER_DEFAULT',
  stack: string = '3314'
): string {
  if (zoom === 'USER_DEFAULT') {
    return `/api/quickmap`;
  }

  const { x, y } = latLonToSouthPoleStereographic(latDeg, lonDeg);
  let spanM = 60000;
  if (zoom === 'REGIONAL') spanM = 250000;
  if (zoom === 'SYNOPTIC') spanM = 800000;

  const minX = (x - spanM).toFixed(4);
  const minY = (y - spanM).toFixed(4);
  const maxX = (x + spanM).toFixed(4);
  const maxY = (y + spanM).toFixed(4);
  const prjExtent = `${minX},${minY},${maxX},${maxY}`;

  return `/api/quickmap?prjExtent=${encodeURIComponent(prjExtent)}&earthShadowEnabled=true&proj=10&stack=${stack}`;
}

