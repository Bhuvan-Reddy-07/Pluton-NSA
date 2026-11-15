'use client';

import React from 'react';
import {
  CalendarDays,
  Rocket,
  Compass,
  TrendingUp,
  AlertTriangle,
  CheckCircle2,
  Clock,
  ArrowRight,
  Flame,
  ShieldCheck,
} from 'lucide-react';
import { LunarSite, HardwareProfile, TerrainHorizonProfile } from '@/types/pluton';
import { LaunchSlipCarpetPlot } from '@/components/LaunchSlipCarpetPlot';

interface LaunchPlanningViewProps {
  site: LunarSite;
  hardware: HardwareProfile;
  horizonProfile: TerrainHorizonProfile;
  baselineDate: Date;
  currentSlipOffset: number;
  onSelectSlipOffset: (offset: number) => void;
}

export const LaunchPlanningView: React.FC<LaunchPlanningViewProps> = ({
  site,
  hardware,
  horizonProfile,
  baselineDate,
  currentSlipOffset,
  onSelectSlipOffset,
}) => {
  const actualDate = new Date(baselineDate.getTime() + currentSlipOffset * 86400000);

  return (
    <div className="w-full flex flex-col gap-4 font-mono text-slate-200 animate-in fade-in duration-200">
      {/* Top Banner: Launch Window Mission Overview */}
      <div className="p-4 rounded-xl bg-[#090e1c] border border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="relative w-12 h-12 rounded-xl overflow-hidden border border-cyan-400/60 flex-shrink-0 bg-[#080d1a] shadow-lg shadow-cyan-500/20">
            <img
              src="/pluton-logo.png"
              alt="PLUTON Profile"
              className="w-full h-full object-cover"
            />
            <div className="absolute top-0 right-0 w-3 h-3 rounded-full border-2 border-[#090e1c] bg-blue-400 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs uppercase font-bold text-slate-400">MISSION TRAJECTORY & LAUNCH DECK:</span>
              <span className="text-sm font-black text-blue-300">ARTEMIS III POLAR INSERTER</span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Baseline Target Launch: <strong className="text-white">{baselineDate.toISOString().split('T')[0]} 00:00Z</strong> • Active Slip Offset:{' '}
              <strong className={currentSlipOffset === 0 ? 'text-emerald-400' : 'text-amber-400'}>
                {currentSlipOffset > 0 ? `+${currentSlipOffset}` : currentSlipOffset} Days
              </strong>{' '}
              ({actualDate.toISOString().split('T')[0]})
            </p>
          </div>
        </div>

        {/* Quick Launch Offset Presets */}
        <div className="flex items-center flex-wrap gap-1.5 bg-[#060a14] p-1 rounded-lg border border-slate-800">
          <span className="text-[10px] text-slate-500 px-2 font-bold">PRESETS:</span>
          {[-7, -3, 0, 3, 7, 14].map((offset) => (
            <button
              key={offset}
              onClick={() => onSelectSlipOffset(offset)}
              className={`px-2.5 py-1 rounded text-xs font-bold transition-all cursor-pointer ${currentSlipOffset === offset
                ? 'bg-amber-500 text-slate-950 shadow-sm'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
                }`}
            >
              {offset > 0 ? `+${offset}d` : `${offset}d`}
            </button>
          ))}
        </div>
      </div>

      {/* Primary 2D Carpet Plot Component */}
      <div className="w-full">
        <LaunchSlipCarpetPlot
          site={site}
          hardware={hardware}
          horizonProfile={horizonProfile}
          baselineDate={baselineDate}
          currentSlipOffset={currentSlipOffset}
          onSelectSlipOffset={onSelectSlipOffset}
        />
      </div>

      {/* Trajectory Flight Parameters HUD */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
        <div className="p-3.5 rounded-xl bg-[#070b16] border border-slate-800 flex flex-col justify-between">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>TRANS-LUNAR INJECTION (TLI)</span>
            <span className="text-emerald-400 font-bold">NOMINAL</span>
          </div>
          <div className="my-2">
            <div className="text-xl font-bold text-white">3,120 m/s</div>
            <div className="text-[10px] text-slate-500 mt-0.5">Earth parking orbit to lunar transfer corridor</div>
          </div>
          <div className="text-[10px] text-slate-400">Transit Duration: ~4.2 Days (101h)</div>
        </div>

        <div className="p-3.5 rounded-xl bg-[#070b16] border border-slate-800 flex flex-col justify-between">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>PERILUNE INSERTION (LOI)</span>
            <span className="text-cyan-400 font-bold">POLAR NRHO</span>
          </div>
          <div className="my-2">
            <div className="text-xl font-bold text-white">840 m/s</div>
            <div className="text-[10px] text-slate-500 mt-0.5">Gateway 9:2 NRHO / Low Lunar Orbit Target</div>
          </div>
          <div className="text-[10px] text-slate-400">Perilune Altitude: 100 km North / 70,000 km South</div>
        </div>

        <div className="p-3.5 rounded-xl bg-[#070b16] border border-slate-800 flex flex-col justify-between">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>POWER WINDOW ROBUSTNESS</span>
            <span className="text-amber-400 font-bold">SENSITIVE</span>
          </div>
          <div className="my-2">
            <div className="text-xl font-bold text-white">±4.5 Days</div>
            <div className="text-[10px] text-slate-500 mt-0.5">Maximum slip buffer before critical shadow cutoff</div>
          </div>
          <div className="text-[10px] text-slate-400">Slip &gt; 5d requires mast height &gt; 3.0m</div>
        </div>
      </div>
    </div>
  );
};

