/**
 * export-engine/pdf-exporter.ts — True Binary PDF Report Generator & PDF Validator.
 *
 * Uses jsPDF and jspdf-autotable to produce valid Adobe Acrobat compliant
 * binary PDF documents (%PDF-1.4...%%EOF).
 */

import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import type { ExportPayload } from "./types";

/**
 * Validates that a byte buffer represents a valid, uncorrupted binary PDF document.
 * Throws an Error if header magic bytes (%PDF-) or EOF marker (%%EOF) are missing.
 */
export function validatePdfBinary(buffer: Uint8Array): boolean {
  if (!buffer || buffer.byteLength < 100) {
    throw new Error("PDF Validation Failed: Output file buffer is empty or truncated.");
  }

  // Check PDF Header magic bytes (%PDF-)
  const headerStr = String.fromCharCode(...buffer.slice(0, 5));
  if (headerStr !== "%PDF-") {
    throw new Error(
      `PDF Validation Failed: Invalid magic header "${headerStr}". Expected "%PDF-".`,
    );
  }

  // Check PDF Trailer (%%EOF) near end of file
  const tailSlice = buffer.slice(-1024);
  const tailStr = String.fromCharCode(...tailSlice);
  if (!tailStr.includes("%%EOF")) {
    throw new Error("PDF Validation Failed: Missing PDF EOF marker (%%EOF).");
  }

  return true;
}

/**
 * Generates a valid binary PDF document as a Uint8Array.
 */
export function generatePdfBinary(payload: ExportPayload): Uint8Array {
  const doc = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "a4",
  });

  const generatedAt = new Date().toLocaleString("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
  });

  // Theme colors
  const primaryColor: [number, number, number] = [79, 70, 229]; // #4f46e5 Indigo
  const textDark: [number, number, number] = [15, 23, 42]; // #0f172a Slate 900
  const textMuted: [number, number, number] = [100, 116, 139]; // #64748b Slate 500
  const bgCard: [number, number, number] = [248, 250, 252]; // #f8fafc
  const borderColor: [number, number, number] = [226, 232, 240]; // #e2e8f0

  const drawHeader = () => {
    // Logo Icon Box
    doc.setFillColor(...primaryColor);
    doc.roundedRect(15, 12, 10, 10, 2, 2, "F");
    doc.setTextColor(255, 255, 255);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    doc.text("SG", 20, 18.5, { align: "center" });

    // Brand Name
    doc.setTextColor(...textDark);
    doc.setFontSize(15);
    doc.setFont("helvetica", "bold");
    doc.text("ScopeGuard AI", 28, 19);

    // Meta Right Header
    doc.setTextColor(...textMuted);
    doc.setFontSize(8.5);
    doc.setFont("helvetica", "normal");
    doc.text("ScopeGuard Production Reports", 195, 16, { align: "right" });
    doc.text(`Generated: ${generatedAt}`, 195, 20.5, { align: "right" });

    // Divider Line
    doc.setDrawColor(...primaryColor);
    doc.setLineWidth(0.5);
    doc.line(15, 25, 195, 25);
  };

  drawHeader();
  let y = 33;

  const drawKpiCards = (cards: Array<{ label: string; value: string }>) => {
    const cardWidth = 41;
    const cardHeight = 16;
    const gap = 4;

    cards.forEach((card, idx) => {
      const x = 15 + idx * (cardWidth + gap);
      doc.setFillColor(...bgCard);
      doc.setDrawColor(...borderColor);
      doc.setLineWidth(0.3);
      doc.roundedRect(x, y, cardWidth, cardHeight, 2, 2, "FD");

      doc.setFontSize(7.5);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(...textMuted);
      doc.text(card.label.toUpperCase(), x + 3, y + 5);

      doc.setFontSize(11);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(...textDark);
      doc.text(card.value, x + 3, y + 12);
    });

    y += cardHeight + 8;
  };

  switch (payload.type) {
    case "dashboard": {
      const d = payload.data;

      // Title & Subtitle
      doc.setFontSize(16);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(...textDark);
      doc.text("Workspace Dashboard Report", 15, y);
      y += 5;

      doc.setFontSize(9.5);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(...textMuted);
      doc.text(`Executive summary for ${d.meta.workspaceName}`, 15, y);
      y += 8;

      // KPI Cards
      drawKpiCards([
        { label: "Active Projects", value: String(d.stats.totalProjects) },
        { label: "Total Analyses", value: String(d.stats.totalAnalyses) },
        { label: "Revenue Protected", value: `$${d.stats.revenueProtected.toLocaleString()}` },
        { label: "Hours Saved", value: `${d.stats.hoursSaved} hrs` },
      ]);

      // Table 1: High Risk Projects
      doc.setFontSize(12);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(...textDark);
      doc.text("High Risk Projects", 15, y);
      y += 4;

      autoTable(doc, {
        startY: y,
        head: [["Project Name", "Client", "Budget", "Hours (Used/Alloc)", "Risk", "Status"]],
        body: d.highRiskProjects.map((p) => [
          p.name,
          p.client,
          `$${p.budget.toLocaleString()}`,
          `${p.hoursUsed} / ${p.hoursAllocated} hrs`,
          p.risk.toUpperCase(),
          p.status.toUpperCase(),
        ]),
        theme: "striped",
        headStyles: { fillColor: primaryColor, textColor: [255, 255, 255], fontStyle: "bold" },
        styles: { fontSize: 8.5, cellPadding: 2.5 },
        margin: { left: 15, right: 15 },
      });

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      y = (doc as any).lastAutoTable.finalY + 8;

      // Table 2: Recent Scope Changes
      doc.setFontSize(12);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(...textDark);
      doc.text("Recent Scope Changes", 15, y);
      y += 4;

      autoTable(doc, {
        startY: y,
        head: [["Project", "Original Requirement", "Changed Requirement", "Verdict", "Est. Cost"]],
        body: d.recentScopeChanges.map((c) => [
          c.projectName,
          c.originalRequirement,
          c.changedRequirement,
          c.verdict.replace(/_/g, " ").toUpperCase(),
          `$${c.suggestedCost.toLocaleString()}`,
        ]),
        theme: "striped",
        headStyles: { fillColor: [71, 85, 105], textColor: [255, 255, 255], fontStyle: "bold" },
        styles: { fontSize: 8.5, cellPadding: 2.5 },
        margin: { left: 15, right: 15 },
      });
      break;
    }

    case "project": {
      const p = payload.data;

      doc.setFontSize(16);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(...textDark);
      doc.text(`Project Scope Report: ${p.name}`, 15, y);
      y += 5;

      doc.setFontSize(9.5);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(...textMuted);
      doc.text(`Client: ${p.client} | Status: ${p.status.toUpperCase()}`, 15, y);
      y += 8;

      drawKpiCards([
        { label: "Project Budget", value: `$${p.budget.toLocaleString()}` },
        { label: "Hourly Rate", value: `$${p.hourlyRate}/hr` },
        { label: "Hours Used", value: `${p.hoursUsed} / ${p.hoursAllocated} hrs` },
        { label: "Risk Rating", value: p.risk.toUpperCase() },
      ]);

      doc.setFontSize(12);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(...textDark);
      doc.text(`Scope Analyses History (${p.analyses.length})`, 15, y);
      y += 4;

      autoTable(doc, {
        startY: y,
        head: [["Analysis ID", "AI Summary", "Verdict", "Est. Hours", "Est. Cost", "Date"]],
        body: p.analyses.map((a) => [
          a.id.slice(-8),
          a.aiSummary,
          a.verdict.replace(/_/g, " ").toUpperCase(),
          `+${a.additionalHours} hrs`,
          `$${a.suggestedCost.toLocaleString()}`,
          a.createdAt,
        ]),
        theme: "striped",
        headStyles: { fillColor: primaryColor, textColor: [255, 255, 255], fontStyle: "bold" },
        styles: { fontSize: 8.5, cellPadding: 2.5 },
        margin: { left: 15, right: 15 },
      });
      break;
    }

    case "analysis": {
      const a = payload.data;

      doc.setFontSize(16);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(...textDark);
      doc.text("Scope Analysis Report", 15, y);
      y += 5;

      doc.setFontSize(9.5);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(...textMuted);
      doc.text(`Analysis ID: ${a.id} | Project: ${a.projectName} (${a.clientName})`, 15, y);
      y += 8;

      drawKpiCards([
        { label: "Verdict", value: a.verdict.replace(/_/g, " ").toUpperCase() },
        { label: "AI Confidence", value: `${a.confidence}%` },
        { label: "Est. Additional Hours", value: `+${a.additionalHours} hrs` },
        { label: "Est. Suggested Cost", value: `$${a.suggestedCost.toLocaleString()}` },
      ]);

      // Summary Box
      doc.setFillColor(...bgCard);
      doc.setDrawColor(...borderColor);
      doc.roundedRect(15, y, 180, 22, 2, 2, "FD");

      doc.setFontSize(9);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(...textDark);
      doc.text("AI Summary & Assessment:", 18, y + 6);

      doc.setFont("helvetica", "normal");
      doc.setFontSize(8.5);
      doc.setTextColor(...textMuted);
      const splitSummary = doc.splitTextToSize(a.executiveSummary || a.aiSummary, 174);
      doc.text(splitSummary, 18, y + 12);
      y += 28;

      // Table: Requirement Comparison
      doc.setFontSize(12);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(...textDark);
      doc.text("Requirement Comparison", 15, y);
      y += 4;

      autoTable(doc, {
        startY: y,
        head: [["Original Scope Requirement", "Changed / New Request"]],
        body: [[a.originalRequirement || "N/A", a.changedRequirement || "N/A"]],
        theme: "plain",
        headStyles: { fillColor: [241, 245, 249], textColor: [51, 65, 85], fontStyle: "bold" },
        styles: { fontSize: 8.5, cellPadding: 3, overflow: "linebreak" },
        columnStyles: { 0: { cellWidth: 90 }, 1: { cellWidth: 90 } },
        margin: { left: 15, right: 15 },
      });
      break;
    }

    case "projects_bulk": {
      const projects = payload.data;

      doc.setFontSize(16);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(...textDark);
      doc.text("Projects Master Export", 15, y);
      y += 8;

      autoTable(doc, {
        startY: y,
        head: [["Project Name", "Client", "Status", "Risk", "Budget", "Hours Used / Alloc"]],
        body: projects.map((p) => [
          p.name,
          p.client,
          p.status.toUpperCase(),
          p.risk.toUpperCase(),
          `$${p.budget.toLocaleString()}`,
          `${p.hoursUsed} / ${p.hoursAllocated} hrs`,
        ]),
        theme: "striped",
        headStyles: { fillColor: primaryColor, textColor: [255, 255, 255], fontStyle: "bold" },
        styles: { fontSize: 8.5, cellPadding: 2.5 },
        margin: { left: 15, right: 15 },
      });
      break;
    }

    case "analyses_bulk": {
      const items = payload.data;

      doc.setFontSize(16);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(...textDark);
      doc.text("Scope Analyses Master Export", 15, y);
      y += 8;

      autoTable(doc, {
        startY: y,
        head: [["Project", "Client", "Verdict", "Confidence", "Est. Hours", "Est. Cost"]],
        body: items.map((a) => [
          a.projectName,
          a.clientName,
          a.verdict.replace(/_/g, " ").toUpperCase(),
          `${a.confidence}%`,
          `+${a.additionalHours} hrs`,
          `$${a.suggestedCost.toLocaleString()}`,
        ]),
        theme: "striped",
        headStyles: { fillColor: primaryColor, textColor: [255, 255, 255], fontStyle: "bold" },
        styles: { fontSize: 8.5, cellPadding: 2.5 },
        margin: { left: 15, right: 15 },
      });
      break;
    }

    case "analytics": {
      const d = payload.data;

      doc.setFontSize(16);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(...textDark);
      doc.text("ScopeGuard Analytics Report", 15, y);
      y += 8;

      drawKpiCards([
        { label: "Revenue Protected", value: `$${d.kpis.totalRevenueProtected.toLocaleString()}` },
        { label: "Hours Saved", value: `${d.kpis.totalHoursSaved} hrs` },
        { label: "Avg Confidence", value: `${d.kpis.avgConfidenceScore}%` },
        { label: "Creep Ratio", value: `${d.kpis.scopeCreepRatio}%` },
      ]);

      doc.setFontSize(12);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(...textDark);
      doc.text("Monthly Activity", 15, y);
      y += 4;

      autoTable(doc, {
        startY: y,
        head: [["Month", "Total Analyses", "Scope Creep Count", "Revenue Protected"]],
        body: d.monthlyActivity.map((m) => [
          m.month,
          String(m.totalAnalyses),
          String(m.scopeCreepCount),
          `$${m.revenueProtected.toLocaleString()}`,
        ]),
        theme: "striped",
        headStyles: { fillColor: primaryColor, textColor: [255, 255, 255], fontStyle: "bold" },
        styles: { fontSize: 8.5, cellPadding: 2.5 },
        margin: { left: 15, right: 15 },
      });
      break;
    }

    case "workspace": {
      const ws = payload.data;
      return generatePdfBinary({ type: "dashboard", data: ws.dashboard });
    }
  }

  // Add Page Footer & Numbers
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const totalPages = (doc as any).internal.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    doc.setDrawColor(...borderColor);
    doc.setLineWidth(0.3);
    doc.line(15, 282, 195, 282);

    doc.setFontSize(8);
    doc.setTextColor(...textMuted);
    doc.setFont("helvetica", "normal");
    doc.text("Confidential — Internal Use Only | ScopeGuard AI Risk Management Engine", 15, 287);
    doc.text(`Page ${i} of ${totalPages}`, 195, 287, { align: "right" });
  }

  // Get raw binary ArrayBuffer output
  const arrayBuffer = doc.output("arraybuffer");
  const pdfBytes = new Uint8Array(arrayBuffer);

  // Validate PDF magic header and trailer
  validatePdfBinary(pdfBytes);

  return pdfBytes;
}

/**
 * Legacy HTML printable fallback export function.
 */
export function generatePdfHtml(payload: ExportPayload): string {
  const generatedAt = new Date().toLocaleString("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
  });

  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8" />
        <title>ScopeGuard Report</title>
        <style>
          body { font-family: sans-serif; padding: 20px; color: #1e293b; }
          h1 { color: #4f46e5; }
        </style>
      </head>
      <body>
        <h1>ScopeGuard Report</h1>
        <p>Generated: ${generatedAt}</p>
        <pre>${JSON.stringify(payload.data, null, 2)}</pre>
      </body>
    </html>
  `;
}
