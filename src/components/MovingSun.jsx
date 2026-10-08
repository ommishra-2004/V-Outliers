import React, { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { useStoryStore } from "./store.js";

export default function MovingSun() {
  const meshRef = useRef(null);
  const lightRef = useRef(null);
  const matRef = useRef(null);

  useFrame(() => {
    const { sunPos, sunOpacity } = useStoryStore.getState();
    if (meshRef.current) {
      meshRef.current.position.copy(sunPos);
      meshRef.current.scale.setScalar(0.7 + sunOpacity * 0.3);
    }
    if (matRef.current) {
      matRef.current.opacity = sunOpacity;
      matRef.current.emissiveIntensity = sunOpacity * 2.5;
    }
    if (lightRef.current) {
      lightRef.current.position.copy(sunPos);
      lightRef.current.intensity = sunOpacity * 2.0;
    }
  });

  return (
    <group>
      <mesh ref={meshRef}>
        <sphereGeometry args={[0.6, 32, 32]} />
        <meshStandardMaterial ref={matRef} color="#FFEA00" emissive="#FFC107" roughness={0.3} transparent opacity={0} />
      </mesh>
      <pointLight ref={lightRef} color="#FFD700" distance={15} decay={2} intensity={0} />
    </group>
  );
}