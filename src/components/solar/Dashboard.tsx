import React, { useState } from 'react';
import { useSolarStore } from '../../store/solarStore';
import { 
  Sun, 
  Wallet, 
  Clock, 
  TrendingUp, 
  RefreshCw, 
  ArrowRight,
  Zap,
  Leaf,
  CheckCircle2,
  ShieldCheck,
  Award,
  Layers,
  Sparkles
} from 'lucide-react';

interface DashboardProps {
  onViewQuotes: () => void;
  onReset?: () => void;
}

export default function Dashboard({ onViewQuotes, onReset }: DashboardProps) {
  const { analysisResult, siteInput } = useSolarStore();
  const [hoveredYear, setHoveredYear] = useState<number | null>(null);

  if (!analysisResult) return null;

  const fmt = (num: number) => new Intl.NumberFormat('en-IN').format(Math.round(num));

  const maxVal = Math.max(...analysisResult.grid_cost_projection_10yr);
  const chartHeight = 220;
  const paybackYears = Number(analysisResult.payback_period_years).toFixed(1);
  const co2Tons = Number(analysisResult.co2_reduction_tons_per_year).toFixed(1);
  const treesPlanted = Math.round(Number(analysisResult.co2_reduction_tons_per_year) * 45);

  // Active snapshot for chart (defaults to Year 5)
  const activeYearIdx = hoveredYear !== null ? hoveredYear : 4;
  const activeGridCost = analysisResult.grid_cost_projection_10yr[activeYearIdx];
  const activeSolarCost = analysisResult.net_cost - analysisResult.savings_projection_10yr[activeYearIdx];
  const isProfit = activeSolarCost < 0;
  const activeProfitAmt = Math.abs(activeSolarCost);

  return (
    <div className="solar-report w-full h-full flex flex-col justify-between p-4 sm:p-5 lg:p-6 max-w-[1680px] mx-auto select-none overflow-hidden">

      {/* ── 1. Compact Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-white/10 gap-3 shrink-0">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight">
              Your Solar Feasibility Report
            </h1>
            <span className="px-2.5 py-0.5 rounded-md bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 text-xs font-bold">
              {siteInput.state || 'Karnataka'}
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            Personalized rooftop estimate based on your monthly power consumption
          </p>
        </div>

        <div className="flex items-center gap-2.5 shrink-0">
          {onReset && (
            <button
              onClick={onReset}
              className="flex items-center gap-1.5 text-xs text-slate-300 hover:text-white bg-slate-900 hover:bg-slate-800 border border-white/10 px-3.5 py-2 rounded-xl transition-all cursor-pointer shadow-sm hover:scale-105 active:scale-95"
            >
              <RefreshCw className="w-3.5 h-3.5 text-emerald-400" />
              <span>Recalculate</span>
            </button>
          )}

          <button
            onClick={onViewQuotes}
            className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-emerald-500 to-lime-400 hover:from-emerald-400 hover:to-lime-300 text-slate-950 rounded-xl font-black text-xs sm:text-sm shadow-lg shadow-emerald-500/20 hover:scale-105 active:scale-95 transition-all cursor-pointer"
          >
            <span>View Vendor Quotes</span>
            <ArrowRight className="w-4 h-4 stroke-[2.5]" />
          </button>
        </div>
      </div>

      {/* ── 2. Four Key Metric Cards ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 my-2.5 shrink-0">
        {/* Card 1: System Size */}
        <div className="bg-slate-900/70 border border-white/10 rounded-2xl p-3.5 sm:p-4 backdrop-blur-md flex items-center justify-between shadow-sm">
          <div>
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
              System Size
            </span>
            <p className="text-2xl sm:text-3xl font-black text-white tracking-tight mt-0.5">
              {analysisResult.recommended_capacity_kw} kW
            </p>
            <span className="text-[11px] text-slate-400 block mt-0.5">
              ≈ {Math.ceil(analysisResult.recommended_capacity_kw * 2.5)} Solar Panels (400W)
            </span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center shrink-0">
            <Sun className="w-5 h-5 text-amber-400" />
          </div>
        </div>

        {/* Card 2: What You Pay */}
        <div className="bg-slate-900/70 border border-white/10 rounded-2xl p-3.5 sm:p-4 backdrop-blur-md flex items-center justify-between shadow-sm">
          <div>
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
              You Pay (Net Cost)
            </span>
            <p className="text-2xl sm:text-3xl font-black text-emerald-400 tracking-tight mt-0.5">
              ₹{fmt(analysisResult.net_cost)}
            </p>
            <span className="text-[11px] text-emerald-400/90 block mt-0.5 font-medium">
              After ₹{fmt(analysisResult.subsidy_breakdown.central_subsidy)} Govt Subsidy
            </span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center shrink-0">
            <Wallet className="w-5 h-5 text-emerald-400" />
          </div>
        </div>

        {/* Card 3: Payback Period */}
        <div className="bg-slate-900/70 border border-white/10 rounded-2xl p-3.5 sm:p-4 backdrop-blur-md flex items-center justify-between shadow-sm">
          <div>
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
              Pays For Itself In
            </span>
            <p className="text-2xl sm:text-3xl font-black text-sky-400 tracking-tight mt-0.5">
              {paybackYears} Years
            </p>
            <span className="text-[11px] text-slate-400 block mt-0.5">
              Free electricity for next 20+ yrs
            </span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-sky-500/10 border border-sky-500/20 flex items-center justify-center shrink-0">
            <Clock className="w-5 h-5 text-sky-400" />
          </div>
        </div>

        {/* Card 4: Yearly Savings */}
        <div className="bg-slate-900/70 border border-white/10 rounded-2xl p-3.5 sm:p-4 backdrop-blur-md flex items-center justify-between shadow-sm">
          <div>
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
              You Save Every Year
            </span>
            <p className="text-2xl sm:text-3xl font-black text-lime-400 tracking-tight mt-0.5">
              ₹{fmt(analysisResult.annual_savings)}
            </p>
            <span className="text-[11px] text-slate-400 block mt-0.5">
              ≈ ₹{fmt(analysisResult.annual_savings / 12)} off monthly power bill
            </span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-lime-500/10 border border-lime-500/20 flex items-center justify-center shrink-0">
            <TrendingUp className="w-5 h-5 text-lime-400" />
          </div>
        </div>
      </div>

      {/* ── 3. Main Split Section (Rich, Informative, No Empty Space) ── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 flex-1 min-h-0 items-stretch">

        {/* ── Left Column (5 Cols): Cost Breakdown + Included System Specs + Eco Impact ── */}
        <div className="lg:col-span-5 bg-slate-900/70 border border-white/10 rounded-2xl p-4 sm:p-5 flex flex-col justify-between shadow-sm overflow-hidden space-y-3">
          
          {/* Top: Cost & Subsidy */}
          <div className="space-y-2.5">
            <div className="flex items-center justify-between pb-2 border-b border-white/10">
              <h2 className="text-sm font-bold text-white flex items-center gap-2">
                <Zap className="w-4 h-4 text-emerald-400" />
                <span>Financial &amp; Subsidy Breakdown</span>
              </h2>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-300 font-bold border border-emerald-500/30">
                DBT Direct To Bank
              </span>
            </div>

            <div className="space-y-1.5 text-xs">
              <div className="flex justify-between items-center py-1.5 px-3 rounded-lg bg-white/[0.02]">
                <span className="text-slate-400">Total System Cost (Benchmark EPC)</span>
                <span className="text-white font-bold">₹{fmt(analysisResult.gross_cost)}</span>
              </div>

              <div className="flex justify-between items-center py-1.5 px-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 font-semibold">
                <span className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>PM Surya Ghar Central Subsidy</span>
                </span>
                <span className="font-bold">- ₹{fmt(analysisResult.subsidy_breakdown.central_subsidy)}</span>
              </div>

              {analysisResult.subsidy_breakdown.state_subsidy > 0 && (
                <div className="flex justify-between items-center py-1.5 px-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 font-semibold">
                  <span>State DISCOM Rebate</span>
                  <span className="font-bold">- ₹{fmt(analysisResult.subsidy_breakdown.state_subsidy)}</span>
                </div>
              )}

              {/* Big Highlight Net Cost */}
              <div className="p-3 rounded-xl bg-gradient-to-r from-emerald-950/90 to-slate-900 border border-emerald-500/30 flex justify-between items-center">
                <div>
                  <span className="text-[11px] font-bold text-emerald-400 uppercase tracking-wide block">
                    Your Net Out-of-Pocket CapEx
                  </span>
                  <span className="text-[10px] text-slate-400">
                    After all central &amp; state incentives
                  </span>
                </div>
                <span className="text-2xl sm:text-3xl font-black text-emerald-300">
                  ₹{fmt(analysisResult.net_cost)}
                </span>
              </div>
            </div>
          </div>

          {/* Middle: Included Hardware & Warranties (Fills empty space with valuable specs!) */}
          <div className="p-3 rounded-xl bg-slate-950/70 border border-white/5 space-y-2">
            <div className="flex items-center gap-1.5 text-slate-300 text-xs font-bold">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>Standard Package Inclusions</span>
            </div>
            <div className="grid grid-cols-2 gap-2 text-[11px] text-slate-300">
              <div className="flex items-center gap-1.5 py-1 px-2 rounded-lg bg-white/[0.02]">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shrink-0" />
                <span>25-Yr Panel Warranty</span>
              </div>
              <div className="flex items-center gap-1.5 py-1 px-2 rounded-lg bg-white/[0.02]">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shrink-0" />
                <span>Bi-directional Net Meter</span>
              </div>
              <div className="flex items-center gap-1.5 py-1 px-2 rounded-lg bg-white/[0.02]">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shrink-0" />
                <span>WiFi Smart Inverter</span>
              </div>
              <div className="flex items-center gap-1.5 py-1 px-2 rounded-lg bg-white/[0.02]">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shrink-0" />
                <span>DISCOM Net-metering</span>
              </div>
            </div>
          </div>

          {/* Bottom: Environmental & Generation Summary */}
          <div className="p-3 rounded-xl bg-gradient-to-r from-emerald-950/40 via-slate-900 to-slate-950 border border-emerald-500/20 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-lime-500/10 border border-lime-500/20 flex items-center justify-center shrink-0">
                <Leaf className="w-4 h-4 text-lime-400" />
              </div>
              <div>
                <p className="text-xs font-bold text-white">
                  {co2Tons} Tons CO₂ Offset / Year
                </p>
                <p className="text-[11px] text-slate-400">
                  Equivalent to planting <strong className="text-emerald-300">{treesPlanted} mature trees</strong> annually
                </p>
              </div>
            </div>
            <span className="text-xs font-mono font-bold text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-lg shrink-0">
              ~{fmt(analysisResult.estimated_generation_kwh_per_year)} kWh/yr
            </span>
          </div>
        </div>

        {/* ── Right Column (7 Cols): 10-Year Savings Chart & Milestone Trajectory ── */}
        <div className="lg:col-span-7 bg-slate-900/70 border border-white/10 rounded-2xl p-4 sm:p-5 flex flex-col justify-between shadow-sm overflow-hidden space-y-3">
          
          {/* Header */}
          <div>
            <div className="flex items-center justify-between pb-2 border-b border-white/10">
              <div>
                <h2 className="text-sm font-bold text-white flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-lime-400" />
                  <span>10-Year Cumulative Savings vs Power Bill</span>
                </h2>
                <p className="text-[11px] text-slate-400">
                  Hover on any year to inspect your accumulated cashflow and payback
                </p>
              </div>

              <span className="text-xs font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/30 px-2.5 py-1 rounded-lg">
                Breakeven in {paybackYears} Years
              </span>
            </div>

            {/* Interactive Snapshot Box */}
            <div className="mt-2.5 py-2 px-3 rounded-xl bg-slate-950/80 border border-white/10 flex items-center justify-between text-xs">
              <span className="font-bold text-slate-200 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                <span>Year {activeYearIdx + 1} Snapshot:</span>
              </span>
              <div className="flex items-center gap-5">
                <div>
                  <span className="text-slate-400 mr-1 text-[11px]">Grid Bill:</span>
                  <span className="text-rose-400 font-bold">₹{fmt(activeGridCost)}</span>
                </div>
                <div>
                  <span className="text-slate-400 mr-1 text-[11px]">Solar Net:</span>
                  <span className={`font-bold ${isProfit ? 'text-lime-400' : 'text-amber-400'}`}>
                    {isProfit ? `+ ₹${fmt(activeProfitAmt)} Profit` : `- ₹${fmt(activeProfitAmt)} Cost`}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Chart Bars (TALL, PROPORTIONAL, FILLS THE CARD NATURALLY) */}
          <div className="flex-1 flex flex-col justify-end pt-2">
            <div 
              className="relative w-full flex items-end justify-between px-2 pt-4 pb-1"
              style={{ height: `${chartHeight}px` }}
            >
              {/* Baseline reference lines */}
              <div className="absolute inset-x-0 bottom-0 border-b border-white/10" />
              <div className="absolute inset-x-0 top-1/2 border-b border-white/5 border-dashed" />
              <div className="absolute inset-x-0 top-1/4 border-b border-white/5 border-dashed" />

              {analysisResult.grid_cost_projection_10yr.map((gridCost, i) => {
                const solarCost = analysisResult.net_cost - analysisResult.savings_projection_10yr[i];
                const gridHeight = Math.min(100, Math.round((gridCost / maxVal) * 100));
                const isBarProfit = solarCost < 0;
                const absCost = Math.abs(solarCost);
                const solarHeight = Math.min(100, Math.round((absCost / maxVal) * 100));
                const isHovered = (hoveredYear === i) || (hoveredYear === null && i === 4);

                return (
                  <div
                    key={i}
                    onMouseEnter={() => setHoveredYear(i)}
                    onMouseLeave={() => setHoveredYear(null)}
                    className={`relative flex flex-col items-center flex-1 h-full justify-end z-10 px-1 cursor-pointer transition-all ${isHovered ? 'scale-105' : 'opacity-85 hover:opacity-100'}`}
                  >
                    <div className="flex items-end gap-1.5 w-full justify-center">
                      {/* Grid Cost Bar (Red) */}
                      <div
                        className={`w-3 sm:w-4 rounded-t-sm transition-all ${isHovered ? 'bg-rose-400 shadow-lg shadow-rose-500/20' : 'bg-rose-500/70'}`}
                        style={{ height: `${(gridHeight / 100) * (chartHeight - 35)}px` }}
                      />
                      {/* Solar Net Bar (Green) */}
                      <div
                        className={`w-3 sm:w-4 rounded-t-sm transition-all ${
                          isBarProfit
                            ? isHovered ? 'bg-lime-300 shadow-lg shadow-lime-500/20' : 'bg-lime-400'
                            : isHovered ? 'bg-emerald-400' : 'bg-emerald-500'
                        }`}
                        style={{ height: `${(solarHeight / 100) * (chartHeight - 35)}px` }}
                      />
                    </div>
                    <span className={`text-[10px] sm:text-xs font-semibold mt-2 transition-colors ${isHovered ? 'text-white font-bold' : 'text-slate-400'}`}>
                      Y{i + 1}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Milestone Trajectory Cards (Eliminates all empty space with high-value milestones!) */}
          <div className="grid grid-cols-3 gap-2 pt-2 border-t border-white/5">
            <div className="p-2 rounded-xl bg-slate-950/70 border border-white/5 text-center">
              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Estimated Payback</span>
              <p className="text-xs sm:text-sm font-bold text-sky-400 mt-0.5">{paybackYears} years</p>
              <span className="text-[9px] text-slate-500 block">System pays itself</span>
            </div>

            <div className="p-2 rounded-xl bg-slate-950/70 border border-white/5 text-center">
              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Year 5 Profit</span>
              <p className="text-xs sm:text-sm font-bold text-emerald-400 mt-0.5">₹{fmt(analysisResult.savings_projection_10yr[4] - analysisResult.net_cost)} Net</p>
              <span className="text-[9px] text-slate-500 block">Pure accumulated cash</span>
            </div>

            <div className="p-2 rounded-xl bg-slate-950/70 border border-white/5 text-center">
              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Year 10 Profit</span>
              <p className="text-xs sm:text-sm font-bold text-lime-400 mt-0.5">₹{fmt(analysisResult.savings_projection_10yr[9] - analysisResult.net_cost)} Net</p>
              <span className="text-[9px] text-slate-500 block">Total power bill shield</span>
            </div>
          </div>

          {/* Simple Legend */}
          <div className="flex justify-center items-center gap-6 pt-1 text-[11px] text-slate-400">
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 bg-rose-500/70 rounded-xs" />
              <span>Electricity Bill (Grid)</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 bg-emerald-500 rounded-xs" />
              <span>Investment Recovery</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 bg-lime-400 rounded-xs" />
              <span>Net Profit in Pocket</span>
            </div>
          </div>

        </div>

      </div>

    </div>
  );
}
