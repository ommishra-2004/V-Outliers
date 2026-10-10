export interface SiteInput {
  address: string;
  city: string;
  latitude: number;
  longitude: number;
  state: string;
  propertyType: 'Residential' | 'Commercial' | 'Plot';
  roofAreaSqft: number;
  monthlyBill: number;
  averageTariff: number;
  image?: File;
}

export interface SubsidyBreakdown {
  central_subsidy: number;
  state_subsidy: number;
  total_subsidy: number;
  details: string[];
}

export interface SolarAnalysisResult {
  analysis_id: string;
  recommended_capacity_kw: number;
  estimated_generation_kwh_per_year: number;
  gross_cost: number;
  subsidy_breakdown: SubsidyBreakdown;
  net_cost: number;
  payback_period_years: number;
  annual_savings: number;
  co2_reduction_tons_per_year: number;
  roi_percentage: number;
  savings_projection_10yr: number[];
  grid_cost_projection_10yr: number[];
}

export interface VendorQuote {
  quote_id: string;
  vendor_name: string;
  rating: number;
  panel_brand: string;
  inverter_type: string;
  warranty_years: number;
  total_price: number;
  subsidy_inclusive: boolean;
  installation_days: number;
}

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  sources?: string[];
}

export interface ChatResponse {
  reply: string;
  sources?: string[];
}

export interface AuthUser {
  email: string;
  name?: string;
  token?: string;
  user_id?: string;
}

export interface RooftopDetectResponse {
  latitude: number;
  longitude: number;
  formatted_address: string;
  city: string;
  state: string;
  postcode: string;
  gross_area_sqft: number;
  usable_area_sqft: number;
  source: string;
  polygon: [number, number][];
  confidence_score: number;
  building_type?: string;
  estimated_max_kw: number;
  nearby_polygons?: [number, number][][];
}

export interface LocationSearchResult {
  display_name: string;
  latitude: number;
  longitude: number;
  city: string;
  state: string;
}

