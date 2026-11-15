'use client';

import React from 'react';
import {
  Compass,
  Radio,
  Globe,
  Sliders,
  BookOpen,
  Cpu,
  Download,
  Database,
  Orbit,
  Signal,
} from 'lucide-react';
import {
  LunarSite,
  HardwareProfile,
  UserPersona,
  DSNGroundStation,
} from '@/types/pluton';
import { LUNAR_SOUTH_POLE_SITES, HARDWARE_DIGITAL_TWINS } from '@/data/lunarDatabase';

interface HeaderHUDProps {
  currentSite: LunarSite;
  onSelectSite: (site: LunarSite) => void;
  currentHardware: HardwareProfile;
  onSelectHardware: (hw: HardwareProfile) => void;
  persona: UserPersona;
  onTogglePersona: (persona: UserPersona) => void;
  activeDsnStation: DSNGroundStation;
  currentEpoch: Date;
  onOpenEducatorModal: () => void;
  onOpenComparator: () => void;
  onExportReport: () => void;
  onOpenHorizons: () => void;
  onOpenCosmographia: () => void;
  onOpenStk: () => void;
  onOpenOde: () => void;
}

export const HeaderHUD: React.FC<HeaderHUDProps> = ({
  currentSite,
  onSelectSite,
  currentHardware,
  onSelectHardware,
  persona,
  onTogglePersona,
  activeDsnStation,
  currentEpoch,
  onOpenEducatorModal,
  onOpenComparator,
  onExportReport,
  onOpenHorizons,
  onOpenCosmographia,
  onOpenStk,
  onOpenOde,
}) => {
  return (
    <header className="w-full bg-[#060913]/95 border-b border-pluton-border backdrop-blur-md sticky top-0 z-40 text-slate-100 select-none">
      <div className="max-w-[1920px] mx-auto px-4 py-2.5 flex flex-wrap items-center justify-between gap-3">
        {/* Left: Branding & Mission Badges */}
        <div className="flex items-center gap-3.5">
          <div className="flex items-center gap-2.5">
            <div className="relative flex items-center justify-center w-9 h-9 rounded-lg bg-gradient-to-br from-amber-500/20 via-cyan-500/10 to-purple-600/20 border border-amber-500/40 shadow-inner shadow-amber-500/20">
              <Compass className="w-5 h-5 text-amber-400 animate-spin-slow" />
              <div className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-mono font-black text-lg tracking-wider bg-gradient-to-r from-amber-300 via-amber-100 to-cyan-300 bg-clip-text text-transparent">
                  PLUTON
                </span>
                <span className="text-[10px] uppercase font-mono px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-300 border border-amber-500/30">
                  v2.4 POLAR
                </span>
              </div>
              <div className="text-[10px] text-slate-400 font-mono tracking-tight hidden sm:block">
                Polar Lunar Utilities, Topography & Orbital Navigator • NASA JPL / CSA
              </div>
            </div>
          </div>

          {/* DSN Ground Station Badge */}
          <div className="hidden lg:flex items-center gap-2 px-2.5 py-1 rounded bg-[#0f172a] border border-cyan-900/50 text-[11px] font-mono">
            <Radio className="w-3.5 h-3.5 text-cyan-400 animate-pulse" />
            <span className="text-slate-400">DSN LINK:</span>
            <span className="text-cyan-300 font-bold">{activeDsnStation} DSN-43</span>
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
          </div>
        </div>

        {/* Center: Mission Selectors */}
        <div className="flex items-center flex-wrap gap-2.5">
          {/* Landing Site Dropdown */}
          <div className="flex items-center gap-1.5 bg-[#0f172a] px-2.5 py-1 rounded border border-slate-700/60">
            <Globe className="w-3.5 h-3.5 text-amber-400" />
            <span className="text-[11px] font-mono text-slate-400">SITE:</span>
            <select
              aria-label="Target Lunar Landing Site"
              value={currentSite.id}
              onChange={(e) => {
                const s = LUNAR_SOUTH_POLE_SITES.find((item) => item.id === e.target.value);
                if (s) onSelectSite(s);
              }}
              className="bg-transparent text-[11px] font-mono font-bold text-amber-300 focus:outline-none cursor-pointer max-w-[190px] truncate"
            >
              {LUNAR_SOUTH_POLE_SITES.map((site) => (
                <option key={site.id} value={site.id} className="bg-[#0f172a] text-slate-200">
                  {site.name} ({site.latitude.toFixed(1)}°S, {site.elevation}m)
                </option>
              ))}
            </select>
          </div>

          {/* Hardware Twin Dropdown */}
          <div className="flex items-center gap-1.5 bg-[#0f172a] px-2.5 py-1 rounded border border-slate-700/60">
            <Cpu className="w-3.5 h-3.5 text-cyan-400" />
            <span className="text-[11px] font-mono text-slate-400">HARDWARE:</span>
            <select
              aria-label="Hardware Digital Twin Profile"
              value={currentHardware.id}
              onChange={(e) => {
                const hw = HARDWARE_DIGITAL_TWINS.find((item) => item.id === e.target.value);
                if (hw) onSelectHardware(hw);
              }}
              className="bg-transparent text-[11px] font-mono font-bold text-cyan-300 focus:outline-none cursor-pointer max-w-[170px] truncate"
            >
              {HARDWARE_DIGITAL_TWINS.map((hw) => (
                <option key={hw.id} value={hw.id} className="bg-[#0f172a] text-slate-200">
                  {hw.name} ({hw.mastHeight}m mast, {hw.batteryCapacityWh}Wh)
                </option>
              ))}
            </select>
          </div>

          {/* Quick Trade-off Comparator Button */}
          <button
            onClick={onOpenComparator}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-[#0f172a] hover:bg-slate-800 text-[11px] font-mono font-bold text-slate-200 border border-slate-700 hover:border-amber-500/60 transition-all shadow-sm cursor-pointer"
            title="Open Site A vs Site B Split Trade-Off Comparator"
          >
            <Sliders className="w-3.5 h-3.5 text-amber-400" />
            <span>TRADE-OFF STUDIO</span>
          </button>
        </div>

        {/* Right: Horizons Data Center, Persona Mode & Actions */}
        <div className="flex items-center gap-2">
          {/* JPL Horizons DE441 Data Center Button */}
          <button
            onClick={onOpenHorizons}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-cyan-500/15 hover:bg-cyan-500/25 text-cyan-300 border border-cyan-500/40 text-[11px] font-mono font-bold transition-all shadow-sm cursor-pointer"
            title="Open NASA JPL Horizons DE441 Ground-Truth Ephemeris & Geophysics Center"
          >
            <Database className="w-3.5 h-3.5 text-cyan-400 animate-pulse" />
            <span className="hidden sm:inline">JPL DE441 DATA</span>
          </button>

          {/* NASA NAIF Cosmographia 3D Visualizer & Exporter Button */}
          <button
            onClick={onOpenCosmographia}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-amber-500/15 hover:bg-amber-500/25 text-amber-300 border border-amber-500/40 text-[11px] font-mono font-bold transition-all shadow-sm cursor-pointer"
            title="Launch NASA NAIF SPICE Cosmographia 3D Visualizer & JSON Catalog Exporter"
          >
            <Orbit className="w-3.5 h-3.5 text-amber-400 animate-spin-slow" />
            <span className="hidden sm:inline">COSMOGRAPHIA 3D</span>
          </button>

          {/* Ansys STK Mission Center & RF Link Budget Button */}
          <button
            onClick={onOpenStk}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-purple-500/15 hover:bg-purple-500/25 text-purple-300 border border-purple-500/40 text-[11px] font-mono font-bold transition-all shadow-sm cursor-pointer"
            title="Launch Ansys STK Mission Scenario Generator & RF Link Budget Center"
          >
            <Signal className="w-3.5 h-3.5 text-purple-400 animate-pulse" />
            <span className="hidden sm:inline">ANSYS STK</span>
          </button>

          {/* WUSTL PDS Lunar Orbital Data Explorer (ODE) Button */}
          <button
            onClick={onOpenOde}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-300 border border-emerald-500/40 text-[11px] font-mono font-bold transition-all shadow-sm cursor-pointer"
            title="Open Washington University in St. Louis PDS Lunar Orbital Data Explorer (ODE) Datasets Center"
          >
            <Database className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
            <span className="hidden sm:inline">ODE DATASETS</span>
          </button>

          {/* Persona Toggle */}
          <div className="flex items-center bg-[#0f172a] p-0.5 rounded border border-slate-700">
            <button
              onClick={() => onTogglePersona('engineer')}
              className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold transition-all cursor-pointer ${
                persona === 'engineer'
                  ? 'bg-amber-500 text-slate-950 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              ENGINEER
            </button>
            <button
              onClick={() => {
                onTogglePersona('educator');
                onOpenEducatorModal();
              }}
              className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold flex items-center gap-1 transition-all cursor-pointer ${
                persona === 'educator'
                  ? 'bg-cyan-500 text-slate-950 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <BookOpen className="w-3 h-3" />
              <span>EXPLORER</span>
            </button>
          </div>

          {/* Export Report */}
          <button
            onClick={onExportReport}
            className="p-1.5 rounded bg-[#0f172a] hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-700 transition-colors cursor-pointer"
            title="Export 30-Day Mission Ephemeris CSV / JSON Report"
          >
            <Download className="w-4 h-4" />
          </button>
        </div>
      </div>
    </header>
  );
};
