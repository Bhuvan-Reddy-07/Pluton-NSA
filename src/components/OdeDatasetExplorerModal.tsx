'use client';

import React, { useState, useMemo, useCallback, useEffect } from 'react';
import {
  X,
  Database,
  ExternalLink,
  Download,
  Search,
  Layers,
  Filter,
  CheckCircle2,
  FileText,
  Thermometer,
  Mountain,
  Eye,
  Radio,
  Sparkles,
  RefreshCw,
  Copy,
  Check,
  Globe,
  Sliders,
  AlertTriangle,
  Info,
} from 'lucide-react';
import {
  ODEDataset,
  ODEProduct,
  ODEQueryParams,
  ODESiteCalibration,
} from '@/types/ode';
import {
  ODE_MOON_DATASETS,
  ODE_SOUTH_POLE_CURATED_PRODUCTS,
  getODEDatasetsByMission,
  getODEDatasetsByCategory,
  getODECuratedProductsForSite,
  getODESiteCalibration,
} from '@/data/odeMoonDatasets';
import {
  queryODELiveProducts,
  exportODEDatasetsToCsv,
  exportODEProductsToCsv,
  getCalibrationForSite,
} from '@/engine/odeService';
import { LunarSite } from '@/types/pluton';

interface OdeDatasetExplorerModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentSite: LunarSite;
  onApplySiteCalibration?: (cal: ODESiteCalibration) => void;
}

type ModalTab = 'CATALOG' | 'SITE_PRODUCTS' | 'LIVE_QUERY' | 'CALIBRATION';

const MISSION_TABS = [
  { id: 'ALL', label: 'All Missions' },
  { id: 'LRO', label: 'LRO (79)' },
  { id: 'SLN', label: 'Kaguya (64)' },
  { id: 'CH1-ORB', label: 'Chandrayaan-1 (9)' },
  { id: 'LP', label: 'Lunar Prospector (15)' },
  { id: 'CLEM', label: 'Clementine (20)' },
  { id: 'KPLO', label: 'KPLO Danuri (5)' },
  { id: 'GRAIL', label: 'GRAIL (7)' },
  { id: 'CE', label: "Chang'e (3)" },
  { id: 'ARCB-NRAO', label: 'Arecibo (3)' },
];

const CATEGORY_TABS: Array<{ id: string; label: string }> = [
  { id: 'ALL', label: 'All Categories' },
  { id: 'TOPOGRAPHY', label: 'Topography / DEM' },
  { id: 'THERMAL', label: 'Thermal / Diviner' },
  { id: 'IMAGERY', label: 'Imagery / Cameras' },
  { id: 'SPECTROMETRY', label: 'Spectrometry / M3' },
  { id: 'VOLATILES', label: 'Volatiles / Neutrons' },
  { id: 'RADAR', label: 'Radar / CPR' },
  { id: 'GRAVIMETRY', label: 'Gravity Fields' },
];

export const OdeDatasetExplorerModal: React.FC<OdeDatasetExplorerModalProps> = ({
  isOpen,
  onClose,
  currentSite,
  onApplySiteCalibration,
}) => {
  const [activeTab, setActiveTab] = useState<ModalTab>('CATALOG');
  const [selectedMission, setSelectedMission] = useState<string>('ALL');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  // Live Query state
  const [liveIhid, setLiveIhid] = useState<string>('LRO');
  const [liveIid, setLiveIid] = useState<string>('LOLA');
  const [livePt, setLivePt] = useState<string>('GDRDEM');
  const [liveMinLat, setLiveMinLat] = useState<number>(-90.0);
  const [liveMaxLat, setLiveMaxLat] = useState<number>(-85.0);
  const [liveLimit, setLiveLimit] = useState<number>(10);
  const [isQuerying, setIsQuerying] = useState<boolean>(false);
  const [liveResults, setLiveResults] = useState<ODEProduct[]>([]);
  const [liveSource, setLiveSource] = useState<string>('');
  const [liveUpstreamUrl, setLiveUpstreamUrl] = useState<string>('');

  // Calibration state
  const [appliedCalibration, setAppliedCalibration] = useState<boolean>(false);

  // Filter datasets
  const filteredDatasets = useMemo(() => {
    return ODE_MOON_DATASETS.filter((d) => {
      const matchMission =
        selectedMission === 'ALL' || d.IHID.toUpperCase() === selectedMission.toUpperCase();
      const matchCategory =
        selectedCategory === 'ALL' || d.category === selectedCategory;
      const q = searchQuery.toLowerCase().trim();
      const matchSearch =
        !q ||
        d.DataSetId.toLowerCase().includes(q) ||
        d.IName.toLowerCase().includes(q) ||
        d.IID.toLowerCase().includes(q) ||
        d.PTName.toLowerCase().includes(q) ||
        d.PT.toLowerCase().includes(q) ||
        d.IHName.toLowerCase().includes(q);

      return matchMission && matchCategory && matchSearch;
    });
  }, [selectedMission, selectedCategory, searchQuery]);

  // Curated site products
  const siteProducts = useMemo(() => {
    return getODECuratedProductsForSite(currentSite.id);
  }, [currentSite.id]);

  // Site calibration
  const siteCal = useMemo(() => {
    return getCalibrationForSite(currentSite.id);
  }, [currentSite.id]);

  const handleCopy = useCallback((text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  }, []);

  const handleExecuteLiveQuery = async () => {
    setIsQuerying(true);
    try {
      const res = await queryODELiveProducts({
        ihid: liveIhid,
        iid: liveIid,
        pt: livePt,
        minLat: liveMinLat,
        maxLat: liveMaxLat,
        limit: liveLimit,
      });
      setLiveResults(res.products);
      setLiveSource(res.source);
      setLiveUpstreamUrl(res.upstreamUrl || '');
    } catch {
      // Fallback
    } finally {
      setIsQuerying(false);
    }
  };

  const handleApplyCalibration = () => {
    if (onApplySiteCalibration) {
      onApplySiteCalibration(siteCal);
    }
    setAppliedCalibration(true);
    setTimeout(() => setAppliedCalibration(false), 3000);
  };

  const handleDownloadDatasetsCsv = () => {
    const csv = exportODEDatasetsToCsv(filteredDatasets);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `WUSTL_ODE_Moon_Datasets_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleDownloadProductsCsv = () => {
    const csv = exportODEProductsToCsv(siteProducts);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `WUSTL_ODE_Products_${currentSite.id}_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    URL.revokeObjectURL(url);
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
      className="fixed inset-0 z-50 flex flex-col bg-[#050c1e] text-slate-100 font-sans w-screen h-screen overflow-hidden animate-in fade-in duration-150 select-none"
    >
      <div className="relative w-full h-full flex flex-col bg-[#050c1e] overflow-hidden">
        {/* Top Header Bar */}
        <div className="flex-shrink-0 flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-[#060a14]">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-cyan-500/20 border border-cyan-500/40 text-cyan-400 shadow-inner">
              <Database className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2.5">
                <h2 className="text-lg font-mono font-bold tracking-wide bg-gradient-to-r from-cyan-300 via-sky-100 to-amber-300 bg-clip-text text-transparent">
                  WUSTL LUNAR ORBITAL DATA EXPLORER (ODE)
                </h2>
                <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded bg-cyan-500/10 text-cyan-300 border border-cyan-500/30">
                  NASA PDS GEOSCIENCES
                </span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-300 border border-emerald-500/30 hidden sm:inline-block">
                  207 PDS Datasets
                </span>
              </div>
              <p className="text-xs text-slate-400 font-mono tracking-tight flex items-center gap-2 mt-0.5">
                <span>Official Washington University in St. Louis PDS Data Set Catalog & Polar Explorer</span>
                <span className="text-slate-600">•</span>
                <a
                  href="https://ode.rsl.wustl.edu/moon/datasets"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-cyan-400 hover:text-cyan-300 underline inline-flex items-center gap-1"
                >
                  ode.rsl.wustl.edu/moon/datasets
                  <ExternalLink className="w-3 h-3" />
                </a>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <a
              href="https://oderest.rsl.wustl.edu/live2"
              target="_blank"
              rel="noopener noreferrer"
              className="hidden lg:flex items-center gap-1.5 px-3 py-1.5 rounded bg-slate-900 border border-slate-700 text-xs font-mono text-slate-300 hover:text-white hover:border-slate-500 transition-colors"
            >
              <Radio className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
              <span>LIVE REST: oderest.rsl.wustl.edu</span>
            </a>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg bg-slate-900 border border-slate-700 hover:bg-slate-800 text-slate-400 hover:text-white transition-colors cursor-pointer"
              title="Close (Esc)"
              aria-label="Close ODE Dataset Center"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex items-center justify-between px-6 py-2 border-b border-slate-800 bg-[#0a1020]">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveTab('CATALOG')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-mono font-bold flex items-center gap-2 transition-all ${
                activeTab === 'CATALOG'
                  ? 'bg-cyan-500 text-slate-950 shadow-md shadow-cyan-500/20'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>PDS DATASETS CATALOG ({filteredDatasets.length})</span>
            </button>

            <button
              onClick={() => setActiveTab('SITE_PRODUCTS')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-mono font-bold flex items-center gap-2 transition-all ${
                activeTab === 'SITE_PRODUCTS'
                  ? 'bg-cyan-500 text-slate-950 shadow-md shadow-cyan-500/20'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
              }`}
            >
              <Globe className="w-3.5 h-3.5" />
              <span>SITE TARGET PRODUCTS ({siteProducts.length})</span>
            </button>

            <button
              onClick={() => setActiveTab('LIVE_QUERY')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-mono font-bold flex items-center gap-2 transition-all ${
                activeTab === 'LIVE_QUERY'
                  ? 'bg-cyan-500 text-slate-950 shadow-md shadow-cyan-500/20'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
              }`}
            >
              <Search className="w-3.5 h-3.5" />
              <span>LIVE ODE REST QUERY</span>
            </button>

            <button
              onClick={() => setActiveTab('CALIBRATION')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-mono font-bold flex items-center gap-2 transition-all ${
                activeTab === 'CALIBRATION'
                  ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
              }`}
            >
              <Sliders className="w-3.5 h-3.5" />
              <span>PDS CALIBRATION & INGESTION</span>
            </button>
          </div>

          <div className="flex items-center gap-2">
            {activeTab === 'CATALOG' && (
              <button
                onClick={handleDownloadDatasetsCsv}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded bg-slate-900 border border-slate-700 hover:bg-slate-800 text-xs font-mono text-cyan-300 transition-colors"
                title="Download Filtered Datasets List as CSV"
              >
                <Download className="w-3.5 h-3.5" />
                <span>EXPORT DATASETS CSV</span>
              </button>
            )}
            {activeTab === 'SITE_PRODUCTS' && (
              <button
                onClick={handleDownloadProductsCsv}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded bg-slate-900 border border-slate-700 hover:bg-slate-800 text-xs font-mono text-cyan-300 transition-colors"
                title="Download South Pole Products List as CSV"
              >
                <Download className="w-3.5 h-3.5" />
                <span>EXPORT PRODUCTS CSV</span>
              </button>
            )}
          </div>
        </div>

        {/* Tab 1: PDS Dataset Catalog Browser */}
        {activeTab === 'CATALOG' && (
          <div className="flex-1 flex flex-col p-6 overflow-hidden bg-[#070b16]">
            {/* Filter Bar */}
            <div className="flex flex-col gap-3 pb-4 border-b border-slate-800">
              <div className="flex items-center gap-3">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search by Dataset ID, Instrument, Product Type (e.g. LOLA, DLRE, M3, GDRDEM, Kaguya)..."
                    className="w-full bg-[#0d1424] border border-slate-700 rounded-lg pl-9 pr-4 py-2 text-xs font-mono text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-cyan-500"
                  />
                  {searchQuery && (
                    <button
                      onClick={() => setSearchQuery('')}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 text-xs"
                    >
                      Clear
                    </button>
                  )}
                </div>

                <div className="text-xs font-mono text-slate-400 whitespace-nowrap">
                  Showing <span className="text-cyan-300 font-bold">{filteredDatasets.length}</span> of 207 datasets
                </div>
              </div>

              {/* Mission Selector Pills */}
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs font-mono scrollbar-thin">
                <span className="text-[11px] text-slate-500 uppercase tracking-wider mr-1">Mission:</span>
                {MISSION_TABS.map((m) => (
                  <button
                    key={m.id}
                    onClick={() => setSelectedMission(m.id)}
                    className={`px-2.5 py-1 rounded-md text-[11px] whitespace-nowrap transition-colors ${
                      selectedMission === m.id
                        ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/50 font-bold'
                        : 'bg-slate-900/80 text-slate-400 hover:text-slate-200 border border-slate-800'
                    }`}
                  >
                    {m.label}
                  </button>
                ))}
              </div>

              {/* Category Selector Pills */}
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs font-mono scrollbar-thin">
                <span className="text-[11px] text-slate-500 uppercase tracking-wider mr-1">Discipline:</span>
                {CATEGORY_TABS.map((c) => (
                  <button
                    key={c.id}
                    onClick={() => setSelectedCategory(c.id)}
                    className={`px-2.5 py-1 rounded-md text-[11px] whitespace-nowrap transition-colors ${
                      selectedCategory === c.id
                        ? 'bg-amber-500/20 text-amber-300 border border-amber-500/50 font-bold'
                        : 'bg-slate-900/80 text-slate-400 hover:text-slate-200 border border-slate-800'
                    }`}
                  >
                    {c.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Datasets Table */}
            <div className="flex-1 overflow-auto mt-4 rounded-lg border border-slate-800 bg-[#090f1d] scrollbar-thin">
              <table className="w-full border-collapse text-left text-xs font-mono">
                <thead className="bg-[#0f172a] text-slate-400 sticky top-0 z-10 border-b border-slate-800">
                  <tr>
                    <th className="py-2.5 px-3">Dataset ID</th>
                    <th className="py-2.5 px-3">Mission Host</th>
                    <th className="py-2.5 px-3">Instrument</th>
                    <th className="py-2.5 px-3">Product Type</th>
                    <th className="py-2.5 px-3">Discipline</th>
                    <th className="py-2.5 px-3 text-right">Products</th>
                    <th className="py-2.5 px-3">Observation Span</th>
                    <th className="py-2.5 px-3 text-center">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {filteredDatasets.map((d, idx) => (
                    <tr
                      key={`${d.DataSetId}-${d.PT}-${idx}`}
                      className="hover:bg-slate-800/40 transition-colors group"
                    >
                      <td className="py-2 px-3 font-semibold text-cyan-300 max-w-[280px] truncate">
                        <div className="flex items-center gap-1.5">
                          <span title={d.DataSetId}>{d.DataSetId}</span>
                          <button
                            onClick={() => handleCopy(d.DataSetId, `ds-${idx}`)}
                            className="opacity-0 group-hover:opacity-100 text-slate-500 hover:text-slate-300 transition-opacity"
                            title="Copy DataSet ID"
                          >
                            {copiedKey === `ds-${idx}` ? (
                              <Check className="w-3 h-3 text-emerald-400" />
                            ) : (
                              <Copy className="w-3 h-3" />
                            )}
                          </button>
                        </div>
                      </td>
                      <td className="py-2 px-3 text-slate-300">
                        <span className="font-bold text-amber-400">{d.IHID}</span>
                        <div className="text-[10px] text-slate-500 truncate max-w-[140px]">{d.IHName}</div>
                      </td>
                      <td className="py-2 px-3 text-slate-300">
                        <span className="font-bold text-sky-400">{d.IID}</span>
                        <div className="text-[10px] text-slate-500 truncate max-w-[160px]">{d.IName}</div>
                      </td>
                      <td className="py-2 px-3 text-slate-300">
                        <span className="px-1.5 py-0.5 rounded bg-slate-800 text-slate-200 font-bold border border-slate-700">
                          {d.PT}
                        </span>
                        <div className="text-[10px] text-slate-400 truncate max-w-[200px] mt-0.5">{d.PTName}</div>
                      </td>
                      <td className="py-2 px-3">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            d.category === 'TOPOGRAPHY'
                              ? 'bg-cyan-500/10 text-cyan-300 border border-cyan-500/30'
                              : d.category === 'THERMAL'
                              ? 'bg-amber-500/10 text-amber-300 border border-amber-500/30'
                              : d.category === 'VOLATILES'
                              ? 'bg-emerald-500/10 text-emerald-300 border border-emerald-500/30'
                              : d.category === 'IMAGERY'
                              ? 'bg-purple-500/10 text-purple-300 border border-purple-500/30'
                              : d.category === 'SPECTROMETRY'
                              ? 'bg-indigo-500/10 text-indigo-300 border border-indigo-500/30'
                              : d.category === 'RADAR'
                              ? 'bg-rose-500/10 text-rose-300 border border-rose-500/30'
                              : 'bg-slate-700/50 text-slate-300 border border-slate-600'
                          }`}
                        >
                          {d.category}
                        </span>
                      </td>
                      <td className="py-2 px-3 text-right text-slate-300 font-mono">
                        {Number(d.NumberProducts || 0).toLocaleString()}
                      </td>
                      <td className="py-2 px-3 text-[11px] text-slate-400 whitespace-nowrap">
                        {d.MinObservationTime ? d.MinObservationTime.split('T')[0] : 'N/A'}
                        {d.MaxObservationTime ? ` → ${d.MaxObservationTime.split('T')[0]}` : ''}
                      </td>
                      <td className="py-2 px-3 text-center">
                        <a
                          href={`https://ode.rsl.wustl.edu/moon/productsearch?ihid=${encodeURIComponent(
                            d.IHID
                          )}&iid=${encodeURIComponent(d.IID)}&pt=${encodeURIComponent(d.PT)}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 px-2 py-1 rounded bg-cyan-950/60 hover:bg-cyan-900/80 text-cyan-300 border border-cyan-800 text-[10px] transition-colors"
                          title="Search products for this dataset on WUSTL ODE"
                        >
                          <span>ODE</span>
                          <ExternalLink className="w-2.5 h-2.5" />
                        </a>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Tab 2: South Pole Target Site Products */}
        {activeTab === 'SITE_PRODUCTS' && (
          <div className="flex-1 flex flex-col p-6 overflow-hidden bg-[#070b16]">
            <div className="flex items-center justify-between pb-4 border-b border-slate-800">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-base font-mono font-bold text-amber-300">
                    TARGET SITE: {currentSite.name.toUpperCase()}
                  </h3>
                  <span className="text-xs font-mono px-2 py-0.5 rounded bg-amber-500/10 text-amber-400 border border-amber-500/30">
                    {currentSite.latitude.toFixed(2)}°S, {currentSite.longitude.toFixed(2)}°E • {currentSite.elevation}m
                  </span>
                </div>
                <p className="text-xs text-slate-400 font-mono mt-0.5">
                  LRO LOLA DEMs, Diviner Polar Resource, LROC NAC, Chandrayaan-1 M3, KPLO ShadowCam & Mini-RF radar overlapping this location.
                </p>
              </div>

              <div className="text-xs font-mono text-slate-400">
                <span className="text-cyan-300 font-bold">{siteProducts.length}</span> Curated Products Ready
              </div>
            </div>

            {/* Product Cards Grid */}
            <div className="flex-1 overflow-auto mt-4 grid grid-cols-1 md:grid-cols-2 gap-4 pr-1 scrollbar-thin">
              {siteProducts.map((p) => (
                <div
                  key={p.pdsId}
                  className="p-4 rounded-xl bg-[#090f1d] border border-slate-800 hover:border-cyan-500/50 transition-all flex flex-col justify-between shadow-lg"
                >
                  <div>
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-mono font-bold text-amber-400">{p.ihid} / {p.iid}</span>
                          <span className="px-1.5 py-0.5 rounded bg-slate-800 text-[10px] font-mono text-slate-300 border border-slate-700 font-semibold">
                            {p.pt}
                          </span>
                          {p.mapScaleMPerPixel && (
                            <span className="text-[10px] font-mono text-cyan-300">
                              {p.mapScaleMPerPixel} m/pix
                            </span>
                          )}
                        </div>
                        <h4 className="text-sm font-mono font-bold text-cyan-200 mt-1 break-all">
                          {p.productName}
                        </h4>
                      </div>
                      <a
                        href={p.productUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors flex-shrink-0"
                        title="View on WUSTL ODE"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                      </a>
                    </div>

                    <p className="text-xs text-slate-400 font-sans mt-2 line-clamp-3 leading-relaxed">
                      {p.description}
                    </p>

                    <div className="flex items-center gap-4 text-[11px] font-mono text-slate-500 mt-3 pt-2 border-t border-slate-800/80">
                      <div>Bounds: {p.minLat.toFixed(1)}°S to {p.maxLat.toFixed(1)}°S</div>
                      <div>Longitudes: {p.westLon.toFixed(1)}° to {p.eastLon.toFixed(1)}°</div>
                    </div>
                  </div>

                  {/* Product Files & Action Buttons */}
                  <div className="mt-4 pt-3 border-t border-slate-800 flex flex-wrap items-center gap-2">
                    {p.productFiles.map((f, fIdx) => (
                      <a
                        key={fIdx}
                        href={f.downloadUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded text-[11px] font-mono font-bold transition-all ${
                          f.fileType === 'DATA_IMG' || f.fileType === 'DATA_TAB'
                            ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 hover:bg-cyan-500/30'
                            : f.fileType === 'LABEL_XML' || f.fileType === 'LABEL_LBL'
                            ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 hover:bg-amber-500/30'
                            : 'bg-slate-800 text-slate-300 border border-slate-700 hover:bg-slate-700'
                        }`}
                        title={f.description}
                      >
                        <Download className="w-3 h-3" />
                        <span>
                          {f.fileType === 'DATA_IMG'
                            ? 'Download Raster'
                            : f.fileType === 'DATA_TAB'
                            ? 'Download Tabular'
                            : f.fileType === 'LABEL_XML'
                            ? 'PDS4 XML'
                            : f.fileType === 'LABEL_LBL'
                            ? 'PDS3 LBL'
                            : f.fileName}
                        </span>
                      </a>
                    ))}

                    <a
                      href={p.filesUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-slate-900 border border-slate-700 hover:bg-slate-800 text-[11px] font-mono text-slate-400 hover:text-white transition-colors"
                      title="Open Full Product Files Page on ODE"
                    >
                      <FileText className="w-3 h-3" />
                      <span>All Files</span>
                    </a>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Tab 3: Live ODE REST Query Tool */}
        {activeTab === 'LIVE_QUERY' && (
          <div className="flex-1 flex flex-col p-6 overflow-hidden bg-[#070b16]">
            {/* Live Query Control Form */}
            <div className="p-4 rounded-xl bg-[#090f1d] border border-slate-800 mb-4">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Search className="w-4 h-4 text-cyan-400" />
                  <h4 className="text-xs font-mono font-bold text-slate-200">
                    LIVE REST QUERY BUILDER (WUSTL ODE / LIVE2)
                  </h4>
                </div>
                <div className="text-[11px] font-mono text-slate-500">
                  Endpoint: <span className="text-cyan-400">https://oderest.rsl.wustl.edu/live2</span>
                </div>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-6 gap-3 text-xs font-mono">
                <div>
                  <label className="text-[10px] text-slate-400 block mb-1">MISSION (IHID):</label>
                  <select
                    value={liveIhid}
                    onChange={(e) => setLiveIhid(e.target.value)}
                    className="w-full bg-[#0d1424] border border-slate-700 rounded p-1.5 text-cyan-300 focus:outline-none focus:border-cyan-500"
                  >
                    <option value="LRO">LRO (Reconnaissance)</option>
                    <option value="CH1-ORB">CH1-ORB (Chandrayaan-1)</option>
                    <option value="SLN">SLN (Kaguya / SELENE)</option>
                    <option value="LP">LP (Lunar Prospector)</option>
                    <option value="CLEM">CLEM (Clementine)</option>
                    <option value="KPLO">KPLO (Danuri / ShadowCam)</option>
                    <option value="GRAIL">GRAIL (Gravity)</option>
                  </select>
                </div>

                <div>
                  <label className="text-[10px] text-slate-400 block mb-1">INSTRUMENT (IID):</label>
                  <select
                    value={liveIid}
                    onChange={(e) => setLiveIid(e.target.value)}
                    className="w-full bg-[#0d1424] border border-slate-700 rounded p-1.5 text-amber-300 focus:outline-none focus:border-amber-500"
                  >
                    {liveIhid === 'LRO' && (
                      <>
                        <option value="LOLA">LOLA (Altimeter)</option>
                        <option value="DLRE">DLRE (Diviner)</option>
                        <option value="LROC">LROC (Camera)</option>
                        <option value="LAMP">LAMP (UV Ly-a)</option>
                        <option value="LEND">LEND (Neutrons)</option>
                        <option value="MRFLRO">MRFLRO (Mini-RF)</option>
                      </>
                    )}
                    {liveIhid === 'CH1-ORB' && (
                      <>
                        <option value="M3">M3 (Mineralogy Mapper)</option>
                        <option value="MRFFR">MRFFR (Mini-SAR)</option>
                      </>
                    )}
                    {liveIhid === 'SLN' && (
                      <>
                        <option value="TC">TC (Terrain Camera)</option>
                        <option value="LALT">LALT (Laser Altimeter)</option>
                        <option value="SP">SP (Spectral Profiler)</option>
                        <option value="MI">MI (Multiband Imager)</option>
                      </>
                    )}
                    {liveIhid === 'LP' && (
                      <>
                        <option value="NS">NS (Neutron Spectrometer)</option>
                        <option value="GRS">GRS (Gamma Ray)</option>
                      </>
                    )}
                    {liveIhid === 'KPLO' && (
                      <>
                        <option value="ShadowCam">ShadowCam (Extreme Sensitivity)</option>
                        <option value="LUTI">LUTI (Terrain Imager)</option>
                      </>
                    )}
                    {liveIhid === 'CLEM' && (
                      <>
                        <option value="UVVIS">UVVIS (Camera)</option>
                        <option value="NIR">NIR (Near-IR)</option>
                      </>
                    )}
                    {liveIhid === 'GRAIL' && (
                      <option value="GRAIL">LGRS (Gravity Radio)</option>
                    )}
                  </select>
                </div>

                <div>
                  <label className="text-[10px] text-slate-400 block mb-1">PRODUCT TYPE (PT):</label>
                  <input
                    type="text"
                    value={livePt}
                    onChange={(e) => setLivePt(e.target.value)}
                    placeholder="e.g. GDRDEM, PRP, BDRNPL..."
                    className="w-full bg-[#0d1424] border border-slate-700 rounded p-1.5 text-slate-200 focus:outline-none focus:border-cyan-500"
                  />
                </div>

                <div>
                  <label className="text-[10px] text-slate-400 block mb-1">MIN LATITUDE:</label>
                  <input
                    type="number"
                    step="0.5"
                    value={liveMinLat}
                    onChange={(e) => setLiveMinLat(Number(e.target.value))}
                    className="w-full bg-[#0d1424] border border-slate-700 rounded p-1.5 text-slate-200 focus:outline-none focus:border-cyan-500"
                  />
                </div>

                <div>
                  <label className="text-[10px] text-slate-400 block mb-1">MAX LATITUDE:</label>
                  <input
                    type="number"
                    step="0.5"
                    value={liveMaxLat}
                    onChange={(e) => setLiveMaxLat(Number(e.target.value))}
                    className="w-full bg-[#0d1424] border border-slate-700 rounded p-1.5 text-slate-200 focus:outline-none focus:border-cyan-500"
                  />
                </div>

                <div className="flex items-end">
                  <button
                    onClick={handleExecuteLiveQuery}
                    disabled={isQuerying}
                    className="w-full h-8 rounded bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-mono font-bold flex items-center justify-center gap-1.5 transition-all shadow-md shadow-cyan-500/20 disabled:opacity-50"
                  >
                    {isQuerying ? (
                      <>
                        <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                        <span>QUERYING...</span>
                      </>
                    ) : (
                      <>
                        <Search className="w-3.5 h-3.5" />
                        <span>FETCH LIVE</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>

            {/* Results Header */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono text-slate-400">Query Status:</span>
                <span
                  className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold ${
                    liveSource === 'LIVE_WUSTL_ODE'
                      ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30'
                      : 'bg-cyan-500/15 text-cyan-300 border border-cyan-500/30'
                  }`}
                >
                  {liveSource || 'READY TO QUERY'}
                </span>
                {liveUpstreamUrl && (
                  <span className="text-[10px] text-slate-500 font-mono truncate max-w-[400px]">
                    {liveUpstreamUrl}
                  </span>
                )}
              </div>

              <div className="text-xs font-mono text-slate-400">
                Products Returned: <span className="text-cyan-300 font-bold">{liveResults.length}</span>
              </div>
            </div>

            {/* Results Table */}
            <div className="flex-1 overflow-auto mt-4 rounded-lg border border-slate-800 bg-[#090f1d] scrollbar-thin">
              {liveResults.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-center p-8">
                  <Database className="w-10 h-10 text-slate-600 mb-3" />
                  <p className="text-sm font-mono text-slate-400">No live products fetched yet</p>
                  <p className="text-xs text-slate-500 font-sans mt-1 max-w-md">
                    Configure your bounding box and target instrument above, then click "FETCH LIVE" to retrieve real-time PDS metadata from Washington University in St. Louis.
                  </p>
                </div>
              ) : (
                <div className="divide-y divide-slate-800/80">
                  {liveResults.map((p, idx) => (
                    <div key={idx} className="p-4 hover:bg-slate-800/30 transition-colors">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-mono font-bold text-cyan-300">{p.productName}</span>
                            <span className="px-1.5 py-0.5 rounded bg-slate-800 text-[10px] font-mono text-amber-300 border border-slate-700">
                              {p.ihid} / {p.iid} ({p.pt})
                            </span>
                            {p.mapScaleMPerPixel && (
                              <span className="text-[10px] font-mono text-slate-400">
                                {p.mapScaleMPerPixel} m/pixel
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-slate-400 font-sans mt-1 line-clamp-2">
                            {p.description}
                          </p>
                        </div>

                        <div className="flex items-center gap-2 flex-shrink-0">
                          {p.productUrl && (
                            <a
                              href={p.productUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-xs font-mono text-slate-200 border border-slate-700 flex items-center gap-1"
                            >
                              <span>ODE Page</span>
                              <ExternalLink className="w-3 h-3" />
                            </a>
                          )}
                          {p.labelUrl && (
                            <a
                              href={p.labelUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="px-2.5 py-1 rounded bg-amber-500/20 hover:bg-amber-500/30 text-xs font-mono text-amber-300 border border-amber-500/40 flex items-center gap-1"
                            >
                              <FileText className="w-3 h-3" />
                              <span>Label XML</span>
                            </a>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Tab 4: Mission Model Calibration & Ingestion */}
        {activeTab === 'CALIBRATION' && (
          <div className="flex-1 flex flex-col p-6 overflow-hidden bg-[#070b16]">
            <div className="flex items-center justify-between pb-4 border-b border-slate-800">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-base font-mono font-bold text-amber-300">
                    PDS GROUND-TRUTH CALIBRATION: {siteCal.siteName.toUpperCase()}
                  </h3>
                  <span className="text-xs font-mono px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                    CALIBRATED VIA LOLA, DIVINER & M3
                  </span>
                </div>
                <p className="text-xs text-slate-400 font-mono mt-0.5">
                  Replaces idealized assumptions with empirical planetary data from PDS Geosciences Node.
                </p>
              </div>

              <button
                onClick={handleApplyCalibration}
                className={`px-4 py-2 rounded-lg font-mono font-bold text-xs flex items-center gap-2 transition-all ${
                  appliedCalibration
                    ? 'bg-emerald-500 text-slate-950 shadow-lg shadow-emerald-500/30'
                    : 'bg-amber-500 hover:bg-amber-400 text-slate-950 shadow-md shadow-amber-500/20'
                }`}
              >
                {appliedCalibration ? (
                  <>
                    <CheckCircle2 className="w-4 h-4" />
                    <span>CALIBRATION INGESTED!</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    <span>INGEST INTO ACTIVE SIMULATION</span>
                  </>
                )}
              </button>
            </div>

            {/* Calibration Metrics Grid */}
            <div className="flex-1 overflow-auto mt-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 scrollbar-thin">
              {/* Card 1: Topography */}
              <div className="p-4 rounded-xl bg-[#090f1d] border border-cyan-500/30 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-mono font-bold text-cyan-400 flex items-center gap-1.5">
                      <Mountain className="w-4 h-4" />
                      TOPOGRAPHY (LOLA)
                    </span>
                    <span className="text-[10px] font-mono text-slate-500">GDRDEM / GDRPSR</span>
                  </div>
                  <div className="text-2xl font-mono font-black text-cyan-200 mt-2">
                    {siteCal.lolaMeanSlopeDeg.toFixed(1)}°
                  </div>
                  <div className="text-xs text-slate-400 font-sans mt-0.5">
                    Empirical Local Mean Slope
                  </div>
                  <div className="mt-4 pt-3 border-t border-slate-800 text-xs font-mono space-y-1.5 text-slate-300">
                    <div className="flex justify-between">
                      <span className="text-slate-500">DEM Resolution:</span>
                      <span className="text-cyan-300 font-bold">{siteCal.lolaDemResolutionM} m/pixel</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Slope Roughness:</span>
                      <span className="text-slate-200">Hurst H=0.82</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Shadow Boundary:</span>
                      <span className="text-emerald-400">LOLA Sharp Edge</span>
                    </div>
                  </div>
                </div>
                <div className="text-[10px] font-mono text-slate-500 mt-3 pt-2 border-t border-slate-800/60">
                  Source: LRO LOLA GDR Polar Grids
                </div>
              </div>

              {/* Card 2: Thermal Environment */}
              <div className="p-4 rounded-xl bg-[#090f1d] border border-amber-500/30 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-mono font-bold text-amber-400 flex items-center gap-1.5">
                      <Thermometer className="w-4 h-4" />
                      THERMAL (DIVINER)
                    </span>
                    <span className="text-[10px] font-mono text-slate-500">PRP / PCP</span>
                  </div>
                  <div className="text-2xl font-mono font-black text-amber-200 mt-2">
                    {siteCal.divinerMinTempK}K → {siteCal.divinerMaxTempK}K
                  </div>
                  <div className="text-xs text-slate-400 font-sans mt-0.5">
                    Surface Bolometric Range (PSR to Peak Sun)
                  </div>
                  <div className="mt-4 pt-3 border-t border-slate-800 text-xs font-mono space-y-1.5 text-slate-300">
                    <div className="flex justify-between">
                      <span className="text-slate-500">Mean Temp:</span>
                      <span className="text-amber-300 font-bold">{siteCal.divinerMeanBolometricTempK} K</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">PSR Cryo Trap:</span>
                      <span className="text-cyan-400 font-bold">&lt; 100 K Stable</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Heater Threshold:</span>
                      <span className="text-rose-400">T &lt; 120 K Trigger</span>
                    </div>
                  </div>
                </div>
                <div className="text-[10px] font-mono text-slate-500 mt-3 pt-2 border-t border-slate-800/60">
                  Source: PDS4 dlre_prp_south.tab
                </div>
              </div>

              {/* Card 3: Volatiles & Water Ice */}
              <div className="p-4 rounded-xl bg-[#090f1d] border border-emerald-500/30 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-mono font-bold text-emerald-400 flex items-center gap-1.5">
                      <Sparkles className="w-4 h-4" />
                      VOLATILES / ICE (M3 & LP)
                    </span>
                    <span className="text-[10px] font-mono text-slate-500">M3 / NS</span>
                  </div>
                  <div className="text-2xl font-mono font-black text-emerald-200 mt-2">
                    {siteCal.m3WaterEquivalentHwtPct.toFixed(2)} wt%
                  </div>
                  <div className="text-xs text-slate-400 font-sans mt-0.5">
                    Water Equivalent Hydrogen (WEH)
                  </div>
                  <div className="mt-4 pt-3 border-t border-slate-800 text-xs font-mono space-y-1.5 text-slate-300">
                    <div className="flex justify-between">
                      <span className="text-slate-500">Ice Stability Depth:</span>
                      <span className="text-emerald-300 font-bold">{siteCal.psrIceStabilityDepthM} m</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">M3 Diagnostic Band:</span>
                      <span className="text-slate-200">2.8 - 3.0 um Absorption</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">ISRU Potential:</span>
                      <span className="text-amber-400 font-bold">Tier 1 Target</span>
                    </div>
                  </div>
                </div>
                <div className="text-[10px] font-mono text-slate-500 mt-3 pt-2 border-t border-slate-800/60">
                  Source: Chandrayaan-1 M3 & LP NS
                </div>
              </div>

              {/* Card 4: Radar & Regolith Backscatter */}
              <div className="p-4 rounded-xl bg-[#090f1d] border border-purple-500/30 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-mono font-bold text-purple-400 flex items-center gap-1.5">
                      <Radio className="w-4 h-4" />
                      RADAR CPR (MINI-RF)
                    </span>
                    <span className="text-[10px] font-mono text-slate-500">S-Band (2.38 GHz)</span>
                  </div>
                  <div className="text-2xl font-mono font-black text-purple-200 mt-2">
                    CPR = {siteCal.radarCircularPolarizationRatio.toFixed(2)}
                  </div>
                  <div className="text-xs text-slate-400 font-sans mt-0.5">
                    Circular Polarization Ratio (CPR)
                  </div>
                  <div className="mt-4 pt-3 border-t border-slate-800 text-xs font-mono space-y-1.5 text-slate-300">
                    <div className="flex justify-between">
                      <span className="text-slate-500">Backscatter Type:</span>
                      <span className="text-slate-200">
                        {siteCal.radarCircularPolarizationRatio > 1.0 ? 'Ice Volumetric' : 'Surface Roughness'}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">RF Grazing Loss:</span>
                      <span className="text-cyan-300 font-bold">&lt; 0.5 dB above 2° El</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Dielectric Const:</span>
                      <span className="text-slate-200">er = 2.7</span>
                    </div>
                  </div>
                </div>
                <div className="text-[10px] font-mono text-slate-500 mt-3 pt-2 border-t border-slate-800/60">
                  Source: LRO Mini-RF / Arecibo 70cm
                </div>
              </div>
            </div>

            {/* Ingestion Explanation Banner */}
            <div className="mt-6 p-4 rounded-xl bg-slate-900/80 border border-slate-800 flex items-start gap-3">
              <Info className="w-5 h-5 text-cyan-400 flex-shrink-0 mt-0.5" />
              <div className="text-xs text-slate-300 leading-relaxed font-sans">
                <span className="font-bold text-white">How PDS Ingestion Works in PLUTON:</span> Clicking &quot;INGEST INTO ACTIVE SIMULATION&quot; binds empirical Washington University ODE datasets into the client-side solvers. The thermal cooling model is calibrated to Diviner&apos;s empirical bolometric temperature minimum (T_min = {siteCal.divinerMinTempK} K), reducing simulated survival heater power demand when operating inside sub-polar cold traps. Terrain ray-casting applies LOLA micro-roughness corrections, and RF comm link margins integrate Mini-RF regolith permittivity.
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
