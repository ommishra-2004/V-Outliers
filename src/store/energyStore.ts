// ─── Energy Store ─────────────────────────────────────────────────────────────
// Central Zustand store. The 3D canvas writes charge; the HUD reads it.
// ─────────────────────────────────────────────────────────────────────────────
import { create } from "zustand";

export interface EnergyState {
  /** 0 → 1 normalised charge */
  charge: number;
  /** true while cursor is inside the flower core hit-zone */
  isHarvesting: boolean;
  /** smooth turbine speed multiplier derived from charge */
  turbineRPM: number;
  // actions
  setHarvesting(v: boolean): void;
  tick(delta: number): void;
}

export const useEnergyStore = create<EnergyState>((set, get) => ({
  charge: 0,
  isHarvesting: false,
  turbineRPM: 0,

  setHarvesting: (v) => set({ isHarvesting: v }),

  tick: (delta) => {
    const { isHarvesting, charge, turbineRPM } = get();
    const nextCharge = isHarvesting
      ? Math.min(1, charge + 0.4 * delta)   // charge rate
      : Math.max(0, charge - 0.15 * delta);  // decay rate
    const targetRPM = nextCharge * 8;
    const nextRPM = turbineRPM + (targetRPM - turbineRPM) * Math.min(1, delta * 3);
    set({ charge: nextCharge, turbineRPM: nextRPM });
  },
}));
