/**
 * Client-Side NASA JPL Horizons API Verification Service
 */

import { HorizonsQueryRequest, HorizonsQueryResponse } from '@/types/pluton';

export async function verifyWithJPLHorizons(
  params: HorizonsQueryRequest
): Promise<HorizonsQueryResponse> {
  const queryParams = new URLSearchParams({
    target: params.target,
    lat: params.latitudeDeg.toString(),
    lon: params.longitudeDeg.toString(),
    elev: params.elevationKm.toString(),
    epoch: params.epochUtc,
  });

  try {
    const res = await fetch(`/api/horizons?${queryParams.toString()}`);
    if (!res.ok) {
      throw new Error(`Horizons proxy responded with status ${res.status}`);
    }
    const data: HorizonsQueryResponse = await res.json();
    return data;
  } catch (error) {
    return {
      success: false,
      source: 'OFFLINE_FALLBACK',
      target: params.target,
      epochUtc: params.epochUtc,
      observerCoord: {
        lat: params.latitudeDeg,
        lon: params.longitudeDeg,
        elevKm: params.elevationKm,
      },
      azimuthDeg: 0,
      elevationDeg: 0,
      apparentRangeKm: 0,
      error: error instanceof Error ? error.message : 'Unknown Horizons query error',
    };
  }
}

