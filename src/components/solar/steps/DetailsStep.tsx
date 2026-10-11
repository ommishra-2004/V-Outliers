import { useMemo } from 'react';
import { ArrowLeft, ArrowRight, Sun } from 'lucide-react';
import { useSolarStore } from '../../../store/solarStore';
import { calculateSolarAnalysisEngine } from '../../../services/api';

const money = (n: number) => `₹${Math.round(n).toLocaleString('en-IN')}`;
export default function DetailsStep() {
  const { siteInput, updateSiteInput, setStep, setAnalysisResult } = useSolarStore();
  const bill = siteInput.monthlyBill || 2500;
  const area = siteInput.roofAreaSqft || 1200;
  const tariff = siteInput.averageTariff || 8;
  const projection = useMemo(() => calculateSolarAnalysisEngine({ monthlyBill: bill, roofAreaSqft: area, averageTariff: tariff, state: siteInput.state }), [bill, area, tariff, siteInput.state]);
  return (
    <section className="energy-step">
      <div className="consumer-title"><p className="eyebrow">STEP 02 · YOUR ENERGY USE</p><h1>Let’s size your solar system.</h1><p>A few details help us find the right fit for your rooftop and electricity needs.</p></div>
      <div className="energy-grid">
        <div className="consumer-card energy-inputs">
          <h2>Your home, your energy.</h2>
          <div className="energy-field"><label htmlFor="monthly-bill">Monthly electricity bill <strong>{money(bill)}</strong></label><input id="monthly-bill" type="range" min="500" max="30000" step="500" value={bill} onChange={e => updateSiteInput({monthlyBill:Number(e.target.value)})} /><div className="bill-presets">{[1500,3000,6000,12000].map(value => <button key={value} aria-pressed={bill === value} onClick={() => updateSiteInput({monthlyBill:value})}>{money(value)}</button>)}</div></div>
          <div className="energy-field"><label htmlFor="roof-area">Rooftop area <strong>{area.toLocaleString('en-IN')} sq ft</strong></label><input id="roof-area" type="range" min="200" max={Math.max(5000,area)} step="any" value={area} onChange={e => updateSiteInput({roofAreaSqft:Number(e.target.value)})} /><p>We allow 25% of the area for access and obstructions.</p></div>
          <div className="energy-field"><label htmlFor="tariff">Electricity tariff <span>₹ / kWh</span></label><input id="tariff" type="number" min="3" max="18" step="0.5" value={tariff} onChange={e => { const value=Number(e.target.value); if(value>=3 && value<=18) updateSiteInput({averageTariff:value}); }} /><p>Use the per-unit rate from your electricity bill.</p></div>
        </div>
        <div className="consumer-card energy-projection"><div className="projection-label"><Sun size={20}/><span>YOUR ESTIMATED SOLAR PLAN</span></div><div className="capacity-number">{projection.recommended_capacity_kw}<span>kW</span></div><p>Approximately {Math.ceil(projection.recommended_capacity_kw * 2.5)} panels, sized for your energy use and available roof.</p><dl><div><dt>Estimated net investment</dt><dd>{money(projection.net_cost)}</dd></div><div><dt>Estimated annual savings</dt><dd>{money(projection.annual_savings)}</dd></div><div><dt>Estimated payback</dt><dd>{projection.payback_period_years} years</dd></div><div><dt>Annual generation</dt><dd>{projection.estimated_generation_kwh_per_year.toLocaleString('en-IN')} kWh</dd></div></dl><p className="projection-note">Uses the existing assessment model for {siteInput.state || 'Karnataka'}. Final installation costs and subsidy eligibility require confirmation.</p></div>
      </div>
      <div className="consumer-step-actions"><button className="solar-button" onClick={() => setStep(1)}><ArrowLeft size={16}/> Back to rooftop</button><button className="solar-button primary" onClick={() => {setAnalysisResult(projection);setStep(3);}}>Review my plan <ArrowRight size={16}/></button></div>
    </section>
  );
}
