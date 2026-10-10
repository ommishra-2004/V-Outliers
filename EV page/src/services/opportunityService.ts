import { Opportunity, FinancialAssumptions, StationConfiguration } from "../types";
import { realOpportunities } from "../data/realOpportunities";

export interface FilterState {
  budget: string;
  objective: string;
  opportunityLevel: string;
  state?: string;
}

export const opportunityService = {
  getOpportunities: async (filters: FilterState): Promise<Opportunity[]> => {
    // Fast simulated async dispatch
    await new Promise((resolve) => setTimeout(resolve, 100));

    let results = [...realOpportunities];

    // Filter by State
    if (filters.state && filters.state !== "All India") {
      results = results.filter((opp) => opp.state === filters.state);
    }

    // Filter by Budget Band
    if (filters.budget && filters.budget !== "Any budget") {
      results = results.filter((opp) => {
        if (filters.budget.includes("25L")) {
          return opp.estimatedBudgetBand === "₹25L – ₹50L" || (opp.landPriceSqft || 5000) <= 6000;
        }
        if (filters.budget.includes("50L")) {
          return opp.estimatedBudgetBand === "₹50L – ₹1.2Cr" || ((opp.landPriceSqft || 5000) > 4000 && (opp.landPriceSqft || 5000) <= 12000);
        }
        if (filters.budget.includes("1.2Cr")) {
          return opp.estimatedBudgetBand === "> ₹1.2Cr" || (opp.landPriceSqft || 0) > 10000 || opp.totalRegistrations >= 15000;
        }
        return opp.estimatedBudgetBand === filters.budget;
      });
    }

    // Filter by Opportunity Level
    if (filters.opportunityLevel && filters.opportunityLevel !== "All") {
      results = results.filter(
        (opp) => opp.opportunityBand.toLowerCase() === filters.opportunityLevel.toLowerCase()
      );
    }

    // Re-ranking based on Investment Objective
    if (filters.objective === "Maximize projected ROI" || filters.objective === "Maximize ROI") {
      // Prioritize high EV fleet volume, lower land price burden, and high solar generation
      results.sort((a, b) => {
        const scoreA = a.evDemandIndex * 0.45 + (100 - (a.landPriceSqft || 5000) / 250) * 0.35 + a.solarPotentialIndex * 0.20;
        const scoreB = b.evDemandIndex * 0.45 + (100 - (b.landPriceSqft || 5000) / 250) * 0.35 + b.solarPotentialIndex * 0.20;
        return scoreB - scoreA;
      });
    } else if (filters.objective === "Shorter payback") {
      // Prioritize high charging pressure (unmet gap) + reasonable land cost
      results.sort((a, b) => {
        const scoreA = a.chargingGapIndex * 0.55 + (100 - (a.landPriceSqft || 5000) / 250) * 0.30 + a.evDemandIndex * 0.15;
        const scoreB = b.chargingGapIndex * 0.55 + (100 - (b.landPriceSqft || 5000) / 250) * 0.30 + b.evDemandIndex * 0.15;
        return scoreB - scoreA;
      });
    } else {
      // Balanced strategy (Precalculated composite score)
      results.sort((a, b) => b.opportunityScore - a.opportunityScore);
    }

    return results;
  },

  getOpportunityById: async (id: string): Promise<Opportunity | undefined> => {
    return realOpportunities.find((opp) => opp.id === id);
  },

  getAvailableStates: (): string[] => {
    const states = Array.from(new Set(realOpportunities.map(o => o.state))).sort();
    return ["All India", ...states];
  },

  /**
   * Generates dynamic empirical brief in real-time from live location metrics
   */
  generateRealtimeWhyHere: (location: Opportunity): string => {
    const fleet = location.totalRegistrations.toLocaleString();
    const gap = location.evPerCharger;
    const solar = location.solarUnitsPerKwMonth;
    const land = Math.round(location.landPriceSqft).toLocaleString();
    const growth = location.growthRatePct ?? 0;
    const growthText = growth >= 0 ? `expanding at +${growth.toFixed(1)}% QoQ` : `contracting at ${growth.toFixed(1)}% QoQ`;

    return `Evaluated in real-time with an empirical score of ${location.opportunityScore}/100. This transport jurisdiction hosts ${fleet} registered electric vehicles (${growthText}) against ${location.stationCount} existing public charging stations, creating a vehicle-to-charger pressure of ${gap} EVs per charger. State solar yield generates ${solar} kWh/kW/month, offsetting operational electricity tariffs, while the regional land benchmark sits at ₹${land}/sq.ft.`;
  },

  /**
   * Automatically derives the feasible station configuration from Budget Band,
   * applying exact regional land costs and state solar generation benchmarks.
   */
  getFeasibleStationConfiguration: (
    location: Opportunity,
    budgetBand: string = "Any budget",
    landMode: "purchase" | "lease" = "purchase"
  ): StationConfiguration => {
    const landRate = location.landPriceSqft || 4500;
    const monthlySolarUnitsPerKw = location.solarUnitsPerKwMonth || 135;
    const annualSolarUnitsPerKw = monthlySolarUnitsPerKw * 12;

    let tier: "compact" | "standard" | "flagship" = "standard";
    if (budgetBand === "₹25L – ₹50L") {
      tier = "compact";
    } else if (budgetBand === "> ₹1.2Cr") {
      tier = "flagship";
    }

    let name = "Standard Commercial EV Hub";
    let desc = "Balanced fast-charging station for urban hubs and commercial complexes.";
    let chargerSetup = "4x 60kW Dual-Gun DC Fast Chargers + 2x 22kW AC Destination Chargers";
    let chargerCount = 4;
    let chargerType: "AC" | "DC" | "Mixed" = "DC";
    let hardwareCapex = 2800000;
    let gridCapex = 700000; // 100kVA Transformer, switchgear, DISCOM sanction
    let solarKw = 15;
    let solarCapex = solarKw * 42000;
    let landSqft = 1200; // 4 bays + circulation + transformer pad
    let dailyUtilizationHours = 5.5; // ~23% utilization

    if (tier === "compact") {
      name = "Compact Urban Quick-Charge";
      desc = "Cost-optimized fast charging installation for parking lots and fuel retail.";
      chargerSetup = "2x 30kW DC Fast Chargers + 2x 22kW AC Chargers";
      chargerCount = 2;
      chargerType = "Mixed";
      hardwareCapex = 1600000;
      gridCapex = 450000; // 63kVA connection
      solarKw = 8;
      solarCapex = solarKw * 42000;
      landSqft = 600;
      dailyUtilizationHours = 5.0;
    } else if (tier === "flagship") {
      name = "High-Capacity Highway Transit Hub";
      desc = "Full-service multi-bay fast charging plaza with solar canopy and fleet support.";
      chargerSetup = "8x 60kW/120kW DC Fast Chargers + 4x 22kW AC Destination Chargers";
      chargerCount = 8;
      chargerType = "DC";
      hardwareCapex = 5600000;
      gridCapex = 1400000; // 250kVA connection & civil substation
      solarKw = 35;
      solarCapex = solarKw * 40000;
      landSqft = 2500;
      dailyUtilizationHours = 6.5;
    }

    const landPurchaseCapex = landSqft * landRate;
    const monthlyLeaseRate = Math.round(landPurchaseCapex * 0.0055); // Standard commercial lease ~6.6% per annum
    
    const totalCapex = hardwareCapex + gridCapex + solarCapex + (landMode === "purchase" ? landPurchaseCapex : 0);

    // Energy Economics
    const daysPerYear = 365;
    const avgKwhPerSession = 25; // 25 kWh per DC session average in India
    const avgDurationHours = 0.75; // 45 minutes
    const sessionsPerChargerPerDay = dailyUtilizationHours / avgDurationHours;
    const dailySessions = Math.round(chargerCount * sessionsPerChargerPerDay);
    const annualEnergySoldKwh = Math.round(dailySessions * avgKwhPerSession * daysPerYear);

    const sellingPricePerKwh = 19; // Standard commercial EV tariff ₹19/kWh
    const gridTariffPerKwh = 8.5;  // Industrial/commercial DISCOM tariff ₹8.5/kWh

    const annualGrossRevenue = annualEnergySoldKwh * sellingPricePerKwh;
    const annualGridEnergyCost = annualEnergySoldKwh * gridTariffPerKwh;

    // Solar Generation & Savings
    const annualSolarUnitsGen = Math.round(solarKw * annualSolarUnitsPerKw);
    const annualSolarSavings = Math.round(Math.min(annualSolarUnitsGen, annualEnergySoldKwh) * gridTariffPerKwh);

    // Operating expenses: Net grid energy + Maintenance + (Lease if chosen)
    const annualMaintenance = Math.round(hardwareCapex * 0.035); // 3.5% AMC
    const annualLandLeaseCost = landMode === "lease" ? monthlyLeaseRate * 12 : 0;
    
    const annualOperatingCost = (annualGridEnergyCost - annualSolarSavings) + annualMaintenance + annualLandLeaseCost;
    const annualNetCashFlow = annualGrossRevenue - annualOperatingCost;

    const simplePaybackYears = annualNetCashFlow > 0 ? Number((totalCapex / annualNetCashFlow).toFixed(1)) : null;
    const cumulativeNetBenefit5Y = annualNetCashFlow * 5;
    const fiveYearRoiPct = totalCapex > 0 ? Number((((cumulativeNetBenefit5Y - totalCapex) / totalCapex) * 100).toFixed(1)) : 0;

    return {
      name,
      description: desc,
      chargerSetup,
      chargerCount,
      chargerType,
      hardwareCapex,
      gridCapex,
      solarKw,
      solarCapex,
      landSqft,
      landPurchaseCapex,
      totalCapex,
      monthlyLeaseRate,
      dailySessions,
      annualEnergySoldKwh,
      annualGrossRevenue,
      annualGridEnergyCost,
      annualSolarUnitsGen,
      annualSolarSavings,
      annualOperatingCost,
      annualNetCashFlow,
      simplePaybackYears,
      fiveYearRoiPct
    };
  },

  getInvestmentEstimate: (assumptions: FinancialAssumptions, landPriceSqft: number = 4500, stateSolarUnitsMonth: number = 135) => {
    const daysPerYear = 365;
    const hoursPerDay = assumptions.utilizationRate * 24;
    const avgDurationHours = assumptions.chargerType === "DC" ? 0.75 : 2.5;
    const dailySessionsPerCharger = Math.max(1, hoursPerDay / avgDurationHours);
    const dailySessions = assumptions.chargerCount * dailySessionsPerCharger;
    const dailyEnergySold = dailySessions * assumptions.avgKwhPerSession;
    const annualEnergySold = dailyEnergySold * daysPerYear;
    
    const annualRevenue = annualEnergySold * assumptions.sellingPricePerKwh;
    const annualEnergyCost = annualEnergySold * assumptions.electricityCostPerKwh;
    const annualRent = assumptions.monthlyRent * 12;
    const annualMaintenance = assumptions.monthlyMaintenance * 12;
    
    // Exact State Solar Calculation (units per kW per month * 12)
    const annualSolarGen = assumptions.solarCapacityKw * (stateSolarUnitsMonth * 12);
    const solarSavings = Math.min(annualSolarGen, annualEnergySold) * assumptions.electricityCostPerKwh;
    
    const totalAnnualOperatingCost = Math.max(0, (annualEnergyCost - solarSavings)) + annualRent + annualMaintenance;
    const annualOperatingCashFlow = annualRevenue - totalAnnualOperatingCost;
    
    const initialInvestment = assumptions.installationCost + (assumptions.solarCapacityKw * assumptions.solarCostPerKw);
    const simplePayback = annualOperatingCashFlow > 0 ? Number((initialInvestment / annualOperatingCashFlow).toFixed(1)) : null;
    
    const horizonYears = 5;
    const cumulativeNetBenefit = (annualOperatingCashFlow * horizonYears);
    const roi = initialInvestment > 0 ? Number((((cumulativeNetBenefit - initialInvestment) / initialInvestment) * 100).toFixed(1)) : 0;

    return {
      annualEnergySold: Math.round(annualEnergySold),
      annualRevenue: Math.round(annualRevenue),
      annualOperatingCashFlow: Math.round(annualOperatingCashFlow),
      initialInvestment: Math.round(initialInvestment),
      simplePayback,
      roi,
      horizonYears
    };
  }
};
