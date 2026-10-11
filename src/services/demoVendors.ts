import type { SiteInput, SolarAnalysisResult } from '../types/solar';

// Fictional providers and illustrative package differences, never live quotes.
const PROVIDERS = [
  { id: 'sunleaf', name: 'Sunleaf Solar', specialty: 'Everyday rooftop value', factor: 0.94, rating: 4.6, days: 14, panels: '400W mono PERC', inverter: 'On-grid string', support: '1 year maintenance', experience: 'Residential rooftops' },
  { id: 'helio', name: 'Helio Works', specialty: 'Balanced performance & support', factor: 1, rating: 4.8, days: 12, panels: '400W monocrystalline', inverter: 'Wi-Fi string', support: '2 years maintenance', experience: 'Homes & small businesses' },
  { id: 'evergrid', name: 'Evergrid Energy', specialty: 'Premium panel technology', factor: 1.12, rating: 4.9, days: 18, panels: '400W TOPCon', inverter: 'Smart string', support: '3 years maintenance', experience: 'Premium rooftop systems' },
  { id: 'rooftop', name: 'Rooftop Collective', specialty: 'Local installation support', factor: 0.98, rating: 4.5, days: 10, panels: '400W mono PERC', inverter: 'On-grid string', support: '1 year maintenance', experience: 'Neighbourhood installations' },
  { id: 'bright', name: 'Brightpath Renewables', specialty: 'Monitoring made simple', factor: 1.06, rating: 4.7, days: 16, panels: '400W monocrystalline', inverter: 'App-connected string', support: '2 years maintenance', experience: 'Connected solar systems' },
  { id: 'terra', name: 'TerraVolt Solar', specialty: 'Long-term service package', factor: 1.09, rating: 4.8, days: 21, panels: '400W TOPCon', inverter: 'Wi-Fi string', support: '3 years maintenance', experience: 'Residential & commercial' },
];

export function createDemoVendorQuotes(analysis: SolarAnalysisResult, site: Partial<SiteInput>) {
  const subsidy = site.propertyType === 'Residential' || !site.propertyType
    ? Math.max(0, analysis.subsidy_breakdown.total_subsidy) : 0;
  return PROVIDERS.map(provider => {
    const gross = Math.round(Math.max(0, analysis.gross_cost) * provider.factor);
    const estimatedSubsidy = Math.min(gross, subsidy);
    return {
      ...provider,
      gross,
      subsidy: estimatedSubsidy,
      total: gross - estimatedSubsidy,
      capacity: analysis.recommended_capacity_kw,
      panelsCount: Math.ceil(analysis.recommended_capacity_kw / 0.4),
      serviceArea: [site.city, site.state].filter(Boolean).join(', ') || 'Your selected location',
    };
  });
}
export type DemoVendorQuote = ReturnType<typeof createDemoVendorQuotes>[number];
