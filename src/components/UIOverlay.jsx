import React from "react";
import { motion } from "framer-motion";
import { Sun, Battery, BatteryWarning, Database, Zap } from "lucide-react";
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
    <div className="absolute inset-0 z-10 flex flex-col justify-between p-6 sm:p-8 md:p-12 pointer-events-none selection:bg-[#4CAF50]/30 pt-16 md:pt-20" style={{ fontFamily: "system-ui, -apple-system, sans-serif" }}>

      {/* Top spacer to ensure clean clearance under main nav */}
      <div className="h-2" />

      {/* Main Hero Showcase with comfortable gaps between segments */}
      <main className="max-w-2xl mt-auto mb-10 sm:mb-14 flex flex-col">
        
        {/* Segment 1: HUD Live Status Pill */}
        <div className="mb-4 sm:mb-5">
          <motion.div
            layout
            className={`inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border bg-black/40 backdrop-blur-md text-[10px] uppercase font-bold tracking-widest transition-colors duration-500 shadow-lg ${hud.cls}`}
          >
            {hud.icon} {hud.text}
          </motion.div>
        </div>

        {/* Segment 2: Headline with refined, elegant scale */}
        <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl xl:text-[4.2rem] font-black leading-[1.02] tracking-tight text-white uppercase mb-4 sm:mb-5">
          LESS FRICTION. <br />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#FFD700] to-[#4CAF50]">
            MORE SOLAR.
          </span>
        </h1>

        {/* Segment 3: Subtitle Description */}
        <p className="max-w-lg text-xs sm:text-sm md:text-base leading-relaxed text-white/80 font-medium tracking-wide mb-6 sm:mb-7">
          Accelerating clean energy adoption across India with frictionless rooftop intelligence and smart grid discovery.
        </p>

        {/* Segment 4: Dual Functionality Cards with generous gaps */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5 max-w-xl">
          {/* Individual Feature Card */}
          <div className="p-4 rounded-2xl bg-black/55 border border-white/10 backdrop-blur-md pointer-events-auto shadow-xl hover:border-amber-400/40 transition-colors flex flex-col justify-between space-y-1.5">
            <div className="flex items-center gap-1.5 text-xs font-bold text-amber-300 uppercase tracking-wider">
              <Sun size={13} className="text-amber-400" />
              <span>For Individuals</span>
            </div>
            <p className="text-[11px] sm:text-xs text-white/80 leading-relaxed font-normal">
              Instant AI rooftop sizing, PM Surya Ghar subsidy breakdown &amp; verified reverse-auction vendor quotes.
            </p>
          </div>

          {/* Investor Feature Card */}
          <div className="p-4 rounded-2xl bg-black/55 border border-white/10 backdrop-blur-md pointer-events-auto shadow-xl hover:border-emerald-400/40 transition-colors flex flex-col justify-between space-y-1.5">
            <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-300 uppercase tracking-wider">
              <Zap size={13} className="text-emerald-400" />
              <span>For Investors</span>
            </div>
            <p className="text-[11px] sm:text-xs text-white/80 leading-relaxed font-normal">
              Discover high-conviction EV charging &amp; microgrid hotspots across India driven by live VAHAN registry data.
            </p>
          </div>
        </div>

      </main>

      {/* Grid Telemetry Footer */}
      <footer className="w-full flex items-end justify-between pt-4 border-t border-white/10 bg-black/30 backdrop-blur-sm p-4 sm:p-5 rounded-2xl pointer-events-auto -m-2 md:m-0 cursor-default shadow-2xl shrink-0">
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