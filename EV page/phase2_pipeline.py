"""
Phase 2+ Production Data Pipeline - 100% Real-Data Driven
Integrates exact STATE_SOLAR_DATA (units per kW per month), real VAHAN registrations, 
deduped charging stations, and city land costs.
"""

import os
import re
import json
import numpy as np
import pandas as pd
from rapidfuzz import process, fuzz

BASE = r"D:\Vidhi\Hackathons\VOutliers\EV page\datasets"
OUT_DIR = os.path.join(BASE, "processed")
SRC_DATA_DIR = r"D:\Vidhi\Hackathons\VOutliers\EV page\src\data"
os.makedirs(OUT_DIR, exist_ok=True)
os.makedirs(SRC_DATA_DIR, exist_ok=True)

# 1. State Mapping Dictionary
STATE_MAP = {
    'AN': 'Andaman and Nicobar Islands', 'AP': 'Andhra Pradesh', 'AR': 'Arunachal Pradesh',
    'AS': 'Assam', 'BR': 'Bihar', 'CH': 'Chandigarh', 'CG': 'Chhattisgarh',
    'DL': 'Delhi', 'GA': 'Goa', 'GJ': 'Gujarat', 'HR': 'Haryana',
    'HP': 'Himachal Pradesh', 'JK': 'Jammu and Kashmir', 'JH': 'Jharkhand',
    'KA': 'Karnataka', 'KL': 'Kerala', 'LA': 'Ladakh', 'LD': 'Lakshadweep',
    'MP': 'Madhya Pradesh', 'MH': 'Maharashtra', 'MN': 'Manipur', 'ML': 'Meghalaya',
    'MZ': 'Mizoram', 'NL': 'Nagaland', 'OD': 'Odisha', 'PB': 'Punjab',
    'PY': 'Puducherry', 'RJ': 'Rajasthan', 'SK': 'Sikkim', 'TN': 'Tamil Nadu',
    'TS': 'Telangana', 'TR': 'Tripura', 'UP': 'Uttar Pradesh', 'UK': 'Uttarakhand',
    'WB': 'West Bengal'
}

# 2. Exact User-Provided Solar Generation Dataset (Units / kWh of electricity per month per 1 kW solar panel)
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

def get_solar_units_per_kw_month(state_name):
    st = state_name.lower().strip()
    if st in STATE_SOLAR_DATA:
        return STATE_SOLAR_DATA[st]
    for k, v in STATE_SOLAR_DATA.items():
        if k in st or st in k:
            return v
    return 130 # National baseline

def norm_state(s):
    s = str(s).strip().upper()
    for code, full in STATE_MAP.items():
        if full.upper() in s or s in full.upper():
            return full
  
    if 'PUDUCHERRY' in s: return 'Puducherry'
    if 'UTTRAKHAND' in s or 'UTTARAKHAND' in s: return 'Uttarakhand'
    if 'JAMMU' in s: return 'Jammu and Kashmir'
    if 'D&NH' in s or 'DAMAN' in s: return 'Gujarat'

    return s.title()

def clean_rto_city(name):
    part = name.split('-')[0].strip()
    part = re.sub(r'\b(RTO|ARTO|DTO|RTA|UO|MVI OFFICE|SUB DTO|UNIT OFFICE|FLYING SQUAD|REGIONAL TRANSPORT OFFICE)\b', '', part, flags=re.IGNORECASE).strip()
    part = re.sub(r'\s+', ' ', part).strip()
    return part

def run_production_pipeline():
    print("--- 1. Ingesting & Cleaning Real Charging Stations ---")
    cs_path = os.path.join(BASE, 'India_EV_charge_station.xlsx')
    xl_cs = pd.ExcelFile(cs_path)
    cs_raw = pd.concat([xl_cs.parse(s) for s in xl_cs.sheet_names], ignore_index=True)
    cs_raw.columns = [str(c).strip() for c in cs_raw.columns]
    
    total_raw_cs = len(cs_raw)
    cs_dedup = cs_raw.drop_duplicates().copy()
    
    cs_dedup['Lat'] = pd.to_numeric(cs_dedup['Latitude'], errors='coerce')
    cs_dedup['Lon'] = pd.to_numeric(cs_dedup['Longitude'], errors='coerce')
    valid_cs = cs_dedup[(cs_dedup['Lat'].between(6, 38)) & (cs_dedup['Lon'].between(68, 98))].copy()
    
    valid_cs['Norm_State'] = valid_cs['State'].apply(norm_state)
    valid_cs['District_Clean'] = valid_cs['District'].str.strip().str.title()
    
    # Save cleaned charging stations
    cleaned_cs_file = os.path.join(OUT_DIR, "cleaned_charging_stations.csv")
    valid_cs.to_csv(cleaned_cs_file, index=False)
    
    # District-level station aggregation
    dist_cs = valid_cs.groupby(['Norm_State', 'District_Clean']).agg(
        station_count=('CPO Name', 'count'),
        fast_chargers=('Types of Chargers Installed/ Connector', lambda s: s.str.contains('CCS|DC|Combo', case=False, na=False).sum()),
        mean_lat=('Lat', 'mean'),
        mean_lon=('Lon', 'mean')
    ).reset_index()
    
    state_cs = valid_cs.groupby('Norm_State').agg(
        state_station_count=('CPO Name', 'count'),
        state_fast_chargers=('Types of Chargers Installed/ Connector', lambda s: s.str.contains('CCS|DC|Combo', case=False, na=False).sum()),
        state_mean_lat=('Lat', 'mean'),
        state_mean_lon=('Lon', 'mean')
    ).reset_index()

    print("\n--- 2. Ingesting Real Land Cost Benchmarks ---")
    land_path = os.path.join(BASE, 'India_City_Land_Costs_Only.csv')
    land_df = pd.read_csv(land_path)
    land_df['Norm_State'] = land_df['State'].apply(norm_state)
    land_df['City_Clean'] = land_df['City'].str.strip()
    
    state_land_avg = land_df.groupby('Norm_State')['Avg Land Price (rupees_per_sqft)'].mean().to_dict()
    national_land_median = float(land_df['Avg Land Price (rupees_per_sqft)'].median())

    print("\n--- 3. Ingesting Real VAHAN EV Registrations ---")
    vahan_path = os.path.join(BASE, 'India_RTO_Monthly_EV_Registrations.xlsx')
    xl_vahan = pd.ExcelFile(vahan_path)
    vahan_df = xl_vahan.parse('RTO Monthly Data')
    vahan_df['Month_dt'] = pd.to_datetime(vahan_df['Month'], format='%Y-%m', errors='coerce')
    
    def summarize_rto(g):
        g = g.sort_values('Month_dt')
        total_reg = int(g['Registrations'].sum())
        recent_3m = int(g.tail(3)['Registrations'].sum())
        prev_3m = int(g.iloc[-6:-3]['Registrations'].sum()) if len(g) >= 6 else None
        growth_3m = ((recent_3m - prev_3m) / prev_3m * 100.0) if (prev_3m is not None and prev_3m > 0) else 0.0
        history = [{"month": row['Month'], "count": int(row['Registrations'])} for _, row in g.iterrows()]
        
        return pd.Series({
            'total_registrations': total_reg,
            'recent_3m_registrations': recent_3m,
            'prev_3m_registrations': prev_3m,
            'growth_rate_3m_pct': round(growth_3m, 2),
            'months_count': len(g),
            'history': json.dumps(history)
        })

    rto_summary = vahan_df.groupby(['State Code', 'State', 'RTO Code', 'RTO Name']).apply(summarize_rto).reset_index()
    rto_summary['Cleaned_City'] = rto_summary['RTO Name'].apply(clean_rto_city)
    rto_summary['Norm_State'] = rto_summary['State Code'].map(STATE_MAP).fillna(rto_summary['State'])

    print("\n--- 4. Feature Enrichment with Real Solar Generation & Land ---")
    matched_records = []
    
    for idx, row in rto_summary.iterrows():
        st = row['Norm_State']
        city_raw = row['Cleaned_City']
        rto_name = row['RTO Name']
        
        # Land cost match
        land_cost = None
        land_match_type = "national_median"
        land_city_match = None
        
        state_land = land_df[land_df['Norm_State'] == st]
        if not state_land.empty:
            match = process.extractOne(city_raw, state_land['City_Clean'].tolist(), scorer=fuzz.partial_ratio)
            if match and match[1] >= 80:
                land_cost = float(state_land[state_land['City_Clean'] == match[0]]['Avg Land Price (rupees_per_sqft)'].values[0])
                land_match_type = "city_direct"
                land_city_match = match[0]
        
        if land_cost is None and st in state_land_avg:
            land_cost = float(state_land_avg[st])
            land_match_type = "state_average"
        elif land_cost is None:
            land_cost = national_land_median
            land_match_type = "national_median"
            
        # Geographic coordinates & station match
        lat, lon = None, None
        station_count = 0
        fast_chargers = 0
        geo_source = "state_centroid"
        
        state_cs_sub = dist_cs[dist_cs['Norm_State'] == st]
        if not state_cs_sub.empty:
            cs_match = process.extractOne(city_raw, state_cs_sub['District_Clean'].tolist(), scorer=fuzz.partial_ratio)
            if cs_match and cs_match[1] >= 75:
                matched_dist_row = state_cs_sub[state_cs_sub['District_Clean'] == cs_match[0]].iloc[0]
                lat = float(matched_dist_row['mean_lat'])
                lon = float(matched_dist_row['mean_lon'])
                station_count = int(matched_dist_row['station_count'])
                fast_chargers = int(matched_dist_row['fast_chargers'])
                geo_source = f"district_match ({cs_match[0]})"
                
        if lat is None or np.isnan(lat):
            st_row = state_cs[state_cs['Norm_State'] == st]
            if not st_row.empty:
                lat = float(st_row['state_mean_lat'].values[0])
                lon = float(st_row['state_mean_lon'].values[0])
                jitter_lat = (hash(rto_name) % 1000 - 500) / 20000.0
                jitter_lon = ((hash(rto_name) >> 4) % 1000 - 500) / 20000.0
                lat += jitter_lat
                lon += jitter_lon
                station_count = int(round(st_row['state_station_count'].values[0] / max(1, len(rto_summary[rto_summary['Norm_State'] == st]))))
                geo_source = "state_distributed"
            else:
                lat, lon = 20.5937, 78.9629
                geo_source = "fallback_india"

        # EXACT USER SOLAR DATA: Units / kWh per 1 kW solar panel per month
        solar_monthly_units = get_solar_units_per_kw_month(st)
        
        evs = row['total_registrations']
        chargers = max(1, station_count)
        ev_per_charger = round(evs / chargers, 1)
        
        matched_records.append({
            'state_code': row['State Code'],
            'state': st,
            'rto_code': int(row['RTO Code']),
            'rto_name': rto_name,
            'city_name': city_raw,
            'total_ev_registrations': evs,
            'recent_3m_registrations': row['recent_3m_registrations'],
            'growth_rate_3m_pct': row['growth_rate_3m_pct'],
            'station_count': station_count,
            'fast_chargers': fast_chargers,
            'ev_per_charger': ev_per_charger,
            'solar_units_per_kw_month': solar_monthly_units,
            'land_price_sqft': land_cost,
            'land_match_type': land_match_type,
            'land_city_match': land_city_match,
            'latitude': round(lat, 5),
            'longitude': round(lon, 5),
            'geo_source': geo_source,
            'history': row['history']
        })

    matched_df = pd.DataFrame(matched_records)

    print("\n--- 5. Deterministic Opportunity Scoring Engine ---")
    # Normalized Factors (0 - 100)
    # 1. EV Demand (Volume)
    max_ev = matched_df['total_ev_registrations'].quantile(0.98)
    matched_df['score_demand'] = np.clip(matched_df['total_ev_registrations'] / max(1, max_ev) * 100, 0, 100)
    
    # 2. EV Growth Rate
    matched_df['score_growth'] = np.clip(50 + (matched_df['growth_rate_3m_pct'] * 2.0), 0, 100)
    
    # 3. Charging Gap (EVs per charger pressure)
    gap_median = matched_df['ev_per_charger'].quantile(0.95)
    matched_df['score_charging_gap'] = np.clip(matched_df['ev_per_charger'] / max(1, gap_median) * 100, 0, 100)
    
    # 4. Solar Generation Potential (Using EXACT STATE_SOLAR_DATA units: range 105 to 180 units/kW/mo)
    matched_df['score_solar'] = np.clip((matched_df['solar_units_per_kw_month'] - 100) / 80.0 * 100, 10, 100)
    
    # 5. Land Affordability (inverse of price: lower price = higher feasibility)
    p_min = 1400.0
    p_max = 25000.0
    matched_df['score_affordability'] = np.clip((1 - (matched_df['land_price_sqft'] - p_min) / (p_max - p_min)) * 100, 10, 100)

    # Composite Balanced Score: Demand 30%, Gap 25%, Growth 20%, Land 15%, Solar 10%
    matched_df['composite_score'] = (
        matched_df['score_demand'] * 0.30 +
        matched_df['score_charging_gap'] * 0.25 +
        matched_df['score_growth'] * 0.20 +
        matched_df['score_affordability'] * 0.15 +
        matched_df['score_solar'] * 0.10
    ).round(1)

    def assign_band(score):
        if score >= 65: return 'high'
        if score >= 40: return 'medium'
        return 'low'

    matched_df['opportunity_band'] = matched_df['composite_score'].apply(assign_band)
    
    # Sort all opportunities by composite score
    all_sorted = matched_df.sort_values('composite_score', ascending=False).copy()
    
    all_rto_master = []
    for rank, (_, row) in enumerate(all_sorted.iterrows(), 1):
        hist = json.loads(row['history']) if isinstance(row['history'], str) else []
        units_per_kw = int(row['solar_units_per_kw_month'])
        total_evs = int(row['total_ev_registrations'])
        land_rate = float(row['land_price_sqft'])
        
        # Budget categorization based on real entry CAPEX
        if land_rate <= 5500:
            band_str = "₹25L – ₹50L"
        elif land_rate <= 12000:
            band_str = "₹50L – ₹1.2Cr"
        else:
            band_str = "> ₹1.2Cr"
            
        rto_item = {
            "id": f"opp-{row['state_code'].lower()}-{row['rto_code']}",
            "name": f"{row['city_name']} EV Gateway",
            "state": row['state'],
            "districtOrCity": row['city_name'],
            "opportunityScore": int(round(row['composite_score'])),
            "opportunityBand": row['opportunity_band'],
            "rank": rank,
            "latitude": row['latitude'],
            "longitude": row['longitude'],
            "totalRegistrations": total_evs,
            "recentRegistrations": int(row['recent_3m_registrations']),
            "growthRatePct": float(row['growth_rate_3m_pct']),
            "stationCount": int(row['station_count']),
            "fastChargers": int(row['fast_chargers']),
            "evPerCharger": float(row['ev_per_charger']),
            "solarUnitsPerKwMonth": units_per_kw,
            "annualSolarGenKwhPerKw": units_per_kw * 12,
            "landPriceSqft": land_rate,
            "landMatchType": row['land_match_type'],
            "geoSource": row['geo_source'],
            "estimatedBudgetBand": band_str,
            "targetSegments": ["Public Fast Charging", "Commercial Fleets", "Highway Inter-City"],
            "chargerTypes": ["CCS-2 Dual Gun (60kW DC)", "Type-2 (22kW AC)"],
            "solarPotentialIndex": int(round(row['score_solar'])),
            "chargingGapIndex": int(round(row['score_charging_gap'])),
            "whyHereSummary": (
                f"Jurisdiction has {total_evs:,} registered EVs with {row['ev_per_charger']} EVs per public charger. "
                f"State solar generation yields {units_per_kw} kWh/kW/month. "
                f"Regional land benchmark sits at ₹{int(land_rate):,}/sq.ft ({row['land_match_type']})."
            ),
            "risks": [
                f"100kVA–250kVA grid transformer feasibility must be cleared with local DISCOM.",
                f"Land parcel acquisition/lease execution needed at ₹{int(land_rate):,}/sq.ft benchmark.",
                f"Fleet charging competition against {row['station_count']} existing active public charging stations."
            ],
            "factors": [
                {
                    "name": "EV Fleet Demand",
                    "score": int(round(row['score_demand'])),
                    "weight": 30,
                    "weightedContribution": round(row['score_demand'] * 0.30, 1),
                    "source": "VAHAN National Registration Portal (Feb 2024 - Oct 2026)",
                    "explanation": f"{total_evs:,} registered electric vehicles in local jurisdiction."
                },
                {
                    "name": "Charging Gap (Unmet Demand)",
                    "score": int(round(row['score_charging_gap'])),
                    "weight": 25,
                    "weightedContribution": round(row['score_charging_gap'] * 0.25, 1),
                    "source": "Ministry of Heavy Industries Active Charging Station Master",
                    "explanation": f"{row['ev_per_charger']} EVs per public charger. High vehicle-to-charger pressure."
                },
                {
                    "name": "Fleet Growth Velocity",
                    "score": int(round(row['score_growth'])),
                    "weight": 20,
                    "weightedContribution": round(row['score_growth'] * 0.20, 1),
                    "source": "Quarter-over-Quarter Trend Analysis",
                    "explanation": f"{'+' if row['growth_rate_3m_pct'] >= 0 else ''}{row['growth_rate_3m_pct']}% adoption rate velocity change."
                },
                {
                    "name": "Land Feasibility",
                    "score": int(round(row['score_affordability'])),
                    "weight": 15,
                    "weightedContribution": round(row['score_affordability'] * 0.15, 1),
                    "source": f"Benchmark Land Price Index ({row['land_match_type']})",
                    "explanation": f"Average land cost ₹{int(land_rate):,}/sq.ft."
                },
                {
                    "name": "State Solar Potential",
                    "score": int(round(row['score_solar'])),
                    "weight": 10,
                    "weightedContribution": round(row['score_solar'] * 0.10, 1),
                    "source": "State Solar Generation Benchmark",
                    "explanation": f"{units_per_kw} kWh units generated per 1 kW solar panel per month ({units_per_kw * 12} kWh/yr)."
                }
            ],
            "history": hist[-12:]
        }
        all_rto_master.append(rto_item)

    # 1. Save Full All-India RTO Master (all 1,275 jurisdictions)
    all_json_path = os.path.join(SRC_DATA_DIR, "all_rto_master.json")
    with open(all_json_path, "w", encoding="utf-8") as f:
        json.dump(all_rto_master, f, indent=2)

    # 2. Save Top 80 Prominent Hotspot Opportunities for Map Markers & Filter List
    top_80 = all_rto_master[:80]
    processed_json = os.path.join(OUT_DIR, "real_opportunities.json")
    src_json = os.path.join(SRC_DATA_DIR, "real_opportunities.json")
    
    with open(processed_json, "w", encoding="utf-8") as f:
        json.dump(top_80, f, indent=2)
    with open(src_json, "w", encoding="utf-8") as f:
        json.dump(top_80, f, indent=2)
        
    print(f"\nPipeline complete! Exported all {len(all_rto_master)} RTO jurisdictions to all_rto_master.json, and {len(top_80)} prominent hotspots to real_opportunities.json.")

if __name__ == "__main__":
    run_production_pipeline()
