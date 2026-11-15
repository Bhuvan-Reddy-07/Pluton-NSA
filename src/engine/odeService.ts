/**
 * PLUTON - Washington University in St. Louis (WUSTL)
 * Planetary Data System (PDS) Orbital Data Explorer (ODE) Service
 * Reference: https://ode.rsl.wustl.edu/moon/datasets
 * REST API: https://oderest.rsl.wustl.edu/live2
 */

import {
  ODEDataset,
  ODEProduct,
  ODEQueryParams,
  ODESiteCalibration,
} from '@/types/ode';
import {
  ODE_MOON_DATASETS,
  ODE_SOUTH_POLE_CURATED_PRODUCTS,
  ODE_SITE_CALIBRATIONS,
  getODEDatasetsByMission,
  getODEDatasetsByCategory,
  getODECuratedProductsForSite,
  getODESiteCalibration,
} from '@/data/odeMoonDatasets';
import { LunarSite } from '@/types/pluton';

export interface ODELiveQueryResult {
  source: 'LIVE_WUSTL_ODE' | 'CURATED_PDS_GROUND_TRUTH';
  count: number;
  products: ODEProduct[];
  upstreamUrl?: string;
}

/**
 * Queries Washington University in St. Louis ODE REST API via Next.js proxy
 */
export async function queryODELiveProducts(
  params: ODEQueryParams
): Promise<ODELiveQueryResult> {
  const queryUrl = new URL('/api/ode', window.location.origin);
  queryUrl.searchParams.set('query', 'product');
  queryUrl.searchParams.set('results', params.results || 'm');
  queryUrl.searchParams.set('limit', String(params.limit || 15));

  if (params.ihid) queryUrl.searchParams.set('ihid', params.ihid);
  if (params.iid) queryUrl.searchParams.set('iid', params.iid);
  if (params.pt) queryUrl.searchParams.set('pt', params.pt);
  if (params.minLat !== undefined) queryUrl.searchParams.set('minlat', String(params.minLat));
  if (params.maxLat !== undefined) queryUrl.searchParams.set('maxlat', String(params.maxLat));
  if (params.westLon !== undefined) queryUrl.searchParams.set('westlon', String(params.westLon));
  if (params.eastLon !== undefined) queryUrl.searchParams.set('eastlon', String(params.eastLon));

  try {
    const res = await fetch(queryUrl.toString());
    if (!res.ok) throw new Error(`HTTP error ${res.status}`);
    const json = await res.json();

    const rawProducts = json.data?.Products?.Product;
    const prodList = Array.isArray(rawProducts)
      ? rawProducts
      : rawProducts
      ? [rawProducts]
      : [];

    const parsedProducts: ODEProduct[] = prodList.map((p: any, idx: number) => {
      const files: any[] = Array.isArray(p.Product_files?.Product_file)
        ? p.Product_files.Product_file
        : p.Product_files?.Product_file
        ? [p.Product_files.Product_file]
        : [];

      return {
        pdsId: p.PdsId || p.Product_name || `ODE_PROD_${idx}`,
        productName: p.Product_name || 'PDS_Data_Product',
        productUrl: p.ProductURL || '',
        ihid: params.ihid || 'LRO',
        ihName: p.IHName || 'Lunar Reconnaissance Orbiter',
        iid: params.iid || 'LOLA',
        iName: p.IName || 'Lunar Instrument',
        pt: params.pt || 'GDR',
        ptName: p.PTName || 'Gridded Data Record',
        description: p.Description || 'Planetary Data System Lunar Data Product from WUSTL ODE.',
        labelUrl: p.LabelURL,
        externalUrl: p.External_url,
        filesUrl: p.FilesURL,
        minLat: Number(p.Minimum_latitude ?? params.minLat ?? -90),
        maxLat: Number(p.Maximum_latitude ?? params.maxLat ?? -80),
        westLon: Number(p.Westernmost_longitude ?? params.westLon ?? 0),
        eastLon: Number(p.Easternmost_longitude ?? params.eastLon ?? 360),
        centerLat: Number(p.Center_latitude ?? -85),
        centerLon: Number(p.Center_longitude ?? 0),
        mapScaleMPerPixel: p.Map_scale ? Number(p.Map_scale) : undefined,
        mapResolutionPixPerDeg: p.Map_resolution ? Number(p.Map_resolution) : undefined,
        observationTime: p.Observation_time,
        startTime: p.UTC_start_time,
        stopTime: p.UTC_stop_time,
        isPolarGDR: true,
        associatedSiteIds: [],
        productFiles: files.map((f: any) => ({
          fileName: f.FileName || 'Product_File',
          fileType: f.Type?.includes('XML')
            ? 'LABEL_XML'
            : f.Type?.includes('LBL')
            ? 'LABEL_LBL'
            : f.Type?.includes('JPG')
            ? 'BROWSE_JPG'
            : f.Type?.includes('TAB')
            ? 'DATA_TAB'
            : 'DATA_IMG',
          downloadUrl: f.URL || p.External_url || p.ProductURL,
          description: f.Description || 'PDS Product Component',
        })),
      };
    });

    return {
      source: json.source || 'LIVE_WUSTL_ODE',
      count: parsedProducts.length,
      products: parsedProducts,
      upstreamUrl: json.upstreamUrl,
    };
  } catch {
    // Return curated fallback
    const filtered = ODE_SOUTH_POLE_CURATED_PRODUCTS.filter((p) => {
      const matchIhid = !params.ihid || p.ihid.toUpperCase() === params.ihid.toUpperCase();
      const matchIid = !params.iid || p.iid.toUpperCase() === params.iid.toUpperCase();
      const matchPt = !params.pt || p.pt.toUpperCase() === params.pt.toUpperCase();
      return matchIhid && matchIid && matchPt;
    });

    return {
      source: 'CURATED_PDS_GROUND_TRUTH',
      count: filtered.length,
      products: filtered,
    };
  }
}

/**
 * Finds all curated and localized PDS products for a target Lunar South Pole site
 */
export function getProductsForSite(site: LunarSite): ODEProduct[] {
  return getODECuratedProductsForSite(site.id);
}

/**
 * Retrieves physical calibration parameters based on LOLA, Diviner & M3 ground-truth
 */
export function getCalibrationForSite(siteId: string): ODESiteCalibration {
  const cal = getODESiteCalibration(siteId);
  if (cal) return cal;

  // Fallback defaults for general South Pole terrain
  return {
    siteId,
    siteName: 'Lunar South Pole Site',
    lolaDemResolutionM: 20.0,
    lolaMeanSlopeDeg: 9.5,
    divinerMinTempK: 80.0,
    divinerMaxTempK: 240.0,
    divinerMeanBolometricTempK: 160.0,
    psrIceStabilityDepthM: 0.15,
    m3WaterEquivalentHwtPct: 0.85,
    radarCircularPolarizationRatio: 0.65,
    sourceProducts: ['LDEM_256_90S_00S_000_180_FLOAT', 'DLRE_PRP_SOUTH_TAB'],
  };
}

/**
 * Export datasets list to CSV
 */
export function exportODEDatasetsToCsv(datasets: ODEDataset[]): string {
  const headers = [
    'DataSetId',
    'Mission_Host',
    'Mission_Name',
    'Instrument_ID',
    'Instrument_Name',
    'Product_Type',
    'Product_Type_Name',
    'Category',
    'Number_Products',
    'Min_Obs_Time',
    'Max_Obs_Time',
  ];

  const rows = datasets.map((d) => [
    `"${d.DataSetId.replace(/"/g, '""')}"`,
    `"${d.IHID}"`,
    `"${d.IHName.replace(/"/g, '""')}"`,
    `"${d.IID}"`,
    `"${d.IName.replace(/"/g, '""')}"`,
    `"${d.PT}"`,
    `"${d.PTName.replace(/"/g, '""')}"`,
    `"${d.category}"`,
    d.NumberProducts || '0',
    `"${d.MinObservationTime || ''}"`,
    `"${d.MaxObservationTime || ''}"`,
  ]);

  return [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
}

/**
 * Export curated products list to CSV
 */
export function exportODEProductsToCsv(products: ODEProduct[]): string {
  const headers = [
    'PDS_ID',
    'Product_Name',
    'Mission',
    'Instrument',
    'Product_Type',
    'Scale_M_Per_Pixel',
    'Min_Lat',
    'Max_Lat',
    'West_Lon',
    'East_Lon',
    'Product_URL',
    'Label_URL',
    'Data_Download_URL',
  ];

  const rows = products.map((p) => [
    `"${p.pdsId}"`,
    `"${p.productName}"`,
    `"${p.ihid}"`,
    `"${p.iid}"`,
    `"${p.pt}"`,
    p.mapScaleMPerPixel ? p.mapScaleMPerPixel.toFixed(1) : '',
    p.minLat.toFixed(2),
    p.maxLat.toFixed(2),
    p.westLon.toFixed(2),
    p.eastLon.toFixed(2),
    `"${p.productUrl}"`,
    `"${p.labelUrl || ''}"`,
    `"${p.externalUrl || ''}"`,
  ]);

  return [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
}

export {
  ODE_MOON_DATASETS,
  ODE_SOUTH_POLE_CURATED_PRODUCTS,
  ODE_SITE_CALIBRATIONS,
  getODEDatasetsByMission,
  getODEDatasetsByCategory,
};

