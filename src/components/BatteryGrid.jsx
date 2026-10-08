import React, { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { useStoryStore } from "./store.js";
import { BAT_BASE, OUTLINE_COLOR } from "./constants.js";

export default function BatteryGrid() {
  const fills = useRef([]);

  useFrame(() => {
    const { batteryFill } = useStoryStore.getState();
    fills.current.forEach((fill) => {
      if (fill) {
        fill.scale.y = Math.max(0.001, batteryFill);
      }
    });
  });

  const offset = 0.5;
  return (
    <group position={BAT_BASE}>
      <mesh position={[0, -0.65, 0]}>
        <cylinderGeometry args={[0.95, 1.0, 0.15, 32]} />
        <meshStandardMaterial color={OUTLINE_COLOR} roughness={1.0} />
      </mesh>
      <mesh position={[0, -0.58, 0]}>
        <cylinderGeometry args={[0.9, 0.9, 0.05, 32]} />
        <meshStandardMaterial color="#374151" roughness={0.5} />
      </mesh>

      {[[-offset, 0, -0.15], [offset, 0, -0.15], [0, 0, offset * 0.8]].map((pos, i) => (
        <group key={i} position={pos}>
          <mesh>
            <cylinderGeometry args={[0.24, 0.24, 1.25, 16]} />
            <meshBasicMaterial color={OUTLINE_COLOR} side={THREE.BackSide} />
          </mesh>
          <mesh>
            <cylinderGeometry args={[0.22, 0.22, 1.2, 16]} />
            <meshStandardMaterial color="#ffffff" metalness={0.5} roughness={0.2} transparent opacity={0.2} />
          </mesh>
          <mesh position={[0, -0.6, 0]}>
            <cylinderGeometry args={[0.24, 0.24, 0.08, 16]} />
            <meshStandardMaterial color={OUTLINE_COLOR} />
          </mesh>
          <mesh position={[0, 0.6, 0]}>
            <cylinderGeometry args={[0.24, 0.24, 0.08, 16]} />
            <meshStandardMaterial color={OUTLINE_COLOR} />
          </mesh>
          <mesh position={[0, 0.68, 0]}>
            <cylinderGeometry args={[0.1, 0.1, 0.08, 16]} />
            <meshStandardMaterial color={OUTLINE_COLOR} />
          </mesh>
          <group position={[0, -0.58, 0]} ref={(el) => { if (el) fills.current[i] = el; }}>
            <mesh position={[0, 0.55, 0]}>
              <cylinderGeometry args={[0.18, 0.18, 1.1, 16]} />
              <meshStandardMaterial color="#4CAF50" emissive="#4CAF50" emissiveIntensity={1.5} />
            </mesh>
          </group>
        </group>
      ))}
    </group>
  );
}