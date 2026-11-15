'use client';

import React from 'react';
import {
  ShieldCheck,
  ShieldAlert,
  Sun,
  Radio,
  BatteryCharging,
  Thermometer,
  Zap,
  TrendingUp,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Clock,
  Compass,
  Layers,
  ArrowRight,
  Sliders,
} from 'lucide-react';
import {
  LunarSite,
  HardwareProfile,
  MissionAnalysisSummary,
  TerrainHorizonProfile,
  PhysicsTimeStep,
} from '@/types/pluton';

interface AssessmentViewProps {
  site: LunarSite;
  hardware: HardwareProfile;
  summary: MissionAnalysisSummary;
  horizonProfile: TerrainHorizonProfile;
  steps: PhysicsTimeStep[];
  mastHeightM: number;
  onOpenComparator: () => void;
  onOpenStk: () => void;
}

export const AssessmentView: React.FC<AssessmentViewProps> = ({
  site,
  hardware,
  summary,
  horizonProfile,
  steps,
  mastHeightM,
  onOpenComparator,
  onOpenStk,
}) => {
  // Quantitative Evaluation
  const isMissionViable = summary.overallViability;
  const sunlitRatio = summary.sunlitHours / summary.totalHours;
  const dteRatio = summary.dteNominalHours / summary.totalHours;
  const jointRatio = summary.jointGoHours / summary.totalHours;

  // Maximum continuous eclipse
  const maxEclipseHours = summary.maxConsecutiveEclipseHours;
  const batterySurvivalHours = hardware.batteryCapacityWh / (hardware.basePowerW + hardware.heaterPowerW);
  const batteryMarginRatio = batterySurvivalHours / Math.max(1, maxEclipseHours);

  // Flight Rule Compliance Evaluation
  const flightRules = [
    {
      id: 'FR-01',
      title: 'Solar Illumination Duty Cycle',
      requirement: '≥ 40% Direct Sunlight during 30-day window',
      actual: `${(sunlitRatio * 100).toFixed(1)}% (${summary.sunlitHours}h / ${summary.totalHours}h)`,
      passed: sunlitRatio >= 0.4,
      criticality: 'CRITICAL',
    },
    {
      id: 'FR-02',
      title: 'Earth Direct Line-of-Sight Window',
      requirement: '≥ 40% Line-of-Sight to NASA Deep Space Network',
      actual: `${(dteRatio * 100).toFixed(1)}% (${summary.dteNominalHours}h)`,
      passed: dteRatio >= 0.4,
      criticality: 'HIGH',
    },
    {
      id: 'FR-03',
      title: 'Battery Reserve During Max Eclipse',
      requirement: 'Min SoC ≥ 20% during longest continuous lunar shadow',
      actual: `${summary.minBatterySoCPct.toFixed(1)}% (Max Shadow: ${maxEclipseHours}h)`,
      passed: summary.minBatterySoCPct >= 20.0,
      criticality: 'CRITICAL',
    },
    {
      id: 'FR-04',
      title: 'Simultaneous Sun + Comm Go-Window',
      requirement: '≥ 25% Joint Operational Go-Window',
      actual: `${(jointRatio * 100).toFixed(1)}% (${summary.jointGoHours}h)`,
      passed: jointRatio >= 0.25,
      criticality: 'HIGH',
    },
    {
      id: 'FR-05',
      title: 'Solar Mast Horizon Clearance',
      requirement: `Mast height (${mastHeightM.toFixed(1)}m) must clear average terrain ridge`,
      actual: `Peak ridge: ${horizonProfile.maxHorizonEl.toFixed(1)}°, Min clearance: ${horizonProfile.minHorizonEl.toFixed(1)}°`,
      passed: horizonProfile.maxHorizonEl < 8.0,
      criticality: 'MEDIUM',
    },
  ];

  const passedRulesCount = flightRules.filter((r) => r.passed).length;

  return (
    <div className="w-full flex flex-col gap-4 font-mono text-slate-200 animate-in fade-in duration-200">
      {/* Top Banner: Flight Readiness Status */}
      <div
        className={`p-4 rounded-xl border flex flex-col md:flex-row md:items-center justify-between gap-4 ${isMissionViable
          ? 'bg-[#061814] border-emerald-500/50 shadow-lg shadow-emerald-950/40'
          : 'bg-[#180a0a] border-rose-500/50 shadow-lg shadow-rose-950/40'
          }`}
      >
        <div className="flex items-center gap-3.5">
          <div className="relative w-12 h-12 rounded-xl overflow-hidden border border-cyan-400/60 flex-shrink-0 bg-[#080d1a] shadow-lg shadow-cyan-500/20">
            <img
              src="/pluton-logo.png"
              alt="PLUTON Profile"
              className="w-full h-full object-cover"
            />
            <div className={`absolute top-0 right-0 w-3 h-3 rounded-full border-2 border-[#061814] ${isMissionViable ? 'bg-emerald-400 animate-pulse' : 'bg-rose-400 animate-ping'}`} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs uppercase font-bold text-slate-400">FLIGHT CERTIFICATION:</span>
              <span
                className={`text-lg font-black tracking-wider ${isMissionViable ? 'text-emerald-300' : 'text-rose-300'
                  }`}
              >
                {isMissionViable ? 'MISSION GO // FLIGHT VIABLE' : 'MISSION NO-GO // CRITICAL DEFICIT'}
              </span>
            </div>
            <p className="text-xs text-slate-300 mt-0.5">
              Target Candidate: <strong className="text-white">{site.name}</strong> ({site.latitude.toFixed(2)}°S, {site.longitude.toFixed(2)}°E, {site.elevation}m) • Hardware: <strong className="text-cyan-300">{hardware.name}</strong>
            </p>
          </div>
        </div>

        {/* Quick Decision Metrics */}
        <div className="flex items-center gap-3">
          <div className="text-right">
            <div className="text-[10px] text-slate-400">RULES PASSED</div>
            <div className="text-base font-black text-amber-300">
              {passedRulesCount} / {flightRules.length}
            </div>
          </div>
          <div className="h-8 w-[1px] bg-slate-800" />
          <button
            onClick={onOpenComparator}
            className="flex items-center gap-1.5 px-3 py-2 rounded bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/50 text-xs font-bold transition-all shadow-sm cursor-pointer"
          >
            <Sliders className="w-4 h-4 text-amber-400" />
            <span>TRADE STUDY A vs B</span>
          </button>
        </div>
      </div>

      {/* Grid of Key Tactical Telemetry Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
        {/* Card 1: Solar Availability */}
        <div className="p-3.5 rounded-xl bg-[#090e1c] border border-slate-800 hover:border-amber-500/40 transition-all flex flex-col justify-between">
          <div className="flex items-center justify-between text-xs">
            <span className="text-slate-400 flex items-center gap-1.5">
              <Sun className="w-3.5 h-3.5 text-amber-400" />
              SOLAR ILLUMINATION
            </span>
            <span className="text-[10px] px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-300 border border-amber-500/40 font-bold">
              {summary.sunlitPct.toFixed(1)}%
            </span>
          </div>
          <div className="my-2">
            <div className="text-2xl font-black text-white">{summary.sunlitHours} <span className="text-xs text-slate-400 font-normal">hours</span></div>
            <div className="text-[10px] text-slate-400 mt-0.5">
              Total energy harvested: <strong className="text-amber-300">{Math.round(summary.totalEnergyHarvestedWh / 1000).toLocaleString()} kWh</strong>
            </div>
          </div>
          <div className="w-full bg-slate-950 h-1.5 rounded-full overflow-hidden border border-slate-800">
            <div className="bg-amber-500 h-full" style={{ width: `${Math.min(100, summary.sunlitPct)}%` }} />
          </div>
        </div>

        {/* Card 2: DTE Comm Windows */}
        <div className="p-3.5 rounded-xl bg-[#090e1c] border border-slate-800 hover:border-cyan-500/40 transition-all flex flex-col justify-between">
          <div className="flex items-center justify-between text-xs">
            <span className="text-slate-400 flex items-center gap-1.5">
              <Radio className="w-3.5 h-3.5 text-cyan-400" />
              EARTH DTE WINDOW
            </span>
            <span className="text-[10px] px-1.5 py-0.2 rounded bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 font-bold">
              {summary.dteNominalPct.toFixed(1)}%
            </span>
          </div>
          <div className="my-2">
            <div className="text-2xl font-black text-white">{summary.dteNominalHours} <span className="text-xs text-slate-400 font-normal">hours</span></div>
            <div className="text-[10px] text-slate-400 mt-0.5">
              Longest comm blackout: <strong className="text-cyan-300">{summary.maxConsecutiveBlackoutHours}h</strong>
            </div>
          </div>
          <div className="w-full bg-slate-950 h-1.5 rounded-full overflow-hidden border border-slate-800">
            <div className="bg-cyan-500 h-full" style={{ width: `${Math.min(100, summary.dteNominalPct)}%` }} />
          </div>
        </div>

        {/* Card 3: Battery Depth of Discharge */}
        <div className="p-3.5 rounded-xl bg-[#090e1c] border border-slate-800 hover:border-emerald-500/40 transition-all flex flex-col justify-between">
          <div className="flex items-center justify-between text-xs">
            <span className="text-slate-400 flex items-center gap-1.5">
              <BatteryCharging className="w-3.5 h-3.5 text-emerald-400" />
              MIN BATTERY SoC
            </span>
            <span
              className={`text-[10px] px-1.5 py-0.2 rounded font-bold ${summary.minBatterySoCPct >= 20
                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                : 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                }`}
            >
              {summary.minBatterySoCPct.toFixed(1)}%
            </span>
          </div>
          <div className="my-2">
            <div className="text-2xl font-black text-white">{summary.minBatterySoCPct.toFixed(1)}%</div>
            <div className="text-[10px] text-slate-400 mt-0.5">
              Battery margin ratio: <strong className="text-emerald-300">{batteryMarginRatio.toFixed(2)}x</strong>
            </div>
          </div>
          <div className="w-full bg-slate-950 h-1.5 rounded-full overflow-hidden border border-slate-800">
            <div
              className={`h-full ${summary.minBatterySoCPct >= 20 ? 'bg-emerald-500' : 'bg-rose-500'}`}
              style={{ width: `${Math.min(100, summary.minBatterySoCPct)}%` }}
            />
          </div>
        </div>

        {/* Card 4: Simultaneous Joint Go */}
        <div className="p-3.5 rounded-xl bg-[#090e1c] border border-slate-800 hover:border-purple-500/40 transition-all flex flex-col justify-between">
          <div className="flex items-center justify-between text-xs">
            <span className="text-slate-400 flex items-center gap-1.5">
              <Zap className="w-3.5 h-3.5 text-purple-400" />
              SIMULTANEOUS JOINT GO
            </span>
            <span className="text-[10px] px-1.5 py-0.2 rounded bg-purple-500/20 text-purple-300 border border-purple-500/40 font-bold">
              {summary.jointGoPct.toFixed(1)}%
            </span>
          </div>
          <div className="my-2">
            <div className="text-2xl font-black text-white">{summary.jointGoHours} <span className="text-xs text-slate-400 font-normal">hours</span></div>
            <div className="text-[10px] text-slate-400 mt-0.5">
              Simultaneous Solar + Earth DSN
            </div>
          </div>
          <div className="w-full bg-slate-950 h-1.5 rounded-full overflow-hidden border border-slate-800">
            <div className="bg-purple-500 h-full" style={{ width: `${Math.min(100, summary.jointGoPct)}%` }} />
          </div>
        </div>
      </div>

      {/* Flight Rules Compliance Audit Table */}
      <div className="rounded-xl bg-[#070b16] border border-slate-800 overflow-hidden">
        <div className="px-5 py-3 border-b border-slate-800 bg-[#090f20] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <h3 className="text-xs font-black tracking-wider text-white uppercase">
              Artemis III Flight Rules Compliance Audit
            </h3>
          </div>
          <span className="text-[10px] text-slate-400">
            NASA-STD-3001 / JPL D-5820 Aerospace Criteria
          </span>
        </div>

        <div className="divide-y divide-slate-800/80 overflow-x-auto">
          {flightRules.map((rule) => (
            <div
              key={rule.id}
              className="px-5 py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs hover:bg-slate-900/40 transition-colors"
            >
              <div className="flex items-start sm:items-center gap-3">
                <span
                  className={`mt-0.5 sm:mt-0 p-1 rounded-full ${rule.passed
                    ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                    : 'bg-rose-500/20 text-rose-400 border border-rose-500/40'
                    }`}
                >
                  {rule.passed ? <CheckCircle2 className="w-3.5 h-3.5" /> : <XCircle className="w-3.5 h-3.5" />}
                </span>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-slate-400 font-bold">{rule.id}</span>
                    <span className="text-white font-bold">{rule.title}</span>
                    <span
                      className={`text-[9px] px-1.5 py-0.2 rounded font-bold ${rule.criticality === 'CRITICAL'
                        ? 'bg-rose-500/15 text-rose-300 border border-rose-500/30'
                        : rule.criticality === 'HIGH'
                          ? 'bg-amber-500/15 text-amber-300 border border-amber-500/30'
                          : 'bg-cyan-500/15 text-cyan-300 border border-cyan-500/30'
                        }`}
                    >
                      {rule.criticality}
                    </span>
                  </div>
                  <div className="text-[11px] text-slate-400 mt-0.5">{rule.requirement}</div>
                </div>
              </div>

              <div className="text-right sm:pl-4">
                <div className={`font-bold ${rule.passed ? 'text-emerald-300' : 'text-rose-300'}`}>
                  {rule.actual}
                </div>
                <div className="text-[10px] text-slate-500 uppercase">
                  {rule.passed ? 'PASSED CRITERIA' : 'CRITERIA DEFICIT'}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

