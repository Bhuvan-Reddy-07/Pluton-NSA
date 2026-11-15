/**
 * PLUTON - Washington University in St. Louis (WUSTL)
 * Planetary Data System (PDS) Lunar Orbital Data Explorer (ODE) Types
 * Reference: https://ode.rsl.wustl.edu/moon/datasets
 * REST API: https://oderest.rsl.wustl.edu/live2
 */

export interface ODEDataset {
  DataSetId: string;
  IHID: string;
  IHName: string;
  IID: string;
  IName: string;
  PT: string;
  PTName: string;
  NumberProducts?: string;
  MinProductId?: string;
  MaxProductId?: string;
  MinObservationTime?: string;
  MaxObservationTime?: string;
  ValidEmissionAngles?: string;
  ValidFootprints?: string;
  ValidIncidenceAngles?: string;
  ValidObservationTimes?: string;
  ValidPhaseAngles?: string;
  ValidSolLongs?: string;
  ODEMetaDB: string;
  description?: string;
  category: 'TOPOGRAPHY' | 'THERMAL' | 'IMAGERY' | 'SPECTROMETRY' | 'RADAR' | 'GRAVIMETRY' | 'VOLATILES';
}

export interface ODEProductFile {
  fileName: string;
  fileType: 'DATA_IMG' | 'DATA_TAB' | 'LABEL_XML' | 'LABEL_LBL' | 'BROWSE_JPG' | 'FOOTPRINT_KML' | 'SHAPEFILE_ZIP';
  downloadUrl: string;
  fileSizeBytes?: number;
  description: string;
}

export interface ODEProduct {
  pdsId: string;
  productName: string;
  productUrl: string;
  ihid: string;
  ihName: string;
  iid: string;
  iName: string;
  pt: string;
  ptName: string;
  description: string;
  labelUrl?: string;
  externalUrl?: string;
  filesUrl?: string;
  minLat: number;
  maxLat: number;
  westLon: number;
  eastLon: number;
  centerLat: number;
  centerLon: number;
  mapScaleMPerPixel?: number;
  mapResolutionPixPerDeg?: number;
  observationTime?: string;
  startTime?: string;
  stopTime?: string;
  isPolarGDR: boolean;
  associatedSiteIds: string[];
  productFiles: ODEProductFile[];
}

export interface ODEQueryParams {
  target?: string;
  ihid?: string;
  iid?: string;
  pt?: string;
  minLat?: number;
  maxLat?: number;
  westLon?: number;
  eastLon?: number;
  limit?: number;
  results?: 'm' | 'c' | 'fm';
}

export interface ODESiteCalibration {
  siteId: string;
  siteName: string;
  lolaDemResolutionM: number;
  lolaMeanSlopeDeg: number;
  divinerMinTempK: number;
  divinerMaxTempK: number;
  divinerMeanBolometricTempK: number;
  psrIceStabilityDepthM: number;
  m3WaterEquivalentHwtPct: number;
  radarCircularPolarizationRatio: number;
  sourceProducts: string[];
}

