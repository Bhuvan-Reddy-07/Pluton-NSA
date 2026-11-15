'use client';

import React, { useState, useEffect } from 'react';
import {
  X,
  BookOpen,
  Globe,
  Sun,
  BatteryCharging,
  ShieldCheck,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  Info,
  Radio,
} from 'lucide-react';

interface EducatorStoryModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface StoryLesson {
  id: string;
  title: string;
  subtitle: string;
  badge: string;
  diagramType: 'LIBRATION' | 'ROVER_NIGHT' | 'SHADOW_CONTRAST';
  paragraphs: string[];
  takeaways: string[];
}

const LESSONS: StoryLesson[] = [
  {
    id: 'lunar-libration',
    title: 'Why Earth Wobbles: The 27-Day Polar Libration Dance',
    subtitle: 'Understanding the orbital mechanics that cause Earth to bob behind lunar mountains.',
    badge: 'ASTRODYNAMICS 101',
    diagramType: 'LIBRATION',
    paragraphs: [
      'If you stood in the middle of the Moon facing Earth (the lunar equator), Earth would hang nearly motionless high in the sky. But at the Moon’s South Pole, you are standing on the very edge of the world, where Earth grazes the horizon between 0° and 8° elevation.',
      'Because the Moon’s orbit around Earth is tilted by 5.145° and is slightly elliptical (eccentricity e = 0.0549), the Moon appears to nod up and down (libration in latitude, ±6.68°) and shake side-to-side (libration in longitude, ±7.9°) over a 27.3-day cycle.',
      'To an astronaut or rover at the South Pole, Earth traces a graceful, looping figure-eight pattern in the sky. As Earth dips below local mountain massifs like Malapert, radio beams cannot bend through solid rock — creating multi-day communications blackouts unless rescued by a relay satellite like Lunar Gateway!',
    ],
    takeaways: [
      'Earth is not stationary at the lunar poles; it oscillates over ±7.9° every month.',
      'Local mountains (4,000m tall) periodically block direct line-of-sight to NASA Deep Space Network stations.',
      'The Artemis Lunar Gateway in high NRHO orbit acts as a celestial cell tower when Earth dips below the ridge.',
    ],
  },
  {
    id: 'csa-rover-survival',
    title: 'How the Canadian Lunar Rover Survives a 150-Hour Polar Night',
    subtitle: 'Thermal management, survival heaters, and vertical solar masts at -200°C.',
    badge: 'ENGINEERING & ISRU',
    diagramType: 'ROVER_NIGHT',
    paragraphs: [
      'The Canadian Space Agency (CSA) Lunar Exploration Accelerator Program (LEAP) rover is an autonomous 30 kg prospecting scout designed to search for water-ice near permanently shadowed craters.',
      'Unlike equatorial missions where sunlight is overhead, polar sunlight hits the lunar ground at a grazing angle of only 1.5°. A traditional rover with flat top-deck solar panels receives virtually zero energy due to cosine loss (sin(1.5°) ≈ 0.026, or just 2.6% of sunlight!).',
      'By erecting a vertical cylindrical solar mast, the CSA rover captures grazing polar sunlight at peak efficiency (cos(1.5°) ≈ 0.999, or 99.9% power). During long shadow intervals, the rover shuts down non-essential avionics and sips stored battery power to run survival heaters, preventing cryogenic freeze-out.',
    ],
    takeaways: [
      'Vertical solar arrays generate up to 38× more power than flat deck panels at the lunar poles.',
      'Cryogenic cold traps reach 40 Kelvin (-233°C), brittle enough to shatter metal without electric heaters.',
      'Precise mission timeline simulation allows rovers to pre-charge batteries to 100% before entering planned crater shadows.',
    ],
  },
  {
    id: 'earth-vs-moon-shadows',
    title: 'Earth vs. Moon Shadows: Penumbra vs Atmospheric Scattering',
    subtitle: 'Why lunar shadows are razor-sharp cold abysses compared to soft shadows on Earth.',
    badge: 'PLANETARY PHYSICS',
    diagramType: 'SHADOW_CONTRAST',
    paragraphs: [
      'On Earth, when you stand under a tree or building, the shadow is never completely black. Molecules of nitrogen and oxygen in our thick atmosphere scatter blue sunlight in all directions (Rayleigh scattering), softly lighting up the shadows with ambient skylight.',
      'The Moon has zero atmosphere — hard vacuum. Sunlight travels in straight, uninterrupted lines. If direct sunlight is blocked by a rock, the shadow behind it is pitch-black, plunging in temperature by more than 200°C across a distance of just a few centimeters!',
      'The only softness comes from the Sun’s finite size in the sky (0.533° apparent diameter). As the Sun gradually slips behind a crater rim, it creates a narrow penumbral partial-light zone where solar panels receive 10% to 90% power, giving astronauts precious time to react.',
    ],
    takeaways: [
      'No atmosphere means zero diffused blue skylight: lunar shadows are pitch-black voids.',
      'Temperatures jump from +100°C in direct sun to -150°C in shadow within inches.',
      'The 0.533° apparent solar disk creates a partial penumbra that PLUTON calculates down to 0.01% precision.',
    ],
  },
];

export const EducatorStoryModal: React.FC<EducatorStoryModalProps> = ({ isOpen, onClose }) => {
  const [currentLessonIdx, setCurrentLessonIdx] = useState(0);

  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const lesson = LESSONS[currentLessonIdx];

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-2 sm:p-4 select-none"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="bg-[#0b1021] border border-cyan-500/40 rounded-xl max-w-4xl w-full max-h-[90vh] flex flex-col shadow-2xl overflow-hidden font-mono text-slate-200">
        {/* Top Header */}
        <div className="flex-shrink-0 flex items-center justify-between px-5 py-3.5 border-b border-slate-800 bg-[#060913]">
          <div className="flex items-center gap-3">
            <div className="relative w-8 h-8 rounded-lg overflow-hidden border border-cyan-500/50 shadow-md shadow-cyan-500/20 bg-[#080d1a] flex-shrink-0">
              <img
                src="/pluton-logo.png"
                alt="PLUTON Profile"
                className="w-full h-full object-cover"
              />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-sm font-bold text-slate-100 tracking-wider">
                  PLUTON EXPLORER ACADEMY
                </h2>
                <span className="text-[10px] px-1.5 py-0.2 rounded bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 font-bold">
                  {lesson.badge}
                </span>
              </div>
              <p className="text-[10px] text-slate-400">
                Interactive Visual Lessons for Mission Specialists & Public Explorers
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors cursor-pointer"
            title="Close (Esc)"
            aria-label="Close Explorer Academy"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Lesson Tabs */}
        <div className="flex items-center border-b border-slate-800 bg-[#080d1a] px-3 gap-1 overflow-x-auto">
          {LESSONS.map((l, idx) => (
            <button
              key={l.id}
              onClick={() => setCurrentLessonIdx(idx)}
              className={`px-3 py-2 text-xs font-bold transition-all border-b-2 whitespace-nowrap ${
                currentLessonIdx === idx
                  ? 'border-cyan-400 text-cyan-300 bg-cyan-950/20'
                  : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              {idx + 1}. {l.title.split(':')[0]}
            </button>
          ))}
        </div>

        {/* Main Lesson Body */}
        <div className="flex-1 overflow-y-auto p-5 space-y-5">
          {/* Title Banner */}
          <div>
            <h3 className="text-base font-bold text-cyan-300">{lesson.title}</h3>
            <p className="text-xs text-slate-400 mt-0.5">{lesson.subtitle}</p>
          </div>

          {/* Interactive Visual SVG Diagram */}
          <div className="bg-[#030612] p-4 rounded-xl border border-slate-800 flex items-center justify-center min-h-[200px]">
            {lesson.diagramType === 'LIBRATION' && (
              <svg viewBox="0 0 500 180" className="w-full max-w-lg h-auto">
                <defs>
                  <linearGradient id="lunarMtn" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#475569" />
                    <stop offset="100%" stopColor="#0f172a" />
                  </linearGradient>
                </defs>
                {/* Space Background */}
                <rect width="500" height="180" fill="#030612" />

                {/* Jagged Mountain Silhouette */}
                <polygon points="0,180 80,120 140,140 210,85 280,130 360,95 440,150 500,110 500,180" fill="url(#lunarMtn)" />
                <line x1="0" y1="130" x2="500" y2="130" stroke="#334155" strokeWidth="1" strokeDasharray="3 3" />
                <text x="490" y="125" textAnchor="end" fill="#64748b" fontSize="8" fontFamily="monospace">
                  0° HORIZON LEVEL
                </text>

                {/* Figure-8 Libration Curve */}
                <path
                  d="M 210 60 C 260 30, 260 110, 210 85 C 160 60, 160 140, 210 115"
                  fill="none"
                  stroke="#06b6d4"
                  strokeWidth="2.5"
                  strokeDasharray="4 4"
                />
                <circle cx="210" cy="60" r="10" fill="#0891b2" stroke="#67e8f9" strokeWidth="2" />
                <circle cx="210" cy="60" r="3" fill="#ffffff" />
                <text x="210" y="42" textAnchor="middle" fill="#67e8f9" fontSize="10" fontFamily="monospace" fontWeight="bold">
                  EARTH (HIGH LIBRA: +7.9°)
                </text>

                {/* Occluded Earth Marker */}
                <circle cx="180" cy="125" r="7" fill="#dc2626" stroke="#f87171" strokeWidth="1.5" opacity="0.8" />
                <text x="180" y="145" textAnchor="middle" fill="#f87171" fontSize="9" fontFamily="monospace">
                  OCCLUDED (BLACKOUT)
                </text>

                {/* Gateway Satellite High Arc */}
                <circle cx="340" cy="30" r="5" fill="#a855f7" stroke="#e9d5ff" strokeWidth="1.5" />
                <text x="340" y="20" textAnchor="middle" fill="#c084fc" fontSize="9" fontFamily="monospace">
                  GATEWAY NRHO RELAY (+75°)
                </text>
                <line x1="340" y1="35" x2="210" y2="130" stroke="#a855f7" strokeWidth="1" strokeDasharray="2 2" />
              </svg>
            )}

            {lesson.diagramType === 'ROVER_NIGHT' && (
              <svg viewBox="0 0 500 180" className="w-full max-w-lg h-auto">
                <rect width="500" height="180" fill="#030612" />

                {/* Surface Ground */}
                <line x1="0" y1="140" x2="500" y2="140" stroke="#475569" strokeWidth="2" />

                {/* Grazing Sunlight Rays at 1.5° */}
                <line x1="0" y1="125" x2="480" y2="138" stroke="#f59e0b" strokeWidth="2" />
                <line x1="0" y1="110" x2="480" y2="123" stroke="#f59e0b" strokeWidth="2" />
                <text x="15" y="100" fill="#fbbf24" fontSize="10" fontFamily="monospace" fontWeight="bold">
                  GRAZING SUNLIGHT (1.5° ELEVATION)
                </text>

                {/* Rover 1: Flat Deck (Equatorial design) */}
                <g transform="translate(120, 110)">
                  <rect x="0" y="15" width="40" height="15" fill="#334155" rx="2" />
                  <line x1="0" y1="15" x2="40" y2="15" stroke="#ef4444" strokeWidth="3" />
                  <circle cx="8" cy="30" r="4" fill="#64748b" />
                  <circle cx="32" cy="30" r="4" fill="#64748b" />
                  <text x="20" y="5" textAnchor="middle" fill="#ef4444" fontSize="8" fontFamily="monospace">
                    FLAT DECK (2.6% POWER)
                  </text>
                </g>

                {/* Rover 2: CSA LEAP Rover with Vertical Mast */}
                <g transform="translate(320, 70)">
                  <rect x="0" y="55" width="45" height="15" fill="#1e293b" rx="2" />
                  <line x1="22" y1="15" x2="22" y2="55" stroke="#10b981" strokeWidth="4" />
                  <circle cx="22" cy="15" r="3" fill="#34d399" />
                  <circle cx="10" cy="70" r="4" fill="#64748b" />
                  <circle cx="35" cy="70" r="4" fill="#64748b" />
                  <text x="22" y="5" textAnchor="middle" fill="#34d399" fontSize="9" fontFamily="monospace" fontWeight="bold">
                    VERTICAL MAST (99.9% POWER!)
                  </text>
                </g>
              </svg>
            )}

            {lesson.diagramType === 'SHADOW_CONTRAST' && (
              <svg viewBox="0 0 500 180" className="w-full max-w-lg h-auto">
                <rect width="500" height="180" fill="#030612" />

                {/* Earth Side (Diffused skylight) */}
                <g transform="translate(40, 20)">
                  <rect width="180" height="140" fill="#0c4a6e" rx="6" stroke="#0284c7" strokeWidth="1" />
                  <text x="90" y="20" textAnchor="middle" fill="#7dd3fc" fontSize="10" fontFamily="monospace" fontWeight="bold">
                    EARTH (WITH ATMOSPHERE)
                  </text>
                  <circle cx="90" cy="70" r="24" fill="#0369a1" />
                  <path d="M 90 94 L 140 130 L 40 130 Z" fill="#075985" fillOpacity="0.6" />
                  <text x="90" y="115" textAnchor="middle" fill="#bae6fd" fontSize="8" fontFamily="monospace">
                    Blue Sky Scattering (Soft Shadow)
                  </text>
                </g>

                {/* Moon Side (Hard Vacuum & Penumbra) */}
                <g transform="translate(280, 20)">
                  <rect width="180" height="140" fill="#020408" rx="6" stroke="#475569" strokeWidth="1" />
                  <text x="90" y="20" textAnchor="middle" fill="#f59e0b" fontSize="10" fontFamily="monospace" fontWeight="bold">
                    MOON (HARD VACUUM)
                  </text>
                  <circle cx="90" cy="70" r="24" fill="#f59e0b" />
                  <path d="M 90 94 L 140 130 L 40 130 Z" fill="#000000" stroke="#f59e0b" strokeWidth="0.5" />
                  <text x="90" y="115" textAnchor="middle" fill="#ef4444" fontSize="8" fontFamily="monospace">
                    Pitch Black (40 K Cryo Trap)
                  </text>
                </g>
              </svg>
            )}
          </div>

          {/* Explanation Text */}
          <div className="space-y-2.5 text-xs text-slate-300 leading-relaxed font-sans">
            {lesson.paragraphs.map((p, idx) => (
              <p key={idx}>{p}</p>
            ))}
          </div>

          {/* Takeaway Box */}
          <div className="bg-[#060913] p-3.5 rounded-lg border border-cyan-500/30 text-xs">
            <div className="flex items-center gap-2 font-bold text-cyan-300 mb-2 font-mono">
              <Sparkles className="w-4 h-4 text-cyan-400" />
              <span>CORE TAKEAWAYS FOR ARTEMIS CREW & MISSION PLANNERS</span>
            </div>
            <ul className="space-y-1.5 text-slate-300 text-[11px] list-disc pl-4 font-mono">
              {lesson.takeaways.map((t, idx) => (
                <li key={idx}>{t}</li>
              ))}
            </ul>
          </div>
        </div>

        {/* Footer Navigation */}
        <div className="px-5 py-3 border-t border-slate-800 bg-[#060913] flex items-center justify-between">
          <button
            onClick={() => setCurrentLessonIdx(Math.max(0, currentLessonIdx - 1))}
            disabled={currentLessonIdx === 0}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded bg-slate-800 hover:bg-slate-700 disabled:opacity-40 text-xs font-bold text-slate-200 transition-colors"
          >
            <ChevronLeft className="w-4 h-4" />
            <span>PREVIOUS LESSON</span>
          </button>

          <span className="text-xs text-slate-400 font-mono">
            Lesson {currentLessonIdx + 1} of {LESSONS.length}
          </span>

          <button
            onClick={() => {
              if (currentLessonIdx < LESSONS.length - 1) {
                setCurrentLessonIdx(currentLessonIdx + 1);
              } else {
                onClose();
              }
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded bg-cyan-600 hover:bg-cyan-500 text-xs font-bold text-white transition-colors"
          >
            <span>{currentLessonIdx < LESSONS.length - 1 ? 'NEXT LESSON' : 'START EXPLORING'}</span>
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};

