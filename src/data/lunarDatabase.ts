/**
 * PLUTON - Curated Lunar South Pole Landing Sites & Hardware Digital Twins
 * Calibrated against NASA LRO LOLA, Artemis III Candidate Site Studies & CSA LEAP Mission Architecture
 */

import { LunarSite, HardwareProfile } from '@/types/pluton';
import { JPL_MOON_GEOPHYSICAL_DATA } from '@/data/jplHorizonsDe441Data';

export { JPL_MOON_GEOPHYSICAL_DATA };

export const LUNAR_SOUTH_POLE_SITES: LunarSite[] = [
  {
    id: 'shackleton-connecting-ridge',
    name: 'Shackleton Connecting Ridge',
    latitude: -89.45,
    longitude: 222.0,
    elevation: 2250,
    description:
      'Elevated ridge connecting Shackleton and de Gerlache rims. Receives up to 89% illumination during southern summer with narrow shadow intervals. Prime Artemis III crewed candidate.',
    missionRole: 'Artemis III Crewed Sortie & Long-Duration Habitation',
    peakIlluminationSummerPct: 88.7,
    psrProximityKm: 1.2,
    roughnessScore: 0.38,
    keyFeatures: [
      'Peak summer illumination with minimal cryogenic blackout periods',
      'Direct line-of-sight to Shackleton interior PSR floor',
      'High elevation reduces local mountain horizon occlusion',
      'Continuous Earth libration loop above horizon 62% of anomalistic cycle',
    ],
  },
  {
    id: 'malapert-massif-peak',
    name: 'Malapert Massif Peak',
    latitude: -86.02,
    longitude: 0.0,
    elevation: 4850,
    description:
      'Often called the "Mountain of Eternal Light and Earth Visibility". A massive 5 km peak providing the longest continuous Direct-to-Earth line-of-sight across the entire South Pole region.',
    missionRole: 'Lunar Communication Relay & Base Station Hub',
    peakIlluminationSummerPct: 86.4,
    psrProximityKm: 7.8,
    roughnessScore: 0.45,
    keyFeatures: [
      'Unbroken Direct-to-Earth (DTE) communication visibility exceeding 92% of month',
      'Wide regional surveillance over Connecting Ridge and Shoemaker basin',
      'Elevated above lunar horizon mask by over 4,800 meters',
      'Ideal telecom backbone for distributed rover assets',
    ],
  },
  {
    id: 'mons-mouton-plateau',
    name: 'Mons Mouton (IM-2 / VIPER Plateau)',
    latitude: -84.6,
    longitude: 31.0,
    elevation: 5400,
    description:
      'Vast elevated tableland plateau bordering Nobile crater. Key target for CLPS commercial robotic landers seeking volatile ice along subsurface permafrost boundary.',
    missionRole: 'CLPS Volatiles Prospecting & In-Situ Resource Utilization',
    peakIlluminationSummerPct: 78.5,
    psrProximityKm: 3.4,
    roughnessScore: 0.22,
    keyFeatures: [
      'Expansive flat terrain optimal for precision landing with minimal slope hazard',
      'Subsurface neutron spectrometer indicators for hydrogen enrichment',
      'Moderate Earth elevation with periodic grazing multipath dips',
      'Excellent traverse network for autonomous science rovers',
    ],
  },
  {
    id: 'nobile-crater-rim-1',
    name: 'Nobile Crater Rim 1',
    latitude: -85.2,
    longitude: 53.5,
    elevation: 1800,
    description:
      'North-facing rim ridge of Nobile crater with direct access to extensive cryogenic micro-cold traps. Highly prioritized for Artemis rover and drill prospecting payloads.',
    missionRole: 'Deep Drill Ice Extraction & Mobility Coring',
    peakIlluminationSummerPct: 72.0,
    psrProximityKm: 0.8,
    roughnessScore: 0.52,
    keyFeatures: [
      'Immediate access to volatile-bearing permanently shadowed craters',
      'Steep thermal gradients dropping to 60 K within 500 meters of rim',
      'Frequent terrain blockage of Earth during southern libration excursion',
      'Strong candidate for Gateway relay communication dependency testing',
    ],
  },
  {
    id: 'de-gerlache-rim-2',
    name: 'De Gerlache Crater Rim 2',
    latitude: -88.48,
    longitude: 271.2,
    elevation: 1950,
    description:
      'High rim crest overlooking the permanently dark interior of De Gerlache crater. Features sustained solar illumination ribbons along narrow topography.',
    missionRole: 'Artemis Surface EVA & Scientific Drill Benchmarking',
    peakIlluminationSummerPct: 83.2,
    psrProximityKm: 0.6,
    roughnessScore: 0.58,
    keyFeatures: [
      'Narrow illumination ridge with steep slopes exceeding 20° into interior',
      'High sensitivity to mast height raising solar intake above local crests',
      'Earth libration dips behind Malapert Massif for several consecutive days',
      'Critical comparison site against Shackleton Connecting Ridge',
    ],
  },
  {
    id: 'csa-leap-shackleton-saddle',
    name: 'CSA LEAP Traverse (Shackleton Saddle)',
    latitude: -89.72,
    longitude: 195.0,
    elevation: 1150,
    description:
      'Canadian Space Agency Lunar Exploration Accelerator Program (LEAP) utility rover study site along the gentle saddle transition into the Shackleton rim system.',
    missionRole: 'CSA Canadian Autonomous Micro-Rover Polar Night Survival',
    peakIlluminationSummerPct: 69.5,
    psrProximityKm: 0.4,
    roughnessScore: 0.41,
    keyFeatures: [
      'Engineered for 30 kg utility rover carrying multi-spectral & radiation sensors',
      'Frequent 40-70 hour solar shadow intervals requiring survival heater rationing',
      'Demands vertical tracking solar array to capture grazing sun at 1.5° above horizon',
      'Earth visibility subject to periodic occultation by Shackleton rim peaks',
    ],
  },
  {
    id: 'shiv-shakti-chandrayaan-3',
    name: 'Shiv Shakti Point (Chandrayaan-3)',
    latitude: -69.37,
    longitude: 32.32,
    elevation: 600,
    description:
      'Historic ISRO Chandrayaan-3 landing point. Located at high southern sub-polar latitude, serving as an authentic calibration benchmark between polar and sub-polar regimes.',
    missionRole: 'Sub-Polar Benchmark & Surface Thermophysical Calibration',
    peakIlluminationSummerPct: 50.0,
    psrProximityKm: 28.0,
    roughnessScore: 0.18,
    keyFeatures: [
      'Authentic lunar surface ground truth verified by ChaSTE & Pragyan rover',
      'Standard 14-day lunar day / 14-day lunar night cycle (non-grazing sun)',
      'High continuous Earth elevation (~20°) with zero terrain horizon obstruction',
      'Benchmark showing contrasting power profiles of sub-polar vs ultra-polar sites',
    ],
  },
  {
    id: 'haworth-crater-floor-psr',
    name: 'Haworth Crater Floor (PSR Cold Trap)',
    latitude: -87.45,
    longitude: 355.5,
    elevation: -3800,
    description:
      'Extreme Permanently Shadowed Region (PSR). Sunlight has not touched this crater floor for over 2 billion years. Cryogenic temperatures hover at 40 K (-233°C).',
    missionRole: 'Cryogenic Deep Cold Trap & Water-Ice Repository Study',
    peakIlluminationSummerPct: 0.0,
    psrProximityKm: 0.0,
    roughnessScore: 0.65,
    keyFeatures: [
      'Strictly zero direct solar illumination across all 365 days of the year',
      'Direct-to-Earth communication completely occluded by 3,800m crater walls',
      'Requires full nuclear (RTG) or tethered/beamed power and Gateway relay link',
      'Provides the baseline "Worst Case / Survival Impossible on Solar" reference',
    ],
  },
];

export const HARDWARE_DIGITAL_TWINS: HardwareProfile[] = [
  {
    id: 'csa-leap-rover',
    name: 'CSA LEAP Lunar Utility Rover',
    type: 'Autonomous Mobile Micro-Rover (Canadian Space Agency)',
    mastHeight: 1.8,
    arrayType: 'vertical',
    panelArea: 2.4,
    panelEfficiency: 0.32,
    batteryCapacityWh: 3200,
    baseLoadW: 45,
    eclipseHeaterW: 65,
    basePowerW: 45,
    heaterPowerW: 65,
    massKg: 30,
    description:
      'Agile 30 kg Canadian autonomous prospecting rover equipped with high-efficiency vertical bifacial solar mast and cryogenic survival heaters for polar rim operations.',
  },
  {
    id: 'nasa-clps-lander',
    name: 'NASA CLPS Nova-C / Griffin Class Lander',
    type: 'Commercial Lunar Payload Services Cargo Lander',
    mastHeight: 3.6,
    arrayType: 'vertical',
    panelArea: 6.5,
    panelEfficiency: 0.3,
    batteryCapacityWh: 8500,
    baseLoadW: 160,
    eclipseHeaterW: 210,
    basePowerW: 160,
    heaterPowerW: 210,
    massKg: 450,
    description:
      'Fixed robotic landing platform designed to power stationary drill payloads, mass spectrometers, and optical navigation beacons across multi-week missions.',
  },
  {
    id: 'artemis-iii-hls-ltv',
    name: 'Artemis III Crewed HLS / Lunar Terrain Vehicle',
    type: 'Human-Rated Crew Habitation & Heavy Pressurized Vehicle',
    mastHeight: 10.5,
    arrayType: 'vertical',
    panelArea: 28.0,
    panelEfficiency: 0.34,
    batteryCapacityWh: 42000,
    baseLoadW: 850,
    eclipseHeaterW: 600,
    basePowerW: 850,
    heaterPowerW: 600,
    massKg: 15000,
    description:
      'Heavy exploration infrastructure featuring a 10.5m tall deployable vertical solar tower and high-capacity LiFePO4 cryogenic battery banks for sustained astronaut sorties.',
  },
  {
    id: 'legacy-deck-lander',
    name: 'Legacy Equatorial Deck Lander (Apollo / Basic CubeRover)',
    type: 'Equatorial Architecture Lander with Flat Horizontal Deck',
    mastHeight: 0.8,
    arrayType: 'horizontal',
    panelArea: 2.0,
    panelEfficiency: 0.28,
    batteryCapacityWh: 1200,
    baseLoadW: 55,
    eclipseHeaterW: 80,
    basePowerW: 55,
    heaterPowerW: 80,
    massKg: 15,
    description:
      'Classic spacecraft design where solar panels lie flat on the top deck. Demonstrates the extreme cosine-loss failure of equatorial designs when placed in polar grazing sun.',
  },
];

export const LUNAR_CONSTANTS = {
  MOON_RADIUS_KM: JPL_MOON_GEOPHYSICAL_DATA.radiusIauKm, // 1737.4 km (IAU reference sphere)
  MOON_VOL_MEAN_RADIUS_KM: JPL_MOON_GEOPHYSICAL_DATA.volMeanRadiusKm, // 1737.53 km
  MOON_RADIUS_GRAVITY_KM: JPL_MOON_GEOPHYSICAL_DATA.radiusGravityKm, // 1738.0 km
  MOON_GM_KM3_S2: JPL_MOON_GEOPHYSICAL_DATA.gmKm3S2, // 4902.800066 km³/s²
  MOON_SURFACE_GRAVITY_M_S2: JPL_MOON_GEOPHYSICAL_DATA.surfaceGravityMS2, // 1.62 m/s²
  MOON_SURFACE_EMISSIVITY: JPL_MOON_GEOPHYSICAL_DATA.surfaceEmissivity, // 0.92
  MOON_MASS_KG: JPL_MOON_GEOPHYSICAL_DATA.massKg, // 7.349e22 kg
  EARTH_MOON_MASS_RATIO: JPL_MOON_GEOPHYSICAL_DATA.earthMoonMassRatio, // 81.3005690769
  SOLAR_CONSTANT_W_M2: JPL_MOON_GEOPHYSICAL_DATA.solarConstantMeanWm2, // 1368.0 W/m² (JPL Horizons mean)
  SOLAR_CONSTANT_PERIHELION_W_M2: JPL_MOON_GEOPHYSICAL_DATA.solarConstantPerihelionWm2, // 1414.0 W/m²
  SOLAR_CONSTANT_APHELION_W_M2: JPL_MOON_GEOPHYSICAL_DATA.solarConstantAphelionWm2, // 1323.0 W/m²
  MAX_PLANETARY_IR_W_M2: JPL_MOON_GEOPHYSICAL_DATA.maxPlanetaryIRWm2, // 1268.0 W/m²
  MIN_PLANETARY_IR_W_M2: JPL_MOON_GEOPHYSICAL_DATA.minPlanetaryIRWm2, // 5.2 W/m² (cryogenic floor)
  HEAT_FLOW_APOLLO_15_MW_M2: JPL_MOON_GEOPHYSICAL_DATA.heatFlowApollo15MWm2, // 3.1 mW/m²
  HEAT_FLOW_APOLLO_17_MW_M2: JPL_MOON_GEOPHYSICAL_DATA.heatFlowApollo17MWm2, // 2.2 mW/m²
  GEOMETRIC_ALBEDO: JPL_MOON_GEOPHYSICAL_DATA.geometricAlbedo, // 0.12
  SIDEREAL_ROT_RATE_RAD_S: JPL_MOON_GEOPHYSICAL_DATA.siderealRotRateRadS, // 2.6617e-6 rad/s
  SUN_ANGULAR_RADIUS_DEG: 0.2665, // Diameter = 0.533 deg (31'05.2")
  SUN_ANGULAR_DIAMETER_DEG: 0.533,
  MOON_OBLIQUITY_ECLIPTIC_DEG: 1.5424,
  MOON_ORBITAL_INCLINATION_DEG: JPL_MOON_GEOPHYSICAL_DATA.inclinationDeg, // 5.145 deg
  DRACONIC_YEAR_DAYS: 346.62,
  SYNODIC_MONTH_DAYS: 29.530589, // 708.734 hours
  ANOMALISTIC_MONTH_DAYS: 27.55455,
  DRACONIC_MONTH_DAYS: 27.21222,
  MAX_OPTICAL_LIBRATION_LAT_DEG: 6.68,
  MAX_OPTICAL_LIBRATION_LON_DEG: 7.9,
  GATEWAY_NRHO_PERIOD_DAYS: 6.56,
  GATEWAY_SOUTH_DWELL_DAYS: 5.5,
  GATEWAY_MIN_SOUTH_ELEV_DEG: 45.0,
  GATEWAY_MAX_SOUTH_ELEV_DEG: 85.0,
  DSN_STATIONS: [
    { name: 'Goldstone' as const, lonDeg: -116.89, minLonRange: -160, maxLonRange: -40 },
    { name: 'Madrid' as const, lonDeg: -4.25, minLonRange: -40, maxLonRange: 40 },
    { name: 'Canberra' as const, lonDeg: 148.98, minLonRange: 40, maxLonRange: 160 },
  ],
};

