'use client';

import React, { useState, useMemo } from 'react';
import {
  Calendar,
  AlertTriangle,
  CheckCircle,
  HelpCircle,
  TrendingDown,
  Layers,
  ChevronRight,
  Sparkles,
} from 'lucide-react';
import {
  LunarSite,
  HardwareProfile,
  TerrainHorizonProfile,
  CarpetPlotDayData,
} from '@/types/pluton';
import { generateLaunchSlipCarpetPlot } from '@/engine/missionPhysicsEngine';

interface LaunchSlipCarpetPlotProps {
  site: LunarSite;
  hardware: HardwareProfile;
  horizonProfile: TerrainHorizonProfile;
  baselineDate: Date;
  onSelectSlipOffset: (offsetDays: number) => void;
  currentSlipOffset: number;
}

export const LaunchSlipCarpetPlot: React.FC<LaunchSlipCarpetPlotProps> = ({
  site,
  hardware,
  horizonProfile,
  baselineDate,
  onSelectSlipOffset,
  currentSlipOffset,
}) => {
  const [metricMode, setMetricMode] = useState<'VIABILITY' | 'ILLUMINATION' | 'DTE' | 'SOC'>('VIABILITY');
  const [hoveredCell, setHoveredCell] = useState<CarpetPlotDayData | null>(null);

  // Range of launch offsets: e.g. -14 to +14 in 2-day increments
  const offsetRange = useMemo(() => [-14, -10, -7, -4, -2, 0, 2, 4, 7, 10, 14], []);

  // Compute 2D Carpet Plot matrix
  const carpetData = useMemo(() => {
    return generateLaunchSlipCarpetPlot(
      site,
      hardware,
      horizonProfile,
      baselineDate,
      offsetRange,
      30
    );
  }, [site, hardware, horizonProfile, baselineDate, offsetRange]);

  // Group data by offset
  const groupedByOffset = useMemo(() => {
    const map = new Map<number, CarpetPlotDayData[]>();
    for (const offset of offsetRange) {
      map.set(offset, []);
    }
    for (const item of carpetData) {
      const list = map.get(item.launchDateOffsetDays);
      if (list) list.push(item);
    }
    return map;
  }, [carpetData, offsetRange]);

  // Compute metrics for the active launch slip offset
  const activeSlipMetrics = useMemo(() => {
    const activeDays = groupedByOffset.get(currentSlipOffset) || [];
    let viableCount = 0;
    let firstDepletionDay: number | null = null;
    let avgIllum = 0;

    for (const d of activeDays) {
      if (d.viableScorePct >= 60) viableCount++;
      if (d.isDepleted && firstDepletionDay === null) {
        firstDepletionDay = d.missionDay;
      }
      avgIllum += d.illuminationPct;
    }

    avgIllum = activeDays.length > 0 ? Math.round(avgIllum / activeDays.length) : 0;

    return {
      viableDays: viableCount,
      totalDays: activeDays.length,
      firstDepletionDay,
      avgIllum,
    };
  }, [groupedByOffset, currentSlipOffset]);

  // Cell color resolver based on selected metric mode
  const getCellColor = (day: CarpetPlotDayData) => {
    if (day.isDepleted) return '#450a0a'; // Deep crimson for battery freeze

    if (metricMode === 'VIABILITY') {
      if (day.viableScorePct >= 80) return '#10b981'; // Vibrant emerald
      if (day.viableScorePct >= 50) return '#059669';
      if (day.viableScorePct >= 20) return '#ca8a04'; // Amber
      return '#dc2626'; // Red
    } else if (metricMode === 'ILLUMINATION') {
      if (day.illuminationPct >= 80) return '#f59e0b';
      if (day.illuminationPct >= 50) return '#d97706';
      if (day.illuminationPct >= 20) return '#78350f';
      return '#1e293b';
    } else if (metricMode === 'DTE') {
      if (day.dtePct >= 80) return '#06b6d4';
      if (day.dtePct >= 50) return '#0891b2';
      if (day.dtePct >= 20) return '#164e63';
      return '#1e293b';
    } else {
      // SoC
      if (day.minSoCPct >= 70) return '#10b981';
      if (day.minSoCPct >= 40) return '#eab308';
      if (day.minSoCPct >= 15) return '#f97316';
      return '#ef4444';
    }
  };

  return (
    <div className="w-full bg-[#0a0f1d] rounded-xl border border-pluton-border p-3.5 flex flex-col gap-3 shadow-xl select-none">
      {/* Top Header */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800 pb-2.5">
        <div className="flex items-center gap-2">
          <Calendar className="w-4 h-4 text-purple-400" />
          <h2 className="text-xs font-mono font-bold tracking-wider text-slate-200">
            LAUNCH SLIP CARPET PLOT & PORKCHOP VIABILITY MATRIX
          </h2>
          <span className="text-[10px] font-mono text-slate-400 hidden sm:inline">
            (±14 Days Slip Sensitivity Analysis)
          </span>
        </div>

        {/* Metric Selector Toggles */}
        <div className="flex items-center gap-1.5 bg-[#060913] p-0.5 rounded border border-slate-700 font-mono text-[9px]">
          {(['VIABILITY', 'ILLUMINATION', 'DTE', 'SOC'] as const).map((m) => (
            <button
              key={m}
              onClick={() => setMetricMode(m)}
              className={`px-2 py-0.5 rounded transition-all ${
                metricMode === m
                  ? 'bg-purple-600 text-white font-bold shadow'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              {m}
            </button>
          ))}
        </div>
      </div>

      {/* Slip Slider & Impact Summary Banner */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 bg-[#060913]/70 p-2.5 rounded-lg border border-slate-800 text-xs font-mono">
        {/* Slider */}
        <div className="md:col-span-2 flex flex-col justify-between gap-1">
          <div className="flex justify-between items-center text-[11px]">
            <span className="text-slate-400">LAUNCH SLIP OFFSET:</span>
            <span
              className={`font-bold px-2 py-0.5 rounded border ${
                currentSlipOffset === 0
                  ? 'bg-emerald-950/40 text-emerald-400 border-emerald-800/40'
                  : currentSlipOffset > 0
                  ? 'bg-amber-950/40 text-amber-300 border-amber-800/40'
                  : 'bg-cyan-950/40 text-cyan-300 border-cyan-800/40'
              }`}
            >
              {currentSlipOffset === 0 ? 'BASELINE LAUNCH (T+0d)' : `${currentSlipOffset > 0 ? '+' : ''}${currentSlipOffset} DAYS SLIP`}
            </span>
          </div>
          <input
            type="range"
            min="-14"
            max="14"
            step="1"
            value={currentSlipOffset}
            onChange={(e) => onSelectSlipOffset(parseInt(e.target.value, 10))}
            className="w-full accent-purple-400 h-1.5 bg-slate-800 rounded-lg cursor-pointer"
          />
          <div className="flex justify-between text-[9px] text-slate-500">
            <span>-14d (Early Window)</span>
            <span className="text-purple-300">Drag to observe shift in continuous lighting windows</span>
            <span>+14d (Delayed Launch)</span>
          </div>
        </div>

        {/* Quick Impact Stats */}
        <div className="bg-[#0f172a] p-2 rounded border border-slate-800 flex flex-col justify-between text-[10px]">
          <div className="flex justify-between">
            <span className="text-slate-400">Viable Mission Days:</span>
            <span className="font-bold text-emerald-400">
              {activeSlipMetrics.viableDays} / {activeSlipMetrics.totalDays} Days
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-400">Avg Illumination:</span>
            <span className="font-bold text-amber-300">{activeSlipMetrics.avgIllum}%</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-400">First Battery Freeze:</span>
            <span className={activeSlipMetrics.firstDepletionDay ? 'text-red-400 font-bold' : 'text-slate-400'}>
              {activeSlipMetrics.firstDepletionDay ? `Day ${activeSlipMetrics.firstDepletionDay}` : 'None (Safe)'}
            </span>
          </div>
        </div>
      </div>

      {/* 2D Heatmap Grid */}
      <div className="bg-[#030612] p-3 rounded-lg border border-slate-800 overflow-x-auto">
        <div className="min-w-[640px] flex flex-col gap-1 text-[9px] font-mono">
          {/* Column Header: Mission Days (1 to 30) */}
          <div className="flex items-center pl-24">
            {Array.from({ length: 30 }, (_, i) => i + 1).map((day) => (
              <div
                key={day}
                className="flex-1 text-center text-slate-500 font-bold"
                style={{ minWidth: '16px' }}
              >
                {day % 5 === 0 || day === 1 ? day : '·'}
              </div>
            ))}
          </div>

          {/* Rows: Each Launch Slip Offset */}
          {offsetRange.map((offset) => {
            const days = groupedByOffset.get(offset) || [];
            const isSelected = offset === currentSlipOffset;

            return (
              <div
                key={offset}
                className={`flex items-center rounded py-0.5 transition-colors ${
                  isSelected ? 'bg-purple-950/30 border border-purple-500/40' : 'hover:bg-slate-900/50'
                }`}
              >
                {/* Row Label */}
                <button
                  onClick={() => onSelectSlipOffset(offset)}
                  className={`w-24 text-left px-2 font-bold cursor-pointer transition-colors ${
                    isSelected ? 'text-purple-300' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  {offset === 0 ? 'T+0 (Base)' : `${offset > 0 ? '+' : ''}${offset} Days`}
                </button>

                {/* Day Cells */}
                <div className="flex-1 flex gap-0.5">
                  {days.map((d) => {
                    const color = getCellColor(d);
                    return (
                      <div
                        key={d.missionDay}
                        onMouseEnter={() => setHoveredCell(d)}
                        onClick={() => onSelectSlipOffset(offset)}
                        style={{ backgroundColor: color }}
                        className="flex-1 h-5 rounded-xs cursor-pointer hover:scale-110 hover:z-20 transition-transform shadow-xs"
                        title={`Slip ${offset}d • Day ${d.missionDay}: Viability ${d.viableScorePct}%, Illum ${d.illuminationPct}%, DTE ${d.dtePct}%`}
                      />
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>

        {/* Legend */}
        <div className="flex flex-wrap items-center justify-between gap-3 mt-3 pt-2 border-t border-slate-800 text-[10px] font-mono text-slate-400">
          <div className="flex items-center gap-2">
            <span className="text-slate-500">Legend:</span>
            <div className="flex items-center gap-1">
              <span className="w-3 h-3 rounded bg-[#10b981]"></span>
              <span>Nominal Go (&gt;80%)</span>
            </div>
            <div className="flex items-center gap-1">
              <span className="w-3 h-3 rounded bg-[#ca8a04]"></span>
              <span>Marginal / Grazing</span>
            </div>
            <div className="flex items-center gap-1">
              <span className="w-3 h-3 rounded bg-[#dc2626]"></span>
              <span>Blackout</span>
            </div>
            <div className="flex items-center gap-1">
              <span className="w-3 h-3 rounded bg-[#450a0a]"></span>
              <span>Battery Freeze</span>
            </div>
          </div>

          {hoveredCell && (
            <div className="text-slate-200 bg-[#0f172a] px-2 py-0.5 rounded border border-slate-700">
              Slip: <span className="text-purple-300">{hoveredCell.launchDateOffsetDays}d</span> | Day:{' '}
              <span className="text-amber-300">{hoveredCell.missionDay}</span> | Viability:{' '}
              <span className="text-emerald-400 font-bold">{hoveredCell.viableScorePct}%</span> | Min SoC:{' '}
              <span className="text-cyan-300">{hoveredCell.minSoCPct}%</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

