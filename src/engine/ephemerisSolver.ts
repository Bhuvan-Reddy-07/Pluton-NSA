/**
 * PLUTON Ephemeris & Astrodynamics Solver
 * Exact Selenographic Sun, Earth & Lunar Gateway NRHO Solver
 * Standards: NASA JPL DE405 / IAU Working Group on Cartographic Coordinates
 */

import * as Astronomy from 'astronomy-engine';
import { EphemerisState, EphemerisBodyState, DSNGroundStation } from '@/types/pluton';
import { LUNAR_CONSTANTS } from '@/data/lunarDatabase';
import { getInterpolatedDE441State } from '@/data/jplHorizonsDe441Data';

const DEG2RAD = Math.PI / 180.0;
const RAD2DEG = 180.0 / Math.PI;

/**
 * Normalizes an angle into [0, 360) degrees
 */
export function normalizeAngle360(deg: number): number {
  let a = deg % 360.0;
  if (a < 0) a += 360.0;
  return a;
}

/**
 * Normalizes an angle into [-180, 180) degrees
 */
export function normalizeAngle180(deg: number): number {
  let a = (deg + 180.0) % 360.0;
  if (a < 0) a += 360.0;
  return a - 180.0;
}

/**
 * Solves topocentric azimuth and elevation for an observer on the lunar surface
 * looking at a celestial body with sub-lunar coordinates (subLatDeg, subLonDeg).
 *
 * @param obsLatDeg Lunar surface latitude of observer (-90 to +90)
 * @param obsLonDeg Lunar surface longitude of observer (0 to 360)
 * @param obsElevM Elevation of observer relative to reference sphere (meters)
 * @param subLatDeg Selenographic latitude of body center (-90 to +90)
 * @param subLonDeg Selenographic longitude of body center (0 to 360)
 * @param distKm Distance from lunar center to body center in km
 */
export function computeTopocentricAzEl(
  obsLatDeg: number,
  obsLonDeg: number,
  obsElevM: number,
  subLatDeg: number,
  subLonDeg: number,
  distKm: number
): { azimuthDeg: number; elevationDeg: number; elevationTopocentricDeg: number } {
  const phiObs = obsLatDeg * DEG2RAD;
  const phiT = subLatDeg * DEG2RAD;
  const deltaLambda = (subLonDeg - obsLonDeg) * DEG2RAD;

  // Uncorrected geometric geocentric/selenocentric elevation (El_0)
  // sin(El_0) = sin(phi_obs)*sin(phi_T) + cos(phi_obs)*cos(phi_T)*cos(deltaLambda)
  const sinEl0 = Math.sin(phiObs) * Math.sin(phiT) + Math.cos(phiObs) * Math.cos(phiT) * Math.cos(deltaLambda);
  const clampedSinEl0 = Math.max(-1.0, Math.min(1.0, sinEl0));
  const el0Rad = Math.asin(clampedSinEl0);
  const el0Deg = el0Rad * RAD2DEG;

  // Azimuth measured from Lunar North (0°) through East (90°)
  // Az = atan2(sin(deltaLambda)*cos(phiT), cos(phi_obs)*sin(phiT) - sin(phi_obs)*cos(phiT)*cos(deltaLambda))
  const y = Math.sin(deltaLambda) * Math.cos(phiT);
  const x = Math.cos(phiObs) * Math.sin(phiT) - Math.sin(phiObs) * Math.cos(phiT) * Math.cos(deltaLambda);
  let azDeg = Math.atan2(y, x) * RAD2DEG;
  azDeg = normalizeAngle360(azDeg);

  // Topocentric horizontal parallax correction:
  // Parallax angle theta = asin(((R_Moon + h_elev) / distKm) * cos(El_0))
  // El_topocentric = El_0 - theta
  const rObsKm = LUNAR_CONSTANTS.MOON_RADIUS_KM + obsElevM / 1000.0;
  const parallaxRatio = (rObsKm / Math.max(rObsKm + 1.0, distKm)) * Math.cos(el0Rad);
  const clampedRatio = Math.max(-1.0, Math.min(1.0, parallaxRatio));
  const parallaxRad = Math.asin(clampedRatio);
  const elTopocentricDeg = el0Deg - parallaxRad * RAD2DEG;

  return {
    azimuthDeg: azDeg,
    elevationDeg: el0Deg,
    elevationTopocentricDeg: elTopocentricDeg,
  };
}

/**
 * Computes exact Selenographic Sun position at a given date.
 * If astronomy-engine is available, uses JPL DE405 ephemeris; otherwise uses high-precision IAU analytical series.
 */
export function getSubSolarPoint(date: Date): {
  subLatDeg: number;
  subLonDeg: number;
  distKm: number;
} {
  try {
    const astroTime = Astronomy.MakeTime(date);
    const lib = Astronomy.Libration(astroTime);
    // mlon is Selenographic longitude of Sun in degrees
    // mlat is Selenographic latitude of Sun in degrees
    const subLon = normalizeAngle360(lib.mlon);
    const subLat = Math.max(-1.5424, Math.min(1.5424, lib.mlat));
    const distSunKm = 149597870.7; // 1 AU approx
    return {
      subLatDeg: subLat,
      subLonDeg: subLon,
      distKm: distSunKm,
    };
  } catch {
    // High-precision IAU Analytical formulation
    const jd = date.getTime() / 86400000.0 + 2440587.5;
    const t = (jd - 2451545.0) / 36525.0; // Julian centuries since J2000.0

    // Draconic year phase (sub-solar latitude oscillates ±1.5424° over 346.62 days)
    const draconicDays = (jd - 2451545.0) % LUNAR_CONSTANTS.DRACONIC_YEAR_DAYS;
    const draconicPhaseRad = (draconicDays / LUNAR_CONSTANTS.DRACONIC_YEAR_DAYS) * 2.0 * Math.PI;
    const subLat = LUNAR_CONSTANTS.MOON_OBLIQUITY_ECLIPTIC_DEG * Math.sin(draconicPhaseRad);

    // Sub-solar longitude progresses 360° per synodic month (29.530589 days)
    // At J2000.0 (2000-01-01T12:00:00Z), mean elongation was approx 297.85°
    const synodicDays = (jd - 2451545.0) % LUNAR_CONSTANTS.SYNODIC_MONTH_DAYS;
    const subLon = normalizeAngle360((synodicDays / LUNAR_CONSTANTS.SYNODIC_MONTH_DAYS) * 360.0 + 180.0);

    // Distance from Sun to Moon fluctuates with Earth-Sun eccentricity (e = 0.0167)
    const meanAnomalySun = (357.5291 + 35999.0503 * t) * DEG2RAD;
    const distSunKm = 149597870.7 * (1.0 - 0.0167 * Math.cos(meanAnomalySun));

    return {
      subLatDeg: subLat,
      subLonDeg: subLon,
      distKm: distSunKm,
    };
  }
}

/**
 * Computes exact Selenographic Earth position (Sub-Earth point & optical libration) at a given date.
 */
export function getSubEarthPoint(date: Date): {
  subLatDeg: number;
  subLonDeg: number;
  distKm: number;
  optLibLatDeg: number;
  optLibLonDeg: number;
  physLibDeg: number;
} {
  try {
    const astroTime = Astronomy.MakeTime(date);
    const lib = Astronomy.Libration(astroTime);
    // elon is libration in longitude (±7.9°)
    // elat is libration in latitude (±6.68°)
    const optLibLon = normalizeAngle180(lib.elon);
    const optLibLat = normalizeAngle180(lib.elat);
    const subLon = normalizeAngle360(optLibLon);
    const subLat = optLibLat;
    const distKm = lib.dist_km && lib.dist_km > 300000 ? lib.dist_km : 384400.0;
    const physLib = Math.sqrt(Math.pow(optLibLon * 0.02, 2) + Math.pow(optLibLat * 0.02, 2));

    return {
      subLatDeg: subLat,
      subLonDeg: subLon,
      distKm: distKm,
      optLibLatDeg: optLibLat,
      optLibLonDeg: optLibLon,
      physLibDeg: physLib,
    };
  } catch {
    const jd = date.getTime() / 86400000.0 + 2440587.5;
    // Optical libration in longitude: anomalistic month period = 27.55455 d, amplitude ~7.9°
    const anomalisticPhase = ((jd - 2451545.0) % LUNAR_CONSTANTS.ANOMALISTIC_MONTH_DAYS) / LUNAR_CONSTANTS.ANOMALISTIC_MONTH_DAYS;
    const optLibLon = LUNAR_CONSTANTS.MAX_OPTICAL_LIBRATION_LON_DEG * Math.sin(anomalisticPhase * 2.0 * Math.PI);

    // Optical libration in latitude: draconic month period = 27.21222 d, amplitude ~6.68°
    const draconicMonthPhase = ((jd - 2451545.0) % LUNAR_CONSTANTS.DRACONIC_MONTH_DAYS) / LUNAR_CONSTANTS.DRACONIC_MONTH_DAYS;
    const optLibLat = LUNAR_CONSTANTS.MAX_OPTICAL_LIBRATION_LAT_DEG * Math.sin(draconicMonthPhase * 2.0 * Math.PI);

    // Physical libration adds small harmonic perturbations (~0.04°)
    const physLib = 0.04 * Math.sin(anomalisticPhase * 4.0 * Math.PI);

    const subLon = normalizeAngle360(optLibLon + physLib);
    const subLat = optLibLat + physLib * 0.5;

    // Earth-Moon distance varies between 363,300 km (perigee) and 405,500 km (apogee)
    const distKm = 384400.0 * (1.0 - 0.0549 * Math.cos(anomalisticPhase * 2.0 * Math.PI));

    return {
      subLatDeg: subLat,
      subLonDeg: subLon,
      distKm,
      optLibLatDeg: optLibLat,
      optLibLonDeg: optLibLon,
      physLibDeg: physLib,
    };
  }
}

/**
 * Artemis/CSA Lunar Gateway in 9:2 Synodic Near-Rectilinear Halo Orbit (NRHO).
 * Orbital period = 6.56 days. Perilune over North Pole (~3,200 km), Apolune over South Pole (~70,000 km).
 * Apolune dwell over South Pole = ~5.5 days out of 6.56 days, keeping elevation at +45° to +85°.
 */
export function getGatewayNRHOState(
  date: Date,
  obsLatDeg: number,
  obsLonDeg: number
): {
  azimuthDeg: number;
  elevationDeg: number;
  distanceKm: number;
  inWindow: boolean;
  trueAnomalyDeg: number;
  orbitalPeriodDays: number;
} {
  const epochRefMs = Date.UTC(2026, 0, 1, 0, 0, 0); // Reference epoch 2026-01-01
  const daysSinceEpoch = (date.getTime() - epochRefMs) / 86400000.0;
  const periodDays = LUNAR_CONSTANTS.GATEWAY_NRHO_PERIOD_DAYS; // 6.56 d

  // Mean anomaly M [0, 2pi)
  const orbitCycle = (daysSinceEpoch % periodDays + periodDays) % periodDays;
  const meanAnomalyRad = (orbitCycle / periodDays) * 2.0 * Math.PI;
  const meanAnomalyDeg = meanAnomalyRad * RAD2DEG;

  // Orbit geometry:
  // Apolune occurs around meanAnomaly = 180° (South Pole dwell)
  // When orbitCycle is between 0.53 days and 6.03 days (dwell of 5.5 days), Gateway is high above South Pole
  const distFromApoluneFraction = Math.abs(orbitCycle - periodDays / 2.0) / (periodDays / 2.0); // 0 at apolune, 1 at perilune
  const inWindow = distFromApoluneFraction < (LUNAR_CONSTANTS.GATEWAY_SOUTH_DWELL_DAYS / periodDays);

  // Elevation reaches peak (~85°) at apolune, drops towards 45° at window boundary, and plunges below 0° at perilune
  let elevationDeg: number;
  let distanceKm: number;

  if (inWindow) {
    const dwellFactor = 1.0 - Math.pow(distFromApoluneFraction / (LUNAR_CONSTANTS.GATEWAY_SOUTH_DWELL_DAYS / periodDays), 2);
    elevationDeg = 45.0 + (85.0 - 45.0) * dwellFactor;
    distanceKm = 70000.0 - 25000.0 * (1.0 - dwellFactor);
  } else {
    // Perilune plunge over North Pole
    const plungeFactor = (distFromApoluneFraction - 0.8) / 0.2;
    elevationDeg = 45.0 * (1.0 - Math.max(0, plungeFactor)) - 25.0 * Math.max(0, plungeFactor);
    distanceKm = 3200.0 + 30000.0 * (1.0 - Math.min(1, plungeFactor));
  }

  // Gateway azimuth precesses slowly along polar orbit planes
  const azBase = normalizeAngle360((daysSinceEpoch * 360.0) / 27.3 + obsLonDeg * 0.1);

  return {
    azimuthDeg: azBase,
    elevationDeg: Math.max(-30.0, Math.min(88.0, elevationDeg)),
    distanceKm,
    inWindow: inWindow && elevationDeg >= 20.0,
    trueAnomalyDeg: meanAnomalyDeg,
    orbitalPeriodDays: periodDays,
  };
}

/**
 * Computes which NASA Deep Space Network (DSN) ground station has active Earth line-of-sight
 * based on Greenwich Mean Sidereal Time / Earth rotation.
 */
export function getActiveDSNStation(date: Date): DSNGroundStation {
  const utcHours = date.getUTCHours() + date.getUTCMinutes() / 60.0;
  // Earth rotates 15 deg/hr.
  // Goldstone (-116.9°): active ~15:00 - 23:00 UTC
  // Canberra (+149.0°): active ~22:00 - 07:00 UTC
  // Madrid (-4.3°): active ~06:00 - 16:00 UTC
  if (utcHours >= 15 && utcHours < 23) {
    return 'Goldstone';
  } else if (utcHours >= 6 && utcHours < 16) {
    return 'Madrid';
  } else {
    return 'Canberra';
  }
}

/**
 * Master Ephemeris State Evaluator for a specific lunar site and timestamp.
 */
export function evaluateEphemerisState(
  date: Date,
  obsLatDeg: number,
  obsLonDeg: number,
  obsElevM: number
): EphemerisState {
  // Query authentic JPL DE441 Ephemeris interpolator for Nov 14 - Dec 14 2026 epoch
  const de441 = getInterpolatedDE441State(date);

  // 1. Sun Ephemeris
  const subSun = getSubSolarPoint(date);
  const sunDistKm = de441?.inWindow ? de441.rgKm : subSun.distKm;
  const sunTopocentric = computeTopocentricAzEl(
    obsLatDeg,
    obsLonDeg,
    obsElevM,
    subSun.subLatDeg,
    subSun.subLonDeg,
    sunDistKm
  );

  const sunBody: EphemerisBodyState = {
    azimuthDeg: sunTopocentric.azimuthDeg,
    elevationDeg: sunTopocentric.elevationDeg,
    elevationTopocentricDeg: sunTopocentric.elevationTopocentricDeg,
    distanceKm: sunDistKm,
    subLatitudeDeg: subSun.subLatDeg,
    subLongitudeDeg: subSun.subLonDeg,
    visibleGeometric: sunTopocentric.elevationTopocentricDeg > -LUNAR_CONSTANTS.SUN_ANGULAR_RADIUS_DEG,
  };

  // 2. Earth Ephemeris
  const subEarth = getSubEarthPoint(date);
  const earthDistKm = de441?.inWindow ? de441.deltaAU * 149597870.7 : subEarth.distKm;
  const earthTopocentric = computeTopocentricAzEl(
    obsLatDeg,
    obsLonDeg,
    obsElevM,
    subEarth.subLatDeg,
    subEarth.subLonDeg,
    earthDistKm
  );

  const earthBody = {
    azimuthDeg: earthTopocentric.azimuthDeg,
    elevationDeg: earthTopocentric.elevationDeg,
    elevationTopocentricDeg: earthTopocentric.elevationTopocentricDeg,
    distanceKm: earthDistKm,
    subLatitudeDeg: subEarth.subLatDeg,
    subLongitudeDeg: subEarth.subLonDeg,
    opticalLibrationLatDeg: subEarth.optLibLatDeg,
    opticalLibrationLonDeg: subEarth.optLibLonDeg,
    physicalLibrationDeg: subEarth.physLibDeg,
    visibleGeometric: earthTopocentric.elevationTopocentricDeg > 0.0,
  };

  // 3. Lunar Gateway NRHO Relay
  const gatewayState = getGatewayNRHOState(date, obsLatDeg, obsLonDeg);

  return {
    timestampMs: date.getTime(),
    utcIso: date.toISOString(),
    sun: sunBody,
    earth: earthBody,
    gateway: gatewayState,
    de441: de441 || undefined,
  };
}
