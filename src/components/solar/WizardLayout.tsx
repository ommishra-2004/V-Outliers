import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useSolarStore } from '../../store/solarStore';
import LocationStep from './steps/LocationStep';
import DetailsStep from './steps/DetailsStep';
import ReviewStep from './steps/ReviewStep';
import { ChevronLeft, ChevronRight, Check } from 'lucide-react';

const STEPS = [
  { id: 1, name: 'Rooftop & Location', short: 'Rooftop' },
  { id: 2, name: 'Energy Consumption', short: 'Energy' },
  { id: 3, name: 'Review & AI Report', short: 'Review' },
];

export default function WizardLayout() {
  const { currentStep, setStep } = useSolarStore();

  const isMapStep = currentStep === 1;

  return (
    <div className={`w-full px-2 sm:px-4 md:px-6 lg:px-8 xl:px-10 ${isMapStep ? 'pt-1 pb-3' : 'pt-3 pb-8 sm:pt-4 sm:pb-10'}`}>
      <div className="mx-auto w-full transition-all duration-300 max-w-[1720px] 2xl:max-w-[1840px]">

        {/* ── Centered Sleek Step Progress Bar (Fits any screen width) ── */}
        <div className="max-w-md sm:max-w-xl mx-auto relative mb-4 sm:mb-6 px-2">
          <div className="relative flex items-center justify-between">
            {/* Background track */}
            <div className="absolute left-3 right-3 h-1 bg-slate-800/90 top-4 sm:top-5 z-0 rounded-full" />
            {/* Active track */}
            <div
              className="absolute left-3 h-1 bg-gradient-to-r from-emerald-500 to-lime-400 top-4 sm:top-5 z-0 rounded-full transition-all duration-500 ease-out shadow-[0_0_10px_rgba(16,185,129,0.5)]"
              style={{ width: `${((currentStep - 1) / (STEPS.length - 1)) * 96}%` }}
            />

            {STEPS.map((step) => {
              const done = step.id < currentStep;
              const active = step.id === currentStep;
              return (
                <div
                  key={step.id}
                  onClick={() => step.id < currentStep && setStep(step.id)}
                  className={`relative z-10 flex flex-col items-center gap-1.5 ${step.id < currentStep ? 'cursor-pointer group' : ''}`}
                >
                  <div className={`
                    w-8 h-8 sm:w-10 sm:h-10 rounded-2xl flex items-center justify-center text-xs sm:text-sm font-black border-2 transition-all duration-300 shadow-md
                    ${done ? 'bg-emerald-500 border-emerald-400 text-slate-950 group-hover:scale-105 shadow-[0_0_12px_rgba(16,185,129,0.3)]' :
                      active ? 'bg-emerald-500/25 border-emerald-400 text-emerald-300 shadow-[0_0_20px_rgba(16,185,129,0.5)] scale-105 ring-4 ring-emerald-500/15' :
                      'bg-slate-900 border-slate-700/80 text-slate-500'}
                  `}>
                    {done ? <Check className="w-4 h-4 sm:w-5 sm:h-5 stroke-[3]" /> : step.id}
                  </div>
                  <span className={`text-[11px] sm:text-xs font-bold tracking-wide ${active ? 'text-emerald-400 font-extrabold' : done ? 'text-slate-300' : 'text-slate-500'}`}>
                    {step.short}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* ── Step Content Card (Spans beautifully to edges with smooth rounding) ── */}
        <div className={`w-full bg-white/[0.02] backdrop-blur-md border border-white/10 rounded-2xl sm:rounded-3xl shadow-2xl overflow-hidden flex flex-col ${isMapStep ? 'p-2 sm:p-3 lg:p-4' : 'p-4 sm:p-6 lg:p-8 xl:p-9 min-h-[calc(100vh-190px)]'}`}>
          <AnimatePresence mode="wait">
            <motion.div
              key={currentStep}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.18, ease: 'easeOut' }}
              className="w-full flex-1 flex flex-col"
            >
              {currentStep === 1 && <LocationStep />}
              {currentStep === 2 && <DetailsStep />}
              {currentStep === 3 && <ReviewStep />}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
