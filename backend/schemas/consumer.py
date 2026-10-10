from typing import Optional, List
from pydantic import BaseModel

class SiteInputSchema(BaseModel):
    user_id: str
    latitude: float
    longitude: float
    state: str
    approx_roof_area_sqft: float
    monthly_bill_inr: float
    avg_tariff_per_unit: float = 8.0
    property_type: str = "Residential"

class SubsidyBreakdown(BaseModel):
    central_scheme_name: str = 'PM Surya Ghar Muft Bijli Yojana'
    central_subsidy_amount: float
    state_subsidy_amount: float
    net_payable_cost: float

class SolarAnalysisResult(BaseModel):
    analysis_id: str
    recommended_capacity_kw: float
    total_panels_needed: int
    annual_generation_units: float
    gross_capex: float
    subsidy: SubsidyBreakdown
    annual_savings_inr: float
    payback_period_years: float
    co2_reduction_tons_per_year: float

class VendorQuote(BaseModel):
    quote_id: str
    vendor_name: str
    vendor_rating: float
    panel_brand: str
    inverter_type: str
    warranty_years: int
    total_price_inr: float
    subsidy_inclusive: bool
    estimated_installation_days: int

class ChatMessage(BaseModel):
    role: str
    content: str

class ChatRequest(BaseModel):
    messages: List[ChatMessage]
    user_state: Optional[str] = None

class ChatResponse(BaseModel):
    reply: str
    sources: List[str]

class RooftopDetectRequest(BaseModel):
    latitude: float
    longitude: float
    property_type: Optional[str] = "Residential"

class RooftopDetectResponse(BaseModel):
    latitude: float
    longitude: float
    formatted_address: str
    city: str
    state: str
    postcode: Optional[str] = ""
    gross_area_sqft: float
    usable_area_sqft: float
    source: str
    polygon: List[List[float]]
    confidence_score: float
    building_type: Optional[str] = None
    estimated_max_kw: float
    nearby_polygons: Optional[List[List[List[float]]]] = []

class LocationSearchResult(BaseModel):
    display_name: str
    latitude: float
    longitude: float
    city: str
    state: str

class LocationSearchResponse(BaseModel):
    results: List[LocationSearchResult]
