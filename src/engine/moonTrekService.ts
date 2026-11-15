/**
 * PLUTON - NASA Moon Trek GIS Service
 * Connects directly to NASA JPL Solar System Trek (Moon Trek) planetary GIS infrastructure
 */

import { getAssetPath } from '@/utils/assetPath';

export const NASA_MOON_TREK_DEFAULT_URL =
  'https://trek.nasa.gov/moon/#v=0.1&x=-26.89453074832113&y=-20.874023048125018&z=1&p=urn%3Aogc%3Adef%3Acrs%3AEPSG%3A%3A104903&d=&locale=&b=moon&e=-295.13671324464764%2C-149.19433315449353%2C241.34765174800538%2C107.4462870582435&sfz=&w=';

export type MoonTrekZoomLevel = 'CLOSEUP' | 'REGIONAL' | 'USER_DEFAULT';

/**
 * Builds a targeted NASA Moon Trek URL centered on a specific lunar south pole coordinate
 * with customized zoom extent and polar stereographic projection (EPSG:104903).
 */
export function buildMoonTrekUrl(
  latDeg: number,
  lonDeg: number,
  zoom: MoonTrekZoomLevel = 'CLOSEUP'
): string {
  if (zoom === 'USER_DEFAULT') {
    return NASA_MOON_TREK_DEFAULT_URL;
  }

  // Normalize longitude to [-180, 180] or keep [0, 360]
  let normLon = lonDeg;
  if (normLon > 180) normLon -= 360.0;

  const zLevel = zoom === 'CLOSEUP' ? 6 : 3;
  const span = zoom === 'CLOSEUP' ? 2.5 : 8.0;

  const minLon = (normLon - span).toFixed(4);
  const minLat = Math.max(-90, latDeg - span).toFixed(4);
  const maxLon = (normLon + span).toFixed(4);
  const maxLat = Math.min(-60, latDeg + span).toFixed(4);

  const extent = encodeURIComponent(`${minLon},${minLat},${maxLon},${maxLat}`);
  const proj = encodeURIComponent('urn:ogc:def:crs:EPSG::104903');

  return `https://trek.nasa.gov/moon/#v=0.1&x=${normLon.toFixed(4)}&y=${latDeg.toFixed(4)}&z=${zLevel}&p=${proj}&d=&locale=&b=moon&e=${extent}&sfz=&w=`;
}

/**
 * Builds the proxy URL that serves NASA Moon Trek embedded inside an iframe with stripped CSP/frame headers.
 */
export function buildMoonTrekProxyUrl(
  latDeg: number,
  lonDeg: number,
  zoom: MoonTrekZoomLevel = 'USER_DEFAULT'
): string {
  if (zoom === 'USER_DEFAULT') {
    return getAssetPath('/api/trek');
  }

  let normLon = lonDeg;
  if (normLon > 180) normLon -= 360.0;

  const zLevel = zoom === 'CLOSEUP' ? 6 : 3;
  const span = zoom === 'CLOSEUP' ? 2.5 : 8.0;

  const minLon = (normLon - span).toFixed(4);
  const minLat = Math.max(-90, latDeg - span).toFixed(4);
  const maxLon = (normLon + span).toFixed(4);
  const maxLat = Math.min(-60, latDeg + span).toFixed(4);

  const extent = `${minLon},${minLat},${maxLon},${maxLat}`;

  return getAssetPath(`/api/trek?x=${normLon.toFixed(4)}&y=${latDeg.toFixed(4)}&z=${zLevel}&e=${encodeURIComponent(extent)}`);
}

