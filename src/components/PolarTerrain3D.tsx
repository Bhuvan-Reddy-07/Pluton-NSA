'use client';

import React, { useRef, useState, useMemo } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Html, Line, Stars } from '@react-three/drei';
import * as THREE from 'three';
import {
  Layers,
  Sun,
  Globe,
  Compass,
  Crosshair,
  ExternalLink,
  MapPin,
  RefreshCw,
  Maximize2,
  Minimize2,
  Columns,
  Box,
  Eye,
  Rocket,
  Orbit,
  Sparkles,
  Copy,
  Check,
  Radio as RadioIcon,
  Navigation,
} from 'lucide-react';
import { LunarSite, EphemerisState } from '@/types/pluton';
import { LUNAR_SOUTH_POLE_SITES } from '@/data/lunarDatabase';
import { getLolaSyntheticElevationM } from '@/engine/terrainHorizonEngine';
import {
  buildQuickMapUrl,
  buildQuickMapProxyUrl,
  QuickMapZoomLevel,
  latLonToSouthPoleStereographic,
} from '@/engine/quickmapService';
import {
  buildMoonTrekUrl,
  buildMoonTrekProxyUrl,
  MoonTrekZoomLevel,
  NASA_MOON_TREK_DEFAULT_URL,
} from '@/engine/moonTrekService';
import { NasaLroMoonModel } from '@/components/NasaLroMoonModel';

type TerrainOverlayMode = 'DEM' | 'ILLUMINATION' | 'PSR' | 'SLOPE';
type VisualMappingMode = 'THREE_JS_3D' | 'NASA_LRO_GLOBE' | 'NASA_MOON_TREK' | 'LROC_QUICKMAP' | 'SPLIT_VIEW';

interface PolarTerrain3DProps {
  activeSite: LunarSite;
  onSelectSite: (site: LunarSite) => void;
  ephemerisState: EphemerisState;
  mastHeightM: number;
}

// Convert Polar coordinates (lat, lon, elevationM) to 3D world space coordinates
function polarToWorld(latDeg: number, lonDeg: number, elevM: number = 0): [number, number, number] {
  const r = 90.0 + latDeg; // 0 at -90° (South pole), 10 at -80°
  const lonRad = (lonDeg * Math.PI) / 180.0;
  const scale = 2.4;
  const x = r * scale * Math.sin(lonRad);
  const z = -r * scale * Math.cos(lonRad);
  const y = (elevM / 1000.0) * 0.45;
  return [x, y, z];
}

// Inverse conversion from 3D world space (x, z) to lunar polar (lat, lon)
function worldToPolar(x: number, z: number): { lat: number; lon: number } {
  const scale = 2.4;
  const r = Math.sqrt(x * x + z * z) / scale;
  let lat = -(90.0 - Math.min(15.0, r));
  let lonRad = Math.atan2(x, -z);
  let lonDeg = (lonRad * 180.0) / Math.PI;
  if (lonDeg < 0) lonDeg += 360.0;
  return { lat, lon: lonDeg };
}

// The 3D South Pole DEM Heightmap Mesh
const LunarMesh: React.FC<{
  overlay: TerrainOverlayMode;
  onTerrainClick: (lat: number, lon: number, elev: number) => void;
}> = ({ overlay, onTerrainClick }) => {
  const meshRef = useRef<THREE.Mesh>(null);

  const { geometry } = useMemo(() => {
    const segments = 120;
    const geom = new THREE.PlaneGeometry(50, 50, segments, segments);
    geom.rotateX(-Math.PI / 2);

    const pos = geom.attributes.position;
    const count = pos.count;
    const colors = new Float32Array(count * 3);
    const elevMap: number[] = new Array(count);

    const tempV = new THREE.Vector3();

    for (let i = 0; i < count; i++) {
      tempV.fromBufferAttribute(pos, i);
      const polar = worldToPolar(tempV.x, tempV.z);
      const elevM = getLolaSyntheticElevationM(polar.lat, polar.lon);
      elevMap[i] = elevM;
      pos.setY(i, (elevM / 1000.0) * 0.45);
    }

    geom.computeVertexNormals();
    const normals = geom.attributes.normal;

    for (let i = 0; i < count; i++) {
      const elevM = elevMap[i];
      const normY = normals.getY(i);
      const slopeDeg = Math.acos(Math.max(0, Math.min(1, normY))) * (180.0 / Math.PI);

      let r = 0.5, g = 0.5, b = 0.5;

      if (overlay === 'DEM') {
        if (elevM < -2000) {
          r = 0.1; g = 0.15; b = 0.35;
        } else if (elevM < 0) {
          const t = (elevM + 2000) / 2000;
          r = 0.15 + t * 0.2; g = 0.2 + t * 0.2; b = 0.4 - t * 0.1;
        } else if (elevM < 2500) {
          const t = elevM / 2500;
          r = 0.35 + t * 0.25; g = 0.35 + t * 0.25; b = 0.35 + t * 0.2;
        } else {
          const t = Math.min(1, (elevM - 2500) / 2900);
          r = 0.6 + t * 0.35; g = 0.6 + t * 0.35; b = 0.6 + t * 0.38;
        }
      } else if (overlay === 'ILLUMINATION') {
        if (elevM > 1800) {
          r = 0.95; g = 0.72; b = 0.2;
        } else if (elevM > 500) {
          r = 0.65; g = 0.5; b = 0.25;
        } else if (elevM > -1500) {
          r = 0.25; g = 0.28; b = 0.4;
        } else {
          r = 0.05; g = 0.08; b = 0.2;
        }
      } else if (overlay === 'PSR') {
        if (elevM < -1800) {
          r = 0.05; g = 0.85; b = 0.95;
        } else if (elevM < -800) {
          r = 0.2; g = 0.4; b = 0.7;
        } else {
          r = 0.12; g = 0.15; b = 0.2;
        }
      } else if (overlay === 'SLOPE') {
        if (slopeDeg > 18.0) {
          r = 0.95; g = 0.15; b = 0.15;
        } else if (slopeDeg > 12.0) {
          r = 0.95; g = 0.75; b = 0.1;
        } else {
          r = 0.1; g = 0.8; b = 0.4;
        }
      }

      colors[i * 3] = r;
      colors[i * 3 + 1] = g;
      colors[i * 3 + 2] = b;
    }

    geom.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    return { geometry: geom, elevations: elevMap };
  }, [overlay]);

  const handlePointerDown = (e: any) => {
    e.stopPropagation();
    if (e.point) {
      const polar = worldToPolar(e.point.x, e.point.z);
      const elev = getLolaSyntheticElevationM(polar.lat, polar.lon);
      onTerrainClick(polar.lat, polar.lon, elev);
    }
  };

  return (
    <mesh ref={meshRef} geometry={geometry} onPointerDown={handlePointerDown} receiveShadow castShadow>
      <meshStandardMaterial vertexColors roughness={0.88} metalness={0.08} flatShading={false} />
    </mesh>
  );
};

// 3D Directional Vectors & Markers
const SceneOverlays: React.FC<{
  activeSite: LunarSite;
  ephemerisState: EphemerisState;
  mastHeightM: number;
}> = ({ activeSite, ephemerisState, mastHeightM }) => {
  const sitePos = useMemo(() => {
    return polarToWorld(activeSite.latitude, activeSite.longitude, activeSite.elevation);
  }, [activeSite]);

  const sunVector = useMemo(() => {
    const azRad = (ephemerisState.sun.azimuthDeg * Math.PI) / 180.0;
    const elRad = (ephemerisState.sun.elevationTopocentricDeg * Math.PI) / 180.0;
    const len = 14.0;
    const dx = len * Math.cos(elRad) * Math.sin(azRad);
    const dz = -len * Math.cos(elRad) * Math.cos(azRad);
    const dy = len * Math.sin(elRad);
    return new THREE.Vector3(sitePos[0] + dx, sitePos[1] + dy, sitePos[2] + dz);
  }, [sitePos, ephemerisState.sun]);

  const earthVector = useMemo(() => {
    const azRad = (ephemerisState.earth.azimuthDeg * Math.PI) / 180.0;
    const elRad = (ephemerisState.earth.elevationTopocentricDeg * Math.PI) / 180.0;
    const len = 12.0;
    const dx = len * Math.cos(elRad) * Math.sin(azRad);
    const dz = -len * Math.cos(elRad) * Math.cos(azRad);
    const dy = len * Math.sin(elRad);
    return new THREE.Vector3(sitePos[0] + dx, sitePos[1] + dy, sitePos[2] + dz);
  }, [sitePos, ephemerisState.earth]);

  return (
    <group>
      <directionalLight
        position={[sunVector.x, Math.max(sitePos[1] + 1.2, sunVector.y), sunVector.z]}
        target-position={sitePos}
        intensity={2.8}
        castShadow
        shadow-mapSize-width={2048}
        shadow-mapSize-height={2048}
        shadow-bias={-0.0005}
        color="#fffbeb"
      />
      <ambientLight intensity={0.12} color="#93c5fd" />

      {/* Target Site 3D Pin & Hardware Mast */}
      <group position={sitePos}>
        <mesh position={[0, (mastHeightM / 1000.0) * 0.45 * 40 + 0.2, 0]}>
          <cylinderGeometry args={[0.04, 0.06, 0.4 + mastHeightM * 0.05, 8]} />
          <meshStandardMaterial color="#f59e0b" emissive="#d97706" emissiveIntensity={0.6} />
        </mesh>
        <mesh position={[0, 0.5 + mastHeightM * 0.05, 0]}>
          <sphereGeometry args={[0.18, 16, 16]} />
          <meshStandardMaterial color="#f59e0b" emissive="#fbbf24" emissiveIntensity={1.2} />
        </mesh>
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.04, 0]}>
          <ringGeometry args={[0.55, 0.65, 32]} />
          <meshBasicMaterial color="#10b981" side={THREE.DoubleSide} transparent opacity={0.75} />
        </mesh>
        <Html distanceFactor={22} position={[0, 0.9 + mastHeightM * 0.05, 0]} center>
          <div className="bg-[#0f172a]/90 backdrop-blur-sm border border-amber-400 text-amber-300 font-mono text-[10px] px-2 py-0.5 rounded shadow-lg whitespace-nowrap pointer-events-none flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping"></span>
            <span className="font-bold">{activeSite.name}</span>
            <span className="text-slate-400">({activeSite.elevation}m)</span>
          </div>
        </Html>
      </group>

      {/* Sun Vector */}
      <Line points={[sitePos, [sunVector.x, sunVector.y, sunVector.z]]} color="#f59e0b" lineWidth={2.5} />
      <mesh position={[sunVector.x, sunVector.y, sunVector.z]}>
        <sphereGeometry args={[0.35, 16, 16]} />
        <meshBasicMaterial color="#f59e0b" />
        <Html distanceFactor={24} position={[0, 0.5, 0]} center>
          <div className="bg-amber-500/90 text-slate-950 font-mono font-bold text-[9px] px-1.5 py-0.5 rounded shadow whitespace-nowrap">
            SUN ({ephemerisState.sun.elevationTopocentricDeg.toFixed(1)}°)
          </div>
        </Html>
      </mesh>

      {/* Earth Vector */}
      <Line points={[sitePos, [earthVector.x, earthVector.y, earthVector.z]]} color="#06b6d4" lineWidth={2.2} dashed={true} dashScale={2} />
      <mesh position={[earthVector.x, earthVector.y, earthVector.z]}>
        <sphereGeometry args={[0.3, 16, 16]} />
        <meshBasicMaterial color="#06b6d4" />
        <Html distanceFactor={24} position={[0, 0.5, 0]} center>
          <div className="bg-cyan-600/90 text-white font-mono font-bold text-[9px] px-1.5 py-0.5 rounded shadow whitespace-nowrap">
            EARTH DTE ({ephemerisState.earth.elevationTopocentricDeg.toFixed(1)}°)
          </div>
        </Html>
      </mesh>
    </group>
  );
};

// Curated Landing Site Markers
const SitePins: React.FC<{
  sites: LunarSite[];
  activeSiteId: string;
  onSelectSite: (site: LunarSite) => void;
}> = ({ sites, activeSiteId, onSelectSite }) => {
  return (
    <group>
      {sites.map((site) => {
        if (site.id === activeSiteId) return null;
        const pos = polarToWorld(site.latitude, site.longitude, site.elevation);
        return (
          <group
            key={site.id}
            position={pos}
            onClick={(e) => {
              e.stopPropagation();
              onSelectSite(site);
            }}
          >
            <mesh position={[0, 0.15, 0]}>
              <cylinderGeometry args={[0.03, 0.03, 0.3, 6]} />
              <meshBasicMaterial color="#94a3b8" />
            </mesh>
            <mesh position={[0, 0.3, 0]}>
              <sphereGeometry args={[0.1, 8, 8]} />
              <meshBasicMaterial color="#38bdf8" />
            </mesh>
            <Html distanceFactor={30} position={[0, 0.45, 0]} center>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onSelectSite(site);
                }}
                className="bg-slate-900/80 hover:bg-slate-800 border border-slate-600 hover:border-cyan-400 text-slate-300 hover:text-cyan-300 font-mono text-[8px] px-1.5 py-0.5 rounded shadow cursor-pointer transition-all"
              >
                {site.name.split(' ')[0]}
              </button>
            </Html>
          </group>
        );
      })}
    </group>
  );
};

// Convert Lat/Lon to 3D Cartesian on Sphere of radius R
function polarToSphere(latDeg: number, lonDeg: number, radius: number = 4.5): [number, number, number] {
  const latRad = (latDeg * Math.PI) / 180.0;
  const lonRad = (lonDeg * Math.PI) / 180.0;
  // Lunar IAU ME frame: Y is North (+)/South (-), Z is Prime Meridian (Mean Earth)
  const x = radius * Math.cos(latRad) * Math.sin(lonRad);
  const y = radius * Math.sin(latRad);
  const z = radius * Math.cos(latRad) * Math.cos(lonRad);
  return [x, y, z];
}

/**
 * 3D NASA LRO 15k Grid Moon Globe Scene
 */
const NasaLroGlobeScene: React.FC<{
  activeSite: LunarSite;
  onSelectSite: (site: LunarSite) => void;
  ephemerisState: EphemerisState;
  wireframe: boolean;
  autoRotate: boolean;
}> = ({ activeSite, onSelectSite, ephemerisState, wireframe, autoRotate }) => {
  const radius = 4.5;

  const activePos = useMemo(() => {
    return polarToSphere(activeSite.latitude, activeSite.longitude, radius);
  }, [activeSite, radius]);

  // Sun direction vector in Moon frame
  const sunDir = useMemo(() => {
    const subLatRad = (ephemerisState.sun.subLatitudeDeg * Math.PI) / 180.0;
    const subLonRad = (ephemerisState.sun.subLongitudeDeg * Math.PI) / 180.0;
    const x = Math.cos(subLatRad) * Math.sin(subLonRad);
    const y = Math.sin(subLatRad);
    const z = Math.cos(subLatRad) * Math.cos(subLonRad);
    return new THREE.Vector3(x, y, z).normalize();
  }, [ephemerisState.sun]);

  // Earth direction vector in Moon frame
  const earthDir = useMemo(() => {
    const subLatRad = (ephemerisState.earth.subLatitudeDeg * Math.PI) / 180.0;
    const subLonRad = (ephemerisState.earth.subLongitudeDeg * Math.PI) / 180.0;
    const x = Math.cos(subLatRad) * Math.sin(subLonRad);
    const y = Math.sin(subLatRad);
    const z = Math.cos(subLatRad) * Math.cos(subLonRad);
    return new THREE.Vector3(x, y, z).normalize();
  }, [ephemerisState.earth]);

  return (
    <>
      <color attach="background" args={['#02040a']} />
      <ambientLight intensity={0.16} color="#93c5fd" />
      <directionalLight
        position={[sunDir.x * 25, sunDir.y * 25, sunDir.z * 25]}
        intensity={2.8}
        color="#fffbeb"
        castShadow
        shadow-mapSize-width={2048}
        shadow-mapSize-height={2048}
      />
      <directionalLight
        position={[earthDir.x * 25, earthDir.y * 25, earthDir.z * 25]}
        intensity={0.35}
        color="#38bdf8"
      />

      <Stars radius={100} depth={40} count={3500} factor={4} saturation={0} fade speed={0.4} />

      {/* OrbitControls focused toward the South Pole by default */}
      <OrbitControls
        enableDamping
        dampingFactor={0.06}
        minDistance={5.2}
        maxDistance={35}
        target={[0, -2.5, 0]}
      />

      {/* 3D NASA LRO 15K Model */}
      <NasaLroMoonModel
        radius={radius}
        wireframe={wireframe}
        autoRotate={autoRotate}
        autoRotateSpeed={0.0004}
        receiveShadow
        castShadow
      >
        {/* Polar Latitude Grids (80°S, 85°S) */}
        <mesh rotation={[Math.PI / 2, 0, 0]} position={[0, -radius * Math.sin((80 * Math.PI) / 180), 0]}>
          <ringGeometry
            args={[
              radius * Math.cos((80 * Math.PI) / 180) - 0.02,
              radius * Math.cos((80 * Math.PI) / 180) + 0.02,
              64,
            ]}
          />
          <meshBasicMaterial color="#38bdf8" opacity={0.4} transparent side={THREE.DoubleSide} />
        </mesh>
        <mesh rotation={[Math.PI / 2, 0, 0]} position={[0, -radius * Math.sin((85 * Math.PI) / 180), 0]}>
          <ringGeometry
            args={[
              radius * Math.cos((85 * Math.PI) / 180) - 0.015,
              radius * Math.cos((85 * Math.PI) / 180) + 0.015,
              64,
            ]}
          />
          <meshBasicMaterial color="#38bdf8" opacity={0.6} transparent side={THREE.DoubleSide} />
        </mesh>
      </NasaLroMoonModel>

      {/* Active Target Site Beacon */}
      <group position={activePos}>
        <mesh position={[0, 0.25, 0]}>
          <cylinderGeometry args={[0.04, 0.01, 0.5, 12]} />
          <meshStandardMaterial color="#f59e0b" emissive="#d97706" emissiveIntensity={1} />
        </mesh>
        <mesh position={[0, 0.55, 0]}>
          <sphereGeometry args={[0.15, 16, 16]} />
          <meshStandardMaterial color="#f59e0b" emissive="#fbbf24" emissiveIntensity={1.5} />
        </mesh>
        <Html distanceFactor={20} position={[0, 0.85, 0]} center>
          <div className="bg-[#0f172a]/95 backdrop-blur-md border border-amber-400 text-amber-300 font-mono text-[10px] px-2.5 py-1 rounded shadow-xl whitespace-nowrap pointer-events-none flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
            <span className="font-bold">{activeSite.name}</span>
            <span className="text-slate-400">({activeSite.latitude.toFixed(1)}°S, {activeSite.elevation}m)</span>
          </div>
        </Html>
      </group>

      {/* Other Curated Sites on Globe */}
      {LUNAR_SOUTH_POLE_SITES.map((site) => {
        if (site.id === activeSite.id) return null;
        const pos = polarToSphere(site.latitude, site.longitude, radius);
        return (
          <group key={site.id} position={pos}>
            <mesh position={[0, 0.15, 0]}>
              <cylinderGeometry args={[0.025, 0.01, 0.3, 8]} />
              <meshBasicMaterial color="#38bdf8" />
            </mesh>
            <mesh position={[0, 0.32, 0]}>
              <sphereGeometry args={[0.09, 12, 12]} />
              <meshBasicMaterial color="#0284c7" />
            </mesh>
            <Html distanceFactor={22} position={[0, 0.5, 0]} center>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onSelectSite(site);
                }}
                className="bg-slate-950/85 hover:bg-slate-800 border border-cyan-500/50 hover:border-amber-400 text-cyan-300 hover:text-amber-300 font-mono text-[9px] px-1.5 py-0.5 rounded shadow-lg cursor-pointer transition-all"
                title={`Select ${site.name}`}
              >
                {site.name.split(' ')[0]}
              </button>
            </Html>
          </group>
        );
      })}

      {/* Sun Vector Beam from active site */}
      <Line
        points={[
          activePos,
          [activePos[0] + sunDir.x * 10, activePos[1] + sunDir.y * 10, activePos[2] + sunDir.z * 10],
        ]}
        color="#fbbf24"
        lineWidth={2.5}
        dashed
        dashScale={4}
        dashSize={0.4}
        gapSize={0.2}
      />

      {/* Earth Vector Beam from active site */}
      <Line
        points={[
          activePos,
          [activePos[0] + earthDir.x * 9, activePos[1] + earthDir.y * 9, activePos[2] + earthDir.z * 9],
        ]}
        color="#38bdf8"
        lineWidth={2.5}
      />
    </>
  );
};

export const PolarTerrain3D: React.FC<PolarTerrain3DProps> = ({
  activeSite,
  onSelectSite,
  ephemerisState,
  mastHeightM,
}) => {
  const [overlay, setOverlay] = useState<TerrainOverlayMode>('DEM');
  const [mappingMode, setMappingMode] = useState<VisualMappingMode>('THREE_JS_3D');
  const [quickmapZoom, setQuickmapZoom] = useState<QuickMapZoomLevel>('USER_DEFAULT');
  const [moonTrekZoom, setMoonTrekZoom] = useState<MoonTrekZoomLevel>('USER_DEFAULT');
  const [lroWireframe, setLroWireframe] = useState<boolean>(false);
  const [lroAutoRotate, setLroAutoRotate] = useState<boolean>(false);
  const [customPin, setCustomPin] = useState<{ lat: number; lon: number; elev: number } | null>(null);
  const [isMaximized, setIsMaximized] = useState<boolean>(false);
  const [copiedLink, setCopiedLink] = useState<string | null>(null);

  const handleCopyLink = (url: string, label: string) => {
    navigator.clipboard.writeText(url);
    setCopiedLink(label);
    setTimeout(() => setCopiedLink(null), 2500);
  };

  // Compute live LROC QuickMap URLs
  const liveQuickmapUrl = useMemo(() => {
    return buildQuickMapUrl(activeSite.latitude, activeSite.longitude, quickmapZoom);
  }, [activeSite, quickmapZoom]);

  const proxyQuickmapUrl = useMemo(() => {
    return buildQuickMapProxyUrl(activeSite.latitude, activeSite.longitude, quickmapZoom);
  }, [activeSite, quickmapZoom]);

  // Compute live NASA Moon Trek URLs
  const liveMoonTrekUrl = useMemo(() => {
    return buildMoonTrekUrl(activeSite.latitude, activeSite.longitude, moonTrekZoom);
  }, [activeSite, moonTrekZoom]);

  const proxyMoonTrekUrl = useMemo(() => {
    return buildMoonTrekProxyUrl(activeSite.latitude, activeSite.longitude, moonTrekZoom);
  }, [activeSite, moonTrekZoom]);

  const handleTerrainClick = (lat: number, lon: number, elev: number) => {
    setCustomPin({ lat, lon, elev });
    const customSite: LunarSite = {
      id: `custom-${lat.toFixed(2)}-${lon.toFixed(2)}`,
      name: `Custom Point (${lat.toFixed(2)}°S, ${lon.toFixed(1)}°E)`,
      latitude: lat,
      longitude: lon,
      elevation: Math.round(elev),
      description: 'User-specified target location on Lunar South Pole terrain.',
      missionRole: 'Ad-hoc Mission Simulation Candidate',
      peakIlluminationSummerPct: Math.round(Math.max(10, Math.min(92, 50 + elev * 0.008))),
      psrProximityKm: 2.5,
      roughnessScore: 0.35,
      keyFeatures: [
        'Interactively probed terrain coordinates',
        `Evaluated base LOLA elevation: ${Math.round(elev)} m`,
      ],
    };
    onSelectSite(customSite);
  };

  return (
    <div className={isMaximized ? "fixed inset-0 z-50 bg-[#030712] flex flex-col w-screen h-screen overflow-hidden animate-in fade-in duration-150" : "relative w-full h-full min-h-[580px] bg-[#030712] rounded-xl overflow-hidden border border-pluton-border flex flex-col shadow-2xl"}>
      {/* Top Control Bar: Engine Mode Switcher & Presets */}
      <div className="w-full bg-[#0a0f1d] border-b border-slate-800 px-3 py-2 flex flex-wrap items-center justify-between gap-2 z-20 font-mono text-xs select-none">
        {/* Left: GIS Mapping Mode Switcher */}
        <div className="flex items-center flex-wrap gap-1 bg-[#060913] p-1 rounded-lg border border-slate-700">
          <button
            onClick={() => setMappingMode('THREE_JS_3D')}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded text-[10px] font-bold transition-all cursor-pointer ${
              mappingMode === 'THREE_JS_3D'
                ? 'bg-amber-500 text-slate-950 shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Box className="w-3.5 h-3.5" />
            <span>3D TACTICAL MESH</span>
          </button>

          <button
            onClick={() => setMappingMode('NASA_LRO_GLOBE')}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded text-[10px] font-bold transition-all cursor-pointer ${
              mappingMode === 'NASA_LRO_GLOBE'
                ? 'bg-gradient-to-r from-emerald-500 to-cyan-500 text-slate-950 shadow-sm'
                : 'text-emerald-400 hover:text-emerald-300'
            }`}
            title="Render Authentic NASA LRO 15K High-Definition Textured Mesh GLB"
          >
            <Orbit className="w-3.5 h-3.5" />
            <span>NASA LRO 15K GLOBE</span>
          </button>

          <button
            onClick={() => setMappingMode('NASA_MOON_TREK')}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded text-[10px] font-bold transition-all cursor-pointer ${
              mappingMode === 'NASA_MOON_TREK'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Rocket className="w-3.5 h-3.5 text-blue-300" />
            <span>NASA MOON TREK</span>
          </button>

          <button
            onClick={() => setMappingMode('LROC_QUICKMAP')}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded text-[10px] font-bold transition-all cursor-pointer ${
              mappingMode === 'LROC_QUICKMAP'
                ? 'bg-cyan-500 text-slate-950 shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Globe className="w-3.5 h-3.5" />
            <span>LROC QUICKMAP</span>
          </button>

          <button
            onClick={() => setMappingMode('SPLIT_VIEW')}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded text-[10px] font-bold transition-all cursor-pointer ${
              mappingMode === 'SPLIT_VIEW'
                ? 'bg-purple-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Columns className="w-3.5 h-3.5" />
            <span>SPLIT DUAL VIEW</span>
          </button>
        </div>

        {/* Right Tools based on active mode */}
        {mappingMode === 'NASA_LRO_GLOBE' ? (
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1 bg-[#060913] p-0.5 rounded border border-slate-700 text-[9px]">
              <button
                onClick={() => setLroAutoRotate((prev) => !prev)}
                className={`px-2 py-0.5 rounded transition-all cursor-pointer ${
                  lroAutoRotate
                    ? 'bg-cyan-500 text-slate-950 font-bold'
                    : 'bg-slate-800 text-slate-400 hover:text-white'
                }`}
              >
                AUTO-SPIN: {lroAutoRotate ? 'ON' : 'OFF'}
              </button>
              <button
                onClick={() => setLroWireframe((prev) => !prev)}
                className={`px-2 py-0.5 rounded transition-all cursor-pointer ${
                  lroWireframe
                    ? 'bg-amber-500 text-slate-950 font-bold'
                    : 'bg-slate-800 text-slate-400 hover:text-white'
                }`}
              >
                WIREFRAME: {lroWireframe ? 'ON' : 'OFF'}
              </button>
            </div>
            <div className="hidden sm:flex items-center gap-1 text-[10px] text-emerald-400 px-2 py-0.5 rounded bg-emerald-950/40 border border-emerald-500/40">
              <Sparkles className="w-3 h-3 animate-pulse" />
              <span>NASA LRO 15K GLB</span>
            </div>
          </div>
        ) : mappingMode === 'THREE_JS_3D' ? (
          <div className="flex items-center gap-1.5 bg-[#060913] px-2.5 py-1 rounded-lg border border-slate-700">
            <Layers className="w-3.5 h-3.5 text-amber-400" />
            <span className="text-[10px] text-slate-400">LAYER:</span>
            {(['DEM', 'ILLUMINATION', 'PSR', 'SLOPE'] as TerrainOverlayMode[]).map((mode) => (
              <button
                key={mode}
                onClick={() => setOverlay(mode)}
                className={`text-[9px] px-2 py-0.5 rounded transition-all ${
                  overlay === mode
                    ? 'bg-amber-500 text-slate-950 font-bold shadow'
                    : 'bg-slate-800 text-slate-400 hover:text-white'
                }`}
              >
                {mode}
              </button>
            ))}
          </div>
        ) : mappingMode === 'NASA_MOON_TREK' ? (
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1 bg-[#060913] p-0.5 rounded border border-slate-700 text-[9px]">
              <span className="text-slate-500 px-1">ZOOM:</span>
              {(['USER_DEFAULT', 'CLOSEUP', 'REGIONAL'] as MoonTrekZoomLevel[]).map((lvl) => (
                <button
                  key={lvl}
                  onClick={() => setMoonTrekZoom(lvl)}
                  className={`px-1.5 py-0.5 rounded ${
                    moonTrekZoom === lvl
                      ? 'bg-blue-600 text-white font-bold'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  {lvl === 'USER_DEFAULT' ? 'POLAR (EPSG 104903)' : lvl}
                </button>
              ))}
            </div>

            <a
              href={liveMoonTrekUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1 px-2.5 py-1 rounded bg-blue-950/60 hover:bg-blue-900 border border-blue-500/50 text-blue-200 text-[10px] font-bold transition-all shadow-sm"
              title="Open NASA Moon Trek in full browser window"
            >
              <span>OPEN NASA MOON TREK</span>
              <ExternalLink className="w-3 h-3 text-blue-400" />
            </a>
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1 bg-[#060913] p-0.5 rounded border border-slate-700 text-[9px]">
              <span className="text-slate-500 px-1">ZOOM:</span>
              {(['USER_DEFAULT', 'CLOSEUP', 'REGIONAL'] as QuickMapZoomLevel[]).map((lvl) => (
                <button
                  key={lvl}
                  onClick={() => setQuickmapZoom(lvl)}
                  className={`px-1.5 py-0.5 rounded ${
                    quickmapZoom === lvl
                      ? 'bg-cyan-500 text-slate-950 font-bold'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  {lvl === 'USER_DEFAULT' ? 'REGIONAL (Stack 3314)' : lvl}
                </button>
              ))}
            </div>

            <a
              href={liveQuickmapUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1 px-2.5 py-1 rounded bg-cyan-950/40 hover:bg-cyan-900/60 border border-cyan-500/50 text-cyan-300 text-[10px] font-bold transition-all shadow-sm"
              title="Open LROC QuickMap in full browser window"
            >
              <span>OPEN LROC PORTAL</span>
              <ExternalLink className="w-3 h-3 text-cyan-400" />
            </a>
          </div>
        )}

        {/* Fit Page / Fullscreen Toggle */}
        <button
          onClick={() => setIsMaximized(!isMaximized)}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/50 text-[10px] font-bold transition-all shadow-sm cursor-pointer ml-auto"
          title={isMaximized ? "Restore view" : "Maximize 3D Viewport to fit the entire page"}
        >
          {isMaximized ? (
            <>
              <Minimize2 className="w-3.5 h-3.5" />
              <span>EXIT FULLSCREEN</span>
            </>
          ) : (
            <>
              <Maximize2 className="w-3.5 h-3.5" />
              <span>FIT PAGE (LARGE)</span>
            </>
          )}
        </button>
      </div>

      {/* Main Visual Display Area */}
      <div className="w-full flex-1 relative flex overflow-hidden min-h-[380px]">
        {/* Render 3D Three.js Tactical Mesh */}
        {(mappingMode === 'THREE_JS_3D' || mappingMode === 'SPLIT_VIEW') && (
          <div
            className={`h-full relative ${
              mappingMode === 'SPLIT_VIEW' ? 'w-1/2 border-r border-slate-800' : 'w-full'
            }`}
          >
            <div className="absolute top-3 right-3 z-10 flex flex-col gap-1 items-end pointer-events-none font-mono text-[9px]">
              <div className="bg-[#0f172a]/90 backdrop-blur-md px-2 py-0.5 rounded border border-amber-500/40 text-amber-300 flex items-center gap-1 shadow">
                <Sun className="w-3 h-3 text-amber-400" />
                <span>Sun: {ephemerisState.sun.elevationTopocentricDeg.toFixed(1)}°</span>
              </div>
              <div className="bg-[#0f172a]/90 backdrop-blur-md px-2 py-0.5 rounded border border-cyan-500/40 text-cyan-300 flex items-center gap-1 shadow">
                <Globe className="w-3 h-3 text-cyan-400" />
                <span>Earth: {ephemerisState.earth.elevationTopocentricDeg.toFixed(1)}°</span>
              </div>
            </div>

            <div className="absolute bottom-3 left-3 z-10 font-mono text-[9px] pointer-events-none">
              <div className="bg-[#0f172a]/90 backdrop-blur-md p-1.5 rounded-lg border border-slate-700 text-slate-300 shadow-lg pointer-events-auto flex items-center gap-2">
                <Crosshair className="w-3 h-3 text-emerald-400" />
                <span>3σ Landing Ellipse: ±500m</span>
              </div>
            </div>

            <Canvas
              shadows
              camera={{ position: [0, 26, 26], fov: 42, near: 0.1, far: 200 }}
              gl={{ antialias: true, alpha: false }}
            >
              <color attach="background" args={['#030712']} />
              <fog attach="fog" args={['#030712', 35, 75]} />
              <OrbitControls
                enableDamping
                dampingFactor={0.06}
                maxPolarAngle={Math.PI / 2.05}
                minDistance={4}
                maxDistance={50}
                target={[0, 0, 0]}
              />
              <LunarMesh overlay={overlay} onTerrainClick={handleTerrainClick} />
              <SceneOverlays
                activeSite={activeSite}
                ephemerisState={ephemerisState}
                mastHeightM={mastHeightM}
              />
              <SitePins
                sites={LUNAR_SOUTH_POLE_SITES}
                activeSiteId={activeSite.id}
                onSelectSite={onSelectSite}
              />
            </Canvas>
          </div>
        )}

        {/* Render Authentic NASA LRO 15K GLTF/GLB Moon Model */}
        {(mappingMode === 'NASA_LRO_GLOBE' || mappingMode === 'SPLIT_VIEW') && (
          <div className={`${mappingMode === 'SPLIT_VIEW' ? 'w-1/2 border-l border-slate-800' : 'w-full'} h-full relative`}>
            <div className="absolute top-3 left-3 z-10 p-2.5 rounded-lg bg-black/80 backdrop-blur-md border border-emerald-500/40 text-[11px] space-y-1 pointer-events-none">
              <div className="font-bold text-emerald-300 flex items-center gap-1.5">
                <Orbit className="w-3.5 h-3.5 text-emerald-400 animate-spin-slow" />
                <span>NASA LRO 15K SELENOGRAPHIC GLOBE</span>
              </div>
              <div className="text-slate-400">
                Target: <strong className="text-white">{activeSite.name}</strong> ({activeSite.latitude.toFixed(2)}°S, {activeSite.longitude.toFixed(1)}°E)
              </div>
              <div className="text-slate-400">
                LRO Geometry: <strong className="text-cyan-300">31,744 Vertices • 15K Texture Grid (116.5 MB)</strong>
              </div>
              <div className="text-slate-400">
                Solar Vector: <strong className="text-amber-400">{ephemerisState.sun.elevationTopocentricDeg.toFixed(1)}° El</strong> | Earth: <strong className="text-cyan-300">{ephemerisState.earth.elevationTopocentricDeg.toFixed(1)}° El</strong>
              </div>
            </div>

            <div className="absolute bottom-3 right-3 z-10 pointer-events-none">
              <div className="bg-[#0f172a]/90 backdrop-blur-md px-2.5 py-1 rounded border border-slate-700 text-slate-400 font-mono text-[9px] shadow">
                Drag to rotate globe • Scroll to zoom • Click site pin to target
              </div>
            </div>

            <Canvas
              shadows
              camera={{ position: [0, -13, 10], fov: 42, near: 0.1, far: 200 }}
              gl={{ antialias: true, alpha: false }}
            >
              <NasaLroGlobeScene
                activeSite={activeSite}
                onSelectSite={onSelectSite}
                ephemerisState={ephemerisState}
                wireframe={lroWireframe}
                autoRotate={lroAutoRotate}
              />
            </Canvas>
          </div>
        )}

        {/* Render NASA Moon Trek Planetary GIS Console */}
        {mappingMode === 'NASA_MOON_TREK' && (
          <div className="w-full h-full relative bg-[#02050f] flex flex-col p-4 md:p-6 overflow-y-auto font-mono text-slate-200">
            {/* Header Telemetry Pill */}
            <div className="w-full flex flex-wrap items-center justify-between gap-3 p-3 rounded-xl bg-[#090e1c] border border-blue-500/40 shadow-xl mb-4">
              <div className="flex items-center gap-2.5">
                <span className="w-2.5 h-2.5 rounded-full bg-blue-400 animate-pulse shadow-md shadow-blue-500/50"></span>
                <span className="font-bold text-blue-300 text-sm tracking-wide">NASA JPL MOON TREK GIS CONSOLE</span>
                <span className="text-[10px] px-2 py-0.5 rounded bg-blue-950/80 text-blue-300 border border-blue-500/40 font-bold">
                  EPSG:104903
                </span>
              </div>
              <div className="text-xs text-slate-400 flex items-center gap-2">
                <span>Target: <strong className="text-white">{activeSite.name}</strong></span>
                <span className="text-slate-600">|</span>
                <span className="text-cyan-300 font-bold">{activeSite.latitude.toFixed(4)}°S, {activeSite.longitude.toFixed(4)}°E</span>
                <span className="text-slate-600">|</span>
                <span className="text-amber-300">{activeSite.elevation}m Elev</span>
              </div>
            </div>

            {/* Main Interactive Telemetry & Reticle Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 flex-1 items-stretch">
              {/* Left / Center: Tactical Polar Stereographic Reticle Radar */}
              <div className="lg:col-span-7 bg-[#050914] rounded-xl border border-slate-800 p-4 flex flex-col items-center justify-center relative overflow-hidden shadow-inner">
                {/* Background Ambient Glow */}
                <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-blue-950/20 via-transparent to-transparent pointer-events-none" />

                {/* Polar Radar Scope SVG */}
                <div className="relative w-72 h-72 sm:w-80 sm:h-80 flex items-center justify-center">
                  <svg className="w-full h-full" viewBox="0 0 320 320">
                    {/* Range Rings */}
                    <circle cx="160" cy="160" r="140" fill="none" stroke="#1e293b" strokeWidth="1" strokeDasharray="3 3" />
                    <circle cx="160" cy="160" r="105" fill="none" stroke="#1e293b" strokeWidth="1" />
                    <circle cx="160" cy="160" r="70" fill="none" stroke="#1e293b" strokeWidth="1" strokeDasharray="3 3" />
                    <circle cx="160" cy="160" r="35" fill="none" stroke="#0ea5e9" strokeWidth="0.8" strokeOpacity="0.4" />

                    {/* Polar Coordinate Crosshairs */}
                    <line x1="160" y1="10" x2="160" y2="310" stroke="#334155" strokeWidth="0.75" />
                    <line x1="10" y1="160" x2="310" y2="160" stroke="#334155" strokeWidth="0.75" />

                    {/* Degree Headings */}
                    <text x="160" y="24" fill="#64748b" fontSize="8" textAnchor="middle" fontFamily="monospace">0° N</text>
                    <text x="306" y="163" fill="#64748b" fontSize="8" textAnchor="end" fontFamily="monospace">90° E</text>
                    <text x="160" y="306" fill="#64748b" fontSize="8" textAnchor="middle" fontFamily="monospace">180° S</text>
                    <text x="14" y="163" fill="#64748b" fontSize="8" textAnchor="start" fontFamily="monospace">270° W</text>

                    {/* Distance Labels */}
                    <text x="164" y="93" fill="#0284c7" fontSize="7" fontFamily="monospace">50 km</text>
                    <text x="164" y="58" fill="#0284c7" fontSize="7" fontFamily="monospace">100 km</text>

                    {/* Sub-Solar Vector Needle */}
                    {(() => {
                      const azRad = (ephemerisState.sun.azimuthDeg - 90) * (Math.PI / 180);
                      const sx = 160 + 130 * Math.cos(azRad);
                      const sy = 160 + 130 * Math.sin(azRad);
                      return (
                        <g>
                          <line x1="160" y1="160" x2={sx} y2={sy} stroke="#f59e0b" strokeWidth="1.5" strokeDasharray="4 2" />
                          <circle cx={sx} cy={sy} r="5" fill="#f59e0b" />
                        </g>
                      );
                    })()}

                    {/* Sub-Earth Vector Needle */}
                    {(() => {
                      const azRad = (ephemerisState.earth.azimuthDeg - 90) * (Math.PI / 180);
                      const ex = 160 + 120 * Math.cos(azRad);
                      const ey = 160 + 120 * Math.sin(azRad);
                      return (
                        <g>
                          <line x1="160" y1="160" x2={ex} y2={ey} stroke="#06b6d4" strokeWidth="1.5" />
                          <circle cx={ex} cy={ey} r="4" fill="#06b6d4" />
                        </g>
                      );
                    })()}

                    {/* Center Target Landing Reticle & 3-Sigma Ellipse */}
                    <ellipse cx="160" cy="160" rx="14" ry="10" fill="none" stroke="#10b981" strokeWidth="1.5" strokeDasharray="2 2" />
                    <circle cx="160" cy="160" r="2.5" fill="#10b981" />
                  </svg>

                  {/* Pulsing Target Overlay */}
                  <div className="absolute w-7 h-7 rounded-full border border-emerald-400/80 animate-ping pointer-events-none" />
                </div>

                {/* Radar Vectors Legend */}
                <div className="flex flex-wrap items-center justify-center gap-4 mt-3 text-[10px] text-slate-300">
                  <div className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-amber-400" />
                    <span>Sun Az: <strong>{ephemerisState.sun.azimuthDeg.toFixed(1)}°</strong> ({ephemerisState.sun.elevationTopocentricDeg.toFixed(1)}° El)</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-cyan-400" />
                    <span>Earth Az: <strong>{ephemerisState.earth.azimuthDeg.toFixed(1)}°</strong> ({ephemerisState.earth.elevationTopocentricDeg.toFixed(1)}° El)</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
                    <span>3σ Ellipse (±500m)</span>
                  </div>
                </div>
              </div>

              {/* Right: Telemetry Matrix & Direct Launch Actions */}
              <div className="lg:col-span-5 flex flex-col justify-between gap-4">
                {/* Telemetry Matrix Card */}
                <div className="bg-[#050914] rounded-xl border border-slate-800 p-4 space-y-3">
                  <div className="text-xs font-bold text-slate-400 uppercase tracking-wider border-b border-slate-800 pb-2 flex items-center justify-between">
                    <span>SELENOGRAPHIC TELEMETRY</span>
                    <span className="text-emerald-400 font-mono text-[10px]">JPL DE441 KERNEL</span>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div className="p-2 rounded bg-[#090e1c] border border-slate-800">
                      <div className="text-[10px] text-slate-500">BASE ELEVATION</div>
                      <div className="text-white font-bold text-sm mt-0.5">{activeSite.elevation} m</div>
                      <div className="text-[9px] text-slate-400">LOLA 20m GDR DEM</div>
                    </div>
                    <div className="p-2 rounded bg-[#090e1c] border border-slate-800">
                      <div className="text-[10px] text-slate-500">PSR PROXIMITY</div>
                      <div className="text-cyan-300 font-bold text-sm mt-0.5">{activeSite.psrProximityKm} km</div>
                      <div className="text-[9px] text-slate-400">Cryogenic Ice Trap</div>
                    </div>
                    <div className="p-2 rounded bg-[#090e1c] border border-slate-800">
                      <div className="text-[10px] text-slate-500">SLOPE GRADIENT</div>
                      <div className="text-amber-300 font-bold text-sm mt-0.5">{(activeSite.roughnessScore * 12).toFixed(1)}°</div>
                      <div className="text-[9px] text-slate-400">Landing Stability (&le;8.5°)</div>
                    </div>
                    <div className="p-2 rounded bg-[#090e1c] border border-slate-800">
                      <div className="text-[10px] text-slate-500">EARTH DTE LINK</div>
                      <div className={`font-bold text-sm mt-0.5 ${ephemerisState.earth.elevationTopocentricDeg > 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                        {ephemerisState.earth.elevationTopocentricDeg > 0 ? 'ACTIVE (AOS)' : 'OCCULTED (LOS)'}
                      </div>
                      <div className="text-[9px] text-slate-400">Libration: &plusmn;6.7° Lat</div>
                    </div>
                  </div>

                  <div className="p-2.5 rounded bg-blue-950/30 border border-blue-500/30 text-[10px] text-blue-200">
                    <strong>NASA Cross-Origin Security Note:</strong> NASA JPL Solar System Treks operates under federal frame security restrictions (<code>X-Frame-Options: SAMEORIGIN</code>). PLUTON synchronizes live DE441 coordinates and polar stereographic extents directly into the portal launcher below.
                  </div>
                </div>

                {/* Primary Launch & Action Buttons */}
                <div className="space-y-2">
                  <a
                    href={liveMoonTrekUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full py-3 px-4 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-black text-xs tracking-wider uppercase transition-all shadow-lg shadow-blue-600/30 flex items-center justify-center gap-2 cursor-pointer border border-blue-400/50"
                  >
                    <Rocket className="w-4 h-4 text-white" />
                    <span>LAUNCH OFFICIAL NASA JPL MOON TREK (EPSG:104903)</span>
                    <ExternalLink className="w-3.5 h-3.5 ml-1 text-blue-200" />
                  </a>

                  <div className="grid grid-cols-3 gap-2">
                    <button
                      onClick={() => handleCopyLink(liveMoonTrekUrl, 'MOON_TREK')}
                      className="py-2 px-2.5 rounded-lg bg-[#090e1c] hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-700 transition-all text-[10px] font-bold flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      {copiedLink === 'MOON_TREK' ? (
                        <>
                          <Check className="w-3 h-3 text-emerald-400" />
                          <span className="text-emerald-400">COPIED!</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3 h-3 text-cyan-400" />
                          <span>COPY LINK</span>
                        </>
                      )}
                    </button>

                    <button
                      onClick={() => setMappingMode('THREE_JS_3D')}
                      className="py-2 px-2.5 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 transition-all text-[10px] font-bold flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      <Box className="w-3 h-3 text-amber-400" />
                      <span>3D MESH</span>
                    </button>

                    <button
                      onClick={() => setMappingMode('NASA_LRO_GLOBE')}
                      className="py-2 px-2.5 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/40 transition-all text-[10px] font-bold flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      <Orbit className="w-3 h-3 text-emerald-400" />
                      <span>15K GLOBE</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Render LROC QuickMap GIS Console */}
        {mappingMode === 'LROC_QUICKMAP' && (
          <div className="w-full h-full relative bg-[#02050f] flex flex-col p-4 md:p-6 overflow-y-auto font-mono text-slate-200">
            {/* Header Telemetry Pill */}
            <div className="w-full flex flex-wrap items-center justify-between gap-3 p-3 rounded-xl bg-[#090e1c] border border-cyan-500/40 shadow-xl mb-4">
              <div className="flex items-center gap-2.5">
                <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 animate-pulse shadow-md shadow-cyan-500/50"></span>
                <span className="font-bold text-cyan-300 text-sm tracking-wide">LROC QUICKMAP POLAR GIS CONSOLE</span>
                <span className="text-[10px] px-2 py-0.5 rounded bg-cyan-950/80 text-cyan-300 border border-cyan-500/40 font-bold">
                  PROJ 10 • STACK 3314
                </span>
              </div>
              <div className="text-xs text-slate-400 flex items-center gap-2">
                <span>Site: <strong className="text-white">{activeSite.name}</strong></span>
                <span className="text-slate-600">|</span>
                <span className="text-cyan-300 font-bold">{activeSite.latitude.toFixed(4)}°S, {activeSite.longitude.toFixed(4)}°E</span>
              </div>
            </div>

            {/* Main Interactive Telemetry & Reticle Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 flex-1 items-stretch">
              {/* Left / Center: Polar Stereographic Projector Visualization */}
              <div className="lg:col-span-7 bg-[#050914] rounded-xl border border-slate-800 p-4 flex flex-col items-center justify-center relative overflow-hidden shadow-inner">
                <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-cyan-950/20 via-transparent to-transparent pointer-events-none" />

                <div className="relative w-72 h-72 sm:w-80 sm:h-80 flex items-center justify-center">
                  <svg className="w-full h-full" viewBox="0 0 320 320">
                    <circle cx="160" cy="160" r="140" fill="none" stroke="#1e293b" strokeWidth="1" strokeDasharray="3 3" />
                    <circle cx="160" cy="160" r="105" fill="none" stroke="#1e293b" strokeWidth="1" />
                    <circle cx="160" cy="160" r="70" fill="none" stroke="#1e293b" strokeWidth="1" strokeDasharray="3 3" />
                    <circle cx="160" cy="160" r="35" fill="none" stroke="#06b6d4" strokeWidth="0.8" strokeOpacity="0.4" />

                    <line x1="160" y1="10" x2="160" y2="310" stroke="#334155" strokeWidth="0.75" />
                    <line x1="10" y1="160" x2="310" y2="160" stroke="#334155" strokeWidth="0.75" />

                    <text x="160" y="24" fill="#64748b" fontSize="8" textAnchor="middle" fontFamily="monospace">0° LON</text>
                    <text x="306" y="163" fill="#64748b" fontSize="8" textAnchor="end" fontFamily="monospace">90° E</text>
                    <text x="160" y="306" fill="#64748b" fontSize="8" textAnchor="middle" fontFamily="monospace">180° W</text>
                    <text x="14" y="163" fill="#64748b" fontSize="8" textAnchor="start" fontFamily="monospace">270° E</text>

                    {/* QuickMap Polar Stereographic Meter Coordinates */}
                    {(() => {
                      const { x, y } = latLonToSouthPoleStereographic(activeSite.latitude, activeSite.longitude);
                      return (
                        <text x="160" y="275" fill="#38bdf8" fontSize="8" textAnchor="middle" fontFamily="monospace">
                          Stereo X: {x.toFixed(0)}m | Y: {y.toFixed(0)}m
                        </text>
                      );
                    })()}

                    <ellipse cx="160" cy="160" rx="14" ry="10" fill="none" stroke="#06b6d4" strokeWidth="1.5" strokeDasharray="2 2" />
                    <circle cx="160" cy="160" r="2.5" fill="#06b6d4" />
                  </svg>
                  <div className="absolute w-7 h-7 rounded-full border border-cyan-400/80 animate-ping pointer-events-none" />
                </div>

                <div className="flex flex-wrap items-center justify-center gap-4 mt-3 text-[10px] text-slate-300">
                  <div className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-cyan-400" />
                    <span>LROC NAC High-Res Stereographic Overlay</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
                    <span>LOLA Altimetry Grid (20m/px)</span>
                  </div>
                </div>
              </div>

              {/* Right: QuickMap Telemetry & Direct Launch */}
              <div className="lg:col-span-5 flex flex-col justify-between gap-4">
                <div className="bg-[#050914] rounded-xl border border-slate-800 p-4 space-y-3">
                  <div className="text-xs font-bold text-slate-400 uppercase tracking-wider border-b border-slate-800 pb-2 flex items-center justify-between">
                    <span>LROC IM-LDI CONFIGURATION</span>
                    <span className="text-cyan-400 font-mono text-[10px]">STACK 3314</span>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div className="p-2 rounded bg-[#090e1c] border border-slate-800">
                      <div className="text-[10px] text-slate-500">PROJECTION</div>
                      <div className="text-white font-bold text-sm mt-0.5">PROJ 10</div>
                      <div className="text-[9px] text-slate-400">South Pole Stereographic</div>
                    </div>
                    <div className="p-2 rounded bg-[#090e1c] border border-slate-800">
                      <div className="text-[10px] text-slate-500">EARTH SHADOW</div>
                      <div className="text-cyan-300 font-bold text-sm mt-0.5">ENABLED</div>
                      <div className="text-[9px] text-slate-400">Real-time solar occlusion</div>
                    </div>
                    <div className="p-2 rounded bg-[#090e1c] border border-slate-800">
                      <div className="text-[10px] text-slate-500">PEAK ILLUMINATION</div>
                      <div className="text-amber-300 font-bold text-sm mt-0.5">{activeSite.peakIlluminationSummerPct}%</div>
                      <div className="text-[9px] text-slate-400">Summer Synodic Cycle</div>
                    </div>
                    <div className="p-2 rounded bg-[#090e1c] border border-slate-800">
                      <div className="text-[10px] text-slate-500">BOULDER HAZARD</div>
                      <div className="text-emerald-400 font-bold text-sm mt-0.5">{activeSite.roughnessScore}</div>
                      <div className="text-[9px] text-slate-400">NAC Stereo Roughness</div>
                    </div>
                  </div>

                  <div className="p-2.5 rounded bg-cyan-950/30 border border-cyan-500/30 text-[10px] text-cyan-200">
                    <strong>Direct LROC Integration:</strong> Coordinates and stereographic projection bounds (Stack 3314) are pre-calculated to center directly on this Artemis landing zone.
                  </div>
                </div>

                <div className="space-y-2">
                  <a
                    href={liveQuickmapUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full py-3 px-4 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-slate-950 font-black text-xs tracking-wider uppercase transition-all shadow-lg shadow-cyan-500/30 flex items-center justify-center gap-2 cursor-pointer border border-cyan-400/50"
                  >
                    <Globe className="w-4 h-4 text-slate-950" />
                    <span>LAUNCH OFFICIAL LROC QUICKMAP PORTAL (PROJ 10)</span>
                    <ExternalLink className="w-3.5 h-3.5 ml-1 text-slate-900" />
                  </a>

                  <div className="grid grid-cols-3 gap-2">
                    <button
                      onClick={() => handleCopyLink(liveQuickmapUrl, 'QUICKMAP')}
                      className="py-2 px-2.5 rounded-lg bg-[#090e1c] hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-700 transition-all text-[10px] font-bold flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      {copiedLink === 'QUICKMAP' ? (
                        <>
                          <Check className="w-3 h-3 text-emerald-400" />
                          <span className="text-emerald-400">COPIED!</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3 h-3 text-cyan-400" />
                          <span>COPY LINK</span>
                        </>
                      )}
                    </button>

                    <button
                      onClick={() => setMappingMode('THREE_JS_3D')}
                      className="py-2 px-2.5 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 transition-all text-[10px] font-bold flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      <Box className="w-3 h-3 text-amber-400" />
                      <span>3D MESH</span>
                    </button>

                    <button
                      onClick={() => setMappingMode('NASA_LRO_GLOBE')}
                      className="py-2 px-2.5 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/40 transition-all text-[10px] font-bold flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      <Orbit className="w-3 h-3 text-emerald-400" />
                      <span>15K GLOBE</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
