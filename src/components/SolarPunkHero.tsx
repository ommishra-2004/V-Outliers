import React from "react";
import { Canvas } from "@react-three/fiber";
import { EffectComposer, Bloom } from "@react-three/postprocessing";
import { useStoryStore } from "./store.js";
import { FLOWER_HEAD, FLOWER_BASE, BAT_TOP } from "./constants.js";

import StoryManager from "./StoryManager.jsx";
import MovingSun from "./MovingSun.jsx";
import BatteryGrid from "./BatteryGrid.jsx";
import KawaiiSunflower from "./KawaiiSunflower.jsx";
import ParticleBeam from "./ParticleBeam.jsx";
import GroundLine from "./GroundLine.jsx";
import UIOverlay from "./UIOverlay.jsx";

export default function SolarPunkHero() {
  return (
    <div className="relative w-full h-screen overflow-hidden bg-[#050907]">
      <div className="absolute inset-0 z-0 bg-[radial-gradient(ellipse_at_30%_50%,rgba(30,40,20,1)_0%,rgba(5,9,7,1)_70%)] pointer-events-none" />

      <div className="absolute inset-0 z-0 pointer-events-auto">
        <Canvas camera={{ position: [0, 0, 8.5], fov: 45 }} gl={{ antialias: true, alpha: false, toneMappingExposure: 1.1 }}>
          <StoryManager />

          <ambientLight intensity={0.4} color="#1b4d2e" />
          <directionalLight position={[-2, 4, 4]} color="#FFD700" intensity={0.5} />

          <MovingSun />
          <BatteryGrid />
          <KawaiiSunflower />
          <GroundLine />

          {/* ── Synchronized Energy Rays ── */}
          <ParticleBeam
            getStart={() => useStoryStore.getState().sunPos}
            getEnd={() => FLOWER_HEAD}
            activePhases={[1, 2]}
            color="#FFEA00"
            arcOffsetX={0.0}
            count={70}
            syncOpacity={true}
          />

          <ParticleBeam
            getStart={() => FLOWER_BASE}
            getEnd={() => BAT_TOP}
            activePhases={[1]}
            color="#FFD700"
            arcOffsetX={0.1}
            count={60}
            speed={1.5}
          />

          <ParticleBeam
            getStart={() => BAT_TOP}
            getEnd={() => FLOWER_BASE}
            activePhases={[3]}
            color="#4CAF50"
            arcOffsetX={-0.1}
            count={80}
            speed={2.0}
          />

          <EffectComposer>
            <Bloom intensity={0.5} luminanceThreshold={0.8} mipmapBlur />
          </EffectComposer>
        </Canvas>
      </div>

      <UIOverlay />
    </div>
  );
}