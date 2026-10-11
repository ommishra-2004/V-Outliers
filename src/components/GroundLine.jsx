import React, { useMemo } from "react";
import * as THREE from "three";

export default function GroundLine() {
  const curve = useMemo(() => {
    const points = [];
    const segments = 40;
    for (let i = 0; i <= segments; i++) {
      const x = 2 + (i / segments) * 3;              // span x from 2 to 5
      const y = Math.sin(i * 0.55) * 0.08;           // gentle wave
      points.push(new THREE.Vector3(x, y, 0));
    }
    return new THREE.CatmullRomCurve3(points);
  }, []);

  return (
    <group position={[0, -1.65, 0]}>
      <mesh>
        <tubeGeometry args={[curve, 80, 0.02, 8, false]} />
        <meshStandardMaterial
          color="#4a6741"
          emissive="#2e7d32"
          emissiveIntensity={0.3}
          roughness={0.8}
        />
      </mesh>
    </group>
  );
}
