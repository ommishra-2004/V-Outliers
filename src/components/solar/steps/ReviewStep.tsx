import React from 'react';
import { useSolarStore } from '../../../store/solarStore';
import { CheckCircle2, Edit3, Loader2, MapPin, Zap, ShieldCheck, Sun, TrendingUp, Sparkles, ChevronLeft } from 'lucide-react';
import { analyzeSite } from '../../../services/api';

const STATE_SOLAR_DATA: Record<string, number> = {
  'Rajasthan': 165, 'Gujarat': 150, 'Maharashtra': 135, 'Karnataka': 144,
  'Tamil Nadu': 138, 'Kerala': 114, 'Delhi': 135, 'Uttar Pradesh': 129,
  'Punjab': 135, 'Haryana': 138, 'West Bengal': 117, 'Bihar': 126,
  'Odisha': 132, 'Madhya Pradesh': 141, 'Chhattisgarh': 135,
  'Telangana': 144, 'Andhra Pradesh': 147, 'Jharkhand': 123,
  'Assam': 111, 'Goa': 132, 'Uttarakhand': 132, 'Himachal Pradesh': 129,
  'Jammu and Kashmir': 129, 'Ladakh': 180, 'Sikkim': 108,
  'Meghalaya': 105, 'Nagaland': 108, 'Manipur': 108, 'Mizoram': 108,
  'Tripura': 111, 'Arunachal Pradesh': 108, 'Chandigarh': 135,
  'Puducherry': 141, 'Dadra and Nagar Haveli and Daman and Diu': 147,
  'Lakshadweep': 144, 'Andaman and Nicobar Islands': 126,
};

export default function ReviewStep() {
  const { siteInput, setStep, setLoading, isLoading, setAnalysisResult, setError, detectedGrossArea, detectedUsableArea } = useSolarStore();

  const unitsPerKwMonth = STATE_SOLAR_DATA[siteInput.state as keyof typeof STATE_SOLAR_DATA] || 120;
  const bill = siteInput.monthlyBill || 2500;
  const area = siteInput.roofAreaSqft || detectedGrossArea || 1200;
  const tariff = siteInput.averageTariff || 8.0;
  const monthlyUnits = Math.round(bill / tariff);
  const capacity = Math.max(1.0, Math.round(Math.min(monthlyUnits / unitsPerKwMonth, (area * 0.75) / 100.0) * 10) / 10);
  const totalPanels = Math.ceil(capacity * 2.5);
  const annualUnits = Math.round(capacity * unitsPerKwMonth * 12);
  const annualSavings = Math.round(annualUnits * tariff);
  const centralSubsidy = capacity >= 3.0 ? 78000 : capacity >= 2.0 ? 60000 : 30000;
  const grossCapex = capacity * 52000;
  const netPayable = Math.max(0, grossCapex - centralSubsidy);
  const tenYearSavings = Math.round((annualSavings * 10) - netPayable);

  const handleSubmit = async () => {
    setLoading(true);
    setError(null);
    try {
      const formData = new FormData();
      formData.append('user_id', 'user_' + Math.random().toString(36).substring(2, 9));
      formData.append('latitude', String(siteInput.latitude || 12.9784));
      formData.append('longitude', String(siteInput.longitude || 77.6408));
      formData.append('state', siteInput.state || 'Karnataka');
      formData.append('approx_roof_area_sqft', String(area));
      formData.append('monthly_bill_inr', String(bill));
      formData.append('avg_tariff_per_unit', String(tariff));
      formData.append('property_type', siteInput.propertyType || 'Residential');

      const result = await analyzeSite(formData);
      setAnalysisResult(result);
    } catch (err) {
      setError('Failed to analyze site. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const fmt = (n: number) => new Intl.NumberFormat('en-IN').format(Math.round(n));

  return (
    <div className="w-full flex-1 flex flex-col justify-between min-h-[calc(100vh-210px)] space-y-6">
      {/* ── Header ── */}
      <div className="border-b border-white/10 pb-4">
        <div className="flex items-center gap-2 text-emerald-400 text-xs font-black uppercase tracking-widest mb-1.5">
          <CheckCircle2 className="w-4 h-4" />
          <span>Step 3 of 3 · Final Verification &amp; Report Generation</span>
        </div>
        <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
          Review Assessment Summary
        </h2>
        <p className="text-sm text-slate-400 mt-1 max-w-3xl">
          Confirm your site parameters and consumption profile before we compute your detailed financial breakdown and load vetted Indian solar vendor quotes.
        </p>
      </div>

      {/* ── 2-Column Summary Cards ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8 items-start">
        {/* Card 1: Rooftop & Location Profile */}
        <div className="bg-slate-900/80 border border-white/10 rounded-3xl p-6 shadow-xl relative group space-y-4">
          <div className="flex justify-between items-center border-b border-white/10 pb-3">
            <h3 className="text-xs font-black text-slate-300 uppercase tracking-widest flex items-center gap-2">
              <MapPin className="w-4 h-4 text-emerald-400" />
              Site &amp; Rooftop Profile
            </h3>
            <button
              onClick={() => setStep(1)}
              className="text-xs sm:text-sm text-slate-200 hover:text-emerald-300 font-bold flex items-center gap-2 transition-all bg-slate-950/90 hover:bg-slate-800 px-4 py-2 rounded-xl border border-white/10 hover:border-emerald-500/40 shadow-sm hover:scale-105 active:scale-95"
            >
              <Edit3 className="w-4 h-4 text-emerald-400" /> 
              <span>Edit Rooftop</span>
            </button>
          </div>

          <ul className="space-y-3 text-xs sm:text-sm">
            <li className="flex justify-between items-center py-1.5 border-b border-white/5">
              <span className="text-slate-400 font-medium">City / Locality</span>
              <span className="text-white font-bold">{siteInput.city || 'Bengaluru'}</span>
            </li>
            <li className="flex justify-between items-center py-1.5 border-b border-white/5">
              <span className="text-slate-400 font-medium">State (DISCOM Authority)</span>
              <span className="text-emerald-400 font-bold">{siteInput.state || 'Karnataka'}</span>
            </li>
            <li className="flex justify-between items-center py-1.5 border-b border-white/5">
              <span className="text-slate-400 font-medium">Total Rooftop Footprint</span>
              <span className="text-white font-bold">{fmt(area)} sq ft</span>
            </li>
            <li className="flex justify-between items-center py-1.5 border-b border-white/5">
              <span className="text-slate-400 font-medium">Usable Solar Area (75% shadow-free)</span>
              <span className="text-lime-400 font-bold">~{fmt(area * 0.75)} sq ft</span>
            </li>
            <li className="flex justify-between items-center py-1.5 border-b border-white/5">
              <span className="text-slate-400 font-medium">Property Classification</span>
              <span className="text-slate-200 font-bold">{siteInput.propertyType || 'Residential'}</span>
            </li>
            <li className="flex justify-between items-center py-1.5">
              <span className="text-slate-400 font-medium">Full Geo-Tagged Address</span>
              <span className="text-slate-300 font-medium truncate max-w-xs">{siteInput.address || siteInput.city || 'Coordinates mapped'}</span>
            </li>
          </ul>
        </div>

        {/* Card 2: Energy & Sizing Profile */}
        <div className="bg-slate-900/80 border border-white/10 rounded-3xl p-6 shadow-xl relative group space-y-4">
          <div className="flex justify-between items-center border-b border-white/10 pb-3">
            <h3 className="text-xs font-black text-slate-300 uppercase tracking-widest flex items-center gap-2">
              <Zap className="w-4 h-4 text-amber-400" />
              Sizing &amp; Economic Profile
            </h3>
            <button
              onClick={() => setStep(2)}
              className="text-xs sm:text-sm text-slate-200 hover:text-emerald-300 font-bold flex items-center gap-2 transition-all bg-slate-950/90 hover:bg-slate-800 px-4 py-2 rounded-xl border border-white/10 hover:border-emerald-500/40 shadow-sm hover:scale-105 active:scale-95"
            >
              <Edit3 className="w-4 h-4 text-amber-400" /> 
              <span>Edit Usage</span>
            </button>
          </div>

          <ul className="space-y-3 text-xs sm:text-sm">
            <li className="flex justify-between items-center py-1.5 border-b border-white/5">
              <span className="text-slate-400 font-medium">Monthly Electricity Bill</span>
              <span className="text-emerald-400 font-bold">₹{fmt(bill)} / month (~{monthlyUnits} units)</span>
            </li>
            <li className="flex justify-between items-center py-1.5 border-b border-white/5">
              <span className="text-slate-400 font-medium">Grid Tariff Rate</span>
              <span className="text-white font-bold">₹{tariff} / kWh unit</span>
            </li>
            <li className="flex justify-between items-center py-1.5 border-b border-white/5">
              <span className="text-slate-400 font-medium">Recommended System Capacity</span>
              <span className="text-amber-400 font-bold text-base">{capacity} kW System (~{totalPanels} panels)</span>
            </li>
            <li className="flex justify-between items-center py-1.5 border-b border-white/5">
              <div>
                <span className="text-slate-400 font-medium block">Estimated Annual Generation</span>
                <span className="text-[11px] text-slate-500 block">Based on {siteInput.state || 'Karnataka'} solar irradiation ({unitsPerKwMonth} units/kW/month)</span>
              </div>
              <span className="text-lime-400 font-bold shrink-0">~{fmt(annualUnits)} kWh / year</span>
            </li>
            <li className="flex justify-between items-center py-1.5 border-b border-white/5">
              <span className="text-slate-400 font-medium">PM Surya Ghar Central Subsidy</span>
              <span className="text-emerald-400 font-black">₹{fmt(centralSubsidy)} Direct DBT</span>
            </li>
            <li className="flex justify-between items-center py-1.5">
              <span className="text-slate-400 font-medium">Net Out-of-Pocket CapEx</span>
              <span className="text-white font-black text-base">₹{fmt(netPayable)}</span>
            </li>
          </ul>
        </div>
      </div>

      {/* 10-Year Cumulative Financial Impact Card */}
      <div className="bg-gradient-to-r from-emerald-950/40 via-slate-900 to-[#07130d] border border-emerald-500/30 rounded-3xl p-5 sm:p-6 shadow-xl flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center shrink-0">
            <TrendingUp className="w-6 h-6 text-emerald-400" />
          </div>
          <div>
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">
              10-Year Projected Cumulative Savings
            </span>
            <p className="text-2xl sm:text-3xl font-black text-emerald-400 tracking-tight">
              ₹{fmt(tenYearSavings)} <span className="text-xs font-normal text-slate-300">net profit after system recovery</span>
            </p>
          </div>
        </div>

        <div className="bg-slate-950/80 px-4 py-2.5 rounded-2xl border border-white/5 text-right shrink-0">
          <span className="text-[11px] text-slate-400 block font-semibold">Payback Period</span>
          <span className="text-lg font-black text-amber-400">{(netPayable / annualSavings).toFixed(1)} Years</span>
        </div>
      </div>

      {/* Standardized Full-Width Responsive Action Footer */}
      <div className="flex flex-col-reverse sm:flex-row items-center justify-between gap-3 sm:gap-4 pt-4 border-t border-white/10 mt-auto">
        <button
          type="button"
          onClick={() => setStep(2)}
          className="w-full sm:w-auto px-6 sm:px-8 py-3.5 sm:py-4 rounded-2xl font-black text-sm sm:text-base bg-slate-900/90 hover:bg-slate-800 text-slate-200 hover:text-white border border-white/15 hover:border-emerald-500/40 shadow-xl hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-2.5 cursor-pointer shrink-0"
        >
          <ChevronLeft className="w-4 h-4 sm:w-5 sm:h-5 text-emerald-400" />
          <span>Back to Energy Details</span>
        </button>

        <button
          type="button"
          onClick={handleSubmit}
          disabled={isLoading}
          className="w-full sm:flex-1 py-4 sm:py-4.5 px-6 sm:px-8 rounded-2xl font-black text-sm sm:text-base lg:text-lg bg-gradient-to-r from-emerald-500 via-emerald-400 to-lime-400 hover:from-emerald-400 hover:to-lime-300 text-slate-950 shadow-2xl shadow-emerald-500/30 hover:shadow-emerald-500/60 transition-all transform hover:-translate-y-0.5 active:translate-y-0 flex items-center justify-center gap-2.5 disabled:opacity-70 disabled:cursor-not-allowed cursor-pointer"
        >
          {isLoading ? (
            <>
              <Loader2 className="w-6 h-6 animate-spin text-slate-950" />
              <span>Generating AI Feasibility Report &amp; Marketplace Quotes...</span>
            </>
          ) : (
            <>
              <Sparkles className="w-5 h-5 text-slate-950" />
              <span>Generate AI Feasibility Report &amp; Reverse-Auction Quotes →</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
}
