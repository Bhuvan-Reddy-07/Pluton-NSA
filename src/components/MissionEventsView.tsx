'use client';

import React, { useState, useMemo } from 'react';
import {
  ListOrdered,
  Sun,
  Radio,
  BatteryCharging,
  Thermometer,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Filter,
  ArrowRight,
  Zap,
} from 'lucide-react';
import { PhysicsTimeStep, LunarSite, HardwareProfile } from '@/types/pluton';
import { getAssetPath } from '@/utils/assetPath';

interface MissionEventsViewProps {
  steps: PhysicsTimeStep[];
  site: LunarSite;
  hardware: HardwareProfile;
  currentStepIndex: number;
  onSelectStepIndex: (index: number) => void;
}

type EventFilter = 'ALL' | 'LIGHTING' | 'COMM' | 'POWER' | 'CRITICAL';

interface MissionEvent {
  stepIndex: number;
  utcIso: string;
  type: 'SUNRISE' | 'SUNSET' | 'PENUMBRA_ENTRY' | 'PENUMBRA_EXIT' | 'DTE_AOS' | 'DTE_LOS' | 'GATEWAY_RELAY' | 'BATTERY_LOW' | 'HEATER_ON';
  category: 'LIGHTING' | 'COMM' | 'POWER' | 'CRITICAL';
  title: string;
  detail: string;
  severity: 'NOMINAL' | 'WARNING' | 'CRITICAL';
}

export const MissionEventsView: React.FC<MissionEventsViewProps> = ({
  steps,
  site,
  hardware,
  currentStepIndex,
  onSelectStepIndex,
}) => {
  const [filter, setFilter] = useState<EventFilter>('ALL');

  // Detect discrete physical events across the 720 time steps
  const events: MissionEvent[] = useMemo(() => {
    const list: MissionEvent[] = [];

    for (let i = 1; i < steps.length; i++) {
      const prev = steps[i - 1];
      const curr = steps[i];

      // 1. Sunrise
      if (prev.sunDeltaDeg <= 0 && curr.sunDeltaDeg > 0) {
        list.push({
          stepIndex: i,
          utcIso: curr.utcIso,
          type: 'SUNRISE',
          category: 'LIGHTING',
          title: `Sunrise at ${site.name}`,
          detail: `Sun clears local ridge at ${curr.sunElDeg.toFixed(2)}° elevation. Solar array starts generating ${Math.round(curr.generatedPowerW)}W.`,
          severity: 'NOMINAL',
        });
      }

      // 2. Sunset
      if (prev.sunDeltaDeg > 0 && curr.sunDeltaDeg <= 0) {
        list.push({
          stepIndex: i,
          utcIso: curr.utcIso,
          type: 'SUNSET',
          category: 'LIGHTING',
          title: `Sunset / Mountain Shadow Entry`,
          detail: `Sun dips below ridge at azimuth ${curr.sunAzDeg.toFixed(1)}°. Switching to primary battery reserve (${curr.batterySoCWh.toFixed(1)}Wh).`,
          severity: 'WARNING',
        });
      }

      // 3. Earth DTE Acquisition of Signal (AOS)
      if (prev.dteCommState !== 'NOMINAL' && curr.dteCommState === 'NOMINAL') {
        list.push({
          stepIndex: i,
          utcIso: curr.utcIso,
          type: 'DTE_AOS',
          category: 'COMM',
          title: `Earth DTE Acquisition of Signal (AOS)`,
          detail: `Direct line-of-sight to NASA DSN established at ${curr.earthElDeg.toFixed(2)}° elevation. High-rate science telemetry enabled.`,
          severity: 'NOMINAL',
        });
      }

      // 4. Earth DTE Loss of Signal (LOS)
      if (prev.dteCommState === 'NOMINAL' && curr.dteCommState !== 'NOMINAL') {
        list.push({
          stepIndex: i,
          utcIso: curr.utcIso,
          type: 'DTE_LOS',
          category: 'COMM',
          title: `Earth DTE Loss of Signal (LOS)`,
          detail: `Earth blocked by terrain ridge at azimuth ${curr.earthAzDeg.toFixed(1)}°. ${curr.gatewayInRelay ? 'Autonomous handover to Lunar Gateway NRHO Relay.' : 'Store-and-forward telemetry mode engaged.'}`,
          severity: curr.gatewayInRelay ? 'WARNING' : 'CRITICAL',
        });
      }

      // 5. Gateway Relay Handover
      if (!prev.gatewayInRelay && curr.gatewayInRelay) {
        list.push({
          stepIndex: i,
          utcIso: curr.utcIso,
          type: 'GATEWAY_RELAY',
          category: 'COMM',
          title: `Lunar Gateway NRHO Relay Window Open`,
          detail: `Gateway enters South Pole apolune dwell corridor. Relay link active for next 48-72h.`,
          severity: 'NOMINAL',
        });
      }

      // 6. Battery Critical Low SoC
      if (prev.batterySoCPct > 25 && curr.batterySoCPct <= 25) {
        list.push({
          stepIndex: i,
          utcIso: curr.utcIso,
          type: 'BATTERY_LOW',
          category: 'CRITICAL',
          title: `Battery Reserve Low Warning (≤ 25%)`,
          detail: `Battery dropped to ${curr.batterySoCPct.toFixed(1)}% (${curr.batterySoCWh.toFixed(0)}Wh). Non-essential instruments shut down.`,
          severity: 'CRITICAL',
        });
      }

      // 7. Thermal Heater Engagement
      if (!prev.heaterActive && curr.heaterActive) {
        list.push({
          stepIndex: i,
          utcIso: curr.utcIso,
          type: 'HEATER_ON',
          category: 'POWER',
          title: `Survival Thermal Heaters Engaged`,
          detail: `Surface temperature plummeted to ${Math.round(curr.surfaceTempK)}K (-${Math.round(273.15 - curr.surfaceTempK)}°C). Drawing ${hardware.heaterPowerW}W for battery heating.`,
          severity: 'WARNING',
        });
      }
    }

    return list;
  }, [steps, site, hardware]);

  const filteredEvents = useMemo(() => {
    if (filter === 'ALL') return events;
    return events.filter((e) => e.category === filter);
  }, [events, filter]);

  return (
    <div className="w-full flex flex-col gap-4 font-mono text-slate-200 animate-in fade-in duration-200">
      {/* Top Banner */}
      <div className="p-4 rounded-xl bg-[#090e1c] border border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="relative w-12 h-12 rounded-xl overflow-hidden border border-cyan-400/60 flex-shrink-0 bg-[#080d1a] shadow-lg shadow-cyan-500/20">
            <img
              src={getAssetPath('/pluton-logo.png')}
              alt="PLUTON Profile"
              className="w-full h-full object-cover"
            />
            <div className="absolute top-0 right-0 w-3 h-3 rounded-full border-2 border-[#090e1c] bg-emerald-400 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs uppercase font-bold text-slate-400">MISSION EVENT SEQUENCER:</span>
              <span className="text-sm font-black text-emerald-300">CHRONOLOGICAL DISCRETE TELEMETRY LOG</span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Detected <strong className="text-white">{events.length} critical discrete transitions</strong> across the 720-hour operational cycle. Click any event to scrub the mission clock directly.
            </p>
          </div>
        </div>

        {/* Filter Buttons */}
        <div className="flex items-center flex-wrap gap-1 bg-[#060a14] p-1 rounded-lg border border-slate-800 text-[10px]">
          <span className="text-slate-500 px-2 font-bold flex items-center gap-1">
            <Filter className="w-3 h-3" />
            FILTER:
          </span>
          {(['ALL', 'LIGHTING', 'COMM', 'POWER', 'CRITICAL'] as EventFilter[]).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-2 py-1 rounded font-bold transition-all cursor-pointer ${filter === f
                ? 'bg-emerald-500 text-slate-950 shadow-sm'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
                }`}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      {/* Events Chronological Feed Table */}
      <div className="rounded-xl bg-[#070b16] border border-slate-800 overflow-hidden shadow-2xl">
        <div className="divide-y divide-slate-800/80 max-h-[640px] overflow-y-auto">
          {filteredEvents.length === 0 ? (
            <div className="p-8 text-center text-slate-500 text-xs">
              No events found matching category &quot;{filter}&quot;.
            </div>
          ) : (
            filteredEvents.map((evt, idx) => {
              const isSelected = currentStepIndex === evt.stepIndex;
              return (
                <div
                  key={idx}
                  onClick={() => onSelectStepIndex(evt.stepIndex)}
                  className={`p-3.5 flex flex-col md:flex-row md:items-center justify-between gap-3 transition-colors cursor-pointer ${isSelected
                    ? 'bg-gradient-to-r from-amber-500/15 via-slate-900 to-transparent border-l-4 border-amber-400'
                    : 'hover:bg-slate-900/40'
                    }`}
                >
                  <div className="flex items-start gap-3">
                    <div
                      className={`p-2 rounded-lg mt-0.5 border flex items-center justify-center flex-shrink-0 ${evt.severity === 'CRITICAL'
                        ? 'bg-rose-500/15 border-rose-500/40 text-rose-400'
                        : evt.severity === 'WARNING'
                          ? 'bg-amber-500/15 border-amber-500/40 text-amber-400'
                          : 'bg-emerald-500/15 border-emerald-500/40 text-emerald-400'
                        }`}
                    >
                      {evt.category === 'LIGHTING' ? (
                        <Sun className="w-4 h-4" />
                      ) : evt.category === 'COMM' ? (
                        <Radio className="w-4 h-4" />
                      ) : evt.category === 'POWER' ? (
                        <BatteryCharging className="w-4 h-4" />
                      ) : (
                        <AlertTriangle className="w-4 h-4" />
                      )}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-white font-bold text-xs">{evt.title}</span>
                        <span
                          className={`text-[9px] px-1.5 py-0.2 rounded font-bold ${evt.severity === 'CRITICAL'
                            ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                            : evt.severity === 'WARNING'
                              ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                              : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                            }`}
                        >
                          {evt.severity}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-400 mt-0.5">{evt.detail}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 text-right flex-shrink-0 md:pl-4">
                    <div>
                      <div className="text-[11px] text-emerald-300 font-bold">
                        {evt.utcIso.replace('T', ' ').slice(0, 16)}Z
                      </div>
                      <div className="text-[9px] text-slate-500">
                        MET +{evt.stepIndex}h (Day {Math.floor(evt.stepIndex / 24)})
                      </div>
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onSelectStepIndex(evt.stepIndex);
                      }}
                      className="px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 text-[10px] font-bold transition-all"
                      title="Jump mission clock to this event"
                    >
                      JUMP
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};

