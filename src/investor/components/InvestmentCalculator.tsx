import { useState } from "react";
import { Opportunity } from "../types";
import { opportunityService } from "../services/opportunityService";
import { Zap, Sun, Building2, Layers, CheckCircle, ShieldCheck } from "lucide-react";

interface Props {
  location: Opportunity;
  budgetBand?: string;
}

export default function InvestmentCalculator({ location, budgetBand = "Any budget" }: Props) {
  const [landMode, setLandMode] = useState<"purchase" | "lease">("purchase");

  // Derive station setup automatically from real data & budget band
  const config = opportunityService.getFeasibleStationConfiguration(location, budgetBand, landMode);

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(val);
  };

  return (
    <div className="space-y-5">
      {/* Station Configuration Header Card */}
      <div className="bg-gray-950 border border-gray-800 rounded-lg p-4 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-brand-accent/5 rounded-full blur-2xl pointer-events-none"></div>
        <div className="flex justify-between items-start mb-2">
          <div>
            <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 bg-brand-accent/20 text-brand-accent border border-brand-accent/40 rounded">
              Auto-Sized for Budget
            </span>
            <h3 className="text-base font-bold text-white mt-1.5">{config.name}</h3>
            <p className="text-xs text-gray-400 mt-0.5">{config.description}</p>
          </div>
        </div>

        <div className="mt-3 pt-3 border-t border-gray-800/80 flex flex-wrap gap-2 text-[11px] text-gray-300">
          <span className="bg-gray-900 px-2.5 py-1 rounded border border-gray-800 flex items-center gap-1.5">
            <Zap size={12} className="text-brand-accent" />
            {config.chargerSetup}
          </span>
          <span className="bg-gray-900 px-2.5 py-1 rounded border border-gray-800 flex items-center gap-1.5">
            <Sun size={12} className="text-amber-400" />
            {config.solarKw} kW Rooftop/Canopy Solar
          </span>
          <span className="bg-gray-900 px-2.5 py-1 rounded border border-gray-800 flex items-center gap-1.5">
            <Building2 size={12} className="text-blue-400" />
            {config.landSqft.toLocaleString()} sq.ft Required Land
          </span>
        </div>
      </div>

      {/* Projections Matrix */}
      <div className="bg-gray-900/70 border border-gray-800 rounded-lg p-4">
        <div className="flex justify-between items-center mb-3">
          <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wider">5-Year Investment Snapshot</h4>
          {/* Land Ownership Toggle */}
          <div className="flex bg-black border border-gray-800 rounded p-0.5 text-[10px]">
            <button 
              onClick={() => setLandMode("purchase")}
              className={`px-2 py-0.5 rounded font-medium transition-colors ${landMode === "purchase" ? "bg-brand-accent text-black font-bold" : "text-gray-400 hover:text-white"}`}
            >
              Land Purchase
            </button>
            <button 
              onClick={() => setLandMode("lease")}
              className={`px-2 py-0.5 rounded font-medium transition-colors ${landMode === "lease" ? "bg-brand-accent text-black font-bold" : "text-gray-400 hover:text-white"}`}
            >
              Land Lease
            </button>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 mb-3">
          <div className="bg-black/60 p-2.5 rounded border border-gray-800/80">
            <div className="text-[11px] text-gray-400 mb-0.5">Total Estimated CAPEX</div>
            <div className="text-base font-bold font-mono text-white">{formatCurrency(config.totalCapex)}</div>
            <div className="text-[10px] text-gray-500 mt-0.5">
              {landMode === "purchase" ? "Includes hardware, grid & land" : "Hardware, grid & solar (no land capex)"}
            </div>
          </div>
          <div className="bg-black/60 p-2.5 rounded border border-gray-800/80">
            <div className="text-[11px] text-gray-400 mb-0.5">Annual Net Cash Flow</div>
            <div className="text-base font-bold font-mono text-green-400">{formatCurrency(config.annualNetCashFlow)}</div>
            <div className="text-[10px] text-gray-500 mt-0.5">Net of energy, AMC & operating costs</div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 pt-3 border-t border-gray-800">
          <div>
            <div className="text-[11px] text-gray-400 mb-0.5">Simple Payback</div>
            <div className="text-base font-bold text-brand-accent font-mono">
              {config.simplePaybackYears ? `${config.simplePaybackYears} Years` : 'N/A'}
            </div>
          </div>
          <div>
            <div className="text-[11px] text-gray-400 mb-0.5">5-Year Projected ROI</div>
            <div className="text-base font-bold text-white font-mono">
              {config.fiveYearRoiPct}%
            </div>
          </div>
        </div>
      </div>

      {/* Itemized Cost Breakdown from Datasets */}
      <div className="bg-gray-950 border border-gray-800 rounded-lg p-3.5 space-y-2.5 text-xs">
        <h4 className="font-semibold text-gray-300 flex items-center justify-between text-xs">
          <span>Data-Derived Cost Components</span>
          <span className="text-[10px] font-mono text-gray-500">100% Empirically Mapped</span>
        </h4>

        <div className="space-y-1.5 divide-y divide-gray-900">
          <div className="flex justify-between items-center pt-1 text-gray-300">
            <span className="text-gray-400">Charging Equipment & Civil:</span>
            <span className="font-mono">{formatCurrency(config.hardwareCapex)}</span>
          </div>

          <div className="flex justify-between items-center pt-1 text-gray-300">
            <span className="text-gray-400">DISCOM Grid Connection & Transformer:</span>
            <span className="font-mono">{formatCurrency(config.gridCapex)}</span>
          </div>

          <div className="flex justify-between items-center pt-1 text-gray-300">
            <div className="flex flex-col">
              <span>{config.solarKw} kW Solar Canopy:</span>
              <span className="text-[10px] text-amber-400/90">
                {location.state} yield: {location.solarUnitsPerKwMonth} units/kW/month
              </span>
            </div>
            <span className="font-mono">{formatCurrency(config.solarCapex)}</span>
          </div>

          <div className="flex justify-between items-center pt-1 text-gray-300">
            <div className="flex flex-col">
              <span>
                {landMode === "purchase" ? `Land Purchase (${config.landSqft} sq.ft):` : `Annual Land Lease (${config.landSqft} sq.ft):`}
              </span>
              <span className="text-[10px] text-gray-500">
                Rate: ₹{Math.round(location.landPriceSqft).toLocaleString()}/sq.ft ({location.landMatchType})
              </span>
            </div>
            <span className="font-mono">
              {landMode === "purchase" ? formatCurrency(config.landPurchaseCapex) : `${formatCurrency(config.monthlyLeaseRate * 12)}/yr`}
            </span>
          </div>
        </div>

        {/* Solar Benefit Highlight */}
        <div className="mt-3 bg-amber-950/20 border border-amber-800/40 rounded p-2.5 flex items-start gap-2 text-[11px] text-amber-300">
          <Sun size={14} className="shrink-0 text-amber-400 mt-0.5" />
          <div>
            <strong>State Solar Yield Advantage:</strong> Generates{" "}
            <strong>{config.annualSolarUnitsGen.toLocaleString()} kWh/yr</strong> on-site, providing{" "}
            <strong>{formatCurrency(config.annualSolarSavings)}/year</strong> in direct electricity cost offsets at local DISCOM commercial tariffs.
          </div>
        </div>
      </div>
    </div>
  );
}
