import { useMemo, useState } from 'react';
import { ArrowLeft, ArrowRight, Check, MapPin, Star, Sun } from 'lucide-react';
import { useSolarStore } from '../../store/solarStore';
import { createDemoVendorQuotes } from '../../services/demoVendors';

interface VendorMarketplaceProps { onBack: () => void; onReset?: () => void; }
const money = (value: number) => `₹${Math.round(value).toLocaleString('en-IN')}`;

export default function VendorMarketplace({ onBack, onReset }: VendorMarketplaceProps) {
  const { analysisResult, siteInput } = useSolarStore();
  const [sort, setSort] = useState('price');
  const [counterId, setCounterId] = useState<string | null>(null);
  const [amount, setAmount] = useState('');
  const [feedback, setFeedback] = useState<Record<string, string>>({});
  const [error, setError] = useState('');
  const quotes = useMemo(() => analysisResult ? createDemoVendorQuotes(analysisResult, siteInput) : [], [analysisResult, siteInput]);
  const sorted = [...quotes].sort((a, b) => sort === 'rating' ? b.rating - a.rating : sort === 'speed' ? a.days - b.days : a.total - b.total);

  if (!analysisResult) return <div className="consumer-empty"><Sun size={32} /><h1>Start with your solar plan</h1><p>Complete an assessment to see prices tailored to your rooftop.</p><button className="solar-button primary" onClick={onReset || onBack}>Start assessment</button></div>;

  return (
    <section className="vendor-market">
      <header className="consumer-page-header">
        <button className="solar-button quiet" onClick={onBack}><ArrowLeft size={16} /> Back to report</button>
        <span className="demo-label">INTERACTIVE DEMO</span>
      </header>
      <div className="consumer-title"><p className="eyebrow">YOUR SOLAR PLAN · NEXT STEPS</p><h1>A brighter choice for your rooftop.</h1><p>Compare installation packages tailored to the assessment you just completed.</p></div>
      <div className="plan-summary">
        <div><span>Recommended system</span><strong>{analysisResult.recommended_capacity_kw} kW</strong></div>
        <div><span>Location</span><strong>{siteInput.city || siteInput.state || 'Selected rooftop'}</strong></div>
        <div><span>Monthly electricity bill</span><strong>{money(siteInput.monthlyBill || 0)}</strong></div>
        <div><span>Rooftop area</span><strong>{siteInput.roofAreaSqft?.toLocaleString('en-IN')} sq ft</strong></div>
      </div>
      <p className="demo-notice">Fictional vendors, sample ratings and illustrative prices. Accepting or countering a bid only updates this demo; no vendor is contacted and no payment is made.</p>
      <div className="vendor-toolbar"><span>{quotes.length} packages for your {siteInput.propertyType?.toLowerCase() || 'residential'} property</span><label>Sort by <select value={sort} onChange={e => setSort(e.target.value)}><option value="price">Lowest price</option><option value="rating">Sample rating</option><option value="speed">Installation time</option></select></label></div>
      <div className="vendor-grid">
        {sorted.map(quote => (
          <article className="vendor-card" key={quote.id}>
            <div className="vendor-heading"><div className="vendor-monogram">{quote.name.split(' ').map(word => word[0]).join('')}</div><div><h2>{quote.name}</h2><p>{quote.specialty}</p></div><span className="vendor-rating"><Star size={13} /> {quote.rating}</span></div>
            <p className="vendor-area"><MapPin size={14} />{quote.serviceArea}</p>
            <dl className="vendor-specs">
              <div><dt>Solar panels</dt><dd>{quote.panelsCount} × {quote.panels}</dd></div>
              <div><dt>Inverter</dt><dd>{quote.inverter}</dd></div>
              <div><dt>Installation</dt><dd>About {quote.days} days</dd></div>
              <div><dt>Panel performance</dt><dd>25-year demo warranty</dd></div>
              <div><dt>Aftercare</dt><dd>{quote.support}</dd></div>
              <div><dt>Specialisation</dt><dd>{quote.experience}</dd></div>
            </dl>
            <div className="vendor-price"><span>Estimated net investment</span><strong>{money(quote.total)}</strong><div><span>Installed package</span><span>{money(quote.gross)}</span></div><div><span>Assessment subsidy estimate</span><span>− {money(quote.subsidy)}</span></div></div>
            <p className="vendor-fineprint">Package priced at {Math.round(quote.factor * 100)}% of your report’s installed cost. Subsidy is an estimate, subject to eligibility. Battery not included.</p>
            {feedback[quote.id] && <p className="vendor-feedback" role="status"><Check size={16} />{feedback[quote.id]}</p>}
            {counterId === quote.id ? (
              <form className="vendor-counter" onSubmit={event => {
                event.preventDefault();
                const value = Number(amount);
                if (!Number.isFinite(value) || value <= 0 || value >= quote.total) { setError('Enter an amount above ₹0 and below the quoted net price.'); return; }
                setFeedback(previous => ({ ...previous, [quote.id]: `Demo counteroffer of ${money(value)} recorded. Nothing was sent.` }));
                setCounterId(null);
              }}>
                <label htmlFor={`offer-${quote.id}`}>Your demo offer (₹)</label>
                <input autoFocus id={`offer-${quote.id}`} type="number" min="1" max={quote.total - 1} step="1" required value={amount} onChange={e => { setAmount(e.target.value); setError(''); }} />
                {error && <p role="alert">{error}</p>}
                <div className="vendor-actions"><button type="button" className="solar-button" onClick={() => setCounterId(null)}>Cancel</button><button type="submit" className="solar-button primary">Save demo offer</button></div>
              </form>
            ) : <div className="vendor-actions"><button className="solar-button" disabled={quote.total <= 1} onClick={() => { setCounterId(quote.id); setAmount(String(Math.round(quote.total * 0.95))); setError(''); }}>Counter offer</button><button className="solar-button primary" onClick={() => setFeedback(previous => ({ ...previous, [quote.id]: 'Demo bid accepted. No booking or payment was made.' }))}>Accept demo bid <ArrowRight size={15} /></button></div>}
          </article>
        ))}
      </div>
    </section>
  );
}
