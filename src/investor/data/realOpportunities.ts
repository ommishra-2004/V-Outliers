import { Opportunity } from "../types";
import rawData from "./real_opportunities.json";

function cleanDisplayName(rawCity: string, rawName: string): { displayCity: string; displayName: string } {
  // Convert raw government RTO names (e.g., "JAIPUR (FIRST)", "BENGALURU SOUTH") to investor-friendly titles
  let cleanCity = rawCity
    .toLowerCase()
    .replace(/\(first\)/gi, "(Zone 1)")
    .replace(/\(second\)/gi, "(Zone 2)")
    .replace(/\(third\)/gi, "(Zone 3)")
    .replace(/\(fourth\)/gi, "(Zone 4)")
    .replace(/\b([a-z])/g, (c) => c.toUpperCase())
    .trim();

  let cleanName = rawName
    .replace(/\(first\)/gi, "(Zone 1)")
    .replace(/\(second\)/gi, "(Zone 2)")
    .replace(/\(third\)/gi, "(Zone 3)")
    .replace(/\(fourth\)/gi, "(Zone 4)")
    .replace(/EV Gateway/gi, "EV Hub")
    .toLowerCase()
    .replace(/\b([a-z])/g, (c) => c.toUpperCase())
    .replace(/\bEv\b/g, "EV")
    .trim();

  return { displayCity: cleanCity, displayName: cleanName };
}

export const realOpportunities: Opportunity[] = rawData.map((item: any) => {
  const { displayCity, displayName } = cleanDisplayName(item.districtOrCity, item.name);
  const score = item.opportunityScore;
  const landRate = item.landPriceSqft || 5000;

  // Calibrate tiers so High (≥65), Medium (58-64), and Low (<58) are all represented
  const tier: "high" | "medium" | "low" = 
    score >= 65 ? "high" : score >= 58 ? "medium" : "low";

  // Derive realistic feasible budget band based on land cost & scale
  const budgetBand = 
    landRate <= 5500 ? "₹25L – ₹50L" :
    landRate <= 12000 ? "₹50L – ₹1.2Cr" :
    "> ₹1.2Cr";

  return {
    id: item.id,
    name: displayName,
    state: item.state,
    districtOrCity: displayCity,
    level: "zone" as const,
    latitude: item.latitude,
    longitude: item.longitude,
    opportunityScore: item.opportunityScore,
    opportunityBand: tier,
    evDemandIndex: item.factors.find((f: any) => f.name.includes("Demand"))?.score || 50,
    evGrowthIndex: item.factors.find((f: any) => f.name.includes("Growth") || f.name.includes("Velocity"))?.score || 50,
    chargingGapIndex: item.chargingGapIndex || 50,
    existingChargerCountEstimate: item.stationCount || 0,
    competitionIndex: Math.min(100, Math.round((item.stationCount || 0) * 1.5)),
    roadAccessIndex: 80,
    solarPotentialIndex: item.solarPotentialIndex || 70,
    electricityCostIndex: null,
    targetSegments: item.targetSegments || ["Public Fast Charging", "Commercial Fleets"],
    chargerTypes: item.chargerTypes || ["CCS-2 Dual Gun (60kW DC)", "Type-2 (22kW AC)"],
    estimatedBudgetBand: budgetBand,
    factors: item.factors.map((f: any) => ({
      key: f.name.toLowerCase().replace(/[^a-z0-9]/g, "_"),
      label: f.name,
      value: f.score,
      weight: f.weight / 100,
      contribution: f.weightedContribution,
      status: f.source.includes("VAHAN") ? ("observed" as const) : f.source.includes("Ministry") ? ("derived" as const) : ("proxy" as const),
      explanation: f.explanation,
      sourceLabel: f.source
    })),
    whyHereSummary: item.whyHereSummary,
    risks: item.risks,
    dataStatus: "observed-and-derived" as const,
    totalRegistrations: item.totalRegistrations,
    growthRatePct: item.growthRatePct,
    stationCount: item.stationCount,
    fastChargers: item.fastChargers,
    evPerCharger: item.evPerCharger,
    solarUnitsPerKwMonth: item.solarUnitsPerKwMonth,
    annualSolarGenKwhPerKw: item.annualSolarGenKwhPerKw,
    landPriceSqft: item.landPriceSqft,
    landMatchType: item.landMatchType,
    geoSource: item.geoSource,
    history: item.history
  };
});

