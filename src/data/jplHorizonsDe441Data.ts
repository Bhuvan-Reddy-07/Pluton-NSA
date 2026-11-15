/**
 * PLUTON - NASA JPL Horizons DE441 Ephemeris & Geophysical Ground-Truth Dataset
 * Source: NASA JPL Solar System Dynamics Group (DE441, 2026-Nov-14 to 2026-Dec-14)
 * Reference Epoch: Artemis III / Southern Polar Exploration Window
 */

export interface JPLGeophysicalData {
  volMeanRadiusKm: number;
  radiusGravityKm: number;
  radiusIauKm: number;
  massKg: number;
  densityGCm3: number;
  surfaceEmissivity: number;
  gmKm3S2: number;
  surfaceGravityMS2: number;
  earthMoonMassRatio: number;
  nearsideCrustThickKm: number;
  farsideCrustThickKm: number;
  meanCrustalDensityGCm3: number;
  heatFlowApollo15MWm2: number;
  heatFlowApollo17MWm2: number;
  geometricAlbedo: number;
  siderealRotRateRadS: number;
  meanSolarDayDays: number;
  orbitPeriodDays: number;
  obliquityToOrbitDeg: number;
  semiMajorAxisKm: number;
  eccentricity: number;
  meanMotionRadS: number;
  inclinationDeg: number;
  apsidalPeriodDays: number;
  nodalPeriodDays: number;
  solarConstantPerihelionWm2: number;
  solarConstantAphelionWm2: number;
  solarConstantMeanWm2: number;
  maxPlanetaryIRWm2: number;
  minPlanetaryIRWm2: number;
}

export const JPL_MOON_GEOPHYSICAL_DATA: JPLGeophysicalData = {
  volMeanRadiusKm: 1737.53,
  radiusGravityKm: 1738.0,
  radiusIauKm: 1737.4,
  massKg: 7.349e22,
  densityGCm3: 3.3437,
  surfaceEmissivity: 0.92,
  gmKm3S2: 4902.800066,
  surfaceGravityMS2: 1.62,
  earthMoonMassRatio: 81.3005690769,
  nearsideCrustThickKm: 58.0,
  farsideCrustThickKm: 85.0,
  meanCrustalDensityGCm3: 2.97,
  heatFlowApollo15MWm2: 3.1,
  heatFlowApollo17MWm2: 2.2,
  geometricAlbedo: 0.12,
  siderealRotRateRadS: 0.0000026617,
  meanSolarDayDays: 29.5306,
  orbitPeriodDays: 27.321582,
  obliquityToOrbitDeg: 6.67,
  semiMajorAxisKm: 384400.0,
  eccentricity: 0.0549,
  meanMotionRadS: 2.6616995e-6,
  inclinationDeg: 5.145,
  apsidalPeriodDays: 3231.5,
  nodalPeriodDays: 6798.38,
  solarConstantPerihelionWm2: 1414.0,
  solarConstantAphelionWm2: 1323.0,
  solarConstantMeanWm2: 1368.0,
  maxPlanetaryIRWm2: 1268.0,
  minPlanetaryIRWm2: 5.2,
};

export interface JPLObserverDayRecord {
  dateUtc: string;
  raHms: string;
  decDms: string;
  apMag: number;
  sBrt: number;
  deltaAU: number;
  deldotKmS: number;
  sotDeg: number;
  sotCode: '/T' | '/L';
  stoPhaseDeg: number;
  skyMotionArcsecMin: number;
  skyMotPaDeg: number;
  relVelAngDeg: number;
}

export interface JPLVectorDayRecord {
  jdTdb: number;
  dateTdb: string;
  xKm: number;
  yKm: number;
  zKm: number;
  vxKmS: number;
  vyKmS: number;
  vzKmS: number;
  ltSec: number;
  rgKm: number;
  rrKmS: number;
}

export interface JPLOsculatingElementRecord {
  jdTdb: number;
  dateTdb: string;
  ec: number; // Eccentricity
  qrKm: number; // Periapsis distance km
  inDeg: number; // Inclination deg
  omDeg: number; // Longitude of ascending node
  wDeg: number; // Argument of periapsis
  tpJd: number; // Time of periapsis JD
  nDegS: number; // Mean motion deg/s
  maDeg: number; // Mean anomaly deg
  taDeg: number; // True anomaly deg
  aKm: number; // Semi-major axis km
  adKm: number; // Apoapsis distance km
  prSec: number; // Orbital period sec
}

// 31 Daily Observer Table entries (DE441: Earth 399 -> Moon 301 GEOCENTRIC)
export const DE441_OBSERVER_TABLE: JPLObserverDayRecord[] = [
  { dateUtc: '2026-Nov-14 00:00', raHms: '18 58 49.82', decDms: '-26 06 33.8', apMag: -8.238, sBrt: 5.951, deltaAU: 0.00271137476442, deldotKmS: -0.0031111, sotDeg: 52.0277, sotCode: '/T', stoPhaseDeg: 127.8484, skyMotionArcsecMin: 29.504693, skyMotPaDeg: 80.286992, relVelAngDeg: -0.187946 },
  { dateUtc: '2026-Nov-15 00:00', raHms: '19 49 42.92', decDms: '-23 35 39.7', apMag: -8.838, sBrt: 5.728, deltaAU: 0.00270582095749, deldotKmS: -0.0163153, sotDeg: 62.7679, sotCode: '/T', stoPhaseDeg: 117.0927, skyMotionArcsecMin: 29.567132, skyMotPaDeg: 74.924468, relVelAngDeg: -0.969245 },
  { dateUtc: '2026-Nov-16 00:00', raHms: '20 38 34.74', decDms: '-20 04 01.2', apMag: -9.372, sBrt: 5.508, deltaAU: 0.00269238153874, deldotKmS: -0.0302685, sotDeg: 73.5795, sotCode: '/T', stoPhaseDeg: 106.2708, skyMotionArcsecMin: 29.818183, skyMotPaDeg: 70.378003, relVelAngDeg: -1.788216 },
  { dateUtc: '2026-Nov-17 00:00', raHms: '21 25 36.42', decDms: '-15 41 06.9', apMag: -9.853, sBrt: 5.295, deltaAU: 0.00267090120464, deldotKmS: -0.0439727, sotDeg: 84.5365, sotCode: '/T', stoPhaseDeg: 95.3095, skyMotionArcsecMin: 30.275466, skyMotPaDeg: 66.775930, relVelAngDeg: -2.576438 },
  { dateUtc: '2026-Nov-18 00:00', raHms: '22 11 21.63', decDms: '-10 36 23.6', apMag: -10.297, sBrt: 5.087, deltaAU: 0.00264186073691, deldotKmS: -0.0562345, sotDeg: 95.7192, sotCode: '/T', stoPhaseDeg: 84.1285, skyMotionArcsecMin: 30.945090, skyMotPaDeg: 64.190962, relVelAngDeg: -3.256410 },
  { dateUtc: '2026-Nov-19 00:00', raHms: '22 56 40.28', decDms: '-04 59 18.8', apMag: -10.713, sBrt: 4.877, deltaAU: 0.00260646788641, deldotKmS: -0.0657468, sotDeg: 107.2075, sotCode: '/T', stoPhaseDeg: 72.6482, skyMotionArcsecMin: 31.816787, skyMotPaDeg: 62.680045, relVelAngDeg: -3.750842 },
  { dateUtc: '2026-Nov-20 00:00', raHms: '23 42 33.96', decDms: '+00 59 48.4', apMag: -11.111, sBrt: 4.661, deltaAU: 0.00256668982271, deldotKmS: -0.0712125, sotDeg: 119.0716, sotCode: '/T', stoPhaseDeg: 60.7984, skyMotionArcsecMin: 32.858027, skyMotPaDeg: 62.316515, relVelAngDeg: -3.993121 },
  { dateUtc: '2026-Nov-21 00:00', raHms: '00 30 12.96', decDms: '+07 08 21.1', apMag: -11.497, sBrt: 4.431, deltaAU: 0.00252519871970, deldotKmS: -0.0715223, sotDeg: 131.3592, sotCode: '/T', stoPhaseDeg: 48.5309, skyMotionArcsecMin: 34.008332, skyMotPaDeg: 63.209037, relVelAngDeg: -3.937626 },
  { dateUtc: '2026-Nov-22 00:00', raHms: '01 20 52.46', decDms: '+13 09 39.8', apMag: -11.877, sBrt: 4.178, deltaAU: 0.00248519812358, deldotKmS: -0.0659870, sotDeg: 144.0753, sotCode: '/T', stoPhaseDeg: 35.8401, skyMotionArcsecMin: 35.176680, skyMotPaDeg: 65.501084, relVelAngDeg: -3.568534 },
  { dateUtc: '2026-Nov-23 00:00', raHms: '02 15 43.17', decDms: '+18 41 31.5', apMag: -12.252, sBrt: 3.899, deltaAU: 0.00245010764125, deldotKmS: -0.0545864, sotDeg: 157.1334, sotCode: '/T', stoPhaseDeg: 22.8112, skyMotionArcsecMin: 36.246359, skyMotPaDeg: 69.336829, relVelAngDeg: -2.905660 },
  { dateUtc: '2026-Nov-24 00:00', raHms: '03 15 30.40', decDms: '+23 16 04.7', apMag: -12.611, sBrt: 3.599, deltaAU: 0.00242311768544, deldotKmS: -0.0381526, sotDeg: 170.0059, sotCode: '/T', stoPhaseDeg: 9.9695, skyMotionArcsecMin: 37.091173, skyMotPaDeg: 74.772202, relVelAngDeg: -2.005610 },
  { dateUtc: '2026-Nov-25 00:00', raHms: '04 20 00.33', decDms: '+26 23 00.1', apMag: -12.699, sBrt: 3.530, deltaAU: 0.00240668480069, deldotKmS: -0.0183740, sotDeg: 172.7856, sotCode: '/L', stoPhaseDeg: 7.1970, skyMotionArcsecMin: 37.602416, skyMotPaDeg: 81.628996, relVelAngDeg: -0.956539 },
  { dateUtc: '2026-Nov-26 00:00', raHms: '05 27 31.19', decDms: '+27 37 08.5', apMag: -12.373, sBrt: 3.831, deltaAU: 0.00240209788044, deldotKmS: 0.0024596, sotDeg: 160.0878, sotCode: '/L', stoPhaseDeg: 19.8650, skyMotionArcsecMin: 37.718307, skyMotPaDeg: 89.370024, relVelAngDeg: 0.1341294 },
  { dateUtc: '2026-Nov-27 00:00', raHms: '06 35 08.27', decDms: '+26 48 01.6', apMag: -12.007, sBrt: 4.129, deltaAU: 0.00240926124907, deldotKmS: 0.0219343, sotDeg: 146.3379, sotCode: '/L', stoPhaseDeg: 33.5849, skyMotionArcsecMin: 37.442176, skyMotPaDeg: 97.158432, relVelAngDeg: 1.1572147 },
  { dateUtc: '2026-Nov-28 00:00', raHms: '07 39 54.96', decDms: '+24 04 23.4', apMag: -11.621, sBrt: 4.403, deltaAU: 0.00242677972118, deldotKmS: 0.0380449, sotDeg: 132.6151, sotCode: '/L', stoPhaseDeg: 47.2815, skyMotionArcsecMin: 36.839333, skyMotPaDeg: 104.15003, relVelAngDeg: 2.0202165 },
  { dateUtc: '2026-Nov-29 00:00', raHms: '08 40 05.72', decDms: '+19 49 35.1', apMag: -11.215, sBrt: 4.656, deltaAU: 0.00245231549609, deldotKmS: 0.0495733, sotDeg: 119.1340, sotCode: '/L', stoPhaseDeg: 60.7419, skyMotionArcsecMin: 36.014416, skyMotPaDeg: 109.78870, relVelAngDeg: 2.6614741 },
  { dateUtc: '2026-Nov-30 00:00', raHms: '09 35 24.04', decDms: '+14 32 11.6', apMag: -10.784, sBrt: 4.895, deltaAU: 0.00248308728658, deldotKmS: 0.0561954, sotDeg: 105.9883, sotCode: '/L', stoPhaseDeg: 73.8732, skyMotionArcsecMin: 35.081280, skyMotPaDeg: 113.87144, relVelAngDeg: 3.0565168 },
  { dateUtc: '2026-Dec-01 00:00', raHms: '10 26 34.85', decDms: '+08 38 43.8', apMag: -10.318, sBrt: 5.127, deltaAU: 0.00251635544404, deldotKmS: 0.0583402, sotDeg: 93.2117, sotCode: '/L', stoPhaseDeg: 86.6424, skyMotionArcsecMin: 34.138389, skyMotPaDeg: 116.42756, relVelAngDeg: 3.2160224 },
  { dateUtc: '2026-Dec-02 00:00', raHms: '11 14 50.14', decDms: '+02 30 51.0', apMag: -9.808, sBrt: 5.360, deltaAU: 0.00254978063872, deldotKmS: 0.0569143, sotDeg: 80.7989, sotCode: '/L', stoPhaseDeg: 99.0548, skyMotionArcsecMin: 33.255949, skyMotPaDeg: 117.57468, relVelAngDeg: 3.1772830 },
  { dateUtc: '2026-Dec-03 00:00', raHms: '12 01 27.02', decDms: '-03 34 21.6', apMag: -9.243, sBrt: 5.599, deltaAU: 0.00258161339630, deldotKmS: 0.0530080, sotDeg: 68.7211, sotCode: '/L', stoPhaseDeg: 111.1389, skyMotionArcsecMin: 32.473917, skyMotPaDeg: 117.43105, relVelAngDeg: 2.9922229 },
  { dateUtc: '2026-Dec-04 00:00', raHms: '12 47 37.49', decDms: '-09 22 54.1', apMag: -8.611, sBrt: 5.841, deltaAU: 0.00261072716780, deldotKmS: 0.0476548, sotDeg: 56.9391, sotCode: '/L', stoPhaseDeg: 122.9335, skyMotionArcsecMin: 31.806784, skyMotPaDeg: 116.08346, relVelAngDeg: 2.7150235 },
  { dateUtc: '2026-Dec-05 00:00', raHms: '13 34 23.53', decDms: '-14 42 19.4', apMag: -7.896, sBrt: 6.077, deltaAU: 0.00263653522561, deldotKmS: 0.0416710, sotDeg: 45.4146, sotCode: '/L', stoPhaseDeg: 134.4759, skyMotionArcsecMin: 31.251154, skyMotPaDeg: 113.59000, relVelAngDeg: 2.3917872 },
  { dateUtc: '2026-Dec-06 00:00', raHms: '14 22 32.94', decDms: '-19 20 42.0', apMag: -7.085, sBrt: 6.274, deltaAU: 0.00265883785546, deldotKmS: 0.0355732, sotDeg: 34.1211, sotCode: '/L', stoPhaseDeg: 145.7918, skyMotionArcsecMin: 30.793615, skyMotPaDeg: 110.00429, relVelAngDeg: 2.0537562 },
  { dateUtc: '2026-Dec-07 00:00', raHms: '15 12 33.42', decDms: '-23 06 19.3', apMag: -6.167, sBrt: 6.344, deltaAU: 0.00267764202494, deldotKmS: 0.0295630, sotDeg: 23.0662, sotCode: '/L', stoPhaseDeg: 156.8725, skyMotionArcsecMin: 30.417695, skyMotPaDeg: 105.41342, relVelAngDeg: 1.7146227 },
  { dateUtc: '2026-Dec-08 00:00', raHms: '16 04 25.72', decDms: '-25 48 18.7', apMag: -5.148, sBrt: 6.016, deltaAU: 0.00269298826675, deldotKmS: 0.0235652, sotDeg: 12.4144, sotCode: '/L', stoPhaseDeg: 167.5517, skyMotionArcsecMin: 30.109401, skyMotPaDeg: 99.980447, relVelAngDeg: 1.3716348 },
  { dateUtc: '2026-Dec-09 00:00', raHms: '16 57 39.69', decDms: '-27 18 02.5', apMag: -4.306, sBrt: 4.710, deltaAU: 0.00270481157721, deldotKmS: 0.0173050, sotDeg: 4.6282, sotCode: '/L', stoPhaseDeg: 175.3590, skyMotionArcsecMin: 29.861112, skyMotPaDeg: 93.972096, relVelAngDeg: 1.0096710 },
  { dateUtc: '2026-Dec-10 00:00', raHms: '17 51 19.15', decDms: '-27 30 52.0', apMag: -5.017, sBrt: 5.924, deltaAU: 0.00271285480789, deldotKmS: 0.0104100, sotDeg: 11.2775, sotCode: '/T', stoPhaseDeg: 168.6917, skyMotionArcsecMin: 29.673728, skyMotPaDeg: 87.747663, relVelAngDeg: 0.6072431 },
  { dateUtc: '2026-Dec-11 00:00', raHms: '18 44 17.61', decDms: '-26 27 15.2', apMag: -6.008, sBrt: 6.332, deltaAU: 0.00271664409838, deldotKmS: 0.0025206, sotDeg: 21.6064, sotCode: '/T', stoPhaseDeg: 158.3354, skyMotionArcsecMin: 29.557125, skyMotPaDeg: 81.701158, relVelAngDeg: 0.1434009 },
  { dateUtc: '2026-Dec-12 00:00', raHms: '19 35 38.97', decDms: '-24 12 34.9', apMag: -6.897, sBrt: 6.296, deltaAU: 0.00271552690777, deldotKmS: -0.0066060, sotDeg: 32.2248, sotCode: '/T', stoPhaseDeg: 147.6909, skyMotionArcsecMin: 29.529128, skyMotPaDeg: 76.183086, relVelAngDeg: -0.395394 },
  { dateUtc: '2026-Dec-13 00:00', raHms: '20 24 52.86', decDms: '-20 55 40.1', apMag: -7.676, sBrt: 6.122, deltaAU: 0.00270876540886, deldotKmS: -0.0170100, sotDeg: 42.9359, sotCode: '/T', stoPhaseDeg: 136.9567, skyMotionArcsecMin: 29.613338, skyMotPaDeg: 71.445966, relVelAngDeg: -1.009271 },
  { dateUtc: '2026-Dec-14 00:00', raHms: '21 11 58.90', decDms: '-16 46 52.2', apMag: -8.362, sBrt: 5.904, deltaAU: 0.00269567259121, deldotKmS: -0.0284674, sotDeg: 53.7402, sotCode: '/T', stoPhaseDeg: 126.1332, skyMotionArcsecMin: 29.836176, skyMotPaDeg: 67.636922, relVelAngDeg: -1.680643 },
];

// 31 Daily Vector Table entries (DE441: Solar System Barycenter 0 -> Moon 301, Ecliptic J2000)
export const DE441_VECTOR_TABLE: JPLVectorDayRecord[] = [
  { jdTdb: 2461358.5, dateTdb: '2026-Nov-14 00:00', xKm: 9.2601133238e7, yKm: 1.1430491079e8, zKm: -17751.17, vxKmS: -22.7772, vyKmS: 18.7551, vzKmS: 0.0612, ltSec: 490.697, rgKm: 1.47107385e8, rrKmS: 0.2352 },
  { jdTdb: 2461359.5, dateTdb: '2026-Nov-15 00:00', xKm: 9.0616391678e7, yKm: 1.1591625084e8, zKm: -11972.27, vxKmS: -23.1714, vyKmS: 18.5412, vzKmS: 0.0720, ltSec: 490.780, rgKm: 1.47132279e8, rrKmS: 0.3365 },
  { jdTdb: 2461360.5, dateTdb: '2026-Nov-16 00:00', xKm: 8.8596161661e7, yKm: 1.1750819935e8, zKm: -5394.83, vxKmS: -23.5982, vyKmS: 18.3051, vzKmS: 0.0796, ltSec: 490.888, rgKm: 1.47164726e8, rrKmS: 0.4096 },
  { jdTdb: 2461361.5, dateTdb: '2026-Nov-17 00:00', xKm: 8.6537762872e7, yKm: 1.1907852750e8, zKm: 1683.27, vxKmS: -24.0544, vyKmS: 18.0395, vzKmS: 0.0835, ltSec: 491.013, rgKm: 1.47202174e8, rrKmS: 0.4518 },
  { jdTdb: 2461362.5, dateTdb: '2026-Nov-18 00:00', xKm: 8.4438824620e7, yKm: 1.2062438511e8, zKm: 8933.22, vxKmS: -24.5358, vyKmS: 17.7374, vzKmS: 0.0835, ltSec: 491.145, rgKm: 1.47241833e8, rrKmS: 0.4603 },
  { jdTdb: 2461363.5, dateTdb: '2026-Nov-19 00:00', xKm: 8.2297388017e7, yKm: 1.2214229324e8, zKm: 16000.31, vxKmS: -25.0371, vyKmS: 17.3913, vzKmS: 0.0793, ltSec: 491.275, rgKm: 1.47280684e8, rrKmS: 0.4327 },
  { jdTdb: 2461364.5, dateTdb: '2026-Nov-20 00:00', xKm: 8.0112048868e7, yKm: 1.2362814270e8, zKm: 22511.73, vxKmS: -25.5507, vyKmS: 16.9941, vzKmS: 0.0706, ltSec: 491.391, rgKm: 1.47315506e8, rrKmS: 0.3668 },
  { jdTdb: 2461365.5, dateTdb: '2026-Nov-21 00:00', xKm: 7.7882151028e7, yKm: 1.2507722762e8, zKm: 28089.40, vxKmS: -26.0666, vyKmS: 16.5393, vzKmS: 0.0577, ltSec: 491.483, rgKm: 1.47342943e8, rrKmS: 0.2617 },
  { jdTdb: 2461366.5, dateTdb: '2026-Nov-22 00:00', xKm: 7.5608023523e7, yKm: 1.2648435448e8, zKm: 32370.51, vxKmS: -26.5721, vyKmS: 16.0224, vzKmS: 0.0407, ltSec: 491.538, rgKm: 1.47359649e8, rrKmS: 0.1188 },
  { jdTdb: 2461367.5, dateTdb: '2026-Nov-23 00:00', xKm: 7.3291226608e7, yKm: 1.2784407057e8, zKm: 35037.10, vxKmS: -27.0516, vyKmS: 15.4421, vzKmS: 0.0205, ltSec: 491.548, rgKm: 1.47362517e8, rrKmS: -0.0574 },
  { jdTdb: 2461368.5, dateTdb: '2026-Nov-24 00:00', xKm: 7.0934737113e7, yKm: 1.2915103707e8, zKm: 35852.76, vxKmS: -27.4881, vyKmS: 14.8025, vzKmS: -0.0018, ltSec: 491.503, rgKm: 1.47349002e8, rrKmS: -0.2585 },
  { jdTdb: 2461369.5, dateTdb: '2026-Nov-25 00:00', xKm: 6.8542979810e7, yKm: 1.3040052536e8, zKm: 34700.17, vxKmS: -27.8655, vyKmS: 14.1138, vzKmS: -0.0247, ltSec: 491.398, rgKm: 1.47317474e8, rrKmS: -0.4720 },
  { jdTdb: 2461370.5, dateTdb: '2026-Nov-26 00:00', xKm: 6.6121626405e7, yKm: 1.3158894765e8, zKm: 31608.81, vxKmS: -28.1716, vyKmS: 13.3920, vzKmS: -0.0464, ltSec: 491.231, rgKm: 1.47267517e8, rrKmS: -0.6825 },
  { jdTdb: 2461371.5, dateTdb: '2026-Nov-27 00:00', xKm: 6.3677151400e7, yKm: 1.3271428366e8, zKm: 26762.50, vxKmS: -28.4004, vyKmS: 12.6569, vzKmS: -0.0651, ltSec: 491.006, rgKm: 1.47200072e8, rrKmS: -0.8743 },
  { jdTdb: 2461372.5, dateTdb: '2026-Nov-28 00:00', xKm: 6.1216229536e7, yKm: 1.3377627586e8, zKm: 20481.94, vxKmS: -28.5531, vyKmS: 11.9290, vzKmS: -0.0794, ltSec: 490.730, rgKm: 1.47117365e8, rrKmS: -1.0338 },
  { jdTdb: 2461373.5, dateTdb: '2026-Nov-29 00:00', xKm: 5.8745124108e7, yKm: 1.3477634537e8, zKm: 13186.49, vxKmS: -28.6379, vyKmS: 11.2262, vzKmS: -0.0885, ltSec: 490.414, rgKm: 1.47022627e8, rrKmS: -1.1515 },
  { jdTdb: 2461374.5, dateTdb: '2026-Nov-30 00:00', xKm: 5.6269205962e7, yKm: 1.3571728124e8, zKm: 5346.56, vxKmS: -28.6669, vyKmS: 10.5620, vzKmS: -0.0920, ltSec: 490.071, rgKm: 1.46919719e8, rrKmS: -1.2225 },
  { jdTdb: 2461375.5, dateTdb: '2026-Dec-01 00:00', xKm: 5.3792672756e7, yKm: 1.3660281635e8, zKm: -2561.89, vxKmS: -28.6546, vyKmS: 9.9447, vzKmS: -0.0901, ltSec: 489.714, rgKm: 1.46812741e8, rrKmS: -1.2459 },
  { jdTdb: 2461376.5, dateTdb: '2026-Dec-02 00:00', xKm: 5.1318459233e7, yKm: 1.3743720083e8, zKm: -10093.05, vxKmS: -28.6155, vyKmS: 9.3782, vzKmS: -0.0834, ltSec: 489.357, rgKm: 1.46705720e8, rrKmS: -1.2241 },
  { jdTdb: 2461377.5, dateTdb: '2026-Dec-03 00:00', xKm: 4.8848283220e7, yKm: 1.3822484090e8, zKm: -16855.16, vxKmS: -28.5632, vyKmS: 8.8624, vzKmS: -0.0724, ltSec: 489.012, rgKm: 1.46602393e8, rrKmS: -1.1613 },
  { jdTdb: 2461378.5, dateTdb: '2026-Dec-04 00:00', xKm: 4.6382765486e7, yKm: 1.3897002404e8, zKm: -22524.35, vxKmS: -28.5095, vyKmS: 8.3948, vzKmS: -0.0582, ltSec: 488.691, rgKm: 1.46506071e8, rrKmS: -1.0629 },
  { jdTdb: 2461379.5, dateTdb: '2026-Dec-05 00:00', xKm: 4.3921577967e7, yKm: 1.3967672150e8, zKm: -26851.44, vxKmS: -28.4645, vyKmS: 7.9707, vzKmS: -0.0415, ltSec: 488.403, rgKm: 1.46419576e8, rrKmS: -0.9348 },
  { jdTdb: 2461380.5, dateTdb: '2026-Dec-06 00:00', xKm: 4.1463596167e7, yKm: 1.4034844829e8, zKm: -29664.22, vxKmS: -28.4366, vyKmS: 7.5842, vzKmS: -0.0233, ltSec: 488.155, rgKm: 1.46345200e8, rrKmS: -0.7834 },
  { jdTdb: 2461381.5, dateTdb: '2026-Dec-07 00:00', xKm: 3.9007047477e7, yKm: 1.4098816265e8, zKm: -30867.06, vxKmS: -28.4323, vyKmS: 7.2284, vzKmS: -0.0044, ltSec: 487.953, rgKm: 1.46284697e8, rrKmS: -0.6147 },
  { jdTdb: 2461382.5, dateTdb: '2026-Dec-08 00:00', xKm: 3.6549655301e7, yKm: 1.4159819387e8, zKm: -30438.69, vxKmS: -28.4568, vyKmS: 6.8958, vzKmS: 0.0142, ltSec: 487.801, rgKm: 1.46239279e8, rrKmS: -0.4352 },
  { jdTdb: 2461383.5, dateTdb: '2026-Dec-09 00:00', xKm: 3.4088780559e7, yKm: 1.4218019358e8, zKm: -28428.16, vxKmS: -28.5134, vyKmS: 6.5782, vzKmS: 0.0320, ltSec: 487.702, rgKm: 1.46209620e8, rrKmS: -0.2509 },
  { jdTdb: 2461384.5, dateTdb: '2026-Dec-10 00:00', xKm: 3.1621560311e7, yKm: 1.4273510953e8, zKm: -24949.41, vxKmS: -28.6038, vyKmS: 6.2675, vzKmS: 0.0481, ltSec: 487.656, rgKm: 1.46195879e8, rrKmS: -0.0677 },
  { jdTdb: 2461385.5, dateTdb: '2026-Dec-11 00:00', xKm: 2.9145040625e7, yKm: 1.4326318133e8, zKm: -20174.36, vxKmS: -28.7286, vyKmS: 5.9554, vzKmS: 0.0619, ltSec: 487.663, rgKm: 1.46197718e8, rrKmS: 0.1087 },
  { jdTdb: 2461386.5, dateTdb: '2026-Dec-12 00:00', xKm: 2.6656299443e7, yKm: 1.4376395530e8, zKm: -14325.16, vxKmS: -28.8865, vyKmS: 5.6343, vzKmS: 0.0729, ltSec: 487.718, rgKm: 1.46214340e8, rrKmS: 0.2736 },
  { jdTdb: 2461387.5, dateTdb: '2026-Dec-13 00:00', xKm: 2.4152556165e7, yKm: 1.4423631323e8, zKm: -7666.05, vxKmS: -29.0754, vyKmS: 5.2965, vzKmS: 0.0806, ltSec: 487.819, rgKm: 1.46244521e8, rrKmS: 0.4219 },
  { jdTdb: 2461388.5, dateTdb: '2026-Dec-14 00:00', xKm: 2.1631267821e7, yKm: 1.4467850771e8, zKm: -495.39, vxKmS: -29.2920, vyKmS: 4.9349, vzKmS: 0.0847, ltSec: 487.959, rgKm: 1.46286644e8, rrKmS: 0.5493 },
];

// 31 Daily Osculating Elements entries (DE441: Sun 10 -> Moon 301, Ecliptic J2000)
export const DE441_ORBITAL_ELEMENTS_TABLE: JPLOsculatingElementRecord[] = [
  { jdTdb: 2461358.5, dateTdb: '2026-Nov-14 00:00', ec: 0.0318856, qrKm: 1.38869491e8, inDeg: 0.1200, omDeg: 56.8859, wDeg: 192.0397, tpJd: 2461205.069, nDegS: 1.214949e-5, maDeg: 161.059, taDeg: 162.2018, aKm: 1.43443265e8, adKm: 1.4801704e8, prSec: 2.9630862e7 },
  { jdTdb: 2461359.5, dateTdb: '2026-Nov-15 00:00', ec: 0.0230208, qrKm: 1.41751942e8, inDeg: 0.1400, omDeg: 56.1295, wDeg: 210.6470, tpJd: 2461220.122, nDegS: 1.194299e-5, maDeg: 143.820, taDeg: 145.3420, aKm: 1.45092077e8, adKm: 1.4843221e8, prSec: 3.0143216e7 },
  { jdTdb: 2461360.5, dateTdb: '2026-Nov-16 00:00', ec: 0.0167400, qrKm: 1.44515879e8, inDeg: 0.1535, omDeg: 55.8169, wDeg: 245.5614, tpJd: 2461251.867, nDegS: 1.171407e-5, maDeg: 109.947, taDeg: 111.7371, aKm: 1.46976265e8, adKm: 1.4943665e8, prSec: 3.0732285e7 },
  { jdTdb: 2461361.5, dateTdb: '2026-Nov-17 00:00', ec: 0.0186003, qrKm: 1.46285869e8, inDeg: 0.1598, omDeg: 55.7256, wDeg: 292.2539, tpJd: 2461296.714, nDegS: 1.146948e-5, maDeg: 64.201, taDeg: 66.1392, aKm: 1.49058402e8, adKm: 1.5183093e8, prSec: 3.1387645e7 },
  { jdTdb: 2461362.5, dateTdb: '2026-Nov-18 00:00', ec: 0.0279142, qrKm: 1.47067223e8, inDeg: 0.1586, omDeg: 55.7301, wDeg: 320.9470, tpJd: 2461324.843, nDegS: 1.121661e-5, maDeg: 36.494, taDeg: 38.4513, aKm: 1.51290374e8, adKm: 1.5551352e8, prSec: 3.2095267e7 },
  { jdTdb: 2461363.5, dateTdb: '2026-Nov-19 00:00', ec: 0.0399179, qrKm: 1.47475357e8, inDeg: 0.1495, omDeg: 55.7313, wDeg: 336.0337, tpJd: 2461339.703, nDegS: 1.096382e-5, maDeg: 22.542, taDeg: 24.3799, aKm: 1.53607022e8, adKm: 1.5973869e8, prSec: 3.2835274e7 },
  { jdTdb: 2461364.5, dateTdb: '2026-Nov-20 00:00', ec: 0.0524377, qrKm: 1.47742920e8, inDeg: 0.1324, omDeg: 55.6069, wDeg: 345.7741, tpJd: 2461349.157, nDegS: 1.072087e-5, maDeg: 14.212, taDeg: 15.7870, aKm: 1.55918956e8, adKm: 1.6409499e8, prSec: 3.3579360e7 },
  { jdTdb: 2461365.5, dateTdb: '2026-Nov-21 00:00', ec: 0.0643723, qrKm: 1.47929029e8, inDeg: 0.1076, omDeg: 55.1233, wDeg: 353.5375, tpJd: 2461356.273, nDegS: 1.049912e-5, maDeg: 8.370, taDeg: 9.5366, aKm: 1.58106721e8, adKm: 1.6828441e8, prSec: 3.4288583e7 },
  { jdTdb: 2461366.5, dateTdb: '2026-Nov-22 00:00', ec: 0.0748452, qrKm: 1.48043618e8, inDeg: 0.0760, omDeg: 53.6168, wDeg: 1.2510, tpJd: 2461362.294, nDegS: 1.031135e-5, maDeg: 3.747, taDeg: 4.3646, aKm: 1.60020382e8, adKm: 1.7199715e8, prSec: 3.4912986e7 },
  { jdTdb: 2461367.5, dateTdb: '2026-Nov-23 00:00', ec: 0.0830387, qrKm: 1.48080033e8, inDeg: 0.0391, omDeg: 47.7406, wDeg: 12.8703, tpJd: 2461367.825, nDegS: 1.017092e-5, maDeg: 359.714, taDeg: 359.6612, aKm: 1.61489952e8, adKm: 1.7489987e8, prSec: 3.5395031e7 },
  { jdTdb: 2461368.5, dateTdb: '2026-Nov-24 00:00', ec: 0.0882332, qrKm: 1.48025916e8, inDeg: 0.0093, omDeg: 312.8209, wDeg: 113.4255, tpJd: 2461373.222, nDegS: 1.009015e-5, maDeg: 355.884, taDeg: 355.0686, aKm: 1.62350627e8, adKm: 1.7667534e8, prSec: 3.5678369e7 },
  { jdTdb: 2461369.5, dateTdb: '2026-Nov-25 00:00', ec: 0.0899287, qrKm: 1.47868517e8, inDeg: 0.0457, omDeg: 252.9055, wDeg: 179.1290, tpJd: 2461378.747, nDegS: 1.007809e-5, maDeg: 351.948, taDeg: 350.3249, aKm: 1.62480143e8, adKm: 1.7709177e8, prSec: 3.5721072e7 },
  { jdTdb: 2461370.5, dateTdb: '2026-Nov-26 00:00', ec: 0.0879777, qrKm: 1.47597538e8, inDeg: 0.0850, omDeg: 248.2423, wDeg: 189.9785, tpJd: 2461384.650, nDegS: 1.013837e-5, maDeg: 347.605, taDeg: 345.1828, aKm: 1.61835450e8, adKm: 1.7607336e8, prSec: 3.5508680e7 },
  { jdTdb: 2461371.5, dateTdb: '2026-Nov-27 00:00', ec: 0.0826646, qrKm: 1.47205252e8, inDeg: 0.1196, omDeg: 246.9889, wDeg: 198.1080, tpJd: 2461391.221, nDegS: 1.026800e-5, maDeg: 342.505, taDeg: 339.3486, aKm: 1.60470477e8, adKm: 1.7373570e8, prSec: 3.5060391e7 },
  { jdTdb: 2461372.5, dateTdb: '2026-Nov-28 00:00', ec: 0.0746963, qrKm: 1.46682977e8, inDeg: 0.1467, omDeg: 246.6102, wDeg: 206.4575, tpJd: 2461398.852, nDegS: 1.045768e-5, maDeg: 336.190, taDeg: 332.4160, aKm: 1.58524144e8, adKm: 1.7036531e8, prSec: 3.4424462e7 },
  { jdTdb: 2461373.5, dateTdb: '2026-Nov-29 00:00', ec: 0.0651244, qrKm: 1.46013223e8, inDeg: 0.1645, omDeg: 246.5389, wDeg: 216.1952, tpJd: 2461408.110, nDegS: 1.069352e-5, maDeg: 328.023, taDeg: 323.7828, aKm: 1.56184662e8, adKm: 1.6635610e8, prSec: 3.3665232e7 },
  { jdTdb: 2461374.5, dateTdb: '2026-Nov-30 00:00', ec: 0.0552604, qrKm: 1.45157524e8, inDeg: 0.1724, omDeg: 246.5564, wDeg: 228.4089, tpJd: 2461419.793, nDegS: 1.095941e-5, maDeg: 317.112, taDeg: 312.5785, aKm: 1.53648177e8, adKm: 1.6213883e8, prSec: 3.2848471e7 },
  { jdTdb: 2461375.5, dateTdb: '2026-Dec-01 00:00', ec: 0.0466220, qrKm: 1.44044009e8, inDeg: 0.1704, omDeg: 246.5332, wDeg: 244.2495, tpJd: 2461434.785, nDegS: 1.123915e-5, maDeg: 302.431, taDeg: 297.7814, aKm: 1.51088036e8, adKm: 1.5813206e8, prSec: 3.2030901e7 },
  { jdTdb: 2461376.5, dateTdb: '2026-Dec-02 00:00', ec: 0.0407877, qrKm: 1.42577832e8, inDeg: 0.1590, omDeg: 246.3469, wDeg: 264.1882, tpJd: 2461453.237, nDegS: 1.151788e-5, maDeg: 283.635, taDeg: 279.0428, aKm: 1.48640533e8, adKm: 1.5470323e8, prSec: 3.1255750e7 },
  { jdTdb: 2461377.5, dateTdb: '2026-Dec-03 00:00', ec: 0.0387913, qrKm: 1.40724747e8, inDeg: 0.1395, omDeg: 245.8185, wDeg: 286.5027, tpJd: 2461473.134, nDegS: 1.178282e-5, maDeg: 262.641, taDeg: 258.2640, aKm: 1.46403953e8, adKm: 1.5208316e8, prSec: 3.0552957e7 },
  { jdTdb: 2461378.5, dateTdb: '2026-Dec-04 00:00', ec: 0.0402617, qrKm: 1.38629074e8, inDeg: 0.1133, omDeg: 244.5906, wDeg: 307.8533, tpJd: 2461490.969, nDegS: 1.202337e-5, maDeg: 243.165, taDeg: 239.1428, aKm: 1.44444655e8, adKm: 1.5026024e8, prSec: 2.9941686e7 },
  { jdTdb: 2461379.5, dateTdb: '2026-Dec-05 00:00', ec: 0.0436568, qrKm: 1.36570611e8, inDeg: 0.0821, omDeg: 241.7198, wDeg: 327.0107, tpJd: 2461504.976, nDegS: 1.223104e-5, maDeg: 227.402, taDeg: 223.8526, aKm: 1.42805022e8, adKm: 1.4903943e8, prSec: 2.9433321e7 },
  { jdTdb: 2461380.5, dateTdb: '2026-Dec-06 00:00', ec: 0.0473908, qrKm: 1.34804196e8, inDeg: 0.0484, omDeg: 233.5470, wDeg: 347.8456, tpJd: 2461515.697, nDegS: 1.239925e-5, maDeg: 215.164, taDeg: 212.1825, aKm: 1.41510494e8, adKm: 1.4821679e8, prSec: 2.9034009e7 },
  { jdTdb: 2461381.5, dateTdb: '2026-Dec-07 00:00', ec: 0.0503811, qrKm: 1.33492444e8, inDeg: 0.0191, omDeg: 191.4056, wDeg: 40.0790, tpJd: 2461524.360, nDegS: 1.252326e-5, maDeg: 205.424, taDeg: 203.0797, aKm: 1.40574751e8, adKm: 1.4765706e8, prSec: 2.8746504e7 },
  { jdTdb: 2461382.5, dateTdb: '2026-Dec-08 00:00', ec: 0.0520034, qrKm: 1.32722508e8, inDeg: 0.0328, omDeg: 106.5357, wDeg: 133.4428, tpJd: 2461532.012, nDegS: 1.260003e-5, maDeg: 197.235, taDeg: 195.5727, aKm: 1.40003152e8, adKm: 1.4728380e8, prSec: 2.8571350e7 },
  { jdTdb: 2461383.5, dateTdb: '2026-Dec-09 00:00', ec: 0.0519396, qrKm: 1.32534025e8, inDeg: 0.0650, omDeg: 90.8583, wDeg: 156.7606, tpJd: 2461539.421, nDegS: 1.262820e-5, maDeg: 189.878, taDeg: 188.9183, aKm: 1.39794911e8, adKm: 1.4705580e8, prSec: 2.8507628e7 },
  { jdTdb: 2461384.5, dateTdb: '2026-Dec-10 00:00', ec: 0.0500750, qrKm: 1.32936815e8, inDeg: 0.0957, omDeg: 86.3736, wDeg: 168.6433, tpJd: 2461547.199, nDegS: 1.260795e-5, maDeg: 182.767, taDeg: 182.5066, aKm: 1.39944533e8, adKm: 1.4695225e8, prSec: 2.8553408e7 },
  { jdTdb: 2461385.5, dateTdb: '2026-Dec-11 00:00', ec: 0.0464513, qrKm: 1.33919088e8, inDeg: 0.1221, omDeg: 84.5549, wDeg: 178.2390, tpJd: 2461223.710, nDegS: 1.254091e-5, maDeg: 175.306, taDeg: 175.7173, aKm: 1.40442839e8, adKm: 1.4696659e8, prSec: 2.8706050e7 },
  { jdTdb: 2461386.5, dateTdb: '2026-Dec-12 00:00', ec: 0.0412662, qrKm: 1.35447708e8, inDeg: 0.1429, omDeg: 83.7432, wDeg: 188.0389, tpJd: 2461231.295, nDegS: 1.242991e-5, maDeg: 166.682, taDeg: 167.7191, aKm: 1.41277703e8, adKm: 1.4710770e8, prSec: 2.8962396e7 },
  { jdTdb: 2461387.5, dateTdb: '2026-Dec-13 00:00', ec: 0.0349461, qrKm: 1.37456918e8, inDeg: 0.1570, omDeg: 83.4009, wDeg: 199.9883, tpJd: 2461240.916, nDegS: 1.227880e-5, maDeg: 155.509, taDeg: 157.1054, aKm: 1.42434446e8, adKm: 1.4741197e8, prSec: 2.9318827e7 },
  { jdTdb: 2461388.5, dateTdb: '2026-Dec-14 00:00', ec: 0.0283939, qrKm: 1.39809816e8, inDeg: 0.1640, omDeg: 83.2950, wDeg: 216.9779, tpJd: 2461255.315, nDegS: 1.209226e-5, maDeg: 139.147, taDeg: 141.2196, aKm: 1.43895575e8, adKm: 1.4798133e8, prSec: 2.9771122e7 },
];

/**
 * High-precision interpolation helper for the DE441 ephemeris dataset.
 * Given any timestamp within the 2026-Nov-14 to 2026-Dec-14 window,
 * returns the interpolated state vector, range, range rate, and elongation.
 */
export function getInterpolatedDE441State(date: Date): {
  inWindow: boolean;
  deltaAU: number;
  deldotKmS: number;
  sotDeg: number;
  phaseDeg: number;
  xKm: number;
  yKm: number;
  zKm: number;
  rgKm: number;
  rrKmS: number;
  trueAnomalyDeg: number;
  eccentricity: number;
  solarConstantWm2: number;
} | null {
  const tStart = Date.UTC(2026, 10, 14, 0, 0, 0); // 2026-Nov-14
  const tEnd = Date.UTC(2026, 11, 14, 0, 0, 0); // 2026-Dec-14
  const t = date.getTime();

  if (t < tStart || t > tEnd) {
    return null;
  }

  const dayFraction = (t - tStart) / 86400000.0;
  const idx = Math.min(DE441_OBSERVER_TABLE.length - 2, Math.floor(dayFraction));
  const frac = dayFraction - idx;

  const obs0 = DE441_OBSERVER_TABLE[idx];
  const obs1 = DE441_OBSERVER_TABLE[idx + 1];

  const vec0 = DE441_VECTOR_TABLE[idx];
  const vec1 = DE441_VECTOR_TABLE[idx + 1];

  const orb0 = DE441_ORBITAL_ELEMENTS_TABLE[idx];
  const orb1 = DE441_ORBITAL_ELEMENTS_TABLE[idx + 1];

  const deltaAU = obs0.deltaAU + frac * (obs1.deltaAU - obs0.deltaAU);
  const deldotKmS = obs0.deldotKmS + frac * (obs1.deldotKmS - obs0.deldotKmS);
  const sotDeg = obs0.sotDeg + frac * (obs1.sotDeg - obs0.sotDeg);
  const phaseDeg = obs0.stoPhaseDeg + frac * (obs1.stoPhaseDeg - obs0.stoPhaseDeg);

  const xKm = vec0.xKm + frac * (vec1.xKm - vec0.xKm);
  const yKm = vec0.yKm + frac * (vec1.yKm - vec0.yKm);
  const zKm = vec0.zKm + frac * (vec1.zKm - vec0.zKm);
  const rgKm = vec0.rgKm + frac * (vec1.rgKm - vec0.rgKm);
  const rrKmS = vec0.rrKmS + frac * (vec1.rrKmS - vec0.rrKmS);

  const trueAnomalyDeg = orb0.taDeg + frac * (orb1.taDeg - orb0.taDeg);
  const eccentricity = orb0.ec + frac * (orb1.ec - orb0.ec);

  // Solar flux inversely proportional to square of heliocentric distance
  // S = S_mean * (1 AU / R_helio)^2
  const rHelioAU = rgKm / 149597870.7;
  const solarConstantWm2 = JPL_MOON_GEOPHYSICAL_DATA.solarConstantMeanWm2 / (rHelioAU * rHelioAU);

  return {
    inWindow: true,
    deltaAU,
    deldotKmS,
    sotDeg,
    phaseDeg,
    xKm,
    yKm,
    zKm,
    rgKm,
    rrKmS,
    trueAnomalyDeg,
    eccentricity,
    solarConstantWm2: Math.round(solarConstantWm2),
  };
}

