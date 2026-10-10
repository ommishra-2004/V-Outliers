import { OpportunityFactor } from "../types";
import { Info } from "lucide-react";

export default function ExplainabilityChart({ factors }: { factors: OpportunityFactor[] }) {
  // Sort by contribution
  const sortedFactors = [...factors].sort((a, b) => (b.contribution || 0) - (a.contribution || 0));

  const maxContribution = Math.max(...sortedFactors.map(f => f.contribution || 0));

  const getStatusColor = (status: string) => {
    switch(status) {
      case 'observed': return 'text-green-400';
      case 'derived': return 'text-blue-400';
      case 'proxy': return 'text-yellow-400';
      case 'assumption': return 'text-orange-400';
      default: return 'text-gray-400';
    }
  };

  return (
    <div className="space-y-4">
      {sortedFactors.map(factor => {
        const isNegative = (factor.contribution || 0) < 0;
        const percentage = factor.contribution ? (Math.abs(factor.contribution) / (maxContribution || 1)) * 100 : 0;
        
        return (
          <div key={factor.key} className="space-y-1">
            <div className="flex justify-between items-end text-xs">
              <span className="font-semibold text-gray-200">{factor.label}</span>
              <span className={`font-mono font-bold ${isNegative ? "text-rose-400" : "text-brand-accent"}`}>
                {(factor.contribution || 0) > 0 ? "+" : ""}{factor.contribution?.toFixed(1)} pts
              </span>
            </div>
            
            <div className="h-2 w-full bg-gray-800 rounded overflow-hidden">
              <div 
                className={`h-full ${isNegative ? "bg-rose-500" : "bg-brand-accent"}`} 
                style={{ width: `${Math.min(100, percentage)}%` }}
              />
            </div>
            
            <div className="flex justify-between items-start pt-1">
              <div className="text-[10px] text-gray-500 w-3/4 leading-tight">
                {factor.explanation}
              </div>
              <div className="flex flex-col items-end gap-0.5">
                
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
