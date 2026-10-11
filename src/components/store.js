import { create } from "zustand";
import { SUN_START } from "./constants.js";

export const useStoryStore = create(() => ({
  time: 0,
  phase: 1,
  sunPos: SUN_START.clone(),
  sunOpacity: 0,
  batteryFill: 0,
  isSad: false,
}));