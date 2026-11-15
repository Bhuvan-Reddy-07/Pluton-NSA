/**
 * PLUTON - Ansys STK (Systems Tool Kit) Mission Integration Engine
 * Standards: Ansys STK 11.x / 12.x / Connect / STK SOLIS & Comm
 * Reference: https://ansys.synopsys.com/products/missions/ansys-stk
 */

import {
  LunarSite,
  HardwareProfile,
  EphemerisState,
  PhysicsTimeStep,
  TerrainHorizonProfile,
} from '@/types/pluton';
import { LUNAR_CONSTANTS } from '@/data/lunarDatabase';

export interface STKLinkBudget {
  frequencyGHz: number;
  frequencyBand: 'X-Band' | 'Ka-Band';
  transmitterPowerW: number;
  transmitAntennaGainDbi: number;
  eirpDbw: number;
  distanceKm: number;
  freeSpacePathLossDb: number;
  polarAtmosphericLossDb: number;
  regolithMultipathLossDb: number;
  receiveAntennaDiameterM: number;
  receiveAntennaGainDbi: number;
  systemNoiseTempK: number;
  gOverTDbK: number;
  receivedPowerDbm: number;
  bitRateMbps: number;
  ebNoDb: number;
  requiredEbNoDb: number;
  linkMarginDb: number;
  linkStatus: 'MARGIN_HEALTHY' | 'MARGIN_DEGRADED' | 'LINK_LOSS';
}

export interface STKAccessInterval {
  intervalIndex: number;
  targetName: string;
  startUtc: string;
  stopUtc: string;
  durationHours: number;
  meanElevationDeg: number;
  minElevationDeg: number;
  maxElevationDeg: number;
}

export interface STKBundle {
  stkConnectScript: string;
  stkPythonScript: string;
  azElMaskAem: string;
  ephemerisE: string;
  accessReport: string;
}

/**
 * Computes RF Link Budget for Lunar South Pole Surface Asset to Earth DSN 34m Station
 * based on Ansys STK Comm RF standards
 */
export function computeSTKRFLinkBudget(
  distanceKm: number,
  earthElevationDeg: number,
  frequencyBand: 'X-Band' | 'Ka-Band' = 'X-Band',
  txPowerW: number = 15.0 // 15W typical rover/lander TWTA or SSPA
): STKLinkBudget {
  // Carrier frequency
  const freqGHz = frequencyBand === 'X-Band' ? 8.45 : 32.05; // GHz (deep-space downlink)
  const freqHz = freqGHz * 1e9;
  const speedOfLight = 299792458.0;
  const lambdaM = speedOfLight / freqHz;

  // Transmitter parameters
  const txAntennaDiamM = frequencyBand === 'X-Band' ? 0.6 : 0.45; // High-Gain Antenna (HGA)
  const txEfficiency = 0.6;
  const txGainDbi =
    10.0 * Math.log10(txEfficiency * Math.pow((Math.PI * txAntennaDiamM) / lambdaM, 2));
  const txPowerDbw = 10.0 * Math.log10(Math.max(0.1, txPowerW));
  const eirpDbw = txPowerDbw + txGainDbi;

  // Free Space Path Loss (FSPL) = 20*log10(4*pi*d / lambda)
  const distM = distanceKm * 1000.0;
  const fsplDb = 20.0 * Math.log10((4.0 * Math.PI * distM) / lambdaM);

  // Multipath & atmospheric attenuation
  // In airless lunar space atmospheric loss is 0; Earth tropospheric zenith loss ~ 0.04 dB (X) to 0.15 dB (Ka)
  const polarAtmosphericLossDb = frequencyBand === 'X-Band' ? 0.08 : 0.22;
  // Regolith grazing multipath loss spikes when elevation is below 2 degrees
  const regolithMultipathLossDb =
    earthElevationDeg < 0.0 ? 30.0 : earthElevationDeg < 2.0 ? (2.0 - earthElevationDeg) * 3.5 : 0.2;

  // Receiver parameters: NASA DSN 34-meter Beam Waveguide (BWG) station
  const rxDiamM = 34.0;
  const rxEfficiency = 0.68;
  const rxGainDbi =
    10.0 * Math.log10(rxEfficiency * Math.pow((Math.PI * rxDiamM) / lambdaM, 2));
  const systemNoiseTempK = frequencyBand === 'X-Band' ? 135.0 : 185.0; // Cryogenic LNA
  const gOverTDbK = rxGainDbi - 10.0 * Math.log10(systemNoiseTempK);

  // Total Path Loss
  const totalLossDb = fsplDb + polarAtmosphericLossDb + regolithMultipathLossDb;
  const receivedPowerDbw = eirpDbw - totalLossDb + rxGainDbi;
  const receivedPowerDbm = receivedPowerDbw + 30.0;

  // Eb/N0 calculation for telemetry
  // Pr/N0 = EIRP - TotalLoss + (G/T) - k (where k = -228.6 dBW/(Hz*K))
  const boltzmannDb = -228.6; // dBW / (Hz * K)
  const cOverN0DbHz = eirpDbw - totalLossDb + gOverTDbK - boltzmannDb;

  // Data Bitrate: 2.0 Mbps default for high-speed imagery, drops in margin distress
  const bitRateMbps = earthElevationDeg > 2.0 ? 2.0 : 0.25;
  const bitRateDbHz = 10.0 * Math.log10(bitRateMbps * 1e6);
  const ebNoDb = cOverN0DbHz - bitRateDbHz;

  // Forward Error Correction: LDPC Code rate 1/2 requires Eb/N0 = 3.8 dB for BER 1e-6
  const requiredEbNoDb = 3.8;
  const linkMarginDb = ebNoDb - requiredEbNoDb;

  let linkStatus: 'MARGIN_HEALTHY' | 'MARGIN_DEGRADED' | 'LINK_LOSS' = 'MARGIN_HEALTHY';
  if (linkMarginDb < 0.0 || earthElevationDeg < 0.0) {
    linkStatus = 'LINK_LOSS';
  } else if (linkMarginDb < 3.0) {
    linkStatus = 'MARGIN_DEGRADED';
  }

  return {
    frequencyGHz: freqGHz,
    frequencyBand,
    transmitterPowerW: txPowerW,
    transmitAntennaGainDbi: Number(txGainDbi.toFixed(2)),
    eirpDbw: Number(eirpDbw.toFixed(2)),
    distanceKm: Math.round(distanceKm),
    freeSpacePathLossDb: Number(fsplDb.toFixed(2)),
    polarAtmosphericLossDb,
    regolithMultipathLossDb: Number(regolithMultipathLossDb.toFixed(2)),
    receiveAntennaDiameterM: rxDiamM,
    receiveAntennaGainDbi: Number(rxGainDbi.toFixed(2)),
    systemNoiseTempK,
    gOverTDbK: Number(gOverTDbK.toFixed(2)),
    receivedPowerDbm: Number(receivedPowerDbm.toFixed(2)),
    bitRateMbps,
    ebNoDb: Number(ebNoDb.toFixed(2)),
    requiredEbNoDb,
    linkMarginDb: Number(linkMarginDb.toFixed(2)),
    linkStatus,
  };
}

/**
 * Generates the authentic Ansys STK Azimuth-Elevation Terrain Horizon Mask file (.aem)
 */
export function generateSTKAzElMask(
  horizon: TerrainHorizonProfile,
  mastHeightM: number = 0
): string {
  const elevArray =
    mastHeightM > 0 ? horizon.horizonElevationWithMastDeg : horizon.horizonElevationDeg;

  let out = `stk.v.11.0\n`;
  out += `BEGIN AzElMask\n`;
  out += `    NumberOfPoints 361\n`;
  out += `    BEGIN AzElMaskData\n`;

  for (let az = 0; az < 360; az++) {
    const el = elevArray[az] !== undefined ? elevArray[az] : 0.0;
    out += `        ${az.toFixed(1).padStart(5, ' ')}   ${el.toFixed(4).padStart(8, ' ')}\n`;
  }
  // Wrap around 360 = 0
  const el0 = elevArray[0] !== undefined ? elevArray[0] : 0.0;
  out += `        360.0   ${el0.toFixed(4).padStart(8, ' ')}\n`;

  out += `    END AzElMaskData\n`;
  out += `END AzElMask\n`;

  return out;
}

/**
 * Generates standard Ansys STK Ephemeris file (.e) for Lunar Surface Asset / NRHO
 */
export function generateSTKEphemeris(
  site: LunarSite,
  hardware: HardwareProfile,
  steps: PhysicsTimeStep[],
  startTime: Date
): string {
  const scenarioEpochStr = startTime
    .toUTCString()
    .replace('GMT', 'UTC')
    .replace(',', '');

  let out = `stk.v.11.0\n`;
  out += `BEGIN Ephemeris\n`;
  out += `NumberOfEphemerisPoints ${steps.length}\n`;
  out += `ScenarioEpoch ${scenarioEpochStr}\n`;
  out += `InterpolationMethod Lagrange\n`;
  out += `InterpolationOrder 5\n`;
  out += `DistanceUnit Kilometers\n`;
  out += `CentralBody Moon\n`;
  out += `CoordinateSystem Fixed\n`;
  out += `EphemerisTimePosVel\n`;

  // Compute fixed position on Moon (IAU Moon frame)
  const latRad = (site.latitude * Math.PI) / 180.0;
  const lonRad = (site.longitude * Math.PI) / 180.0;
  const rKm = LUNAR_CONSTANTS.MOON_RADIUS_KM + (site.elevation + hardware.mastHeight) / 1000.0;

  const xKm = rKm * Math.cos(latRad) * Math.cos(lonRad);
  const yKm = rKm * Math.cos(latRad) * Math.sin(lonRad);
  const zKm = rKm * Math.sin(latRad);

  steps.forEach((step, idx) => {
    const elapsedSec = idx * 3600.0;
    out += `${elapsedSec.toFixed(4).padStart(14, ' ')}  ${xKm.toExponential(10)}  ${yKm.toExponential(10)}  ${zKm.toExponential(10)}  0.0000000000e+00  0.0000000000e+00  0.0000000000e+00\n`;
  });

  out += `END Ephemeris\n`;
  return out;
}

/**
 * Generates Ansys STK Connect Automation Script (.con) and Python (.py)
 */
export function generateSTKConnectScripts(
  site: LunarSite,
  hardware: HardwareProfile,
  startTime: Date,
  durationDays: number = 30
): { connectScript: string; pythonScript: string } {
  const startEpochStr = startTime.toUTCString().replace('GMT', 'UTC').replace(',', '');
  const stopEpoch = new Date(startTime.getTime() + durationDays * 86400000);
  const stopEpochStr = stopEpoch.toUTCString().replace('GMT', 'UTC').replace(',', '');

  const safeSiteName = site.name.replace(/[^a-zA-Z0-9]/g, '_');
  const safeHwName = hardware.name.replace(/[^a-zA-Z0-9]/g, '_');

  // Ansys STK Connect Command Sequence
  const connectScript = `# ==============================================================================
# Ansys STK (Systems Tool Kit) Mission Scenario Generation Script
# Generated by PLUTON (Polar Lunar Utilities, Topography & Orbital Navigator)
# Architecture: NASA JPL / CSA Artemis III & LEAP Polar Mission Standard
# Reference: https://ansys.synopsys.com/products/missions/ansys-stk
# ==============================================================================

# 1. Initialize New Lunar South Pole Scenario
New / Scenario PLUTON_Lunar_SouthPole
SetTimePeriod "${startEpochStr}" "${stopEpochStr}"
SetEpoch "${startEpochStr}"
Animate * Reset

# 2. Set Central Body to Moon and Configure IAU Frame
SetUnits / Scenario/PLUTON_Lunar_SouthPole Distance Kilometers TimeUnit Seconds Angle Degrees

# 3. Create Lunar South Pole Surface Asset (Place Object)
New / Place ${safeSiteName}
SetPosition / Place/${safeSiteName} Planetodetic ${site.latitude.toFixed(4)} ${site.longitude.toFixed(4)} ${(site.elevation + hardware.mastHeight) / 1000.0} Moon

# 4. Assign Custom LOLA DEM Azimuth-Elevation Horizon Mask
ImportAzElMask / Place/${safeSiteName} File "${safeSiteName}_Terrain_Horizon.aem"
SetAzElMask / Place/${safeSiteName} UseMask Yes

# 5. Model Lunar Gateway in 9:2 NRHO Orbit (Near-Rectilinear Halo Orbit)
New / Satellite Gateway_NRHO
SetState / Satellite/Gateway_NRHO Classical TwoBody "${startEpochStr}" "${stopEpochStr}" 60.0 Moon J2000 "${startEpochStr}" 38000.0 0.88 90.0 90.0 0.0 180.0

# 6. Model Deep Space Network (DSN) Earth Ground Stations
New / Facility DSN_Goldstone
SetPosition / Facility/DSN_Goldstone Geodetic 35.4267 -116.8900 1.034 Earth

New / Facility DSN_Madrid
SetPosition / Facility/DSN_Madrid Geodetic 40.4272 -4.2494 0.834 Earth

New / Facility DSN_Canberra
SetPosition / Facility/DSN_Canberra Geodetic -35.4014 148.9817 0.655 Earth

# 7. Model Direct-to-Earth (DTE) and Gateway Communication Antennas
New / Place/${safeSiteName}/Sensor DTE_HighGain_Antenna
SetPattern / Place/${safeSiteName}/Sensor/DTE_HighGain_Antenna Cone 4.8
Point / Place/${safeSiteName}/Sensor/DTE_HighGain_Antenna Target Target/Earth

New / Place/${safeSiteName}/Sensor Gateway_Relay_Antenna
SetPattern / Place/${safeSiteName}/Sensor/Gateway_Relay_Antenna Cone 45.0
Point / Place/${safeSiteName}/Sensor/Gateway_Relay_Antenna Target Satellite/Gateway_NRHO

# 8. Compute Access and Line-of-Sight Contact Intervals
ComputeAccess / Place/${safeSiteName} Target/Earth
ComputeAccess / Place/${safeSiteName} Satellite/Gateway_NRHO
ComputeAccess / Place/${safeSiteName} Target/Sun

# 9. Compute Solar Array Lighting and Power Output
SolarArray / Place/${safeSiteName} Area ${hardware.panelArea} Efficiency ${hardware.panelEfficiency} Type ${hardware.arrayType}

# 10. Generate Mission Analytics Reports
Report_RM / Place/${safeSiteName} Access "Access Data"
Report_RM / Place/${safeSiteName}/Sensor/DTE_HighGain_Antenna Access "Link Budget Summary"
`;

  // Ansys STK Python Integration Script (using pySTK / comtypes)
  const pythonScript = `"""
Ansys STK Python Automation Script (pySTK / comtypes)
Project: PLUTON (Polar Lunar Utilities, Topography & Orbital Navigator)
Site: ${site.name} (Lat: ${site.latitude.toFixed(2)}, Lon: ${site.longitude.toFixed(2)}, Elev: ${site.elevation}m)
Hardware Profile: ${hardware.name}
Reference: https://ansys.synopsys.com/products/missions/ansys-stk
"""

import sys
try:
    from comtypes.client import CreateObject, GetActiveObject
except ImportError:
    print("Please install comtypes to run Ansys STK Python automation: pip install comtypes")
    sys.exit(1)

def run_stk_pluton_scenario():
    print("Connecting to Ansys STK Engine...")
    try:
        ui_app = GetActiveObject("STK11.Application")
    except:
        ui_app = CreateObject("STK11.Application")
    
    ui_app.Visible = True
    root = ui_app.Personality2
    
    # Initialize Scenario
    root.NewScenario("PLUTON_${safeSiteName}")
    scenario = root.CurrentScenario
    scenario.SetTimePeriod("${startEpochStr}", "${stopEpochStr}")
    scenario.Epoch = "${startEpochStr}"
    
    # Add Lunar Surface Asset
    lander = scenario.Children.New(16, "${safeSiteName}") # ePlace = 16
    lander_obj = lander.QueryInterface()
    lander_obj.Position.AssignPlanetodetic(
        ${site.latitude.toFixed(4)},
        ${site.longitude.toFixed(4)},
        ${(site.elevation + hardware.mastHeight) / 1000.0},
        "Moon"
    )
    
    print("Ansys STK Scenario initialized successfully for ${site.name}.")

if __name__ == "__main__":
    run_stk_pluton_scenario()
`;

  return { connectScript, pythonScript };
}

/**
 * Consolidates the complete Ansys STK export bundle
 */
export function generateSTKBundle(
  site: LunarSite,
  hardware: HardwareProfile,
  horizon: TerrainHorizonProfile,
  steps: PhysicsTimeStep[],
  startTime: Date,
  durationDays: number = 30
): STKBundle {
  const { connectScript, pythonScript } = generateSTKConnectScripts(
    site,
    hardware,
    startTime,
    durationDays
  );
  const azElMaskAem = generateSTKAzElMask(horizon, hardware.mastHeight);
  const ephemerisE = generateSTKEphemeris(site, hardware, steps, startTime);

  // Generate ASCII Access Report
  let accessReport = `ANSYS STK ACCESS & LIGHTING INTERVAL REPORT\n`;
  accessReport += `Scenario: PLUTON_${site.name.replace(/[^a-zA-Z0-9]/g, '_')}\n`;
  accessReport += `Central Body: Moon | Reference Frame: MOON_ME\n`;
  accessReport += `Start Epoch: ${startTime.toUTCString()}\n\n`;
  accessReport += `Step_Hour   UTC_Timestamp                  Direct_Sun   DTE_Access   Gateway_Relay   Net_Power_W   Battery_SoC_Pct\n`;
  accessReport += `-----------------------------------------------------------------------------------------------------------------\n`;

  steps.forEach((s) => {
    const sunStr = s.penumbraFraction > 0.05 ? 'SUNLIGHT' : 'ECLIPSE ';
    const dteStr = s.dteCommState === 'NOMINAL_DTE' ? 'CONTACT ' : 'BLOCKED ';
    const gtwStr = s.gatewayInRelay ? 'IN_VIEW ' : 'NO_VIEW ';
    accessReport += `${String(s.stepIndex).padStart(4, ' ')}        ${s.utcIso}   ${sunStr}     ${dteStr}     ${gtwStr}        ${String(Math.round(s.netPowerW)).padStart(6, ' ')}W      ${s.batterySoCPct.toFixed(1)}%\n`;
  });

  return {
    stkConnectScript: connectScript,
    stkPythonScript: pythonScript,
    azElMaskAem,
    ephemerisE,
    accessReport,
  };
}

