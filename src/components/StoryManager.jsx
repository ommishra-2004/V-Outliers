import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { useStoryStore } from "./store.js";
import { SUN_START, SUN_END } from "./constants.js";

export default function StoryManager() {
  useFrame((_, delta) => {
    const safeDelta = Math.min(delta, 0.1);

    const s = useStoryStore.getState();
    const nextTime = (s.time + safeDelta) % 16.0;

    let phase = 1, sunOpacity = 0, batFill = s.batteryFill, isSad = false;
    const sunPos = new THREE.Vector3();

    if (nextTime < 8.0) {
      const t = nextTime / 8.0;
      sunPos.lerpVectors(SUN_START, SUN_END, t);
      sunPos.y += Math.sin(t * Math.PI) * 0.8;

      if (sunPos.x >= 6.0) {
        sunOpacity = Math.max(0, (7.5 - sunPos.x) / 1.5);
        phase = 1;
        isSad = false;
        batFill = Math.min(1.0, nextTime / 4.0);
      } else if (sunPos.x >= 3.0) {
        sunOpacity = 1.0;
        phase = 1;
        isSad = false;
        batFill = Math.min(1.0, nextTime / 4.0);
      } else {
        sunOpacity = Math.max(0.0, (sunPos.x - 1.0) / 2.0);
        phase = 2;
        batFill = 1.0;
        isSad = true;
      }
    } else if (nextTime < 13.0) {
      phase = 3;
      sunPos.copy(SUN_START);
      sunOpacity = 0.0;
      batFill = Math.max(0.0, 1.0 - ((nextTime - 8.0) / 5.0));
      isSad = false;
    } else {
      phase = 4;
      sunPos.copy(SUN_START);
      sunOpacity = 0.0;
      batFill = 0.0;
      isSad = false;
    }

    useStoryStore.setState({ time: nextTime, phase, sunPos, sunOpacity, batteryFill: batFill, isSad });
  });
  return null;
}