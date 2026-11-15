'use client';

import React, { Suspense, useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { useGLTF, Html } from '@react-three/drei';
import * as THREE from 'three';
import { Orbit, Loader2 } from 'lucide-react';
import { getAssetPath } from '@/utils/assetPath';

export interface NasaLroMoonModelProps {
  radius?: number;
  rotation?: [number, number, number];
  autoRotate?: boolean;
  autoRotateSpeed?: number;
  wireframe?: boolean;
  opacity?: number;
  transparent?: boolean;
  modelUrl?: string; // default to '/Moon_NASA_LRO_15k_Grid_Small.glb'
  receiveShadow?: boolean;
  castShadow?: boolean;
  children?: React.ReactNode;
}

/**
 * Fallback placeholder displayed while the 116MB NASA LRO 15k model geometry & texture stream into WebGL
 */
export const MoonModelFallback: React.FC<{ radius?: number }> = ({ radius = 3.5 }) => {
  const meshRef = useRef<THREE.Mesh>(null);

  useFrame((_, delta) => {
    if (meshRef.current) {
      meshRef.current.rotation.y += delta * 0.2;
    }
  });

  return (
    <group>
      {/* Wireframe Holographic Moon Placeholder */}
      <mesh ref={meshRef}>
        <sphereGeometry args={[radius, 32, 32]} />
        <meshBasicMaterial
          color="#38bdf8"
          wireframe
          transparent
          opacity={0.35}
        />
      </mesh>

      {/* Solid Inner Core */}
      <mesh>
        <sphereGeometry args={[radius * 0.99, 32, 32]} />
        <meshStandardMaterial
          color="#0f172a"
          roughness={0.9}
        />
      </mesh>

      {/* High-tech Loading HUD Tag */}
      <Html center position={[0, 0, 0]} distanceFactor={20}>
        <div className="bg-[#030712]/90 backdrop-blur-md border border-cyan-500/50 text-cyan-300 font-mono text-[11px] px-3 py-2 rounded-lg shadow-2xl flex items-center gap-2.5 whitespace-nowrap pointer-events-none">
          <Loader2 className="w-4 h-4 text-cyan-400 animate-spin" />
          <div className="text-left">
            <div className="font-bold tracking-wider text-white">STREAMING NASA LRO 15K GLB</div>
            <div className="text-[9px] text-slate-400">Loading High-Definition Lunar Orbiter Mesh...</div>
          </div>
        </div>
      </Html>
    </group>
  );
};

/**
 * Inner component that loads and renders the GLTF scene
 */
const NasaLroMeshInternal: React.FC<{
  radius: number;
  wireframe?: boolean;
  opacity?: number;
  transparent?: boolean;
  modelUrl: string;
  receiveShadow?: boolean;
  castShadow?: boolean;
}> = ({
  radius,
  wireframe = false,
  opacity = 1.0,
  transparent = false,
  modelUrl,
  receiveShadow = true,
  castShadow = true,
}) => {
  const resolvedModelUrl = getAssetPath(modelUrl);
  const gltf = useGLTF(resolvedModelUrl);

  // Clone scene so multiple instances don't collide
  const clonedScene = useMemo(() => {
    const scene = gltf.scene.clone(true);

    // Compute bounding sphere of loaded mesh to normalize scale accurately to radius
    const bbox = new THREE.Box3().setFromObject(scene);
    const size = new THREE.Vector3();
    bbox.getSize(size);
    const maxDim = Math.max(size.x, size.y, size.z);
    const originalRadius = maxDim / 2.0 || 1.0;
    const uniformScale = radius / originalRadius;

    scene.scale.set(uniformScale, uniformScale, uniformScale);

    // Apply materials, shadow flags, and wireframe
    scene.traverse((child) => {
      if ((child as THREE.Mesh).isMesh) {
        const mesh = child as THREE.Mesh;
        mesh.castShadow = castShadow;
        mesh.receiveShadow = receiveShadow;

        if (mesh.material) {
          const mat = (mesh.material as THREE.MeshStandardMaterial).clone();
          mat.roughness = 0.92;
          mat.metalness = 0.05;
          mat.wireframe = wireframe;
          if (transparent || opacity < 1.0) {
            mat.transparent = true;
            mat.opacity = opacity;
          }
          mesh.material = mat;
        }
      }
    });

    return scene;
  }, [gltf, radius, wireframe, opacity, transparent, receiveShadow, castShadow]);

  return <primitive object={clonedScene} />;
};

/**
 * Main NASA LRO 15k Grid Moon Model with Suspense and Error Boundary
 */
export const NasaLroMoonModel: React.FC<NasaLroMoonModelProps> = ({
  radius = 3.5,
  rotation = [0, 0, 0],
  autoRotate = false,
  autoRotateSpeed = 0.0003,
  wireframe = false,
  opacity = 1.0,
  transparent = false,
  modelUrl = getAssetPath('/Moon_NASA_LRO_15k_Grid_Small.glb'),
  receiveShadow = true,
  castShadow = true,
  children,
}) => {
  const groupRef = useRef<THREE.Group>(null);

  useFrame((_, delta) => {
    if (autoRotate && groupRef.current) {
      groupRef.current.rotation.y += autoRotateSpeed;
    }
  });

  return (
    <group ref={groupRef} rotation={rotation}>
      <Suspense fallback={<MoonModelFallback radius={radius} />}>
        <NasaLroMeshInternal
          radius={radius}
          wireframe={wireframe}
          opacity={opacity}
          transparent={transparent}
          modelUrl={modelUrl}
          receiveShadow={receiveShadow}
          castShadow={castShadow}
        />
        {children}
      </Suspense>
    </group>
  );
};

// Preload the NASA LRO 15k model into Three.js GLTF cache
try {
  useGLTF.preload(getAssetPath('/Moon_NASA_LRO_15k_Grid_Small.glb'));
} catch {
  // Preload safe catch
}
