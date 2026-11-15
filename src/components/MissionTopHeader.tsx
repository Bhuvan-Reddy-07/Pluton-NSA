'use client';

import React from 'react';
import {
  Globe,
  Cpu,
  Clock,
  Download,
  BookOpen,
  Calendar,
  Layers,
  ChevronRight,
  ShieldCheck,
  Flame,
  BatteryCharging,
  FileText,
} from 'lucide-react';
import { getAssetPath } from '@/utils/assetPath';
import {
  LunarSite,
  HardwareProfile,
  UserPersona,
  DSNGroundStation,
  EphemerisState,
} from '@/types/pluton';
import { LUNAR_SOUTH_POLE_SITES, HARDWARE_DIGITAL_TWINS } from '@/data/lunarDatabase';

interface MissionTopHeaderProps {
  currentSite: LunarSite;
  onSelectSite: (site: LunarSite) => void;
  currentHardware: HardwareProfile;
  onSelectHardware: (hw: HardwareProfile) => void;
  persona: UserPersona;
  onTogglePersona: (persona: UserPersona) => void;
  activeDsnStation: DSNGroundStation;
  currentEpoch: Date;
  onOpenEducatorModal: () => void;
  onExportReport: () => void;
  ephemerisState?: EphemerisState;
  mastHeightM: number;
}

export const MissionTopHeader: React.FC<MissionTopHeaderProps> = ({
  currentSite,
  onSelectSite,
  currentHardware,
  onSelectHardware,
  persona,
  onTogglePersona,
  activeDsnStation,
  currentEpoch,
  onOpenEducatorModal,
  onExportReport,
  ephemerisState,
  mastHeightM,
}) => {
  return (
    <header className="w-full bg-[#060a14] border-b border-slate-800/90 px-4 py-2 flex flex-wrap items-center justify-between gap-3 text-slate-200 font-mono text-xs select-none sticky top-0 z-20">
      {/* Left: Brand Identity & Mission Selectors */}
      <div className="flex items-center flex-wrap gap-2.5">
        {/* PLUTON Brand Profile Badge */}
        <div className="flex items-center gap-2 pr-2.5 border-r border-slate-800/90">
          <div className="relative w-7 h-7 rounded-lg overflow-hidden border border-cyan-400/60 shadow-md shadow-cyan-500/20 bg-[#080d1a] flex-shrink-0">
            <img
              src={getAssetPath('/pluton-logo.png')}
              alt="PLUTON Profile"
              className="w-full h-full object-cover"
            />
            <span className="absolute bottom-0 right-0 w-1.5 h-1.5 rounded-full bg-emerald-400" />
          </div>
          <div className="hidden sm:flex flex-col">
            <div className="flex items-center gap-1">
              <span className="font-black text-[12px] text-white tracking-widest leading-none">PLUTON</span>
              <span className="text-[8px] px-1 py-0.2 rounded bg-cyan-500/20 text-cyan-300 font-bold border border-cyan-500/30">
                NASA
              </span>
            </div>
            <span className="text-[8px] text-slate-400 font-medium tracking-tight leading-none mt-0.5">
              ARTEMIS III HUD
            </span>
          </div>
        </div>

        {/* Site Selector */}
        <div className="flex items-center gap-1.5 bg-[#090e1c] px-2.5 py-1.5 rounded border border-slate-700/70 hover:border-amber-500/50 transition-colors">
          <Globe className="w-3.5 h-3.5 text-amber-400" />
          <span className="text-[10px] text-slate-400 font-bold">SITE:</span>
          <select
            aria-label="Target Lunar Landing Site"
            value={currentSite.id}
            onChange={(e) => {
              const s = LUNAR_SOUTH_POLE_SITES.find((item) => item.id === e.target.value);
              if (s) onSelectSite(s);
            }}
            className="bg-transparent text-[11px] font-bold text-amber-300 focus:outline-none cursor-pointer max-w-[200px] truncate"
          >
            {LUNAR_SOUTH_POLE_SITES.map((site) => (
              <option key={site.id} value={site.id} className="bg-[#0f172a] text-slate-200">
                {site.name} ({site.latitude.toFixed(1)}°S, {site.elevation}m)
              </option>
            ))}
          </select>
        </div>

        {/* Hardware Selector */}
        <div className="flex items-center gap-1.5 bg-[#090e1c] px-2.5 py-1.5 rounded border border-slate-700/70 hover:border-cyan-500/50 transition-colors">
          <Cpu className="w-3.5 h-3.5 text-cyan-400" />
          <span className="text-[10px] text-slate-400 font-bold">TWIN:</span>
          <select
            aria-label="Hardware Digital Twin Profile"
            value={currentHardware.id}
            onChange={(e) => {
              const hw = HARDWARE_DIGITAL_TWINS.find((item) => item.id === e.target.value);
              if (hw) onSelectHardware(hw);
            }}
            className="bg-transparent text-[11px] font-bold text-cyan-300 focus:outline-none cursor-pointer max-w-[180px] truncate"
          >
            {HARDWARE_DIGITAL_TWINS.map((hw) => (
              <option key={hw.id} value={hw.id} className="bg-[#0f172a] text-slate-200">
                {hw.name} ({hw.mastHeight}m mast, {hw.batteryCapacityWh}Wh)
              </option>
            ))}
          </select>
        </div>

        {/* Mast Height & Target Coordinates Pill */}
        <div className="hidden xl:flex items-center gap-2 px-2.5 py-1.5 rounded bg-[#090e1c] border border-slate-800 text-[10px]">
          <span className="text-slate-500">MAST:</span>
          <span className="text-amber-300 font-bold">{mastHeightM.toFixed(1)}m</span>
          <span className="text-slate-600">|</span>
          <span className="text-slate-500">SELENO:</span>
          <span className="text-cyan-300 font-bold">
            {currentSite.latitude.toFixed(2)}°S, {currentSite.longitude.toFixed(2)}°E
          </span>
        </div>
      </div>

      {/* Center: Live UTC Ephemeris Epoch Bar */}
      <div className="flex items-center gap-2 bg-[#090e1c] px-3 py-1 rounded border border-slate-800/80">
        <Clock className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
        <span className="text-slate-400 text-[10px]">UTC MET:</span>
        <span className="font-bold text-emerald-300 tracking-wider text-[11px]">
          {currentEpoch.toISOString().replace('T', ' ').slice(0, 19)}Z
        </span>
        {ephemerisState && (
          <span className="hidden sm:inline-block text-[9px] px-1.5 py-0.2 rounded bg-emerald-500/10 text-emerald-300 border border-emerald-500/30">
            SUN EL: {ephemerisState.sun.elevationTopocentricDeg.toFixed(1)}°
          </span>
        )}
      </div>

      {/* Right: Persona Toggle & CSV Export */}
      <div className="flex items-center gap-2">
        {/* Persona Mode Switch */}
        <div className="flex items-center bg-[#090e1c] p-0.5 rounded border border-slate-700">
          <button
            onClick={() => onTogglePersona('engineer')}
            className={`px-2 py-1 rounded text-[10px] font-bold transition-all cursor-pointer ${persona === 'engineer'
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
            className={`px-2 py-1 rounded text-[10px] font-bold flex items-center gap-1 transition-all cursor-pointer ${persona === 'educator'
              ? 'bg-cyan-500 text-slate-950 shadow-sm'
              : 'text-slate-400 hover:text-slate-200'
              }`}
          >
            <BookOpen className="w-3 h-3" />
            <span>EXPLORER</span>
          </button>
        </div>

        {/* Research Paper PDF Download */}
        <a
          href={getAssetPath('/PLUTON_LUNAR_RESEARCH_PAPER.pdf')}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-1.5 px-2.5 py-1.5 rounded bg-blue-950/40 hover:bg-blue-900/60 text-blue-300 hover:text-white border border-blue-500/50 hover:border-blue-400 transition-all cursor-pointer text-[10px] font-bold shadow-sm"
          title="Open Peer-Reviewed 11-Page Scientific Research Paper (AIAA/IEEE PDF)"
        >
          <FileText className="w-3.5 h-3.5 text-blue-400" />
          <span className="hidden lg:inline">RESEARCH PAPER (PDF)</span>
        </a>

        {/* Telemetry Report Export */}
        <button
          onClick={onExportReport}
          className="flex items-center gap-1.5 px-2.5 py-1.5 rounded bg-[#090e1c] hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-700 hover:border-slate-500 transition-all cursor-pointer text-[10px] font-bold"
          title="Export 30-Day Mission Ephemeris CSV / JSON Report"
        >
          <Download className="w-3.5 h-3.5 text-cyan-400" />
          <span className="hidden md:inline">EXPORT REPORT</span>
        </button>

        {/* Flight Director Profile Avatar */}
        <div
          className="flex items-center gap-1.5 pl-2 border-l border-slate-800/80 cursor-pointer group"
          title="Flight Operations Director — PLUTON Mission Command"
        >
          <div className="relative w-7 h-7 rounded-full overflow-hidden border border-cyan-400/60 shadow-md shadow-cyan-500/20 group-hover:border-cyan-300 transition-colors bg-[#080d1a] flex-shrink-0">
            <img
              src={getAssetPath('/pluton-logo.png')}
              alt="Flight Director Profile"
              className="w-full h-full object-cover"
            />
            <span className="absolute bottom-0 right-0 w-2 h-2 rounded-full bg-emerald-400 border border-slate-900 animate-pulse" />
          </div>
          <div className="hidden xl:flex flex-col text-left">
            <span className="text-[10px] font-bold text-slate-200 group-hover:text-cyan-300 transition-colors">FLIGHT DIR</span>
            <span className="text-[8px] text-emerald-400 font-semibold leading-none">ACTIVE LOCK</span>
          </div>
        </div>
      </div>
    </header>
  );
};

