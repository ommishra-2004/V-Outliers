import React from "react";
import { motion } from "framer-motion";
import { Sun, Battery, BatteryWarning, ArrowRight, Database, Zap } from "lucide-react";
import { useStoryStore } from "./store.js";

export default function UIOverlay() {
  const { phase, batteryFill } = useStoryStore();

  const getHudData = () => {
    switch (phase) {
      case 1: return { text: "SOLAR CAPTURE ➔ CHARGING", cls: "text-[#FFD700] border-[#FFD700]/50", icon: <Sun size={14} /> };
      case 2: return { text: "SUNSET ➔ POWER DECAY", cls: "text-[#FFCA28] border-[#FFCA28]/50", icon: <BatteryWarning size={14} /> };
      case 3: return { text: "NIGHT ➔ BATTERY REVIVE", cls: "text-[#4CAF50] border-[#4CAF50]/50", icon: <Battery size={14} /> };
      case 4: return { text: "SUNRISE ➔ GRID PREPARING", cls: "text-[#FFD700] border-[#FFD700]/50", icon: <Sun size={14} /> };
      default: return { text: "", cls: "", icon: <Zap size={14} /> };
    }
  };
  const hud = getHudData();

  return (
    <div className="absolute inset-0 z-10 flex flex-col justify-between p-8 md:p-12 pointer-events-none selection:bg-[#4CAF50]/30" style={{ fontFamily: "system-ui, -apple-system, sans-serif" }}>

      <header className="flex justify-between items-start">
        <h2 className="text-[12px] font-black tracking-[0.2em] text-white/90 uppercase">
          AURORA <span className="opacity-40">GRID</span>
        </h2>
        <button className="pointer-events-auto cursor-pointer px-4 py-2 bg-white/10 hover:bg-white/20 border border-white/20 rounded text-[10px] uppercase font-bold tracking-widest backdrop-blur transition-all text-white">
          Menu ≡
        </button>
      </header>

      <main className="max-w-2xl mt-auto mb-12 space-y-6">
        <motion.div
          layout
          className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full border bg-black/40 backdrop-blur-md text-[10px] uppercase font-bold tracking-widest transition-colors duration-500 shadow-lg ${hud.cls}`}
        >
          {hud.icon} {hud.text}
        </motion.div>

        <h1 className="text-5xl md:text-6xl lg:text-8xl font-black leading-[0.95] tracking-tighter text-white uppercase">
          HARVEST LIGHT. <br />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#FFD700] to-[#4CAF50]">
            REUSE ENERGY.
          </span>
        </h1>

        <p className="max-w-md text-sm md:text-base leading-relaxed text-white/80 font-medium tracking-wide">
          Never let the lights go out. Capture daily sunshine in beautiful organic arrays, send the excess to sleek storage grids, and watch nature burst into bloom through the night!
        </p>

        <div className="pt-4">
          <button className="pointer-events-auto cursor-pointer px-8 py-3.5 bg-white/5 border border-white/20 hover:border-[#4CAF50]/80 hover:bg-[#4CAF50]/20 hover:-translate-y-1 rounded-full text-[11px] font-bold uppercase tracking-[0.15em] transition-all duration-300 flex items-center gap-2 backdrop-blur-lg text-white shadow-lg">
            Build The Future <ArrowRight size={14} className="ml-1" />
          </button>
        </div>
      </main>

      <footer className="w-full flex items-end justify-between pt-6 border-t border-white/10 bg-black/20 backdrop-blur-sm p-6 rounded-2xl pointer-events-auto -m-2 md:m-0 cursor-default shadow-2xl">
        <div>
          <div className="flex items-center gap-2 text-[9px] uppercase font-bold tracking-widest text-white/50 mb-1">
            <Database size={10} /> Local Battery Integrity
          </div>
          <div className="text-2xl md:text-3xl font-black tracking-tighter transition-colors duration-500" style={{ color: phase === 3 ? "#4CAF50" : "#FFD700" }}>
            {Math.round(batteryFill * 100)}%
          </div>
        </div>
        <div className="text-right">
          <div className="text-[9px] uppercase font-bold tracking-widest text-white/50 mb-1">Network Base Time</div>
          <div className="text-sm md:text-lg font-bold tracking-wider text-white/90 tabular-nums">
            00:00:{(useStoryStore(s => s.time)).toFixed(1).padStart(4, '0')}
          </div>
        </div>
      </footer>
    </div>
  );
}