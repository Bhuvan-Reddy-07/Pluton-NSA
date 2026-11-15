import { NextRequest, NextResponse } from 'next/server';
import { ODE_MOON_DATASETS, ODE_SOUTH_POLE_CURATED_PRODUCTS } from '@/data/odeMoonDatasets';

const ODE_BASE_URL = 'https://oderest.rsl.wustl.edu/live2';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('query') || 'product';
    const ihid = searchParams.get('ihid') || '';
    const iid = searchParams.get('iid') || '';
    const pt = searchParams.get('pt') || '';
    const minlat = searchParams.get('minlat') || '-90.0';
    const maxlat = searchParams.get('maxlat') || '-80.0';
    const westlon = searchParams.get('westernlon') || searchParams.get('westlon') || '0';
    const eastlon = searchParams.get('easternlon') || searchParams.get('eastlon') || '360';
    const limit = searchParams.get('limit') || '10';
    const results = searchParams.get('results') || 'm';

    // If query is for datasets list
    if (query === 'datasets' || query === 'iipt') {
      return NextResponse.json({
        Status: 'Success',
        source: 'PLUTON_ODE_CATALOG',
        totalDatasets: ODE_MOON_DATASETS.length,
        datasets: ODE_MOON_DATASETS,
      });
    }

    // Build URL for Washington University in St. Louis ODE REST API
    const targetUrl = new URL(ODE_BASE_URL);
    targetUrl.searchParams.set('target', 'moon');
    targetUrl.searchParams.set('query', query);
    targetUrl.searchParams.set('results', results);
    targetUrl.searchParams.set('output', 'JSON');
    targetUrl.searchParams.set('limit', limit);

    if (ihid) targetUrl.searchParams.set('ihid', ihid);
    if (iid) targetUrl.searchParams.set('iid', iid);
    if (pt) targetUrl.searchParams.set('pt', pt);
    if (minlat) targetUrl.searchParams.set('minlat', minlat);
    if (maxlat) targetUrl.searchParams.set('maxlat', maxlat);
    if (westlon) targetUrl.searchParams.set('westernlon', westlon);
    if (eastlon) targetUrl.searchParams.set('easternlon', eastlon);

    try {
      const response = await fetch(targetUrl.toString(), {
        headers: {
          Accept: 'application/json, text/plain, */*',
          'User-Agent': 'PLUTON-Aerospace-Mission-Planner/2.4 (NASA JPL / CSA / WUSTL PDS)',
        },
        signal: AbortSignal.timeout(6000), // 6-second timeout
      });

      if (response.ok) {
        const data = await response.json();
        return NextResponse.json({
          Status: 'Success',
          source: 'LIVE_WUSTL_ODE',
          upstreamUrl: targetUrl.toString(),
          data: data.ODEResults || data,
        });
      }
    } catch {
      // Fallback on timeout or upstream error
    }

    // Curated PDS ground-truth fallback
    const filteredProducts = ODE_SOUTH_POLE_CURATED_PRODUCTS.filter((p) => {
      const matchesIhid = !ihid || p.ihid.toUpperCase() === ihid.toUpperCase();
      const matchesIid = !iid || p.iid.toUpperCase() === iid.toUpperCase();
      const matchesPt = !pt || p.pt.toUpperCase() === pt.toUpperCase();
      return matchesIhid && matchesIid && matchesPt;
    });

    return NextResponse.json({
      Status: 'Success',
      source: 'CURATED_PDS_GROUND_TRUTH',
      upstreamUrl: targetUrl.toString(),
      data: {
        Count: String(filteredProducts.length),
        Products: {
          Product: filteredProducts.map((p) => ({
            Product_name: p.productName,
            ProductURL: p.productUrl,
            Description: p.description,
            LabelURL: p.labelUrl,
            External_url: p.externalUrl,
            FilesURL: p.filesUrl,
            Map_scale: p.mapScaleMPerPixel,
            Minimum_latitude: p.minLat,
            Maximum_latitude: p.maxLat,
            Westernmost_longitude: p.westLon,
            Easternmost_longitude: p.eastLon,
            Product_files: {
              Product_file: p.productFiles.map((f) => ({
                FileName: f.fileName,
                Type: f.fileType,
                URL: f.downloadUrl,
                Description: f.description,
              })),
            },
          })),
        },
      },
    });
  } catch (error: any) {
    return NextResponse.json(
      {
        Status: 'Error',
        message: error?.message || 'Failed to query Washington University ODE API',
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const query = body.query || 'product';
    const ihid = body.ihid || '';
    const iid = body.iid || '';
    const pt = body.pt || '';
    const minlat = body.minlat !== undefined ? String(body.minlat) : '-90.0';
    const maxlat = body.maxlat !== undefined ? String(body.maxlat) : '-80.0';
    const westlon = body.westlon !== undefined ? String(body.westlon) : '0';
    const eastlon = body.eastlon !== undefined ? String(body.eastlon) : '360';
    const limit = body.limit !== undefined ? String(body.limit) : '10';
    const results = body.results || 'm';

    const targetUrl = new URL(ODE_BASE_URL);
    targetUrl.searchParams.set('target', 'moon');
    targetUrl.searchParams.set('query', query);
    targetUrl.searchParams.set('results', results);
    targetUrl.searchParams.set('output', 'JSON');
    targetUrl.searchParams.set('limit', limit);

    if (ihid) targetUrl.searchParams.set('ihid', ihid);
    if (iid) targetUrl.searchParams.set('iid', iid);
    if (pt) targetUrl.searchParams.set('pt', pt);
    if (minlat) targetUrl.searchParams.set('minlat', minlat);
    if (maxlat) targetUrl.searchParams.set('maxlat', maxlat);
    if (westlon) targetUrl.searchParams.set('westernlon', westlon);
    if (eastlon) targetUrl.searchParams.set('easternlon', eastlon);

    try {
      const response = await fetch(targetUrl.toString(), {
        headers: {
          Accept: 'application/json, text/plain, */*',
          'User-Agent': 'PLUTON-Aerospace-Mission-Planner/2.4 (NASA JPL / CSA / WUSTL PDS)',
        },
        signal: AbortSignal.timeout(6000),
      });

      if (response.ok) {
        const data = await response.json();
        return NextResponse.json({
          Status: 'Success',
          source: 'LIVE_WUSTL_ODE',
          upstreamUrl: targetUrl.toString(),
          data: data.ODEResults || data,
        });
      }
    } catch {
      // Fallback
    }

    const filteredProducts = ODE_SOUTH_POLE_CURATED_PRODUCTS.filter((p) => {
      const matchesIhid = !ihid || p.ihid.toUpperCase() === ihid.toUpperCase();
      const matchesIid = !iid || p.iid.toUpperCase() === iid.toUpperCase();
      const matchesPt = !pt || p.pt.toUpperCase() === pt.toUpperCase();
      return matchesIhid && matchesIid && matchesPt;
    });

    return NextResponse.json({
      Status: 'Success',
      source: 'CURATED_PDS_GROUND_TRUTH',
      upstreamUrl: targetUrl.toString(),
      data: {
        Count: String(filteredProducts.length),
        Products: {
          Product: filteredProducts.map((p) => ({
            Product_name: p.productName,
            ProductURL: p.productUrl,
            Description: p.description,
            LabelURL: p.labelUrl,
            External_url: p.externalUrl,
            FilesURL: p.filesUrl,
            Map_scale: p.mapScaleMPerPixel,
            Minimum_latitude: p.minLat,
            Maximum_latitude: p.maxLat,
            Westernmost_longitude: p.westLon,
            Easternmost_longitude: p.eastLon,
            Product_files: {
              Product_file: p.productFiles.map((f) => ({
                FileName: f.fileName,
                Type: f.fileType,
                URL: f.downloadUrl,
                Description: f.description,
              })),
            },
          })),
        },
      },
    });
  } catch (error: any) {
    return NextResponse.json(
      {
        Status: 'Error',
        message: error?.message || 'Failed to query Washington University ODE API',
      },
      { status: 500 }
    );
  }
}

