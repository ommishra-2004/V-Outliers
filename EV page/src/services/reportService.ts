import { jsPDF } from "jspdf";
import { Opportunity, StationConfiguration } from "../types";

export function generateOpportunityReport(
  location: Opportunity,
  config: StationConfiguration,
  objective: string = "Balanced opportunity"
) {
  const doc = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "a4",
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 16;
  let y = 18;

  // Background Header Styling
  doc.setFillColor(15, 23, 42);
  doc.rect(0, 0, pageWidth, 42, "F");

  // Accent Brand Line
  doc.setFillColor(212, 255, 0); // #d4ff00
  doc.rect(0, 42, pageWidth, 2.5, "F");

  // Header Title
  doc.setTextColor(212, 255, 0);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.text("EV CHARGEPOINT INTELLIGENCE", margin, 14);

  doc.setTextColor(255, 255, 255);
  doc.setFontSize(18);
  doc.text(location.name, margin, 24);

  doc.setFontSize(9.5);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(203, 213, 225);
  doc.text(
    `Region: ${location.districtOrCity}, ${location.state}   |   Date: ${new Date().toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
    })}`,
    margin,
    32
  );

  doc.setFontSize(9);
  doc.text(`Mandate: ${objective}   |   Feasible Tier: ${config.name}`, margin, 38);

  y = 52;

  // SECTION 1: Executive Opportunity Summary
  doc.setTextColor(15, 23, 42);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(13);
  doc.text("1. Executive Summary & Scoring Classification", margin, y);
  y += 6;

  doc.setFillColor(241, 245, 249);
  doc.roundedRect(margin, y, pageWidth - margin * 2, 22, 3, 3, "F");

  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.setTextColor(15, 23, 42);
  doc.text("Composite Opportunity Score:", margin + 5, y + 8);

  doc.setFontSize(16);
  doc.setTextColor(16, 185, 129);
  doc.text(`${location.opportunityScore} / 100`, margin + 68, y + 8);

  doc.setFontSize(10);
  doc.setTextColor(71, 85, 105);
  doc.setFont("helvetica", "normal");
  doc.text(`Tier: ${location.opportunityBand.toUpperCase()}`, margin + 110, y + 8);

  doc.setFontSize(8.5);
  doc.setTextColor(51, 65, 85);
  doc.text(
    `Registered EVs: ${location.totalRegistrations.toLocaleString()}   |   Stations: ${location.stationCount}   |   Pressure: ${location.evPerCharger} EVs/charger   |   Solar: ${location.solarUnitsPerKwMonth} kWh/kW/mo`,
    margin + 5,
    y + 16
  );

  y += 28;

  // SECTION 2: Evidence & Rationale
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.setTextColor(15, 23, 42);
  doc.text("2. Empirical Rationale & Demand Evidence", margin, y);
  y += 5;

  doc.setFont("helvetica", "normal");
  doc.setFontSize(8.5);
  doc.setTextColor(51, 65, 85);
  const whyLines = doc.splitTextToSize(location.whyHereSummary, pageWidth - margin * 2);
  doc.text(whyLines, margin, y);
  y += whyLines.length * 4.2 + 4;

  // SECTION 3: Factor Breakdown Table
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.setTextColor(15, 23, 42);
  doc.text("3. Transparent Evaluation Factor Breakdown", margin, y);
  y += 5;

  // Table Header
  doc.setFillColor(226, 232, 240);
  doc.rect(margin, y, pageWidth - margin * 2, 6.5, "F");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8);
  doc.setTextColor(30, 41, 59);
  doc.text("Evaluation Factor", margin + 3, y + 4.5);
  doc.text("Score", margin + 68, y + 4.5);
  doc.text("Weight", margin + 84, y + 4.5);
  doc.text("Contribution", margin + 102, y + 4.5);
  doc.text("Data Source / Verified Metric", margin + 124, y + 4.5);
  y += 6.5;

  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  location.factors.forEach((f, idx) => {
    if (idx % 2 === 1) {
      doc.setFillColor(248, 250, 252);
      doc.rect(margin, y, pageWidth - margin * 2, 6, "F");
    }
    doc.setTextColor(30, 41, 59);
    doc.text(f.label, margin + 3, y + 4.2);
    doc.text(`${f.value ?? "N/A"}`, margin + 68, y + 4.2);
    doc.text(`${Math.round((f.weight || 0) * 100)}%`, margin + 84, y + 4.2);
    doc.text(`+${f.contribution?.toFixed(1) || "0.0"}`, margin + 102, y + 4.2);
    doc.text(f.sourceLabel ? f.sourceLabel.slice(0, 36) : "Empirical Dataset", margin + 124, y + 4.2);
    y += 6;
  });

  y += 6;

  // SECTION 4: Feasible Station Snapshot & Financial Model
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.setTextColor(15, 23, 42);
  doc.text(`4. Feasible Station Sizing (${config.name})`, margin, y);
  y += 5;

  doc.setFillColor(241, 245, 249);
  doc.roundedRect(margin, y, pageWidth - margin * 2, 42, 2, 2, "F");

  doc.setFont("helvetica", "bold");
  doc.setFontSize(8);
  doc.setTextColor(71, 85, 105);
  doc.text("TOTAL ESTIMATED CAPEX", margin + 5, y + 6.5);
  doc.text("ANNUAL NET OPERATING CASH FLOW", margin + 70, y + 6.5);
  doc.text("PROJECTED 5-YEAR RETURNS", margin + 136, y + 6.5);

  doc.setFont("helvetica", "bold");
  doc.setFontSize(12);
  doc.setTextColor(15, 23, 42);
  doc.text(`INR ${(config.totalCapex / 100000).toFixed(2)} Lakhs`, margin + 5, y + 14);
  doc.setTextColor(16, 185, 129);
  doc.text(`INR ${(config.annualNetCashFlow / 100000).toFixed(2)} Lakhs/yr`, margin + 70, y + 14);
  doc.setTextColor(15, 23, 42);
  doc.text(`${config.fiveYearRoiPct}% 5Y ROI`, margin + 136, y + 14);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(7.5);
  doc.setTextColor(71, 85, 105);
  doc.text(`• Hardware: ${config.chargerSetup.slice(0, 34)}...`, margin + 5, y + 21);
  doc.text(`• DISCOM Grid Sanction: INR ${(config.gridCapex / 100000).toFixed(1)}L`, margin + 5, y + 26);
  doc.text(`• Solar: ${config.solarKw} kW (${config.annualSolarUnitsGen.toLocaleString()} kWh/yr)`, margin + 5, y + 31);
  doc.text(`• Land: ${config.landSqft} sqft @ INR ${Math.round(location.landPriceSqft).toLocaleString()}/sqft`, margin + 5, y + 36);

  doc.text(`• Est. Energy Sold: ${config.annualEnergySoldKwh.toLocaleString()} kWh/yr`, margin + 70, y + 21);
  doc.text(`• Gross Revenue: INR ${(config.annualGrossRevenue / 100000).toFixed(2)} Lakhs/yr`, margin + 70, y + 26);
  doc.text(`• Solar Energy Savings: INR ${(config.annualSolarSavings / 100000).toFixed(2)}L/yr`, margin + 70, y + 31);
  doc.text(`• Daily Sessions: ~${config.dailySessions} sessions/day`, margin + 70, y + 36);

  doc.text(`• Simple Payback: ${config.simplePaybackYears ?? "N/A"} Years`, margin + 136, y + 21);
  doc.text(`• Selling Price: INR 19.0/kWh`, margin + 136, y + 26);
  doc.text(`• DISCOM Supply Tariff: INR 8.5/kWh`, margin + 136, y + 31);
  doc.text(`• Land Lease Alternative: INR ${(config.monthlyLeaseRate / 1000).toFixed(1)}k/month`, margin + 136, y + 36);

  y += 48;

  // SECTION 5: Due Diligence Checklist
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.setTextColor(15, 23, 42);
  doc.text("5. Pre-Investment Due Diligence & Risks", margin, y);
  y += 5;

  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.setTextColor(71, 85, 105);
  location.risks.forEach((risk) => {
    const riskLines = doc.splitTextToSize(`[!] ${risk}`, pageWidth - margin * 2 - 4);
    doc.text(riskLines, margin + 2, y);
    y += riskLines.length * 4;
  });

  // Footer
  doc.setFillColor(248, 250, 252);
  doc.rect(0, pageHeight - 14, pageWidth, 14, "F");
  doc.setFontSize(7);
  doc.setTextColor(100, 116, 139);
  doc.text(
    "Data Sources: Ministry of Road Transport & Highways (VAHAN), Ministry of Heavy Industries, State Solar Generation Benchmarks, Regional Land Benchmarks.",
    margin,
    pageHeight - 8
  );
  doc.text(
    "CONFIDENTIAL — Generated by Antigravity EV Investment Intelligence Engine.",
    margin,
    pageHeight - 4
  );

  const cleanFileName = `EV_Intelligence_Report_${location.districtOrCity.replace(/[^a-zA-Z0-9]/g, "_")}.pdf`;
  doc.save(cleanFileName);
}
