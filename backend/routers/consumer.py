from fastapi import APIRouter, Form, UploadFile, File, HTTPException
from typing import Optional, List
from schemas.consumer import (
    SiteInputSchema, SolarAnalysisResult, VendorQuote, 
    ChatRequest, ChatResponse,
    RooftopDetectRequest, RooftopDetectResponse, LocationSearchResponse
)
from services.solar_math import calculate_solar_analysis
from services.aws_s3 import upload_file_to_s3
from services.dynamodb import save_analysis, list_user_analyses
from services.subsidy_rag import chat_with_subsidy_assistant
from services.roof_detector import detect_rooftop_footprint, search_places
import uuid

router = APIRouter(prefix="/api/v1/consumer", tags=["Consumer Solar Engine"])

@router.post("/analyze-site", response_model=SolarAnalysisResult)
def analyze_site(
    user_id: str = Form(...),
    latitude: float = Form(...),
    longitude: float = Form(...),
    state: str = Form(...),
    approx_roof_area_sqft: float = Form(...),
    monthly_bill_inr: float = Form(...),
    avg_tariff_per_unit: float = Form(8.0),
    property_type: str = Form("Residential"),
    image: Optional[UploadFile] = File(None)
):
    site_input = SiteInputSchema(
        user_id=user_id,
        latitude=latitude,
        longitude=longitude,
        state=state,
        approx_roof_area_sqft=approx_roof_area_sqft,
        monthly_bill_inr=monthly_bill_inr,
        avg_tariff_per_unit=avg_tariff_per_unit,
        property_type=property_type
    )
    
    if image:
        upload_file_to_s3(image, user_id)
        
    analysis_result = calculate_solar_analysis(site_input)
    save_analysis(user_id, analysis_result)
    
    return analysis_result

@router.get("/analyses/{user_id}", response_model=List[SolarAnalysisResult])
def get_user_analyses(user_id: str):
    analyses = list_user_analyses(user_id)
    return [SolarAnalysisResult(**a) for a in analyses]

@router.get("/vendor-quotes/{analysis_id}", response_model=List[VendorQuote])
def get_vendor_quotes(analysis_id: str):
    vendors = [
        ("Tata Power Solar", 4.8, "Tata", "String"),
        ("Waaree Energies", 4.6, "Waaree", "Microinverter"),
        ("Adani Solar", 4.5, "Adani", "String"),
        ("Luminous", 4.3, "Luminous", "Hybrid"),
        ("Havells", 4.4, "Havells", "String"),
        ("Microtek", 4.2, "Microtek", "String")
    ]
    
    quotes = []
    base_price = 150000.0  # mock base price
    
    for v_name, rating, brand, inv_type in vendors:
        quotes.append(VendorQuote(
            quote_id=str(uuid.uuid4()),
            vendor_name=v_name,
            vendor_rating=rating,
            panel_brand=brand,
            inverter_type=inv_type,
            warranty_years=25,
            total_price_inr=base_price * (1 + (rating - 4.0)*0.1),
            subsidy_inclusive=True,
            estimated_installation_days=14
        ))
        
    return quotes

@router.post("/chat", response_model=ChatResponse)
def chat(request: ChatRequest):
    reply, sources = chat_with_subsidy_assistant(request.messages, request.user_state)
    return ChatResponse(reply=reply, sources=sources)

@router.post("/detect-rooftop", response_model=RooftopDetectResponse)
async def detect_rooftop(request: RooftopDetectRequest):
    """
    Identifies rooftop area and boundaries using location (coordinates):
    - Uses OpenStreetMap vector footprints if mapped.
    - Uses intelligent plot synthesis heuristic if unmapped.
    - Reverse geocodes to get Indian address, city, state.
    - Calculates gross area, usable shadow-free solar area, and max capacity.
    """
    result = await detect_rooftop_footprint(
        lat=request.latitude,
        lon=request.longitude,
        property_type=request.property_type or "Residential"
    )
    return RooftopDetectResponse(**result)

@router.get("/search-location", response_model=LocationSearchResponse)
async def search_location(query: str):
    """
    Geocodes text address/city queries across India to provide auto-complete coordinates.
    """
    results = await search_places(query)
    return LocationSearchResponse(results=results)
