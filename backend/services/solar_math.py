import math
import uuid
from schemas.consumer import SiteInputSchema, SolarAnalysisResult, SubsidyBreakdown

SPACE_PER_KW_SQFT = 100
UNITS_PER_KW_PER_MONTH = 120
COST_PER_KW = 52000
CO2_REDUCTION_PER_KW_TONS = 1.2
WATTS_PER_PANEL = 400

STATE_SOLAR_DATA = {
    "rajasthan": 165,
    "gujarat": 150,
    "maharashtra": 135,
    "karnataka": 144,
    "tamil nadu": 138,
    "kerala": 114,
    "delhi": 135,
    "uttar pradesh": 129,
    "punjab": 135,
    "haryana": 138,
    "west bengal": 117,
    "bihar": 126,
    "odisha": 132,
    "madhya pradesh": 141,
    "chhattisgarh": 135,
    "telangana": 144,
    "andhra pradesh": 147,
    "jharkhand": 123,
    "assam": 111,
    "goa": 132,
    "uttarakhand": 132,
    "himachal pradesh": 129,
    "jammu & kashmir": 129,
    "jammu and kashmir": 129,
    "ladakh": 180,
    "sikkim": 108,
    "meghalaya": 105,
    "nagaland": 108,
    "manipur": 108,
    "mizoram": 108,
    "tripura": 111,
    "arunachal pradesh": 108,
    "chandigarh": 135,
    "puducherry": 141,
    "dadra & nagar haveli and daman & diu": 147,
    "lakshadweep": 144,
    "andaman & nicobar": 126,
    "andaman and nicobar": 126,
    "up": 129,
    "mp": 141,
    "ap": 147,
    "hp": 129,
    "j&k": 129,
    "a&n": 126,
    "d&nh/dd": 147
}

def get_units_per_kw_per_month(state: str) -> float:
    if not state:
        return float(UNITS_PER_KW_PER_MONTH)
    state_lower = state.strip().lower()
    return float(STATE_SOLAR_DATA.get(state_lower, UNITS_PER_KW_PER_MONTH))

def calculate_central_subsidy(capacity_kw: float) -> float:
    if capacity_kw <= 0:
        return 0.0
    if capacity_kw <= 2.0:
        return min(capacity_kw * 30000, 60000)
    if capacity_kw <= 3.0:
        return min(60000 + (capacity_kw - 2.0) * 18000, 78000)
    return 78000.0

def calculate_solar_analysis(site_input: SiteInputSchema) -> SolarAnalysisResult:
    # Use state-specific units per kw per month if state is provided
    state_name = getattr(site_input, "state", "")
    units_per_kw_month = get_units_per_kw_per_month(state_name)
    
    monthly_units = site_input.monthly_bill_inr / site_input.avg_tariff_per_unit
    
    capacity_by_units = monthly_units / units_per_kw_month
    capacity_by_area = site_input.approx_roof_area_sqft / SPACE_PER_KW_SQFT
    
    capacity = round(min(capacity_by_units, capacity_by_area), 1)
    capacity = max(capacity, 1.0)
    
    gross_capex = capacity * COST_PER_KW
    central_subsidy = calculate_central_subsidy(capacity)
    state_subsidy = 0.0
    net_cost = gross_capex - central_subsidy - state_subsidy
    
    annual_savings = monthly_units * 12 * site_input.avg_tariff_per_unit
    payback = net_cost / annual_savings if annual_savings > 0 else 0.0
    
    co2 = capacity * CO2_REDUCTION_PER_KW_TONS
    panels = math.ceil(capacity * 1000 / WATTS_PER_PANEL)
    annual_generation = capacity * units_per_kw_month * 12
    
    subsidy_breakdown = SubsidyBreakdown(
        central_subsidy_amount=central_subsidy,
        state_subsidy_amount=state_subsidy,
        net_payable_cost=net_cost
    )
    
    return SolarAnalysisResult(
        analysis_id=str(uuid.uuid4()),
        recommended_capacity_kw=capacity,
        total_panels_needed=panels,
        annual_generation_units=annual_generation,
        gross_capex=gross_capex,
        subsidy=subsidy_breakdown,
        annual_savings_inr=annual_savings,
        payback_period_years=payback,
        co2_reduction_tons_per_year=co2
    )
