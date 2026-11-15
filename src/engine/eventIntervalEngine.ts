/**
 * PLUTON Event Interval Engine
 * Discrete astrodynamic event interval calculator for Lunar South Pole mission planning.
 * Analyzes continuous time series to identify sunlit windows, eclipse intervals,
 * Direct-to-Earth (DTE) communication passes, and Lunar Gateway NRHO relay windows.
 */

import { PhysicsTimeStep } from '@/types/pluton';

export interface MissionInterval {
  id: string;
  type: 'ILLUMINATION' | 'ECLIPSE' | 'DTE_COMM' | 'DTE_BLACKOUT' | 'GATEWAY_RELAY' | 'JOINT_GO' | 'BATTERY_CRITICAL';
  startIndex: number;
  endIndex: number;
  startUtc: string;
  endUtc: string;
  durationHours: number;
  description: string;
  severity: 'NOMINAL' | 'WARNING' | 'CRITICAL';
  peakMetricValue?: number;
}

export interface IntervalEngineSummary {
  totalHours: number;
  totalSunlitHours: number;
  totalEclipseHours: number;
  maxContinuousEclipseHours: number;
  illuminationDutyPct: number;
  dteAvailabilityPct: number;
  gatewayAvailabilityPct: number;
  jointGoAvailabilityPct: number;
  intervals: MissionInterval[];
}

/**
 * Computes all discrete astrodynamic and operational intervals across a simulation timeline.
 */
export function computeMissionIntervals(steps: PhysicsTimeStep[]): IntervalEngineSummary {
  if (!steps || steps.length === 0) {
    return {
      totalHours: 0,
      totalSunlitHours: 0,
      totalEclipseHours: 0,
      maxContinuousEclipseHours: 0,
      illuminationDutyPct: 0,
      dteAvailabilityPct: 0,
      gatewayAvailabilityPct: 0,
      jointGoAvailabilityPct: 0,
      intervals: [],
    };
  }

  const intervals: MissionInterval[] = [];
  const totalSteps = steps.length;

  // 1. Illumination / Eclipse intervals
  let inSun = steps[0].sunDeltaDeg > 0;
  let intervalStart = 0;

  for (let i = 1; i <= totalSteps; i++) {
    const isEnd = i === totalSteps;
    const currentSun = !isEnd ? steps[i].sunDeltaDeg > 0 : !inSun;

    if (currentSun !== inSun || isEnd) {
      const dur = i - intervalStart;
      intervals.push({
        id: `light-${intervals.length + 1}`,
        type: inSun ? 'ILLUMINATION' : 'ECLIPSE',
        startIndex: intervalStart,
        endIndex: i - 1,
        startUtc: steps[intervalStart].utcIso,
        endUtc: steps[i - 1].utcIso,
        durationHours: dur,
        description: inSun
          ? `Direct solar illumination (${dur}h duration)`
          : `Topographic shadow occultation (${dur}h duration)`,
        severity: inSun ? 'NOMINAL' : dur > 48 ? 'CRITICAL' : 'WARNING',
      });
      inSun = currentSun;
      intervalStart = i;
    }
  }

  // 2. DTE Comm Windows
  let inDte = steps[0].earthDeltaDeg > 0;
  let dteStart = 0;

  for (let i = 1; i <= totalSteps; i++) {
    const isEnd = i === totalSteps;
    const currentDte = !isEnd ? steps[i].earthDeltaDeg > 0 : !inDte;

    if (currentDte !== inDte || isEnd) {
      const dur = i - dteStart;
      if (inDte) {
        intervals.push({
          id: `dte-${intervals.length + 1}`,
          type: 'DTE_COMM',
          startIndex: dteStart,
          endIndex: i - 1,
          startUtc: steps[dteStart].utcIso,
          endUtc: steps[i - 1].utcIso,
          durationHours: dur,
          description: `Direct-to-Earth line-of-sight communication window (${dur}h)`,
          severity: 'NOMINAL',
        });
      }
      inDte = currentDte;
      dteStart = i;
    }
  }

  // 3. Joint GO Windows (Sun + DTE simultaneous)
  let inJoint = steps[0].sunDeltaDeg > 0 && steps[0].earthDeltaDeg > 0;
  let jointStart = 0;

  for (let i = 1; i <= totalSteps; i++) {
    const isEnd = i === totalSteps;
    const currentJoint = !isEnd ? steps[i].sunDeltaDeg > 0 && steps[i].earthDeltaDeg > 0 : !inJoint;

    if (currentJoint !== inJoint || isEnd) {
      const dur = i - jointStart;
      if (inJoint) {
        intervals.push({
          id: `joint-${intervals.length + 1}`,
          type: 'JOINT_GO',
          startIndex: jointStart,
          endIndex: i - 1,
          startUtc: steps[jointStart].utcIso,
          endUtc: steps[i - 1].utcIso,
          durationHours: dur,
          description: `Artemis III Joint Operational GO window (${dur}h simultaneous sun + comms)`,
          severity: 'NOMINAL',
        });
      }
      inJoint = currentJoint;
      jointStart = i;
    }
  }

  // Compute aggregate statistics
  const sunlitCount = steps.filter((s) => s.sunDeltaDeg > 0).length;
  const dteCount = steps.filter((s) => s.earthDeltaDeg > 0).length;
  const gwCount = steps.filter((s) => s.gatewayInRelay).length;
  const jointCount = steps.filter((s) => s.sunDeltaDeg > 0 && s.earthDeltaDeg > 0).length;

  const eclipseIntervals = intervals.filter((it) => it.type === 'ECLIPSE');
  const maxContinuousEclipseHours = eclipseIntervals.reduce(
    (max, it) => Math.max(max, it.durationHours),
    0
  );

  return {
    totalHours: totalSteps,
    totalSunlitHours: sunlitCount,
    totalEclipseHours: totalSteps - sunlitCount,
    maxContinuousEclipseHours,
    illuminationDutyPct: Math.round((sunlitCount / totalSteps) * 100),
    dteAvailabilityPct: Math.round((dteCount / totalSteps) * 100),
    gatewayAvailabilityPct: Math.round((gwCount / totalSteps) * 100),
    jointGoAvailabilityPct: Math.round((jointCount / totalSteps) * 100),
    intervals,
  };
}
