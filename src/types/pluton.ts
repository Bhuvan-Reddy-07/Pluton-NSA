/**
 * PLUTON (Polar Lunar Utilities, Topography & Orbital Navigator)
 * Core Type Definitions
 * NASA JPL / CSA Aerospace Systems Standards
 */

export type SolarArrayType = 'vertical' | 'horizontal';
export type DTECommState = 'NOMINAL_DTE' | 'MULTIPATH_GRAZING' | 'BLOCKED' | 'NOMINAL';
export type DSNGroundStation = 'Goldstone' | 'Madrid' | 'Canberra';
export type UserPersona = 'engineer' | 'educator';

export interface LunarSite {
  id: string;
  name: string;
  latitude: number; // deg S: -90 to -60 (stored as negative or signed decimal)
  longitude: number; // deg E: 0 to 360
  elevation: number; // meters above 1737.4 km reference sphere
  description: string;
  missionRole: string;
  peakIlluminationSummerPct: number;
  psrProximityKm: number;
  roughnessScore: number; // 0 (smooth plateau) to 1.0 (extreme crater wall)
  keyFeatures: string[];
}

export interface HardwareProfile {
  id: string;
  name: string;
  type: string;
  mastHeight: number; // meters
  arrayType: SolarArrayType;
  panelArea: number; // m²
  panelEfficiency: number; // e.g. 0.32 (32% advanced GaInP/GaAs multi-junction)
  batteryCapacityWh: number; // Wh
  baseLoadW: number; // continuous avionics & payload power
  eclipseHeaterW: number; // cryogenic survival heaters
  basePowerW: number; // alias for baseLoadW
  heaterPowerW: number; // alias for eclipseHeaterW
  massKg: number;
  description: string;
}

export interface EphemerisBodyState {
  azimuthDeg: number; // 0° = North, 90° = East, 180° = South, 270° = West
  elevationDeg: number; // Uncorrected geometric elevation
  elevationTopocentricDeg: number; // Topocentric with horizontal parallax correction
  distanceKm: number;
  subLatitudeDeg: number;
  subLongitudeDeg: number;
  visibleGeometric: boolean;
}

export interface DE441InterpolatedState {
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
}

export interface EphemerisState {
  timestampMs: number;
  utcIso: string;
  sun: EphemerisBodyState;
  earth: EphemerisBodyState & {
    opticalLibrationLatDeg: number; // Earth libration in latitude (±6.68°)
    opticalLibrationLonDeg: number; // Earth libration in longitude (±7.9°)
    physicalLibrationDeg: number;
  };
  gateway: {
    azimuthDeg: number;
    elevationDeg: number;
    distanceKm: number;
    inWindow: boolean;
    trueAnomalyDeg: number;
    orbitalPeriodDays: number;
  };
  de441?: DE441InterpolatedState;
}

export interface TerrainPeak {
  azimuthDeg: number;
  elevationDeg: number;
  name: string;
  distanceKm: number;
}

export interface TerrainHorizonProfile {
  siteId: string;
  latitude: number;
  longitude: number;
  baseElevationM: number;
  mastHeightM: number;
  azimuthStepDeg: number; // 1 degree (360 samples)
  horizonElevationDeg: number[]; // Profile at mast = 0m
  horizonElevationWithMastDeg: number[]; // Profile adjusted for mast height z_mast
  maxHorizonEl: number;
  minHorizonEl: number;
  prominentPeaks: TerrainPeak[];
}

export interface PhysicsTimeStep {
  stepIndex: number;
  timestampMs: number;
  utcIso: string;
  sunAzDeg: number;
  sunElDeg: number;
  horizonElAtSunDeg: number;
  sunDeltaDeg: number; // sunEl - horizonEl
  penumbraFraction: number; // [0, 1] 0=umbra, 1=full sun, (0,1)=partial penumbra
  verticalSolarFluxW: number; // W for specified panelArea
  horizontalSolarFluxW: number; // W for specified panelArea
  generatedPowerW: number; // Actual power generated based on selected arrayType
  earthAzDeg: number;
  earthElDeg: number;
  horizonElAtEarthDeg: number;
  earthDeltaDeg: number; // earthEl - horizonEl
  dteCommState: DTECommState;
  gatewayInRelay: boolean;
  jointViable: boolean;
  batterySoCWh: number;
  batterySoCPct: number;
  surfaceTempK: number;
  heaterActive: boolean;
  heaterLoadW: number;
  netPowerW: number;
}

export interface MissionAnalysisSummary {
  siteId: string;
  hardwareId: string;
  mastHeightM: number;
  arrayType: SolarArrayType;
  startTimeMs: number;
  durationDays: number;
  totalHours: number;
  sunlitHours: number;
  sunlitPct: number;
  penumbralHours: number;
  totalEclipseHours: number;
  maxContinuousEclipseHours: number;
  batterySurvivalLimitHours: number;
  isBatteryDepleted: boolean;
  batteryDepletionTimestampMs?: number;
  dteNominalHours: number;
  dteNominalPct: number;
  dteMultipathHours: number;
  dteBlockedHours: number;
  gatewayRelayHours: number;
  gatewayRelayPct: number;
  jointGoHours: number;
  jointGoPct: number;
  minBatterySoCWh: number;
  minBatterySoCPct: number;
  maxBatterySoCWh: number;
  avgSurfaceTempK: number;
  minSurfaceTempK: number;
  timeToNextSunsetHours: number;
  nextSunsetUtcIso: string;
  timeToNextSunriseHours: number;
  nextSunriseUtcIso: string;
  timeToNextEarthsetHours: number;
  nextEarthsetUtcIso: string;
  timeToNextEarthriseHours: number;
  nextEarthriseUtcIso: string;
  currentDsnStation: DSNGroundStation;
  verticalArrayAdvantageWm2: number;
  landingDispersionScorePct: number;
  overallViability: boolean;
  maxConsecutiveEclipseHours: number;
  maxConsecutiveBlackoutHours: number;
  totalEnergyHarvestedWh: number;
}

export interface CarpetPlotDayData {
  launchDateOffsetDays: number;
  launchDateUtcIso: string;
  missionDay: number;
  illuminationPct: number;
  dtePct: number;
  gatewayPct: number;
  viableScorePct: number;
  minSoCPct: number;
  isDepleted: boolean;
}

export interface SiteComparisonReport {
  siteA: {
    site: LunarSite;
    summary: MissionAnalysisSummary;
  };
  siteB: {
    site: LunarSite;
    summary: MissionAnalysisSummary;
  };
  deltaSunlitHours: number;
  deltaDteHours: number;
  deltaJointGoHours: number;
  deltaMinSoCPct: number;
  verdict: string;
}

export interface HorizonsQueryRequest {
  target: 'SUN' | 'EARTH';
  latitudeDeg: number;
  longitudeDeg: number;
  elevationKm: number;
  epochUtc: string; // ISO string
}

export interface HorizonsQueryResponse {
  success: boolean;
  source: 'LIVE_JPL' | 'CACHED_EPHEMERIS' | 'OFFLINE_FALLBACK';
  target: string;
  epochUtc: string;
  observerCoord: {
    lat: number;
    lon: number;
    elevKm: number;
  };
  azimuthDeg: number;
  elevationDeg: number;
  apparentRangeKm: number;
  rangeRateKmS?: number;
  angularDiameterDeg?: number;
  phaseAngleDeg?: number;
  deltaAzDeg?: number;
  deltaElDeg?: number;
  apiVersion?: string;
  rawOutputSnippet?: string;
  error?: string;
}
