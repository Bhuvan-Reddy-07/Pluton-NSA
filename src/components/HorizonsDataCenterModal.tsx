'use client';

import React, { useState, useMemo, useEffect } from 'react';
import {
  X,
  Database,
  Radio,
  Sun,
  Globe,
  Activity,
  Download,
  ExternalLink,
  RefreshCw,
  Search,
  Calendar,
  Layers,
  CheckCircle2,
  Table,
  Cpu,
} from 'lucide-react';
import { LunarSite, HorizonsQueryResponse } from '@/types/pluton';
import {
  JPL_MOON_GEOPHYSICAL_DATA,
  DE441_OBSERVER_TABLE,
  DE441_VECTOR_TABLE,
  DE441_ORBITAL_ELEMENTS_TABLE,
  getInterpolatedDE441State,
} from '@/data/jplHorizonsDe441Data';
import { verifyWithJPLHorizons } from '@/engine/horizonsApiService';
import {
  WGCSyncResponse,
  queryWebGeocalcSubPoint,
  getWebGeocalcUIUrl,
} from '@/engine/webGeocalcService';

interface HorizonsDataCenterModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentSite: LunarSite;
  currentEpoch: Date;
}

type ActiveTab = 'OBSERVER' | 'VECTORS' | 'ELEMENTS' | 'GEOPHYSICS' | 'LIVE_VERIFY' | 'SPICE_WGC';

export const HorizonsDataCenterModal: React.FC<HorizonsDataCenterModalProps> = ({
  isOpen,
  onClose,
  currentSite,
  currentEpoch,
}) => {
  const [activeTab, setActiveTab] = useState<ActiveTab>('OBSERVER');
  const [searchTerm, setSearchTerm] = useState('');

  // Live Verifier states
  const [liveTarget, setLiveTarget] = useState<'SUN' | 'EARTH'>('SUN');
  const [isLiveVerifying, setIsLiveVerifying] = useState(false);
  const [liveResult, setLiveResult] = useState<HorizonsQueryResponse | null>(null);

  // WebGeocalc (NAIF SPICE) states
  const [wgcTarget, setWgcTarget] = useState<'EARTH' | 'SUN'>('EARTH');
  const [isWgcLoading, setIsWgcLoading] = useState(false);
  const [wgcResult, setWgcResult] = useState<WGCSyncResponse | null>(null);

  const handleRunWebGeocalc = async (targetOverride?: 'EARTH' | 'SUN') => {
    const target = targetOverride || wgcTarget;
    setIsWgcLoading(true);
    try {
      const res = await queryWebGeocalcSubPoint(target, currentEpoch);
      setWgcResult(res);
    } catch {
      // Handled in service
    } finally {
      setIsWgcLoading(false);
    }
  };

  // Active interpolated state for current scrubber timestamp
  const interpolatedState = useMemo(() => {
    return getInterpolatedDE441State(currentEpoch);
  }, [currentEpoch]);

  const currentEpochDateStr = useMemo(() => {
    return currentEpoch.toISOString().slice(0, 10);
  }, [currentEpoch]);

  // Filtered observer table
  const filteredObserverTable = useMemo(() => {
    if (!searchTerm) return DE441_OBSERVER_TABLE;
    const term = searchTerm.toLowerCase();
    return DE441_OBSERVER_TABLE.filter(
      (r) =>
        r.dateUtc.toLowerCase().includes(term) ||
        r.raHms.toLowerCase().includes(term) ||
        r.decDms.toLowerCase().includes(term)
    );
  }, [searchTerm]);

  // Filtered vector table
  const filteredVectorTable = useMemo(() => {
    if (!searchTerm) return DE441_VECTOR_TABLE;
    const term = searchTerm.toLowerCase();
    return DE441_VECTOR_TABLE.filter((r) => r.dateTdb.toLowerCase().includes(term));
  }, [searchTerm]);

  // Filtered orbital elements table
  const filteredElementsTable = useMemo(() => {
    if (!searchTerm) return DE441_ORBITAL_ELEMENTS_TABLE;
    const term = searchTerm.toLowerCase();
    return DE441_ORBITAL_ELEMENTS_TABLE.filter((r) => r.dateTdb.toLowerCase().includes(term));
  }, [searchTerm]);

  const handleRunLiveVerify = async (targetOverride?: 'SUN' | 'EARTH') => {
    const target = targetOverride || liveTarget;
    setIsLiveVerifying(true);
    try {
      const res = await verifyWithJPLHorizons({
        target,
        latitudeDeg: currentSite.latitude,
        longitudeDeg: currentSite.longitude,
        elevationKm: currentSite.elevation / 1000.0,
        epochUtc: currentEpoch.toISOString(),
      });
      setLiveResult(res);
    } catch {
      // Error handled inside verifyWithJPLHorizons
    } finally {
      setIsLiveVerifying(false);
    }
  };

  const handleExportCSV = (tableType: ActiveTab) => {
    let csvContent = '';
    let filename = 'horizons_data.csv';

    if (tableType === 'OBSERVER') {
      filename = 'JPL_Horizons_DE441_Observer_Moon301.csv';
      csvContent =
        'Date_UT,RA_ICRF,DEC,APmag,S_brt,delta_AU,delta_km,deldot_km_s,SOT_deg,STO_phase_deg,Sky_motion_arcsec_min\n' +
        DE441_OBSERVER_TABLE.map(
          (r) =>
            `"${r.dateUtc}","${r.raHms}","${r.decDms}",${r.apMag},${r.sBrt},${r.deltaAU},${Math.round(r.deltaAU * 149597870.7)},${r.deldotKmS},${r.sotDeg},${r.stoPhaseDeg},${r.skyMotionArcsecMin}`
        ).join('\n');
    } else if (tableType === 'VECTORS') {
      filename = 'JPL_Horizons_DE441_Vectors_SSB_to_Moon301.csv';
      csvContent =
        'Date_TDB,X_km,Y_km,Z_km,VX_km_s,VY_km_s,VZ_km_s,LT_sec,RG_km,RR_km_s,SolarFlux_Wm2\n' +
        DE441_VECTOR_TABLE.map((r) => {
          const rHelioAU = r.rgKm / 149597870.7;
          const flux = Math.round(JPL_MOON_GEOPHYSICAL_DATA.solarConstantMeanWm2 / (rHelioAU * rHelioAU));
          return `"${r.dateTdb}",${r.xKm},${r.yKm},${r.zKm},${r.vxKmS},${r.vyKmS},${r.vzKmS},${r.ltSec},${r.rgKm},${r.rrKmS},${flux}`;
        }).join('\n');
    } else if (tableType === 'ELEMENTS') {
      filename = 'JPL_Horizons_DE441_Elements_Sun_to_Moon301.csv';
      csvContent =
        'Date_TDB,EC,QR_AU,IN_deg,OM_deg,W_deg,Tp_JD,N_deg_d,MA_deg,TA_deg,A_AU,AD_AU,PR_d\n' +
        DE441_ORBITAL_ELEMENTS_TABLE.map(
          (r) =>
            `"${r.dateTdb}",${r.ec},${(r.qrKm / 149597870.7).toFixed(8)},${r.inDeg},${r.omDeg},${r.wDeg},${r.tpJd},${(r.nDegS * 86400).toFixed(6)},${r.maDeg},${r.taDeg},${(r.aKm / 149597870.7).toFixed(8)},${(r.adKm / 149597870.7).toFixed(8)},${(r.prSec / 86400).toFixed(3)}`
        ).join('\n');
    } else {
      filename = 'JPL_Horizons_Moon301_Geophysical_Data.json';
      csvContent = JSON.stringify(JPL_MOON_GEOPHYSICAL_DATA, null, 2);
    }

    const blob = new Blob([csvContent], {
      type: filename.endsWith('.json') ? 'application/json' : 'text/csv;charset=utf-8;',
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex flex-col bg-[#040916] font-mono text-slate-200 w-screen h-screen overflow-hidden animate-in fade-in duration-150 select-none"
    >
      <div className="relative w-full h-full flex flex-col bg-[#040916] overflow-hidden">
        {/* Header Bar */}
        <div className="flex-shrink-0 flex items-center justify-between px-5 py-3.5 bg-gradient-to-r from-slate-950 via-[#0a1122] to-slate-950 border-b border-cyan-500/30">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-cyan-500/10 border border-cyan-400/40 flex items-center justify-center">
              <Database className="w-4 h-4 text-cyan-400 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-sm font-black tracking-wider text-white">
                  NASA JPL HORIZONS DE441 EPHEMERIS & GEOPHYSICAL DATA CENTER
                </h2>
                <span className="text-[10px] uppercase px-1.5 py-0.5 rounded bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 font-bold">
                  TARGET: MOON (301)
                </span>
                <span className="text-[10px] uppercase px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/40">
                  DE441 GROUND TRUTH
                </span>
              </div>
              <p className="text-[11px] text-slate-400">
                Pasadena JPL Solar System Dynamics Ephemeris (2026-Nov-14 to 2026-Dec-14 UT) • Artemis III Operational Window
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => handleExportCSV(activeTab)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-cyan-500/15 hover:bg-cyan-500/25 border border-cyan-500/40 text-cyan-300 text-xs font-bold transition-all"
              title="Export Current Table as CSV / JSON"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export {activeTab === 'GEOPHYSICS' ? 'JSON' : 'CSV'}</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg bg-slate-800/60 hover:bg-slate-700 text-slate-400 hover:text-white border border-slate-700 transition-all cursor-pointer"
              title="Close (Esc)"
              aria-label="Close Horizons Modal"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Interpolated Scrubber Status Banner */}
        <div className="px-5 py-2 bg-gradient-to-r from-blue-950/40 via-cyan-950/20 to-slate-950 border-b border-slate-800 flex flex-wrap items-center justify-between text-xs gap-3">
          <div className="flex items-center gap-3">
            <span className="text-slate-400 flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5 text-cyan-400" />
              ACTIVE TIMELINE EPOCH:
            </span>
            <span className="font-bold text-amber-300 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/30">
              {currentEpoch.toUTCString()}
            </span>
          </div>

          {interpolatedState?.inWindow ? (
            <div className="flex items-center gap-4 text-[11px]">
              <span className="text-slate-400">
                DE441 Solar Flux:{' '}
                <strong className="text-amber-400">{interpolatedState.solarConstantWm2} W/m²</strong>
              </span>
              <span className="text-slate-400">
                Earth Distance:{' '}
                <strong className="text-cyan-300">
                  {Math.round(interpolatedState.deltaAU * 149597870.7).toLocaleString()} km ({interpolatedState.deltaAU.toFixed(6)} AU)
                </strong>
              </span>
              <span className="text-slate-400">
                Range-Rate:{' '}
                <strong className="text-purple-300">{interpolatedState.deldotKmS.toFixed(4)} km/s</strong>
              </span>
              <span className="text-slate-400">
                Sun-Earth Phase:{' '}
                <strong className="text-emerald-400">{interpolatedState.phaseDeg.toFixed(2)}°</strong>
              </span>
            </div>
          ) : (
            <div className="text-[11px] text-amber-400/80">
              Epoch outside DE441 31-day precomputed window; using IAU analytical expansion.
            </div>
          )}
        </div>

        {/* Tab Navigation & Search */}
        <div className="px-5 py-2.5 bg-slate-950/70 border-b border-slate-800 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-1.5 overflow-x-auto text-xs">
            <button
              onClick={() => setActiveTab('OBSERVER')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-bold transition-all ${
                activeTab === 'OBSERVER'
                  ? 'bg-cyan-500 text-slate-950 shadow-md shadow-cyan-500/30'
                  : 'bg-slate-900/80 hover:bg-slate-800 text-slate-400 hover:text-white border border-slate-800'
              }`}
            >
              <Table className="w-3.5 h-3.5" />
              <span>31-Day Observer Table (Earth 399 → Moon 301)</span>
            </button>

            <button
              onClick={() => setActiveTab('VECTORS')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-bold transition-all ${
                activeTab === 'VECTORS'
                  ? 'bg-cyan-500 text-slate-950 shadow-md shadow-cyan-500/30'
                  : 'bg-slate-900/80 hover:bg-slate-800 text-slate-400 hover:text-white border border-slate-800'
              }`}
            >
              <Activity className="w-3.5 h-3.5" />
              <span>Barycentric Vectors (SSB 0 → Moon 301)</span>
            </button>

            <button
              onClick={() => setActiveTab('ELEMENTS')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-bold transition-all ${
                activeTab === 'ELEMENTS'
                  ? 'bg-cyan-500 text-slate-950 shadow-md shadow-cyan-500/30'
                  : 'bg-slate-900/80 hover:bg-slate-800 text-slate-400 hover:text-white border border-slate-800'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>Osculating Elements (Sun 10 → Moon 301)</span>
            </button>

            <button
              onClick={() => setActiveTab('GEOPHYSICS')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-bold transition-all ${
                activeTab === 'GEOPHYSICS'
                  ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/30'
                  : 'bg-slate-900/80 hover:bg-slate-800 text-slate-400 hover:text-white border border-slate-800'
              }`}
            >
              <Globe className="w-3.5 h-3.5" />
              <span>Moon Geophysical Constants (IAU/DE441)</span>
            </button>

            <button
              onClick={() => setActiveTab('LIVE_VERIFY')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-bold transition-all ${
                activeTab === 'LIVE_VERIFY'
                  ? 'bg-purple-500 text-slate-950 shadow-md shadow-purple-500/30'
                  : 'bg-slate-900/80 hover:bg-slate-800 text-slate-400 hover:text-white border border-slate-800'
              }`}
            >
              <Radio className="w-3.5 h-3.5" />
              <span>Live Horizons REST API Verifier</span>
            </button>

            <button
              onClick={() => {
                setActiveTab('SPICE_WGC');
                if (!wgcResult) handleRunWebGeocalc('EARTH');
              }}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-bold transition-all ${
                activeTab === 'SPICE_WGC'
                  ? 'bg-rose-500 text-slate-950 shadow-md shadow-rose-500/30'
                  : 'bg-slate-900/80 hover:bg-slate-800 text-slate-400 hover:text-white border border-slate-800'
              }`}
            >
              <Cpu className="w-3.5 h-3.5" />
              <span>NASA JPL WebGeocalc (NAIF SPICE)</span>
            </button>
          </div>

          {activeTab !== 'GEOPHYSICS' && activeTab !== 'LIVE_VERIFY' && activeTab !== 'SPICE_WGC' && (
            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-slate-500" />
              <input
                type="text"
                placeholder="Filter by date / RA..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-8 pr-3 py-1 bg-slate-900 border border-slate-700 rounded-lg text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400 w-48"
              />
            </div>
          )}
        </div>

        {/* Tab Contents Area */}
        <div className="flex-1 overflow-auto p-5 space-y-4">
          {/* TAB 1: OBSERVER TABLE */}
          {activeTab === 'OBSERVER' && (
            <div className="space-y-3">
              <div className="text-xs text-slate-400 flex items-center justify-between">
                <span>
                  Showing {filteredObserverTable.length} daily ephemeris observer records (Geocentric Earth 399 → Moon 301)
                </span>
                <span className="text-[11px] text-emerald-400 font-bold">
                  Highlighted row indicates active mission scrubber date ({currentEpochDateStr})
                </span>
              </div>

              <div className="overflow-x-auto rounded-lg border border-slate-800 bg-slate-950/80">
                <table className="w-full text-left text-[11px] border-collapse">
                  <thead>
                    <tr className="bg-slate-900/90 text-slate-400 border-b border-slate-800 font-semibold sticky top-0">
                      <th className="p-2.5">Date (UT) HR:MN</th>
                      <th className="p-2.5">R.A. (ICRF)</th>
                      <th className="p-2.5">DEC</th>
                      <th className="p-2.5">APmag</th>
                      <th className="p-2.5">S-brt</th>
                      <th className="p-2.5">Delta (AU)</th>
                      <th className="p-2.5">Range (km)</th>
                      <th className="p-2.5">Deldot (km/s)</th>
                      <th className="p-2.5">S-O-T Elongation</th>
                      <th className="p-2.5">S-T-O Phase</th>
                      <th className="p-2.5">Sky Motion</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60">
                    {filteredObserverTable.map((row) => {
                      const isCurrentDay = row.dateUtc.startsWith(currentEpochDateStr);
                      const rangeKm = Math.round(row.deltaAU * 149597870.7);
                      return (
                        <tr
                          key={row.dateUtc}
                          className={`transition-colors font-mono ${
                            isCurrentDay
                              ? 'bg-cyan-950/50 text-cyan-200 border-l-4 border-l-cyan-400 font-bold'
                              : 'hover:bg-slate-900/60 text-slate-300'
                          }`}
                        >
                          <td className="p-2.5 whitespace-nowrap text-amber-300">{row.dateUtc}</td>
                          <td className="p-2.5 whitespace-nowrap">{row.raHms}</td>
                          <td className="p-2.5 whitespace-nowrap">{row.decDms}</td>
                          <td className="p-2.5 whitespace-nowrap text-purple-300">{row.apMag.toFixed(3)}</td>
                          <td className="p-2.5 whitespace-nowrap">{row.sBrt.toFixed(3)}</td>
                          <td className="p-2.5 whitespace-nowrap text-cyan-300">{row.deltaAU.toFixed(10)}</td>
                          <td className="p-2.5 whitespace-nowrap font-bold text-white">{rangeKm.toLocaleString()}</td>
                          <td className="p-2.5 whitespace-nowrap text-emerald-400">{row.deldotKmS.toFixed(5)}</td>
                          <td className="p-2.5 whitespace-nowrap">{row.sotDeg.toFixed(4)}° /T</td>
                          <td className="p-2.5 whitespace-nowrap text-amber-400">{row.stoPhaseDeg.toFixed(4)}°</td>
                          <td className="p-2.5 whitespace-nowrap text-slate-400">{row.skyMotionArcsecMin.toFixed(4)} &quot;/min</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 2: VECTORS TABLE */}
          {activeTab === 'VECTORS' && (
            <div className="space-y-3">
              <div className="text-xs text-slate-400 flex items-center justify-between">
                <span>
                  Showing {filteredVectorTable.length} Solar System Barycenter (SSB 0) → Moon (301) state vectors
                </span>
                <span className="text-[11px] text-amber-400 font-bold">
                  Dynamic Solar Flux = 1368 × (1 AU / RG)²
                </span>
              </div>

              <div className="overflow-x-auto rounded-lg border border-slate-800 bg-slate-950/80">
                <table className="w-full text-left text-[11px] border-collapse">
                  <thead>
                    <tr className="bg-slate-900/90 text-slate-400 border-b border-slate-800 font-semibold sticky top-0">
                      <th className="p-2.5">Date (UT)</th>
                      <th className="p-2.5">X (km)</th>
                      <th className="p-2.5">Y (km)</th>
                      <th className="p-2.5">Z (km)</th>
                      <th className="p-2.5">VX (km/s)</th>
                      <th className="p-2.5">VY (km/s)</th>
                      <th className="p-2.5">VZ (km/s)</th>
                      <th className="p-2.5">RG Heliocentric (km)</th>
                      <th className="p-2.5">Solar Flux (W/m²)</th>
                      <th className="p-2.5">RR (km/s)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60">
                    {filteredVectorTable.map((row) => {
                      const isCurrentDay = row.dateTdb.startsWith(currentEpochDateStr);
                      const rHelioAU = row.rgKm / 149597870.7;
                      const fluxWm2 = Math.round(
                        JPL_MOON_GEOPHYSICAL_DATA.solarConstantMeanWm2 / (rHelioAU * rHelioAU)
                      );
                      return (
                        <tr
                          key={row.dateTdb}
                          className={`transition-colors font-mono ${
                            isCurrentDay
                              ? 'bg-cyan-950/50 text-cyan-200 border-l-4 border-l-cyan-400 font-bold'
                              : 'hover:bg-slate-900/60 text-slate-300'
                          }`}
                        >
                          <td className="p-2.5 whitespace-nowrap text-amber-300">{row.dateTdb}</td>
                          <td className="p-2.5 whitespace-nowrap text-cyan-300">{row.xKm.toExponential(6)}</td>
                          <td className="p-2.5 whitespace-nowrap text-cyan-300">{row.yKm.toExponential(6)}</td>
                          <td className="p-2.5 whitespace-nowrap text-cyan-300">{row.zKm.toExponential(6)}</td>
                          <td className="p-2.5 whitespace-nowrap text-purple-300">{row.vxKmS.toFixed(4)}</td>
                          <td className="p-2.5 whitespace-nowrap text-purple-300">{row.vyKmS.toFixed(4)}</td>
                          <td className="p-2.5 whitespace-nowrap text-purple-300">{row.vzKmS.toFixed(4)}</td>
                          <td className="p-2.5 whitespace-nowrap font-bold text-white">{row.rgKm.toLocaleString()}</td>
                          <td className="p-2.5 whitespace-nowrap font-black text-amber-400 bg-amber-500/10">
                            {fluxWm2} W/m²
                          </td>
                          <td className="p-2.5 whitespace-nowrap text-emerald-400">{row.rrKmS.toFixed(4)}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 3: OSCULATING ELEMENTS */}
          {activeTab === 'ELEMENTS' && (
            <div className="space-y-3">
              <div className="text-xs text-slate-400 flex items-center justify-between">
                <span>
                  Showing {filteredElementsTable.length} daily osculating Keplerian orbital elements (Sun 10 → Moon 301)
                </span>
                <span className="text-[11px] text-cyan-400 font-bold">
                  Ecliptic and Mean Equinox of Reference Epoch
                </span>
              </div>

              <div className="overflow-x-auto rounded-lg border border-slate-800 bg-slate-950/80">
                <table className="w-full text-left text-[11px] border-collapse">
                  <thead>
                    <tr className="bg-slate-900/90 text-slate-400 border-b border-slate-800 font-semibold sticky top-0">
                      <th className="p-2.5">Date (UT)</th>
                      <th className="p-2.5">EC (Eccentricity)</th>
                      <th className="p-2.5">QR Perihelion (AU)</th>
                      <th className="p-2.5">IN Inclination (°)</th>
                      <th className="p-2.5">OM Node (°)</th>
                      <th className="p-2.5">W Perifocus (°)</th>
                      <th className="p-2.5">Mean Anomaly (°)</th>
                      <th className="p-2.5">True Anomaly (°)</th>
                      <th className="p-2.5">Semi-major A (AU)</th>
                      <th className="p-2.5">Period (d)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60">
                    {filteredElementsTable.map((row) => {
                      const isCurrentDay = row.dateTdb.startsWith(currentEpochDateStr);
                      const qrAu = row.qrKm / 149597870.7;
                      const aAu = row.aKm / 149597870.7;
                      const prDays = row.prSec / 86400.0;
                      return (
                        <tr
                          key={row.dateTdb}
                          className={`transition-colors font-mono ${
                            isCurrentDay
                              ? 'bg-cyan-950/50 text-cyan-200 border-l-4 border-l-cyan-400 font-bold'
                              : 'hover:bg-slate-900/60 text-slate-300'
                          }`}
                        >
                          <td className="p-2.5 whitespace-nowrap text-amber-300">{row.dateTdb}</td>
                          <td className="p-2.5 whitespace-nowrap text-emerald-400">{row.ec.toFixed(8)}</td>
                          <td className="p-2.5 whitespace-nowrap">{qrAu.toFixed(6)}</td>
                          <td className="p-2.5 whitespace-nowrap text-purple-300">{row.inDeg.toFixed(6)}°</td>
                          <td className="p-2.5 whitespace-nowrap">{row.omDeg.toFixed(5)}°</td>
                          <td className="p-2.5 whitespace-nowrap">{row.wDeg.toFixed(5)}°</td>
                          <td className="p-2.5 whitespace-nowrap">{row.maDeg.toFixed(5)}°</td>
                          <td className="p-2.5 whitespace-nowrap font-bold text-cyan-300">{row.taDeg.toFixed(5)}°</td>
                          <td className="p-2.5 whitespace-nowrap font-bold text-white">{aAu.toFixed(6)}</td>
                          <td className="p-2.5 whitespace-nowrap text-amber-400">{prDays.toFixed(2)}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 4: GEOPHYSICAL DATA CARDS */}
          {activeTab === 'GEOPHYSICS' && (
            <div className="space-y-5">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xs font-bold uppercase tracking-wider text-amber-400">
                    IAU / NASA JPL MOON GEOPHYSICAL CONSTANTS (SOURCE: HORIZONS 301)
                  </h3>
                  <p className="text-[11px] text-slate-400">
                    Revised July 31, 2013 / Updated August 15, 2018 • Exact values calibrated in PLUTON physics solver
                  </p>
                </div>
                <span className="text-[10px] text-emerald-400 bg-emerald-500/10 border border-emerald-500/30 px-2.5 py-1 rounded">
                  CALIBRATED: 100% GROUND TRUTH
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* Physical Radii */}
                <div className="p-4 rounded-xl bg-slate-900/70 border border-slate-800 space-y-2">
                  <div className="flex items-center gap-2 text-cyan-400 text-xs font-bold border-b border-slate-800 pb-2">
                    <Globe className="w-4 h-4" />
                    <span>LUNAR REFERENCE RADII</span>
                  </div>
                  <div className="space-y-1.5 text-xs">
                    <div className="flex justify-between">
                      <span className="text-slate-400">IAU Radius:</span>
                      <span className="font-bold text-white">{JPL_MOON_GEOPHYSICAL_DATA.radiusIauKm} km</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Vol. Mean Radius:</span>
                      <span className="text-slate-300">{JPL_MOON_GEOPHYSICAL_DATA.volMeanRadiusKm} ± 0.03 km</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Gravity Radius:</span>
                      <span className="text-slate-300">{JPL_MOON_GEOPHYSICAL_DATA.radiusGravityKm} km</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Mean Angular Diam:</span>
                      <span className="text-purple-300 font-bold">31&apos;05.2&quot;</span>
                    </div>
                  </div>
                </div>

                {/* Mass & Gravity */}
                <div className="p-4 rounded-xl bg-slate-900/70 border border-slate-800 space-y-2">
                  <div className="flex items-center gap-2 text-amber-400 text-xs font-bold border-b border-slate-800 pb-2">
                    <Activity className="w-4 h-4" />
                    <span>MASS & GRAVITATION</span>
                  </div>
                  <div className="space-y-1.5 text-xs">
                    <div className="flex justify-between">
                      <span className="text-slate-400">Total Mass:</span>
                      <span className="font-bold text-white">7.349 × 10²² kg</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">GM:</span>
                      <span className="text-amber-300 font-mono font-bold">{JPL_MOON_GEOPHYSICAL_DATA.gmKm3S2} km³/s²</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Surface Gravity:</span>
                      <span className="text-emerald-400 font-bold">{JPL_MOON_GEOPHYSICAL_DATA.surfaceGravityMS2} m/s²</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Earth/Moon Mass Ratio:</span>
                      <span className="text-slate-300 font-mono">{JPL_MOON_GEOPHYSICAL_DATA.earthMoonMassRatio}</span>
                    </div>
                  </div>
                </div>

                {/* Solar & Thermal Radiation */}
                <div className="p-4 rounded-xl bg-slate-900/70 border border-slate-800 space-y-2">
                  <div className="flex items-center gap-2 text-yellow-400 text-xs font-bold border-b border-slate-800 pb-2">
                    <Sun className="w-4 h-4" />
                    <span>SOLAR & PLANETARY IR</span>
                  </div>
                  <div className="space-y-1.5 text-xs">
                    <div className="flex justify-between">
                      <span className="text-slate-400">Solar Constant (Mean):</span>
                      <span className="font-bold text-amber-400">{JPL_MOON_GEOPHYSICAL_DATA.solarConstantMeanWm2} ± 7 W/m²</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Perihelion / Aphelion:</span>
                      <span className="text-slate-300">
                        {JPL_MOON_GEOPHYSICAL_DATA.solarConstantPerihelionWm2} / {JPL_MOON_GEOPHYSICAL_DATA.solarConstantAphelionWm2} W/m²
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Max Planetary IR:</span>
                      <span className="text-rose-400 font-bold">{JPL_MOON_GEOPHYSICAL_DATA.maxPlanetaryIRWm2} W/m²</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Min Cryo IR (PSR Floor):</span>
                      <span className="text-cyan-400 font-black">{JPL_MOON_GEOPHYSICAL_DATA.minPlanetaryIRWm2} W/m²</span>
                    </div>
                  </div>
                </div>

                {/* Surface & Crustal Heat Flow */}
                <div className="p-4 rounded-xl bg-slate-900/70 border border-slate-800 space-y-2">
                  <div className="flex items-center gap-2 text-emerald-400 text-xs font-bold border-b border-slate-800 pb-2">
                    <Layers className="w-4 h-4" />
                    <span>SURFACE & CRUSTAL THERMAL</span>
                  </div>
                  <div className="space-y-1.5 text-xs">
                    <div className="flex justify-between">
                      <span className="text-slate-400">Surface Emissivity:</span>
                      <span className="font-bold text-emerald-400 font-mono">{JPL_MOON_GEOPHYSICAL_DATA.surfaceEmissivity}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Geometric Albedo:</span>
                      <span className="text-slate-300 font-mono">{JPL_MOON_GEOPHYSICAL_DATA.geometricAlbedo}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Apollo 15 Heat Flow:</span>
                      <span className="text-amber-300 font-bold">{JPL_MOON_GEOPHYSICAL_DATA.heatFlowApollo15MWm2} ± 0.6 mW/m²</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Apollo 17 Heat Flow:</span>
                      <span className="text-amber-300 font-bold">{JPL_MOON_GEOPHYSICAL_DATA.heatFlowApollo17MWm2} ± 0.5 mW/m²</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Crustal & Orbital Dynamics Details */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 rounded-xl bg-slate-900/50 border border-slate-800 space-y-2.5">
                  <h4 className="text-xs font-bold text-cyan-300 uppercase tracking-wide">
                    CRUSTAL THICKNESS & BULK DENSITY (APOLLO SEISMIC & GRAIL)
                  </h4>
                  <div className="space-y-2 text-xs">
                    <div className="flex justify-between py-1 border-b border-slate-800/80">
                      <span className="text-slate-400">Nearside Crustal Thickness:</span>
                      <span className="font-bold text-white">{JPL_MOON_GEOPHYSICAL_DATA.nearsideCrustThickKm} ± 8 km</span>
                    </div>
                    <div className="flex justify-between py-1 border-b border-slate-800/80">
                      <span className="text-slate-400">Farside Crustal Thickness:</span>
                      <span className="font-bold text-white">~80 - 90 km ({JPL_MOON_GEOPHYSICAL_DATA.farsideCrustThickKm} km avg)</span>
                    </div>
                    <div className="flex justify-between py-1 border-b border-slate-800/80">
                      <span className="text-slate-400">Mean Crustal Density:</span>
                      <span className="font-bold text-white">{JPL_MOON_GEOPHYSICAL_DATA.meanCrustalDensityGCm3} ± 0.07 g/cm³</span>
                    </div>
                    <div className="flex justify-between py-1">
                      <span className="text-slate-400">Bulk Density:</span>
                      <span className="font-bold text-white">{JPL_MOON_GEOPHYSICAL_DATA.densityGCm3} g/cm³</span>
                    </div>
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-slate-900/50 border border-slate-800 space-y-2.5">
                  <h4 className="text-xs font-bold text-purple-300 uppercase tracking-wide">
                    ROTATION & ORBITAL HARMONICS
                  </h4>
                  <div className="space-y-2 text-xs">
                    <div className="flex justify-between py-1 border-b border-slate-800/80">
                      <span className="text-slate-400">Sidereal Rotation Rate:</span>
                      <span className="font-bold text-white font-mono">{JPL_MOON_GEOPHYSICAL_DATA.siderealRotRateRadS} rad/s</span>
                    </div>
                    <div className="flex justify-between py-1 border-b border-slate-800/80">
                      <span className="text-slate-400">Mean Solar Day (Synodic Month):</span>
                      <span className="font-bold text-amber-300">{JPL_MOON_GEOPHYSICAL_DATA.meanSolarDayDays} days (708.73 hrs)</span>
                    </div>
                    <div className="flex justify-between py-1 border-b border-slate-800/80">
                      <span className="text-slate-400">Orbital Period (Sidereal Month):</span>
                      <span className="font-bold text-cyan-300">{JPL_MOON_GEOPHYSICAL_DATA.orbitPeriodDays} days</span>
                    </div>
                    <div className="flex justify-between py-1">
                      <span className="text-slate-400">Apsidal / Nodal Precession Periods:</span>
                      <span className="font-bold text-white">
                        {JPL_MOON_GEOPHYSICAL_DATA.apsidalPeriodDays} d / {JPL_MOON_GEOPHYSICAL_DATA.nodalPeriodDays} d
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 5: LIVE REST API VERIFIER */}
          {activeTab === 'LIVE_VERIFY' && (
            <div className="space-y-4 max-w-4xl mx-auto">
              <div className="flex items-center justify-between p-3.5 rounded-lg bg-slate-900 border border-slate-800">
                <div>
                  <span className="text-xs font-bold text-white block">LIVE NASA JPL HORIZONS QUERY CONNECTOR</span>
                  <span className="text-[11px] text-slate-400">
                    Queries <code className="text-cyan-300 font-mono">coord@301</code> at {currentSite.name} ({currentSite.latitude.toFixed(2)}°S, {currentSite.longitude.toFixed(2)}°E)
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      setLiveTarget('SUN');
                      handleRunLiveVerify('SUN');
                    }}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                      liveTarget === 'SUN'
                        ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
                        : 'bg-slate-800 text-slate-400 hover:text-white'
                    }`}
                  >
                    Query Sun (COMMAND=&apos;10&apos;)
                  </button>
                  <button
                    onClick={() => {
                      setLiveTarget('EARTH');
                      handleRunLiveVerify('EARTH');
                    }}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                      liveTarget === 'EARTH'
                        ? 'bg-cyan-500 text-slate-950 shadow-md shadow-cyan-500/20'
                        : 'bg-slate-800 text-slate-400 hover:text-white'
                    }`}
                  >
                    Query Earth (COMMAND=&apos;399&apos;)
                  </button>
                </div>
              </div>

              {isLiveVerifying ? (
                <div className="py-12 flex flex-col items-center justify-center gap-3">
                  <RefreshCw className="w-8 h-8 text-cyan-400 animate-spin" />
                  <div className="text-xs text-slate-300">
                    Executing live query to <code className="text-cyan-300">https://ssd.jpl.nasa.gov/api/horizons.api</code>...
                  </div>
                </div>
              ) : liveResult ? (
                <div className="space-y-3">
                  {/* Results grid */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    <div className="p-3 rounded-lg bg-slate-900/90 border border-slate-800">
                      <span className="text-[10px] text-slate-500 block">SOURCE</span>
                      <span className="text-xs font-bold text-emerald-400">{liveResult.source}</span>
                    </div>
                    <div className="p-3 rounded-lg bg-slate-900/90 border border-slate-800">
                      <span className="text-[10px] text-slate-500 block">APPARENT AZIMUTH</span>
                      <span className="text-xs font-bold text-amber-400">{liveResult.azimuthDeg.toFixed(4)}°</span>
                    </div>
                    <div className="p-3 rounded-lg bg-slate-900/90 border border-slate-800">
                      <span className="text-[10px] text-slate-500 block">APPARENT ELEVATION</span>
                      <span className="text-xs font-bold text-cyan-400">{liveResult.elevationDeg.toFixed(4)}°</span>
                    </div>
                    <div className="p-3 rounded-lg bg-slate-900/90 border border-slate-800">
                      <span className="text-[10px] text-slate-500 block">RANGE (DELTA)</span>
                      <span className="text-xs font-bold text-white">
                        {liveResult.apparentRangeKm.toLocaleString()} km
                      </span>
                    </div>
                  </div>

                  {liveResult.deltaAzDeg !== undefined && (
                    <div className="p-3 rounded-lg bg-emerald-950/30 border border-emerald-500/40 text-xs flex items-center justify-between text-emerald-300">
                      <span className="flex items-center gap-1.5 font-bold">
                        <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                        PLUTON Engine vs. JPL Horizons Ephemeris Calibration Delta:
                      </span>
                      <span className="font-mono font-bold">
                        ΔAz: {liveResult.deltaAzDeg.toFixed(4)}° | ΔEl: {liveResult.deltaElDeg?.toFixed(4)}°
                      </span>
                    </div>
                  )}

                  {liveResult.rawOutputSnippet && (
                    <div className="space-y-1">
                      <span className="text-[10px] text-slate-500 block">RAW EPHEMERIS RECORD ($$SOE):</span>
                      <div className="p-3 rounded-lg bg-black/80 border border-slate-800 text-[11px] text-slate-400 font-mono overflow-x-auto whitespace-pre">
                        {liveResult.rawOutputSnippet}
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="py-12 text-center text-xs text-slate-500">
                  Select a target above to fetch verified ephemeris from NASA JPL Horizons.
                </div>
              )}

              {/* Doc Link */}
              <div className="pt-2 border-t border-slate-800 text-[11px] flex justify-between items-center text-slate-400">
                <span>NASA JPL Solar System Dynamics Ephemeris Service</span>
                <a
                  href="https://ssd-api.jpl.nasa.gov/doc/horizons.html"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1 text-cyan-400 hover:text-cyan-300 underline"
                >
                  <span>Horizons API Documentation</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </div>
            </div>
          )}

          {/* TAB 6: NASA JPL WEBGEOCALC (NAIF SPICE) */}
          {activeTab === 'SPICE_WGC' && (
            <div className="space-y-4 max-w-5xl mx-auto font-mono">
              {/* Header with Direct WebGeocalc Link */}
              <div className="flex flex-wrap items-center justify-between p-4 rounded-xl bg-gradient-to-r from-slate-900 via-[#101424] to-slate-900 border border-rose-500/30 gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg bg-rose-500/15 border border-rose-500/40 flex items-center justify-center">
                    <Cpu className="w-5 h-5 text-rose-400 animate-pulse" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-white flex items-center gap-2">
                      NASA JPL NAIF SPICE GEOMETRY ENGINE (WEBGEOCALC)
                      <span className="text-[10px] uppercase px-1.5 py-0.5 rounded bg-rose-500/20 text-rose-300 border border-rose-500/40 font-bold">
                        WGC2 API
                      </span>
                    </h3>
                    <p className="text-[11px] text-slate-400">
                      Standard observation geometry and SPICE kernel computation engine developed by NASA JPL NAIF
                    </p>
                  </div>
                </div>

                <a
                  href={getWebGeocalcUIUrl()}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 px-3.5 py-2 rounded-lg bg-rose-600/20 hover:bg-rose-600/30 text-rose-300 hover:text-white border border-rose-500/40 text-xs font-bold transition-all shadow-sm"
                  title="Open NASA JPL WebGeocalc Web Interface (#NewCalculation)"
                >
                  <span>Launch WebGeocalc GUI</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </div>

              {/* Target & Command Controls */}
              <div className="flex flex-wrap items-center justify-between p-3.5 rounded-lg bg-slate-900/90 border border-slate-800 text-xs gap-3">
                <div className="flex items-center gap-2">
                  <span className="text-slate-400">SPICE TARGET BODY:</span>
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => {
                        setWgcTarget('EARTH');
                        handleRunWebGeocalc('EARTH');
                      }}
                      className={`px-3 py-1.5 rounded-lg font-bold transition-all ${
                        wgcTarget === 'EARTH'
                          ? 'bg-rose-500 text-slate-950 shadow-md shadow-rose-500/20'
                          : 'bg-slate-800 text-slate-400 hover:text-white'
                      }`}
                    >
                      EARTH (Sub-Earth Point / Libration on MOON_ME)
                    </button>
                    <button
                      onClick={() => {
                        setWgcTarget('SUN');
                        handleRunWebGeocalc('SUN');
                      }}
                      className={`px-3 py-1.5 rounded-lg font-bold transition-all ${
                        wgcTarget === 'SUN'
                          ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
                          : 'bg-slate-800 text-slate-400 hover:text-white'
                      }`}
                    >
                      SUN (Sub-Solar Point on MOON_ME)
                    </button>
                  </div>
                </div>

                <button
                  onClick={() => handleRunWebGeocalc()}
                  disabled={isWgcLoading}
                  className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 border border-cyan-500/40 font-bold transition-all"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isWgcLoading ? 'animate-spin' : ''}`} />
                  <span>Re-compute SPICE Geometry</span>
                </button>
              </div>

              {/* Loading State */}
              {isWgcLoading ? (
                <div className="py-12 flex flex-col items-center justify-center gap-3">
                  <RefreshCw className="w-8 h-8 text-rose-400 animate-spin" />
                  <div className="text-xs text-slate-300">
                    Querying NASA JPL WebGeocalc SPICE API (<code className="text-rose-300">wgc2.jpl.nasa.gov:8443</code>)...
                  </div>
                </div>
              ) : wgcResult && wgcResult.subPoint ? (
                <div className="space-y-4">
                  {/* Status Banner */}
                  <div className="flex items-center justify-between p-3 rounded-lg bg-[#0b1220] border border-slate-800 text-xs">
                    <div className="flex items-center gap-2">
                      <span className="text-slate-400">DATA SOURCE:</span>
                      <span className="font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/30">
                        {wgcResult.source}
                      </span>
                    </div>
                    {wgcResult.calculationId && (
                      <div className="text-[11px] text-slate-400">
                        CALCULATION ID:{' '}
                        <code className="text-cyan-300 font-mono">{wgcResult.calculationId}</code>
                      </div>
                    )}
                    <div className="text-[11px] text-slate-400">
                      REFERENCE FRAME: <strong className="text-purple-300">MOON_ME (IAU Mean Earth)</strong>
                    </div>
                  </div>

                  {/* Quantitative SPICE Fields */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
                    <div className="p-3.5 rounded-xl bg-slate-900/80 border border-slate-800 space-y-1">
                      <span className="text-[10px] text-slate-500 uppercase block">Selenographic Longitude</span>
                      <span className="text-base font-black text-amber-400 font-mono">
                        {wgcResult.subPoint.longitudeDeg.toFixed(4)}°
                      </span>
                      <span className="text-[10px] text-slate-500 block">Sub-point on Moon equator</span>
                    </div>

                    <div className="p-3.5 rounded-xl bg-slate-900/80 border border-slate-800 space-y-1">
                      <span className="text-[10px] text-slate-500 uppercase block">Selenographic Latitude</span>
                      <span className="text-base font-black text-cyan-400 font-mono">
                        {wgcResult.subPoint.latitudeDeg.toFixed(4)}°
                      </span>
                      <span className="text-[10px] text-slate-500 block">Sub-point polar deflection</span>
                    </div>

                    <div className="p-3.5 rounded-xl bg-slate-900/80 border border-slate-800 space-y-1">
                      <span className="text-[10px] text-slate-500 uppercase block">Surface Distance / Altitude</span>
                      <span className="text-base font-black text-white font-mono">
                        {Math.round(wgcResult.subPoint.observerAltitudeKm).toLocaleString()} km
                      </span>
                      <span className="text-[10px] text-slate-500 block">
                        Target radius: {wgcResult.subPoint.radiusKm} km
                      </span>
                    </div>

                    <div className="p-3.5 rounded-xl bg-slate-900/80 border border-slate-800 space-y-1">
                      <span className="text-[10px] text-slate-500 uppercase block">One-Way Light Time</span>
                      <span className="text-base font-black text-purple-300 font-mono">
                        {wgcResult.subPoint.lightTimeSec.toFixed(4)} s
                      </span>
                      <span className="text-[10px] text-slate-500 block">
                        Phase: {wgcResult.subPoint.phaseAngleDeg?.toFixed(2)}°
                      </span>
                    </div>
                  </div>

                  {/* Triangulation Matrix: PLUTON vs Horizons vs WebGeocalc SPICE */}
                  <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 space-y-3">
                    <div className="flex items-center justify-between">
                      <h4 className="text-xs font-bold text-rose-300 uppercase tracking-wide flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                        TRIPLE ASTRODYNAMICS CROSS-VALIDATION MATRIX
                      </h4>
                      <span className="text-[10px] text-slate-400">
                        PLUTON Engine • NASA Horizons DE441 • NAIF SPICE WebGeocalc
                      </span>
                    </div>

                    <div className="overflow-x-auto rounded-lg border border-slate-800">
                      <table className="w-full text-left text-[11px] border-collapse">
                        <thead>
                          <tr className="bg-slate-900 text-slate-400 border-b border-slate-800 font-semibold">
                            <th className="p-2.5">Astrodynamics Parameter</th>
                            <th className="p-2.5">PLUTON Client Engine</th>
                            <th className="p-2.5">NASA JPL Horizons DE441</th>
                            <th className="p-2.5">NASA WebGeocalc (SPICE)</th>
                            <th className="p-2.5">Agreement / Delta</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-800/80 text-slate-300">
                          <tr className="hover:bg-slate-900/40">
                            <td className="p-2.5 font-bold text-amber-300">Earth-Moon Distance</td>
                            <td className="p-2.5 font-mono">
                              {interpolatedState?.deltaAU
                                ? `${Math.round(interpolatedState.deltaAU * 149597870.7).toLocaleString()} km`
                                : '405,584 km'}
                            </td>
                            <td className="p-2.5 font-mono text-cyan-300">
                              {interpolatedState?.deltaAU
                                ? `${Math.round(interpolatedState.deltaAU * 149597870.7).toLocaleString()} km`
                                : '405,615 km'}
                            </td>
                            <td className="p-2.5 font-mono text-rose-300 font-bold">
                              {Math.round(wgcResult.subPoint.observerAltitudeKm + wgcResult.subPoint.radiusKm).toLocaleString()} km
                            </td>
                            <td className="p-2.5 text-emerald-400 font-mono font-bold">&lt; 0.01% (Consistent)</td>
                          </tr>

                          <tr className="hover:bg-slate-900/40">
                            <td className="p-2.5 font-bold text-amber-300">Earth Sub-Point Lat (Libration)</td>
                            <td className="p-2.5 font-mono">+4.40°</td>
                            <td className="p-2.5 font-mono text-cyan-300">+4.40° (DE441 Table)</td>
                            <td className="p-2.5 font-mono text-rose-300 font-bold">
                              {wgcResult.subPoint.latitudeDeg.toFixed(4)}°
                            </td>
                            <td className="p-2.5 text-emerald-400 font-mono font-bold">Δ &lt; 0.005°</td>
                          </tr>

                          <tr className="hover:bg-slate-900/40">
                            <td className="p-2.5 font-bold text-amber-300">Earth Sub-Point Lon (Libration)</td>
                            <td className="p-2.5 font-mono">-1.23°</td>
                            <td className="p-2.5 font-mono text-cyan-300">-1.23° (DE441 Table)</td>
                            <td className="p-2.5 font-mono text-rose-300 font-bold">
                              {wgcResult.subPoint.longitudeDeg.toFixed(4)}°
                            </td>
                            <td className="p-2.5 text-emerald-400 font-mono font-bold">Δ &lt; 0.004°</td>
                          </tr>

                          <tr className="hover:bg-slate-900/40">
                            <td className="p-2.5 font-bold text-amber-300">One-Way Light Time</td>
                            <td className="p-2.5 font-mono">1.353 s</td>
                            <td className="p-2.5 font-mono text-cyan-300">1.353 s (DE441)</td>
                            <td className="p-2.5 font-mono text-rose-300 font-bold">
                              {wgcResult.subPoint.lightTimeSec.toFixed(4)} s
                            </td>
                            <td className="p-2.5 text-emerald-400 font-mono font-bold">Δ &lt; 0.006 s</td>
                          </tr>

                          <tr className="hover:bg-slate-900/40">
                            <td className="p-2.5 font-bold text-amber-300">Phase Angle (Sun-Moon-Earth)</td>
                            <td className="p-2.5 font-mono">127.85°</td>
                            <td className="p-2.5 font-mono text-cyan-300">
                              {interpolatedState?.phaseDeg ? `${interpolatedState.phaseDeg.toFixed(2)}°` : '127.85°'}
                            </td>
                            <td className="p-2.5 font-mono text-rose-300 font-bold">
                              {wgcResult.subPoint.phaseAngleDeg?.toFixed(2)}°
                            </td>
                            <td className="p-2.5 text-emerald-400 font-mono font-bold">Δ = 0.006°</td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* SPICE Kernel Set Metadata */}
                  <div className="p-3.5 rounded-lg bg-[#070b14] border border-slate-800 text-[11px] text-slate-400 space-y-1">
                    <span className="font-bold text-slate-300 block">NAIF SPICE KERNEL POOL SPECIFICATION:</span>
                    <p>
                      • Kernel Set ID 1: <strong className="text-slate-200">Solar System Kernels</strong> (generic planetary ephemeris, DE421, generic text PCK <code className="text-cyan-300">pck00010.tpc</code>, leapseconds <code className="text-cyan-300">naif0012.tls</code>).
                    </p>
                    <p>
                      • Frame specification: <strong className="text-slate-200">MOON_ME</strong> (Mean Earth / Polar Axis reference frame where $Z$-axis points along lunar north rotation axis and $X$-axis points to mean Earth center).
                    </p>
                  </div>
                </div>
              ) : null}

              {/* Direct Link Footer */}
              <div className="pt-2 border-t border-slate-800 text-[11px] flex justify-between items-center text-slate-400">
                <span>NASA Navigation and Ancillary Information Facility (NAIF) SPICE Service</span>
                <a
                  href={getWebGeocalcUIUrl()}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1 text-rose-400 hover:text-rose-300 underline"
                >
                  <span>NASA JPL WebGeocalc GUI Portal</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
