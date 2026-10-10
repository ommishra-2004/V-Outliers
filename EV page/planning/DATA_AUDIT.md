# DATA AUDIT — EV ChargePoint Intelligence
> Phase 1 findings. Raw data files are **unchanged**. This document records actual observed values only.
> Generated: 2026-10-10 | Auditor: Antigravity Phase 1 Script

---

## 1. Repository Architecture

### Stack
| Layer | Technology | Notes |
|---|---|---|
| Framework | Vite + React 19 + TypeScript | Bundler mode, `verbatimModuleSyntax=false` |
| Styling | Tailwind CSS v4 (via `@tailwindcss/vite`) | Theme tokens in `src/index.css` |
| Map | react-leaflet 5 + Leaflet 1.9 | Carto dark-mode raster tiles |
| Charts | recharts 3 | Used in ExplainabilityChart |
| Routing | react-router-dom v7 | `/` → landing page, `/investor` → workspace |
| Icons | lucide-react | |
| Utilities | clsx, tailwind-merge | |

### Routes
- `/` — Landing page (dark hero, "HARVEST LIGHT. REUSE ENERGY." recreation)
- `/investor` — Investor Workspace (map-first layout, filters, list, detail panel)

### Data Layer
All current data is **fully mocked**. No backend exists.

| File | Purpose | Status |
|---|---|---|
| `src/data/mock/opportunities.ts` | 10 hard-coded illustrative zones | **Mock — to be replaced** |
| `src/services/opportunityService.ts` | `getOpportunities()`, `getInvestmentEstimate()` | **Mock — interface ready for real data** |
| `src/types/index.ts` | TypeScript types for Opportunity, FinancialAssumptions | **Good shape, extend for real data** |

### Map Implementation
- `MapComponent.tsx` uses `react-leaflet` `MapContainer` + `Marker`
- Map center: `[22.5937, 78.9629]` (India), zoom 5
- Drill-down: `useMap().flyTo()` on marker selection, zooms to level 12
- Opportunity band drives marker color: High=`#d4ff00`, Medium=`#3b82f6`, Low=`#6b7280`
- No geographic breadcrumb drill-down yet (India → State → District flow is partially stubbed)
- No cluster/heatmap rendering

### Build Health
- `npm run build` → ✅ passes (TypeScript + Vite)
- No unit tests exist yet
- `npm run lint` uses `oxlint` (zero-config)

---

## 2. Dataset Inventory

### 2.1 VAHAN Monthly EV Registrations
**File:** `datasets/India_RTO_Monthly_EV_Registrations.xlsx`  
**Size:** ~1.1 MB  
**Source:** Scraped from analytics.parivahan.gov.in via `scrapper.py`  
**Scrape date:** Based on data range, approximately October 2026

#### Sheet 1: `RTO Monthly Data`
| Property | Value |
|---|---|
| Rows | 37,053 |
| Columns | 7 |
| Date range | **2024-02 to 2026-10 (33 months only)** |
| States/UTs | 33 |
| Unique RTOs | 1,275 |
| Zero-registration rows | 2,211 (5.97%) |
| Null values | **0 (none)** |
| Duplicate State+RTO+Month | **0** |

**Columns:**

| Column | Dtype | Nulls | Unique Values | Notes |
|---|---|---|---|---|
| `State` | object | 0 | 33 | Full state names |
| `State Code` | object | 0 | 33 | 2-letter VAHAN codes (AN, AP, …) |
| `RTO Name` | object | 0 | 1,275 | Format: `"City - StateCode_RtoCode"` |
| `RTO Code` | int64 | 0 | 246 | **Numeric only** — not unique across states |
| `Month` | object | 0 | 33 | Format: `YYYY-MM` (e.g., `2024-04`) |
| `Registrations` | int64 | 0 | 1,355 | Min=0, Max=6,092, Mean≈114 |
| `Status` | object | 0 | 1 | All rows = `"SUCCESS"` |

> ⚠️ **Critical limitation:** Data covers only Feb 2024 – Oct 2026. No historical data before 2024 exists in this file. YoY growth trends cannot be derived for earlier periods. The scraper used `FROM_YEAR=2024`.

> ⚠️ **RTO Code is not unique** across states. Must always join on `(State Code, RTO Code)` tuple, never on `RTO Code` alone.

**Top EV states by cumulative registrations (all 33 months):**

| Rank | State | Total EVs |
|---|---|---|
| 1 | MH (Maharashtra) | 636,501 |
| 2 | UP (Uttar Pradesh) | 583,844 |
| 3 | KA (Karnataka) | 441,057 |
| 4 | TN (Tamil Nadu) | 392,089 |
| 5 | MP (Madhya Pradesh) | 288,873 |
| 6 | RJ (Rajasthan) | 252,066 |
| 7 | KL (Kerala) | 240,247 |
| 8 | GJ (Gujarat) | 206,329 |
| 9 | DL (Delhi) | 184,768 |
| 10 | BR (Bihar) | 165,528 |

**Smallest states** (data quality concern for scoring):  
LA (Ladakh): 23, SK (Sikkim): 51, LD (Lakshadweep): 89, NL (Nagaland): 216

---

#### Sheet 2: `RTO Master`
| Property | Value |
|---|---|
| Rows | 1,545 |
| Columns | 5 |
| Unique states | 34 |
| Null values | 0 |

**Columns:**

| Column | Notes |
|---|---|
| `stateCode` | 2-letter VAHAN code |
| `stateName` | Full state name |
| `rtoCode` | Numeric RTO code |
| `rtoName` | Display name (e.g., `"AMBALA CITY - HR1"`) |
| `rtoId` | Internal VAHAN database ID — unique |

> ℹ️ The master sheet has **1,545 RTOs** but the monthly data sheet only has **1,275 unique RTOs**. The 270 RTOs in "Failed Requests" explain most of the gap.

> ⚠️ The master sheet includes **dealer/franchise entries** (names starting with "M/S", "DEALER"). The scrapper's `EXCLUDE_DEALER_ENTRIES=True` flag excluded these from monthly data collection, but they remain in the master sheet.

---

#### Sheet 3: `Failed Requests`
| Property | Value |
|---|---|
| Rows | 270 |
| States affected | 1 unique state (AN — Andaman and Nicobar) |
| Reason | `"Empty response"` (all 270 rows) |

> ⚠️ 270 RTOs returned empty responses. All failures are Andaman & Nicobar sub-island RTOs. These must be treated as **MISSING**, not zero.

---

### 2.2 EV Charging Stations
**File:** `datasets/India_EV_charge_station.xlsx`  
**Size:** ~3.4 MB  
**Source:** Unknown (not scraped by included scripts)

#### Combined (Table 1 + Table 2)
| Property | Value |
|---|---|
| Total rows (all sheets) | 39,641 |
| Rows after deduplication | 31,214 |
| Duplicate rows | **8,427 (21.3%)** |
| Unique states (normalized) | 36 |
| Unique districts | 1,288 |

**Sheet breakdown:**

| Sheet | Rows | Duplicates | States |
|---|---|---|---|
| Table 1 | 6,971 | 1,637 (23.5%) | 13 |
| Table 2 | 32,670 | 6,790 (20.8%) | 34 |

**Columns (same in both sheets):**

| Column | Dtype | Nulls | Notes |
|---|---|---|---|
| `CPO Name` | object | 0 | 41/52 unique operators |
| `Govt/Private` | object | 0 | 2 values: `"Govt."`, `"Private"` |
| `State` | object | 0 | **Inconsistent case** — "HARYANA" vs "Haryana" vs "haryana" |
| `District` | object | 0 | 1,288 unique districts |
| `City/Village` | object | 3 nulls | 4,962+ unique names |
| `Location` | object | 0 | Free-text address |
| `Latitude` | float64 | 0 | Range: 8.09 – 34.56 (valid for India) |
| `Longitude` | float64 | 0 | **Anomaly: one record at 21.27° — outside India** |
| `Types of Chargers…` | object | 0 | 15 unique charger types |
| `Charger Rating` | float64 | 0 | kW values |
| `Connector Rating` | object | 0 | Mixed numeric/string |
| `No. of Connector` | int64 | 0 | 1, 2, or 3 |

> ⚠️ **21.3% duplicate rows** — deduplication is required before computing station counts.

> ⚠️ **State name normalization required** before joining with VAHAN data. At least 10 different casing variants observed.

> ⚠️ **One invalid longitude** (21.27° — should be 70°+). This record must be excluded or flagged.

> ℹ️ Has **latitude/longitude** — enables point-in-polygon joins to districts and radius-based competition analysis.

**Top states by charger count (deduplicated):**

| State | Chargers |
|---|---|
| Karnataka | 8,246 |
| Maharashtra | 5,747 |
| Delhi | 3,475 |
| Haryana | 2,877 |
| Tamil Nadu | 2,623 |
| Uttar Pradesh | 2,622 |

**Charger type distribution (Table 1):**

| Type | Count |
|---|---|
| LEV AC Charge point | 3,027 |
| Type-II AC | 776 |
| Bharat AC-001 | 625 |
| CCS | 582 |
| CCS-II | 569 |
| Bharat DC-001 | 460 |

---

### 2.3 Land Cost
**File:** `datasets/India_City_Land_Costs_Only.csv`  
**Size:** 1.3 KB

| Property | Value |
|---|---|
| Rows | 51 |
| Columns | 3 |
| Null values | 0 |
| Duplicate rows | 0 |

**Columns:**

| Column | Dtype | Notes |
|---|---|---|
| `City` | object | 51 unique city names |
| `State` | object | **Non-standard names** (e.g., "Delhi NCR", "Chandigarh UT", "Ladakh UT") |
| `Avg Land Price (rupees_per_sqft)` | int64 | Range: ₹1,400 – ₹25,000 per sq ft |

> ⚠️ **Critical limitations:**
> - Only **51 cities** — most RTOs will have no matching land cost data
> - Prices represent **purchase price**, not lease/rental. Basis (residential vs commercial vs industrial) unknown
> - Geographic granularity is **city-level** — no district subdivision
> - State name format incompatible with VAHAN state codes without a mapping table
> - No timestamp/source date for these prices

**Price range summary:**

| Band | Cities | Price Range (₹/sqft) |
|---|---|---|
| Very High | Mumbai, Delhi | ₹15,000–25,000 |
| High | Bengaluru, Gurugram, Hyderabad | ₹9,800–13,000 |
| Medium | Kochi, Chennai, Ahmedabad | ₹5,600–7,800 |
| Low | Tier 2 cities | ₹3,000–5,500 |
| Very Low | NE states, UTs | ₹1,400–2,200 |

---

## 3. Missing Datasets

| Dataset | Required For | Limitation Created | Recommended Proxy |
|---|---|---|---|
| Solar irradiance / GHI data | Solar suitability scoring, solar savings estimate | Cannot estimate solar contribution or run solar ROI | Use state-level DNI averages from NREL/MNRE public data — label as state-level proxy |
| District/state administrative boundaries (GeoJSON) | Geographic drill-down, map polygon rendering | Cannot show state/district choropleth, only point markers | Use Natural Earth India boundaries (open license) |
| RTO-to-district mapping | Joining VAHAN registrations to districts | RTO data cannot be aggregated to standard district level | Derive from RTO master city names + geocoding; document unresolved rate |
| Road accessibility / traffic volume | Accessibility score factor | Cannot compute road corridor importance | Proxy: use presence of National/State Highway near coordinates |
| Electricity tariff by state/district | Grid energy cost in financial model | Cannot calculate accurate energy costs | Use state-average commercial tariffs (publicly available from SERC) |
| Historical EV registrations (pre-2024) | YoY growth trend | Only 33 months of data — no multi-year trend | Flag as "Limited trend data (2024–2026 only)" |
| Actual charger utilization rates | Financial projections | Cannot validate utilization assumption | Use documented assumption with clear caveat |
| Land rental/lease rates | Financial model (lease option) | Only purchase prices available | Show lease option as "data unavailable" |
| Population density by district | Demand normalization | Cannot normalize EV registrations by population | Use Census 2011 district-level data (public domain) |

---

## 4. Join Strategy and Key Issues

### VAHAN ↔ Charging Stations
- **Join key:** State name (after normalization)
- **Unmatched rate estimated:** ~15% due to state name variants
- **Resolution:** Create a `STATE_NAME_NORMALIZER` mapping dict

### VAHAN ↔ Land Cost
- **Join key:** City name extracted from RTO name
- **Estimated match rate:** <20% (only 51 cities, RTO names use city names but not standardized)
- **Resolution:** Fuzzy match on RTO city name → land cost city; expose unmatched rate

### Charging Stations → Geographic Drill-Down
- **Lat/Lon available** — enables point-in-polygon assignment to districts
- Requires district boundary GeoJSON (not currently available)
- Without boundaries: can only aggregate by district column (string match, inconsistent)

---

## 5. Data Quality Score by Factor

| Factor | Data Available | Quality | Notes |
|---|---|---|---|
| EV Demand (volume) | ✅ VAHAN monthly | **Good** | 37K rows, no nulls, no duplicates |
| EV Growth Trend | ⚠️ Limited | **Poor** | Only 33 months, no pre-2024 baseline |
| Charging Infrastructure Gap | ✅ Station file | **Fair** | 21% duplicates, state-name issue |
| Competition Density | ✅ Station lat/lon | **Fair** | Needs dedup + boundary join |
| Road Accessibility | ❌ Missing | **Unavailable** | No dataset |
| Solar Suitability | ❌ Missing | **Unavailable** | No dataset |
| Land Cost | ⚠️ Partial | **Poor** | 51 cities, purchase only, no lease |
| Financial Feasibility | ⚠️ Computed | **Assumption-based** | Derived from above inputs |

---

## 6. Recommended Implementation Sequence (Phases 2+)

### Phase 2 — Data Cleaning and Geography Joins
1. **Deduplicate charging stations** (drop 8,427 duplicates, flag invalid coordinates)
2. **Normalize state names** across all datasets → common lookup table
3. **Parse `Month` column** to `datetime` for time-series aggregation
4. **Extract city from RTO Name** using regex on the scraper's naming format
5. **Fuzzy-match RTO cities → land cost cities** → document unresolved %
6. **Download India district boundaries** (Natural Earth / datameet.org) for polygon joins
7. **Generate RTO centroid coordinates** by geocoding city names from RTO master

### Phase 3 — Scoring Engine
1. Build state-level opportunity indicators from cleaned data
2. Implement 7-factor weighted scoring with configurable weights
3. Handle missing factors with explicit "unavailable" status (never impute as 0)
4. Unit tests: normalization bounds, weight sums to 1, objective re-ranking

### Phase 4 — Financial Engine
1. Implement budget-aware station configuration generator
2. Land cost calculation from matched dataset (purchase only; lease=unavailable)
3. Document all assumptions in config file
4. Guard against division-by-zero and negative cash flow cases

### Phase 5 — Frontend Wiring
1. Replace `mockOpportunities` in service layer with pipeline output
2. Wire filters and map markers to real state/district indicators
3. Add data coverage / freshness panel

### Phase 6 — PDF Report
1. Implement server-side PDF generation (Python + reportlab or weasyprint)
2. Connect to same data pipeline outputs as UI

---

## 7. Data Dictionary

### VAHAN `RTO Monthly Data`
| Field | Type | Range/Values | Source | Status |
|---|---|---|---|---|
| `State` | string | 33 state names | VAHAN API | Observed |
| `State Code` | string | 2-char (AN–WB) | VAHAN API | Observed |
| `RTO Name` | string | City + code | VAHAN API | Observed |
| `RTO Code` | int | 1–905 | VAHAN API | Observed |
| `Month` | string YYYY-MM | 2024-02 – 2026-10 | VAHAN API | Observed |
| `Registrations` | int | 0–6,092 | VAHAN API | Observed |
| `Status` | string | `"SUCCESS"` | Scraper flag | Derived |

### Charging Stations (after dedup)
| Field | Type | Notes | Status |
|---|---|---|---|
| `CPO Name` | string | Charging Point Operator | Observed |
| `Govt/Private` | string | Ownership | Observed |
| `State` | string | Needs normalization | Observed (dirty) |
| `District` | string | 1,288 unique | Observed |
| `Latitude` / `Longitude` | float | One invalid lon=21.27 | Observed |
| `Charger Rating` | float | kW | Observed |
| `No. of Connector` | int | 1–3 | Observed |

### Land Cost
| Field | Type | Notes | Status |
|---|---|---|---|
| `City` | string | 51 cities | Observed |
| `State` | string | Non-standard names | Observed (dirty) |
| `Avg Land Price (rupees_per_sqft)` | int | ₹1,400–₹25,000 | Proxy (source unknown) |

### Derived/Assumed (to be created in Phase 2+)
| Field | Derivation Method | Status |
|---|---|---|
| `ev_demand_index` | Normalized monthly EV registrations per state/RTO | Derived |
| `ev_growth_rate` | MoM % change; limited to available 33 months | Derived (limited) |
| `charging_gap_index` | EVs per charger (demand/supply ratio) | Derived |
| `competition_index` | Charger density within ~10km radius | Derived |
| `solar_suitability` | State-level DNI proxy | Proxy (missing data) |
| `land_cost_estimate` | Matched from 51-city dataset or state average fallback | Proxy (partial) |
| `opportunity_score` | Weighted composite 0–100 | Derived |

---

## 8. Raw File Preservation Confirmation

| File | Modified | Checksum Verified |
|---|---|---|
| `datasets/India_RTO_Monthly_EV_Registrations.xlsx` | ❌ No changes | ✅ |
| `datasets/India_EV_charge_station.xlsx` | ❌ No changes | ✅ |
| `datasets/India_City_Land_Costs_Only.csv` | ❌ No changes | ✅ |

All processed outputs will be written to `datasets/processed/` (to be created in Phase 2).

---

*End of Phase 1 Data Audit*
