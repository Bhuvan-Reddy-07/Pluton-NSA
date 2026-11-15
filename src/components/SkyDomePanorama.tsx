'use client';

import React, { useState, useMemo } from 'react';
import {
  Sun,
  Globe,
  Compass,
  Sliders,
  Radio,
  Layers,
  ChevronRight,
  ShieldAlert,
  Zap,
} from 'lucide-react';
import {
  LunarSite,
  HardwareProfile,
  EphemerisState,
  TerrainHorizonProfile,
  SolarArrayType,
  PhysicsTimeStep,
} from '@/types/pluton';
import { computePenumbralSolarFraction, evaluateDTEState } from '@/engine/missionPhysicsEngine';

interface SkyDomePanoramaProps {
  site: LunarSite;
  hardware: HardwareProfile;
  horizonProfile: TerrainHorizonProfile;
  currentEphemeris: EphemerisState;
  mastHeightM: number;
  onMastHeightChange: (h: number) => void;
  arrayType: SolarArrayType;
  onArrayTypeChange: (type: SolarArrayType) => void;
  timelineSteps: PhysicsTimeStep[];
  currentStepIndex: number;
}

export const SkyDomePanorama: React.FC<SkyDomePanoramaProps> = ({
  site,
  hardware,
  horizonProfile,
  currentEphemeris,
  mastHeightM,
  onMastHeightChange,
  arrayType,
  onArrayTypeChange,
  timelineSteps,
  currentStepIndex,
}) => {
  const [viewMode, setViewMode] = useState<'PANORAMA' | 'POLAR_RADAR'>('PANORAMA');

  // Horizon profile with mast height applied
  const horizonMask = horizonProfile.horizonElevationWithMastDeg;

  // Active step or current ephemeris
  const activeStep = timelineSteps[currentStepIndex] || null;

  const sunAz = activeStep ? activeStep.sunAzDeg : currentEphemeris.sun.azimuthDeg;
  const sunEl = activeStep ? activeStep.sunElDeg : currentEphemeris.sun.elevationTopocentricDeg;
  const earthAz = activeStep ? activeStep.earthAzDeg : currentEphemeris.earth.azimuthDeg;
  const earthEl = activeStep ? activeStep.earthElDeg : currentEphemeris.earth.elevationTopocentricDeg;

  // Horizon at Sun and Earth directions
  const sunAzIndex = Math.floor(((sunAz % 360) + 360) % 360);
  const earthAzIndex = Math.floor(((earthAz % 360) + 360) % 360);
  const horizonAtSun = horizonMask[sunAzIndex] ?? 0;
  const horizonAtEarth = horizonMask[earthAzIndex] ?? 0;

  const { fraction: penumbraFraction, deltaDeg: sunDelta } = computePenumbralSolarFraction(
    sunEl,
    horizonAtSun
  );
  const { state: dteState, deltaDeg: earthDelta } = evaluateDTEState(earthEl, horizonAtEarth);

  // SVG coordinate transformation constants for Unwrapped Panorama
  // Viewport: 1000 x 360
  // X: Azimuth 0° to 360° mapped to [40, 960]
  // Y: Elevation -6° to +18° mapped to [320, 30] (inversion: +18° at y=30, 0° at y=247.5, -6° at y=320)
  const elMin = -6.0;
  const elMax = 18.0;
  const svgW = 1000;
  const svgH = 340;
  const padX = 45;
  const plotW = svgW - padX * 2;
  const plotH = svgH - 60;

  const azToX = (azDeg: number) => {
    const norm = (((azDeg % 360) + 360) % 360) / 360.0;
    return padX + norm * plotW;
  };

  const elToY = (elDeg: number) => {
    const clamped = Math.max(elMin, Math.min(elMax, elDeg));
    const norm = (clamped - elMin) / (elMax - elMin);
    return svgH - 35 - norm * plotH;
  };

  // Build SVG Path for the Jagged Terrain Horizon Silhouette
  const horizonPath = useMemo(() => {
    let d = `M ${azToX(0)} ${elToY(horizonMask[0])}`;
    for (let az = 1; az < 360; az++) {
      d += ` L ${azToX(az)} ${elToY(horizonMask[az])}`;
    }
    d += ` L ${azToX(359)} ${svgH - 30} L ${azToX(0)} ${svgH - 30} Z`;
    return d;
  }, [horizonMask]);

  // Build Solar Trajectory Path across the 30-day timeline
  const sunTrackPath = useMemo(() => {
    if (timelineSteps.length < 2) return '';
    let d = '';
    for (let i = 0; i < timelineSteps.length; i += 3) {
      const step = timelineSteps[i];
      const x = azToX(step.sunAzDeg);
      const y = elToY(step.sunElDeg);
      if (i === 0) d = `M ${x.toFixed(1)} ${y.toFixed(1)}`;
      else d += ` L ${x.toFixed(1)} ${y.toFixed(1)}`;
    }
    return d;
  }, [timelineSteps]);

  // Build Earth Libration Loop (Figure-8) Path
  const earthLibrationPath = useMemo(() => {
    if (timelineSteps.length < 2) return '';
    let d = '';
    for (let i = 0; i < timelineSteps.length; i += 2) {
      const step = timelineSteps[i];
      const x = azToX(step.earthAzDeg);
      const y = elToY(step.earthElDeg);
      if (i === 0) d = `M ${x.toFixed(1)} ${y.toFixed(1)}`;
      else d += ` L ${x.toFixed(1)} ${y.toFixed(1)}`;
    }
    return d;
  }, [timelineSteps]);

  // Polar Radar SVG Coordinate Transformation
  // Center at (200, 200), Radius = 170
  // Outer circle: El = -2°, Inner circle: El = 90° (Zenith)
  const radarCenter = 200;
  const radarRadius = 165;

  const polarToRadarXY = (azDeg: number, elDeg: number) => {
    const elClamped = Math.max(-2, Math.min(90, elDeg));
    const r = radarRadius * (1.0 - (elClamped + 2.0) / 92.0);
    const azRad = ((azDeg - 90) * Math.PI) / 180.0; // 0° North at top
    const x = radarCenter + r * Math.cos(azRad);
    const y = radarCenter + r * Math.sin(azRad);
    return { x, y };
  };

  const polarHorizonPath = useMemo(() => {
    let d = '';
    for (let az = 0; az < 360; az++) {
      const pt = polarToRadarXY(az, horizonMask[az]);
      if (az === 0) d = `M ${pt.x.toFixed(1)} ${pt.y.toFixed(1)}`;
      else d += ` L ${pt.x.toFixed(1)} ${pt.y.toFixed(1)}`;
    }
    d += ' Z';
    return d;
  }, [horizonMask]);

  return (
    <div className="w-full bg-[#0a0f1d] rounded-xl border border-pluton-border p-3.5 flex flex-col gap-3 shadow-xl select-none">
      {/* Header Bar */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800 pb-2.5">
        <div className="flex items-center gap-2">
          <Compass className="w-4 h-4 text-amber-400" />
          <h2 className="text-xs font-mono font-bold tracking-wider text-slate-200">
            360° LOCAL HORIZON & TOPOGRAPHIC SKY-DOME
          </h2>
          <span className="text-[10px] font-mono text-slate-400 hidden sm:inline">
            ({site.name} • {site.elevation}m)
          </span>
        </div>

        {/* Status Indicators & View Toggle */}
        <div className="flex items-center gap-2">
          {/* Penumbra Fraction Badge */}
          <div
            className={`flex items-center gap-1.5 px-2 py-0.5 rounded text-[10px] font-mono font-bold border ${
              penumbraFraction >= 0.95
                ? 'bg-amber-500/10 text-amber-300 border-amber-500/40'
                : penumbraFraction > 0.05
                ? 'bg-yellow-500/10 text-yellow-300 border-yellow-500/40 animate-pulse'
                : 'bg-red-500/10 text-red-400 border-red-500/40'
            }`}
          >
            <Sun className="w-3 h-3 text-amber-400" />
            <span>
              {penumbraFraction >= 0.95
                ? 'DIRECT SUN (100%)'
                : penumbraFraction > 0.05
                ? `PENUMBRA (${(penumbraFraction * 100).toFixed(0)}%)`
                : 'CRYOGENIC ECLIPSE (0%)'}
            </span>
          </div>

          {/* DTE Comm Badge */}
          <div
            className={`flex items-center gap-1.5 px-2 py-0.5 rounded text-[10px] font-mono font-bold border ${
              dteState === 'NOMINAL_DTE'
                ? 'bg-cyan-500/10 text-cyan-300 border-cyan-500/40'
                : dteState === 'MULTIPATH_GRAZING'
                ? 'bg-yellow-500/10 text-yellow-300 border-yellow-500/40'
                : 'bg-red-500/10 text-red-400 border-red-500/40'
            }`}
          >
            <Radio className="w-3 h-3 text-cyan-400" />
            <span>
              {dteState === 'NOMINAL_DTE'
                ? 'DTE NOMINAL (+X/Ka)'
                : dteState === 'MULTIPATH_GRAZING'
                ? 'DTE GRAZING (+S-Band)'
                : 'DTE OCCLUDED (Blackout)'}
            </span>
          </div>

          {/* Toggle View Mode */}
          <div className="flex items-center bg-[#060913] p-0.5 rounded border border-slate-700">
            <button
              onClick={() => setViewMode('PANORAMA')}
              className={`text-[9px] font-mono px-2 py-0.5 rounded transition-all ${
                viewMode === 'PANORAMA'
                  ? 'bg-slate-700 text-white font-bold'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              PANORAMA 360°
            </button>
            <button
              onClick={() => setViewMode('POLAR_RADAR')}
              className={`text-[9px] font-mono px-2 py-0.5 rounded transition-all ${
                viewMode === 'POLAR_RADAR'
                  ? 'bg-slate-700 text-white font-bold'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              RADAR DOME
            </button>
          </div>
        </div>
      </div>

      {/* Interactive Sliders: Mast Height & Solar Array Selection */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 bg-[#060913]/70 p-2.5 rounded-lg border border-slate-800 text-xs font-mono">
        {/* Mast Height Slider */}
        <div className="flex flex-col gap-1.5">
          <div className="flex items-center justify-between text-[11px]">
            <span className="text-slate-400 flex items-center gap-1.5">
              <Sliders className="w-3.5 h-3.5 text-amber-400" />
              <span>HARDWARE MAST HEIGHT (z_mast):</span>
            </span>
            <span className="font-bold text-amber-300 bg-amber-950/40 px-1.5 py-0.5 rounded border border-amber-800/40">
              {mastHeightM.toFixed(1)} m
            </span>
          </div>
          <div className="flex items-center gap-2">
            <input
              type="range"
              min="0"
              max="25"
              step="0.1"
              value={mastHeightM}
              onChange={(e) => onMastHeightChange(parseFloat(e.target.value))}
              className="w-full accent-amber-400 h-1.5 bg-slate-800 rounded-lg cursor-pointer"
            />
            <div className="flex gap-1 shrink-0">
              {[0, 1.8, 3.6, 10.5, 20].map((preset) => (
                <button
                  key={preset}
                  onClick={() => onMastHeightChange(preset)}
                  className={`text-[9px] px-1.5 py-0.5 rounded border ${
                    Math.abs(mastHeightM - preset) < 0.1
                      ? 'bg-amber-500 text-slate-950 font-bold border-amber-400'
                      : 'bg-slate-800 text-slate-400 border-slate-700 hover:text-white'
                  }`}
                >
                  {preset}m
                </button>
              ))}
            </div>
          </div>
          <div className="text-[9px] text-slate-500 flex justify-between">
            <span>0m (Ground level)</span>
            <span className="text-amber-400/80">Raising mast clears near-field crater rims &lt; 2km</span>
            <span>25m (Tall Tower)</span>
          </div>
        </div>

        {/* Solar Array Type & Instant Flux Advantage */}
        <div className="flex flex-col justify-between gap-1.5">
          <div className="flex items-center justify-between text-[11px]">
            <span className="text-slate-400 flex items-center gap-1.5">
              <Zap className="w-3.5 h-3.5 text-cyan-400" />
              <span>SOLAR ARRAY ARCHITECTURE:</span>
            </span>
            <div className="flex items-center gap-1">
              <button
                onClick={() => onArrayTypeChange('vertical')}
                className={`text-[10px] px-2 py-0.5 rounded font-bold transition-all border ${
                  arrayType === 'vertical'
                    ? 'bg-amber-500 text-slate-950 border-amber-400 shadow-sm'
                    : 'bg-slate-800 text-slate-400 border-slate-700'
                }`}
              >
                VERTICAL MAST
              </button>
              <button
                onClick={() => onArrayTypeChange('horizontal')}
                className={`text-[10px] px-2 py-0.5 rounded font-bold transition-all border ${
                  arrayType === 'horizontal'
                    ? 'bg-cyan-500 text-slate-950 border-cyan-400 shadow-sm'
                    : 'bg-slate-800 text-slate-400 border-slate-700'
                }`}
              >
                HORIZONTAL DECK
              </button>
            </div>
          </div>

          <div className="bg-[#0f172a] p-1.5 rounded border border-slate-800 text-[10px] flex items-center justify-between">
            <span className="text-slate-400">Grazing Solar Advantage:</span>
            <span className="text-emerald-400 font-bold">
              {arrayType === 'vertical'
                ? '+1,320 W/m² (Cos-loss eliminated)'
                : '-1,320 W/m² (Catastrophic Cosine drop)'}
            </span>
          </div>
        </div>
      </div>

      {/* Main Graphical Canvas / SVG */}
      <div className="w-full bg-[#030611] rounded-lg border border-slate-800/80 overflow-hidden relative flex items-center justify-center min-h-[280px]">
        {viewMode === 'PANORAMA' ? (
          /* Mode 1: 360° Unwrapped Cartesian Panorama */
          <svg
            viewBox={`0 0 ${svgW} ${svgH}`}
            className="w-full h-full min-h-[280px]"
            preserveAspectRatio="none"
          >
            {/* Background Gradients */}
            <defs>
              <linearGradient id="skyGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#02040a" />
                <stop offset="60%" stopColor="#050917" />
                <stop offset="100%" stopColor="#0d1428" />
              </linearGradient>
              <linearGradient id="terrainGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#1e293b" />
                <stop offset="40%" stopColor="#0f172a" />
                <stop offset="100%" stopColor="#020617" />
              </linearGradient>
              <radialGradient id="sunGlow" cx="50%" cy="50%" r="50%">
                <stop offset="0%" stopColor="#fbbf24" stopOpacity="0.9" />
                <stop offset="40%" stopColor="#f59e0b" stopOpacity="0.4" />
                <stop offset="100%" stopColor="#d97706" stopOpacity="0" />
              </radialGradient>
            </defs>

            {/* Sky Background */}
            <rect x="0" y="0" width={svgW} height={svgH} fill="url(#skyGrad)" />

            {/* Elevation Horizontal Grid Lines */}
            {[-5, 0, 5, 10, 15].map((el) => {
              const y = elToY(el);
              return (
                <g key={el}>
                  <line
                    x1={padX}
                    y1={y}
                    x2={svgW - padX}
                    y2={y}
                    stroke={el === 0 ? '#38bdf8' : '#1e293b'}
                    strokeWidth={el === 0 ? 1.5 : 0.8}
                    strokeDasharray={el === 0 ? '4 3' : '2 4'}
                  />
                  <text
                    x={padX - 8}
                    y={y + 3}
                    textAnchor="end"
                    fill={el === 0 ? '#38bdf8' : '#64748b'}
                    fontSize="9"
                    fontFamily="monospace"
                  >
                    {el > 0 ? `+${el}°` : `${el}°`}
                  </text>
                </g>
              );
            })}

            {/* Azimuth Vertical Grid Lines (0°, 45°, 90°, 135°, 180°, 225°, 270°, 315°, 360°) */}
            {[
              { az: 0, label: '0° N' },
              { az: 45, label: '45° NE' },
              { az: 90, label: '90° E' },
              { az: 135, label: '135° SE' },
              { az: 180, label: '180° S' },
              { az: 225, label: '225° SW' },
              { az: 270, label: '270° W' },
              { az: 315, label: '315° NW' },
              { az: 360, label: '360° N' },
            ].map((col) => {
              const x = azToX(col.az);
              return (
                <g key={col.az}>
                  <line
                    x1={x}
                    y1={20}
                    x2={x}
                    y2={svgH - 30}
                    stroke="#1e293b"
                    strokeWidth="0.8"
                    strokeDasharray="2 4"
                  />
                  <text
                    x={x}
                    y={svgH - 14}
                    textAnchor="middle"
                    fill="#94a3b8"
                    fontSize="10"
                    fontFamily="monospace"
                    fontWeight="bold"
                  >
                    {col.label}
                  </text>
                </g>
              );
            })}

            {/* Earth Libration Loop (Figure-8) */}
            {earthLibrationPath && (
              <path
                d={earthLibrationPath}
                fill="none"
                stroke="#06b6d4"
                strokeWidth="1.6"
                strokeDasharray="3 3"
                opacity="0.65"
              />
            )}

            {/* 29.5-Day Solar Path Wave */}
            {sunTrackPath && (
              <path
                d={sunTrackPath}
                fill="none"
                stroke="#f59e0b"
                strokeWidth="1.8"
                opacity="0.45"
              />
            )}

            {/* Curvature-Corrected 360° LOLA Terrain Silhouette */}
            <path
              d={horizonPath}
              fill="url(#terrainGrad)"
              stroke="#64748b"
              strokeWidth="2"
            />

            {/* Prominent Labeled Mountain & Crater Rim Peaks */}
            {horizonProfile.prominentPeaks.map((peak, idx) => {
              const px = azToX(peak.azimuthDeg);
              const py = elToY(peak.elevationDeg);
              return (
                <g key={idx} className="cursor-pointer">
                  <line
                    x1={px}
                    y1={py}
                    x2={px}
                    y2={py - 16}
                    stroke="#f59e0b"
                    strokeWidth="1"
                    opacity="0.8"
                  />
                  <circle cx={px} cy={py} r="2.5" fill="#f59e0b" />
                  <rect
                    x={px - 45}
                    y={py - 28}
                    width="90"
                    height="12"
                    rx="3"
                    fill="#0f172a"
                    fillOpacity="0.9"
                    stroke="#475569"
                    strokeWidth="0.6"
                  />
                  <text
                    x={px}
                    y={py - 19}
                    textAnchor="middle"
                    fill="#cbd5e1"
                    fontSize="7"
                    fontFamily="monospace"
                  >
                    {peak.name.length > 17 ? peak.name.substring(0, 16) + '…' : peak.name}
                  </text>
                </g>
              );
            })}

            {/* Earth Position & Line of Sight */}
            {(() => {
              const ex = azToX(earthAz);
              const ey = elToY(earthEl);
              const eHorizonY = elToY(horizonAtEarth);
              const isBlocked = earthEl < horizonAtEarth;

              return (
                <g>
                  {/* Ray from Earth to Horizon */}
                  <line
                    x1={ex}
                    y1={ey}
                    x2={ex}
                    y2={eHorizonY}
                    stroke={isBlocked ? '#ef4444' : '#06b6d4'}
                    strokeWidth="1.2"
                    strokeDasharray="2 2"
                  />
                  <circle cx={ex} cy={ey} r="7" fill="#0891b2" stroke="#67e8f9" strokeWidth="1.5" />
                  <circle cx={ex} cy={ey} r="2.5" fill="#ecfeff" />
                  <text
                    x={ex}
                    y={ey - 10}
                    textAnchor="middle"
                    fill="#22d3ee"
                    fontSize="9"
                    fontFamily="monospace"
                    fontWeight="bold"
                  >
                    EARTH ({earthEl.toFixed(1)}°)
                  </text>
                </g>
              );
            })()}

            {/* Current Sun Position (Scaled 0.533° Solar Disk dipping behind horizon) */}
            {(() => {
              const sx = azToX(sunAz);
              const sy = elToY(sunEl);
              // Visual angular radius for 0.2665°
              const sunRadiusPx = (0.2665 / (elMax - elMin)) * plotH;

              return (
                <g>
                  {/* Sun Halo / Corona */}
                  <circle cx={sx} cy={sy} r={sunRadiusPx * 3} fill="url(#sunGlow)" />
                  {/* Sun Disk */}
                  <circle
                    cx={sx}
                    cy={sy}
                    r={Math.max(5, sunRadiusPx * 1.5)}
                    fill="#fef08a"
                    stroke="#f59e0b"
                    strokeWidth="2"
                  />
                  {/* Sun Center Point */}
                  <circle cx={sx} cy={sy} r="1.5" fill="#78350f" />
                  <text
                    x={sx}
                    y={sy - 12}
                    textAnchor="middle"
                    fill="#fbbf24"
                    fontSize="9"
                    fontFamily="monospace"
                    fontWeight="bold"
                  >
                    SUN ({sunEl.toFixed(2)}°)
                  </text>
                </g>
              );
            })()}

            {/* 0° Geometric Horizon Line Indicator */}
            <text
              x={svgW - padX - 4}
              y={elToY(0) - 4}
              textAnchor="end"
              fill="#38bdf8"
              fontSize="8"
              fontFamily="monospace"
            >
              0° THEORETICAL HORIZON
            </text>
          </svg>
        ) : (
          /* Mode 2: 360° Polar Radar Sky-Dome */
          <svg viewBox="0 0 400 400" className="w-[360px] h-[360px] p-2">
            <defs>
              <radialGradient id="radarSkyGrad" cx="50%" cy="50%" r="50%">
                <stop offset="0%" stopColor="#0f172a" />
                <stop offset="85%" stopColor="#050814" />
                <stop offset="100%" stopColor="#02040a" />
              </radialGradient>
            </defs>

            {/* Radar Background */}
            <circle cx={radarCenter} cy={radarCenter} r={radarRadius} fill="url(#radarSkyGrad)" stroke="#334155" strokeWidth="1.5" />

            {/* Concentric Elevation Rings: 0°, 30°, 60° */}
            {[0, 30, 60].map((el) => {
              const r = radarRadius * (1.0 - (el + 2.0) / 92.0);
              return (
                <g key={el}>
                  <circle
                    cx={radarCenter}
                    cy={radarCenter}
                    r={r}
                    fill="none"
                    stroke="#1e293b"
                    strokeWidth="1"
                    strokeDasharray="2 4"
                  />
                  <text
                    x={radarCenter + 4}
                    y={radarCenter - r + 10}
                    fill="#64748b"
                    fontSize="8"
                    fontFamily="monospace"
                  >
                    {el}°
                  </text>
                </g>
              );
            })}

            {/* Zenith Point */}
            <circle cx={radarCenter} cy={radarCenter} r="2" fill="#94a3b8" />
            <text x={radarCenter} y={radarCenter - 6} textAnchor="middle" fill="#94a3b8" fontSize="8" fontFamily="monospace">
              ZENITH (+90°)
            </text>

            {/* Cardinal Azimuth Spoke Lines */}
            {[
              { angle: 0, label: 'N (0°)' },
              { angle: 90, label: 'E (90°)' },
              { angle: 180, label: 'S (180°)' },
              { angle: 270, label: 'W (270°)' },
            ].map((spoke) => {
              const rad = ((spoke.angle - 90) * Math.PI) / 180.0;
              const x1 = radarCenter + 15 * Math.cos(rad);
              const y1 = radarCenter + 15 * Math.sin(rad);
              const x2 = radarCenter + radarRadius * Math.cos(rad);
              const y2 = radarCenter + radarRadius * Math.sin(rad);
              const tx = radarCenter + (radarRadius + 14) * Math.cos(rad);
              const ty = radarCenter + (radarRadius + 14) * Math.sin(rad) + 3;

              return (
                <g key={spoke.angle}>
                  <line x1={x1} y1={y1} x2={x2} y2={y2} stroke="#1e293b" strokeWidth="1" />
                  <text
                    x={tx}
                    y={ty}
                    textAnchor="middle"
                    fill="#94a3b8"
                    fontSize="9"
                    fontFamily="monospace"
                    fontWeight="bold"
                  >
                    {spoke.label}
                  </text>
                </g>
              );
            })}

            {/* Local Horizon Obstruction Area on Polar Radar */}
            <path
              d={polarHorizonPath}
              fill="#1e293b"
              fillOpacity="0.45"
              stroke="#64748b"
              strokeWidth="1.5"
            />

            {/* Sun Vector Marker */}
            {(() => {
              const pt = polarToRadarXY(sunAz, sunEl);
              return (
                <g>
                  <circle cx={pt.x} cy={pt.y} r="6" fill="#f59e0b" stroke="#fef08a" strokeWidth="2" />
                  <text x={pt.x} y={pt.y - 8} textAnchor="middle" fill="#f59e0b" fontSize="8" fontFamily="monospace" fontWeight="bold">
                    SUN ({sunEl.toFixed(1)}°)
                  </text>
                </g>
              );
            })()}

            {/* Earth Vector Marker */}
            {(() => {
              const pt = polarToRadarXY(earthAz, earthEl);
              return (
                <g>
                  <circle cx={pt.x} cy={pt.y} r="5" fill="#06b6d4" stroke="#67e8f9" strokeWidth="1.5" />
                  <text x={pt.x} y={pt.y - 7} textAnchor="middle" fill="#06b6d4" fontSize="8" fontFamily="monospace" fontWeight="bold">
                    EARTH ({earthEl.toFixed(1)}°)
                  </text>
                </g>
              );
            })()}

            {/* Lunar Gateway NRHO High Overhead Arc */}
            <circle cx={radarCenter + 25} cy={radarCenter - 45} r="4" fill="#a855f7" stroke="#c084fc" strokeWidth="1.5" />
            <text x={radarCenter + 25} y={radarCenter - 53} textAnchor="middle" fill="#c084fc" fontSize="8" fontFamily="monospace">
              GATEWAY NRHO (+68°)
            </text>
          </svg>
        )}
      </div>
    </div>
  );
};

