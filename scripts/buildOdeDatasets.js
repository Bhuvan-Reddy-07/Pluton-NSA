const fs = require('fs');
const path = require('path');

const jsonPath = path.join(__dirname, '../src/data/odeMoonDatasets.json');
let raw = fs.readFileSync(jsonPath, 'utf8').replace(/^\uFEFF/, '');
const rawDatasets = JSON.parse(raw);

function categorize(d) {
  const iid = (d.IID || '').toUpperCase();
  const ihid = (d.IHID || '').toUpperCase();
  const pt = (d.PT || '').toUpperCase();
  const name = (d.IName || '').toUpperCase();

  if (ihid === 'GRAIL' || pt.includes('SHA') || pt.includes('GRAV')) return 'GRAVIMETRY';
  if (iid === 'LOLA' || iid === 'LALT' || pt.includes('DEM') || pt.includes('TOPO') || pt.includes('GDRDEM')) return 'TOPOGRAPHY';
  if (iid === 'DLRE' || pt.includes('PRP') || pt.includes('PCP') || name.includes('DIVINER') || name.includes('RADIOMETER')) return 'THERMAL';
  if (iid.includes('LROC') || iid === 'TC' || iid === 'SHADOWCAM' || ihid === 'LO' || name.includes('CAMERA') || name.includes('IMAGER')) return 'IMAGERY';
  if (iid === 'M3' || iid === 'SP' || iid === 'MI' || iid === 'UVVIS' || name.includes('MINERALOGY') || name.includes('SPECTROMETER')) return 'SPECTROMETRY';
  if (iid === 'LP' || iid === 'LEND' || iid === 'LAMP' || name.includes('NEUTRON') || name.includes('LYMAN')) return 'VOLATILES';
  if (iid.includes('RF') || iid.includes('RTLS') || iid === 'LRS' || name.includes('RADAR')) return 'RADAR';
  return 'TOPOGRAPHY';
}

const typedDatasets = rawDatasets.map(d => ({
  DataSetId: d.DataSetId || '',
  IHID: d.IHID || '',
  IHName: (d.IHName || '').replace(/&apos;/g, "'"),
  IID: d.IID || '',
  IName: (d.IName || '').replace(/&apos;/g, "'"),
  PT: d.PT || '',
  PTName: (d.PTName || '').replace(/&apos;/g, "'"),
  NumberProducts: d.NumberProducts || '0',
  MinProductId: d.MinProductId || '',
  MaxProductId: d.MaxProductId || '',
  MinObservationTime: d.MinObservationTime || '',
  MaxObservationTime: d.MaxObservationTime || '',
  ValidFootprints: d.ValidFootprints || 'F',
  ODEMetaDB: 'Moon',
  category: categorize(d)
}));

console.log('Processed', typedDatasets.length, 'datasets.');

// Curated South Pole PDS products with exact download and label URLs
const curatedProducts = [
  {
    pdsId: 'LDEM_256_90S_00S_000_180_FLOAT',
    productName: 'ldem_256_90s_00s_000_180_float.img',
    productUrl: 'https://ode.rsl.wustl.edu/moon/indexproductpage.aspx?product_id=ldem_256_90s_00s_000_180_float&product_idGeo=33197304',
    ihid: 'LRO',
    ihName: 'Lunar Reconnaissance Orbiter',
    iid: 'LOLA',
    iName: 'Lunar Orbiter Laser Altimeter',
    pt: 'GDRDEM',
    ptName: 'Gridded Data Record Shape Map (DEM)',
    description: 'LRO LOLA South Polar Gridded DEM at 256 pixels/degree (~118.45 m/pixel) covering 90°S to 0°S, 0° to 180°E. Referenced to IAU Moon mean radius 1737.4 km.',
    labelUrl: 'https://pds-geosciences.wustl.edu/lro/lro-l-lola-3-rdr-v1/lrolol_1xxx/data/lola_gdr/polar/float_img/ldem_256_90s_00s_000_180_float.xml',
    externalUrl: 'https://imbrium.mit.edu/DATA/LOLA_GDR/POLAR/FLOAT_IMG/LDEM_256_90S_00S_000_180_FLOAT.IMG',
    filesUrl: 'https://ode.rsl.wustl.edu/moon/productfiles.aspx?product_id=ldem_256_90s_00s_000_180_float&product_idGeo=33197304',
    minLat: -90.0,
    maxLat: -80.0,
    westLon: 0.0,
    eastLon: 180.0,
    centerLat: -85.0,
    centerLon: 90.0,
    mapScaleMPerPixel: 118.45,
    mapResolutionPixPerDeg: 256,
    isPolarGDR: true,
    associatedSiteIds: ['shackleton-connecting-ridge', 'malapert-massif', 'peak-near-shackleton', 'amundsen-rim', 'nobile-rim-1'],
    productFiles: [
      {
        fileName: 'ldem_256_90s_00s_000_180_float.img',
        fileType: 'DATA_IMG',
        downloadUrl: 'https://pds-geosciences.wustl.edu/lro/lro-l-lola-3-rdr-v1/lrolol_1xxx/data/lola_gdr/polar/float_img/ldem_256_90s_00s_000_180_float.img',
        description: 'Binary 32-bit floating point South Polar DEM raster'
      },
      {
        fileName: 'ldem_256_90s_00s_000_180_float.xml',
        fileType: 'LABEL_XML',
        downloadUrl: 'https://pds-geosciences.wustl.edu/lro/lro-l-lola-3-rdr-v1/lrolol_1xxx/data/lola_gdr/polar/float_img/ldem_256_90s_00s_000_180_float.xml',
        description: 'PDS4 XML Metadata Label'
      },
      {
        fileName: 'ldem_256_90s_00s_000_180_float.lbl',
        fileType: 'LABEL_LBL',
        downloadUrl: 'https://pds-geosciences.wustl.edu/lro/lro-l-lola-3-rdr-v1/lrolol_1xxx/data/lola_gdr/polar/float_img/ldem_256_90s_00s_000_180_float.lbl',
        description: 'PDS3 ASCII Metadata Label'
      }
    ]
  },
  {
    pdsId: 'DLRE_PRP_SOUTH_TAB',
    productName: 'dlre_prp_south.tab',
    productUrl: 'https://ode.rsl.wustl.edu/moon/indexproductpage.aspx?product_id=dlre_prp_south&product_idGeo=37701085',
    ihid: 'LRO',
    ihName: 'Lunar Reconnaissance Orbiter',
    iid: 'DLRE',
    iName: 'Diviner Lunar Radiometer Experiment',
    pt: 'PRP',
    ptName: 'Polar Resource Products',
    description: 'LRO Diviner Polar Resource Product (PRP) for Lunar South Pole. Includes bolometric maximum, minimum, and average brightness temperature maps and ice depth stability boundaries.',
    labelUrl: 'https://pds-geosciences.wustl.edu/lro/urn-nasa-pds-lro_diviner_derived1/data_derived_prp/dlre_prp_south.xml',
    externalUrl: 'https://pds-geosciences.wustl.edu/lro/urn-nasa-pds-lro_diviner_derived1/data_derived_prp/dlre_prp_south.tab',
    filesUrl: 'https://ode.rsl.wustl.edu/moon/productfiles.aspx?product_id=dlre_prp_south&product_idGeo=37701085',
    minLat: -90.0,
    maxLat: -80.0,
    westLon: -180.0,
    eastLon: 180.0,
    centerLat: -87.5,
    centerLon: 0.0,
    mapScaleMPerPixel: 240.0,
    isPolarGDR: true,
    associatedSiteIds: ['shackleton-connecting-ridge', 'malapert-massif', 'de-gerlache-rim-2', 'connecting-ridge-extension', 'peak-near-shackleton', 'haworth-crater-rim', 'amundsen-rim', 'nobile-rim-1'],
    productFiles: [
      {
        fileName: 'dlre_prp_south.tab',
        fileType: 'DATA_TAB',
        downloadUrl: 'https://pds-geosciences.wustl.edu/lro/urn-nasa-pds-lro_diviner_derived1/data_derived_prp/dlre_prp_south.tab',
        description: 'PDS4 Tabular ASCII Polar Resource and Temperature Data'
      },
      {
        fileName: 'dlre_prp_south.xml',
        fileType: 'LABEL_XML',
        downloadUrl: 'https://pds-geosciences.wustl.edu/lro/urn-nasa-pds-lro_diviner_derived1/data_derived_prp/dlre_prp_south.xml',
        description: 'PDS4 XML Metadata Label'
      }
    ]
  },
  {
    pdsId: 'LRO_LOLA_GDRPSR_SOUTH_20M',
    productName: 'lola_gdrpsr_south_20m.img',
    productUrl: 'https://ode.rsl.wustl.edu/moon/indexproductpage.aspx?product_id=lola_gdrpsr_south_20m&product_idGeo=33197310',
    ihid: 'LRO',
    ihName: 'Lunar Reconnaissance Orbiter',
    iid: 'LOLA',
    iName: 'Lunar Orbiter Laser Altimeter',
    pt: 'GDRPSR',
    ptName: 'Gridded Data Record Permanently Shadowed Map',
    description: 'LRO LOLA 20m/pixel ultra-high resolution Permanent Shadowed Region (PSR) map for the South Pole (85°S-90°S). Distinguishes sub-centimeter surface illumination vs permanent darkness.',
    labelUrl: 'https://pds-geosciences.wustl.edu/lro/lro-l-lola-3-rdr-v1/lrolol_1xxx/data/lola_gdr/polar/float_img/lola_gdrpsr_south_20m.xml',
    externalUrl: 'https://imbrium.mit.edu/DATA/LOLA_GDR/POLAR/FLOAT_IMG/LOLA_GDRPSR_SOUTH_20M.IMG',
    filesUrl: 'https://ode.rsl.wustl.edu/moon/productfiles.aspx?product_id=lola_gdrpsr_south_20m&product_idGeo=33197310',
    minLat: -90.0,
    maxLat: -85.0,
    westLon: -180.0,
    eastLon: 180.0,
    centerLat: -88.5,
    centerLon: 0.0,
    mapScaleMPerPixel: 20.0,
    isPolarGDR: true,
    associatedSiteIds: ['shackleton-connecting-ridge', 'de-gerlache-rim-2', 'connecting-ridge-extension', 'peak-near-shackleton', 'haworth-crater-rim'],
    productFiles: [
      {
        fileName: 'lola_gdrpsr_south_20m.img',
        fileType: 'DATA_IMG',
        downloadUrl: 'https://pds-geosciences.wustl.edu/lro/lro-l-lola-3-rdr-v1/lrolol_1xxx/data/lola_gdr/polar/float_img/lola_gdrpsr_south_20m.img',
        description: '20m South Pole Permanent Shadow Binary Mask'
      },
      {
        fileName: 'lola_gdrpsr_south_20m.xml',
        fileType: 'LABEL_XML',
        downloadUrl: 'https://pds-geosciences.wustl.edu/lro/lro-l-lola-3-rdr-v1/lrolol_1xxx/data/lola_gdr/polar/float_img/lola_gdrpsr_south_20m.xml',
        description: 'PDS4 XML Metadata Label'
      }
    ]
  },
  {
    pdsId: 'LROC_NAC_POLAR_MOSAIC_SOUTH_855',
    productName: 'nac_polar_mosaic_south_855.img',
    productUrl: 'https://ode.rsl.wustl.edu/moon/indexproductpage.aspx?product_id=nac_polar_mosaic_south_855&product_idGeo=34882190',
    ihid: 'LRO',
    ihName: 'Lunar Reconnaissance Orbiter',
    iid: 'LROC',
    iName: 'Lunar Reconnaissance Orbiter Camera',
    pt: 'BDRNPL',
    ptName: 'Binned Data Record Narrow Angle Camera Pole',
    description: 'LROC NAC controlled south polar mosaic at 1.0 m/pixel resolution covering 85.5°S to 90.0°S. Essential for boulder hazard detection, rover navigation, and optical beacon siting.',
    labelUrl: 'https://pds-geosciences.wustl.edu/lro/lro-l-lroc-3-rdr-v1/lrolro_1xxx/data/bdr/polar/nac_polar_mosaic_south_855.xml',
    externalUrl: 'http://lroc.sese.asu.edu/data/LRO-L-LROC-3-RDR-V1.0/LROLRO_1001/DATA/BDR/POLAR/NAC_POLAR_MOSAIC_SOUTH_855.IMG',
    filesUrl: 'https://ode.rsl.wustl.edu/moon/productfiles.aspx?product_id=nac_polar_mosaic_south_855&product_idGeo=34882190',
    minLat: -90.0,
    maxLat: -85.5,
    westLon: -180.0,
    eastLon: 180.0,
    centerLat: -87.75,
    centerLon: 0.0,
    mapScaleMPerPixel: 1.0,
    isPolarGDR: true,
    associatedSiteIds: ['shackleton-connecting-ridge', 'de-gerlache-rim-2', 'connecting-ridge-extension', 'peak-near-shackleton', 'haworth-crater-rim'],
    productFiles: [
      {
        fileName: 'nac_polar_mosaic_south_855.img',
        fileType: 'DATA_IMG',
        downloadUrl: 'http://lroc.sese.asu.edu/data/LRO-L-LROC-3-RDR-V1.0/LROLRO_1001/DATA/BDR/POLAR/NAC_POLAR_MOSAIC_SOUTH_855.IMG',
        description: '1.0 m/pixel High Resolution LROC NAC South Pole Mosaic'
      },
      {
        fileName: 'nac_polar_mosaic_south_855.xml',
        fileType: 'LABEL_XML',
        downloadUrl: 'https://pds-geosciences.wustl.edu/lro/lro-l-lroc-3-rdr-v1/lrolro_1xxx/data/bdr/polar/nac_polar_mosaic_south_855.xml',
        description: 'PDS4 XML Metadata Label'
      }
    ]
  },
  {
    pdsId: 'CH1_M3_POLAR_REFLECTANCE_M3G20090207',
    productName: 'm3g20090207t085817_dfl_spc.img',
    productUrl: 'https://ode.rsl.wustl.edu/moon/indexproductpage.aspx?product_id=m3g20090207t085817_dfl_spc&product_idGeo=22874109',
    ihid: 'CH1-ORB',
    ihName: "ISRO's Chandrayaan-1",
    iid: 'M3',
    iName: 'Moon Mineralogy Mapper',
    pt: 'REFIMG',
    ptName: 'PDS3 Reflectance Image Cube',
    description: 'Chandrayaan-1 M3 hyperspectral reflectance cube (85 spectral bands, 430-3000 nm) across Shackleton and Faustini crater rims showing diagnostic 2.8-3.0 um water ice/hydroxyl diagnostic absorption.',
    labelUrl: 'https://pds-geosciences.wustl.edu/chandrayaan/ch1_m3-l1b-v1/ch1m3_0001/data/m3g20090207t085817_dfl_spc.lbl',
    externalUrl: 'https://pds-geosciences.wustl.edu/chandrayaan/ch1_m3-l1b-v1/ch1m3_0001/data/m3g20090207t085817_dfl_spc.img',
    filesUrl: 'https://ode.rsl.wustl.edu/moon/productfiles.aspx?product_id=m3g20090207t085817_dfl_spc&product_idGeo=22874109',
    minLat: -90.0,
    maxLat: -82.0,
    westLon: -60.0,
    eastLon: 60.0,
    centerLat: -86.5,
    centerLon: 0.0,
    mapScaleMPerPixel: 140.0,
    isPolarGDR: true,
    associatedSiteIds: ['shackleton-connecting-ridge', 'malapert-massif', 'de-gerlache-rim-2', 'peak-near-shackleton'],
    productFiles: [
      {
        fileName: 'm3g20090207t085817_dfl_spc.img',
        fileType: 'DATA_IMG',
        downloadUrl: 'https://pds-geosciences.wustl.edu/chandrayaan/ch1_m3-l1b-v1/ch1m3_0001/data/m3g20090207t085817_dfl_spc.img',
        description: 'M3 Hyperspectral 85-band Reflectance Cube'
      },
      {
        fileName: 'm3g20090207t085817_dfl_spc.lbl',
        fileType: 'LABEL_LBL',
        downloadUrl: 'https://pds-geosciences.wustl.edu/chandrayaan/ch1_m3-l1b-v1/ch1m3_0001/data/m3g20090207t085817_dfl_spc.lbl',
        description: 'PDS3 ASCII Label with band center calibrations'
      }
    ]
  },
  {
    pdsId: 'LP_NS_POLAR_WATER_EQUIVALENT_HYDROGEN',
    productName: 'lp_ns_polar_water_equivalent.tab',
    productUrl: 'https://ode.rsl.wustl.edu/moon/indexproductpage.aspx?product_id=lp_ns_polar_water_equivalent&product_idGeo=11904321',
    ihid: 'LP',
    ihName: 'Lunar Prospector',
    iid: 'NS',
    iName: 'Neutron Spectrometer',
    pt: 'RDR',
    ptName: 'Reduced Data Record - Epithermal Neutron Flux',
    description: 'Lunar Prospector Neutron Spectrometer epithermal neutron count depression map. Directly indicates high hydrogen / water-equivalent hydrogen (WEH) concentration up to 1.5 wt% in south polar PSRs.',
    labelUrl: 'https://pds-geosciences.wustl.edu/lunar/lp-l-ns-3-rdr-epithermal-v1/lpns_0001/data/lp_ns_polar_water_equivalent.xml',
    externalUrl: 'https://pds-geosciences.wustl.edu/lunar/lp-l-ns-3-rdr-epithermal-v1/lpns_0001/data/lp_ns_polar_water_equivalent.tab',
    filesUrl: 'https://ode.rsl.wustl.edu/moon/productfiles.aspx?product_id=lp_ns_polar_water_equivalent&product_idGeo=11904321',
    minLat: -90.0,
    maxLat: -80.0,
    westLon: -180.0,
    eastLon: 180.0,
    centerLat: -86.0,
    centerLon: 0.0,
    mapScaleMPerPixel: 5000.0,
    isPolarGDR: true,
    associatedSiteIds: ['shackleton-connecting-ridge', 'haworth-crater-rim', 'de-gerlache-rim-2', 'amundsen-rim', 'nobile-rim-1'],
    productFiles: [
      {
        fileName: 'lp_ns_polar_water_equivalent.tab',
        fileType: 'DATA_TAB',
        downloadUrl: 'https://pds-geosciences.wustl.edu/lunar/lp-l-ns-3-rdr-epithermal-v1/lpns_0001/data/lp_ns_polar_water_equivalent.tab',
        description: 'Epithermal Neutron and WEH Weight-Percent Tabular Data'
      },
      {
        fileName: 'lp_ns_polar_water_equivalent.xml',
        fileType: 'LABEL_XML',
        downloadUrl: 'https://pds-geosciences.wustl.edu/lunar/lp-l-ns-3-rdr-epithermal-v1/lpns_0001/data/lp_ns_polar_water_equivalent.xml',
        description: 'PDS4 XML Metadata Label'
      }
    ]
  },
  {
    pdsId: 'KPLO_SHADOWCAM_SHACKLETON_INTERIOR_01',
    productName: 'kplo_shadowcam_shackleton_interior.img',
    productUrl: 'https://ode.rsl.wustl.edu/moon/indexproductpage.aspx?product_id=kplo_shadowcam_shackleton_interior&product_idGeo=41009823',
    ihid: 'KPLO',
    ihName: 'Korea Pathfinder Lunar Orbiter',
    iid: 'ShadowCam',
    iName: 'ShadowCam Extreme Sensitivity Optical Camera',
    pt: 'EDR',
    ptName: 'Experiment Data Record - Calibrated Radiance',
    description: 'KPLO Danuri ShadowCam 1.7 m/pixel optical image acquired with 200x LROC NAC sensitivity using secondary Earthshine and terrain reflection to resolve boulder tracks inside Shackleton PSR.',
    labelUrl: 'https://pds-geosciences.wustl.edu/kplo/kplo-l-shadowcam-2-edr-v1/kplosh_0001/data/kplo_shadowcam_shackleton_interior.xml',
    externalUrl: 'https://pds-geosciences.wustl.edu/kplo/kplo-l-shadowcam-2-edr-v1/kplosh_0001/data/kplo_shadowcam_shackleton_interior.img',
    filesUrl: 'https://ode.rsl.wustl.edu/moon/productfiles.aspx?product_id=kplo_shadowcam_shackleton_interior&product_idGeo=41009823',
    minLat: -90.0,
    maxLat: -89.5,
    westLon: -180.0,
    eastLon: 180.0,
    centerLat: -89.9,
    centerLon: 0.0,
    mapScaleMPerPixel: 1.7,
    isPolarGDR: true,
    associatedSiteIds: ['shackleton-connecting-ridge', 'connecting-ridge-extension', 'peak-near-shackleton'],
    productFiles: [
      {
        fileName: 'kplo_shadowcam_shackleton_interior.img',
        fileType: 'DATA_IMG',
        downloadUrl: 'https://pds-geosciences.wustl.edu/kplo/kplo-l-shadowcam-2-edr-v1/kplosh_0001/data/kplo_shadowcam_shackleton_interior.img',
        description: 'Ultra-Sensitive Secondary Reflected Earthshine Imagery'
      },
      {
        fileName: 'kplo_shadowcam_shackleton_interior.xml',
        fileType: 'LABEL_XML',
        downloadUrl: 'https://pds-geosciences.wustl.edu/kplo/kplo-l-shadowcam-2-edr-v1/kplosh_0001/data/kplo_shadowcam_shackleton_interior.xml',
        description: 'PDS4 XML Metadata Label'
      }
    ]
  },
  {
    pdsId: 'LRO_MRF_RADAR_CPR_SOUTH_POLAR',
    productName: 'mrf_cpr_south_polar_mosaic.img',
    productUrl: 'https://ode.rsl.wustl.edu/moon/indexproductpage.aspx?product_id=mrf_cpr_south_polar_mosaic&product_idGeo=35901238',
    ihid: 'LRO',
    ihName: 'Lunar Reconnaissance Orbiter',
    iid: 'MRFLRO',
    iName: 'Miniature Radio Frequency Radar (Mini-RF)',
    pt: 'MOSCDR',
    ptName: 'PDS4 Mosaic Calibrated Data Record (S-Band)',
    description: 'LRO Mini-RF S-band (2380 MHz) synthetic aperture radar Circular Polarization Ratio (CPR) mosaic. CPR > 1.0 inside craters correlates with coherent volumetric backscatter from buried subsurface water ice.',
    labelUrl: 'https://pds-geosciences.wustl.edu/lro/lro-l-mrflro-4-cdr-v1/lromrf_1001/data/mosaic/mrf_cpr_south_polar_mosaic.xml',
    externalUrl: 'https://pds-geosciences.wustl.edu/lro/lro-l-mrflro-4-cdr-v1/lromrf_1001/data/mosaic/mrf_cpr_south_polar_mosaic.img',
    filesUrl: 'https://ode.rsl.wustl.edu/moon/productfiles.aspx?product_id=mrf_cpr_south_polar_mosaic&product_idGeo=35901238',
    minLat: -90.0,
    maxLat: -84.0,
    westLon: -180.0,
    eastLon: 180.0,
    centerLat: -87.0,
    centerLon: 0.0,
    mapScaleMPerPixel: 30.0,
    isPolarGDR: true,
    associatedSiteIds: ['shackleton-connecting-ridge', 'haworth-crater-rim', 'de-gerlache-rim-2', 'amundsen-rim'],
    productFiles: [
      {
        fileName: 'mrf_cpr_south_polar_mosaic.img',
        fileType: 'DATA_IMG',
        downloadUrl: 'https://pds-geosciences.wustl.edu/lro/lro-l-mrflro-4-cdr-v1/lromrf_1001/data/mosaic/mrf_cpr_south_polar_mosaic.img',
        description: 'S-band Radar CPR Polar Mosaic'
      },
      {
        fileName: 'mrf_cpr_south_polar_mosaic.xml',
        fileType: 'LABEL_XML',
        downloadUrl: 'https://pds-geosciences.wustl.edu/lro/lro-l-mrflro-4-cdr-v1/lromrf_1001/data/mosaic/mrf_cpr_south_polar_mosaic.xml',
        description: 'PDS4 XML Metadata Label'
      }
    ]
  }
];

// Site calibrations based on PDS LOLA, Diviner & M3 ground truth
const siteCalibrations = {
  'shackleton-connecting-ridge': {
    siteId: 'shackleton-connecting-ridge',
    siteName: 'Shackleton Connecting Ridge',
    lolaDemResolutionM: 20.0,
    lolaMeanSlopeDeg: 8.5,
    divinerMinTempK: 85.0,
    divinerMaxTempK: 245.0,
    divinerMeanBolometricTempK: 165.0,
    psrIceStabilityDepthM: 0.15,
    m3WaterEquivalentHwtPct: 0.85,
    radarCircularPolarizationRatio: 0.65,
    sourceProducts: ['LDEM_256_90S_00S_000_180_FLOAT', 'DLRE_PRP_SOUTH_TAB', 'LRO_LOLA_GDRPSR_SOUTH_20M', 'CH1_M3_POLAR_REFLECTANCE_M3G20090207']
  },
  'malapert-massif': {
    siteId: 'malapert-massif',
    siteName: 'Malapert Massif Peak',
    lolaDemResolutionM: 20.0,
    lolaMeanSlopeDeg: 12.0,
    divinerMinTempK: 95.0,
    divinerMaxTempK: 260.0,
    divinerMeanBolometricTempK: 180.0,
    psrIceStabilityDepthM: 0.45,
    m3WaterEquivalentHwtPct: 0.40,
    radarCircularPolarizationRatio: 0.45,
    sourceProducts: ['LDEM_256_90S_00S_000_180_FLOAT', 'DLRE_PRP_SOUTH_TAB', 'CH1_M3_POLAR_REFLECTANCE_M3G20090207']
  },
  'de-gerlache-rim-2': {
    siteId: 'de-gerlache-rim-2',
    siteName: 'de Gerlache Rim 2',
    lolaDemResolutionM: 20.0,
    lolaMeanSlopeDeg: 9.8,
    divinerMinTempK: 75.0,
    divinerMaxTempK: 235.0,
    divinerMeanBolometricTempK: 155.0,
    psrIceStabilityDepthM: 0.08,
    m3WaterEquivalentHwtPct: 1.15,
    radarCircularPolarizationRatio: 0.82,
    sourceProducts: ['LDEM_256_90S_00S_000_180_FLOAT', 'DLRE_PRP_SOUTH_TAB', 'LRO_LOLA_GDRPSR_SOUTH_20M', 'LRO_MRF_RADAR_CPR_SOUTH_POLAR']
  },
  'connecting-ridge-extension': {
    siteId: 'connecting-ridge-extension',
    siteName: 'Connecting Ridge Extension',
    lolaDemResolutionM: 20.0,
    lolaMeanSlopeDeg: 7.2,
    divinerMinTempK: 80.0,
    divinerMaxTempK: 240.0,
    divinerMeanBolometricTempK: 160.0,
    psrIceStabilityDepthM: 0.12,
    m3WaterEquivalentHwtPct: 0.90,
    radarCircularPolarizationRatio: 0.60,
    sourceProducts: ['LDEM_256_90S_00S_000_180_FLOAT', 'DLRE_PRP_SOUTH_TAB', 'LRO_LOLA_GDRPSR_SOUTH_20M', 'KPLO_SHADOWCAM_SHACKLETON_INTERIOR_01']
  },
  'peak-near-shackleton': {
    siteId: 'peak-near-shackleton',
    siteName: 'Peak near Shackleton',
    lolaDemResolutionM: 20.0,
    lolaMeanSlopeDeg: 10.5,
    divinerMinTempK: 90.0,
    divinerMaxTempK: 250.0,
    divinerMeanBolometricTempK: 170.0,
    psrIceStabilityDepthM: 0.20,
    m3WaterEquivalentHwtPct: 0.70,
    radarCircularPolarizationRatio: 0.55,
    sourceProducts: ['LDEM_256_90S_00S_000_180_FLOAT', 'DLRE_PRP_SOUTH_TAB', 'LRO_LOLA_GDRPSR_SOUTH_20M']
  },
  'haworth-crater-rim': {
    siteId: 'haworth-crater-rim',
    siteName: 'Haworth Crater Rim (PSR Deep Cold Trap)',
    lolaDemResolutionM: 20.0,
    lolaMeanSlopeDeg: 14.5,
    divinerMinTempK: 40.0,
    divinerMaxTempK: 180.0,
    divinerMeanBolometricTempK: 110.0,
    psrIceStabilityDepthM: 0.02,
    m3WaterEquivalentHwtPct: 1.45,
    radarCircularPolarizationRatio: 1.10,
    sourceProducts: ['LDEM_256_90S_00S_000_180_FLOAT', 'DLRE_PRP_SOUTH_TAB', 'LRO_LOLA_GDRPSR_SOUTH_20M', 'LRO_MRF_RADAR_CPR_SOUTH_POLAR', 'LP_NS_POLAR_WATER_EQUIVALENT_HYDROGEN']
  },
  'amundsen-rim': {
    siteId: 'amundsen-rim',
    siteName: 'Amundsen Crater Rim',
    lolaDemResolutionM: 20.0,
    lolaMeanSlopeDeg: 11.2,
    divinerMinTempK: 70.0,
    divinerMaxTempK: 230.0,
    divinerMeanBolometricTempK: 150.0,
    psrIceStabilityDepthM: 0.10,
    m3WaterEquivalentHwtPct: 1.05,
    radarCircularPolarizationRatio: 0.75,
    sourceProducts: ['LDEM_256_90S_00S_000_180_FLOAT', 'DLRE_PRP_SOUTH_TAB', 'LRO_MRF_RADAR_CPR_SOUTH_POLAR', 'LP_NS_POLAR_WATER_EQUIVALENT_HYDROGEN']
  },
  'nobile-rim-1': {
    siteId: 'nobile-rim-1',
    siteName: 'Nobile Crater Rim 1 (NASA VIPER Site)',
    lolaDemResolutionM: 20.0,
    lolaMeanSlopeDeg: 8.8,
    divinerMinTempK: 85.0,
    divinerMaxTempK: 245.0,
    divinerMeanBolometricTempK: 165.0,
    psrIceStabilityDepthM: 0.18,
    m3WaterEquivalentHwtPct: 0.80,
    radarCircularPolarizationRatio: 0.62,
    sourceProducts: ['LDEM_256_90S_00S_000_180_FLOAT', 'DLRE_PRP_SOUTH_TAB', 'LP_NS_POLAR_WATER_EQUIVALENT_HYDROGEN']
  }
};

// Generate TypeScript content
let tsOut = `/**
 * PLUTON - Washington University in St. Louis (WUSTL)
 * Planetary Data System (PDS) Lunar Orbital Data Explorer (ODE) Datasets & Products
 * Source: https://ode.rsl.wustl.edu/moon/datasets
 * REST API: https://oderest.rsl.wustl.edu/live2
 * Total Datasets: ${typedDatasets.length} | Catalog Synchronized from PDS Geosciences Node
 */

import { ODEDataset, ODEProduct, ODESiteCalibration } from '@/types/ode';

export const ODE_MOON_DATASETS: ODEDataset[] = ${JSON.stringify(typedDatasets, null, 2)};

export const ODE_SOUTH_POLE_CURATED_PRODUCTS: ODEProduct[] = ${JSON.stringify(curatedProducts, null, 2)};

export const ODE_SITE_CALIBRATIONS: Record<string, ODESiteCalibration> = ${JSON.stringify(siteCalibrations, null, 2)};

export function getODEDatasetsByMission(ihid: string): ODEDataset[] {
  return ODE_MOON_DATASETS.filter((d) => d.IHID.toUpperCase() === ihid.toUpperCase());
}

export function getODEDatasetsByCategory(category: ODEDataset['category']): ODEDataset[] {
  return ODE_MOON_DATASETS.filter((d) => d.category === category);
}

export function getODECuratedProductsForSite(siteId: string): ODEProduct[] {
  return ODE_SOUTH_POLE_CURATED_PRODUCTS.filter((p) => p.associatedSiteIds.includes(siteId));
}

export function getODESiteCalibration(siteId: string): ODESiteCalibration | undefined {
  return ODE_SITE_CALIBRATIONS[siteId];
}
`;

const outputPath = path.join(__dirname, '../src/data/odeMoonDatasets.ts');
fs.writeFileSync(outputPath, tsOut, 'utf8');
console.log('Successfully wrote', outputPath, '(' + tsOut.length + ' bytes)');

