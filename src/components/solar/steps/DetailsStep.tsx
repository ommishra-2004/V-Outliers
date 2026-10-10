import React from 'react';
import { useSolarStore } from '../../../store/solarStore';
import { 
  Zap, 
  Sun, 
  ArrowRight, 
  ChevronLeft 
} from 'lucide-react';

// Comprehensive State-wise solar data mapping (units per kW per month)
const STATE_SOLAR_DATA: Record<string, number> = {
  'Rajasthan': 165, 'Gujarat': 150, 'Maharashtra': 135, 'Karnataka': 144, 'Tamil Nadu': 138,
  'Kerala': 114, 'Delhi': 135, 'Uttar Pradesh': 129, 'UP': 129, 'Punjab': 135, 'Haryana': 138,
  'West Bengal': 117, 'Bihar': 126, 'Odisha': 132, 'Madhya Pradesh': 141, 'MP': 141, 'Chhattisgarh': 135,
  'Telangana': 144, 'Andhra Pradesh': 147, 'AP': 147, 'Jharkhand': 123, 'Assam': 111, 'Goa': 132,
  'Uttarakhand': 132, 'Himachal Pradesh': 129, 'HP': 129, 'Jammu and Kashmir': 129, 'J&K': 129, 'Ladakh': 180,
  'Sikkim': 108, 'Meghalaya': 105, 'Nagaland': 108, 'Manipur': 108, 'Mizoram': 108,
  'Tripura': 111, 'Arunachal Pradesh': 108, 'Chandigarh': 135, 'Puducherry': 141,
  'Dadra and Nagar Haveli and Daman and Diu': 147, 'D&NH/DD': 147, 'Lakshadweep': 144,
  'Andaman and Nicobar Islands': 126, 'A&N': 126,
};

export default function DetailsStep() {
  const { siteInput, detectedGrossArea, updateSiteInput, setStep } = useSolarStore();
  
  const bill = siteInput.monthlyBill || 2500;
  const area = siteInput.roofAreaSqft || detectedGrossArea || 1200;
  const tariff = siteInput.averageTariff || 8.0;
  const state = siteInput.state || 'Karnataka';
  
  const unitsPerKwMonth = STATE_SOLAR_DATA[state] || 120;
  
  // Real engineering calculations
  const monthlyUnits = Math.round(bill / tariff);
  const capacityByBill = monthlyUnits / unitsPerKwMonth;
  const capacityByArea = (area * 0.75) / 100.0;
  const recommendedKw = Math.max(1.0, Math.round(Math.min(capacityByBill, capacityByArea) * 10) / 10);
  const totalPanels = Math.ceil(recommendedKw * 2.5);
  const annualGenUnits = Math.round(recommendedKw * unitsPerKwMonth * 12);
  const annualSavings = Math.round(annualGenUnits * tariff);
  const monthlySavings = Math.round(annualSavings / 12);
  
  // Central Subsidy PM Surya Ghar rules
  let subsidy = 0;
  if (recommendedKw >= 3) {
    subsidy = 78000;
  } else if (recommendedKw >= 2) {
    subsidy = 60000 + (recommendedKw - 2) * 18000;
  } else {
    subsidy = recommendedKw * 30000;
  }
  
  const grossCapex = recommendedKw * 52000;
  const netInvestment = Math.max(0, grossCapex - subsidy);
  const paybackPeriod = annualSavings > 0 ? (netInvestment / annualSavings).toFixed(1) : '2.5';
  const coveragePercent = Math.min(100, Math.round(((totalPanels * 20) / Math.max(area, 1)) * 100));

  const fmt = (num: number) => new Intl.NumberFormat('en-IN').format(Math.round(num));

  return (
    <div className="w-full flex flex-col justify-between min-h-[calc(100vh-210px)] space-y-6 lg:space-y-8">
      {/* ── Top Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-white/10 pb-4">
        <div>
          <div className="flex items-center gap-2 text-emerald-400 text-xs font-bold uppercase tracking-wider mb-1">
            <Zap className="w-4 h-4" />
            <span>Step 2 of 3 · Energy Consumption</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            Electricity &amp; Solar Sizing
          </h2>
        </div>
        <div className="inline-flex items-center px-4 py-2 rounded-full bg-slate-900/90 border border-emerald-500/30 text-xs font-semibold text-slate-300 self-start sm:self-auto">
          <Sun className="w-4 h-4 text-amber-400 mr-2" />
          <span>Solar Yield: <strong className="text-emerald-400">{state}</strong> ({unitsPerKwMonth} units/kW/mo)</span>
        </div>
      </div>

      {/* ── Centered Input vs Output Grid ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8 items-stretch flex-1">
        
        {/* ── LEFT PANEL (Inputs): 1. Tell us your energy usage ── */}
        <div className="bg-slate-900/60 rounded-3xl p-6 sm:p-8 lg:p-9 border border-white/10 shadow-xl flex flex-col justify-between space-y-6">
          <div className="space-y-7">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <h3 className="text-base sm:text-lg font-bold text-white">
                1. Tell us your energy usage
              </h3>
              <span className="text-xs text-slate-400 font-medium">Input Parameters</span>
            </div>

            {/* Monthly Power Bill with Right-Aligned Uniform Amount */}
            <div className="space-y-4">
              <div className="flex justify-between items-baseline">
                <label className="text-sm font-semibold text-slate-300">
                  Monthly Power Bill
                </label>
                <div className="text-right">
                  <span className="text-3xl sm:text-4xl font-black text-emerald-400 tracking-tight">
                    ₹{fmt(bill)}
                  </span>
                  <span className="text-xs text-slate-400 font-medium"> / month</span>
                </div>
              </div>

              <input
                type="range"
                min="500"
                max="30000"
                step="500"
                value={bill}
                onChange={(e) => updateSiteInput({ monthlyBill: parseInt(e.target.value) })}
                className="w-full h-2.5 bg-slate-800 rounded-full appearance-none cursor-pointer accent-emerald-500"
              />

              {/* 4 Clean Preset Pills */}
              <div className="grid grid-cols-4 gap-2.5 pt-1">
                {[1500, 3000, 6000, 12000].map((val) => (
                  <button
                    key={val}
                    type="button"
                    onClick={() => updateSiteInput({ monthlyBill: val })}
                    className={`py-2 px-1 rounded-xl text-xs font-bold transition-all border text-center cursor-pointer ${
                      bill === val
                        ? 'bg-emerald-500/20 border-emerald-400 text-emerald-300 shadow-sm'
                        : 'bg-slate-950/60 border-white/10 text-slate-400 hover:text-white hover:bg-slate-800'
                    }`}
                  >
                    ₹{fmt(val)}
                  </button>
                ))}
              </div>
            </div>

            {/* Rooftop Space with Right-Aligned Value */}
            <div className="space-y-4 pt-4 border-t border-white/10">
              <div className="flex justify-between items-baseline">
                <label className="text-sm font-semibold text-slate-300">
                  Available Rooftop Space
                </label>
                <div className="text-right">
                  <span className="text-2xl sm:text-3xl font-black text-white tracking-tight">
                    {fmt(area)}
                  </span>
                  <span className="text-xs text-slate-400 font-medium"> sq ft</span>
                </div>
              </div>

              <input
                type="range"
                min="200"
                max="5000"
                step="50"
                value={area}
                onChange={(e) => updateSiteInput({ roofAreaSqft: parseInt(e.target.value) })}
                className="w-full h-2.5 bg-slate-800 rounded-full appearance-none cursor-pointer accent-emerald-500"
              />

              <p className="text-xs text-slate-400">
                Panels require ~{totalPanels * 20} sq ft ({coveragePercent}% of roof, leaving {100 - coveragePercent}% free open terrace)
              </p>
            </div>
          </div>

          {/* Visually Distinct Footer Box for Tariff Rate & Estimated Monthly Usage */}
          <div className="bg-slate-950/70 rounded-2xl p-4 border border-white/10 flex items-center justify-between gap-4">
            <div>
              <span className="text-xs text-slate-400 block font-medium">Estimated Usage</span>
              <strong className="text-white text-sm font-bold">~{monthlyUnits} units / month</strong>
            </div>

            <div className="h-8 w-px bg-white/10" />

            <div className="flex items-center gap-2">
              <div className="text-right">
                <span className="text-xs text-slate-400 block font-medium">Grid Tariff</span>
                <span className="text-[11px] text-slate-500">DISCOM rate</span>
              </div>
              <div className="flex items-center gap-1.5 bg-slate-900 border border-white/10 rounded-xl px-3 py-1.5 shadow-inner">
                <span className="text-xs text-slate-400 font-bold">₹</span>
                <input
                  type="number"
                  min="3"
                  max="18"
                  step="0.5"
                  value={tariff}
                  onChange={(e) => updateSiteInput({ averageTariff: parseFloat(e.target.value) || 8.0 })}
                  className="w-10 bg-transparent text-sm font-bold text-white text-center focus:outline-none"
                />
                <span className="text-xs text-slate-400">/u</span>
              </div>
            </div>
          </div>
        </div>

        {/* ── RIGHT PANEL (Outputs): 2. Your Solar Projection ── */}
        <div className="bg-slate-900/60 rounded-3xl p-6 sm:p-8 lg:p-9 border border-white/10 shadow-xl flex flex-col justify-between space-y-6">
          <div className="space-y-7">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <h3 className="text-base sm:text-lg font-bold text-white">
                2. Your Solar Projection
              </h3>
              <span className="px-3 py-0.5 rounded-full bg-emerald-500/15 text-emerald-300 text-xs font-bold border border-emerald-500/30">
                Recommended
              </span>
            </div>

            {/* Hero Metrics: System Capacity & Net Investment side-by-side in large bold typography */}
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-slate-950/70 rounded-2xl p-5 sm:p-6 border border-white/10 space-y-1">
                <span className="text-xs text-slate-400 font-medium uppercase tracking-wider block">
                  System Capacity
                </span>
                <div className="text-3xl sm:text-5xl font-black text-white tracking-tight">
                  {recommendedKw} <span className="text-xl sm:text-2xl text-slate-400 font-bold">kW</span>
                </div>
                <span className="text-xs text-slate-400 font-medium block">
                  ~{totalPanels} Monocrystalline Panels
                </span>
              </div>

              <div className="bg-slate-950/70 rounded-2xl p-5 sm:p-6 border border-emerald-500/30 space-y-1">
                <span className="text-xs text-emerald-400 font-medium uppercase tracking-wider block">
                  Net Investment
                </span>
                <div className="text-3xl sm:text-5xl font-black text-emerald-400 tracking-tight">
                  ₹{fmt(netInvestment)}
                </div>
                <span className="text-xs text-slate-400 font-medium block">
                  After ₹{fmt(subsidy)} PM Surya Ghar subsidy
                </span>
              </div>
            </div>

            {/* Secondary Grid: 3-column grid for sub-metrics */}
            <div className="grid grid-cols-3 gap-3">
              <div className="bg-slate-950/60 rounded-2xl p-3.5 sm:p-4 border border-white/5 text-center space-y-0.5">
                <span className="text-[11px] text-slate-400 font-medium block">Monthly Savings</span>
                <p className="text-lg sm:text-xl font-bold text-white">₹{fmt(monthlySavings)}</p>
                <span className="text-[10px] text-slate-500">₹{fmt(annualSavings)}/yr</span>
              </div>

              <div className="bg-slate-950/60 rounded-2xl p-3.5 sm:p-4 border border-white/5 text-center space-y-0.5">
                <span className="text-[11px] text-slate-400 font-medium block">Payback Period</span>
                <p className="text-lg sm:text-xl font-bold text-white">{paybackPeriod} yrs</p>
                <span className="text-[10px] text-slate-500">25-yr warranty</span>
              </div>

              <div className="bg-slate-950/60 rounded-2xl p-3.5 sm:p-4 border border-white/5 text-center space-y-0.5">
                <span className="text-[11px] text-slate-400 font-medium block">Govt Subsidy</span>
                <p className="text-lg sm:text-xl font-bold text-white">₹{fmt(subsidy)}</p>
                <span className="text-[10px] text-slate-500">Direct DBT</span>
              </div>
            </div>

            {/* Minimalist Bullets with Short Text & Muted Icons */}
            <div className="space-y-3 text-xs sm:text-sm text-slate-300 pt-1">
              <div className="flex items-center gap-3">
                <span className="text-base">⚡</span>
                <span>Produces <strong>{fmt(annualGenUnits)} units/yr</strong> of clean energy</span>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-base">🏛️</span>
                <span>Pre-approved <strong>₹{fmt(subsidy)}</strong> direct DBT bank credit</span>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-base">🌱</span>
                <span>Cuts <strong>{(recommendedKw * 1.2).toFixed(1)} tons CO₂/yr</strong> (~{Math.round(recommendedKw * 48)} trees)</span>
              </div>
            </div>
          </div>

          {/* Reassurance Footer Pill */}
          <div className="bg-slate-950/70 border border-white/10 rounded-2xl p-3.5 flex items-center justify-between text-xs text-slate-400">
            <span>Guaranteed Tier-1 Components</span>
            <span className="text-slate-300 font-medium">25-Year Panel Performance Warranty</span>
          </div>
        </div>

      </div>

      {/* ── Sleek Modern Solar Cheat Sheet Banner ── */}
      <div className="bg-slate-900/40 backdrop-blur-md border border-white/10 rounded-2xl sm:rounded-3xl p-4 sm:p-5 space-y-3 shadow-lg">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-base sm:text-lg">💡</span>
            <h4 className="text-xs sm:text-sm font-bold text-white tracking-wide">
              Quick Solar Cheat Sheet
            </h4>
          </div>
          <span className="text-[11px] font-semibold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-0.5 rounded-full">
            Did You Know?
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
          {/* Card 1: Output */}
          <div className="bg-slate-950/60 rounded-2xl p-3.5 sm:p-4 border border-white/5 hover:border-emerald-500/25 transition-all flex flex-col justify-between space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                <span className="w-5 h-5 rounded-lg bg-emerald-500/15 text-emerald-400 flex items-center justify-center text-xs">☀️</span>
                Output
              </span>
              <span className="text-[10px] text-emerald-400 font-semibold bg-emerald-500/10 px-2 py-0.5 rounded-md">
                Per Panel
              </span>
            </div>
            <div>
              <div className="text-base sm:text-lg font-black text-white tracking-tight">
                1 Panel = <span className="text-emerald-400">~50 Units/mo</span>
              </div>
              <p className="text-[11px] text-slate-400 leading-snug mt-1">
                Standard 400W panel. Needs ~20 sq ft of shadow-free space.
              </p>
            </div>
          </div>

          {/* Card 2: Cost */}
          <div className="bg-slate-950/60 rounded-2xl p-3.5 sm:p-4 border border-white/5 hover:border-amber-500/25 transition-all flex flex-col justify-between space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                <span className="w-5 h-5 rounded-lg bg-amber-500/15 text-amber-400 flex items-center justify-center text-xs">💰</span>
                Benchmark Cost
              </span>
              <span className="text-[10px] text-amber-300 font-semibold bg-amber-500/10 px-2 py-0.5 rounded-md">
                Turnkey
              </span>
            </div>
            <div>
              <div className="text-base sm:text-lg font-black text-white tracking-tight">
                ~₹52,000 <span className="text-amber-400 font-bold text-sm sm:text-base">per kW</span>
              </div>
              <p className="text-[11px] text-slate-400 leading-snug mt-1">
                Fully installed turnkey system. (~₹20k per panel before subsidies).
              </p>
            </div>
          </div>

          {/* Card 3: Sizing Rules */}
          <div className="bg-slate-950/60 rounded-2xl p-3.5 sm:p-4 border border-white/5 hover:border-lime-500/25 transition-all flex flex-col justify-between space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                <span className="w-5 h-5 rounded-lg bg-lime-500/15 text-lime-400 flex items-center justify-center text-xs">⚡</span>
                Sizing Rules
              </span>
              <span className="text-[10px] text-lime-300 font-semibold bg-lime-500/10 px-2 py-0.5 rounded-md">
                Rule of Thumb
              </span>
            </div>
            <div>
              <div className="space-y-1 text-xs font-bold text-white">
                <div className="flex items-center gap-1.5">
                  <span className="text-emerald-400">⚡</span>
                  <span><strong>1 kW:</strong> Lights, TV, Fridge</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="text-lime-400">⚡</span>
                  <span><strong>2–3 kW:</strong> Adds 1.5T Inverter AC</span>
                </div>
              </div>
              <p className="text-[11px] text-slate-400 leading-snug mt-1">
                Scales with your monthly electricity consumption.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* ── Pinned Footer Navigation ── */}
      <div className="flex flex-col-reverse sm:flex-row items-center justify-between gap-4 pt-4 border-t border-white/10 mt-auto">
        <button
          type="button"
          onClick={() => setStep(1)}
          className="w-full sm:w-auto px-8 py-3.5 rounded-2xl font-bold text-sm bg-slate-900 hover:bg-slate-800 text-slate-200 hover:text-white border border-white/15 transition-all flex items-center justify-center gap-2 cursor-pointer shadow-lg"
        >
          <ChevronLeft className="w-4 h-4 text-emerald-400" />
          <span>Back to Rooftop Map</span>
        </button>

        <button
          type="button"
          onClick={() => setStep(3)}
          className="w-full sm:w-auto px-10 py-3.5 rounded-2xl font-black text-sm bg-gradient-to-r from-emerald-500 to-lime-400 hover:from-emerald-400 hover:to-lime-300 text-slate-950 shadow-xl shadow-emerald-500/25 transition-all flex items-center justify-center gap-2 cursor-pointer"
        >
          <span>Continue to Review Assessment</span>
          <ArrowRight className="w-4 h-4 stroke-[2.5]" />
        </button>
      </div>
    </div>
  );
}
