'use client';

import React, { useState, useMemo, useCallback, useEffect } from 'react';
import {
  LunarSite,
  HardwareProfile,
  SolarArrayType,
  UserPersona,
} from '@/types/pluton';
import { ODESiteCalibration } from '@/types/ode';
import { LUNAR_SOUTH_POLE_SITES, HARDWARE_DIGITAL_TWINS } from '@/data/lunarDatabase';
import { computeTerrainHorizonProfile } from '@/engine/terrainHorizonEngine';
import { simulateMissionPhysics } from '@/engine/missionPhysicsEngine';
import { evaluateEphemerisState, getActiveDSNStation } from '@/engine/ephemerisSolver';
import { SidebarNav, ActiveNavTab } from '@/components/SidebarNav';
import { MissionTopHeader } from '@/components/MissionTopHeader';
import { AssessmentView } from '@/components/AssessmentView';
import { LaunchPlanningView } from '@/components/LaunchPlanningView';
import { MissionEventsView } from '@/components/MissionEventsView';
import { PolarTerrain3D } from '@/components/PolarTerrain3D';
import { SkyDomePanorama } from '@/components/SkyDomePanorama';
import { MissionTimelineGantt } from '@/components/MissionTimelineGantt';
import { LaunchSlipCarpetPlot } from '@/components/LaunchSlipCarpetPlot';
import { SiteComparatorDrawer } from '@/components/SiteComparatorDrawer';
import { EducatorStoryModal } from '@/components/EducatorStoryModal';
import { HorizonsDataCenterModal } from '@/components/HorizonsDataCenterModal';
import { CosmographiaVisualizerModal } from '@/components/CosmographiaVisualizerModal';
import { AnsysStkModal } from '@/components/AnsysStkModal';
import { OdeDatasetExplorerModal } from '@/components/OdeDatasetExplorerModal';

type ActiveModalType =
  | 'HORIZONS'
  | 'COSMOGRAPHIA'
  | 'STK'
  | 'ODE'
  | 'EDUCATOR'
  | 'COMPARATOR'
  | null;

export default function PlutonMissionWorkspace() {
  // 1. Navigation Tab State (Linear / Telemetry HUD Architecture)
  const [activeNavTab, setActiveNavTab] = useState<ActiveNavTab>('WORKSPACE');
  const [workspaceLayout, setWorkspaceLayout] = useState<'3D_LARGE' | 'SPLIT' | 'PANORAMA_LARGE'>('3D_LARGE');

  // 2. Mission Target & Hardware Configuration
  const [currentSite, setCurrentSite] = useState<LunarSite>(LUNAR_SOUTH_POLE_SITES[0]);
  const [siteB, setSiteB] = useState<LunarSite>(LUNAR_SOUTH_POLE_SITES[1]); // Malapert Massif
  const [currentHardware, setCurrentHardware] = useState<HardwareProfile>(HARDWARE_DIGITAL_TWINS[0]); // CSA LEAP Rover
  const [mastHeightM, setMastHeightM] = useState<number>(HARDWARE_DIGITAL_TWINS[0].mastHeight);
  const [arrayType, setArrayType] = useState<SolarArrayType>(HARDWARE_DIGITAL_TWINS[0].arrayType);

  // 3. Mission Timeline & Launch Slip State
  // Artemis III lunar south pole southern summer reference epoch: November 2026
  const [baselineLaunchDate] = useState<Date>(() => new Date(Date.UTC(2026, 10, 15, 0, 0, 0)));
  const [launchSlipOffsetDays, setLaunchSlipOffsetDays] = useState<number>(0);
  const [durationDays, setDurationDays] = useState<number>(30);
  const [currentStepIndex, setCurrentStepIndex] = useState<number>(0);

  // 4. UI Persona & Modals
  const [persona, setPersona] = useState<UserPersona>('engineer');
  const [activeModal, setActiveModal] = useState<ActiveModalType>(null);
  const [siteCalibration, setSiteCalibration] = useState<ODESiteCalibration | null>(null);

  // Keyboard shortcut listener for Linear-style fast tab switching (1, 2, 3, 4)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement)?.tagName?.toLowerCase();
      if (tag === 'input' || tag === 'textarea' || tag === 'select') return;
      if (e.key === '1') setActiveNavTab('WORKSPACE');
      if (e.key === '2') setActiveNavTab('ASSESSMENT');
      if (e.key === '3') setActiveNavTab('LAUNCH');
      if (e.key === '4') setActiveNavTab('EVENTS');
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Calculate actual mission launch date factoring in launch slip
  const actualMissionStartDate = useMemo(() => {
    return new Date(baselineLaunchDate.getTime() + launchSlipOffsetDays * 86400000);
  }, [baselineLaunchDate, launchSlipOffsetDays]);

  // Handler when hardware profile changes: synchronize defaults
  const handleSelectHardware = useCallback((hw: HardwareProfile) => {
    setCurrentHardware(hw);
    setMastHeightM(hw.mastHeight);
    setArrayType(hw.arrayType);
  }, []);

  // Compute terrain horizon profile for active site & mast height (<3ms)
  const terrainHorizon = useMemo(() => {
    return computeTerrainHorizonProfile(
      currentSite.id,
      currentSite.latitude,
      currentSite.longitude,
      currentSite.elevation,
      mastHeightM
    );
  }, [currentSite, mastHeightM]);

  // Simulate mission physics across the full 30-90 day window (<8ms)
  const { steps, summary } = useMemo(() => {
    return simulateMissionPhysics(
      currentSite,
      currentHardware,
      terrainHorizon,
      actualMissionStartDate,
      durationDays,
      mastHeightM,
      arrayType
    );
  }, [currentSite, currentHardware, terrainHorizon, actualMissionStartDate, durationDays, mastHeightM, arrayType]);

  // Scrubbed time & ephemeris for the currently selected hour
  const scrubbedEpoch = useMemo(() => {
    return new Date(actualMissionStartDate.getTime() + currentStepIndex * 3600000);
  }, [actualMissionStartDate, currentStepIndex]);

  const activeEphemeris = useMemo(() => {
    return evaluateEphemerisState(
      scrubbedEpoch,
      currentSite.latitude,
      currentSite.longitude,
      currentSite.elevation
    );
  }, [scrubbedEpoch, currentSite]);

  const activeDsnStation = useMemo(() => {
    return getActiveDSNStation(scrubbedEpoch);
  }, [scrubbedEpoch]);

  // CSV Telemetry Report Export Handler
  const handleExportReport = useCallback(() => {
    const headers = [
      'Step_Hour',
      'Epoch_UTC',
      'Sun_Az_deg',
      'Sun_El_deg',
      'Horizon_At_Sun_deg',
      'Sun_Delta_deg',
      'Penumbra_Fraction',
      'Generated_Power_W',
      'Earth_Az_deg',
      'Earth_El_deg',
      'Horizon_At_Earth_deg',
      'Earth_Delta_deg',
      'DTE_Comm_State',
      'Gateway_Relay_Active',
      'Joint_Viable',
      'Battery_SoC_Wh',
      'Battery_SoC_Pct',
      'Surface_Temp_K',
      'Heater_Active',
      'Net_Power_W',
    ];

    const rows = steps.map((s) => [
      s.stepIndex,
      s.utcIso,
      s.sunAzDeg.toFixed(2),
      s.sunElDeg.toFixed(2),
      s.horizonElAtSunDeg.toFixed(2),
      s.sunDeltaDeg.toFixed(2),
      s.penumbraFraction.toFixed(3),
      Math.round(s.generatedPowerW),
      s.earthAzDeg.toFixed(2),
      s.earthElDeg.toFixed(2),
      s.horizonElAtEarthDeg.toFixed(2),
      s.earthDeltaDeg.toFixed(2),
      s.dteCommState,
      s.gatewayInRelay ? 'TRUE' : 'FALSE',
      s.jointViable ? 'GO' : 'NO_GO',
      s.batterySoCWh.toFixed(1),
      s.batterySoCPct.toFixed(1),
      Math.round(s.surfaceTempK),
      s.heaterActive ? 'TRUE' : 'FALSE',
      Math.round(s.netPowerW),
    ]);

    const csvContent =
      'data:text/csv;charset=utf-8,' +
      [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute(
      'download',
      `PLUTON_Ephemeris_${currentSite.id}_${actualMissionStartDate.toISOString().split('T')[0]}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }, [steps, currentSite, actualMissionStartDate]);

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-[#040711] text-slate-100 font-sans select-none">
      {/* 1. Tactical Sidebar Navigation (Linear Dark Mode HUD) */}
      <SidebarNav
        activeTab={activeNavTab}
        onChangeTab={setActiveNavTab}
        onOpenHorizons={() => setActiveModal('HORIZONS')}
        onOpenCosmographia={() => setActiveModal('COSMOGRAPHIA')}
        onOpenStk={() => setActiveModal('STK')}
        onOpenOde={() => setActiveModal('ODE')}
        onOpenComparator={() => setActiveModal('COMPARATOR')}
        siteName={currentSite.name}
        isViable={!summary.isBatteryDepleted && summary.minBatterySoCPct > 0}
        sunlitPct={(summary.sunlitHours / summary.totalHours) * 100}
        dtePct={(summary.dteNominalHours / summary.totalHours) * 100}
      />

      {/* 2. Main Mission Operation Deck */}
      <div className="flex-1 flex flex-col min-w-0 h-screen overflow-hidden bg-[#040711]">
        {/* Compact Aerospace Top Header */}
        <MissionTopHeader
          currentSite={currentSite}
          onSelectSite={(site) => {
            setCurrentSite(site);
            setCurrentStepIndex(0);
          }}
          currentHardware={currentHardware}
          onSelectHardware={handleSelectHardware}
          persona={persona}
          onTogglePersona={setPersona}
          activeDsnStation={activeDsnStation}
          currentEpoch={scrubbedEpoch}
          onOpenEducatorModal={() => setActiveModal('EDUCATOR')}
          onExportReport={handleExportReport}
          ephemerisState={activeEphemeris}
          mastHeightM={mastHeightM}
        />

        {/* Dynamic Viewport Container with Smooth Custom Scrollbar */}
        <main className="flex-1 overflow-y-auto p-3.5 flex flex-col gap-3.5 bg-[#040711]">
          {activeNavTab === 'WORKSPACE' && (
            <>
              {/* Workspace Layout Control Strip */}
              <div className="w-full flex items-center justify-between bg-[#060a14] px-3 py-1.5 rounded-lg border border-slate-800 text-xs font-mono">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">TACTICAL HUD VIEWPORT:</span>
                  <span className="text-[10px] text-amber-300 font-bold">
                    {workspaceLayout === '3D_LARGE' ? '3D EXPANDED (FULL PAGE)' : workspaceLayout === 'SPLIT' ? 'SPLIT DUAL (50/50)' : '360° SKYDOME EXPANDED'}
                  </span>
                </div>
                <div className="flex items-center gap-1 bg-[#090e1c] p-0.5 rounded border border-slate-700 text-[10px]">
                  <button
                    onClick={() => setWorkspaceLayout('3D_LARGE')}
                    className={`px-2.5 py-1 rounded font-bold transition-all cursor-pointer ${
                      workspaceLayout === '3D_LARGE'
                        ? 'bg-amber-500 text-slate-950 shadow-sm'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    3D EXPANDED (FIT PAGE)
                  </button>
                  <button
                    onClick={() => setWorkspaceLayout('SPLIT')}
                    className={`px-2.5 py-1 rounded font-bold transition-all cursor-pointer ${
                      workspaceLayout === 'SPLIT'
                        ? 'bg-amber-500 text-slate-950 shadow-sm'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    SPLIT VIEW
                  </button>
                  <button
                    onClick={() => setWorkspaceLayout('PANORAMA_LARGE')}
                    className={`px-2.5 py-1 rounded font-bold transition-all cursor-pointer ${
                      workspaceLayout === 'PANORAMA_LARGE'
                        ? 'bg-amber-500 text-slate-950 shadow-sm'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    PANORAMA EXPANDED
                  </button>
                </div>
              </div>

              {/* Dynamic Viewport Row: High-resolution & Expanded to fit the screen */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-3.5 min-h-[620px] lg:h-[calc(100vh-210px)]">
                {/* 3D Polar Terrain Panel */}
                <div
                  className={`flex flex-col h-full transition-all ${
                    workspaceLayout === '3D_LARGE'
                      ? 'lg:col-span-12'
                      : workspaceLayout === 'SPLIT'
                      ? 'lg:col-span-6'
                      : 'hidden'
                  }`}
                >
                  <PolarTerrain3D
                    activeSite={currentSite}
                    onSelectSite={setCurrentSite}
                    ephemerisState={activeEphemeris}
                    mastHeightM={mastHeightM}
                  />
                </div>

                {/* 360° SkyDome Panorama Panel */}
                <div
                  className={`flex flex-col h-full transition-all ${
                    workspaceLayout === 'PANORAMA_LARGE'
                      ? 'lg:col-span-12'
                      : workspaceLayout === 'SPLIT'
                      ? 'lg:col-span-6'
                      : 'hidden'
                  }`}
                >
                  <SkyDomePanorama
                    site={currentSite}
                    hardware={currentHardware}
                    horizonProfile={terrainHorizon}
                    currentEphemeris={activeEphemeris}
                    mastHeightM={mastHeightM}
                    onMastHeightChange={setMastHeightM}
                    arrayType={arrayType}
                    onArrayTypeChange={setArrayType}
                    timelineSteps={steps}
                    currentStepIndex={currentStepIndex}
                  />
                </div>
              </div>

              {/* When in 3D_LARGE or PANORAMA_LARGE, render the other view docked below */}
              {workspaceLayout === '3D_LARGE' && (
                <div className="w-full">
                  <SkyDomePanorama
                    site={currentSite}
                    hardware={currentHardware}
                    horizonProfile={terrainHorizon}
                    currentEphemeris={activeEphemeris}
                    mastHeightM={mastHeightM}
                    onMastHeightChange={setMastHeightM}
                    arrayType={arrayType}
                    onArrayTypeChange={setArrayType}
                    timelineSteps={steps}
                    currentStepIndex={currentStepIndex}
                  />
                </div>
              )}

              {workspaceLayout === 'PANORAMA_LARGE' && (
                <div className="w-full h-[600px]">
                  <PolarTerrain3D
                    activeSite={currentSite}
                    onSelectSite={setCurrentSite}
                    ephemerisState={activeEphemeris}
                    mastHeightM={mastHeightM}
                  />
                </div>
              )}

              {/* Synchronized Mission Viability Gantt Scrubber */}
              <div className="w-full">
                <MissionTimelineGantt
                  summary={summary}
                  steps={steps}
                  currentStepIndex={currentStepIndex}
                  onSelectStepIndex={setCurrentStepIndex}
                  hardware={currentHardware}
                  site={currentSite}
                  durationDays={durationDays}
                  onDurationChange={(d) => {
                    setDurationDays(d);
                    setCurrentStepIndex(0);
                  }}
                />
              </div>

              {/* Bottom Section: Launch Slip Simulator & 2D Carpet Plot */}
              <div className="w-full">
                <LaunchSlipCarpetPlot
                  site={currentSite}
                  hardware={currentHardware}
                  horizonProfile={terrainHorizon}
                  baselineDate={baselineLaunchDate}
                  onSelectSlipOffset={(offset) => {
                    setLaunchSlipOffsetDays(offset);
                    setCurrentStepIndex(0);
                  }}
                  currentSlipOffset={launchSlipOffsetDays}
                />
              </div>
            </>
          )}

          {activeNavTab === 'ASSESSMENT' && (
            <AssessmentView
              site={currentSite}
              hardware={currentHardware}
              summary={summary}
              horizonProfile={terrainHorizon}
              steps={steps}
              mastHeightM={mastHeightM}
              onOpenComparator={() => setActiveModal('COMPARATOR')}
              onOpenStk={() => setActiveModal('STK')}
            />
          )}

          {activeNavTab === 'LAUNCH' && (
            <LaunchPlanningView
              site={currentSite}
              hardware={currentHardware}
              horizonProfile={terrainHorizon}
              baselineDate={baselineLaunchDate}
              currentSlipOffset={launchSlipOffsetDays}
              onSelectSlipOffset={(offset) => {
                setLaunchSlipOffsetDays(offset);
                setCurrentStepIndex(0);
              }}
            />
          )}

          {activeNavTab === 'EVENTS' && (
            <MissionEventsView
              steps={steps}
              site={currentSite}
              hardware={currentHardware}
              currentStepIndex={currentStepIndex}
              onSelectStepIndex={(idx) => {
                setCurrentStepIndex(idx);
              }}
            />
          )}
        </main>

        {/* Tactical Telemetry HUD Footer */}
        <footer className="w-full bg-[#03050d] border-t border-slate-800/80 px-4 py-2 text-[10px] font-mono text-slate-400 flex flex-wrap justify-between items-center gap-2 select-none z-10">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              <span className="text-emerald-400 font-bold uppercase tracking-wider">
                PLUTON CORE v2.8 // ACTIVE TELEMETRY
              </span>
            </div>
            <span className="text-slate-700">|</span>
            <span className="text-slate-400">JPL DE441 Ephemeris Standard</span>
            <span className="text-slate-700">|</span>
            <span className="text-slate-400">LOLA 120km Curvature-Corrected Horizon Profile</span>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-slate-400">
              Active View: <strong className="text-amber-400 font-bold uppercase">{activeNavTab}</strong>
            </span>
            <span className="text-slate-700">|</span>
            <span className="text-slate-400">
              Shortcuts:{' '}
              <kbd className="px-1 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700 text-[9px] font-bold">1</kbd> HUD{' '}
              <kbd className="px-1 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700 text-[9px] font-bold">2</kbd> Assess{' '}
              <kbd className="px-1 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700 text-[9px] font-bold">3</kbd> Launch{' '}
              <kbd className="px-1 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700 text-[9px] font-bold">4</kbd> Events
            </span>
          </div>
        </footer>
      </div>

      {/* Modals mounted at document root */}
      <SiteComparatorDrawer
        isOpen={activeModal === 'COMPARATOR'}
        onClose={() => setActiveModal(null)}
        siteA={currentSite}
        siteB={siteB}
        onSelectSiteA={setCurrentSite}
        onSelectSiteB={setSiteB}
        hardware={currentHardware}
        startDate={actualMissionStartDate}
        onApplySiteAsActive={(site) => {
          setCurrentSite(site);
          setActiveModal(null);
        }}
      />

      <EducatorStoryModal
        isOpen={activeModal === 'EDUCATOR'}
        onClose={() => setActiveModal(null)}
      />

      <HorizonsDataCenterModal
        isOpen={activeModal === 'HORIZONS'}
        onClose={() => setActiveModal(null)}
        currentSite={currentSite}
        currentEpoch={scrubbedEpoch}
      />

      {activeEphemeris && (
        <CosmographiaVisualizerModal
          isOpen={activeModal === 'COSMOGRAPHIA'}
          onClose={() => setActiveModal(null)}
          currentSite={currentSite}
          currentHardware={currentHardware}
          currentEphemeris={activeEphemeris}
          currentEpoch={scrubbedEpoch}
        />
      )}

      {activeEphemeris && terrainHorizon && steps && (
        <AnsysStkModal
          isOpen={activeModal === 'STK'}
          onClose={() => setActiveModal(null)}
          currentSite={currentSite}
          currentHardware={currentHardware}
          currentEphemeris={activeEphemeris}
          horizonProfile={terrainHorizon}
          steps={steps}
          currentEpoch={scrubbedEpoch}
        />
      )}

      <OdeDatasetExplorerModal
        isOpen={activeModal === 'ODE'}
        onClose={() => setActiveModal(null)}
        currentSite={currentSite}
        onApplySiteCalibration={setSiteCalibration}
      />
    </div>
  );
}
