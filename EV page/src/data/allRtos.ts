import { Opportunity } from "../types";
import allRtoData from "./all_rto_master.json";

function cleanDisplayName(rawCity: string, rawName: string): { displayCity: string; displayName: string } {
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

export const allRtoOpportunities: Opportunity[] = (allRtoData as any[]).map((item: any) => {
  const { displayCity, displayName } = cleanDisplayName(item.districtOrCity, item.name);
  const score = item.opportunityScore;
  const landRate = item.landPriceSqft || 5000;

  const tier: "high" | "medium" | "low" = 
    score >= 65 ? "high" : score >= 58 ? "medium" : "low";

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
    evDemandIndex: item.factors?.find((f: any) => f.name.includes("Demand"))?.score || 40,
    evGrowthIndex: item.factors?.find((f: any) => f.name.includes("Growth") || f.name.includes("Velocity"))?.score || 40,
    chargingGapIndex: item.chargingGapIndex || 40,
    existingChargerCountEstimate: item.stationCount || 0,
    competitionIndex: Math.min(100, Math.round((item.stationCount || 0) * 1.5)),
    roadAccessIndex: 80,
    solarPotentialIndex: item.solarPotentialIndex || 70,
    electricityCostIndex: null,
    targetSegments: item.targetSegments || ["Public Fast Charging", "Commercial Fleets"],
    chargerTypes: item.chargerTypes || ["CCS-2 Dual Gun (60kW DC)", "Type-2 (22kW AC)"],
    estimatedBudgetBand: budgetBand,
    factors: (item.factors || []).map((f: any) => ({
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
    risks: item.risks || [],
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

/**
 * Calculates Great-Circle distance in kilometers between two coordinates
 */
export function calculateDistanceKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // Earth's radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c);
}

/**
 * Finds the nearest RTO jurisdiction to any clicked coordinate on the map
 */
export function findNearestRto(lat: number, lon: number): { rto: Opportunity; distanceKm: number } | null {
  if (!allRtoOpportunities || allRtoOpportunities.length === 0) return null;

  let nearest = allRtoOpportunities[0];
  let minDistance = Infinity;

  for (const rto of allRtoOpportunities) {
    const dist = calculateDistanceKm(lat, lon, rto.latitude, rto.longitude);
    if (dist < minDistance) {
      minDistance = dist;
      nearest = rto;
    }
  }

  return { rto: nearest, distanceKm: minDistance };
}
