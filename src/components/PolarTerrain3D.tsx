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
} from 'lucide-react';
import { LunarSite, EphemerisState } from '@/types/pluton';
import { LUNAR_SOUTH_POLE_SITES } from '@/data/lunarDatabase';
import { getLolaSyntheticElevationM } from '@/engine/terrainHorizonEngine';
import {
  buildQuickMapUrl,
  buildQuickMapProxyUrl,
  QuickMapZoomLevel,
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
        {mappingMode === 'NASA_LRO_GLOBE' && (
          <div className="w-full h-full relative">
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

        {/* Render NASA Moon Trek */}
        {mappingMode === 'NASA_MOON_TREK' && (
          <div className="w-full h-full relative bg-[#02050e] flex flex-col">
            <div className="absolute top-2 left-2 z-10 bg-[#0f172a]/95 backdrop-blur-md px-2.5 py-1.5 rounded border border-blue-500/40 text-slate-200 font-mono text-[10px] flex items-center gap-2 shadow-lg">
              <span className="w-2 h-2 rounded-full bg-blue-400 animate-pulse"></span>
              <span className="font-bold text-blue-300">NASA JPL MOON TREK (EPSG:104903)</span>
              <span className="text-slate-400">
                Target: {activeSite.name} ({activeSite.latitude.toFixed(2)}°S, {activeSite.longitude.toFixed(1)}°E)
              </span>
            </div>

            <iframe
              src={proxyMoonTrekUrl}
              title="NASA Moon Trek Planetary GIS"
              className="w-full h-full border-0"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
              loading="lazy"
            />

            <div className="absolute bottom-2 right-2 z-10">
              <a
                href={liveMoonTrekUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="bg-[#0f172a]/90 hover:bg-slate-800 text-blue-300 border border-blue-500/50 text-[9px] font-mono font-bold px-2 py-1 rounded shadow flex items-center gap-1 transition-colors"
              >
                <span>Direct NASA Moon Trek Window</span>
                <ExternalLink className="w-2.5 h-2.5" />
              </a>
            </div>
          </div>
        )}

        {/* Render LROC QuickMap GIS (when active or on right side of split view) */}
        {(mappingMode === 'LROC_QUICKMAP' || mappingMode === 'SPLIT_VIEW') && (
          <div
            className={`h-full relative bg-[#02050e] flex flex-col ${
              mappingMode === 'SPLIT_VIEW' ? 'w-1/2' : 'w-full'
            }`}
          >
            <div className="absolute top-2 left-2 z-10 bg-[#0f172a]/95 backdrop-blur-md px-2.5 py-1.5 rounded border border-cyan-500/40 text-slate-200 font-mono text-[10px] flex items-center gap-2 shadow-lg">
              <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse"></span>
              <span className="font-bold text-cyan-300">LROC QUICKMAP POLAR GIS (PROJ 10)</span>
              <span className="text-slate-400">
                Lat: {activeSite.latitude.toFixed(2)}°S, Lon: {activeSite.longitude.toFixed(1)}°E
              </span>
            </div>

            <iframe
              src={proxyQuickmapUrl}
              title="LROC QuickMap Lunar South Pole GIS"
              className="w-full h-full border-0"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
              loading="lazy"
            />

            <div className="absolute bottom-2 right-2 z-10">
              <a
                href={liveQuickmapUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="bg-[#0f172a]/90 hover:bg-slate-800 text-cyan-300 border border-cyan-500/50 text-[9px] font-mono font-bold px-2 py-1 rounded shadow flex items-center gap-1 transition-colors"
              >
                <span>Direct LROC QuickMap Window</span>
                <ExternalLink className="w-2.5 h-2.5" />
              </a>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
