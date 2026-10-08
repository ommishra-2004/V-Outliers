import React, { useRef, useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { useStoryStore } from "./store.js";
import { FLOWER_BASE, OUTLINE_COLOR } from "./constants.js";

export default function KawaiiSunflower() {
  const headGrp = useRef(null);
  const petalsGrp = useRef(null);
  const mouthRef = useRef(null);

  const stemCurve = useMemo(() => new THREE.QuadraticBezierCurve3(
    new THREE.Vector3(0, -0.8, 0),
    new THREE.Vector3(-0.35, 0.3, 0),
    new THREE.Vector3(0, 1.4, 0)
  ), []);

  useFrame((_, delta) => {
    const safeDelta = Math.min(delta, 0.1);
    const { isSad } = useStoryStore.getState();
    const organicSpeed = safeDelta * 2.5;

    if (headGrp.current) {
      const targetTilt = isSad ? 0.35 : -0.15;
      headGrp.current.rotation.x = THREE.MathUtils.lerp(headGrp.current.rotation.x, targetTilt, organicSpeed);
    }

    if (mouthRef.current) {
      const targetMouth = isSad ? 0 : Math.PI;
      mouthRef.current.rotation.z = THREE.MathUtils.lerp(mouthRef.current.rotation.z, targetMouth, safeDelta * 6);
    }

    if (petalsGrp.current) {
      const targetScale = isSad ? 0.85 : 1.0;
      petalsGrp.current.scale.setScalar(THREE.MathUtils.lerp(petalsGrp.current.scale.x, targetScale, organicSpeed));

      const targetEmissive = isSad ? 0.1 : 0.8;

      petalsGrp.current.traverse((child) => {
        if (child.isMesh && child.material && child.material.type === "MeshStandardMaterial") {
          child.material.emissiveIntensity = THREE.MathUtils.lerp(child.material.emissiveIntensity, targetEmissive, organicSpeed);
        }
      });
    }
  });

  const NUM_PETALS = 16;
  const backPetals = Array.from({ length: NUM_PETALS }).map((_, i) => (i / NUM_PETALS) * Math.PI * 2);
  const frontPetals = Array.from({ length: NUM_PETALS }).map((_, i) => ((i / NUM_PETALS) * Math.PI * 2) + (Math.PI / NUM_PETALS));

  return (
    <group position={FLOWER_BASE}>
      <group position={[0, 1.4, 0]}>
        <group ref={headGrp}>

          <group position={[0, 0, 0.05]}>
            <mesh rotation={[Math.PI / 2, 0, 0]} position={[0, 0, -0.01]}>
              <cylinderGeometry args={[0.41, 0.41, 0.06, 32]} />
              <meshBasicMaterial color={OUTLINE_COLOR} />
            </mesh>
            <mesh rotation={[Math.PI / 2, 0, 0]}>
              <cylinderGeometry args={[0.38, 0.38, 0.08, 32]} />
              <meshStandardMaterial color="#FFE082" roughness={1.0} metalness={0.0} />
            </mesh>
          </group>

          <group ref={petalsGrp}>
            {backPetals.map((angle, i) => (
              <group key={`back-${i}`} rotation={[0, 0, angle]}>
                <group position={[0, 0.55, -0.05]} rotation={[-0.05, 0, 0]}>
                  <mesh position={[0, 0, -0.02]} scale={[1.3, 2.1, 0.1]}>
                    <sphereGeometry args={[0.12, 16, 16]} />
                    <meshBasicMaterial color={OUTLINE_COLOR} />
                  </mesh>
                  <mesh scale={[1.2, 2.0, 0.2]}>
                    <sphereGeometry args={[0.12, 16, 16]} />
                    <meshStandardMaterial color="#FFB300" emissive="#FF9800" emissiveIntensity={0.8} roughness={0.8} metalness={0.0} />
                  </mesh>
                  <mesh position={[0, -0.05, 0.025]} scale={[0.15, 0.5, 0.1]}>
                    <sphereGeometry args={[0.12, 8, 8]} />
                    <meshBasicMaterial color="#F57F17" />
                  </mesh>
                </group>
              </group>
            ))}

            {frontPetals.map((angle, i) => (
              <group key={`front-${i}`} rotation={[0, 0, angle]}>
                <group position={[0, 0.52, 0.0]} rotation={[0.02, 0, 0]}>
                  <mesh position={[0, 0, -0.02]} scale={[1.3, 2.1, 0.1]}>
                    <sphereGeometry args={[0.12, 16, 16]} />
                    <meshBasicMaterial color={OUTLINE_COLOR} />
                  </mesh>
                  <mesh scale={[1.2, 2.0, 0.2]}>
                    <sphereGeometry args={[0.12, 16, 16]} />
                    <meshStandardMaterial color="#FFCA28" emissive="#FFB300" emissiveIntensity={0.8} roughness={0.8} metalness={0.0} />
                  </mesh>
                  <mesh position={[0, -0.05, 0.025]} scale={[0.15, 0.5, 0.1]}>
                    <sphereGeometry args={[0.12, 8, 8]} />
                    <meshBasicMaterial color="#FF9800" />
                  </mesh>
                </group>
              </group>
            ))}
          </group>

          <group position={[0, 0, 0.1]}>
            <mesh position={[-0.15, 0.05, 0]}>
              <sphereGeometry args={[0.07, 16, 16]} />
              <meshBasicMaterial color={OUTLINE_COLOR} />
              <mesh position={[0.025, 0.025, 0.06]}>
                <sphereGeometry args={[0.02, 12, 12]} />
                <meshBasicMaterial color="#FFFFFF" />
              </mesh>
            </mesh>

            <mesh position={[0.15, 0.05, 0]}>
              <sphereGeometry args={[0.07, 16, 16]} />
              <meshBasicMaterial color={OUTLINE_COLOR} />
              <mesh position={[0.025, 0.025, 0.06]}>
                <sphereGeometry args={[0.02, 12, 12]} />
                <meshBasicMaterial color="#FFFFFF" />
              </mesh>
            </mesh>

            <mesh position={[-0.22, -0.05, 0]} scale={[1, 1, 0.2]}>
              <sphereGeometry args={[0.06, 16, 16]} />
              <meshBasicMaterial color="#FF8A80" />
            </mesh>
            <mesh position={[0.22, -0.05, 0]} scale={[1, 1, 0.2]}>
              <sphereGeometry args={[0.06, 16, 16]} />
              <meshBasicMaterial color="#FF8A80" />
            </mesh>

            <mesh ref={mouthRef} position={[0, -0.04, 0.01]}>
              <torusGeometry args={[0.08, 0.02, 16, 32, Math.PI]} />
              <meshBasicMaterial color={OUTLINE_COLOR} />
            </mesh>
          </group>

        </group>
      </group>

      <group position={[0, 0, 0]}>
        <mesh>
          <tubeGeometry args={[stemCurve, 20, 0.045, 16, false]} />
          <meshStandardMaterial color="#66BB6A" roughness={1.0} metalness={0.0} />
        </mesh>

        <group position={[-0.2, 0.1, 0]} rotation={[0, 0, 0.8]}>
          <mesh position={[0, 0.25, -0.02]} scale={[1.3, 2.1, 0.1]}>
            <sphereGeometry args={[0.1, 16, 16]} />
            <meshBasicMaterial color={OUTLINE_COLOR} />
          </mesh>
          <mesh position={[0, 0.25, 0]} scale={[1.2, 2.0, 0.2]}>
            <sphereGeometry args={[0.1, 16, 16]} />
            <meshStandardMaterial color="#66BB6A" roughness={1.0} metalness={0.0} />
          </mesh>
        </group>

        <group position={[0.1, -0.3, 0]} rotation={[0, 0, -0.8]}>
          <mesh position={[0, 0.25, -0.02]} scale={[1.3, 2.1, 0.1]}>
            <sphereGeometry args={[0.1, 16, 16]} />
            <meshBasicMaterial color={OUTLINE_COLOR} />
          </mesh>
          <mesh position={[0, 0.25, 0]} scale={[1.2, 2.0, 0.2]}>
            <sphereGeometry args={[0.1, 16, 16]} />
            <meshStandardMaterial color="#66BB6A" roughness={1.0} metalness={0.0} />
          </mesh>
        </group>
      </group>
    </group>
  );
}