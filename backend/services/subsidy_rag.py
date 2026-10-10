import boto3
import json
import re
from typing import Optional, Tuple, List
from config import settings
from schemas.consumer import ChatMessage

# ==============================================================================
# AUTHORITATIVE SOLAR KNOWLEDGE BASE (PM SURYA GHAR & INDIAN SOLAR POLICIES)
# ==============================================================================

SOLAR_POLICY_CONTEXT = """
=== PM SURYA GHAR: MUFT BIJLI YOJANA (CENTRAL SCHEME) ===
- Scheme: PM Surya Ghar: Muft Bijli Yojana, launched by Govt of India (MNRE) with ₹75,021 Crore outlay.
- Target: 1 Crore Indian households with up to 300 units of free solar electricity per month.
- Official National Portal: https://pmsuryaghar.gov.in
- Central Financial Assistance (CFA / Subsidy Slabs):
  * Up to 2 kW capacity: ₹30,000 per kW (e.g., 1 kW = ₹30,000; 2 kW = ₹60,000).
  * Above 2 kW and up to 3 kW: ₹60,000 + ₹18,000 for the 3rd kW = ₹78,000 total.
  * Above 3 kW capacity: Maximum CFA capped at ₹78,000.
  * Group Housing Societies / Residential Welfare Associations (GHS/RWA): ₹18,000 per kW for common facilities (EV charging, lifts, water pumps) up to 500 kW.
  * Special Category States/UTs (North Eastern States, Himachal Pradesh, Uttarakhand, Jammu & Kashmir, Ladakh, Andaman & Nicobar, Lakshadweep): Additional 10% assistance.
- Disbursement Process: Direct Benefit Transfer (DBT) directly into beneficiary's Aadhaar-linked bank account within 30 days of DISCOM inspection and commissioning certificate generation.

=== MANDATORY COMPLIANCE: DCR & ALMM ===
- DCR (Domestic Content Requirement): MANDATORY to claim central subsidy. Solar panels must use both domestically manufactured solar cells AND solar modules made in India. Non-DCR panels are ineligible for CFA.
- ALMM (Approved List of Models and Manufacturers): Panels must be sourced from MNRE ALMM List-I (and List-II for cells). DISCOM checks module serial numbers during site verification.
- Empanelled Vendors: Installation MUST be executed by an MNRE / DISCOM empanelled vendor registered on the national portal.

=== FINANCING: SBI SURYA GHAR SOLAR LOAN ===
- Bank: State Bank of India (SBI) and partner nationalized banks (Canara, PNB, Union Bank).
- Loan Limit: Up to ₹2,00,000 (collateral-free for systems up to 3 kW).
- Interest Rate: Concessional ~5.75% to 7.00% p.a. for systems up to 3 kW; ~7.90% to 9.00% p.a. for above 3 kW.
- Margin / Down Payment: Only 10% of total project cost.
- Repayment Tenure: Up to 10 years (120 months) with up to 6 months moratorium.
- Processing Fee: Nil for PM Surya Ghar loans.
- Subsidy Prepayment: Central subsidy received via DBT can be directly credited to repay the loan principal with ZERO prepayment penalty.

=== STATE-SPECIFIC POLICIES & TOP-UP SUBSIDIES ===
- Uttar Pradesh (UPNEDA):
  * Additional State Subsidy: ₹15,000 per kW, capped at ₹30,000.
  * Total combined subsidy for 3 kW in UP: ₹78,000 (Central) + ₹30,000 (State) = ₹1,08,000!
  * Net metering facilitated by UPPCL (DVVNL, MVVNL, PVVNL, PuVVNL).
- Delhi (Delhi Solar Policy 2024):
  * State Capital Subsidy: ₹2,000 per kW (up to ₹10,000).
  * Generation Based Incentive (GBI): ₹3.00 per unit (kWh) generated for residential systems up to 3 kW for 5 years!
  * DISCOMs: BSES Rajdhani (BRPL), BSES Yamuna (BYPL), Tata Power DDL (TPDDL).
- Gujarat (GUVNL / Surya Gujarat):
  * High solar yield (~150 units/kW/month). GUVNL portal integration.
  * Net metering banking settlement with fast DISCOM meter clearance.
- Maharashtra (MSEDCL / Mahavitaran, Tata Power, Adani Electricity):
  * Net metering available up to 100% of sanctioned load.
  * High domestic tariffs (₹8 - ₹12/unit) provide rapid payback in 2.5 - 3.5 years.
- Karnataka (BESCOM, HESCOM, MESCOM, GESCOM, CESC):
  * Average yield ~144 units/kW/month. Net metering with annual settlement at KERC tariff.
- Rajasthan (JVVNL, AVVNL, JdVVNL):
  * India's highest solar yield (~165 units/kW/month). Net metering allowed up to 100% sanctioned load.
- Tamil Nadu (TANGEDCO):
  * Net feed-in mechanism via Solar Energy Portal. Surplus power credited at TNERC feed-in tariff.
- Kerala (KSEB / Soura Project):
  * Turnkey rooftop installations and net metering up to connected load.
- Haryana (DHBVN, UHBVN):
  * Additional targeted top-ups for Antyodaya and lower-income categories up to ₹50,000.

=== TECHNICAL SYSTEM SIZING & HARDWARE SPECS ===
- 1 kW Solar Rooftop System:
  * Generates: 4 to 5 units/day (approx 120 to 150 units/month, 1,450 to 1,800 units/year).
  * Space Required: 80 to 100 sq ft shadow-free rooftop area.
  * Typical Gross Cost: ₹50,000 - ₹60,000.
  * Subsidy: ₹30,000 -> Net Cost: ₹20,000 - ₹30,000.
- 2 kW Solar Rooftop System:
  * Generates: 8 to 10 units/day (approx 240 to 300 units/month).
  * Space Required: 160 to 200 sq ft.
  * Typical Gross Cost: ₹1,00,000 - ₹1,20,000.
  * Subsidy: ₹60,000 -> Net Cost: ₹40,000 - ₹60,000.
- 3 kW Solar Rooftop System (Most popular for 2BHK/3BHK):
  * Generates: 12 to 15 units/day (approx 360 to 450 units/month).
  * Space Required: 240 to 300 sq ft.
  * Typical Gross Cost: ₹1,50,000 - ₹1,80,000.
  * Subsidy: ₹78,000 -> Net Cost: ₹72,000 - ₹1,02,000.
- 5 kW Solar Rooftop System:
  * Generates: 20 to 25 units/day (approx 600 to 750 units/month).
  * Space Required: 400 to 500 sq ft.
  * Typical Gross Cost: ₹2,50,000 - ₹2,90,000.
  * Subsidy: ₹78,000 (capped) -> Net Cost: ₹1,72,000 - ₹2,12,000.
- Panel Specifications:
  * High-efficiency Mono-PERC, TOPCon, or Bifacial modules (400W - 550W each).
  * One 400W panel generates ~1.6 - 2.0 units/day; one 540W panel generates ~2.1 - 2.7 units/day.
  * Performance Warranty: 25 to 30 years (guaranteed ≥80% output after 25 years). Product Warranty: 10 to 12 years.
- Inverter Types:
  * On-Grid (Grid-Tied String Inverter): Connects directly to DISCOM grid via bi-directional net meter. Highest efficiency (97-98%), lowest cost.
  * Hybrid Inverter: Works with solar + grid + lithium battery backup during blackouts.
  * Microinverters: Panel-level optimization, ideal for roofs with partial tree/wall shadows.

=== APPLICATION STEP-BY-STEP PROCESS ===
1. Step 1: Register at https://pmsuryaghar.gov.in with your State, DISCOM Name, and Electricity Consumer Account Number.
2. Step 2: Submit online application for Rooftop Solar & get Technical Feasibility Approval (TFR) from DISCOM.
3. Step 3: Select an empanelled vendor registered on the national portal to sign contract and commence installation.
4. Step 4: Vendor installs DCR-compliant, ALMM-listed solar panels, inverter, earthing, and lightning arrester.
5. Step 5: Vendor submits Work Completion Report on portal.
6. Step 6: DISCOM officer visits for physical inspection, tests equipment safety, and installs bi-directional Net Meter.
7. Step 7: DISCOM generates Commissioning Certificate on portal.
8. Step 8: Upload bank account details & cancelled cheque on national portal. Subsidy credited via DBT within 30 days!

=== DOCUMENTS REQUIRED ===
- Aadhaar Card (linked to mobile number).
- Recent Electricity Bill (last 1-2 months showing consumer account number and sanctioned load).
- Proof of Property Ownership (House tax receipt, registry, or sale deed).
- Cancelled Cheque / Bank Passbook front page (showing account holder name matching electricity bill, account number, IFSC).
- Recent Passport-size Photograph.
- Clear rooftop photograph showing shadow-free orientation.
"""

# ==============================================================================
# INTELLIGENT CONVERSATIONAL ENGINE (SEMANTIC INTENT MATCHER & RULE REASONER)
# ==============================================================================

def get_state_specific_reply(state: str) -> str:
    s = state.lower().strip()
    if "uttar pradesh" in s or "up" == s:
        return (
            "### ☀️ Solar Subsidies in Uttar Pradesh (UPNEDA)\n\n"
            "Great news! Uttar Pradesh offers **one of the highest total solar subsidies in India** by combining Central and State benefits:\n\n"
            "- **Central PM Surya Ghar Subsidy**: Up to **₹78,000** (₹30,000/kW for first 2 kW + ₹18,000 for 3rd kW).\n"
            "- **UP State Top-Up Subsidy (UPNEDA)**: Additional **₹15,000 per kW**, capped at **₹30,000**.\n"
            "- **Total Subsidy for a 3 kW System**: **₹1,08,000** (₹78,000 + ₹30,000)!\n\n"
            "**Key Details for UP Residents:**\n"
            "- **Net Metering**: Handled by UPPCL (DVVNL, MVVNL, PVVNL, PuVVNL) and KESCO.\n"
            "- **Solar Yield in UP**: ~129 units per kW per month (~4.3 units/day).\n"
            "- **Gross Cost for 3 kW**: ~₹1,50,000 → **Your Net Out-of-Pocket**: Only ~₹42,000!\n"
            "- **Estimated Payback Period**: Under **2.2 years**.\n\n"
            "Apply via the national portal [pmsuryaghar.gov.in](https://pmsuryaghar.gov.in) and choose an approved UPNEDA vendor."
        )
    elif "delhi" in s:
        return (
            "### ☀️ Solar Incentives in Delhi (Delhi Solar Policy 2024)\n\n"
            "Delhi has one of the most progressive solar policies in India, featuring both capital subsidies and generation-based income:\n\n"
            "- **Central PM Surya Ghar Subsidy**: Up to **₹78,000** for a 3 kW system.\n"
            "- **Delhi State Capital Subsidy**: **₹2,000 per kW** (up to ₹10,000 max).\n"
            "- **Generation Based Incentive (GBI)**: **₹3.00 per unit (kWh)** generated by your solar system for **5 consecutive years** (for residential systems up to 3 kW)!\n"
            "- **Monthly Bill Impact**: Your DISCOM bill typically drops to **₹0**, and you can earn surplus credits.\n\n"
            "**DISCOMs & Process:**\n"
            "- Serviced by BSES Rajdhani (BRPL), BSES Yamuna (BYPL), and Tata Power-DDL.\n"
            "- Average Solar Yield: ~135 units/kW/month.\n"
            "- A 3 kW setup yields ~400 units/month, generating ~₹1,200/month in GBI rewards on top of bill savings!"
        )
    elif "gujarat" in s:
        return (
            "### ☀️ Solar Subsidies in Gujarat (Surya Gujarat & GUVNL)\n\n"
            "Gujarat leads the nation in residential rooftop solar adoption:\n\n"
            "- **Central PM Surya Ghar Subsidy**: Up to **₹78,000** (₹30,000/kW for first 2 kW, ₹18,000 for 3rd kW).\n"
            "- **High Solar Irradiation**: ~150 units per kW per month (~5.0 units/day), among the highest yields in India.\n"
            "- **Fast-Track Net Metering**: GUVNL DISCOMs (UGVCL, DGVCL, MGVCL, PGVCL) and Torrent Power have streamlined digital approvals and bi-directional meter installations.\n"
            "- **Banking & Settlement**: Unused surplus units banked during the billing cycle are adjusted at DISCOM approved feed-in tariffs.\n"
            "- **Payback Period**: Typically just **2.8 to 3.2 years** for residential homes."
        )
    elif "maharashtra" in s:
        return (
            "### ☀️ Solar Subsidies in Maharashtra (MSEDCL / Mahavitaran)\n\n"
            "Maharashtra consumers benefit significantly from solar due to higher domestic electricity tariff slabs:\n\n"
            "- **Central PM Surya Ghar Subsidy**: Up to **₹78,000** for systems 3 kW and above.\n"
            "- **High Tariff Advantage**: Maharashtra residential tariffs range from ₹7.50 to ₹12.00+ per unit in upper slabs. Offsetting these high-slab units delivers enormous monthly savings!\n"
            "- **Net Metering**: Available with MSEDCL, Tata Power, Adani Electricity, and BEST up to 100% of sanctioned load.\n"
            "- **Solar Yield**: ~135 units per kW per month.\n"
            "- **Payback Period**: Extremely fast, usually **2.5 to 3.2 years** because each generated unit saves up to ₹11."
        )
    elif "karnataka" in s:
        return (
            "### ☀️ Solar Subsidies in Karnataka (BESCOM / HESCOM / MESCOM)\n\n"
            "Karnataka has excellent solar generation potential and favorable net metering policies:\n\n"
            "- **Central PM Surya Ghar Subsidy**: Up to **₹78,000** (₹30k for 1 kW, ₹60k for 2 kW, ₹78k for 3 kW+).\n"
            "- **Solar Yield in Karnataka**: ~144 units per kW per month (~4.8 units/day).\n"
            "- **Net Metering**: Consumers can install up to 100% of sanctioned load or roof capacity.\n"
            "- **Annual Banking Settlement**: Excess energy injected into the grid is settled by BESCOM/KERC at specified purchase tariffs.\n"
            "- **Typical Savings**: A 3 kW plant generates ~430 units/month, saving ₹3,000 to ₹3,500 every single month."
        )
    elif "rajasthan" in s:
        return (
            "### ☀️ Solar Subsidies in Rajasthan (JVVNL / AVVNL / JdVVNL)\n\n"
            "Rajasthan enjoys India's highest solar radiation:\n\n"
            "- **Central PM Surya Ghar Subsidy**: Up to **₹78,000** for 3 kW and above.\n"
            "- **Unmatched Solar Yield**: **165 units per kW per month** (over 5.5 units/day)!\n"
            "- **Rapid Return on Investment**: Because panels produce ~20% more power in Rajasthan compared to coastal states, payback is reached in just **2.4 to 3 years**.\n"
            "- **Net Metering**: Processed through Discom portals with bi-directional net meters."
        )
    else:
        return (
            f"### ☀️ Solar Policy for {state.title()}\n\n"
            f"- **Central PM Surya Ghar Subsidy**: Available across {state.title()} through [pmsuryaghar.gov.in](https://pmsuryaghar.gov.in).\n"
            f"  * 1 kW: **₹30,000**\n"
            f"  * 2 kW: **₹60,000**\n"
            f"  * 3 kW & above: **₹78,000** (Direct Benefit Transfer to your account)\n"
            f"- **Net Metering**: Supported by your state power utility/DISCOM for grid-tied rooftop systems.\n"
            f"- **DCR Requirement**: Ensure your local installer uses Made-in-India (DCR) cells and ALMM modules to guarantee subsidy approval."
        )

def generate_intelligent_reply(query: str, user_state: Optional[str]) -> Tuple[str, List[str]]:
    q = query.lower()
    sources = ["PM Surya Ghar National Portal (pmsuryaghar.gov.in)", "MNRE Rooftop Solar Guidelines"]

    # 1. Greetings / Bot Persona
    if re.search(r"\b(hi|hello|hey|who are you|what can you do|namaste)\b", q) and len(q) < 35:
        greeting_text = (
            "👋 **Namaste! I am your SuryaPunk Solar Assistant.**\n\n"
            "I can help you navigate India's rooftop solar ecosystem. Here are common topics you can ask me about:\n\n"
            "1. 💰 **Subsidies & Slabs**: How much money you get back under PM Surya Ghar Muft Bijli Yojana (up to ₹78,000 central + state bonuses).\n"
            "2. 🏛️ **State Policies**: Subsidies & net metering for " + (user_state or "your state") + " (e.g., UP's ₹30,000 top-up, Delhi's GBI).\n"
            "3. 🏦 **SBI Solar Loans**: Zero-collateral loans at ~5.75% interest with 10-year repayment.\n"
            "4. ⚡ **Technical Sizing**: How many panels you need, daily unit generation, and rooftop space.\n"
            "5. 📄 **Document Checklist**: What papers you need for DISCOM approval and net metering.\n\n"
            "How can I assist you with your home solar plan today?"
        )
        return greeting_text, sources

    # 2. State-Specific Subsidies & Policies
    detected_state = None
    all_states = [
        "uttar pradesh", "up", "delhi", "gujarat", "maharashtra", "karnataka",
        "rajasthan", "tamil nadu", "kerala", "haryana", "punjab", "bihar",
        "west bengal", "madhya pradesh", "telangana", "andhra pradesh", "odisha"
    ]
    for s in all_states:
        if s in q:
            detected_state = s
            break
    
    if (("state" in q or "my state" in q or detected_state is not None) and 
        ("subsidy" in q or "policy" in q or "net metering" in q or "rate" in q or "incentive" in q)):
        target_state = detected_state or user_state or "your state"
        sources.append("State Renewable Energy Development Agency (SREDA)")
        return get_state_specific_reply(target_state), sources

    # 3. Subsidy Slabs / How Much Subsidy / PM Surya Ghar calculations
    if any(k in q for k in ["subsidy", "how much", "pm surya", "surya ghar", "slab", "cfa", "central scheme"]):
        # Check if asking for specific capacity
        kw_match = re.search(r"(\d+(\.\d+)?)\s*(kw|kilowatt)", q)
        specific_capacity_note = ""
        if kw_match:
            val = float(kw_match.group(1))
            if val <= 1.0:
                calc_subsidy = 30000
            elif val <= 2.0:
                calc_subsidy = round(val * 30000)
            elif val <= 3.0:
                calc_subsidy = round(60000 + (val - 2.0) * 18000)
            else:
                calc_subsidy = 78000
            specific_capacity_note = (
                f"\n\n👉 **For your {val} kW query:**\n"
                f"- **Central Subsidy**: **₹{calc_subsidy:,}**\n"
                f"- **Estimated System Cost**: ₹{int(val * 52000):,} - ₹{int(val * 58000):,}\n"
                f"- **Net Cost to You**: ~₹{max(0, int(val * 52000) - calc_subsidy):,}"
            )

        reply = (
            "### 🏛️ PM Surya Ghar: Muft Bijli Yojana Subsidy Slabs\n\n"
            "Under the central scheme, the Government of India provides Direct Benefit Transfer (DBT) subsidies based on system capacity:\n\n"
            "| System Capacity | Central Subsidy (CFA) | Estimated Units / Month | Suitable For |\n"
            "| :--- | :--- | :--- | :--- |\n"
            "| **1 kW** | **₹30,000** | ~120 – 150 units | Small 1BHK / basic appliances |\n"
            "| **2 kW** | **₹60,000** | ~240 – 300 units | 2BHK / 1 AC + refrigerator |\n"
            "| **3 kW** | **₹78,000** (Max Cap) | ~360 – 450 units | 3BHK / 2 ACs + appliances |\n"
            "| **4 kW - 10 kW** | **₹78,000** (Flat Cap) | ~500 – 1,400 units | Large villas / commercial |\n\n"
            "**Key Subsidy Conditions:**\n"
            "- **Direct Bank Credit (DBT)**: Disbursed to your bank account within **30 days** of DISCOM commissioning.\n"
            "- **DCR & ALMM Mandatory**: Panels must be made in India with domestic cells and approved by MNRE.\n"
            "- **Group Housing / RWAs**: ₹18,000 per kW for common areas up to 500 kW."
            + specific_capacity_note +
            ("\n\n*Note: If you reside in " + user_state + ", you may also receive additional state top-up subsidies!*" if user_state else "")
        )
        return reply, sources

    # 4. Loans & SBI Surya Ghar Financing
    if any(k in q for k in ["loan", "sbi", "finance", "bank", "interest", "emi", "collateral", "down payment"]):
        sources.append("State Bank of India (SBI Surya Ghar Solar Scheme)")
        reply = (
            "### 🏦 SBI Surya Ghar Solar Loan Scheme\n\n"
            "State Bank of India (SBI) offers a specialized concessional solar loan with exceptional terms to make adoption effortless:\n\n"
            "1. **Collateral-Free Financing**:\n"
            "   - **Up to ₹2,00,000**: **Zero collateral** required. Only basic KYC and homeownership documents.\n"
            "   - Systems up to 3 kW are fully covered with almost no out-of-pocket strain.\n\n"
            "2. **Concessional Interest Rates**:\n"
            "   - **Up to 3 kW**: Special rate of **~5.75% to 7.00% p.a.** (linked to EBLR).\n"
            "   - **Above 3 kW (up to 10 kW)**: ~7.90% to 9.00% p.a.\n\n"
            "3. **Tenure & EMI Flexibility**:\n"
            "   - Repayment duration up to **10 years (120 months)**.\n"
            "   - **6-month moratorium** before full repayments commence.\n"
            "   - Margin money (down payment): Just **10%** of project cost.\n"
            "   - **Zero processing fee**.\n\n"
            "4. **Smart Subsidy Adjustment**:\n"
            "   - When your ₹78,000 PM Surya Ghar DBT subsidy arrives in your account, you can deposit it directly to pre-pay your loan principal with **zero prepayment penalty**!\n\n"
            "Other banks like Canara Bank, PNB, and Union Bank also offer matching terms on the PM Surya Ghar national portal."
        )
        return reply, sources

    # 5. Panel Specs, Units Generated, Technical Sizing
    if any(k in q for k in ["panel", "units", "generate", "watt", "how many units", "production", "kwh", "mono perc", "bifacial", "area", "sq ft", "space"]):
        reply = (
            "### ⚡ Solar Panel Generation & Technical Specifications\n\n"
            "Here is how modern residential solar panels perform under Indian solar conditions:\n\n"
            "**1. How Many Units Does 1 Panel Produce?**\n"
            "- A modern **400W Mono-PERC panel** generates **1.6 to 2.0 units (kWh) per day** (~50 units/month).\n"
            "- A higher-capacity **540W/550W TOPCon/Bifacial panel** produces **2.2 to 2.7 units per day** (~70 units/month).\n\n"
            "**2. System Capacities & Daily Generation:**\n"
            "- **1 kW System** (~2-3 panels): Generates **4 to 5 units/day** (~120–150 units/month).\n"
            "- **2 kW System** (~4-5 panels): Generates **8 to 10 units/day** (~240–300 units/month).\n"
            "- **3 kW System** (~6-7 panels): Generates **12 to 15 units/day** (~360–450 units/month).\n"
            "- **5 kW System** (~10-12 panels): Generates **20 to 25 units/day** (~600–750 units/month).\n\n"
            "**3. Rooftop Space Requirements:**\n"
            "- Rule of thumb: **80 to 100 sq. ft** of shadow-free area per 1 kW of capacity.\n"
            "- A 3 kW setup requires approximately **250 to 300 sq. ft** with south-facing tilt.\n\n"
            "**4. Panel Types & Lifespan:**\n"
            "- **Mono-PERC / TOPCon**: High 21-22% efficiency, excellent performance in high Indian summer temperatures.\n"
            "- **Durability**: 25-30 year performance warranty (guaranteed ≥80% output after 25 years)."
        )
        return reply, sources

    # 6. DCR & ALMM Compliance
    if any(k in q for k in ["dcr", "almm", "domestic content", "imported", "chinese", "compliance"]):
        sources.append("MNRE ALMM Mandate Circular 2024-2025")
        reply = (
            "### 🛡️ Why DCR & ALMM Compliance is Mandatory\n\n"
            "To qualify for the **PM Surya Ghar subsidy**, your installation must comply with two non-negotiable government standards:\n\n"
            "1. **DCR (Domestic Content Requirement)**:\n"
            "   - Both the **solar cells** and the **solar module** must be 100% manufactured in India.\n"
            "   - Modules assembled in India using imported (e.g. Chinese) cells do **NOT** qualify for CFA.\n"
            "   - If non-DCR panels are installed, the DISCOM inspection officer will reject the subsidy claim!\n\n"
            "2. **ALMM (Approved List of Models and Manufacturers)**:\n"
            "   - Only models certified and listed in MNRE's ALMM List can be used.\n"
            "   - Trusted ALMM brands include: **Tata Power Solar, Waaree Energies, Adani Solar, Vikram Solar, Premier Energies, and RenewSys**.\n\n"
            "**Consumer Tip:** Always verify that your installer explicitly writes *'DCR ALMM-Compliant Solar Modules'* on your work contract and invoice."
        )
        return reply, sources

    # 7. Documents Required & Step-by-Step Approval
    if any(k in q for k in ["document", "docs", "paper", "apply", "approval", "discom", "process", "steps", "how to"]):
        reply = (
            "### 📋 Documents & Steps for PM Surya Ghar Approval\n\n"
            "**Essential Documents Checklist:**\n"
            "1. 🆔 **Aadhaar Card** (Linked with mobile number for OTP verification).\n"
            "2. ⚡ **Latest Electricity Bill** (Last 1-2 months, showing your Consumer Number & Sanctioned Load).\n"
            "3. 🏠 **Property Proof** (Electricity bill address must match property deed, registry, or house tax receipt).\n"
            "4. 🏦 **Bank Account Proof** (Cancelled cheque or passbook copy with name matching electricity bill for DBT).\n"
            "5. 📸 **Rooftop Photo** (Showing open terrace space).\n\n"
            "**Step-by-Step Application Roadmap:**\n"
            "1. **Register** at [pmsuryaghar.gov.in](https://pmsuryaghar.gov.in) with your Consumer Account Number.\n"
            "2. **Technical Feasibility (TFR)**: DISCOM approves your load feasibility online (usually 3-7 days).\n"
            "3. **Vendor Selection**: Contract an MNRE-registered empanelled vendor.\n"
            "4. **Installation**: Vendor mounts structure, DCR panels, inverter, and earthing protection.\n"
            "5. **DISCOM Inspection & Net Meter**: DISCOM verifies module serial numbers and installs the bi-directional net meter.\n"
            "6. **DBT Credit**: Subsidy is credited directly into your bank account within 30 days of commissioning certificate issue."
        )
        return reply, sources

    # 8. Net Metering vs Gross Metering & How it Works
    if any(k in q for k in ["net meter", "metering", "bi-directional", "gross meter", "grid"]):
        sources.append("Forum of Regulators (FOR) Net Metering Guidelines")
        reply = (
            "### 🔄 How Net Metering Works in India\n\n"
            "A **Net Meter** is a bi-directional energy meter that records both electricity drawn from the grid and solar power exported to the grid:\n\n"
            "1. **Daytime Solar Surplus**:\n"
            "   - When your panels generate more electricity than your home consumes, surplus units flow automatically back into the DISCOM grid.\n"
            "   - Your net meter literally spins in reverse (or credits export kWh)!\n\n"
            "2. **Nighttime & Rainy Days**:\n"
            "   - When solar generation stops at night, your home pulls electricity seamlessly from the grid.\n\n"
            "3. **Monthly DISCOM Bill Calculation**:\n"
            "   $$\\text{Billed Units} = \\text{Total Import Units} - \\text{Total Export Solar Units}$$\n"
            "   - If you export equal or more units than you consume, your energy consumption bill drops to **₹0** (you only pay minimal fixed meter charges).\n"
            "   - Unused surplus units carry forward as banked credits to next month's bill until annual settlement."
        )
        return reply, sources

    # 9. Cost, Payback, and Return on Investment
    if any(k in q for k in ["cost", "price", "payback", "roi", "savings", "investment", "worth it"]):
        reply = (
            "### 💰 Solar Investment, Payback & Return on Investment (ROI)\n\n"
            "Rooftop solar in India currently delivers an annualized return of **25% to 35%**, far exceeding mutual funds or fixed deposits:\n\n"
            "**Typical 3 kW Rooftop Solar Economics:**\n"
            "- **Gross System Cost**: ~₹1,50,000 to ₹1,70,000\n"
            "- **Central PM Surya Ghar Subsidy**: -₹78,000\n"
            "- **Net Out-of-Pocket Cost**: **~₹72,000 to ₹92,000**\n"
            "- **Annual Power Generated**: ~4,300 units (kWh)\n"
            "- **Annual Bill Savings**: ~₹32,000 to ₹38,000/year (at ₹8/unit tariff)\n"
            "- **Payback Period**: **2.2 to 2.8 Years**!\n\n"
            "**Long-Term Profit:**\n"
            "- After recovering your entire cost in under 3 years, you receive **100% free electricity for the remaining 22+ years** of the panel's warranted lifespan!\n"
            "- Lifetime net savings exceed **₹7,00,000+** on a standard 3 kW home setup."
        )
        return reply, sources

    # Default Contextual Synthesizer
    reply = (
        f"### ☀️ PM Surya Ghar & Rooftop Solar Guide\n\n"
        f"Based on your query and current Indian solar guidelines" + (f" for **{user_state}**" if user_state else "") + ":\n\n"
        "- **Central Subsidy**: Up to **₹78,000** for systems 3 kW and above under PM Surya Ghar Muft Bijli Yojana.\n"
        "- **Estimated Daily Yield**: 1 kW produces 4-5 units/day, requiring ~100 sq.ft of shadow-free rooftop.\n"
        "- **Bank Financing**: SBI offers collateral-free loans up to ₹2 Lakhs at ~5.75% interest.\n"
        "- **Net Metering**: Connects with your local DISCOM to adjust solar exports against consumption.\n\n"
        "Could you tell me your average monthly electricity bill or roof area? I can calculate your exact recommended system size, subsidy, and net investment!"
    )
    return reply, sources

# ==============================================================================
# MAIN RAG FUNCTION
# ==============================================================================

def chat_with_subsidy_assistant(messages: List[ChatMessage], user_state: Optional[str]) -> Tuple[str, List[str]]:
    """
    RAG Assistant for PM Surya Ghar & Indian Rooftop Solar:
    1. If AWS Bedrock credentials exist, calls Claude 3 Haiku with rich solar domain prompt.
    2. If Bedrock fails, uses the built-in Intelligent Semantic Intent Matcher & Rule Reasoner.
    """
    latest_user_message = ""
    for msg in reversed(messages):
        if msg.role == 'user':
            latest_user_message = msg.content
            break

    # Build bedrock prompt
    prompt = (
        f"You are SuryaPunk AI, an authoritative, friendly, and expert Indian rooftop solar advisor.\n"
        f"Answer the user's questions clearly using bullet points, bold metrics, and structured markdown.\n"
        f"User State: {user_state or 'Not specified'}\n\n"
        f"Authoritative Solar Knowledge:\n{SOLAR_POLICY_CONTEXT}\n\n"
        f"Conversation History:\n"
    )
    for msg in messages:
        prompt += f"{msg.role}: {msg.content}\n"
    prompt += "assistant:"

    try:
        bedrock = boto3.client(service_name='bedrock-runtime', region_name=settings.aws_region)
        body = json.dumps({
            "anthropic_version": "bedrock-2023-05-31",
            "max_tokens": 1024,
            "messages": [{"role": "user", "content": prompt}]
        })
        response = bedrock.invoke_model(
            body=body,
            modelId=settings.bedrock_model_id,
            accept='application/json',
            contentType='application/json'
        )
        response_body = json.loads(response.get('body').read())
        reply_text = response_body.get('content', [{}])[0].get('text', '')
        if reply_text and len(reply_text.strip()) > 20:
            sources = ["PM Surya Ghar National Portal (pmsuryaghar.gov.in)", "MNRE Rooftop Solar Guidelines"]
            if user_state:
                sources.append(f"{user_state} State Solar Policy")
            return reply_text, sources
    except Exception:
        pass

    # Intelligent semantic fallback engine
    return generate_intelligent_reply(latest_user_message, user_state)
