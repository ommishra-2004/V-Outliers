# Antigravity Build Instructions — EV ChargePoint Intelligence (Investor Workspace)

## 0. Your role and working rules

Act as a senior product designer and frontend engineer. Build the **investor-facing workspace** for an EV charging station location-intelligence platform in India.

The public landing/home page is a separate page and is **not** part of this task. I will upload a screenshot/photo of the existing landing page to Antigravity. Treat that image as the primary design reference.

### Non-negotiable rules
1. **Inspect the existing repository before changing anything.** Identify the framework, routing, styling system, installed dependencies, reusable components, and current page structure.
2. Reuse the project's existing stack(React) and conventions wherever practical. Do not rewrite or scaffold a new project if one already exists.
3. Match the uploaded landing-page reference closely: colors, typography, spacing, visual tone, border radius, shadows, buttons, icon style, and density. Extend its design language; do not create an unrelated theme.
4. Build a polished, responsive, working interface—not a static screenshot or a collection of disconnected mockups.
5. Use realistic, centralized mock data now. **Do not wait for the backend.** Do not scatter fake values across UI components.
6. Keep data access behind a small service/repository layer so mock data can later be replaced with FastAPI calls without rewriting components.
7. All important controls must work. Do not include decorative filters, tabs, dropdowns, map controls, or buttons that do nothing.
8. Do not invent real-world claims. Clearly mark illustrative data and projections as **Demo data / Illustrative estimate** wherever appropriate.
9. Do not implement the public landing page, authentication flows, individual/home EV-owner experience, or unrelated features.
10. Do not stop after presenting a plan. Implement the frontend in the repository, run the available checks, and summarize what was built and what remains.

---

## 1. Product concept

**Working product name:** EV ChargePoint Intelligence

**Purpose:** Help investors discover promising locations for EV charging infrastructure in India by combining EV demand, EV growth, charging-infrastructure gaps, existing competition, road access, solar potential, electricity economics, and financial projections.

The system—not the investor—discovers promising locations. The initial experience must open on a map of India with system-generated opportunity hotspots. Location filters refine the results; they must not force a location choice before recommendations are shown.

### Primary user question
“Where should I consider investing in an EV charging station, why is that location promising, and what might the economics look like?”

### Product principles
- Map-first, discovery-first.
- Evidence-led, not decoration-led.
- Explainable scores, not a mysterious AI score.
- Business and investment context alongside geography.
- Fast exploration without full-page reloads.
- Honest distinction between measured data, proxies, assumptions, and estimates.
- Useful on desktop first, still responsive on tablet and mobile.

---

## 2. First inspect the uploaded visual reference

Before implementation, inspect the landing-page screenshot I provide.

Extract and reuse:
- Primary and secondary colors.
- Background/surface colors.
- Heading and body typography.
- Font weights and type scale.
- Button shape, fill, border, and hover behavior.
- Card styles, outlines, shadows, and corner radii.
- Spacing rhythm and page gutters.
- Icon style.
- Illustration/map treatment, if present.
- Overall mood (e.g. premium, editorial, minimal, futuristic, technical).

Create or extend design tokens/CSS variables to keep the investor workspace consistent with the landing page. If the screenshot is incomplete or a detail is ambiguous, make a restrained, consistent choice rather than inventing a new visual identity.

The investor workspace can be denser than the landing page because it is a data product, but it must clearly belong to the same product.

---

## 3. Core page layout

Build a dedicated investor workspace route/page, using the existing router if one exists. If no routing exists, add the smallest sensible routing setup without disturbing the existing landing page.

### A. Application header
Include:
- Product logo/name consistent with the reference.
- A clear workspace label such as “Investor Intelligence”.
- Navigation for the investor workspace's major sections, for example: `Opportunity Map`, `Investment Analysis`, and `Saved Locations` if supported.
- A profile/avatar placeholder only if it fits the current project; do not build authentication.
- A visible indication that this is demo data during development.

Do not duplicate the landing-page hero/navigation wholesale. This is an application workspace, not another marketing page.

### B. Page heading and compact overview
Suggested copy:
- Eyebrow: `INVESTOR INTELLIGENCE`
- Heading: `Discover India's next EV charging opportunities`
- Supporting text: `Explore demand, charging gaps, site fundamentals and indicative investment economics.`
- Data status: `Illustrative demo data · Not an investment guarantee`

Show compact summary metrics above or beside the map:
- Opportunity zones identified.
- High-opportunity zones.
- Estimated EV demand / registered EVs covered.
- Charging infrastructure gap indicator.
- Optional estimated aggregate investment potential only if explicitly labelled illustrative.

Use realistic-looking sample values, but never imply they are verified current national statistics. Add a small `Demo data` label or tooltip.

### C. Main exploration workspace
On desktop, use a strong map-first composition:
- Main map occupies the majority of the width.
- A compact filter panel may sit above/left of the map or in a collapsible sidebar.
- A right-side contextual detail panel appears when a hotspot is selected.
- Avoid a giant dashboard of cards that pushes the map below the fold.
- Keep important map controls and the legend visible without obscuring the map.
- On mobile, stack the map and details vertically; use a drawer/sheet for filters and selected-location details.

Suggested layout hierarchy:
1. Header
2. Page title + status
3. Summary metric row
4. Filter toolbar / expandable filter panel
5. Large interactive map + map legend + selected-zone panel
6. Selected-location analysis sections
7. Optional ranked opportunity list/table synchronized with the map

---

## 4. Map requirements — this is the centerpiece

Use a real interactive map library if the repository and dependencies permit it. Prefer **React Leaflet + Leaflet** for a practical initial implementation, or reuse an existing map library already installed. Do not create a map by placing random dots on a generic background.

### Map content
- Show India and relevant administrative/geographic context.
- Render opportunity zones as markers, circles, clusters, or heat-style overlays.
- Use clear visual encoding for opportunity levels, consistent with the landing-page palette.
- Distinguish **opportunity score** from **charging gap**. A high gap does not automatically mean a high investment opportunity.
- Add a legend explaining each marker/color.
- Add zoom controls and a `Reset to India` / `Reset view` action.
- Add layer toggles if feasible:
  - Opportunity score
  - Charging gap
  - Existing charging stations
  - Solar potential
- Use map popups/tooltips with location name, score, opportunity band, EV demand/growth indicator, and a `View details` action.
- Selecting a hotspot updates the contextual panel and the ranked list.
- Changing filters updates markers, counts, and the ranked list.
- Selecting a state/district should update the map extent and breadcrumb.
- Include a visible map attribution when required by the map provider.

### Geography/drill-down model
Support a progressive exploration flow:
`India → State → District/City → Opportunity Zone → Candidate Site`

For the MVP, state and district/zone drill-down is enough. Do not pretend that the mock dataset represents validated exact candidate parcels. Candidate sites may be represented as illustrative site-level examples only, with explicit labels.

Include:
- Breadcrumb, e.g. `India / Maharashtra / Pune / Pune–Mumbai Corridor`
- Back/up-one-level control.
- Clicking a state or a zone should change the current geographic scope.
- A `Back to India` or equivalent control.
- Keep the selected location synchronized between map, list, and detail panel.

### Map data quality
Use plausible coordinates in India for the mock locations. The mock data should be geographically coherent. Do not invent exact station-level coverage claims. The initial data can represent illustrative opportunity zones rather than official rankings.

---

## 5. Filters — functional, not decorative

Provide a well-designed filter toolbar or expandable filter drawer.

### Required filters
1. **Investment budget**
   - Example options: `Under ₹25L`, `₹25L–₹50L`, `₹50L–₹1Cr`, `₹1Cr+`, `Any budget`
   - Clearly state that these are illustrative ranges and may refer to assumed project investment, not land purchase price unless the financial model explicitly defines it.

2. **Charger type**
   - AC
   - DC fast
   - Mixed
   - Any

3. **Target EV segment**
   - 2-wheelers
   - 3-wheelers
   - 4-wheelers
   - Fleet / commercial
   - Mixed / any

4. **Solar preference**
   - Preferred
   - Required
   - No preference

5. **Investment objective**
   - Maximize projected ROI
   - Shorter payback
   - Higher projected revenue
   - Solar-integrated opportunity
   - Balanced opportunity

6. **Opportunity level**
   - High
   - Medium
   - All

### Filter behavior
- Every filter must update visible map markers, ranked results, counts, and selected results.
- Include `Apply` only if using a deliberate staged/drawer pattern; otherwise filters can update immediately.
- Provide `Reset filters`.
- Display active filters as removable chips.
- Show a helpful empty state when no locations match.
- Do not make state/city selection a required first step. Geographic filters can be optional refinements after the map is visible.
- Do not claim that changing an objective retrains a model. In demo mode, it should re-rank sample opportunities using clearly defined mock fields/logic.

---

## 6. Selected location detail panel

When a hotspot is selected, show a focused detail panel rather than navigating away immediately.

Include:
- Location / zone name.
- State and geographic level.
- Opportunity score from 0–100.
- Opportunity band, e.g. `High opportunity`.
- Small `Illustrative score` label.
- A short, plain-language summary of why the zone appears promising.
- EV demand/growth indicators.
- Existing charging supply and gap indicators.
- Competition indicator.
- Road access indicator.
- Solar potential indicator.
- Indicative project configuration, where available.
- Main actions: `Explore this area`, `View investment analysis`, `Compare` or `Save location` if implemented.

Example copy (illustrative):
“Strong demand signals and a relatively low charger supply score make this zone worth further investigation. Validate site access, local tariffs, land costs and actual charger utilization before investing.”

Never show a score without a way to inspect what contributed to it.

---

## 7. “Why here?” — model explainability

This is a core product feature. Make it visually prominent and useful, not a small generic AI badge.

Include a `Why here?` button or expandable section within the selected-location panel.

### Explainability content
1. **Overall score**
   - Display the selected location's illustrative opportunity score.
   - Describe the score as a weighted decision-support score, not proof of future profitability.

2. **Factor contribution / breakdown**
   Show a clean horizontal bar chart or segmented breakdown for:
   - EV demand
   - EV growth
   - Charging gap
   - Road access
   - Solar potential
   - Electricity economics
   - Competition / existing supply

   Clearly distinguish:
   - Positive contributors
   - Weakening factors / risks
   - Missing or low-confidence data

3. **Plain-language reasons**
   Examples:
   - “Demand indicator is relatively strong compared with the other demo zones.”
   - “Charging supply appears limited relative to the illustrative demand estimate.”
   - “Solar potential may improve operating economics, subject to usable area and installation costs.”
   - “Existing nearby chargers could create competition.”
   - “Land costs and real charger utilization are not yet verified.”

4. **Evidence and confidence**
   For every factor, allow a user to see its value, source category, geographic granularity, and whether it is:
   - `Observed / sourced`
   - `Derived`
   - `Proxy`
   - `Assumption`
   - `Unavailable`

   In demo mode, label the sample evidence as `Illustrative demo value`.

5. **Risk / validation checklist**
   Show what an investor should validate before committing:
   - Actual traffic and site access
   - Land ownership / lease and local cost
   - Utility connection and tariff
   - Charger utilization and nearby competition
   - Permits and installation constraints
   - Solar usable area and economics

### Explainability integrity
- Do not use fake SHAP explanations or claim to have trained an ML model if none exists.
- For this MVP, implement transparent weighted-score explanations from the mock feature values.
- If displaying weights, label them `Initial illustrative weights` and make it clear that they require validation.
- If a factor is missing, show `Not available` rather than silently assigning a confident value.
- Avoid wording such as “AI guarantees this is the best location.”

---

## 8. Investment analysis

Create a detailed analysis section or tab for the selected zone. It should feel like an investor's decision-support tool, not a generic finance dashboard.

### Show these metrics
- Indicative charger configuration (AC/DC and number of connectors).
- Estimated daily charging sessions or energy sold, if represented by mock assumptions.
- Estimated annual energy sales.
- Estimated annual revenue.
- Estimated CAPEX.
- Estimated annual OPEX.
- Estimated solar contribution / savings, if relevant.
- Indicative annual operating cash flow or operating profit (define which one).
- Simple payback period.
- ROI over a clearly stated time horizon.

### Financial assumptions
- Add a visible `Assumptions` accordion/drawer.
- Include editable mock assumptions if feasible: charger count/type, utilization, average kWh/session, selling price, electricity cost, installation cost, rent/lease, maintenance, solar capacity/cost.
- Updating assumptions should recalculate the illustrative financial outputs on the frontend.
- Clearly state whether taxes, financing, depreciation, demand charges, land acquisition and residual value are excluded.
- Do not present sample numbers as market facts or investment advice.

### Basic calculation conventions
Use consistent definitions:
- `Annual energy sold = daily energy sold × operating days`
- `Annual revenue = annual energy sold × selling price per kWh`
- `Annual energy cost = grid energy purchased × electricity cost per kWh`
- `Annual operating cash flow = annual revenue − operating costs`
- `Simple payback = initial investment ÷ positive annual net cash benefit`
- `ROI over horizon = (cumulative net benefit − initial investment) ÷ initial investment × 100`, with the time horizon stated.

Guard against division by zero, negative or missing values. If the annual net benefit is zero or negative, show `No positive payback under current assumptions` rather than an invalid number.

---

## 9. Ranked opportunity list and comparison

Add a compact, synchronized list/table of the highest-ranked opportunities, either beside/below the map or as a switchable view.

Suggested columns:
- Rank
- Location
- Opportunity score
- Opportunity band
- EV demand indicator
- Charging gap indicator
- Solar potential
- Indicative payback (if available)
- Action: `View`

Requirements:
- Sort by selected investment objective.
- Clicking a row selects the matching map zone and opens its detail panel.
- Allow users to compare up to three locations in a comparison view or modal.
- Comparison should show strengths, risks, score factors and illustrative financial metrics side by side.
- Include loading, empty and error states even when data is mocked.

---

## 10. Static mock data — structure and requirements

Use a centralized mock data layer. Put data in a file such as:
- `src/data/mock/opportunities.ts` or `.js`
- `src/data/mock/financialAssumptions.ts`
- `src/services/opportunityService.ts`

Adapt paths to the existing project conventions.

### Create at least 10 coherent illustrative zones
Include a mix of regions, for example:
- Pune–Mumbai corridor, Maharashtra
- Pune urban zone, Maharashtra
- Nagpur, Maharashtra
- Bengaluru outskirts, Karnataka
- Mysuru corridor, Karnataka
- Ahmedabad outskirts, Gujarat
- Surat, Gujarat
- Chennai outskirts, Tamil Nadu
- Coimbatore, Tamil Nadu
- Hyderabad outskirts, Telangana

These are demo examples, **not claims that these are India's objectively best investment locations**. Scores and financial figures must be marked illustrative. Coordinates should place the markers in the appropriate broad geographic area.

### Suggested TypeScript shape
Adapt to the actual codebase and use strong types if TypeScript is already in use.

```ts
type DataStatus = "observed" | "derived" | "proxy" | "assumption" | "unavailable";

type OpportunityFactor = {
  key: string;
  label: string;
  value: number | null;        // normalized 0–100 when available
  weight: number | null;       // initial illustrative weight
  contribution: number | null; // contribution to the illustrative score
  status: DataStatus;
  explanation: string;
  sourceLabel?: string;
};

type Opportunity = {
  id: string;
  name: string;
  state: string;
  districtOrCity: string;
  parentId?: string;
  level: "state" | "district" | "zone" | "candidate-site";
  latitude: number;
  longitude: number;
  opportunityScore: number;
  opportunityBand: "high" | "medium" | "low";
  evDemandIndex: number;
  evGrowthIndex: number;
  chargingGapIndex: number;
  existingChargerCountEstimate: number;
  competitionIndex: number;
  roadAccessIndex: number;
  solarPotentialIndex: number;
  electricityCostIndex: number | null;
  targetSegments: string[];
  chargerTypes: string[];
  estimatedBudgetBand: string;
  factors: OpportunityFactor[];
  whyHereSummary: string;
  risks: string[];
  dataStatus: "illustrative-demo";
};
```

Include fields for financial assumptions and projected outputs as appropriate. Ensure all displayed figures derive from the centralized data or calculation functions. Do not create contradictory values in different components.

### Mock service contract
Create an abstraction such as:
- `getOpportunities(filters)`
- `getOpportunityById(id)`
- `getOpportunityFactors(id)`
- `getInvestmentEstimate(id, assumptions)`
- `getOpportunityComparison(ids)`

For now these can use local mock data. Keep components unaware of whether the data comes from a mock file or an HTTP API.

---

## 11. Future FastAPI integration readiness

The real backend will eventually provide data through FastAPI. Do not implement a real backend as part of this frontend-only task, but make the frontend easy to connect later.

- Centralize API/data access in one service layer.
- Define request/response types for opportunity data, filters, factors, and financial estimates.
- Use an environment variable for the API base URL, such as `VITE_API_BASE_URL` if this is a Vite project.
- Add a clear mock-data mode or feature flag.
- Do not place API URLs throughout UI components.
- Do not commit secrets.
- Avoid unnecessary global state libraries unless the project already uses one or the complexity requires it.
- If using React Query/TanStack Query is already established, follow the existing pattern.

Possible future endpoint mapping:
- `GET /api/opportunities`
- `GET /api/opportunities/{id}`
- `GET /api/opportunities/{id}/explanation`
- `POST /api/investment/estimate`
- `POST /api/opportunities/compare`
- `GET /api/filters`

The UI should work entirely with mock data until the backend is available.

---

## 12. Visual design quality bar

Aim for a high-quality, credible climate-tech / infrastructure-investment analytics product.

- Prioritize a clear information hierarchy.
- Keep the map visually dominant.
- Use restrained animation only where it improves orientation or feedback.
- Use consistent spacing and typography.
- Avoid excessive gradients, glassmorphism, neon effects, glowing cards, and generic “AI” decoration unless the landing-page reference uses them.
- Avoid excessive KPI cards, oversized headings, and needless whitespace in the data workspace.
- Use clear contrast and accessible text sizes.
- Use icons consistently; prefer the icon library already installed.
- Include skeleton/loading, no-results, error, and success feedback states where relevant.
- Use accessible labels, keyboard-operable controls, and visible focus states.
- Add responsive breakpoints and test narrow screens.
- Ensure the map's attribution and controls are legible.
- Add hover and selected states for markers/list rows.
- Make selected states and filter chips visually obvious.

The goal is a cohesive, production-minded frontend—not just a visually impressive concept screen.

---

## 13. Suggested implementation order

Work in this order and keep the application runnable after each stage.

### Phase 1 — Foundation
- Inspect repository and reference screenshot.
- Identify existing framework and styles.
- Set up/extend design tokens.
- Add investor route/page without breaking landing page.
- Build shared shell/header and responsive layout.

### Phase 2 — Discovery experience
- Create typed mock data.
- Implement the map.
- Add markers, legend, tooltips and selection.
- Implement geographic breadcrumb/drill-down.
- Add synchronized opportunity list.

### Phase 3 — Filters and ranking
- Implement all required filters.
- Implement filter chips and reset.
- Re-rank by investment objective using transparent demo logic.
- Add empty states.

### Phase 4 — Explainability
- Build the `Why here?` section.
- Show factor values, weights, contributions, evidence status, risks and validation checklist.
- Clearly label initial weights and sample data as illustrative.

### Phase 5 — Financial analysis
- Add assumptions editor.
- Implement calculation functions with validation.
- Display financial KPIs and charts.
- Support comparison of up to three locations.

### Phase 6 — Quality and completion
- Run lint, type checks, tests and production build if scripts exist.
- Fix runtime and console errors.
- Verify all controls.
- Verify mobile/tablet/desktop layouts.
- Summarize files created/changed, how to run locally, mock-data assumptions, and next steps for FastAPI integration.

---

## 14. Acceptance criteria

Do not consider the task complete until:

- [ ] The existing landing page is preserved.
- [ ] The investor page inherits the uploaded landing-page theme.
- [ ] The initial view opens on India-wide opportunity discovery, not a location selection form.
- [ ] At least 10 coherent illustrative opportunity zones appear on the map.
- [ ] The map supports selecting zones and resetting/zooming.
- [ ] Breadcrumb/drill-down navigation works.
- [ ] Filters change map markers, result counts and ranked list.
- [ ] Reset filters and remove-filter-chip actions work.
- [ ] Selecting a location synchronizes map, list and detail panel.
- [ ] The `Why here?` explanation is location-specific and uses factor data.
- [ ] Data status and score assumptions are visible.
- [ ] Financial assumptions can be changed and outputs recalculate.
- [ ] Invalid/negative/zero cases are handled safely.
- [ ] Comparing locations works if included in the UI.
- [ ] All important buttons and controls perform their advertised actions.
- [ ] Responsive layouts work on desktop, tablet and mobile.
- [ ] Loading, empty, and error states exist where relevant.
- [ ] Mock data and service access are centralized and replaceable.
- [ ] No sample score or financial projection is falsely presented as verified real-world data.
- [ ] The application passes the available build/type/lint checks.

---

## 15. Final response expected from Antigravity

After implementing, report:
1. The pages/components created or modified.
2. The route to open the investor workspace.
3. The mock-data files and service abstraction.
4. The map library used and any attribution requirement.
5. Which controls/features are functional.
6. Commands to run the app locally.
7. Build/test results and any remaining issues.
8. The specific next steps to connect the UI to FastAPI.

**Start by inspecting the repository and the uploaded landing-page screenshot. Then implement the investor workspace in the existing project.**
