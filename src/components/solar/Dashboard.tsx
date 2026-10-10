import React from 'react';
import { useSolarStore } from '../../store/solarStore';
import { Sun, Wallet, Clock, TrendingUp, Info, RefreshCw, Sparkles, ShieldCheck } from 'lucide-react';

interface DashboardProps {
  onViewQuotes: () => void;
  onReset?: () => void;
}

export default function Dashboard({ onViewQuotes, onReset }: DashboardProps) {
  const { analysisResult, siteInput } = useSolarStore();

  if (!analysisResult) return null;

  const fmt = (num: number) => new Intl.NumberFormat('en-IN').format(Math.round(num));

  // Chart calculations
  const maxVal = Math.max(...analysisResult.grid_cost_projection_10yr);
  const chartHeight = 220;
  const paybackYears = Number(analysisResult.payback_period_years).toFixed(1);
  const co2Tons = Number(analysisResult.co2_reduction_tons_per_year).toFixed(2);
  const treesPlanted = Math.round(Number(analysisResult.co2_reduction_tons_per_year) * 45);

  return (
    <div className="max-w-[1720px] 2xl:max-w-[1840px] mx-auto w-full pt-4 sm:pt-6 pb-20 px-3 sm:px-6 lg:px-8 xl:px-10 space-y-6 sm:space-y-8">
      
      {/* ── Integrated Header with Breadcrumbs & Actions (Zero Overlap) ── */}
      <div className="border-b border-white/10 pb-5 space-y-3">
        {/* Row 1: Breadcrumb + Navigation Buttons */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div className="flex items-center gap-2 text-xs sm:text-sm text-slate-400">
            <Sun className="w-4 h-4 text-amber-400 shrink-0" />
            <span>Solar Assessment Platform</span>
            <span className="text-slate-600">›</span>
            <span className="text-emerald-400 font-semibold">Your Feasibility Report</span>
          </div>

          <div className="flex items-center gap-2.5 sm:gap-3">
            {onReset && (
              <button
                onClick={onReset}
                className="flex items-center gap-1.5 text-xs sm:text-sm text-slate-300 hover:text-white bg-slate-900/90 hover:bg-slate-800 border border-white/10 px-3.5 py-2 rounded-xl transition-all cursor-pointer shadow-sm hover:scale-105 active:scale-95 shrink-0"
              >
                <RefreshCw className="w-3.5 h-3.5 text-emerald-400" />
                <span>New Assessment</span>
              </button>
            )}

            <button
              onClick={onViewQuotes}
              className="px-5 sm:px-7 py-2 sm:py-2.5 bg-gradient-to-r from-emerald-500 via-emerald-400 to-lime-400 hover:from-emerald-400 hover:to-lime-300 text-slate-950 rounded-xl font-black text-xs sm:text-sm shadow-xl shadow-emerald-500/25 hover:scale-105 active:scale-95 transition-all flex items-center gap-2 cursor-pointer shrink-0"
            >
              <span>View Vendor Quotes →</span>
            </button>
          </div>
        </div>

        {/* Row 2: Page Title & Location Badge */}
        <div className="flex flex-col sm:flex-row sm:items-baseline sm:justify-between gap-2">
          <div>
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-white tracking-tight">
              Your Solar Feasibility Report
            </h1>
            <p className="text-xs sm:text-sm text-slate-400 mt-0.5">
              Engineered for maximum ROI and long-term grid savings in <strong className="text-emerald-400">{siteInput.state || 'Karnataka'}</strong>
            </p>
          </div>
        </div>
      </div>

      {/* ── Top Metrics Grid (4 Hero Cards with Clean Rounding) ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5 sm:gap-4 lg:gap-5">
        {[
          { 
            label: 'System Size', 
            value: `${analysisResult.recommended_capacity_kw} kW`, 
            sub: `~${Math.ceil(analysisResult.recommended_capacity_kw * 2.5)} Panels (400W)`,
            icon: Sun, 
            color: 'text-amber-400', 
            bg: 'bg-amber-400/10' 
          },
          { 
            label: 'Net Investment', 
            value: `₹${fmt(analysisResult.net_cost)}`, 
            sub: `Includes PM Surya Ghar subsidy`,
            icon: Wallet, 
            color: 'text-emerald-400', 
            bg: 'bg-emerald-400/10' 
          },
          { 
            label: 'Payback Period', 
            value: `${paybackYears} Years`, 
            sub: '25-Year Panel Warranty',
            icon: Clock, 
            color: 'text-blue-400', 
            bg: 'bg-blue-400/10' 
          },
          { 
            label: 'Annual Savings', 
            value: `₹${fmt(analysisResult.annual_savings)}`, 
            sub: `~${fmt(analysisResult.estimated_generation_kwh_per_year)} units/yr`,
            icon: TrendingUp, 
            color: 'text-lime-400', 
            bg: 'bg-lime-400/10' 
          },
        ].map((m, i) => (
          <div key={i} className="bg-slate-900/80 border border-white/10 rounded-2xl sm:rounded-3xl p-4 sm:p-5 backdrop-blur-sm hover:border-emerald-500/30 transition-all shadow-xl space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-slate-400 text-xs font-semibold">{m.label}</span>
              <div className={`${m.bg} w-8 h-8 rounded-xl flex items-center justify-center`}>
                <m.icon className={`w-4 h-4 ${m.color}`} />
              </div>
            </div>
            <p className="text-xl sm:text-2xl lg:text-3xl font-black text-white tracking-tight">{m.value}</p>
            <span className="text-[11px] text-slate-400 block font-medium truncate">{m.sub}</span>
          </div>
        ))}
      </div>

      {/* ── Main Report Content Grid ── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-start">
        
        {/* Left Column (5 Cols): Subsidy Breakdown & Eco Impact */}
        <div className="lg:col-span-5 space-y-5">
          {/* Subsidy Breakdown Card */}
          <div className="bg-slate-900/80 border border-white/10 rounded-3xl p-5 sm:p-6 shadow-xl relative overflow-hidden space-y-5">
            <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
            
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <h3 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-emerald-400" />
                <span>Financial &amp; Subsidy Breakdown</span>
              </h3>
              <span className="text-[11px] px-2.5 py-0.5 rounded-full bg-emerald-500/15 text-emerald-300 font-bold border border-emerald-500/30">
                DBT Eligible
              </span>
            </div>
            
            <div className="space-y-3 text-xs sm:text-sm">
              <div className="flex justify-between items-center py-1 border-b border-white/5">
                <span className="text-slate-400">Gross System Cost</span>
                <span className="text-white font-bold">₹{fmt(analysisResult.gross_cost)}</span>
              </div>
              
              <div className="flex justify-between items-center py-1 border-b border-white/5 text-emerald-400 font-semibold">
                <span>Central Subsidy (PM Surya Ghar)</span>
                <span>- ₹{fmt(analysisResult.subsidy_breakdown.central_subsidy)}</span>
              </div>
              
              <div className="flex justify-between items-center py-1 border-b border-white/5 text-emerald-400 font-semibold">
                <span>State Subsidy</span>
                <span>- ₹{fmt(analysisResult.subsidy_breakdown.state_subsidy)}</span>
              </div>

              <div className="pt-2 flex justify-between items-baseline">
                <div>
                  <span className="font-bold text-white block">Net Payable Investment</span>
                  <span className="text-[11px] text-slate-400">Actual out-of-pocket CapEx</span>
                </div>
                <span className="text-2xl sm:text-3xl font-black text-emerald-400">
                  ₹{fmt(analysisResult.net_cost)}
                </span>
              </div>
            </div>

            <div className="bg-slate-950/70 rounded-2xl p-3.5 border border-white/5 space-y-2">
              <h4 className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                <span>Applied Government Scheme Details</span>
              </h4>
              <ul className="text-xs text-slate-400 space-y-1 list-disc pl-4">
                {analysisResult.subsidy_breakdown.details.map((d, i) => (
                  <li key={i}>{d}</li>
                ))}
              </ul>
            </div>
          </div>

          {/* Environmental Impact Card */}
          <div className="bg-gradient-to-br from-emerald-950/40 via-slate-900 to-slate-950 border border-emerald-500/30 rounded-3xl p-5 sm:p-6 shadow-xl space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-emerald-400 uppercase tracking-wider">Environmental Impact</span>
              <span className="text-lg">🌱</span>
            </div>
            <p className="text-3xl sm:text-4xl font-black text-white">{co2Tons} <span className="text-lg font-bold text-emerald-400">Tons CO₂</span></p>
            <p className="text-xs text-slate-300 leading-relaxed">
              Offset per year. Equivalent to planting <strong className="text-emerald-300 font-bold">{treesPlanted} mature trees</strong> and driving 12,000 fewer fossil fuel kilometers annually.
            </p>
          </div>
        </div>

        {/* Right Column (7 Cols): Cumulative Savings Bar Chart */}
        <div className="lg:col-span-7 bg-slate-900/80 border border-white/10 rounded-3xl p-5 sm:p-6 lg:p-7 shadow-xl space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 border-b border-white/10 pb-3">
            <div>
              <h3 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-lime-400" />
                <span>Cumulative Savings Projection (10 Years)</span>
              </h3>
              <p className="text-xs text-slate-400">Comparing utility grid costs vs. solar ownership ROI</p>
            </div>
            <span className="text-xs text-emerald-400 font-bold self-start sm:self-auto">
              Breakeven at Year {paybackYears}
            </span>
          </div>
          
          <div className="relative w-full h-[240px] sm:h-[270px] mt-4 flex items-end justify-between px-2 pt-6">
            {/* Grid lines */}
            <div className="absolute inset-0 border-b border-white/10" />
            <div className="absolute top-1/2 inset-x-0 border-b border-white/5 border-dashed" />
            <div className="absolute top-0 inset-x-0 border-b border-white/5 border-dashed" />

            {/* Bars */}
            {analysisResult.grid_cost_projection_10yr.map((gridCost, i) => {
              const solarCost = analysisResult.net_cost - analysisResult.savings_projection_10yr[i];
              const gridHeight = Math.min(100, Math.round((gridCost / maxVal) * 100));
              
              const isProfit = solarCost < 0;
              const absSolarCost = Math.abs(solarCost);
              const solarHeight = Math.min(100, Math.round((absSolarCost / maxVal) * 100));

              return (
                <div key={i} className="relative flex flex-col items-center group flex-1 h-full justify-end z-10 px-0.5 sm:px-1">
                  <div className="flex items-end gap-1 w-full justify-center">
                    {/* Grid Cost Bar */}
                    <div 
                      className="w-2.5 sm:w-3.5 bg-rose-500/60 rounded-t-sm group-hover:brightness-125 transition-all"
                      style={{ height: `${(gridHeight / 100) * chartHeight}px` }}
                      title={`Year ${i+1} Grid Cost: ₹${fmt(gridCost)}`}
                    />
                    {/* Solar Cost / Profit Bar */}
                    <div 
                      className={`w-2.5 sm:w-3.5 rounded-t-sm transition-all group-hover:brightness-125 ${isProfit ? 'bg-lime-400' : 'bg-emerald-500'}`}
                      style={{ height: `${(solarHeight / 100) * chartHeight}px` }}
                      title={`Year ${i+1} Solar: ${isProfit ? 'Profit' : 'Cost'} ₹${fmt(absSolarCost)}`}
                    />
                  </div>
                  <span className="text-[10px] sm:text-xs font-semibold text-slate-400 mt-2">Yr {i+1}</span>
                  
                  {/* Tooltip */}
                  <div className="absolute bottom-full mb-2 bg-slate-950 text-white text-[11px] p-2 rounded-xl border border-white/15 opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-30 shadow-2xl">
                    <p className="text-rose-400 font-bold">Grid: ₹{fmt(gridCost)}</p>
                    <p className="text-emerald-400 font-bold">Solar: {isProfit ? '+' : '-'}₹{fmt(absSolarCost)}</p>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="flex flex-wrap justify-center gap-4 sm:gap-6 pt-2 text-xs border-t border-white/5">
            <div className="flex items-center text-slate-300">
              <span className="w-3 h-3 bg-rose-500/60 rounded-sm mr-2" />
              <span>Cumulative Grid Cost</span>
            </div>
            <div className="flex items-center text-slate-300">
              <span className="w-3 h-3 bg-emerald-500 rounded-sm mr-2" />
              <span>Investment Recovery</span>
            </div>
            <div className="flex items-center text-slate-300">
              <span className="w-3 h-3 bg-lime-400 rounded-sm mr-2" />
              <span>Net Profit</span>
            </div>
          </div>
        </div>

      </div>

    </div>
  );
}
