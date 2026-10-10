import React, { useEffect, useState } from 'react';
import { useSolarStore } from '../../store/solarStore';
import { getVendorQuotes } from '../../services/api';
import { Star, Shield, ArrowLeft, Loader2, CheckCircle } from 'lucide-react';

interface VendorMarketplaceProps {
  onBack: () => void;
  onReset?: () => void;
}

export default function VendorMarketplace({ onBack, onReset }: VendorMarketplaceProps) {
  const { analysisResult, vendorQuotes, setVendorQuotes } = useSolarStore();
  const [loading, setLoading] = useState(true);
  const [sortBy, setSortBy] = useState<'price' | 'rating' | 'speed'>('price');

  useEffect(() => {
    if (analysisResult) {
      getVendorQuotes(analysisResult.analysis_id).then(quotes => {
        setVendorQuotes(quotes);
        setLoading(false);
      });
    }
  }, [analysisResult, setVendorQuotes]);

  const sortedQuotes = [...vendorQuotes].sort((a, b) => {
    if (sortBy === 'price') return a.total_price - b.total_price;
    if (sortBy === 'rating') return b.rating - a.rating;
    if (sortBy === 'speed') return a.installation_days - b.installation_days;
    return 0;
  });

  const fmt = (num: number) => new Intl.NumberFormat('en-IN').format(num);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-96">
        <Loader2 className="w-10 h-10 text-emerald-500 animate-spin mb-4" />
        <p className="text-slate-400">Fetching live quotes from certified vendors...</p>
      </div>
    );
  }

  return (
    <div className="max-w-[1720px] 2xl:max-w-[1840px] mx-auto w-full pt-4 sm:pt-6 pb-20 px-3 sm:px-6 lg:px-8 xl:px-10">
      <div className="flex flex-col md:flex-row md:items-end justify-between border-b border-white/10 pb-6 mb-8 gap-4">
        <div>
          <div className="flex items-center gap-3 mb-3">
            <button onClick={onBack} className="flex items-center text-slate-400 hover:text-white transition-colors text-xs sm:text-sm font-semibold cursor-pointer">
              <ArrowLeft className="w-4 h-4 mr-1 text-emerald-400" /> Back to Report
            </button>
            {onReset && (
              <>
                <span className="text-slate-600">|</span>
                <button onClick={onReset} className="text-slate-400 hover:text-emerald-400 transition-colors text-xs sm:text-sm cursor-pointer">
                  New Assessment
                </button>
              </>
            )}
          </div>
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-white tracking-tight mb-1">Verified Indian Vendor Quotes</h1>
          <p className="text-slate-400 text-xs sm:text-sm">Reverse-auction competitive bids for your {analysisResult?.recommended_capacity_kw} kW rooftop system</p>
        </div>
        
        <div className="mt-4 md:mt-0 flex gap-2">
          {['price', 'rating', 'speed'].map((type) => (
            <button
              key={type}
              onClick={() => setSortBy(type as any)}
              className={`px-4.5 py-2.5 rounded-2xl text-xs sm:text-sm font-bold transition-all capitalize ${
                sortBy === type 
                  ? 'bg-emerald-500/25 text-emerald-300 border border-emerald-400 shadow-md shadow-emerald-500/20 scale-105' 
                  : 'bg-slate-900 text-slate-300 border border-white/10 hover:bg-slate-800 hover:text-white'
              } hover:scale-102 active:scale-98`}
            >
              Sort by {type}
            </button>
          ))}
        </div>
      </div>

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {sortedQuotes.map((quote) => (
          <div key={quote.quote_id} className="bg-slate-900/50 border border-white/10 rounded-3xl p-6 hover:border-emerald-500/50 transition-all group flex flex-col">
            
            <div className="flex justify-between items-start mb-4">
              <div>
                <h3 className="text-xl font-bold text-white">{quote.vendor_name}</h3>
                <div className="flex items-center mt-1">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className={`w-4 h-4 ${i < Math.floor(quote.rating) ? 'text-amber-400 fill-amber-400' : 'text-slate-600'}`} />
                  ))}
                  <span className="text-slate-300 text-sm ml-2">{quote.rating}</span>
                </div>
              </div>
              {quote.subsidy_inclusive && (
                <span className="bg-emerald-500/10 text-emerald-400 text-xs px-2 py-1 rounded-md border border-emerald-500/20">
                  Subsidy Incl.
                </span>
              )}
            </div>

            <div className="space-y-3 mb-6 flex-grow">
              <div className="flex justify-between text-sm">
                <span className="text-slate-400">Panels</span>
                <span className="text-white font-medium">{quote.panel_brand}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-slate-400">Inverter</span>
                <span className="text-white font-medium">{quote.inverter_type}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-slate-400">Timeline</span>
                <span className="text-white font-medium">{quote.installation_days} Days</span>
              </div>
              <div className="flex items-center text-sm text-lime-400 pt-2">
                <Shield className="w-4 h-4 mr-2" />
                {quote.warranty_years} Years Warranty
              </div>
            </div>

            <div className="border-t border-white/10 pt-4 mb-6">
              <span className="text-slate-400 text-sm block mb-1">Total Net Price</span>
              <span className="text-3xl font-bold text-white">₹{fmt(quote.total_price)}</span>
            </div>

            <div className="grid grid-cols-2 gap-3 mt-auto">
              <button className="py-3.5 rounded-2xl text-sm font-bold border border-white/20 text-white hover:bg-white/10 transition-all hover:scale-[1.02] active:scale-[0.98]">
                Counter Offer
              </button>
              <button className="py-3.5 rounded-2xl text-sm font-black bg-gradient-to-r from-emerald-500 to-lime-500 text-slate-950 hover:shadow-[0_0_20px_rgba(16,185,129,0.4)] transition-all shadow-lg flex items-center justify-center hover:scale-[1.02] active:scale-[0.98]">
                <CheckCircle className="w-4 h-4 mr-1.5 stroke-[2.5]" /> Accept Bid
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
