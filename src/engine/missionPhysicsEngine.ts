/**
 * PLUTON Mission Physics, Solar Disk Penumbra, Thermal & Battery SoC Solver
 * NASA JPL / CSA Lunar Surface System Standards
 */

import {
  LunarSite,
  HardwareProfile,
  SolarArrayType,
  DTECommState,
  PhysicsTimeStep,
  MissionAnalysisSummary,
  TerrainHorizonProfile,
  CarpetPlotDayData,
} from '@/types/pluton';
import { LUNAR_CONSTANTS } from '@/data/lunarDatabase';
import { evaluateEphemerisState, getActiveDSNStation } from '@/engine/ephemerisSolver';
import { computeTerrainHorizonProfile, updateHorizonWithMastHeight } from '@/engine/terrainHorizonEngine';

const DEG2RAD = Math.PI / 180.0;
const RAD2DEG = 180.0 / Math.PI;

/**
 * Calculates exact penumbral partial solar disk fraction f_disk in [0, 1].
 * Sun apparent diameter = 0.533 deg (r_sun = 0.2665 deg).
 *
 * @param sunElevationDeg Center elevation of Sun
 * @param horizonElevationDeg Local terrain horizon elevation in the direction of the Sun
 */
export function computePenumbralSolarFraction(
  sunElevationDeg: number,
  horizonElevationDeg: number
): { fraction: number; deltaDeg: number } {
  const deltaDeg = sunElevationDeg - horizonElevationDeg;
  const rSun = LUNAR_CONSTANTS.SUN_ANGULAR_RADIUS_DEG; // 0.2665°

  // 1. Full Direct Sunlight (Entire solar disk above horizon ridge)
  if (deltaDeg >= rSun) {
    return { fraction: 1.0, deltaDeg };
  }

  // 2. Full Umbra / Total Eclipse (Entire solar disk below horizon ridge)
  if (deltaDeg <= -rSun) {
    return { fraction: 0.0, deltaDeg };
  }

  // 3. Grazing Penumbra: Partial circle segment area formula
  // Normalized elevation u in (-1, 1) where u = 0 means solar center is exactly on the ridge
  const u = Math.max(-0.99999, Math.min(0.99999, deltaDeg / rSun));
  const segmentArea = u * Math.sqrt(1.0 - u * u) + Math.asin(u);
  const fDisk = 0.5 + (1.0 / Math.PI) * segmentArea;

  return {
    fraction: Math.max(0.0, Math.min(1.0, fDisk)),
    deltaDeg,
  };
}

/**
 * Calculates Solar Power Generated (W) for Vertical Mast vs. Horizontal Deck
 */
export function computeSolarPower(
  fDisk: number,
  sunElevationDeg: number,
  panelAreaM2: number,
  efficiency: number,
  arrayType: SolarArrayType,
  solarConstantWm2?: number
): { powerW: number; verticalFluxWm2: number; horizontalFluxWm2: number } {
  const S0 = solarConstantWm2 !== undefined ? solarConstantWm2 : LUNAR_CONSTANTS.SOLAR_CONSTANT_W_M2;
  const elRad = sunElevationDeg * DEG2RAD;

  // Vertical tracking mast receives sunlight perpendicular to vertical cylinder: cos(El_sun)
  // At polar grazing sun (El = 1°), cos(El) ~ 0.9998
  const verticalFluxWm2 = S0 * fDisk * Math.cos(elRad);
  const verticalPowerW = verticalFluxWm2 * panelAreaM2 * efficiency;

  // Horizontal deck receives sin(El_sun) cosine projection loss
  // At polar grazing sun (El = 1.5°), sin(El) ~ 0.026
  const sinElClamped = Math.max(0.0, Math.sin(elRad));
  const horizontalFluxWm2 = S0 * fDisk * sinElClamped;
  const horizontalPowerW = horizontalFluxWm2 * panelAreaM2 * efficiency;

  const powerW = arrayType === 'vertical' ? verticalPowerW : horizontalPowerW;

  return {
    powerW: Math.max(0.0, powerW),
    verticalFluxWm2,
    horizontalFluxWm2,
  };
}

/**
 * Evaluates Direct-to-Earth (DTE) communication state based on horizon clearance
 */
export function evaluateDTEState(earthElevationDeg: number, horizonElevationAtEarthDeg: number): {
  state: DTECommState;
  deltaDeg: number;
} {
  const deltaDeg = earthElevationDeg - horizonElevationAtEarthDeg;

  if (deltaDeg < 0.0) {
    return { state: 'BLOCKED', deltaDeg };
  } else if (deltaDeg < 2.0) {
    // Multipath risk: grazing RF beam within 2° of lunar regolith causes phase interference
    return { state: 'MULTIPATH_GRAZING', deltaDeg };
  } else {
    return { state: 'NOMINAL_DTE', deltaDeg };
  }
}

/**
 * Simulates complete high-resolution mission physics time-steps.
 * Time step dt = 1 hour.
 */
export function simulateMissionPhysics(
  site: LunarSite,
  hardware: HardwareProfile,
  horizonProfile: TerrainHorizonProfile,
  startDate: Date,
  durationDays: number = 30,
  customMastHeightM?: number,
  customArrayType?: SolarArrayType
): { steps: PhysicsTimeStep[]; summary: MissionAnalysisSummary } {
  const mastM = customMastHeightM !== undefined ? customMastHeightM : hardware.mastHeight;
  const arrayType = customArrayType !== undefined ? customArrayType : hardware.arrayType;

  // Dynamically update horizon if mast differs
  const activeHorizon = updateHorizonWithMastHeight(horizonProfile, mastM);

  const totalHours = Math.round(durationDays * 24);
  const steps: PhysicsTimeStep[] = new Array(totalHours);

  let currentBatteryWh = hardware.batteryCapacityWh; // Start at 100% SoC
  let continuousShadowHours = 0;
  let maxContinuousEclipseHours = 0;
  let continuousBlackoutHours = 0;
  let maxContinuousBlackoutHours = 0;

  let totalSunlitHours = 0;
  let totalPenumbralHours = 0;
  let totalEclipseHours = 0;
  let totalNominalDteHours = 0;
  let totalMultipathHours = 0;
  let totalBlockedHours = 0;
  let totalGatewayHours = 0;
  let totalJointGoHours = 0;

  let minBatterySoCWh = hardware.batteryCapacityWh;
  let maxBatterySoCWh = 0;
  let isBatteryDepleted = false;
  let batteryDepletionTimestampMs: number | undefined;

  let tempSumK = 0;
  let minSurfaceTempK = 350;

  // Countdown markers
  let nextSunsetHours = -1;
  let nextSunsetIso = '';
  let nextSunriseHours = -1;
  let nextSunriseIso = '';
  let nextEarthsetHours = -1;
  let nextEarthsetIso = '';
  let nextEarthriseHours = -1;
  let nextEarthriseIso = '';

  const startMs = startDate.getTime();

  for (let i = 0; i < totalHours; i++) {
    const currentMs = startMs + i * 3600000;
    const currentDate = new Date(currentMs);

    // 1. Ephemeris state
    const ephem = evaluateEphemerisState(currentDate, site.latitude, site.longitude, site.elevation);

    // 2. Horizon lookup for Sun
    const sunAzIndex = Math.floor(ephem.sun.azimuthDeg) % 360;
    const horizonElAtSun = activeHorizon.horizonElevationWithMastDeg[sunAzIndex];

    // 3. Penumbra fraction
    const { fraction: fDisk, deltaDeg: sunDelta } = computePenumbralSolarFraction(
      ephem.sun.elevationTopocentricDeg,
      horizonElAtSun
    );

    // 4. Power generation (using JPL Horizons DE441 dynamic heliocentric flux if in epoch window)
    const activeSolarConstant = ephem.de441?.solarConstantWm2 || LUNAR_CONSTANTS.SOLAR_CONSTANT_W_M2;
    const { powerW: genPowerW, verticalFluxWm2, horizontalFluxWm2 } = computeSolarPower(
      fDisk,
      ephem.sun.elevationTopocentricDeg,
      hardware.panelArea,
      hardware.panelEfficiency,
      arrayType,
      activeSolarConstant
    );

    // 5. Horizon lookup for Earth
    const earthAzIndex = Math.floor(ephem.earth.azimuthDeg) % 360;
    const horizonElAtEarth = activeHorizon.horizonElevationWithMastDeg[earthAzIndex];

    // 6. DTE Comm State
    const { state: dteCommState, deltaDeg: earthDelta } = evaluateDTEState(
      ephem.earth.elevationTopocentricDeg,
      horizonElAtEarth
    );

    // 7. Thermal model
    // Sunlit temperature reaches ~220 K in grazing conditions; in shadow cools toward 55 K
    let surfaceTempK: number;
    if (fDisk > 0.05) {
      continuousShadowHours = 0;
      surfaceTempK = 180.0 + 45.0 * Math.sqrt(fDisk) + Math.max(0, ephem.sun.elevationTopocentricDeg) * 10.0;
    } else {
      continuousShadowHours += 1;
      if (continuousShadowHours > maxContinuousEclipseHours) {
        maxContinuousEclipseHours = continuousShadowHours;
      }
      // Exponential cooling curve with 14 hr time constant
      const decay = Math.exp(-continuousShadowHours / 14.0);
      surfaceTempK = 55.0 + (180.0 - 55.0) * decay;
    }

    if (surfaceTempK < minSurfaceTempK) {
      minSurfaceTempK = surfaceTempK;
    }
    tempSumK += surfaceTempK;

    // 8. Heater & Avionics Load
    const heaterActive = surfaceTempK < 130.0 || fDisk < 0.2;
    const currentHeaterW = heaterActive ? hardware.eclipseHeaterW : 0;
    const totalLoadW = hardware.baseLoadW + currentHeaterW;

    // 9. Battery Integration (Euler dt = 1 hr)
    const netPowerW = genPowerW - totalLoadW;
    currentBatteryWh = Math.max(0.0, Math.min(hardware.batteryCapacityWh, currentBatteryWh + netPowerW * 1.0));

    if (currentBatteryWh <= 0.1 && !isBatteryDepleted) {
      isBatteryDepleted = true;
      batteryDepletionTimestampMs = currentMs;
    }

    if (currentBatteryWh < minBatterySoCWh) {
      minBatterySoCWh = currentBatteryWh;
    }
    if (currentBatteryWh > maxBatterySoCWh) {
      maxBatterySoCWh = currentBatteryWh;
    }

    const batterySoCPct = (currentBatteryWh / hardware.batteryCapacityWh) * 100.0;

    // 10. Gateway & Joint Go-Window
    const gatewayInRelay = ephem.gateway.inWindow;
    const hasRFLink = dteCommState === 'NOMINAL_DTE' || (dteCommState === 'MULTIPATH_GRAZING' && i % 2 === 0) || gatewayInRelay;
    const hasSufficientPower = currentBatteryWh > hardware.batteryCapacityWh * 0.15 || genPowerW > totalLoadW;
    const jointViable = hasRFLink && hasSufficientPower && !isBatteryDepleted;

    // Track statistics
    if (fDisk >= 0.95) totalSunlitHours++;
    else if (fDisk > 0.05) totalPenumbralHours++;
    else totalEclipseHours++;

    if (dteCommState === 'NOMINAL_DTE') totalNominalDteHours++;
    else if (dteCommState === 'MULTIPATH_GRAZING') totalMultipathHours++;
    else {
      totalBlockedHours++;
      continuousBlackoutHours++;
      if (continuousBlackoutHours > maxContinuousBlackoutHours) {
        maxContinuousBlackoutHours = continuousBlackoutHours;
      }
    }
    if (dteCommState !== 'BLOCKED') continuousBlackoutHours = 0;

    if (gatewayInRelay) totalGatewayHours++;
    if (jointViable) totalJointGoHours++;

    // Track upcoming transitions
    if (i > 0) {
      const prevStep = steps[i - 1];
      if (nextSunsetHours === -1 && prevStep.penumbraFraction > 0.1 && fDisk <= 0.1) {
        nextSunsetHours = i;
        nextSunsetIso = currentDate.toISOString();
      }
      if (nextSunriseHours === -1 && prevStep.penumbraFraction <= 0.1 && fDisk > 0.1) {
        nextSunriseHours = i;
        nextSunriseIso = currentDate.toISOString();
      }
      if (nextEarthsetHours === -1 && prevStep.dteCommState !== 'BLOCKED' && dteCommState === 'BLOCKED') {
        nextEarthsetHours = i;
        nextEarthsetIso = currentDate.toISOString();
      }
      if (nextEarthriseHours === -1 && prevStep.dteCommState === 'BLOCKED' && dteCommState !== 'BLOCKED') {
        nextEarthriseHours = i;
        nextEarthriseIso = currentDate.toISOString();
      }
    }

    steps[i] = {
      stepIndex: i,
      timestampMs: currentMs,
      utcIso: currentDate.toISOString(),
      sunAzDeg: ephem.sun.azimuthDeg,
      sunElDeg: ephem.sun.elevationTopocentricDeg,
      horizonElAtSunDeg: horizonElAtSun,
      sunDeltaDeg: sunDelta,
      penumbraFraction: fDisk,
      verticalSolarFluxW: verticalFluxWm2 * hardware.panelArea,
      horizontalSolarFluxW: horizontalFluxWm2 * hardware.panelArea,
      generatedPowerW: genPowerW,
      earthAzDeg: ephem.earth.azimuthDeg,
      earthElDeg: ephem.earth.elevationTopocentricDeg,
      horizonElAtEarthDeg: horizonElAtEarth,
      earthDeltaDeg: earthDelta,
      dteCommState,
      gatewayInRelay,
      jointViable,
      batterySoCWh: currentBatteryWh,
      batterySoCPct,
      surfaceTempK,
      heaterActive,
      heaterLoadW: currentHeaterW,
      netPowerW,
    };
  }

  // Fallback defaults for transitions if none occurred in window
  if (nextSunsetHours === -1) {
    nextSunsetHours = Math.round(totalSunlitHours);
    nextSunsetIso = new Date(startMs + nextSunsetHours * 3600000).toISOString();
  }
  if (nextSunriseHours === -1) {
    nextSunriseHours = Math.round(totalEclipseHours);
    nextSunriseIso = new Date(startMs + nextSunriseHours * 3600000).toISOString();
  }
  if (nextEarthsetHours === -1) {
    nextEarthsetHours = Math.round(totalNominalDteHours);
    nextEarthsetIso = new Date(startMs + nextEarthsetHours * 3600000).toISOString();
  }
  if (nextEarthriseHours === -1) {
    nextEarthriseHours = Math.round(totalBlockedHours);
    nextEarthriseIso = new Date(startMs + nextEarthriseHours * 3600000).toISOString();
  }

  // Battery survival limit (hours at zero solar power before depletion)
  const fullDischargeRateW = hardware.baseLoadW + hardware.eclipseHeaterW;
  const batterySurvivalLimitHours = Number((hardware.batteryCapacityWh / Math.max(1, fullDischargeRateW)).toFixed(1));

  // Vertical array advantage at polar site
  const avgSunElRad = 1.8 * DEG2RAD;
  const vertWm2 = LUNAR_CONSTANTS.SOLAR_CONSTANT_W_M2 * Math.cos(avgSunElRad);
  const horizWm2 = LUNAR_CONSTANTS.SOLAR_CONSTANT_W_M2 * Math.sin(avgSunElRad);
  const verticalArrayAdvantageWm2 = Math.round(vertWm2 - horizWm2);

  // Landing dispersion score: based on site roughness and elevation
  const dispersionPenalty = site.roughnessScore * 35.0 + Math.max(0, 2500 - site.elevation) * 0.004;
  const landingDispersionScorePct = Math.max(45, Math.min(98, Math.round(100 - dispersionPenalty)));

  const summary: MissionAnalysisSummary = {
    siteId: site.id,
    hardwareId: hardware.id,
    mastHeightM: mastM,
    arrayType,
    startTimeMs: startMs,
    durationDays,
    totalHours,
    sunlitHours: totalSunlitHours,
    sunlitPct: Number(((totalSunlitHours / totalHours) * 100).toFixed(1)),
    penumbralHours: totalPenumbralHours,
    totalEclipseHours,
    maxContinuousEclipseHours,
    batterySurvivalLimitHours,
    isBatteryDepleted,
    batteryDepletionTimestampMs,
    dteNominalHours: totalNominalDteHours,
    dteNominalPct: Number(((totalNominalDteHours / totalHours) * 100).toFixed(1)),
    dteMultipathHours: totalMultipathHours,
    dteBlockedHours: totalBlockedHours,
    gatewayRelayHours: totalGatewayHours,
    gatewayRelayPct: Number(((totalGatewayHours / totalHours) * 100).toFixed(1)),
    jointGoHours: totalJointGoHours,
    jointGoPct: Number(((totalJointGoHours / totalHours) * 100).toFixed(1)),
    minBatterySoCWh: Number(minBatterySoCWh.toFixed(1)),
    minBatterySoCPct: Number(((minBatterySoCWh / hardware.batteryCapacityWh) * 100).toFixed(1)),
    maxBatterySoCWh: Number(maxBatterySoCWh.toFixed(1)),
    avgSurfaceTempK: Number((tempSumK / totalHours).toFixed(1)),
    minSurfaceTempK: Number(minSurfaceTempK.toFixed(1)),
    timeToNextSunsetHours: nextSunsetHours,
    nextSunsetUtcIso: nextSunsetIso,
    timeToNextSunriseHours: nextSunriseHours,
    nextSunriseUtcIso: nextSunriseIso,
    timeToNextEarthsetHours: nextEarthsetHours,
    nextEarthsetUtcIso: nextEarthsetIso,
    timeToNextEarthriseHours: nextEarthriseHours,
    nextEarthriseUtcIso: nextEarthriseIso,
    currentDsnStation: getActiveDSNStation(startDate),
    verticalArrayAdvantageWm2,
    landingDispersionScorePct,
    overallViability: !isBatteryDepleted && minBatterySoCWh > 0,
    maxConsecutiveEclipseHours: maxContinuousEclipseHours,
    maxConsecutiveBlackoutHours: maxContinuousBlackoutHours,
    totalEnergyHarvestedWh: Math.round(totalSunlitHours * hardware.panelArea * 1361 * hardware.panelEfficiency),
  };

  return { steps, summary };
}

/**
 * Computes 2D Carpet Plot / Porkchop matrix for launch slips.
 * Evaluates launch offsets (e.g. -15 to +15 days in steps of 2 or 3 days) across mission day 1 to 30.
 */
export function generateLaunchSlipCarpetPlot(
  site: LunarSite,
  hardware: HardwareProfile,
  horizonProfile: TerrainHorizonProfile,
  baselineDate: Date,
  offsetDaysRange: number[] = [-14, -10, -7, -4, -2, 0, 2, 4, 7, 10, 14],
  missionDays: number = 30
): CarpetPlotDayData[] {
  const result: CarpetPlotDayData[] = [];

  for (const offset of offsetDaysRange) {
    const launchMs = baselineDate.getTime() + offset * 86400000;
    const launchDate = new Date(launchMs);

    // Fast simulation over 30 days
    const { steps } = simulateMissionPhysics(
      site,
      hardware,
      horizonProfile,
      launchDate,
      missionDays
    );

    for (let day = 1; day <= missionDays; day++) {
      const startHour = (day - 1) * 24;
      const endHour = Math.min(steps.length, day * 24);
      const daySlice = steps.slice(startHour, endHour);

      let sunlitCount = 0;
      let dteCount = 0;
      let gatewayCount = 0;
      let viableCount = 0;
      let minDaySoC = 100;
      let isDepleted = false;

      for (const step of daySlice) {
        if (step.penumbraFraction > 0.05) sunlitCount++;
        if (step.dteCommState !== 'BLOCKED') dteCount++;
        if (step.gatewayInRelay) gatewayCount++;
        if (step.jointViable) viableCount++;
        if (step.batterySoCPct < minDaySoC) minDaySoC = step.batterySoCPct;
        if (step.batterySoCWh <= 0.1) isDepleted = true;
      }

      const totalSlice = Math.max(1, daySlice.length);
      result.push({
        launchDateOffsetDays: offset,
        launchDateUtcIso: launchDate.toISOString(),
        missionDay: day,
        illuminationPct: Math.round((sunlitCount / totalSlice) * 100),
        dtePct: Math.round((dteCount / totalSlice) * 100),
        gatewayPct: Math.round((gatewayCount / totalSlice) * 100),
        viableScorePct: Math.round((viableCount / totalSlice) * 100),
        minSoCPct: Math.round(minDaySoC),
        isDepleted,
      });
    }
  }

  return result;
}

