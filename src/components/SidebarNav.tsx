'use client';

import React from 'react';
import {
  LayoutDashboard,
  ShieldAlert,
  CalendarDays,
  ListOrdered,
  Compass,
  Radio,
  Sliders,
  Database,
  Orbit,
  Signal,
  Layers,
  Sparkles,
  FileText,
} from 'lucide-react';
import { getAssetPath } from '@/utils/assetPath';

export type ActiveNavTab = 'WORKSPACE' | 'ASSESSMENT' | 'LAUNCH' | 'EVENTS';

interface SidebarNavProps {
  activeTab: ActiveNavTab;
  onChangeTab: (tab: ActiveNavTab) => void;
  onOpenHorizons: () => void;
  onOpenCosmographia: () => void;
  onOpenStk: () => void;
  onOpenOde: () => void;
  onOpenComparator: () => void;
  siteName: string;
  isViable: boolean;
  sunlitPct: number;
  dtePct: number;
}

export const SidebarNav: React.FC<SidebarNavProps> = ({
  activeTab,
  onChangeTab,
  onOpenHorizons,
  onOpenCosmographia,
  onOpenStk,
  onOpenOde,
  onOpenComparator,
  siteName,
  isViable,
  sunlitPct,
  dtePct,
}) => {
  const navItems: { id: ActiveNavTab; label: string; icon: React.ReactNode; shortcut: string; badge?: string }[] = [
    {
      id: 'WORKSPACE',
      label: '3D TACTICAL HUD',
      icon: <LayoutDashboard className="w-4 h-4" />,
      shortcut: '1',
      badge: 'LIVE',
    },
    {
      id: 'ASSESSMENT',
      label: 'SITE ASSESSMENT',
      icon: <ShieldAlert className="w-4 h-4" />,
      shortcut: '2',
      badge: isViable ? 'GO' : 'RISK',
    },
    {
      id: 'LAUNCH',
      label: 'LAUNCH WINDOWS',
      icon: <CalendarDays className="w-4 h-4" />,
      shortcut: '3',
    },
    {
      id: 'EVENTS',
      label: 'MISSION EVENTS',
      icon: <ListOrdered className="w-4 h-4" />,
      shortcut: '4',
    },
  ];

  return (
    <aside className="w-64 bg-[#040711] border-r border-slate-800/80 flex flex-col justify-between select-none z-30 font-mono text-slate-300 flex-shrink-0">
      {/* Top Branding & Tactical Header */}
      <div>
        <div className="p-3.5 border-b border-slate-800/80 bg-[#060a17]">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="relative flex items-center justify-center w-8 h-8 rounded-lg overflow-hidden border border-cyan-500/50 shadow-inner shadow-cyan-500/20 bg-[#060a17] flex-shrink-0 group">
                <img
                  src={getAssetPath('/pluton-logo.png')}
                  alt="PLUTON Profile Logo"
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                />
                <div className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-emerald-400 animate-pulse border border-[#060a17]" />
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <span className="font-black text-sm tracking-wider text-white">PLUTON</span>
                  <span className="text-[9px] px-1 py-0.2 rounded bg-amber-500/15 text-amber-300 border border-amber-500/30 font-bold">
                    v2.5 HUD
                  </span>
                </div>
                <div className="text-[9px] text-slate-500 tracking-tight truncate">
                  Tactical Lunar Mission Console
                </div>
              </div>
            </div>
          </div>

          {/* Tactical Target Indicator */}
          <div className="mt-2.5 p-2 rounded bg-[#090e1c] border border-slate-800 text-[10px] space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-slate-500 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-cyan-400"></span>
                TARGET:
              </span>
              <span className="text-amber-300 font-bold truncate max-w-[120px]">{siteName}</span>
            </div>
            <div className="flex items-center justify-between text-[9px]">
              <span className="text-slate-500">SUN / DTE:</span>
              <span className="text-slate-300 font-bold">
                {sunlitPct.toFixed(0)}% / {dtePct.toFixed(0)}%
              </span>
            </div>
          </div>
        </div>

        {/* Primary View Navigation */}
        <div className="p-2 space-y-1">
          <div className="px-2 py-1 text-[9px] uppercase font-bold text-slate-500 tracking-wider">
            Primary Console Views
          </div>
          {navItems.map((item) => {
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => onChangeTab(item.id)}
                className={`w-full flex items-center justify-between px-2.5 py-2 rounded text-xs font-bold transition-all cursor-pointer ${isActive
                  ? 'bg-gradient-to-r from-amber-500/20 via-slate-800 to-transparent text-amber-300 border-l-2 border-amber-400 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/60'
                  }`}
              >
                <div className="flex items-center gap-2">
                  <span className={isActive ? 'text-amber-400' : 'text-slate-500'}>{item.icon}</span>
                  <span className="tracking-wide text-[11px]">{item.label}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  {item.badge && (
                    <span
                      className={`text-[9px] px-1.5 py-0.2 rounded font-bold ${item.badge === 'LIVE'
                        ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30'
                        : item.badge === 'GO'
                          ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                          : 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                        }`}
                    >
                      {item.badge}
                    </span>
                  )}
                  <kbd className="hidden sm:inline-block px-1.5 py-0.5 rounded bg-slate-950 border border-slate-800 text-[9px] text-slate-500">
                    {item.shortcut}
                  </kbd>
                </div>
              </button>
            );
          })}
        </div>

        {/* Aerospace Systems & External Portals Section */}
        <div className="p-2 border-t border-slate-800/80 space-y-1">
          <div className="px-2 py-1 text-[9px] uppercase font-bold text-slate-500 tracking-wider">
            Astrodynamic Centers
          </div>

          <button
            onClick={onOpenHorizons}
            className="w-full flex items-center justify-between px-2.5 py-1.5 rounded text-[11px] font-bold text-cyan-300/90 hover:text-cyan-200 bg-cyan-950/20 hover:bg-cyan-950/40 border border-cyan-900/40 transition-all cursor-pointer"
            title="NASA JPL Horizons DE441 Ephemeris Center"
          >
            <div className="flex items-center gap-2">
              <Database className="w-3.5 h-3.5 text-cyan-400" />
              <span>JPL DE441 DATA</span>
            </div>
            <span className="text-[9px] text-cyan-500">301</span>
          </button>

          <button
            onClick={onOpenCosmographia}
            className="w-full flex items-center justify-between px-2.5 py-1.5 rounded text-[11px] font-bold text-amber-300/90 hover:text-amber-200 bg-amber-950/20 hover:bg-amber-950/40 border border-amber-900/40 transition-all cursor-pointer"
            title="NASA NAIF SPICE Cosmographia 3D Visualizer"
          >
            <div className="flex items-center gap-2">
              <Orbit className="w-3.5 h-3.5 text-amber-400 animate-spin-slow" />
              <span>COSMOGRAPHIA 3D</span>
            </div>
            <span className="text-[9px] text-amber-500">SPICE</span>
          </button>

          <button
            onClick={onOpenStk}
            className="w-full flex items-center justify-between px-2.5 py-1.5 rounded text-[11px] font-bold text-purple-300/90 hover:text-purple-200 bg-purple-950/20 hover:bg-purple-950/40 border border-purple-900/40 transition-all cursor-pointer"
            title="Ansys STK Systems Tool Kit Mission Generator"
          >
            <div className="flex items-center gap-2">
              <Signal className="w-3.5 h-3.5 text-purple-400" />
              <span>ANSYS STK MISSION</span>
            </div>
            <span className="text-[9px] text-purple-500">RF LINK</span>
          </button>

          <button
            onClick={onOpenOde}
            className="w-full flex items-center justify-between px-2.5 py-1.5 rounded text-[11px] font-bold text-emerald-300/90 hover:text-emerald-200 bg-emerald-950/20 hover:bg-emerald-950/40 border border-emerald-900/40 transition-all cursor-pointer"
            title="WUSTL PDS Lunar Orbital Data Explorer Datasets"
          >
            <div className="flex items-center gap-2">
              <Layers className="w-3.5 h-3.5 text-emerald-400" />
              <span>WUSTL ODE PDS</span>
            </div>
            <span className="text-[9px] text-emerald-500">207 DS</span>
          </button>

          <button
            onClick={onOpenComparator}
            className="w-full flex items-center justify-between px-2.5 py-1.5 rounded text-[11px] font-bold text-slate-300 hover:text-white bg-slate-900 hover:bg-slate-800 border border-slate-700 transition-all cursor-pointer"
            title="Site A vs Site B Trade-Off Comparator"
          >
            <div className="flex items-center gap-2">
              <Sliders className="w-3.5 h-3.5 text-amber-400" />
              <span>TRADE STUDY</span>
            </div>
            <span className="text-[9px] text-slate-500">A vs B</span>
          </button>

          <a
            href={getAssetPath('/PLUTON_LUNAR_RESEARCH_PAPER.pdf')}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full flex items-center justify-between px-2.5 py-1.5 rounded text-[11px] font-bold text-blue-300 hover:text-white bg-blue-950/40 hover:bg-blue-900/60 border border-blue-500/50 transition-all cursor-pointer"
            title="Read 11-Page Peer-Reviewed IEEE/AIAA Scientific Research Paper (PDF)"
          >
            <div className="flex items-center gap-2">
              <FileText className="w-3.5 h-3.5 text-blue-400" />
              <span>RESEARCH PAPER</span>
            </div>
            <span className="text-[9px] text-blue-400 font-mono">11P PDF</span>
          </a>
        </div>
      </div>

      {/* Mission Operator Profile */}
      <div className="p-2.5 border-t border-slate-800/80 bg-[#060a17] flex items-center justify-between gap-2">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="relative w-8 h-8 rounded-full overflow-hidden border border-cyan-400/60 shadow-md shadow-cyan-500/20 bg-[#080d1a] flex-shrink-0">
            <img
              src={getAssetPath('/pluton-logo.png')}
              alt="PLUTON Profile"
              className="w-full h-full object-cover"
            />
            <span className="absolute bottom-0 right-0 w-2 h-2 rounded-full bg-emerald-400 border border-slate-900" />
          </div>
          <div className="flex flex-col min-w-0">
            <span className="text-[11px] font-bold text-slate-200 truncate">PLUTON DIR</span>
            <span className="text-[9px] text-cyan-400 font-semibold tracking-tight">FLIGHT OPS</span>
          </div>
        </div>
        <span className="px-1.5 py-0.5 rounded bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 text-[8px] font-bold">
          ONLINE
        </span>
      </div>

      {/* Footer DSN Link Telemetry Pill */}
      <div className="p-3 border-t border-slate-800/80 bg-[#060a17] text-[10px] space-y-1.5">
        <div className="flex items-center justify-between">
          <span className="text-slate-500 flex items-center gap-1.5">
            <Radio className="w-3.5 h-3.5 text-cyan-400 animate-pulse" />
            <span>DSN GROUND:</span>
          </span>
          <span className="text-cyan-300 font-bold">CANBERRA 43</span>
        </div>
        <div className="w-full bg-slate-900 h-1.5 rounded-full overflow-hidden border border-slate-800">
          <div className="bg-gradient-to-r from-emerald-500 to-cyan-500 h-full w-[94%]" />
        </div>
        <div className="flex items-center justify-between text-[9px] text-slate-500">
          <span>SIGNAL LOCK: 94%</span>
          <span className="text-emerald-400 font-bold">NOMINAL</span>
        </div>
      </div>
    </aside>
  );
};

