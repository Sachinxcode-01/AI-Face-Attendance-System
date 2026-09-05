'use client';

import React, { useRef, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Points, PointMaterial } from '@react-three/drei';
import * as THREE from 'three';

// Create coordinates on a sphere
function generateSpherePoints(count: number, radius: number) {
  const points = new Float32Array(count * 3);
  for (let i = 0; i < count; i++) {
    const u = Math.random();
    const v = Math.random();
    const theta = u * 2.0 * Math.PI;
    const phi = Math.acos(2.0 * v - 1.0);
    
    points[i * 3] = radius * Math.sin(phi) * Math.cos(theta);
    points[i * 3 + 1] = radius * Math.sin(phi) * Math.sin(theta);
    points[i * 3 + 2] = radius * Math.cos(phi);
  }
  return points;
}

// Coordinate arc representing check-in transmissions
function ConnectionArc({ start, end }: { start: THREE.Vector3; end: THREE.Vector3 }) {
  const lineRef = useRef<THREE.Line>(null);
  const pingRef = useRef<THREE.Mesh>(null);

  const { curve, points } = useMemo(() => {
    // Middle point raised outward to create a nice curve arc
    const mid = new THREE.Vector3().addVectors(start, end).multiplyScalar(0.5);
    const length = start.distanceTo(end);
    mid.normalize().multiplyScalar(2.0 + length * 0.25); // raised relative to length

    const bezier = new THREE.QuadraticBezierCurve3(start, mid, end);
    const curvePoints = bezier.getPoints(32);
    return { curve: bezier, points: curvePoints };
  }, [start, end]);

  useFrame((state) => {
    const time = state.clock.getElapsedTime();
    // Loop the ping traveler along the bezier curve
    const progress = (time * 0.4) % 1;
    if (pingRef.current) {
      const pos = curve.getPointAt(progress);
      pingRef.current.position.copy(pos);
    }
  });

  return (
    <group>
      {/* Curved Line */}
      <line ref={lineRef as unknown as React.Ref<SVGLineElement>}>
        <bufferGeometry>
          <bufferAttribute
            attach="attributes-position"
            args={[new Float32Array(points.flatMap(p => [p.x, p.y, p.z])), 3]}
          />
        </bufferGeometry>
        <lineBasicMaterial color="#3b82f6" transparent opacity={0.35} />
      </line>

      {/* Pulsing traveler dot */}
      <mesh ref={pingRef}>
        <sphereGeometry args={[0.04, 8, 8]} />
        <meshBasicMaterial color="#10b981" />
      </mesh>
    </group>
  );
}

function GlobeModel() {
  const groupRef = useRef<THREE.Group>(null);

  // Generate globe points
  const points = useMemo(() => generateSpherePoints(400, 2.0), []);

  // Pre-define 6 network pings connecting locations on the surface
  const arcs = useMemo(() => {
    const tempArcs: { start: THREE.Vector3; end: THREE.Vector3 }[] = [];
    const r = 2.0;

    const latLonToVector3 = (lat: number, lon: number) => {
      const phi = (90 - lat) * (Math.PI / 180);
      const theta = (lon + 180) * (Math.PI / 180);
      return new THREE.Vector3(
        -(r * Math.sin(phi) * Math.sin(theta)),
        r * Math.cos(phi),
        r * Math.sin(phi) * Math.cos(theta)
      );
    };

    // London to NY
    tempArcs.push({ start: latLonToVector3(51.5, -0.1), end: latLonToVector3(40.7, -74) });
    // NY to Tokyo
    tempArcs.push({ start: latLonToVector3(40.7, -74), end: latLonToVector3(35.6, 139.6) });
    // Tokyo to Sydney
    tempArcs.push({ start: latLonToVector3(35.6, 139.6), end: latLonToVector3(-33.8, 151.2) });
    // Paris to Mumbai
    tempArcs.push({ start: latLonToVector3(48.8, 2.3), end: latLonToVector3(19.0, 72.8) });
    // San Francisco to Berlin
    tempArcs.push({ start: latLonToVector3(37.7, -122.4), end: latLonToVector3(52.5, 13.4) });
    // London to Cape Town
    tempArcs.push({ start: latLonToVector3(51.5, -0.1), end: latLonToVector3(-33.9, 18.4) });

    return tempArcs;
  }, []);

  useFrame((state) => {
    const time = state.clock.getElapsedTime();
    if (groupRef.current) {
      // Smooth continuous spin
      groupRef.current.rotation.y = time * 0.08;
    }
  });

  return (
    <group ref={groupRef}>
      {/* Particle Globe base */}
      <Points positions={points} stride={3}>
        <PointMaterial
          transparent
          color="#3b82f6"
          size={0.05}
          sizeAttenuation={true}
          depthWrite={false}
          opacity={0.65}
        />
      </Points>

      {/* Wireframe outer shell */}
      <mesh>
        <sphereGeometry args={[1.98, 24, 24]} />
        <meshBasicMaterial color="#1e293b" wireframe transparent opacity={0.08} />
      </mesh>

      {/* Lat/Lon grid rings */}
      <mesh rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[2.0, 0.005, 8, 64]} />
        <meshBasicMaterial color="#2563eb" transparent opacity={0.15} />
      </mesh>
      <mesh rotation={[0, Math.PI / 2, 0]}>
        <torusGeometry args={[2.0, 0.005, 8, 64]} />
        <meshBasicMaterial color="#2563eb" transparent opacity={0.15} />
      </mesh>

      {/* Check-in transmission arcs */}
      {arcs.map((arc, i) => (
        <ConnectionArc key={i} start={arc.start} end={arc.end} />
      ))}
    </group>
  );
}

export default function AnalyticsGlobe() {
  return (
    <div className="w-full flex flex-col items-center justify-center p-6 bg-slate-900/30 border border-white/5 rounded-2xl backdrop-blur-md">
      <div className="text-center mb-4">
        <span className="text-[10px] tracking-[0.3em] font-mono text-emerald-400 uppercase block mb-1">
          Synchronized Network Grid
        </span>
        <h4 className="text-lg font-bold text-white tracking-wide">
          Live Global Sync & Leave Approvals
        </h4>
        <p className="text-xs text-slate-400 mt-1 max-w-sm">
          Multi-campus cloud aggregation running real-time facial database replications under 300ms.
        </p>
      </div>

      {/* Globe Canvas Container */}
      <div className="w-[280px] h-[280px] md:w-[350px] md:h-[350px]">
        <Canvas
          camera={{ position: [0, 0, 4.2], fov: 60 }}
          dpr={[1, 1.5]}
          gl={{ alpha: true, antialias: true, powerPreference: 'high-performance' }}
        >
          <ambientLight intensity={0.6} />
          <directionalLight position={[2, 3, 2]} intensity={1.5} color="#3b82f6" />
          <directionalLight position={[-2, -3, -2]} intensity={0.5} color="#10b981" />
          
          <GlobeModel />
          
          <OrbitControls enableZoom={false} enablePan={false} autoRotate autoRotateSpeed={0.5} />
        </Canvas>
      </div>

      <div className="w-full mt-4 flex items-center justify-around text-center text-[10px] font-mono text-slate-400 border-t border-white/5 pt-4">
        <div>
          <span className="block text-white font-bold text-sm">300ms</span>
          <span>SYNC DRIFT</span>
        </div>
        <div className="border-l border-white/5 h-6"></div>
        <div>
          <span className="block text-emerald-400 font-bold text-sm">99.9%</span>
          <span>UPTIME</span>
        </div>
        <div className="border-l border-white/5 h-6"></div>
        <div>
          <span className="block text-white font-bold text-sm">24k/sec</span>
          <span>CHECK-INS</span>
        </div>
      </div>
    </div>
  );
}
