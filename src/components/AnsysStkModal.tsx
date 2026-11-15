'use client';

import React, { useState, useMemo, useEffect } from 'react';
import {
  X,
  Radio,
  Download,
  ExternalLink,
  Code2,
  FileText,
  Sliders,
  CheckCircle2,
  AlertTriangle,
  Layers,
  Copy,
  Check,
  Zap,
  Info,
  Signal,
  Cpu,
} from 'lucide-react';
import {
  LunarSite,
  HardwareProfile,
  EphemerisState,
  PhysicsTimeStep,
  TerrainHorizonProfile,
} from '@/types/pluton';
import {
  computeSTKRFLinkBudget,
  generateSTKBundle,
  STKBundle,
  STKLinkBudget,
} from '@/engine/stkService';

interface AnsysStkModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentSite: LunarSite;
  currentHardware: HardwareProfile;
  currentEphemeris: EphemerisState;
  horizonProfile: TerrainHorizonProfile;
  steps: PhysicsTimeStep[];
  currentEpoch: Date;
}

type STKTab = 'CONNECT' | 'MASK' | 'EPHEMERIS' | 'LINK_BUDGET' | 'REPORT';

export const AnsysStkModal: React.FC<AnsysStkModalProps> = ({
  isOpen,
  onClose,
  currentSite,
  currentHardware,
  currentEphemeris,
  horizonProfile,
  steps,
  currentEpoch,
}) => {
  const [activeTab, setActiveTab] = useState<STKTab>('CONNECT');
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  // Link Budget interactive states
  const [rfBand, setRfBand] = useState<'X-Band' | 'Ka-Band'>('X-Band');
  const [txPowerW, setTxPowerW] = useState<number>(15.0);

  // Generate complete STK export bundle
  const stkBundle: STKBundle = useMemo(() => {
    return generateSTKBundle(
      currentSite,
      currentHardware,
      horizonProfile,
      steps,
      currentEpoch,
      30
    );
  }, [currentSite, currentHardware, horizonProfile, steps, currentEpoch]);

  // Compute live RF Link Budget
  const linkBudget: STKLinkBudget = useMemo(() => {
    return computeSTKRFLinkBudget(
      currentEphemeris.earth.distanceKm || 405584.0,
      currentEphemeris.earth.elevationTopocentricDeg,
      rfBand,
      txPowerW
    );
  }, [currentEphemeris.earth.distanceKm, currentEphemeris.earth.elevationTopocentricDeg, rfBand, txPowerW]);

  const handleCopy = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const handleDownloadFile = (content: string, filename: string, mime: string = 'text/plain') => {
    const blob = new Blob([content], { type: `${mime};charset=utf-8;` });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleDownloadAll = () => {
    const safeSite = currentSite.name.replace(/[^a-zA-Z0-9]/g, '_');
    handleDownloadFile(stkBundle.stkConnectScript, `PLUTON_${safeSite}_Scenario.con`);
    setTimeout(() => {
      handleDownloadFile(stkBundle.azElMaskAem, `${safeSite}_Terrain_Horizon.aem`);
    }, 200);
    setTimeout(() => {
      handleDownloadFile(stkBundle.ephemerisE, `PLUTON_${safeSite}_Surface_Asset.e`);
    }, 400);
    setTimeout(() => {
      handleDownloadFile(stkBundle.stkPythonScript, `pluton_stk_automation.py`, 'text/x-python');
    }, 600);
    setTimeout(() => {
      handleDownloadFile(stkBundle.accessReport, `PLUTON_${safeSite}_Access_Report.txt`);
    }, 800);
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
      className="fixed inset-0 z-50 flex flex-col bg-[#040816] font-mono text-slate-200 w-screen h-screen overflow-hidden animate-in fade-in duration-150 select-none"
    >
      <div className="relative w-full h-full flex flex-col bg-[#040816] overflow-hidden">
        {/* Header Bar */}
        <div className="flex-shrink-0 flex items-center justify-between px-5 py-3.5 bg-gradient-to-r from-slate-950 via-[#0a1224] to-slate-950 border-b border-blue-500/30">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-blue-500/15 border border-blue-500/40 flex items-center justify-center">
              <Signal className="w-4 h-4 text-blue-400 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-sm font-black tracking-wider text-white">
                  ANSYS STK (SYSTEMS TOOL KIT) MISSION INTEGRATION SUITE
                </h2>
                <span className="text-[10px] uppercase px-1.5 py-0.5 rounded bg-blue-500/20 text-blue-300 border border-blue-500/40 font-bold">
                  STK 11 / 12 STANDARD
                </span>
                <span className="text-[10px] uppercase px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/40">
                  LOLA DEM HORIZON MASK
                </span>
              </div>
              <p className="text-[11px] text-slate-400">
                Industry-Standard Aerospace Orbit & Ground Access Modeler • Ansys Connect, .aem Mask, .e Ephemeris & RF Comm
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <a
              href="https://ansys.synopsys.com/products/missions/ansys-stk"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 text-xs font-bold transition-all"
            >
              <span>Ansys STK Product</span>
              <ExternalLink className="w-3.5 h-3.5 text-blue-400" />
            </a>
            <button
              onClick={handleDownloadAll}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-blue-500/20 hover:bg-blue-500/30 border border-blue-500/50 text-blue-300 text-xs font-bold transition-all shadow-sm"
              title="Download all 5 Ansys STK mission scenario & mask files"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export STK Bundle (5 Files)</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg bg-slate-800/60 hover:bg-slate-700 text-slate-400 hover:text-white border border-slate-700 transition-all cursor-pointer"
              title="Close (Esc)"
              aria-label="Close Ansys STK Modal"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="px-5 py-2.5 bg-slate-950/70 border-b border-slate-800 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-1.5 overflow-x-auto text-xs">
            <button
              onClick={() => setActiveTab('CONNECT')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-bold transition-all ${
                activeTab === 'CONNECT'
                  ? 'bg-blue-500 text-slate-950 shadow-md shadow-blue-500/30'
                  : 'bg-slate-900/80 hover:bg-slate-800 text-slate-400 hover:text-white border border-slate-800'
              }`}
            >
              <Code2 className="w-3.5 h-3.5" />
              <span>STK Connect Script (.con / .py)</span>
            </button>

            <button
              onClick={() => setActiveTab('MASK')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-bold transition-all ${
                activeTab === 'MASK'
                  ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/30'
                  : 'bg-slate-900/80 hover:bg-slate-800 text-slate-400 hover:text-white border border-slate-800'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>STK Terrain Horizon Mask (.aem)</span>
            </button>

            <button
              onClick={() => setActiveTab('EPHEMERIS')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-bold transition-all ${
                activeTab === 'EPHEMERIS'
                  ? 'bg-cyan-500 text-slate-950 shadow-md shadow-cyan-500/30'
                  : 'bg-slate-900/80 hover:bg-slate-800 text-slate-400 hover:text-white border border-slate-800'
              }`}
            >
              <Cpu className="w-3.5 h-3.5" />
              <span>STK Ephemeris File (.e)</span>
            </button>

            <button
              onClick={() => setActiveTab('LINK_BUDGET')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-bold transition-all ${
                activeTab === 'LINK_BUDGET'
                  ? 'bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/30'
                  : 'bg-slate-900/80 hover:bg-slate-800 text-slate-400 hover:text-white border border-slate-800'
              }`}
            >
              <Radio className="w-3.5 h-3.5" />
              <span>STK Comm RF Link Budget</span>
            </button>

            <button
              onClick={() => setActiveTab('REPORT')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-bold transition-all ${
                activeTab === 'REPORT'
                  ? 'bg-purple-500 text-slate-950 shadow-md shadow-purple-500/30'
                  : 'bg-slate-900/80 hover:bg-slate-800 text-slate-400 hover:text-white border border-slate-800'
              }`}
            >
              <FileText className="w-3.5 h-3.5" />
              <span>STK Access & Lighting Report</span>
            </button>
          </div>

          <div className="text-[11px] text-slate-400">
            Active Site: <strong className="text-amber-300">{currentSite.name}</strong> ({currentSite.latitude.toFixed(2)}°S, {currentSite.elevation}m)
          </div>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-auto p-5">
          {/* TAB 1: STK CONNECT SCRIPT */}
          {activeTab === 'CONNECT' && (
            <div className="space-y-4 max-w-5xl mx-auto">
              <div className="flex items-center justify-between p-3.5 rounded-lg bg-slate-900 border border-slate-800 text-xs">
                <div>
                  <span className="font-bold text-white block">ANSYS STK CONNECT COMMAND BATCH</span>
                  <span className="text-[11px] text-slate-400">
                    Directly executable in Ansys STK command prompt or via TCP socket connection (port 5001)
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleCopy(stkBundle.stkConnectScript, 'connect')}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold border border-slate-700"
                  >
                    {copiedKey === 'connect' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedKey === 'connect' ? 'Copied' : 'Copy Connect Script'}</span>
                  </button>
                  <button
                    onClick={() =>
                      handleDownloadFile(stkBundle.stkConnectScript, `PLUTON_${currentSite.name.replace(/[^a-zA-Z0-9]/g, '_')}_Scenario.con`)
                    }
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-500/20 hover:bg-blue-500/30 text-blue-300 text-xs font-bold border border-blue-500/40"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Download .con</span>
                  </button>
                </div>
              </div>

              <div className="rounded-xl border border-slate-800 bg-[#040711] p-4 text-xs font-mono overflow-auto max-h-[55vh]">
                <pre className="text-blue-200/90 whitespace-pre selection:bg-blue-500/30 text-[11px]">
                  {stkBundle.stkConnectScript}
                </pre>
              </div>

              {/* Python pySTK block */}
              <div className="p-3.5 rounded-lg bg-slate-900/60 border border-slate-800 text-xs space-y-2">
                <div className="flex justify-between items-center">
                  <span className="font-bold text-cyan-300">Python Automation Hook (pySTK / comtypes):</span>
                  <button
                    onClick={() => handleCopy(stkBundle.stkPythonScript, 'python')}
                    className="flex items-center gap-1 px-2.5 py-1 rounded bg-slate-800 text-[11px] text-slate-300"
                  >
                    {copiedKey === 'python' ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                    <span>{copiedKey === 'python' ? 'Copied' : 'Copy Python Script'}</span>
                  </button>
                </div>
                <pre className="p-3 rounded bg-black/60 text-[10px] text-slate-400 overflow-x-auto whitespace-pre">
                  {stkBundle.stkPythonScript}
                </pre>
              </div>
            </div>
          )}

          {/* TAB 2: STK AZ-EL TERRAIN HORIZON MASK */}
          {activeTab === 'MASK' && (
            <div className="space-y-4 max-w-5xl mx-auto">
              <div className="flex items-center justify-between p-3.5 rounded-lg bg-slate-900 border border-slate-800 text-xs">
                <div>
                  <span className="font-bold text-amber-300 block">ANSYS STK AZIMUTH-ELEVATION TERRAIN MASK (.aem)</span>
                  <span className="text-[11px] text-slate-400">
                    Exact 361-point horizon obstacle profile calibrated with LOLA DEM and mast height ({currentHardware.mastHeight}m)
                  </span>
                </div>
                <button
                  onClick={() =>
                    handleDownloadFile(stkBundle.azElMaskAem, `${currentSite.name.replace(/[^a-zA-Z0-9]/g, '_')}_Terrain_Horizon.aem`)
                  }
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 text-xs font-bold border border-amber-500/40"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download .aem Mask File</span>
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div className="p-3 rounded-lg bg-slate-900/80 border border-slate-800">
                  <span className="text-[10px] text-slate-500 block uppercase">STK File Format</span>
                  <span className="text-xs font-bold text-amber-300">stk.v.11.0 / AzElMask</span>
                </div>
                <div className="p-3 rounded-lg bg-slate-900/80 border border-slate-800">
                  <span className="text-[10px] text-slate-500 block uppercase">Azimuth Sample Step</span>
                  <span className="text-xs font-bold text-white">1.0° (0° to 360° Continuous)</span>
                </div>
                <div className="p-3 rounded-lg bg-slate-900/80 border border-slate-800">
                  <span className="text-[10px] text-slate-500 block uppercase">Mast Elevation Offset</span>
                  <span className="text-xs font-bold text-cyan-300">+{currentHardware.mastHeight} meters AGL</span>
                </div>
              </div>

              <div className="rounded-xl border border-slate-800 bg-[#040711] p-4 text-xs font-mono overflow-auto max-h-[50vh]">
                <pre className="text-amber-200/90 whitespace-pre selection:bg-amber-500/30 text-[11px]">
                  {stkBundle.azElMaskAem}
                </pre>
              </div>
            </div>
          )}

          {/* TAB 3: STK EPHEMERIS FILE */}
          {activeTab === 'EPHEMERIS' && (
            <div className="space-y-4 max-w-5xl mx-auto">
              <div className="flex items-center justify-between p-3.5 rounded-lg bg-slate-900 border border-slate-800 text-xs">
                <div>
                  <span className="font-bold text-cyan-300 block">ANSYS STK EPHEMERIS FILE (.e)</span>
                  <span className="text-[11px] text-slate-400">
                    Standard STK Ephemeris for Lunar Central Body (CentralBody Moon, CoordinateSystem Fixed, DistanceUnit Kilometers)
                  </span>
                </div>
                <button
                  onClick={() =>
                    handleDownloadFile(stkBundle.ephemerisE, `PLUTON_${currentSite.name.replace(/[^a-zA-Z0-9]/g, '_')}_Surface_Asset.e`)
                  }
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 text-xs font-bold border border-cyan-500/40"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download .e Ephemeris</span>
                </button>
              </div>

              <div className="rounded-xl border border-slate-800 bg-[#040711] p-4 text-xs font-mono overflow-auto max-h-[55vh]">
                <pre className="text-cyan-200/90 whitespace-pre selection:bg-cyan-500/30 text-[11px]">
                  {stkBundle.ephemerisE}
                </pre>
              </div>
            </div>
          )}

          {/* TAB 4: STK COMM RF LINK BUDGET */}
          {activeTab === 'LINK_BUDGET' && (
            <div className="space-y-5 max-w-5xl mx-auto">
              {/* Controls Bar */}
              <div className="flex flex-wrap items-center justify-between p-4 rounded-xl bg-slate-900 border border-slate-800 text-xs gap-4">
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2">
                    <span className="text-slate-400 font-bold">RF BAND:</span>
                    <button
                      onClick={() => setRfBand('X-Band')}
                      className={`px-3 py-1.5 rounded-lg font-bold transition-all ${
                        rfBand === 'X-Band'
                          ? 'bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/20'
                          : 'bg-slate-800 text-slate-400'
                      }`}
                    >
                      X-Band (8.45 GHz)
                    </button>
                    <button
                      onClick={() => setRfBand('Ka-Band')}
                      className={`px-3 py-1.5 rounded-lg font-bold transition-all ${
                        rfBand === 'Ka-Band'
                          ? 'bg-cyan-500 text-slate-950 shadow-md shadow-cyan-500/20'
                          : 'bg-slate-800 text-slate-400'
                      }`}
                    >
                      Ka-Band (32.05 GHz)
                    </button>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="text-slate-400 font-bold">TX POWER:</span>
                    <input
                      type="range"
                      min="5"
                      max="50"
                      step="5"
                      value={txPowerW}
                      onChange={(e) => setTxPowerW(Number(e.target.value))}
                      className="w-28 accent-emerald-400 cursor-pointer"
                    />
                    <span className="font-bold text-white">{txPowerW} W</span>
                  </div>
                </div>

                {/* Status Indicator */}
                <div className="flex items-center gap-2">
                  <span className="text-slate-400">STK LINK STATUS:</span>
                  <span
                    className={`px-2.5 py-1 rounded font-bold text-xs flex items-center gap-1.5 ${
                      linkBudget.linkStatus === 'MARGIN_HEALTHY'
                        ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                        : linkBudget.linkStatus === 'MARGIN_DEGRADED'
                        ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                        : 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                    }`}
                  >
                    {linkBudget.linkStatus === 'MARGIN_HEALTHY' ? (
                      <CheckCircle2 className="w-3.5 h-3.5" />
                    ) : (
                      <AlertTriangle className="w-3.5 h-3.5" />
                    )}
                    <span>
                      {linkBudget.linkStatus === 'MARGIN_HEALTHY'
                        ? 'HEALTHY MARGIN (>3 dB)'
                        : linkBudget.linkStatus === 'MARGIN_DEGRADED'
                        ? 'DEGRADED (0-3 dB)'
                        : 'LINK LOSS'}
                    </span>
                  </span>
                </div>
              </div>

              {/* Key Quantitative Metrics */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
                <div className="p-3.5 rounded-xl bg-slate-900/80 border border-slate-800 space-y-1">
                  <span className="text-[10px] text-slate-500 uppercase block">EIRP (Transmitter)</span>
                  <span className="text-base font-black text-amber-400">
                    +{linkBudget.eirpDbw} dBW
                  </span>
                  <span className="text-[10px] text-slate-500 block">
                    Tx Gain: +{linkBudget.transmitAntennaGainDbi} dBi
                  </span>
                </div>

                <div className="p-3.5 rounded-xl bg-slate-900/80 border border-slate-800 space-y-1">
                  <span className="text-[10px] text-slate-500 uppercase block">Free-Space Path Loss</span>
                  <span className="text-base font-black text-rose-400">
                    -{linkBudget.freeSpacePathLossDb} dB
                  </span>
                  <span className="text-[10px] text-slate-500 block">
                    Range: {linkBudget.distanceKm.toLocaleString()} km
                  </span>
                </div>

                <div className="p-3.5 rounded-xl bg-slate-900/80 border border-slate-800 space-y-1">
                  <span className="text-[10px] text-slate-500 uppercase block">Ground Station (G/T)</span>
                  <span className="text-base font-black text-cyan-300">
                    +{linkBudget.gOverTDbK} dB/K
                  </span>
                  <span className="text-[10px] text-slate-500 block">
                    DSN 34m BWG (Tsys: {linkBudget.systemNoiseTempK}K)
                  </span>
                </div>

                <div className="p-3.5 rounded-xl bg-slate-900/80 border border-slate-800 space-y-1">
                  <span className="text-[10px] text-slate-500 uppercase block">Eb/N0 & Link Margin</span>
                  <span
                    className={`text-base font-black ${
                      linkBudget.linkMarginDb >= 3.0
                        ? 'text-emerald-400'
                        : linkBudget.linkMarginDb >= 0.0
                        ? 'text-amber-400'
                        : 'text-rose-400'
                    }`}
                  >
                    +{linkBudget.linkMarginDb} dB
                  </span>
                  <span className="text-[10px] text-slate-500 block">
                    Eb/N0: {linkBudget.ebNoDb} dB (Req: {linkBudget.requiredEbNoDb} dB)
                  </span>
                </div>
              </div>

              {/* STK Comm Link Budget Ledger Table */}
              <div className="rounded-xl border border-slate-800 bg-slate-950/80 overflow-hidden text-xs">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-900 text-slate-400 border-b border-slate-800 font-semibold text-[11px]">
                      <th className="p-3">STK Comm Parameter</th>
                      <th className="p-3">Value</th>
                      <th className="p-3">Units</th>
                      <th className="p-3">Formula / Standards</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60 font-mono text-slate-300 text-[11px]">
                    <tr className="hover:bg-slate-900/40">
                      <td className="p-3 text-amber-300">Transmitter RF Power (Pt)</td>
                      <td className="p-3 font-bold">{linkBudget.transmitterPowerW.toFixed(1)} ({10.0 * Math.log10(linkBudget.transmitterPowerW)} dBW)</td>
                      <td className="p-3 text-slate-500">W / dBW</td>
                      <td className="p-3 text-slate-400">10*log10(Pt)</td>
                    </tr>
                    <tr className="hover:bg-slate-900/40">
                      <td className="p-3 text-amber-300">Transmit Antenna Gain (Gt)</td>
                      <td className="p-3 font-bold">+{linkBudget.transmitAntennaGainDbi}</td>
                      <td className="p-3 text-slate-500">dBi</td>
                      <td className="p-3 text-slate-400">Parabolic aperture efficiency η = 0.60</td>
                    </tr>
                    <tr className="hover:bg-slate-900/40">
                      <td className="p-3 text-white font-bold">Equivalent Isotropically Radiated Power (EIRP)</td>
                      <td className="p-3 font-black text-amber-400">+{linkBudget.eirpDbw}</td>
                      <td className="p-3 text-slate-500">dBW</td>
                      <td className="p-3 text-slate-400">Pt + Gt</td>
                    </tr>
                    <tr className="hover:bg-slate-900/40">
                      <td className="p-3 text-rose-300">Free Space Path Loss (FSPL)</td>
                      <td className="p-3 font-bold text-rose-400">-{linkBudget.freeSpacePathLossDb}</td>
                      <td className="p-3 text-slate-500">dB</td>
                      <td className="p-3 text-slate-400">20*log10(4*π*d / λ)</td>
                    </tr>
                    <tr className="hover:bg-slate-900/40">
                      <td className="p-3 text-rose-300">Polar Regolith Multipath & Scattering Loss</td>
                      <td className="p-3 font-bold text-rose-400">-{linkBudget.regolithMultipathLossDb}</td>
                      <td className="p-3 text-slate-500">dB</td>
                      <td className="p-3 text-slate-400">Spikes when Earth elevation &lt; 2° above horizon</td>
                    </tr>
                    <tr className="hover:bg-slate-900/40">
                      <td className="p-3 text-cyan-300">Ground Station Figure of Merit (G/T)</td>
                      <td className="p-3 font-bold text-cyan-300">+{linkBudget.gOverTDbK}</td>
                      <td className="p-3 text-slate-500">dB/K</td>
                      <td className="p-3 text-slate-400">NASA DSN 34m Beam Waveguide cryogenic dish</td>
                    </tr>
                    <tr className="hover:bg-slate-900/40">
                      <td className="p-3 text-emerald-300 font-bold">Available Energy per Bit / Noise Density (Eb/N0)</td>
                      <td className="p-3 font-black text-emerald-300">+{linkBudget.ebNoDb}</td>
                      <td className="p-3 text-slate-500">dB</td>
                      <td className="p-3 text-slate-400">C/N0 - 10*log10(Rb) at {linkBudget.bitRateMbps} Mbps</td>
                    </tr>
                    <tr className="hover:bg-slate-900/40 bg-emerald-950/20 font-bold">
                      <td className="p-3 text-emerald-300">Final STK Downlink Margin</td>
                      <td className="p-3 font-black text-emerald-400 text-sm">+{linkBudget.linkMarginDb} dB</td>
                      <td className="p-3 text-slate-500">dB</td>
                      <td className="p-3 text-slate-300">Required Eb/N0 = +3.8 dB (LDPC rate 1/2, BER 1e-6)</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 5: ACCESS & LIGHTING REPORT */}
          {activeTab === 'REPORT' && (
            <div className="space-y-4 max-w-5xl mx-auto">
              <div className="flex items-center justify-between p-3.5 rounded-lg bg-slate-900 border border-slate-800 text-xs">
                <div>
                  <span className="font-bold text-purple-300 block">ANSYS STK ACCESS & LIGHTING INTERVAL REPORT</span>
                  <span className="text-[11px] text-slate-400">
                    Full 30-day mission intervals for Direct Sunlight, DTE Line-of-Sight, and Lunar Gateway NRHO Relay
                  </span>
                </div>
                <button
                  onClick={() =>
                    handleDownloadFile(stkBundle.accessReport, `PLUTON_${currentSite.name.replace(/[^a-zA-Z0-9]/g, '_')}_Access_Report.txt`)
                  }
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-purple-500/20 hover:bg-purple-500/30 text-purple-300 text-xs font-bold border border-purple-500/40"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download ASCII Report</span>
                </button>
              </div>

              <div className="rounded-xl border border-slate-800 bg-[#040711] p-4 text-xs font-mono overflow-auto max-h-[55vh]">
                <pre className="text-purple-200/90 whitespace-pre selection:bg-purple-500/30 text-[10px]">
                  {stkBundle.accessReport}
                </pre>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

