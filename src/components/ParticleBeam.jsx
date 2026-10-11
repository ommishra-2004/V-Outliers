import React, { useRef, useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { useStoryStore } from "./store.js";

export default function ParticleBeam({ getStart, getEnd, activePhases, color, arcOffsetX = 0.0, count = 80, speed = 1.0, syncOpacity = false }) {
  const pointsRef = useRef(null);
  const matRef = useRef(null);

  const { positions, randoms } = useMemo(() => {
    const pos = new Float32Array(count * 3);
    const rand = new Float32Array(count);
    for (let i = 0; i < count; i++) rand[i] = Math.random();
    return { positions: pos, randoms: rand };
  }, [count]);

  const curveNode = new THREE.Vector3();

  useFrame((state, delta) => {
    if (!pointsRef.current || !matRef.current) return;
    const safeDelta = Math.min(delta, 0.1);
    const pos = pointsRef.current.geometry.attributes.position.array;
    const start = getStart();
    const end = getEnd();
    
    // Evaluate active state dynamically inside the loop
    const currentPhase = useStoryStore.getState().phase;
    const isActive = activePhases.includes(currentPhase);

    curveNode.lerpVectors(start, end, 0.5);
    curveNode.x += arcOffsetX;

    for (let i = 0; i < count; i++) {
      let life = (state.clock.elapsedTime * 0.4 * speed + randoms[i]) % 1.0;

      if (isActive) {
        const t = life;
        const u = 1 - t;
        const p = new THREE.Vector3();
        p.addScaledVector(start, u * u);
        p.addScaledVector(curveNode, 2 * u * t);
        p.addScaledVector(end, t * t);

        p.add(new THREE.Vector3(
          Math.sin(life * Math.PI * 4 + randoms[i] * 10) * (1 - t) * t * 0.2,
          0,
          Math.sin(life * Math.PI * 4) * (1 - t) * t * 0.2
        ));

        pos[i * 3] = p.x;
        pos[i * 3 + 1] = p.y;
        pos[i * 3 + 2] = p.z;
      } else {
        pos[i * 3] = end.x;
        pos[i * 3 + 1] = end.y;
        pos[i * 3 + 2] = end.z;
      }
    }
    pointsRef.current.geometry.attributes.position.needsUpdate = true;

    let targetAlpha = isActive ? 1.0 : 0.0;
    if (syncOpacity && isActive) targetAlpha = useStoryStore.getState().sunOpacity;
    matRef.current.opacity = THREE.MathUtils.lerp(matRef.current.opacity, targetAlpha, safeDelta * 15);
  });

  return (
    <points ref={pointsRef}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
      </bufferGeometry>
      <pointsMaterial ref={matRef} size={0.05} color={color} transparent opacity={0} depthWrite={false} blending={THREE.AdditiveBlending} />
    </points>
  );
}