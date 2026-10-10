# Antigravity Implementation Brief — Data-Driven EV Charging Investment Intelligence

## Goal
Update the EXISTING EV ChargePoint Intelligence project into a real-data-driven investor decision-support application. Preserve the existing landing page and working map/drill-down. Do not scaffold a replacement app. Inspect the repository and datasets first, then implement in small, testable phases.

## Non-negotiable workflow
1. Inspect the repository: framework, routes, styling, map library, existing components, current API/data layer, tests, and run/build commands.
2. Inspect the entire available project data folder. List every file, type, size, sheet/table, row count, column names, date range, geographic keys, missingness, duplicates, and sample rows. Do not assume filenames or schemas.
3. Produce a short `DATA_AUDIT.md` with findings, join keys, limitations, and recommended transformations. Do not overwrite raw data.
4. Implement data ingestion/cleaning and the scoring/financial engine before wiring new UI values. Keep raw, cleaned, derived, and assumed data clearly distinguished.
5. Preserve the existing landing page, current routing, and current visual language. Reuse the existing stack and components wherever practical.
6. Never fabricate data to fill gaps. If a required dataset is missing, expose a clearly labelled proxy/unavailable status and record it in `DATA_AUDIT.md`.
7. Do not stop after a plan. Implement, run available checks, fix errors, and report what remains.

## Product behavior
The app must discover promising regions automatically. The initial view is an India-wide map showing model-calculated opportunity zones. Do not ask users to select a state or city before seeing results.

Geographic drill-down:
`India → State → District/City → Opportunity Zone → Candidate Site`

Keep the current drill-down if it already works. Selecting a zone on the map, a result row, or the ranked list must synchronize the selection and update the right-hand analysis panel. Candidate sites must not be represented as verified parcels unless actual parcel data exists.

## Main layout
- Existing product header and visual design.
- Map-first investor workspace.
- Left panel for three primary controls only:
  1. Location: All India by default; optional state/district/region selector.
  2. Investment objective: Balanced / Maximize ROI / Shorter payback.
  3. Budget band: predefined ranges matching the actual cost model; include Any/Not set where appropriate.
- Map legend for opportunity level and a separate charging-gap layer/legend.
- Right detail panel for the selected zone.
- Optional compact ranked opportunity list synchronized with map and filters.
- Avoid forcing users to enter technical assumptions before seeing recommendations. Advanced assumptions may be placed behind an optional “Advanced assumptions” section.
- Ensure responsive desktop/tablet/mobile layouts.

## Right-hand selected-zone panel
Display, in this order:
1. Region name and geographic breadcrumb.
2. Opportunity level: High / Medium / Low, with threshold definitions documented in code/config.
3. Opportunity score out of 100.
4. Concise “Why here?” summary generated from actual factor values and data availability; no generic or unsupported claims.
5. Score breakdown showing factor name, normalized score, weight, weighted contribution, source/status, and a plain-language explanation.
6. Investment snapshot: feasible station configuration, estimated land requirement, estimated land cost or lease cost if available, charger mix, solar option, total estimated CAPEX, annual net cash benefit, ROI over a clearly stated horizon, and simple payback.
7. Risks / assumptions to validate before committing, such as local traffic, land title/zoning, grid connection, actual charger utilization, nearby competition, local tariffs, and solar site suitability. Distinguish data-derived risk flags from generic due-diligence checks.
8. Data coverage and freshness: registration date range, source file/dataset, latest period, missing indicators, and proxy/assumption warnings.
9. Button: “Export Full Report (PDF)”. It must generate and download a real PDF, not print the page or create a fake button.

## Dataset audit and data pipeline
Use the files actually present in the project folder. Expected candidate inputs may include:
- VAHAN monthly EV registrations by state/RTO/date.
- RTO master data.
- Regional land-cost data.
- Government solar potential/irradiation or state solar data.
- Existing charging station locations/counts.
- Administrative boundaries, population, roads/accessibility, electricity tariffs, or other regional indicators.

These are possibilities, not assumptions: inspect what exists.

For each dataset, record:
- file and source, download date if known, row count, columns, time coverage, spatial resolution, unique keys;
- duplicate records, nulls, invalid counts, and incomplete coverage;
- join strategy and unmatched-key rate;
- observed vs derived vs proxy vs assumed values.

Never overwrite the original scraped files. Create repeatable ingestion/cleaning scripts and save processed outputs separately. Add validation checks and log rejected/unmatched rows.

### VAHAN registrations
- Parse month strings such as `2026-October` into proper year-month dates.
- Ensure registration counts are numeric and non-negative.
- Check for duplicate state/RTO/month combinations before aggregating.
- Preserve zero, missing, and failed-to-fetch as different states; missing must not be silently converted to zero.
- Aggregate monthly registrations to the district/state level only after documenting RTO-to-geography mapping and unresolved RTOs.
- Derive recent EV volume, rolling trends, year-over-year growth where enough history exists, and data completeness. Guard against division by zero and incomplete current months.
- VAHAN registrations are a demand proxy, not direct measurements of site visits, charging sessions, or utilization.

### Geography
- Prefer official geographic identifiers and boundary files where available.
- Create a documented mapping from state/RTO to district/region and coordinates.
- Do not place points at arbitrary coordinates or imply exact parcel boundaries when only RTO-level data exists.
- When geographic resolution is coarse, display a state/district/region opportunity zone and label its precision honestly.

### Solar
- Inspect whether the supplied government data represents installed capacity, technical potential, irradiance, or actual generation; these are not interchangeable.
- Prefer location-level irradiation/suitability where available. If only state-level data exists, treat it as a state-level proxy, not a precise site estimate.
- Estimate solar contribution only from documented assumptions about usable area, system size, performance ratio, and generation; otherwise show suitability qualitatively and mark financial savings unavailable.

### Land cost
- Inspect whether costs are purchase price, rent/lease, industrial land, commercial land, or another basis, and normalize units and time periods.
- Estimate required land area from a station configuration/charger layout model. Do not infer land area from budget alone without a documented configuration rule.
- For purchase: estimated land cost = required land area × regional purchase cost per area unit.
- For lease: estimate annual/monthly lease expense separately; do not add a purchase cost and lease expense together.
- If the land-cost geography does not match the opportunity geography, expose the matching method and uncertainty.

## Opportunity scoring
Build a transparent, deterministic scoring engine first. Do not claim a trained ML model or SHAP explanations unless a real model has actually been trained and validated.

Potential factors, only where data exists:
- EV demand / registrations (level)
- EV growth trend
- Charging infrastructure gap / unmet need proxy
- Existing competition and nearby charger density
- Road accessibility / corridor importance
- Solar suitability
- Financial feasibility for the selected budget
- Data quality/confidence indicator

Important distinctions:
- A high charging gap alone does not prove a good investment.
- Opportunity score and charging-gap score must be separate.
- Missing data must not automatically produce a bad score or be treated as zero. Apply a documented missing-data policy and show coverage/confidence.
- Use normalized 0–100 factor scores and documented weights. Weighted contribution = normalized factor score × factor weight; total score should be correctly normalized to 0–100.
- Configure objective-specific weights for Balanced, Maximize ROI, and Shorter payback. Keep the underlying observed data fixed; only objective weights/ranking and feasible station configuration should change.
- Apply objective-specific weights to available factors, then renormalize the weights over available factors. Display this behavior in the methodology notes.
- Define High/Medium/Low thresholds in one configuration file and test them.
- Include unit tests for normalization, missing factors, weights summing to 1, score bounds, and objective changes.
- If only mock/partial data supports the score, label it “Prototype score” and show coverage limitations.

Suggested starting factor families (adjust after data audit): demand 25%, growth 15%, charging gap 20%, competition 10%, accessibility 10%, solar suitability 5%, financial feasibility 15%. These are starting hypotheses only, not validated weights. Tune/renormalize based on the actual data and make the weights configurable. Objective profiles should have their own explicit weight configurations.

## Investment and station-sizing engine
The budget band should influence the feasible station configuration. Do not ask the investor to specify charger count, exact land size, panel count, or every cost upfront.

Implement a transparent scenario generator:
1. Convert selected budget band into a budget constraint/range; if a range is used, state whether the calculation uses its lower bound, midpoint, or upper bound.
2. Enumerate a small set of feasible charger configurations (e.g. compact / standard / larger mixed setup) using documented assumptions for charger hardware, installation, civil works, transformer/grid connection, software, contingency, and solar if applicable.
3. Estimate required land area for each configuration using documented layout/parking/circulation assumptions.
4. Estimate land purchase or lease cost using the appropriate regional dataset and matching method.
5. Calculate total CAPEX and retain only configurations that fit the chosen budget under the stated budget interpretation.
6. Estimate charging demand/utilization conservatively from explicit assumptions; do not treat vehicle registrations as charging sessions without a conversion model and caveat.
7. Estimate annual energy sold, revenue, grid energy cost, solar generation/savings where supportable, operating costs, and annual net cash benefit.
8. Calculate ROI over a named time horizon and simple payback only when annual net cash benefit is positive.
9. If no feasible configuration fits, say so and explain which cost component causes the constraint. Do not fabricate an affordable option.

Minimum calculation definitions:
- Annual energy sold = average daily energy sold × operating days.
- Annual revenue = annual energy sold × assumed selling price per kWh.
- Annual grid energy cost = grid energy purchased × assumed electricity cost per kWh.
- Annual net cash benefit = revenue + validated savings − energy costs − operating costs.
- Simple payback = initial investment ÷ annual net cash benefit, only if annual net cash benefit > 0.
- ROI over horizon = (cumulative net benefit over stated horizon − initial investment) ÷ initial investment × 100, with cash-flow assumptions stated.

Show sensitivity/uncertainty for utilization, tariff, selling price, land cost, and CAPEX where feasible. All assumed inputs must be visible, editable only in Advanced assumptions, and included in the report. Avoid false precision.

## PDF report
Generate a genuine downloadable PDF using an appropriate server-side library or existing project capability. Follow existing backend architecture if present; otherwise add the smallest maintainable implementation.

Report sections:
1. Report title, generation date/time, selected location, selected objective and budget band.
2. Executive summary and opportunity score/band.
3. Map snapshot if feasible, with scale/legend and note of geographic precision.
4. Score breakdown: factors, values, weights, contributions, sources, and missing-data flags.
5. EV registration trend and period covered.
6. Charging gap and competition evidence.
7. Solar and land-cost analysis with source/geographic caveats.
8. Recommended feasible station configuration and itemized CAPEX.
9. Financial assumptions, annual estimates, ROI horizon, payback, and sensitivity/risk notes.
10. Risks and pre-investment validation checklist.
11. Data sources, data freshness, limitations, and methodology.

The PDF values must be computed from the same backend/service response as the UI. Do not create a separate set of hardcoded report values. Handle errors with clear UI feedback and do not claim download success if generation failed.

## Architecture
- Keep data access behind the existing service/repository layer.
- If the project already has a backend, extend it instead of creating a competing one.
- If FastAPI is already planned/used, define clear endpoints such as:
  - `GET /api/opportunities?scope=...&objective=...&budget_band=...`
  - `GET /api/opportunities/{id}`
  - `GET /api/opportunities/{id}/score-breakdown`
  - `POST /api/investment/estimate`
  - `POST /api/reports/investment-pdf`
  - `GET /api/metadata/data-quality`
- Keep raw data processing separate from request handlers. Cache precomputed geography-level indicators where appropriate.
- Never read large source files on every UI request if derived artifacts can be prepared once.
- Do not commit API keys/secrets. Add environment variables to an example env file only.
- If backend integration is not yet possible, build a working adapter with typed fixture data generated from the real data pipeline, and explicitly mark remaining mock/proxy fields. Do not replace real datasets with invented example values.

## Frontend interaction requirements
- Location defaults to All India and filters are optional.
- Objective changes ranking and score profile; explain the selected profile.
- Budget changes feasible configuration and budget feasibility, and may re-rank locations.
- Filters update map, counts, ranked list, and selected detail consistently.
- Provide clear empty/loading/error states and reset filters.
- Detail panel shows why the score was assigned, not just a number.
- Every button works; PDF export must be real.
- Preserve current design system and map drill-down.
- Avoid a cluttered form; keep advanced financial assumptions collapsed by default.

## Testing and acceptance criteria
- Data audit file exists and lists actual discovered files/schemas and known limitations.
- Raw data is unchanged.
- Pipeline can be run reproducibly and validates duplicates, dates, counts, and joins.
- The map initially displays data-derived opportunity zones across the available geography.
- Geography precision matches the actual data resolution.
- Location/objective/budget controls work and update all dependent views.
- Score breakdown adds up correctly and shows sources/statuses.
- Missing values never silently become zero.
- Budget-aware configuration and land-cost calculations are tested.
- Invalid financial inputs, negative/zero cash flow, and no-feasible-configuration cases are handled.
- PDF is generated from current selected data and downloads successfully.
- Existing landing page and drill-down remain intact.
- Run lint/typecheck/tests/build available in repository; fix failures introduced by this work.
- Report changed files, how to run, checks performed, data limitations, and exact next steps.

## Execution order
1. Repository and dataset audit.
2. Write `DATA_AUDIT.md` and data dictionary.
3. Build/validate data cleaning and geography joins.
4. Implement opportunity indicator + scoring engine and tests.
5. Implement budget-aware investment scenario calculations and tests.
6. Connect map and left controls to actual derived data.
7. Build selected-zone explanation and risks.
8. Implement PDF report generation.
9. Run checks and manually test full discovery-to-report workflow.

Start now by inspecting the existing repository and data folder. Do not ask me to choose a state or region first; the system must discover opportunities automatically from the available data.
