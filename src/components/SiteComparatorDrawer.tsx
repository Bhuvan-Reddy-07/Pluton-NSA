'use client';

import React, { useState, useMemo, useEffect } from 'react';
import {
  X,
  Sliders,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  TrendingUp,
  TrendingDown,
  Globe,
  Sun,
  Radio,
  BatteryCharging,
  Zap,
} from 'lucide-react';
import {
  LunarSite,
  HardwareProfile,
  MissionAnalysisSummary,
  TerrainHorizonProfile,
} from '@/types/pluton';
import { LUNAR_SOUTH_POLE_SITES } from '@/data/lunarDatabase';
import { computeTerrainHorizonProfile } from '@/engine/terrainHorizonEngine';
import { simulateMissionPhysics } from '@/engine/missionPhysicsEngine';

interface SiteComparatorDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  siteA: LunarSite;
  siteB: LunarSite;
  onSelectSiteA: (site: LunarSite) => void;
  onSelectSiteB: (site: LunarSite) => void;
  hardware: HardwareProfile;
  startDate: Date;
  onApplySiteAsActive: (site: LunarSite) => void;
}

export const SiteComparatorDrawer: React.FC<SiteComparatorDrawerProps> = ({
  isOpen,
  onClose,
  siteA,
  siteB,
  onSelectSiteA,
  onSelectSiteB,
  hardware,
  startDate,
  onApplySiteAsActive,
}) => {
  // Compute horizon profiles for both sites
  const horizonA = useMemo(() => {
    return computeTerrainHorizonProfile(siteA.id, siteA.latitude, siteA.longitude, siteA.elevation, hardware.mastHeight);
  }, [siteA, hardware.mastHeight]);

  const horizonB = useMemo(() => {
    return computeTerrainHorizonProfile(siteB.id, siteB.latitude, siteB.longitude, siteB.elevation, hardware.mastHeight);
  }, [siteB, hardware.mastHeight]);

  // Simulate mission for both sites
  const simA = useMemo(() => {
    return simulateMissionPhysics(siteA, hardware, horizonA, startDate, 30);
  }, [siteA, hardware, horizonA, startDate]);

  const simB = useMemo(() => {
    return simulateMissionPhysics(siteB, hardware, horizonB, startDate, 30);
  }, [siteB, hardware, horizonB, startDate]);

  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const sumA = simA.summary;
  const sumB = simB.summary;

  const deltaSunHours = sumA.sunlitHours - sumB.sunlitHours;
  const deltaDteHours = sumA.dteNominalHours - sumB.dteNominalHours;
  const deltaJointHours = sumA.jointGoHours - sumB.jointGoHours;
  const deltaMinSoC = sumA.minBatterySoCPct - sumB.minBatterySoCPct;

  // Comparison Verdict
  let verdictTitle = '';
  let verdictDesc = '';
  let winningSite: 'A' | 'B' | 'TIE' = 'A';

  if (sumA.jointGoPct > sumB.jointGoPct + 5) {
    winningSite = 'A';
    verdictTitle = `${siteA.name} is the Superior Candidate`;
    verdictDesc = `Site A provides ${Math.abs(deltaSunHours)} more hours of direct solar illumination and ${Math.abs(deltaDteHours)} more hours of high-rate DTE link. Site B experiences severe terrain occultation from nearby ridges.`;
  } else if (sumB.jointGoPct > sumA.jointGoPct + 5) {
    winningSite = 'B';
    verdictTitle = `${siteB.name} is the Superior Candidate`;
    verdictDesc = `Site B delivers ${Math.abs(deltaSunHours)} more sunlit hours and significantly higher minimum battery state-of-charge (${sumB.minBatterySoCPct}% vs ${sumA.minBatterySoCPct}%).`;
  } else {
    winningSite = 'TIE';
    verdictTitle = 'Equally Viable Landing Sites';
    verdictDesc = `Both sites exhibit comparable illumination and comm metrics within a ±3% margin. Selection should be decided by terrain slope roughness and science targets.`;
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-2 sm:p-4 select-none"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="bg-[#0b1021] border border-amber-500/40 rounded-xl max-w-5xl w-full max-h-[90vh] flex flex-col shadow-2xl overflow-hidden font-mono text-slate-200">
        {/* Header */}
        <div className="flex-shrink-0 flex items-center justify-between px-5 py-3.5 border-b border-slate-800 bg-[#060913]">
          <div className="flex items-center gap-2">
            <Sliders className="w-5 h-5 text-amber-400" />
            <div>
              <h2 className="text-sm font-bold text-slate-100 tracking-wider">
                SITE A vs SITE B TRADE-OFF COMPARATOR
              </h2>
              <p className="text-[10px] text-slate-400">
                Rigorous Quantitative Trade Study • 30-Day Polar Ephemeris & Shadow Simulation
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors cursor-pointer"
            title="Close (Esc)"
            aria-label="Close Comparator"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          {/* Site Selectors */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Site A Box */}
            <div className="bg-[#0f172a] p-3 rounded-lg border border-amber-500/40 flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-amber-400 flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-amber-400"></span>
                  SITE A (PRIMARY)
                </span>
                <button
                  onClick={() => onApplySiteAsActive(siteA)}
                  className="text-[10px] px-2 py-0.5 rounded bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold transition-colors"
                >
                  SET ACTIVE
                </button>
              </div>
              <select
                aria-label="Select Landing Candidate Site A"
                value={siteA.id}
                onChange={(e) => {
                  const s = LUNAR_SOUTH_POLE_SITES.find((item) => item.id === e.target.value);
                  if (s) onSelectSiteA(s);
                }}
                className="bg-[#060913] text-xs font-mono font-bold text-amber-300 p-2 rounded border border-slate-700 focus:outline-none"
              >
                {LUNAR_SOUTH_POLE_SITES.map((s) => (
                  <option key={s.id} value={s.id} className="bg-[#0f172a] text-slate-200">
                    {s.name} ({s.latitude.toFixed(1)}°S, {s.elevation}m)
                  </option>
                ))}
              </select>
              <div className="text-[10px] text-slate-400 line-clamp-2">{siteA.description}</div>
            </div>

            {/* Site B Box */}
            <div className="bg-[#0f172a] p-3 rounded-lg border border-cyan-500/40 flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-cyan-400 flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-cyan-400"></span>
                  SITE B (ALTERNATE / BACKUP)
                </span>
                <button
                  onClick={() => onApplySiteAsActive(siteB)}
                  className="text-[10px] px-2 py-0.5 rounded bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold transition-colors"
                >
                  SET ACTIVE
                </button>
              </div>
              <select
                aria-label="Select Landing Candidate Site B"
                value={siteB.id}
                onChange={(e) => {
                  const s = LUNAR_SOUTH_POLE_SITES.find((item) => item.id === e.target.value);
                  if (s) onSelectSiteB(s);
                }}
                className="bg-[#060913] text-xs font-mono font-bold text-cyan-300 p-2 rounded border border-slate-700 focus:outline-none"
              >
                {LUNAR_SOUTH_POLE_SITES.map((s) => (
                  <option key={s.id} value={s.id} className="bg-[#0f172a] text-slate-200">
                    {s.name} ({s.latitude.toFixed(1)}°S, {s.elevation}m)
                  </option>
                ))}
              </select>
              <div className="text-[10px] text-slate-400 line-clamp-2">{siteB.description}</div>
            </div>
          </div>

          {/* Overlaid 360° Horizon Profile Comparison */}
          <div className="bg-[#060913] p-3.5 rounded-lg border border-slate-800 flex flex-col gap-2">
            <div className="flex items-center justify-between text-xs font-bold">
              <span className="text-slate-300">DUAL 360° TERRAIN HORIZON OVERLAY</span>
              <div className="flex items-center gap-3 text-[10px]">
                <span className="flex items-center gap-1 text-amber-400">
                  <span className="w-3 h-0.5 bg-amber-400"></span> Site A Horizon
                </span>
                <span className="flex items-center gap-1 text-cyan-400">
                  <span className="w-3 h-0.5 bg-cyan-400"></span> Site B Horizon
                </span>
              </div>
            </div>

            <div className="w-full h-32 bg-[#02040b] rounded border border-slate-800/80 overflow-hidden relative">
              <svg viewBox="0 0 720 120" className="w-full h-full" preserveAspectRatio="none">
                {/* 0° Horizon line */}
                <line x1="0" y1="90" x2="720" y2="90" stroke="#334155" strokeWidth="0.8" strokeDasharray="3 3" />
                <text x="710" y="86" textAnchor="end" fill="#64748b" fontSize="7" fontFamily="monospace">
                  0° HORIZON
                </text>

                {/* Site A Horizon Path */}
                {(() => {
                  let d = 'M 0 120';
                  for (let az = 0; az < 360; az++) {
                    const x = (az / 360.0) * 720;
                    const el = horizonA.horizonElevationWithMastDeg[az];
                    const y = 90 - (el / 20.0) * 80;
                    d += ` L ${x.toFixed(1)} ${y.toFixed(1)}`;
                  }
                  d += ' L 720 120 Z';
                  return <path d={d} fill="#f59e0b" fillOpacity="0.15" stroke="#f59e0b" strokeWidth="1.5" />;
                })()}

                {/* Site B Horizon Path */}
                {(() => {
                  let d = 'M 0 120';
                  for (let az = 0; az < 360; az++) {
                    const x = (az / 360.0) * 720;
                    const el = horizonB.horizonElevationWithMastDeg[az];
                    const y = 90 - (el / 20.0) * 80;
                    d += ` L ${x.toFixed(1)} ${y.toFixed(1)}`;
                  }
                  d += ' L 720 120 Z';
                  return <path d={d} fill="#06b6d4" fillOpacity="0.15" stroke="#06b6d4" strokeWidth="1.5" />;
                })()}
              </svg>
            </div>
            <div className="flex justify-between text-[9px] text-slate-500 font-mono">
              <span>0° (North)</span>
              <span>90° (East)</span>
              <span>180° (South)</span>
              <span>270° (West)</span>
              <span>360° (North)</span>
            </div>
          </div>

          {/* Side-by-Side Metric Comparison Table */}
          <div className="bg-[#060913] rounded-lg border border-slate-800 overflow-hidden text-xs">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-[#0f172a] text-slate-400 text-[10px] border-b border-slate-800">
                  <th className="p-2.5">MISSION PARAMETER</th>
                  <th className="p-2.5 text-amber-300">SITE A ({siteA.name.split(' ')[0]})</th>
                  <th className="p-2.5 text-cyan-300">SITE B ({siteB.name.split(' ')[0]})</th>
                  <th className="p-2.5 text-right">TRADE DELTA (A - B)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-mono text-[11px]">
                <tr>
                  <td className="p-2.5 text-slate-400 flex items-center gap-1.5">
                    <Sun className="w-3.5 h-3.5 text-amber-400" />
                    <span>Total Sunlit Time</span>
                  </td>
                  <td className="p-2.5 font-bold text-amber-300">{sumA.sunlitHours}h ({sumA.sunlitPct}%)</td>
                  <td className="p-2.5 font-bold text-cyan-300">{sumB.sunlitHours}h ({sumB.sunlitPct}%)</td>
                  <td className={`p-2.5 text-right font-bold ${deltaSunHours >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                    {deltaSunHours >= 0 ? `+${deltaSunHours}h` : `${deltaSunHours}h`}
                  </td>
                </tr>
                <tr>
                  <td className="p-2.5 text-slate-400 flex items-center gap-1.5">
                    <AlertTriangle className="w-3.5 h-3.5 text-red-400" />
                    <span>Max Continuous Eclipse</span>
                  </td>
                  <td className="p-2.5">{sumA.maxContinuousEclipseHours}h</td>
                  <td className="p-2.5">{sumB.maxContinuousEclipseHours}h</td>
                  <td className={`p-2.5 text-right font-bold ${sumA.maxContinuousEclipseHours <= sumB.maxContinuousEclipseHours ? 'text-emerald-400' : 'text-red-400'}`}>
                    {sumA.maxContinuousEclipseHours - sumB.maxContinuousEclipseHours}h
                  </td>
                </tr>
                <tr>
                  <td className="p-2.5 text-slate-400 flex items-center gap-1.5">
                    <Radio className="w-3.5 h-3.5 text-cyan-400" />
                    <span>Earth DTE Line-of-Sight</span>
                  </td>
                  <td className="p-2.5 font-bold text-amber-300">{sumA.dteNominalHours}h ({sumA.dteNominalPct}%)</td>
                  <td className="p-2.5 font-bold text-cyan-300">{sumB.dteNominalHours}h ({sumB.dteNominalPct}%)</td>
                  <td className={`p-2.5 text-right font-bold ${deltaDteHours >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                    {deltaDteHours >= 0 ? `+${deltaDteHours}h` : `${deltaDteHours}h`}
                  </td>
                </tr>
                <tr>
                  <td className="p-2.5 text-slate-400 flex items-center gap-1.5">
                    <BatteryCharging className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Minimum Battery SoC</span>
                  </td>
                  <td className="p-2.5 font-bold">{sumA.minBatterySoCPct}% ({sumA.minBatterySoCWh} Wh)</td>
                  <td className="p-2.5 font-bold">{sumB.minBatterySoCPct}% ({sumB.minBatterySoCWh} Wh)</td>
                  <td className={`p-2.5 text-right font-bold ${deltaMinSoC >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                    {deltaMinSoC >= 0 ? `+${deltaMinSoC.toFixed(1)}%` : `${deltaMinSoC.toFixed(1)}%`}
                  </td>
                </tr>
                <tr>
                  <td className="p-2.5 text-slate-400 flex items-center gap-1.5">
                    <Zap className="w-3.5 h-3.5 text-purple-400" />
                    <span>Joint Mission Go Window</span>
                  </td>
                  <td className="p-2.5 font-bold text-emerald-400">{sumA.jointGoHours}h ({sumA.jointGoPct}%)</td>
                  <td className="p-2.5 font-bold text-emerald-400">{sumB.jointGoHours}h ({sumB.jointGoPct}%)</td>
                  <td className={`p-2.5 text-right font-bold ${deltaJointHours >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                    {deltaJointHours >= 0 ? `+${deltaJointHours}h` : `${deltaJointHours}h`}
                  </td>
                </tr>
                <tr>
                  <td className="p-2.5 text-slate-400 flex items-center gap-1.5">
                    <Globe className="w-3.5 h-3.5 text-blue-400" />
                    <span>3σ Landing Safety Score</span>
                  </td>
                  <td className="p-2.5 font-bold">{sumA.landingDispersionScorePct}%</td>
                  <td className="p-2.5 font-bold">{sumB.landingDispersionScorePct}%</td>
                  <td className="p-2.5 text-right font-bold text-slate-300">
                    {sumA.landingDispersionScorePct - sumB.landingDispersionScorePct}%
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Mission Planner Executive Verdict */}
          <div className="bg-gradient-to-r from-amber-500/10 via-purple-500/10 to-cyan-500/10 p-3.5 rounded-lg border border-amber-500/40 text-xs">
            <div className="flex items-center gap-2 font-bold text-amber-300 mb-1 text-sm">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span>EXECUTIVE TRADE-OFF VERDICT: {verdictTitle}</span>
            </div>
            <p className="text-slate-300 text-[11px] leading-relaxed">
              {verdictDesc}
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-slate-800 bg-[#060913] flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded bg-slate-800 hover:bg-slate-700 text-xs font-bold text-slate-200 transition-colors"
          >
            DISMISS COMPARATOR
          </button>
        </div>
      </div>
    </div>
  );
};

