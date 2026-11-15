'use client';

import React, { useRef, useState, useEffect, useMemo } from 'react';
import {
  Sun,
  Globe,
  Radio,
  Zap,
  BatteryCharging,
  AlertTriangle,
  Play,
  Pause,
  RotateCcw,
  Clock,
  CheckCircle,
  XCircle,
  Thermometer,
  ShieldAlert,
  ArrowRight,
} from 'lucide-react';
import {
  PhysicsTimeStep,
  MissionAnalysisSummary,
  HardwareProfile,
  LunarSite,
} from '@/types/pluton';

interface MissionTimelineGanttProps {
  summary: MissionAnalysisSummary;
  steps: PhysicsTimeStep[];
  currentStepIndex: number;
  onSelectStepIndex: (index: number) => void;
  hardware: HardwareProfile;
  site: LunarSite;
  durationDays: number;
  onDurationChange: (days: number) => void;
}

export const MissionTimelineGantt: React.FC<MissionTimelineGanttProps> = ({
  summary,
  steps,
  currentStepIndex,
  onSelectStepIndex,
  hardware,
  site,
  durationDays,
  onDurationChange,
}) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [playSpeed, setPlaySpeed] = useState<number>(5); // steps per second
  const timelineRef = useRef<HTMLDivElement>(null);
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  // Playback timer loop
  useEffect(() => {
    if (!isPlaying) return;
    const interval = setInterval(() => {
      onSelectStepIndex((currentStepIndex + 1) % Math.max(1, steps.length));
    }, 1000 / playSpeed);
    return () => clearInterval(interval);
  }, [isPlaying, playSpeed, currentStepIndex, steps.length, onSelectStepIndex]);

  const activeStep = steps[currentStepIndex] || steps[0] || null;

  // Handle click or drag on timeline
  const handleTimelineInteraction = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!timelineRef.current || steps.length === 0) return;
    const rect = timelineRef.current.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const fraction = Math.max(0, Math.min(1, clickX / rect.width));
    const targetIndex = Math.min(steps.length - 1, Math.floor(fraction * steps.length));
    onSelectStepIndex(targetIndex);
  };

  // Battery warning check
  const isBatteryExceeded = summary.maxContinuousEclipseHours > summary.batterySurvivalLimitHours;

  return (
    <div className="w-full bg-[#0a0f1d] rounded-xl border border-pluton-border p-3.5 flex flex-col gap-3 shadow-xl select-none">
      {/* 4 Prominent Operational Countdown & Viability Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
        {/* Card 1: Solar Sunset / Sunrise Countdown */}
        <div className="bg-[#060913] p-3 rounded-lg border border-amber-500/30 flex flex-col justify-between shadow-sm">
          <div className="flex items-center justify-between text-[11px] font-mono text-slate-400">
            <span className="flex items-center gap-1.5 text-amber-300">
              <Sun className="w-3.5 h-3.5 text-amber-400" />
              <span>SOLAR TRANSITION</span>
            </span>
            <span className="text-[10px] text-amber-400/80">
              {summary.sunlitPct}% SUNLIT
            </span>
          </div>
          <div className="my-1.5">
            <div className="text-xl font-mono font-bold text-amber-400 flex items-baseline gap-1">
              <span>{summary.timeToNextSunsetHours.toFixed(1)}h</span>
              <span className="text-xs font-normal text-slate-400">to sunset</span>
            </div>
            <div className="text-[10px] font-mono text-slate-400 truncate">
              Sunrise in: {summary.timeToNextSunriseHours.toFixed(1)}h
            </div>
          </div>
          <div className="text-[9px] font-mono text-slate-500 flex justify-between border-t border-slate-800 pt-1">
            <span>Penumbral: {summary.penumbralHours}h</span>
            <span>Total Sun: {summary.sunlitHours}h</span>
          </div>
        </div>

        {/* Card 2: Earth DTE & Active DSN Link */}
        <div className="bg-[#060913] p-3 rounded-lg border border-cyan-500/30 flex flex-col justify-between shadow-sm">
          <div className="flex items-center justify-between text-[11px] font-mono text-slate-400">
            <span className="flex items-center gap-1.5 text-cyan-300">
              <Globe className="w-3.5 h-3.5 text-cyan-400" />
              <span>EARTH DTE WINDOW</span>
            </span>
            <span className="text-[10px] text-cyan-400/80">
              {summary.dteNominalPct}% NOMINAL
            </span>
          </div>
          <div className="my-1.5">
            <div className="text-xl font-mono font-bold text-cyan-400 flex items-baseline gap-1">
              <span>{summary.timeToNextEarthsetHours.toFixed(1)}h</span>
              <span className="text-xs font-normal text-slate-400">to occultation</span>
            </div>
            <div className="text-[10px] font-mono text-slate-400 truncate">
              Active: <span className="text-cyan-300 font-bold">{summary.currentDsnStation} DSN</span>
            </div>
          </div>
          <div className="text-[9px] font-mono text-slate-500 flex justify-between border-t border-slate-800 pt-1">
            <span>Multipath: {summary.dteMultipathHours}h</span>
            <span>Gateway: {summary.gatewayRelayHours}h</span>
          </div>
        </div>

        {/* Card 3: Max Eclipse & Battery Survival Limit */}
        <div
          className={`bg-[#060913] p-3 rounded-lg border flex flex-col justify-between shadow-sm ${
            isBatteryExceeded || summary.isBatteryDepleted
              ? 'border-red-500/60 bg-red-950/10'
              : 'border-emerald-500/30'
          }`}
        >
          <div className="flex items-center justify-between text-[11px] font-mono text-slate-400">
            <span className="flex items-center gap-1.5 text-slate-200">
              <BatteryCharging
                className={`w-3.5 h-3.5 ${
                  isBatteryExceeded ? 'text-red-400' : 'text-emerald-400'
                }`}
              />
              <span>MAX ECLIPSE vs SoC</span>
            </span>
            {isBatteryExceeded ? (
              <span className="text-[10px] text-red-400 font-bold flex items-center gap-0.5">
                <AlertTriangle className="w-3 h-3" /> CRITICAL
              </span>
            ) : (
              <span className="text-[10px] text-emerald-400 font-bold">SURVIVABLE</span>
            )}
          </div>
          <div className="my-1.5">
            <div className="text-xl font-mono font-bold flex items-baseline gap-1">
              <span className={isBatteryExceeded ? 'text-red-400' : 'text-slate-100'}>
                {summary.maxContinuousEclipseHours}h
              </span>
              <span className="text-xs font-normal text-slate-400">
                / {summary.batterySurvivalLimitHours}h max
              </span>
            </div>
            <div className="text-[10px] font-mono text-slate-400 truncate">
              Min SoC: <span className={summary.minBatterySoCPct < 20 ? 'text-red-400 font-bold' : 'text-emerald-400'}>{summary.minBatterySoCPct}%</span> ({summary.minBatterySoCWh} Wh)
            </div>
          </div>
          <div className="text-[9px] font-mono text-slate-500 flex justify-between border-t border-slate-800 pt-1">
            <span>Heater: {hardware.eclipseHeaterW}W</span>
            <span>Capacity: {hardware.batteryCapacityWh}Wh</span>
          </div>
        </div>

        {/* Card 4: Vertical Mast vs Horizontal Deck Advantage */}
        <div className="bg-[#060913] p-3 rounded-lg border border-purple-500/30 flex flex-col justify-between shadow-sm">
          <div className="flex items-center justify-between text-[11px] font-mono text-slate-400">
            <span className="flex items-center gap-1.5 text-purple-300">
              <Zap className="w-3.5 h-3.5 text-purple-400" />
              <span>POLAR ARRAY GAIN</span>
            </span>
            <span className="text-[10px] text-purple-400/80">
              {summary.jointGoPct}% JOINT GO
            </span>
          </div>
          <div className="my-1.5">
            <div className="text-xl font-mono font-bold text-purple-300 flex items-baseline gap-1">
              <span>+{summary.verticalArrayAdvantageWm2}</span>
              <span className="text-xs font-normal text-slate-400">W/m² gain</span>
            </div>
            <div className="text-[10px] font-mono text-slate-400 truncate">
              Eliminates grazing cos(El) cosine penalty
            </div>
          </div>
          <div className="text-[9px] font-mono text-slate-500 flex justify-between border-t border-slate-800 pt-1">
            <span>Array: {summary.arrayType.toUpperCase()}</span>
            <span>Joint Go: {summary.jointGoHours}h</span>
          </div>
        </div>
      </div>

      {/* Playback Controls & Timeline Scrubber Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-[#060913] px-3 py-2 rounded-lg border border-slate-800">
        <div className="flex items-center gap-2">
          {/* Play/Pause Button */}
          <button
            onClick={() => setIsPlaying(!isPlaying)}
            className="flex items-center gap-1.5 px-3 py-1 rounded bg-amber-500 hover:bg-amber-400 text-slate-950 font-mono font-bold text-xs transition-colors shadow"
          >
            {isPlaying ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5 fill-current" />}
            <span>{isPlaying ? 'PAUSE' : 'PLAY'}</span>
          </button>

          {/* Reset Button */}
          <button
            onClick={() => {
              setIsPlaying(false);
              onSelectStepIndex(0);
            }}
            className="p-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
            title="Reset to Mission Start (T=0)"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>

          {/* Playback Speed Toggles */}
          <div className="flex items-center bg-slate-900 rounded border border-slate-800 text-[10px] font-mono p-0.5">
            {[1, 5, 20].map((s) => (
              <button
                key={s}
                onClick={() => setPlaySpeed(s)}
                className={`px-1.5 py-0.5 rounded ${
                  playSpeed === s ? 'bg-slate-700 text-amber-300 font-bold' : 'text-slate-400 hover:text-white'
                }`}
              >
                {s}x
              </button>
            ))}
          </div>
        </div>

        {/* Current Mission Time & Scrubber Readout */}
        <div className="flex items-center gap-4 text-xs font-mono">
          <div className="flex items-center gap-1.5 text-slate-300">
            <Clock className="w-3.5 h-3.5 text-amber-400" />
            <span className="text-slate-400">MISSION DAY:</span>
            <span className="font-bold text-amber-300">
              Day {Math.floor(currentStepIndex / 24) + 1} ({currentStepIndex}h / {steps.length}h)
            </span>
          </div>
          <div className="text-[11px] text-slate-400 hidden md:block">
            UTC: <span className="text-slate-200 font-mono">{activeStep?.utcIso.substring(0, 16).replace('T', ' ')}Z</span>
          </div>
        </div>

        {/* Duration Selector */}
        <div className="flex items-center gap-1.5 font-mono text-[11px]">
          <span className="text-slate-400">WINDOW:</span>
          {[30, 90].map((d) => (
            <button
              key={d}
              onClick={() => onDurationChange(d)}
              className={`px-2 py-0.5 rounded border text-[10px] ${
                durationDays === d
                  ? 'bg-amber-500/20 text-amber-300 border-amber-500/50 font-bold'
                  : 'bg-slate-800 text-slate-400 border-slate-700 hover:text-white'
              }`}
            >
              {d} DAYS
            </button>
          ))}
        </div>
      </div>

      {/* Multi-Track Synchronized Gantt Canvas */}
      <div
        ref={timelineRef}
        onClick={handleTimelineInteraction}
        onMouseMove={(e) => {
          if (!timelineRef.current || steps.length === 0) return;
          const rect = timelineRef.current.getBoundingClientRect();
          const clickX = e.clientX - rect.left;
          const fraction = Math.max(0, Math.min(1, clickX / rect.width));
          setHoveredIndex(Math.floor(fraction * steps.length));
        }}
        onMouseLeave={() => setHoveredIndex(null)}
        className="relative w-full bg-[#050814] rounded-lg border border-slate-800 p-2 flex flex-col gap-1.5 cursor-crosshair overflow-hidden"
      >
        {/* Scrubber Cursor Line */}
        {(() => {
          const pct = (currentStepIndex / Math.max(1, steps.length)) * 100;
          return (
            <div
              className="absolute top-0 bottom-0 z-30 pointer-events-none transition-all duration-75"
              style={{ left: `${pct}%` }}
            >
              <div className="w-0.5 h-full bg-amber-400 shadow-[0_0_8px_#f59e0b]" />
              <div className="absolute -top-1 -translate-x-1/2 bg-amber-400 text-slate-950 font-mono font-bold text-[9px] px-1 rounded shadow">
                T+{currentStepIndex}h
              </div>
            </div>
          );
        })()}

        {/* Hover Guide Line */}
        {hoveredIndex !== null && hoveredIndex !== currentStepIndex && (
          <div
            className="absolute top-0 bottom-0 z-20 pointer-events-none border-l border-dashed border-cyan-400/50"
            style={{ left: `${(hoveredIndex / steps.length) * 100}%` }}
          />
        )}

        {/* Track 1: Solar Illumination */}
        <div className="flex items-center gap-2">
          <div className="w-24 text-[10px] font-mono text-slate-400 shrink-0 flex items-center gap-1">
            <Sun className="w-3 h-3 text-amber-400" />
            <span>SOLAR FLUX</span>
          </div>
          <div className="flex-1 h-5 bg-[#0a0f1d] rounded overflow-hidden flex relative">
            {steps.map((st, i) => {
              let bg = '#1e293b'; // shadow
              if (st.penumbraFraction >= 0.95) bg = '#f59e0b';
              else if (st.penumbraFraction > 0.05) bg = '#b45309';
              else bg = '#450a0a';
              return (
                <div
                  key={i}
                  style={{ width: `${100 / steps.length}%`, backgroundColor: bg }}
                  className="h-full shrink-0"
                />
              );
            })}
          </div>
        </div>

        {/* Track 2: Direct-to-Earth (DTE) Comm */}
        <div className="flex items-center gap-2">
          <div className="w-24 text-[10px] font-mono text-slate-400 shrink-0 flex items-center gap-1">
            <Globe className="w-3 h-3 text-cyan-400" />
            <span>EARTH DTE</span>
          </div>
          <div className="flex-1 h-5 bg-[#0a0f1d] rounded overflow-hidden flex relative">
            {steps.map((st, i) => {
              let bg = '#1e293b';
              if (st.dteCommState === 'NOMINAL_DTE') bg = '#06b6d4';
              else if (st.dteCommState === 'MULTIPATH_GRAZING') bg = '#eab308';
              else bg = '#7f1d1d';
              return (
                <div
                  key={i}
                  style={{ width: `${100 / steps.length}%`, backgroundColor: bg }}
                  className="h-full shrink-0"
                />
              );
            })}
          </div>
        </div>

        {/* Track 3: Lunar Gateway NRHO Relay */}
        <div className="flex items-center gap-2">
          <div className="w-24 text-[10px] font-mono text-slate-400 shrink-0 flex items-center gap-1">
            <Radio className="w-3 h-3 text-purple-400" />
            <span>GATEWAY RELAY</span>
          </div>
          <div className="flex-1 h-5 bg-[#0a0f1d] rounded overflow-hidden flex relative">
            {steps.map((st, i) => (
              <div
                key={i}
                style={{
                  width: `${100 / steps.length}%`,
                  backgroundColor: st.gatewayInRelay ? '#a855f7' : '#1e1b4b',
                }}
                className="h-full shrink-0"
              />
            ))}
          </div>
        </div>

        {/* Track 4: Joint Mission Viability (GO / NO-GO) */}
        <div className="flex items-center gap-2">
          <div className="w-24 text-[10px] font-mono text-slate-400 shrink-0 flex items-center gap-1">
            <CheckCircle className="w-3 h-3 text-emerald-400" />
            <span>JOINT GO</span>
          </div>
          <div className="flex-1 h-5 bg-[#0a0f1d] rounded overflow-hidden flex relative">
            {steps.map((st, i) => (
              <div
                key={i}
                style={{
                  width: `${100 / steps.length}%`,
                  backgroundColor: st.jointViable ? '#10b981' : '#dc2626',
                }}
                className="h-full shrink-0"
              />
            ))}
          </div>
        </div>

        {/* Track 5: Battery SoC Curve & Surface Temp Sparkline */}
        <div className="flex items-center gap-2 mt-1 pt-1 border-t border-slate-800">
          <div className="w-24 text-[10px] font-mono text-slate-400 shrink-0 flex flex-col justify-center">
            <span className="flex items-center gap-1 text-emerald-400">
              <BatteryCharging className="w-3 h-3" />
              <span>BATTERY SoC</span>
            </span>
            <span className="text-[9px] text-slate-500">0 - 100% Wh</span>
          </div>
          <div className="flex-1 h-12 bg-[#060913] rounded overflow-hidden relative">
            <svg viewBox={`0 0 ${steps.length} 48`} className="w-full h-full" preserveAspectRatio="none">
              {/* Critical 20% SoC danger line */}
              <line x1="0" y1={48 - 0.2 * 48} x2={steps.length} y2={48 - 0.2 * 48} stroke="#ef4444" strokeWidth="0.8" strokeDasharray="2 2" />

              {/* Area fill under Battery SoC */}
              {(() => {
                let d = `M 0 48`;
                for (let i = 0; i < steps.length; i++) {
                  const y = 48 - (steps[i].batterySoCPct / 100.0) * 44;
                  d += ` L ${i} ${y.toFixed(1)}`;
                }
                d += ` L ${steps.length - 1} 48 Z`;
                return <path d={d} fill="#10b981" fillOpacity="0.25" />;
              })()}

              {/* Battery SoC Stroke Line */}
              {(() => {
                let d = '';
                for (let i = 0; i < steps.length; i++) {
                  const y = 48 - (steps[i].batterySoCPct / 100.0) * 44;
                  if (i === 0) d = `M 0 ${y.toFixed(1)}`;
                  else d += ` L ${i} ${y.toFixed(1)}`;
                }
                return <path d={d} fill="none" stroke="#34d399" strokeWidth="1.5" />;
              })()}
            </svg>
          </div>
        </div>

        {/* Timeline Day Markers along bottom */}
        <div className="flex justify-between pl-24 pr-1 text-[9px] font-mono text-slate-500 pt-0.5">
          <span>Day 1</span>
          <span>Day {Math.round(durationDays * 0.25)}</span>
          <span>Day {Math.round(durationDays * 0.5)}</span>
          <span>Day {Math.round(durationDays * 0.75)}</span>
          <span>Day {durationDays}</span>
        </div>
      </div>

      {/* Scrubbed Step Live Telemetry Inspector */}
      {activeStep && (
        <div className="bg-[#060913] p-2.5 rounded-lg border border-slate-800 text-xs font-mono grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-2">
          <div>
            <span className="text-slate-500 block text-[9px]">SOLAR ELEVATION:</span>
            <span className="text-amber-300 font-bold">{activeStep.sunElDeg.toFixed(2)}°</span>
            <span className="text-slate-500 text-[9px] block">Horizon: {activeStep.horizonElAtSunDeg.toFixed(1)}°</span>
          </div>
          <div>
            <span className="text-slate-500 block text-[9px]">POWER GENERATED:</span>
            <span className="text-amber-400 font-bold">{Math.round(activeStep.generatedPowerW)} W</span>
            <span className="text-slate-500 text-[9px] block">Disk: {(activeStep.penumbraFraction * 100).toFixed(0)}%</span>
          </div>
          <div>
            <span className="text-slate-500 block text-[9px]">EARTH ELEVATION:</span>
            <span className="text-cyan-300 font-bold">{activeStep.earthElDeg.toFixed(2)}°</span>
            <span className="text-slate-500 text-[9px] block">Horizon: {activeStep.horizonElAtEarthDeg.toFixed(1)}°</span>
          </div>
          <div>
            <span className="text-slate-500 block text-[9px]">COMM STATUS:</span>
            <span
              className={`font-bold ${
                activeStep.dteCommState === 'NOMINAL_DTE'
                  ? 'text-cyan-400'
                  : activeStep.dteCommState === 'MULTIPATH_GRAZING'
                  ? 'text-yellow-400'
                  : 'text-red-400'
              }`}
            >
              {activeStep.dteCommState}
            </span>
            <span className="text-slate-500 text-[9px] block">
              Gateway: {activeStep.gatewayInRelay ? 'LOCKED' : 'OFFLINE'}
            </span>
          </div>
          <div>
            <span className="text-slate-500 block text-[9px]">BATTERY SoC:</span>
            <span
              className={`font-bold ${
                activeStep.batterySoCPct < 20 ? 'text-red-400 animate-pulse' : 'text-emerald-400'
              }`}
            >
              {activeStep.batterySoCPct.toFixed(1)}%
            </span>
            <span className="text-slate-500 text-[9px] block">{Math.round(activeStep.batterySoCWh)} Wh</span>
          </div>
          <div>
            <span className="text-slate-500 block text-[9px]">SURFACE TEMP:</span>
            <span className="text-slate-200 font-bold">{Math.round(activeStep.surfaceTempK)} K</span>
            <span className="text-slate-500 text-[9px] block">
              Heater: {activeStep.heaterActive ? `${activeStep.heaterLoadW}W` : 'OFF'}
            </span>
          </div>
        </div>
      )}
    </div>
  );
};

